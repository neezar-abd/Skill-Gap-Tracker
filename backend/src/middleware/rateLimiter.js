import rateLimit from 'express-rate-limit';

// 1. Global Limiter: Untuk semua request mampir kesini (Mencegah DDoS dasar)
// Maksimal 100 request per 15 menit per IP
export const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, 
    max: 100, 
    message: { error: 'Terlalu banyak request dari IP ini, silakan coba lagi setelah 15 menit.' },
    standardHeaders: true, 
    legacyHeaders: false, 
});

// 2. AI Limiter: Khusus untuk endpoint yang manggil Gemini API (Cost Control)
// Maksimal 5x generate roadmap per jam per IP
export const aiLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 Jam
    max: 5, 
    message: { error: 'Limit fitur AI tercapai (Maks 5x/jam). Silakan gunakan roadmap yang sudah ada atau coba lagi nanti.' },
    standardHeaders: true,
    legacyHeaders: false,
});