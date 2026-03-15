import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const datasetDir = path.join(__dirname, '../../../dataset');

function loadJSON(filename) {
    const p = path.join(datasetDir, filename);
    if (fs.existsSync(p)) {
        console.log(`Loading ${filename}...`);
        return JSON.parse(fs.readFileSync(p, 'utf8'));
    }
    console.log(`File not found: ${filename}`);
    return [];
}

function saveJSON(filename, data) {
    const p = path.join(datasetDir, filename);
    fs.writeFileSync(p, JSON.stringify(data, null, 2));
    console.log(`Saved ${data.length} items to ${filename}`);
}

// 1. Consolidate Job Roles
const roleFiles = ['job_roles.json', 'roles_batch_1.json', 'roles_batch_2.json', 'roles_batch_3.json'];
let allRoles = [];
roleFiles.forEach(f => {
    const data = loadJSON(f);
    const normalizedData = data.map(item => {
        // Fix role vs name property
        if (item.role && !item.name) item.name = item.role;
        return item;
    });
    allRoles = allRoles.concat(normalizedData);
});

// Deduplicate Roles by Name
const uniqueRoles = Array.from(new Map(allRoles.map(item => [item.name.toLowerCase().trim(), item])).values());
saveJSON('job_roles.json', uniqueRoles);

// 2. Consolidate Skills
const skillFiles = ['skills.json', 'skills_batch_1.json', 'skills_batch_2.json'];
let allSkills = [];
skillFiles.forEach(f => allSkills = allSkills.concat(loadJSON(f)));

// Deduplicate Skills by Name
const uniqueSkills = Array.from(new Map(allSkills.map(item => [item.name.toLowerCase().trim(), item])).values());
saveJSON('skills.json', uniqueSkills);

// 3. Consolidate Relations
const relationFiles = ['relations_batch_1.json'];
let allRelations = [];
relationFiles.forEach(f => allRelations = allRelations.concat(loadJSON(f)));

// Deduplicate Relations (Role + Skill Pair)
const uniqueRelations = Array.from(
    new Map(
        allRelations.map(item => [
            `${item.role_name.toLowerCase().trim()}|${item.skill_name.toLowerCase().trim()}`,
            item
        ])
    ).values()
);
saveJSON('job_role_skills.json', uniqueRelations);

console.log('Dataset consolidation complete!');
