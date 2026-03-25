-- Bislama Learning Platform - Seed Data (Fixed UUIDs)
-- Run this AFTER the schema migration

-- ==========================================
-- TOPICS
-- ==========================================

INSERT INTO bislama_topics (id, name, name_bislama, description, icon, order_index, difficulty, total_lessons, color) VALUES
-- Beginner Topics
('11000000-0000-0000-0000-000000000001', 'Basics', 'Wan Wan Samting', 'Learn essential Bislama words and phrases', 'sparkles', 1, 'beginner', 5, '#10b981'),
('11000000-0000-0000-0000-000000000002', 'Greetings', 'Halo', 'Say hello and introduce yourself', 'hand-wave', 2, 'beginner', 4, '#f59e0b'),
('11000000-0000-0000-0000-000000000003', 'Numbers', 'Namba', 'Count from 1 to 100 in Bislama', 'calculator', 3, 'beginner', 4, '#3b82f6'),
('11000000-0000-0000-0000-000000000004', 'Food & Drink', 'Kakae mo Dring', 'Order food and talk about meals', 'utensils', 4, 'beginner', 5, '#ef4444'),
('11000000-0000-0000-0000-000000000005', 'Family', 'Famili', 'Talk about family members', 'users', 5, 'beginner', 4, '#8b5cf6'),

-- Intermediate Topics
('11000000-0000-0000-0000-000000000006', 'Travel', 'Traval', 'Get around Vanuatu with confidence', 'plane', 6, 'intermediate', 5, '#06b6d4'),
('11000000-0000-0000-0000-000000000007', 'Shopping', 'Pem Samting', 'Buy things at the market', 'shopping-bag', 7, 'intermediate', 4, '#ec4899'),
('11000000-0000-0000-0000-000000000008', 'Weather', 'Weta', 'Discuss weather and climate', 'cloud-sun', 8, 'intermediate', 3, '#64748b'),
('11000000-0000-0000-0000-000000000009', 'Time & Days', 'Taem mo Dei', 'Tell time and discuss schedules', 'clock', 9, 'intermediate', 4, '#f97316'),

-- Advanced Topics
('11000000-0000-0000-0000-000000000010', 'Culture', 'Kastom', 'Learn about Vanuatu customs and traditions', 'landmark', 10, 'advanced', 5, '#dc2626'),
('11000000-0000-0000-0000-000000000011', 'Conversations', 'Storian', 'Have full conversations in Bislama', 'message-circle', 11, 'advanced', 6, '#7c3aed'),
('11000000-0000-0000-0000-000000000012', 'Business', 'Bisnis', 'Business and work vocabulary', 'briefcase', 12, 'advanced', 4, '#0891b2');

-- ==========================================
-- LESSONS - Basics Topic
-- ==========================================

INSERT INTO bislama_lessons (id, topic_id, title, title_bislama, description, order_index, xp_reward, estimated_minutes) VALUES
('22000000-0000-0000-0000-000000000001', '11000000-0000-0000-0000-000000000001', 'Essential Words', 'Impoten Wod', 'Learn the most important Bislama words', 1, 15, 5),
('22000000-0000-0000-0000-000000000002', '11000000-0000-0000-0000-000000000001', 'Yes, No, Please', 'Yes, No, Plis', 'Basic responses and politeness', 2, 15, 5),
('22000000-0000-0000-0000-000000000003', '11000000-0000-0000-0000-000000000001', 'Common Phrases', 'Evridei Tok', 'Phrases you''ll use every day', 3, 20, 7),
('22000000-0000-0000-0000-000000000004', '11000000-0000-0000-0000-000000000001', 'Question Words', 'Kwestin Wod', 'Ask who, what, where, when, why', 4, 20, 7),
('22000000-0000-0000-0000-000000000005', '11000000-0000-0000-0000-000000000001', 'Basics Review', 'Luk Bak', 'Test your knowledge of basics', 5, 25, 10);

-- ==========================================
-- LESSONS - Greetings Topic
-- ==========================================

INSERT INTO bislama_lessons (id, topic_id, title, title_bislama, description, order_index, xp_reward, estimated_minutes) VALUES
('22000000-0000-0000-0000-000000000006', '11000000-0000-0000-0000-000000000002', 'Hello & Goodbye', 'Halo mo Tata', 'Basic greetings for any time', 1, 15, 5),
('22000000-0000-0000-0000-000000000007', '11000000-0000-0000-0000-000000000002', 'How Are You?', 'Yu Olsem Wanem?', 'Ask and answer about wellbeing', 2, 15, 5),
('22000000-0000-0000-0000-000000000008', '11000000-0000-0000-0000-000000000002', 'Introductions', 'Talem Nem', 'Introduce yourself and others', 3, 20, 7),
('22000000-0000-0000-0000-000000000009', '11000000-0000-0000-0000-000000000002', 'Greetings Review', 'Luk Bak Halo', 'Practice all greeting phrases', 4, 25, 10);

