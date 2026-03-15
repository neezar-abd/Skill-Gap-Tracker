const API_URL = 'https://skill-gap-tracker.onrender.com/api/demo';

const elTarget = document.getElementById('targetCareer');
const elCurrentPos = document.getElementById('currentPosition');
const elCurrentPosDiv = document.getElementById('currentPositionDiv');
const elForm = document.getElementById('formSection');
const elLoading = document.getElementById('loadingSection');
const elResult = document.getElementById('resultSection');

// Ambil Job Roles saat halaman dimuat
async function fetchRoles() {
    try {
        const res = await fetch(`${API_URL}/roles`);
        const { roles } = await res.json();

        elTarget.innerHTML = '<option value="" disabled selected>Pilih karir impian...</option>';
        roles.forEach(r => {
            const opt = document.createElement('option');
            opt.value = r.id;
            opt.textContent = r.name;
            opt.dataset.name = r.name; // Simpan nama buat dikirim ke backend
            elTarget.appendChild(opt);
        });
    } catch (err) {
        console.error("Gagal ambil role:", err);
        elTarget.innerHTML = '<option value="" disabled>Gagal memuat data dari server</option>';
    }
}

function toggleCurrentPosition(show) {
    if (show) {
        elCurrentPosDiv.classList.remove('hidden');
    } else {
        elCurrentPosDiv.classList.add('hidden');
        elCurrentPos.value = '';
    }
}

async function generate() {
    if (!elTarget.value) {
        alert("Pilih target karir dulu bro!");
        return;
    }

    const targetRoleId = elTarget.value;
    const targetRoleName = elTarget.options[elTarget.selectedIndex].dataset.name;
    const currentPosition = elCurrentPos.value.trim() || 'Belum Berkarir';

    // Show Loading
    elForm.classList.add('hidden');
    elLoading.classList.remove('hidden');

    try {
        const res = await fetch(`${API_URL}/roadmap`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                target_role_id: targetRoleId,
                target_role_name: targetRoleName,
                current_position: currentPosition
            })
        });

        const data = await res.json();

        if (data.error) throw new Error(data.error);

        renderRoadmap(data.roadmap);
    } catch (err) {
        alert("Gagal generate: " + err.message);
        reset();
    }
}

function renderRoadmap(rm) {
    elLoading.classList.add('hidden');
    elResult.classList.remove('hidden');

    document.getElementById('rmSummary').textContent = rm.summary;
    document.getElementById('rmDuration').textContent = rm.estimatedDuration;
    document.getElementById('rmInsight').textContent = rm.marketInsight;

    const phasesContainer = document.getElementById('rmPhases');
    phasesContainer.innerHTML = '';

    rm.phases.forEach((p, idx) => {
        const isLast = idx === rm.phases.length - 1;

        // Buat dot/garis timeline
        let html = `
        <div class="relative pl-8 pb-8 fade-in" style="animation-delay: ${idx * 0.1}s">
            <span class="absolute left-[-9px] top-1 h-4 w-4 rounded-full bg-blue-500 border-2 border-white shadow"></span>
            
            <div class="bg-white border rounded-xl p-5 shadow-sm hover:shadow-md transition">
                <span class="text-xs font-bold text-blue-600 uppercase tracking-wider mb-2 block">Phase ${p.phase}: ${p.duration}</span>
                <h3 class="text-lg font-bold text-slate-800 mb-2">${p.title}</h3>
                
                <div class="mb-4">
                    <p class="text-xs text-slate-500 mb-1">Focus Skills:</p>
                    <div class="flex flex-wrap gap-2 mb-3">
                        ${p.focus_skills ? p.focus_skills.map(fs => `<span class="bg-blue-100 text-blue-700 font-bold px-2 py-1 rounded text-xs border border-blue-200">${fs}</span>`).join('') : ''}
                    </div>
                    <p class="text-xs text-slate-500 mb-1">Learning Topics:</p>
                    <div class="flex flex-wrap gap-2">
                        ${p.sub_topics ? p.sub_topics.map(s => `<span class="bg-slate-100 text-slate-700 font-medium px-2 py-1 rounded text-xs border border-slate-200">${s}</span>`).join('') : ''}
                    </div>
                </div>

                <div>
                    <p class="text-xs text-slate-500 mb-2">Learning Resources:</p>
                    <div class="space-y-2">
                        ${p.resources.map(r => `
                            <a href="${r.url}" target="_blank" class="flex items-center p-2 rounded-lg bg-blue-50 hover:bg-blue-100 text-sm group transition">
                                <i class="fas ${r.type.includes('video') ? 'fa-play-circle text-red-500' : 'fa-book text-blue-500'} mr-3"></i>
                                <div class="flex-1">
                                    <p class="font-medium text-slate-800 group-hover:text-blue-700 transition">${r.title}</p>
                                    <p class="text-xs text-slate-500">${r.platform}</p>
                                </div>
                                <i class="fas fa-external-link-alt text-slate-400 group-hover:text-blue-500 text-xs"></i>
                            </a>
                        `).join('')}
                    </div>
                </div>
            </div>
        </div>
        `;
        phasesContainer.innerHTML += html;
    });
}

function reset() {
    elResult.classList.add('hidden');
    elLoading.classList.add('hidden');
    elForm.classList.remove('hidden');
}

// Init
fetchRoles();
