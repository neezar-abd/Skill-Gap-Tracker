import { Router } from 'express';
import authGuard from '../middleware/authGuard.js';
import supabase from '../services/supabaseClient.js';
import { calculateReadinessScore } from '../services/gapAnalysis.js';

const router = Router();

/**
 * GET /api/profile
 * Ambil profil user + readiness score
 */
router.get('/', authGuard, async (req, res, next) => {
    try {
        const { data: profile, error } = await supabase
            .from('profiles')
            .select('*, job_roles(name, description)')
            .eq('id', req.user.id)
            .single();

        if (error && error.code !== 'PGRST116') throw error; // PGRST116 = not found

        res.json({ profile: profile || null });
    } catch (err) {
        next(err);
    }
});

/**
 * POST /api/profile
 * Buat atau update profil user
 * Body: { current_role, target_role_id }
 */
router.post('/', authGuard, async (req, res, next) => {
    try {
        const { current_role, target_role_id } = req.body;

        // Hitung readiness score jika ada target role
        let readiness_score = 0;
        if (target_role_id) {
            const analysis = await calculateReadinessScore(req.user.id, target_role_id);
            readiness_score = analysis.score;
        }

        const { data, error } = await supabase
            .from('profiles')
            .upsert({
                id: req.user.id,
                current_role,
                target_role_id,
                readiness_score,
                updated_at: new Date().toISOString(),
            })
            .select()
            .single();

        if (error) throw error;

        res.json({ profile: data });
    } catch (err) {
        next(err);
    }
});

/**
 * PUT /api/profile/skills
 * Update skill yang dimiliki user (replace all)
 * Body: { skill_ids: [uuid, uuid, ...] }
 */
router.put('/skills', authGuard, async (req, res, next) => {
    try {
        const { skill_ids } = req.body;

        if (!Array.isArray(skill_ids)) {
            return res.status(400).json({ error: 'skill_ids must be an array' });
        }

        // Hapus semua skill lama user
        await supabase.from('user_skills').delete().eq('user_id', req.user.id);

        // Insert skill baru
        if (skill_ids.length > 0) {
            const rows = skill_ids.map((skill_id) => ({
                user_id: req.user.id,
                skill_id,
            }));

            const { error: insertError } = await supabase.from('user_skills').insert(rows);
            if (insertError) throw insertError;
        }

        // Update readiness score
        const { data: profile } = await supabase
            .from('profiles')
            .select('target_role_id')
            .eq('id', req.user.id)
            .single();

        if (profile?.target_role_id) {
            const analysis = await calculateReadinessScore(req.user.id, profile.target_role_id);
            await supabase
                .from('profiles')
                .update({ readiness_score: analysis.score, updated_at: new Date().toISOString() })
                .eq('id', req.user.id);
        }

        res.json({ message: 'Skills updated successfully' });
    } catch (err) {
        next(err);
    }
});

export default router;
