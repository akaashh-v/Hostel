import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  UserPlus,
  CheckCircle2,
  XCircle,
  MoreVertical,
  Edit2,
  Eye,
  EyeOff,
  Shield,
  X
} from 'lucide-react';
import { Student } from '../../types';
import { api } from '../../services/api';
import { useToast } from '../../context/ToastContext';

export const AdminStudents: React.FC = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [search, setSearch] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Add/Edit Modal
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [fullName, setFullName] = useState<string>('');
  const [phoneNumber, setPhoneNumber] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);

  // Profile Drawer
  const [profileData, setProfileData] = useState<any>(null);
  const [isProfileOpen, setIsProfileOpen] = useState<boolean>(false);

  const { success, error } = useToast();

  const loadStudents = async () => {
    try {
      const data = await api.getStudents(search);
      setStudents(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadStudents();
  }, [search]);

  const handleOpenAddModal = () => {
    setEditingStudent(null);
    setFullName('');
    setPhoneNumber('');
    setPassword('Student@123');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (student: Student) => {
    setEditingStudent(student);
    setFullName(student.full_name);
    setPhoneNumber(student.phone_number);
    setPassword('');
    setIsModalOpen(true);
  };

  const handleSaveStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !phoneNumber) {
      error('Full name and phone number are required');
      return;
    }

    try {
      if (editingStudent) {
        await api.updateStudent(editingStudent.id, {
          full_name: fullName,
          phone_number: phoneNumber,
          ...(password ? { password } : {})
        });
        success('Student profile updated');
      } else {
        await api.createStudentManually({
          full_name: fullName,
          phone_number: phoneNumber,
          password
        });
        success('Student account created');
      }
      setIsModalOpen(false);
      await loadStudents();
    } catch (err: any) {
      error(err.message || 'Failed to save student');
    }
  };

  const handleToggleStatus = async (student: Student) => {
    const nextStatus = student.status === 'ACTIVE' ? 'DEACTIVATED' : 'ACTIVE';
    try {
      await api.updateStudent(student.id, { status: nextStatus });
      success(`Student account ${nextStatus === 'ACTIVE' ? 'activated' : 'deactivated'}`);
      await loadStudents();
    } catch (err: any) {
      error('Failed to change status');
    }
  };

  const handleViewProfile = async (id: string) => {
    try {
      const profile = await api.getStudentProfile(id);
      setProfileData(profile);
      setIsProfileOpen(true);
    } catch (err: any) {
      error('Failed to load student profile');
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Student Directory</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage registered mess members, account access, and food collection history
          </p>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="px-4 py-2 bg-forest-900 text-white rounded-xl text-xs font-bold hover:bg-forest-800 transition-colors flex items-center gap-2 shadow-sm self-start sm:self-auto"
        >
          <UserPlus className="w-4 h-4" />
          <span>Add Student</span>
        </button>
      </div>

      {/* Search Input */}
      <div className="relative max-w-sm">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Search by name, phone or room..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-forest-900 bg-white"
        />
      </div>

      {/* Students Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-bold text-sm text-slate-900">Enrolled Students ({students.length})</h2>
          <span className="text-xs text-slate-400 font-mono">Real-time sync</span>
        </div>

        {isLoading ? (
          <div className="py-20 text-center text-xs text-slate-400">Loading student directory...</div>
        ) : students.length === 0 ? (
          <div className="py-20 text-center">
            <Users className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-600">No students found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Student Name</th>
                  <th className="py-3 px-4">Phone Number</th>
                  <th className="py-3 px-4 font-mono">Registered On</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {students.map(student => (
                  <tr key={student.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-slate-900">{student.full_name}</td>
                    <td className="py-3.5 px-4 font-mono text-slate-600">{student.phone_number}</td>
                    <td className="py-3.5 px-4 font-mono text-slate-500">
                      {new Date(student.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded ${student.status === 'ACTIVE'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-red-100 text-red-800'
                          }`}
                      >
                        {student.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleViewProfile(student.id)}
                          title="View collections & bills"
                          className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleOpenEditModal(student)}
                          title="Edit details"
                          className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleToggleStatus(student)}
                          title={student.status === 'ACTIVE' ? 'Deactivate student' : 'Activate student'}
                          className={`p-1.5 rounded-lg transition-colors ${student.status === 'ACTIVE'
                            ? 'text-slate-400 hover:text-red-600 hover:bg-red-50'
                            : 'text-emerald-600 hover:bg-emerald-50'
                            }`}
                        >
                          {student.status === 'ACTIVE' ? (
                            <XCircle className="w-3.5 h-3.5" />
                          ) : (
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Student Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <h3 className="font-bold text-base text-slate-900">
                {editingStudent ? 'Edit Student Details' : 'Add New Student'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveStudent} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="Enter student full name"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-forest-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  required
                  placeholder="10-digit number"
                  value={phoneNumber}
                  onChange={e => setPhoneNumber(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-forest-900 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  {editingStudent ? 'Reset Password (Optional)' : 'Default Password'}
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder={editingStudent ? 'Leave blank to keep current' : 'Student@123'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full px-3.5 pr-10 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-forest-900"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none cursor-pointer"
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-xl bg-forest-900 text-white text-xs font-bold hover:bg-forest-800 transition-colors shadow-sm"
                >
                  {editingStudent ? 'Save Changes' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Student Profile & History Modal */}
      {isProfileOpen && profileData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-lg text-slate-900">{profileData.student.full_name}</h3>
                <p className="text-xs text-slate-500 font-mono">
                  {profileData.student.phone_number}
                </p>
              </div>
              <button onClick={() => setIsProfileOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4 space-y-4">
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-slate-50 rounded-xl">
                  <span className="text-slate-400">Total Lifetime Collections</span>
                  <p className="text-xl font-bold text-slate-900 mt-1">{profileData.total_collections} meals</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl">
                  <span className="text-slate-400">Account Status</span>
                  <p className="text-xl font-bold text-emerald-700 mt-1">{profileData.student.status}</p>
                </div>
              </div>

              {/* Recent Collections */}
              <div>
                <h4 className="font-bold text-xs uppercase tracking-wider text-slate-400 mb-2">
                  Recent Verified Collections
                </h4>
                {profileData.collections && profileData.collections.length > 0 ? (
                  <div className="max-h-48 overflow-y-auto space-y-1.5 divide-y divide-slate-100">
                    {profileData.collections.map((c: any) => (
                      <div key={c.id} className="pt-1.5 text-xs flex items-center justify-between">
                        <div>
                          <span className="font-semibold text-slate-800">{c.meal_type}</span>
                          <span className="text-slate-400 font-mono ml-2">({c.collection_date})</span>
                        </div>
                        <span className="text-slate-500 font-mono">
                          {new Date(c.collected_at).toLocaleTimeString()}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400">No collections logged yet.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
