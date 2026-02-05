import React from 'react';
import { X, CheckCircle, AlertTriangle, Info, Bell } from 'lucide-react';
import useSopStore from '../store/sopStore';

const iconMap = {
  success: <CheckCircle className="w-4 h-4 text-green-400" />,
  error: <AlertTriangle className="w-4 h-4 text-red-400" />,
  info: <Info className="w-4 h-4 text-blue-400" />,
  notification: <Bell className="w-4 h-4 text-synthia-400" />,
};

const bgMap = {
  success: 'border-green-500/30 bg-green-500/10',
  error: 'border-red-500/30 bg-red-500/10',
  info: 'border-blue-500/30 bg-blue-500/10',
  notification: 'border-synthia-500/30 bg-synthia-500/10',
};

export default function Toast() {
  const toasts = useSopStore(s => s.toasts);
  const removeToast = useSopStore(s => s.removeToast);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-16 right-4 z-50 flex flex-col gap-2 max-w-sm">
      {toasts.map(toast => (
        <div
          key={toast.id}
          className={`toast-enter flex items-start gap-2 px-3 py-2.5 rounded-lg border backdrop-blur-sm shadow-lg ${bgMap[toast.type] || bgMap.info}`}
        >
          <div className="flex-shrink-0 mt-0.5">
            {iconMap[toast.type] || iconMap.info}
          </div>
          <div className="flex-1 min-w-0">
            {toast.title && (
              <p className="text-sm font-medium text-gray-100">{toast.title}</p>
            )}
            <p className="text-xs text-slate-300">{toast.message}</p>
          </div>
          <button
            onClick={() => removeToast(toast.id)}
            className="flex-shrink-0 text-slate-400 hover:text-slate-200 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}
