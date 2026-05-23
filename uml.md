# 📐 UML Diagrams — Greenfields Predictive Maintenance

---

## 1. Use Case Diagram

> **Untuk Figma:** Gambarkan dua aktor (Supervisor & Operator) di kiri/kanan, use case sebagai oval di tengah, sistem sebagai kotak besar membungkus semua use case.

```mermaid
graph LR
    SUP(["👔 Supervisor"])
    OPR(["👷 Operator"])

    subgraph SYSTEM["🏭 Greenfields Predictive Maintenance System"]

        subgraph AUTH["Authentication"]
            UC1(["Login"])
            UC2(["Logout"])
            UC3(["Refresh Token"])
        end

        subgraph DASHBOARD["Dashboard & Monitoring"]
            UC4(["Lihat Attention Dashboard"])
            UC5(["Lihat Status Mesin Real-time"])
            UC6(["Lihat Incident List"])
            UC7(["Lihat Detail Incident"])
        end

        subgraph AI["AI Analysis"]
            UC8(["Lihat AI Analysis Card"])
            UC9(["Trigger Analisis Ulang"])
            UC10(["Lihat Health Percentage"])
            UC11(["Lihat Prediksi & Rekomendasi"])
        end

        subgraph INCIDENT["Incident Management"]
            UC12(["Acknowledge Incident"])
            UC13(["Update Status Incident"])
            UC14(["Resolve Incident"])
            UC15(["Hapus Incident"])
        end

        subgraph AUDIT["Audit & Notifikasi"]
            UC16(["Lihat Audit Trail"])
            UC17(["Terima Push Notification"])
            UC18(["Daftar Push Subscription"])
        end

        subgraph SYSTEM_AUTO["System Automation"]
            UC19(["Simulator Generate Sensor"])
            UC20(["Auto-Detect Anomali"])
            UC21(["Auto-Create Incident"])
            UC22(["Auto-Hitung Risk Score"])
            UC23(["Auto-Kirim Notifikasi"])
        end

    end

    %% Supervisor use cases
    SUP --- UC1
    SUP --- UC2
    SUP --- UC4
    SUP --- UC5
    SUP --- UC6
    SUP --- UC7
    SUP --- UC8
    SUP --- UC9
    SUP --- UC10
    SUP --- UC11
    SUP --- UC12
    SUP --- UC13
    SUP --- UC14
    SUP --- UC15
    SUP --- UC16
    SUP --- UC17
    SUP --- UC18

    %% Operator use cases
    OPR --- UC1
    OPR --- UC2
    OPR --- UC5
    OPR --- UC6
    OPR --- UC7
    OPR --- UC8
    OPR --- UC10
    OPR --- UC11
    OPR --- UC12
    OPR --- UC13
    OPR --- UC14
    OPR --- UC17
    OPR --- UC18
```

### Tabel Use Case

| ID | Use Case | Supervisor | Operator | Keterangan |
|---|---|---|---|---|
| UC1 | Login | ✅ | ✅ | Email + password |
| UC2 | Logout | ✅ | ✅ | Invalidate token |
| UC3 | Refresh Token | ✅ | ✅ | Otomatis oleh sistem |
| UC4 | Lihat Attention Dashboard | ✅ | ❌ | Full dashboard web only |
| UC5 | Lihat Status Mesin Real-time | ✅ | ✅ | Web + Mobile |
| UC6 | Lihat Incident List | ✅ | ✅ | Sorted by risk score |
| UC7 | Lihat Detail Incident | ✅ | ✅ | Web + Mobile |
| UC8 | Lihat AI Analysis Card | ✅ | ✅ | Health %, trend, prediksi |
| UC9 | Trigger Analisis Ulang | ✅ | ❌ | Supervisor only |
| UC10 | Lihat Health Percentage | ✅ | ✅ | Dari hasil Gemini |
| UC11 | Lihat Prediksi & Rekomendasi | ✅ | ✅ | Bahasa Indonesia |
| UC12 | Acknowledge Incident | ✅ | ✅ | OPEN → IN_PROGRESS |
| UC13 | Update Status Incident | ✅ | ✅ | Semua status |
| UC14 | Resolve Incident | ✅ | ✅ | IN_PROGRESS → RESOLVED |
| UC15 | Hapus Incident | ✅ | ❌ | Soft delete, supervisor only |
| UC16 | Lihat Audit Trail | ✅ | ❌ | Supervisor only |
| UC17 | Terima Push Notification | ✅ | ✅ | PWA (web) + Expo (mobile) |
| UC18 | Daftar Push Subscription | ✅ | ✅ | Saat pertama login |
| UC19-23 | System Automation | 🤖 | 🤖 | Dijalankan otomatis sistem |

