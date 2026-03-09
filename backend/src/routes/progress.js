import { Router } from 'express';
import authGuard from '../middleware/authGuard.js';
import supabase from '../services/supabaseClient.js';
import { calculateReadinessScore } from '../services/gapAnalysis.js';

const router = Router();

/**
 * Helper: update readiness score ketika progress berubah
 */
const refreshReadinessScore = async (userId) => {
    const { data: profile } = await supabase
        .from('profiles')
        .select('target_role_id')
        .eq('id', userId)
        .single();

    if (profile?.target_role_id) {
        const { score } = await calculateReadinessScore(userId, profile.target_role_id);
        await supabase
            .from('profiles')
            .update({ readiness_score: score, updated_at: new Date().toISOString() })
            .eq('id', userId);
        return score;
    }
    return null;
};

/**
 * GET /api/progress
 * Ambil semua progress belajar user
 */
router.get('/', authGuard, async (req, res, next) => {
    try {
        const { data, error } = await supabase
            .from('user_progress')
            .select('*, skills(id, name, category)')
            .eq('user_id', req.user.id)
            .order('created_at');

        if (error) throw error;

        res.json({ progress: data });
    } catch (err) {
        next(err);
    }
});

/**
 * POST /api/progress/:skill_id
 * Mulai belajar skill (status: learning)
 */
router.post('/:skill_id', authGuard, async (req, res, next) => {
    try {
        const { skill_id } = req.params;

        // Cek apakah sudah ada
        const { data: existing } = await supabase
            .from('user_progress')
            .select('id')
            .eq('user_id', req.user.id)
            .eq('skill_id', skill_id)
            .single();

        if (existing) {
            return res.status(409).json({ error: 'Progress untuk skill ini sudah ada.' });
        }

        const { data, error } = await supabase
            .from('user_progress')
            .insert({ user_id: req.user.id, skill_id, status: 'learning' })
            .select('*, skills(id, name, category)')
            .single();

        if (error) throw error;

        res.status(201).json({ progress: data });
    } catch (err) {
        next(err);
    }
});

/**
 * PUT /api/progress/:skill_id
 * Update status progress (learning → completed)
 * Body: { status: "learning" | "completed" }
 */
router.put('/:skill_id', authGuard, async (req, res, next) => {
    try {
        const { skill_id } = req.params;
        const { status } = req.body;

        if (!['learning', 'completed'].includes(status)) {
            return res.status(400).json({ error: 'Status harus "learning" atau "completed"' });
        }

        const updateData = {
            status,
            completed_at: status === 'completed' ? new Date().toISOString() : null,
        };

        const { data, error } = await supabase
            .from('user_progress')
            .update(updateData)
            .eq('user_id', req.user.id)
            .eq('skill_id', skill_id)
            .select('*, skills(id, name, category)')
            .single();

        if (error) throw error;

        // Update readiness score otomatis
        const newScore = await refreshReadinessScore(req.user.id);

        res.json({ progress: data, readinessScore: newScore });
    } catch (err) {
        next(err);
    }
});

/**
 * DELETE /api/progress/:skill_id
 * Hapus progress skill
 */
router.delete('/:skill_id', authGuard, async (req, res, next) => {
    try {
        const { skill_id } = req.params;

        const { error } = await supabase
            .from('user_progress')
            .delete()
            .eq('user_id', req.user.id)
            .eq('skill_id', skill_id);

        if (error) throw error;

        const newScore = await refreshReadinessScore(req.user.id);

        res.json({ message: 'Progress deleted', readinessScore: newScore });
    } catch (err) {
        next(err);
    }
});

export default router;
