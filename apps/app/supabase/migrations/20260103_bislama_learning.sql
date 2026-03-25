-- Bislama Learning Platform Database Schema
-- Run this in Supabase SQL Editor

-- Topics (Categories of lessons)
CREATE TABLE IF NOT EXISTS bislama_topics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  name_bislama TEXT NOT NULL,
  description TEXT,
  icon TEXT NOT NULL DEFAULT 'book',
  order_index INTEGER NOT NULL DEFAULT 0,
  difficulty TEXT NOT NULL DEFAULT 'beginner' CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
  total_lessons INTEGER NOT NULL DEFAULT 0,
  color TEXT NOT NULL DEFAULT '#2563eb',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Lessons within topics
CREATE TABLE IF NOT EXISTS bislama_lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id UUID REFERENCES bislama_topics(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  title_bislama TEXT NOT NULL,
  description TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  xp_reward INTEGER NOT NULL DEFAULT 10,
  estimated_minutes INTEGER NOT NULL DEFAULT 5,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Vocabulary words
CREATE TABLE IF NOT EXISTS bislama_words (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id UUID REFERENCES bislama_lessons(id) ON DELETE CASCADE,
  english TEXT NOT NULL,
  bislama TEXT NOT NULL,
  pronunciation TEXT,
  audio_url TEXT,
  example_english TEXT,
  example_bislama TEXT,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Quiz questions
CREATE TABLE IF NOT EXISTS bislama_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id UUID REFERENCES bislama_lessons(id) ON DELETE CASCADE,
  question_type TEXT NOT NULL DEFAULT 'multiple_choice' CHECK (question_type IN ('multiple_choice', 'fill_blank', 'matching', 'listening', 'translation')),
  question_text TEXT NOT NULL,
  question_bislama TEXT,
  correct_answer TEXT NOT NULL,
  options JSONB NOT NULL DEFAULT '[]',
  hint TEXT,
  explanation TEXT,
  xp_value INTEGER NOT NULL DEFAULT 5,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User overall progress
CREATE TABLE IF NOT EXISTS user_bislama_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  total_xp INTEGER NOT NULL DEFAULT 0,
  current_streak INTEGER NOT NULL DEFAULT 0,
  longest_streak INTEGER NOT NULL DEFAULT 0,
  last_practice_date DATE,
  lessons_completed INTEGER NOT NULL DEFAULT 0,
  current_level TEXT NOT NULL DEFAULT 'beginner' CHECK (current_level IN ('beginner', 'intermediate', 'advanced')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User progress per lesson
CREATE TABLE IF NOT EXISTS user_lesson_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  lesson_id UUID REFERENCES bislama_lessons(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('locked', 'available', 'in_progress', 'completed')),
  score INTEGER NOT NULL DEFAULT 0,
  best_score INTEGER NOT NULL DEFAULT 0,
  attempts INTEGER NOT NULL DEFAULT 0,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, lesson_id)
);

-- Achievements
CREATE TABLE IF NOT EXISTS bislama_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL DEFAULT 'trophy',
  xp_reward INTEGER NOT NULL DEFAULT 50,
  requirement_type TEXT NOT NULL,
  requirement_value INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User earned achievements
CREATE TABLE IF NOT EXISTS user_bislama_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_id UUID REFERENCES bislama_achievements(id) ON DELETE CASCADE,
  earned_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, achievement_id)
);

-- Enable RLS
ALTER TABLE bislama_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE bislama_lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE bislama_words ENABLE ROW LEVEL SECURITY;
ALTER TABLE bislama_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_bislama_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_lesson_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE bislama_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_bislama_achievements ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Topics: Anyone can read
CREATE POLICY "Anyone can read topics" ON bislama_topics FOR SELECT USING (true);

-- Lessons: Anyone can read
CREATE POLICY "Anyone can read lessons" ON bislama_lessons FOR SELECT USING (true);

-- Words: Anyone can read
CREATE POLICY "Anyone can read words" ON bislama_words FOR SELECT USING (true);

-- Questions: Anyone can read
CREATE POLICY "Anyone can read questions" ON bislama_questions FOR SELECT USING (true);

-- Achievements: Anyone can read
CREATE POLICY "Anyone can read achievements" ON bislama_achievements FOR SELECT USING (true);

-- User progress: Users can manage their own
CREATE POLICY "Users can read own progress" ON user_bislama_progress FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own progress" ON user_bislama_progress FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own progress" ON user_bislama_progress FOR UPDATE USING (auth.uid() = user_id);

-- User lesson progress: Users can manage their own
CREATE POLICY "Users can read own lesson progress" ON user_lesson_progress FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own lesson progress" ON user_lesson_progress FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own lesson progress" ON user_lesson_progress FOR UPDATE USING (auth.uid() = user_id);

-- User achievements: Users can read their own
CREATE POLICY "Users can read own achievements" ON user_bislama_achievements FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own achievements" ON user_bislama_achievements FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_lessons_topic ON bislama_lessons(topic_id);
CREATE INDEX IF NOT EXISTS idx_words_lesson ON bislama_words(lesson_id);
CREATE INDEX IF NOT EXISTS idx_questions_lesson ON bislama_questions(lesson_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_user ON user_bislama_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_lesson_progress_user ON user_lesson_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_lesson_progress_lesson ON user_lesson_progress(lesson_id);
