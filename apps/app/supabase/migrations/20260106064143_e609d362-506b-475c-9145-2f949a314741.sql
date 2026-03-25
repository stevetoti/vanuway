-- Trigger types regeneration by adding a comment to bislama_topics
-- This ensures all 8 Bislama tables are included in the generated types

COMMENT ON TABLE bislama_topics IS 'Learning topics for the Bislama language module';
COMMENT ON TABLE bislama_lessons IS 'Individual lessons within each Bislama topic';
COMMENT ON TABLE bislama_words IS 'Vocabulary words taught in each lesson';
COMMENT ON TABLE bislama_questions IS 'Quiz questions for testing lesson comprehension';
COMMENT ON TABLE bislama_achievements IS 'Achievements that users can earn';
COMMENT ON TABLE user_bislama_progress IS 'Overall user progress in Bislama learning';
COMMENT ON TABLE user_lesson_progress IS 'Per-lesson progress tracking for users';
COMMENT ON TABLE user_bislama_achievements IS 'Achievements earned by users';