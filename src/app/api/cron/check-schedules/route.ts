import { NextResponse } from 'next/server';
import { checkAndSendScheduleNotifications } from '@/lib/cron-handler';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const secret = searchParams.get('secret');

    // Simple optional auth check for cron execution
    const expectedSecret = process.env.CRON_SECRET || 'begies-cron-secret-2026';
    if (process.env.NODE_ENV === 'production' && secret !== expectedSecret) {
      return NextResponse.json({ success: false, error: 'Unauthorized cron key' }, { status: 401 });
    }

    const result = await checkAndSendScheduleNotifications();
    return NextResponse.json({ success: true, result });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
