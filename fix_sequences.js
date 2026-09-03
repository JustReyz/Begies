const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixSequences() {
  console.log('Fixing Postgres / SQLite autoincrement sequences...');

  const isSqlite = process.env.DATABASE_URL && process.env.DATABASE_URL.startsWith('file:');

  if (isSqlite) {
    // For SQLite, update sqlite_sequence
    const tables = [
      { table: 'Pengguna', col: 'id_pengguna' },
      { table: 'Transaksi', col: 'id_transaksi' },
      { table: 'Anggaran', col: 'id_anggaran' },
      { table: 'MataKuliah', col: 'id_mk' },
      { table: 'Jadwal', col: 'id_jadwal' },
      { table: 'PushSubscription', col: 'id' },
    ];

    for (const t of tables) {
      try {
        const maxRes = await prisma.$queryRawUnsafe(`SELECT MAX(${t.col}) as max_id FROM "${t.table}"`);
        const maxId = maxRes[0]?.max_id || 0;
        await prisma.$executeRawUnsafe(
          `INSERT INTO sqlite_sequence (name, seq) VALUES ('${t.table}', ${maxId}) ON CONFLICT(name) DO UPDATE SET seq=${maxId}`
        );
        console.log(`SQLite sequence for ${t.table} updated to ${maxId}`);
      } catch (e) {
        console.log(`Error updating SQLite seq for ${t.table}:`, e.message);
      }
    }
  } else {
    // For PostgreSQL, use setval
    const sequences = [
      { seq: 'Pengguna_id_pengguna_seq', table: 'Pengguna', col: 'id_pengguna' },
      { seq: 'Transaksi_id_transaksi_seq', table: 'Transaksi', col: 'id_transaksi' },
      { seq: 'Anggaran_id_anggaran_seq', table: 'Anggaran', col: 'id_anggaran' },
      { seq: 'MataKuliah_id_mk_seq', table: 'MataKuliah', col: 'id_mk' },
      { seq: 'Jadwal_id_jadwal_seq', table: 'Jadwal', col: 'id_jadwal' },
      { seq: 'PushSubscription_id_seq', table: 'PushSubscription', col: 'id' },
    ];

    for (const s of sequences) {
      try {
        await prisma.$executeRawUnsafe(
          `SELECT setval('"${s.seq}"', COALESCE((SELECT MAX("${s.col}") FROM "${s.table}"), 1))`
        );
        console.log(`Postgres sequence "${s.seq}" synchronized successfully.`);
      } catch (e) {
        console.log(`Note for sequence ${s.seq}:`, e.message);
      }
    }
  }

  console.log('Sequence synchronization completed.');
}

fixSequences()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
