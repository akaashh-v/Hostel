import React, { useState, useEffect, useRef } from 'react';
import {
  Save,
  Building,
  Phone,
  Mail,
  MapPin,
  Bell,
  Database,
  Download,
  Upload,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  Cloud,
  HardDrive,
  Info,
  ExternalLink,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { api } from '../../services/api';
import { HostelSettings, DatabaseStatus } from '../../types';
import { useToast } from '../../context/ToastContext';

export const AdminSettings: React.FC = () => {
  const [settings, setSettings] = useState<HostelSettings>({
    hostel_name: '',
    mess_name: '',
    address: '',
    contact_phone: '',
    contact_email: '',
    notice: ''
  });
  const [dbStatus, setDbStatus] = useState<DatabaseStatus | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isBackingUp, setIsBackingUp] = useState<boolean>(false);
  const [isRestoring, setIsRestoring] = useState<boolean>(false);
  const [showVercelGuide, setShowVercelGuide] = useState<boolean>(false);
  const [hasLocalSnapshot, setHasLocalSnapshot] = useState<boolean>(() => {
    return typeof window !== 'undefined' && !!localStorage.getItem('mess_local_snapshot');
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const { success, error, info } = useToast();

  const loadData = async () => {
    try {
      const [settingsData, statusData] = await Promise.all([
        api.getHostelSettings().catch(() => null),
        api.getDatabaseStatus().catch(() => null)
      ]);
      if (settingsData) setSettings(settingsData);
      if (statusData) setDbStatus(statusData);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await api.updateHostelSettings(settings);
      success('Hostel and mess settings updated successfully');
    } catch (err: any) {
      error('Failed to update settings');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDownloadBackup = async () => {
    setIsBackingUp(true);
    try {
      const backupData = await api.getDatabaseBackup();
      const jsonString = JSON.stringify(backupData, null, 2);

      // Also save a local emergency snapshot to browser localStorage
      localStorage.setItem('mess_local_snapshot', jsonString);
      setHasLocalSnapshot(true);

      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const dateStr = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date());
      link.href = url;
      link.download = `hostel_mess_backup_${dateStr}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      success('Database backup downloaded and saved to browser snapshot');
    } catch (err: any) {
      error(err?.message || 'Failed to download backup');
    } finally {
      setIsBackingUp(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async event => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);

        if (!parsed || !Array.isArray(parsed.students) || !Array.isArray(parsed.food_collections)) {
          error('Invalid backup file. Missing required students or collections structure.');
          return;
        }

        const confirmRestore = window.confirm(
          `Are you sure you want to restore this database backup?\n\nThis backup contains:\n- ${parsed.students.length} Students\n- ${parsed.food_collections.length} Meal Collections\n- ${(parsed.monthly_bills || []).length} Monthly Bills\n\nExisting records will be replaced with this backup.`
        );

        if (!confirmRestore) return;

        setIsRestoring(true);
        const res = await api.restoreDatabase(parsed);
        success(`Database restored successfully: ${res.stats?.students || 0} students restored!`);
        await loadData();
      } catch (err: any) {
        error(err?.message || 'Failed to parse or restore backup file');
      } finally {
        setIsRestoring(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.readAsText(file);
  };

  const handleRestoreFromLocalSnapshot = async () => {
    const saved = localStorage.getItem('mess_local_snapshot');
    if (!saved) {
      error('No browser snapshot found');
      return;
    }

    try {
      const parsed = JSON.parse(saved);
      const confirmRestore = window.confirm(
        `Restore from Browser Snapshot?\n\nContains ${parsed.students?.length || 0} students and ${parsed.food_collections?.length || 0} collections saved on this device.`
      );
      if (!confirmRestore) return;

      setIsRestoring(true);
      const res = await api.restoreDatabase(parsed);
      success(`Restored from browser snapshot! (${res.stats?.students || 0} students)`);
      await loadData();
    } catch (err: any) {
      error('Failed to restore from browser snapshot');
    } finally {
      setIsRestoring(false);
    }
  };

  if (isLoading) {
    return <div className="py-20 text-center text-xs text-slate-400">Loading settings...</div>;
  }

  return (
    <div className="space-y-8 pb-12 max-w-3xl mx-auto">
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Hostel & Mess Settings</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Configure mess dining details, contact information, and public announcement banners
        </p>
      </div>

      {/* 1. HOSTEL & MESS CONFIGURATION FORM */}
      <form onSubmit={handleSubmit} className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-5">
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
            <Building className="w-3.5 h-3.5 text-teal-600" />
            <span>Hostel / Institution Name</span>
          </label>
          <input
            type="text"
            required
            value={settings.hostel_name}
            onChange={e => setSettings({ ...settings, hostel_name: e.target.value })}
            className="w-full px-4 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-600"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
            <Building className="w-3.5 h-3.5 text-teal-600" />
            <span>Mess Dining Hall Name</span>
          </label>
          <input
            type="text"
            required
            value={settings.mess_name}
            onChange={e => setSettings({ ...settings, mess_name: e.target.value })}
            className="w-full px-4 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-600"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-teal-600" />
              <span>Contact Helpline</span>
            </label>
            <input
              type="text"
              value={settings.contact_phone}
              onChange={e => setSettings({ ...settings, contact_phone: e.target.value })}
              className="w-full px-4 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-600 font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-teal-600" />
              <span>Official Email</span>
            </label>
            <input
              type="email"
              value={settings.contact_email}
              onChange={e => setSettings({ ...settings, contact_email: e.target.value })}
              className="w-full px-4 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-600"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-teal-600" />
            <span>Mess / Hostel Address</span>
          </label>
          <input
            type="text"
            value={settings.address}
            onChange={e => setSettings({ ...settings, address: e.target.value })}
            className="w-full px-4 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-600"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
            <Bell className="w-3.5 h-3.5 text-teal-600" />
            <span>Public Notice Banner</span>
          </label>
          <textarea
            rows={2}
            value={settings.notice || ''}
            onChange={e => setSettings({ ...settings, notice: e.target.value })}
            placeholder="Important message displayed across student portal..."
            className="w-full px-4 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-600"
          />
        </div>

        <div className="pt-4 border-t border-slate-100 flex justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className="px-6 py-2.5 bg-teal-600 text-white rounded-xl text-xs font-bold hover:bg-teal-700 transition-colors shadow-md shadow-teal-600/15 flex items-center gap-2 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Saving Changes...' : 'Save Settings'}</span>
          </button>
        </div>
      </form>

      {/* 2. DATA MANAGEMENT & CLOUD PERSISTENCE SECTION */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2">
              <Database className="w-5 h-5 text-teal-600" />
              <h2 className="text-lg font-black text-slate-900 tracking-tight">Database & Cloud Persistence</h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Monitor data persistence status across deployments, download full backups, or restore records
            </p>
          </div>

          {/* Persistence Status Badge */}
          {dbStatus && (
            <div className="flex items-center gap-1.5">
              {dbStatus.is_persistent ? (
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                  <span>
                    Persistent Storage Active (
                    {dbStatus.storage_type === 'SUPABASE_POSTGRES'
                      ? 'Supabase PostgreSQL'
                      : dbStatus.storage_type === 'CLOUD_KV'
                      ? 'Upstash / Vercel KV'
                      : dbStatus.storage_type === 'LOCAL_DISK'
                      ? 'Local Disk'
                      : 'Persistent'}
                    )
                  </span>
                </div>
              ) : (
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-xs font-semibold">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                  <span>Ephemeral Serverless Storage (Vercel)</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Diagnostic info banner if running ephemeral serverless */}
        {dbStatus && !dbStatus.is_persistent && (
          <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-4 sm:p-5 text-xs text-amber-900 space-y-3">
            <div className="flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-bold text-amber-950">Why does data reset on refresh in Vercel?</p>
                <p className="text-amber-800 leading-relaxed">
                  Vercel deploys APIs as <strong>Serverless Functions</strong> running across isolated, temporary containers.
                  When you refresh or when instances go idle, Vercel routes requests to fresh containers where temporary local storage is reset.
                </p>
              </div>
            </div>

            <div className="pt-2 border-t border-amber-200/60 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setShowVercelGuide(!showVercelGuide)}
                className="text-xs font-bold text-amber-900 hover:text-amber-950 flex items-center gap-1 underline underline-offset-2"
              >
                <span>{showVercelGuide ? 'Hide Setup Guide' : 'How to enable 100% Free Persistent KV on Vercel'}</span>
                {showVercelGuide ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
              <span className="text-[10px] text-amber-700 bg-amber-100/80 px-2 py-0.5 rounded-md font-mono">
                1-click setup
              </span>
            </div>

            {showVercelGuide && (
              <div className="bg-white/80 rounded-xl p-4 border border-amber-200/80 space-y-2.5 text-slate-700 mt-2">
                <p className="font-bold text-slate-900">3 Quick Steps for Permanent Storage on Vercel:</p>
                <ol className="list-decimal list-inside space-y-1.5 text-slate-600 pl-1">
                  <li>
                    Go to your <a href="https://vercel.com/dashboard" target="_blank" rel="noreferrer" className="text-teal-700 font-semibold underline">Vercel Dashboard</a> and select your Hostel project.
                  </li>
                  <li>
                    Click the <strong>Storage</strong> tab at the top &rarr; click <strong>Create Database</strong> &rarr; select <strong>KV (Upstash)</strong>.
                  </li>
                  <li>
                    Click <strong>Connect to Project</strong> &rarr; Vercel automatically sets <code className="bg-slate-100 text-teal-800 px-1 py-0.5 rounded text-[11px]">KV_REST_API_URL</code> and <code className="bg-slate-100 text-teal-800 px-1 py-0.5 rounded text-[11px]">KV_REST_API_TOKEN</code>.
                  </li>
                </ol>
                <p className="text-[11px] text-emerald-800 font-medium bg-emerald-50 p-2 rounded-lg border border-emerald-100">
                  ✨ That’s it! Once connected, the app will instantly sync all records, meals, and student accounts to the persistent cloud database on every refresh!
                </p>
              </div>
            )}
          </div>
        )}

        {/* Database Record Metrics */}
        {dbStatus && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3 text-center">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Students</span>
              <span className="text-lg font-black text-slate-800 font-mono">{dbStatus.stats.students}</span>
            </div>
            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3 text-center">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Collections</span>
              <span className="text-lg font-black text-slate-800 font-mono">{dbStatus.stats.collections}</span>
            </div>
            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3 text-center">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Bills</span>
              <span className="text-lg font-black text-slate-800 font-mono">{dbStatus.stats.bills}</span>
            </div>
            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3 text-center">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Payments</span>
              <span className="text-lg font-black text-slate-800 font-mono">{dbStatus.stats.payments}</span>
            </div>
          </div>
        )}

        {/* Action Controls: Download Backup & Restore */}
        <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            {/* Download Backup */}
            <button
              type="button"
              onClick={handleDownloadBackup}
              disabled={isBackingUp}
              className="px-4 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-colors shadow-sm flex items-center gap-2 disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isBackingUp ? 'Generating Backup...' : 'Download Full Backup (.json)'}</span>
            </button>

            {/* Hidden File Input for Restore */}
            <input
              type="file"
              ref={fileInputRef}
              accept=".json"
              onChange={handleFileChange}
              className="hidden"
            />

            {/* Restore from File */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isRestoring}
              className="px-4 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-50 transition-colors shadow-sm flex items-center gap-2 disabled:opacity-50"
            >
              <Upload className="w-3.5 h-3.5 text-teal-600" />
              <span>{isRestoring ? 'Restoring Data...' : 'Restore from Backup (.json)'}</span>
            </button>
          </div>

          {/* Browser snapshot recovery button */}
          {hasLocalSnapshot && (
            <button
              type="button"
              onClick={handleRestoreFromLocalSnapshot}
              disabled={isRestoring}
              className="px-3 py-2 text-xs text-teal-700 bg-teal-50 hover:bg-teal-100 border border-teal-200 rounded-xl font-bold flex items-center gap-1.5 transition-colors"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Restore from Browser Snapshot</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