-- ==========================================
-- LESSONS - Numbers Topic
-- ==========================================

INSERT INTO bislama_lessons (id, topic_id, title, title_bislama, description, order_index, xp_reward, estimated_minutes) VALUES
('22000000-0000-0000-0000-000000000010', '11000000-0000-0000-0000-000000000003', 'Numbers 1-10', 'Namba 1-10', 'Count from one to ten', 1, 15, 5),
('22000000-0000-0000-0000-000000000011', '11000000-0000-0000-0000-000000000003', 'Numbers 11-20', 'Namba 11-20', 'Count from eleven to twenty', 2, 15, 5),
('22000000-0000-0000-0000-000000000012', '11000000-0000-0000-0000-000000000003', 'Numbers 21-100', 'Namba 21-100', 'Bigger numbers and counting', 3, 20, 7),
('22000000-0000-0000-0000-000000000013', '11000000-0000-0000-0000-000000000003', 'Numbers Review', 'Luk Bak Namba', 'Test your number knowledge', 4, 25, 10);

-- ==========================================
-- VOCABULARY - Basics Lesson 1 (Essential Words)
-- ==========================================

INSERT INTO bislama_words (lesson_id, english, bislama, pronunciation, example_english, example_bislama) VALUES
('22000000-0000-0000-0000-000000000001', 'I / Me', 'Mi', 'mee', 'I am here', 'Mi stap ia'),
('22000000-0000-0000-0000-000000000001', 'You', 'Yu', 'yoo', 'You are good', 'Yu gud'),
('22000000-0000-0000-0000-000000000001', 'He / She / It', 'Hem', 'hem', 'He is sleeping', 'Hem i slip'),
('22000000-0000-0000-0000-000000000001', 'We', 'Yumi', 'yoo-mee', 'We go together', 'Yumi go wantaem'),
('22000000-0000-0000-0000-000000000001', 'They', 'Olgeta', 'ol-ge-ta', 'They are coming', 'Olgeta i kam'),
('22000000-0000-0000-0000-000000000001', 'Good', 'Gud', 'good', 'This is good', 'Hemia i gud'),
('22000000-0000-0000-0000-000000000001', 'Big', 'Bigfala', 'big-fa-la', 'A big house', 'Wan bigfala haos'),
('22000000-0000-0000-0000-000000000001', 'Small', 'Smol', 'smol', 'A small child', 'Wan smol pikinini');

-- ==========================================
-- VOCABULARY - Basics Lesson 2 (Yes, No, Please)
-- ==========================================

INSERT INTO bislama_words (lesson_id, english, bislama, pronunciation, example_english, example_bislama) VALUES
('22000000-0000-0000-0000-000000000002', 'Yes', 'Yes / Ae', 'yes / ah-eh', 'Yes, I understand', 'Yes, mi save'),
('22000000-0000-0000-0000-000000000002', 'No', 'No', 'no', 'No, thank you', 'No, tangkyu'),
('22000000-0000-0000-0000-000000000002', 'Please', 'Plis', 'plees', 'Please help me', 'Plis helpem mi'),
('22000000-0000-0000-0000-000000000002', 'Thank you', 'Tangkyu / Tangkyu tumas', 'tang-kyoo', 'Thank you very much', 'Tangkyu tumas'),
('22000000-0000-0000-0000-000000000002', 'Sorry', 'Sori', 'so-ree', 'I am sorry', 'Mi sori'),
('22000000-0000-0000-0000-000000000002', 'Excuse me', 'Skius', 'skyoos', 'Excuse me, sir', 'Skius, masta');

-- ==========================================
-- VOCABULARY - Greetings Lesson 1 (Hello & Goodbye)
-- ==========================================

INSERT INTO bislama_words (lesson_id, english, bislama, pronunciation, example_english, example_bislama) VALUES
('22000000-0000-0000-0000-000000000006', 'Hello', 'Halo', 'ha-lo', 'Hello friend', 'Halo fren'),
('22000000-0000-0000-0000-000000000006', 'Good morning', 'Gud moning', 'good mo-ning', 'Good morning everyone', 'Gud moning evriwan'),
('22000000-0000-0000-0000-000000000006', 'Good afternoon', 'Gud aftanun', 'good af-ta-noon', 'Good afternoon sir', 'Gud aftanun masta'),
('22000000-0000-0000-0000-000000000006', 'Good evening', 'Gud ivning', 'good iv-ning', 'Good evening madam', 'Gud ivning madam'),
('22000000-0000-0000-0000-000000000006', 'Good night', 'Gud naet', 'good nait', 'Good night, sleep well', 'Gud naet, slip gud'),
('22000000-0000-0000-0000-000000000006', 'Goodbye', 'Tata / Ale tata', 'ta-ta', 'Goodbye, see you', 'Tata, lukim yu');

