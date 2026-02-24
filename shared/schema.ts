import { z } from "zod";
import { sql } from 'drizzle-orm';
import {
  index,
  integer,
  jsonb,
  pgTable,
  serial,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";

// Emotion Detection
export const emotionTypeSchema = z.enum([
  "motivated",
  "tired", 
  "bored",
  "confused",
  "stressed",
  "confident"
]);

export const emotionRequestSchema = z.object({
  text: z.string().min(1, "Text is required").max(500, "Text too long"),
});

export const emotionResponseSchema = z.object({
  emotion: emotionTypeSchema,
  confidence: z.number().min(0).max(1),
});

export type EmotionType = z.infer<typeof emotionTypeSchema>;
export type EmotionRequest = z.infer<typeof emotionRequestSchema>;
export type EmotionResponse = z.infer<typeof emotionResponseSchema>;

// AI Tutor Request/Response
export const tutorRequestSchema = z.object({
  topic: z.string().min(1, "Topic is required").max(200, "Topic too long"),
  mood: emotionTypeSchema.optional(),
});

export const tutorResponseSchema = z.object({
  result: z.string(),
});

export type TutorRequest = z.infer<typeof tutorRequestSchema>;
export type TutorResponse = z.infer<typeof tutorResponseSchema>;

// Quiz Generator Request/Response
export const quizRequestSchema = z.object({
  topic: z.string().min(1, "Topic is required").max(200, "Topic too long"),
});

export const quizQuestionSchema = z.object({
  q: z.string(),
  A: z.string(),
  B: z.string(),
  C: z.string(),
  D: z.string(),
  ans: z.string(),
});

export const quizResponseSchema = z.object({
  result: z.string(),
  questions: z.array(quizQuestionSchema).optional(),
});

export type QuizRequest = z.infer<typeof quizRequestSchema>;
export type QuizQuestion = z.infer<typeof quizQuestionSchema>;
export type QuizResponse = z.infer<typeof quizResponseSchema>;

// Study Plan Request/Response
export const studyPlanRequestSchema = z.object({
  subject: z.string().min(1, "Subject is required").max(200, "Subject too long"),
  days: z.number().min(1).max(30).default(5),
});

export const studyDaySchema = z.object({
  day: z.string(),
  topics: z.array(z.string()),
});

export const studyPlanResponseSchema = z.object({
  result: z.string(),
  plan: z.array(studyDaySchema).optional(),
  subject: z.string().optional(),
  days: z.number().optional(),
});

export type StudyPlanRequest = z.infer<typeof studyPlanRequestSchema>;
export type StudyDay = z.infer<typeof studyDaySchema>;
export type StudyPlanResponse = z.infer<typeof studyPlanResponseSchema>;

// Database Tables (Replit Auth integration)

// Session storage table for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table for Replit Auth
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

// Saved Study Plans
export const savedStudyPlans = pgTable("saved_study_plans", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  subject: varchar("subject").notNull(),
  days: integer("days").notNull(),
  plan: jsonb("plan").notNull(), // Array of StudyDay
  completedTopics: jsonb("completed_topics").default(sql`'[]'::jsonb`), // Array of completed topic identifiers
  createdAt: timestamp("created_at").defaultNow(),
});

export type SavedStudyPlan = typeof savedStudyPlans.$inferSelect;
export type InsertSavedStudyPlan = typeof savedStudyPlans.$inferInsert;

// Quiz Results
export const quizResults = pgTable("quiz_results", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  topic: varchar("topic").notNull(),
  questions: jsonb("questions").notNull(), // Array of QuizQuestion with user answers
  score: integer("score").notNull(),
  totalQuestions: integer("total_questions").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export type QuizResult = typeof quizResults.$inferSelect;
export type InsertQuizResult = typeof quizResults.$inferInsert;

// Flashcard Decks
export const flashcardDecks = pgTable("flashcard_decks", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  topic: varchar("topic").notNull(),
  cards: jsonb("cards").notNull(), // Array of { question: string, answer: string }
  createdAt: timestamp("created_at").defaultNow(),
});

export type FlashcardDeck = typeof flashcardDecks.$inferSelect;
export type InsertFlashcardDeck = typeof flashcardDecks.$inferInsert;

// Learned Topics for Memory Curve Revision
export const difficultySchema = z.enum(["easy", "medium", "hard"]);
export const revisionStatusSchema = z.enum(["pending", "completed", "overdue"]);

export const learnedTopics = pgTable("learned_topics", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  topic: varchar("topic").notNull(),
  difficulty: varchar("difficulty").notNull().default("medium"), // easy, medium, hard
  firstLearnedAt: timestamp("first_learned_at").defaultNow(),
  lastReviewedAt: timestamp("last_reviewed_at"),
  reviewCount: integer("review_count").notNull().default(0),
  nextReviewAt: timestamp("next_review_at").notNull(),
  status: varchar("status").notNull().default("pending"), // pending, completed, overdue
  createdAt: timestamp("created_at").defaultNow(),
});

export type LearnedTopic = typeof learnedTopics.$inferSelect;
export type InsertLearnedTopic = typeof learnedTopics.$inferInsert;

// Revision API Schemas
export const learnTopicRequestSchema = z.object({
  topic: z.string().min(1, "Topic is required").max(200, "Topic too long"),
  difficulty: difficultySchema.default("medium"),
});

export const revisionItemSchema = z.object({
  id: z.number(),
  topic: z.string(),
  difficulty: difficultySchema,
  firstLearnedAt: z.string(),
  lastReviewedAt: z.string().nullable(),
  reviewCount: z.number(),
  nextReviewAt: z.string(),
  status: revisionStatusSchema,
  retentionPercentage: z.number().min(0).max(100),
  daysUntilReview: z.number(),
});

export const revisionListResponseSchema = z.object({
  upcoming: z.array(revisionItemSchema),
  overdue: z.array(revisionItemSchema),
});

export type DifficultyLevel = z.infer<typeof difficultySchema>;
export type RevisionStatus = z.infer<typeof revisionStatusSchema>;
export type LearnTopicRequest = z.infer<typeof learnTopicRequestSchema>;
export type RevisionItem = z.infer<typeof revisionItemSchema>;
export type RevisionListResponse = z.infer<typeof revisionListResponseSchema>;
