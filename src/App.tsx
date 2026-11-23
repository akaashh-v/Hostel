import React, { useState } from 'react';
import { useAuth } from './context/AuthContext';
import { StudentTab, StudentBottomNav } from './components/StudentBottomNav';
import { AdminTab, AdminSidebar } from './components/AdminSidebar';
import { Navbar } from './components/Navbar';

// Student Pages
import { StudentAuth } from './pages/student/StudentAuth';
import { StudentDashboard } from './pages/student/StudentDashboard';
import { StudentMenu } from './pages/student/StudentMenu';
import { StudentHistory } from './pages/student/StudentHistory';
import { StudentBill } from './pages/student/StudentBill';
import { StudentProfile } from './pages/student/StudentProfile';

// Admin Pages
import { AdminLogin } from './pages/admin/AdminLogin';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AdminStudents } from './pages/admin/AdminStudents';
import { AdminMenu } from './pages/admin/AdminMenu';
import { AdminCollections } from './pages/admin/AdminCollections';
import { AdminBilling } from './pages/admin/AdminBilling';
import { AdminPayments } from './pages/admin/AdminPayments';
import { AdminReports } from './pages/admin/AdminReports';
import { AdminQRCode } from './pages/admin/AdminQRCode';
import { AdminSettings } from './pages/admin/AdminSettings';

import { Utensils, X, QrCode } from 'lucide-react';
import QRCode from 'qrcode';

