import { Router } from 'express';
import authGuard from '../middleware/authGuard.js';
import supabase from '../services/supabaseClient.js';
import { calculateReadinessScore } from '../services/gapAnalysis.js';
import { generateRoadmap } from '../services/geminiService.js';

const router = Router();

/**
 * GET /api/roadmap
 * Ambil roadmap terakhir yang sudah di-generate untuk user ini
 */
router.get('/', authGuard, async (req, res, next) => {
    try {
        const { data, error } = await supabase
            .from('roadmaps')
            .select('*, job_roles(name)')
            .eq('user_id', req.user.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

        if (error && error.code !== 'PGRST116') throw error;

        res.json({ roadmap: data || null });
    } catch (err) {
        next(err);
    }
});

/**
 * POST /api/roadmap/generate
 * Generate roadmap baru via Gemini berdasarkan gap skill saat ini
 */
router.post('/generate', authGuard, async (req, res, next) => {
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

        // Hitung gap skill saat ini
        const { gapSkillIds } = await calculateReadinessScore(req.user.id, profile.target_role_id);

        if (gapSkillIds.length === 0) {
            return res.json({
                message: 'Selamat! Kamu sudah memiliki semua skill yang dibutuhkan untuk role ini.',
                roadmap: null,
            });
        }

        // Ambil detail skill gap
        const { data: gapSkills, error: skillError } = await supabase
            .from('skills')
            .select('id, name, category')
            .in('id', gapSkillIds);

        if (skillError) throw skillError;

        // Generate roadmap via Gemini + RAG
        const roadmapContent = await generateRoadmap(profile.job_roles.name, profile.target_role_id, gapSkills);

        // Simpan ke database
        const { data: savedRoadmap, error: saveError } = await supabase
            .from('roadmaps')
            .insert({
                user_id: req.user.id,
                target_role_id: profile.target_role_id,
                content: roadmapContent,
                gap_skills: gapSkills,
            })
            .select()
            .single();

        if (saveError) throw saveError;

        res.json({ roadmap: savedRoadmap });
    } catch (err) {
        next(err);
    }
});

export default router;
