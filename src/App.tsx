import React, { useState, Suspense } from 'react';
import { useAuth } from './context/AuthContext';
import { StudentTab, StudentBottomNav } from './components/StudentBottomNav';
import { AdminTab, AdminSidebar } from './components/AdminSidebar';
import { Navbar } from './components/Navbar';
import { Utensils, Loader2 } from 'lucide-react';
import { FoodCollection } from './types';

// Lazy-loaded Student Pages for optimized initial bundle
const StudentAuth = React.lazy(() =>
  import('./pages/student/StudentAuth').then(m => ({ default: m.StudentAuth }))
);
const StudentDashboard = React.lazy(() =>
  import('./pages/student/StudentDashboard').then(m => ({ default: m.StudentDashboard }))
);
const StudentMenu = React.lazy(() =>
  import('./pages/student/StudentMenu').then(m => ({ default: m.StudentMenu }))
);
const StudentHistory = React.lazy(() =>
  import('./pages/student/StudentHistory').then(m => ({ default: m.StudentHistory }))
);
const StudentBill = React.lazy(() =>
  import('./pages/student/StudentBill').then(m => ({ default: m.StudentBill }))
);
const StudentProfile = React.lazy(() =>
  import('./pages/student/StudentProfile').then(m => ({ default: m.StudentProfile }))
);

// Lazy-loaded Admin Pages (includes heavy recharts & xlsx chunks)
const AdminLogin = React.lazy(() =>
  import('./pages/admin/AdminLogin').then(m => ({ default: m.AdminLogin }))
);
const AdminDashboard = React.lazy(() =>
  import('./pages/admin/AdminDashboard').then(m => ({ default: m.AdminDashboard }))
);
const AdminStudents = React.lazy(() =>
  import('./pages/admin/AdminStudents').then(m => ({ default: m.AdminStudents }))
);
const AdminMenu = React.lazy(() =>
  import('./pages/admin/AdminMenu').then(m => ({ default: m.AdminMenu }))
);
const AdminCollections = React.lazy(() =>
  import('./pages/admin/AdminCollections').then(m => ({ default: m.AdminCollections }))
);
const AdminBilling = React.lazy(() =>
  import('./pages/admin/AdminBilling').then(m => ({ default: m.AdminBilling }))
);
const AdminPayments = React.lazy(() =>
  import('./pages/admin/AdminPayments').then(m => ({ default: m.AdminPayments }))
);
const AdminReports = React.lazy(() =>
  import('./pages/admin/AdminReports').then(m => ({ default: m.AdminReports }))
);
const AdminSettings = React.lazy(() =>
  import('./pages/admin/AdminSettings').then(m => ({ default: m.AdminSettings }))
);

const ViewLoadingFallback: React.FC = () => (
  <div className="flex items-center justify-center min-h-[40vh] p-8">
    <div className="flex flex-col items-center gap-2.5">
      <Loader2 className="w-6 h-6 text-emerald-600 animate-spin" />
      <span className="text-xs font-semibold text-slate-400">Loading view...</span>
    </div>
  </div>
);

export const App: React.FC = () => {
  const { student, admin, isLoading, activePortal } = useAuth();
  const [studentTab, setStudentTab] = useState<StudentTab>('dashboard');
  const [adminTab, setAdminTab] = useState<AdminTab>('overview');
  const [activePaymentCollection, setActivePaymentCollection] = useState<FoodCollection | null>(null);

  const handleNavigateToPayment = (collection?: FoodCollection) => {
    if (collection) {
      setActivePaymentCollection(collection);
    }
    setStudentTab('bill');
  };

  // Full-screen loading while verifying existing persistent session
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F7FAFA] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-amber-400 shadow-lg animate-bounce bg-black flex items-center justify-center">
            <img
              src="/tastebox-logo.jpg"
              alt="Tastebox Meals Co."
              className="w-full h-full object-cover"
            />
          </div>
          <h2 className="text-base font-extrabold text-slate-800 tracking-tight">TASTEBOX MEALS CO.</h2>
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
      <Navbar />

      {/* STUDENT PORTAL */}
      {activePortal === 'student' && (
        <Suspense fallback={<ViewLoadingFallback />}>
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
                    Payment & Settlement
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
                <StudentDashboard
                  onNavigateToTab={tab => setStudentTab(tab as any)}
                  onNavigateToPayment={handleNavigateToPayment}
                />
              )}
              {studentTab === 'menu' && (
                <StudentMenu onNavigateToPayment={handleNavigateToPayment} />
              )}
              {studentTab === 'history' && <StudentHistory />}
              {studentTab === 'bill' && (
                <StudentBill
                  activeCollection={activePaymentCollection}
                  onClearActiveCollection={() => setActivePaymentCollection(null)}
                />
              )}
              {studentTab === 'profile' && <StudentProfile />}

              {/* Mobile Bottom Navigation */}
              <StudentBottomNav activeTab={studentTab} onSelectTab={setStudentTab} />
            </main>
          )}
        </Suspense>
      )}

      {/* ADMIN PORTAL */}
      {activePortal === 'admin' && (
        <Suspense fallback={<ViewLoadingFallback />}>
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
                {adminTab === 'settings' && <AdminSettings />}
              </main>
            </div>
          )}
        </Suspense>
      )}
    </div>
  );
};
