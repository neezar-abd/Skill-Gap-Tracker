import supabase from '../services/supabaseClient.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATASET_PATH = path.join(__dirname, '../../../dataset/job_role_skills.json');

async function seedRoleSkills() {
    console.log('Seeding job_role_skills...');

    if (!fs.existsSync(DATASET_PATH)) {
        console.error('Dataset file not found:', DATASET_PATH);
        return;
    }

    const rawData = fs.readFileSync(DATASET_PATH, 'utf-8');
    const roleSkills = JSON.parse(rawData);

    console.log(`Loaded ${roleSkills.length} relationships to process.`);

    // 1. Fetch ALL roles and skills to avoid N+1 queries
    const { data: roles } = await supabase.from('job_roles').select('id, name');
    const { data: skills } = await supabase.from('skills').select('id, name');

    const roleMap = new Map(roles.map(r => [r.name.toLowerCase(), r.id]));
    const skillMap = new Map(skills.map(s => [s.name.toLowerCase(), s.id]));

    const batchSize = 50;
    let processed = 0;
    let skipped = 0;
    
    // Group inserts by role/skill to minimize writes
    const newItems = [];

    for (const item of roleSkills) {
        const roleId = roleMap.get(item.role_name.toLowerCase());
        const skillId = skillMap.get(item.skill_name.toLowerCase());

        if (!roleId) {
            // console.warn(`Skipping: Role '${item.role_name}' not found.`);
            skipped++;
            continue;
        }

        if (!skillId) {
            // console.warn(`Skipping: Skill '${item.skill_name}' not found.`);
            skipped++;
            continue;
        }
        
        // Push object that matches schema
        newItems.push({
            job_role_id: roleId,
            skill_id: skillId,
            importance: item.importance || 'required'
        });
    }

    console.log(`Items valid for insertion: ${newItems.length} (Skipped: ${skipped})`);

    // 2. Perform upsert in batches
    for (let i = 0; i < newItems.length; i += batchSize) {
        const chunk = newItems.slice(i, i + batchSize);
        const { error } = await supabase
            .from('job_role_skills')
            .upsert(chunk, { onConflict: 'job_role_id, skill_id', ignoreDuplicates: true });

        if (error) {
            console.error('Error inserting chunk:', error.message);
        } else {
            console.log(`Processed batch ${i} - ${i + chunk.length}`);
        }
    }
    
    console.log('Seeding complete.');
}

seedRoleSkills();