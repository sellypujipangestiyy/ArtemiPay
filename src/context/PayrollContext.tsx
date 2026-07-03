import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  collection, 
  doc, 
  setDoc, 
  getDocs, 
  onSnapshot,
  updateDoc,
  deleteDoc
} from 'firebase/firestore';
import { db, auth } from '../firebase';
import { Karyawan, Absensi, Payroll, Kas, PermintaanDana, UserSession, UserRole, TransaksiKas, JurnalUmumEntry, Lembur } from '../types';
import { initialKaryawan, generateHistoricAbsensi, initialPayroll, initialKas, initialPermintaanDana, initialTransaksiKas, initialJurnalUmum } from '../data/seed';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid || 'Not Authenticated',
      email: auth.currentUser?.email || null,
      emailVerified: auth.currentUser?.emailVerified || null,
      isAnonymous: auth.currentUser?.isAnonymous || null,
    },
    operationType,
    path
  };
  console.warn('Firestore Operation Warn/Error:', JSON.stringify(errInfo));
  // We throw a standardized error format as required in system instructions
  throw new Error(JSON.stringify(errInfo));
}

interface PayrollContextType {
  karyawan: Karyawan[];
  absensi: Absensi[];
  payroll: Payroll[];
  kas: Kas;
  permintaanDana: PermintaanDana[];
  transaksiKas: TransaksiKas[];
  jurnalUmum: JurnalUmumEntry[];
  lembur: Lembur[];
  currentUser: UserSession | null;
  syncStatus: 'cloud' | 'local' | 'syncing';
  biometricSupported: boolean;
  dbError: string | null;
  
  // Auth actions
  loginUser: (role: UserRole, username: string, targetKaryawanId?: string) => Promise<boolean>;
  logoutUser: () => void;
  triggerBiometricScan: () => Promise<boolean>;
  
  // Database operations
  addKaryawan: (emp: Omit<Karyawan, 'id'>) => Promise<boolean>;
  updateKaryawan: (emp: Karyawan) => Promise<boolean>;
  deleteKaryawan: (id: string) => Promise<boolean>;
  
  addAbsensi: (record: Omit<Absensi, 'id'>) => Promise<boolean>;
  updateAbsensi: (record: Absensi) => Promise<boolean>;
  hitungDanSimpanPayroll: (karyawanId: string, bulan: string) => Promise<boolean>;
  bayarGaji: (id: string, metode: 'Tunai' | 'Transfer Bank', tanggal: string) => Promise<boolean>;
  ajuDana: (jumlah: number, alasan: string) => Promise<boolean>;
  prosesDana: (id: string, status: 'Disetujui' | 'Ditolak') => Promise<boolean>;
  setKasManual: (jumlah: number) => Promise<boolean>;
  addTransaksiKas: (record: Omit<TransaksiKas, 'id'>) => Promise<boolean>;
  addJurnalUmum: (record: Omit<JurnalUmumEntry, 'id'>) => Promise<boolean>;
  addLembur: (record: Omit<Lembur, 'id'>) => Promise<boolean>;
  deleteLembur: (id: string) => Promise<boolean>;
  resetDatabase: () => Promise<void>;
  syncLocalToCloud: () => Promise<boolean>;
}

const PayrollContext = createContext<PayrollContextType | undefined>(undefined);