-- ==========================================
-- VOCABULARY - Numbers Lesson 1 (Numbers 1-10)
-- ==========================================

INSERT INTO bislama_words (lesson_id, english, bislama, pronunciation, example_english, example_bislama) VALUES
('22000000-0000-0000-0000-000000000010', 'One', 'Wan', 'wun', 'One person', 'Wan man'),
('22000000-0000-0000-0000-000000000010', 'Two', 'Tu', 'too', 'Two children', 'Tu pikinini'),
('22000000-0000-0000-0000-000000000010', 'Three', 'Tri', 'tree', 'Three houses', 'Tri haos'),
('22000000-0000-0000-0000-000000000010', 'Four', 'Fo', 'fo', 'Four dogs', 'Fo dog'),
('22000000-0000-0000-0000-000000000010', 'Five', 'Faef', 'fife', 'Five fingers', 'Faef fingga'),
('22000000-0000-0000-0000-000000000010', 'Six', 'Sikis', 'si-kis', 'Six islands', 'Sikis aelan'),
('22000000-0000-0000-0000-000000000010', 'Seven', 'Seven', 'se-ven', 'Seven days', 'Seven dei'),
('22000000-0000-0000-0000-000000000010', 'Eight', 'Eit', 'ate', 'Eight years', 'Eit yia'),
('22000000-0000-0000-0000-000000000010', 'Nine', 'Naen', 'nine', 'Nine o''clock', 'Naen klok'),
('22000000-0000-0000-0000-000000000010', 'Ten', 'Ten', 'ten', 'Ten vatu', 'Ten vatu');

-- ==========================================
-- QUIZ QUESTIONS - Basics Lesson 1
-- ==========================================

INSERT INTO bislama_questions (lesson_id, question_type, question_text, correct_answer, options, hint, explanation, xp_value, order_index) VALUES
('22000000-0000-0000-0000-000000000001', 'multiple_choice', 'What does "Mi" mean in English?', 'I / Me', '["I / Me", "You", "They", "We"]', 'It refers to yourself', '"Mi" is how you refer to yourself in Bislama', 5, 1),
('22000000-0000-0000-0000-000000000001', 'multiple_choice', 'How do you say "You" in Bislama?', 'Yu', '["Mi", "Yu", "Hem", "Yumi"]', 'Think about how it sounds similar to English', '"Yu" sounds just like the English "you"', 5, 2),
('22000000-0000-0000-0000-000000000001', 'translation', 'Translate to Bislama: "He is sleeping"', 'Hem i slip', '[]', 'Use "Hem" for he/she', '"Hem" means he, she, or it. "I" is a helper word. "Slip" means sleep', 10, 3),
('22000000-0000-0000-0000-000000000001', 'multiple_choice', 'What does "Yumi" mean?', 'We (including you)', '["I", "You", "We (including you)", "They"]', 'It includes the person you''re talking to', '"Yumi" is we/us when including the listener', 5, 4),
('22000000-0000-0000-0000-000000000001', 'fill_blank', 'Complete: "_____ i gud" (This is good)', 'Hemia', '[]', 'A word meaning "this"', '"Hemia" means "this" or "this one"', 10, 5),
('22000000-0000-0000-0000-000000000001', 'multiple_choice', 'How do you say "big" in Bislama?', 'Bigfala', '["Smol", "Bigfala", "Gud", "Nogud"]', 'Add "-fala" to make adjectives', '"Bigfala" is big. The "-fala" suffix is common for adjectives', 5, 6);

-- ==========================================
-- QUIZ QUESTIONS - Greetings Lesson 1
-- ==========================================

