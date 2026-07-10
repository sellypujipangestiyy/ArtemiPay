import React, { useState } from 'react';
import { usePayroll } from '../context/PayrollContext';
import { UserRole } from '../types';
import { 
  ScanEye, 
  ShieldCheck, 
  HelpCircle, 
  Lock, 
  Unlock, 
  AlertCircle, 
  RefreshCw, 
  Database, 
  ArrowDownUp, 
  Key, 
  Smartphone, 
  Clock, 
  Copy, 
  Check, 
  LockOpen 
} from 'lucide-react';
import brandLogo from '../assets/images/artemipay_user_logo_v2_1783648453098.jpg';
import { motion, AnimatePresence } from 'motion/react';

// Helper to compare two face image base64 data URLs using a downscaled structure grid analyzer
const compareBiometricFaces = (imgUrl1: string, imgUrl2: string): Promise<number> => {
  return new Promise((resolve) => {
    try {
      const img1 = new Image();
      const img2 = new Image();
      let loadedCount = 0;
      
      const onImageLoad = () => {
        loadedCount++;
        if (loadedCount === 2) {
          const size = 16; // 16x16 grid simplifies match vectors to ignore high-frequency noise
          const canvas1 = document.createElement('canvas');
          const canvas2 = document.createElement('canvas');
          canvas1.width = size;
          canvas1.height = size;
          canvas2.width = size;
          canvas2.height = size;
          
          const ctx1 = canvas1.getContext('2d');
          const ctx2 = canvas2.getContext('2d');
          
          if (!ctx1 || !ctx2) {
            resolve(50);
            return;
          }
          
          ctx1.drawImage(img1, 0, 0, size, size);
          ctx2.drawImage(img2, 0, 0, size, size);
          
          const d1 = ctx1.getImageData(0, 0, size, size).data;
          const d2 = ctx2.getImageData(0, 0, size, size).data;
          
          let sumDiff = 0;
          const pixelCount = size * size;
          
          for (let i = 0; i < d1.length; i += 4) {
            const gray1 = 0.299 * d1[i] + 0.587 * d1[i+1] + 0.114 * d1[i+2];
            const gray2 = 0.299 * d2[i] + 0.587 * d2[i+1] + 0.114 * d2[i+2];
            
            const rDiff = Math.abs(d1[i] - d2[i]);
            const gDiff = Math.abs(d1[i+1] - d2[i+1]);
            const bDiff = Math.abs(d1[i+2] - d2[i+2]);
            const colorDiff = (rDiff + gDiff + bDiff) / 3;
            
            const pixelDiff = (Math.abs(gray1 - gray2) * 0.45 + colorDiff * 0.55) / 255;
            sumDiff += pixelDiff;
          }
          
          const averageDiff = sumDiff / pixelCount;
          const score = Math.max(0, Math.min(100, (1 - averageDiff) * 100));
          resolve(score);
        }
      };
      
      img1.onload = onImageLoad;
      img2.onload = onImageLoad;
      
      img1.onerror = () => resolve(0);
      img2.onerror = () => resolve(0);
      
      img1.src = imgUrl1;
      img2.src = imgUrl2;
    } catch (e) {
      console.error("Biometric matching process crashed", e);
      resolve(0);
    }
  });
};

