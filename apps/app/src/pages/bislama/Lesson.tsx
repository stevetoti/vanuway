import { useEffect, useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  ArrowLeft, Volume2, CheckCircle, XCircle, ChevronRight,
  Lightbulb, Zap, Star, Trophy, RefreshCw, BookOpen
} from 'lucide-react';
import type { BislamaLesson, BislamaWord, BislamaQuestion } from '@/types/bislama';

type LessonPhase = 'vocabulary' | 'quiz' | 'results';

const BislamaLessonPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [lesson, setLesson] = useState<BislamaLesson | null>(null);
  const [words, setWords] = useState<BislamaWord[]>([]);
  const [questions, setQuestions] = useState<BislamaQuestion[]>([]);

  // Lesson state
  const [phase, setPhase] = useState<LessonPhase>('vocabulary');
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [userAnswer, setUserAnswer] = useState('');
  const [isAnswerChecked, setIsAnswerChecked] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [score, setScore] = useState(0);
  const [xpEarned, setXpEarned] = useState(0);
  const [showHint, setShowHint] = useState(false);

  useEffect(() => {
    if (id) {
      loadLessonData();
    }
  }, [id]);

  const loadLessonData = async () => {
    try {
      // Load lesson
      const { data: lessonData, error: lessonError } = await supabase
        .from('bislama_lessons')
        .select('*, topic:bislama_topics(*)')
        .eq('id', id)
        .single();

      if (lessonError) throw lessonError;
      setLesson({
        ...lessonData,
        topic: lessonData.topic ? {
          ...lessonData.topic,
          difficulty: lessonData.topic.difficulty as 'beginner' | 'intermediate' | 'advanced',
        } : undefined,
      } as BislamaLesson);

      // Load vocabulary
      const { data: wordsData } = await supabase
        .from('bislama_words')
        .select('*')
        .eq('lesson_id', id)
        .order('created_at');

      setWords((wordsData || []) as BislamaWord[]);

      // Load questions
      const { data: questionsData } = await supabase
        .from('bislama_questions')
        .select('*')
        .eq('lesson_id', id)
        .order('order_index');

      setQuestions((questionsData || []).map(q => ({
        ...q,
        question_type: q.question_type as 'multiple_choice' | 'fill_blank' | 'matching' | 'listening' | 'translation',
        options: q.options as string[],
      })) as BislamaQuestion[]);
    } catch (error) {
      console.error('Error loading lesson:', error);
      toast.error('Failed to load lesson');
    } finally {
      setLoading(false);
    }
  };

  const handleNextWord = () => {
    if (currentWordIndex < words.length - 1) {
      setCurrentWordIndex(currentWordIndex + 1);
    } else {
      // Move to quiz phase
      setPhase('quiz');
    }
  };

  const handleCheckAnswer = () => {
    const currentQuestion = questions[currentQuestionIndex];
    let correct = false;

    if (currentQuestion.question_type === 'multiple_choice' || currentQuestion.question_type === 'matching') {
      correct = selectedAnswer?.toLowerCase() === currentQuestion.correct_answer.toLowerCase();
    } else {
      // For fill_blank and translation
      correct = userAnswer.toLowerCase().trim() === currentQuestion.correct_answer.toLowerCase().trim();
    }

    setIsCorrect(correct);
    setIsAnswerChecked(true);

    if (correct) {
      setScore(score + 1);
      setXpEarned(xpEarned + currentQuestion.xp_value);
    }
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedAnswer(null);
      setUserAnswer('');
      setIsAnswerChecked(false);
      setShowHint(false);
    } else {
      // Complete lesson
      completeLessonAndShowResults();
    }
  };

  const completeLessonAndShowResults = async () => {
    setPhase('results');

    if (!user || !lesson) return;

    const finalScore = Math.round((score / questions.length) * 100);
    const totalXp = xpEarned + (finalScore === 100 ? 10 : 0); // Bonus for perfect score

    try {
      // Update lesson progress
      const { data: existingProgress } = await supabase
        .from('user_lesson_progress')
        .select('*')
        .eq('user_id', user.id)
        .eq('lesson_id', lesson.id)
        .single();

      await supabase.from('user_lesson_progress').upsert({
        user_id: user.id,
        lesson_id: lesson.id,
        status: 'completed',
        score: finalScore,
        best_score: Math.max(finalScore, existingProgress?.best_score || 0),
        attempts: (existingProgress?.attempts || 0) + 1,
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      // Update overall progress
      const { data: overallProgress } = await supabase
        .from('user_bislama_progress')
        .select('*')
        .eq('user_id', user.id)
        .single();

      const today = new Date().toISOString().split('T')[0];
      const lastPractice = overallProgress?.last_practice_date;
      const isNewDay = lastPractice !== today;
      const isConsecutiveDay = lastPractice === new Date(Date.now() - 86400000).toISOString().split('T')[0];

      let newStreak = overallProgress?.current_streak || 0;
      if (isNewDay) {
        newStreak = isConsecutiveDay ? newStreak + 1 : 1;
      }

      await supabase.from('user_bislama_progress').upsert({
        user_id: user.id,
        total_xp: (overallProgress?.total_xp || 0) + totalXp,
        current_streak: newStreak,
        longest_streak: Math.max(newStreak, overallProgress?.longest_streak || 0),
        last_practice_date: today,
        lessons_completed: (overallProgress?.lessons_completed || 0) + (existingProgress ? 0 : 1),
        updated_at: new Date().toISOString(),
      });

      setXpEarned(totalXp);
    } catch (error) {
      console.error('Error saving progress:', error);
    }
  };

  const getProgressPercent = () => {
    if (phase === 'vocabulary') {
      return ((currentWordIndex + 1) / (words.length + questions.length)) * 100;
    }
    return ((words.length + currentQuestionIndex + 1) / (words.length + questions.length)) * 100;
  };

  if (loading) {
    return (
      <Layout>
        <div className="container py-12 flex justify-center">
          <div className="animate-pulse text-center">
            <BookOpen className="h-12 w-12 mx-auto mb-4 text-primary" />
            <p>Loading lesson...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (!lesson) {
    return (
      <Layout>
        <div className="container py-12 text-center">
          <p>Lesson not found</p>
          <Button onClick={() => navigate('/bislama')} className="mt-4">
            Back to Learn Bislama
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container py-6 max-w-2xl">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(`/bislama/topic/${lesson.topic_id}`)}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <Progress value={getProgressPercent()} className="h-2" />
          </div>
          <Badge variant="secondary">
            <Zap className="h-3 w-3 mr-1" />
            {xpEarned} XP
          </Badge>
        </div>

        {/* Vocabulary Phase */}
        {phase === 'vocabulary' && words.length > 0 && (
          <div className="space-y-6">
            <div className="text-center">
              <Badge className="mb-2">Learn New Words</Badge>
              <p className="text-sm text-muted-foreground">
                Word {currentWordIndex + 1} of {words.length}
              </p>
            </div>

            <Card className="p-8 text-center">
              <div className="mb-6">
                <h2 className="text-4xl font-bold text-primary mb-2">
                  {words[currentWordIndex].bislama}
                </h2>
                {words[currentWordIndex].pronunciation && (
                  <p className="text-lg text-muted-foreground italic">
                    /{words[currentWordIndex].pronunciation}/
                  </p>
                )}
              </div>

              <div className="border-t pt-6 mb-6">
                <p className="text-2xl font-medium">{words[currentWordIndex].english}</p>
              </div>

              {words[currentWordIndex].example_bislama && (
                <div className="bg-muted/50 rounded-lg p-4 text-left">
                  <p className="text-sm text-muted-foreground mb-1">Example:</p>
                  <p className="font-medium">{words[currentWordIndex].example_bislama}</p>
                  <p className="text-muted-foreground">{words[currentWordIndex].example_english}</p>
                </div>
              )}

              {words[currentWordIndex].audio_url && (
                <Button variant="outline" className="mt-4">
                  <Volume2 className="h-4 w-4 mr-2" />
                  Listen
                </Button>
              )}
            </Card>

            <Button className="w-full" size="lg" onClick={handleNextWord}>
              {currentWordIndex < words.length - 1 ? 'Next Word' : 'Start Quiz'}
              <ChevronRight className="h-5 w-5 ml-2" />
            </Button>
          </div>
        )}

        {/* Quiz Phase */}
        {phase === 'quiz' && questions.length > 0 && (
          <div className="space-y-6">
            <div className="text-center">
              <Badge className="mb-2">Quiz Time!</Badge>
              <p className="text-sm text-muted-foreground">
                Question {currentQuestionIndex + 1} of {questions.length}
              </p>
            </div>

            <Card className="p-6">
              {/* Question */}
              <h2 className="text-xl font-semibold mb-6">
                {questions[currentQuestionIndex].question_text}
              </h2>

              {/* Multiple Choice */}
              {(questions[currentQuestionIndex].question_type === 'multiple_choice' ||
                questions[currentQuestionIndex].question_type === 'matching') && (
                <div className="space-y-3">
                  {(questions[currentQuestionIndex].options as string[]).map((option, index) => (
                    <button
                      key={index}
                      onClick={() => !isAnswerChecked && setSelectedAnswer(option)}
                      disabled={isAnswerChecked}
                      className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
                        isAnswerChecked
                          ? option.toLowerCase() === questions[currentQuestionIndex].correct_answer.toLowerCase()
                            ? 'border-green-500 bg-green-50'
                            : selectedAnswer === option
                            ? 'border-red-500 bg-red-50'
                            : 'border-border'
                          : selectedAnswer === option
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span>{option}</span>
                        {isAnswerChecked && option.toLowerCase() === questions[currentQuestionIndex].correct_answer.toLowerCase() && (
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        )}
                        {isAnswerChecked && selectedAnswer === option && option.toLowerCase() !== questions[currentQuestionIndex].correct_answer.toLowerCase() && (
                          <XCircle className="h-5 w-5 text-red-500" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Fill in the blank / Translation */}
              {(questions[currentQuestionIndex].question_type === 'fill_blank' ||
                questions[currentQuestionIndex].question_type === 'translation') && (
                <div className="space-y-4">
                  <Input
                    placeholder="Type your answer..."
                    value={userAnswer}
                    onChange={(e) => setUserAnswer(e.target.value)}
                    disabled={isAnswerChecked}
                    className={`text-lg ${
                      isAnswerChecked
                        ? isCorrect
                          ? 'border-green-500'
                          : 'border-red-500'
                        : ''
                    }`}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !isAnswerChecked && userAnswer) {
                        handleCheckAnswer();
                      }
                    }}
                  />
                  {isAnswerChecked && !isCorrect && (
                    <p className="text-green-600">
                      Correct answer: <strong>{questions[currentQuestionIndex].correct_answer}</strong>
                    </p>
                  )}
                </div>
              )}

              {/* Hint */}
              {questions[currentQuestionIndex].hint && !isAnswerChecked && (
                <div className="mt-4">
                  {showHint ? (
                    <div className="flex items-start gap-2 p-3 bg-yellow-50 rounded-lg">
                      <Lightbulb className="h-5 w-5 text-yellow-600 shrink-0 mt-0.5" />
                      <p className="text-sm text-yellow-800">{questions[currentQuestionIndex].hint}</p>
                    </div>
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowHint(true)}
                      className="text-yellow-600"
                    >
                      <Lightbulb className="h-4 w-4 mr-1" />
                      Show Hint
                    </Button>
                  )}
                </div>
              )}

              {/* Explanation after answer */}
              {isAnswerChecked && questions[currentQuestionIndex].explanation && (
                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>Explanation:</strong> {questions[currentQuestionIndex].explanation}
                  </p>
                </div>
              )}
            </Card>

            {/* Action Button */}
            {!isAnswerChecked ? (
              <Button
                className="w-full"
                size="lg"
                onClick={handleCheckAnswer}
                disabled={!selectedAnswer && !userAnswer}
              >
                Check Answer
              </Button>
            ) : (
              <Button
                className="w-full"
                size="lg"
                onClick={handleNextQuestion}
                variant={isCorrect ? 'default' : 'outline'}
              >
                {currentQuestionIndex < questions.length - 1 ? 'Next Question' : 'See Results'}
                <ChevronRight className="h-5 w-5 ml-2" />
              </Button>
            )}
          </div>
        )}

        {/* Results Phase */}
        {phase === 'results' && (
          <div className="space-y-6">
            <Card className="p-8 text-center">
              <div className="text-6xl mb-4">
                {score === questions.length ? '🎉' : score >= questions.length * 0.7 ? '👍' : '💪'}
              </div>
              <h2 className="text-2xl font-bold mb-2">Lesson Complete!</h2>
              <p className="text-muted-foreground mb-6">{lesson.title}</p>

              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="p-4 bg-muted/50 rounded-lg">
                  <div className="text-2xl font-bold text-primary">
                    {Math.round((score / questions.length) * 100)}%
                  </div>
                  <p className="text-xs text-muted-foreground">Score</p>
                </div>
                <div className="p-4 bg-muted/50 rounded-lg">
                  <div className="text-2xl font-bold text-green-500">
                    {score}/{questions.length}
                  </div>
                  <p className="text-xs text-muted-foreground">Correct</p>
                </div>
                <div className="p-4 bg-muted/50 rounded-lg">
                  <div className="text-2xl font-bold text-yellow-500 flex items-center justify-center gap-1">
                    <Zap className="h-5 w-5" />
                    {xpEarned}
                  </div>
                  <p className="text-xs text-muted-foreground">XP Earned</p>
                </div>
              </div>

              {score === questions.length && (
                <div className="flex items-center justify-center gap-2 p-3 bg-yellow-50 rounded-lg mb-6">
                  <Star className="h-5 w-5 text-yellow-500 fill-current" />
                  <span className="font-medium text-yellow-700">Perfect Score! +10 Bonus XP</span>
                </div>
              )}
            </Card>

            <div className="grid grid-cols-2 gap-4">
              <Button
                variant="outline"
                onClick={() => {
                  setPhase('vocabulary');
                  setCurrentWordIndex(0);
                  setCurrentQuestionIndex(0);
                  setScore(0);
                  setXpEarned(0);
                  setSelectedAnswer(null);
                  setUserAnswer('');
                  setIsAnswerChecked(false);
                }}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
              <Button onClick={() => navigate(`/bislama/topic/${lesson.topic_id}`)}>
                Continue
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>
        )}

        {/* Empty states */}
        {phase === 'vocabulary' && words.length === 0 && (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground mb-4">No vocabulary for this lesson</p>
            <Button onClick={() => setPhase('quiz')}>Skip to Quiz</Button>
          </Card>
        )}

        {phase === 'quiz' && questions.length === 0 && (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground mb-4">No quiz questions for this lesson</p>
            <Button onClick={() => navigate(`/bislama/topic/${lesson.topic_id}`)}>
              Back to Topic
            </Button>
          </Card>
        )}
      </div>
    </Layout>
  );
};

export default BislamaLessonPage;
