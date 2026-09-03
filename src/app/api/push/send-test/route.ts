import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import webpush from 'web-push';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json({ success: false, error: 'UserId missing' }, { status: 400 });
    }

    const subs = await prisma.pushSubscription.findMany({
      where: { id_pengguna: parseInt(userId, 10) },
    });

    if (subs.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Tidak ada perangkat terdaftar untuk notifikasi user ini.' },
        { status: 404 }
      );
    }

    const payload = JSON.stringify({
      title: '🔔 Uji Coba Notifikasi Begies!',
      body: `Notifikasi push PWA berhasil dikonfigurasi & berfungsi normal pada perangkat Anda.`,
      icon: '/icon.png',
      data: { url: '/' },
    });

    let countSuccess = 0;

    for (const sub of subs) {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          payload,
          {
            vapidDetails: {
              subject: process.env.VAPID_SUBJECT || 'mailto:dev@begies.local',
              publicKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '',
              privateKey: process.env.VAPID_PRIVATE_KEY || '',
            },
          }
        );
        countSuccess++;
      } catch (err: any) {
        console.error('Push test error:', err.message);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Notifikasi berhasil dikirim ke ${countSuccess} perangkat.`,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
