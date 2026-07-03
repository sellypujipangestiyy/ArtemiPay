import React, { useState, useEffect } from 'react';
import { PayrollProvider, usePayroll } from './context/PayrollContext';
import { BiometricLogin } from './components/BiometricLogin';
import { Sidebar } from './components/Sidebar';
import { TabDashboard } from './components/TabDashboard';
import { TabAbsensiInput } from './components/TabAbsensiInput';
import { TabAbsensiData } from './components/TabAbsensiData';
import { TabPerhitunganGaji } from './components/TabPerhitunganGaji';
import { TabCekKas } from './components/TabCekKas';
import { TabPersetujuanOwner } from './components/TabPersetujuanOwner';
import { TabPembayaranGaji } from './components/TabPembayaranGaji';
import { TabLaporan } from './components/TabLaporan';
import { TabKelolaKaryawan } from './components/TabKelolaKaryawan';
import { TabTransaksiKas } from './components/TabTransaksiKas';
import { TabJurnalUmum } from './components/TabJurnalUmum';

import { ShieldCheck, Lock, Clock, Calendar, Database, Menu } from 'lucide-react';

function DashboardLayout() {
  const { currentUser, syncStatus } = usePayroll();
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [currentTime, setCurrentTime] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Clock updates
  useEffect(() => {
    const updateTime = () => {
      const options: Intl.DateTimeFormatOptions = { 
        weekday: 'short', 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric', 
        hour: '2-digit', 
        minute: '2-digit',
        second: '2-digit',
        hour12: true 
      };
      setCurrentTime(new Date().toLocaleDateString('id-ID', options));
    };
    
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Secure automatic tab mapping depending on Role on initial logs
  useEffect(() => {
    if (currentUser?.role === 'Karyawan') {
      setCurrentTab('absensi-masuk');
    } else {
      setCurrentTab('dashboard');
    }
  }, [currentUser]);

  if (!currentUser) return <BiometricLogin />;

  const renderActiveTab = () => {
    switch (currentTab) {
      case 'dashboard':
        return <TabDashboard />;
      case 'kelola-karyawan':
        return <TabKelolaKaryawan />;
      case 'absensi-input':
        return <TabAbsensiInput />;
      case 'absensi-masuk':
        return <TabAbsensiInput forcedType="Masuk" />;
      case 'absensi-keluar':
        return <TabAbsensiInput forcedType="Keluar" />;
      case 'absensi-data':
        return <TabAbsensiData />;
      case 'perhitungan-gaji':
        return <TabPerhitunganGaji />;
      case 'cek-kas':
        return <TabCekKas />;
      case 'persetujuan-owner':
        return <TabPersetujuanOwner />;
      case 'pembayaran-gaji':
        return <TabPembayaranGaji />;
      case 'transaksi-kas':
        return <TabTransaksiKas />;
      case 'jurnal-umum':
        return <TabJurnalUmum />;
      case 'riwayat-laporan':
        return <TabLaporan />;
      default:
        return <TabDashboard />;
    }
  };

  return (
    <div className="flex bg-slate-50 min-h-screen text-slate-800 font-sans h-screen overflow-hidden" id="financial-workspace-main">
      {/* 1. Left Sidebar Navigation */}
      <Sidebar 
        currentTab={currentTab} 
        setCurrentTab={setCurrentTab} 
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      {/* 2. Main Workspace Body */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        
        {/* Top Header Controls bar */}
        <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-4 sm:px-8 shrink-0 font-sans">
          <div className="flex items-center gap-3">
            {/* Hamburger Button for Mobile/Tablet */}
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden p-2 -ml-1 rounded-lg text-slate-650 hover:text-slate-900 hover:bg-slate-100 transition shrink-0 cursor-pointer"
              title="Buka Menu"
            >
              <Menu className="h-6 w-6" />
            </button>
            <div>
              <h1 className="text-base sm:text-lg font-bold text-slate-900 uppercase tracking-tight leading-none font-display">ArtemiPay Hub</h1>
              <p className="text-[10px] sm:text-xs text-slate-500 mt-1 sm:mt-1.5 font-medium">
                Otorisasi: <strong className="text-slate-800 font-bold">{currentUser?.role === 'Admin' ? 'Admin Keuangan' : currentUser?.role === 'Owner' ? 'Owner Desk' : 'Karyawan'}</strong> <span className="hidden md:inline">&bull; {currentTime || 'Mencatat waktu...'}</span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 sm:gap-6">
            <div className="hidden sm:flex items-center gap-2 bg-blue-50 border border-blue-100 px-4 py-2 rounded-full">
              <ShieldCheck className="h-4 w-4 text-blue-900" />
              <span className="text-[10px] font-bold text-blue-900 uppercase tracking-wider">Biometric Secured</span>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-xs font-bold text-slate-900 leading-none">{currentUser?.nama}</p>
                <p className="text-[9px] text-slate-400 uppercase font-black tracking-widest mt-1">Authorized User</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center border-2 border-blue-900 p-0.5">
                <div className="w-full h-full rounded-full bg-blue-900"></div>
              </div>
            </div>
          </div>
        </header>

        {/* Dynamic content stage */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-8 max-w-7xl w-full mx-auto">
          {renderActiveTab()}
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <PayrollProvider>
      <DashboardLayout />
    </PayrollProvider>
  );
}
