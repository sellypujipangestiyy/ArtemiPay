import { Karyawan, Absensi, Payroll, Kas, PermintaanDana, TransaksiKas, JurnalUmumEntry } from '../types';

export const initialKaryawan: Karyawan[] = [
  {
    id: 'emp1',
    nama: 'Budi Santoso',
    jabatan: 'Kasir',
    gajiHari: 150000,
    tunjangan: 300000,
    potongan: 100000,
    bankPilihan: 'BCA',
    nomorRekening: '1234567890',
    namaRekening: 'BUDI SANTOSO'
  },
  {
    id: 'emp2',
    nama: 'Siti Aisyah',
    jabatan: 'Barista Principal',
    gajiHari: 160000,
    tunjangan: 350000,
    potongan: 100000,
    bankPilihan: 'MANDIRI',
    nomorRekening: '1357924680',
    namaRekening: 'SITI AISYAH'
  },
  {
    id: 'emp3',
    nama: 'Rudi Hermawan',
    jabatan: 'Kitchen Leader',
    gajiHari: 170000,
    tunjangan: 400000,
    potongan: 120000,
    bankPilihan: 'BRI',
    nomorRekening: '9876543210',
    namaRekening: 'RUDI HERMAWAN'
  },
  {
    id: 'emp4',
    nama: 'Dewi Lestari',
    jabatan: 'Server / Waitress',
    gajiHari: 140000,
    tunjangan: 250000,
    potongan: 80000,
    bankPilihan: 'BNI',
    nomorRekening: '2468013579',
    namaRekening: 'DEWI LESTARI'
  },
  {
    id: 'emp5',
    nama: 'Andi Saputra',
    jabatan: 'Barista Junior',
    gajiHari: 140000,
    tunjangan: 250000,
    potongan: 80000,
    bankPilihan: 'BSI',
    nomorRekening: '5544332211',
    namaRekening: 'ANDI SAPUTRA'
  }
];

export const initialAbsensi: Absensi[] = [
  {
    id: 'abs1_1',
    karyawanId: 'emp1',
    karyawanNama: 'Budi Santoso',
    tanggal: '2026-06-01',
    jamMasuk: '08:00',
    jamKeluar: '17:00',
    keterangan: 'Hadir'
  },
  {
    id: 'abs2_1',
    karyawanId: 'emp2',
    karyawanNama: 'Siti Aisyah',
    tanggal: '2026-06-01',
    jamMasuk: '08:05',
    jamKeluar: '17:00',
    keterangan: 'Hadir'
  },
  {
    id: 'abs3_1',
    karyawanId: 'emp3',
    karyawanNama: 'Rudi Hermawan',
    tanggal: '2026-06-01',
    jamMasuk: '08:10',
    jamKeluar: '17:00',
    keterangan: 'Hadir'
  },
  {
    id: 'abs4_1',
    karyawanId: 'emp4',
    karyawanNama: 'Dewi Lestari',
    tanggal: '2026-06-01',
    jamMasuk: '08:00',
    jamKeluar: '17:00',
    keterangan: 'Hadir'
  },
  {
    id: 'abs5_1',
    karyawanId: 'emp5',
    karyawanNama: 'Andi Saputra',
    tanggal: '2026-06-01',
    jamMasuk: '08:15',
    jamKeluar: '17:00',
    keterangan: 'Hadir'
  }
];

// Generate attendance records mimicking 26 attended days in May 2026
export function generateHistoricAbsensi(): Absensi[] {
  const result: Absensi[] = [...initialAbsensi];
  const listKaryawan = initialKaryawan;
  const daysInMay = 31;
  
  for (let d = 1; d <= daysInMay; d++) {
    // skip sundays for realistic working days except for a few
    const dayStr = d < 10 ? `0${d}` : `${d}`;
    const date = `2026-05-${dayStr}`;
    const dayOfWeek = new Date(date).getDay();
    if (dayOfWeek === 0) continue; // Skip sundays
    
    listKaryawan.forEach((emp, index) => {
      // create a variation of punch times
      const entryHour = index % 2 === 0 ? '08:00' : '08:05';
      const exitHour = '17:00';
      result.push({
        id: `abs_${emp.id}_may_${d}`,
        karyawanId: emp.id,
        karyawanNama: emp.nama,
        tanggal: date,
        jamMasuk: entryHour,
        jamKeluar: exitHour,
        keterangan: d === 12 && index === 2 ? 'Sakit' : 'Hadir' // Rudi sick once
      });
    });
  }
  return result;
}

