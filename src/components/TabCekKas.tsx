import React, { useState } from 'react';
import { usePayroll } from '../context/PayrollContext';
import { Coins, AlertTriangle, CheckCircle, Send, PlusCircle, RotateCcw } from 'lucide-react';

export const TabCekKas: React.FC = () => {
  const { kas, ajuDana, setKasManual } = usePayroll();

  // Permintaan dana submission states
  const [jumlahDana, setJumlahDana] = useState(7000000);
  const [alasan, setAlasan] = useState('Dana kas tidak mencukupi untuk pembayaran gaji karyawan bulan ini.');
  
  const [newKasInput, setNewKasInput] = useState(10000000);
  const [showConfig, setShowConfig] = useState(false);

  const [notif, setNotif] = useState<string | null>(null);

  const isDanaKurang = kas.kasTersedia < kas.totalGajiWajibBayar;

  const handleAjuDana = async (e: React.FormEvent) => {
    e.preventDefault();
    setNotif(null);
    if (jumlahDana <= 0 || !alasan.trim()) return;

    const success = await ajuDana(jumlahDana, alasan);
    if (success) {
      setNotif('Permintaan tambahan dana dikirim kepada Owner secara real-time.');
      setJumlahDana(0);
      setAlasan('');
      // Dismiss
      setTimeout(() => setNotif(null), 4000);
    }
  };

  const handleSetKas = async () => {
    await setKasManual(newKasInput);
    setShowConfig(false);
  };

  const formatRupiah = (num: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(num);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 font-sans">
      
      {/* Treasury Health Card (Col 6) - Wireframe 6 */}
      <div className="bg-white p-7 rounded-2xl border border-slate-200/80 shadow-xs lg:col-span-6 flex flex-col justify-between h-fit relative">
        <div className="absolute top-0 left-0 right-0 h-1 bg-blue-600 rounded-t-2xl"></div>

        <div className="space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center space-x-2.5">
              <Coins className="h-5 w-5 text-blue-600" />
              <h3 className="font-bold text-slate-800 text-sm uppercase">Pengecekan Kas Perusahaan</h3>
            </div>
            
            <button
              onClick={() => {
                setNewKasInput(kas.kasTersedia);
                setShowConfig(!showConfig);
              }}
              className="text-[10px] text-slate-400 hover:text-slate-600 font-semibold"
            >
              [Set Kas Manual]
            </button>
          </div>

          {/* Quick configure manual override */}
          {showConfig && (
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
              <label className="block text-[10px] uppercase font-bold text-slate-500">Ubah Kas Tersedia (Demo Override)</label>
              <div className="flex space-x-1">
                <input
                  type="number"
                  value={newKasInput}
                  onChange={(e) => setNewKasInput(Number(e.target.value))}
                  className="bg-white border rounded-lg px-3 py-1.5 text-xs font-mono w-full"
                />
                <button 
                  onClick={handleSetKas}
                  className="bg-slate-900 text-white rounded-lg px-3 py-1 pr-3 text-xs font-bold"
                >
                  Set
                </button>
              </div>
            </div>
          )}

          {/* Large balances readout */}
          <div className="space-y-4">
            <div className="p-5 bg-slate-50 border border-slate-100 rounded-2xl text-center">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Kas Tersedia</span>
              <strong className={`text-2xl font-black block mt-1.5 ${isDanaKurang ? 'text-rose-600' : 'text-emerald-700'}`}>
                {formatRupiah(kas.kasTersedia)}
              </strong>
            </div>

            <div className="flex justify-between items-center text-xs px-2">
              <span className="text-slate-500 font-medium">Gaji yang Harus Dibayar:</span>
              <strong className="text-slate-800 font-mono font-bold">{formatRupiah(kas.totalGajiWajibBayar)}</strong>
            </div>

            <div className="flex justify-between items-center text-xs px-2 pt-2 border-t border-slate-150">
              <span className="text-slate-500 font-medium">Status Kecukupan Gaji:</span>
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold ${
                isDanaKurang 
                  ? 'bg-rose-50 text-rose-700 border border-rose-100' 
                  : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
              }`}>
                {isDanaKurang ? (
                  <>
                    <AlertTriangle className="h-3 w-3 mr-1 shrink-0" />
                    <span>Dana Tidak Mencukupi</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-3 w-3 mr-1 shrink-0" />
                    <span>Kas Mencukupi</span>
                  </>
                )}
              </span>
            </div>
          </div>
        </div>

        {isDanaKurang && (
          <div className="mt-6 bg-rose-50/50 border border-rose-100 rounded-xl p-4 text-xs text-rose-800 leading-relaxed">
            <strong>Kewajiban Penggajian Belum Terpenuhi!</strong> Kurangnya dana sebesar{' '}
            <strong className="font-mono text-rose-700 font-bold">{formatRupiah(kas.totalGajiWajibBayar - kas.kasTersedia)}</strong> memerlukan pengiriman ajuan tambahan dana kas operasional gaji. Silakan isi form disamping.
          </div>
        )}
      </div>

      {/* Funding Requests Form (Col 6) - Wireframe 7 */}
      <div className="bg-white p-7 rounded-2xl border border-slate-200/80 shadow-xs lg:col-span-6 flex flex-col justify-between h-fit relative">
        <div className="absolute top-0 left-0 right-0 h-1 bg-amber-500 rounded-t-2xl"></div>

        <div className="space-y-4">
          <div className="flex items-center space-x-2.5 border-b border-slate-100 pb-3">
            <PlusCircle className="h-5 w-5 text-amber-500" />
            <h3 className="font-bold text-slate-800 text-sm uppercase">Permintaan Tambahan Dana</h3>
          </div>

          <form onSubmit={handleAjuDana} className="space-y-4 text-xs">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Jumlah Dana yang Diajukan (Rp)</label>
              <input
                type="number"
                required
                value={jumlahDana}
                onChange={(e) => setJumlahDana(Number(e.target.value))}
                placeholder="Contoh: 7000000"
                className="block w-full rounded-xl border border-slate-200 py-2.5 px-3 focus:outline-hidden focus:border-amber-500 bg-slate-50 font-mono font-bold"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Alasan Pengajuan</label>
              <textarea
                required
                rows={3}
                value={alasan}
                onChange={(e) => setAlasan(e.target.value)}
                placeholder="Tulis alasan kas kurang..."
                className="block w-full rounded-xl border border-slate-200 py-2.5 px-3 focus:outline-hidden focus:border-amber-500 bg-slate-50 leading-relaxed"
              />
            </div>

            {notif && (
              <div className="p-3 bg-emerald-50 text-emerald-800 border border-emerald-100 rounded-xl text-[10px] font-semibold flex items-center gap-1.5">
                <CheckCircle className="h-3.5 w-3.5" />
                <span>{notif}</span>
              </div>
            )}

            <button
              type="submit"
              id="btn-send-fund-request"
              className="w-full flex items-center justify-center space-x-1.5 py-3 rounded-xl bg-slate-900 border border-slate-900 text-white font-bold hover:bg-slate-800 active:scale-95 transition-all text-center cursor-pointer focus:outline-hidden"
            >
              <Send className="h-4 w-4 text-amber-500" />
              <span>Kirim ke Owner</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
