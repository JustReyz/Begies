import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const monthStr = searchParams.get('month'); // e.g., "2026-09"
    const userId = searchParams.get('userId');

    let whereClause: any = {};

    if (monthStr) {
      const [year, month] = monthStr.split('-').map(Number);
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0, 23, 59, 59, 999);
      whereClause.tanggal = {
        gte: startDate,
        lte: endDate,
      };
    }

    if (userId && userId !== 'all') {
      whereClause.id_pengguna = parseInt(userId, 10);
    }

    const transaksi = await prisma.transaksi.findMany({
      where: whereClause,
      include: {
        pengguna: {
          select: { id_pengguna: true, nama: true },
        },
      },
      orderBy: { tanggal: 'desc' },
    });

    // Calculate dynamic stats
    const totalIncome = transaksi
      .filter((t) => t.jenis === 'Income')
      .reduce((sum, t) => sum + t.nominal, 0);

    const totalOutcome = transaksi
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
      data: transaksi,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { jenis, nominal, kategori, tanggal, catatan, id_pengguna } = body;

    if (!jenis || !nominal || !kategori || !id_pengguna) {
      return NextResponse.json(
        { success: false, error: 'Jenis, nominal, kategori, dan pengguna wajib diisi.' },
        { status: 400 }
      );
    }

    const newTx = await prisma.transaksi.create({
      data: {
        jenis,
        nominal: parseFloat(nominal),
        kategori,
        tanggal: tanggal ? new Date(tanggal) : new Date(),
        catatan: catatan || null,
        id_pengguna: parseInt(id_pengguna, 10),
      },
      include: {
        pengguna: { select: { id_pengguna: true, nama: true } },
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
    const { id_transaksi, jenis, nominal, kategori, tanggal, catatan, id_pengguna } = body;

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