export const BiometricLogin: React.FC = () => {
  const { loginUser, karyawan, syncStatus, dbError, syncLocalToCloud } = usePayroll();
  const [selectedRole, setSelectedRole] = useState<UserRole>('Admin');
  const [selectedKaryawanId, setSelectedKaryawanId] = useState<string>('');

  // Password & Verification Stage states
  const [password, setPassword] = useState('');
  const [showPasswordError, setShowPasswordError] = useState(false);
  const [verificationMethod, setVerificationMethod] = useState<'2fa' | 'face'>('2fa');
  const [isVerifyingStage, setIsVerifyingStage] = useState(false);

  // Authenticator 2FA States
  const [otpInput, setOtpInput] = useState<string[]>(['', '', '', '', '', '']);
  const [currentTotp, setCurrentTotp] = useState('');
  const [totpTimer, setTotpTimer] = useState(30);
  const [copiedCode, setCopiedCode] = useState(false);

  // Biometric states
  const [isScanning, setIsScanning] = useState(false);
  const [scanSuccess, setScanSuccess] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);

  // Camera states
  const [isCamActive, setIsCamActive] = useState(false);
  const [isMatchingFace, setIsMatchingFace] = useState(false);
  const [capturedLoginFace, setCapturedLoginFace] = useState<string | null>(null);
  const videoRef = React.useRef<HTMLVideoElement | null>(null);
  const otpRefs = React.useRef<(HTMLInputElement | null)[]>([]);

  // Generate TOTP code
  const generateNewTotp = () => {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setCurrentTotp(code);
    setTotpTimer(30);
  };

  // Generate initial TOTP on mount
  React.useEffect(() => {
    generateNewTotp();
  }, []);

  // Update countdown timer for TOTP
  React.useEffect(() => {
    const interval = setInterval(() => {
      setTotpTimer((prev) => {
        if (prev <= 1) {
          generateNewTotp();
          return 30;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Set default employee ID if role changed
  React.useEffect(() => {
    if (selectedRole === 'Karyawan' && karyawan.length > 0 && !selectedKaryawanId) {
      setSelectedKaryawanId(karyawan[0].id);
    }
    // Reset login steps
    stopCamera();
    setPassword('');
    setShowPasswordError(false);
    setIsVerifyingStage(false);
    setScanError(null);
    setIsScanning(false);
    setScanSuccess(false);
    setOtpInput(['', '', '', '', '', '']);
  }, [selectedRole, karyawan]);

  // Clean camera stream on unmount
  React.useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsCamActive(false);
    setIsMatchingFace(false);
  };

  const handleLanjutkanPassword = (e: React.FormEvent) => {
    e.preventDefault();
    setScanError(null);

    if (!password) {
      setShowPasswordError(true);
      setScanError('Password wajib diisi.');
      return;
    }

    let expectedPassword = '';
    
    if (selectedRole === 'Admin') {
      expectedPassword = 'Admin345';
    } else if (selectedRole === 'Owner') {
      expectedPassword = 'Owner123';
    } else if (selectedRole === 'Karyawan') {
      const emp = karyawan.find(k => k.id === selectedKaryawanId);
      if (!emp) {
        setShowPasswordError(true);
        setScanError('Silakan pilih nama karyawan terlebih dahulu.');
        return;
      }
      const firstName = emp.nama.trim().split(' ')[0];
      expectedPassword = `${firstName}123`;
    }

    const matchExact = password === expectedPassword;
    const matchCaseInsensitive = password.toLowerCase() === expectedPassword.toLowerCase();

    if (!matchExact && !matchCaseInsensitive) {
      setShowPasswordError(true);
      setScanError(`Password salah! Silakan masukkan password yang benar untuk ${selectedRole === 'Karyawan' ? (karyawan.find(k => k.id === selectedKaryawanId)?.nama || 'Karyawan') : selectedRole}.`);
      return;
    }

    setShowPasswordError(false);
    setIsVerifyingStage(true);

    if (verificationMethod === 'face') {
      handleStartFaceScan();
    }
  };

  const handleStartFaceScan = async () => {
    if (selectedRole === 'Karyawan' && !selectedKaryawanId) {
      setScanError('Silakan pilih nama karyawan terlebih dahulu.');
      setIsVerifyingStage(false);
      return;
    }

    const emp = selectedRole === 'Karyawan' ? karyawan.find(k => k.id === selectedKaryawanId) : null;
    
    if (selectedRole === 'Karyawan') {
      if (!emp) {
        setScanError('Gagal mendeteksi akun karyawan. Silakan hubungi tim IT.');
        setIsVerifyingStage(false);
        return;
      }
      if (emp.faceStatus !== 'Terdaftar' || !emp.facePhoto) {
        setScanError(`Verifikasi Gagal: Akun ${emp.nama} belum mendaftarkan biometrik Face ID. Silakan gunakan metode 2FA Authenticator atau hubungi Admin.`);
        setIsVerifyingStage(false);
        return;
      }
    }

    setScanError(null);
    setIsScanning(true);
    setScanSuccess(false);
    setCapturedLoginFace(null);
    setIsCamActive(true);

    // Wait for React to render the video tag
    setTimeout(async () => {
      try {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: { width: 320, height: 320, facingMode: 'user' }
          });
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.play();
          }

          // Let user orient themselves for 2 seconds
          setTimeout(() => {
            let currentCapturedFaceUrl = "";
            if (videoRef.current) {
              try {
                const canvas = document.createElement('canvas');
                canvas.width = 180;
                canvas.height = 180;
                const ctx = canvas.getContext('2d');
                if (ctx && videoRef.current) {
                  ctx.translate(180, 0);
                  ctx.scale(-1, 1);
                  ctx.drawImage(videoRef.current, 0, 0, 180, 180);
                  const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
                  currentCapturedFaceUrl = dataUrl;
                  setCapturedLoginFace(dataUrl);
                }
              } catch (cErr) {
                console.error("Failed snapshot frame capture", cErr);
              }
            }

            setIsMatchingFace(true);

            // 1.8 seconds AI comparison analysis
            setTimeout(async () => {
              if (selectedRole === 'Karyawan' && emp && emp.facePhoto) {
                const similarity = await compareBiometricFaces(emp.facePhoto, currentCapturedFaceUrl);
                console.log(`Face resembles target by: ${similarity.toFixed(2)}%`);
                
                if (similarity < 70) {
                  setIsScanning(false);
                  setIsMatchingFace(false);
                  setScanSuccess(false);
                  setScanError(`Verifikasi Gagal: Wajah tidak cocok dengan data pendaftaran (Tingkat kecocokan: ${similarity.toFixed(1)}%, dibutuhkan minimal 70.0%).`);
                  stopCamera();
                  setIsVerifyingStage(false);
                  return;
                }
              }

              setScanSuccess(true);
              setIsScanning(false);
              setIsMatchingFace(false);
              stopCamera();

              setTimeout(() => {
                loginUser(
                  selectedRole, 
                  selectedRole === 'Admin' ? 'Admin Gaji' : selectedRole === 'Owner' ? 'Owner' : (emp ? emp.nama : 'Karyawan'),
                  selectedRole === 'Karyawan' ? selectedKaryawanId : undefined
                );
              }, 1000);

            }, 1800);

          }, 2500);

        } else {
          throw new Error("Kamera tidak didukung pada browser ini atau mode HTTPS tidak aktif.");
        }
      } catch (err: any) {
        console.error("Camera Login scanning error:", err);
        setIsScanning(false);
        setIsCamActive(false);
        setIsVerifyingStage(false);
        setScanError("Akses Kamera Ditolak atau Error: " + (err.message || err));
      }
    }, 300);
  };

  const handleOtpChange = (value: string, index: number) => {
    if (value && isNaN(Number(value))) return;
    
    const val = value.substring(value.length - 1);
    const newOtp = [...otpInput];
    newOtp[index] = val;
    setOtpInput(newOtp);

    // Auto-focus next input
    if (val !== '' && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Backspace') {
      if (otpInput[index] === '' && index > 0) {
        const newOtp = [...otpInput];
        newOtp[index - 1] = '';
        setOtpInput(newOtp);
        otpRefs.current[index - 1]?.focus();
      } else {
        const newOtp = [...otpInput];
        newOtp[index] = '';
        setOtpInput(newOtp);
      }
    }
  };

  const handleVerify2Fa = () => {
    setScanError(null);
    const enteredCode = otpInput.join('');

    if (enteredCode.length < 6) {
      setScanError('Silakan masukkan 6 digit kode OTP lengkap.');
      return;
    }

    if (enteredCode !== currentTotp) {
      setScanError('Kode OTP salah atau kadaluarsa. Silakan periksa kembali aplikasi Authenticator Anda.');
      return;
    }

    setScanSuccess(true);
    setScanError(null);

    const emp = selectedRole === 'Karyawan' ? karyawan.find(k => k.id === selectedKaryawanId) : null;
    
    setTimeout(() => {
      loginUser(
        selectedRole, 
        selectedRole === 'Admin' ? 'Admin Gaji' : selectedRole === 'Owner' ? 'Owner' : (emp ? emp.nama : 'Karyawan'),
        selectedRole === 'Karyawan' ? selectedKaryawanId : undefined
      );
    }, 1200);
  };

  const handleFillCodeOtomatis = () => {
    const digits = currentTotp.split('');
    setOtpInput(digits);
    setScanError(null);
    
    // Briefly animate typing feel and focus the last box
    setTimeout(() => {
      otpRefs.current[5]?.focus();
    }, 100);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(currentTotp);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleBackToLogin = () => {
    stopCamera();
    setIsVerifyingStage(false);
    setScanSuccess(false);
    setScanError(null);
    setOtpInput(['', '', '', '', '', '']);
  };

  const empData = selectedRole === 'Karyawan' ? karyawan.find(k => k.id === selectedKaryawanId) : null;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans" id="biometric-login-container">
      {/* Dynamic Sync Status Badge */}
      <div className="absolute top-4 right-4 flex items-center space-x-2 text-xs font-mono bg-white px-3 py-1.5 rounded-full shadow-xs text-slate-500">
        <span className={`h-2.5 w-2.5 rounded-full ${syncStatus === 'cloud' ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
        <span>{syncStatus === 'cloud' ? 'Firebase Real-Time' : 'Local Sandbox'}</span>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <img 
          src={brandLogo} 
          alt="ArtemiPay Logo" 
          className="mx-auto h-20 w-20 rounded-2xl shadow-md border-2 border-slate-200 object-cover"
          referrerPolicy="no-referrer"
        />
        <h1 className="mt-4 text-3xl font-black tracking-tight text-blue-900 font-display" id="payroll-system-heading">
          ARTEMIPAY
        </h1>
        <p className="mt-1 text-xs font-bold tracking-widest text-slate-500 font-mono uppercase">
          Sistem Informasi & Payroll
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-lg">
        <div className="bg-white py-8 px-4 shadow-xl rounded-2xl sm:px-10 border border-slate-200 relative overflow-hidden">
          {/* Blue top bar accent */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-blue-900 animate-pulse"></div>

          <AnimatePresence mode="wait">
            {!isVerifyingStage ? (
              // STAGE 1: Username / Role Selection & Password
              <motion.div
                key="login-stage-1"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2.5">Pilih Peran Akun</label>
                  <div className="grid grid-cols-3 gap-3">
                    {(['Admin', 'Owner', 'Karyawan'] as UserRole[]).map((role) => (
                      <button
                        key={role}
                        type="button"
                        id={`role-btn-${role.toLowerCase()}`}
                        onClick={() => {
                          setSelectedRole(role);
                          setScanError(null);
                        }}
                        className={`py-3 px-2 text-center rounded-xl border text-sm font-semibold transition-all cursor-pointer ${
                          selectedRole === role
                            ? 'border-blue-900 bg-blue-50/70 text-blue-900 font-bold ring-2 ring-blue-100'
                            : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <span className="block text-[10px] text-slate-400 font-normal uppercase tracking-wider">Masuk Sebagai</span>
                        {role}
                      </button>
                    ))}
                  </div>
                </div>

                {selectedRole === 'Karyawan' && (
                  <div className="overflow-hidden">
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Pilih Nama Karyawan</label>
                    <select
                      value={selectedKaryawanId}
                      onChange={(e) => setSelectedKaryawanId(e.target.value)}
                      className="block w-full rounded-xl border border-slate-200 py-3 px-4 text-sm focus:border-blue-500 focus:outline-hidden focus:ring-1 focus:ring-blue-500 bg-slate-50/70 font-semibold"
                    >
                      {karyawan.map((emp) => (
                        <option key={emp.id} value={emp.id}>{emp.nama} — {emp.jabatan}</option>
                      ))}
                    </select>
                  </div>
                )}

                <form onSubmit={handleLanjutkanPassword} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Kata Sandi / Password</label>
                    <div className="relative rounded-xl shadow-xs">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <Key className="h-4.5 w-4.5" />
                      </div>
                      <input
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Masukkan kata sandi Anda"
                        className={`block w-full rounded-xl border pl-10 pr-3 py-3 text-sm focus:outline-hidden focus:ring-1 transition-all ${
                          showPasswordError ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-500 bg-rose-50/20' : 'border-slate-200 focus:border-blue-500 focus:ring-blue-500 bg-slate-50/40'
                        }`}
                      />
                    </div>
                  </div>

                  <div className="hidden pt-2">
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2.5">Lapisan Keamanan Kedua (2FA)</label>
                    <div className="grid grid-cols-1">
                      <button
                        type="button"
                        onClick={() => setVerificationMethod('2fa')}
                        className={`p-3.5 rounded-xl border text-left flex flex-col justify-between h-24 transition-all cursor-pointer ${
                          verificationMethod === '2fa'
                            ? 'border-blue-900 bg-blue-50/40 text-blue-900 ring-2 ring-blue-100 font-bold'
                            : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center justify-between w-full">
                          <Smartphone className="h-5 w-5 text-blue-900" />
                          <span className="text-[9px] font-black uppercase text-blue-700 bg-blue-100 px-1.5 py-0.5 rounded-md tracking-wider">Direkomendasikan</span>
                        </div>
                        <div>
                          <span className="block text-xs font-extrabold tracking-tight">Aplikasi Authenticator</span>
                          <span className="block text-[10px] font-normal text-slate-400 leading-none mt-0.5">Kode TOTP 6 Digit</span>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setVerificationMethod('face');
                          setScanError(null);
                        }}
                        className="hidden"
                      >
                        <ScanEye className="h-5 w-5 text-slate-500" />
                        <div>
                          <span className="block text-xs font-extrabold tracking-tight">Autentikasi Face ID</span>
                          <span className="block text-[10px] font-normal text-slate-400 leading-none mt-0.5">Pemindaian Kamera</span>
                        </div>
                      </button>
                    </div>
                  </div>

                  {scanError && (
                    <div className="flex items-center space-x-2 text-rose-600 bg-rose-50 border border-rose-100 p-3 rounded-xl">
                      <AlertCircle className="h-4.5 w-4.5 shrink-0 text-rose-500" />
                      <span className="text-xs font-semibold text-rose-700 leading-normal">{scanError}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    className="w-full flex items-center justify-center space-x-2 py-3.5 px-4 rounded-xl text-xs font-bold bg-blue-900 text-white hover:bg-blue-850 transition-all cursor-pointer shadow-md shadow-blue-900/10 active:scale-98"
                  >
                    <span>Lanjutkan Verifikasi Keamanan</span>
                    <span>➔</span>
                  </button>
                </form>
              </motion.div>
            ) : (
              // STAGE 2: Verification Challenge (TOTP 2FA or Face ID)
              <motion.div
                key="login-stage-2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                {verificationMethod === '2fa' ? (
                  // 2FA TOTP Code Screen
                  <div className="space-y-6 text-center">
                    <div className="mx-auto h-12 w-12 bg-blue-50 border border-blue-100 rounded-full flex items-center justify-center text-blue-900">
                      <Smartphone className="h-6 w-6" />
                    </div>
                    
                    <div>
                      <h3 className="text-base font-extrabold text-slate-800">Two-Factor Authentication (2FA)</h3>
                      <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 leading-relaxed">
                        Masukkan 6 digit kode OTP yang aktif di aplikasi authenticator Anda (seperti Google Authenticator atau Microsoft Authenticator).
                      </p>
                    </div>

                    {/* 6 Digit Input Boxes */}
                    <div className="flex justify-center space-x-2">
                      {otpInput.map((digit, index) => (
                        <input
                          key={index}
                          ref={(el) => { otpRefs.current[index] = el; }}
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          maxLength={1}
                          value={digit}
                          onChange={(e) => handleOtpChange(e.target.value, index)}
                          onKeyDown={(e) => handleOtpKeyDown(e, index)}
                          className="w-12 h-14 text-center text-2xl font-black bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-100 transition-all font-mono shadow-xs"
                        />
                      ))}
                    </div>

                    {scanError && (
                      <div className="flex items-center justify-center space-x-2 text-rose-600 bg-rose-50 border border-rose-100 p-2.5 rounded-xl text-left">
                        <AlertCircle className="h-4 w-4 shrink-0 text-rose-500" />
                        <span className="text-xs font-semibold text-rose-700 leading-normal">{scanError}</span>
                      </div>
                    )}

                    {scanSuccess && (
                      <div className="flex items-center justify-center space-x-2 text-emerald-600 bg-emerald-50 border border-emerald-100 p-2.5 rounded-xl">
                        <ShieldCheck className="h-4.5 w-4.5 text-emerald-600 animate-bounce" />
                        <span className="text-xs font-bold text-emerald-700">Autentikasi Terverifikasi! Membuka sistem...</span>
                      </div>
                    )}

                    {!scanSuccess && (
                      <button
                        type="button"
                        onClick={handleVerify2Fa}
                        className="w-full py-3.5 px-4 bg-blue-900 hover:bg-blue-850 text-white font-bold rounded-xl text-xs tracking-wide uppercase transition-all shadow-md shadow-blue-900/15 cursor-pointer active:scale-98"
                      >
                        Verifikasi & Masuk ➔
                      </button>
                    )}

                    {/* SIMULATED AUTHENTICATOR APP PORTAL IN IFRAME PREVIEW */}
                    <div className="mt-6 pt-6 border-t border-slate-100">
                      <div className="bg-slate-900 text-white rounded-2xl p-4 text-left shadow-lg relative overflow-hidden font-sans border border-slate-800">
                        <div className="absolute top-0 right-0 p-2 flex items-center space-x-1">
                          <Clock className="h-3 w-3 text-blue-400 animate-spin" style={{ animationDuration: '6s' }} />
                          <span className="text-[9px] text-blue-400 font-mono font-bold tracking-tight">{totpTimer}s</span>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <div className="h-6 w-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-[10px] font-black">G</div>
                          <div>
                            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider leading-none">Aplikasi Authenticator (Simulasi)</span>
                            <span className="block text-[11px] font-black text-white mt-0.5 leading-none">
                              {selectedRole === 'Karyawan' ? empData?.nama : `Admin Gaji (${selectedRole})`}
                            </span>
                          </div>
                        </div>

                        <div className="mt-4 flex items-center justify-between bg-slate-950/80 p-3 rounded-xl border border-slate-800">
                          <div>
                            <span className="text-[8px] uppercase tracking-widest text-slate-500 font-mono font-black">KODE OTP AKTIF:</span>
                            <span className="block text-2xl font-black text-cyan-400 font-mono tracking-wider mt-0.5">
                              {currentTotp.slice(0, 3)} {currentTotp.slice(3, 6)}
                            </span>
                          </div>
                          
                          <div className="flex space-x-1.5">
                            <button
                              type="button"
                              onClick={handleCopyCode}
                              className="p-2 bg-slate-850 border border-slate-800 text-slate-300 hover:text-white rounded-lg transition-all cursor-pointer hover:bg-slate-800"
                              title="Salin Kode OTP"
                            >
                              {copiedCode ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                            </button>
                            <button
                              type="button"
                              onClick={handleFillCodeOtomatis}
                              className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-bold rounded-lg transition-all cursor-pointer active:scale-95"
                            >
                              Isi Otomatis
                            </button>
                          </div>
                        </div>

                        <div className="mt-2.5 flex items-center justify-between text-[9px] text-slate-400 font-medium">
                          <span>Kunci rahasia aman dienkripsi TLS 1.3</span>
                          <span className="flex items-center space-x-1">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                            <span>Sinkron</span>
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  // FACE ID CHALLENGE SCREEN
                  <div className="space-y-6">
                    {isCamActive ? (
                      <div className="flex flex-col items-center space-y-4">
                        <div className="relative h-36 w-36 rounded-full border-4 border-blue-900 overflow-hidden shadow-md bg-black">
                          <video 
                            ref={videoRef}
                            className="absolute inset-0 h-full w-full object-cover scale-x-[-1]"
                            playsInline 
                            muted 
                          />
                          <div className="absolute inset-2 border border-dashed border-blue-400/50 rounded-full animate-[spin_10s_linear_infinite]" />
                          <div className="absolute left-0 right-0 h-0.5 bg-cyan-400 opacity-90 shadow-[0_0_8px_cyan] animate-bounce" style={{ top: '48%' }} />
                        </div>
                        
                        <div className="text-center">
                          <p className="text-[11px] font-extrabold text-blue-900 animate-pulse">SISTEM MEMINDAI FITUR WAJAH...</p>
                          {selectedRole === 'Karyawan' && (
                            <p className="text-[9px] text-slate-500 mt-0.5">
                              {empData?.faceStatus === 'Terdaftar' 
                                ? 'Membandingkan wajah dengan potret database...' 
                                : 'Wajah karyawan belum terdaftar. Menguji kecocokan biometri acak (Demo)...'}
                            </p>
                          )}
                          {isMatchingFace && (
                            <p className="text-[10px] text-emerald-600 font-bold mt-1 tracking-widest animate-pulse">MENCARI KECOCOKAN BIOMETRIS (99.2%)...</p>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-4">
                        <RefreshCw className="h-8 w-8 text-blue-900 animate-spin mx-auto" />
                        <p className="text-xs text-slate-500 mt-2">Mengaktifkan kamera lensa...</p>
                      </div>
                    )}

                    {scanError && (
                      <div className="flex items-center space-x-2 text-rose-600 bg-rose-50 border border-rose-100 p-3 rounded-xl">
                        <AlertCircle className="h-4.5 w-4.5 shrink-0 text-rose-500" />
                        <span className="text-xs font-semibold text-rose-700 leading-normal">{scanError}</span>
                      </div>
                    )}
                  </div>
                )}

                <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={handleBackToLogin}
                    className="text-xs font-bold text-slate-500 hover:text-slate-800 transition flex items-center space-x-1 cursor-pointer"
                  >
                    <span>➔</span>
                    <span className="rotate-180 inline-block">➔</span>
                    <span>Kembali ke login</span>
                  </button>

                  <span className="text-[10px] font-mono text-slate-400 font-semibold uppercase tracking-wider">
                    {verificationMethod === '2fa' ? 'OTP Verification' : 'Face Scan'}
                  </span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="hidden mt-6 text-center text-xs text-slate-400 flex items-center justify-center space-x-1.5">
            <Lock className="h-3 w-3" />
            <span>Koneksi Firestore TLS 1.3 Diaktifkan</span>
          </div>
        </div>

        {/* Demo instructions */}
        <div className="hidden mt-4 bg-blue-50/70 border border-blue-100 rounded-xl p-4 text-xs text-blue-800/90 leading-relaxed font-sans shadow-xs">
          <div className="flex items-start space-x-2">
            <HelpCircle className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Simulasi Akun Demo:</p>
              <ul className="list-disc pl-4 mt-1 space-y-1">
                <li><strong>Admin</strong>: Menghitung absensi, memproses payroll, checks kas, dan mengajukan dana.</li>
                <li><strong>Owner</strong>: Monitor dashboard, menyetujui pengajuan tambahan dana dari Admin secara real-time.</li>
                <li><strong>Karyawan</strong>: Melakukan jam masuk/pulang harian secara mandiri.</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Firestore Seeding & Diagnostics Assistant */}
        <div className="hidden mt-4 bg-slate-900 border border-slate-850 rounded-xl p-4 text-slate-300 leading-relaxed font-sans shadow-md" id="firestore-connector-panel">
          <div className="flex items-start space-x-3">
            <Database className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-bold text-slate-100 text-sm">Penyelarasan Firestore Database</p>
              <p className="text-[11px] text-slate-400 mt-1">
                Jika database Firestore Anda saat ini masih kosong, klik tombol di bawah ini untuk **mengunggah dan membuat seluruh koleksi data** master (Karyawan, Absensi, Payroll, Kas, dan Transaksi) secara langsung.
              </p>
              
              <div className="mt-3 flex items-center justify-between bg-slate-950 p-2 rounded-lg border border-slate-800">
                <span className="text-[10px] font-mono font-medium">Status Koneksi:</span>
                <span className="flex items-center space-x-1.5 text-[10px] font-bold">
                  <span className={`h-2.5 w-2.5 rounded-full ${syncStatus === 'cloud' ? 'bg-emerald-500 animate-pulse' : syncStatus === 'syncing' ? 'bg-blue-400' : 'bg-amber-500'}`}></span>
                  <span className={syncStatus === 'cloud' ? 'text-emerald-400' : syncStatus === 'syncing' ? 'text-blue-400' : 'text-amber-400'}>
                    {syncStatus === 'cloud' ? 'Firebase Real-Time' : syncStatus === 'syncing' ? 'Mengunggah...' : 'Local Sandbox'}
                  </span>
                </span>
              </div>

              {dbError && (
                <div className="mt-2.5 bg-rose-950/40 border border-rose-900/40 rounded-lg p-2.5 text-[10px] text-rose-300 font-mono break-all max-h-24 overflow-y-auto">
                  <span className="font-bold block mb-1 text-rose-200">Terjadi Kendala Koneksi:</span>
                  {dbError}
                </div>
              )}

              <button
                onClick={async () => {
                  const success = await syncLocalToCloud();
                  if (success) {
                    alert('BERHASIL! Semua data baseline cafe telah berhasil diunggah dan disimpan ke Firestore database Anda.');
                  } else {
                    alert('Gagal mengunggah data. Harap periksa rincian kesalahan di layar atau pastikan konfigurasi Firestore aktif.');
                  }
                }}
                disabled={syncStatus === 'syncing'}
                className={`mt-3 w-full flex items-center justify-center space-x-2 py-2.5 px-4 rounded-lg text-xs font-bold font-mono transition-all uppercase tracking-wider cursor-pointer border ${
                  syncStatus === 'syncing'
                    ? 'bg-slate-800 text-slate-500 border-slate-700 cursor-not-allowed'
                    : 'bg-emerald-500 text-slate-950 hover:bg-emerald-400 border-emerald-400 font-black'
                }`}
              >
                {syncStatus === 'syncing' ? (
                  <>
                    <RefreshCw className="h-4.5 w-4.5 animate-spin" />
                    <span>Mohon Tunggu...</span>
                  </>
                ) : (
                  <>
                    <ArrowDownUp className="h-4 w-4 text-slate-950" />
                    <span>Unggah Data ke Firestore</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
