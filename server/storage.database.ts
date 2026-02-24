import {
  users,
  savedStudyPlans,
  quizResults,
  flashcardDecks,
  learnedTopics,
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
import { db } from "./db";
import { eq, desc, and, inArray } from "drizzle-orm";
import type { IStorage } from "./storage.types";

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async saveStudyPlan(planData: InsertSavedStudyPlan): Promise<SavedStudyPlan> {
    const [plan] = await db.insert(savedStudyPlans).values(planData).returning();
    return plan;
  }

  async getUserStudyPlans(userId: string): Promise<SavedStudyPlan[]> {
    return await db
      .select()
      .from(savedStudyPlans)
      .where(eq(savedStudyPlans.userId, userId))
      .orderBy(desc(savedStudyPlans.createdAt));
  }

  async deleteStudyPlan(id: number, userId: string): Promise<boolean> {
    const result = await db
      .delete(savedStudyPlans)
      .where(and(eq(savedStudyPlans.id, id), eq(savedStudyPlans.userId, userId)))
      .returning();
    return result.length > 0;
  }

  async updateStudyPlan(
    id: number,
    userId: string,
    updates: Partial<Pick<SavedStudyPlan, "subject" | "days" | "plan">>,
  ): Promise<SavedStudyPlan | undefined> {
    const [updatedPlan] = await db
      .update(savedStudyPlans)
      .set(updates)
      .where(and(eq(savedStudyPlans.id, id), eq(savedStudyPlans.userId, userId)))
      .returning();
    return updatedPlan;
  }

  async updateStudyPlanProgress(
    id: number,
    userId: string,
    completedTopics: string[],
  ): Promise<SavedStudyPlan | undefined> {
    const [updatedPlan] = await db
      .update(savedStudyPlans)
      .set({ completedTopics })
      .where(and(eq(savedStudyPlans.id, id), eq(savedStudyPlans.userId, userId)))
      .returning();
    return updatedPlan;
  }

  async saveQuizResult(resultData: InsertQuizResult): Promise<QuizResult> {
    const [result] = await db.insert(quizResults).values(resultData).returning();
    return result;
  }

  async getUserQuizResults(userId: string): Promise<QuizResult[]> {
    return await db
      .select()
      .from(quizResults)
      .where(eq(quizResults.userId, userId))
      .orderBy(desc(quizResults.createdAt));
  }

  async saveFlashcardDeck(deckData: InsertFlashcardDeck): Promise<FlashcardDeck> {
    const [deck] = await db.insert(flashcardDecks).values(deckData).returning();
    return deck;
  }

  async getUserFlashcardDecks(userId: string): Promise<FlashcardDeck[]> {
    return await db
      .select()
      .from(flashcardDecks)
      .where(eq(flashcardDecks.userId, userId))
      .orderBy(desc(flashcardDecks.createdAt));
  }

  async deleteFlashcardDeck(id: number): Promise<void> {
    await db.delete(flashcardDecks).where(eq(flashcardDecks.id, id));
  }

  async createLearnedTopic(topicData: InsertLearnedTopic): Promise<LearnedTopic> {
    const [topic] = await db.insert(learnedTopics).values(topicData).returning();
    return topic;
  }

  async getLearnedTopicByName(
    userId: string,
    topicName: string,
  ): Promise<LearnedTopic | undefined> {
    const [topic] = await db
      .select()
      .from(learnedTopics)
      .where(
        and(eq(learnedTopics.userId, userId), eq(learnedTopics.topic, topicName)),
      );
    return topic;
  }

  async getLearnedTopicById(
    id: number,
    userId: string,
  ): Promise<LearnedTopic | undefined> {
    const [topic] = await db
      .select()
      .from(learnedTopics)
      .where(and(eq(learnedTopics.id, id), eq(learnedTopics.userId, userId)));
    return topic;
  }

  async getUserLearnedTopics(userId: string): Promise<LearnedTopic[]> {
    return await db
      .select()
      .from(learnedTopics)
      .where(eq(learnedTopics.userId, userId))
      .orderBy(desc(learnedTopics.nextReviewAt));
  }

  async completeRevision(
    id: number,
    userId: string,
    updates: Partial<
      Pick<
        LearnedTopic,
        "lastReviewedAt" | "reviewCount" | "nextReviewAt" | "status"
      >
    >,
  ): Promise<LearnedTopic | undefined> {
    const [updated] = await db
      .update(learnedTopics)
      .set(updates)
      .where(and(eq(learnedTopics.id, id), eq(learnedTopics.userId, userId)))
      .returning();
    return updated;
  }

  async markTopicsAsOverdue(ids: number[]): Promise<void> {
    if (ids.length === 0) return;
    await db
      .update(learnedTopics)
      .set({ status: "overdue" })
      .where(inArray(learnedTopics.id, ids));
  }
}




