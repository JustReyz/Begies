import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      id_kantong_asal,
      id_kantong_tujuan,
      nominal,
      catatan,
      id_pengguna,
    } = body;

    const amount = parseFloat(nominal);
    if (!id_kantong_asal || !id_kantong_tujuan || !amount || amount <= 0) {
      return NextResponse.json(
        { success: false, error: 'Kantong asal, kantong tujuan, dan nominal valid wajib diisi.' },
        { status: 400 }
      );
    }

    if (id_kantong_asal === id_kantong_tujuan) {
      return NextResponse.json(
        { success: false, error: 'Kantong asal dan tujuan tidak boleh sama.' },
        { status: 400 }
      );
    }

    const sourceKantong = await prisma.kantong.findUnique({
      where: { id_kantong: parseInt(id_kantong_asal, 10) },
    });
    const targetKantong = await prisma.kantong.findUnique({
      where: { id_kantong: parseInt(id_kantong_tujuan, 10) },
    });

    if (!sourceKantong || !targetKantong) {
      return NextResponse.json(
        { success: false, error: 'Salah satu kantong tidak ditemukan.' },
        { status: 404 }
      );
    }

    const userId = parseInt(id_pengguna, 10);

    // Proteksi privasi: tidak boleh memindahkan uang dari/ke kantong pribadi milik user lain
    if (sourceKantong.tipe === 'PRIBADI' && sourceKantong.id_pengguna !== userId) {
      return NextResponse.json(
        { success: false, error: 'Akses ditolak: Kantong asal adalah kantong pribadi pengguna lain.' },
        { status: 403 }
      );
    }
    if (targetKantong.tipe === 'PRIBADI' && targetKantong.id_pengguna !== userId) {
      return NextResponse.json(
        { success: false, error: 'Akses ditolak: Kantong tujuan adalah kantong pribadi pengguna lain.' },
        { status: 403 }
      );
    }

    const now = new Date();

    // Jalankan mutasi transfer di transaksi database
    await prisma.$transaction([
      prisma.transaksi.create({
        data: {
          jenis: 'Outcome',
          nominal: amount,
          kategori: 'Transfer Antar Kantong',
          tanggal: now,
          catatan: `Transfer ke "${targetKantong.nama}"${catatan ? ': ' + catatan : ''}`,
          id_pengguna: userId,
          id_kantong: sourceKantong.id_kantong,
        },
      }),
      prisma.transaksi.create({
        data: {
          jenis: 'Income',
          nominal: amount,
          kategori: 'Transfer Antar Kantong',
          tanggal: now,
          catatan: `Transfer dari "${sourceKantong.nama}"${catatan ? ': ' + catatan : ''}`,
          id_pengguna: userId,
          id_kantong: targetKantong.id_kantong,
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      message: `Berhasil memindahkan Rp ${amount.toLocaleString('id-ID')} dari ${sourceKantong.nama} ke ${targetKantong.nama}.`,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
