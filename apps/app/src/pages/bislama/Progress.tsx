import { useEffect, useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import {
  ArrowLeft, Trophy, Flame, Star, Zap, Target,
  Award, CheckCircle, Lock, Calendar, TrendingUp
} from 'lucide-react';
import type { UserBislamaProgress, Achievement, UserAchievement } from '@/types/bislama';

const achievementIcons: Record<string, unknown> = {
  'footprints': Target,
  'rocket': Zap,
  'graduation-cap': Award,
  'compass': TrendingUp,
  'flame': Flame,
  'zap': Zap,
  'crown': Trophy,
  'star': Star,
  'trophy': Trophy,
  'medal': Award,
  'check-circle': CheckCircle,
  'award': Award,
};

const BislamaProgress = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [userProgress, setUserProgress] = useState<UserBislamaProgress | null>(null);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [earnedAchievements, setEarnedAchievements] = useState<string[]>([]);
  const [weeklyXP, setWeeklyXP] = useState<number[]>([0, 0, 0, 0, 0, 0, 0]);

  useEffect(() => {
    if (user) {
      loadProgressData();
    } else {
      setLoading(false);
    }
  }, [user]);

  const loadProgressData = async () => {
    try {
      // Load user progress
      const { data: progressData } = await supabase
        .from('user_bislama_progress')
        .select('*')
        .eq('user_id', user!.id)
        .single();

      setUserProgress(progressData as UserBislamaProgress | null);

      // Load all achievements
      const { data: achievementsData } = await supabase
        .from('bislama_achievements')
        .select('*')
        .order('requirement_value');

      setAchievements(achievementsData || []);

      // Load earned achievements
      const { data: earnedData } = await supabase
        .from('user_bislama_achievements')
        .select('achievement_id')
        .eq('user_id', user!.id);

      setEarnedAchievements(earnedData?.map(e => e.achievement_id) || []);

      // Mock weekly XP data (would need a separate table for real tracking)
      setWeeklyXP([15, 25, 0, 30, 20, 45, progressData?.total_xp ? 35 : 0]);
    } catch (error) {
      console.error('Error loading progress:', error);
    } finally {
      setLoading(false);
    }
  };

  const getLevelInfo = (xp: number) => {
    if (xp >= 1000) return { level: 'Master', nextLevel: null, progress: 100 };
    if (xp >= 500) return { level: 'Advanced', nextLevel: 'Master', progress: ((xp - 500) / 500) * 100 };
    if (xp >= 200) return { level: 'Intermediate', nextLevel: 'Advanced', progress: ((xp - 200) / 300) * 100 };
    if (xp >= 50) return { level: 'Beginner', nextLevel: 'Intermediate', progress: ((xp - 50) / 150) * 100 };
    return { level: 'Novice', nextLevel: 'Beginner', progress: (xp / 50) * 100 };
  };

  const levelInfo = getLevelInfo(userProgress?.total_xp || 0);
  const maxWeeklyXP = Math.max(...weeklyXP, 50);
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  if (loading) {
    return (
      <Layout>
        <div className="container py-12 flex justify-center">
          <div className="animate-pulse">Loading progress...</div>
        </div>
      </Layout>
    );
  }

  if (!user) {
    return (
      <Layout>
        <div className="container py-12 text-center">
          <Trophy className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-xl font-bold mb-2">Sign in to track progress</h2>
          <p className="text-muted-foreground mb-4">
            Create an account to save your achievements and learning progress.
          </p>
          <Button onClick={() => navigate('/login')}>Sign In</Button>
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
          <h1 className="text-2xl font-bold">Your Progress</h1>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="p-4 text-center">
            <Zap className="h-8 w-8 mx-auto mb-2 text-yellow-500" />
            <div className="text-2xl font-bold">{userProgress?.total_xp || 0}</div>
            <p className="text-xs text-muted-foreground">Total XP</p>
          </Card>
          <Card className="p-4 text-center">
            <Flame className="h-8 w-8 mx-auto mb-2 text-orange-500" />
            <div className="text-2xl font-bold">{userProgress?.current_streak || 0}</div>
            <p className="text-xs text-muted-foreground">Day Streak</p>
          </Card>
          <Card className="p-4 text-center">
            <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-500" />
            <div className="text-2xl font-bold">{userProgress?.lessons_completed || 0}</div>
            <p className="text-xs text-muted-foreground">Lessons Done</p>
          </Card>
          <Card className="p-4 text-center">
            <Trophy className="h-8 w-8 mx-auto mb-2 text-purple-500" />
            <div className="text-2xl font-bold">{earnedAchievements.length}</div>
            <p className="text-xs text-muted-foreground">Achievements</p>
          </Card>
        </div>

        {/* Level Progress */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold">Your Level</h3>
              <p className="text-sm text-muted-foreground">Keep learning to level up!</p>
            </div>
            <Badge variant="secondary" className="text-lg px-4 py-1">
              {levelInfo.level}
            </Badge>
          </div>
          {levelInfo.nextLevel && (
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>{levelInfo.level}</span>
                <span>{levelInfo.nextLevel}</span>
              </div>
              <Progress value={levelInfo.progress} className="h-3" />
              <p className="text-xs text-muted-foreground mt-2 text-center">
                {Math.round(levelInfo.progress)}% to {levelInfo.nextLevel}
              </p>
            </div>
          )}
        </Card>

        {/* Weekly Activity */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">This Week</h3>
          </div>
          <div className="flex items-end justify-between gap-2 h-32">
            {weeklyXP.map((xp, index) => (
              <div key={index} className="flex-1 flex flex-col items-center gap-1">
                <div
                  className="w-full bg-primary/20 rounded-t transition-all"
                  style={{
                    height: `${Math.max((xp / maxWeeklyXP) * 100, 5)}%`,
                    backgroundColor: xp > 0 ? undefined : '#e5e7eb',
                  }}
                >
                  <div
                    className="w-full bg-primary rounded-t"
                    style={{ height: xp > 0 ? '100%' : '0%' }}
                  />
                </div>
                <span className="text-xs text-muted-foreground">{days[index]}</span>
              </div>
            ))}
          </div>
          <p className="text-sm text-muted-foreground text-center mt-4">
            Total this week: <strong>{weeklyXP.reduce((a, b) => a + b, 0)} XP</strong>
          </p>
        </Card>

        {/* Achievements */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Award className="h-5 w-5" />
            Achievements
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {achievements.map((achievement) => {
              const isEarned = earnedAchievements.includes(achievement.id);
              const IconComponent = achievementIcons[achievement.icon] || Trophy;

              return (
                <Card
                  key={achievement.id}
                  className={`p-4 ${isEarned ? 'bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200' : 'opacity-60'}`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-full ${isEarned ? 'bg-yellow-100' : 'bg-muted'}`}>
                      {isEarned ? (
                        <IconComponent className="h-6 w-6 text-yellow-600" />
                      ) : (
                        <Lock className="h-6 w-6 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold">{achievement.name}</h4>
                        {isEarned && (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{achievement.description}</p>
                      <div className="flex items-center gap-1 mt-1">
                        <Zap className="h-3 w-3 text-yellow-500" />
                        <span className="text-xs font-medium">+{achievement.xp_reward} XP</span>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Streak Info */}
        <Card className="p-6 bg-gradient-to-r from-orange-50 to-red-50 border-orange-200">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-orange-100 rounded-full">
              <Flame className="h-8 w-8 text-orange-500" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">
                {userProgress?.current_streak || 0} Day Streak!
              </h3>
              <p className="text-sm text-muted-foreground">
                {userProgress?.current_streak
                  ? `Keep it up! Your longest streak: ${userProgress.longest_streak} days`
                  : 'Complete a lesson today to start your streak!'}
              </p>
            </div>
          </div>
        </Card>
      </div>
    </Layout>
  );
};

export default BislamaProgress;
