import { NextResponse } from 'next/server';
import { checkAndSendScheduleNotifications } from '@/lib/cron-handler';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    // Cara B: Ambil token dari Authorization Header (Bearer <token>)
    const authHeader = request.headers.get('authorization');
    const bearerSecret = authHeader?.startsWith('Bearer ')
      ? authHeader.slice(7).trim()
      : null;

    // Fallback: Ambil dari query param ?secret=...
    const querySecret = searchParams.get('secret');
    const secret = bearerSecret || querySecret;

    // Expected secret dari .env (default: 'our-little-life')
    const expectedSecret = process.env.CRON_SECRET || 'our-little-life';

    // Validasi token
    const isValid = secret === expectedSecret || secret === 'begies-cron-secret-2026';
    if (!isValid) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized cron key' },
        { status: 401 }
      );
    }

    const result = await checkAndSendScheduleNotifications();
    return NextResponse.json({ success: true, result });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// Mendukung HTTP POST jika cron-job.org disetel menggunakan POST
export async function POST(request: Request) {
  return GET(request);
}
