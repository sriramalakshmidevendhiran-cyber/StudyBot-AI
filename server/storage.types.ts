import {
  type User,
  type UpsertUser,
  type SavedStudyPlan,
  type InsertSavedStudyPlan,
  type QuizResult,
  type InsertQuizResult,
  type FlashcardDeck,
  type InsertFlashcardDeck,
  type LearnedTopic,
  type InsertLearnedTopic,
} from "@shared/schema";

export interface IStorage {
  // User operations (Replit Auth integration)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;

  // Study Plan operations
  saveStudyPlan(plan: InsertSavedStudyPlan): Promise<SavedStudyPlan>;
  getUserStudyPlans(userId: string): Promise<SavedStudyPlan[]>;
  deleteStudyPlan(id: number, userId: string): Promise<boolean>;
  updateStudyPlan(
    id: number,
    userId: string,
    updates: Partial<Pick<SavedStudyPlan, "subject" | "days" | "plan">>,
  ): Promise<SavedStudyPlan | undefined>;
  updateStudyPlanProgress(
    id: number,
    userId: string,
    completedTopics: string[],
  ): Promise<SavedStudyPlan | undefined>;

  // Quiz Result operations
  saveQuizResult(result: InsertQuizResult): Promise<QuizResult>;
  getUserQuizResults(userId: string): Promise<QuizResult[]>;

  // Flashcard operations
  saveFlashcardDeck(deck: InsertFlashcardDeck): Promise<FlashcardDeck>;
  getUserFlashcardDecks(userId: string): Promise<FlashcardDeck[]>;
  deleteFlashcardDeck(id: number): Promise<void>;

  // Learned Topics operations (Memory Curve Revision)
  createLearnedTopic(topic: InsertLearnedTopic): Promise<LearnedTopic>;
  getLearnedTopicByName(
    userId: string,
    topic: string,
  ): Promise<LearnedTopic | undefined>;
  getLearnedTopicById(
    id: number,
    userId: string,
  ): Promise<LearnedTopic | undefined>;
  getUserLearnedTopics(userId: string): Promise<LearnedTopic[]>;
  completeRevision(
    id: number,
    userId: string,
    updates: Partial<
      Pick<
        LearnedTopic,
        "lastReviewedAt" | "reviewCount" | "nextReviewAt" | "status"
      >
    >,
  ): Promise<LearnedTopic | undefined>;
  markTopicsAsOverdue(ids: number[]): Promise<void>;
}

export type {
  User,
  UpsertUser,
  SavedStudyPlan,
  InsertSavedStudyPlan,
  QuizResult,
  InsertQuizResult,
  FlashcardDeck,
  InsertFlashcardDeck,
  LearnedTopic,
  InsertLearnedTopic,
};
