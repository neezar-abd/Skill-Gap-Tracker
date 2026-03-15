import supabase from '../services/supabaseClient.js';

const newResources = [
    // HTML
    {
        skill_name: 'HTML',
        resources: [
            { title: 'MDN Web Docs: HTML', type: 'article', url: 'https://developer.mozilla.org/en-US/docs/Web/HTML', platform: 'MDN' },
            { title: 'W3Schools HTML Tutorial', type: 'course', url: 'https://www.w3schools.com/html/', platform: 'W3Schools' },
            { title: 'HTML Crash Course for Beginners', type: 'video', url: 'https://www.youtube.com/watch?v=UB1O30fR-EE', platform: 'YouTube' }
        ]
    },
    // CSS
    {
        skill_name: 'CSS',
        resources: [
            { title: 'MDN Web Docs: CSS', type: 'article', url: 'https://developer.mozilla.org/en-US/docs/Web/CSS', platform: 'MDN' },
            { title: 'CSS-Tricks', type: 'article', url: 'https://css-tricks.com/', platform: 'CSS-Tricks' },
            { title: 'Flexbox Froggy', type: 'game', url: 'https://flexboxfroggy.com/', platform: 'Codepip' }
        ]
    },
    // Cloud Computing Service Models (IaaS, PaaS, SaaS)
    {
        skill_name: 'Cloud Computing Service Models (IaaS, PaaS, SaaS)',
        resources: [
            { title: 'What is IaaS, PaaS, and SaaS?', type: 'article', url: 'https://www.ibm.com/cloud/learn/iaas-paas-saas', platform: 'IBM Cloud' },
            { title: 'Cloud Computing Models Explained', type: 'video', url: 'https://www.youtube.com/watch?v=jYtVdfX3c3k', platform: 'YouTube' }
        ]
    }
];

async function seedMissing() {
    console.log('Seeding missing resources...');
    
    for (const item of newResources) {
        // 1. Get Skill ID
        const { data: skill, error: err1 } = await supabase
            .from('skills')
            .select('id')
            .eq('name', item.skill_name)
            .single();

        if (err1 || !skill) {
            console.error(`Skill not found: ${item.skill_name}`);
            continue;
        }

        console.log(`Found skill: ${item.skill_name} (${skill.id})`);

        // 2. Insert resources
        const rows = item.resources.map(r => ({
            skill_id: skill.id,
            title: r.title,
            type: r.type,
            url: r.url,
            platform: r.platform
        }));

        const { error: err2 } = await supabase.from('skill_resources').insert(rows);

        if (err2) {
            console.error(`Failed to insert for ${item.skill_name}:`, err2.message);
        } else {
            console.log(`Success: Added ${rows.length} resources for ${item.skill_name}`);
        }
    }
}

seedMissing();