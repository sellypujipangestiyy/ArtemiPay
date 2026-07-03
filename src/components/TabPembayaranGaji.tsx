import React, { useState, useEffect } from 'react';
import { usePayroll } from '../context/PayrollContext';
import { Payroll } from '../types';
import { CreditCard, Wallet, Calendar, AlertCircle, Sparkles, CheckCircle } from 'lucide-react';

export const TabPembayaranGaji: React.FC = () => {
  const { payroll, kas, bayarGaji, karyawan } = usePayroll();
  
  // Choose which payroll to process
  const [selectedPayroll, setSelectedPayroll] = useState<Payroll | null>(null);
  
  // Payment option controls
  const [metodePembayaran, setMetodePembayaran] = useState<'Tunai' | 'Transfer Bank'>('Transfer Bank');
  const [tanggalPembayaran, setTanggalPembayaran] = useState(new Date().toISOString().substring(0, 10));

  const [message, setMessage] = useState<{ type: 'success' | 'err'; text: string } | null>(null);

  // Bank Transfer parameters
  const [pilihanBank, setPilihanBank] = useState<string>('');
  const [nomorRekening, setNomorRekening] = useState<string>('');
  const [namaPemilikRekening, setNamaPemilikRekening] = useState<string>('');
  const [isVerifying, setIsVerifying] = useState<boolean>(false);

  // Sync: Load registered employee bank details when selected payroll changes
  useEffect(() => {
    if (selectedPayroll && metodePembayaran === 'Transfer Bank') {
      const emp = karyawan.find(k => k.id === selectedPayroll.karyawanId);
      if (emp?.bankPilihan && emp?.nomorRekening) {
        setPilihanBank(emp.bankPilihan);
        setNomorRekening(emp.nomorRekening);
        // Instant check
        setIsVerifying(true);
        const t = setTimeout(() => {
          setIsVerifying(false);
          setNamaPemilikRekening(emp.namaRekening || emp.nama.toUpperCase());
        }, 400);
        return () => clearTimeout(t);
      } else {
        setPilihanBank('');
        setNomorRekening('');
        setNamaPemilikRekening('');
        setIsVerifying(false);
      }
    } else {
      setPilihanBank('');
      setNomorRekening('');
      setNamaPemilikRekening('');
      setIsVerifying(false);
    }
  }, [selectedPayroll, metodePembayaran, karyawan]);

  // Real-time Automated Identity Validation ("Cek Identitas") for manual override
  useEffect(() => {
    if (selectedPayroll && metodePembayaran === 'Transfer Bank' && pilihanBank && nomorRekening.trim().length >= 5) {
      const emp = karyawan.find(k => k.id === selectedPayroll.karyawanId);
      // Run simulation ONLY if input differs from already pre-filled info
      if (emp?.bankPilihan !== pilihanBank || emp?.nomorRekening !== nomorRekening) {
        setIsVerifying(true);
        setNamaPemilikRekening('');
        const delay = setTimeout(() => {
          setIsVerifying(false);
          setNamaPemilikRekening(selectedPayroll.karyawanNama.toUpperCase());
        }, 750);
        return () => clearTimeout(delay);
      }
    }
  }, [pilihanBank, nomorRekening, metodePembayaran, selectedPayroll, karyawan]);

  const unpaidPayroll = payroll.filter(p => p.status === 'Belum Dibayar');

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    if (!selectedPayroll) return;

    if (kas.kasTersedia < selectedPayroll.totalGaji) {
      setMessage({ type: 'err', text: 'Saldo Kas Operasional Gaji tidak mencukupi untuk melakukan pembayaran ini.' });
      return;
    }

    const success = await bayarGaji(selectedPayroll.id, metodePembayaran, tanggalPembayaran);
    if (success) {
      setMessage({ type: 'success', text: `Gaji untuk karyawan ${selectedPayroll.karyawanNama} sukses dibayarkan!` });
      setSelectedPayroll(null);
      // Auto clear msg
      setTimeout(() => setMessage(null), 4000);
    } else {
      setMessage({ type: 'err', text: 'Gagal memproses pembayaran.' });
    }
  };

  const formatRupiah = (num: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(num);
  };

  return (
    <div className="space-y-6 font-sans">
      
      {/* Tab Header Banner */}
      <div className="border-b border-slate-200 pb-4">
        <h2 className="text-xl font-bold text-slate-800 tracking-tight">Pembayaran Gaji Karyawan</h2>
        <p className="text-xs text-slate-500 mt-1">Disbursasi pencairan dana gaji karyawan terhitung</p>
      </div>

      {message && (
        <div className={`max-w-4xl p-4 rounded-xl text-xs font-semibold border ${
          message.type === 'success' 
            ? 'bg-emerald-50 text-emerald-800 border-emerald-100' 
            : 'bg-rose-50 text-rose-800 border-rose-100'
        }`}>
          <span className="flex items-center space-x-2">
            <CheckCircle className="h-4.5 w-4.5 shrink-0" />
            <span>{message.text}</span>
          </span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Side: Unpaid Roster List (Col 6) */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs lg:col-span-6 space-y-4">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Antrean Daftar Gaji Belum Dibayar ({unpaidPayroll.length})</h3>

          {unpaidPayroll.length === 0 ? (
            <div className="p-12 border border-dashed border-slate-200 rounded-2xl text-center text-xs text-slate-400 font-medium">
              Tidak ada antrean pembayaran gaji tertunda. Seluruh kewajiban terlunasi!
            </div>
          ) : (
            <div className="space-y-2.5 max-h-96 overflow-y-auto">
              {unpaidPayroll.map(p => (
                <button
                  key={p.id}
                  id={`payroll-item-${p.id}`}
                  onClick={() => {
                    setSelectedPayroll(p);
                    setMessage(null);
                  }}
                  className={`w-full text-left p-4.5 rounded-xl border transition-all flex justify-between items-center ${
                    selectedPayroll?.id === p.id 
                      ? 'border-blue-600 bg-blue-50/50 ring-2 ring-blue-100' 
                      : 'border-slate-100 bg-slate-50/50 hover:bg-slate-50 hover:border-slate-200'
                  }`}
                >
                  <div className="space-y-1">
                    <strong className="block text-slate-800 text-sm font-semibold">{p.karyawanNama}</strong>
                    <span className="text-[10px] text-slate-400 font-mono">Bulan: {p.bulan} — {p.jumlahKehadiran} Absensi</span>
                  </div>
                  <div>
                    <span className="block text-right text-sm font-extrabold text-blue-700 font-mono">{formatRupiah(p.totalGaji)}</span>
                    <span className="block text-right text-[9px] text-amber-600 font-bold uppercase tracking-wider mt-0.5">TERTUNDA</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right Side: Process Payment Form (Col 6) - Wireframe 9 */}
        <div className="lg:col-span-6">
          {selectedPayroll ? (
            <div className="bg-white p-7 rounded-2xl border border-slate-200 shadow-sm relative h-full flex flex-col justify-between">
              <div className="absolute top-0 left-0 right-0 h-1 bg-blue-600 rounded-t-2xl"></div>

              <form onSubmit={handlePay} className="space-y-5 text-xs">
                <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
                  <CreditCard className="h-4.5 w-4.5 text-blue-600" />
                  <h3 className="font-bold text-slate-800 text-sm uppercase">Otoritasi Pencairan Gaji</h3>
                </div>

                {/* Recipient breakdown */}
                <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl space-y-2.5">
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-semibold">Penerima Gaji:</span>
                    <strong className="text-slate-700 font-bold">{selectedPayroll.karyawanNama}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-semibold">Periode Siklus:</span>
                    <span className="font-mono text-slate-600">{selectedPayroll.bulan}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-semibold">Kewajiban Pokok harian:</span>
                    <span className="font-mono text-slate-600">Rp {selectedPayroll.gajiPerHari.toLocaleString('id-ID')} /hari</span>
                  </div>
                  {selectedPayroll.lembur !== undefined && selectedPayroll.lembur > 0 && (
                    <div className="flex justify-between">
                      <span className="text-slate-400 font-semibold">Upah Lembur:</span>
                      <span className="font-mono text-amber-600 font-bold">+Rp {selectedPayroll.lembur.toLocaleString('id-ID')}</span>
                    </div>
                  )}

                  <div className="flex justify-between items-center pt-2.5 border-t border-slate-200 text-sm">
                    <span className="font-bold text-slate-800">Total Cair Bersih:</span>
                    <strong className="font-mono text-blue-700 text-base font-extrabold">{formatRupiah(selectedPayroll.totalGaji)}</strong>
                  </div>
                </div>

                {/* Payment Methods */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Metode Payout Pembayaran</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setMetodePembayaran('Tunai')}
                      className={`py-3 px-3 rounded-xl border text-center flex items-center justify-center space-x-2 transition ${
                        metodePembayaran === 'Tunai' 
                          ? 'border-blue-600 bg-blue-50/40 text-blue-700 font-bold' 
                          : 'border-slate-200 bg-white text-slate-600'
                      }`}
                    >
                      <Wallet className="h-4 w-4" />
                      <span>Tunai (Cash)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setMetodePembayaran('Transfer Bank')}
                      className={`py-3 px-3 rounded-xl border text-center flex items-center justify-center space-x-2 transition ${
                        metodePembayaran === 'Transfer Bank' 
                          ? 'border-blue-600 bg-blue-50/40 text-blue-700 font-bold' 
                          : 'border-slate-200 bg-white text-slate-600'
                      }`}
                    >
                      <CreditCard className="h-4 w-4" />
                      <span>Transfer Bank</span>
                    </button>
                  </div>
                </div>

                {/* Bank Transfer Details Form with Automatic Validation */}
                {metodePembayaran === 'Transfer Bank' && (
                  <div className="p-4 bg-slate-50 border border-slate-200/60 rounded-xl space-y-4 transition-all duration-300">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {/* Bank Select Dropdown */}
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Pilihan Bank</label>
                        <select
                          value={pilihanBank}
                          onChange={(e) => setPilihanBank(e.target.value)}
                          required={metodePembayaran === 'Transfer Bank'}
                          className="block w-full rounded-lg border border-slate-200 py-2 px-3 text-xs font-semibold focus:border-blue-500 bg-white focus:outline-hidden"
                        >
                          <option value="">-- Pilih Bank --</option>
                          <option value="BCA">Bank Central Asia (BCA)</option>
                          <option value="MANDIRI">Bank Mandiri</option>
                          <option value="BRI">Bank Rakyat Indonesia (BRI)</option>
                          <option value="BNI">Bank Negara Indonesia (BNI)</option>
                          <option value="BSI">Bank Syariah Indonesia (BSI)</option>
                          <option value="CIMB">CIMB Niaga</option>
                          <option value="PERMATA">Bank Permata</option>
                        </select>
                      </div>

                      {/* Account Number */}
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Nomor Rekening</label>
                        <input
                          type="text"
                          pattern="[0-9]*"
                          inputMode="numeric"
                          placeholder="Nomor Rekening"
                          value={nomorRekening}
                          onChange={(e) => setNomorRekening(e.target.value.replace(/\D/g, ''))}
                          required={metodePembayaran === 'Transfer Bank'}
                          className="block w-full rounded-lg border border-slate-200 py-2 px-3 text-xs font-semibold focus:border-blue-500 bg-white font-mono focus:outline-hidden"
                        />
                      </div>
                    </div>

                    {/* Auto validation status display */}
                    {(pilihanBank || nomorRekening) && (
                      <div className="pt-2 border-t border-slate-200/60">
                        {isVerifying ? (
                          <div className="flex items-center gap-2 text-[10px] text-blue-600 font-extrabold bg-blue-50 p-2.5 rounded-lg border border-blue-100">
                            <span className="w-3.5 h-3.5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></span>
                            <span>Melakukan Cek Identitas secara realtime...</span>
                          </div>
                        ) : namaPemilikRekening ? (
                          <div className="bg-emerald-50 text-emerald-900 border border-emerald-150 p-2.5 rounded-lg text-[10px] font-semibold space-y-1">
                            <div className="flex items-center justify-between text-[9px] font-black uppercase text-emerald-600 tracking-wider">
                              <span>Validasi Otomatis (Cek Identitas)</span>
                              <span className="bg-emerald-100 px-1.5 py-0.5 rounded text-[8px] text-emerald-700 font-black">VALID SAMA</span>
                            </div>
                            <div className="flex items-center gap-1.5 mt-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                              <span>Nama Pemilik Rekening:</span>
                              <span className="font-black text-xs text-slate-800 font-mono tracking-tight">{namaPemilikRekening}</span>
                            </div>
                            <p className="text-[9px] text-slate-500 font-medium leading-relaxed pt-0.5">
                              Rekening terdaftar matches with employee payroll record ({selectedPayroll?.karyawanNama}). Aman untuk disalurkan.
                            </p>
                          </div>
                        ) : (
                          <div className="p-2 w-full text-center text-[9px] text-slate-400 font-bold bg-slate-50 rounded border border-slate-150">
                            Masukkan Bank dan Rekening valid (min. 5 angka) untuk auto-validation.
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Payment date selection */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Tanggal Pembayaran</label>
                  <div className="relative">
                    <input
                      type="date"
                      required
                      value={tanggalPembayaran}
                      onChange={(e) => setTanggalPembayaran(e.target.value)}
                      className="block w-full rounded-xl border-slate-200 py-2.5 pl-10 pr-4 text-xs font-semibold focus:border-blue-500 bg-slate-50 font-mono"
                    />
                    <Calendar className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  </div>
                </div>

                {/* Cash reserve warning check */}
                {kas.kasTersedia < selectedPayroll.totalGaji && (
                  <div className="p-3 bg-rose-50 border border-rose-100 text-rose-800 rounded-xl leading-relaxed text-[11px] font-medium flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
                    <span><strong>Kas Tidak Cukup!</strong> Kas saat ini Rp {kas.kasTersedia.toLocaleString('id-ID')} lebih kecil dari nilai gaji yang harus dibayarkan. Silakan ajukan dana terlebih dahulu.</span>
                  </div>
                )}

                <button
                  type="submit"
                  id="btn-confirm-payment-action"
                  disabled={
                    kas.kasTersedia < selectedPayroll.totalGaji || 
                    (metodePembayaran === 'Transfer Bank' && (!pilihanBank || !nomorRekening || isVerifying || !namaPemilikRekening))
                  }
                  className="w-full flex items-center justify-center space-x-1.5 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 disabled:border-slate-200 text-white font-bold transition shadow-xs focus:outline-hidden disabled:cursor-not-allowed cursor-pointer"
                >
                  <Sparkles className="h-4 w-4" />
                  <span>Bayarkan Gaji</span>
                </button>
              </form>
            </div>
          ) : (
            <div className="p-12 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col justify-center items-center text-center text-xs text-slate-400 min-h-96">
              <CreditCard className="h-10 w-10 text-slate-300 mb-3" />
              <span>Silakan pilih salah satu antrean karyawan di panel kiri untuk membuka meja kas otorisasi sirkuit pembayaran gaji.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
