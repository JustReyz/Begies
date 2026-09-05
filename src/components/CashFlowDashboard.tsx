'use client';

import React, { useState } from 'react';
import useSWR from 'swr';
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  PlusCircle,
  Filter,
  Trash2,
  Edit2,
  Calendar,
  AlertTriangle,
  Settings,
  PieChart as PieIcon,
  Tag,
  Coffee,
  Heart,
  Shield,
  PiggyBank,
  ShoppingBag,
  Utensils,
  Home,
  Car,
  Lock,
  Users,
  User,
  Check,
  FolderPlus,
  Sparkles,
  ArrowRightLeft,
  X,
  CreditCard,
} from 'lucide-react';
import { USERS, CATEGORIES_INCOME, CATEGORIES_OUTCOME } from '@/lib/constants';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface CashFlowDashboardProps {
  activeUserId: number;
}

const COLOR_THEMES: Record<
  string,
  {
    bg: string;
    text: string;
    border: string;
    badge: string;
    ring: string;
    bar: string;
    cardBg: string;
    cardBorder: string;
    cardBorderSelected: string;
    iconBg: string;
    iconText: string;
    divider: string;
    track: string;
    btnAction: string;
  }
> = {
  emerald: {
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
    badge: 'bg-emerald-100 text-emerald-800 border border-emerald-200/60',
    ring: 'ring-emerald-500',
    bar: 'bg-emerald-500',
    cardBg: 'bg-emerald-50/70 hover:bg-emerald-50',
    cardBorder: 'border-emerald-200/90 hover:border-emerald-300',
    cardBorderSelected: 'border-emerald-500',
    iconBg: 'bg-white shadow-xs border border-emerald-200/80',
    iconText: 'text-emerald-600',
    divider: 'border-emerald-200/60',
    track: 'bg-emerald-200/40',
    btnAction: 'text-emerald-700 hover:bg-emerald-100/80',
  },
  teal: {
    bg: 'bg-teal-500/10',
    text: 'text-teal-700',
    border: 'border-teal-200',
    badge: 'bg-teal-100 text-teal-800 border border-teal-200/60',
    ring: 'ring-teal-500',
    bar: 'bg-teal-500',
    cardBg: 'bg-teal-50/70 hover:bg-teal-50',
    cardBorder: 'border-teal-200/90 hover:border-teal-300',
    cardBorderSelected: 'border-teal-500',
    iconBg: 'bg-white shadow-xs border border-teal-200/80',
    iconText: 'text-teal-600',
    divider: 'border-teal-200/60',
    track: 'bg-teal-200/40',
    btnAction: 'text-teal-700 hover:bg-teal-100/80',
  },
  blue: {
    bg: 'bg-blue-500/10',
    text: 'text-blue-700',
    border: 'border-blue-200',
    badge: 'bg-blue-100 text-blue-800 border border-blue-200/60',
    ring: 'ring-blue-500',
    bar: 'bg-blue-500',
    cardBg: 'bg-blue-50/70 hover:bg-blue-50',
    cardBorder: 'border-blue-200/90 hover:border-blue-300',
    cardBorderSelected: 'border-blue-500',
    iconBg: 'bg-white shadow-xs border border-blue-200/80',
    iconText: 'text-blue-600',
    divider: 'border-blue-200/60',
    track: 'bg-blue-200/40',
    btnAction: 'text-blue-700 hover:bg-blue-100/80',
  },
  indigo: {
    bg: 'bg-indigo-500/10',
    text: 'text-indigo-700',
    border: 'border-indigo-200',
    badge: 'bg-indigo-100 text-indigo-800 border border-indigo-200/60',
    ring: 'ring-indigo-500',
    bar: 'bg-indigo-500',
    cardBg: 'bg-indigo-50/70 hover:bg-indigo-50',
    cardBorder: 'border-indigo-200/90 hover:border-indigo-300',
    cardBorderSelected: 'border-indigo-500',
    iconBg: 'bg-white shadow-xs border border-indigo-200/80',
    iconText: 'text-indigo-600',
    divider: 'border-indigo-200/60',
    track: 'bg-indigo-200/40',
    btnAction: 'text-indigo-700 hover:bg-indigo-100/80',
  },
  purple: {
    bg: 'bg-purple-500/10',
    text: 'text-purple-700',
    border: 'border-purple-200',
    badge: 'bg-purple-100 text-purple-800 border border-purple-200/60',
    ring: 'ring-purple-500',
    bar: 'bg-purple-500',
    cardBg: 'bg-purple-50/70 hover:bg-purple-50',
    cardBorder: 'border-purple-200/90 hover:border-purple-300',
    cardBorderSelected: 'border-purple-500',
    iconBg: 'bg-white shadow-xs border border-purple-200/80',
    iconText: 'text-purple-600',
    divider: 'border-purple-200/60',
    track: 'bg-purple-200/40',
    btnAction: 'text-purple-700 hover:bg-purple-100/80',
  },
  rose: {
    bg: 'bg-rose-500/10',
    text: 'text-rose-700',
    border: 'border-rose-200',
    badge: 'bg-rose-100 text-rose-800 border border-rose-200/60',
    ring: 'ring-rose-500',
    bar: 'bg-rose-500',
    cardBg: 'bg-rose-50/70 hover:bg-rose-50',
    cardBorder: 'border-rose-200/90 hover:border-rose-300',
    cardBorderSelected: 'border-rose-500',
    iconBg: 'bg-white shadow-xs border border-rose-200/80',
    iconText: 'text-rose-600',
    divider: 'border-rose-200/60',
    track: 'bg-rose-200/40',
    btnAction: 'text-rose-700 hover:bg-rose-100/80',
  },
  amber: {
    bg: 'bg-amber-500/10',
    text: 'text-amber-700',
    border: 'border-amber-200',
    badge: 'bg-amber-100 text-amber-800 border border-amber-200/60',
    ring: 'ring-amber-500',
    bar: 'bg-amber-500',
    cardBg: 'bg-amber-50/70 hover:bg-amber-50',
    cardBorder: 'border-amber-200/90 hover:border-amber-300',
    cardBorderSelected: 'border-amber-500',
    iconBg: 'bg-white shadow-xs border border-amber-200/80',
    iconText: 'text-amber-700',
    divider: 'border-amber-200/60',
    track: 'bg-amber-200/40',
    btnAction: 'text-amber-700 hover:bg-amber-100/80',
  },
};

