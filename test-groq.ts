import { Groq } from "groq-sdk";

// Test Groq API directly
const groq = new Groq({
  
});

async function testGroq() {
  try {
    console.log("Testing Groq API...");
    
    const response = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content: "You are StudyBot, an AI tutor for college students. Provide clear, engaging explanations with practical examples."
        },
        {
          role: "user",
          content: "Explain biology in simple terms, include 3-5 bullet points, one real-world example, and one short quiz question at the end. Make it engaging and educational."
        }
      ],
      max_tokens: 1000,
      temperature: 0.7,
    });
    
    const text = response.choices[0]?.message?.content;
    
    console.log("✅ Groq API SUCCESS!");
    console.log(text);
    return true;
    
  } catch (error: any) {
    console.error("❌ Groq API FAILED:", error.message);
    return false;
  }
}

testGroq();
