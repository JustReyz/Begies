import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const monthStr = searchParams.get('month'); // e.g., "2026-09"
    const activeUserIdStr = searchParams.get('activeUserId') || searchParams.get('userId');
    const activeUserId = activeUserIdStr && activeUserIdStr !== 'all' ? parseInt(activeUserIdStr, 10) : null;
    const kantongIdStr = searchParams.get('kantongId');
    const filterTipe = searchParams.get('filterTipe'); // 'all' | 'BERSAMA' | 'PRIBADI'

    // 1. Base date filtering
    let dateFilter: any = {};
    if (monthStr) {
      const [year, month] = monthStr.split('-').map(Number);
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0, 23, 59, 59, 999);
      dateFilter = {
        gte: startDate,
        lte: endDate,
      };
    }

    // 2. Query ALL transactions in date range to calculate both Dompet Bersama stats & Dompet Pribadi stats
    // Filter privasi: Hanya tampilkan transaksi kantong BERSAMA dan kantong PRIBADI milik activeUserId
    const allVisibleTransactions = await prisma.transaksi.findMany({
      where: {
        ...(monthStr ? { tanggal: dateFilter } : {}),
        OR: [
          { kantong: { tipe: 'BERSAMA' } },
          ...(activeUserId
            ? [
                { kantong: { tipe: 'PRIBADI', id_pengguna: activeUserId } },
                { id_kantong: null, id_pengguna: activeUserId },
              ]
            : [{ kantong: null }]),
        ],
      },
      include: {
        pengguna: {
          select: { id_pengguna: true, nama: true },
        },
        kantong: {
          select: {
            id_kantong: true,
            nama: true,
            tipe: true,
            warna: true,
            ikon: true,
            id_pengguna: true,
          },
        },
      },
      orderBy: { tanggal: 'desc' },
    });

    // 3. Stats kalkulasi MURNI (sesuai permintaan user):
    // Dompet bersama hanya menghitung transaksi dari Kantong BERSAMA
    const transaksiBersama = allVisibleTransactions.filter(
      (t) => t.kantong?.tipe === 'BERSAMA'
    );
    const bersamaIncome = transaksiBersama
      .filter((t) => t.jenis === 'Income')
      .reduce((sum, t) => sum + t.nominal, 0);
    const bersamaOutcome = transaksiBersama
      .filter((t) => t.jenis === 'Outcome')
      .reduce((sum, t) => sum + t.nominal, 0);
    const bersamaNetSaldo = bersamaIncome - bersamaOutcome;

    // Stats MURNI Pribadi user yang aktif
    const transaksiPribadi = allVisibleTransactions.filter(
      (t) => t.kantong?.tipe === 'PRIBADI' || (!t.kantong && t.id_pengguna === activeUserId)
    );
    const pribadiIncome = transaksiPribadi
      .filter((t) => t.jenis === 'Income')
      .reduce((sum, t) => sum + t.nominal, 0);
    const pribadiOutcome = transaksiPribadi
      .filter((t) => t.jenis === 'Outcome')
      .reduce((sum, t) => sum + t.nominal, 0);
    const pribadiNetSaldo = pribadiIncome - pribadiOutcome;

    // 4. Filter data yang akan dikembalikan ke client jika user memilih filter khusus
    let filteredData = allVisibleTransactions;

    if (kantongIdStr && kantongIdStr !== 'all') {
      const targetKantongId = parseInt(kantongIdStr, 10);
      filteredData = filteredData.filter((t) => t.id_kantong === targetKantongId);
    } else if (filterTipe === 'BERSAMA') {
      filteredData = transaksiBersama;
    } else if (filterTipe === 'PRIBADI') {
      filteredData = transaksiPribadi;
    }

    const totalIncome = filteredData
      .filter((t) => t.jenis === 'Income')
      .reduce((sum, t) => sum + t.nominal, 0);

    const totalOutcome = filteredData
      .filter((t) => t.jenis === 'Outcome')
      .reduce((sum, t) => sum + t.nominal, 0);

    const netSaldo = totalIncome - totalOutcome;

    return NextResponse.json({
      success: true,
      stats: {
        totalIncome,
        totalOutcome,
        netSaldo,
      },
      statsBersama: {
        totalIncome: bersamaIncome,
        totalOutcome: bersamaOutcome,
        netSaldo: bersamaNetSaldo,
      },
      statsPribadi: {
        totalIncome: pribadiIncome,
        totalOutcome: pribadiOutcome,
        netSaldo: pribadiNetSaldo,
      },
      data: filteredData,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { jenis, nominal, kategori, tanggal, catatan, id_pengguna, id_kantong } = body;

    if (!jenis || !nominal || !kategori || !id_pengguna) {
      return NextResponse.json(
        { success: false, error: 'Jenis, nominal, kategori, dan pengguna wajib diisi.' },
        { status: 400 }
      );
    }

    const kantongId = id_kantong ? parseInt(id_kantong, 10) : null;

    if (kantongId) {
      const k = await prisma.kantong.findUnique({
        where: { id_kantong: kantongId },
      });
      if (!k) {
        return NextResponse.json(
          { success: false, error: 'Kantong yang dipilih tidak ditemukan.' },
          { status: 400 }
        );
      }
    }

    const newTx = await prisma.transaksi.create({
      data: {
        jenis,
        nominal: parseFloat(nominal),
        kategori,
        tanggal: tanggal ? new Date(tanggal) : new Date(),
        catatan: catatan || null,
        id_pengguna: parseInt(id_pengguna, 10),
        id_kantong: kantongId,
      },
      include: {
        pengguna: { select: { id_pengguna: true, nama: true } },
        kantong: {
          select: {
            id_kantong: true,
            nama: true,
            tipe: true,
            warna: true,
            ikon: true,
          },
        },
      },
    });

    return NextResponse.json({ success: true, data: newTx });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id_transaksi, jenis, nominal, kategori, tanggal, catatan, id_pengguna, id_kantong } = body;

    if (!id_transaksi) {
      return NextResponse.json({ success: false, error: 'ID Transaksi missing.' }, { status: 400 });
    }

    const updatedTx = await prisma.transaksi.update({
      where: { id_transaksi: parseInt(id_transaksi, 10) },
      data: {
        jenis,
        nominal: parseFloat(nominal),
        kategori,
        tanggal: tanggal ? new Date(tanggal) : undefined,
        catatan,
        id_pengguna: parseInt(id_pengguna, 10),
        id_kantong: id_kantong !== undefined ? (id_kantong ? parseInt(id_kantong, 10) : null) : undefined,
      },
      include: {
        pengguna: { select: { id_pengguna: true, nama: true } },
        kantong: {
          select: {
            id_kantong: true,
            nama: true,
            tipe: true,
            warna: true,
            ikon: true,
          },
        },
      },
    });

    return NextResponse.json({ success: true, data: updatedTx });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'ID parameter required' }, { status: 400 });
    }

    await prisma.transaksi.delete({
      where: { id_transaksi: parseInt(id, 10) },
    });

    return NextResponse.json({ success: true, message: 'Transaksi berhasil dihapus.' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
