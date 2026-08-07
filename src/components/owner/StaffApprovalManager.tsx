import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { UserProfile } from '../../types';
import {
  ShieldCheck,
  UserCheck,
  UserX,
  Clock,
  Key,
  Copy,
  Check,
  Users,
  AlertCircle,
  X,
  Sparkles,
  Scissors
} from 'lucide-react';

interface StaffApprovalManagerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const StaffApprovalManager: React.FC<StaffApprovalManagerProps> = ({ isOpen, onClose }) => {
  const {
    userProfile,
    pendingStaffList,
    allProfiles,
    approveStaffAccount,
    disableUserAccount
  } = useAuth();

  const [copiedCode, setCopiedCode] = useState(false);
  const [actionMsg, setActionMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const showToast = (msg: string) => {
    setActionMsg(msg);
    setTimeout(() => setActionMsg(null), 3000);
  };

  const handleApprove = async (uid: string, name: string) => {
    try {
      await approveStaffAccount(uid);
      showToast(`Approved stylist account for ${name}! 🎉`);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDisable = async (uid: string, name: string) => {
    if (confirm(`Are you sure you want to disable access for ${name}?`)) {
      try {
        await disableUserAccount(uid);
        showToast(`Account for ${name} has been disabled.`);
      } catch (err: any) {
        alert(err.message);
      }
    }
  };

  const copyInviteCode = () => {
    navigator.clipboard.writeText('TL-STYLIST-VIP');
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2500);
  };

  const activeStaff = allProfiles.filter((p) => p.role === 'stylist' && p.status === 'active');
  const activeCustomers = allProfiles.filter((p) => p.role === 'customer');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-[#FAF8F5] border border-[#B68A4C]/30 w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-[#2D2D2D] via-[#3A332C] to-[#2D2D2D] text-[#FAF8F5] p-5 sm:p-6 flex items-center justify-between border-b border-[#B68A4C]/30">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-[#B68A4C]/20 border border-[#B68A4C]/40 flex items-center justify-center text-[#B68A4C]">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-serif text-lg sm:text-xl font-bold tracking-wide flex items-center gap-2">
                Staff & Access Management <Sparkles className="w-4 h-4 text-[#B68A4C]" />
              </h2>
              <p className="text-xs text-[#FAF8F5]/70">Review stylist registration requests & role access controls</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/10 text-[#FAF8F5]/80 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Toast */}
        {actionMsg && (
          <div className="bg-[#8B5E34] text-white text-xs font-semibold px-4 py-2 text-center flex items-center justify-center gap-2">
            <Check className="w-4 h-4 text-[#B68A4C]" />
            <span>{actionMsg}</span>
          </div>
        )}

        {/* Content Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1">
          
          {/* Owner VIP Invite Code Card */}
          <div className="bg-gradient-to-r from-[#2D2D2D] to-[#3A332C] p-4 rounded-2xl border border-[#B68A4C]/40 text-[#FAF8F5] flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="space-y-1 text-center sm:text-left">
              <span className="text-[10px] uppercase tracking-widest text-[#B68A4C] font-bold flex items-center justify-center sm:justify-start gap-1">
                <Key className="w-3 h-3" /> Owner Staff Invitation Key
              </span>
              <p className="text-xs font-bold font-mono tracking-wider text-white">
                Code: TL-STYLIST-VIP
              </p>
              <p className="text-[11px] text-gray-300">
                Provide this key so stylists can register. New stylists stay pending until you approve them below.
              </p>
            </div>

            <button
              onClick={copyInviteCode}
              className="px-4 py-2 rounded-xl bg-[#8B5E34] hover:bg-[#B68A4C] text-white text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shrink-0"
            >
              {copiedCode ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
              <span>{copiedCode ? 'Code Copied!' : 'Copy VIP Code'}</span>
            </button>
          </div>

          {/* SECTION 1: PENDING STYLIST REQUESTS */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-serif font-bold text-[#2D2D2D] text-base flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#8B5E34]" />
                Pending Stylist Applications ({pendingStaffList.length})
              </h3>
              {pendingStaffList.length > 0 && (
                <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full animate-pulse">
                  Action Required
                </span>
              )}
            </div>

            {pendingStaffList.length === 0 ? (
              <div className="bg-[#F4F1EC] p-4 rounded-2xl text-center border border-[#B68A4C]/20 text-xs text-gray-600">
                No pending stylist requests at this time. All staff accounts are up to date! ✨
              </div>
            ) : (
              <div className="space-y-3">
                {pendingStaffList.map((staff) => (
                  <div
                    key={staff.id}
                    className="p-4 rounded-2xl bg-white border border-[#B68A4C]/30 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3"
                  >
                    <div className="flex items-center space-x-3 w-full sm:w-auto">
                      <div className="w-10 h-10 rounded-full overflow-hidden border border-[#B68A4C] bg-[#2D2D2D] text-white flex items-center justify-center font-bold text-sm shrink-0">
                        {staff.avatar ? (
                          <img src={staff.avatar} alt={staff.name} className="w-full h-full object-cover" />
                        ) : (
                          staff.name.charAt(0)
                        )}
                      </div>
                      <div>
                        <h4 className="font-serif font-bold text-[#2D2D2D] text-sm">{staff.name}</h4>
                        <p className="text-xs text-gray-500">{staff.email} • {staff.phone || 'No phone'}</p>
                        <p className="text-[10px] text-amber-700 font-semibold mt-0.5">
                          Status: Pending Approval • Salon: {staff.salonId || 'truelengths-main'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
                      <button
                        onClick={() => handleApprove(staff.id, staff.name)}
                        className="px-3 py-1.5 rounded-xl bg-[#8B5E34] text-white text-xs font-bold hover:bg-[#B68A4C] transition-colors cursor-pointer flex items-center gap-1"
                      >
                        <UserCheck className="w-3.5 h-3.5" /> Approve
                      </button>

                      <button
                        onClick={() => handleDisable(staff.id, staff.name)}
                        className="px-3 py-1.5 rounded-xl bg-gray-200 text-gray-700 hover:bg-red-100 hover:text-red-700 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
                      >
                        <UserX className="w-3.5 h-3.5" /> Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* SECTION 2: ACTIVE SALON STYLISTS */}
          <div className="space-y-3">
            <h3 className="font-serif font-bold text-[#2D2D2D] text-base flex items-center gap-2">
              <Scissors className="w-4 h-4 text-[#8B5E34]" />
              Active Salon Stylists ({activeStaff.length})
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {activeStaff.map((st) => (
                <div
                  key={st.id}
                  className="p-3.5 rounded-2xl bg-[#F4F1EC] border border-[#B68A4C]/20 flex items-center justify-between"
                >
                  <div className="flex items-center space-x-2.5">
                    <div className="w-9 h-9 rounded-full overflow-hidden border border-[#B68A4C] bg-[#2D2D2D] text-white flex items-center justify-center font-bold text-xs shrink-0">
                      <img src={st.avatar} alt={st.name} className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <h5 className="font-serif font-bold text-xs text-[#2D2D2D]">{st.name}</h5>
                      <p className="text-[10px] text-[#8B5E34]">{st.email}</p>
                    </div>
                  </div>
                  <span className="bg-emerald-100 text-emerald-800 text-[9px] font-bold px-2 py-0.5 rounded-full">
                    Approved
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* SECTION 3: REGISTERED CLIENTS OVERVIEW */}
          <div className="space-y-3">
            <h3 className="font-serif font-bold text-[#2D2D2D] text-base flex items-center gap-2">
              <Users className="w-4 h-4 text-[#8B5E34]" />
              Registered Customer Accounts ({activeCustomers.length})
            </h3>

            <div className="bg-white border border-[#B68A4C]/20 rounded-2xl p-3 text-xs space-y-2 max-h-40 overflow-y-auto">
              {activeCustomers.map((cust) => (
                <div key={cust.id} className="flex items-center justify-between py-1 border-b border-gray-100 last:border-0">
                  <div className="flex items-center space-x-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    <span className="font-bold text-[#2D2D2D]">{cust.name}</span>
                    <span className="text-gray-500">({cust.email})</span>
                  </div>
                  <span className="text-[#8B5E34] font-semibold text-[10px]">
                    {cust.hairType || 'Customer'} • {cust.loyaltyTier || 'Gold'}
                  </span>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
