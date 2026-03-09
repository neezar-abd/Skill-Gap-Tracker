import { Router } from 'express';
import authGuard from '../middleware/authGuard.js';

const router = Router();

/**
 * GET /api/auth/me
 * Return user yang sedang login (dari JWT yang sudah diverifikasi authGuard)
 */
router.get('/me', authGuard, (req, res) => {
    res.json({ user: req.user });
});

/**
 * POST /api/auth/logout
 * Frontend yang handle logout via Supabase JS SDK.
 * Endpoint ini hanya sebagai acknowledgment.
 */
router.post('/logout', authGuard, (req, res) => {
    res.json({ message: 'Logged out successfully' });
});

export default router;
