# PT. Greenfields Indonesia — Industrial Predictive Maintenance Platform

<p align="center">
  <img src="client/public/greenfields.png" alt="Greenfields Logo" width="220" />
</p>

Sistem pemantauan prediktif berbasis IoT terpadu yang dirancang khusus untuk operasional pabrik **PT. Greenfields Indonesia**. Platform ini mendeteksi anomali performa mesin, memprediksi potensi kegagalan (downtime), dan mempermudah koordinasi tim pemeliharaan (maintenance) menggunakan kecerdasan buatan **Gemini 2.0 Flash**.

Sistem ini dibangun dengan arsitektur modern menggunakan **Go (Gin) Backend API**, **Next.js Web Dashboard** (untuk Supervisor/Admin), dan **Expo React Native Mobile App** (untuk Operator & Mekanik di area produksi).

---

## 📂 Struktur Proyek (Monorepo)

Proyek ini terbagi menjadi 3 bagian utama:

| Direktori | Deskripsi | Teknologi Utama |
| :--- | :--- | :--- |
| **`server/`** | Backend API berkinerja tinggi, Scheduler background, dan IoT Simulator. | Go (Golang) 1.25, Gin, pgx/v5 (Postgres Connection Pool), JWT, Web Push VAPID, OpenRouter API (Gemini 2.0 Flash) |
| **`client/`** | Web Dashboard interaktif untuk monitoring tingkat tinggi dan manajemen sistem. | Next.js 16 (App Router), React 19, Tailwind CSS v4, Radix UI, Recharts, Zustand, Web Push PWA client |
| **`mobile/`** | Aplikasi mobile responsif untuk operator lapangan & tim mekanik. | Expo 55, React Native 0.83, Geist Font, Custom SVG Icon, Showcase Switcher Menu (10 Screens) |

---

## 🔄 Alur Kerja Sistem (System Workflows)

Berikut adalah diagram visual alur pemrosesan data telemetry, pendeteksian anomali, kalkulasi risiko menggunakan AI, hingga pengiriman notifikasi instan:

<p align="center">
  <img src="client/public/SystemWorkflows.png" alt="System Workflows" width="1000" />
</p>

### Penjelasan Alur Detail:
1. **Sensor Telemetry**: Simulator internal Go mengirimkan pembacaan sensor (*Suhu, Getaran, Tekanan, RPM, Efisiensi*) setiap 15 detik untuk 5 mesin pabrik.
2. **Deteksi Anomali**: Jika sensor mendeteksi parameter di luar batas aman (misalnya suhu > 85°C atau getaran abnormal), sistem menandai data tersebut sebagai anomali.
3. **Pencatatan Insiden**: Insiden baru otomatis dibuat dengan status `OPEN`.
4. **Analisis Prediktif AI (Gemini)**: Sistem langsung mengirimkan data historis sensor ke **Gemini 2.0 Flash** untuk memproyeksikan sisa waktu mesin sebelum gagal (*Estimated Failure Hours*), tingkat risiko (*Risk Level*), persentase kesehatan (*Health %*), serta langkah mitigasi konkret.
5. **Distribusi Alarm**: PWA Web Push memicu alert di monitor Supervisor, dan Expo Push Notification mengirimkan alarm ke ponsel Operator.
6. **Resolusi Lapangan**: Operator lapangan mendatangi lokasi, memeriksa mesin, mengambil foto bukti, dan memperbarui status insiden dari Dashboard Web maupun Mobile.

---

## 🛠️ Fitur Utama Per Komponen

### 1. Go Backend Server (`server`)
*   **IoT Simulator Ticker**: Menghasilkan data telemetry real-time dengan variasi pola anomali yang realistis (suhu naik drastis, kebocoran tekanan, osilasi getaran).
*   **Integrasi AI Gemini**: Penghubung ke OpenRouter API untuk analisis risiko prediktif.
*   **Risk Engine**: Pekerjaan latar belakang (background job) setiap 2 menit untuk merevaluasi tingkat keparahan insiden aktif.
*   **Push Broker**: Mengoordinasikan push notification Web (VAPID) dan Mobile (Expo Push API).
*   **Audit Logging**: Pencatatan riwayat aksi secara ketat untuk kebutuhan kepatuhan regulasi industri (ISO).

