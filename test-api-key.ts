import { GoogleGenerativeAI } from "@google/generative-ai";

// Test the exact API key from .env file
const API_KEY = "AIzaSyDNZmpca7NC77mq-JEGJgRXesDinjnkxZ8";

console.log("Testing Gemini API Key...");
console.log("API Key:", API_KEY.substring(0, 10) + "...");

const genAI = new GoogleGenerativeAI(API_KEY);

async function testAPI() {
  try {
    // Test with the most basic model name
    console.log("Testing with model: gemini-1.5-flash");
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    const result = await model.generateContent("Hello, explain what is biology in one sentence.");
    const response = result.response;
    const text = response.text();
    
    console.log("✅ SUCCESS! Gemini API is working:");
    console.log(text);
    return true;
    
  } catch (error: any) {
    console.error("❌ FAILED with gemini-1.5-flash:", error.message);
    
    // Try alternative model names
    const models = [
      "gemini-1.5-pro",
      "gemini-pro",
      "gemini-1.0-pro",
      "gemini-1.0-pro-latest",
      "gemini-pro-latest",
      "gemini-1.5-flash-8b",
      "gemini-1.5-flash-002"
    ];
    
    for (const modelName of models) {
      try {
        console.log(`Trying model: ${modelName}`);
        const model = genAI.getGenerativeModel({ model: modelName });
        
        const result = await model.generateContent("Hello, explain what is biology in one sentence.");
        const response = result.response;
        const text = response.text();
        
        console.log(`✅ SUCCESS with ${modelName}:`);
        console.log(text);
        return modelName;
        
      } catch (modelError: any) {
        console.log(`❌ FAILED with ${modelName}:`, modelError.message);
      }
    }
    
    return false;
  }
}

testAPI().then(success => {
  if (success) {
    console.log("🎉 API Key is working! Model found:", success);
  } else {
    console.log("❌ API Key is not working or no valid models found");
    console.log("Please check:");
    console.log("1. API Key is correct");
    console.log("2. Gemini API is enabled");
    console.log("3. Account has proper permissions");
  }
});
