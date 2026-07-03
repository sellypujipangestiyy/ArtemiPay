import React, { useState } from 'react';
import { usePayroll } from '../context/PayrollContext';
import { 
  Users, 
  Banknote, 
  Coins, 
  ClipboardList, 
  AlertTriangle,
  CheckCircle,
  Clock,
  ArrowUpRight
} from 'lucide-react';

export const TabDashboard: React.FC = () => {
  const { karyawan, payroll, kas, permintaanDana } = usePayroll();
  const [selectedMonth, setSelectedMonth] = useState('2026-07');

  const totalKaryawan = karyawan.length;
  
  // Calculate total salary calculated for selected month
  const currentMonthPayroll = payroll.filter(p => p.bulan === selectedMonth);
  const totalGajiBulanIni = currentMonthPayroll.reduce((sum, p) => sum + p.totalGaji, 0);

  // Status breakdown
  const statusPaidCount = currentMonthPayroll.filter(p => p.status === 'Sudah Dibayar').length;
  const statusUnpaidCount = currentMonthPayroll.filter(p => p.status === 'Belum Dibayar').length;

  const totalUnpaidAmount = currentMonthPayroll
    .filter(p => p.status === 'Belum Dibayar')
    .reduce((sum, p) => sum + p.totalGaji, 0);

  // Pending fund request count
  const pendingRequestsCount = permintaanDana.filter(r => r.status === 'Menunggu').length;

  const formatRupiah = (num: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(num);
  };

  const getMonthLabel = (m: string) => {
    const labels: { [key: string]: string } = {
      '2026-12': 'Desember 2026',
      '2026-11': 'November 2026',
      '2026-10': 'Oktober 2026',
      '2026-09': 'September 2026',
      '2026-08': 'Agustus 2026',
      '2026-07': 'Juli 2026',
      '2026-06': 'Juni 2026',
      '2026-05': 'Mei 2026',
      '2026-04': 'April 2026',
      '2026-03': 'Maret 2026',
      '2026-02': 'Februari 2026',
      '2026-01': 'Januari 2026',
    };
    return labels[m] || m;
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Banner Message */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight font-display">Ringkasan Penggajian Real-Time</h2>
          <p className="text-xs text-slate-500 mt-1 font-medium">Siklus informasi akuntansi terintegrasi Firebase dan monitor kas</p>
        </div>
        <div className="flex items-center space-x-2">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Pilih Siklus:</label>
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="text-xs bg-blue-50 border border-blue-100 px-3 py-1.5 rounded-lg font-mono font-bold text-blue-900 focus:outline-hidden focus:ring-1 focus:ring-blue-400 cursor-pointer"
          >
            <option value="2026-12">Desember 2026</option>
            <option value="2026-11">November 2026</option>
            <option value="2026-10">Oktober 2026</option>
            <option value="2026-09">September 2026</option>
            <option value="2026-08">Agustus 2026</option>
            <option value="2026-07">Juli 2026</option>
            <option value="2026-06">Juni 2026</option>
            <option value="2026-05">Mei 2026</option>
            <option value="2026-04">April 2026</option>
            <option value="2026-03">Maret 2026</option>
            <option value="2026-02">Februari 2026</option>
            <option value="2026-01">Januari 2026</option>
          </select>
        </div>
      </div>

      {/* Grid Stats Rows - Matching Theme Layout */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Employees */}
        <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-xs">
          <p className="text-[10px] font-bold text-slate-400 uppercase mb-1.5 tracking-widest">Total Karyawan</p>
          <p className="text-2xl font-black text-blue-900">{totalKaryawan} Orang</p>
          <div className="mt-2 text-[10px] text-slate-500 font-bold uppercase tracking-wider">Semua Unit Kerja Aktif</div>
        </div>

        {/* Total Payroll Gaji */}
        <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-xs">
          <p className="text-[10px] font-bold text-slate-400 uppercase mb-1.5 tracking-widest">Total Gaji Bulan Ini</p>
          <p className="text-2xl font-black text-blue-900 font-mono">{formatRupiah(totalGajiBulanIni)}</p>
          <div className="mt-2 text-[10px] text-indigo-600 font-bold uppercase tracking-wider">Periode Berjalan</div>
        </div>

        {/* Kas Tersedia */}
        <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-xs">
          <p className="text-[10px] font-bold text-slate-400 uppercase mb-1.5 tracking-widest">Kas Tersedia</p>
          <p className={`text-2xl font-black font-mono ${kas.kasTersedia < totalUnpaidAmount ? 'text-rose-600' : 'text-emerald-700'}`}>
            {formatRupiah(kas.kasTersedia)}
          </p>
          <div className="mt-2 text-[10px] font-bold uppercase tracking-wider">
            {kas.kasTersedia < totalUnpaidAmount ? (
              <span className="text-rose-600 flex items-center gap-1">⚠ Status Dana Kurang</span>
            ) : (
              <span className="text-emerald-600">✔ Kas Gaji Aman</span>
            )}
          </div>
        </div>

        {/* Pending Requests */}
        <div className="bg-blue-900 p-5 rounded-xl shadow-xs text-white">
          <p className="text-[10px] font-bold text-blue-300 uppercase mb-1.5 tracking-widest">Permintaan Dana</p>
          <p className="text-2xl font-black text-white">{pendingRequestsCount} Surat</p>
          <div className="mt-2 text-[10px] text-blue-300 font-bold uppercase tracking-wider">Menunggu Owner Desk</div>
        </div>
      </div>

      {/* Grid status and visual chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Card: Progress Penggajian Bulan Ini */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 lg:col-span-1 space-y-6">
          <h4 className="text-xs font-bold text-slate-800 tracking-widest uppercase border-b border-slate-100 pb-3 font-display">
            Kemajuan Transfer Gaji
          </h4>

          {/* Quick gauge indicator */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-slate-500">Persentase Terlaksana</span>
              <span className="text-blue-900 font-bold">
                {totalGajiBulanIni ? Math.round(((totalGajiBulanIni - totalUnpaidAmount) / totalGajiBulanIni) * 100) : 0}%
              </span>
            </div>
            <div className="h-3 w-full bg-slate-100 rounded-lg overflow-hiddenPatch">
              <div 
                className="h-full bg-blue-900 transition-all duration-1000 rounded-lg"
                style={{ width: `${totalGajiBulanIni ? ((totalGajiBulanIni - totalUnpaidAmount) / totalGajiBulanIni) * 100 : 0}%` }}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 bg-rose-50/50 border border-rose-100 rounded-lg text-center">
              <Clock className="mx-auto h-5 w-5 text-rose-500 mb-1" />
              <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">Belum Dibayar</span>
              <strong className="text-lg text-rose-700 block mt-1">{statusUnpaidCount} Karyawan</strong>
              <span className="text-[10px] text-slate-500 mt-0.5 block">{formatRupiah(totalUnpaidAmount)}</span>
            </div>
            
            <div className="p-3 bg-emerald-50/50 border border-emerald-100 rounded-lg text-center">
              <CheckCircle className="mx-auto h-5 w-5 text-emerald-500 mb-1" />
              <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">Sudah Dibayar</span>
              <strong className="text-lg text-emerald-700 block mt-1">{statusPaidCount} Karyawan</strong>
              <span className="text-[10px] text-slate-500 mt-0.5 block">
                {formatRupiah(totalGajiBulanIni - totalUnpaidAmount)}
              </span>
            </div>
          </div>

          {/* Safety alert message */}
          {kas.kasTersedia < totalUnpaidAmount && (
            <div className="p-3.5 bg-amber-50/60 border border-amber-200 rounded-lg text-amber-800 text-xs leading-relaxed flex items-start gap-2.5">
              <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <strong>Perhatian: Kas Kurang!</strong> Dana kas operasional tidak mencukupi untuk melunasi seluruh kewajiban gaji. Silakan laporkan atau ajukan tambahan dana ke Owner.
              </div>
            </div>
          )}
        </div>

        {/* Right Card: Interactive SVG salary list chart */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h4 className="text-xs font-bold text-slate-800 tracking-widest uppercase font-display">
              Grafik Detail Gaji Bersih per Karyawan (IDR)
            </h4>
            <span className="text-[10px] text-slate-400 font-medium">Periode {getMonthLabel(selectedMonth)}</span>
          </div>

          {/* Render interactive bar charts */}
          <div className="space-y-4 pt-2">
            {currentMonthPayroll.length === 0 ? (
              <p className="text-slate-400 text-xs text-center py-10">Data penggajian bulan ini belum dihitung.</p>
            ) : (
              currentMonthPayroll.map((pay) => {
                const maxWage = 5000000; // Reference ceiling
                const percent = Math.min(100, (pay.totalGaji / maxWage) * 100);
                return (
                  <div key={pay.id} className="space-y-1">
                    <div className="flex justify-between items-center text-xs">
                      <div>
                        <span className="font-semibold text-slate-700">{pay.karyawanNama}</span>
                        <span className="text-[10px] text-slate-400 ml-1.5">({pay.jumlahKehadiran} Kehadiran)</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="font-mono font-bold text-slate-800">{formatRupiah(pay.totalGaji)}</span>
                        <span className={`inline-block h-2 w-2 rounded-full ${pay.status === 'Sudah Dibayar' ? 'bg-emerald-500' : 'bg-rose-500'}`} title={pay.status} />
                      </div>
                    </div>
                    
                    <div className="h-4 w-full bg-slate-100 rounded-md overflow-hidden flex">
                      <div 
                        className={`h-full transition-all duration-1000 ${
                          pay.status === 'Sudah Dibayar' 
                            ? 'bg-blue-900/95 hover:bg-blue-800' 
                            : 'bg-indigo-900/40 hover:bg-indigo-900/60'
                        }`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="flex justify-between text-[10px] text-slate-400 font-mono border-t border-slate-100 pt-3">
            <span>Rp 0</span>
            <span>Rp 2.500.000 (Mtd)</span>
            <span>Rp 5.000.000+ (Max)</span>
          </div>
        </div>
      </div>
    </div>
  );
};
