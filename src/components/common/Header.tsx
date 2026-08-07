import React from 'react';
import { UserRole, UserProfile } from '../../types';
import { Crown, Scissors, User, Bell, ShieldCheck, LogOut, Lock } from 'lucide-react';

interface HeaderProps {
  currentRole: UserRole;
  currentUser: UserProfile;
  onHomeClick?: () => void;
  unreadCount?: number;
  onOpenNotifications?: () => void;
  onOpenProfileModal?: () => void;
  onOpenStaffApproval?: () => void;
  onSignOut?: () => void;
}

function RoleBadge({ role }: { role: UserRole }) {
  const label =
    role === 'customer' ? 'Customer Portal' : role === 'stylist' ? 'Stylist Portal' : 'Owner OS';
  const Icon = role === 'customer' ? User : role === 'stylist' ? Scissors : Crown;
  const activeClass =
    role === 'owner'
      ? 'bg-[#B68A4C] text-[#FAF8F5]'
      : 'bg-[#8B5E34] text-[#FAF8F5]';

  return (
    <div
      className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-full font-medium text-xs ${activeClass} shadow-sm`}
      title="Your account role is locked and cannot be switched"
    >
      <Lock className="w-3 h-3 opacity-80" />
      <Icon className="w-3.5 h-3.5" />
      <span>{label}</span>
    </div>
  );
}

export const Header: React.FC<HeaderProps> = ({
  currentRole,
  currentUser,
  onHomeClick,
  unreadCount = 0,
  onOpenNotifications,
  onOpenProfileModal,
  onOpenStaffApproval,
  onSignOut,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-[#FAF8F5]/95 backdrop-blur-md border-b border-[#B68A4C]/15 px-3 sm:px-6 py-2.5 sm:py-3 transition-colors shadow-xs">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
        
        {/* Salon Logo & Crest */}
        <button
          onClick={onHomeClick}
          className="flex items-center space-x-2 sm:space-x-3 text-left hover:opacity-85 transition-opacity cursor-pointer group focus:outline-none shrink-0"
          title="Return to main screen"
        >
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-tr from-[#8B5E34] via-[#B68A4C] to-[#D4AF37] p-[1px] shadow-sm group-hover:scale-105 transition-transform shrink-0">
            <div className="w-full h-full bg-[#FAF8F5] rounded-full flex items-center justify-center">
              <span className="font-serif text-[#8B5E34] font-bold text-sm sm:text-lg tracking-tighter">TL</span>
            </div>
          </div>
          <div className="min-w-0">
            <h1 className="font-serif text-sm sm:text-xl font-bold tracking-tight text-[#2D2D2D] leading-tight truncate">
              TRUE LENGTHS
            </h1>
            <p className="text-[8px] sm:text-[10px] tracking-wider text-[#B68A4C] uppercase font-medium truncate">
              LUXURY HAIR CARE & SALON OS
            </p>
          </div>
        </button>

        {/* Locked role badge & actions — no portal switcher */}
        <div className="flex items-center space-x-1.5 sm:space-x-4 shrink-0">
          <div className="hidden sm:flex">
            <RoleBadge role={currentRole} />
          </div>
          <div className="sm:hidden flex items-center bg-[#F4F1EC] px-2 py-1 rounded-lg border border-[#B68A4C]/30 text-[11px] font-semibold text-[#8B5E34] capitalize">
            <Lock className="w-3 h-3 mr-1" />
            {currentRole}
          </div>

          {/* Notifications Bell */}
          <button
            onClick={onOpenNotifications}
            className="relative p-2 rounded-full hover:bg-[#F4F1EC] text-[#2D2D2D] transition-colors cursor-pointer group"
            title="Open Notification Center"
          >
            <Bell className="w-5 h-5 text-[#8B5E34] group-hover:scale-110 transition-transform" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-[#B68A4C] text-[#FAF8F5] text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center border border-[#FAF8F5]">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {/* Staff Management (Owner only) */}
          {currentRole === 'owner' && onOpenStaffApproval && (
            <button
              onClick={onOpenStaffApproval}
              className="p-2 rounded-full hover:bg-[#F4F1EC] text-[#8B5E34] transition-colors cursor-pointer"
              title="Staff Approval & Role Management"
            >
              <ShieldCheck className="w-5 h-5 text-[#8B5E34]" />
            </button>
          )}

          {/* User Profile Avatar */}
          <button
            onClick={onOpenProfileModal}
            className="flex items-center space-x-2 pl-2 border-l border-[#B68A4C]/20 hover:opacity-90 transition-all cursor-pointer group focus:outline-none"
            title="Click to view and edit profile"
          >
            <div className="relative">
              <div className="w-8 h-8 rounded-full overflow-hidden border border-[#B68A4C]/40 bg-[#8B5E34] text-white flex items-center justify-center font-bold text-xs shadow-xs group-hover:scale-105 transition-transform group-hover:border-[#8B5E34]">
                {currentUser.avatar ? (
                  <img src={currentUser.avatar} alt={currentUser.name} className="w-full h-full object-cover" />
                ) : (
                  currentUser.name.charAt(0)
                )}
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 bg-[#8B5E34] text-white p-0.5 rounded-full border border-[#FAF8F5] shadow-xs group-hover:bg-[#B68A4C] transition-colors" title="Edit Profile">
                <User className="w-2.5 h-2.5" />
              </span>
            </div>
            <div className="hidden lg:block text-left">
              <p className="text-xs font-semibold text-[#2D2D2D] leading-none group-hover:text-[#8B5E34] transition-colors">{currentUser.name}</p>
              <p className="text-[10px] text-[#B68A4C] capitalize flex items-center gap-0.5">
                {currentUser.role === 'customer' ? 'Customer Profile' : currentUser.role}
              </p>
            </div>
          </button>

          {/* Sign Out Button */}
          {onSignOut && (
            <button
              onClick={onSignOut}
              className="p-2 rounded-full hover:bg-red-50 text-gray-500 hover:text-red-600 transition-colors cursor-pointer"
              title="Sign Out of Session"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}

        </div>

      </div>
    </header>
  );
};
