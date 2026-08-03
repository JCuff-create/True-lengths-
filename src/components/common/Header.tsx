import React from 'react';
import { UserRole, UserProfile } from '../../types';
import { Sparkles, Crown, Scissors, User, Bell, ShieldCheck, LogOut } from 'lucide-react';

interface HeaderProps {
  currentRole: UserRole;
  onRoleChange: (role: UserRole) => void;
  currentUser: UserProfile;
  onHomeClick?: () => void;
  unreadCount?: number;
  onOpenNotifications?: () => void;
  onOpenProfileModal?: () => void;
  onOpenStaffApproval?: () => void;
  onSignOut?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentRole,
  onRoleChange,
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

        {/* Role Selector Badge & Actions */}
        <div className="flex items-center space-x-1.5 sm:space-x-4 shrink-0">
          {/* Quick Role Switcher Buttons */}
          <div className="hidden md:flex items-center bg-[#F4F1EC] p-1 rounded-full border border-[#B68A4C]/20 text-xs">
            <button
              onClick={() => onRoleChange('customer')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-full font-medium transition-all ${
                currentRole === 'customer'
                  ? 'bg-[#8B5E34] text-[#FAF8F5] shadow-sm'
                  : 'text-[#2D2D2D] hover:text-[#8B5E34]'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>Customer</span>
            </button>

            <button
              onClick={() => onRoleChange('stylist')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-full font-medium transition-all ${
                currentRole === 'stylist'
                  ? 'bg-[#8B5E34] text-[#FAF8F5] shadow-sm'
                  : 'text-[#2D2D2D] hover:text-[#8B5E34]'
              }`}
            >
              <Scissors className="w-3.5 h-3.5" />
              <span>Stylist</span>
            </button>

            <button
              onClick={() => onRoleChange('owner')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-full font-medium transition-all ${
                currentRole === 'owner'
                  ? 'bg-[#B68A4C] text-[#FAF8F5] shadow-sm'
                  : 'text-[#2D2D2D] hover:text-[#B68A4C]'
              }`}
            >
              <Crown className="w-3.5 h-3.5" />
              <span>Owner OS</span>
            </button>
          </div>

          {/* Role Indicator Badge (Mobile) */}
          <div className="md:hidden flex items-center">
            <select
              value={currentRole}
              onChange={(e) => onRoleChange(e.target.value as UserRole)}
              className="bg-[#F4F1EC] text-[#8B5E34] font-semibold text-[11px] border border-[#B68A4C]/30 rounded-lg px-2 py-1 focus:outline-none cursor-pointer"
            >
              <option value="customer">View: Customer</option>
              <option value="stylist">View: Stylist</option>
              <option value="owner">View: Owner OS</option>
            </select>
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

          {/* Staff Management (Owner) */}
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
