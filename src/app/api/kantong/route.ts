import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userIdStr = searchParams.get('userId');
    const activeUserId = userIdStr ? parseInt(userIdStr, 10) : null;

    // Filter Privasi: Hanya tampilkan Kantong BERSAMA atau Kantong PRIBADI milik user yang sedang aktif
    // Kantong pribadi milik pengguna lain tidak boleh bocor!
    let whereClause: any = {
      OR: [{ tipe: 'BERSAMA' }],
    };

    if (activeUserId) {
      whereClause.OR.push({
        tipe: 'PRIBADI',
        id_pengguna: activeUserId,
      });
    }

    const rawKantongList = await prisma.kantong.findMany({
      where: whereClause,
      include: {
        pengguna: {
          select: { id_pengguna: true, nama: true },
        },
        transaksi: {
          select: { jenis: true, nominal: true },
        },
      },
      orderBy: [{ tipe: 'asc' }, { createdAt: 'asc' }],
    });

    // Hitung saldo real-time per kantong
    const kantongWithStats = rawKantongList.map((k) => {
      const totalIncome = k.transaksi
        .filter((t) => t.jenis === 'Income')
        .reduce((sum, t) => sum + t.nominal, 0);

      const totalOutcome = k.transaksi
        .filter((t) => t.jenis === 'Outcome')
        .reduce((sum, t) => sum + t.nominal, 0);

      const saldo = k.saldo_awal + totalIncome - totalOutcome;

      const persentaseTarget =
        k.target_nominal && k.target_nominal > 0
          ? Math.min(100, Math.max(0, Math.round((saldo / k.target_nominal) * 100)))
          : null;

      // Hapus list transaksi mentah dari object kantong agar response lebih ringkas
      const { transaksi, ...rest } = k;

      return {
        ...rest,
        totalIncome,
        totalOutcome,
        saldo,
        persentaseTarget,
      };
    });

    // Pisahkan kantong bersama dan kantong pribadi
    const kantongBersama = kantongWithStats.filter((k) => k.tipe === 'BERSAMA');
    const kantongPribadi = kantongWithStats.filter((k) => k.tipe === 'PRIBADI');

    // Total saldo murni
    const totalSaldoBersama = kantongBersama.reduce((sum, k) => sum + k.saldo, 0);
    const totalSaldoPribadi = kantongPribadi.reduce((sum, k) => sum + k.saldo, 0);

    return NextResponse.json({
      success: true,
      data: kantongWithStats,
      kantongBersama,
      kantongPribadi,
      totalSaldoBersama,
      totalSaldoPribadi,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      nama,
      tipe = 'PRIBADI',
      id_pengguna,
      saldo_awal = 0,
      target_nominal,
      deskripsi,
      warna = 'emerald',
      ikon = 'wallet',
    } = body;

    if (!nama || !nama.trim()) {
      return NextResponse.json(
        { success: false, error: 'Nama kantong wajib diisi.' },
        { status: 400 }
      );
    }

    const isBersama = tipe === 'BERSAMA';

    const newKantong = await prisma.kantong.create({
      data: {
        nama: nama.trim(),
        tipe: isBersama ? 'BERSAMA' : 'PRIBADI',
        id_pengguna: isBersama ? null : id_pengguna ? parseInt(id_pengguna, 10) : null,
        saldo_awal: saldo_awal ? parseFloat(saldo_awal) : 0,
        target_nominal: target_nominal ? parseFloat(target_nominal) : null,
        deskripsi: deskripsi?.trim() || null,
        warna: warna || 'emerald',
        ikon: ikon || 'wallet',
      },
      include: {
        pengguna: { select: { id_pengguna: true, nama: true } },
      },
    });

    return NextResponse.json({ success: true, data: newKantong });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const {
      id_kantong,
      nama,
      tipe,
      saldo_awal,
      target_nominal,
      deskripsi,
      warna,
      ikon,
      activeUserId,
    } = body;

    if (!id_kantong) {
      return NextResponse.json(
        { success: false, error: 'ID Kantong wajib disertakan.' },
        { status: 400 }
      );
    }

    // Cek keberadaan dan hak akses kantong
    const existing = await prisma.kantong.findUnique({
      where: { id_kantong: parseInt(id_kantong, 10) },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Kantong tidak ditemukan.' },
        { status: 404 }
      );
    }

    // Privasi: Jika kantong pribadi orang lain, tidak boleh diubah!
    if (
      existing.tipe === 'PRIBADI' &&
      activeUserId &&
      existing.id_pengguna !== parseInt(activeUserId, 10)
    ) {
      return NextResponse.json(
        { success: false, error: 'Akses ditolak: Anda tidak dapat mengubah kantong pribadi orang lain.' },
        { status: 403 }
      );
    }

    const isBersama = (tipe || existing.tipe) === 'BERSAMA';

    const updated = await prisma.kantong.update({
      where: { id_kantong: parseInt(id_kantong, 10) },
      data: {
        nama: nama ? nama.trim() : undefined,
        tipe: tipe || undefined,
        id_pengguna: isBersama ? null : existing.id_pengguna,
        saldo_awal: saldo_awal !== undefined ? parseFloat(saldo_awal) : undefined,
        target_nominal: target_nominal !== undefined ? (target_nominal ? parseFloat(target_nominal) : null) : undefined,
        deskripsi: deskripsi !== undefined ? (deskripsi?.trim() || null) : undefined,
        warna: warna || undefined,
        ikon: ikon || undefined,
      },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const activeUserIdStr = searchParams.get('activeUserId');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Parameter ID wajib disertakan.' },
        { status: 400 }
      );
    }

    const kantongId = parseInt(id, 10);
    const existing = await prisma.kantong.findUnique({
      where: { id_kantong: kantongId },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Kantong tidak ditemukan.' },
        { status: 404 }
      );
    }

    // Privasi: Tolak jika mencoba menghapus kantong pribadi orang lain
    if (
      existing.tipe === 'PRIBADI' &&
      activeUserIdStr &&
      existing.id_pengguna !== parseInt(activeUserIdStr, 10)
    ) {
      return NextResponse.json(
        { success: false, error: 'Akses ditolak: Anda tidak dapat menghapus kantong pribadi orang lain.' },
        { status: 403 }
      );
    }

    await prisma.kantong.delete({
      where: { id_kantong: kantongId },
    });

    return NextResponse.json({
      success: true,
      message: 'Kantong berhasil dihapus.',
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
