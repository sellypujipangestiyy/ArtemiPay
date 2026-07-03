import React from 'react';
import { usePayroll } from '../context/PayrollContext';
import brandLogo from '../assets/images/artemipay_logo_1781435859921.jpg';
import { 
  LayoutDashboard, 
  Users,
  Clock, 
  CalendarDays, 
  Wallet, 
  Coins, 
  ShieldAlert, 
  Receipt, 
  History, 
  LogOut,
  LogIn,
  Sparkles,
  Coffee,
  Database,
  ArrowUpDown,
  BookOpen,
  X
} from 'lucide-react';

interface SidebarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentTab, setCurrentTab, isOpen, onClose }) => {
  const { currentUser, logoutUser, syncStatus, resetDatabase, dbError, syncLocalToCloud } = usePayroll();

  if (!currentUser) return null;

  // Filter menu items by user role
  const getMenuItems = () => {
    switch (currentUser.role) {
      case 'Admin':
        return [
          { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
          { id: 'kelola-karyawan', label: 'Kelola Karyawan', icon: Users },
          { id: 'absensi-input', label: 'Absen Karyawan', icon: Clock },
          { id: 'absensi-data', label: 'Data Absensi', icon: CalendarDays },
          { id: 'perhitungan-gaji', label: 'Perhitungan Gaji', icon: Wallet },
          { id: 'cek-kas', label: 'Cek Kas Perusahaan', icon: Coins },
          { id: 'transaksi-kas', label: 'Transaksi Arus Kas', icon: ArrowUpDown },
          { id: 'jurnal-umum', label: 'Jurnal Umum', icon: BookOpen },
          { id: 'pembayaran-gaji', label: 'Pembayaran Gaji', icon: Receipt },
          { id: 'riwayat-laporan', label: 'Riwayat & Laporan', icon: History },
        ];
      case 'Owner':
        return [
          { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
          { id: 'persetujuan-owner', label: 'Persetujuan Dana', icon: ShieldAlert },
          { id: 'transaksi-kas', label: 'Transaksi Arus Kas', icon: ArrowUpDown },
          { id: 'jurnal-umum', label: 'Jurnal Umum', icon: BookOpen },
          { id: 'riwayat-laporan', label: 'Riwayat & Laporan', icon: History },
        ];
      case 'Karyawan':
        return [
          { id: 'absensi-masuk', label: 'Absen Masuk Mandiri', icon: LogIn },
          { id: 'absensi-keluar', label: 'Absen Keluar Mandiri', icon: LogOut },
        ];
      default:
        return [];
    }
  };

  const menuItems = getMenuItems();

  return (
    <>
      {/* Mobile Sidebar Backdrop Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      <div 
        className={`fixed inset-y-0 left-0 lg:relative z-50 w-64 bg-blue-900 text-blue-100 flex flex-col border-r border-blue-800 shrink-0 font-sans h-screen transition-transform duration-300 lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`} 
        id="app-sidebar"
      >
        {/* Brand Header */}
        <div className="p-5 border-b border-blue-800 flex items-center justify-between bg-blue-950/20">
          <div className="flex items-center space-x-3">
            <img 
              src={brandLogo} 
              alt="ArtemiPay Logo" 
              className="w-10 h-10 rounded-lg shrink-0 object-cover border border-blue-800"
              referrerPolicy="no-referrer"
            />
            <div>
              <h1 className="text-[15px] font-black text-white tracking-tight leading-none font-display">ARTEMIPAY</h1>
              <span className="text-[9px] font-mono font-bold tracking-wider text-blue-300 uppercase block mt-1">Café Artemida</span>
            </div>
          </div>
          
          {/* Mobile close button */}
          <button 
            onClick={onClose} 
            className="lg:hidden p-1.5 rounded-lg text-blue-300 hover:text-white hover:bg-blue-800/60 transition cursor-pointer"
            title="Tutup Menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* User Session profile info */}
        <div className="p-5 bg-blue-950/30 border-b border-blue-800 flex flex-col space-y-2">
          <div className="flex items-center space-x-3">
            <div className="h-9 w-9 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-white font-bold text-sm">
              {currentUser.nama.substring(0, 2).toUpperCase()}
            </div>
            <div className="overflow-hidden">
              <h4 className="text-xs font-semibold text-slate-100 truncate">{currentUser.nama}</h4>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold bg-blue-950 text-blue-300 border border-blue-850 mt-1 uppercase">
                {currentUser.role}
              </span>
            </div>
          </div>

          {/* Database real-time sync telemetry */}
          <div className="flex flex-col pt-1 space-y-1.5">
            <div className="flex items-center justify-between text-[10px] text-blue-300">
              <span className="flex items-center space-x-1.5 font-mono">
                <span className={`h-1.5 w-1.5 rounded-full ${syncStatus === 'cloud' ? 'bg-green-400 animate-pulse' : syncStatus === 'syncing' ? 'bg-blue-400 animate-bounce' : 'bg-amber-400'}`}></span>
                <span>{syncStatus === 'cloud' ? 'Firebase Real-Time' : syncStatus === 'syncing' ? 'Sinkronisasi...' : 'Local Sandbox'}</span>
              </span>
              {syncStatus === 'cloud' && <Database className="h-2.5 w-2.5 text-green-400" />}
            </div>
            
            {syncStatus === 'local' && (
              <button
                onClick={async () => {
                  const s = await syncLocalToCloud();
                  if (s) {
                    alert('Semua data berhasil disinkronkan ke Firestore!');
                  } else {
                    alert('Gagal menyinkronkan data. Silakan periksa log/indikator error.');
                  }
                }}
                className="w-full flex items-center justify-center space-x-1 py-1 rounded bg-green-500/20 hover:bg-green-500/35 border border-green-500/30 text-green-300 hover:text-white transition cursor-pointer text-[9px] font-semibold uppercase tracking-wider font-mono border-solid"
              >
                <ArrowUpDown className="h-3 w-3" />
                <span>Upload ke Firestore</span>
              </button>
            )}

            {dbError && (
              <div className="text-[9px] text-red-300 bg-red-950/40 p-1 border border-red-950 rounded break-all max-h-16 overflow-y-auto mt-1 font-mono">
                Db: {dbError}
              </div>
            )}
          </div>
        </div>

        {/* Navigation menu list */}
        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                id={`nav-tab-${item.id}`}
                onClick={() => {
                  setCurrentTab(item.id);
                  onClose(); // auto close on mobile
                }}
                className={`w-full flex items-center space-x-3 px-3.5 py-3 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  isActive 
                    ? 'bg-blue-800 font-bold text-white shadow-none' 
                    : 'text-blue-200 hover:bg-blue-800/50 hover:text-white'
                }`}
              >
                <Icon className={`h-4.5 w-4.5 ${isActive ? 'text-white' : 'text-blue-300'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Footer controls: Reset DB and LogOut */}
        <div className="p-4 border-t border-blue-800 space-y-1.5 bg-blue-950/40">
          <button 
            onClick={() => {
              if (window.confirm('Apakah Anda yakin ingin menyetel ulang seluruh database ArtemiPay ke data awal (seeding)?')) {
                resetDatabase().then(() => {
                  alert('Database berhasil diset ulang!');
                  onClose();
                });
              }
            }}
            className="w-full flex items-center justify-center space-x-1.5 py-2 rounded-lg text-[10px] font-medium text-blue-300 hover:text-white hover:bg-blue-800/40 transition-all border border-transparent hover:border-blue-805 cursor-pointer"
          >
            <Sparkles className="h-3.5 w-3.5 text-blue-300" />
            <span>Reset ke Data Seeding</span>
          </button>

          <button
            onClick={() => {
              logoutUser();
              onClose();
            }}
            className="w-full flex items-center justify-center space-x-2 py-2.5 rounded-lg text-xs font-bold bg-blue-950 text-slate-100 hover:bg-rose-955 hover:text-rose-300 hover:border-rose-900 border border-blue-850 transition-all cursor-pointer"
          >
            <LogOut className="h-4 w-4" />
            <span>Keluar Sistem</span>
          </button>
        </div>
      </div>
    </>
  );
};
