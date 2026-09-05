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

  // 3. Initial Sample Kantong
  const countKantong = await prisma.kantong.count();
  let kantongList = [];
  if (countKantong === 0) {
    const kantongData = [
      {
        nama: 'Tabungan Bersama',
        tipe: 'BERSAMA',
        id_pengguna: null,
        saldo_awal: 500000,
        target_nominal: 5000000,
        warna: 'emerald',
        ikon: 'piggy-bank',
        deskripsi: 'Tabungan impian & keperluan bersama Bewwy & Egie',
      },
      {
        nama: 'Uang Kos & Tagihan',
        tipe: 'BERSAMA',
        id_pengguna: null,
        saldo_awal: 200000,
        target_nominal: 2000000,
        warna: 'teal',
        ikon: 'wallet',
        deskripsi: 'Kas khusus bayar sewa kos, listrik & internet',
      },
      {
        nama: 'Dompet Jajan Bewwy',
        tipe: 'PRIBADI',
        id_pengguna: 1,
        saldo_awal: 100000,
        target_nominal: 500000,
        warna: 'rose',
        ikon: 'coffee',
        deskripsi: 'Uang jajan & makan santai Bewwy',
      },
      {
        nama: 'Dana Darurat Bewwy',
        tipe: 'PRIBADI',
        id_pengguna: 1,
        saldo_awal: 200000,
        target_nominal: 1000000,
        warna: 'amber',
        ikon: 'shield',
        deskripsi: 'Dana cadangan pribadi Bewwy',
      },
      {
        nama: 'Sedekah Bewwy',
        tipe: 'PRIBADI',
        id_pengguna: 1,
        saldo_awal: 10000,
        target_nominal: 100000,
        warna: 'blue',
        ikon: 'heart',
        deskripsi: 'Alokasi sedekah & berbagi Bewwy',
      },
      {
        nama: 'Dompet Jajan Egie',
        tipe: 'PRIBADI',
        id_pengguna: 2,
        saldo_awal: 150000,
        target_nominal: 500000,
        warna: 'indigo',
        ikon: 'coffee',
        deskripsi: 'Uang jajan & belanja Egie',
      },
      {
        nama: 'Dana Darurat Egie',
        tipe: 'PRIBADI',
        id_pengguna: 2,
        saldo_awal: 250000,
        target_nominal: 1500000,
        warna: 'purple',
        ikon: 'shield',
        deskripsi: 'Dana darurat pribadi Egie',
      },
      {
        nama: 'Sedekah Egie',
        tipe: 'PRIBADI',
        id_pengguna: 2,
        saldo_awal: 20000,
        target_nominal: 100000,
        warna: 'teal',
        ikon: 'heart',
        deskripsi: 'Alokasi sedekah & berbagi Egie',
      },
    ];

    for (const k of kantongData) {
      const created = await prisma.kantong.create({ data: k });
      kantongList.push(created);
    }
    console.log('Sample kantong created:', kantongList.length);
  } else {
    kantongList = await prisma.kantong.findMany();
  }

  // 4. Initial Sample Transaksi
  const countTx = await prisma.transaksi.count();
  if (countTx === 0 && kantongList.length > 0) {
    const today = new Date();
    const bersamaKos = kantongList.find(k => k.nama === 'Uang Kos & Tagihan') || kantongList[0];
    const bersamaTabungan = kantongList.find(k => k.nama === 'Tabungan Bersama') || kantongList[0];
    const jajanBewwy = kantongList.find(k => k.nama === 'Dompet Jajan Bewwy') || kantongList[0];
    const jajanEgie = kantongList.find(k => k.nama === 'Dompet Jajan Egie') || kantongList[0];

    await prisma.transaksi.createMany({
      data: [
        {
          jenis: 'Income',
          nominal: 2000000,
          kategori: 'Transfer Uang Bulanan',
          tanggal: new Date(today.getFullYear(), today.getMonth(), 1),
          catatan: 'Setoran bulanan ke tabungan bersama',
          id_pengguna: 1,
          id_kantong: bersamaTabungan.id_kantong,
        },
        {
          jenis: 'Outcome',
          nominal: 1200000,
          kategori: 'Sewa Kos',
          tanggal: new Date(today.getFullYear(), today.getMonth(), 2),
          catatan: 'Bayar kos bulanan',
          id_pengguna: 2,
          id_kantong: bersamaKos.id_kantong,
        },
        {
          jenis: 'Outcome',
          nominal: 35000,
          kategori: 'Makanan & Minuman',
          tanggal: new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1),
          catatan: 'Beli kopi & roti (pribadi)',
          id_pengguna: 1,
          id_kantong: jajanBewwy.id_kantong,
        },
        {
          jenis: 'Outcome',
          nominal: 40000,
          kategori: 'Makanan & Minuman',
          tanggal: new Date(today.getFullYear(), today.getMonth(), today.getDate()),
          catatan: 'Beli camilan (pribadi)',
          id_pengguna: 2,
          id_kantong: jajanEgie.id_kantong,
        },
      ],
    });
    console.log('Sample transactions created with kantong.');
  }

  // 5. Initial Courses & Schedules from SQL.txt
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
