import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import supabase from '../services/supabaseClient.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function loadJSON(filepath) {
    if (fs.existsSync(filepath)) {
        return JSON.parse(fs.readFileSync(filepath, 'utf8'));
    }
    return [];
}

const rolesSeed = [
    { name: 'Frontend Developer', description: 'Membangun antarmuka pengguna berbasis web menggunakan HTML, CSS, JavaScript, dan framework modern seperti React atau Next.js.' },
    { name: 'Backend Developer', description: 'Membangun dan mengelola server, database, dan API yang mendukung aplikasi web dan mobile.' },
    { name: 'Data Analyst', description: 'Mengumpulkan, membersihkan, dan menganalisis data untuk menghasilkan insight bisnis yang berharga.' },
    { name: 'UI/UX Designer', description: 'Merancang tampilan dan pengalaman pengguna yang intuitif, menarik, dan sesuai kebutuhan pengguna.' },
    { name: 'Digital Marketing', description: 'Merencanakan dan menjalankan strategi pemasaran digital melalui berbagai platform online.' },
];

const supplementalSkills = [
    { name: 'Cloud Service Models', category: 'knowledge' },
];

const datasetSkills = loadJSON(path.join(__dirname, '../../../dataset/skills.json')).map((skill) => ({
    name: skill.name,
    category: skill.category,
}));

const canonicalSkills = Array.from(
    new Map([...datasetSkills, ...supplementalSkills].map((skill) => [skill.name.toLowerCase(), skill])).values()
);

const seedMasterData = async () => {
    console.log('Seeding job roles...');
    const { error: rolesErr } = await supabase.from('job_roles').upsert(rolesSeed, { onConflict: 'name' });

    if (rolesErr) {
        console.error('Error seeding roles:', rolesErr);
        return;
    }
    console.log('Roles seeded.');

    console.log('Seeding skills...');
    const { data: skills, error: skillsErr } = await supabase
        .from('skills')
        .upsert(canonicalSkills, { onConflict: 'name' })
        .select();

    if (skillsErr) {
        console.error('Error seeding skills:', skillsErr);
        return;
    }
    console.log(`Skills seeded: ${skills.length}.`);
    console.log('Done!');
};

seedMasterData();