### 2. Next.js Web Dashboard (`client`)
*   **Live Metrics Board**: Grafik area dan bar yang dinamis dari Recharts untuk visualisasi anomali sensor.
*   **Simulation Console**: Panel khusus untuk mensimulasikan kegagalan mesin secara manual guna menguji respons sistem.
*   **Master Machine Registry**: Manajemen database mesin operasional PT. Greenfields Indonesia.
*   **Audit Trail**: Riwayat tindakan pelacakan insiden secara real-time.
*   **PWA Support**: Notifikasi push tetap muncul di background meskipun browser ditutup.

### 3. Expo Mobile App (`mobile`)
*   **Greenfields Theme**: Antarmuka modern berlatar putih bersih dengan aksen **Green-700 (#15803d)**.
*   **10 Screens Presentation Mockup**:
    1.  *Splash Screen*: Loading logo Greenfield dengan tagline profesional.
    2.  *Onboarding 1, 2, 3*: Ilustrasi pemantauan, deteksi dini, dan laporan insiden.
    3.  *Login Screen*: Formulir login minimalis yang terintegrasi.
    4.  *Operator Dashboard*: Metrik status mesin (Healthy/Warning/Critical), grafik mini (sparklines), dan daftar insiden terbaru.
    5.  *Machine Detail*: Grafik status sensor real-time dan timeline pemeliharaan.
    6.  *Lapor Insiden*: Formulir pelaporan kerusakan dilengkapi simulator upload foto mesin.
    7.  *Notification Center*: Alarm kritis dan pembaruan sistem.
    8.  *Profil & Settings*: Preferensi notifikasi dan toggle tema.
*   **Developer Showcase Switcher**: Menu melayang (floating panel) di web simulator untuk berpindah dengan instan ke layar mana pun dari 10 screen untuk presentasi cepat.
*   **Zero-Dependency Icon System**: Render SVG yang sangat tajam di Web, otomatis fallback ke unicode aman di HP asli agar tidak crash akibat modul native.

---

## 🚀 Panduan Setup & Instalasi

### Kredensial Pengujian Default
Sistem dilengkapi akun administrator awal untuk kemudahan pengujian:
*   **Email**: `admin@greenfields.com`
*   **Password**: `Admin@123`
*   **Role**: `SUPERVISOR`

---

### Langkah 1: Setup Database (Supabase)
Sistem ini menggunakan Supabase PostgreSQL untuk menyimpan semua data relasional.

1.  Buat akun gratis di [Supabase](https://supabase.com/).
2.  Buat project baru (misal: `Predictive-Maintenance-Greenfields`).
3.  Buka menu **SQL Editor** pada sidebar Supabase Anda.
4.  Jalankan file SQL schema dari folder server sesuai urutan berikut:
    *   Salin isi file [001_init_schema.sql](file:///d:/Predictive-Maintenance/server/migrations/001_init_schema.sql) lalu klik **Run**.
    *   Salin isi file [002_seed.sql](file:///d:/Predictive-Maintenance/server/migrations/002_seed.sql) lalu klik **Run** (ini akan membuat akun admin dan 5 data mesin).
    *   Salin isi file [003_create_ai_analyses.sql](file:///d:/Predictive-Maintenance/server/migrations/003_create_ai_analyses.sql) lalu klik **Run**.
5.  Masuk ke menu **Project Settings -> Database**, temukan bagian **Connection String**. Salin URL bertipe URI (URI Mode) untuk database Anda.

---

### Langkah 2: Setup & Jalankan Go Backend Server
1.  Masuk ke direktori server:
    ```bash
    cd server
    ```
2.  Duplikat file konfigurasi environment:
    ```bash
    cp .env.example .env
    ```
3.  Buka file `.env` di editor teks Anda dan konfigurasi variabel berikut:
    ```env
    APP_PORT=8080
    APP_ENV=development

    # URL Supabase Database Anda
    DATABASE_URL=postgresql://postgres.[REF_PROJECT]:[PASSWORD_DB]@aws-0-[REGION].pooler.supabase.com:6543/postgres?sslmode=require
    DATABASE_URL_DIRECT=postgresql://postgres:[PASSWORD_DB]@db.[REF_PROJECT].supabase.co:5432/postgres?sslmode=require

    # Kunci JWT untuk Autentikasi
    JWT_SECRET=GreenfieldsPredictiveMaintenanceSecretKey2026
    
    # URL Frontend Client
    CORS_ALLOWED_ORIGINS=http://localhost:3000

    # API Key OpenRouter untuk Gemini 2.0 Flash
    OPENROUTER_API_KEY=your_openrouter_api_key_here
    OPENROUTER_MODEL=google/gemini-2.0-flash-001
    
    # Konfigurasi Notifikasi Web Push PWA (VAPID)
    VAPID_PUBLIC_KEY=your_public_key
    VAPID_PRIVATE_KEY=your_private_key
    VAPID_EMAIL=mailto:admin@greenfields.com
    ```
4.  Unduh dependency Go dan jalankan server:
    ```bash
    go mod tidy
    go run main.go
    ```
    Server Anda kini aktif di `http://localhost:8080`.

---

### Langkah 3: Setup & Jalankan Web Dashboard (`client`)
1.  Buka terminal baru dan masuk ke direktori client:
    ```bash
    cd client
    ```
2.  Pastikan node modules terinstal menggunakan **pnpm**:
    ```bash
    pnpm install
    ```
3.  Pastikan file `.env.local` sudah berisi URL target API Go Backend:
    ```env
    NEXT_PUBLIC_API_URL=http://localhost:8080
    ```
4.  Jalankan server pengembangan:
    ```bash
    pnpm run dev
    ```
5.  Buka browser dan buka `http://localhost:3000`. Gunakan kredensial `admin@greenfields.com` / `Admin@123` untuk login.

---

### Langkah 4: Setup & Jalankan Mobile App (`mobile`)
1.  Buka terminal baru dan masuk ke direktori mobile:
    ```bash
    cd mobile
    ```
2.  Instal dependency menggunakan **pnpm**:
    ```bash
    pnpm install
    ```
3.  Jalankan server Expo:
    ```bash
    pnpm start
    ```
4.  **Untuk Uji Coba pada Web Browser (Simulator)**:
    *   Tekan tombol **`w`** di terminal Anda. Ini akan membuka aplikasi mobile di browser komputer Anda dengan frame handphone virtual yang sangat interaktif.
    *   Anda dapat menggunakan menu floating **"Pilih Screen"** di sudut kanan bawah untuk berpindah di antara 10 layar yang sudah disediakan.
5.  **Untuk Uji Coba pada HP Android Fisik (Expo Go)**:
    *   Jika aplikasi Expo Go Anda tidak kompatibel dengan SDK versi terbaru (SDK 55), silakan buka browser HP Android Anda dan kunjungi **[expo.dev/go](https://expo.dev/go)**.
    *   Pilih **SDK 55** pada menu pilihan versi, download file APK, lalu instal di HP Anda.
    *   Scan QR code dari terminal menggunakan aplikasi Expo Go tersebut.
    *   *(Atau alternatifnya, hubungkan HP dengan kabel data via USB Debugging, lalu tekan tombol **`a`** di terminal untuk pemasangan otomatis oleh CLI).*

---

**© 2026 (Bismillah) Intern PT. Greenfields Indonesia*