export const initialPayroll: Payroll[] = [
  {
    id: 'pay_emp1_may',
    karyawanId: 'emp1',
    karyawanNama: 'Budi Santoso',
    bulan: '2026-05',
    jumlahKehadiran: 26,
    gajiPerHari: 150000,
    tunjangan: 300000,
    potongan: 100000,
    totalGaji: 4100000, // 26 * 150000 + 300000 - 100000 = 3900000 + 300000 - 100000 = 4100000
    status: 'Sudah Dibayar',
    metodePembayaran: 'Transfer Bank',
    tanggalPembayaran: '2026-06-01'
  },
  {
    id: 'pay_emp2_may',
    karyawanId: 'emp2',
    karyawanNama: 'Siti Aisyah',
    bulan: '2026-05',
    jumlahKehadiran: 26,
    gajiPerHari: 160000,
    tunjangan: 350000,
    potongan: 100000,
    totalGaji: 4410000,
    status: 'Sudah Dibayar',
    metodePembayaran: 'Transfer Bank',
    tanggalPembayaran: '2026-06-01'
  },
  {
    id: 'pay_emp3_may',
    karyawanId: 'emp3',
    karyawanNama: 'Rudi Hermawan',
    bulan: '2026-05',
    jumlahKehadiran: 25, // Rudi was sick 1 day
    gajiPerHari: 170000,
    tunjangan: 400000,
    potongan: 120000,
    totalGaji: 4530000,
    status: 'Belum Dibayar'
  },
  {
    id: 'pay_emp4_may',
    karyawanId: 'emp4',
    karyawanNama: 'Dewi Lestari',
    bulan: '2026-05',
    jumlahKehadiran: 26,
    gajiPerHari: 140000,
    tunjangan: 250000,
    potongan: 80000,
    totalGaji: 3810000,
    status: 'Belum Dibayar'
  },
  {
    id: 'pay_emp5_may',
    karyawanId: 'emp5',
    karyawanNama: 'Andi Saputra',
    bulan: '2026-05',
    jumlahKehadiran: 26,
    gajiPerHari: 140000,
    tunjangan: 250000,
    potongan: 80000,
    totalGaji: 3810000,
    status: 'Belum Dibayar'
  }
];

export const initialKas: Kas = {
  id: 'operasional',
  kasTersedia: 10000000, // Rp 10.000.000 (Sesuai wireframe dashboard)
  totalGajiWajibBayar: 12150000 // Gaji belum dibayar: Rudi (4.53M) + Dewi (3.81M) + Andi (3.81M) = 12.15M
};

export const initialPermintaanDana: PermintaanDana[] = [
  {
    id: 'request_1',
    tanggal: '2026-06-01',
    jumlahDana: 7000000,
    alasan: 'Dana kas tidak mencukupi untuk pembayaran gaji karyawan bulan ini.',
    status: 'Menunggu'
  }
];

export const initialTransaksiKas: TransaksiKas[] = [
  {
    id: 'tx_init_1',
    tanggal: '2026-06-01',
    tipe: 'Masuk',
    jumlah: 10000000,
    kategori: 'Modal Owner',
    keterangan: 'Setoran modal kas awal oleh Owner',
    pencatat: 'Owner'
  },
  {
    id: 'tx_init_2',
    tanggal: '2026-05-31',
    tipe: 'Keluar',
    jumlah: 3200000,
    kategori: 'Pencairan Gaji',
    keterangan: 'Pembayaran Gaji Budi Santoso - Bulan Mei',
    pencatat: 'Admin Cafe'
  },
  {
    id: 'tx_init_3',
    tanggal: '2026-06-03',
    tipe: 'Keluar',
    jumlah: 1500000,
    kategori: 'Operasional',
    keterangan: 'Beli Bahan Baku Kopi Principal',
    pencatat: 'Admin Cafe'
  }
];

export const initialJurnalUmum: JurnalUmumEntry[] = [
  {
    id: 'ju_init_1',
    tanggal: '2026-05-30',
    ref: 'JU-2026-001',
    keterangan: 'Pencatatan Depresiasi Mesin Espresso Mei',
    debetAkunCode: '5050',
    debetAkunNama: 'Beban Penyusutan & Perbaikan',
    kreditAkunCode: '1210',
    kreditAkunNama: 'Peralatan Cafe',
    nominal: 350000,
    pencatat: 'Owner',
    isAutomatic: false
  },
  {
    id: 'ju_init_2',
    tanggal: '2026-05-30',
    ref: 'JU-2026-002',
    keterangan: 'Penyesuaian Persediaan Bahan Baku Kopi Awal',
    debetAkunCode: '1120',
    debetAkunNama: 'Persediaan Bahan Kopi & Bahan Baku',
    kreditAkunCode: '2010',
    kreditAkunNama: 'Utang Usaha',
    nominal: 1200000,
    pencatat: 'Admin Cafe',
    isAutomatic: false
  }
];

