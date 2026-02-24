import express from "express";
import { z } from "zod";

// Simple working version with enhanced demos
const app = express();

import express from "express";
import cors from "cors";

const app = express();

// Add CORS middleware
app.use(cors({
  origin: ['http://localhost:5001', 'http://localhost:5002', 'http://localhost:5003', 'http://localhost:5004'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
}));

// Add body parsing middleware
app.use(express.json({ limit: '10mb' }));

// Enhanced demo explanation function
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

// AI Tutor endpoint
app.post("/api/tutor", async (req, res) => {
  try {
    let body = req.body;
    
    // Handle different content types
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch (e) {
        body = null;
      }
    }
    
    console.log('Request body:', body);
    
    // Simple validation
    if (!body || !body.topic) {
      return res.status(400).json({ 
        error: "Invalid request. Please provide a topic." 
      });
    }
    
    const enhancedDemo = getEnhancedDemoExplanation(body.topic, body.mood);
    return res.json({ result: enhancedDemo });
  } catch (err: any) {
    console.error("Tutor error:", err);
    res.status(500).json({ 
      error: "Failed to get explanation. Please try again." 
    });
  }
});

// AI Quiz endpoint
app.post("/api/quiz", async (req, res) => {
  try {
    const { topic } = z.object({
      topic: z.string().min(1)
    }).parse(req.body);
    
    const enhancedDemo = `Here is your quiz on ${topic}!

**Question 1:** What is the main purpose of ${topic}?
**Question 2:** How does ${topic} relate to your daily life?
**Question 3:** What would happen if ${topic} didn't exist?

Choose the best answer and see how well you understand ${topic}!`;
    
    return res.json({ result: enhancedDemo });
  } catch (err: any) {
    console.error("Quiz error:", err);
    res.status(500).json({ 
      error: "Failed to generate quiz. Please try again." 
    });
  }
});

// AI Plan endpoint
app.post("/api/plan", async (req, res) => {
  try {
    const { subject } = z.object({
      subject: z.string().min(1)
    }).parse(req.body);
    
    const enhancedDemoPlan = Array.from({ length: 5 }).map((_, idx) => ({
      day: `Day ${idx + 1}`,
      topics: [
        `${subject} fundamentals and core concepts`,
        `${subject} practical applications and case studies`
      ],
    }));
    
    return res.json({
      result: JSON.stringify({ plan: enhancedDemoPlan }),
      plan: enhancedDemoPlan,
      subject,
      days: 5
    });
  } catch (err: any) {
    console.error("Plan error:", err);
    res.status(500).json({ 
      error: "Failed to create study plan. Please try again." 
    });
  }
});

// Revision endpoint
app.get("/api/revision", async (req, res) => {
  try {
    return res.json({
      upcoming: [],
      overdue: []
    });
  } catch (err: any) {
    console.error("Revision error:", err);
    res.status(500).json({ 
      error: "Failed to get revision data. Please try again." 
    });
  }
});

const PORT = process.env.PORT || 5003;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Open http://localhost:${PORT} in your browser`);
});
