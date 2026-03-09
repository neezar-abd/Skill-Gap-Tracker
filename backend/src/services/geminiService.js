import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
import { searchSimilarRequirements } from './vectorSearch.js';

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Generate roadmap belajar dengan RAG:
 * 1. Retrieve job requirements yang relevan via pgvector similarity search
 * 2. Inject sebagai context ke prompt Gemini
 * 3. Gemini generate roadmap berdasarkan data nyata dari market
 *
 * @param {string} targetRole - Nama role target (contoh: "Frontend Developer")
 * @param {string} targetRoleId - UUID role target (untuk vector search)
 * @param {Array} gapSkills - Array of { name, category } yang perlu dipelajari
 * @returns {Object} roadmap dari Gemini dalam format JSON
 */
export const generateRoadmap = async (targetRole, targetRoleId, gapSkills) => {
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

  const skillList = gapSkills.map((s) => `- ${s.name} (${s.category})`).join('\n');

  // ── Step 1: RAG — Retrieve relevant job requirements ─────────────────────
  let ragContext = '';
  try {
    const queryText = `${targetRole} skill requirements: ${gapSkills.map((s) => s.name).join(', ')}`;
    const similarDocs = await searchSimilarRequirements(queryText, targetRoleId, 5, 0.4);

    if (similarDocs.length > 0) {
      const contextSnippets = similarDocs
        .map(
          (doc, i) =>
            `[Job Posting ${i + 1}] ${doc.title} (Source: ${doc.source}, Similarity: ${(doc.similarity * 100).toFixed(0)}%)\n${doc.content}`
        )
        .join('\n\n---\n\n');

      ragContext = `
## Referensi Job Requirements dari Pasar Kerja Aktual
Berikut adalah contoh job posting nyata untuk posisi ${targetRole} yang telah dikumpulkan dari berbagai platform:

${contextSnippets}

---
`;
    }
  } catch (err) {
    // Jika RAG gagal, tetap lanjut tanpa context (graceful degradation)
    console.warn('[RAG] Vector search failed, generating without context:', err.message);
  }

  // ── Step 2: Build prompt dengan RAG context ──────────────────────────────
  const prompt = `
Kamu adalah career advisor yang ahli di bidang teknologi dan pengembangan karir.

${ragContext}

User ingin menjadi **${targetRole}** dan memiliki skill gap berikut yang perlu dipelajari:
${skillList}

Berdasarkan referensi job requirements di atas (jika ada) dan pengetahuanmu, buatkan roadmap belajar yang terstruktur dan realistis dalam format JSON:

{
  "summary": "Ringkasan roadmap dalam 2-3 kalimat, sebutkan insight dari job market",
  "estimatedDuration": "estimasi total waktu belajar",
  "marketInsight": "1-2 kalimat tentang trend/demand skill ini di pasar kerja",
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
- Sesuaikan dengan kebutuhan pasar berdasarkan job requirements yang diberikan
- Rekomendasikan HANYA resource gratis
- Berikan 2-3 resource per fase
- Field "marketInsight" wajib diisi berdasarkan referensi job posting
- Jawab HANYA dengan JSON valid, tanpa teks tambahan
`;

  // ── Step 3: Generate dengan Gemini ───────────────────────────────────────
  const result = await model.generateContent(prompt);
  const text = result.response.text();

  // Clean markdown code block jika ada
  const cleanJson = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

  try {
    return JSON.parse(cleanJson);
  } catch {
    return { raw: text, parseError: true };
  }
};
