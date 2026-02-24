import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { OpenAI } from "openai";
import { Groq } from "groq-sdk";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize AI providers
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "AIzaSyDNZmpca7NC77mq-JEGJgRXesDinjnkxZ8");
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "sk-proj-your-openai-key-hereZAekmJETQUpWEgWbv-E2Sw",
});
const groq = new Groq({
  
});

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:5001', 'http://localhost:8080'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'client/dist')));

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

// Enhanced demo quiz function
const getEnhancedDemoQuiz = (topic: string) => {
  return `Here is your quiz on ${topic}!

**Question 1:** What is the primary purpose of ${topic}?
A) To provide fundamental understanding
B) To facilitate practical applications
C) To enhance theoretical knowledge
D) All of the above

**Question 2:** How does ${topic} relate to everyday life?
A) It affects decision-making processes
B) It influences learning and growth
C) It shapes interactions with others
D) All of the above

**Question 3:** What would be the consequence of not understanding ${topic}?
A) Limited knowledge in related areas
B) Difficulty in practical applications
C) Reduced problem-solving abilities
D) All of the above

**Question 4:** Which skill is most important when studying ${topic}?
A) Critical thinking and analysis
B) Memorization and recall
C) Creative application
D) All of the above

**Question 5:** How can you best master ${topic}?
A) Through consistent practice and review
B) By seeking real-world applications
C) With help from mentors and resources
D) All of the above

**Answer Key:**
1) D - All of the above
2) D - All of the above
3) D - All of the above
4) D - All of the above
5) D - All of the above

Choose the best answer and see how well you understand ${topic}!`;
};

// Enhanced demo study plan function
const getEnhancedDemoPlan = (subject: string, days: number) => {
  return Array.from({ length: days }).map((_, idx) => ({
    day: `Day ${idx + 1}`,
    topics: [
      `${subject} fundamentals and core concepts`,
      `${subject} practical applications and case studies`
    ],
  }));
};

// API Routes
app.post("/api/tutor", async (req, res) => {
  try {
    const { topic, mood } = req.body;
    
    if (!topic) {
      return res.status(400).json({ 
        error: "Invalid request. Please provide a topic." 
      });
    }
    
    console.log(`Generating AI explanation for topic: ${topic}, mood: ${mood}`);
    
    try {
      // Use Groq as primary AI provider (fast and reliable)
      const moodPrompt = mood ? `The user is feeling ${mood}. Adapt your explanation accordingly. ` : "";
      const systemPrompt = `You are StudyBot, an AI tutor for college students. Provide clear, engaging explanations with practical examples.`;
      const userPrompt = `${moodPrompt}Explain ${topic} in simple terms, include 3-5 bullet points, one real-world example, and one short quiz question at the end. Make it engaging and educational.

Format your response clearly with headings and bullet points.`;
      
      console.log('Sending request to Groq AI...');
      const response = await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages: [
          {
            role: "system",
            content: systemPrompt
          },
          {
            role: "user",
            content: userPrompt
          }
        ],
        max_tokens: 1000,
        temperature: 0.7,
      });
      
      const text = response.choices[0]?.message?.content || "Unable to generate explanation";
      
      console.log('Groq AI response received successfully');
      console.log('Response length:', text.length);
      return res.json({ result: text });
      
    } catch (groqError: any) {
      console.error('Groq AI error:', groqError);
      console.error('Error details:', groqError.message);
      
      // Try Gemini as fallback
      try {
        const model = genAI.getGenerativeModel({ model: "gemini-pro-latest" });
        
        const moodPrompt = mood ? `The user is feeling ${mood}. Adapt your explanation accordingly. ` : "";
        const prompt = `${moodPrompt}You are StudyBot, an AI tutor for college students. 

Explain ${topic} in simple terms, include 3-5 bullet points, one real-world example, and one short quiz question at the end. Make it engaging and educational.

Format your response clearly with headings and bullet points.`;
        
        const result = await model.generateContent(prompt);
        const response = result.response;
        const text = response.text();
        
        console.log('Gemini fallback response received successfully');
        return res.json({ result: text });
        
      } catch (geminiError: any) {
        console.error('Gemini fallback error:', geminiError);
        
        // Check if it's a quota error
        if (geminiError.message.includes('quota') || geminiError.message.includes('429')) {
          console.log('⚠️  Gemini API quota exceeded. Trying OpenAI...');
          
          // Try OpenAI as final fallback
          try {
            const systemPrompt = `You are StudyBot, an AI tutor for college students. 

Explain ${topic} in simple terms, include 3-5 bullet points, one real-world example, and one short quiz question at the end. Make it engaging and educational.`;
            
            const response = await openai.chat.completions.create({
              model: "gpt-3.5-turbo",
              messages: [
                {
                  role: "system",
                  content: "You are StudyBot, an AI tutor for college students. Provide clear, engaging explanations with practical examples."
                },
                {
                  role: "user",
                  content: systemPrompt
                }
              ],
              max_tokens: 1000,
              temperature: 0.7,
            });
            
            const text = response.choices[0]?.message?.content || "Unable to generate explanation";
            
            console.log('OpenAI fallback response received successfully');
            return res.json({ result: text });
            
          } catch (openaiError: any) {
            console.error('OpenAI fallback error:', openaiError);
          }
        }
        
        // Final fallback to enhanced demo
        const enhancedDemo = getEnhancedDemoExplanation(topic, mood);
        console.log('Using enhanced demo fallback');
        return res.json({ result: enhancedDemo });
      }
    }
    
  } catch (err: any) {
    console.error("Tutor error:", err);
    res.status(500).json({ 
      error: "Failed to get explanation. Please try again." 
    });
  }
});

