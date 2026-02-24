import { GoogleGenerativeAI } from "@google/generative-ai";

// List available Gemini models
const genAI = new GoogleGenerativeAI("AIzaSyDNZmpca7NC77mq-JEGJgRXesDinjnkxZ8");

async function listModels() {
  try {
    console.log("Listing available Gemini models...");
    
    // Try to get available models
    const models = await genAI.listModels();
    console.log("Available models:");
    models.forEach(model => {
      console.log(`- ${model.name} (supported methods: ${model.supportedGenerationMethods?.join(', ')})`);
    });
    
  } catch (error: any) {
    console.error("Failed to list models:", error);
    
    // Try some common model names
    const commonModels = [
      "gemini-1.0-pro",
      "gemini-1.0-pro-latest",
      "gemini-1.0-pro-vision",
      "gemini-pro-vision",
      "text-bison-001",
      "chat-bison-001"
    ];
    
    console.log("\nTrying common model names...");
    
    for (const modelName of commonModels) {
      try {
        console.log(`Trying model: ${modelName}`);
        const model = genAI.getGenerativeModel({ model: modelName });
        
        const result = await model.generateContent("Hello, explain biology in one sentence.");
        const response = result.response;
        const text = response.text();
        
        console.log(`✅ Success with ${modelName}:`);
        console.log(text);
        return;
        
      } catch (error: any) {
        console.log(`❌ Failed with ${modelName}:`, error.message);
      }
    }
  }
}

listModels();
