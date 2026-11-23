import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import { QrCode, Download, Printer, Copy, Check, Sparkles, Utensils } from 'lucide-react';
import { api } from '../../services/api';
import { HostelSettings } from '../../types';
import { useToast } from '../../context/ToastContext';

export const AdminQRCode: React.FC = () => {
  const [settings, setSettings] = useState<HostelSettings | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { success } = useToast();

  const portalUrl = typeof window !== 'undefined' ? `${window.location.origin}/student` : 'http://localhost:5173/student';

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const data = await api.getHostelSettings();
        setSettings(data);
      } catch (err) {
        console.error(err);
      }
    };
    loadSettings();
  }, []);

  useEffect(() => {
    QRCode.toDataURL(
      portalUrl,
      {
        width: 400,
        margin: 2,
        color: {
          dark: '#115E59',
          light: '#ffffff'
        }
      },
      (err, url) => {
        if (!err && url) {
          setQrDataUrl(url);
        }
      }
    );
  }, [portalUrl]);

  const handleDownload = () => {
    if (!qrDataUrl) return;
    const link = document.createElement('a');
    link.download = 'HOSTEL_MESS_Entrance_QR.png';
    link.href = qrDataUrl;
    link.click();
    success('QR Code downloaded successfully');
  };

  const handlePrint = () => {
    window.print();
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(portalUrl);
    setCopied(true);
    success('Portal URL copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6 pb-12 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Mess Entrance QR Poster</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Display this QR code at dining counters and entrance gates for seamless student collection
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleDownload}
            className="px-3.5 py-2 bg-teal-600 text-white rounded-xl text-xs font-bold hover:bg-teal-700 transition-colors flex items-center gap-2 shadow-sm"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download PNG</span>
          </button>
          <button
            onClick={handlePrint}
            className="px-3.5 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-50 transition-colors flex items-center gap-2 shadow-sm"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Poster</span>
          </button>
        </div>
      </div>

      {/* Official Poster Container (Styled for printing) */}
      <div
        id="qr-poster"
        className="bg-white rounded-3xl border-2 border-slate-200 p-8 sm:p-12 shadow-xl text-center relative overflow-hidden max-w-lg mx-auto"
      >
        {/* Top Header Badge */}
        <div className="flex items-center justify-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-xl bg-teal-600 text-white flex items-center justify-center shadow-md">
            <Utensils className="w-4 h-4 text-emerald-400" />
          </div>
          <span className="text-xs uppercase tracking-widest font-black text-emerald-800">
            OFFICIAL MESS COUNTER
          </span>
        </div>

        <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          {settings?.hostel_name || 'Grand Royal Hostel'}
        </h2>
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-1">
          {settings?.mess_name || 'HOSTEL MESS Dining Hall'}
        </p>

        {/* QR Code Canvas */}
        <div className="my-8 p-6 bg-slate-50 rounded-3xl border border-slate-200 inline-block shadow-inner">
          {qrDataUrl ? (
            <img
              src={qrDataUrl}
              alt="Mess QR Code"
              className="w-64 h-64 mx-auto rounded-2xl shadow-md bg-white p-2"
            />
          ) : (
            <div className="w-64 h-64 flex items-center justify-center text-slate-400 text-xs">
              Generating High-Res QR...
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="space-y-3 text-left bg-emerald-50/70 p-4 rounded-2xl border border-emerald-100 mb-6">
          <p className="font-bold text-xs text-emerald-950 uppercase tracking-wider text-center">
            How to Collect Food:
          </p>
          <ol className="text-xs text-emerald-900/90 space-y-1.5 list-decimal list-inside font-medium leading-relaxed">
            <li>Scan QR code with your mobile camera or scanner</li>
            <li>Login with your registered Phone Number and Password</li>
            <li>View today's live menu and click <strong>"Food Collected"</strong></li>
          </ol>
        </div>

        <p className="text-[10px] text-slate-400">
          Persistent device sessions keep you logged in. No OTP or passwords required on subsequent scans.
        </p>
      </div>

      {/* Copy Direct Link Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm max-w-lg mx-auto">
        <div className="truncate">
          <p className="text-[11px] text-slate-400 font-semibold uppercase">Student Portal Destination URL</p>
          <p className="text-xs font-mono font-semibold text-slate-800 truncate mt-0.5">{portalUrl}</p>
        </div>
        <button
          onClick={handleCopyLink}
          className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shrink-0"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
          <span>{copied ? 'Copied!' : 'Copy Link'}</span>
        </button>
      </div>
    </div>
  );
};
