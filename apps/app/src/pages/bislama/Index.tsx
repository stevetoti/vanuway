import { useEffect, useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  BookOpen, Flame, Trophy, Star, Lock, CheckCircle,
  ChevronRight, Zap, Target, Award, Sparkles
} from 'lucide-react';
import type { BislamaTopic, UserBislamaProgress, TopicWithProgress } from '@/types/bislama';

const topicIcons: Record<string, any> = {
  'sparkles': Sparkles,
  'hand-wave': BookOpen,
  'calculator': Target,
  'utensils': BookOpen,
  'users': BookOpen,
  'plane': BookOpen,
  'shopping-bag': BookOpen,
  'cloud-sun': BookOpen,
  'clock': BookOpen,
  'landmark': BookOpen,
  'message-circle': BookOpen,
  'briefcase': BookOpen,
  'book': BookOpen,
};

const BislamaHome = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [topics, setTopics] = useState<TopicWithProgress[]>([]);
  const [userProgress, setUserProgress] = useState<UserBislamaProgress | null>(null);

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    try {
      // Load topics
      const { data: topicsData, error: topicsError } = await supabase
        .from('bislama_topics')
        .select('*')
        .order('order_index');

      if (topicsError) throw topicsError;

      // Load user progress if logged in
      let progress: UserBislamaProgress | null = null;
      let completedLessonsByTopic: Record<string, number> = {};

      if (user) {
        const { data: progressData } = await supabase
          .from('user_bislama_progress')
          .select('*')
          .eq('user_id', user.id)
          .single();

        progress = progressData as UserBislamaProgress | null;

        // Get completed lessons count per topic
        const { data: lessonProgress } = await supabase
          .from('user_lesson_progress')
          .select('lesson_id, status, bislama_lessons(topic_id)')
          .eq('user_id', user.id)
          .eq('status', 'completed');

        if (lessonProgress) {
          lessonProgress.forEach((lp: any) => {
            const topicId = lp.bislama_lessons?.topic_id;
            if (topicId) {
              completedLessonsByTopic[topicId] = (completedLessonsByTopic[topicId] || 0) + 1;
            }
          });
        }
      }

      // Map topics with progress
      const topicsWithProgress: TopicWithProgress[] = (topicsData || []).map((topic, index) => ({
        ...topic,
        difficulty: topic.difficulty as 'beginner' | 'intermediate' | 'advanced',
        completedLessons: completedLessonsByTopic[topic.id] || 0,
        isUnlocked: index === 0 || (progress?.lessons_completed || 0) >= index * 3,
      }));

      setTopics(topicsWithProgress);
      setUserProgress(progress);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const initializeProgress = async () => {
    if (!user) {
      toast.error('Please log in to start learning');
      navigate('/login');
      return;
    }

    try {
      const { error } = await supabase
        .from('user_bislama_progress')
        .insert({
          user_id: user.id,
          total_xp: 0,
          current_streak: 0,
          longest_streak: 0,
          lessons_completed: 0,
          current_level: 'beginner',
        });

      if (error && !error.message.includes('duplicate')) throw error;

      // Navigate to first topic
      if (topics.length > 0) {
        navigate(`/bislama/topic/${topics[0].id}`);
      }
    } catch (error) {
      console.error('Error initializing progress:', error);
      toast.error('Failed to start learning');
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-500';
      case 'intermediate': return 'bg-yellow-500';
      case 'advanced': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="container py-12 flex justify-center">
          <div className="animate-pulse text-center">
            <BookOpen className="h-12 w-12 mx-auto mb-4 text-primary" />
            <p>Loading lessons...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container py-6 space-y-6 max-w-4xl">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="flex justify-center mb-4">
            <div className="p-4 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-full">
              <BookOpen className="h-12 w-12 text-primary" />
            </div>
          </div>
          <h1 className="text-3xl font-bold">Learn Bislama</h1>
          <p className="text-muted-foreground">
            Master the language of Vanuatu through fun, interactive lessons
          </p>
        </div>

        {/* User Stats */}
        {userProgress ? (
          <Card className="p-6 bg-gradient-to-r from-primary/5 to-secondary/5">
            <div className="grid grid-cols-4 gap-4 text-center">
              <div>
                <div className="flex items-center justify-center gap-1 text-2xl font-bold text-primary">
                  <Zap className="h-5 w-5" />
                  {userProgress.total_xp}
                </div>
                <p className="text-xs text-muted-foreground">Total XP</p>
              </div>
              <div>
                <div className="flex items-center justify-center gap-1 text-2xl font-bold text-orange-500">
                  <Flame className="h-5 w-5" />
                  {userProgress.current_streak}
                </div>
                <p className="text-xs text-muted-foreground">Day Streak</p>
              </div>
              <div>
                <div className="flex items-center justify-center gap-1 text-2xl font-bold text-green-500">
                  <CheckCircle className="h-5 w-5" />
                  {userProgress.lessons_completed}
                </div>
                <p className="text-xs text-muted-foreground">Lessons</p>
              </div>
              <div>
                <div className="flex items-center justify-center gap-1 text-2xl font-bold text-purple-500">
                  <Trophy className="h-5 w-5" />
                  {userProgress.current_level}
                </div>
                <p className="text-xs text-muted-foreground">Level</p>
              </div>
            </div>
          </Card>
        ) : (
          <Card className="p-6 text-center bg-gradient-to-r from-green-500/10 to-blue-500/10 border-2 border-dashed">
            <Sparkles className="h-10 w-10 mx-auto mb-3 text-primary" />
            <h3 className="font-semibold text-lg mb-2">Start Your Journey!</h3>
            <p className="text-muted-foreground mb-4">
              Learn Bislama with fun lessons and quizzes. Track your progress and earn achievements!
            </p>
            <Button onClick={initializeProgress} size="lg">
              <BookOpen className="mr-2 h-5 w-5" />
              Start Learning
            </Button>
          </Card>
        )}

        {/* Daily Goal */}
        {userProgress && (
          <Card className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Target className="h-5 w-5 text-primary" />
                <span className="font-medium">Daily Goal</span>
              </div>
              <span className="text-sm text-muted-foreground">1/3 lessons</span>
            </div>
            <Progress value={33} className="h-2" />
          </Card>
        )}

        {/* Topics Grid */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Learning Path</h2>

          <div className="space-y-3">
            {topics.map((topic) => {
              const IconComponent = topicIcons[topic.icon] || BookOpen;
              const progressPercent = topic.total_lessons > 0
                ? (topic.completedLessons / topic.total_lessons) * 100
                : 0;

              return (
                <Card
                  key={topic.id}
                  className={`p-4 cursor-pointer transition-all hover:shadow-lg ${
                    !topic.isUnlocked ? 'opacity-60' : ''
                  }`}
                  onClick={() => topic.isUnlocked && navigate(`/bislama/topic/${topic.id}`)}
                >
                  <div className="flex items-center gap-4">
                    <div
                      className="p-3 rounded-xl"
                      style={{ backgroundColor: `${topic.color}20` }}
                    >
                      {topic.isUnlocked ? (
                        <IconComponent className="h-6 w-6" style={{ color: topic.color }} />
                      ) : (
                        <Lock className="h-6 w-6 text-muted-foreground" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold truncate">{topic.name}</h3>
                        <Badge className={`${getDifficultyColor(topic.difficulty)} text-white text-xs`}>
                          {topic.difficulty}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground truncate">
                        {topic.name_bislama} • {topic.total_lessons} lessons
                      </p>
                      {topic.isUnlocked && topic.completedLessons > 0 && (
                        <Progress value={progressPercent} className="h-1.5 mt-2" />
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {topic.completedLessons === topic.total_lessons && topic.total_lessons > 0 && (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      )}
                      <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-4">
          <Card
            className="p-4 cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => navigate('/bislama/progress')}
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Award className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="font-medium">Achievements</p>
                <p className="text-xs text-muted-foreground">View your badges</p>
              </div>
            </div>
          </Card>

          <Card
            className="p-4 cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => navigate('/bislama/practice')}
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Zap className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="font-medium">Quick Practice</p>
                <p className="text-xs text-muted-foreground">Review words</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Tip Card */}
        <Card className="p-4 bg-blue-50 border-blue-200">
          <div className="flex gap-3">
            <div className="text-2xl">💡</div>
            <div>
              <p className="font-medium text-blue-900">Tip of the Day</p>
              <p className="text-sm text-blue-700">
                In Bislama, "i" is a helper word used before verbs. For example: "Hem <strong>i</strong> go" (He goes).
              </p>
            </div>
          </div>
        </Card>
      </div>
    </Layout>
  );
};

export default BislamaHome;
