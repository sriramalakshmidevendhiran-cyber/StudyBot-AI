import crypto from "node:crypto";
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
import type { IStorage } from "./storage.types";

const now = () => new Date();

export class MemoryStorage implements IStorage {
  private users = new Map<string, User>();
  private studyPlans: SavedStudyPlan[] = [];
  private quizHistory: QuizResult[] = [];
  private flashcards: FlashcardDeck[] = [];
  private topics: LearnedTopic[] = [];

  private studyPlanId = 1;
  private quizId = 1;
  private deckId = 1;
  private topicId = 1;

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const existing = this.users.get(userData.id!);
    const payload: User = {
      id: userData.id ?? existing?.id ?? crypto.randomUUID(),
      email: userData.email ?? existing?.email ?? null,
      firstName: userData.firstName ?? existing?.firstName ?? null,
      lastName: userData.lastName ?? existing?.lastName ?? null,
      profileImageUrl: userData.profileImageUrl ?? existing?.profileImageUrl ?? null,
      createdAt: existing?.createdAt ?? now(),
      updatedAt: now(),
    };
    this.users.set(payload.id, payload);
    return payload;
  }

  async saveStudyPlan(planData: InsertSavedStudyPlan): Promise<SavedStudyPlan> {
    const record: SavedStudyPlan = {
      id: this.studyPlanId++,
      userId: planData.userId,
      subject: planData.subject,
      days: planData.days,
      plan: planData.plan ?? [],
      completedTopics:
        (planData.completedTopics as string[] | undefined) ?? [],
      createdAt: now(),
    };
    this.studyPlans.push(record);
    return record;
  }

  async getUserStudyPlans(userId: string): Promise<SavedStudyPlan[]> {
    return this.studyPlans
      .filter((plan) => plan.userId === userId)
      .sort(
        (a, b) =>
          (b.createdAt?.getTime() ?? 0) - (a.createdAt?.getTime() ?? 0),
      );
  }

  async deleteStudyPlan(id: number, userId: string): Promise<boolean> {
    const initialLength = this.studyPlans.length;
    this.studyPlans = this.studyPlans.filter(
      (plan) => !(plan.id === id && plan.userId === userId),
    );
    return this.studyPlans.length !== initialLength;
  }

  async updateStudyPlan(
    id: number,
    userId: string,
    updates: Partial<Pick<SavedStudyPlan, "subject" | "days" | "plan">>,
  ): Promise<SavedStudyPlan | undefined> {
    const plan = this.studyPlans.find(
      (record) => record.id === id && record.userId === userId,
    );
    if (!plan) return undefined;

    Object.assign(plan, updates);
    return plan;
  }

  async updateStudyPlanProgress(
    id: number,
    userId: string,
    completedTopics: string[],
  ): Promise<SavedStudyPlan | undefined> {
    const plan = this.studyPlans.find(
      (record) => record.id === id && record.userId === userId,
    );
    if (!plan) return undefined;

    plan.completedTopics = completedTopics;
    return plan;
  }

  async saveQuizResult(resultData: InsertQuizResult): Promise<QuizResult> {
    const entry: QuizResult = {
      id: this.quizId++,
      userId: resultData.userId,
      topic: resultData.topic,
      questions: resultData.questions ?? [],
      score: resultData.score,
      totalQuestions: resultData.totalQuestions,
      createdAt: now(),
    };
    this.quizHistory.push(entry);
    return entry;
  }

  async getUserQuizResults(userId: string): Promise<QuizResult[]> {
    return this.quizHistory
      .filter((result) => result.userId === userId)
      .sort(
        (a, b) =>
          (b.createdAt?.getTime() ?? 0) - (a.createdAt?.getTime() ?? 0),
      );
  }

  async saveFlashcardDeck(
    deckData: InsertFlashcardDeck,
  ): Promise<FlashcardDeck> {
    const deck: FlashcardDeck = {
      id: this.deckId++,
      userId: deckData.userId,
      topic: deckData.topic,
      cards: deckData.cards ?? [],
      createdAt: now(),
    };
    this.flashcards.push(deck);
    return deck;
  }

  async getUserFlashcardDecks(userId: string): Promise<FlashcardDeck[]> {
    return this.flashcards
      .filter((deck) => deck.userId === userId)
      .sort(
        (a, b) =>
          (b.createdAt?.getTime() ?? 0) - (a.createdAt?.getTime() ?? 0),
      );
  }

  async deleteFlashcardDeck(id: number): Promise<void> {
    this.flashcards = this.flashcards.filter((deck) => deck.id !== id);
  }

  async createLearnedTopic(
    topicData: InsertLearnedTopic,
  ): Promise<LearnedTopic> {
    const topic: LearnedTopic = {
      id: this.topicId++,
      userId: topicData.userId,
      topic: topicData.topic,
      difficulty: topicData.difficulty ?? "medium",
      firstLearnedAt: topicData.firstLearnedAt ?? now(),
      lastReviewedAt: topicData.lastReviewedAt ?? null,
      reviewCount: topicData.reviewCount ?? 0,
      nextReviewAt: topicData.nextReviewAt ?? now(),
      status: topicData.status ?? "pending",
      createdAt: now(),
    };
    this.topics.push(topic);
    return topic;
  }

  async getLearnedTopicByName(
    userId: string,
    topicName: string,
  ): Promise<LearnedTopic | undefined> {
    return this.topics.find(
      (topic) => topic.userId === userId && topic.topic === topicName,
    );
  }

  async getLearnedTopicById(
    id: number,
    userId: string,
  ): Promise<LearnedTopic | undefined> {
    return this.topics.find(
      (topic) => topic.id === id && topic.userId === userId,
    );
  }

  async getUserLearnedTopics(userId: string): Promise<LearnedTopic[]> {
    return this.topics
      .filter((topic) => topic.userId === userId)
      .sort(
        (a, b) =>
          (b.nextReviewAt?.getTime() ?? 0) - (a.nextReviewAt?.getTime() ?? 0),
      );
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
    const topic = this.topics.find(
      (record) => record.id === id && record.userId === userId,
    );
    if (!topic) return undefined;

    Object.assign(topic, updates);
    return topic;
  }

  async markTopicsAsOverdue(ids: number[]): Promise<void> {
    if (ids.length === 0) return;
    this.topics = this.topics.map((topic) =>
      ids.includes(topic.id) ? { ...topic, status: "overdue" } : topic,
    );
  }
}