INSERT INTO bislama_questions (lesson_id, question_type, question_text, correct_answer, options, hint, explanation, xp_value, order_index) VALUES
('22000000-0000-0000-0000-000000000006', 'multiple_choice', 'How do you say "Hello" in Bislama?', 'Halo', '["Tata", "Halo", "Gud naet", "Sori"]', 'It sounds almost the same as English', '"Halo" is the standard greeting in Bislama', 5, 1),
('22000000-0000-0000-0000-000000000006', 'multiple_choice', 'What is "Gud moning"?', 'Good morning', '["Good night", "Good morning", "Goodbye", "Good afternoon"]', 'Think about the time of day', '"Gud moning" is used in the morning to greet people', 5, 2),
('22000000-0000-0000-0000-000000000006', 'translation', 'Translate: "Goodbye"', 'Tata', '[]', 'A simple farewell word', '"Tata" is the common way to say goodbye', 10, 3),
('22000000-0000-0000-0000-000000000006', 'fill_blank', 'Complete: "Gud _____, evriwan" (Good afternoon, everyone)', 'aftanun', '[]', 'The afternoon greeting', '"Gud aftanun" is good afternoon', 10, 4),
('22000000-0000-0000-0000-000000000006', 'multiple_choice', 'When would you say "Gud naet"?', 'At night, before sleeping', '["In the morning", "At noon", "At night, before sleeping", "When arriving"]', 'Think about when you go to bed', '"Gud naet" is said at night, similar to "good night"', 5, 5);

-- ==========================================
-- QUIZ QUESTIONS - Numbers Lesson 1
-- ==========================================

INSERT INTO bislama_questions (lesson_id, question_type, question_text, correct_answer, options, hint, explanation, xp_value, order_index) VALUES
('22000000-0000-0000-0000-000000000010', 'multiple_choice', 'How do you say "one" in Bislama?', 'Wan', '["Tu", "Wan", "Tri", "Fo"]', 'Sounds like English', '"Wan" is one in Bislama', 5, 1),
('22000000-0000-0000-0000-000000000010', 'multiple_choice', 'What number is "Faef"?', '5', '["3", "4", "5", "6"]', 'Think of the English word "five"', '"Faef" means five (5)', 5, 2),
('22000000-0000-0000-0000-000000000010', 'translation', 'Translate the number: 3', 'Tri', '[]', 'Similar to English "three"', '"Tri" is three in Bislama', 10, 3),
('22000000-0000-0000-0000-000000000010', 'fill_blank', 'Count: Wan, Tu, ___', 'Tri', '[]', 'What comes after two?', 'Wan (1), Tu (2), Tri (3)', 10, 4),
('22000000-0000-0000-0000-000000000010', 'multiple_choice', 'What is "Sikis" in English?', '6', '["5", "6", "7", "8"]', 'Listen to how it sounds', '"Sikis" is six (6) in Bislama', 5, 5),
('22000000-0000-0000-0000-000000000010', 'matching', 'Match: Eit', '8', '["7", "8", "9", "10"]', 'Similar to "eight"', '"Eit" is eight (8)', 5, 6);

-- ==========================================
-- ACHIEVEMENTS
-- ==========================================

INSERT INTO bislama_achievements (id, name, description, icon, xp_reward, requirement_type, requirement_value) VALUES
('33000000-0000-0000-0000-000000000001', 'First Steps', 'Complete your first lesson', 'footprints', 50, 'lessons_completed', 1),
('33000000-0000-0000-0000-000000000002', 'Getting Started', 'Complete 5 lessons', 'rocket', 100, 'lessons_completed', 5),
('33000000-0000-0000-0000-000000000003', 'Dedicated Learner', 'Complete 10 lessons', 'graduation-cap', 200, 'lessons_completed', 10),
('33000000-0000-0000-0000-000000000004', 'Bislama Explorer', 'Complete 25 lessons', 'compass', 500, 'lessons_completed', 25),
('33000000-0000-0000-0000-000000000005', 'On Fire!', 'Reach a 3-day streak', 'flame', 75, 'streak', 3),
('33000000-0000-0000-0000-000000000006', 'Week Warrior', 'Reach a 7-day streak', 'zap', 150, 'streak', 7),
('33000000-0000-0000-0000-000000000007', 'Streak Master', 'Reach a 30-day streak', 'crown', 500, 'streak', 30),
('33000000-0000-0000-0000-000000000008', 'XP Hunter', 'Earn 100 XP', 'star', 25, 'total_xp', 100),
('33000000-0000-0000-0000-000000000009', 'XP Champion', 'Earn 500 XP', 'trophy', 100, 'total_xp', 500),
('33000000-0000-0000-0000-000000000010', 'XP Legend', 'Earn 1000 XP', 'medal', 250, 'total_xp', 1000),
('33000000-0000-0000-0000-000000000011', 'Perfect Score', 'Get 100% on any lesson', 'check-circle', 50, 'perfect_score', 1),
('33000000-0000-0000-0000-000000000012', 'Perfectionist', 'Get 100% on 5 lessons', 'award', 150, 'perfect_score', 5);
