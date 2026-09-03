const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Seeding initial data...');

  // 1. Create Users (Bewwy & Egie)
  const bewwy = await prisma.pengguna.upsert({
    where: { nama: 'Bewwy' },
    update: {},
    create: { id_pengguna: 1, nama: 'Bewwy' },
  });

  const egie = await prisma.pengguna.upsert({
    where: { nama: 'Egie' },
    update: {},
    create: { id_pengguna: 2, nama: 'Egie' },
  });

  console.log('Users created:', bewwy.nama, egie.nama);

  // 2. Default Monthly Budget
  const currentMonth = new Date().toISOString().slice(0, 7);
  await prisma.anggaran.upsert({
    where: { id_anggaran: 1 },
    update: {},
    create: {
      id_anggaran: 1,
      bulan: currentMonth,
      batas_nominal: 3500000,
    },
  });

  // 3. Initial Sample Transaksi
  const countTx = await prisma.transaksi.count();
  if (countTx === 0) {
    const today = new Date();
    await prisma.transaksi.createMany({
      data: [
        {
          jenis: 'Income',
          nominal: 5000000,
          kategori: 'Transfer Uang Bulanan',
          tanggal: new Date(today.getFullYear(), today.getMonth(), 1),
          catatan: 'Uang saku gabungan',
          id_pengguna: 1,
        },
        {
          jenis: 'Outcome',
          nominal: 1200000,
          kategori: 'Sewa Kos',
          tanggal: new Date(today.getFullYear(), today.getMonth(), 2),
          catatan: 'Kos Egie & Bewwy',
          id_pengguna: 2,
        },
        {
          jenis: 'Outcome',
          nominal: 450000,
          kategori: 'Belanja Bulanan',
          tanggal: new Date(today.getFullYear(), today.getMonth(), 5),
          catatan: 'Kebutuhan dapur & mandi',
          id_pengguna: 1,
        },
        {
          jenis: 'Outcome',
          nominal: 50000,
          kategori: 'Makanan & Minuman',
          tanggal: new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1),
          catatan: 'Makan siang bersama',
          id_pengguna: 1,
        },
        {
          jenis: 'Outcome',
          nominal: 35000,
          kategori: 'Bensin & Transport',
          tanggal: new Date(today.getFullYear(), today.getMonth(), today.getDate()),
          catatan: 'Isi Pertamax motor',
          id_pengguna: 2,
        },
      ],
    });
    console.log('Sample transactions created.');
  }

  // 4. Initial Courses & Schedules from SQL.txt
  const countMK = await prisma.mataKuliah.count();
  if (countMK === 0) {
    const coursesData = [
      { nama_mk: 'Kerja Praktik', id_pengguna: 1, hari: 'Senin', waktu_mulai: '08:00', waktu_selesai: '16:00', ruangan: 'Uvaya' },
      { nama_mk: 'KKN', id_pengguna: 1, hari: 'Senin', waktu_mulai: '07:00', waktu_selesai: '12:00', ruangan: 'Bank Sampah/ULM' },
      { nama_mk: 'Komputasi Statistika II', id_pengguna: 2, hari: 'Senin', waktu_mulai: '13:00', waktu_selesai: '15:30', ruangan: 'R II.2.1' },
      { nama_mk: 'Bahasa Indonesia', id_pengguna: 2, hari: 'Senin', waktu_mulai: '15:30', waktu_selesai: '18:00', ruangan: 'R I.2.4' },
      { nama_mk: 'Academic English', id_pengguna: 2, hari: 'Selasa', waktu_mulai: '13:00', waktu_selesai: '15:30', ruangan: 'R II.2.1' },
      { nama_mk: 'Bina Fisik dan Mental', id_pengguna: 2, hari: 'Selasa', waktu_mulai: '15:30', waktu_selesai: '17:10', ruangan: 'R I.2.5' },
      { nama_mk: 'Kalkulus III', id_pengguna: 2, hari: 'Rabu', waktu_mulai: '10:30', waktu_selesai: '13:00', ruangan: 'R I.2.5' },
      { nama_mk: 'Metode Numerik', id_pengguna: 2, hari: 'Rabu', waktu_mulai: '13:00', waktu_selesai: '14:40', ruangan: 'R II.2.1' },
      { nama_mk: 'Statistika Inferensia', id_pengguna: 2, hari: 'Kamis', waktu_mulai: '08:00', waktu_selesai: '10:30', ruangan: 'R I.2.5' },
      { nama_mk: 'Pengantar Sains Data', id_pengguna: 2, hari: 'Kamis', waktu_mulai: '13:00', waktu_selesai: '15:30', ruangan: 'R I.2.5' },
      { nama_mk: 'Matematika Keuangan', id_pengguna: 2, hari: 'Kamis', waktu_mulai: '15:30', waktu_selesai: '18:00', ruangan: 'R I.2.5' },
    ];

    for (const c of coursesData) {
      await prisma.mataKuliah.create({
        data: {
          nama_mk: c.nama_mk,
          id_pengguna: c.id_pengguna,
          jadwal: {
            create: {
              hari: c.hari,
              waktu_mulai: c.waktu_mulai,
              waktu_selesai: c.waktu_selesai,
              ruangan: c.ruangan,
            },
          },
        },
      });
    }
    console.log('Courses and schedule data seeded.');
  }

  // 5. Synchronize sequences for PostgreSQL
  try {
    const isSqlite = process.env.DATABASE_URL && process.env.DATABASE_URL.startsWith('file:');
    if (!isSqlite) {
      const sequences = [
        { seq: 'Pengguna_id_pengguna_seq', table: 'Pengguna', col: 'id_pengguna' },
        { seq: 'Transaksi_id_transaksi_seq', table: 'Transaksi', col: 'id_transaksi' },
        { seq: 'Anggaran_id_anggaran_seq', table: 'Anggaran', col: 'id_anggaran' },
        { seq: 'MataKuliah_id_mk_seq', table: 'MataKuliah', col: 'id_mk' },
        { seq: 'Jadwal_id_jadwal_seq', table: 'Jadwal', col: 'id_jadwal' },
        { seq: 'PushSubscription_id_seq', table: 'PushSubscription', col: 'id' },
      ];
      for (const s of sequences) {
        await prisma.$executeRawUnsafe(
          `SELECT setval('"${s.seq}"', COALESCE((SELECT MAX("${s.col}") FROM "${s.table}"), 1))`
        );
      }
      console.log('PostgreSQL sequences synchronized.');
    }
  } catch (err) {
    console.log('Sequence sync note:', err.message);
  }

  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
