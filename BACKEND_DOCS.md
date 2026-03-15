# Backend API Documentation

Base URL: `https://skill-gap-tracker.onrender.com`

---

## 1. Demo / Public Endpoints
*Endpoint ini bisa langsung dipanggil tanpa login (Authentication).*

### **GET /api/demo/roles**
Mendapatkan daftar semua job roles yang tersedia di database.
- **Request:** `GET /api/demo/roles`
- **Response:**
  ```json
  {
    "roles": [
      {
        "id": "uuid-role-1",
        "name": "Frontend Developer",
        "description": "..."
      },
      ...
    ]
  }
  ```

### **GET /api/demo/skills**
Mendapatkan daftar semua skills yang tersedia di database.
- **Request:** `GET /api/demo/skills`
- **Response:**
  ```json
  {
    "skills": [
      {
        "id": "uuid-skill-1",
        "name": "React.js",
        "category": "Library"
      },
      ...
    ]
  }
  ```

### **GET /api/demo/roles/:id/skills**
Mendapatkan daftar skills yang dibutuhkan untuk role tertentu.
- **Request:** `GET /api/demo/roles/b6f00935-9961-41aa-be2f-b08971b4710c/skills`
- **Response:**
  ```json
  {
    "skills": [
      {
        "id": "uuid-skill-1",
        "name": "JavaScript",
        "category": "Programming Language",
        "importance": "required"
      },
      ...
    ]
  }
  ```

### **POST /api/demo/roadmap**
Generate roadmap belajar menggunakan AI Gemini berdasarkan gap skill.
- **Request:**
  ```json
  {
    "target_role_id": "uuid-role-target",
    "target_role_name": "Frontend Developer",
    "current_position": "Mahasiswa"
  }
  ```
- **Response:**
  ```json
  {
    "summary": "...",
    "estimatedDuration": "3-6 bulan",
    "marketInsight": "...",
    "phases": [
      {
        "phase": 1,
        "title": "Foundation",
        "duration": "1 bulan",
        "focus_skills": ["HTML", "CSS", "JavaScript"], // Skill yang harus dipelajari
        "resources": [ // Link belajar otomatis dari database
           { "title": "MDN Web Docs", "url": "...", "type": "article" }
        ]
      }
    ]
  }
  ```

---

## 2. System Endpoints

### **GET /**
Cek apakah server hidup.
- **Response:** `Skill Gap Tracker API is running 🚀`

### **GET /health**
Health check untuk monitoring (Render/UptimeRobot).
- **Response:** `{"status":"ok"}`

---

## 3. Notes for Frontend Team
1. **Authentication:** Saat ini belum diimplementasikan (TODO). Gunakan endpoint `/api/demo/*` untuk pengembangan fitur utama dulu.
2. **Error Handling:** Jika API error 500, cek console log backend. Jika error 502, biasanya Gemini AI overload atau timeout.
3. **Environment:** Pastikan frontend `.env` mengarah ke URL Render di atas, bukan localhost (kecuali sedang development lokal dengan backend lokal).
