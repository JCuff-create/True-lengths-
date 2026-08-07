import React from 'react';
import { Clock, AlertTriangle, LogOut, RefreshCw } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface AccountPendingViewProps {
  status?: 'pending' | 'disabled' | 'invalid';
}

export const AccountPendingView: React.FC<AccountPendingViewProps> = ({ status = 'pending' }) => {
  const { userProfile, signOutUser } = useAuth();

  return (
    <div className="min-h-screen bg-[#FAF8F5] flex flex-col items-center justify-center p-6 text-[#2D2D2D]">
      <div className="max-w-lg w-full bg-white border border-[#B68A4C]/30 p-8 rounded-3xl shadow-2xl text-center space-y-6">
        
        {/* Icon Header */}
        <div className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center shadow-md bg-amber-50 border border-amber-200 text-amber-700">
          {status === 'pending' ? (
            <Clock className="w-8 h-8 text-[#8B5E34] animate-spin-slow" />
          ) : (
            <AlertTriangle className="w-8 h-8 text-red-600" />
          )}
        </div>

        {/* Content */}
        {status === 'pending' ? (
          <div className="space-y-3">
            <span className="bg-[#B68A4C]/15 text-[#8B5E34] border border-[#B68A4C]/30 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
              Staff Account Pending Approval
            </span>
            <h2 className="font-serif text-2xl font-bold text-[#2D2D2D]">
              Welcome, {userProfile?.name || 'Stylist'}!
            </h2>
            <p className="text-xs text-gray-600 leading-relaxed max-w-md mx-auto">
              Your registration as a <strong>True Lengths Stylist</strong> has been received. To protect salon service standards and schedule integrity, staff accounts must be reviewed and activated by <strong>Master Stylist & Owner Carolyn R.</strong>
            </p>
            <div className="bg-[#FAF8F5] p-3 rounded-2xl border border-[#B68A4C]/20 text-[11px] text-[#8B5E34] text-left space-y-1">
              <p>• <strong>Account Email:</strong> {userProfile?.email}</p>
              <p>• <strong>Role Requested:</strong> Stylist (Staff)</p>
              <p>• <strong>Salon ID:</strong> {userProfile?.salonId || 'truelengths-main'}</p>
              <p>• <strong>Status:</strong> Pending Approval</p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <span className="bg-red-100 text-red-800 border border-red-200 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
              Account Restricted
            </span>
            <h2 className="font-serif text-2xl font-bold text-[#2D2D2D]">
              Access Disabled
            </h2>
            <p className="text-xs text-gray-600 leading-relaxed max-w-md mx-auto">
              Your account permissions have been disabled or restricted by salon administration. If you believe this is an error, please contact Carolyn R. directly.
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={() => window.location.reload()}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#FAF8F5] border border-[#B68A4C]/30 text-xs font-bold text-[#8B5E34] hover:bg-gray-100 transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" /> Check Status
          </button>

          <button
            onClick={signOutUser}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#2D2D2D] text-[#FAF8F5] text-xs font-bold hover:bg-black transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            <LogOut className="w-4 h-4 text-[#B68A4C]" /> Sign Out
          </button>
        </div>

      </div>
    </div>
  );
};
