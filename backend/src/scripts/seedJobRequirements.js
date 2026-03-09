/**
 * Seed script: Populate job_requirements table dengan data job descriptions
 * dan generate embeddings via Gemini text-embedding-004.
 *
 * Cara pakai:
 *   node src/scripts/seedJobRequirements.js
 */

import supabase from '../services/supabaseClient.js';
import { embedText } from '../services/embeddingService.js';

// ── Data job requirements yang dikurasi tim ──────────────────────────────────
// Format: { role: string, title: string, content: string, source: string }
// Tambahkan lebih banyak data di sini untuk hasil RAG yang lebih akurat!
const JOB_REQUIREMENTS_DATA = [
    {
        role: 'Frontend Developer',
        title: 'Frontend Developer - E-commerce Platform',
        source: 'Glints',
        content: `We are looking for a Frontend Developer with strong proficiency in React.js and Next.js. 
    Required skills: HTML5, CSS3, JavaScript (ES6+), React.js, REST API integration, Git version control.
    You will build responsive, pixel-perfect UIs and collaborate closely with backend engineers.
    Experience with TypeScript and Tailwind CSS is a plus. Understanding of web performance optimization required.`,
    },
    {
        role: 'Frontend Developer',
        title: 'Junior Frontend Developer - Fintech Startup',
        source: 'Jobstreet',
        content: `Looking for a Junior Frontend Developer who can build modern web applications.
    Must have: HTML, CSS, JavaScript fundamentals, React.js basics, understanding of REST APIs.
    Nice to have: React hooks, state management (Redux/Zustand), unit testing.
    Will work with cross-functional team on UI components and user-facing features.`,
    },
    {
        role: 'Backend Developer',
        title: 'Backend Engineer - SaaS Company',
        source: 'LinkedIn',
        content: `Seeking Backend Engineer experienced in Node.js and Express.js.
    Required: Node.js, Express.js, RESTful API design, PostgreSQL/MySQL, Git, authentication (JWT/OAuth).
    Responsibilities: Design and implement scalable APIs, manage database schemas, integrate third-party services.
    Experience with Docker and cloud deployment (AWS/GCP) is a strong plus.`,
    },
    {
        role: 'Backend Developer',
        title: 'Backend Developer - Logistics Tech',
        source: 'Glints',
        content: `We need a Backend Developer who can own and develop our core API services.
    Skills required: Node.js or Python, SQL (PostgreSQL), RESTful API, JWT authentication, version control with Git.
    You'll design database schemas, write clean code, and collaborate with frontend teams on API contracts.`,
    },
    {
        role: 'Data Analyst',
        title: 'Data Analyst - Retail Company',
        source: 'Jobstreet',
        content: `Join our data team as a Data Analyst. 
    Must have: SQL proficiency, Python (Pandas, NumPy), Excel, data visualization tools (Tableau or Power BI).
    Basic understanding of statistics and probability required. Experience with data cleaning, analysis, and reporting.
    You'll create dashboards and translate data insights into actionable business recommendations.`,
    },
    {
        role: 'Data Analyst',
        title: 'Junior Data Analyst - Media & Publishing',
        source: 'LinkedIn',
        content: `Looking for a Junior Data Analyst to join our growing analytics team.
    Requirements: SQL (intermediate), Python or R, Excel, basic statistics, data visualization.
    Nice to have: Google Analytics, A/B testing knowledge, Looker or Metabase experience.
    Responsibilities include building reports, analyzing user behavior data, and supporting business decision-making.`,
    },
    {
        role: 'UI/UX Designer',
        title: 'UI/UX Designer - Mobile App Company',
        source: 'Glints',
        content: `We're looking for a UI/UX Designer to craft beautiful and functional digital experiences.
    Required: Proficiency in Figma, user research skills, wireframing, prototyping, understanding of design systems.
    You'll conduct user interviews, create user flows, design high-fidelity mockups, and validate designs through usability testing.
    Experience with mobile design patterns and accessibility standards preferred.`,
    },
    {
        role: 'UI/UX Designer',
        title: 'Product Designer - B2B SaaS',
        source: 'LinkedIn',
        content: `Seeking a Product Designer who can own end-to-end product design.
    Must have: Figma (advanced), user research, usability testing, prototyping, design systems.
    Responsibilities: Define user problems, create wireframes, design high-fidelity UIs, collaborate with engineering.
    Understanding of UX writing and accessibility (WCAG) is a strong plus.`,
    },
    {
        role: 'Digital Marketing',
        title: 'Digital Marketing Specialist - Consumer Brand',
        source: 'Glints',
        content: `Looking for a Digital Marketing Specialist to grow our online presence.
    Required skills: SEO fundamentals, Google Analytics, social media marketing (Instagram, TikTok, LinkedIn),
    content writing and copywriting, basic knowledge of paid advertising (Meta Ads or Google Ads).
    You'll manage content calendars, run campaigns, analyze performance, and report KPIs.`,
    },
    {
        role: 'Digital Marketing',
        title: 'Growth Marketing Manager - Startup',
        source: 'LinkedIn',
        content: `We need a data-driven Growth Marketing Manager to lead our acquisition strategy.
    Must have: SEO/SEM, Google Analytics 4, Meta Ads, Google Ads, email marketing, content strategy.
    Experience with A/B testing, funnel optimization, and marketing automation tools preferred.
    You'll work cross-functionally with product and design to drive user growth and retention.`,
    },
];

// ── Main seed function ────────────────────────────────────────────────────────
const seed = async () => {
    console.log('🌱 Starting job requirements seed...\n');

    // Ambil semua job roles dari DB untuk mapping nama → id
    const { data: roles, error: rolesError } = await supabase
        .from('job_roles')
        .select('id, name');

    if (rolesError) {
        console.error('❌ Failed to fetch job roles:', rolesError.message);
        process.exit(1);
    }

    const roleMap = Object.fromEntries(roles.map((r) => [r.name, r.id]));
    console.log('📋 Found roles:', Object.keys(roleMap).join(', '), '\n');

    let successCount = 0;
    let errorCount = 0;

    for (const item of JOB_REQUIREMENTS_DATA) {
        const jobRoleId = roleMap[item.role];

        if (!jobRoleId) {
            console.warn(`⚠️  Role "${item.role}" not found in DB, skipping: ${item.title}`);
            errorCount++;
            continue;
        }

        try {
            process.stdout.write(`⏳ Embedding: "${item.title}"...`);

            // Generate embedding untuk content job description
            const embedding = await embedText(item.content, 'RETRIEVAL_DOCUMENT');

            // Insert ke Supabase
            const { error: insertError } = await supabase.from('job_requirements').insert({
                job_role_id: jobRoleId,
                title: item.title,
                content: item.content,
                source: item.source,
                embedding,
            });

            if (insertError) throw insertError;

            console.log(` ✅`);
            successCount++;

            // Rate limit delay (Gemini free tier: 1500 RPM)
            await new Promise((resolve) => setTimeout(resolve, 500));
        } catch (err) {
            console.log(` ❌ ${err.message}`);
            errorCount++;
        }
    }

    console.log(`\n🎉 Seed complete! Success: ${successCount}, Failed: ${errorCount}`);
    process.exit(0);
};

seed();
