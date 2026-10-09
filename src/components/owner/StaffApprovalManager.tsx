import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  ShieldCheck,
  UserCheck,
  UserX,
  Clock,
  Key,
  Check,
  Users,
  X,
  Sparkles,
  Scissors,
  UserPlus,
  Copy,
  Ban,
  Mail,
  Phone
} from 'lucide-react';

interface StaffApprovalManagerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const StaffApprovalManager: React.FC<StaffApprovalManagerProps> = ({ isOpen, onClose }) => {
  const {
    pendingStaffList,
    allProfiles,
    staffInvites,
    approveStaffAccount,
    disableUserAccount,
    createStaffInvite,
    revokeStaffInvite
  } = useAuth();

  const [actionMsg, setActionMsg] = useState<string | null>(null);
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [inviteName, setInviteName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [invitePhone, setInvitePhone] = useState('');
  const [createdInviteCode, setCreatedInviteCode] = useState<string | null>(null);
  const [isCreatingInvite, setIsCreatingInvite] = useState(false);

  if (!isOpen) return null;

  const showToast = (msg: string) => {
    setActionMsg(msg);
    setTimeout(() => setActionMsg(null), 3000);
  };

  const handleApprove = async (uid: string, name: string) => {
    try {
      await approveStaffAccount(uid);
      showToast(`Approved stylist account for ${name}. Saved to Firestore.`);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDisable = async (uid: string, name: string) => {
    if (confirm(`Are you sure you want to disable access for ${name}?`)) {
      try {
        await disableUserAccount(uid);
        showToast(`Account for ${name} has been disabled in Firestore.`);
      } catch (err: any) {
        alert(err.message);
      }
    }
  };

  const invitationLink = (code: string) => {
    const url = new URL(window.location.href);
    url.search = '';
    url.hash = '';
    url.searchParams.set('staffInvite', code);
    return url.toString();
  };

  const handleCreateInvite = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsCreatingInvite(true);
    try {
      const invite = await createStaffInvite({
        name: inviteName,
        email: inviteEmail,
        phone: invitePhone,
      });
      setCreatedInviteCode(invite.inviteId);
      setInviteName('');
      setInviteEmail('');
      setInvitePhone('');
      showToast(`Invitation created for ${invite.name}.`);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsCreatingInvite(false);
    }
  };

  const copyInvitation = async (code: string) => {
    const message = `You have been invited to join True Lengths as a stylist. Register here: ${invitationLink(code)}\nInvitation code: ${code}`;
    try {
      await navigator.clipboard.writeText(message);
      showToast('Stylist invitation copied.');
    } catch {
      window.prompt('Copy this stylist invitation:', message);
    }
  };

  const handleRevokeInvite = async (inviteId: string) => {
    if (!confirm('Revoke this stylist invitation? It will no longer work.')) return;
    try {
      await revokeStaffInvite(inviteId);
      showToast('Stylist invitation revoked.');
    } catch (err: any) {
      alert(err.message);
    }
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
          
          {/* Staff onboarding note */}
          <div className="bg-gradient-to-r from-[#2D2D2D] to-[#3A332C] p-4 rounded-2xl border border-[#B68A4C]/40 text-[#FAF8F5]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1">
              <span className="text-[10px] uppercase tracking-widest text-[#B68A4C] font-bold flex items-center gap-1">
                <Key className="w-3 h-3" /> Staff Onboarding
              </span>
              <p className="text-xs text-gray-300 leading-relaxed">
                Invite each stylist here. They register with the one-time code and remain <strong className="text-white">pending</strong> until you approve them.
              </p>
              </div>
              <button
                type="button"
                onClick={() => setShowInviteForm((visible) => !visible)}
                className="shrink-0 px-4 py-2 rounded-xl bg-[#B68A4C] hover:bg-[#8B5E34] text-white text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
              >
                <UserPlus className="w-4 h-4" /> Add Stylist
              </button>
            </div>
          </div>

          {showInviteForm && (
            <div className="bg-white border border-[#B68A4C]/30 rounded-2xl p-4 space-y-4 shadow-xs">
              <div>
                <h3 className="font-serif font-bold text-[#2D2D2D]">Invite a Stylist</h3>
                <p className="text-[11px] text-gray-500">Enter the exact email the stylist will use to register.</p>
              </div>
              <form onSubmit={handleCreateInvite} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className="text-xs font-semibold text-[#2D2D2D]">
                  Full Name
                  <input
                    value={inviteName}
                    onChange={(event) => setInviteName(event.target.value)}
                    required
                    className="mt-1 w-full px-3 py-2 border border-[#B68A4C]/30 rounded-xl font-normal focus:outline-none focus:ring-2 focus:ring-[#8B5E34]"
                    placeholder="Stylist full name"
                  />
                </label>
                <label className="text-xs font-semibold text-[#2D2D2D]">
                  Email
                  <div className="relative mt-1">
                    <Mail className="w-4 h-4 absolute left-3 top-2.5 text-[#8B5E34]" />
                    <input
                      type="email"
                      value={inviteEmail}
                      onChange={(event) => setInviteEmail(event.target.value)}
                      required
                      className="w-full pl-9 pr-3 py-2 border border-[#B68A4C]/30 rounded-xl font-normal focus:outline-none focus:ring-2 focus:ring-[#8B5E34]"
                      placeholder="stylist@example.com"
                    />
                  </div>
                </label>
                <label className="text-xs font-semibold text-[#2D2D2D] sm:col-span-2">
                  Phone (Optional)
                  <div className="relative mt-1">
                    <Phone className="w-4 h-4 absolute left-3 top-2.5 text-[#8B5E34]" />
                    <input
                      type="tel"
                      value={invitePhone}
                      onChange={(event) => setInvitePhone(event.target.value)}
                      className="w-full pl-9 pr-3 py-2 border border-[#B68A4C]/30 rounded-xl font-normal focus:outline-none focus:ring-2 focus:ring-[#8B5E34]"
                      placeholder="(555) 234-5678"
                    />
                  </div>
                </label>
                <button
                  type="submit"
                  disabled={isCreatingInvite}
                  className="sm:col-span-2 py-2.5 rounded-xl bg-[#8B5E34] hover:bg-[#B68A4C] disabled:opacity-60 text-white text-xs font-bold transition-colors flex items-center justify-center gap-2"
                >
                  <UserPlus className="w-4 h-4" />
                  {isCreatingInvite ? 'Creating Invitation…' : 'Create Stylist Invitation'}
                </button>
              </form>

              {createdInviteCode && (
                <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <p className="text-[10px] uppercase tracking-wide font-bold text-emerald-800">Invitation ready</p>
                    <p className="font-mono text-sm font-bold text-emerald-950">{createdInviteCode}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => copyInvitation(createdInviteCode)}
                    className="px-3 py-2 rounded-lg bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-1.5"
                  >
                    <Copy className="w-3.5 h-3.5" /> Copy Invite & Link
                  </button>
                </div>
              )}
            </div>
          )}

          {staffInvites.some((invite) => invite.status === 'pending') && (
            <div className="space-y-3">
              <h3 className="font-serif font-bold text-[#2D2D2D] text-base flex items-center gap-2">
                <Key className="w-4 h-4 text-[#8B5E34]" /> Pending Invitations
              </h3>
              <div className="space-y-2">
                {staffInvites.filter((invite) => invite.status === 'pending').map((invite) => (
                  <div key={invite.id} className="bg-white border border-[#B68A4C]/20 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <p className="text-xs font-bold text-[#2D2D2D]">{invite.name}</p>
                      <p className="text-[10px] text-gray-500">{invite.email} • <span className="font-mono">{invite.inviteId}</span></p>
                    </div>
                    <div className="flex gap-2">
                      <button type="button" onClick={() => copyInvitation(invite.inviteId)} className="px-2.5 py-1.5 rounded-lg bg-[#F4F1EC] text-[#8B5E34] text-[10px] font-bold flex items-center gap-1">
                        <Copy className="w-3 h-3" /> Copy
                      </button>
                      <button type="button" onClick={() => handleRevokeInvite(invite.id)} className="px-2.5 py-1.5 rounded-lg bg-red-50 text-red-700 text-[10px] font-bold flex items-center gap-1">
                        <Ban className="w-3 h-3" /> Revoke
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

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
