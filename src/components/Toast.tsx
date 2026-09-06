import { useEffect, useState } from 'react';
import { CheckCircle2, AlertTriangle, X } from 'lucide-react';

export interface ToastData {
  id: string;
  message: string;
  isPositive: boolean;
  details?: string;
}

interface Props {
  toast: ToastData;
  onDismiss: (id: string) => void;
}

export default function Toast({ toast, onDismiss }: Props) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(true);
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(() => onDismiss(toast.id), 300);
    }, 4000);
    return () => clearTimeout(timer);
  }, [toast.id, onDismiss]);

  return (
    <div
      className={`fixed bottom-6 right-6 z-[60] max-w-sm transition-all duration-300 ${
        visible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
      }`}
    >
      <div
        className={`flex items-start gap-3 p-4 rounded-2xl border shadow-2xl backdrop-blur-md ${
          toast.isPositive
            ? 'bg-emerald-950/90 border-emerald-500/40 shadow-emerald-500/20'
            : 'bg-red-950/90 border-red-500/40 shadow-red-500/20'
        }`}
      >
        {toast.isPositive ? (
          <CheckCircle2 size={20} className="text-emerald-400 flex-shrink-0 mt-0.5" />
        ) : (
          <AlertTriangle size={20} className="text-red-400 flex-shrink-0 mt-0.5" />
        )}
        <div className="flex-1 min-w-0">
          <p className="text-white text-sm font-bold leading-snug">{toast.message}</p>
          {toast.details && <p className="text-slate-400 text-xs mt-1">{toast.details}</p>}
        </div>
        <button
          onClick={() => { setVisible(false); setTimeout(() => onDismiss(toast.id), 300); }}
          className="text-slate-500 hover:text-white flex-shrink-0"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}
