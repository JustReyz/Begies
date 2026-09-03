'use client';

import React, { useState } from 'react';
import useSWR from 'swr';
import {
  BookOpen,
  Clock,
  MapPin,
  PlusCircle,
  Trash2,
  Bell,
  Sparkles,
  CalendarDays,
  UserCheck,
  Repeat,
  Zap,
  User,
  CheckCircle2,
  Check,
  Pencil,
  Flame,
  CalendarCheck2,
  ArrowRight,
} from 'lucide-react';
import { USERS, DAYS_LIST } from '@/lib/constants';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface ScheduleNotifierProps {
  activeUserId: number;
}

const parseTimeToMinutes = (timeStr?: string | null): number => {
  if (!timeStr) return 0;
  const clean = timeStr.replace('.', ':').trim();
  const [h, m] = clean.split(':').map(Number);
  return (isNaN(h) ? 0 : h) * 60 + (isNaN(m) ? 0 : m);
};

export default function ScheduleNotifier({ activeUserId }: ScheduleNotifierProps) {
  const [selectedDayFilter, setSelectedDayFilter] = useState('all');
  const [selectedUserFilter, setSelectedUserFilter] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMkId, setEditingMkId] = useState<number | null>(null);
  const [isTestingPush, setIsTestingPush] = useState(false);

  // Form states
  const [namaMK, setNamaMK] = useState('');
  const [mkUserId, setMkUserId] = useState(activeUserId);
  const [selectedDays, setSelectedDays] = useState<string[]>([DAYS_LIST[0]]);
  const [isRecurring, setIsRecurring] = useState(true);
  const [waktuMulai, setWaktuMulai] = useState('08:00');
  const [waktuSelesai, setWaktuSelesai] = useState('10:30');
  const [ruangan, setRuangan] = useState('');

  const { data: scheduleData, mutate } = useSWR(
    `/api/jadwal?userId=${selectedUserFilter}`,
    fetcher
  );

  const courses = scheduleData?.data || [];

  // Flatten schedule items
  const allScheduleItems: any[] = [];
  courses.forEach((mk: any) => {
    const userObj = USERS.find((u) => u.id === mk.id_pengguna) || USERS[0];
    mk.jadwal.forEach((j: any) => {
      allScheduleItems.push({
        id_mk: mk.id_mk,
        id_jadwal: j.id_jadwal,
        nama_mk: mk.nama_mk,
        user: userObj,
        hari: j.hari,
        waktu_mulai: j.waktu_mulai,
        waktu_selesai: j.waktu_selesai,
        ruangan: j.ruangan,
      });
    });
  });

  // Filter items by Day
  const filteredSchedule = allScheduleItems.filter((item) => {
    if (selectedDayFilter === 'all') return true;
    if (item.hari === selectedDayFilter) return true;
    return false;
  });

  // Current date & time helpers (WITA - Asia/Makassar)
  const now = new Date();
  const timeFormatter = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Makassar',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  const dayFormatter = new Intl.DateTimeFormat('id-ID', {
    timeZone: 'Asia/Makassar',
    weekday: 'long',
  });
  const todayName = dayFormatter.format(now);
  const indonesianDays = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const currentDayIndex = indonesianDays.indexOf(todayName) !== -1 ? indonesianDays.indexOf(todayName) : now.getDay();
  const [currentH, currentM] = timeFormatter.format(now).split(':').map(Number);
  const nowMinutes = currentH * 60 + currentM;

  // Find Today's schedules
  const todayItems = allScheduleItems
    .filter((item) => item.hari === todayName)
    .map((item) => {
      const start = parseTimeToMinutes(item.waktu_mulai);
      const end = item.waktu_selesai ? parseTimeToMinutes(item.waktu_selesai) : start + 90;
      return {
        ...item,
        startMinutes: start,
        endMinutes: end,
        isOngoing: nowMinutes >= start && nowMinutes <= end,
        isUpcoming: nowMinutes < start,
        minutesUntilStart: start - nowMinutes,
        minutesUntilEnd: end - nowMinutes,
      };
    })
    .sort((a, b) => a.startMinutes - b.startMinutes);

  // 1. Check if there is an ONGOING class right now
  const ongoingClass = todayItems.find((item) => item.isOngoing);

  // 2. Check if there is an UPCOMING class today
  const nextUpcomingToday = todayItems.find((item) => item.isUpcoming);

  // 3. If no classes left today, find the NEXT upcoming class in future days
  let nextFutureClass: any = null;
  let nextFutureDayLabel = '';

  if (!ongoingClass && !nextUpcomingToday && allScheduleItems.length > 0) {
    for (let offset = 1; offset <= 7; offset++) {
      const targetDayIndex = (currentDayIndex + offset) % 7;
      const targetDayName = indonesianDays[targetDayIndex];
      const itemsOnDay = allScheduleItems
        .filter((item) => item.hari === targetDayName)
        .sort((a, b) => parseTimeToMinutes(a.waktu_mulai) - parseTimeToMinutes(b.waktu_mulai));

      if (itemsOnDay.length > 0) {
        nextFutureClass = itemsOnDay[0];
        nextFutureDayLabel = offset === 1 ? 'Besok (' + targetDayName + ')' : targetDayName;
        break;
      }
    }
  }

  const toggleDay = (dayName: string) => {
    if (selectedDays.includes(dayName)) {
      if (selectedDays.length === 1) return; // minimal 1 hari
      setSelectedDays(selectedDays.filter((d) => d !== dayName));
    } else {
      setSelectedDays([...selectedDays, dayName]);
    }
  };

  const handleOpenAdd = () => {
    setEditingMkId(null);
    setNamaMK('');
    setMkUserId(activeUserId);
    setSelectedDays([DAYS_LIST[0]]);
    setIsRecurring(true);
    setWaktuMulai('08:00');
    setWaktuSelesai('10:30');
    setRuangan('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (id_mk: number) => {
    const targetCourse = courses.find((c: any) => c.id_mk === id_mk);
    if (!targetCourse) return;

    setEditingMkId(id_mk);
    const isOnce = targetCourse.nama_mk.startsWith('[Sekali]');
    const rawName = targetCourse.nama_mk.replace('[Sekali] ', '');

    setNamaMK(rawName);
    setIsRecurring(!isOnce);
    setMkUserId(targetCourse.id_pengguna);

    const days = targetCourse.jadwal.map((j: any) => j.hari);
    setSelectedDays(days.length > 0 ? days : [DAYS_LIST[0]]);

    if (targetCourse.jadwal.length > 0) {
      setWaktuMulai(targetCourse.jadwal[0].waktu_mulai || '08:00');
      setWaktuSelesai(targetCourse.jadwal[0].waktu_selesai || '10:30');
      setRuangan(targetCourse.jadwal[0].ruangan || '');
    }

    setIsModalOpen(true);
  };

  const handleSubmitCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!namaMK) return;
    if (selectedDays.length === 0) {
      alert('Pilih minimal satu hari.');
      return;
    }

    const finalCourseName = isRecurring ? namaMK : `[Sekali] ${namaMK}`;
    const payload = {
      id_mk: editingMkId,
      nama_mk: finalCourseName,
      id_pengguna: mkUserId,
      hari: selectedDays,
      waktu_mulai: waktuMulai,
      waktu_selesai: waktuSelesai,
      ruangan,
    };

    const url = '/api/jadwal';
    const method = editingMkId ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const result = await res.json();
    if (result.success) {
      setIsModalOpen(false);
      setEditingMkId(null);
      setNamaMK('');
      setRuangan('');
      setSelectedDays([DAYS_LIST[0]]);
      mutate();
    } else {
      alert('Gagal menyimpan pengingat: ' + result.error);
    }
  };

  const handleDeleteCourse = async (id_mk: number) => {
    if (!confirm('Apakah Anda yakin ingin menghapus pengingat ini?')) return;
    const res = await fetch(`/api/jadwal?id=${id_mk}`, { method: 'DELETE' });
    const result = await res.json();
    if (result.success) {
      mutate();
    }
  };

  const triggerDirectNotification = async (title: string, body: string) => {
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
    } catch (err) {
      console.log('Direct browser notification fallback failed:', err);
    }
  };

  const handleTestPush = async () => {
    setIsTestingPush(true);
    try {
      if (typeof window !== 'undefined' && 'Notification' in window) {
        const perm = await Notification.requestPermission();
        if (perm !== 'granted') {
          alert('Mohon izinkan notifikasi pada peramban/browser Anda terlebih dahulu.');
          return;
        }
      }

      // 1. Send server push
      let serverResMessage = '';
      try {
        const res = await fetch('/api/push/send-test', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: activeUserId }),
        });
        const result = await res.json();
        serverResMessage = result.message || '';
      } catch (e) {
        console.log('Server push trigger failed, falling back to direct notification');
      }

      // 2. Direct browser notification trigger
      const activeUser = USERS.find((u) => u.id === activeUserId) || USERS[0];
      await triggerDirectNotification(
        '🔔 Tes Notifikasi Push Begies',
        `Halo ${activeUser.name}! Notifikasi pengingat PWA Anda berfungsi dengan sempurna di perangkat ini.`
      );

      alert(serverResMessage || '🎉 Notifikasi push berhasil dikirim dan tampil di layar Anda!');
    } catch (e: any) {
      alert('Gagal tes notifikasi: ' + e.message);
    } finally {
      setIsTestingPush(false);
    }
  };

  return (
    <div className="space-y-6 pb-24">
      {/* Smart Class Banner */}
      {ongoingClass ? (
        /* KASUS 1: SEDANG BERLANGSUNG */
        <div className="bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-600 text-white p-5 rounded-2xl shadow-xl shadow-emerald-900/20 border border-emerald-400/40 relative overflow-hidden animate-in fade-in duration-300">
          <div className="flex items-center justify-between mb-2">
            <span className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-emerald-100">
              <span className="w-2 h-2 rounded-full bg-white animate-ping inline-block" />
              Sedang Berlangsung Sekarang
            </span>
            <Flame className="w-5 h-5 text-emerald-200 animate-bounce" />
          </div>

          <h2 className="text-xl font-black mt-1">
            {ongoingClass.nama_mk.replace('[Sekali] ', '')}
          </h2>

          <div className="flex flex-wrap items-center gap-3 text-xs font-semibold text-emerald-100 mt-2">
            <span className="flex items-center gap-1 bg-black/20 backdrop-blur-sm px-2.5 py-1 rounded-lg">
              <Clock className="w-3.5 h-3.5" />
              {ongoingClass.waktu_mulai} - {ongoingClass.waktu_selesai || 'Selesai'}
              <span className="text-white font-bold ml-1">
                (Sisa ~{ongoingClass.minutesUntilEnd} mnt)
              </span>
            </span>
            {ongoingClass.ruangan && (
              <span className="flex items-center gap-1 bg-black/20 backdrop-blur-sm px-2.5 py-1 rounded-lg">
                <MapPin className="w-3.5 h-3.5" /> Ruang: {ongoingClass.ruangan}
              </span>
            )}
            <span className="bg-white/25 px-2.5 py-1 rounded-lg text-white font-black">
              Profil: {ongoingClass.user.name}
            </span>
          </div>
        </div>
      ) : nextUpcomingToday ? (
        /* KASUS 2: KELAS BERIKUTNYA HARI INI */
        <div className="bg-gradient-to-r from-teal-800 via-emerald-800 to-slate-900 text-white p-5 rounded-2xl shadow-lg border border-teal-700/40 relative overflow-hidden animate-in fade-in duration-300">
          <div className="flex items-center justify-between mb-2">
            <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider bg-emerald-500/20 backdrop-blur-md px-3 py-1 rounded-full text-emerald-200 border border-emerald-500/30">
              <Clock className="w-3.5 h-3.5" />
              Kelas Berikutnya Hari Ini ({todayName})
            </span>
            <Sparkles className="w-5 h-5 text-emerald-300 animate-pulse" />
          </div>

          <h2 className="text-xl font-black mt-1">
            {nextUpcomingToday.nama_mk.replace('[Sekali] ', '')}
          </h2>

          <div className="flex flex-wrap items-center gap-3 text-xs font-semibold text-emerald-200 mt-2">
            <span className="flex items-center gap-1 bg-black/30 px-2.5 py-1 rounded-lg">
              <Clock className="w-3.5 h-3.5" /> {nextUpcomingToday.waktu_mulai} -{' '}
              {nextUpcomingToday.waktu_selesai || 'Selesai'}
              <span className="text-white font-bold ml-1">
                (Dalam {nextUpcomingToday.minutesUntilStart} menit)
              </span>
            </span>
            {nextUpcomingToday.ruangan && (
              <span className="flex items-center gap-1 bg-black/30 px-2.5 py-1 rounded-lg">
                <MapPin className="w-3.5 h-3.5" /> Ruang: {nextUpcomingToday.ruangan}
              </span>
            )}
            <span className="bg-emerald-700/60 px-2.5 py-1 rounded-lg text-white font-bold">
              Profil: {nextUpcomingToday.user.name}
            </span>
          </div>
        </div>
      ) : nextFutureClass ? (
        /* KASUS 3: HARI INI SELESAI / TIDAK ADA KELAS, TAMPILKAN JADWAL MENDATANG TERDEKAT */
        <div className="bg-slate-900 text-white p-5 rounded-2xl border border-slate-800 shadow-md relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2.5 py-0.5 rounded-full">
              <CalendarCheck2 className="w-3.5 h-3.5" />
              Jadwal Hari Ini ({todayName}) Telah Selesai
            </span>
            <BookOpen className="w-5 h-5 text-slate-500" />
          </div>

          <div className="mt-2.5 pt-2.5 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                Jadwal Mendatang Berikutnya:
              </span>
              <h4 className="text-base font-extrabold text-slate-100 mt-0.5">
                {nextFutureClass.nama_mk.replace('[Sekali] ', '')}
              </h4>
              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-300 font-medium mt-1">
                <span className="flex items-center gap-1 text-emerald-400 font-bold">
                  <CalendarDays className="w-3.5 h-3.5" /> {nextFutureDayLabel}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-slate-400" /> {nextFutureClass.waktu_mulai}
                </span>
                {nextFutureClass.ruangan && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" /> {nextFutureClass.ruangan}
                  </span>
                )}
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${nextFutureClass.user.badgeColor}`}>
                  {nextFutureClass.user.name}
                </span>
              </div>
            </div>

            <button
              onClick={() => setSelectedDayFilter(nextFutureClass.hari)}
              className="inline-flex items-center gap-1 text-xs font-bold text-emerald-400 hover:text-emerald-300 bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-700 transition-all self-start sm:self-center"
            >
              Lihat Hari Ini <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      ) : (
        /* KASUS 4: KOSONG / BELUM ADA JADWAL */
        <div className="bg-slate-900 text-white p-5 rounded-2xl border border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold">Belum ada jadwal tersimpan 📝</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Klik tombol &quot;Tambah Pengingat / Kelas&quot; di bawah untuk menambahkan jadwal kuliah atau pengingat baru.
            </p>
          </div>
          <BookOpen className="w-6 h-6 text-slate-600" />
        </div>
      )}

      {/* Control Bar & Test Push */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-2xl shadow-sm border border-slate-200">
        <div className="flex items-center gap-2">
          <UserCheck className="w-4 h-4 text-slate-400" />
          <select
            value={selectedUserFilter}
            onChange={(e) => setSelectedUserFilter(e.target.value)}
            className="text-xs font-semibold text-slate-700 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200"
          >
            <option value="all">Semua Mahasiswa</option>
            {USERS.map((u) => (
              <option key={u.id} value={u.id}>
                Jadwal {u.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleTestPush}
            disabled={isTestingPush}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-emerald-950 text-slate-100 hover:text-emerald-300 border border-slate-700 hover:border-emerald-600/50 rounded-xl text-xs font-bold transition-all shadow-sm"
          >
            <Bell className="w-3.5 h-3.5 text-emerald-400" />
            {isTestingPush ? 'Mengirim...' : 'Uji Notifikasi'}
          </button>

          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            Tambah Pengingat / Kelas
          </button>
        </div>
      </div>

      {/* Day Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none">
        <button
          onClick={() => setSelectedDayFilter('all')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
            selectedDayFilter === 'all'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-emerald-50 hover:text-emerald-700 border border-slate-200'
          }`}
        >
          Semua Hari
        </button>
        {DAYS_LIST.map((day) => (
          <button
            key={day}
            onClick={() => setSelectedDayFilter(day)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              selectedDayFilter === day
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-white text-slate-600 hover:bg-emerald-50 hover:text-emerald-700 border border-slate-200'
            }`}
          >
            {day}
          </button>
        ))}
      </div>

      {/* Schedule / Reminders List */}
      <div className="space-y-3">
        {filteredSchedule.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-slate-400 text-sm">
            Tidak ada pengingat / jadwal kelas pada filter ini.
          </div>
        ) : (
          filteredSchedule.map((item) => {
            const isOnce = item.nama_mk.startsWith('[Sekali]');
            const displayTitle = item.nama_mk.replace('[Sekali] ', '');
            const itemStart = parseTimeToMinutes(item.waktu_mulai);
            const itemEnd = item.waktu_selesai ? parseTimeToMinutes(item.waktu_selesai) : itemStart + 90;
            const isOngoing = item.hari === todayName && nowMinutes >= itemStart && nowMinutes <= itemEnd;

            return (
              <div
                key={`${item.id_mk}-${item.id_jadwal}`}
                className={`p-4 rounded-2xl transition-all flex items-center justify-between ${
                  isOngoing
                    ? 'bg-emerald-50/80 border-2 border-emerald-500 shadow-md shadow-emerald-600/10 ring-1 ring-emerald-400/30'
                    : 'bg-white border border-slate-200 shadow-sm hover:border-emerald-300'
                }`}
              >
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="text-sm font-extrabold text-slate-800">{displayTitle}</h4>
                    {isOngoing && (
                      <span className="flex items-center gap-1 text-[10px] font-black bg-emerald-600 text-white px-2 py-0.5 rounded-md shadow-sm animate-pulse">
                        <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping inline-block" />
                        Sedang Berlangsung
                      </span>
                    )}
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${item.user.badgeColor}`}>
                      {item.user.name}
                    </span>
                    {isOnce ? (
                      <span className="flex items-center gap-0.5 text-[10px] font-bold bg-teal-50 text-teal-800 border border-teal-200 px-2 py-0.5 rounded-md">
                        <Zap className="w-3 h-3" /> Sekali
                      </span>
                    ) : (
                      <span className="flex items-center gap-0.5 text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-md">
                        <Repeat className="w-3 h-3" /> Berulang
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 font-medium">
                    <span className="flex items-center gap-1 font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200/50">
                      <CalendarDays className="w-3.5 h-3.5" /> {item.hari}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" /> {item.waktu_mulai} {item.waktu_selesai && `- ${item.waktu_selesai}`}
                    </span>
                    {item.ruangan && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" /> {item.ruangan}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleOpenEdit(item.id_mk)}
                    className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
                    title="Edit Pengingat / Jadwal"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => handleDeleteCourse(item.id_mk)}
                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                    title="Hapus Pengingat"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add / Edit Reminder Modal with Multiple Choice Chips */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl p-6 border border-slate-100 my-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-800">
                {editingMkId ? 'Edit Jadwal / Pengingat' : 'Tambah Pengingat / Kelas Baru'}
              </h3>
              <span className="text-xs text-emerald-600 font-semibold bg-emerald-50 px-2.5 py-1 rounded-lg">
                {editingMkId ? 'Mode Perbarui' : 'Mode Baru'}
              </span>
            </div>

            <form onSubmit={handleSubmitCourse} className="space-y-5">
              {/* Nama Mata Kuliah / Notifikasi */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
                  Nama Pengingat / Mata Kuliah
                </label>
                <input
                  type="text"
                  value={namaMK}
                  onChange={(e) => setNamaMK(e.target.value)}
                  placeholder="Contoh: Komputasi Statistika II atau Ujian Tengah Semester"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 text-sm font-semibold text-slate-800"
                  required
                />
              </div>

              {/* Mahasiswa Choice Chips */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">
                  Pilih Mahasiswa / Profil
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  {USERS.map((user) => {
                    const isSelected = mkUserId === user.id;
                    return (
                      <button
                        key={user.id}
                        type="button"
                        onClick={() => setMkUserId(user.id)}
                        className={`flex items-center justify-center gap-2 p-3 rounded-xl border-2 transition-all text-xs font-bold ${
                          isSelected
                            ? 'border-emerald-500 bg-emerald-50 text-emerald-700 shadow-sm'
                            : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300'
                        }`}
                      >
                        <User className={`w-4 h-4 ${isSelected ? 'text-emerald-600' : 'text-slate-400'}`} />
                        {user.name}
                        {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 ml-auto" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Hari Choice Chips (MULTIPLE CHOICE, 7 HARI SAJA) */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Pilih Hari Notifikasi
                  </label>
                  <span className="text-[11px] text-emerald-600 font-semibold">
                    {selectedDays.length} hari dipilih
                  </span>
                </div>

                <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                  {DAYS_LIST.map((day) => {
                    const isSelected = selectedDays.includes(day);
                    return (
                      <button
                        key={day}
                        type="button"
                        onClick={() => toggleDay(day)}
                        className={`flex items-center justify-center gap-1 py-2.5 px-2 rounded-xl text-xs font-bold border transition-all ${
                          isSelected
                            ? 'border-emerald-600 bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                            : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300 hover:bg-slate-100'
                        }`}
                      >
                        {isSelected && <Check className="w-3.5 h-3.5" />}
                        {day}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Pilihan Notifikasi Berulang (Choice Chips) */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">
                  Pengulangan Notifikasi
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setIsRecurring(true)}
                    className={`flex items-center justify-center gap-2 p-3 rounded-xl border-2 transition-all text-xs font-bold ${
                      isRecurring
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-700 shadow-sm'
                        : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <Repeat className={`w-4 h-4 ${isRecurring ? 'text-emerald-600' : 'text-slate-400'}`} />
                    Berulang Sesuai Hari
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsRecurring(false)}
                    className={`flex items-center justify-center gap-2 p-3 rounded-xl border-2 transition-all text-xs font-bold ${
                      !isRecurring
                        ? 'border-teal-500 bg-teal-50 text-teal-800 shadow-sm'
                        : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <Zap className={`w-4 h-4 ${!isRecurring ? 'text-teal-600' : 'text-slate-400'}`} />
                    Hanya Sekali
                  </button>
                </div>
                <p className="text-[11px] text-slate-400 mt-1.5">
                  {isRecurring
                    ? `🔄 Notifikasi akan berbunyi otomatis setiap minggu pada: ${selectedDays.join(', ')}.`
                    : `⚡ Notifikasi hanya akan dikirim 1 kali pada jadwal (${selectedDays.join(', ')}) terdekat.`}
                </p>
              </div>

              {/* Waktu Mulai & Selesai */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Waktu Mulai</label>
                  <input
                    type="time"
                    value={waktuMulai}
                    onChange={(e) => setWaktuMulai(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold text-slate-800"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Waktu Selesai</label>
                  <input
                    type="time"
                    value={waktuSelesai}
                    onChange={(e) => setWaktuSelesai(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold text-slate-800"
                  />
                </div>
              </div>

              {/* Ruangan / Tempat */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Ruangan / Tempat / Catatan</label>
                <input
                  type="text"
                  value={ruangan}
                  onChange={(e) => setRuangan(e.target.value)}
                  placeholder="Contoh: R II.2.1 atau Lab Komputer"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-800"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="w-1/2 py-2.5 text-xs font-bold text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md shadow-emerald-600/20"
                >
                  {editingMkId ? 'Perbarui Pengingat' : 'Simpan Pengingat'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
