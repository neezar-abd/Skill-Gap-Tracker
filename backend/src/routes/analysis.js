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

        const { score, totalRequired, masteredCount, masteredSkillIds, gapSkillIds, niceToHaveGapIds } =
            await calculateReadinessScore(req.user.id, profile.target_role_id);

        let gapSkills = [];
        let masteredSkills = [];
        let niceToHaveSkills = [];

        // Kumpulkan semua ID yang butuh diambil detailnya (untuk optimasi cukup 1x query)
        const allRequestedIds = [...new Set([...gapSkillIds, ...masteredSkillIds, ...niceToHaveGapIds])];

        if (allRequestedIds.length > 0) {
            const { data: skillsData, error: skillError } = await supabase
                .from('skills')
                .select('id, name, category')
                .in('id', allRequestedIds);

            if (skillError) throw skillError;

            // Pisahkan kembali array detail skill berdasarkan ID yang didapat dari gapAnalysis
            gapSkills = skillsData.filter(s => gapSkillIds.includes(s.id));
            masteredSkills = skillsData.filter(s => masteredSkillIds.includes(s.id));
            niceToHaveSkills = skillsData.filter(s => niceToHaveGapIds.includes(s.id));
        }

        res.json({
            targetRole: profile.job_roles.name,
            readinessScore: score,
            totalRequired,
            masteredCount,
            masteredSkills,
            gapSkills,
            niceToHaveSkills,
        });
    } catch (err) {
        next(err);
    }
});

export default router;