const ICONS_CONFIG = [
  { id: 'wallet', label: 'Dompet', icon: Wallet },
  { id: 'coffee', label: 'Jajan / Kopi', icon: Coffee },
  { id: 'heart', label: 'Sedekah', icon: Heart },
  { id: 'shield', label: 'Darurat', icon: Shield },
  { id: 'piggy-bank', label: 'Tabungan', icon: PiggyBank },
  { id: 'shopping-bag', label: 'Belanja', icon: ShoppingBag },
  { id: 'utensils', label: 'Makan', icon: Utensils },
  { id: 'home', label: 'Kos / Rumah', icon: Home },
  { id: 'car', label: 'Transport', icon: Car },
];

export default function CashFlowDashboard({ activeUserId }: CashFlowDashboardProps) {
  const activeUserObj = USERS.find((u) => u.id === activeUserId) || USERS[0];
  const activeUserName = activeUserObj.name;

  const currentMonthStr = new Date().toISOString().slice(0, 7);
  const [selectedMonth, setSelectedMonth] = useState(currentMonthStr);

  // Tab View Mode: 'all' (Semua) di paling awal, lalu 'pribadi' (Dompet Pribadi), lalu 'bersama' (Dompet Bersama)
  const [viewMode, setViewMode] = useState<'all' | 'pribadi' | 'bersama'>('all');
  const [selectedKantongFilter, setSelectedKantongFilter] = useState<string>('all');

  // Modals
  const [isAddTxModalOpen, setIsAddTxModalOpen] = useState(false);
  const [isKantongModalOpen, setIsKantongModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);

  // Editing targets
  const [editingTx, setEditingTx] = useState<any>(null);
  const [editingKantong, setEditingKantong] = useState<any>(null);

  // Transaction form states
  const [txJenis, setTxJenis] = useState<'Income' | 'Outcome'>('Outcome');
  const [txNominal, setTxNominal] = useState('');
  const [txKategori, setTxKategori] = useState(CATEGORIES_OUTCOME[0]);
  const [txTanggal, setTxTanggal] = useState(new Date().toISOString().slice(0, 10));
  const [txCatatan, setTxCatatan] = useState('');
  const [txKantongId, setTxKantongId] = useState<string>('');
  const [txUserInput, setTxUserInput] = useState(activeUserId);

  // Kantong form states
  const [kNama, setKNama] = useState('');
  const [kTipe, setKTipe] = useState<'BERSAMA' | 'PRIBADI'>('PRIBADI');
  const [kSaldoAwal, setKSaldoAwal] = useState('0');
  const [kTarget, setKTarget] = useState('');
  const [kDeskripsi, setKDeskripsi] = useState('');
  const [kWarna, setKWarna] = useState('emerald');
  const [kIkon, setKIkon] = useState('wallet');

  // Transfer form states
  const [tfSourceId, setTfSourceId] = useState<string>('');
  const [tfTargetId, setTfTargetId] = useState<string>('');
  const [tfNominal, setTfNominal] = useState('');
  const [tfCatatan, setTfCatatan] = useState('');

  // Budget state
  const [budgetLimitInput, setBudgetLimitInput] = useState('');

  // SWR: Fetch Kantong (dengan privasi aktif berdasarkan activeUserId)
  const { data: kantongResp, mutate: mutateKantong } = useSWR(
    `/api/kantong?userId=${activeUserId}`,
    fetcher
  );

  // SWR: Fetch Transaksi (dengan isolasi privasi)
  const filterTipeParam = viewMode === 'all' ? 'all' : viewMode === 'bersama' ? 'BERSAMA' : 'PRIBADI';
  const { data: txResp, mutate: mutateTx } = useSWR(
    `/api/transaksi?month=${selectedMonth}&activeUserId=${activeUserId}&filterTipe=${filterTipeParam}&kantongId=${selectedKantongFilter}`,
    fetcher
  );

  // SWR: Fetch Anggaran Bulanan
  const { data: budgetData, mutate: mutateBudget } = useSWR(
    `/api/anggaran?month=${selectedMonth}`,
    fetcher
  );

  const kantongList: any[] = kantongResp?.data || [];
  const kantongBersama: any[] = kantongResp?.kantongBersama || [];
  const kantongPribadi: any[] = kantongResp?.kantongPribadi || [];
  const totalSaldoBersama: number = kantongResp?.totalSaldoBersama || 0;
  const totalSaldoPribadi: number = kantongResp?.totalSaldoPribadi || 0;

  const transactions: any[] = txResp?.data || [];
  const statsFiltered = txResp?.stats || { totalIncome: 0, totalOutcome: 0, netSaldo: 0 };
  const statsBersama = txResp?.statsBersama || { totalIncome: 0, totalOutcome: 0, netSaldo: 0 };
  const statsPribadi = txResp?.statsPribadi || { totalIncome: 0, totalOutcome: 0, netSaldo: 0 };

  const budgetLimit = budgetData?.data?.batas_nominal || 3500000;
  const budgetSpent = statsBersama.totalOutcome;
  const budgetPercentage = Math.min(Math.round((budgetSpent / budgetLimit) * 100), 100);
  const isBudgetWarning = budgetSpent >= budgetLimit * 0.8;
  const isBudgetExceeded = budgetSpent > budgetLimit;

  // Category Breakdown
  const categoryTotals: { [key: string]: number } = {};
  transactions
    .filter((t) => t.jenis === 'Outcome')
    .forEach((t) => {
      categoryTotals[t.kategori] = (categoryTotals[t.kategori] || 0) + t.nominal;
    });

  // Render Icon helper
  const renderKantongIcon = (iconName: string, className = 'w-4 h-4') => {
    const found = ICONS_CONFIG.find((i) => i.id === iconName);
    const Comp = found ? found.icon : Wallet;
    return <Comp className={className} />;
  };

  // --- HANDLER TRANSAKSI ---
  const openAddTxModal = (txToEdit?: any, defaultKantongId?: number) => {
    if (txToEdit) {
      setEditingTx(txToEdit);
      setTxJenis(txToEdit.jenis);
      setTxNominal(txToEdit.nominal.toString());
      setTxKategori(txToEdit.kategori);
      setTxTanggal(new Date(txToEdit.tanggal).toISOString().slice(0, 10));
      setTxCatatan(txToEdit.catatan || '');
      setTxKantongId(txToEdit.id_kantong ? txToEdit.id_kantong.toString() : '');
      setTxUserInput(txToEdit.id_pengguna);
    } else {
      setEditingTx(null);
      setTxJenis('Outcome');
      setTxNominal('');
      setTxKategori(CATEGORIES_OUTCOME[0]);
      setTxTanggal(new Date().toISOString().slice(0, 10));
      setTxCatatan('');
      if (defaultKantongId) {
        setTxKantongId(defaultKantongId.toString());
      } else if (viewMode === 'pribadi' && kantongPribadi.length > 0) {
        setTxKantongId(kantongPribadi[0].id_kantong.toString());
      } else if (viewMode === 'bersama' && kantongBersama.length > 0) {
        setTxKantongId(kantongBersama[0].id_kantong.toString());
      } else if (kantongList.length > 0) {
        setTxKantongId(kantongList[0].id_kantong.toString());
      } else {
        setTxKantongId('');
      }
      setTxUserInput(activeUserId);
    }
    setIsAddTxModalOpen(true);
  };

  const handleSaveTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!txNominal || parseFloat(txNominal) <= 0) {
      alert('Masukkan nominal transaksi yang valid.');
      return;
    }

    const payload = {
      id_transaksi: editingTx?.id_transaksi,
      jenis: txJenis,
      nominal: parseFloat(txNominal),
      kategori: txKategori,
      tanggal: txTanggal,
      catatan: txCatatan,
      id_pengguna: txUserInput,
      id_kantong: txKantongId ? parseInt(txKantongId, 10) : null,
    };

    const method = editingTx ? 'PUT' : 'POST';
    const res = await fetch('/api/transaksi', {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const result = await res.json();
    if (result.success) {
      setIsAddTxModalOpen(false);
      mutateTx();
      mutateKantong();
    } else {
      alert('Gagal menyimpan: ' + result.error);
    }
  };

  const handleDeleteTransaction = async (id: number) => {
    if (!confirm('Apakah Anda yakin ingin menghapus transaksi ini?')) return;
    const res = await fetch(`/api/transaksi?id=${id}`, { method: 'DELETE' });
    const result = await res.json();
    if (result.success) {
      mutateTx();
      mutateKantong();
    }
  };

  // --- HANDLER KANTONG ---
  const openAddKantongModal = (kToEdit?: any, defaultTipe?: 'BERSAMA' | 'PRIBADI') => {
    if (kToEdit) {
      setEditingKantong(kToEdit);
      setKNama(kToEdit.nama);
      setKTipe(kToEdit.tipe);
      setKSaldoAwal(kToEdit.saldo_awal?.toString() || '0');
      setKTarget(kToEdit.target_nominal?.toString() || '');
      setKDeskripsi(kToEdit.deskripsi || '');
      setKWarna(kToEdit.warna || 'emerald');
      setKIkon(kToEdit.ikon || 'wallet');
    } else {
      setEditingKantong(null);
      setKNama('');
      setKTipe(defaultTipe || (viewMode === 'bersama' ? 'BERSAMA' : 'PRIBADI'));
      setKSaldoAwal('0');
      setKTarget('');
      setKDeskripsi('');
      setKWarna(defaultTipe === 'BERSAMA' ? 'emerald' : 'teal');
      setKIkon('wallet');
    }
    setIsKantongModalOpen(true);
  };

  const handleSaveKantong = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!kNama.trim()) {
      alert('Nama kantong wajib diisi.');
      return;
    }

    const payload = {
      id_kantong: editingKantong?.id_kantong,
      nama: kNama.trim(),
      tipe: kTipe,
      id_pengguna: kTipe === 'PRIBADI' ? activeUserId : null,
      saldo_awal: parseFloat(kSaldoAwal) || 0,
      target_nominal: kTarget ? parseFloat(kTarget) : null,
      deskripsi: kDeskripsi.trim() || null,
      warna: kWarna,
      ikon: kIkon,
      activeUserId,
    };

    const method = editingKantong ? 'PUT' : 'POST';
    const res = await fetch('/api/kantong', {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const result = await res.json();
    if (result.success) {
      setIsKantongModalOpen(false);
      mutateKantong();
      mutateTx();
    } else {
      alert('Gagal menyimpan kantong: ' + result.error);
    }
  };

  const handleDeleteKantong = async (id: number, nama: string) => {
    if (!confirm(`Hapus kantong "${nama}"? Transaksi di dalam kantong ini akan tetap tersimpan tanpa kantong.`)) return;
    const res = await fetch(`/api/kantong?id=${id}&activeUserId=${activeUserId}`, {
      method: 'DELETE',
    });
    const result = await res.json();
    if (result.success) {
      if (selectedKantongFilter === id.toString()) {
        setSelectedKantongFilter('all');
      }
      mutateKantong();
      mutateTx();
    } else {
      alert('Gagal menghapus kantong: ' + result.error);
    }
  };

  // --- HANDLER TRANSFER ANTAR KANTONG ---
  const openTransferModal = (defaultSourceId?: number) => {
    if (kantongList.length < 2) {
      alert('Anda membutuhkan minimal 2 kantong untuk melakukan transfer saldo.');
      return;
    }
    const source = defaultSourceId ? defaultSourceId.toString() : kantongList[0]?.id_kantong.toString();
    const target = kantongList.find((k) => k.id_kantong.toString() !== source)?.id_kantong.toString() || '';
    setTfSourceId(source);
    setTfTargetId(target);
    setTfNominal('');
    setTfCatatan('');
    setIsTransferModalOpen(true);
  };

  const handleExecuteTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(tfNominal);
    if (!amount || amount <= 0) {
      alert('Masukkan nominal transfer yang valid.');
      return;
    }
    if (tfSourceId === tfTargetId) {
      alert('Kantong asal dan tujuan tidak boleh sama.');
      return;
    }

    const res = await fetch('/api/kantong/transfer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id_kantong_asal: tfSourceId,
        id_kantong_tujuan: tfTargetId,
        nominal: amount,
        catatan: tfCatatan,
        id_pengguna: activeUserId,
      }),
    });

    const result = await res.json();
    if (result.success) {
      setIsTransferModalOpen(false);
      mutateKantong();
      mutateTx();
      alert(result.message);
    } else {
      alert('Gagal transfer: ' + result.error);
    }
  };

  // --- HANDLER BUDGET ---
  const handleSaveBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!budgetLimitInput || parseFloat(budgetLimitInput) <= 0) return;

    const res = await fetch('/api/anggaran', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        month: selectedMonth,
        batas_nominal: parseFloat(budgetLimitInput),
      }),
    });

    const result = await res.json();
    if (result.success) {
      setIsBudgetModalOpen(false);
      mutateBudget();
    }
  };

  const currentDisplayedPockets =
    viewMode === 'all'
      ? kantongList
      : viewMode === 'pribadi'
      ? kantongPribadi
      : kantongBersama;

  const activeFilteredKantongObj = kantongList.find((k) => k.id_kantong.toString() === selectedKantongFilter);

  return (
    <div className="space-y-6 pb-28">
      {/* 1. TOP HEADER & MONTH PICKER */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-2xl shadow-sm border border-slate-200/80">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
            <Calendar className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400 block">
              Bulan Pembukuan
            </span>
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="text-xs font-bold text-slate-800 bg-transparent focus:outline-none cursor-pointer"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => openTransferModal()}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all border border-slate-200 shadow-sm"
          >
            <ArrowRightLeft className="w-3.5 h-3.5 text-teal-600" />
            <span className="hidden sm:inline">Pindah Saldo</span>
          </button>

          <button
            onClick={() => openAddTxModal()}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Catat Transaksi</span>
          </button>
        </div>
      </div>

      {/* 2. MODE SWITCHER: 1. SEMUA -> 2. KANTONG PRIBADI -> 3. DOMPET BERSAMA */}
      <div className="bg-slate-200/70 p-1.5 rounded-2xl flex flex-col sm:flex-row gap-1 border border-slate-300/60">
        {/* Urutan 1: Semua Arus Kas */}
        <button
          onClick={() => {
            setViewMode('all');
            setSelectedKantongFilter('all');
          }}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition-all ${
            viewMode === 'all'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/25'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/40'
          }`}
        >
          <Wallet className="w-4 h-4" />
          <span>Semua Arus Kas</span>
          <span
            className={`text-[10px] px-1.5 py-0.5 rounded-full font-extrabold ${
              viewMode === 'all' ? 'bg-emerald-700 text-emerald-100' : 'bg-slate-300 text-slate-700'
            }`}
          >
            {kantongList.length}
          </span>
        </button>

        {/* Urutan 2: Kantong Pribadi */}
        <button
          onClick={() => {
            setViewMode('pribadi');
            setSelectedKantongFilter('all');
          }}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition-all ${
            viewMode === 'pribadi'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/25'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/40'
          }`}
        >
          <Lock className="w-3.5 h-3.5" />
          <span>Kantong Pribadi ({activeUserName})</span>
          <span
            className={`text-[10px] px-1.5 py-0.5 rounded-full font-extrabold ${
              viewMode === 'pribadi' ? 'bg-emerald-700 text-emerald-100' : 'bg-slate-300 text-slate-700'
            }`}
          >
            {kantongPribadi.length}
          </span>
        </button>

        {/* Urutan 3: Dompet Bersama */}
        <button
          onClick={() => {
            setViewMode('bersama');
            setSelectedKantongFilter('all');
          }}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition-all ${
            viewMode === 'bersama'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/25'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/40'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Dompet Bersama</span>
          <span
            className={`text-[10px] px-1.5 py-0.5 rounded-full font-extrabold ${
              viewMode === 'bersama' ? 'bg-emerald-700 text-emerald-100' : 'bg-slate-300 text-slate-700'
            }`}
          >
            {kantongBersama.length}
          </span>
        </button>
      </div>

      {/* 3. HERO CARD (SOLID BACKGROUND, HANYA NOMINAL, MASUK & KELUAR) */}
      <div className="bg-slate-900 text-white p-5 sm:p-6 rounded-2xl border border-slate-800 shadow-sm">
        {/* Nominal Utama */}
        <div className="text-3xl sm:text-4xl font-black tracking-tight text-white mb-4">
          Rp{' '}
          {(viewMode === 'all'
            ? totalSaldoBersama + totalSaldoPribadi
            : viewMode === 'pribadi'
            ? totalSaldoPribadi
            : totalSaldoBersama
          ).toLocaleString('id-ID')}
        </div>

        {/* Nominal Masuk dan Keluar */}
        <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[11px] text-slate-400 block font-medium">Masuk</span>
              <span className="text-sm font-bold text-emerald-400">
                + Rp{' '}
                {(viewMode === 'all'
                  ? statsFiltered.totalIncome
                  : viewMode === 'pribadi'
                  ? statsPribadi.totalIncome
                  : statsBersama.totalIncome
                ).toLocaleString('id-ID')}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-rose-500/20 text-rose-400">
              <TrendingDown className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[11px] text-slate-400 block font-medium">Keluar</span>
              <span className="text-sm font-bold text-rose-400">
                - Rp{' '}
                {(viewMode === 'all'
                  ? statsFiltered.totalOutcome
                  : viewMode === 'pribadi'
                  ? statsPribadi.totalOutcome
                  : statsBersama.totalOutcome
                ).toLocaleString('id-ID')}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Monthly Budget Progress Card (Khusus Dompet Bersama) */}
      {viewMode === 'bersama' && (
        <div
          className={`p-5 rounded-2xl border transition-all ${
            isBudgetExceeded
              ? 'bg-rose-50 border-rose-200'
              : isBudgetWarning
              ? 'bg-amber-50 border-amber-200'
              : 'bg-white border-slate-200 shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              {isBudgetExceeded ? (
                <AlertTriangle className="w-5 h-5 text-rose-600 animate-bounce" />
              ) : (
                <PieIcon className="w-5 h-5 text-emerald-600" />
              )}
              <div>
                <h3 className="text-sm font-bold text-slate-800">Batas Budget Pengeluaran Bersama</h3>
                <p className="text-[11px] text-slate-400">Khusus mengawasi pengeluaran kantong bersama</p>
              </div>
            </div>
            <button
              onClick={() => {
                setBudgetLimitInput(budgetLimit.toString());
                setIsBudgetModalOpen(true);
              }}
              className="text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1 bg-slate-100 hover:bg-slate-200 px-2.5 py-1.5 rounded-lg transition-all"
            >
              <Settings className="w-3.5 h-3.5" />
              Atur Limit
            </button>
          </div>

          <div className="flex justify-between items-baseline mb-2 text-xs">
            <span className="font-medium text-slate-600">
              Terpakai: <strong className="text-slate-900">Rp {budgetSpent.toLocaleString('id-ID')}</strong>
            </span>
            <span className="font-medium text-slate-500">
              Limit: Rp {budgetLimit.toLocaleString('id-ID')}
            </span>
          </div>

          {/* Progress bar */}
          <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden mb-2">
            <div
              className={`h-full transition-all duration-500 ${
                isBudgetExceeded
                  ? 'bg-rose-600'
                  : isBudgetWarning
                  ? 'bg-amber-500'
                  : 'bg-emerald-500'
              }`}
              style={{ width: `${budgetPercentage}%` }}
            />
          </div>

          {isBudgetExceeded ? (
            <p className="text-xs font-semibold text-rose-600 flex items-center gap-1">
              ⚠️ Peringatan: Pengeluaran bersama telah MELAMPAUI batas budget!
            </p>
          ) : isBudgetWarning ? (
            <p className="text-xs font-semibold text-amber-600">
              ⚠️ Perhatian: Pengeluaran bersama mencapai {budgetPercentage}% dari batas budget.
            </p>
          ) : (
            <p className="text-xs text-slate-500">
              Sisa Kuota Budget: <strong className="text-slate-700">Rp {(budgetLimit - budgetSpent).toLocaleString('id-ID')}</strong> ({100 - budgetPercentage}%)
            </p>
          )}
        </div>
      )}

      {/* 4. DAFTAR KANTONG / POCKETS SECTION */}
      <div className="space-y-3.5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-emerald-600" />
              {viewMode === 'all'
                ? 'Semua Kantong Saya & Bersama'
                : viewMode === 'pribadi'
                ? `Kantong Pribadi Milik ${activeUserName}`
                : 'Kantong Bersama (Bewwy & Egie)'}
            </h3>
            <p className="text-xs text-slate-500">
              Pilih kantong untuk melihat riwayat mutasi atau catat transaksi langsung
            </p>
          </div>

          <button
            onClick={() =>
              openAddKantongModal(
                undefined,
                viewMode === 'bersama' ? 'BERSAMA' : 'PRIBADI'
              )
            }
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all"
          >
            <FolderPlus className="w-3.5 h-3.5" />
            + Buat Kantong
          </button>
        </div>

        {/* Selected Kantong Filter Banner */}
        {selectedKantongFilter !== 'all' && activeFilteredKantongObj && (() => {
          const filterTheme = COLOR_THEMES[activeFilteredKantongObj.warna] || COLOR_THEMES.emerald;
          return (
            <div className={`flex items-center justify-between ${filterTheme.cardBg} ${filterTheme.cardBorder} border p-3 rounded-2xl`}>
              <div className="flex items-center gap-2">
                <div className={`p-1.5 ${filterTheme.bar} text-white rounded-lg shadow-xs`}>
                  {renderKantongIcon(activeFilteredKantongObj.ikon, 'w-4 h-4')}
                </div>
                <span className={`text-xs font-bold ${filterTheme.text}`}>
                  Menampilkan transaksi khusus: <span className="underline">{activeFilteredKantongObj.nama}</span>
                </span>
              </div>
              <button
                onClick={() => setSelectedKantongFilter('all')}
                className={`flex items-center gap-1 text-xs font-bold ${filterTheme.text} bg-white px-2.5 py-1 rounded-lg border ${filterTheme.cardBorder} shadow-xs hover:bg-slate-50 transition-all`}
              >
                <X className="w-3.5 h-3.5" />
                Tampilkan Semua
              </button>
            </div>
          );
        })()}

        {/* Grid Cards Kantong dengan Warna Kotak Sesuai Pilihan */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {currentDisplayedPockets.map((k) => {
            const isSelected = selectedKantongFilter === k.id_kantong.toString();
            const theme = COLOR_THEMES[k.warna] || COLOR_THEMES.emerald;
            const isBersama = k.tipe === 'BERSAMA';

            return (
              <div
                key={k.id_kantong}
                onClick={() => {
                  setSelectedKantongFilter((prev) =>
                    prev === k.id_kantong.toString() ? 'all' : k.id_kantong.toString()
                  );
                }}
                className={`group cursor-pointer rounded-2xl border p-4 transition-all relative flex flex-col justify-between ${
                  theme.cardBg
                } ${
                  isSelected
                    ? `${theme.cardBorderSelected} ring-2 ${theme.ring} shadow-md`
                    : `${theme.cardBorder} hover:shadow-md`
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${theme.iconBg} ${theme.iconText}`}>
                        {renderKantongIcon(k.ikon, 'w-5 h-5')}
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-900 leading-tight">
                          {k.nama}
                        </h4>
                        {/* Badges Selaras: Emerald untuk Bersama, Teal untuk Pribadi */}
                        <span
                          className={`inline-block mt-0.5 text-[10px] font-bold px-2 py-0.5 rounded-md bg-white/90 shadow-xs border ${
                            isBersama
                              ? 'text-emerald-800 border-emerald-200/80'
                              : 'text-teal-800 border-teal-200/80'
                          }`}
                        >
                          {isBersama ? '🤝 Bersama' : `👤 Privat (${activeUserName})`}
                        </span>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div
                      className="flex items-center gap-1 opacity-70 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        onClick={() => openAddKantongModal(k)}
                        className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-white/80 rounded-lg transition-all"
                        title="Edit Kantong"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteKantong(k.id_kantong, k.nama)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-white/80 rounded-lg transition-all"
                        title="Hapus Kantong"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {k.deskripsi && (
                    <p className="text-[11px] text-slate-600 mb-3 line-clamp-1">{k.deskripsi}</p>
                  )}

                  {/* Saldo Nominal */}
                  <div className="my-2.5">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-0.5">
                      Sisa Saldo
                    </span>
                    <div className="text-xl font-black text-slate-900 tracking-tight">
                      Rp {k.saldo.toLocaleString('id-ID')}
                    </div>
                  </div>

                  {/* Progress Target */}
                  {k.target_nominal && k.target_nominal > 0 ? (
                    <div className={`pt-2 border-t ${theme.divider}`}>
                      <div className="flex justify-between text-[10px] font-semibold text-slate-600 mb-1">
                        <span>Target: Rp {k.target_nominal.toLocaleString('id-ID')}</span>
                        <span className="font-bold text-slate-900">{k.persentaseTarget}%</span>
                      </div>
                      <div className={`w-full h-2 ${theme.track} rounded-full overflow-hidden`}>
                        <div
                          className={`h-full ${theme.bar} rounded-full transition-all duration-500`}
                          style={{ width: `${k.persentaseTarget}%` }}
                        />
                      </div>
                    </div>
                  ) : k.saldo_awal > 0 ? (
                    <p className={`text-[10px] text-slate-500 pt-1 border-t ${theme.divider}`}>
                      Saldo awal: Rp {k.saldo_awal.toLocaleString('id-ID')}
                    </p>
                  ) : null}
                </div>

                {/* Card Quick Action Footer */}
                <div
                  className={`mt-3.5 pt-2.5 border-t ${theme.divider} flex items-center justify-between text-[11px]`}
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    onClick={() => openAddTxModal(undefined, k.id_kantong)}
                    className={`flex items-center gap-1 font-bold ${theme.btnAction} py-1 px-2.5 rounded-lg transition-all`}
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    + Transaksi
                  </button>

                  <button
                    onClick={() => openTransferModal(k.id_kantong)}
                    className="flex items-center gap-1 font-semibold text-slate-600 hover:text-slate-900 py-1 px-2.5 rounded-lg hover:bg-white/80 transition-all"
                  >
                    <ArrowRightLeft className="w-3.5 h-3.5" />
                    Pindah
                  </button>
                </div>
              </div>
            );
          })}

          {/* "+ Buat Kantong Baru" Dashed Card */}
          <div
            onClick={() =>
              openAddKantongModal(
                undefined,
                viewMode === 'bersama' ? 'BERSAMA' : 'PRIBADI'
              )
            }
            className="cursor-pointer border-2 border-dashed border-slate-300 hover:border-emerald-500 hover:bg-emerald-50/40 rounded-2xl p-6 flex flex-col items-center justify-center text-center transition-all min-h-[170px]"
          >
            <div className="w-11 h-11 rounded-2xl bg-slate-100 text-slate-500 group-hover:bg-emerald-100 group-hover:text-emerald-600 flex items-center justify-center mb-2 transition-all">
              <PlusCircle className="w-6 h-6 text-slate-400 hover:text-emerald-600" />
            </div>
            <span className="text-xs font-bold text-slate-700">
              Buat Kantong Baru
            </span>
            <span className="text-[10px] text-slate-400 mt-0.5">
              {viewMode === 'bersama' ? 'Tambah kantong bersama' : 'Tambah kantong pribadi'}
            </span>
          </div>
        </div>
      </div>

      {/* 5. SPENDING BREAKDOWN BY CATEGORY */}
      {Object.keys(categoryTotals).length > 0 && (
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <Tag className="w-4 h-4 text-emerald-600" />
            Pengeluaran Berdasarkan Kategori ({viewMode === 'all' ? 'Semua' : viewMode === 'pribadi' ? 'Pribadi' : 'Bersama'})
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {Object.entries(categoryTotals).map(([cat, total]) => {
              const baseTotal = statsFiltered.totalOutcome || 1;
              const pct = Math.round((total / baseTotal) * 100);
              return (
                <div key={cat} className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                    <span>{cat}</span>
                    <span>
                      Rp {total.toLocaleString('id-ID')} ({pct}%)
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 6. RIWAYAT TRANSAKSI */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-bold text-slate-800">
              Riwayat Transaksi{' '}
              {viewMode === 'all'
                ? '(Semua Arus Kas)'
                : viewMode === 'pribadi'
                ? `(Kantong Pribadi ${activeUserName})`
                : '(Dompet Bersama)'}
            </h3>
            {selectedKantongFilter !== 'all' && activeFilteredKantongObj && (
              <span className="text-[11px] font-medium text-emerald-600">
                Difilter: {activeFilteredKantongObj.nama}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedKantongFilter}
              onChange={(e) => setSelectedKantongFilter(e.target.value)}
              className="text-xs font-semibold text-slate-700 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200 focus:outline-none"
            >
              <option value="all">Semua Kantong</option>
              {currentDisplayedPockets.map((k) => (
                <option key={k.id_kantong} value={k.id_kantong}>
                  {k.tipe === 'BERSAMA' ? '🤝' : '👤'} {k.nama}
                </option>
              ))}
            </select>
            <span className="text-xs font-semibold text-slate-400">{transactions.length} item</span>
          </div>
        </div>

        {transactions.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-sm">
            Belum ada transaksi pada periode ini.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {transactions.map((tx) => {
              const isIncome = tx.jenis === 'Income';
              const userObj = USERS.find((u) => u.id === tx.id_pengguna) || USERS[0];
              const txKantong = tx.kantong;
              const isKantongBersama = txKantong?.tipe === 'BERSAMA';

              return (
                <div
                  key={tx.id_transaksi}
                  className="p-4 flex items-center justify-between hover:bg-slate-50/80 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-2.5 rounded-xl ${
                        isIncome ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                      }`}
                    >
                      {isIncome ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-sm font-bold text-slate-800">{tx.kategori}</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${userObj.badgeColor}`}>
                          {userObj.name}
                        </span>
                        {txKantong && (() => {
                          const kTheme = txKantong.warna ? COLOR_THEMES[txKantong.warna] : null;
                          return (
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 ${
                                kTheme
                                  ? kTheme.badge
                                  : isKantongBersama
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-teal-100 text-teal-800'
                              }`}
                            >
                              {renderKantongIcon(txKantong.ikon, 'w-3 h-3')}
                              {txKantong.nama}
                            </span>
                          );
                        })()}
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5">
                        {new Date(tx.tanggal).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                        {tx.catatan && ` • ${tx.catatan}`}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span
                      className={`text-sm font-extrabold ${
                        isIncome ? 'text-emerald-600' : 'text-slate-800'
                      }`}
                    >
                      {isIncome ? '+' : '-'} Rp {tx.nominal.toLocaleString('id-ID')}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openAddTxModal(tx)}
                        className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
                        title="Edit Transaksi"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteTransaction(tx.id_transaksi)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg"
                        title="Hapus Transaksi"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 7. MODAL: TAMBAH / EDIT TRANSAKSI */}
      {isAddTxModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-6 border border-slate-100 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-slate-800 mb-4">
              {editingTx ? 'Edit Transaksi' : 'Tambah Transaksi Baru'}
            </h3>

            <form onSubmit={handleSaveTransaction} className="space-y-4">
              {/* Jenis Transaksi */}
              <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-2xl">
                <button
                  type="button"
                  onClick={() => {
                    setTxJenis('Outcome');
                    setTxKategori(CATEGORIES_OUTCOME[0]);
                  }}
                  className={`py-2 text-xs font-bold rounded-xl transition-all ${
                    txJenis === 'Outcome' ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-500'
                  }`}
                >
                  Pengeluaran (-)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTxJenis('Income');
                    setTxKategori(CATEGORIES_INCOME[0]);
                  }}
                  className={`py-2 text-xs font-bold rounded-xl transition-all ${
                    txJenis === 'Income' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500'
                  }`}
                >
                  Pemasukan (+)
                </button>
              </div>

              {/* Nominal */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Nominal (Rp)</label>
                <input
                  type="number"
                  value={txNominal}
                  onChange={(e) => setTxNominal(e.target.value)}
                  placeholder="Contoh: 50000"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 text-sm font-semibold text-slate-800"
                  required
                />
              </div>

              {/* PILIH KANTONG / DOMPET */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Pilih Kantong / Dompet
                </label>
                <select
                  value={txKantongId}
                  onChange={(e) => setTxKantongId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 text-sm font-medium text-slate-800 bg-white"
                >
                  <option value="">-- Tanpa Kantong Khusus --</option>
                  {kantongPribadi.length > 0 && (
                    <optgroup label={`👤 Kantong Pribadi Saya (${activeUserName})`}>
                      {kantongPribadi.map((k) => (
                        <option key={k.id_kantong} value={k.id_kantong}>
                          👤 {k.nama} (Saldo: Rp {k.saldo.toLocaleString('id-ID')})
                        </option>
                      ))}
                    </optgroup>
                  )}
                  {kantongBersama.length > 0 && (
                    <optgroup label="🤝 Kantong Bersama">
                      {kantongBersama.map((k) => (
                        <option key={k.id_kantong} value={k.id_kantong}>
                          🤝 {k.nama} (Saldo: Rp {k.saldo.toLocaleString('id-ID')})
                        </option>
                      ))}
                    </optgroup>
                  )}
                </select>
                <p className="text-[10px] text-slate-400 mt-1">
                  Kantong pribadi orang lain tersembunyi secara otomatis demi privasi.
                </p>
              </div>

              {/* Kategori */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Kategori</label>
                <select
                  value={txKategori}
                  onChange={(e) => setTxKategori(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 text-sm font-medium text-slate-800 bg-white"
                >
                  {(txJenis === 'Outcome' ? CATEGORIES_OUTCOME : CATEGORIES_INCOME).map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              {/* Diinput Oleh */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Diinput Oleh</label>
                <select
                  value={txUserInput}
                  onChange={(e) => setTxUserInput(parseInt(e.target.value, 10))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 text-sm font-medium text-slate-800 bg-white"
                >
                  {USERS.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Tanggal */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Tanggal</label>
                <input
                  type="date"
                  value={txTanggal}
                  onChange={(e) => setTxTanggal(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 text-sm font-medium text-slate-800"
                />
              </div>

              {/* Catatan */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Catatan / Keterangan</label>
                <input
                  type="text"
                  value={txCatatan}
                  onChange={(e) => setTxCatatan(e.target.value)}
                  placeholder="Contoh: Beli boba bareng Egie"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 text-sm text-slate-800"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddTxModalOpen(false)}
                  className="w-1/2 py-2.5 text-xs font-bold text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md shadow-emerald-600/20"
                >
                  Simpan Transaksi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 8. MODAL: TAMBAH / EDIT KANTONG */}
      {isKantongModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-6 border border-slate-100 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-slate-800 mb-2">
              {editingKantong ? 'Edit Kantong' : 'Buat Kantong Baru'}
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Atur dompet khusus untuk jajan, sedekah, darurat, atau tabungan bersama
            </p>

            <form onSubmit={handleSaveKantong} className="space-y-4">
              {/* Sifat Kantong: Pribadi & Bersama Selaras */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Sifat Kepemilikan Kantong
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setKTipe('PRIBADI')}
                    className={`p-3 rounded-2xl border text-left text-xs font-bold transition-all ${
                      kTipe === 'PRIBADI'
                        ? 'border-teal-500 bg-teal-50 text-teal-800 ring-2 ring-teal-500'
                        : 'border-slate-200 bg-slate-50 text-slate-600'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 mb-1">
                      <Lock className="w-4 h-4 text-teal-600" />
                      <span>Pribadi ({activeUserName})</span>
                    </div>
                    <p className="text-[10px] font-normal text-slate-500">
                      Privat, hanya Anda yang melihat
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setKTipe('BERSAMA')}
                    className={`p-3 rounded-2xl border text-left text-xs font-bold transition-all ${
                      kTipe === 'BERSAMA'
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-800 ring-2 ring-emerald-500'
                        : 'border-slate-200 bg-slate-50 text-slate-600'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 mb-1">
                      <Users className="w-4 h-4 text-emerald-600" />
                      <span>Kantong Bersama</span>
                    </div>
                    <p className="text-[10px] font-normal text-slate-500">
                      Akses bersama Bewwy & Egie
                    </p>
                  </button>
                </div>
              </div>

              {/* Nama Kantong */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Nama Kantong</label>
                <input
                  type="text"
                  value={kNama}
                  onChange={(e) => setKNama(e.target.value)}
                  placeholder="Contoh: Dompet Jajan / Sedekah / Darurat"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 text-sm font-semibold text-slate-800"
                  required
                />
              </div>

              {/* Saldo Awal */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Saldo Awal (Rp)
                </label>
                <input
                  type="number"
                  value={kSaldoAwal}
                  onChange={(e) => setKSaldoAwal(e.target.value)}
                  placeholder="0"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 text-sm font-medium text-slate-800"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Saldo yang sudah ada saat ini untuk kantong ini.
                </p>
              </div>

              {/* Target Nominal / Batas Alokasi */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Target Tabungan / Batas (Rp, Opsional)
                </label>
                <input
                  type="number"
                  value={kTarget}
                  onChange={(e) => setKTarget(e.target.value)}
                  placeholder="Contoh: 1000000"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 text-sm font-medium text-slate-800"
                />
              </div>

              {/* Pilihan Ikon */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Pilih Ikon</label>
                <div className="grid grid-cols-5 gap-2">
                  {ICONS_CONFIG.map((item) => {
                    const isSelected = kIkon === item.id;
                    const IconComp = item.icon;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setKIkon(item.id)}
                        className={`p-2.5 rounded-xl border flex flex-col items-center justify-center transition-all ${
                          isSelected
                            ? 'border-emerald-500 bg-emerald-50 text-emerald-700 ring-2 ring-emerald-400'
                            : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                        }`}
                        title={item.label}
                      >
                        <IconComp className="w-5 h-5" />
                        <span className="text-[9px] mt-1 font-medium truncate w-full text-center">
                          {item.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Pilihan Warna */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Warna Tema</label>
                <div className="flex flex-wrap gap-2">
                  {Object.keys(COLOR_THEMES).map((cKey) => {
                    const isSelected = kWarna === cKey;
                    const c = COLOR_THEMES[cKey];
                    return (
                      <button
                        key={cKey}
                        type="button"
                        onClick={() => setKWarna(cKey)}
                        className={`w-8 h-8 rounded-full ${c.bar} flex items-center justify-center text-white transition-all ${
                          isSelected ? 'ring-2 ring-offset-2 ring-slate-800 scale-110' : 'opacity-80 hover:opacity-100'
                        }`}
                      >
                        {isSelected && <Check className="w-4 h-4 stroke-[3]" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Preview Warna Kotak Kantong */}
              {(() => {
                const previewTheme = COLOR_THEMES[kWarna] || COLOR_THEMES.emerald;
                return (
                  <div className={`p-3 rounded-2xl border ${previewTheme.cardBg} ${previewTheme.cardBorder} transition-all`}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                        Preview Kotak Kantong
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-md bg-white/90 shadow-xs border ${
                          kTipe === 'BERSAMA'
                            ? 'text-emerald-800 border-emerald-200/80'
                            : 'text-teal-800 border-teal-200/80'
                        }`}
                      >
                        {kTipe === 'BERSAMA' ? '🤝 Bersama' : `👤 Privat (${activeUserName})`}
                      </span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center ${previewTheme.iconBg} ${previewTheme.iconText}`}
                      >
                        {renderKantongIcon(kIkon, 'w-4 h-4')}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-900">
                          {kNama.trim() || 'Nama Kantong'}
                        </div>
                        <div className="text-[11px] font-extrabold text-slate-800">
                          Rp {(parseInt(kSaldoAwal, 10) || 0).toLocaleString('id-ID')}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Deskripsi */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Catatan / Tujuan</label>
                <input
                  type="text"
                  value={kDeskripsi}
                  onChange={(e) => setKDeskripsi(e.target.value)}
                  placeholder="Contoh: Alokasi untuk ngopi dan cemilan"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 text-sm text-slate-800"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsKantongModalOpen(false)}
                  className="w-1/2 py-2.5 text-xs font-bold text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md shadow-emerald-600/20"
                >
                  Simpan Kantong
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 9. MODAL: PINDAH SALDO ANTAR KANTONG */}
      {isTransferModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-6 border border-slate-100">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-teal-50 text-teal-600">
                  <ArrowRightLeft className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-800">Pindah Saldo Antar Kantong</h3>
                  <p className="text-xs text-slate-500">Geser alokasi uang dari satu kantong ke kantong lain</p>
                </div>
              </div>
              <button
                onClick={() => setIsTransferModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleExecuteTransfer} className="space-y-4">
              {/* Kantong Asal */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Dari Kantong (Asal)
                </label>
                <select
                  value={tfSourceId}
                  onChange={(e) => setTfSourceId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 text-sm font-semibold text-slate-800 bg-white"
                  required
                >
                  {kantongList.map((k) => (
                    <option key={k.id_kantong} value={k.id_kantong}>
                      {k.tipe === 'BERSAMA' ? '🤝' : '👤'} {k.nama} (Saldo: Rp {k.saldo.toLocaleString('id-ID')})
                    </option>
                  ))}
                </select>
              </div>

              {/* Kantong Tujuan */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Ke Kantong (Tujuan)
                </label>
                <select
                  value={tfTargetId}
                  onChange={(e) => setTfTargetId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 text-sm font-semibold text-slate-800 bg-white"
                  required
                >
                  {kantongList
                    .filter((k) => k.id_kantong.toString() !== tfSourceId)
                    .map((k) => (
                      <option key={k.id_kantong} value={k.id_kantong}>
                        {k.tipe === 'BERSAMA' ? '🤝' : '👤'} {k.nama} (Saldo: Rp {k.saldo.toLocaleString('id-ID')})
                      </option>
                    ))}
                </select>
              </div>

              {/* Nominal Transfer */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Nominal Dipindahkan (Rp)
                </label>
                <input
                  type="number"
                  value={tfNominal}
                  onChange={(e) => setTfNominal(e.target.value)}
                  placeholder="Contoh: 50000"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 text-sm font-black text-slate-800"
                  required
                />
              </div>

              {/* Catatan Transfer */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Catatan (Opsional)
                </label>
                <input
                  type="text"
                  value={tfCatatan}
                  onChange={(e) => setTfCatatan(e.target.value)}
                  placeholder="Contoh: Alokasi uang jajan minggu ini"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 text-sm text-slate-800"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsTransferModalOpen(false)}
                  className="w-1/2 py-2.5 text-xs font-bold text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2.5 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-xl shadow-md shadow-teal-600/20"
                >
                  Pindahkan Saldo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 10. MODAL: EDIT BUDGET BULANAN */}
      {isBudgetModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm bg-white rounded-3xl shadow-2xl p-6 border border-slate-100">
            <h3 className="text-lg font-bold text-slate-800 mb-2">Atur Batas Budget Bulanan</h3>
            <p className="text-xs text-slate-500 mb-4">Untuk pengeluaran dompet bersama bulan {selectedMonth}</p>

            <form onSubmit={handleSaveBudget} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Batas Budget Maksimal (Rp)</label>
                <input
                  type="number"
                  value={budgetLimitInput}
                  onChange={(e) => setBudgetLimitInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsBudgetModalOpen(false)}
                  className="w-1/2 py-2.5 text-xs font-bold text-slate-600 bg-slate-100 rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2.5 text-xs font-bold text-white bg-emerald-600 rounded-xl shadow-md"
                >
                  Simpan Limit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
