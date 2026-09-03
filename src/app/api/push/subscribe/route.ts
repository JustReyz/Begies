import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { subscription, userId } = body;

    if (!subscription || !subscription.endpoint || !userId) {
      return NextResponse.json(
        { success: false, error: 'Subscription object & userId mandatory' },
        { status: 400 }
      );
    }

    const { endpoint, keys } = subscription;

    const sub = await prisma.pushSubscription.upsert({
      where: { endpoint },
      update: {
        id_pengguna: parseInt(userId, 10),
        p256dh: keys.p256dh,
        auth: keys.auth,
      },
      create: {
        endpoint,
        p256dh: keys.p256dh,
        auth: keys.auth,
        id_pengguna: parseInt(userId, 10),
      },
    });

    return NextResponse.json({ success: true, data: sub });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
