import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import supabase from '../services/supabaseClient.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const workspaceRoot = path.join(__dirname, '../../..');

const legacyToCanonical = {
    'State Management Concepts': 'Redux / State Management',
    'Search Engine Optimization (SEO)': 'SEO',
    'UX Research Principles': 'User Research',
    Excel: 'Excel (Data Analysis)',
    'Statistik Dasar': 'Basic Statistics',
    'Tableau / Power BI': 'Tableau + Power BI',
    'Meta Ads / Google Ads': 'Meta Ads + Google Ads',
};

function loadJson(filePath) {
    if (!fs.existsSync(filePath)) return [];
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function auditFile(filePath, field) {
    const rows = loadJson(filePath);
    const issues = [];
    for (const row of rows) {
        const value = row[field];
        if (typeof value === 'string' && legacyToCanonical[value]) {
            issues.push({ value, canonical: legacyToCanonical[value] });
        }
    }
    return issues;
}

async function auditDb() {
    const legacyNames = Object.keys(legacyToCanonical);
    const { data, error } = await supabase
        .from('skills')
        .select('id, name')
        .in('name', legacyNames);

    if (error) throw error;
    return data || [];
}

async function main() {
    const checks = [
        { file: 'dataset/skills.json', field: 'name' },
        { file: 'dataset/skills_batch_2.json', field: 'name' },
        { file: 'dataset/relations_batch_1.json', field: 'skill_name' },
        { file: 'dataset/resources.json', field: 'skill_name' },
    ];

    console.log('=== Dataset Naming Audit ===');
    for (const check of checks) {
        const fullPath = path.join(workspaceRoot, check.file);
        const issues = auditFile(fullPath, check.field);
        if (issues.length === 0) {
            console.log(`[OK] ${check.file}`);
            continue;
        }

        const grouped = {};
        for (const issue of issues) {
            grouped[issue.value] = (grouped[issue.value] || 0) + 1;
        }

        console.log(`[WARN] ${check.file}`);
        for (const [legacy, count] of Object.entries(grouped)) {
            console.log(`  - ${legacy} (count=${count}) => ${legacyToCanonical[legacy]}`);
        }
    }

    console.log('\n=== Database Naming Audit ===');
    const dbLegacy = await auditDb();
    if (dbLegacy.length === 0) {
        console.log('[OK] No legacy skill rows found in DB');
    } else {
        for (const row of dbLegacy) {
            console.log(`  - ${row.name} (${row.id}) => ${legacyToCanonical[row.name]}`);
        }
    }
}

main().catch((error) => {
    console.error('Audit failed:', error.message);
    process.exit(1);
});
