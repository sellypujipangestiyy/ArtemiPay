import React, { useState } from 'react';
import { usePayroll } from '../context/PayrollContext';
import { 
  Search, 
  Download, 
  Calendar, 
  Filter, 
  Camera, 
  X, 
  Image,
  CalendarCheck
} from 'lucide-react';

export const TabAbsensiData: React.FC = () => {
  const { absensi } = usePayroll();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMonth, setFilterMonth] = useState('2026-07'); // Updated to current active month July 2026
  const [filterStatus, setFilterStatus] = useState<string>('Semua');

  // Modal view states for audit photo
  const [selectedPhotoUrl, setSelectedPhotoUrl] = useState<string | null>(null);
  const [selectedPhotoName, setSelectedPhotoName] = useState<string>('');

  // Filter list
  const filteredRecords = absensi.filter((rec) => {
    const matchesSearch = rec.karyawanNama.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesMonth = rec.tanggal.substring(0, 7) === filterMonth || filterMonth === 'Semua';
    const matchesStatus = filterStatus === 'Semua' || rec.keterangan === filterStatus;
    return matchesSearch && matchesMonth && matchesStatus;
  });

  const handleExportCSV = () => {
    if (filteredRecords.length === 0) {
      alert('Tidak ada data absen untuk diekspor!');
      return;
    }

    // Compose CSV Content
    const headers = ['Nama Karyawan', 'Tanggal Mandiri', 'Jam Masuk', 'Jam Keluar', 'Keterangan Khas', 'Bukti Selfie Masuk', 'Bukti Selfie Keluar'];
    const rows = filteredRecords.map(rec => [
      rec.karyawanNama,
      rec.tanggal,
      rec.keterangan === 'Hadir' ? rec.jamMasuk : '-',
      rec.keterangan === 'Hadir' ? (rec.jamKeluar || '-') : '-',
      rec.keterangan,
      rec.fotoSelfie ? 'Ada (Masuk)' : 'Tidak Ada',
      rec.fotoSelfieKeluar ? 'Ada (Keluar)' : 'Tidak Ada'
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `laporan_absensi_${filterMonth}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs font-sans space-y-5" id="data-absensi-panel">
      {/* Tab Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-800 tracking-tight font-display">Data Absensi Karyawan</h2>
          <p className="text-xs text-slate-500 mt-0.5">Seluruh history log kehadiran dengan rincian foto selfie identitas</p>
        </div>
        <button
          onClick={handleExportCSV}
          className="flex items-center justify-center space-x-1.5 px-3 py-2 bg-slate-900 border border-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 active:scale-95 transition-all text-center shrink-0 cursor-pointer"
        >
          <Download className="h-3.5 w-3.5" />
          <span>Export Excel / CSV</span>
        </button>
      </div>

      {/* Modern Filter Block */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-slate-50/50 p-4 border border-slate-100 rounded-xl">
        {/* Search Input */}
        <div className="relative">
          <input
            type="text"
            placeholder="Cari nama karyawan..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full rounded-xl border border-slate-200 py-2.5 pl-9 pr-4 text-xs font-medium focus:border-blue-500 focus:outline-hidden focus:ring-1 focus:ring-blue-500 bg-white"
          />
          <Search className="absolute left-3 top-3.5 h-3.5 w-3.5 text-slate-400" />
        </div>

        {/* Month Filter */}
        <div className="relative">
          <select
            value={filterMonth}
            onChange={(e) => setFilterMonth(e.target.value)}
            className="block w-full rounded-xl border border-slate-200 py-2.5 pl-9 pr-4 text-xs font-medium focus:border-blue-500 focus:outline-hidden focus:ring-1 focus:ring-blue-500 bg-white appearance-none animate-none"
          >
            <option value="Semua">Semua Bulan</option>
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
          <Calendar className="absolute left-3 top-3.5 h-3.5 w-3.5 text-slate-400" />
        </div>

        {/* Status Filter */}
        <div className="relative">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="block w-full rounded-xl border border-slate-200 py-2.5 pl-9 pr-4 text-xs font-medium focus:border-blue-500 focus:outline-hidden focus:ring-1 focus:ring-blue-500 bg-white"
          >
            <option value="Semua">Semua Keterangan</option>
            <option value="Hadir">Hadir</option>
            <option value="Sakit">Sakit</option>
            <option value="Izin">Izin</option>
          </select>
          <Filter className="absolute left-3 top-3.5 h-3.5 w-3.5 text-slate-400" />
        </div>

        {/* Quick count flag */}
        <div className="flex items-center justify-end font-mono text-[11px] text-slate-500 p-2 font-medium">
          Ditemukan: <strong className="text-blue-700 ml-1 mr-0.5">{filteredRecords.length}</strong> baris log
        </div>
      </div>

      {/* Main Table Grid - Desktop Style */}
      <div className="overflow-x-auto border border-slate-100 rounded-2xl">
        <table className="min-w-full divide-y divide-slate-100">
          <thead className="bg-slate-50 font-sans text-xs text-slate-500 uppercase tracking-wider font-semibold">
            <tr>
              <th scope="col" className="px-6 py-4 text-left font-semibold">Nama Karyawan</th>
              <th scope="col" className="px-6 py-4 text-left font-semibold">Tanggal Log</th>
              <th scope="col" className="px-6 py-4 text-center font-semibold">Jam Masuk</th>
              <th scope="col" className="px-6 py-4 text-center font-semibold">Jam Pulang</th>
              <th scope="col" className="px-6 py-4 text-center font-semibold">Keterangan</th>
              <th scope="col" className="px-6 py-4 text-center font-semibold">Bukti Foto</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-100 font-sans text-xs">
            {filteredRecords.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                  Tidak ditemukan record absen karyawan untuk kriteria filter ini.
                </td>
              </tr>
            ) : (
              filteredRecords.map((rec) => (
                <tr key={rec.id} className="hover:bg-slate-50/50 transition-all">
                  <td className="px-6 py-4.5 font-bold text-slate-800">{rec.karyawanNama}</td>
                  <td className="px-6 py-4.5 font-mono text-slate-600">{rec.tanggal}</td>
                  <td className="px-6 py-4.5 text-center font-mono text-slate-500">
                    {rec.keterangan === 'Hadir' ? (rec.jamMasuk || '-') : '-'}
                  </td>
                  <td className="px-6 py-4.5 text-center font-mono text-slate-500">
                    {rec.keterangan === 'Hadir' ? (rec.jamKeluar || '-') : '-'}
                  </td>
                  <td className="px-6 py-4.5 text-center">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold ${
                       rec.keterangan === 'Hadir' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                       rec.keterangan === 'Sakit' ? 'bg-amber-50 text-amber-700 border border-amber-100' :
                       rec.keterangan === 'Izin' ? 'bg-indigo-50 text-indigo-700 border border-indigo-100' :
                       'bg-rose-50 text-rose-700 border border-rose-100'
                    }`}>
                      {rec.keterangan}
                    </span>
                  </td>
                  <td className="px-6 py-4.5 text-center">
                    <div className="flex justify-center gap-1.5">
                      {rec.fotoSelfie ? (
                        <button
                          onClick={() => {
                            setSelectedPhotoUrl(rec.fotoSelfie || null);
                            setSelectedPhotoName(`${rec.karyawanNama} — Presensi Masuk ${rec.tanggal}`);
                          }}
                          className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-50 text-emerald-900 border border-emerald-100 rounded-lg text-[9px] font-bold transition cursor-pointer"
                        >
                          <Camera className="h-3 w-3 text-emerald-800 animate-pulse" />
                          <span>Msk</span>
                        </button>
                      ) : (
                        <div className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-slate-55 rounded-lg text-slate-400 font-medium text-[9px] border border-slate-100">
                          <span>-</span>
                        </div>
                      )}

                      {rec.keterangan === 'Hadir' && (
                        rec.fotoSelfieKeluar ? (
                          <button
                            onClick={() => {
                              setSelectedPhotoUrl(rec.fotoSelfieKeluar || null);
                              setSelectedPhotoName(`${rec.karyawanNama} — Presensi Keluar ${rec.tanggal}`);
                            }}
                            className="inline-flex items-center gap-1 px-2 py-1 bg-indigo-50 text-indigo-900 border border-indigo-100 rounded-lg text-[9px] font-bold transition cursor-pointer"
                          >
                            <Camera className="h-3 w-3 text-indigo-800" />
                            <span>Klr</span>
                          </button>
                        ) : (
                          <div className="inline-flex items-center gap-1 px-2 py-1 bg-slate-100 rounded-lg text-slate-400 font-bold text-[9px] border border-slate-200" title="Belum Absen Keluar">
                            <span>Belum Keluar</span>
                          </div>
                        )
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* RENDER MODAL FOR SELFIE AUDIT ENFORCEMENT */}
      {selectedPhotoUrl && (
        <div 
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in"
          onClick={() => setSelectedPhotoUrl(null)}
        >
          <div 
            className="bg-white rounded-2xl max-w-md w-full overflow-hidden shadow-2xl border border-slate-200 relative animate-scale-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="absolute top-0 left-0 right-0 h-1 bg-blue-600"></div>
            
            {/* Modal Header */}
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CalendarCheck className="h-5 w-5 text-blue-600" />
                <div>
                  <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider font-display">Verifikasi Selfie Karyawan</h3>
                  <p className="text-[10px] text-slate-400 font-semibold">{selectedPhotoName}</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedPhotoUrl(null)}
                className="p-1 px-2 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-100 transition cursor-pointer text-slate-500 text-xs font-bold"
              >
                Tutup (Esc)
              </button>
            </div>

            {/* Modal Body image holder */}
            <div className="p-6 bg-slate-50 flex items-center justify-center">
              <div className="relative w-full max-w-[340px] aspect-[4/3] bg-black rounded-xl overflow-hidden shadow-md border-2 border-slate-200">
                <img 
                  src={selectedPhotoUrl} 
                  alt="Bukti selfie identitas" 
                  className="w-full h-full object-cover" 
                  referrerPolicy="no-referrer"
                />
              </div>
            </div>

            {/* Modal Footer audit context */}
            <div className="px-5 py-4.5 bg-white border-t border-slate-100 text-[10px] text-slate-500 font-semibold leading-relaxed flex items-center gap-2.5">
              <div className="p-1.5 bg-emerald-50 text-emerald-700 rounded-lg shrink-0">
                <Image className="h-4 w-4" />
              </div>
              <p>
                Bukti identitas wajah diproses oleh audit internal secara valid di jaringan lokal / cloud untuk mencegah kecurangan absensi titip absen.
              </p>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
