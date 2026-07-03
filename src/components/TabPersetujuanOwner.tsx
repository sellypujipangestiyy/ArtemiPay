import React, { useState } from 'react';
import { usePayroll } from '../context/PayrollContext';
import { ShieldCheck, ThumbsUp, ThumbsDown, Clock, ShieldAlert, Sparkles } from 'lucide-react';

export const TabPersetujuanOwner: React.FC = () => {
  const { permintaanDana, prosesDana } = usePayroll();
  const [successNotif, setSuccessNotif] = useState<string | null>(null);

  const pendingRequests = permintaanDana.filter(r => r.status === 'Menunggu');
  const pastRequests = permintaanDana.filter(r => r.status !== 'Menunggu');

  const handleAction = async (id: string, action: 'Disetujui' | 'Ditolak') => {
    setSuccessNotif(null);
    const success = await prosesDana(id, action);
    if (success) {
      setSuccessNotif(`Permohonan tambahan dana berhasil ${action.toLowerCase()}!`);
      // Auto dimiss
      setTimeout(() => setSuccessNotif(null), 3000);
    }
  };

  const formatRupiah = (num: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(num);
  };

  return (
    <div className="space-y-6 font-sans">
      <div className="border-b border-slate-200 pb-4">
        <h2 className="text-xl font-bold text-slate-800 tracking-tight">Persetujuan Tambahan Dana (Owner Desk)</h2>
        <p className="text-xs text-slate-500 mt-1">Meja otorisasi persetujuan dana kas operasional sirkuit penggajian harian</p>
      </div>

      {successNotif && (
        <div className="max-w-2xl p-4 bg-emerald-50 border border-emerald-100 text-emerald-800 rounded-xl text-xs font-semibold flex items-center space-x-2">
          <Sparkles className="h-4.5 w-4.5 text-emerald-600 shrink-0" />
          <span>{successNotif}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Pending Requests Column (Col 7) */}
        <div className="lg:col-span-12 space-y-4">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center space-x-1.5 mb-2">
            <Clock className="h-4 w-4 text-amber-500" />
            <span>Permintaan Dana Menunggu Persetujuan ({pendingRequests.length})</span>
          </h3>

          {pendingRequests.length === 0 ? (
            <div className="p-10 border border-dashed border-slate-200 bg-white rounded-2xl text-center text-xs text-slate-400">
              <ShieldCheck className="h-8 w-8 mx-auto text-slate-300 mb-2" />
              Tidak ada permohonan tambahan dana yang aktif saat ini. Seluruh sirkulasi kas teratur.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {pendingRequests.map(req => (
                <div 
                  key={req.id} 
                  id={`permintaan-card-${req.id}`}
                  className="bg-white p-6 rounded-2xl border border-slate-200 hover:shadow-md transition-all flex flex-col justify-between space-y-4 relative overflow-hidden"
                >
                  {/* Amber Left Accent Border */}
                  <div className="absolute top-0 bottom-0 left-0 w-1.5 bg-amber-500"></div>

                  <div className="space-y-3.5 pl-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-[10px] text-slate-400 font-mono tracking-wider uppercase block">Tanggal Pengajuan</span>
                        <strong className="text-xs text-slate-700 font-mono font-semibold block mt-0.5">{req.tanggal}</strong>
                      </div>
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-50 text-amber-700 border border-amber-100 uppercase tracking-wider">
                        Menunggu
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-400 font-mono tracking-wider uppercase block">Jumlah Pengajuan Dana</span>
                      <strong className="text-xl font-extrabold text-blue-700 block mt-0.5">{formatRupiah(req.jumlahDana)}</strong>
                    </div>

                    <div className="pt-2 border-t border-slate-100">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Alasan Pengajuan:</span>
                      <p className="text-xs text-slate-600 mt-1 leading-relaxed bg-slate-50 p-2.5 rounded-xl border border-slate-50/60">{req.alasan}</p>
                    </div>
                  </div>

                  {/* Actions buttons */}
                  <div className="flex gap-2 pt-2 z-10">
                    <button
                      onClick={() => handleAction(req.id, 'Ditolak')}
                      className="flex-1 flex items-center justify-center space-x-1.5 py-2 px-3 border border-slate-200 hover:border-rose-400 hover:bg-rose-50 text-xs font-bold text-slate-600 hover:text-rose-700 rounded-xl transition cursor-pointer"
                    >
                      <ThumbsDown className="h-4 w-4" />
                      <span>Tolak</span>
                    </button>
                    <button
                      onClick={() => handleAction(req.id, 'Disetujui')}
                      id={`btn-approve-${req.id}`}
                      className="flex-1 flex items-center justify-center space-x-1.5 py-2 px-3 bg-blue-600 hover:bg-blue-700 text-xs font-bold text-white rounded-xl transition shadow-xs cursor-pointer"
                    >
                      <ThumbsUp className="h-4 w-4 text-white" />
                      <span>Setujui</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Historic Requests Column */}
        <div className="lg:col-span-12 space-y-4">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center space-x-1.5 pt-4">
            <ShieldAlert className="h-4 w-4 text-slate-500" />
            <span>Log Riwayat Persetujuan Dana ({pastRequests.length})</span>
          </h3>

          <div className="bg-white border text-xs border-slate-200/80 rounded-2xl overflow-hidden">
            <table className="min-w-full divide-y divide-slate-100">
              <thead>
                <tr className="bg-slate-50 font-bold text-slate-500 uppercase tracking-wider text-[10px]">
                  <th className="px-6 py-3 text-left">ID Request</th>
                  <th className="px-6 py-3 text-left">Tanggal</th>
                  <th className="px-6 py-3 text-right">Dana Diajukan</th>
                  <th className="px-6 py-3 text-left">Alasan Pengajuan</th>
                  <th className="px-6 py-3 text-center">Hasil Keputusan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {pastRequests.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-slate-400 font-medium">No past decisions logged.</td>
                  </tr>
                ) : (
                  pastRequests.map(req => (
                    <tr key={req.id} className="hover:bg-slate-50/20 transition-all">
                      <td className="px-6 py-3 font-mono font-semibold text-slate-500 text-[11px]">{req.id}</td>
                      <td className="px-6 py-3 font-mono text-slate-600">{req.tanggal}</td>
                      <td className="px-6 py-3 text-right font-mono font-bold text-slate-800">{formatRupiah(req.jumlahDana)}</td>
                      <td className="px-6 py-3 text-slate-600 max-w-sm truncate" title={req.alasan}>{req.alasan}</td>
                      <td className="px-6 py-3 text-center">
                        <span className={`inline-flex items-center px-2 py-0.5 font-bold rounded-lg ${
                          req.status === 'Disetujui' 
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
                            : 'bg-rose-50 text-rose-700 border border-rose-100'
                        }`}>
                          {req.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