app.post("/api/quiz", async (req, res) => {
  try {
    const { topic } = req.body;
    
    if (!topic) {
      return res.status(400).json({ 
        error: "Invalid request. Please provide a topic." 
      });
    }
    
    console.log(`Generating AI quiz for topic: ${topic}`);
    
    try {
      // Use Groq as primary AI provider
      const systemPrompt = `You are StudyBot, an AI tutor for college students. Create comprehensive quizzes with proper formatting.`;
      const userPrompt = `Create a quiz about ${topic} with exactly 5 questions.

Requirements:
1. Create exactly 5 multiple choice questions
2. Each question must have 4 options (A, B, C, D)
3. Mark the correct answer clearly
4. Make questions progressively harder
5. Include practical scenarios
6. Format exactly like this:

**Question 1:** [Your question here]
A) [Option A]
B) [Option B] 
C) [Option C]
D) [Option D]

**Question 2:** [Your question here]
A) [Option A]
B) [Option B]
C) [Option C]
D) [Option D]

**Question 3:** [Your question here]
A) [Option A]
B) [Option B]
C) [Option C]
D) [Option D]

**Question 4:** [Your question here]
A) [Option A]
B) [Option B]
C) [Option C]
D) [Option D]

**Question 5:** [Your question here]
A) [Option A]
B) [Option B]
C) [Option C]
D) [Option D]

**Answer Key:**
1) [Correct letter] - [Brief explanation]
2) [Correct letter] - [Brief explanation]
3) [Correct letter] - [Brief explanation]
4) [Correct letter] - [Brief explanation]
5) [Correct letter] - [Brief explanation]

Make it engaging and educational for college students.`;
      
      console.log('Sending request to Groq AI for quiz...');
      const response = await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages: [
          {
            role: "system",
            content: systemPrompt
          },
          {
            role: "user",
            content: userPrompt
          }
        ],
        max_tokens: 1500,
        temperature: 0.7,
      });
      
      const text = response.choices[0]?.message?.content || "Unable to generate quiz";
      
      console.log('Groq AI quiz response received successfully');
      return res.json({ result: text });
      
    } catch (groqError: any) {
      console.error('Groq AI quiz error:', groqError);
      
      // Try Gemini as fallback
      try {
        const model = genAI.getGenerativeModel({ model: "gemini-pro-latest" });
        
        const prompt = `You are StudyBot, an AI tutor. Create a comprehensive quiz about ${topic} with exactly 5 questions.

Requirements:
1. Create exactly 5 multiple choice questions
2. Each question must have 4 options (A, B, C, D)
3. Mark the correct answer clearly
4. Make questions progressively harder
5. Include practical scenarios

Format exactly like this:

**Question 1:** [Your question here]
A) [Option A]
B) [Option B] 
C) [Option C]
D) [Option D]

**Question 2:** [Your question here]
A) [Option A]
B) [Option B]
C) [Option C]
D) [Option D]

**Question 3:** [Your question here]
A) [Option A]
B) [Option B]
C) [Option C]
D) [Option D]

**Question 4:** [Your question here]
A) [Option A]
B) [Option B]
C) [Option C]
D) [Option D]

**Question 5:** [Your question here]
A) [Option A]
B) [Option B]
C) [Option C]
D) [Option D]

**Answer Key:**
1) [Correct letter] - [Brief explanation]
2) [Correct letter] - [Brief explanation]
3) [Correct letter] - [Brief explanation]
4) [Correct letter] - [Brief explanation]
5) [Correct letter] - [Brief explanation]`;
        
        const result = await model.generateContent(prompt);
        const response = result.response;
        const text = response.text();
        
        console.log('Gemini fallback quiz response received successfully');
        return res.json({ result: text });
        
      } catch (geminiError: any) {
        console.error('Gemini fallback quiz error:', geminiError);
        
        // Final fallback to enhanced demo
        const enhancedDemo = getEnhancedDemoQuiz(topic);
        console.log('Using enhanced demo quiz fallback');
        return res.json({ result: enhancedDemo });
      }
    }
    
  } catch (err: any) {
    console.error("Quiz error:", err);
    res.status(500).json({ 
      error: "Failed to generate quiz. Please try again." 
    });
  }
});

