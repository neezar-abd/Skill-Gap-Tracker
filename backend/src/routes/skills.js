import { Router } from 'express';
import supabase from '../services/supabaseClient.js';

const router = Router();

/**
 * GET /api/skills
 * Daftar semua skill (master data)
 */
router.get('/', async (req, res, next) => {
    try {
        const { data, error } = await supabase
            .from('skills')
            .select('*')
            .order('category')
            .order('name');

        if (error) throw error;

        res.json({ skills: data });
    } catch (err) {
        next(err);
    }
});

/**
 * GET /api/roles
 * Daftar semua job role (master data)
 */
router.get('/roles', async (req, res, next) => {
    try {
        const { data, error } = await supabase
            .from('job_roles')
            .select('*')
            .order('name');

        if (error) throw error;

        res.json({ roles: data });
    } catch (err) {
        next(err);
    }
});

/**
 * GET /api/roles/:id/skills
 * Skill yang dibutuhkan untuk suatu job role
 */
router.get('/roles/:id/skills', async (req, res, next) => {
    try {
        const { id } = req.params;

        const { data, error } = await supabase
            .from('job_role_skills')
            .select('importance, skills(id, name, category)')
            .eq('job_role_id', id);

        if (error) throw error;

        res.json({ skills: data });
    } catch (err) {
        next(err);
    }
});

export default router;
