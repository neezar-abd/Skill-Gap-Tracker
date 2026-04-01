# Catatan Feedback Advisor & Rencana Kedepan

## Selesai Dikerjakan (Cost Control)
- **Rate Limiting:** Sudah diimplementasikan pembatasan API (maksimal 5 request/jam per user untuk route AI) agar kuota billing Gemini API tidak jebol (menghindari spam).
- **Roadmap Caching:** Roadmap yang sudah ter-generate disimpan di database (Supabase). Jika user me-refresh halaman, sistem mengambil dari database, bukan men-generate ulang dari API Gemini.

## Menunggu Keputusan: Integrasi Dataset Kaggle
Advisor meminta tambahan inovasi menggunakan dataset dari Kaggle agar bobot akademis project (RAG) lebih kuat dan membuktikan project ini bukan sekadar "API Wrapper" biasa.

### Opsi Dataset yang Bisa Dipilih Nanti:
1. **Opsi A (Dataset Kursus Online - Coursera/Udemy/edX dll)**
   - *Konsep:* Memasukkan dataset ribuan kursus asli (lengkap dengan URL, rating, silabus) ke dalam database vektor.
   - *Keuntungan:* Saat Gemini memberikan rekomendasi belajar di Roadmap, link dan referensi yang diberikan adalah kursus *real-world* yang benar-benar ada, bukan link karangan/halusinasi AI.
2. **Opsi B (Dataset Lowongan Kerja - LinkedIn/Glassdoor)**
   - *Konsep:* Menggunakan dataset deskripsi lowongan kerja asli dari industri.
   - *Keuntungan:* Memvalidasi syarat "Skill" untuk suatu job role berdasarkan data industri terbanyak/terbaru saat ini, bukan sekedar asumsi.

*(Catatan ini disimpan untuk referensi saat pengembangan fitur Kaggle Dataset dilanjutkan)*