export const App: React.FC = () => {
  const { student, admin, isLoading, activePortal } = useAuth();
  const [studentTab, setStudentTab] = useState<StudentTab>('dashboard');
  const [adminTab, setAdminTab] = useState<AdminTab>('overview');
  const [isQRModalOpen, setIsQRModalOpen] = useState<boolean>(false);
  const [modalQRUrl, setModalQRUrl] = useState<string>('');

  const handleOpenQRModal = () => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5173';
    QRCode.toDataURL(
      `${origin}/student`,
      { width: 320, margin: 2, color: { dark: '#0D9488', light: '#ffffff' } },
      (err, url) => {
        if (!err && url) setModalQRUrl(url);
      }
    );
    setIsQRModalOpen(true);
  };

  // Full-screen loading while verifying existing persistent session
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F7FAFA] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="w-12 h-12 rounded-2xl bg-[#0D9488] text-white flex items-center justify-center shadow-lg shadow-[#0D9488]/20 animate-bounce">
            <Utensils className="w-6 h-6 text-emerald-200" />
          </div>
          <h2 className="text-base font-bold text-slate-800 tracking-tight">HOSTEL MESS</h2>
          <div className="flex items-center gap-2 text-xs text-slate-400 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Verifying session credentials...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7FAFA] text-[#17211B] flex flex-col font-sans">
      <Navbar onOpenQRModal={handleOpenQRModal} />

      {/* STUDENT PORTAL */}
      {activePortal === 'student' && (
        <>
          {!student ? (
            <StudentAuth />
          ) : (
            <main className="flex-1">
              {/* Desktop Student Navigation Bar */}
              <div className="hidden md:block bg-white border-b border-slate-200/80 sticky top-16 sm:top-[4.25rem] z-30 shadow-2xs">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 flex items-center gap-1.5 py-2 text-xs font-bold text-slate-600">
                  <button
                    onClick={() => setStudentTab('dashboard')}
                    className={`px-4 py-2 rounded-xl transition-all ${
                      studentTab === 'dashboard'
                        ? 'bg-[#0D9488] text-white shadow-sm'
                        : 'hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    Dashboard
                  </button>
                  <button
                    onClick={() => setStudentTab('menu')}
                    className={`px-4 py-2 rounded-xl transition-all ${
                      studentTab === 'menu'
                        ? 'bg-[#0D9488] text-white shadow-sm'
                        : 'hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    Today's Menu
                  </button>
                  <button
                    onClick={() => setStudentTab('history')}
                    className={`px-4 py-2 rounded-xl transition-all ${
                      studentTab === 'history'
                        ? 'bg-[#0D9488] text-white shadow-sm'
                        : 'hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    My Collections
                  </button>
                  <button
                    onClick={() => setStudentTab('bill')}
                    className={`px-4 py-2 rounded-xl transition-all ${
                      studentTab === 'bill'
                        ? 'bg-[#0D9488] text-white shadow-sm'
                        : 'hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    My Monthly Bill
                  </button>
                  <button
                    onClick={() => setStudentTab('profile')}
                    className={`px-4 py-2 rounded-xl transition-all ${
                      studentTab === 'profile'
                        ? 'bg-[#0D9488] text-white shadow-sm'
                        : 'hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    Profile
                  </button>
                </div>
              </div>

              {/* Active Student Tab */}
              {studentTab === 'dashboard' && (
                <StudentDashboard onNavigateToTab={tab => setStudentTab(tab as any)} />
              )}
              {studentTab === 'menu' && <StudentMenu />}
              {studentTab === 'history' && <StudentHistory />}
              {studentTab === 'bill' && <StudentBill />}
              {studentTab === 'profile' && <StudentProfile />}

              {/* Mobile Bottom Navigation */}
              <StudentBottomNav activeTab={studentTab} onSelectTab={setStudentTab} />
            </main>
          )}
        </>
      )}

      {/* ADMIN PORTAL */}
      {activePortal === 'admin' && (
        <>
          {!admin ? (
            <AdminLogin />
          ) : (
            <div className="flex-1 flex">
              <AdminSidebar activeTab={adminTab} onSelectTab={setAdminTab} />

              <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full overflow-x-hidden">
                {/* Mobile Admin Navigation Carousel */}
                <div className="md:hidden flex items-center gap-1.5 overflow-x-auto pb-3 mb-4 scrollbar-none">
                  {(
                    [
                      { id: 'overview', label: 'Dashboard' },
                      { id: 'students', label: 'Students' },
                      { id: 'menu', label: 'Menu' },
                      { id: 'collections', label: 'Collections' },
                      { id: 'billing', label: 'Billing' },
                      { id: 'payments', label: 'Payments' },
                      { id: 'reports', label: 'Reports' },
                      { id: 'qr-code', label: 'QR Poster' },
                      { id: 'settings', label: 'Settings' }
                    ] as { id: AdminTab; label: string }[]
                  ).map(t => (
                    <button
                      key={t.id}
                      onClick={() => setAdminTab(t.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                        adminTab === t.id
                          ? 'bg-[#0D9488] text-white shadow-sm'
                          : 'bg-white text-slate-600 border border-slate-200'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>

                {adminTab === 'overview' && <AdminDashboard onNavigateTab={setAdminTab} />}
                {adminTab === 'students' && <AdminStudents />}
                {adminTab === 'menu' && <AdminMenu />}
                {adminTab === 'collections' && <AdminCollections />}
                {adminTab === 'billing' && <AdminBilling />}
                {adminTab === 'payments' && <AdminPayments />}
                {adminTab === 'reports' && <AdminReports />}
                {adminTab === 'qr-code' && <AdminQRCode />}
                {adminTab === 'settings' && <AdminSettings />}
              </main>
            </div>
          )}
        </>
      )}

      {/* Quick QR Modal */}
      {isQRModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 text-center shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <QrCode className="w-4 h-4 text-[#0D9488]" />
                <span>HOSTEL MESS Entrance QR</span>
              </span>
              <button
                onClick={() => setIsQRModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {modalQRUrl ? (
              <img
                src={modalQRUrl}
                alt="HOSTEL MESS QR Code"
                className="w-56 h-56 mx-auto rounded-2xl p-2 bg-slate-50 border border-slate-200 shadow-inner my-2"
              />
            ) : null}

            <p className="text-xs font-bold text-slate-800 mt-2">Scan to Open Student Portal</p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              HOSTEL MESS Dining Hall • Instant Access & Food Collection
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
