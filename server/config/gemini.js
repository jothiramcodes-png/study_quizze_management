const { GoogleGenerativeAI } = require('@google/generative-ai');
let genAI = null;
function getGeminiClient() {
  if (!genAI) {
    if (!process.env.GEMINI_API_KEY) throw new Error('GEMINI_API_KEY missing');
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  }
  return genAI;
}
module.exports = { getGeminiClient };