---

## 2. Sequence Diagram — Login & Auth

> **Untuk Figma:** Gambarkan sebagai sequence diagram vertikal. Aktor di kiri, sistem di tengah, database di kanan.

```mermaid
sequenceDiagram
    actor User as 👤 User
    participant FE as 🖥️ Frontend
    participant API as ⚙️ Golang API
    participant DB as 🗄️ Supabase

    User->>FE: Isi email + password
    FE->>API: POST /api/v1/auth/login
    API->>DB: SELECT user WHERE email = ?
    DB-->>API: User data + hashed password
    API->>API: bcrypt.Compare(password, hash)

    alt Password salah
        API-->>FE: 401 Unauthorized
        FE-->>User: "Email atau password salah"
    else Password benar
        API->>API: Generate JWT access token (8 jam)
        API->>API: Generate refresh token (7 hari)
        API->>DB: INSERT push_subscriptions
        API-->>FE: 200 OK + {access_token, refresh_token, user}
        FE->>FE: Simpan token di memory
        FE-->>User: Redirect ke Dashboard
    end
```

---

## 3. Sequence Diagram — Simulator & Auto Incident

> **Untuk Figma:** Tunjukkan Simulator sebagai entitas terpisah yang berjalan otomatis tanpa trigger dari user.

```mermaid
sequenceDiagram
    participant SIM as 🤖 Simulator<br/>(Goroutine)
    participant SCR as 🧮 Scoring Engine
    participant DB as 🗄️ Supabase
    participant GEM as ✨ Gemini API
    participant PUSH as 🔔 Push Service

    loop Setiap 30 Detik
        SIM->>SIM: Generate sensor reading<br/>(suhu, getaran, tekanan, RPM)
        SIM->>DB: INSERT sensor_readings

        alt Nilai dalam threshold (70%)
            SIM->>SIM: Skip, lanjut mesin berikutnya
        else Anomali terdeteksi (30%)
            SIM->>SIM: Tentukan severity<br/>(LOW/MEDIUM/HIGH/CRITICAL)
            SIM->>SCR: Hitung risk score
            SCR->>DB: COUNT incidents 7 hari terakhir
            DB-->>SCR: recent_count
            SCR->>DB: GET last severity mesin ini
            DB-->>SCR: last_severity
            SCR->>SCR: Base + Modifier 1,2,3
            SCR-->>SIM: risk_score (0-100)
            SIM->>DB: INSERT incidents (+ risk_score)

            par Async Goroutine
                SIM->>DB: GET sensor_readings 2 jam terakhir
                DB-->>SIM: readings[]
                SIM->>DB: GET incidents 10 terakhir
                DB-->>SIM: incidents[]
                SIM->>GEM: POST prompt + data
                GEM-->>SIM: JSON analysis result
                SIM->>DB: INSERT ai_analyses
            end

            alt risk_score >= 61
                SIM->>DB: GET push_subscriptions supervisors
                DB-->>SIM: subscriptions[]
                SIM->>PUSH: Send Web Push (supervisor)
                SIM->>PUSH: Send Expo Push (operator)
            end
        end
    end
```

---

## 4. Sequence Diagram — Supervisor Lihat Dashboard

