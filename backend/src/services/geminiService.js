import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Generate roadmap belajar berdasarkan gap skills.
 * @param {string} targetRole - Nama role target
 * @param {Array} gapSkills - Array of { name, category }
 * @returns {Object} roadmap dari Gemini
 */
export const generateRoadmap = async (targetRole, gapSkills) => {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const skillList = gapSkills.map((s) => `- ${s.name} (${s.category})`).join('\n');

    const prompt = `
Kamu adalah career advisor yang ahli di bidang teknologi dan pengembangan karir.

User ingin menjadi **${targetRole}** dan memiliki skill gap berikut yang perlu dipelajari:
${skillList}

Buatkan roadmap belajar yang terstruktur dalam format JSON dengan struktur berikut:
{
  "summary": "Ringkasan roadmap dalam 2-3 kalimat",
  "estimatedDuration": "estimasi total waktu belajar (contoh: 3-6 bulan)",
  "phases": [
    {
      "phase": 1,
      "title": "Judul fase",
      "duration": "estimasi durasi fase ini",
      "skills": ["skill1", "skill2"],
      "resources": [
        {
          "title": "Nama resource",
          "type": "video/artikel/kursus/dokumentasi",
          "url": "URL resource gratis",
          "platform": "YouTube/Coursera/MDN/dll"
        }
      ]
    }
  ]
}

Pastikan:
- Urutkan dari skill fundamental ke advanced
- Rekomendasikan HANYA resource gratis
- Berikan 2-3 resource per fase
- Jawab HANYA dengan JSON valid, tanpa teks tambahan
`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    // Clean up markdown code block jika ada
    const cleanJson = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    try {
        return JSON.parse(cleanJson);
    } catch {
        // Jika parse gagal, return raw text dalam object
        return { raw: text, parseError: true };
    }
};
