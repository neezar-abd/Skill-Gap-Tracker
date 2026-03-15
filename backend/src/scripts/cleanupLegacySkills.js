import supabase from '../services/supabaseClient.js';

const legacyToCanonical = {
    'State Management Concepts': 'Redux / State Management',
    'Search Engine Optimization (SEO)': 'SEO',
    'UX Research Principles': 'User Research',
    'Excel': 'Excel (Data Analysis)',
    'Statistik Dasar': 'Basic Statistics',
};

const orphanLegacySkills = [
    'Tableau / Power BI',
    'Meta Ads / Google Ads',
];

async function fetchSkillByName(name) {
    const { data, error } = await supabase
        .from('skills')
        .select('id, name')
        .eq('name', name)
        .maybeSingle();

    if (error) throw error;
    return data;
}

async function migrateJobRoleSkills(legacyId, canonicalId) {
    const { data: legacyRows, error: legacyError } = await supabase
        .from('job_role_skills')
        .select('job_role_id, importance')
        .eq('skill_id', legacyId);

    if (legacyError) throw legacyError;

    const { data: canonicalRows, error: canonicalError } = await supabase
        .from('job_role_skills')
        .select('job_role_id, importance')
        .eq('skill_id', canonicalId);

    if (canonicalError) throw canonicalError;

    const existing = new Set((canonicalRows || []).map((row) => `${row.job_role_id}:${row.importance}`));
    const toInsert = (legacyRows || [])
        .filter((row) => !existing.has(`${row.job_role_id}:${row.importance}`))
        .map((row) => ({ ...row, skill_id: canonicalId }));

    if (toInsert.length > 0) {
        const { error } = await supabase.from('job_role_skills').insert(toInsert);
        if (error) throw error;
    }

    const { error: deleteError } = await supabase.from('job_role_skills').delete().eq('skill_id', legacyId);
    if (deleteError) throw deleteError;

    return { moved: legacyRows?.length || 0, inserted: toInsert.length };
}

async function migrateSkillResources(legacyId, canonicalId) {
    const { data: legacyRows, error: legacyError } = await supabase
        .from('skill_resources')
        .select('title, type, url, platform')
        .eq('skill_id', legacyId);

    if (legacyError) throw legacyError;

    const { data: canonicalRows, error: canonicalError } = await supabase
        .from('skill_resources')
        .select('url')
        .eq('skill_id', canonicalId);

    if (canonicalError) throw canonicalError;

    const existingUrls = new Set((canonicalRows || []).map((row) => row.url));
    const toInsert = (legacyRows || [])
        .filter((row) => !existingUrls.has(row.url))
        .map((row) => ({ ...row, skill_id: canonicalId }));

    if (toInsert.length > 0) {
        const { error } = await supabase.from('skill_resources').insert(toInsert);
        if (error) throw error;
    }

    const { error: deleteError } = await supabase.from('skill_resources').delete().eq('skill_id', legacyId);
    if (deleteError) throw deleteError;

    return { moved: legacyRows?.length || 0, inserted: toInsert.length };
}

async function migrateSimpleTable(tableName, legacyId, canonicalId, uniqueColumns) {
    const { data: legacyRows, error: legacyError } = await supabase
        .from(tableName)
        .select('*')
        .eq('skill_id', legacyId);

    if (legacyError) throw legacyError;

    if (!legacyRows || legacyRows.length === 0) {
        return { moved: 0, inserted: 0 };
    }

    const { data: canonicalRows, error: canonicalError } = await supabase
        .from(tableName)
        .select('*')
        .eq('skill_id', canonicalId);

    if (canonicalError) throw canonicalError;

    const existing = new Set(
        (canonicalRows || []).map((row) => uniqueColumns.map((column) => row[column]).join(':'))
    );

    const toInsert = legacyRows
        .filter((row) => !existing.has(uniqueColumns.map((column) => row[column]).join(':')))
        .map(({ id, created_at, updated_at, ...rest }) => ({ ...rest, skill_id: canonicalId }));

    if (toInsert.length > 0) {
        const { error } = await supabase.from(tableName).insert(toInsert);
        if (error) throw error;
    }

    const { error: deleteError } = await supabase.from(tableName).delete().eq('skill_id', legacyId);
    if (deleteError) throw deleteError;

    return { moved: legacyRows.length, inserted: toInsert.length };
}