export const PayrollProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [karyawan, setKaryawan] = useState<Karyawan[]>([]);
  const [absensi, setAbsensi] = useState<Absensi[]>([]);
  const [payroll, setPayroll] = useState<Payroll[]>([]);
  const [kas, setKas] = useState<Kas>({ id: 'operasional', kasTersedia: 10000000, totalGajiWajibBayar: 0 });
  const [permintaanDana, setPermintaanDana] = useState<PermintaanDana[]>([]);
  const [transaksiKas, setTransaksiKas] = useState<TransaksiKas[]>([]);
  const [jurnalUmum, setJurnalUmum] = useState<JurnalUmumEntry[]>([]);
  const [lembur, setLembur] = useState<Lembur[]>([]);
  
  const [currentUser, setCurrentUser] = useState<UserSession | null>(null);
  const [syncStatus, setSyncStatus] = useState<'cloud' | 'local' | 'syncing'>('syncing');
  const [biometricSupported] = useState<boolean>(true); // Web simulation support is always enabled
  const [dbError, setDbError] = useState<string | null>(null);

  // Local storage utilities for local-mode fallback
  const getLocalStorage = (key: string, fallback: any) => {
    const item = localStorage.getItem(`sia_gaji_${key}`);
    return item ? JSON.parse(item) : fallback;
  };

  const saveLocalStorage = (key: string, data: any) => {
    localStorage.setItem(`sia_gaji_${key}`, JSON.stringify(data));
  };

  // Check and seed Firestore collections if empty
  const checkAndSeedFirestore = async () => {
    try {
      // 1. Employees check
      try {
        const karyawanRef = collection(db, 'karyawan');
        const karyawanSnap = await getDocs(karyawanRef);
        if (karyawanSnap.empty) {
          console.log('Seeding initial karyawan profiles...');
          for (const emp of initialKaryawan) {
            await setDoc(doc(db, 'karyawan', emp.id), emp);
          }
        }
      } catch (err: any) {
        console.error('Error seeding karyawan:', err);
        throw new Error(`Karyawan Seeding failed: ${err.message || err}`);
      }

      // 2. Attendance check
      try {
        const absensiRef = collection(db, 'absensi');
        const absensiSnap = await getDocs(absensiRef);
        if (absensiSnap.empty) {
          console.log('Seeding historic absensi records...');
          const historic = generateHistoricAbsensi();
          for (const rec of historic) {
            await setDoc(doc(db, 'absensi', rec.id), rec);
          }
        }
      } catch (err: any) {
        console.error('Error seeding absensi:', err);
        throw new Error(`Absensi Seeding failed: ${err.message || err}`);
      }

      // 3. Payroll check
      try {
        const payrollRef = collection(db, 'payroll');
        const payrollSnap = await getDocs(payrollRef);
        if (payrollSnap.empty) {
          console.log('Seeding baseline May payroll data...');
          for (const pay of initialPayroll) {
            await setDoc(doc(db, 'payroll', pay.id), pay);
          }
        }
      } catch (err: any) {
        console.error('Error seeding payroll:', err);
        throw new Error(`Payroll Seeding failed: ${err.message || err}`);
      }

      // 4. Cash check
      try {
        const kasRef = collection(db, 'kas');
        const kasSnap = await getDocs(kasRef);
        if (kasSnap.empty) {
          console.log('Seeding company treasury balance...');
          await setDoc(doc(db, 'kas', 'operasional'), initialKas);
        }
      } catch (err: any) {
        console.error('Error seeding kas:', err);
        throw new Error(`Kas Seeding failed: ${err.message || err}`);
      }

      // 5. Fund Request check
      try {
        const mintaRef = collection(db, 'permintaan_dana');
        const mintaSnap = await getDocs(mintaRef);
        if (mintaSnap.empty) {
          console.log('Seeding pending funding requests...');
          for (const request of initialPermintaanDana) {
            await setDoc(doc(db, 'permintaan_dana', request.id), request);
          }
        }
      } catch (err: any) {
        console.error('Error seeding permintaan_dana:', err);
        throw new Error(`Permintaan Dana Seeding failed: ${err.message || err}`);
      }

      // 6. Transaksi Kas check
      try {
        const txRef = collection(db, 'transaksi_kas');
        const txSnap = await getDocs(txRef);
        if (txSnap.empty) {
          console.log('Seeding initial transaksi kas...');
          for (const tx of initialTransaksiKas) {
            await setDoc(doc(db, 'transaksi_kas', tx.id), tx);
          }
        }
      } catch (err: any) {
        console.error('Error seeding transaksi_kas:', err);
        throw new Error(`Transaksi Kas Seeding failed: ${err.message || err}`);
      }

      // 7. Jurnal Umum check
      try {
        const juRef = collection(db, 'jurnal_umum');
        const juSnap = await getDocs(juRef);
        if (juSnap.empty) {
          console.log('Seeding initial jurnal umum...');
          for (const j of initialJurnalUmum) {
            await setDoc(doc(db, 'jurnal_umum', j.id), j);
          }
        }
      } catch (err: any) {
        console.error('Error seeding jurnal_umum:', err);
        throw new Error(`Jurnal Umum Seeding failed: ${err.message || err}`);
      }
      return true;
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      console.warn('Firebase seeding offline or restricted. Using robust Local Storage values.', err);
      setDbError(errMsg);
      return false;
    }
  };

  // Load and listen to database collections
  useEffect(() => {
    let unsubs: (() => void)[] = [];

    async function initDatabase() {
      setSyncStatus('syncing');
      
      // Automatically sign in anonymously to satisfy secure rules' isSignedIn() checks
      try {
        const { signInAnonymously } = await import('firebase/auth');
        await signInAnonymously(auth);
        console.log('Firebase anonymous auth completed.');
      } catch (authErr) {
        console.warn('Firebase anonymous auth warning:', authErr);
      }
      
      const seedSuccess = await checkAndSeedFirestore();
      
      if (seedSuccess) {
        // Setup Firestore listeners
        try {
          // Listen karyawan
          const unsubKaryawan = onSnapshot(collection(db, 'karyawan'), (snap) => {
            const list: Karyawan[] = [];
            snap.forEach(d => list.push(d.data() as Karyawan));
            setKaryawan(list);
            saveLocalStorage('karyawan', list);
          }, (err) => {
            console.error('Karyawan snapshot error:', err);
            setDbError(err.message);
            loadLocalFallback();
          });
          unsubs.push(unsubKaryawan);

          // Listen absensi
          const unsubAbsensi = onSnapshot(collection(db, 'absensi'), (snap) => {
            const list: Absensi[] = [];
            snap.forEach(d => list.push(d.data() as Absensi));
            // Sort by date newest first
            list.sort((a, b) => b.tanggal.localeCompare(a.tanggal));
            setAbsensi(list);
            saveLocalStorage('absensi', list);
          }, (err) => {
            console.error('Absensi snapshot error:', err);
            setDbError(err.message);
            loadLocalFallback();
          });
          unsubs.push(unsubAbsensi);

          // Listen payroll
          const unsubPayroll = onSnapshot(collection(db, 'payroll'), (snap) => {
            const list: Payroll[] = [];
            snap.forEach(d => list.push(d.data() as Payroll));
            setPayroll(list);
            saveLocalStorage('payroll', list);
          }, (err) => {
            console.error('Payroll snapshot error:', err);
            setDbError(err.message);
            loadLocalFallback();
          });
          unsubs.push(unsubPayroll);

          // Listen kas
          const unsubKas = onSnapshot(doc(db, 'kas', 'operasional'), (docSnap) => {
            if (docSnap.exists()) {
              const data = docSnap.data() as Kas;
              setKas(data);
              saveLocalStorage('kas', data);
            }
          }, (err) => {
            console.error('Kas snapshot error:', err);
            setDbError(err.message);
            loadLocalFallback();
          });
          unsubs.push(unsubKas);

          // Listen permintaan_dana
          const unsubPermintaan = onSnapshot(collection(db, 'permintaan_dana'), (snap) => {
            const list: PermintaanDana[] = [];
            snap.forEach(d => list.push(d.data() as PermintaanDana));
            list.sort((a, b) => b.tanggal.localeCompare(a.tanggal));
            setPermintaanDana(list);
            saveLocalStorage('permintaan_dana', list);
          }, (err) => {
            console.error('Permintaan Dana snapshot error:', err);
            setDbError(err.message);
            loadLocalFallback();
          });
          unsubs.push(unsubPermintaan);

          // Listen transaksi_kas
          const unsubTransaksi = onSnapshot(collection(db, 'transaksi_kas'), (snap) => {
            const list: TransaksiKas[] = [];
            snap.forEach(d => list.push(d.data() as TransaksiKas));
            list.sort((a, b) => b.tanggal.localeCompare(a.tanggal) || b.id.localeCompare(a.id));
            setTransaksiKas(list);
            saveLocalStorage('transaksi_kas', list);
          }, (err) => {
            console.error('Transaksi Kas snapshot error:', err);
            setDbError(err.message);
            loadLocalFallback();
          });
          unsubs.push(unsubTransaksi);

          // Listen jurnal_umum
          const unsubJurnal = onSnapshot(collection(db, 'jurnal_umum'), (snap) => {
            const list: JurnalUmumEntry[] = [];
            snap.forEach(d => list.push(d.data() as JurnalUmumEntry));
            list.sort((a, b) => b.tanggal.localeCompare(a.tanggal) || b.id.localeCompare(a.id));
            setJurnalUmum(list);
            saveLocalStorage('jurnal_umum', list);
          }, (err) => {
            console.error('Jurnal Umum snapshot error:', err);
            setDbError(err.message);
            loadLocalFallback();
          });
          unsubs.push(unsubJurnal);

          // Listen lembur
          const unsubLembur = onSnapshot(collection(db, 'lembur'), (snap) => {
            const list: Lembur[] = [];
            snap.forEach(d => list.push(d.data() as Lembur));
            list.sort((a, b) => b.tanggal.localeCompare(a.tanggal));
            setLembur(list);
            saveLocalStorage('lembur', list);
          }, (err) => {
            console.error('Lembur snapshot error:', err);
            setDbError(err.message);
            loadLocalFallback();
          });
          unsubs.push(unsubLembur);

          setSyncStatus('cloud');
          setDbError(null);
          console.log('Firebase active synchronization online.');
        } catch (e) {
          const errMsg = e instanceof Error ? e.message : String(e);
          console.warn('Real-time connection listener fallback:', e);
          setDbError(errMsg);
          loadLocalFallback();
        }
      } else {
        loadLocalFallback();
      }
    }

    function loadLocalFallback() {
      // Fallback: Read from LocalStorage or initialize with Seeding objects
      const localK = getLocalStorage('karyawan', initialKaryawan);
      const localA = getLocalStorage('absensi', generateHistoricAbsensi());
      const localP = getLocalStorage('payroll', initialPayroll);
      const localKas = getLocalStorage('kas', initialKas);
      const localM = getLocalStorage('permintaan_dana', initialPermintaanDana);
      const localT = getLocalStorage('transaksi_kas', initialTransaksiKas);
      const localJ = getLocalStorage('jurnal_umum', initialJurnalUmum);
      const localL = getLocalStorage('lembur', []);

      setKaryawan(localK);
      setAbsensi(localA);
      setPayroll(localP);
      setKas(localKas);
      setPermintaanDana(localM);
      setTransaksiKas(localT);
      setJurnalUmum(localJ);
      setLembur(localL);

      saveLocalStorage('karyawan', localK);
      saveLocalStorage('absensi', localA);
      saveLocalStorage('payroll', localP);
      saveLocalStorage('kas', localKas);
      saveLocalStorage('permintaan_dana', localM);
      saveLocalStorage('transaksi_kas', localT);
      saveLocalStorage('jurnal_umum', localJ);
      saveLocalStorage('lembur', localL);

      setSyncStatus('local');
    }

    // Attempt Firebase initiation
    initDatabase();

    // Check saved user session
    const savedUser = localStorage.getItem('sia_gaji_current_user');
    if (savedUser) {
      setCurrentUser(JSON.parse(savedUser));
    }

    return () => {
      unsubs.forEach(unsub => unsub());
    };
  }, []);

  // Sync cash totals automatically when payroll list changes
  useEffect(() => {
    if (payroll.length > 0) {
      const unpaidTotal = payroll
        .filter(p => p.status === 'Belum Dibayar')
        .reduce((sum, p) => sum + p.totalGaji, 0);
      
      if (kas.totalGajiWajibBayar !== unpaidTotal) {
        setKas(prev => {
          const updated = { ...prev, totalGajiWajibBayar: unpaidTotal };
          saveLocalStorage('kas', updated);
          
          if (syncStatus === 'cloud') {
            updateDoc(doc(db, 'kas', 'operasional'), { totalGajiWajibBayar: unpaidTotal })
              .catch(e => handleFirestoreError(e, OperationType.UPDATE, 'kas/operasional'));
          }
          return updated;
        });
      }
    }
  }, [payroll, syncStatus]);

  // Auth Operations
  const loginUser = async (role: UserRole, username: string, targetKaryawanId?: string): Promise<boolean> => {
    let finalNama = username;
    if (role === 'Karyawan' && targetKaryawanId) {
      const matchingEmp = karyawan.find(k => k.id === targetKaryawanId);
      if (matchingEmp) finalNama = matchingEmp.nama;
    }
    
    const session: UserSession = {
      uid: role.toLowerCase() + '_' + Date.now(),
      nama: finalNama,
      role,
      karyawanId: targetKaryawanId
    };
    setCurrentUser(session);
    localStorage.setItem('sia_gaji_current_user', JSON.stringify(session));
    return true;
  };

  const logoutUser = () => {
    setCurrentUser(null);
    localStorage.removeItem('sia_gaji_current_user');
  };

  const triggerBiometricScan = async (): Promise<boolean> => {
    // Return a delayed simulated success
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(true); // Successfully scanned
      }, 1500);
    });
  };

  // CRUD Karyawan
  const addKaryawan = async (empData: Omit<Karyawan, 'id'>): Promise<boolean> => {
    const id = 'emp' + (karyawan.length + 1) + '_' + Date.now().toString().slice(-4);
    const newEmp: Karyawan = { id, ...empData };
    
    const updated = [...karyawan, newEmp];
    setKaryawan(updated);
    saveLocalStorage('karyawan', updated);
    
    if (syncStatus === 'cloud') {
      try {
        await setDoc(doc(db, 'karyawan', id), newEmp);
      } catch (e) {
        handleFirestoreError(e, OperationType.WRITE, `karyawan/${id}`);
      }
    }
    return true;
  };

  const updateKaryawan = async (updatedEmp: Karyawan): Promise<boolean> => {
    const updated = karyawan.map(k => k.id === updatedEmp.id ? updatedEmp : k);
    setKaryawan(updated);
    saveLocalStorage('karyawan', updated);
    
    if (syncStatus === 'cloud') {
      try {
        await setDoc(doc(db, 'karyawan', updatedEmp.id), updatedEmp);
      } catch (e) {
        handleFirestoreError(e, OperationType.WRITE, `karyawan/${updatedEmp.id}`);
      }
    }
    return true;
  };

  const deleteKaryawan = async (id: string): Promise<boolean> => {
    const updated = karyawan.filter(k => k.id !== id);
    setKaryawan(updated);
    saveLocalStorage('karyawan', updated);
    
    if (syncStatus === 'cloud') {
      try {
        await deleteDoc(doc(db, 'karyawan', id));
      } catch (e) {
        handleFirestoreError(e, OperationType.DELETE, `karyawan/${id}`);
      }
    }
    return true;
  };

  // Attendance Clock-in Input
  const addAbsensi = async (recordData: Omit<Absensi, 'id'>): Promise<boolean> => {
    const id = 'abs' + Date.now();
    const newRecord: Absensi = { id, ...recordData };
    
    const updated = [newRecord, ...absensi];
    setAbsensi(updated);
    saveLocalStorage('absensi', updated);
    
    if (syncStatus === 'cloud') {
      try {
        await setDoc(doc(db, 'absensi', id), newRecord);
      } catch (e) {
        handleFirestoreError(e, OperationType.WRITE, `absensi/${id}`);
      }
    }
    return true;
  };

  const updateAbsensi = async (updatedRec: Absensi): Promise<boolean> => {
    const updated = absensi.map(a => a.id === updatedRec.id ? updatedRec : a);
    setAbsensi(updated);
    saveLocalStorage('absensi', updated);
    
    if (syncStatus === 'cloud') {
      try {
        await setDoc(doc(db, 'absensi', updatedRec.id), updatedRec);
      } catch (e) {
        handleFirestoreError(e, OperationType.WRITE, `absensi/${updatedRec.id}`);
      }
    }
    return true;
  };

  // Re-Calculate and generate payroll records
  const hitungDanSimpanPayroll = async (karyawanId: string, bulan: string): Promise<boolean> => {
    const emp = karyawan.find(k => k.id === karyawanId);
    if (!emp) return false;
    
    // Calculate attendance for specified month
    const listRecordsInMonth = absensi.filter(a => {
      const matchMonth = a.tanggal.substring(0, 7) === bulan;
      return a.karyawanId === karyawanId && matchMonth && (a.keterangan === 'Hadir' || a.keterangan === 'Izin' || a.keterangan === 'Sakit');
    });
    
    // In our calculation: Hadir counts as full pay, Izin is 50% pay, Sakit counts as full pay, Alpha is 0 pay
    const jumlahHadir = listRecordsInMonth.filter(r => r.keterangan === 'Hadir' || r.keterangan === 'Sakit').length;
    const jumlahIzin = listRecordsInMonth.filter(r => r.keterangan === 'Izin').length;
    const totalKehadiranNilai = jumlahHadir + (jumlahIzin * 0.5);

    const totalGajiBase = totalKehadiranNilai * emp.gajiHari;
    
    // Calculate total overtime pay for specified month
    const listLemburInMonth = lembur.filter(l => {
      const matchMonth = l.tanggal.substring(0, 7) === bulan;
      return l.karyawanId === karyawanId && matchMonth;
    });
    const totalUpahLemburSum = listLemburInMonth.reduce((sum, l) => sum + l.totalUpahLembur, 0);

    const totalBersih = totalGajiBase + emp.tunjangan - emp.potongan + totalUpahLemburSum;
    
    const payrollId = `pay_${karyawanId}_${bulan.replace('-', '_')}`;
    const newPayrollRecord: Payroll = {
      id: payrollId,
      karyawanId,
      karyawanNama: emp.nama,
      bulan,
      jumlahKehadiran: listRecordsInMonth.length,
      gajiPerHari: emp.gajiHari,
      tunjangan: emp.tunjangan,
      potongan: emp.potongan,
      lembur: totalUpahLemburSum,
      totalGaji: totalBersih < 0 ? 0 : totalBersih,
      status: 'Belum Dibayar'
    };

    // Replace if exists, or append
    const exists = payroll.some(p => p.id === payrollId);
    let updated: Payroll[];
    if (exists) {
      updated = payroll.map(p => p.id === payrollId ? newPayrollRecord : p);
    } else {
      updated = [...payroll, newPayrollRecord];
    }
    
    setPayroll(updated);
    saveLocalStorage('payroll', updated);
    
    if (syncStatus === 'cloud') {
      try {
        await setDoc(doc(db, 'payroll', payrollId), newPayrollRecord);
      } catch (e) {
        handleFirestoreError(e, OperationType.WRITE, `payroll/${payrollId}`);
      }
    }
    return true;
  };

  // Salary Payment
  const bayarGaji = async (id: string, metode: 'Tunai' | 'Transfer Bank', tanggal: string): Promise<boolean> => {
    const payItem = payroll.find(p => p.id === id);
    if (!payItem || payItem.status === 'Sudah Dibayar') return false;

    // Verify Cash Reserve Sufficient
    if (kas.kasTersedia < payItem.totalGaji) {
      console.warn('Operasi dihentikan: Kas tidak cukup.');
      return false;
    }

    const updatedPay: Payroll = {
      ...payItem,
      status: 'Sudah Dibayar',
      metodePembayaran: metode,
      tanggalPembayaran: tanggal
    };

    const updatedPayrollList = payroll.map(p => p.id === id ? updatedPay : p);
    setPayroll(updatedPayrollList);
    saveLocalStorage('payroll', updatedPayrollList);

    const updatedKas: Kas = {
      ...kas,
      kasTersedia: kas.kasTersedia - payItem.totalGaji,
      totalGajiWajibBayar: Math.max(0, kas.totalGajiWajibBayar - payItem.totalGaji)
    };
    setKas(updatedKas);
    saveLocalStorage('kas', updatedKas);

    const txId = 'tx_gaji_' + id + '_' + Date.now().toString().slice(-4);
    const newTxRecord: TransaksiKas = {
      id: txId,
      tanggal: tanggal,
      tipe: 'Keluar',
      jumlah: payItem.totalGaji,
      kategori: 'Pencairan Gaji',
      keterangan: `Pembayaran Gaji ${payItem.karyawanNama} - Bulan ${payItem.bulan} (${metode})`,
      pencatat: currentUser?.nama || 'System'
    };

    const updatedTxList = [newTxRecord, ...transaksiKas];
    setTransaksiKas(updatedTxList);
    saveLocalStorage('transaksi_kas', updatedTxList);

    if (syncStatus === 'cloud') {
      try {
        await setDoc(doc(db, 'payroll', id), updatedPay);
        await setDoc(doc(db, 'kas', 'operasional'), updatedKas);
        await setDoc(doc(db, 'transaksi_kas', txId), newTxRecord);
      } catch (e) {
        handleFirestoreError(e, OperationType.WRITE, `pembayaran_gaji_operasional`);
      }
    }
    return true;
  };

  // Submit additional funding request to Owner
  const ajuDana = async (jumlah: number, alasan: string): Promise<boolean> => {
    const today = new Date().toISOString().substring(0, 10);
    const id = 'req_' + Date.now();
    const newRequest: PermintaanDana = {
      id,
      tanggal: today,
      jumlahDana: jumlah,
      alasan,
      status: 'Menunggu'
    };

    const updated = [newRequest, ...permintaanDana];
    setPermintaanDana(updated);
    saveLocalStorage('permintaan_dana', updated);

    if (syncStatus === 'cloud') {
      try {
        await setDoc(doc(db, 'permintaan_dana', id), newRequest);
      } catch (e) {
        handleFirestoreError(e, OperationType.WRITE, `permintaan_dana/${id}`);
      }
    }
    return true;
  };

  // Approve or Deny funding request (By Owner)
  const prosesDana = async (id: string, newStatus: 'Disetujui' | 'Ditolak'): Promise<boolean> => {
    const request = permintaanDana.find(p => p.id === id);
    if (!request || request.status !== 'Menunggu') return false;

    const updatedRequest: PermintaanDana = {
      ...request,
      status: newStatus
    };

    const updatedList = permintaanDana.map(p => p.id === id ? updatedRequest : p);
    setPermintaanDana(updatedList);
    saveLocalStorage('permintaan_dana', updatedList);

    // If approved, add fund size to Kas Tersedia and log transaction!
    let updatedKas = { ...kas };
    let newTxRecord: TransaksiKas | null = null;
    let updatedTxList = [...transaksiKas];

    if (newStatus === 'Disetujui') {
      updatedKas = {
        ...kas,
        kasTersedia: kas.kasTersedia + request.jumlahDana
      };
      setKas(updatedKas);
      saveLocalStorage('kas', updatedKas);

      const txId = 'tx_dana_' + id + '_' + Date.now().toString().slice(-4);
      newTxRecord = {
        id: txId,
        tanggal: new Date().toISOString().substring(0, 10),
        tipe: 'Masuk',
        jumlah: request.jumlahDana,
        kategori: 'Modal Owner',
        keterangan: `Persetujuan Pengajuan Tambahan Dana: ${request.alasan}`,
        pencatat: currentUser?.nama || 'Owner'
      };
      updatedTxList = [newTxRecord, ...transaksiKas];
      setTransaksiKas(updatedTxList);
      saveLocalStorage('transaksi_kas', updatedTxList);
    }

    if (syncStatus === 'cloud') {
      try {
        await setDoc(doc(db, 'permintaan_dana', id), updatedRequest);
        if (newStatus === 'Disetujui') {
          await setDoc(doc(db, 'kas', 'operasional'), updatedKas);
          if (newTxRecord) {
            await setDoc(doc(db, 'transaksi_kas', newTxRecord.id), newTxRecord);
          }
        }
      } catch (e) {
        handleFirestoreError(e, OperationType.WRITE, `proses_permintaan_dana`);
      }
    }
    return true;
  };

  const setKasManual = async (jumlah: number): Promise<boolean> => {
    const updatedKas: Kas = {
      ...kas,
      kasTersedia: jumlah
    };
    setKas(updatedKas);
    saveLocalStorage('kas', updatedKas);
    if (syncStatus === 'cloud') {
      try {
        await setDoc(doc(db, 'kas', 'operasional'), updatedKas);
      } catch (e) {
        handleFirestoreError(e, OperationType.WRITE, 'kas/operasional');
      }
    }
    return true;
  };

  // Add individual cash transaction record directly
  const addTransaksiKas = async (recordData: Omit<TransaksiKas, 'id'>): Promise<boolean> => {
    const id = 'tx_' + Date.now();
    const newRecord: TransaksiKas = { id, ...recordData };

    const updated = [newRecord, ...transaksiKas];
    setTransaksiKas(updated);
    saveLocalStorage('transaksi_kas', updated);

    // Update treasury available cash
    const delta = recordData.tipe === 'Masuk' ? recordData.jumlah : -recordData.jumlah;
    const updatedKas: Kas = {
      ...kas,
      kasTersedia: kas.kasTersedia + delta
    };
    setKas(updatedKas);
    saveLocalStorage('kas', updatedKas);

    if (syncStatus === 'cloud') {
      try {
        await setDoc(doc(db, 'transaksi_kas', id), newRecord);
        await setDoc(doc(db, 'kas', 'operasional'), updatedKas);
      } catch (e) {
        handleFirestoreError(e, OperationType.WRITE, `transaksi_kas/${id}`);
      }
    }
    return true;
  };

  // Add individual manual journal entry
  const addJurnalUmum = async (recordData: Omit<JurnalUmumEntry, 'id'>): Promise<boolean> => {
    const id = 'ju_' + Date.now();
    const newRecord: JurnalUmumEntry = { id, ...recordData };

    const updated = [newRecord, ...jurnalUmum];
    setJurnalUmum(updated);
    saveLocalStorage('jurnal_umum', updated);

    if (syncStatus === 'cloud') {
      try {
        await setDoc(doc(db, 'jurnal_umum', id), newRecord);
      } catch (e) {
        handleFirestoreError(e, OperationType.WRITE, `jurnal_umum/${id}`);
      }
    }
    return true;
  };

  // Add individual overtime entry
  const addLembur = async (recordData: Omit<Lembur, 'id'>): Promise<boolean> => {
    const id = 'lbr_' + Date.now();
    const newRecord: Lembur = { id, ...recordData };

    const updated = [newRecord, ...lembur];
    setLembur(updated);
    saveLocalStorage('lembur', updated);

    if (syncStatus === 'cloud') {
      try {
        await setDoc(doc(db, 'lembur', id), newRecord);
      } catch (e) {
        handleFirestoreError(e, OperationType.WRITE, `lembur/${id}`);
      }
    }
    return true;
  };

  // Delete individual overtime entry
  const deleteLembur = async (id: string): Promise<boolean> => {
    const updated = lembur.filter(l => l.id !== id);
    setLembur(updated);
    saveLocalStorage('lembur', updated);

    if (syncStatus === 'cloud') {
      try {
        await deleteDoc(doc(db, 'lembur', id));
      } catch (e) {
        handleFirestoreError(e, OperationType.DELETE, `lembur/${id}`);
      }
    }
    return true;
  };

  // Master reset for easier testing
  const resetDatabase = async () => {
    localStorage.removeItem('sia_gaji_karyawan');
    localStorage.removeItem('sia_gaji_absensi');
    localStorage.removeItem('sia_gaji_payroll');
    localStorage.removeItem('sia_gaji_kas');
    localStorage.removeItem('sia_gaji_permintaan_dana');
    localStorage.removeItem('sia_gaji_transaksi_kas');
    localStorage.removeItem('sia_gaji_jurnal_umum');
    localStorage.removeItem('sia_gaji_lembur');
    
    if (syncStatus === 'cloud') {
      try {
        // Overwrite or delete key documents to baseline
        for (const emp of initialKaryawan) {
          await setDoc(doc(db, 'karyawan', emp.id), emp);
        }
        const historic = generateHistoricAbsensi();
        for (const rec of historic) {
          await setDoc(doc(db, 'absensi', rec.id), rec);
        }
        for (const pay of initialPayroll) {
          await setDoc(doc(db, 'payroll', pay.id), pay);
        }
        await setDoc(doc(db, 'kas', 'operasional'), initialKas);
        for (const request of initialPermintaanDana) {
          await setDoc(doc(db, 'permintaan_dana', request.id), request);
        }
        for (const tx of initialTransaksiKas) {
          await setDoc(doc(db, 'transaksi_kas', tx.id), tx);
        }
        for (const j of initialJurnalUmum) {
          await setDoc(doc(db, 'jurnal_umum', j.id), j);
        }
        // No default seeded lembur, let's keep Firestore collection empty or clean
        const snapL = await getDocs(collection(db, 'lembur'));
        for (const docRef of snapL.docs) {
          await deleteDoc(doc(db, 'lembur', docRef.id));
        }
      } catch (e) {
        console.warn('Firebase reset warning', e);
      }
    }
    
    // Reboot state
    setKaryawan(initialKaryawan);
    setAbsensi(generateHistoricAbsensi());
    setPayroll(initialPayroll);
    setKas(initialKas);
    setPermintaanDana(initialPermintaanDana);
    setTransaksiKas(initialTransaksiKas);
    setJurnalUmum(initialJurnalUmum);
    setLembur([]);
  };

  const syncLocalToCloud = async (): Promise<boolean> => {
    try {
      setSyncStatus('syncing');
      setDbError(null);
      
      // Automatically sign in anonymously to satisfy secure rules' isSignedIn() checks
      try {
        const { signInAnonymously } = await import('firebase/auth');
        await signInAnonymously(auth);
        console.log('Manual sync anonymous auth completed.');
      } catch (authErr) {
        console.warn('Manual sync anonymous auth warning:', authErr);
      }

      // Force upload all current state documents to Firestore with detailed try-catches
      try {
        for (const emp of karyawan) {
          await setDoc(doc(db, 'karyawan', emp.id), emp);
        }
      } catch (empErr: any) {
        console.error('Failed to sync karyawan:', empErr);
        throw new Error(`Sync 'karyawan' collection failed: ${empErr.message || empErr}`);
      }

      try {
        for (const rec of absensi) {
          await setDoc(doc(db, 'absensi', rec.id), rec);
        }
      } catch (absErr: any) {
        console.error('Failed to sync absensi:', absErr);
        throw new Error(`Sync 'absensi' collection failed: ${absErr.message || absErr}`);
      }

      try {
        for (const pay of payroll) {
          await setDoc(doc(db, 'payroll', pay.id), pay);
        }
      } catch (payErr: any) {
        console.error('Failed to sync payroll:', payErr);
        throw new Error(`Sync 'payroll' collection failed: ${payErr.message || payErr}`);
      }

      try {
        await setDoc(doc(db, 'kas', 'operasional'), kas);
      } catch (kasErr: any) {
        console.error('Failed to sync kas:', kasErr);
        throw new Error(`Sync 'kas' collection failed: ${kasErr.message || kasErr}`);
      }

      try {
        for (const request of permintaanDana) {
          await setDoc(doc(db, 'permintaan_dana', request.id), request);
        }
      } catch (reqErr: any) {
        console.error('Failed to sync permintaan_dana:', reqErr);
        throw new Error(`Sync 'permintaan_dana' collection failed: ${reqErr.message || reqErr}`);
      }

      try {
        for (const tx of transaksiKas) {
          await setDoc(doc(db, 'transaksi_kas', tx.id), tx);
        }
      } catch (txErr: any) {
        console.error('Failed to sync transaksi_kas:', txErr);
        throw new Error(`Sync 'transaksi_kas' collection failed: ${txErr.message || txErr}`);
      }

      try {
        for (const j of jurnalUmum) {
          await setDoc(doc(db, 'jurnal_umum', j.id), j);
        }
      } catch (juErr: any) {
        console.error('Failed to sync jurnal_umum:', juErr);
        throw new Error(`Sync 'jurnal_umum' collection failed: ${juErr.message || juErr}`);
      }

      try {
        for (const l of lembur) {
          await setDoc(doc(db, 'lembur', l.id), l);
        }
      } catch (lemErr: any) {
        console.error('Failed to sync lembur:', lemErr);
        throw new Error(`Sync 'lembur' collection failed: ${lemErr.message || lemErr}`);
      }
      
      setSyncStatus('cloud');
      setDbError(null);
      console.log('Force-uploaded all local records to Firestore successfully.');
      return true;
    } catch (err: any) {
      console.error('Manual sync to cloud failed:', err);
      setDbError(err.message || String(err));
      setSyncStatus('local');
      return false;
    }
  };

  return (
    <PayrollContext.Provider value={{
      karyawan,
      absensi,
      payroll,
      kas,
      permintaanDana,
      transaksiKas,
      jurnalUmum,
      lembur,
      currentUser,
      syncStatus,
      biometricSupported,
      dbError,
      loginUser,
      logoutUser,
      triggerBiometricScan,
      addKaryawan,
      updateKaryawan,
      deleteKaryawan,
      addAbsensi,
      updateAbsensi,
      hitungDanSimpanPayroll,
      bayarGaji,
      ajuDana,
      prosesDana,
      setKasManual,
      addTransaksiKas,
      addJurnalUmum,
      addLembur,
      deleteLembur,
      resetDatabase,
      syncLocalToCloud
    }}>
      {children}
    </PayrollContext.Provider>
  );
};

export const usePayroll = () => {
  const context = useContext(PayrollContext);
  if (!context) throw new Error('usePayroll must be used within a PayrollProvider');
  return context;
};