```mermaid
sequenceDiagram
    actor SUP as 👔 Supervisor
    participant WEB as 🖥️ Next.js
    participant API as ⚙️ Golang API
    participant DB as 🗄️ Supabase

    SUP->>WEB: Buka Dashboard
    WEB->>API: GET /api/v1/incidents?sort=risk_score
    API->>DB: SELECT incidents WHERE deleted_at IS NULL<br/>ORDER BY risk_score DESC
    DB-->>API: incidents[]
    API-->>WEB: 200 OK + incidents[]
    WEB->>WEB: Render attention table<br/>(color coded by risk_score)
    WEB-->>SUP: Tampilkan dashboard

    loop Auto-refresh setiap 30 detik
        WEB->>API: GET /api/v1/incidents (TanStack Query)
        API->>DB: SELECT incidents...
        DB-->>API: incidents[] (updated)
        API-->>WEB: 200 OK
        WEB->>WEB: Re-render jika ada perubahan
        WEB-->>SUP: Dashboard terupdate
    end

    SUP->>WEB: Klik incident merah
    WEB->>API: GET /api/v1/incidents/:id
    API->>DB: SELECT incident + audit_logs
    DB-->>API: incident detail
    API-->>WEB: 200 OK + detail
    WEB->>API: GET /api/v1/machines/:id/analysis
    API->>DB: SELECT ai_analyses terbaru
    DB-->>API: analysis data
    API-->>WEB: 200 OK + analysis
    WEB-->>SUP: Tampilkan detail + AI card
```

---

## 5. Sequence Diagram — Operator Resolve Incident

```mermaid
sequenceDiagram
    actor OPR as 👷 Operator
    participant MOB as 📱 React Native
    participant API as ⚙️ Golang API
    participant DB as 🗄️ Supabase

    Note over MOB: Push notification masuk
    MOB->>OPR: 🔔 "Mesin Filling #2 — HIGH RISK"

    OPR->>MOB: Tap notifikasi
    MOB->>API: GET /api/v1/incidents/:id
    API->>DB: SELECT incident
    DB-->>API: incident data
    API-->>MOB: 200 OK
    MOB-->>OPR: Tampilkan detail + rekomendasi AI

    OPR->>MOB: Tap "Mulai Tangani"
    MOB->>API: PUT /api/v1/incidents/:id/acknowledge
    API->>DB: UPDATE incidents SET status = 'IN_PROGRESS',<br/>acknowledged_by = user_id,<br/>acknowledged_at = NOW()
    API->>DB: INSERT audit_logs<br/>(action: STATUS_UPDATED,<br/>old: OPEN, new: IN_PROGRESS)
    DB-->>API: OK
    API-->>MOB: 200 OK
    MOB-->>OPR: Status berubah IN_PROGRESS ✅

    Note over OPR: Operator tangani di lapangan

    OPR->>MOB: Tap "Selesai"
    MOB->>API: PUT /api/v1/incidents/:id/resolve
    API->>DB: UPDATE incidents SET status = 'RESOLVED',<br/>resolved_by = user_id,<br/>resolved_at = NOW(),<br/>risk_score = 0
    API->>DB: INSERT audit_logs<br/>(action: STATUS_UPDATED,<br/>old: IN_PROGRESS, new: RESOLVED)
    DB-->>API: OK
    API-->>MOB: 200 OK
    MOB-->>OPR: Incident RESOLVED ✅ 🟢
```

---

## 6. Sequence Diagram — AI Analysis (Gemini)

```mermaid
sequenceDiagram
    participant SIM as 🤖 Simulator
    participant SVC as ⚙️ AI Service
    participant DB as 🗄️ Supabase
    participant GEM as ✨ Gemini API
    participant PUSH as 🔔 Push Service
    participant WEB as 🖥️ Dashboard

    SIM->>SVC: AnalyzeMachine(machineID) [async goroutine]

    SVC->>DB: SELECT sensor_readings<br/>WHERE machine_id = ?<br/>AND read_at >= NOW() - 2 hours<br/>ORDER BY read_at DESC
    DB-->>SVC: readings[] (last 2 hours)

    SVC->>DB: SELECT incidents<br/>WHERE machine_id = ?<br/>ORDER BY created_at DESC LIMIT 10
    DB-->>SVC: incidents[] (last 10)

    SVC->>SVC: BuildPrompt(<br/>  machine info,<br/>  threshold,<br/>  readings,<br/>  incidents<br/>)

    SVC->>GEM: POST /v1beta/models/gemini-2.0-flash:generateContent
    Note over GEM: Gemini analisis:<br/>- Tren sensor<br/>- Pattern anomali<br/>- Prediksi failure<br/>- Health %

    alt Gemini response OK
        GEM-->>SVC: JSON {risk_level, risk_score,<br/>health_percentage, trend,<br/>prediction, recommendation,<br/>estimated_failure_hours, urgent}
        SVC->>DB: INSERT ai_analyses
        DB-->>SVC: OK

        alt urgent = true
            SVC->>DB: GET push_subscriptions
            DB-->>SVC: subscriptions[]
            SVC->>PUSH: Send alert notification
            PUSH-->>SVC: Delivered
        end

        SVC-->>SIM: Analysis saved ✅

    else Gemini error / timeout
        GEM-->>SVC: Error / timeout
        SVC->>DB: GET last ai_analyses (fallback)
        DB-->>SVC: last analysis
        SVC-->>SIM: Return last analysis (graceful fallback)
    end

    WEB->>SVC: GET /api/v1/machines/:id/analysis
    SVC->>DB: SELECT ai_analyses ORDER BY analyzed_at DESC LIMIT 1
    DB-->>SVC: latest analysis
    SVC-->>WEB: 200 OK + analysis data
    WEB-->>WEB: Render AI Analysis Card
```

