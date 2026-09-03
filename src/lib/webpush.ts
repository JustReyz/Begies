import webpush from 'web-push';

const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '';
const privateKey = process.env.VAPID_PRIVATE_KEY || '';
const subject = process.env.VAPID_SUBJECT || 'mailto:dev@begies.local';

if (publicKey && privateKey && privateKey !== 'YOUR_VAPID_PRIVATE_KEY') {
  try {
    webpush.setVapidDetails(subject, publicKey, privateKey);
  } catch (e) {
    console.error('Error setting VAPID details:', e);
  }
}

export { webpush };
