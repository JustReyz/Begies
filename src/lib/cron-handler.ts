import { prisma } from './prisma';
import webpush from 'web-push';

export async function checkAndSendScheduleNotifications() {
  const now = new Date();
  
  // Indonesian Day Name Map
  const daysMap = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const todayDayName = daysMap[now.getDay()]; // e.g. 'Senin'
  const isWeekend = now.getDay() === 0 || now.getDay() === 6;
  
  // Current time in HH:mm
  const currentHours = now.getHours();
  const currentMinutes = now.getMinutes();
  const nowInMinutes = currentHours * 60 + currentMinutes;

  console.log(`[Cron] Checking schedules for day: ${todayDayName}, time: ${currentHours}:${currentMinutes}`);

  // Fetch all schedules matching today, Weekday, or Everyday
  const validDays = [todayDayName, 'Everyday'];
  if (!isWeekend) {
    validDays.push('Weekday');
  }

  const schedules = await prisma.jadwal.findMany({
    where: {
      hari: { in: validDays },
    },
    include: {
      mataKuliah: {
        include: {
          pengguna: {
            include: {
              langgananPush: true,
            },
          },
        },
      },
    },
  });

  const notificationsSent: any[] = [];

  for (const s of schedules) {
    if (!s.waktu_mulai) continue;

    // Parse waktu_mulai format "HH:mm" or "HH.mm"
    const cleanTime = s.waktu_mulai.replace('.', ':');
    const [h, m] = cleanTime.split(':').map(Number);
    if (isNaN(h) || isNaN(m)) continue;

    const classStartInMinutes = h * 60 + m;
    const diffMinutes = classStartInMinutes - nowInMinutes;

    // Trigger notification if class is starting in 0 to 15 minutes
    if (diffMinutes >= 0 && diffMinutes <= 15) {
      const studentName = s.mataKuliah.pengguna.nama;
      const courseName = s.mataKuliah.nama_mk;
      const room = s.ruangan ? ` di ${s.ruangan}` : '';
      
      const payload = JSON.stringify({
        title: `⏰ Kelas ${courseName} Segera Dimulai!`,
        body: `Halo ${studentName}! Kelas ${courseName}${room} akan mulai dalam ${diffMinutes} menit (${s.waktu_mulai}).`,
        icon: '/icon.png',
        data: { url: '/' },
      });

      const subscriptions = s.mataKuliah.pengguna.langgananPush;

      for (const sub of subscriptions) {
        try {
          const pushConfig = {
            endpoint: sub.endpoint,
            keys: {
              p256dh: sub.p256dh,
              auth: sub.auth,
            },
          };

          await webpush.sendNotification(
            pushConfig,
            payload,
            {
              vapidDetails: {
                subject: process.env.VAPID_SUBJECT || 'mailto:dev@begies.local',
                publicKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '',
                privateKey: process.env.VAPID_PRIVATE_KEY || '',
              },
            }
          );

          notificationsSent.push({
            student: studentName,
            course: courseName,
            endpoint: sub.endpoint,
            minutesLeft: diffMinutes,
          });
        } catch (err: any) {
          console.error('Error sending push notification:', err.message);
          // If subscription is expired or invalid (410 / 404), remove from DB
          if (err.statusCode === 410 || err.statusCode === 404) {
            await prisma.pushSubscription.delete({ where: { id: sub.id } }).catch(() => {});
          }
        }
      }
    }
  }

  return {
    timestamp: now.toISOString(),
    day: todayDayName,
    sentCount: notificationsSent.length,
    details: notificationsSent,
  };
}
