import { Router } from 'express';
import authGuard from '../middleware/authGuard.js';
import supabase from '../services/supabaseClient.js';
import { calculateReadinessScore } from '../services/gapAnalysis.js';

const router = Router();

/**
 * GET /api/analysis
 * Hitung gap skill + readiness score user terhadap target role
 */
router.get('/', authGuard, async (req, res, next) => {
    try {
        // Ambil profil user
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('target_role_id, job_roles(name)')
            .eq('id', req.user.id)
            .single();

        if (profileError) throw profileError;

        if (!profile?.target_role_id) {
            return res.status(400).json({ error: 'Target role belum di-set. Lengkapi profil dulu.' });
        }

        const { score, totalRequired, masteredCount, gapSkillIds } =
            await calculateReadinessScore(req.user.id, profile.target_role_id);

        // Ambil detail skill gap
        let gapSkills = [];
        if (gapSkillIds.length > 0) {
            const { data: skillDetails, error: skillError } = await supabase
                .from('skills')
                .select('id, name, category')
                .in('id', gapSkillIds);

            if (skillError) throw skillError;
            gapSkills = skillDetails;
        }

        res.json({
            targetRole: profile.job_roles.name,
            readinessScore: score,
            totalRequired,
            masteredCount,
            gapSkills,
        });
    } catch (err) {
        next(err);
    }
});

export default router;
