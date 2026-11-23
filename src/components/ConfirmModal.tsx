import React from 'react';
import { AlertCircle, CheckCircle2, X, Utensils } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  mealName: string;
  items: string[];
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  mealName,
  items,
  onConfirm,
  onCancel,
  isLoading = false
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div
        className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-100 overflow-hidden transform transition-all animate-scale-up"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-6 text-center">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-teal-600 flex items-center justify-center mx-auto mb-4 border border-emerald-100 shadow-sm">
            <Utensils className="w-7 h-7 text-teal-600" />
          </div>

          <h3 className="text-xl font-bold text-slate-900 mb-1">{title}</h3>
          <p className="text-sm text-slate-500 mb-4">
            Are you collecting your <strong className="text-teal-600">{mealName}</strong> now?
          </p>

          {items && items.length > 0 && (
            <div className="bg-slate-50 rounded-xl p-3 mb-5 border border-slate-200 text-left">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                Food Menu Checklist:
              </p>
              <ul className="space-y-1.5 max-h-32 overflow-y-auto">
                {items.map((item, idx) => (
                  <li key={idx} className="flex items-center gap-2 text-xs text-slate-700">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span className="truncate">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex items-start gap-2 bg-amber-50 p-2.5 rounded-lg border border-amber-200 text-left mb-6">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-[11px] text-amber-900 leading-snug">
              <strong>Notice:</strong> This action records your food collection for today. Each meal can be marked collected only <strong>once per day</strong>.
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={onCancel}
              disabled={isLoading}
              className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-medium text-sm hover:bg-slate-50 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={isLoading}
              className="flex-1 px-4 py-2.5 rounded-xl bg-teal-600 text-white font-medium text-sm hover:bg-teal-700 transition-colors shadow-md shadow-teal-600/20 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Recording...
                </>
              ) : (
                'Yes, Mark as Collected'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
