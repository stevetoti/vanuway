// Bislama Learning Types

export type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced';
export type QuestionType = 'multiple_choice' | 'fill_blank' | 'matching' | 'listening' | 'translation';
export type LessonStatus = 'locked' | 'available' | 'in_progress' | 'completed';

export interface BislamaTopic {
  id: string;
  name: string;
  name_bislama: string;
  description: string;
  icon: string;
  order_index: number;
  difficulty: DifficultyLevel;
  total_lessons: number;
  color: string;
  created_at: string;
}

export interface BislamaLesson {
  id: string;
  topic_id: string;
  title: string;
  title_bislama: string;
  description: string;
  order_index: number;
  xp_reward: number;
  estimated_minutes: number;
  created_at: string;
  // Joined data
  topic?: BislamaTopic;
}

export interface BislamaWord {
  id: string;
  lesson_id: string;
  english: string;
  bislama: string;
  pronunciation?: string;
  audio_url?: string;
  example_english?: string;
  example_bislama?: string;
  image_url?: string;
  created_at: string;
}

export interface BislamaQuestion {
  id: string;
  lesson_id: string;
  question_type: QuestionType;
  question_text: string;
  question_bislama?: string;
  correct_answer: string;
  options: string[]; // JSON array for multiple choice
  hint?: string;
  explanation?: string;
  xp_value: number;
  order_index: number;
  created_at: string;
}

export interface UserBislamaProgress {
  id: string;
  user_id: string;
  total_xp: number;
  current_streak: number;
  longest_streak: number;
  last_practice_date: string;
  lessons_completed: number;
  current_level: DifficultyLevel;
  created_at: string;
  updated_at: string;
}

export interface UserLessonProgress {
  id: string;
  user_id: string;
  lesson_id: string;
  status: LessonStatus;
  score: number;
  best_score: number;
  attempts: number;
  completed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface UserAchievement {
  id: string;
  user_id: string;
  achievement_id: string;
  earned_at: string;
  // Joined
  achievement?: Achievement;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  xp_reward: number;
  requirement_type: string;
  requirement_value: number;
  created_at: string;
}

// Quiz state types
export interface QuizState {
  currentQuestionIndex: number;
  answers: Record<string, string>;
  score: number;
  xpEarned: number;
  isComplete: boolean;
  startTime: Date;
  endTime?: Date;
}

export interface LessonWithProgress extends BislamaLesson {
  userProgress?: UserLessonProgress;
  status: LessonStatus;
}

export interface TopicWithProgress extends BislamaTopic {
  completedLessons: number;
  isUnlocked: boolean;
}
