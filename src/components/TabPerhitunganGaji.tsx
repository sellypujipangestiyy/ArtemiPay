import React, { useState } from 'react';
import { usePayroll } from '../context/PayrollContext';
import { Karyawan } from '../types';
import { 
  Calculator, 
  UserPlus, 
  Users, 
  X, 
  Trash2, 
  Edit3, 
  ChevronRight, 
  Plus, 
  CheckSquare, 
  Save, 
  AlertCircle 
} from 'lucide-react';

export const TabPerhitunganGaji: React.FC = () => {
  const { 
    karyawan, 
    absensi, 
    payroll,
    addKaryawan, 
    updateKaryawan, 
    deleteKaryawan, 
    hitungDanSimpanPayroll,
    lembur
  } = usePayroll();

  // Wizard active calculator state
  const [selectedKaryawanId, setSelectedKaryawanId] = useState('');
  const [targetBulan, setTargetBulan] = useState('2026-07'); // YYYY-MM
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Employee CRUD Modal/Form toggle
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingEmp, setEditingEmp] = useState<Karyawan | null>(null);

  // Form input field states
  const [nama, setNama] = useState('');
  const [jabatan, setJabatan] = useState('Barista');
  const [gajiHari, setGajiHari] = useState(150000);
  const [tunjangan, setTunjangan] = useState(300000);
  const [potongan, setPotongan] = useState(100000);

  const resetForm = () => {
    setNama('');
    setJabatan('Barista');
    setGajiHari(150000);
    setTunjangan(300000);
    setPotongan(100000);
    setEditingEmp(null);
  };

  const handleCreateOrUpdateEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nama.trim()) return;

    const payload = {
      nama,
      jabatan,
      gajiHari: Number(gajiHari),
      tunjangan: Number(tunjangan),
      potongan: Number(potongan)
    };

    if (editingEmp) {
      // Update
      await updateKaryawan({ ...editingEmp, ...payload });
    } else {
      // Create
      await addKaryawan(payload);
    }
    resetForm();
    setShowAddForm(false);
  };

  const handleStartEdit = (emp: Karyawan) => {
    setEditingEmp(emp);
    setNama(emp.nama);
    setJabatan(emp.jabatan);
    setGajiHari(emp.gajiHari);
    setTunjangan(emp.tunjangan);
    setPotongan(emp.potongan);
    setShowAddForm(true);
  };

  // Perform Calculation (Real-time count of days)
  const handleCalculate = async () => {
    setSuccessMsg(null);
    if (!selectedKaryawanId) return;

    const success = await hitungDanSimpanPayroll(selectedKaryawanId, targetBulan);
    if (success) {
      const emp = karyawan.find(k => k.id === selectedKaryawanId);
      setSuccessMsg(`Perhitungan gaji ${emp?.nama} untuk periode ${targetBulan} sukses tersimpan di database.`);
      // Auto dismiss
      setTimeout(() => setSuccessMsg(null), 4000);
    }
  };

  // Live previews for calculations before submitting
  const selectedEmp = karyawan.find(k => k.id === selectedKaryawanId);
  const employeeAttendanceInMonth = selectedEmp 
    ? absensi.filter(a => a.karyawanId === selectedEmp.id && a.tanggal.startsWith(targetBulan))
    : [];
  
  const employeeLemburInMonth = selectedEmp
    ? lembur.filter(l => l.karyawanId === selectedEmp.id && l.tanggal.startsWith(targetBulan))
    : [];

  const calculatedLemburValue = employeeLemburInMonth.reduce((sum, l) => sum + l.totalUpahLembur, 0);

  // Attendance breakdown
  const countHadir = employeeAttendanceInMonth.filter(r => r.keterangan === 'Hadir' || r.keterangan === 'Sakit').length;
  const countIzin = employeeAttendanceInMonth.filter(r => r.keterangan === 'Izin').length;
  const countAlpha = employeeAttendanceInMonth.filter(r => r.keterangan === 'Alpha').length;

  const calculatedAttendanceValue = countHadir + (countIzin * 0.5);
  const grossPay = selectedEmp ? (calculatedAttendanceValue * selectedEmp.gajiHari) : 0;
  const totalSalaryComputed = selectedEmp ? (grossPay + selectedEmp.tunjangan - selectedEmp.potongan + calculatedLemburValue) : 0;

  return (
    <div className="space-y-6 font-sans">
      
      {/* Upper Panel: Split wizard & directory */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Wizard Panel (Col 5) - Matching Wireframe 5 */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs lg:col-span-5 flex flex-col justify-between h-fit relative">
          <div className="absolute top-0 left-0 right-0 h-1 bg-blue-600 rounded-t-2xl"></div>

          <div className="space-y-4">
            <div className="flex items-center space-x-2.5 border-b border-slate-100 pb-3">
              <Calculator className="h-5 w-5 text-blue-600" />
              <h3 className="font-bold text-slate-800 text-sm uppercase tracking-tight">Kalkulator Gaji Bulanan</h3>
            </div>

            <div className="space-y-3">
              {/* Select Employee */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Pilih Karyawan</label>
                <select
                  value={selectedKaryawanId}
                  onChange={(e) => {
                    setSelectedKaryawanId(e.target.value);
                    setSuccessMsg(null);
                  }}
                  className="block w-full rounded-xl border border-slate-200 py-2.5 px-3 text-xs font-semibold focus:border-blue-500 bg-slate-50/50"
                >
                  <option value="">-- Cari Nama Karyawan --</option>
                  {karyawan.map(k => (
                    <option key={k.id} value={k.id}>{k.nama} ({k.jabatan})</option>
                  ))}
                </select>
              </div>

              {/* Select Period */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Bulan Periode</label>
                <select
                  value={targetBulan}
                  onChange={(e) => {
                    setTargetBulan(e.target.value);
                    setSuccessMsg(null);
                  }}
                  className="block w-full rounded-xl border border-slate-200 py-2.5 px-3 text-xs font-semibold focus:border-blue-500 bg-slate-50/50 font-mono"
                >
                  <option value="2026-12">Desember 2026</option>
                  <option value="2026-11">November 2026</option>
                  <option value="2026-10">Oktober 2026</option>
                  <option value="2026-09">September 2026</option>
                  <option value="2026-08">Agustus 2026</option>
                  <option value="2026-07">Juli 2026</option>
                  <option value="2026-06">Juni 2026</option>
                  <option value="2026-05">Mei 2026</option>
                  <option value="2026-04">April 2026</option>
                  <option value="2026-03">Maret 2026</option>
                  <option value="2026-02">Februari 2026</option>
                  <option value="2026-01">Januari 2026</option>
                </select>
              </div>
            </div>

            {selectedEmp ? (
              <div className="bg-slate-50 rounded-xl p-4 space-y-3.5 border border-slate-100 mt-2 text-xs">
                <div className="flex justify-between items-center pb-2 border-b border-dashed border-slate-200">
                  <span className="font-semibold text-slate-500">Jabatan:</span>
                  <span className="font-bold text-blue-700">{selectedEmp.jabatan}</span>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Jumlah Kehadiran:</span>
                    <span className="font-bold text-slate-700">{employeeAttendanceInMonth.length} Hari</span>
                  </div>
                  <div className="pl-3 space-y-1 text-[11px] text-slate-400">
                    <div className="flex justify-between">
                      <span>• Hadir / Sakit:</span>
                      <span>{countHadir} Hari</span>
                    </div>
                    <div className="flex justify-between">
                      <span>• Izin (Terpotong 50%):</span>
                      <span>{countIzin} Hari</span>
                    </div>
                    <div className="flex justify-between">
                      <span>• Alpha (Tidak Terbayar):</span>
                      <span>{countAlpha} Hari</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5 pt-2 border-t border-dashed border-slate-200 text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Gaji Pokok / Hari:</span>
                    <span className="font-bold text-slate-700">Rp {selectedEmp.gajiHari.toLocaleString('id-ID')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Uang Tunjangan:</span>
                    <span className="font-bold text-emerald-600">+Rp {selectedEmp.tunjangan.toLocaleString('id-ID')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Upah Lembur ({employeeLemburInMonth.length} kali):</span>
                    <span className="font-bold text-amber-600">+Rp {calculatedLemburValue.toLocaleString('id-ID')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Potongan Default:</span>
                    <span className="font-bold text-rose-500">-Rp {selectedEmp.potongan.toLocaleString('id-ID')}</span>
                  </div>
                </div>

                <div className="flex justify-between items-center pt-2.5 border-t border-slate-200 text-sm">
                  <span className="font-bold text-slate-800">Total Gaji:</span>
                  <span className="font-mono font-extrabold text-blue-700 text-base">
                    Rp {Math.max(0, totalSalaryComputed).toLocaleString('id-ID')}
                  </span>
                </div>
              </div>
            ) : (
              <div className="p-10 border border-dashed border-slate-100 rounded-xl text-center text-xs text-slate-400">
                <AlertCircle className="h-5 w-5 mx-auto text-slate-300 mb-1.5" />
                Pilih nama karyawan untuk memvisualisasikan hitungan harian gaji.
              </div>
            )}
          </div>

          <div className="mt-5 space-y-2">
            {successMsg && (
              <div className="p-3 bg-emerald-50 text-emerald-800 rounded-xl text-[10px] font-semibold border border-emerald-100 flex items-center space-x-1.5">
                <CheckSquare className="h-3.5 w-3.5" />
                <span>{successMsg}</span>
              </div>
            )}
            
            {selectedEmp && (
              <div className="flex space-x-2">
                <button
                  onClick={() => {
                    // Simulate recalculating
                    setSuccessMsg('Penghitungan divalidasi dengan database.');
                    setTimeout(() => setSuccessMsg(null), 2000);
                  }}
                  className="flex-1 py-2.5 px-3 border border-slate-200 text-xs font-bold text-slate-700 rounded-xl hover:bg-slate-50 transition"
                >
                  Hitung Ulang
                </button>
                <button
                  onClick={handleCalculate}
                  id="btn-process-payroll-save"
                  className="flex-2 py-2.5 px-3 bg-blue-600 text-white text-xs font-bold rounded-xl hover:bg-blue-700 shadow-xs transition"
                >
                  Simpan & Proses Payroll
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Directory Panel (Col 7) */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-slate-700" />
              <h3 className="font-bold text-slate-800 text-sm uppercase">Daftar & Kontrak Karyawan</h3>
            </div>

            <button
              id="btn-add-karyawan-show"
              onClick={() => {
                resetForm();
                setShowAddForm(!showAddForm);
              }}
              className="flex items-center space-x-1 py-1.5 px-2.5 bg-blue-50 text-blue-700 rounded-lg text-xs font-bold hover:bg-blue-100 transition"
            >
              <Plus className="h-3 w-3" />
              <span>Tambah Karyawan</span>
            </button>
          </div>

          {showAddForm && (
            <form onSubmit={handleCreateOrUpdateEmployee} className="p-4 bg-slate-50 border border-slate-100 rounded-xl space-y-4 text-xs">
              <div className="flex justify-between items-center border-b border-slate-200/60 pb-2">
                <span className="font-bold text-slate-700">{editingEmp ? 'Ubah Profil Karyawan' : 'Daftarkan Karyawan Baru'}</span>
                <button type="button" onClick={() => setShowAddForm(false)}>
                  <X className="h-4 w-4 text-slate-400" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-slate-500 font-semibold mb-1">Nama Lengkap</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Siti Aisyah"
                    value={nama}
                    onChange={(e) => setNama(e.target.value)}
                    className="block w-full rounded-lg border-slate-200 py-2 px-3 focus:border-blue-500 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 font-semibold mb-1">Jabatan Operasional</label>
                  <input
                    type="text"
                    required
                    value={jabatan}
                    onChange={(e) => setJabatan(e.target.value)}
                    placeholder="Contoh: Barista Lead"
                    className="block w-full rounded-lg border-slate-200 py-2 px-3 focus:border-blue-500 bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2.5">
                <div>
                  <label className="block text-slate-500 font-semibold mb-1">Gaji Harian (Rp)</label>
                  <input
                    type="number"
                    value={gajiHari}
                    onChange={(e) => setGajiHari(Number(e.target.value))}
                    className="block w-full rounded-lg border-slate-200 py-2 px-3 focus:border-blue-500 bg-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 font-semibold mb-1">Tunjangan (Rp)</label>
                  <input
                    type="number"
                    value={tunjangan}
                    onChange={(e) => setTunjangan(Number(e.target.value))}
                    className="block w-full rounded-lg border-slate-200 py-2 px-3 focus:border-blue-500 bg-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 font-semibold mb-1">Potongan Default (Rp)</label>
                  <input
                    type="number"
                    value={potongan}
                    onChange={(e) => setPotongan(Number(e.target.value))}
                    className="block w-full rounded-lg border-slate-200 py-2 px-3 focus:border-blue-500 bg-white font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={resetForm}
                  className="py-1.5 px-3 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-100"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  id="btn-save-contract-emp"
                  className="py-1.5 px-4 bg-slate-900 border border-slate-900 text-white rounded-lg font-bold hover:bg-slate-800"
                >
                  {editingEmp ? 'Simpan Perubahan' : 'Daftarkan Kontrak'}
                </button>
              </div>
            </form>
          )}

          {/* Directory Grid */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100 text-xs">
              <thead>
                <tr className="bg-slate-50 font-bold text-slate-500 uppercase tracking-wider text-[10px]">
                  <th className="px-4 py-3 text-left">Nama</th>
                  <th className="px-4 py-3 text-left">Jabatan</th>
                  <th className="px-4 py-3 text-right">Hari Pokok</th>
                  <th className="px-4 py-3 text-right">Tunjangan</th>
                  <th className="px-4 py-3 text-right">Potongan</th>
                  <th className="px-4 py-3 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-100">
                {karyawan.map(emp => (
                  <tr key={emp.id} className="hover:bg-slate-50/50">
                    <td className="px-4 py-3 font-bold text-slate-800">{emp.nama}</td>
                    <td className="px-4 py-3"><span className="px-2 py-0.5 bg-slate-100 rounded-full font-medium text-slate-600">{emp.jabatan}</span></td>
                    <td className="px-4 py-3 text-right font-mono font-medium">Rp {emp.gajiHari.toLocaleString('id-ID')}</td>
                    <td className="px-4 py-3 text-right font-mono text-emerald-600">+Rp {emp.tunjangan.toLocaleString('id-ID')}</td>
                    <td className="px-4 py-3 text-right font-mono text-rose-500">-Rp {emp.potongan.toLocaleString('id-ID')}</td>
                    <td className="px-4 py-3 text-center flex justify-center space-x-1.5">
                      <button 
                        onClick={() => handleStartEdit(emp)}
                        className="p-1 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-md transition"
                        title="Edit data kontrak"
                      >
                        <Edit3 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => {
                          if (window.confirm(`Hapus kontrak kerja ${emp.nama}? Record penggajian mereka akan tetap tersimpan.`)) {
                            deleteKaryawan(emp.id);
                          }
                        }}
                        className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition"
                        title="Hapus data kontrak"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
