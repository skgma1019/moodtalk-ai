import 'dotenv/config';
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

async function main() {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: '간단한 자기소개를 한국어로 3문장 해줘.',
    });

    console.log('응답:');
    console.log(response.text);
  } catch (error) {
    console.error('에러 발생:');
    console.error(error);
  }
}

main();
