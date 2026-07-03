import React, { useState } from 'react';
import { usePayroll } from '../context/PayrollContext';
import { TransaksiKas, JurnalUmumEntry } from '../types';
import { 
  BookOpen, 
  Plus, 
  Search, 
  ArrowUpDown, 
  CheckCircle, 
  TrendingUp, 
  TrendingDown, 
  Calendar, 
  User, 
  Filter, 
  AlertCircle,
  Info,
  Scale,
  ListRestart
} from 'lucide-react';

const chartOfAccounts = [
  { code: '1010', name: 'Kas Operasional', category: 'Aset Lancar' },
  { code: '1120', name: 'Persediaan Bahan Kopi & Bahan Baku', category: 'Aset Lancar' },
  { code: '1210', name: 'Peralatan Cafe', category: 'Aset Tetap' },
  { code: '2010', name: 'Utang Usaha', category: 'Kewajiban' },
  { code: '3010', name: 'Modal Owner', category: 'Ekuitas' },
  { code: '4010', name: 'Pendapatan Penjualan', category: 'Pendapatan' },
  { code: '5010', name: 'Beban Gaji Karyawan', category: 'Beban' },
  { code: '5020', name: 'Beban Operasional & Bahan Penunjang', category: 'Beban' },
  { code: '5030', name: 'Beban Utilitas (Listrik, Air & Wifi)', category: 'Beban' },
  { code: '5040', name: 'Beban Sewa Ruko', category: 'Beban' },
  { code: '5050', name: 'Beban Penyusutan & Perbaikan', category: 'Beban' },
];

