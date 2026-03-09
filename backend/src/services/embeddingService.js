import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Convert teks menjadi vector embedding menggunakan Gemini text-embedding-004.
 * Output: array of 768 floats
 *
 * @param {string} text - Teks yang akan di-embed
 * @param {string} taskType - Tipe task untuk optimasi embedding
 *   - "RETRIEVAL_DOCUMENT" → untuk dokumen yang akan disimpan di DB
 *   - "RETRIEVAL_QUERY"    → untuk query saat searching
 * @returns {number[]} vector embedding 768 dimensi
 */
export const embedText = async (text, taskType = 'RETRIEVAL_QUERY') => {
    const model = genAI.getGenerativeModel({ model: 'text-embedding-004' });

    const result = await model.embedContent({
        content: { parts: [{ text }], role: 'user' },
        taskType,
    });

    return result.embedding.values; // array of 768 floats
};

/**
 * Batch embed multiple texts (lebih efisien untuk seeding)
 * @param {string[]} texts
 * @param {string} taskType
 * @returns {number[][]}
 */
export const batchEmbedTexts = async (texts, taskType = 'RETRIEVAL_DOCUMENT') => {
    const model = genAI.getGenerativeModel({ model: 'text-embedding-004' });

    const embeddings = [];
    // Process satu per satu untuk hindari rate limit
    for (const text of texts) {
        const result = await model.embedContent({
            content: { parts: [{ text }], role: 'user' },
            taskType,
        });
        embeddings.push(result.embedding.values);
    }

    return embeddings;
};
