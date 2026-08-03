import React from 'react';
import { AppNotification } from '../../types';
import { X, Calendar, Scissors, AlertTriangle, Gift, Sparkles } from 'lucide-react';

interface ToastContainerProps {
  toasts: AppNotification[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;

  const getIcon = (type: AppNotification['type']) => {
    switch (type) {
      case 'booking_confirmation':
        return <Calendar className="w-4 h-4 text-emerald-600" />;
      case 'new_booking':
        return <Scissors className="w-4 h-4 text-[#8B5E34]" />;
      case 'inventory_alert':
        return <AlertTriangle className="w-4 h-4 text-amber-600" />;
      case 'loyalty_reward':
        return <Gift className="w-4 h-4 text-[#B68A4C]" />;
      default:
        return <Sparkles className="w-4 h-4 text-[#8B5E34]" />;
    }
  };

  return (
    <div className="fixed top-20 right-4 z-50 max-w-sm w-full space-y-2 pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="pointer-events-auto bg-[#FAF8F5] border-2 border-[#B68A4C] text-[#2D2D2D] p-4 rounded-2xl shadow-xl flex items-start gap-3 transform transition-all duration-300 animate-slide-in"
        >
          <div className="p-2 rounded-xl bg-[#F4F1EC] border border-[#B68A4C]/30 shrink-0">
            {getIcon(toast.type)}
          </div>

          <div className="flex-1 min-w-0">
            <h4 className="font-serif font-bold text-xs text-[#2D2D2D]">{toast.title}</h4>
            <p className="text-xs text-[#2D2D2D]/80 leading-snug mt-0.5">{toast.message}</p>
          </div>

          <button
            onClick={() => onDismiss(toast.id)}
            className="text-[#2D2D2D]/40 hover:text-[#2D2D2D] p-1 rounded-full hover:bg-[#F4F1EC]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
};
