import React, { useState } from 'react';
import { usePayroll } from '../context/PayrollContext';
import { Karyawan } from '../types';
import { 
  Users, 
  UserPlus, 
  Edit3, 
  Trash2, 
  Search, 
  Coins, 
  X, 
  UserCheck, 
  Briefcase,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Camera,
  Video,
  RefreshCw,
  ShieldCheck,
  Smartphone,
  QrCode,
  Key,
  Clock,
  PlusCircle,
  Calendar,
  FileText,
  Check
} from 'lucide-react';

export const TabKelolaKaryawan: React.FC = () => {
  const { 
    karyawan, 
    addKaryawan, 
    updateKaryawan, 
    deleteKaryawan,
    lembur,
    addLembur,
    deleteLembur
  } = usePayroll();

  // Sub-tab selection: 'contracts' | 'overtime'
  const [activeSubTab, setActiveSubTab] = useState<'contracts' | 'overtime'>('contracts');

  // Overtime form states
  const [selectedLemburEmpId, setSelectedLemburEmpId] = useState('');
  const [lemburTanggal, setLemburTanggal] = useState(new Date().toISOString().substring(0, 10));
  const [lemburJam, setLemburJam] = useState(2);
  const [lemburTarif, setLemburTarif] = useState(25000);
  const [lemburKeterangan, setLemburKeterangan] = useState('');
  const [lemburSuccessMsg, setLemburSuccessMsg] = useState<string | null>(null);
  const [lemburSearchTerm, setLemburSearchTerm] = useState('');

  // Search and filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingEmp, setEditingEmp] = useState<Karyawan | null>(null);

  // Form states
  const [nama, setNama] = useState('');
  const [jabatan, setJabatan] = useState('Barista');
  const [gajiHari, setGajiHari] = useState(150000);
  const [tunjangan, setTunjangan] = useState(300000);
  const [potongan, setPotongan] = useState(100000);
  const [fingerprintStatus, setFingerprintStatus] = useState<'Terdaftar' | 'Belum Terdaftar'>('Belum Terdaftar');
  const [fingerprintCode, setFingerprintCode] = useState('');
  const [faceStatus, setFaceStatus] = useState<'Terdaftar' | 'Belum Terdaftar'>('Belum Terdaftar');
  const [facePhoto, setFacePhoto] = useState('');
  const [bankPilihan, setBankPilihan] = useState('');
  const [nomorRekening, setNomorRekening] = useState('');
  const [namaRekening, setNamaRekening] = useState('');
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Fingerprint enrollment simulation states
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [enrollProgress, setEnrollProgress] = useState(0);
  const [enrollStep, setEnrollStep] = useState(0); // 0: Idle, 1: Press 1, 2: Press 2, 3: Verifying, 4: Capable

  // Real Camera Device States & Refs
  const [isCamActive, setIsCamActive] = useState(false);
  const [camError, setCamError] = useState<string | null>(null);
  const videoRef = React.useRef<HTMLVideoElement | null>(null);

  const startCamera = async () => {
    setCamError(null);
    setIsCamActive(true);
    // Let a tiny tick pass for video DOM to appear
    setTimeout(async () => {
      try {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          const stream = await navigator.mediaDevices.getUserMedia({ 
            video: { width: 320, height: 320, facingMode: 'user' } 
          });
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.play().catch(pErr => console.warn("Video play error:", pErr));
          }
        } else {
          setCamError("API kamera tidak dapat diakses (Butuh jaringan aman HTTPS).");
          setIsCamActive(false);
        }
      } catch (err: any) {
        console.error("Camera access error:", err);
        setCamError("Gagal akses kamera: " + (err.message || String(err)));
        setIsCamActive(false);
      }
    }, 200);
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsCamActive(false);
  };

  const captureFacePhoto = () => {
    if (videoRef.current) {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = 180;
        canvas.height = 180;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          // Flip horizontally for mirroring look
          ctx.translate(180, 0);
          ctx.scale(-1, 1);
          ctx.drawImage(videoRef.current, 0, 0, 180, 180);
          
          // Capture base64 text representation
          const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
          setFacePhoto(dataUrl);
          setFaceStatus('Terdaftar');
          stopCamera();
        }
      } catch (err) {
        console.error("Error capturing snapshot:", err);
      }
    }
  };

  const removeFacePhoto = () => {
    stopCamera();
    setFacePhoto('');
    setFaceStatus('Belum Terdaftar');
  };

  const startFingerprintEnrollment = async () => {
    setIsEnrolling(true);
    setEnrollProgress(15);
    setEnrollStep(1);

    // Simulate setup of secure Time-Based 2FA secret key with standard Authenticator format
    setTimeout(() => {
      setEnrollProgress(50);
      setEnrollStep(2);
      
      setTimeout(() => {
        setEnrollProgress(85);
        setEnrollStep(3);
        
        setTimeout(() => {
          setEnrollProgress(100);
          setEnrollStep(4);
          
          const base32Chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
          let secret = 'ARTM ';
          for (let i = 0; i < 12; i++) {
            if (i > 0 && i % 4 === 0) secret += ' ';
            secret += base32Chars.charAt(Math.floor(Math.random() * base32Chars.length));
          }
          
          setFingerprintStatus('Terdaftar');
          setFingerprintCode(secret);
          setIsEnrolling(false);
        }, 800);
      }, 800);
    }, 600);
  };

  const resetForm = () => {
    setNama('');
    setJabatan('Barista');
    setGajiHari(150000);
    setTunjangan(300000);
    setPotongan(100000);
    setFingerprintStatus('Belum Terdaftar');
    setFingerprintCode('');
    setFaceStatus('Belum Terdaftar');
    setFacePhoto('');
    setBankPilihan('');
    setNomorRekening('');
    setNamaRekening('');
    setEnrollStep(0);
    setEnrollProgress(0);
    stopCamera();
    setEditingEmp(null);
  };

  const handleCreateOrUpdateEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nama.trim()) return;

    const payload = {
      nama: nama.trim(),
      jabatan: jabatan.trim(),
      gajiHari: Number(gajiHari),
      tunjangan: Number(tunjangan),
      potongan: Number(potongan),
      fingerprintStatus,
      fingerprintCode,
      faceStatus,
      facePhoto,
      bankPilihan,
      nomorRekening: nomorRekening.trim(),
      namaRekening: namaRekening.trim()
    };

    try {
      if (editingEmp) {
        // Update
        const success = await updateKaryawan({ ...editingEmp, ...payload });
        if (success) {
          setSuccessMsg(`Berhasil memperbarui data karyawan: ${nama}`);
        }
      } else {
        // Create
        const success = await addKaryawan(payload);
        if (success) {
          setSuccessMsg(`Berhasil menambahkan karyawan baru: ${nama} disertai verifikasi biometrik!`);
        }
      }
      resetForm();
      setShowAddForm(false);
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err) {
      console.error(err);
    }
  };

  const handleStartEdit = (emp: Karyawan) => {
    setEditingEmp(emp);
    setNama(emp.nama);
    setJabatan(emp.jabatan);
    setGajiHari(emp.gajiHari);
    setTunjangan(emp.tunjangan);
    setPotongan(emp.potongan);
    setFingerprintStatus(emp.fingerprintStatus || 'Belum Terdaftar');
    setFingerprintCode(emp.fingerprintCode || '');
    setFaceStatus(emp.faceStatus || 'Belum Terdaftar');
    setFacePhoto(emp.facePhoto || '');
    setBankPilihan(emp.bankPilihan || '');
    setNomorRekening(emp.nomorRekening || '');
    setNamaRekening(emp.namaRekening || '');
    setEnrollStep(emp.fingerprintStatus === 'Terdaftar' ? 4 : 0);
    setEnrollProgress(emp.fingerprintStatus === 'Terdaftar' ? 100 : 0);
    setShowAddForm(true);
  };

  const handleCreateLembur = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLemburEmpId) return;

    const emp = karyawan.find(k => k.id === selectedLemburEmpId);
    if (!emp) return;

    const rate = Number(lemburTarif);
    const hours = Number(lemburJam);
    const payload = {
      karyawanId: selectedLemburEmpId,
      karyawanNama: emp.nama,
      tanggal: lemburTanggal,
      jumlahJam: hours,
      tarifPerJam: rate,
      totalUpahLembur: hours * rate,
      keterangan: lemburKeterangan.trim() || 'Lembur Operasional'
    };

    try {
      const success = await addLembur(payload);
      if (success) {
        setLemburSuccessMsg(`Berhasil mencatat lembur untuk ${emp.nama}: ${hours} jam (@${formatRupiah(rate)}/jam)`);
        // Reset form
        setSelectedLemburEmpId('');
        setLemburKeterangan('');
        setLemburJam(2);
        setLemburTarif(25000);
        setTimeout(() => setLemburSuccessMsg(null), 4000);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Filtered list
  const filteredKaryawan = karyawan.filter(emp => 
    emp.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.jabatan.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredLembur = lembur.filter(l => 
    l.karyawanNama.toLowerCase().includes(lemburSearchTerm.toLowerCase()) ||
    l.keterangan.toLowerCase().includes(lemburSearchTerm.toLowerCase()) ||
    l.tanggal.includes(lemburSearchTerm)
  );

  // Helper values
  const formatRupiah = (num: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(num);
  };

  const avgGajiHarian = karyawan.length > 0
    ? karyawan.reduce((sum, k) => sum + k.gajiHari, 0) / karyawan.length
    : 0;

  return (
    <div className="space-y-6 font-sans">
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight font-display">Kelola Data Karyawan</h2>
          <p className="text-xs text-slate-500 mt-1 font-medium">Registrasi karyawan baru, ubah rincian upah harian, dan mutasi kontrak operasional</p>
        </div>
        
        <button
          id="btn-add-karyawan-direct"
          onClick={() => {
            resetForm();
            setShowAddForm(true);
          }}
          className="flex items-center justify-center space-x-2 py-2 px-4 bg-blue-900 hover:bg-blue-800 text-white rounded-lg text-xs font-bold transition shadow-xs cursor-pointer self-start sm:self-center"
        >
          <UserPlus className="h-4 w-4" />
          <span>Tambah Karyawan Baru</span>
        </button>
      </div>

      {/* Stats Widgets Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white border border-slate-200 p-5 rounded-xl flex items-center space-x-4">
          <div className="p-3 bg-blue-50 text-blue-900 rounded-lg">
            <Users className="h-6 w-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Karyawan</p>
            <p className="text-xl font-black text-slate-800">{karyawan.length} Orang</p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-5 rounded-xl flex items-center space-x-4">
          <div className="p-3 bg-emerald-50 text-emerald-700 rounded-lg">
            <Coins className="h-6 w-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Rata-rata Upah Harian</p>
            <p className="text-xl font-black text-slate-800 font-mono">{formatRupiah(avgGajiHarian)}</p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-5 rounded-xl flex items-center space-x-4">
          <div className="p-3 bg-indigo-50 text-indigo-700 rounded-lg">
            <TrendingUp className="h-6 w-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Jumlah Jabatan Unik</p>
            <p className="text-xl font-black text-slate-800">
              {new Set(karyawan.map(k => k.jabatan)).size} Jabatan
            </p>
          </div>
        </div>
      </div>

      {/* Success Banner */}
      {successMsg && (
        <div className="p-4 bg-emerald-50 text-emerald-800 border border-emerald-100 rounded-xl text-xs font-bold flex items-center space-x-2">
          <UserCheck className="h-5 w-5 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Sub-Tab Navigation Selector */}
      <div className="flex border-b border-slate-200 gap-2">
        <button
          onClick={() => setActiveSubTab('contracts')}
          className={`pb-3 text-xs font-bold uppercase tracking-wider flex items-center space-x-2 border-b-2 transition-all px-4 cursor-pointer ${
            activeSubTab === 'contracts'
              ? 'border-blue-900 text-blue-900'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          <Users className="h-4 w-4" />
          <span>Daftar Kontrak Kerja</span>
        </button>
        <button
          onClick={() => setActiveSubTab('overtime')}
          className={`pb-3 text-xs font-bold uppercase tracking-wider flex items-center space-x-2 border-b-2 transition-all px-4 cursor-pointer ${
            activeSubTab === 'overtime'
              ? 'border-blue-900 text-blue-900'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          <Clock className="h-4 w-4" />
          <span>Pencatatan & Riwayat Lembur</span>
        </button>
      </div>

      {/* Main Grid: Management Form (sliding/toggle) and Table */}
      {activeSubTab === 'contracts' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Form panel - only visible if showAddForm is true, takes 4 cols in lg */}
        {showAddForm && (
          <div className="bg-white border border-slate-200 rounded-2xl p-5 lg:col-span-4 relative shadow-sm">
            <div className="absolute top-0 left-0 right-0 h-1 bg-blue-900 rounded-t-2xl"></div>
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider font-display flex items-center gap-2">
                <UserPlus className="h-4 w-4 text-blue-900" />
                {editingEmp ? 'Ubah Profil Karyawan' : 'Daftarkan Karyawan Baru'}
              </h3>
              <button 
                onClick={() => {
                  setShowAddForm(false);
                  resetForm();
                }}
                className="p-1 hover:bg-slate-100 rounded-md"
              >
                <X className="h-4 w-4 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleCreateOrUpdateEmployee} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-500 font-semibold mb-1.5">Nama Lengkap Karyawan</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Siti Aminah"
                  value={nama}
                  onChange={(e) => setNama(e.target.value)}
                  className="block w-full rounded-lg border border-slate-200 py-2 px-3 focus:border-blue-500 focus:outline-hidden bg-slate-50/20"
                />
              </div>

              <div>
                <label className="block text-slate-500 font-semibold mb-1.5">Jabatan / Posisi</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Barista Lead, Chef, Kasir"
                  value={jabatan}
                  onChange={(e) => setJabatan(e.target.value)}
                  className="block w-full rounded-lg border border-slate-200 py-2 px-3 focus:border-blue-500 focus:outline-hidden bg-slate-50/20"
                />
              </div>

              <div className="space-y-3.5 pt-2 border-t border-dashed border-slate-100">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Gaji Harian (Rp)</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={gajiHari}
                    onChange={(e) => setGajiHari(Number(e.target.value))}
                    className="block w-full rounded-lg border border-slate-200 py-2 px-3 focus:border-blue-500 focus:outline-hidden bg-slate-50/20 font-mono font-semibold"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">Upah dasar yang dikalikan dengan jumlah hari hadir aktif.</p>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Tunjangan Bulanan (Rp)</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={tunjangan}
                    onChange={(e) => setTunjangan(Number(e.target.value))}
                    className="block w-full rounded-lg border border-slate-200 py-2 px-3 focus:border-blue-500 focus:outline-hidden bg-slate-50/20 font-mono font-semibold text-emerald-600"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Potongan Default (Rp)</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={potongan}
                    onChange={(e) => setPotongan(Number(e.target.value))}
                    className="block w-full rounded-lg border border-slate-200 py-2 px-3 focus:border-blue-500 focus:outline-hidden bg-slate-50/20 font-mono font-semibold text-rose-500"
                  />
                </div>
              </div>

              {/* REKENING PEMBAYARAN GAJI SECTION */}
              <div className="space-y-3 pt-3 border-t border-dashed border-slate-200">
                <h4 className="text-[10px] font-black text-blue-900 uppercase tracking-wider flex items-center gap-1">
                  <span>Informasi Rekening Bank (Gaji)</span>
                </h4>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-slate-500 font-semibold mb-1">Pilihan Bank</label>
                    <select
                      value={bankPilihan}
                      onChange={(e) => setBankPilihan(e.target.value)}
                      className="block w-full rounded-lg border border-slate-200 py-2 px-2.5 focus:border-blue-500 focus:outline-hidden bg-slate-50/20 text-xs font-semibold"
                    >
                      <option value="">-- Pilih Bank --</option>
                      <option value="BCA">BCA</option>
                      <option value="MANDIRI">MANDIRI</option>
                      <option value="BRI">BRI</option>
                      <option value="BNI">BNI</option>
                      <option value="BSI">BSI</option>
                      <option value="CIMB">CIMB Niaga</option>
                      <option value="PERMATA">Permata</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-500 font-semibold mb-1">Nomor Rekening</label>
                    <input
                      type="text"
                      placeholder="Contoh: 12345678"
                      value={nomorRekening}
                      onChange={(e) => setNomorRekening(e.target.value.replace(/\D/g, ''))}
                      className="block w-full rounded-lg border border-slate-200 py-2 px-2.5 focus:border-blue-500 focus:outline-hidden bg-slate-50/20 font-mono text-xs font-semibold"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-500 font-semibold mb-1">Nama Pemilik Rekening</label>
                  <input
                    type="text"
                    placeholder="Sesuai buku tabungan (CAPSLOCK)"
                    value={namaRekening}
                    onChange={(e) => setNamaRekening(e.target.value.toUpperCase())}
                    className="block w-full rounded-lg border border-slate-200 py-2 px-3 focus:border-blue-500 focus:outline-hidden bg-slate-50/20 font-sans text-xs font-bold uppercase tracking-tight"
                  />
                  {namaRekening && nama && nama.toUpperCase() !== namaRekening.toUpperCase() && (
                    <p className="text-[9px] text-amber-600 font-bold mt-1 flex items-center gap-1 bg-amber-50 p-1.5 rounded border border-amber-100">
                      <AlertCircle className="h-3 w-3 text-amber-500 shrink-0" />
                      <span>Perhatian: Berbeda dengan nama karyawan ({nama}).</span>
                    </p>
                  )}
                </div>
              </div>

              {/* TWO-FACTOR AUTHENTICATOR (2FA) REGISTRATION SECTION */}
              <div className="space-y-2 pt-3 border-t border-dashed border-slate-200">
                <div className="flex items-center justify-between">
                  <label className="block text-slate-700 font-bold flex items-center gap-1.5 text-xs">
                    <Smartphone className="h-4 w-4 text-blue-900" />
                    <span>Konfigurasi 2FA Authenticator</span>
                  </label>
                  {fingerprintStatus === 'Terdaftar' ? (
                    <span className="text-[9px] font-black uppercase text-emerald-600 px-2 py-0.5 bg-emerald-50 border border-emerald-100 rounded-full flex items-center gap-1 shadow-2xs">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                      <span>Aktif</span>
                    </span>
                  ) : (
                    <span className="text-[9px] font-black uppercase text-amber-600 px-2 py-0.5 bg-amber-50 border border-amber-100 rounded-full flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                      <span>Belum Aktif</span>
                    </span>
                  )}
                </div>

                <div className="border border-slate-200 rounded-xl bg-slate-50/50 p-3.5 flex flex-col items-center justify-center relative overflow-hidden transition-all text-center">
                  {isEnrolling ? (
                    <div className="w-full flex flex-col items-center space-y-3 py-2">
                      <div className="relative h-16 w-16 flex items-center justify-center bg-white rounded-full shadow-inner border border-slate-100">
                        <div className="absolute inset-0 rounded-full border-2 border-blue-900 animate-pulse scale-105" />
                        <QrCode className="h-10 w-10 text-blue-900 animate-pulse" />
                      </div>

                      <div className="space-y-1">
                        <p className="font-extrabold text-[11px] text-slate-800 leading-tight">
                          {enrollStep === 1 && 'Menghasilkan Kunci Kriptografi...'}
                          {enrollStep === 2 && 'Membuat QR Code Integrasi...'}
                          {enrollStep === 3 && 'Mengunci Kunci Rahasia Aman...'}
                          {enrollStep === 4 && 'Penyetelan 2FA Selesai.'}
                        </p>
                        
                        <div className="w-40 bg-slate-200 h-1.5 rounded-full mx-auto overflow-hidden">
                          <div 
                            className="bg-blue-900 h-1.5 rounded-full transition-all duration-300"
                            style={{ width: `${enrollProgress}%` }}
                          />
                        </div>
                        <p className="text-[9px] text-slate-400 font-mono font-bold">{enrollProgress}% TERESISTRASI</p>
                      </div>
                    </div>
                  ) : fingerprintStatus === 'Terdaftar' ? (
                    <div className="w-full flex flex-col items-center space-y-2 py-1">
                      {/* Simulated QR Code Setup */}
                      <div className="p-2 bg-white border border-slate-200 rounded-xl shadow-xs">
                        <div className="w-24 h-24 bg-slate-100 flex items-center justify-center border border-dashed border-slate-300 rounded-lg relative">
                          <QrCode className="h-16 w-16 text-slate-800" />
                          <div className="absolute inset-0 bg-emerald-500/10 flex items-center justify-center backdrop-blur-xs rounded-lg">
                            <span className="text-[8px] font-black text-emerald-800 uppercase tracking-widest bg-emerald-50 border border-emerald-200/50 px-1 py-0.5 rounded-sm">AKTIF</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-center font-sans">
                        <p className="text-[11px] font-extrabold text-slate-800">2FA Authenticator Aktif</p>
                        <p className="text-[8px] text-slate-400 font-mono mt-0.5 break-all max-w-[200px] mx-auto">Kunci Rahasia: <span className="font-bold text-slate-600">{fingerprintCode}</span></p>
                      </div>
                      <button
                        type="button"
                        onClick={startFingerprintEnrollment}
                        className="mt-1 text-[10px] font-extrabold text-blue-900 hover:underline cursor-pointer"
                      >
                        Kalibrasi Ulang Kunci 2FA
                      </button>
                    </div>
                  ) : (
                    <div className="w-full flex flex-col items-center space-y-2.5 py-1.5">
                      <div className="h-10 h-10 bg-white shadow-xs text-slate-400 rounded-full flex items-center justify-center border border-slate-200">
                        <Smartphone className="h-6 w-6 text-slate-400" />
                      </div>
                      <div>
                        <p className="text-[10px] font-extrabold text-slate-700">Penyetelan 2FA Diperlukan</p>
                        <p className="text-[9px] text-slate-400 max-w-[200px] mx-auto mt-0.5 leading-normal">
                          Dapatkan QR Code dan kunci rahasia untuk di-scan menggunakan aplikasi Authenticator karyawan.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={startFingerprintEnrollment}
                        className="w-full max-w-[190px] py-1.5 px-3 bg-blue-900 hover:bg-blue-800 text-white font-bold rounded-lg text-[10px] flex items-center justify-center gap-1.5 cursor-pointer transition shadow-2xs active:scale-95"
                      >
                        <QrCode className="h-3.5 w-3.5" />
                        <span>Setup 2FA Authenticator</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* BIOMETRIC FACE ID REGISTRATION SECTION */}
              <div className="space-y-2 pt-3 border-t border-dashed border-slate-200">
                <div className="flex items-center justify-between">
                  <label className="block text-slate-700 font-bold flex items-center gap-1.5 text-xs">
                    <Camera className="h-4 w-4 text-blue-900" />
                    <span>Pendaftaran Face ID</span>
                  </label>
                  {faceStatus === 'Terdaftar' ? (
                    <span className="text-[9px] font-black uppercase text-emerald-600 px-2 py-0.5 bg-emerald-50 border border-emerald-100 rounded-full flex items-center gap-1 shadow-2xs">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                      <span>Terdaftar</span>
                    </span>
                  ) : (
                    <span className="text-[9px] font-black uppercase text-amber-600 px-2 py-0.5 bg-amber-50 border border-amber-100 rounded-full flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                      <span>Belum Ada</span>
                    </span>
                  )}
                </div>

                <div className="border border-slate-200 rounded-xl bg-slate-50/50 p-3.5 flex flex-col items-center justify-center relative overflow-hidden transition-all text-center">
                  {isCamActive ? (
                    <div className="w-full flex flex-col items-center space-y-3">
                      {/* Round Camera Lens Interface */}
                      <div className="relative h-32 w-32 rounded-full border-4 border-blue-900 overflow-hidden shadow-md bg-black">
                        <video 
                          ref={videoRef} 
                          className="absolute inset-0 h-full w-full object-cover scale-x-[-1]"
                          playsInline 
                          muted 
                        />
                        
                        {/* Futuristic Face Grid Scanner Overlays */}
                        <div className="absolute inset-2 border border-dashed border-blue-400/50 rounded-full animate-[spin_10s_linear_infinite]" />
                        <div className="absolute inset-4 border border-dashed border-blue-300/30 rounded-full animate-[spin_20s_linear_infinite_reverse]" />
                        
                        {/* Laser focus horizontal pointer */}
                        <div className="absolute left-0 right-0 h-0.5 bg-cyan-400 opacity-80 shadow-[0_0_8px_cyan] animate-bounce z-10" style={{ top: '45%' }} />
                        <div className="absolute inset-x-0 bottom-1 flex justify-center">
                          <span className="text-[8px] font-mono tracking-widest text-cyan-300 font-extrabold bg-blue-950/80 px-1 py-0.2 rounded-md">LIVE FEED</span>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={captureFacePhoto}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-lg text-[10px] flex items-center gap-1 shadow-xs active:scale-95 transition-transform"
                        >
                          <Camera className="h-3 w-3" />
                          <span>Pindai & Simpan Wajah</span>
                        </button>
                        <button
                          type="button"
                          onClick={stopCamera}
                          className="px-2.5 py-1.5 border border-slate-250 text-slate-600 hover:bg-slate-100 rounded-lg text-[10px] font-medium"
                        >
                          Batal
                        </button>
                      </div>
                    </div>
                  ) : faceStatus === 'Terdaftar' ? (
                    <div className="w-full flex flex-col items-center space-y-2 py-1">
                      {/* Captured Face Photo Showcase */}
                      <div className="relative h-20 w-20 rounded-full border-2 border-emerald-500 p-0.5 shadow-md bg-white">
                        {facePhoto ? (
                          <img 
                            src={facePhoto} 
                            alt="Registered Employee biometric face portrait" 
                            className="h-full w-full rounded-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="h-full w-full rounded-full bg-slate-100 flex items-center justify-center">
                            <Camera className="h-8 w-8 text-slate-300" />
                          </div>
                        )}
                        <span className="absolute -bottom-1 -right-1 bg-emerald-500 text-white rounded-full p-0.5 border-2 border-white">
                          <ShieldCheck className="h-3 w-3" />
                        </span>
                      </div>

                      <div className="text-center">
                        <p className="text-[11px] font-extrabold text-slate-800">Pemindaian Wajah Disetujui</p>
                        <p className="text-[9px] text-slate-400 max-w-[200px] mx-auto leading-normal">
                          Potret biometrik telah di-enkripsi dan berhasil dipetakan ke data akun karyawan.
                        </p>
                      </div>

                      <div className="flex gap-2.5 mt-1.5">
                        <button
                          type="button"
                          onClick={startCamera}
                          className="text-[10px] font-extrabold text-blue-900 hover:underline flex items-center gap-1"
                        >
                          <RefreshCw className="h-3 w-3" />
                          <span>Ambil Ulang</span>
                        </button>
                        <span className="text-slate-300">|</span>
                        <button
                          type="button"
                          onClick={removeFacePhoto}
                          className="text-[10px] font-extrabold text-rose-600 hover:underline"
                        >
                          Hapus Enkripsi
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="w-full flex flex-col items-center space-y-2.5 py-1.5">
                      <div className="h-10 w-10 bg-white shadow-xs text-slate-400 rounded-full flex items-center justify-center border border-slate-200">
                        <Video className="h-5 w-5 text-slate-400" />
                      </div>
                      <div>
                        <p className="text-[10px] font-extrabold text-slate-700">Sertifikasi Wajah Masih Kosong</p>
                        <p className="text-[9px] text-slate-400 max-w-[200px] mx-auto mt-0.5 leading-normal">
                          Gunakan kamera perangkat Anda untuk merekam foto wajah real-time karyawan.
                        </p>
                      </div>
                      
                      {camError && (
                        <p className="text-[9px] text-rose-600 font-bold bg-rose-50 border border-rose-100 px-2 py-1 rounded max-w-[230px]">
                          {camError}
                        </p>
                      )}

                      <button
                        type="button"
                        onClick={startCamera}
                        className="w-full max-w-[170px] py-1.5 px-3 bg-blue-900 hover:bg-blue-800 text-white font-bold rounded-lg text-[10px] flex items-center justify-center gap-1.5 cursor-pointer transition shadow-2xs active:scale-95"
                      >
                        <Camera className="h-3.5 w-3.5" />
                        <span>Mulai Pemindaian Wajah</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex space-x-2 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    stopCamera();
                    setShowAddForm(false);
                    resetForm();
                  }}
                  className="flex-1 py-2 px-3 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 font-bold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 px-3 bg-blue-900 hover:bg-blue-800 text-white rounded-lg font-bold shadow-xs cursor-pointer"
                >
                  {editingEmp ? 'Simpan Kontrak' : 'Daftarkan Kontrak'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Directory Table Grid - takes rest of cols */}
        <div className={`bg-white border border-slate-200 rounded-2xl p-5 ${showAddForm ? 'lg:col-span-8' : 'lg:col-span-12'} space-y-4 shadow-xs`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest font-display">
              Database Kontrak & Karyawan Aktif
            </h3>

            {/* Simple local filter */}
            <div className="relative w-full sm:w-64">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                <Search className="h-3.5 w-3.5" />
              </span>
              <input
                type="text"
                placeholder="Cari nama atau jabatan..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full rounded-lg border border-slate-200 py-1.5 pl-9 pr-3 text-xs bg-slate-50/50 focus:border-blue-500 focus:outline-hidden focus:bg-white"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100 text-xs">
              <thead>
                <tr className="bg-slate-50 font-bold text-slate-400 uppercase tracking-wider text-[10px]">
                  <th className="px-4 py-3 text-left">Nama Lengkap</th>
                  <th className="px-4 py-3 text-left">Jabatan</th>
                  <th className="px-4 py-3 text-right">Upah Harian</th>
                  <th className="px-4 py-3 text-right">Tunjangan</th>
                  <th className="px-4 py-3 text-right">Potongan</th>
                  <th className="px-4 py-3 text-center">Keamanan 2FA</th>
                  <th className="px-4 py-3 text-center">Face ID</th>
                  <th className="px-4 py-3 text-center">Tindakan</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-100">
                {filteredKaryawan.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-10 text-center text-slate-400 text-xs">
                      Tidak ada karyawan yang cocok dengan kriteria pencarian Anda.
                    </td>
                  </tr>
                ) : (
                  filteredKaryawan.map(emp => (
                    <tr key={emp.id} className="hover:bg-slate-50/30 transition">
                      <td className="px-4 py-3 font-bold text-slate-800">
                        {emp.nama}
                        <div className="flex flex-wrap gap-x-2 items-center text-[9px] font-normal text-slate-400 font-mono mt-0.5">
                          <span>{emp.id}</span>
                          {emp.bankPilihan && emp.nomorRekening ? (
                            <span className="text-emerald-700 font-extrabold bg-emerald-50 border border-emerald-100/50 px-1.5 py-0.2 rounded-sm text-[8px]">
                              💳 {emp.bankPilihan} - {emp.nomorRekening}
                            </span>
                          ) : (
                            <span className="text-rose-600 font-extrabold bg-rose-55 border border-rose-100/40 px-1.5 py-0.2 rounded-sm text-[8px]">
                              ⚠️ Belum Ada Bank
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-blue-55 text-blue-900 border border-blue-100 font-semibold text-[10px]">
                           <Briefcase className="h-3 w-3 text-blue-900" />
                           <span>{emp.jabatan}</span>
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-semibold text-slate-700">
                        {formatRupiah(emp.gajiHari)}
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-semibold text-emerald-600">
                        +{formatRupiah(emp.tunjangan)}
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-semibold text-rose-500">
                        -{formatRupiah(emp.potongan)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {emp.fingerprintStatus === 'Terdaftar' ? (
                          <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-55 text-emerald-900 border border-emerald-100 text-[10px] font-extrabold shadow-2xs" title={`Kunci 2FA: ${emp.fingerprintCode || ''}`}>
                            <Smartphone className="h-3.5 w-3.5 text-emerald-600" />
                            <span>2FA Aktif</span>
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-50 text-slate-400 border border-slate-200 text-[10px] font-bold">
                            <Smartphone className="h-3.5 w-3.5 text-slate-400" />
                            <span>Belum Aktif</span>
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {emp.faceStatus === 'Terdaftar' ? (
                          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-blue-50 text-blue-800 border border-blue-100 text-[10px] font-extrabold shadow-2xs">
                            {emp.facePhoto ? (
                              <img src={emp.facePhoto} alt="Saved Face" className="w-5 h-5 rounded-full object-cover border border-blue-200" referrerPolicy="no-referrer" />
                            ) : (
                              <Camera className="h-3.5 w-3.5 text-blue-600" />
                            )}
                            <span>Terdaftar</span>
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-50 text-slate-400 border border-slate-200 text-[10px] font-bold">
                            <Camera className="h-3.5 w-3.5 text-slate-400" />
                            <span>Belum Ada</span>
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center space-x-1">
                          <button 
                            onClick={() => {
                              setSelectedLemburEmpId(emp.id);
                              setActiveSubTab('overtime');
                            }}
                            className="p-1 px-2 border border-amber-200 text-amber-700 hover:text-amber-900 hover:bg-amber-50 rounded-lg transition text-[10px] font-bold flex items-center space-x-1 cursor-pointer font-sans"
                            title="Input lembur untuk karyawan ini"
                          >
                            <Clock className="h-3.5 w-3.5" />
                            <span className="hidden sm:inline font-bold">Lembur</span>
                          </button>
                          <button 
                            onClick={() => handleStartEdit(emp)}
                            className="p-1 px-2 border border-slate-200 text-slate-600 hover:text-blue-900 hover:bg-blue-50/50 rounded-lg transition text-[10px] font-bold flex items-center space-x-1 cursor-pointer"
                            title="Edit data kontrak"
                          >
                            <Edit3 className="h-3.5 w-3.5" />
                            <span className="hidden sm:inline">Ubah</span>
                          </button>
                          <button
                            onClick={() => {
                              if (window.confirm(`Apakah Anda yakin ingin menghapus kontrak kerja ${emp.nama}? Log absensi dan payroll mereka akan tetap tersimpan.`)) {
                                deleteKaryawan(emp.id);
                                if (editingEmp?.id === emp.id) {
                                  resetForm();
                                  setShowAddForm(false);
                                }
                              }
                            }}
                            className="p-1 px-2 border border-slate-250 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition text-[10px] font-bold flex items-center space-x-1 cursor-pointer"
                            title="Hapus data kontrak"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            <span className="hidden sm:inline font-bold">Hapus</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      )}

      {/* OVERTIME (LEMBUR) SUB-TAB PANEL */}
      {activeSubTab === 'overtime' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Form Column - Left */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 lg:col-span-4 relative shadow-sm">
            <div className="absolute top-0 left-0 right-0 h-1 bg-amber-500 rounded-t-2xl"></div>
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider font-display flex items-center gap-2">
                <Clock className="h-4 w-4 text-amber-600" />
                <span>Input Jam Lembur</span>
              </h3>
            </div>

            {lemburSuccessMsg && (
              <div className="p-3 bg-emerald-50 text-emerald-800 border border-emerald-100 rounded-xl text-xs font-bold flex items-center gap-2 mb-4">
                <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>{lemburSuccessMsg}</span>
              </div>
            )}

            <form onSubmit={handleCreateLembur} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-500 font-semibold mb-1.5">Pilih Karyawan</label>
                <select
                  required
                  value={selectedLemburEmpId}
                  onChange={(e) => setSelectedLemburEmpId(e.target.value)}
                  className="block w-full rounded-lg border border-slate-200 p-2.5 bg-slate-50/50 focus:border-blue-500 focus:bg-white focus:outline-hidden text-slate-700"
                >
                  <option value="">-- Pilih Karyawan --</option>
                  {karyawan.map(emp => (
                    <option key={emp.id} value={emp.id}>
                      {emp.nama} ({emp.jabatan})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-500 font-semibold mb-1.5">Tanggal Lembur</label>
                <input
                  type="date"
                  required
                  value={lemburTanggal}
                  onChange={(e) => setLemburTanggal(e.target.value)}
                  className="block w-full rounded-lg border border-slate-200 p-2 bg-slate-50/50 focus:border-blue-500 focus:bg-white focus:outline-hidden text-slate-700 font-sans"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-500 font-semibold mb-1.5">Durasi (Jam)</label>
                  <input
                    type="number"
                    required
                    min={1}
                    max={24}
                    value={lemburJam}
                    onChange={(e) => setLemburJam(Number(e.target.value))}
                    className="block w-full rounded-lg border border-slate-200 p-2 bg-slate-50/50 focus:border-blue-500 focus:bg-white focus:outline-hidden text-slate-700 font-mono font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 font-semibold mb-1.5">Tarif per Jam (Rp)</label>
                  <input
                    type="number"
                    required
                    min={1000}
                    step={1000}
                    value={lemburTarif}
                    onChange={(e) => setLemburTarif(Number(e.target.value))}
                    className="block w-full rounded-lg border border-slate-200 p-2 bg-slate-50/50 focus:border-blue-500 focus:bg-white focus:outline-hidden text-slate-700 font-mono font-semibold"
                  />
                </div>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-150 rounded-lg flex items-center justify-between">
                <span className="text-slate-500 font-bold text-[10px]">Estimasi Upah Lembur:</span>
                <span className="text-sm font-black text-slate-800 font-mono">
                  {formatRupiah(lemburJam * lemburTarif)}
                </span>
              </div>

              <div>
                <label className="block text-slate-500 font-semibold mb-1.5">Keterangan / Alasan Lembur</label>
                <textarea
                  placeholder="Contoh: Merapikan stock opname, Melayani event ramai"
                  rows={3}
                  value={lemburKeterangan}
                  onChange={(e) => setLemburKeterangan(e.target.value)}
                  className="block w-full rounded-lg border border-slate-200 p-2 bg-slate-50/50 focus:border-blue-500 focus:bg-white focus:outline-hidden text-slate-700 font-sans"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 px-3 bg-blue-900 hover:bg-blue-800 text-white rounded-lg font-bold shadow-xs cursor-pointer flex items-center justify-center space-x-2 transition mt-2 text-xs"
              >
                <PlusCircle className="h-4 w-4" />
                <span>Simpan Jam Lembur</span>
              </button>
            </form>
          </div>

          {/* List Column - Right */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 lg:col-span-8 space-y-4 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest font-display">
                  Riwayat & Log Lembur Terdaftar
                </h3>
                <p className="text-[10px] text-slate-400 mt-0.5 font-sans">Semua pencatatan lembur ini akan ditambahkan ke perhitungan payroll bulanan karyawan.</p>
              </div>

              <div className="relative w-full sm:w-64">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                  <Search className="h-3.5 w-3.5" />
                </span>
                <input
                  type="text"
                  placeholder="Cari riwayat lembur..."
                  value={lemburSearchTerm}
                  onChange={(e) => setLemburSearchTerm(e.target.value)}
                  className="block w-full rounded-lg border border-slate-200 py-1.5 pl-9 pr-3 text-xs bg-slate-50/50 focus:border-blue-500 focus:outline-hidden focus:bg-white font-sans"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-100 text-xs">
                <thead>
                  <tr className="bg-slate-50 font-bold text-slate-400 uppercase tracking-wider text-[10px]">
                    <th className="px-4 py-3 text-left">Karyawan</th>
                    <th className="px-4 py-3 text-center">Tanggal</th>
                    <th className="px-4 py-3 text-center">Durasi</th>
                    <th className="px-4 py-3 text-right">Tarif / Jam</th>
                    <th className="px-4 py-3 text-right">Total Upah</th>
                    <th className="px-4 py-3 text-left">Keterangan</th>
                    <th className="px-4 py-3 text-center">Tindakan</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-100">
                  {filteredLembur.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-10 text-center text-slate-400 text-xs font-medium">
                        Tidak ada log lembur terdaftar yang cocok.
                      </td>
                    </tr>
                  ) : (
                    filteredLembur.map(record => (
                      <tr key={record.id} className="hover:bg-slate-50/30 transition">
                        <td className="px-4 py-3 font-bold text-slate-800">
                          {record.karyawanNama}
                          <div className="text-[9px] font-normal text-slate-400 font-mono mt-0.5">{record.karyawanId}</div>
                        </td>
                        <td className="px-4 py-3 text-center font-semibold text-slate-600 font-mono">
                          {record.tanggal}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="inline-block font-bold text-blue-900 bg-blue-50 border border-blue-100/50 rounded-sm px-1.5 py-0.5 font-mono text-[10px]">
                            {record.jumlahJam} Jam
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right font-semibold text-slate-600 font-mono">
                          {formatRupiah(record.tarifPerJam)}
                        </td>
                        <td className="px-4 py-3 text-right font-bold text-emerald-600 font-mono">
                          {formatRupiah(record.totalUpahLembur)}
                        </td>
                        <td className="px-4 py-3 text-slate-500 italic max-w-xs truncate" title={record.keterangan}>
                          {record.keterangan}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => {
                              if (window.confirm(`Apakah Anda yakin ingin menghapus catatan lembur ini?`)) {
                                deleteLembur(record.id);
                              }
                            }}
                            className="p-1 px-2 border border-slate-200 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition text-[10px] font-bold flex items-center space-x-1 cursor-pointer mx-auto"
                            title="Hapus log lembur"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            <span className="hidden sm:inline">Hapus</span>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