async function deleteSkillIfUnused(skillName) {
    const skill = await fetchSkillByName(skillName);
    if (!skill) return { deleted: false, reason: 'not-found' };

    const { count: relCount, error: relError } = await supabase
        .from('job_role_skills')
        .select('*', { count: 'exact', head: true })
        .eq('skill_id', skill.id);
    if (relError) throw relError;

    const { count: resCount, error: resError } = await supabase
        .from('skill_resources')
        .select('*', { count: 'exact', head: true })
        .eq('skill_id', skill.id);
    if (resError) throw resError;

    const { count: userSkillCount, error: userSkillError } = await supabase
        .from('user_skills')
        .select('*', { count: 'exact', head: true })
        .eq('skill_id', skill.id);
    if (userSkillError) throw userSkillError;

    const { count: progressCount, error: progressError } = await supabase
        .from('user_progress')
        .select('*', { count: 'exact', head: true })
        .eq('skill_id', skill.id);
    if (progressError) throw progressError;

    const totalRefs = relCount + resCount + userSkillCount + progressCount;
    if (totalRefs > 0) {
        return { deleted: false, reason: `still-referenced:${totalRefs}` };
    }

    const { error: deleteError } = await supabase.from('skills').delete().eq('id', skill.id);
    if (deleteError) throw deleteError;

    return { deleted: true };
}

async function migrateLegacySkill(legacyName, canonicalName) {
    const legacySkill = await fetchSkillByName(legacyName);
    const canonicalSkill = await fetchSkillByName(canonicalName);

    if (!legacySkill) {
        return { legacyName, canonicalName, status: 'legacy-not-found' };
    }

    if (!canonicalSkill) {
        return { legacyName, canonicalName, status: 'canonical-not-found' };
    }

    const jobRoleSkills = await migrateJobRoleSkills(legacySkill.id, canonicalSkill.id);
    const skillResources = await migrateSkillResources(legacySkill.id, canonicalSkill.id);
    const userSkills = await migrateSimpleTable('user_skills', legacySkill.id, canonicalSkill.id, ['user_id']);
    const userProgress = await migrateSimpleTable('user_progress', legacySkill.id, canonicalSkill.id, ['user_id', 'status']);

    const { error: deleteError } = await supabase.from('skills').delete().eq('id', legacySkill.id);
    if (deleteError) throw deleteError;

    return {
        legacyName,
        canonicalName,
        status: 'migrated',
        jobRoleSkills,
        skillResources,
        userSkills,
        userProgress,
    };
}

async function cleanupLegacySkills() {
    console.log('🧹 Starting legacy skill cleanup...');

    const migrationResults = [];
    for (const [legacyName, canonicalName] of Object.entries(legacyToCanonical)) {
        const result = await migrateLegacySkill(legacyName, canonicalName);
        migrationResults.push(result);
        console.log(JSON.stringify(result));
    }

    const deletionResults = [];
    for (const legacyName of orphanLegacySkills) {
        const result = await deleteSkillIfUnused(legacyName);
        deletionResults.push({ legacyName, ...result });
        console.log(JSON.stringify({ legacyName, ...result }));
    }

    console.log('✅ Legacy skill cleanup complete.');
    console.log(JSON.stringify({ migrationResults, deletionResults }, null, 2));
}

cleanupLegacySkills().catch((error) => {
    console.error('❌ Cleanup failed:', error.message);
    process.exit(1);
});