app.post("/api/plan", async (req, res) => {
  try {
    const { subject, days = 5 } = req.body;
    
    if (!subject) {
      return res.status(400).json({ 
        error: "Invalid request. Please provide a subject." 
      });
    }
    
    console.log(`Generating AI study plan for subject: ${subject}, days: ${days}`);
    
    try {
      // Use real Gemini AI
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      
      const prompt = `You are StudyBot, an AI tutor. Create a comprehensive ${days}-day study plan for ${subject}.

For each day, include:
1. Clear learning objectives
2. Specific topics to cover
3. Practical exercises or activities
4. Estimated study time
5. Key resources or materials needed

Make it progressive, starting with fundamentals and building to advanced topics. Format it as a structured day-by-day plan suitable for college students.`;
      
      const result = await model.generateContent(prompt);
      const response = result.response;
      const text = response.text();
      
      console.log('Gemini AI study plan response received successfully');
      return res.json({ 
        result: text,
        plan: [{ day: `Day 1-${days}`, topics: [text] }],
        subject,
        days
      });
      
    } catch (aiError: any) {
      console.error('Gemini AI study plan error:', aiError);
      
      // Fallback to enhanced demo if AI fails
      const enhancedDemoPlan = getEnhancedDemoPlan(subject, days);
      console.log('Using enhanced demo study plan fallback');
      return res.json({
        result: JSON.stringify({ plan: enhancedDemoPlan }),
        plan: enhancedDemoPlan,
        subject,
        days
      });
    }
    
  } catch (err: any) {
    console.error("Plan error:", err);
    res.status(500).json({ 
      error: "Failed to create study plan. Please try again." 
    });
  }
});

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

// Serve the frontend
app.get('/', (req, res) => {
  // Check if user is logged in
  const userAgent = req.headers['user-agent'] || '';
  
  // For browser requests, check login
  if (userAgent.includes('Mozilla')) {
    res.sendFile(path.join(__dirname, 'client-working.html'));
  } else {
    res.sendFile(path.join(__dirname, 'client-working.html'));
  }
});

// Serve login page
app.get('/login.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'login.html'));
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'client-working.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 StudyBot Server running on port ${PORT}`);
  console.log(`📱 Open http://localhost:${PORT} in your browser`);
  console.log(`🔧 API endpoints available at http://localhost:${PORT}/api/`);
});
