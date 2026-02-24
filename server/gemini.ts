import { GoogleGenerativeAI } from "@google/generative-ai";
import { OpenAI } from "openai";

// DON'T DELETE THIS COMMENT
// Follow these instructions when using this blueprint:
// - Note that the newest Gemini model series is "gemini-2.5-flash" or "gemini-2.5-pro"
//   - do not change this unless explicitly requested by the user

// This API key is from Gemini Developer API Key, not vertex AI API Key
export const gemini = new GoogleGenerativeAI({ 
  apiKey: process.env.GEMINI_API_KEY || "",
  model: "gemini-2.5-flash",
});

// OpenAI configuration
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "",
});

// Test function to verify API is working
export async function testGeminiAPI() {
  try {
    const response = await gemini.model.generateContent({
      model: "gemini-2.5-flash",
      contents: "Test message",
    });
    console.log('Gemini test response:', response);
    return response.text;
  } catch (error) {
    console.error('Gemini test error:', error);
    return error.message;
  }
}

// Export both APIs
export { gemini, openai };
