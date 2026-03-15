import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../../.env') });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

// Helper function to load JSON files
function loadJSON(filepath) {
    if (fs.existsSync(filepath)) {
        return JSON.parse(fs.readFileSync(filepath, 'utf8'));
    }
    return [];
}

function canonicalizeSkillName(skillName) {
    const aliases = {
        'Search Engine Optimization (SEO)': 'SEO',
        'UX Research Principles': 'User Research',
        'State Management Concepts': 'Redux / State Management',
    };

    return aliases[skillName] || skillName;
}

async function seedMassiveData() {
    console.log("🚀 Memulai proses seeding MASSIVE Master Data ke Supabase...");

    const datasetDir = path.join(__dirname, '../../../dataset');

    // 1. Kumpulkan semua file dataset yang sudah consolidated
    const allRoles = loadJSON(path.join(datasetDir, 'job_roles.json'));

    const uniqueSkills = loadJSON(path.join(datasetDir, 'skills.json'))
        .map((item) => ({ ...item, name: canonicalizeSkillName(item.name) }));

    const allRelations = loadJSON(path.join(datasetDir, 'job_role_skills.json'))
        .map((relation) => ({
            ...relation,
            skill_name: canonicalizeSkillName(relation.skill_name),
        }));

    console.log(`\n📦 Data siap di-parse:`);
    console.log(`- Job Roles: ${allRoles.length}`);
    console.log(`- Skills: ${uniqueSkills.length}`);
    console.log(`- Mapping Relations: ${allRelations.length}`);

    if (allRoles.length === 0 || uniqueSkills.length === 0) {
        console.error("❌ Dataset kosong! Pastikan file JSON ada di folder dataset.");
        return;
    }

    try {
        // --- STEP 1: Upsert Job Roles ---
        console.log("\n🔄 Step 1: Sedang memuat Job Roles (upsert)...");

        // Hapus job_role_skills dulu (leaf table, tidak ada item depend ke dia)
        const { error: delRelErr } = await supabase.from('job_role_skills').delete().neq('job_role_id', '00000000-0000-0000-0000-000000000000');
        if (delRelErr) console.warn('⚠️ Gagal hapus job_role_skills:', delRelErr.message);

        // Upsert job_roles: kalau nama sudah ada, update description-nya saja
        const { data: insertedRoles, error: rolesErr } = await supabase
            .from('job_roles')
            .upsert(
                allRoles.map(r => ({ name: r.name, description: r.description })),
                { onConflict: 'name', ignoreDuplicates: false }
            )
            .select();

        if (rolesErr) throw new Error("Gagal upsert Job Roles: " + rolesErr.message);
        console.log(`✅ Berhasil upsert ${insertedRoles.length} Job Roles.`);

        // --- STEP 2: Upsert Skills ---
        console.log("\n🔄 Step 2: Sedang memuat Skills (upsert)...");
        const { data: insertedSkills, error: skillsErr } = await supabase
            .from('skills')
            .upsert(
                uniqueSkills.map(s => ({ name: s.name, category: s.category })),
                { onConflict: 'name', ignoreDuplicates: false }
            )
            .select();

        if (skillsErr) throw new Error("Gagal upsert Skills: " + skillsErr.message);
        console.log(`✅ Berhasil upsert ${insertedSkills.length} Skills.`);

        // --- STEP 3: Mapping Relations ---
        console.log("\n🔄 Step 3: Sedang memetakan Relasi Role <-> Skill...");

        // Bikin lookup table (dictionary) biar gampang nyari ID nya
        const roleMap = {};
        insertedRoles.forEach(r => roleMap[r.name.toLowerCase()] = r.id);

        const skillMap = {};
        insertedSkills.forEach(s => skillMap[s.name.toLowerCase()] = s.id);

        const relationPayloads = [];
        let missingCount = 0;

        for (const rel of allRelations) {
            if (!rel.role_name || !rel.skill_name) {
                missingCount++;
                continue;
            }

            const roleId = roleMap[rel.role_name.toLowerCase()];
            const skillId = skillMap[rel.skill_name.toLowerCase()];

            if (roleId && skillId) {
                relationPayloads.push({
                    job_role_id: roleId,
                    skill_id: skillId,
                    importance: rel.importance
                });
            } else {
                missingCount++;
            }
        }

        if (relationPayloads.length > 0) {
            const { error: relErr } = await supabase
                .from('job_role_skills')
                .insert(relationPayloads);

            if (relErr) throw new Error("Gagal insert Relations: " + relErr.message);
            console.log(`✅ Berhasil menyambungkan ${relationPayloads.length} titik relasi (Mapping).`);
        }

        if (missingCount > 0) {
            console.log(`⚠️ Ada ${missingCount} relasi yang gagal disambung karena AI typo nulis nama role/skill-nya.`);
        }

        console.log("\n🎉 SEEDING MASSIVE DATA SELESAI! Database lo sekarang udah PINTAR! 🎉");

    } catch (error) {
        console.error("❌ ERROR SEEDING:", error);
    }
}

seedMassiveData();
