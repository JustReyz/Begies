Berikut adalah draf dokumen PRD (Product Requirements Document) baru yang sudah disesuaikan sepenuhnya untuk arsitektur 2 pengguna (Bewwy & Egie), menggunakan ekosistem Next.js, Vercel, dan Aiven PostgreSQL.

---

# PRD — Shared Cash Flow + College Class Notifier PWA

**Version:** 1.0 | **Target Users:** Bewwy & Egie | **Date:** 3 September 2026

## 1. Overview

Aplikasi PWA (*Progressive Web App*) berfokus ganda: melacak arus kas bersama dan memberikan notifikasi jadwal kelas perkuliahan. Aplikasi ini dirancang khusus untuk 2 pengguna (Bewwy dan Egie) dengan kemampuan sinkronisasi data secara *real-time* antar perangkat dan fitur *push notification* berbasis *serverless*.

**Problem:** Pencatatan pengeluaran/pemasukan bersama sering tercecer, dan jadwal kelas sering terlewat jika hanya mengandalkan ingatan atau catatan statis.
**Goal:** Satu aplikasi terpusat untuk memantau keuangan berdua secara transparan dan memastikan tidak ada kelas yang terlewat berkat notifikasi otomatis.

## 2. Goals / Non-Goals

**Goals (MVP):**

* Sinkronisasi data arus kas secara instan antara 2 pengguna.
* Perhitungan sisa saldo, agregasi pengeluaran bulanan, dan peringatan batas *budget*.
* Notifikasi *push* (VAPID) 15 menit sebelum kelas dimulai untuk masing-masing pengguna, bahkan saat aplikasi ditutup.

**Non-Goals (MVP):**

* Tidak ada sistem otentikasi kompleks (seperti OAuth, JWT multi-tenant, atau Supabase Auth).
* Tidak ada sinkronisasi otomatis dengan rekening bank.
* Tidak dirilis ke App Store/Play Store (tetap berformat PWA web).

## 3. Tech Stack (Cepat & Ringan)

* **Frontend & Backend API:** Next.js (App Router)
* **Hosting & Cron Jobs:** Vercel (Frontend Hosting + Serverless Functions + Vercel Cron)
* **Database:** PostgreSQL (di-host di Aiven)
* **ORM:** Prisma
* **Data Fetching:** SWR atau React Query (untuk sinkronisasi UI tanpa beban WebSockets)
* **Styling:** Tailwind CSS
* **Notifications:** `web-push` (Node.js) + Service Worker (PWA)

## 4. Fitur Utama & Ruang Lingkup

### 4.1. Shared Cash Flow Management

* **Entitas Transaksi:** Menyimpan nominal, jenis (Pemasukan/Pengeluaran), kategori, tanggal, catatan, dan siapa yang menginput (`added_by`: 'Bewwy' atau 'Egie').
* **Dashboard Dinamis:** Menampilkan total saldo saat ini (kalkulasi dinamis dari tabel, bukan nilai statis), grafik pengeluaran bulanan, dan progres *budget*.
* **Sistem Budgeting:** Menetapkan batas pengeluaran bulanan bersama. UI akan menampilkan peringatan warna merah jika pengeluaran sudah mendekati atau melebihi batas.

### 4.2. College Class Notifier

* **Manajemen Jadwal:** UI untuk menambah, mengedit, dan melihat jadwal kelas mingguan masing-masing (Bewwy dan Egie).
* **Notifikasi Push Cerdas:** Vercel Cron Job berjalan setiap 5-15 menit untuk memeriksa jadwal. Jika ada kelas yang akan dimulai dalam 15 menit, serverless API menembakkan notifikasi VAPID ke *device* mahasiswa yang bersangkutan (menggunakan data dari tabel `PushSubscription`).

## 5. Keamanan & Akses

* **Akses Pintu Masuk:** Menggunakan 1 PIN Global statis (misal 4 digit) yang divalidasi di sisi *frontend* dan disimpan via *cookies/local storage* untuk mencegah akses dari pihak luar.
* **Identifikasi Pengguna:** Setelah masuk via PIN, pengguna memilih profil mereka ('Bewwy' atau 'Egie') yang akan digunakan sebagai identitas `added_by` pada transaksi dan pendaftaran langganan notifikasi.

## 6. Model Data (Prisma Schema)

Arsitektur database relasional pada PostgreSQL:

```prisma
model Pengguna {
  id_pengguna   Int                 @id @default(autoincrement())
  nama          String              // 'Bewwy' atau 'Egie'
  transaksi     Transaksi[]
  mataKuliah    MataKuliah[]
  langgananPush PushSubscription[]
}

model Transaksi {
  id_transaksi  Int       @id @default(autoincrement())
  jenis         String    // 'Income' atau 'Outcome'
  nominal       Float
  kategori      String
  tanggal       DateTime  @default(now())
  catatan       String?
  id_pengguna   Int       // added_by
  pengguna      Pengguna  @relation(fields: [id_pengguna], references: [id_pengguna])
}

model MataKuliah {
  id_mk         Int       @id @default(autoincrement())
  nama_mk       String
  id_pengguna   Int
  pengguna      Pengguna  @relation(fields: [id_pengguna], references: [id_pengguna])
  jadwal        Jadwal[]
}

model Jadwal {
  id_jadwal     Int         @id @default(autoincrement())
  hari          String      // 'Senin', 'Selasa', dst.
  waktu_mulai   String      // Format 'HH:mm'
  waktu_selesai String?     // Format 'HH:mm'
  ruangan       String?
  id_mk         Int
  mataKuliah    MataKuliah  @relation(fields: [id_mk], references: [id_mk])
}

model PushSubscription {
  id            Int       @id @default(autoincrement())
  id_pengguna   Int
  endpoint      String    @unique
  p256dh        String
  auth          String
  pengguna      Pengguna  @relation(fields: [id_pengguna], references: [id_pengguna])
}

```

## 7. User Stories (MVP)

* Sebagai Bewwy, aku bisa menginput pengeluaran makan Rp50.000, sehingga sisa saldo bersama di HP Egie otomatis berkurang tanpa perlu Egie melakukan *refresh*.
* Sebagai pengguna, aku bisa melihat apakah pengeluaran bulan ini sudah melebihi batas *budget* bersama yang ditetapkan.
* Sebagai Egie, aku mendapat *push notification* "Kelas Komputasi Statistika II di R II.2.1 mulai dalam 15 menit!" di *handphone* meskipun sedang tidak membuka peramban web.
* Sebagai pengguna, saat pertama kali membuka web, aku bisa menyetujui izin notifikasi agar *device*-ku terdaftar di sistem *PushSubscription*.

## 8. Kriteria Penerimaan (Acceptance Criteria)

* [ ] Aplikasi bisa diinstal sebagai PWA di perangkat Android/iOS (Add to Home Screen).
* [ ] Transaksi yang ditambahkan oleh satu pengguna langsung muncul di riwayat transaksi pengguna lain (via SWR/React Query).
* [ ] UI *Dashboard* menampilkan kalkulasi Net Saldo (Total Pemasukan - Total Pengeluaran) secara akurat.
* [ ] Vercel Cron Job berhasil membaca jadwal hari ini dan waktu_mulai.
* [ ] Notifikasi masuk ke perangkat pengguna yang tepat (sesuai `id_pengguna` pada jadwal) sekitar 15 menit sebelum `waktu_mulai`.
* [ ] Akses awal ke aplikasi terlindungi oleh PIN sederhana.