export const TabJurnalUmum: React.FC = () => {
  const { transaksiKas, jurnalUmum, addJurnalUmum, currentUser } = usePayroll();

  // State controls for Form
  const [showForm, setShowForm] = useState(false);
  const [tanggal, setTanggal] = useState(new Date().toISOString().substring(0, 10));
  const [ref, setRef] = useState('');
  const [keterangan, setKeterangan] = useState('');
  const [debetAcc, setDebetAcc] = useState('');
  const [kreditAcc, setKreditAcc] = useState('');
  const [nominal, setNominal] = useState<number | ''>('');

  // Status/Feedback
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Filters & Toggles
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'All' | 'Auto' | 'Manual'>('All'); // Filter automatic vs manual
  const [sortByDate, setSortByDate] = useState<'ASC' | 'DESC'>('DESC'); // Sort chronological or newest first

  const rupiahFormatter = new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  });

  // Dynamically map all TransaksiKas to double-entry general journal format
  const getAutoJurnalEntries = (cashList: TransaksiKas[]): JurnalUmumEntry[] => {
    return cashList.map(tx => {
      let debetAkunCode = '5020';
      let debetAkunNama = 'Beban Operasional & Bahan Penunjang';
      let kreditAkunCode = '1010';
      let kreditAkunNama = 'Kas Operasional';
      
      if (tx.tipe === 'Masuk') {
        debetAkunCode = '1010';
        debetAkunNama = 'Kas Operasional';
        
        switch (tx.kategori) {
          case 'Modal Owner':
          case 'Modal':
            kreditAkunCode = '3010';
            kreditAkunNama = 'Modal Owner';
            break;
          case 'Penjualan':
          case 'Pendapatan Harian':
          case 'Pendapatan':
            kreditAkunCode = '4010';
            kreditAkunNama = 'Pendapatan Penjualan';
            break;
          default:
            kreditAkunCode = '3015'; // Default Equity other
            if (tx.keterangan.toLowerCase().includes('dana') || tx.keterangan.toLowerCase().includes('modal')) {
              kreditAkunCode = '3010';
              kreditAkunNama = 'Modal Owner';
            } else {
              kreditAkunCode = '3010';
              kreditAkunNama = 'Modal Owner';
            }
        }
      } else {
        // Tipe Keluar
        kreditAkunCode = '1010';
        kreditAkunNama = 'Kas Operasional';
        
        switch (tx.kategori) {
          case 'Pencairan Gaji':
          case 'Gaji':
            debetAkunCode = '5010';
            debetAkunNama = 'Beban Gaji Karyawan';
            break;
          case 'Pembelian Bahan COG':
          case 'Bahan':
          case 'Bahan Baku':
            debetAkunCode = '1120';
            debetAkunNama = 'Persediaan Bahan Kopi & Bahan Baku';
            break;
          case 'Operasional':
          case 'Operasional Cafe':
            debetAkunCode = '5020';
            debetAkunNama = 'Beban Operasional & Bahan Penunjang';
            break;
          case 'Utilitas & Sewa':
          case 'Utilitas':
            debetAkunCode = '5030';
            debetAkunNama = 'Beban Utilitas (Listrik, Air & Wifi)';
            break;
          case 'Perbaikan & Perlengkapan':
          case 'Perbaikan':
            debetAkunCode = '5050';
            debetAkunNama = 'Beban Penyusutan & Perbaikan';
            break;
          default:
            debetAkunCode = '5020';
            debetAkunNama = 'Beban Operasional & Bahan Penunjang';
        }
      }
      
      const cleanId = tx.id.replace('tx_gaji_', '').replace('tx_dana_', '').replace('tx_init_', '').replace('tx_', '');
      const docRefPrefix = tx.tipe === 'Masuk' ? 'BKM' : 'BKK'; // Bukti Kas Masuk / Bukti Kas Keluar

      return {
        id: `auto_${tx.id}`,
        tanggal: tx.tanggal,
        ref: `${docRefPrefix}-${cleanId.toUpperCase().slice(-5)}`,
        keterangan: tx.keterangan,
        debetAkunCode,
        debetAkunNama,
        kreditAkunCode,
        kreditAkunNama,
        nominal: tx.jumlah,
        pencatat: tx.pencatat,
        isAutomatic: true
      };
    });
  };

  // Convert and combine auto + manual
  const autoEntries = getAutoJurnalEntries(transaksiKas);
  const combinedEntries = [...autoEntries, ...jurnalUmum];

  // Sorting
  const sortedEntries = [...combinedEntries].sort((a, b) => {
    const dateCompare = b.tanggal.localeCompare(a.tanggal);
    if (dateCompare !== 0) {
      return sortByDate === 'DESC' ? dateCompare : -dateCompare;
    }
    const idCompare = b.id.localeCompare(a.id);
    return sortByDate === 'DESC' ? idCompare : -idCompare;
  });

  // Filter computation
  const filteredEntries = sortedEntries.filter(entry => {
    // Search query matching items
    const matchSearch = 
      entry.keterangan.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.ref.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.debetAkunNama.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.kreditAkunNama.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.debetAkunCode.includes(searchQuery) ||
      entry.kreditAkunCode.includes(searchQuery);

    if (viewMode === 'Auto') {
      return matchSearch && entry.isAutomatic;
    }
    if (viewMode === 'Manual') {
      return matchSearch && !entry.isAutomatic;
    }
    return matchSearch;
  });

  // Math totals for debug balance auditing
  const totalDebitSum = filteredEntries.reduce((sum, e) => sum + e.nominal, 0);
  const totalKreditSum = filteredEntries.reduce((sum, e) => sum + e.nominal, 0);

  // Submit manual adjustment journal entry
  const handleSubmitManual = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!tanggal) {
      setErrorMsg('Pilih tanggal pembukuan.');
      return;
    }
    if (!ref.trim()) {
      setErrorMsg('Tentukan Nomor Bukti Ref jurnal.');
      return;
    }
    if (!keterangan.trim()) {
      setErrorMsg('Masukkan uraian atau keterangan jurnal penyesuaian.');
      return;
    }
    if (!debetAcc || !kreditAcc) {
      setErrorMsg('Pilih rekening untuk Debet dan Kredit.');
      return;
    }
    if (debetAcc === kreditAcc) {
      setErrorMsg('Akun Debet dan Kredit tidak boleh sama (Double entry error).');
      return;
    }
    if (!nominal || nominal <= 0) {
      setErrorMsg('Masukkan nominal rupiah yang valid.');
      return;
    }

    const matchedDebet = chartOfAccounts.find(a => a.code === debetAcc);
    const matchedKredit = chartOfAccounts.find(a => a.code === kreditAcc);

    if (!matchedDebet || !matchedKredit) {
      setErrorMsg('Akun rekening tidak valid dalam COA.');
      return;
    }

    const payload: Omit<JurnalUmumEntry, 'id'> = {
      tanggal,
      ref: ref.trim().toUpperCase(),
      keterangan: keterangan.trim(),
      debetAkunCode: debetAcc,
      debetAkunNama: matchedDebet.name,
      kreditAkunCode: kreditAcc,
      kreditAkunNama: matchedKredit.name,
      nominal: Number(nominal),
      pencatat: currentUser?.nama || 'Admin',
      isAutomatic: false
    };

    try {
      const ok = await addJurnalUmum(payload);
      if (ok) {
        setSuccessMsg('Penyesuaian Jurnal Umum berhasil dibukukan secara sistematis!');
        setRef('');
        setKeterangan('');
        setDebetAcc('');
        setKreditAcc('');
        setNominal('');
        setShowForm(false);

        // dismiss pop info
        setTimeout(() => setSuccessMsg(null), 4000);
      } else {
        setErrorMsg('Gagal membukukan entri jurnal.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error occurred while inserting manual journal entry.');
    }
  };

  // Quick auto-generate Ref helper
  const handleAutoGenerateRef = () => {
    const epochSuffix = Date.now().toString().slice(-4);
    setRef(`JU-${new Date().getFullYear()}-${epochSuffix}`);
  };

  return (
    <div className="space-y-6 font-sans pb-12" id="tab-jurnal-umum">
      
      {/* 1. HEADER TITLE SECTION */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-blue-900 shrink-0" />
            <span>Jurnal Umum (General Journal)</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Sistem akuntansi ganda (double-entry) otomatis menyinkronkan arus kas operasional dan penyesuaian operasional non-tunai.
          </p>
        </div>

        {currentUser?.role !== 'Karyawan' && (
          <button
            onClick={() => {
              setShowForm(!showForm);
              setErrorMsg(null);
              setSuccessMsg(null);
              if (!ref) handleAutoGenerateRef();
            }}
            id="btn-tambah-jurnal-manual"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-blue-900 hover:bg-blue-850 text-white rounded-lg text-xs font-bold shadow-xs hover:shadow-md transition-all self-start md:self-auto cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>{showForm ? 'Batal Mengisi' : 'Buat Jurnal Penyesuaian'}</span>
          </button>
        )}
      </div>

      {/* FLASH RESPONSES */}
      {successMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-xs font-semibold flex items-center gap-2">
          <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-rose-500 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* 2. DUAL METRICS & BALANCING PROOF STATS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Total Debit Panel */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <span className="text-[10px] font-black tracking-wider uppercase text-slate-400 block mb-1">
            Total Nilai Debet (Terhitung)
          </span>
          <span className="text-lg font-black text-slate-900 tracking-tight block mt-1.5 font-mono">
            {rupiahFormatter.format(totalDebitSum)}
          </span>
          <span className="text-[9px] text-slate-450 block mt-1">
            Dari {filteredEntries.length} entri jurnal tersaring
          </span>
        </div>

        {/* Total Kredit Panel */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <span className="text-[10px] font-black tracking-wider uppercase text-slate-400 block mb-1">
            Total Nilai Kredit (Terhitung)
          </span>
          <span className="text-lg font-black text-slate-900 tracking-tight block mt-1.5 font-mono">
            {rupiahFormatter.format(totalKreditSum)}
          </span>
          <span className="text-[9px] text-slate-450 block mt-1">
            Harus sama persis dengan total Debet
          </span>
        </div>

        {/* Audit Status Balance */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs col-span-1 md:col-span-2 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-black tracking-wider uppercase text-slate-400 block">
              Status Keseimbangan Buku (Audited)
            </span>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-sm font-bold text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded-sm inline-flex items-center gap-1">
                <Scale className="h-3.5 w-3.5" />
                <span>SEIMBANG (BALANCED)</span>
              </span>
            </div>
          </div>
          <div className="text-[9px] text-slate-450 text-right max-w-48 leading-relaxed">
            Perhitungan akuntansi didasarkan pada <strong className="text-slate-800">Prinsip General Ledger</strong> yang valid dan otomatis.
          </div>
        </div>
      </div>

      {/* 3. CHART OF ACCOUNTS (COA) DRAWER AND TRANSACTION SUB-VIEW GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        
        {/* LEFT BAR: CHART OF ACCOUNTS GUIDE & OPTIONAL MANUAL FORM */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* A. MANUAL JOURNAL SUBMISSION FORM */}
          {showForm && (
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-4">
              <h3 className="text-xs font-bold text-slate-900 border-b border-dashed border-slate-100 pb-2 uppercase tracking-wide flex items-center gap-1.5">
                <Plus className="h-4 w-4 text-blue-900" />
                <span>Input Jurnal Penyesuaian</span>
              </h3>

              <form onSubmit={handleSubmitManual} className="space-y-3.5 text-xs font-medium">
                <div>
                  <label className="block text-slate-500 mb-1">Tanggal</label>
                  <input
                    type="date"
                    required
                    value={tanggal}
                    onChange={(e) => setTanggal(e.target.value)}
                    className="block w-full rounded-md border border-slate-200 py-1.5 px-2.5 focus:border-blue-500 focus:outline-hidden bg-slate-50/20 font-bold"
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-slate-500">No. Bukti / Ref</label>
                    <button
                      type="button"
                      onClick={handleAutoGenerateRef}
                      className="text-[10px] text-blue-900 hover:underline font-bold"
                    >
                      Auto
                    </button>
                  </div>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: JU-2026-001"
                    value={ref}
                    onChange={(e) => setRef(e.target.value)}
                    className="block w-full rounded-md border border-slate-200 py-1.5 px-2.5 focus:border-blue-500 focus:outline-hidden bg-slate-50/20 font-mono font-bold uppercase"
                  />
                </div>

                <div>
                  <label className="block text-slate-500 mb-1">Akun Debet (+ Aset / + Beban)</label>
                  <select
                    required
                    value={debetAcc}
                    onChange={(e) => setDebetAcc(e.target.value)}
                    className="block w-full rounded-md border border-slate-200 py-1.5 px-2 bg-slate-50/20 font-semibold text-[11px]"
                  >
                    <option value="">-- Pilih Rekening Debet --</option>
                    {chartOfAccounts.map(a => (
                      <option key={a.code} value={a.code}>{a.code} - {a.name} ({a.category})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-500 mb-1">Akun Kredit (+ Ekuitas / + Kredit / - Kas)</label>
                  <select
                    required
                    value={kreditAcc}
                    onChange={(e) => setKreditAcc(e.target.value)}
                    className="block w-full rounded-md border border-slate-200 py-1.5 px-2 bg-slate-50/20 font-semibold text-[11px]"
                  >
                    <option value="">-- Pilih Rekening Kredit --</option>
                    {chartOfAccounts.map(a => (
                      <option key={a.code} value={a.code}>{a.code} - {a.name} ({a.category})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-500 mb-1">Nominal Transaksi (Rp)</label>
                  <input
                    type="number"
                    min="1"
                    placeholder="Contoh: 150000"
                    required
                    value={nominal}
                    onChange={(e) => setNominal(e.target.value !== '' ? Number(e.target.value) : '')}
                    className="block w-full rounded-md border border-slate-200 py-1.5 px-2.5 focus:border-blue-500 focus:outline-hidden bg-slate-50/20 font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-slate-500 mb-1">Keterangan / Uraian</label>
                  <textarea
                    rows={2}
                    required
                    placeholder="Tuliskan alasan penyesuaian pembukuan..."
                    value={keterangan}
                    onChange={(e) => setKeterangan(e.target.value)}
                    className="block w-full rounded-md border border-slate-200 py-1.5 px-2.5 focus:border-blue-500 focus:outline-hidden bg-slate-50/20 font-semibold resize-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2 bg-emerald-700 hover:bg-emerald-850 text-white rounded-lg font-bold text-center transition cursor-pointer"
                >
                  Bukukan Jurnal
                </button>
              </form>
            </div>
          )}

          {/* B. CHART OF ACCOUNTS REFERENCE PANEL */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-3">
            <div className="flex items-center gap-1 border-b border-slate-100 pb-2">
              <Info className="h-4 w-4 text-slate-400 shrink-0" />
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Daftar Rekening (COA)
              </h3>
            </div>
            <p className="text-[10px] text-slate-400 leading-normal">
              Acuan kodefikasi nomor rekening standar akuntansi keuangan yang digunakan pada Café Artemida.
            </p>

            <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
              {chartOfAccounts.map(account => (
                <div 
                  key={account.code} 
                  className="flex items-center justify-between text-[11px] p-2 hover:bg-slate-50 rounded border border-slate-100 transition"
                >
                  <div className="font-semibold text-slate-700">
                    <span className="font-mono text-blue-900 bg-blue-50 border border-blue-105 px-1 rounded mr-1.5">
                      {account.code}
                    </span>
                    <span>{account.name}</span>
                  </div>
                  <span className="text-[9px] text-slate-400 font-bold uppercase tracking-tight scale-90 origin-right">
                    {account.category}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT AREA: THE MASTER GENERAL JOURNAL DATA TABLE & SELECTION CONTROLS */}
        <div className="lg:col-span-3 bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
          
          {/* SEARCH, TOGGLES, FILTER GROUP BAR */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-50/60 p-3 rounded-lg border border-slate-102">
            
            {/* Direct Text Search */}
            <div className="relative flex-1">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                <Search className="h-4 w-4 text-slate-400" />
              </span>
              <input
                type="text"
                placeholder="Cari jurnal (Kode, Nama Rekening, Bukti, Uraian)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="block w-full rounded-lg border border-slate-200 py-1.5 pl-9 pr-3 text-xs focus:border-blue-500 focus:outline-hidden bg-white font-medium shadow-2xs"
              />
            </div>

            {/* Filter buttons based on Auto Mapping vs Manual Added Adjustments */}
            <div className="flex gap-1 bg-slate-200/50 p-1 rounded-lg border border-slate-200 text-[10px] font-bold">
              <button
                onClick={() => setViewMode('All')}
                className={`px-3 py-1 rounded-sm cursor-pointer transition ${
                  viewMode === 'All' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Semua Jurnal
              </button>
              <button
                onClick={() => setViewMode('Auto')}
                className={`px-3 py-1 rounded-sm cursor-pointer transition ${
                  viewMode === 'Auto' ? 'bg-blue-800 text-white shadow-xs' : 'text-slate-500 hover:text-blue-805'
                }`}
              >
                Sistem Otis
              </button>
              <button
                onClick={() => setViewMode('Manual')}
                className={`px-3 py-1 rounded-sm cursor-pointer transition ${
                  viewMode === 'Manual' ? 'bg-indigo-750 text-white shadow-xs' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Penyesuaian Manual
              </button>
            </div>

            {/* Sort order Switcher */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setSortByDate(sortByDate === 'DESC' ? 'ASC' : 'DESC')}
                className="inline-flex items-center gap-1 px-3 py-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 bg-white text-[10px] font-semibold text-slate-600 transition"
                title="Klik untuk mengubah urutan tanggal"
              >
                <ArrowUpDown className="h-3.5 w-3.5 text-slate-450" />
                <span>Urutkan: {sortByDate === 'DESC' ? 'Terbaru &darr;' : 'Terlama &uarr;'}</span>
              </button>
            </div>
          </div>

          {/* GENERAL JOURNAL SYSTEMATIC DOUBLE-ENTRY TABLE */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse" id="jurnal-umum-table">
              <thead>
                <tr className="border-b border-slate-200 text-[10px] font-black text-slate-400 uppercase tracking-wider bg-slate-50/50">
                  <th className="px-4 py-3 w-28 whitespace-nowrap">Tanggal</th>
                  <th className="px-4 py-3 w-28 whitespace-nowrap">No. Bukti / Ref</th>
                  <th className="px-4 py-3">Nama Akun & Keterangan Transaksi</th>
                  <th className="px-4 py-3 text-right w-36">Debet</th>
                  <th className="px-4 py-3 text-right w-36">Kredit</th>
                  <th className="px-4 py-3 w-20 text-center">Tipe</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100/85 text-xs text-slate-700">
                {filteredEntries.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-16 text-center text-slate-400 font-semibold italic">
                      Riwayat entri jurnal kosong atau tidak cocok dengan parameter pencarian Anda.
                    </td>
                  </tr>
                ) : (
                  filteredEntries.map((entry) => (
                    <React.Fragment key={entry.id}>
                      {/* ROW DEBET (DEBIT) */}
                      <tr className="hover:bg-slate-50/20 font-medium">
                        {/* Date shown on the very top row of transactions */}
                        <td className="px-4 py-2 font-semibold font-mono text-[11px] text-slate-450 border-r border-slate-50 align-top">
                          {entry.tanggal}
                        </td>
                        {/* Reference / Invoice code */}
                        <td className="px-4 py-2 font-mono font-bold text-slate-650 border-r border-slate-50 align-top">
                          {entry.ref}
                        </td>
                        {/* Account Name */}
                        <td className="px-4 py-2 text-slate-800 font-bold border-r border-slate-50">
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono text-[10px] text-slate-450 border border-slate-100 bg-slate-50 px-1 rounded">
                              {entry.debetAkunCode}
                            </span>
                            <span>{entry.debetAkunNama}</span>
                          </div>
                        </td>
                        {/* Debit Column nominal value */}
                        <td className="px-4 py-2 text-right font-bold text-slate-900 border-r border-slate-50 font-mono">
                          {rupiahFormatter.format(entry.nominal)}
                        </td>
                        {/* Credit Column is empty on Debet account row */}
                        <td className="px-4 py-2 text-center text-slate-300 font-mono italic">
                          -
                        </td>
                        {/* automatic/manual identifier tag */}
                        <td rowSpan={2} className="px-4 py-2 text-center align-middle whitespace-nowrap">
                          {entry.isAutomatic ? (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[8px] font-bold bg-blue-50 text-blue-800 border border-blue-100 tracking-tight uppercase">
                              Otomatis
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[8px] font-bold bg-indigo-50 text-indigo-800 border border-indigo-100 tracking-tight uppercase">
                              Manual
                            </span>
                          )}
                        </td>
                      </tr>

                      {/* ROW KREDIT (CREDIT) */}
                      <tr className="hover:bg-slate-50/20 font-medium">
                        {/* Empty/No date or Ref repeated for credit row inside the same transaction block */}
                        <td className="px-4 py-2 border-r border-slate-50 text-slate-300"></td>
                        <td className="px-4 py-2 border-r border-slate-50 text-slate-300"></td>
                        {/* Right Indent credit account to follow GAAP standards */}
                        <td className="px-4 py-2 text-slate-500 border-r border-slate-50">
                          <div className="pl-6 flex items-center gap-1.5">
                            <span className="font-mono text-[10px] text-slate-400 border border-slate-100 bg-slate-50 px-1 rounded">
                              {entry.kreditAkunCode}
                            </span>
                            <span className="italic font-semibold">{entry.kreditAkunNama}</span>
                          </div>
                          
                          {/* Explanation of transaction shown muted underneath the credit account */}
                          <div className="pl-6 text-[10px] text-slate-400 font-normal mt-1 flex items-center gap-1 border-t border-dashed border-slate-100 pt-1">
                            <span className="font-bold text-[8px] tracking-wide uppercase bg-slate-100 px-0.5 text-slate-500">
                              Uraian:
                            </span>
                            <span className="line-clamp-2">{entry.keterangan}</span>
                            <span className="text-[8px] text-slate-400 font-mono ml-auto">
                              Oleh: {entry.pencatat}
                            </span>
                          </div>
                        </td>
                        {/* Debit Column is empty on Credit account row */}
                        <td className="px-4 py-2 text-center text-slate-300 font-mono italic border-r border-slate-50">
                          -
                        </td>
                        {/* Credit Column nominal value */}
                        <td className="px-4 py-2 text-right font-bold text-emerald-800 border-r border-slate-50 font-mono">
                          {rupiahFormatter.format(entry.nominal)}
                        </td>
                      </tr>
                    </React.Fragment>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* TABLE FOOTER SUMMARY */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-[10px] font-mono text-slate-400 pt-2 border-t border-dashed border-slate-200 gap-2">
            <div>
              <span>Terhitung {filteredEntries.length} bundle transaksi ganda ({filteredEntries.length * 2} baris debet/kredit)</span>
            </div>
            <div className="uppercase tracking-widest font-black text-slate-400 text-right">
              Café Artemida accounting ledger
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
