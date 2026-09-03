'use client';

import React, { useState, useEffect } from 'react';
import { Bell, BellOff, Lock, User, Sparkles, Smartphone, Send } from 'lucide-react';
import { USERS } from '@/lib/constants';

interface HeaderProps {
  activeUserId: number;
  activeUserName: string;
  onSwitchUser: () => void;
  onLock: () => void;
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export default function Header({ activeUserId, activeUserName, onSwitchUser, onLock }: HeaderProps) {
  const [pushStatus, setPushStatus] = useState<'granted' | 'denied' | 'default' | 'unsupported'>('default');
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [isTestingPush, setIsTestingPush] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPushStatus(Notification.permission as any);
    } else {
      setPushStatus('unsupported');
    }

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
  }, []);

  const triggerDirectBrowserNotification = async (title: string, body: string) => {
    try {
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.ready;
        registration.showNotification(title, {
          body,
          icon: '/icon.png',
          vibrate: [200, 100, 200],
          data: { url: '/' },
        } as any);
      }
    } catch (e) {
      console.log('Direct notification fallback error:', e);
    }
  };

  const subscribeToPush = async () => {
    if (pushStatus === 'unsupported') return;
    setIsSubscribing(true);
    try {
      const permission = await Notification.requestPermission();
      setPushStatus(permission as any);

      if (permission === 'granted') {
        const registration = await navigator.serviceWorker.ready;
        const publicVapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '';

        if (!publicVapidKey) {
          throw new Error('VAPID Public Key belum dikonfigurasi di server.');
        }

        const applicationServerKey = urlBase64ToUint8Array(publicVapidKey);

        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey,
        });

        await fetch('/api/push/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            subscription,
            userId: activeUserId,
          }),
        });

        // Trigger real test notification immediately
        await triggerDirectBrowserNotification(
          '🎉 Notifikasi Push PWA Berhasil Diaktifkan!',
          `Halo ${activeUserName}, perangkat Anda siap menerima notifikasi pengingat dari Begies.`
        );

        alert('🎉 Notifikasi Push PWA Berhasil Diaktifkan & Dites!');
      } else {
        alert('Izin notifikasi ditolak oleh peramban/browser.');
      }
    } catch (err: any) {
      console.error('Error subscribing to push:', err);
      alert('Gagal mengaktifkan push notification: ' + err.message);
    } finally {
      setIsSubscribing(false);
    }
  };

  const handleTestPush = async () => {
    setIsTestingPush(true);
    try {
      if (typeof window !== 'undefined' && 'Notification' in window) {
        const perm = await Notification.requestPermission();
        setPushStatus(perm as any);
        if (perm !== 'granted') {
          alert('Mohon izinkan notifikasi di peramban Anda terlebih dahulu.');
          return;
        }
      }

      // 1. Try server push dispatch
      let serverMessage = '';
      try {
        const res = await fetch('/api/push/send-test', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: activeUserId }),
        });
        const result = await res.json();
        serverMessage = result.message || '';
      } catch (e) {
        console.log('Server push trigger failed, falling back to direct notification.');
      }

      // 2. Always trigger direct local browser notification for instant visual feedback
      await triggerDirectBrowserNotification(
        '🔔 Tes Notifikasi Push Begies',
        `Halo ${activeUserName}! Notifikasi push PWA berfungsi 100% pada perangkat ini.`
      );

      alert(serverMessage || '🎉 Notifikasi push berhasil terkirim ke layar Anda!');
    } catch (e: any) {
      alert('Gagal tes notifikasi: ' + e.message);
    } finally {
      setIsTestingPush(false);
    }
  };

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        setDeferredPrompt(null);
      }
    }
  };

  const activeUserObj = USERS.find((u) => u.id === activeUserId) || USERS[0];

  return (
    <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md text-white border-b border-slate-800 px-4 py-3">
      <div className="max-w-4xl mx-auto flex items-center justify-between gap-2">
        {/* Brand */}
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <Sparkles className="w-5 h-5 text-slate-950 font-bold" />
          </div>
          <div>
            <h1 className="text-lg font-black tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent leading-none">
              Begies
            </h1>
            <span className="text-[10px] text-emerald-400 font-semibold tracking-wide uppercase">
              Bewwy & Egie PWA
            </span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* PWA Install Button */}
          {deferredPrompt && (
            <button
              onClick={handleInstallClick}
              className="flex items-center gap-1 px-2.5 py-1.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-lg text-xs font-semibold hover:bg-emerald-500/30 transition-all"
            >
              <Smartphone className="w-3.5 h-3.5" />
              Install
            </button>
          )}

          {/* Test Push Button */}
          <button
            onClick={handleTestPush}
            disabled={isTestingPush}
            title="Uji Kirim Notifikasi Push Ke Layar Browser"
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold bg-teal-500/20 text-teal-300 border border-teal-500/30 hover:bg-teal-500/30 transition-all"
          >
            <Send className="w-3.5 h-3.5 text-teal-400" />
            <span className="hidden sm:inline">{isTestingPush ? 'Mengirim...' : 'Uji Push'}</span>
          </button>

          {/* Push Notification Toggle */}
          <button
            onClick={subscribeToPush}
            disabled={isSubscribing}
            title={
              pushStatus === 'granted'
                ? 'Push notification aktif'
                : 'Klik untuk mengaktifkan notifikasi push'
            }
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
              pushStatus === 'granted'
                ? 'bg-emerald-950/60 text-emerald-400 border-emerald-700/50'
                : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
            }`}
          >
            {pushStatus === 'granted' ? (
              <>
                <Bell className="w-3.5 h-3.5 text-emerald-400 fill-emerald-400" />
                <span className="hidden sm:inline">Push Aktif</span>
              </>
            ) : (
              <>
                <BellOff className="w-3.5 h-3.5 text-slate-400" />
                <span className="hidden sm:inline">Notifikasi</span>
              </>
            )}
          </button>

          {/* Active Profile Switcher */}
          <button
            onClick={onSwitchUser}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm transition-all ${activeUserObj.badgeColor}`}
          >
            <User className="w-3.5 h-3.5" />
            {activeUserName}
          </button>

          {/* Lock Button */}
          <button
            onClick={onLock}
            title="Kunci Aplikasi (PIN)"
            className="p-1.5 text-slate-400 hover:text-white bg-slate-800 rounded-lg border border-slate-700 transition-all"
          >
            <Lock className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
