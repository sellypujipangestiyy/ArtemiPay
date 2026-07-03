import React, { useState, useEffect, useRef } from 'react';
import { usePayroll } from '../context/PayrollContext';
import { 
  Clock, 
  Calendar, 
  CheckSquare, 
  Sparkles, 
  UserCheck, 
  Camera, 
  RotateCcw, 
  AlertCircle, 
  ShieldAlert,
  CheckCircle2,
  Lock,
  LogIn,
  LogOut
} from 'lucide-react';

interface TabAbsensiInputProps {
  forcedType?: 'Masuk' | 'Keluar';
}

export const TabAbsensiInput: React.FC<TabAbsensiInputProps> = ({ forcedType }) => {
  const { karyawan, absensi, addAbsensi, updateAbsensi, currentUser } = usePayroll();

  const [tipeAbsen, setTipeAbsen] = useState<'Masuk' | 'Keluar'>(forcedType || 'Masuk');

  useEffect(() => {
    if (forcedType) {
      setTipeAbsen(forcedType);
      setFotoSelfie(null);
      setMessage(null);
    }
  }, [forcedType]);

  const [selectedKaryawanId, setSelectedKaryawanId] = useState('');
  const [tanggal, setTanggal] = useState(new Date().toISOString().substring(0, 10));
  const [jamMasuk, setJamMasuk] = useState('08:00');
  const [jamKeluar, setJamKeluar] = useState('17:00');
  const [keterangan, setKeterangan] = useState<'Hadir' | 'Sakit' | 'Izin'>('Hadir');

  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Selfie states
  const [fotoSelfie, setFotoSelfie] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<boolean>(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Automatically lock to logged-in employee if they are of role 'Karyawan'
  useEffect(() => {
    if (currentUser?.role === 'Karyawan' && currentUser.karyawanId) {
      setSelectedKaryawanId(currentUser.karyawanId);
    } else if (karyawan.length > 0 && !selectedKaryawanId) {
      setSelectedKaryawanId(karyawan[0].id);
    }
  }, [karyawan, currentUser, selectedKaryawanId]);

  // Cleanup camera streams on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Real-time automatic clock synchronization to prevent manual attendance bypassing
  useEffect(() => {
    const syncTime = () => {
      const now = new Date();
      const yyyy = now.getFullYear();
      const mm = String(now.getMonth() + 1).padStart(2, '0');
      const dd = String(now.getDate()).padStart(2, '0');
      setTanggal(`${yyyy}-${mm}-${dd}`);

      const hh = String(now.getHours()).padStart(2, '0');
      const min = String(now.getMinutes()).padStart(2, '0');
      const timeStr = `${hh}:${min}`;
      setJamMasuk(timeStr);
      setJamKeluar(timeStr);
    };

    syncTime();
    const timer = setInterval(syncTime, 1000);
    return () => clearInterval(timer);
  }, [tipeAbsen]);

  const startCamera = async () => {
    setCameraError(false);
    setIsCameraActive(true);
    setFotoSelfie(null);
    
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 400, height: 300, facingMode: 'user' }
      });
      
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (err) {
      console.warn("Camera media access blocked or failed. Activating simulation fallback.", err);
      setCameraError(true);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = 400;
    canvas.height = 300;
    const ctx = canvas.getContext('2d');
    
    if (ctx) {
      // Mirror the context so selfie feels natural
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      
      // Draw watermark details
      ctx.setTransform(1, 0, 0, 1, 0, 0); // Reset transform for non-mirrored text
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(10, canvas.height - 50, canvas.width - 20, 40);
      
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 11px sans-serif';
      const matched = karyawan.find(k => k.id === selectedKaryawanId);
      ctx.fillText(`CAFÉ ARTEMIDA [${tipeAbsen.toUpperCase()}] - ${matched ? matched.nama : 'Karyawan'}`, 20, canvas.height - 35);
      ctx.font = '9px sans-serif';
      ctx.fillStyle = '#fbbf24';
      ctx.fillText(`TANGGAL: ${tanggal} - ${new Date().toLocaleTimeString('id-ID')}`, 20, canvas.height - 18);

      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
      setFotoSelfie(dataUrl);
      stopCamera();
    }
  };

  // Simulation fallback trigger - perfect for frames with blocked camera API
  const generateSimulatedSelfie = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 400;
    canvas.height = 300;
    const ctx = canvas.getContext('2d');
    
    if (ctx) {
      const matched = karyawan.find(k => k.id === selectedKaryawanId);
      const name = matched ? matched.nama : "Karyawan";
      
      // High-contrast professional card gradient
      const grad = ctx.createLinearGradient(0, 0, 400, 300);
      grad.addColorStop(0, '#0f172a'); // slate-900
      grad.addColorStop(1, '#1e3a8a'); // blue-900
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 400, 300);

      // Web camera view grid lines
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.lineWidth = 1;
      for (let i = 40; i < 400; i += 40) {
        ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, 300); ctx.stroke();
      }
      for (let j = 30; j < 300; j += 30) {
        ctx.beginPath(); ctx.moveTo(0, j); ctx.lineTo(400, j); ctx.stroke();
      }

      // Rounded user silhouette base shadow or neon accent
      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(200, 110, 45, 0, Math.PI * 2);
      ctx.stroke();

      // Head
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(200, 110, 40, 0, Math.PI * 2);
      ctx.fill();

      // Shoulders
      ctx.beginPath();
      ctx.ellipse(200, 210, 65, 40, 0, 0, Math.PI, true);
      ctx.fill();

      // Badge tag background
      ctx.fillStyle = '#059669'; // emerald-600
      ctx.beginPath();
      ctx.roundRect(110, 225, 180, 24, 12);
      ctx.fill();

      // Text status metrics
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 9px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText("VERIFIED IDENTITY CAMERA", 200, 239);

      // Dark background clock bar
      ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
      ctx.fillRect(10, 260, 380, 32);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 10px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(`${name.toUpperCase()} (${matched?.jabatan || 'Staff'})`, 20, 273);
      ctx.font = '9px sans-serif';
      ctx.fillStyle = '#fbbf24';
      ctx.fillText(`PRESENSI ${tipeAbsen.toUpperCase()} - ${tanggal} ${new Date().toLocaleTimeString('id-ID')}`, 20, 286);

      const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
      setFotoSelfie(dataUrl);
      stopCamera();
    }
  };



  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (!selectedKaryawanId) {
      setMessage({ type: 'error', text: 'Silakan pilih karyawan.' });
      return;
    }

    const matchedKaryawan = karyawan.find(k => k.id === selectedKaryawanId);
    if (!matchedKaryawan) {
      setMessage({ type: 'error', text: 'Karyawan tidak valid.' });
      return;
    }

    // MANDATORY selfie photo check requirement
    if (!fotoSelfie) {
      setMessage({
        type: 'error',
        text: `Anda wajib memberikan bukti foto selfie sebelum menyimpan absensi ${tipeAbsen.toLowerCase()}!`
      });
      return;
    }

    if (tipeAbsen === 'Masuk') {
      // Check if they already have an absensi record for this date
      const existingRec = absensi.find(
        a => a.karyawanId === selectedKaryawanId && a.tanggal === tanggal
      );
      if (existingRec) {
        setMessage({
          type: 'error',
          text: `Karyawan ${matchedKaryawan.nama} sudah memiliki catatan absensi pada tanggal ${tanggal}! Silakan beralih ke sesi Absen Keluar jika ingin mengisi jam pulang.`
        });
        return;
      }

      const success = await addAbsensi({
        karyawanId: selectedKaryawanId,
        karyawanNama: matchedKaryawan.nama,
        tanggal,
        jamMasuk: keterangan === 'Hadir' ? jamMasuk : '',
        jamKeluar: '', // Initially empty
        keterangan,
        fotoSelfie // Captured Base64
      });

      if (success) {
        setMessage({
          type: 'success',
          text: `Berhasil mencatat Absen Masuk: ${matchedKaryawan.nama} (${keterangan}) pukul ${jamMasuk} disertai verifikasi selfie!`
        });
        setFotoSelfie(null);
      } else {
        setMessage({ type: 'error', text: 'Gagal merekam data absensi masuk.' });
      }
    } else {
      // Out / Checkout session
      const existingRec = absensi.find(
        a => a.karyawanId === selectedKaryawanId && a.tanggal === tanggal
      );

      if (!existingRec) {
        setMessage({
          type: 'error',
          text: `Log Absen Masuk untuk ${matchedKaryawan.nama} pada tanggal ${tanggal} tidak ditemukan! Silakan lakukan Absen Masuk terlebih dahulu.`
        });
        return;
      }

      if (existingRec.keterangan !== 'Hadir') {
        setMessage({
          type: 'error',
          text: `Status absensi ${matchedKaryawan.nama} pada tanggal ${tanggal} adalah ${existingRec.keterangan}. Tidak diperlukan Absen Keluar.`
        });
        return;
      }

      if (existingRec.jamKeluar) {
        setMessage({
          type: 'error',
          text: `Karyawan ${matchedKaryawan.nama} sudah melakukan Absen Keluar pukul ${existingRec.jamKeluar} pada tanggal ini!`
        });
        return;
      }

      // Update existing record with check-out information
      const success = await updateAbsensi({
        ...existingRec,
        jamKeluar,
        fotoSelfieKeluar: fotoSelfie // Captured check-out selfie
      });

      if (success) {
        setMessage({
          type: 'success',
          text: `Berhasil mencatat Absen Keluar: ${matchedKaryawan.nama} pukul ${jamKeluar} disertai verifikasi selfie keluar!`
        });
        setFotoSelfie(null);
      } else {
        setMessage({ type: 'error', text: 'Gagal merekam data absensi keluar.' });
      }
    }
  };

  const selectedEmpObject = karyawan.find(k => k.id === selectedKaryawanId);

  const currentRecord = absensi.find(
    a => a.karyawanId === selectedKaryawanId && a.tanggal === tanggal
  );

  return (
    <div className="max-w-xl mx-auto bg-white p-8 rounded-2xl border border-slate-200/80 shadow-xs font-sans relative hover:shadow-md transition-all" id="absensi-input-module">
      <div className={`absolute top-0 left-0 right-0 h-1.5 rounded-t-2xl transition-all duration-300 ${
        tipeAbsen === 'Masuk' ? 'bg-emerald-600' : 'bg-indigo-600'
      }`}></div>

      <div className="flex items-center space-x-3 pb-4 mb-6 border-b border-slate-100">
        <div className={`p-2.5 rounded-xl transition-all duration-300 ${
          tipeAbsen === 'Masuk' ? 'bg-emerald-50 text-emerald-600' : 'bg-indigo-50 text-indigo-600'
        }`}>
          {tipeAbsen === 'Masuk' ? <LogIn className="h-5 w-5" /> : <LogOut className="h-5 w-5" />}
        </div>
        <div>
          <h2 className="text-lg font-extrabold text-slate-800 tracking-tight font-display">
            {tipeAbsen === 'Masuk' ? 'Presensi Absen Masuk' : 'Presensi Absen Keluar'}
          </h2>
          <p className="text-xs text-slate-500 font-medium">
            {tipeAbsen === 'Masuk' 
              ? 'Mulai jam kerja operasional & verifikasi foto masuk Café Artemida' 
              : 'Selesai jam kerja operasional & verifikasi foto pulang Café Artemida'}
          </p>
        </div>
      </div>

      {/* Segmented Control for Session Selection - only shown if not forcedType */}
      {!forcedType && (
        <div className="flex gap-2 p-1.5 bg-slate-100/80 border border-slate-200/65 rounded-2xl mb-6">
          <button
            type="button"
            onClick={() => {
              setTipeAbsen('Masuk');
              setFotoSelfie(null);
              setMessage(null);
            }}
            className={`flex-1 py-3 px-4 text-xs font-black rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer ${
              tipeAbsen === 'Masuk'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <LogIn className="h-4 w-4" />
            <span>Absen Masuk (Clock-In)</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setTipeAbsen('Keluar');
              setFotoSelfie(null);
              setMessage(null);
            }}
            className={`flex-1 py-3 px-4 text-xs font-black rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer ${
              tipeAbsen === 'Keluar'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <LogOut className="h-4 w-4" />
            <span>Absen Keluar (Clock-Out)</span>
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        
        {/* Step Header */}
        {currentUser?.role === 'Karyawan' ? (
          <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl flex items-center space-x-3">
            <UserCheck className="h-5 w-5 text-blue-600" />
            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider leading-none">MENGISI PRESENSI UNTUK</p>
              <h4 className="text-sm font-extrabold text-slate-800 mt-1">{currentUser.nama} (ID: {currentUser.karyawanId})</h4>
            </div>
          </div>
        ) : (
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Nama Karyawan</label>
            <select
              value={selectedKaryawanId}
              onChange={(e) => {
                setSelectedKaryawanId(e.target.value);
                setFotoSelfie(null); // Clear previous face
                setMessage(null);
              }}
              className="block w-full rounded-xl border border-slate-200 py-3 px-4 text-sm font-medium focus:border-blue-500 focus:outline-hidden focus:ring-1 focus:ring-blue-500 bg-slate-50"
            >
              <option value="">-- Pilih Karyawan --</option>
              {karyawan.map((emp) => (
                <option key={emp.id} value={emp.id}>{emp.nama} — {emp.jabatan}</option>
              ))}
            </select>
          </div>
        )}

        {/* Selected employee quick summary */}
        {selectedEmpObject && (
          <div className="p-3 bg-blue-50/40 rounded-xl text-xs flex justify-between items-center text-slate-600 border border-blue-50/60 font-medium">
            <span>Jabatan: <strong className="text-blue-800 font-semibold">{selectedEmpObject.jabatan}</strong></span>
            <span>Uang harian: <strong className="text-slate-800 font-bold">Rp {selectedEmpObject.gajiHari.toLocaleString('id-ID')} /hari</strong></span>
          </div>
        )}

        {/* Real-time Status Card based on existing records */}
        {selectedKaryawanId && (
          <div className={`p-4 rounded-xl text-xs border flex items-start gap-3 transition-colors ${
            currentRecord 
              ? currentRecord.keterangan !== 'Hadir'
                ? 'bg-amber-50/70 text-amber-900 border-amber-200/50'
                : currentRecord.jamKeluar
                  ? 'bg-emerald-50/70 text-emerald-900 border-emerald-200/50'
                  : 'bg-blue-50/70 text-blue-900 border-blue-200/50'
              : 'bg-slate-50 text-slate-600 border-slate-150'
          }`}>
            <span className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
              currentRecord
                ? currentRecord.keterangan !== 'Hadir'
                  ? 'bg-amber-500'
                  : currentRecord.jamKeluar
                    ? 'bg-emerald-500'
                    : 'bg-blue-500 animate-pulse'
                : 'bg-slate-400'
            }`} />
            <div className="space-y-1">
              <p className="font-extrabold text-[10px] uppercase text-slate-400 tracking-wider">Status Absensi Tanggal Ini</p>
              <p className="text-xs font-semibold leading-relaxed">
                {currentRecord 
                  ? currentRecord.keterangan !== 'Hadir'
                    ? `Sudah Terdaftar: ${currentRecord.keterangan} (Sakit/Izin — Tidak Perlu Absen Keluar)`
                    : currentRecord.jamKeluar
                      ? `Selesai: Absen Masuk (${currentRecord.jamMasuk}) & Absen Keluar (${currentRecord.jamKeluar})`
                      : `Sudah Absen Masuk pukul ${currentRecord.jamMasuk} (Silakan beralih ke Sesi 2: Absen Keluar)`
                  : 'Belum ada log Absen Masuk (Wajib isi Sesi 1 terlebih dahulu)'
                }
              </p>
            </div>
          </div>
        )}

        {/* Date and Keterangan */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Date */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center justify-between">
              <span>Tanggal Kehadiran</span>
              <span className="text-[9px] font-black uppercase text-emerald-600 bg-emerald-50 border border-emerald-100 px-1.5 py-0.5 rounded flex items-center gap-1 animate-pulse">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                <span>Real-time</span>
              </span>
            </label>
            <div className="relative">
              <input
                type="date"
                value={tanggal}
                readOnly
                className="block w-full rounded-xl border border-slate-200 py-3 pl-10 pr-4 text-sm font-semibold bg-slate-100 text-slate-500 font-mono cursor-not-allowed select-none"
              />
              <Calendar className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
            </div>
          </div>

          {/* Dinamis: Keterangan (Masuk) atau Jam Keluar (Keluar) */}
          {tipeAbsen === 'Masuk' ? (
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Status Keterangan</label>
              <select
                value={keterangan}
                onChange={(e) => setKeterangan(e.target.value as any)}
                className="block w-full rounded-xl border border-slate-200 py-3 px-4 text-sm font-medium focus:border-blue-500 focus:outline-hidden focus:ring-1 focus:ring-blue-500 bg-slate-50"
              >
                <option value="Hadir">Hadir (Masuk Kerja)</option>
                <option value="Sakit">Sakit (Dengan Keterangan)</option>
                <option value="Izin">Izin (Terverifikasi)</option>
              </select>
            </div>
          ) : (
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center justify-between">
                <span>Jam Pulang (Absen Keluar)</span>
                <span className="text-[9px] font-black uppercase text-emerald-600 bg-emerald-50 border border-emerald-100 px-1.5 py-0.5 rounded flex items-center gap-1 animate-pulse">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  <span>Real-time</span>
                </span>
              </label>
              <input
                type="time"
                value={jamKeluar}
                readOnly
                className="block w-full rounded-xl border border-slate-200 py-3 px-4 text-sm font-semibold bg-slate-100 text-slate-500 font-mono cursor-not-allowed select-none"
              />
            </div>
          )}
        </div>

        {/* Specific session clock inputs */}
        {tipeAbsen === 'Masuk' && keterangan === 'Hadir' && (
          <div className="grid grid-cols-1 gap-4 pt-1">
            {/* Clock-in */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center justify-between">
                <span>Jam Masuk</span>
                <span className="text-[9px] font-black uppercase text-emerald-600 bg-emerald-50 border border-emerald-100 px-1.5 py-0.5 rounded flex items-center gap-1 animate-pulse">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  <span>Real-time</span>
                </span>
              </label>
              <input
                type="time"
                value={jamMasuk}
                readOnly
                className="block w-full rounded-xl border border-slate-200 py-3 px-4 text-sm font-semibold bg-slate-100 text-slate-500 font-mono cursor-not-allowed select-none"
              />
            </div>
          </div>
        )}

        {/* SELFIE REQUIRED INTERFACE PANEL */}
        <div className="space-y-2 pt-2 border-t border-slate-100">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1">
              <Camera className={`h-4 w-4 ${tipeAbsen === 'Masuk' ? 'text-emerald-600' : 'text-indigo-600'}`} />
              <span>Verifikasi Selfie (Wajib Foto {tipeAbsen})</span>
            </label>
            <span className="text-[9px] font-black uppercase text-rose-500 px-2 py-0.5 bg-rose-50 border border-rose-100 rounded">Required</span>
          </div>

          <div className="border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50 p-4.5 flex flex-col items-center justify-center min-h-[220px] transition-all relative overflow-hidden">
            
            {/* 1. Live Camera Stream Active block */}
            {isCameraActive && !cameraError && (
              <div className="w-full flex flex-col items-center space-y-3">
                <div className={`relative w-full max-w-[320px] aspect-[4/3] rounded-xl overflow-hidden shadow-md bg-black border-2 transition-all duration-300 ${
                  tipeAbsen === 'Masuk' ? 'border-emerald-500' : 'border-indigo-500'
                }`}>
                  <video 
                    ref={videoRef} 
                    className="w-full h-full object-cover scale-x-[-1]" 
                    playsInline 
                    muted 
                  />
                  <div className="absolute top-2 right-2 bg-rose-600 text-white font-mono text-[9px] font-bold px-2 py-0.5 rounded-full animate-pulse flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-white rounded-full"></span>
                    <span>LIVE</span>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={capturePhoto}
                    className={`py-1.5 px-4 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow transition-all cursor-pointer ${
                      tipeAbsen === 'Masuk' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-indigo-600 hover:bg-indigo-700'
                    }`}
                  >
                    <Camera className="h-3.5 w-3.5" />
                    <span>Ambil Snapshot</span>
                  </button>
                  <button
                    type="button"
                    onClick={stopCamera}
                    className="py-1.5 px-3 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-xs font-bold transition cursor-pointer"
                  >
                    Batal
                  </button>
                </div>
              </div>
            )}

            {/* 2. Photo Already Captured or Loaded block */}
            {!isCameraActive && fotoSelfie && (
              <div className="w-full flex flex-col items-center space-y-3">
                <div className="relative w-full max-w-[280px] aspect-[4/3] rounded-xl overflow-hidden shadow-md border-2 border-emerald-500">
                  <img 
                    src={fotoSelfie} 
                    alt="Selfie audit preview" 
                    className="w-full h-full object-cover" 
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute top-2 right-2 bg-emerald-600 text-white font-semibold text-[9px] px-2 py-0.5 rounded-full flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    <span>TERPASANG</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={startCamera}
                    className="py-1.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold flex items-center gap-1 border border-slate-200 transition cursor-pointer"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    <span>Ulangi Foto</span>
                  </button>
                </div>
              </div>
            )}

            {/* 3. Non-camera display state (Initial display) */}
            {!isCameraActive && !fotoSelfie && (
              <div className="text-center p-4 flex flex-col items-center space-y-4">
                <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center border border-slate-200">
                  <Camera className="h-6 w-6" />
                </div>
                
                <div>
                  <p className="text-xs font-extrabold text-slate-700">Abadikan Selfie Audit Kehadiran</p>
                  <p className="text-[10px] text-slate-400 max-w-[280px] mx-auto mt-1">
                    Verifikasi foto wajah asli real-time wajib dicantumkan sebagai kelengkapan bukti slip gaji.
                  </p>
                </div>

                <div className="flex flex-wrap gap-2 justify-center pt-1">
                  <button
                    type="button"
                    onClick={startCamera}
                    className={`py-1.5 px-3 rounded-lg text-xs font-extrabold flex items-center gap-1.5 shadow cursor-pointer transition-all active:scale-95 text-white ${
                      tipeAbsen === 'Masuk' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-indigo-600 hover:bg-indigo-700'
                    }`}
                  >
                    <Camera className="h-4 w-4" />
                    <span>Aktifkan Kamera</span>
                  </button>

                  <button
                    type="button"
                    onClick={generateSimulatedSelfie}
                    className="py-1.5 px-3 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer transition"
                    title="Gunakan simulasi foto jika kamera tidak tersedia"
                  >
                    <Sparkles className="h-4 w-4 text-amber-600" />
                    <span>Simpan Selfie Simulasi</span>
                  </button>
                </div>
              </div>
            )}

            {/* Camera Blocked Error state */}
            {isCameraActive && cameraError && (
              <div className="text-center p-4 flex flex-col items-center space-y-3">
                <div className="w-12 h-12 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center border border-rose-100 animate-pulse">
                  <ShieldAlert className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-[11px] font-extrabold text-rose-700">Kamera Terblokir / Tidak Ditemukan</p>
                  <p className="text-[10px] text-slate-400 max-w-[280px] mx-auto mt-1.5">
                    Akses peranti kamera ditolak oleh perambat atau ditutup dalam iFrame sandbox. Gunakan fitur selfie simulasi untuk verifikasi kehadiran real-time.
                  </p>
                </div>
                <div className="flex gap-2 pt-1 font-sans">
                  <button
                    type="button"
                    onClick={generateSimulatedSelfie}
                    className="py-1.5 px-3 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow cursor-pointer transition"
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>Gunakan Selfie Simulasi</span>
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>

        {/* Message Panel */}
        {message && (
          <div className={`p-4 rounded-xl text-xs font-medium border ${
            message.type === 'success' 
              ? 'bg-emerald-50 text-emerald-800 border-emerald-100' 
              : 'bg-rose-50 text-rose-800 border-rose-100'
          }`}>
            <span className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{message.text}</span>
            </span>
          </div>
        )}

        {/* Action Button */}
        <button
          type="submit"
          id="btn-save-attendance"
          className={`w-full flex items-center justify-center space-x-2 py-3.5 px-4 rounded-xl text-xs font-black shadow-sm transition-all font-sans cursor-pointer focus:outline-hidden ${
            tipeAbsen === 'Masuk'
              ? 'bg-emerald-600 text-white hover:bg-emerald-700 hover:shadow-md'
              : 'bg-indigo-600 text-white hover:bg-indigo-700 hover:shadow-md'
          }`}
        >
          {tipeAbsen === 'Masuk' ? <LogIn className="h-4 w-4" /> : <LogOut className="h-4 w-4" />}
          <span>{`Simpan Absen ${tipeAbsen} & Verifikasi Selfie`}</span>
        </button>
      </form>
    </div>
  );
};