---

## 7. Sequence Diagram — Blue-Green Deployment

```mermaid
sequenceDiagram
    actor DEV as 👨‍💻 Developer
    participant GIT as 📦 GitHub
    participant VM as 🖥️ VM Ubuntu
    participant NGX as ⚡ Nginx
    participant BLUE as 🔵 BLUE API :8080
    participant GREEN as 🟢 GREEN API :8081

    Note over BLUE: Currently serving traffic

    DEV->>GIT: git push origin main
    DEV->>VM: ssh into VM

    VM->>VM: git pull origin main
    VM->>GREEN: docker compose build api-green
    VM->>GREEN: docker compose up -d api-green

    VM->>GREEN: Health check GET :8081/health
    GREEN-->>VM: 200 OK ✅

    VM->>VM: bash scripts/switch.sh

    VM->>NGX: Update nginx.conf<br/>BLUE → GREEN
    VM->>NGX: nginx -s reload

    Note over NGX: < 1 detik, zero downtime

    NGX->>GREEN: Traffic dialihkan ke GREEN
    GREEN-->>NGX: Serving requests ✅

    Note over BLUE: Tetap running sebagai fallback

    alt Ada bug di GREEN
        DEV->>VM: bash scripts/rollback.sh
        VM->>NGX: Update nginx.conf<br/>GREEN → BLUE
        VM->>NGX: nginx -s reload
        NGX->>BLUE: Traffic kembali ke BLUE
        BLUE-->>NGX: Serving requests ✅
        Note over GREEN: GREEN dihentikan untuk diperbaiki
    else GREEN stabil
        DEV->>VM: docker stop greenfields-blue
        Note over BLUE: BLUE dihentikan, hemat RAM
    end
```

---

## Ringkasan Diagram

| No | Diagram | Tipe | Fungsi |
|---|---|---|---|
| 1 | System Architecture | Flowchart | Gambaran besar semua komponen |
| 2 | ERD Database | Entity Relationship | Struktur & relasi tabel |
| 3 | Simulator Flow | Flowchart | Cara kerja auto-detection anomali |
| 4 | Risk Scoring Engine | Flowchart | Formula kalkulasi risk score |
| 5 | AI Analysis Flow | Flowchart | Alur integrasi Gemini API |
| 6 | Deployment Blue-Green | Flowchart | Zero-downtime deployment |
| 7 | User Flow | Flowchart | Alur Supervisor & Operator |
| 8 | **Use Case Diagram** | **UML** | Hak akses per role |
| 9 | **Sequence — Login** | **UML** | Alur autentikasi |
| 10 | **Sequence — Simulator** | **UML** | Alur auto-incident creation |
| 11 | **Sequence — Dashboard** | **UML** | Alur supervisor monitoring |
| 12 | **Sequence — Resolve** | **UML** | Alur operator tangani incident |
| 13 | **Sequence — AI Analysis** | **UML** | Alur integrasi Gemini + fallback |
| 14 | **Sequence — Blue-Green** | **UML** | Alur zero-downtime deployment |