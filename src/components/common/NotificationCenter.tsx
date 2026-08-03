import React from 'react';
import { AppNotification, UserRole } from '../../types';
import { Bell, CheckCheck, Trash2, X, Sparkles, Scissors, Crown, Calendar, AlertTriangle, Gift } from 'lucide-react';

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: AppNotification[];
  currentRole: UserRole;
  onMarkAllAsRead: () => void;
  onClearAll: () => void;
  onToggleRead: (id: string) => void;
  onSendTestNotification?: () => void;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  isOpen,
  onClose,
  notifications,
  currentRole,
  onMarkAllAsRead,
  onClearAll,
  onToggleRead,
  onSendTestNotification,
}) => {
  if (!isOpen) return null;

  const roleFiltered = notifications.filter(
    (n) => n.targetRole === currentRole || n.targetRole === 'all'
  );

  const unreadCount = roleFiltered.filter((n) => !n.read).length;

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
    <div className="fixed inset-0 z-50 flex justify-end bg-black/30 backdrop-blur-xs transition-opacity animate-fade-in">
      {/* Click outside backdrop */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Drawer Panel */}
      <div className="relative w-full max-w-md bg-[#FAF8F5] text-[#2D2D2D] h-full shadow-2xl border-l border-[#B68A4C]/25 flex flex-col z-10 animate-slide-left">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#B68A4C]/20 bg-[#FAF8F5] flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-full bg-[#8B5E34] text-[#FAF8F5] flex items-center justify-center font-bold shadow-xs">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-lg text-[#2D2D2D]">Notification Center</h3>
              <p className="text-[10px] text-[#B68A4C] uppercase tracking-wider font-semibold">
                {currentRole} Alerts ({unreadCount} unread)
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full text-[#2D2D2D]/60 hover:text-[#2D2D2D] hover:bg-[#F4F1EC] transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toolbar */}
        <div className="p-3 bg-[#F4F1EC] border-b border-[#B68A4C]/15 flex items-center justify-between text-xs">
          <div className="flex items-center space-x-2">
            <button
              onClick={onMarkAllAsRead}
              className="flex items-center gap-1 text-[#8B5E34] font-semibold hover:underline"
            >
              <CheckCheck className="w-3.5 h-3.5" /> Mark all read
            </button>
          </div>

          <div className="flex items-center space-x-3">
            {onSendTestNotification && (
              <button
                onClick={onSendTestNotification}
                className="text-[10px] font-bold text-[#FAF8F5] bg-[#B68A4C] hover:bg-[#8B5E34] px-2.5 py-1 rounded-lg transition-all"
              >
                + Trigger Alert
              </button>
            )}
            <button
              onClick={onClearAll}
              className="flex items-center gap-1 text-red-700 hover:text-red-800 font-medium text-[11px]"
            >
              <Trash2 className="w-3 h-3" /> Clear
            </button>
          </div>
        </div>

        {/* Notification List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {roleFiltered.length === 0 ? (
            <div className="text-center py-12 space-y-3 text-[#2D2D2D]/60">
              <div className="w-12 h-12 rounded-full bg-[#F4F1EC] border border-[#B68A4C]/20 mx-auto flex items-center justify-center text-[#B68A4C]">
                <Bell className="w-6 h-6" />
              </div>
              <p className="font-serif text-base font-semibold text-[#2D2D2D]">All caught up!</p>
              <p className="text-xs">No active notifications for your role at this time.</p>
            </div>
          ) : (
            roleFiltered.map((notif) => (
              <div
                key={notif.id}
                onClick={() => onToggleRead(notif.id)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer relative shadow-2xs ${
                  notif.read
                    ? 'bg-[#FAF8F5] border-[#B68A4C]/15 opacity-75'
                    : 'bg-[#F4F1EC] border-[#8B5E34]/40 ring-1 ring-[#8B5E34]/15'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-[#FAF8F5] border border-[#B68A4C]/20 shrink-0 shadow-2xs">
                    {getIcon(notif.type)}
                  </div>

                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex justify-between items-baseline">
                      <h4 className="font-serif font-bold text-xs text-[#2D2D2D] truncate">
                        {notif.title}
                      </h4>
                      <span className="text-[9px] text-[#8B5E34] font-medium shrink-0 ml-2">
                        {notif.timestamp}
                      </span>
                    </div>

                    <p className="text-xs text-[#2D2D2D]/80 leading-relaxed">
                      {notif.message}
                    </p>

                    {!notif.read && (
                      <span className="inline-block text-[9px] font-bold text-[#8B5E34] uppercase tracking-wider mt-1">
                        ● Unread
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-[#FAF8F5] border-t border-[#B68A4C]/20 text-center">
          <p className="text-[10px] text-[#2D2D2D]/60">
            True Lengths Real-time Push Alert System • System Operational
          </p>
        </div>

      </div>
    </div>
  );
};
