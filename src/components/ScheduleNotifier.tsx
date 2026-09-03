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
} from 'lucide-react';
import { USERS, DAYS_LIST } from '@/lib/constants';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface ScheduleNotifierProps {
  activeUserId: number;
}

export default function ScheduleNotifier({ activeUserId }: ScheduleNotifierProps) {
  const [selectedDayFilter, setSelectedDayFilter] = useState('all');
  const [selectedUserFilter, setSelectedUserFilter] = useState('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isTestingPush, setIsTestingPush] = useState(false);

  // Add Course Form states
  const [namaMK, setNamaMK] = useState('');
  const [mkUserId, setMkUserId] = useState(activeUserId);
  const [hari, setHari] = useState(DAYS_LIST[0]);
  const [waktuMulai, setWaktuMulai] = useState('08:00');
  const [waktuSelesai, setWaktuSelesai] = useState('10:30');
  const [ruangan, setRuangan] = useState('');

  const { data: scheduleData, mutate } = useSWR(
    `/api/jadwal?userId=${selectedUserFilter}`,
    fetcher
  );

  const courses = scheduleData?.data || [];

  // Helper to extract flat schedule items
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

  // Filter schedule items by Day
  const filteredSchedule = allScheduleItems.filter((item) => {
    if (selectedDayFilter === 'all') return true;
    if (item.hari === selectedDayFilter) return true;
    if (item.hari === 'Everyday') return true;
    if (
      selectedDayFilter !== 'Sabtu' &&
      selectedDayFilter !== 'Minggu' &&
      item.hari === 'Weekday'
    )
      return true;
    return false;
  });

  // Find next upcoming class for today
  const indonesianDays = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const todayName = indonesianDays[new Date().getDay()];
  const nowMinutes = new Date().getHours() * 60 + new Date().getMinutes();

  const todayUpcomingClass = allScheduleItems
    .filter((item) => {
      if (item.hari === todayName || item.hari === 'Everyday') return true;
      if (todayName !== 'Sabtu' && todayName !== 'Minggu' && item.hari === 'Weekday') return true;
      return false;
    })
    .map((item) => {
      const cleanTime = item.waktu_mulai.replace('.', ':');
      const [h, m] = cleanTime.split(':').map(Number);
      const classStartMinutes = h * 60 + m;
      return { ...item, classStartMinutes, diff: classStartMinutes - nowMinutes };
    })
    .filter((item) => item.diff >= -30) // class starting soon or started within 30 mins
    .sort((a, b) => a.diff - b.diff)[0];

  const handleAddCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!namaMK) return;

    const res = await fetch('/api/jadwal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nama_mk: namaMK,
        id_pengguna: mkUserId,
        hari,
        waktu_mulai: waktuMulai,
        waktu_selesai: waktuSelesai,
        ruangan,
      }),
    });

    const result = await res.json();
    if (result.success) {
      setIsAddModalOpen(false);
      setNamaMK('');
      setRuangan('');
      mutate();
    } else {
      alert('Gagal menambah jadwal: ' + result.error);
    }
  };

  const handleDeleteCourse = async (id_mk: number) => {
    if (!confirm('Apakah Anda yakin ingin menghapus jadwal kelas ini?')) return;
    const res = await fetch(`/api/jadwal?id=${id_mk}`, { method: 'DELETE' });
    const result = await res.json();
    if (result.success) {
      mutate();
    }
  };

  const handleTestPush = async () => {
    setIsTestingPush(true);
    try {
      const res = await fetch('/api/push/send-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: activeUserId }),
      });
      const result = await res.json();
      if (result.success) {
        alert(result.message);
      } else {
        alert(result.message || result.error);
      }
    } catch (e: any) {
      alert('Error: ' + e.message);
    } finally {
      setIsTestingPush(false);
    }
  };

  return (
    <div className="space-y-6 pb-24">
      {/* Banner Next Class Today */}
      {todayUpcomingClass ? (
        <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-800 text-white p-5 rounded-2xl shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider bg-white/20 px-2.5 py-0.5 rounded-full">
              Kelas Berikutnya Hari Ini ({todayName})
            </span>
            <Sparkles className="w-5 h-5 text-emerald-200 animate-pulse" />
          </div>
          <h2 className="text-xl font-black">{todayUpcomingClass.nama_mk}</h2>
          <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-emerald-100 mt-2">
            <span className="flex items-center gap-1">
              <Clock className="w-4 h-4" /> {todayUpcomingClass.waktu_mulai} - {todayUpcomingClass.waktu_selesai}
            </span>
            {todayUpcomingClass.ruangan && (
              <span className="flex items-center gap-1">
                <MapPin className="w-4 h-4" /> Ruang: {todayUpcomingClass.ruangan}
              </span>
            )}
            <span className="bg-emerald-900/50 px-2 py-0.5 rounded text-white font-bold">
              Profil: {todayUpcomingClass.user.name}
            </span>
          </div>
        </div>
      ) : (
        <div className="bg-slate-900 text-white p-5 rounded-2xl border border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold">Tidak ada kelas lagi hari ini 🎉</h3>
            <p className="text-xs text-slate-400 mt-0.5">Semua jadwal perkuliahan hari ini telah selesai atau belum dimulai.</p>
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
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
          >
            <Bell className="w-3.5 h-3.5 text-emerald-400" />
            {isTestingPush ? 'Mengirim...' : 'Uji Notifikasi'}
          </button>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20"
          >
            <PlusCircle className="w-4 h-4" />
            Tambah Kelas
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
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
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
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            {day}
          </button>
        ))}
      </div>

      {/* Schedule List */}
      <div className="space-y-3">
        {filteredSchedule.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-slate-400 text-sm">
            Tidak ada jadwal kelas pada filter ini.
          </div>
        ) : (
          filteredSchedule.map((item) => (
            <div
              key={`${item.id_mk}-${item.id_jadwal}`}
              className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between hover:border-emerald-300 transition-all"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-extrabold text-slate-800">{item.nama_mk}</h4>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${item.user.badgeColor}`}>
                    {item.user.name}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 font-medium">
                  <span className="flex items-center gap-1 font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
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

              <button
                onClick={() => handleDeleteCourse(item.id_mk)}
                className="p-2 text-slate-300 hover:text-rose-600 rounded-lg transition-all"
                title="Hapus Kelas"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))
        )}
      </div>

      {/* Add Course Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-6 border border-slate-100">
            <h3 className="text-lg font-bold text-slate-800 mb-4">Tambah Jadwal Kelas Baru</h3>

            <form onSubmit={handleAddCourse} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Nama Mata Kuliah</label>
                <input
                  type="text"
                  value={namaMK}
                  onChange={(e) => setNamaMK(e.target.value)}
                  placeholder="Contoh: Komputasi Statistika II"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 text-sm font-semibold text-slate-800"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Mahasiswa</label>
                <select
                  value={mkUserId}
                  onChange={(e) => setMkUserId(parseInt(e.target.value, 10))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 text-sm font-medium text-slate-800 bg-white"
                >
                  {USERS.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Hari</label>
                <select
                  value={hari}
                  onChange={(e) => setHari(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 text-sm font-medium text-slate-800 bg-white"
                >
                  {DAYS_LIST.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                  <option value="Weekday">Weekday (Senin-Jumat)</option>
                  <option value="Everyday">Everyday (Setiap Hari)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Waktu Mulai</label>
                  <input
                    type="time"
                    value={waktuMulai}
                    onChange={(e) => setWaktuMulai(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm font-semibold"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Waktu Selesai</label>
                  <input
                    type="time"
                    value={waktuSelesai}
                    onChange={(e) => setWaktuSelesai(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Ruangan / Tempat</label>
                <input
                  type="text"
                  value={ruangan}
                  onChange={(e) => setRuangan(e.target.value)}
                  placeholder="Contoh: R II.2.1"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-800"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="w-1/2 py-2.5 text-xs font-bold text-slate-600 bg-slate-100 rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md"
                >
                  Simpan Kelas
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
