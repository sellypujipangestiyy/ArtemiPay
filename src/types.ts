export interface Karyawan {
  id: string;
  nama: string;
  jabatan: string;
  gajiHari: number;
  tunjangan: number;
  potongan: number;
  fingerprintStatus?: 'Terdaftar' | 'Belum Terdaftar';
  fingerprintCode?: string;
  faceStatus?: 'Terdaftar' | 'Belum Terdaftar';
  facePhoto?: string;
  nomorRekening?: string;
  namaRekening?: string;
  bankPilihan?: string;
}

export interface Absensi {
  id: string;
  karyawanId: string;
  karyawanNama: string;
  tanggal: string; // YYYY-MM-DD
  jamMasuk: string; // HH:MM
  jamKeluar: string; // HH:MM
  keterangan: 'Hadir' | 'Sakit' | 'Izin';
  fotoSelfie?: string; // Captured camera selfie Base64 URI
  fotoSelfieKeluar?: string; // Captured camera checkout selfie Base64 URI
}

export interface Payroll {
  id: string;
  karyawanId: string;
  karyawanNama: string;
  bulan: string; // YYYY-MM
  jumlahKehadiran: number;
  gajiPerHari: number;
  tunjangan: number;
  potongan: number;
  lembur?: number; // Total upah lembur accumulated
  totalGaji: number;
  status: 'Belum Dibayar' | 'Sudah Dibayar';
  metodePembayaran?: 'Tunai' | 'Transfer Bank' | '';
  tanggalPembayaran?: string; // YYYY-MM-DD
}

export interface Lembur {
  id: string;
  karyawanId: string;
  karyawanNama: string;
  tanggal: string; // YYYY-MM-DD
  jumlahJam: number;
  tarifPerJam: number;
  totalUpahLembur: number;
  keterangan: string;
}

export interface Kas {
  id: string; // 'operasional'
  kasTersedia: number;
  totalGajiWajibBayar: number;
}

export interface PermintaanDana {
  id: string;
  tanggal: string; // YYYY-MM-DD
  jumlahDana: number;
  alasan: string;
  status: 'Menunggu' | 'Disetujui' | 'Ditolak';
}

export type UserRole = 'Admin' | 'Owner' | 'Karyawan';

export interface UserSession {
  uid: string;
  nama: string;
  role: UserRole;
  karyawanId?: string; // If role is Karyawan
  email?: string;
}

export interface TransaksiKas {
  id: string;
  tanggal: string; // YYYY-MM-DD
  tipe: 'Masuk' | 'Keluar';
  jumlah: number;
  kategori: string; // e.g., 'Modal Owner', 'Pencairan Gaji', 'Penjualan', 'Operasional', etc.
  keterangan: string;
  pencatat: string; // nama pencatat
}

export interface JurnalUmumEntry {
  id: string;
  tanggal: string; // YYYY-MM-DD
  ref: string; // e.g., "JU-2026-001"
  keterangan: string;
  debetAkunCode: string;
  debetAkunNama: string;
  kreditAkunCode: string;
  kreditAkunNama: string;
  nominal: number;
  pencatat: string;
  isAutomatic?: boolean; // If true, it was mapped from cash transactions
}

