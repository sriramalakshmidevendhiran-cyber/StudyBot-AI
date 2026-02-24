import type { Express } from "express";
import { createServer, type Server } from "http";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { OpenAI } from "openai";
import { 
  tutorRequestSchema, 
  quizRequestSchema, 
  studyPlanRequestSchema,
  quizQuestionSchema,
  studyDaySchema,
  emotionRequestSchema,
  emotionTypeSchema,
  learnTopicRequestSchema,
  type DifficultyLevel,
  type RevisionItem
} from "@shared/schema";
import { z } from "zod";
import { setupAuth, isAuthenticated, getRequestUserId } from "./auth";
import { storage } from "./storage";

export async function registerRoutes(app: Express): Promise<Server> {
  const geminiConfigured = Boolean(process.env.GEMINI_API_KEY);
  // Setup authentication (Replit Auth integration)
  await setupAuth(app);

  // Enhanced demo explanation function for when API fails
  const getEnhancedDemoExplanation = (topic: string, mood?: string | null) => {
    const moodAdaptations: Record<string, string> = {
      motivated: "Let's dive into this exciting topic with enthusiasm!",
      tired: "Here's a clear, simple explanation to help you learn efficiently.",
      bored: "Let's make this interesting with some engaging examples!",
      confused: "Let's break this down step-by-step for clarity.",
      stressed: "Here's a calm, straightforward explanation to help you focus.",
      confident: "Here's an advanced explanation to challenge your understanding."
    };

    const intro = mood ? moodAdaptations[mood] : "Here's a comprehensive explanation";
    
    return `${intro}

${topic}

**Key Concepts:**
• ${topic} is a fundamental process that involves multiple interconnected mechanisms
• Understanding ${topic} requires knowledge of both theoretical principles and practical applications
• Modern approaches to ${topic} have evolved significantly over recent years

**Real-World Example:**
Imagine you're studying ${topic} in a real-world setting. For instance, when you observe ${topic} in nature or apply it in technology, you see the same principles at work. This practical connection helps solidify your understanding of how ${topic} operates in different contexts.

**Quick Quiz Question:**
Based on this explanation of ${topic}, what would you consider the most important aspect to remember for practical applications?

**Study Tip:**
Try to relate ${topic} to something you're already familiar with - this creates stronger neural connections and improves retention.`;
  };

  // Enhanced demo plan function for when API fails
  const getEnhancedDemoPlan = (subject: string, days: number) => {
    return Array.from({ length: days }).map((_, idx) => ({
      day: `Day ${idx + 1}`,
      topics: [
        `${subject} fundamentals and core concepts`,
        `${subject} practical applications and case studies`,
      ],
    }));
  };

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req, res) => {
    try {
      const userId = getRequestUserId(req);
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Emotion Detection
  app.post("/api/emotion", async (req, res) => {
    try {
      const { text } = emotionRequestSchema.parse(req.body);

      if (!geminiConfigured) {
        return res.json({ emotion: "motivated", confidence: 0.42 });
      }
      
      const prompt = `Analyze the emotional state of the following text and determine which mood best describes it.
Text: "${text}"

Respond with valid JSON in this exact format:
{
  "emotion": "one of: motivated, tired, bored, confused, stressed, confident",
  "confidence": 0.85
}

Choose the emotion that best matches the user's state:
- motivated: enthusiastic, eager to learn, energetic
- tired: low energy, fatigued, needs rest
- bored: uninterested, lacking excitement
- confused: uncertain, needs clarification
- stressed: anxious, overwhelmed, tense
- confident: self-assured, ready for challenges

Confidence should be 0.0 to 1.0 (0.7+ means high confidence).`;

      const response = await gemini.models.generateContent({
        model: "gemini-2.5-flash",
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: "object",
            properties: {
              emotion: { type: "string", enum: ["motivated", "tired", "bored", "confused", "stressed", "confident"] },
              confidence: { type: "number", minimum: 0, maximum: 1 }
            },
            required: ["emotion", "confidence"]
          }
        },
        contents: prompt,
      });

      const data = response.text;
      const parsedJson = JSON.parse(data || "{}");
      
      // Validate emotion type
      const validatedEmotion = emotionTypeSchema.parse(parsedJson.emotion);
      const confidence = Math.max(0, Math.min(1, parsedJson.confidence || 0.5));

      res.json({ emotion: validatedEmotion, confidence });
    } catch (err: any) {
      console.error("Emotion detection error:", err);
      if (err.name === 'ZodError') {
        return res.status(400).json({ 
          error: "Invalid request. Please provide text to analyze." 
        });
      }
      
      // Default fallback emotion
      res.status(200).json({ emotion: "motivated", confidence: 0.3 });
    }
  });

  // AI Tutor - Explain topics (with mood adaptation)
  app.post("/api/tutor", async (req, res) => {
    try {
      const { topic, mood } = tutorRequestSchema.parse(req.body);
      
      // Mood-based prompt adaptations
      const moodPrompts: Record<string, string> = {
        motivated: "Use an upbeat, encouraging tone. Include challenging concepts and detailed examples to maintain engagement.",
        tired: "Use simple, clear language with short sentences. Keep explanations concise and easy to follow. Avoid complex terminology.",
        bored: "Make it interesting! Use engaging examples, fun facts, and real-world applications to spark curiosity.",
        confused: "Break down concepts step-by-step with extra clarity. Use analogies and simple examples to ensure understanding.",
        stressed: "Use a calm, reassuring tone. Present information in bite-sized, manageable chunks. Focus on core concepts first.",
        confident: "Include advanced concepts and nuanced details. Provide comprehensive examples and deeper insights for mastery."
      };

      const moodDirective = mood ? moodPrompts[mood] || "" : "";
      
      const prompt = `You are StudyBot, an AI tutor for college students.
${moodDirective}

Explain ${topic} in simple terms, include 3–5 bullet points,
one real-world example, and one short quiz question at the end.`;

        });
      }
      
      res.status(500).json({ 
        error: "Failed to get explanation. Please try again." 
      });
    }
  });

  // AI Quiz Generator
  app.post("/api/quiz", async (req, res) => {
    try {
      const { topic } = quizRequestSchema.parse(req.body);

      if (!geminiConfigured) {
        const demoQuestions = [
          {
            q: `Sample question about ${topic}?`,
            A: "Option A",
            B: "Option B",
            C: "Option C",
            D: "Option D",
            ans: "A",
          },
          {
            q: `Second sample question about ${topic}?`,
            A: "Option A",
            B: "Option B",
            C: "Option C",
            D: "Option D",
            ans: "C",
          },
          {
            q: `Third sample question about ${topic}?`,
            A: "Option A",
            B: "Option B",
            C: "Option C",
            D: "Option D",
            ans: "D",
          },
        ];
        return res.json({
          result: JSON.stringify({ questions: demoQuestions }),
          questions: demoQuestions,
        });
      }
      
      const systemPrompt = `Generate 3 multiple-choice questions (A–D) for topic: ${topic}.
You must respond with valid JSON in this exact format:
{
  "questions": [
    {"q": "Question text?", "A": "Option A", "B": "Option B", "C": "Option C", "D": "Option D", "ans": "B"}
  ]
}`;

      // Using Google Gemini AI with JSON mode
      const response = await gemini.models.generateContent({
        model: "gemini-2.5-pro",
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: "object",
            properties: {
              questions: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    q: { type: "string" },
                    A: { type: "string" },
                    B: { type: "string" },
                    C: { type: "string" },
                    D: { type: "string" },
                    ans: { type: "string" }
                  },
                  required: ["q", "A", "B", "C", "D", "ans"]
                }
              }
            },
            required: ["questions"]
          }
        },
        contents: systemPrompt,
      });

      const data = response.text;
      
      let parsedJson;
      try {
        parsedJson = JSON.parse(data || "{}");
      } catch (parseErr) {
        console.error("Quiz JSON parse error:", parseErr);
        return res.status(502).json({ 
          error: "AI returned invalid JSON response" 
        });
      }

      // Validate with Zod schema
      const questionsSchema = z.object({
        questions: z.array(quizQuestionSchema)
      });

      const validation = questionsSchema.safeParse(parsedJson);
      if (!validation.success) {
        console.error("Quiz validation error:", validation.error);
        return res.status(502).json({ 
      res.status(500).json({ 
        error: "Failed to generate quiz. Please try again." 
      });
    }
  });

  // Study Plan Generator
  app.post("/api/plan", async (req, res) => {
    try {
      const requestData = studyPlanRequestSchema.parse(req.body);
      const { subject, days } = requestData;

      if (!geminiConfigured) {
        const plan = Array.from({ length: days }).map((_, idx) => ({
          day: `Day ${idx + 1}`,
          topics: [
            `${subject} concept ${idx * 2 + 1}`,
            `${subject} concept ${idx * 2 + 2}`,
          ],
        }));

        return res.json({
          result: JSON.stringify({ plan }),
          plan,
          subject,
          days,
        });
      }

      const systemPrompt = `Create a ${days}-day study plan for ${subject}.
You must respond with valid JSON in this exact format:
{
  "plan": [
    {"day": "Day 1", "topics": ["Topic 1", "Topic 2"]},
    {"day": "Day 2", "topics": ["Topic 3", "Topic 4"]}
  ]
}`;

      const response = await gemini.models.generateContent({
        model: "gemini-2.5-pro",
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: "object",
            properties: {
              plan: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    day: { type: "string" },
                    topics: {
                      type: "array",
                      items: { type: "string" }
                    }
                  },
                  required: ["day", "topics"]
                }
              }
            },
            required: ["plan"]
          }
        },
        contents: systemPrompt,
      });

      const data = response.text;
      
      let parsedJson;
      try {
        parsedJson = JSON.parse(data || "{}");
      } catch (parseErr) {
        console.error("Plan JSON parse error:", parseErr);
        return res.status(502).json({ 
          error: "AI returned invalid JSON response" 
        });
      }

      // Validate with Zod schema
      const planSchema = z.object({
        plan: z.array(studyDaySchema)
      });

      const validation = planSchema.safeParse(parsedJson);
      if (!validation.success) {
        console.error("Plan validation error:", validation.error);
        return res.status(502).json({ 
          error: "AI response missing expected data structure" 
        });
      }

      res.json({ 
        result: data,
        plan: validation.data.plan,
        subject,
        days
      });
    } catch (err: any) {
      console.error("Plan error:", err);
      
      // If it's a permission error, provide a better fallback
      if (err.status === 403 || err.message?.includes('PERMISSION_DENIED')) {
        console.log('API key permission denied, providing enhanced demo plan');
        // Use fallback values since subject and days might not be accessible
        const fallbackSubject = req.body?.subject || 'the topic';
        const fallbackDays = req.body?.days || 5;
        const enhancedDemoPlan = getEnhancedDemoPlan(fallbackSubject, fallbackDays);
        return res.json({
          result: JSON.stringify({ plan: enhancedDemoPlan }),
          plan: enhancedDemoPlan,
          subject: fallbackSubject,
          days: fallbackDays
        });
      }
      
      if (err.name === 'ZodError') {
        return res.status(400).json({ 
          error: "Invalid request. Please provide a subject." 
        });
      }
      
      // Handle Gemini rate limit and quota errors
      if (err.status === 429 || err.message?.includes('quota') || err.message?.includes('rate limit')) {
        return res.status(429).json({ 
          error: "AI service is temporarily unavailable. Please check your API quota and try again in a few moments." 
        });
      }
      
      res.status(500).json({ 
        error: "Failed to create study plan. Please try again." 
      });
    }
  });

  // Save study plan endpoint (protected)
  app.post("/api/plans/save", isAuthenticated, async (req, res) => {
    try {
      const userId = getRequestUserId(req);
      const { subject, days, plan } = req.body;
      
      if (!subject || !days || !plan) {
        return res.status(400).json({ error: "Missing required fields" });
      }
      
      const savedPlan = await storage.saveStudyPlan({
        userId,
        subject,
        days,
        plan,
      });
      
      res.json(savedPlan);
    } catch (error) {
      console.error("Error saving study plan:", error);
      res.status(500).json({ error: "Failed to save study plan" });
    }
  });

  // Get user's saved study plans (protected)
  app.get("/api/plans/saved", isAuthenticated, async (req, res) => {
    try {
      const userId = getRequestUserId(req);
      const plans = await storage.getUserStudyPlans(userId);
      res.json(plans);
    } catch (error) {
      console.error("Error fetching study plans:", error);
      res.status(500).json({ error: "Failed to fetch study plans" });
    }
  });

  // Delete study plan (protected)
  app.delete("/api/plans/:id", isAuthenticated, async (req, res) => {
    try {
      const userId = getRequestUserId(req);
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid plan ID" });
      }
      
      const deleted = await storage.deleteStudyPlan(id, userId);
      
      if (!deleted) {
        return res.status(404).json({ error: "Study plan not found" });
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting study plan:", error);
      res.status(500).json({ error: "Failed to delete study plan" });
    }
  });

  // Update study plan endpoint (protected)
  app.patch("/api/plans/:id", isAuthenticated, async (req, res) => {
    try {
      const userId = getRequestUserId(req);
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid plan ID" });
      }
      
      // Validate request body
      const updateSchema = z.object({
        subject: z.string().min(1).max(200).optional(),
        days: z.number().min(1).max(30).optional(),
        plan: z.array(studyDaySchema).optional(),
      });
      
      const validation = updateSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: "Invalid update data" });
      }
      
      const updates: any = {};
      if (validation.data.subject !== undefined) updates.subject = validation.data.subject;
      if (validation.data.days !== undefined) updates.days = validation.data.days;
      if (validation.data.plan !== undefined) updates.plan = validation.data.plan;
      
      const updatedPlan = await storage.updateStudyPlan(id, userId, updates);
      
      if (!updatedPlan) {
        return res.status(404).json({ error: "Study plan not found" });
      }
      
      res.json(updatedPlan);
    } catch (error) {
      console.error("Error updating study plan:", error);
      res.status(500).json({ error: "Failed to update study plan" });
    }
  });

  // Update study plan progress endpoint (protected)
  app.post("/api/plans/:id/progress", isAuthenticated, async (req, res) => {
    try {
      const userId = getRequestUserId(req);
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid plan ID" });
      }
      
      // Validate request body
      const progressSchema = z.object({
        completedTopics: z.array(z.string()),
      });
      
      const validation = progressSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: "Invalid progress data" });
      }
      
      const updatedPlan = await storage.updateStudyPlanProgress(
        id, 
        userId, 
        validation.data.completedTopics
      );
      
      if (!updatedPlan) {
        return res.status(404).json({ error: "Study plan not found" });
      }
      
      res.json(updatedPlan);
    } catch (error) {
      console.error("Error updating study plan progress:", error);
      res.status(500).json({ error: "Failed to update progress" });
    }
  });

  // Save quiz result endpoint (protected)
  app.post("/api/quiz/save", isAuthenticated, async (req, res) => {
    try {
      const userId = getRequestUserId(req);
      const { topic, questions, score, totalQuestions } = req.body;
      
      if (!topic || !questions || score === undefined || !totalQuestions) {
        return res.status(400).json({ error: "Missing required fields" });
      }
      
      const result = await storage.saveQuizResult({
        userId,
        topic,
        questions,
        score,
        totalQuestions,
      });
      
      res.json(result);
    } catch (error) {
      console.error("Error saving quiz result:", error);
      res.status(500).json({ error: "Failed to save quiz result" });
    }
  });

  // Get user's quiz history (protected)
  app.get("/api/quiz/history", isAuthenticated, async (req, res) => {
    try {
      const userId = getRequestUserId(req);
      const results = await storage.getUserQuizResults(userId);
      res.json(results);
    } catch (error) {
      console.error("Error fetching quiz history:", error);
      res.status(500).json({ error: "Failed to fetch quiz history" });
    }
  });

  // Memory Curve Revision System Helper Functions
  
  // Calculate next review date based on Ebbinghaus forgetting curve
  function calculateNextReviewDate(
    reviewCount: number, 
    difficulty: DifficultyLevel,
    lastReviewedAt?: Date | null
  ): Date {
    const baseDate = lastReviewedAt || new Date();
    
    // Base intervals in days following Ebbinghaus forgetting curve
    const baseIntervals = [1, 3, 7, 14, 30, 60, 90];
    
    // Difficulty multipliers
    const difficultyMultipliers = {
      easy: 1.5,    // Longer intervals for easy topics
      medium: 1.0,  // Standard intervals
      hard: 0.7,    // Shorter intervals for hard topics
    };
    
    const multiplier = difficultyMultipliers[difficulty];
    const intervalIndex = Math.min(reviewCount, baseIntervals.length - 1);
    const daysToAdd = Math.round(baseIntervals[intervalIndex] * multiplier);
    
    const nextReview = new Date(baseDate);
    nextReview.setDate(nextReview.getDate() + daysToAdd);
    
    return nextReview;
  }
  
  // Calculate retention percentage based on forgetting curve
  function calculateRetentionPercentage(
    lastReviewedAt: Date | null,
    nextReviewAt: Date,
    firstLearnedAt: Date
  ): number {
    const now = new Date();
    const startDate = lastReviewedAt || firstLearnedAt;
    
    // Time elapsed since last review
    const timeElapsed = now.getTime() - startDate.getTime();
    // Total interval between reviews
    const totalInterval = nextReviewAt.getTime() - startDate.getTime();
    
    if (totalInterval <= 0) return 100;
    
    // Ebbinghaus forgetting curve: R = e^(-t/S)
    // Simplified: retention decreases exponentially over time
    const decay = timeElapsed / totalInterval;
    const retention = Math.max(0, Math.min(100, 100 * Math.exp(-decay * 2)));
    
    return Math.round(retention);
  }
  
  // POST /api/topics/learn - Record a learned topic
  app.post("/api/topics/learn", isAuthenticated, async (req, res) => {
    try {
      const userId = getRequestUserId(req);
      const { topic, difficulty } = learnTopicRequestSchema.parse(req.body);
      
      // Check if topic already exists for this user
      const existing = await storage.getLearnedTopicByName(userId, topic);
      
      if (existing) {
        return res.status(200).json({ 
          message: "Topic already learned",
          topic: existing 
        });
      }
      
      // Calculate first review date (1 day for medium, adjusted by difficulty)
      const nextReviewAt = calculateNextReviewDate(0, difficulty);
      
      const learnedTopic = await storage.createLearnedTopic({
        userId,
        topic,
        difficulty,
        reviewCount: 0,
        nextReviewAt,
        status: "pending",
      });
      
      res.json(learnedTopic);
    } catch (error) {
      console.error("Error recording learned topic:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid request data" });
      }
      res.status(500).json({ error: "Failed to record learned topic" });
    }
  });
  
  // GET /api/revision - Get revision schedule with retention percentages
  app.get("/api/revision", isAuthenticated, async (req, res) => {
    try {
      const userId = getRequestUserId(req);
      const topics = await storage.getUserLearnedTopics(userId);
      const now = new Date();
      
      // Process topics and calculate retention
      const processedTopics: RevisionItem[] = topics.map(topic => {
        const nextReviewDate = new Date(topic.nextReviewAt);
        const isOverdue = nextReviewDate < now;
        
        // Calculate retention percentage
        const retentionPercentage = calculateRetentionPercentage(
          topic.lastReviewedAt,
          nextReviewDate,
          topic.firstLearnedAt ? new Date(topic.firstLearnedAt) : now
        );
        
        // Calculate days until review (negative if overdue)
        const daysUntilReview = Math.ceil(
          (nextReviewDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        );
        
        // Update status if needed
        const status = isOverdue ? "overdue" : topic.status;
        
        return {
          id: topic.id,
          topic: topic.topic,
          difficulty: topic.difficulty as DifficultyLevel,
          firstLearnedAt: topic.firstLearnedAt ? topic.firstLearnedAt.toISOString() : now.toISOString(),
          lastReviewedAt: topic.lastReviewedAt?.toISOString() || null,
          reviewCount: topic.reviewCount,
          nextReviewAt: nextReviewDate.toISOString(),
          status: status as any,
          retentionPercentage,
          daysUntilReview,
        };
      });
      
      // Update overdue statuses in database (async)
      const overdueIds = processedTopics
        .filter(t => t.status === "overdue" && t.daysUntilReview < 0)
        .map(t => t.id);
      
      if (overdueIds.length > 0) {
        storage.markTopicsAsOverdue(overdueIds).catch(err => 
          console.error("Failed to update overdue status:", err)
        );
      }
      
      // Split into upcoming and overdue
      const overdue = processedTopics.filter(t => t.status === "overdue");
      const upcoming = processedTopics
        .filter(t => t.status !== "overdue")
        .sort((a, b) => a.daysUntilReview - b.daysUntilReview);
      
      res.json({ upcoming, overdue });
    } catch (error) {
      console.error("Error fetching revision schedule:", error);
      res.status(500).json({ error: "Failed to fetch revision schedule" });
    }
  });
  
  // POST /api/revision/:id/complete - Mark revision as completed
  app.post("/api/revision/:id/complete", isAuthenticated, async (req, res) => {
    try {
      const userId = getRequestUserId(req);
      const topicId = parseInt(req.params.id);
      
      if (isNaN(topicId)) {
        return res.status(400).json({ error: "Invalid topic ID" });
      }
      
      const topic = await storage.getLearnedTopicById(topicId, userId);
      
      if (!topic) {
        return res.status(404).json({ error: "Topic not found" });
      }
      
      // Calculate next review date
      const newReviewCount = topic.reviewCount + 1;
      const nextReviewAt = calculateNextReviewDate(
        newReviewCount,
        topic.difficulty as DifficultyLevel,
        new Date()
      );
      
      const updated = await storage.completeRevision(topicId, userId, {
        lastReviewedAt: new Date(),
        reviewCount: newReviewCount,
        nextReviewAt,
        status: "pending",
      });
      
      res.json(updated);
    } catch (error) {
      console.error("Error completing revision:", error);
      res.status(500).json({ error: "Failed to complete revision" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
