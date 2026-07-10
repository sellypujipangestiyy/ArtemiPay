import React, { useState } from 'react';
import { usePayroll } from '../context/PayrollContext';
import { 
  Plus, 
  Minus, 
  Search, 
  ArrowUpDown, 
  CheckCircle, 
  TrendingUp, 
  TrendingDown, 
  Coins, 
  Calendar, 
  User, 
  FileText, 
  Filter, 
  AlertCircle 
} from 'lucide-react';

export const TabTransaksiKas: React.FC = () => {
  const { kas, transaksiKas, addTransaksiKas, currentUser } = usePayroll();

  // Selected state for form input
  const [showAddForm, setShowAddForm] = useState(false);
  const [tanggal, setTanggal] = useState(new Date().toISOString().substring(0, 10));
  const [tipe, setTipe] = useState<'Masuk' | 'Keluar'>('Keluar');
  const [jumlah, setJumlah] = useState<number | ''>('');
  const [kategori, setKategori] = useState('');
  const [keterangan, setKeterangan] = useState('');
  
  // Status and feedback states
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Filter and Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'Semua' | 'Masuk' | 'Keluar'>('Semua');
  const [kategoriFilter, setKategoriFilter] = useState('Semua');

  // Categories helper options
  const kategoriMasuk = ['Modal Owner', 'Penjualan', 'Pendapatan Harian', 'Dana Hibah', 'Lain-lain'];
  const kategoriKeluar = ['Operasional Cafe', 'Pembelian Bahan COG', 'Pencairan Gaji', 'Utilitas & Sewa', 'Perbaikan & Perlengkapan', 'Lain-lain'];

  const formatter = new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  });

  // Calculate high-level metrics
  const totalMasuk = transaksiKas
    .filter(t => t.tipe === 'Masuk')
    .reduce((sum, t) => sum + t.jumlah, 0);

  const totalKeluar = transaksiKas
    .filter(t => t.tipe === 'Keluar')
    .reduce((sum, t) => sum + t.jumlah, 0);

  // Active category select options depending on selected Type
  const activeKategoriOptions = tipe === 'Masuk' ? kategoriMasuk : kategoriKeluar;

  // Handle Form Submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!tanggal) {
      setErrorMsg('Pilih tanggal transaksi.');
      return;
    }
    if (!jumlah || jumlah <= 0) {
      setErrorMsg('Masukkan nominal transaksi yang valid (di atas Rp 0).');
      return;
    }
    if (!kategori) {
      setErrorMsg('Pilih kategori transaksi.');
      return;
    }
    if (!keterangan.trim()) {
      setErrorMsg('Tuliskan uraian atau keterangan transaksi.');
      return;
    }

    // Safety check check: if type is Keluar, verify treasury cash holds sufficient funds
    if (tipe === 'Keluar' && kas.kasTersedia < jumlah) {
      setErrorMsg(`Saldo kas operasional tidak cukup! (Sisa saldo: ${formatter.format(kas.kasTersedia)})`);
      return;
    }

    const pencatarNama = currentUser?.nama || 'Admin';

    try {
      const response = await addTransaksiKas({
        tanggal,
        tipe,
        jumlah: Number(jumlah),
        kategori,
        keterangan: keterangan.trim(),
        pencatat: pencatarNama
      });

      if (response) {
        setSuccessMsg('Transaksi kas berhasil direkam dan saldo diperbarui!');
        // Reset state
        setJumlah('');
        setKategori('');
        setKeterangan('');
        setTanggal(new Date().toISOString().substring(0, 10));
        setShowAddForm(false);
        
        // Auto dismiss alert
        setTimeout(() => setSuccessMsg(null), 4000);
      } else {
        setErrorMsg('Gagal menambahkan transaksi kas.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error occurred recording transaction.');
    }
  };

  // Filtered transactions computed list
  const filteredTransactions = transaksiKas.filter(t => {
    const matchSearch = 
      t.kategori.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.keterangan.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.pencatat.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchType = typeFilter === 'Semua' || t.tipe === typeFilter;
    const matchKategori = kategoriFilter === 'Semua' || t.kategori === kategoriFilter;

    return matchSearch && matchType && matchKategori;
  });

  // Extract all unique categories present in actual logs for filters
  const uniqueCategories = Array.from(new Set(transaksiKas.map(t => t.kategori)));

  return (
    <div className="space-y-6 font-sans" id="tab-transaksi-kas">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Coins className="h-5 w-5 text-blue-900 shrink-0" />
            <span>Pemasukan & Pengeluaran Kas</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Pencatatan real-time arus keuangan masuk/keluar serta pemantauan detail peruntukan kas.
          </p>
        </div>
        
        {currentUser?.role !== 'Karyawan' && (
          <button
            onClick={() => {
              setShowAddForm(!showAddForm);
              setErrorMsg(null);
              setSuccessMsg(null);
            }}
            id="btn-tambah-transaksi"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-blue-900 hover:bg-blue-850 text-white rounded-lg text-xs font-bold shadow-xs hover:shadow-md transition-all self-start md:self-auto cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>{showAddForm ? 'Batal Tambah' : 'Catat Transaksi Baru'}</span>
          </button>
        )}
      </div>

      {/* FLASH MESSAGES */}
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

      {/* METRIC BENTO CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Available Cash Card */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs relative overflow-hidden flex flex-col justify-between">
          <div>
            <span className="text-[10px] font-black tracking-wider uppercase text-slate-400 block mb-1">
              Saldo Kas Operasional
            </span>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-2xl font-black text-slate-900 tracking-tight leading-none">
                {formatter.format(kas.kasTersedia)}
              </span>
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between text-[10px] font-semibold text-slate-400 border-t border-slate-100 pt-3">
            <span>SIA Treasury</span>
            <span className="text-blue-900 font-bold px-1.5 py-0.5 bg-blue-50 border border-blue-100 rounded-sm">
              Aktif
            </span>
          </div>
        </div>

        {/* Total Inflow Card */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <span className="text-[10px] font-black tracking-wider uppercase text-slate-400 block mb-1 flex items-center gap-1">
              <TrendingUp className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
              <span>Total Kas Masuk (Inflow)</span>
            </span>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-xl font-bold text-emerald-700 tracking-tight">
                {formatter.format(totalMasuk)}
              </span>
            </div>
          </div>
          <p className="text-[9px] text-slate-450 mt-4 leading-normal bg-emerald-50/40 p-2 rounded border border-emerald-100/30">
            Sumber dana masuk dari setoran modal owner & penjualan harian.
          </p>
        </div>

        {/* Total Outflow Card */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <span className="text-[10px] font-black tracking-wider uppercase text-slate-400 block mb-1 flex items-center gap-1">
              <TrendingDown className="h-3.5 w-3.5 text-rose-500 shrink-0" />
              <span>Total Kas Keluar (Outflow)</span>
            </span>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-xl font-bold text-rose-700 tracking-tight">
                {formatter.format(totalKeluar)}
              </span>
            </div>
          </div>
          <p className="text-[9px] text-slate-450 mt-4 leading-normal bg-rose-50/40 p-2 rounded border border-rose-100/30">
            Alokasi pengeluaran kas operasional, belanja persediaan, & pencairan gaji berkala.
          </p>
        </div>
      </div>

      {/* TWO-COLUMN WORKSPACE GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* ADD TRANSACTION FORM BLOCK */}
        {showAddForm && (
          <div className="lg:col-span-1 bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 border-b border-dashed border-slate-100 pb-2 flex items-center gap-1.5">
              <Plus className="h-4 w-4 text-blue-900 shrink-0" />
              <span>Form Catat Transaksi Baru</span>
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs font-medium">
              {/* TIPE TRANSAKSI */}
              <div>
                <label className="block text-slate-500 mb-1.5">Tipe Transaksi</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setTipe('Masuk');
                      setKategori('');
                    }}
                    className={`py-2 px-3 rounded-lg border font-bold text-center flex items-center justify-center gap-1 cursor-pointer transition ${
                      tipe === 'Masuk'
                        ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                    }`}
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Masuk</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setTipe('Keluar');
                      setKategori('');
                    }}
                    className={`py-2 px-3 rounded-lg border font-bold text-center flex items-center justify-center gap-1 cursor-pointer transition ${
                      tipe === 'Keluar'
                        ? 'border-rose-200 bg-rose-50 text-rose-800'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                    }`}
                  >
                    <Minus className="h-3.5 w-3.5" />
                    <span>Keluar</span>
                  </button>
                </div>
              </div>

              {/* TANGGAL */}
              <div>
                <label className="block text-slate-500 mb-1">Tanggal Transaksi</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                    <Calendar className="h-4 w-4 text-slate-400" />
                  </span>
                  <input
                    type="date"
                    required
                    value={tanggal}
                    onChange={(e) => setTanggal(e.target.value)}
                    className="block w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 focus:border-blue-500 focus:outline-hidden bg-slate-50/20 font-bold"
                  />
                </div>
              </div>

              {/* NOMINAL / JUMLAH */}
              <div>
                <label className="block text-slate-500 mb-1">Nomor Nominal (Rupiah)</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500 font-bold">
                    Rp
                  </span>
                  <input
                    type="number"
                    min="1"
                    placeholder="Contoh: 500000"
                    required
                    value={jumlah}
                    onChange={(e) => setJumlah(e.target.value !== '' ? Number(e.target.value) : '')}
                    className="block w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 focus:border-blue-500 focus:outline-hidden bg-slate-50/20 font-bold font-mono"
                  />
                </div>
              </div>

              {/* KATEGORI */}
              <div>
                <label className="block text-slate-500 mb-1">Kategori Transaksi</label>
                <select
                  required
                  value={kategori}
                  onChange={(e) => setKategori(e.target.value)}
                  className="block w-full rounded-lg border border-slate-200 py-2 px-3 focus:border-blue-500 focus:outline-hidden bg-slate-50/20 font-semibold"
                >
                  <option value="">-- Pilih Kategori --</option>
                  {activeKategoriOptions.map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>

              {/* URAIAN / KETERANGAN */}
              <div>
                <label className="block text-slate-500 mb-1">Uraian / Keterangan</label>
                <textarea
                  placeholder="Keterangan singkat pengeluaran atau pemasukan..."
                  rows={3}
                  required
                  value={keterangan}
                  onChange={(e) => setKeterangan(e.target.value)}
                  className="block w-full rounded-lg border border-slate-200 py-2 px-3 focus:border-blue-500 focus:outline-hidden bg-slate-50/20 font-semibold resize-none"
                />
              </div>

              {/* SUBMIT */}
              <button
                type="submit"
                className={`w-full py-2.5 rounded-lg font-bold text-center text-white transition cursor-pointer shadow-xs hover:shadow-md ${
                  tipe === 'Masuk' 
                    ? 'bg-emerald-700 hover:bg-emerald-850' 
                    : 'bg-rose-700 hover:bg-rose-850'
                }`}
              >
                Simpan Transaksi Kas {tipe}
              </button>
            </form>
          </div>
        )}

        {/* LOG LIST AND FILTERS PANEL */}
        <div className={`bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4 ${showAddForm ? 'lg:col-span-2' : 'lg:col-span-3'}`} id="transaction-logs-panel">
          
          {/* SEARCH, FILTERS & TYPE TOOGLE BAR */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-50/60 p-3 rounded-lg border border-slate-100">
            {/* Search Input */}
            <div className="relative flex-1">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                <Search className="h-4 w-4 text-slate-400" />
              </span>
              <input
                type="text"
                placeholder="Cari keterangan, kategori, pencatat..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="block w-full rounded-lg border border-slate-200 py-1.5 pl-9 pr-3 text-xs focus:border-blue-500 focus:outline-hidden bg-white font-medium"
              />
            </div>

            {/* Type tabs toggles */}
            <div className="flex gap-1 bg-slate-200/50 p-1 rounded-lg border border-slate-200 text-[10px] font-bold">
              <button
                onClick={() => setTypeFilter('Semua')}
                className={`px-3 py-1 rounded-sm cursor-pointer transition ${
                  typeFilter === 'Semua' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Semua
              </button>
              <button
                onClick={() => setTypeFilter('Masuk')}
                className={`px-3 py-1 rounded-sm cursor-pointer transition ${
                  typeFilter === 'Masuk' ? 'bg-emerald-500 text-white shadow-xs' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Masuk
              </button>
              <button
                onClick={() => setTypeFilter('Keluar')}
                className={`px-3 py-1 rounded-sm cursor-pointer transition ${
                  typeFilter === 'Keluar' ? 'bg-rose-500 text-white shadow-xs' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Keluar
              </button>
            </div>

            {/* Category Select Filter */}
            <div className="flex items-center gap-1">
              <Filter className="h-3.5 w-3.5 text-slate-400" />
              <select
                value={kategoriFilter}
                onChange={(e) => setKategoriFilter(e.target.value)}
                className="rounded-lg border border-slate-200 py-1.5 px-2 bg-white text-[10px] font-semibold text-slate-600 focus:border-blue-500 focus:outline-hidden"
              >
                <option value="Semua">Semua Kategori</option>
                {uniqueCategories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>

          {/* TABLE LOG LIST */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse" id="transaksi-kas-table">
              <thead>
                <tr className="border-b border-slate-200 text-[10px] font-black text-slate-400 uppercase tracking-wider bg-slate-50/50">
                  <th className="px-4 py-3">Tanggal</th>
                  <th className="px-4 py-3">Kategori</th>
                  <th className="px-4 py-3">Uraian / Keterangan</th>
                  <th className="px-4 py-3 text-right">Nominal</th>
                  <th className="px-4 py-3">Oleh</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                {filteredTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-12 text-center text-slate-400 font-semibold italic">
                      Tidak ditemukan riwayat transaksi kas yang cocok dengan pencarian Anda.
                    </td>
                  </tr>
                ) : (
                  filteredTransactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-slate-50/30 transition">
                      <td className="px-4 py-3 font-semibold font-mono text-[11px] whitespace-nowrap text-slate-500">
                        {tx.tanggal}
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold border bg-slate-100 text-slate-600 border-slate-200 uppercase tracking-tight">
                          {tx.kategori}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-600 font-medium">
                        <div className="max-w-[180px] sm:max-w-xs md:max-w-md break-words">
                          {tx.keterangan}
                        </div>
                        <span className="block text-[8px] text-slate-400 font-mono mt-0.5 uppercase tracking-wider">
                          ID: {tx.id}
                        </span>
                      </td>
                      <td className={`px-4 py-3 text-right font-bold whitespace-nowrap text-sm`}>
                        <span className={`inline-flex items-center gap-0.5 ${
                          tx.tipe === 'Masuk' ? 'text-emerald-700 font-black' : 'text-rose-700'
                        }`}>
                          {tx.tipe === 'Masuk' ? '+' : '-'} {formatter.format(tx.jumlah)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-500 font-semibold">
                        <div className="flex items-center gap-1.5 whitespace-nowrap">
                          <User className="h-3 w-3 text-slate-450 shrink-0" />
                          <span>{tx.pencatat ? tx.pencatat.replace(/Café Artemida|Cafe Artemida|Café|Cafe/gi, '').trim() : ''}</span>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* TOTAL COUNTER DISPLAY footer */}
          <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 pt-2 border-t border-dashed border-slate-200">
            <span>Total Hasil Filter: {filteredTransactions.length} baris riwayat</span>
            <span className="uppercase font-semibold text-slate-400">Financial Services</span>
          </div>
        </div>
      </div>
    </div>
  );
};
