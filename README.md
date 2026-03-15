# Skill Gap Tracker
**Capstone Project — Coding Camp 2026 — CC26-PS088**

Aplikasi web yang membantu individu mengetahui skill apa yang harus dipelajari untuk mencapai posisi karir yang diinginkan.

## 🚀 Live Demo
- **Backend API:** [https://skill-gap-tracker.onrender.com](https://skill-gap-tracker.onrender.com)
- **API Documentation:** [Lihat Dokumentasi Lengkap](./BACKEND_DOCS.md)

## Tech Stack
- **Frontend**: HTML/JS (Vanilla) / Next.js (Planned)
- **Backend**: Express.js (Node.js)
- **Database**: Supabase (PostgreSQL + pgvector for RAG)
- **Auth**: Supabase Auth
- **AI**: Google Gemini API (untuk generate roadmap)

## Struktur Repo (Monorepo)

```
Skill-Gap-Tracker/
├── frontend/       ← Frontend Application
├── backend/        ← Express.js API & Services
├── database/       ← SQL Schemas & Migration Scripts
├── dataset/        ← Master Data JSON (roles, skills, resources)
├── BACKEND_DOCS.md ← Dokumentasi Endpoint API
└── Spec.md         ← Spesifikasi Proyek
```

## Tim — CC26-PS088

| Nama | Peran |
|---|---|
| Pasha Raditya Putra | Frontend |
| Neezar Abdurrahman Ahnaf Abiyyi | Backend |
| Zaky Mubarok | Frontend |
| Dhanis Fathan Gunawan | Project Manager & Frontend |
| Muhammad Raihan | Backend |

---

## Setup — Backend

```bash
cd backend
cp .env.example .env     # Isi dengan kredensial Supabase & Gemini
npm install
npm run dev              # Server berjalan di http://localhost:5000
```

### Environment Variables

| Variabel | Keterangan |
|---|---|
| `SUPABASE_URL` | URL project Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key (dari Supabase Dashboard) |
| `GEMINI_API_KEY` | API Key dari Google AI Studio |
| `FRONTEND_URL` | URL frontend (untuk CORS) |
| `PORT` | Port server (default: 5000) |

## Setup — Database

1. Buka **Supabase Dashboard** → project kamu → **SQL Editor**
2. Copy-paste isi file [`database/schema.sql`](database/schema.sql) dan jalankan
3. Aktifkan **Google OAuth** di Authentication → Providers → Google

## API Endpoints

| Method | Endpoint | Auth | Keterangan |
|---|---|---|---|
| GET | `/health` | ❌ | Health check |
| GET | `/api/auth/me` | ✅ | Info user login |
| GET | `/api/profile` | ✅ | Ambil profil + readiness score |
| POST | `/api/profile` | ✅ | Set current/target role |
| PUT | `/api/profile/skills` | ✅ | Update skill yang dimiliki |
| GET | `/api/skills` | ❌ | Daftar semua skill |
| GET | `/api/roles` | ❌ | Daftar semua job role |
| GET | `/api/roles/:id/skills` | ❌ | Skill per role |
| GET | `/api/analysis` | ✅ | Gap analysis + readiness score |
| POST | `/api/roadmap/generate` | ✅ | Generate roadmap via Gemini |
| GET | `/api/roadmap` | ✅ | Ambil roadmap terakhir |
| GET | `/api/progress` | ✅ | Daftar progress belajar |
| POST | `/api/progress/:skill_id` | ✅ | Mulai belajar skill |
| PUT | `/api/progress/:skill_id` | ✅ | Update status skill |
| DELETE | `/api/progress/:skill_id` | ✅ | Hapus progress |

**Auth header**: `Authorization: Bearer <supabase_access_token>`