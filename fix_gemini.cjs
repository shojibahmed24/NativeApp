const fs = require('fs');
const file = '../server/src/services/providers/llm/GeminiLLMProvider.js';
let content = fs.readFileSync(file, 'utf8');

const newMethod = `
  async generateSummary(prompt) {
    if (!this.model) throw new Error('Gemini API key missing.');
    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      return response.text().trim();
    } catch (err) {
      console.error('Gemini summary error:', err);
      return null;
    }
  }
}
`;

content = content.replace(/}\s*$/, newMethod);
fs.writeFileSync(file, content);
console.log('Added generateSummary to Gemini');

const aiServiceFile = '../server/src/services/aiTranslationService.js';
let aiContent = fs.readFileSync(aiServiceFile, 'utf8');
aiContent = aiContent.replace(/const summary = await geminiLLM\.translate\(prompt, 'en', 'en', \[\]\);/, 'const summary = await geminiLLM.generateSummary(prompt);');
fs.writeFileSync(aiServiceFile, aiContent);
console.log('Fixed aiTranslationService');
