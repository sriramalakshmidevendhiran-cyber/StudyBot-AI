import { GoogleGenerativeAI } from "@google/generative-ai";

// Test Gemini API directly
const genAI = new GoogleGenerativeAI("AIzaSyDNZmpca7NC77mq-JEGJgRXesDinjnkxZ8");

async function testGemini() {
  try {
    console.log("Testing Gemini API...");
    
    // Try different models
    const models = ["gemini-1.5-flash", "gemini-1.5-pro", "gemini-pro"];
    
    for (const modelName of models) {
      try {
        console.log(`Trying model: ${modelName}`);
        const model = genAI.getGenerativeModel({ model: modelName });
        
        const result = await model.generateContent("Hello, can you explain what biology is in one sentence?");
        const response = result.response;
        const text = response.text();
        
        console.log(`✅ Success with ${modelName}:`);
        console.log(text);
        return;
        
      } catch (error: any) {
        console.log(`❌ Failed with ${modelName}:`, error.message);
      }
    }
    
  } catch (error: any) {
    console.error("Gemini API test failed:", error);
  }
}

testGemini();
