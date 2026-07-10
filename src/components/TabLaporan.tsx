import React, { useState } from 'react';
import { usePayroll } from '../context/PayrollContext';
import { Payroll } from '../types';
import { Search, Printer, FileText, Download, CheckCircle, Clock } from 'lucide-react';

export const TabLaporan: React.FC = () => {
  const { payroll } = usePayroll();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'Semua' | 'Sudah Dibayar' | 'Belum Dibayar'>('Semua');
  const [filterBulan, setFilterBulan] = useState('Semua');
  
  // Selected payroll for payslip print preview sheet
  const [activeSlip, setActiveSlip] = useState<Payroll | null>(null);

  const filteredPayroll = payroll.filter((p) => {
    const matchesSearch = p.karyawanNama.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'Semua' || p.status === statusFilter;
    const matchesMonth = filterBulan === 'Semua' || p.bulan === filterBulan;
    return matchesSearch && matchesStatus && matchesMonth;
  });

  const handleExportCSV = () => {
    if (filteredPayroll.length === 0) {
      alert('Tidak ada data laporan untuk diekspor!');
      return;
    }

    const headers = ['ID Payroll', 'Nama Karyawan', 'Bulan Gaji', 'Kehadiran Hari', 'Gaji Harian', 'Tunjangan', 'Potongan', 'Total Gaji Bersih', 'Status', 'Metode', 'Tanggal Bayar'];
    const rows = filteredPayroll.map(p => [
      p.id,
      p.karyawanNama,
      p.bulan,
      p.jumlahKehadiran,
      p.gajiPerHari,
      p.tunjangan,
      p.potongan,
      p.totalGaji,
      p.status,
      p.metodePembayaran || '-',
      p.tanggalPembayaran || '-'
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `laporan_penggajian_${filterBulan}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrintDocument = (divId: string) => {
    const printContents = document.getElementById(divId)?.innerHTML;
    if (!printContents) return;

    const originalContents = document.body.innerHTML;
    
    // Simple mock print in-frame fallback using browser window
    const popupWin = window.open('', '_blank', 'width=800,height=600');
    if (popupWin) {
      popupWin.document.open();
      popupWin.document.write(`
        <html>
          <head>
            <title>Cetak Slip Gaji</title>
            <style>
              body { font-family: 'Helvetica Neue', Arial, sans-serif; padding: 40px; color: #333; line-height: 1.6; }
              .slip-container { max-width: 650px; margin: 0 auto; border: 2px solid #ddd; padding: 30px; border-radius: 12px; }
              .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 15px; margin-bottom: 25px; }
              .header h2 { margin: 0; font-size: 24px; color: #1e3a8a; }
              .header p { margin: 5px 0 0; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #666; }
              .details { display: grid; grid-template-cols: 1fr 1fr; gap: 15px; margin-bottom: 30px; font-size: 13px; }
              .details dl { margin: 0; }
              .details dt { font-weight: bold; color: #555; font-size: 11px; text-transform: uppercase; }
              .details dd { margin: 0 0 10px; font-size: 14px; }
              .table { width: 100%; border-collapse: collapse; margin-bottom: 30px; font-size: 13px; }
              .table th { background: #f3f4f6; text-align: left; padding: 10px; border-bottom: 1px solid #ddd; }
              .table td { padding: 12px 10px; border-bottom: 1px solid #eee; }
              .table td.right { text-align: right; font-family: monospace; }
              .table th.right { text-align: right; }
              .total-row { font-size: 16px; font-weight: bold; background: #eff6ff; }
              .footer-signature { display: grid; grid-template-cols: 1fr 1fr; gap: 40px; text-align: center; margin-top: 50px; font-size: 13px; }
              .signature-space { height: 60px; }
              @media print { body { padding: 0; } .slip-container { border: none; padding: 0; } }
            </style>
          </head>
          <body onload="window.print();window.close()">
            ${printContents}
          </body>
        </html>
      `);
      popupWin.document.close();
    } else {
      // In case popups blocked, alert or print directly
      window.print();
    }
  };

  const formatRupiah = (num: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(num);
  };

  return (
    <div className="space-y-6 font-sans">
      
      {/* Search and export controls - Wireframe 10 */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/85 shadow-xs space-y-5" id="history-payroll-panel">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-800 tracking-tight">Riwayat & Laporan Penggajian</h2>
            <p className="text-xs text-slate-500 mt-0.5">Analisis slip gaji dan rekap audit pengeluaran usaha</p>
          </div>
          
          <button
            onClick={handleExportCSV}
            className="flex items-center justify-center space-x-1.5 px-3 py-2 bg-slate-900 border border-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 active:scale-95 transition-all text-center shrink-0 cursor-pointer"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Unduh Laporan CSV</span>
          </button>
        </div>

        {/* Filter elements block */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-slate-50/50 p-4 border border-slate-100 rounded-xl text-xs font-medium">
          <div className="relative">
            <input
              type="text"
              placeholder="Cari nama karyawan..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full rounded-xl border border-slate-200 py-2.5 pl-9 pr-4 text-xs font-medium focus:border-blue-500 bg-white"
            />
            <Search className="absolute left-3 top-3.5 h-3.5 w-3.5 text-slate-400" />
          </div>

          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="block w-full rounded-xl border border-slate-200 py-2.5 px-3 text-xs font-semibold bg-white"
            >
              <option value="Semua">Semua Pembayaran</option>
              <option value="Sudah Dibayar">Sudah Dibayar</option>
              <option value="Belum Dibayar">Belum Dibayar</option>
            </select>
          </div>

          <div>
            <select
              value={filterBulan}
              onChange={(e) => setFilterBulan(e.target.value)}
              className="block w-full rounded-xl border border-slate-200 py-2.5 px-3 text-xs font-semibold bg-white"
            >
              <option value="Semua">Semua Periode</option>
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

          <div className="flex items-center justify-end font-mono text-[11px] text-slate-500 pr-2">
            Record: <strong className="text-blue-700 ml-1">{filteredPayroll.length}</strong> siklus gaji
          </div>
        </div>

        {/* Big Ledger Table */}
        <div className="overflow-x-auto border border-slate-100 rounded-2xl">
          <table className="min-w-full divide-y divide-slate-100 text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase font-semibold">
              <tr>
                <th className="px-6 py-4 text-left">Nama</th>
                <th className="px-6 py-4 text-center">Bulan</th>
                <th className="px-6 py-4 text-right">Absensi</th>
                <th className="px-6 py-4 text-right">Gaji Bersih</th>
                <th className="px-6 py-4 text-center">Tanggal Bayar</th>
                <th className="px-6 py-4 text-center">Status</th>
                <th className="px-6 py-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-100">
              {filteredPayroll.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-10 text-center text-slate-400 font-medium">No payroll accounts found.</td>
                </tr>
              ) : (
                filteredPayroll.map(p => (
                  <tr key={p.id} className="hover:bg-slate-50/50 transition-all font-sans">
                    <td className="px-6 py-4 font-bold text-slate-800">{p.karyawanNama}</td>
                    <td className="px-6 py-4 text-center font-mono text-slate-500">{p.bulan}</td>
                    <td className="px-6 py-4 text-right font-mono font-medium">{p.jumlahKehadiran} Hari</td>
                    <td className="px-6 py-4 text-right font-mono font-bold text-slate-800">{formatRupiah(p.totalGaji)}</td>
                    <td className="px-6 py-4 text-center font-mono text-slate-500">{p.tanggalPembayaran || '—'}</td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        p.status === 'Sudah Dibayar' 
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
                          : 'bg-rose-50 text-rose-700 border border-rose-100'
                      }`}>
                        {p.status === 'Sudah Dibayar' ? (
                          <>
                            <CheckCircle className="h-3 w-3 mr-1" />
                            <span>Sudah Dibayar</span>
                          </>
                        ) : (
                          <>
                            <Clock className="h-3 w-3 mr-1" />
                            <span>Belum Dibayar</span>
                          </>
                        )}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => setActiveSlip(p)}
                        className="inline-flex items-center space-x-1 py-1 px-2.5 bg-blue-50 text-blue-700 rounded-lg text-[10px] font-bold hover:bg-blue-100 transition"
                      >
                        <FileText className="h-3 w-3" />
                        <span>Buka Payslip</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Slip Modal / Overlay Box */}
      {activeSlip && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full overflow-hidden border">
            {/* Modal Actions Header */}
            <div className="bg-slate-50 px-6 py-4 border-b flex justify-between items-center text-xs">
              <span className="font-bold text-slate-700">PRINTOUT PAYSLIP</span>
              <div className="flex space-x-2">
                <button
                  onClick={() => handlePrintDocument('active-printed-gaji-slip')}
                  className="flex items-center space-x-1 py-1 px-2.5 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition"
                >
                  <Printer className="h-3 w-3" />
                  <span>Cetak</span>
                </button>
                <button
                  onClick={() => setActiveSlip(null)}
                  className="py-1 px-2.5 border rounded-lg hover:bg-slate-100 text-slate-600"
                >
                  Tutup
                </button>
              </div>
            </div>

            {/* Print Area Block */}
            <div className="p-8" id="active-printed-gaji-slip">
              <div className="slip-container">
                <div className="header">
                  <h2>ARTEMIPAY</h2>
                  <p>Slip Gaji Bulanan Resmi</p>
                  <small style={{ color: '#888', fontFamily: 'monospace' }}>Period: {activeSlip.bulan}</small>
                </div>

                <div className="details">
                  <dl>
                    <dt>Nama Karyawan</dt>
                    <dd><strong>{activeSlip.karyawanNama}</strong></dd>
                    
                    <dt>Siklus Log ID</dt>
                    <dd style={{ fontFamily: 'monospace', fontSize: '11px' }}>{activeSlip.id}</dd>
                  </dl>
                  <dl style={{ textAlign: 'right' }}>
                    <dt>Metode Pencairan</dt>
                    <dd style={{ textTransform: 'uppercase', fontStyle: 'italic' }}><strong>{activeSlip.metodePembayaran || 'Pending'}</strong></dd>

                    <dt>Tanggal Disbursasi</dt>
                    <dd style={{ fontFamily: 'monospace' }}>{activeSlip.tanggalPembayaran || 'BELUM DICAIRKAN'}</dd>
                  </dl>
                </div>

                <table className="table">
                  <thead>
                    <tr>
                      <th>Keterangan Komponen Gaji</th>
                      <th className="right">Detail Unit / Nilai</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>Gaji Harian Dasar Kerja ({activeSlip.jumlahKehadiran} hari)</td>
                      <td className="right">Rp {(activeSlip.jumlahKehadiran * activeSlip.gajiPerHari).toLocaleString('id-ID')}</td>
                    </tr>
                    <tr>
                      <td style={{ color: '#16a34a' }}>Uang Tunjangan Operasional (+)</td>
                      <td className="right" style={{ color: '#16a34a' }}>+Rp {activeSlip.tunjangan.toLocaleString('id-ID')}</td>
                    </tr>
                    {activeSlip.lembur !== undefined && activeSlip.lembur > 0 && (
                      <tr>
                        <td style={{ color: '#d97706' }}>Upah Lembur Karyawan (+)</td>
                        <td className="right" style={{ color: '#d97706' }}>+Rp {activeSlip.lembur.toLocaleString('id-ID')}</td>
                      </tr>
                    )}
                    <tr>
                      <td style={{ color: '#dc2626' }}>Potongan Default Mandiri (-)</td>
                      <td className="right" style={{ color: '#dc2626' }}>-Rp {activeSlip.potongan.toLocaleString('id-ID')}</td>
                    </tr>
                    <tr className="total-row">
                      <td>TOTAL GAJI BERSIH (TAKE HOME PAY)</td>
                      <td className="right" style={{ color: '#1d4ed8' }}>{formatRupiah(activeSlip.totalGaji)}</td>
                    </tr>
                  </tbody>
                </table>

                <div className="footer-signature">
                  <div>
                    <span style={{ fontSize: '11px', color: '#888' }}>Penerima,</span>
                    <div className="signature-space"></div>
                    <strong>{activeSlip.karyawanNama}</strong>
                  </div>
                  <div>
                    <span style={{ fontSize: '11px', color: '#888' }}>Manajemen,</span>
                    <div className="signature-space"></div>
                    <strong>Admin Gaji</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
