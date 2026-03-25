import { useEffect, useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import {
  ArrowLeft, BookOpen, Clock, Star, Lock, CheckCircle,
  PlayCircle, ChevronRight, Zap
} from 'lucide-react';
import type { BislamaTopic, BislamaLesson, LessonWithProgress } from '@/types/bislama';

const BislamaTopic = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [topic, setTopic] = useState<BislamaTopic | null>(null);
  const [lessons, setLessons] = useState<LessonWithProgress[]>([]);

  useEffect(() => {
    if (id) {
      loadTopicData();
    }
  }, [id, user]);

  const loadTopicData = async () => {
    try {
      // Load topic
      const { data: topicData, error: topicError } = await supabase
        .from('bislama_topics')
        .select('*')
        .eq('id', id)
        .single();

      if (topicError) throw topicError;
      setTopic({
        ...topicData,
        difficulty: topicData.difficulty as 'beginner' | 'intermediate' | 'advanced',
      } as BislamaTopic);

      // Load lessons
      const { data: lessonsData, error: lessonsError } = await supabase
        .from('bislama_lessons')
        .select('*')
        .eq('topic_id', id)
        .order('order_index');

      if (lessonsError) throw lessonsError;

      // Load user progress for lessons
      let progressMap: Record<string, any> = {};
      if (user) {
        const lessonIds = lessonsData?.map(l => l.id) || [];
        const { data: progressData } = await supabase
          .from('user_lesson_progress')
          .select('*')
          .eq('user_id', user.id)
          .in('lesson_id', lessonIds);

        progressData?.forEach(p => {
          progressMap[p.lesson_id] = p;
        });
      }

      // Map lessons with progress
      const lessonsWithProgress: LessonWithProgress[] = (lessonsData || []).map((lesson, index) => {
        const progress = progressMap[lesson.id];
        let status: 'locked' | 'available' | 'in_progress' | 'completed' = 'available';

        if (progress) {
          status = progress.status as 'locked' | 'available' | 'in_progress' | 'completed';
        } else if (index > 0 && !progressMap[lessonsData![index - 1].id]?.status?.includes('completed')) {
          // Lock if previous lesson not completed (except first lesson)
          status = index === 0 ? 'available' : 'locked';
        }

        // First lesson is always available
        if (index === 0) status = (progress?.status as 'locked' | 'available' | 'in_progress' | 'completed') || 'available';

        return {
          ...lesson,
          userProgress: progress,
          status,
        };
      });

      setLessons(lessonsWithProgress);
    } catch (error) {
      console.error('Error loading topic:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStartLesson = async (lesson: LessonWithProgress) => {
    if (lesson.status === 'locked') return;

    // Initialize lesson progress if needed
    if (user && !lesson.userProgress) {
      await supabase
        .from('user_lesson_progress')
        .upsert({
          user_id: user.id,
          lesson_id: lesson.id,
          status: 'in_progress',
          score: 0,
          attempts: 0,
        });
    }

    navigate(`/bislama/lesson/${lesson.id}`);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'in_progress':
        return <PlayCircle className="h-5 w-5 text-yellow-500" />;
      case 'locked':
        return <Lock className="h-5 w-5 text-muted-foreground" />;
      default:
        return <PlayCircle className="h-5 w-5 text-primary" />;
    }
  };

  const completedCount = lessons.filter(l => l.status === 'completed').length;
  const progressPercent = lessons.length > 0 ? (completedCount / lessons.length) * 100 : 0;

  if (loading) {
    return (
      <Layout>
        <div className="container py-12 flex justify-center">
          <div className="animate-pulse text-center">
            <BookOpen className="h-12 w-12 mx-auto mb-4 text-primary" />
            <p>Loading topic...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (!topic) {
    return (
      <Layout>
        <div className="container py-12 text-center">
          <p>Topic not found</p>
          <Button onClick={() => navigate('/bislama')} className="mt-4">
            Back to Learn Bislama
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container py-6 space-y-6 max-w-4xl">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/bislama')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">{topic.name}</h1>
            <p className="text-muted-foreground">{topic.name_bislama}</p>
          </div>
        </div>

        {/* Topic Progress Card */}
        <Card className="p-6" style={{ borderColor: `${topic.color}40`, borderWidth: 2 }}>
          <div className="flex items-start gap-4">
            <div
              className="p-4 rounded-xl"
              style={{ backgroundColor: `${topic.color}20` }}
            >
              <BookOpen className="h-8 w-8" style={{ color: topic.color }} />
            </div>
            <div className="flex-1">
              <p className="text-sm text-muted-foreground mb-2">{topic.description}</p>
              <div className="flex items-center gap-4 text-sm">
                <span className="flex items-center gap-1">
                  <BookOpen className="h-4 w-4" />
                  {lessons.length} lessons
                </span>
                <span className="flex items-center gap-1">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  {completedCount} completed
                </span>
              </div>
              <div className="mt-3">
                <div className="flex justify-between text-xs mb-1">
                  <span>Progress</span>
                  <span>{Math.round(progressPercent)}%</span>
                </div>
                <Progress value={progressPercent} className="h-2" />
              </div>
            </div>
          </div>
        </Card>

        {/* Lessons List */}
        <div className="space-y-3">
          <h2 className="font-semibold text-lg">Lessons</h2>

          {lessons.map((lesson, index) => (
            <Card
              key={lesson.id}
              className={`p-4 cursor-pointer transition-all ${
                lesson.status === 'locked'
                  ? 'opacity-60 cursor-not-allowed'
                  : 'hover:shadow-md hover:border-primary/30'
              } ${lesson.status === 'completed' ? 'bg-green-50/50' : ''}`}
              onClick={() => handleStartLesson(lesson)}
            >
              <div className="flex items-center gap-4">
                {/* Lesson Number */}
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                    lesson.status === 'completed'
                      ? 'bg-green-500 text-white'
                      : lesson.status === 'locked'
                      ? 'bg-muted text-muted-foreground'
                      : 'bg-primary text-white'
                  }`}
                >
                  {index + 1}
                </div>

                {/* Lesson Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold truncate">{lesson.title}</h3>
                    {lesson.status === 'completed' && lesson.userProgress?.best_score === 100 && (
                      <Badge variant="secondary" className="bg-yellow-100 text-yellow-700">
                        <Star className="h-3 w-3 mr-1 fill-current" />
                        Perfect
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground truncate">{lesson.title_bislama}</p>
                  <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {lesson.estimated_minutes} min
                    </span>
                    <span className="flex items-center gap-1">
                      <Zap className="h-3 w-3 text-yellow-500" />
                      +{lesson.xp_reward} XP
                    </span>
                    {lesson.userProgress?.best_score !== undefined && (
                      <span className="flex items-center gap-1">
                        <Star className="h-3 w-3" />
                        Best: {lesson.userProgress.best_score}%
                      </span>
                    )}
                  </div>
                </div>

                {/* Status & Action */}
                <div className="flex items-center gap-2">
                  {getStatusIcon(lesson.status)}
                  {lesson.status !== 'locked' && (
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Encouragement */}
        {completedCount === lessons.length && lessons.length > 0 && (
          <Card className="p-6 text-center bg-gradient-to-r from-green-500/10 to-blue-500/10">
            <div className="text-4xl mb-3">🎉</div>
            <h3 className="text-xl font-bold mb-2">Topic Completed!</h3>
            <p className="text-muted-foreground mb-4">
              You've mastered all lessons in {topic.name}. Keep going!
            </p>
            <Button onClick={() => navigate('/bislama')}>
              Continue Learning
            </Button>
          </Card>
        )}
      </div>
    </Layout>
  );
};

export default BislamaTopic;
