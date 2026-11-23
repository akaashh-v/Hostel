import React, { useState, useEffect } from 'react';
import { Settings, Save, Building, Phone, Mail, MapPin, Bell, Info } from 'lucide-react';
import { api } from '../../services/api';
import { HostelSettings } from '../../types';
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
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const { success, error } = useToast();

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const data = await api.getHostelSettings();
        if (data) setSettings(data);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    loadSettings();
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

  if (isLoading) {
    return <div className="py-20 text-center text-xs text-slate-400">Loading settings...</div>;
  }

  return (
    <div className="space-y-6 pb-12 max-w-3xl mx-auto">
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Hostel & Mess Settings</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Configure mess dining details, contact information, and public announcement banners
        </p>
      </div>

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
    </div>
  );
};
