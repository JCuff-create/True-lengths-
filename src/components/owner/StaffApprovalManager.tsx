import React, { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { auth } from '../../lib/firebase';
import {
  ShieldCheck,
  UserCheck,
  UserX,
  Clock,
  Key,
  Copy,
  Check,
  Users,
  X,
  Sparkles,
  Scissors,
  RefreshCw,
  Ban,
  Eye,
  EyeOff,
} from 'lucide-react';

interface StaffApprovalManagerProps {
  isOpen: boolean;
  onClose: () => void;
}

type InviteMeta = {
  id: string;
  createdByEmail: string;
  createdAt: string;
  expiresAt: string;
  status: 'active' | 'revoked' | 'used';
  usedByUid?: string;
};

export const StaffApprovalManager: React.FC<StaffApprovalManagerProps> = ({ isOpen, onClose }) => {
  const {
    pendingStaffList,
    allProfiles,
    approveStaffAccount,
    disableUserAccount
  } = useAuth();

  const [copiedCode, setCopiedCode] = useState(false);
  const [actionMsg, setActionMsg] = useState<string | null>(null);
  const [invites, setInvites] = useState<InviteMeta[]>([]);
  const [latestCode, setLatestCode] = useState<string | null>(null);
  const [showCode, setShowCode] = useState(true);
  const [inviteBusy, setInviteBusy] = useState(false);

  const showToast = (msg: string) => {
    setActionMsg(msg);
    setTimeout(() => setActionMsg(null), 3000);
  };

  const getIdToken = async () => {
    const user = auth.currentUser;
    if (!user) throw new Error('You must be signed in as the salon owner.');
    return user.getIdToken();
  };

  const refreshInvites = useCallback(async () => {
    try {
      const idToken = await getIdToken();
      const res = await fetch('/api/invites/stylist', {
        headers: { Authorization: `Bearer ${idToken}` },
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to load invitations.');
      setInvites(json.invites || []);
    } catch (err: any) {
      console.warn('Invite list refresh:', err.message);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      void refreshInvites();
    } else {
      setLatestCode(null);
      setShowCode(true);
    }
  }, [isOpen, refreshInvites]);

  if (!isOpen) return null;

  const handleApprove = async (uid: string, name: string) => {
    try {
      await approveStaffAccount(uid);
      showToast(`Approved stylist account for ${name}!`);
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

  const handleGenerateInvite = async () => {
    setInviteBusy(true);
    try {
      const idToken = await getIdToken();
      const res = await fetch('/api/invites/stylist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to generate invite.');
      setLatestCode(json.code);
      setShowCode(true);
      showToast('New stylist invite generated. Share it privately.');
      await refreshInvites();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setInviteBusy(false);
    }
  };

  const handleRegenerate = async () => {
    if (!confirm('Revoke all active invites and create a new one?')) return;
    setInviteBusy(true);
    try {
      const idToken = await getIdToken();
      const res = await fetch('/api/invites/stylist/regenerate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to regenerate invite.');
      setLatestCode(json.code);
      setShowCode(true);
      showToast('Active invites revoked. New code ready to share.');
      await refreshInvites();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setInviteBusy(false);
    }
  };

  const handleRevoke = async (inviteId: string) => {
    setInviteBusy(true);
    try {
      const idToken = await getIdToken();
      const res = await fetch('/api/invites/stylist/revoke', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken, inviteId }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to revoke invite.');
      if (latestCode) setLatestCode(null);
      showToast('Invitation revoked.');
      await refreshInvites();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setInviteBusy(false);
    }
  };

  const copyInviteCode = async () => {
    if (!latestCode) return;
    await navigator.clipboard.writeText(latestCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2500);
  };

  const activeStaff = allProfiles.filter((p) => p.role === 'stylist' && p.status === 'active');
  const activeCustomers = allProfiles.filter((p) => p.role === 'customer');
  const activeInvites = invites.filter((i) => i.status === 'active');

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
          
          {/* Secure Owner Invitation Card */}
          <div className="bg-gradient-to-r from-[#2D2D2D] to-[#3A332C] p-4 rounded-2xl border border-[#B68A4C]/40 text-[#FAF8F5] space-y-3">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="space-y-1 text-center sm:text-left">
                <span className="text-[10px] uppercase tracking-widest text-[#B68A4C] font-bold flex items-center justify-center sm:justify-start gap-1">
                  <Key className="w-3 h-3" /> Secure Stylist Invitation
                </span>
                <p className="text-[11px] text-gray-300">
                  Codes are generated on the server, never hard-coded in the app. Share privately; new stylists stay pending until you approve them.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <button
                  onClick={handleGenerateInvite}
                  disabled={inviteBusy}
                  className="px-4 py-2 rounded-xl bg-[#8B5E34] hover:bg-[#B68A4C] text-white text-xs font-bold transition-all flex items-center gap-2 cursor-pointer disabled:opacity-60"
                >
                  <Key className="w-4 h-4" />
                  <span>{inviteBusy ? 'Working…' : 'Generate Invite'}</span>
                </button>
                <button
                  onClick={handleRegenerate}
                  disabled={inviteBusy}
                  className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-[#B68A4C] text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-60 border border-[#B68A4C]/40"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Regenerate
                </button>
              </div>
            </div>

            {latestCode && (
              <div className="bg-black/30 border border-[#B68A4C]/30 rounded-xl p-3 space-y-2">
                <p className="text-[10px] text-[#B68A4C] font-bold uppercase tracking-wider">
                  One-time display — copy and send securely
                </p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-xs font-mono tracking-wider text-white break-all">
                    {showCode ? latestCode : '••••••••••••••••••••'}
                  </code>
                  <button
                    type="button"
                    onClick={() => setShowCode((v) => !v)}
                    className="p-2 rounded-lg hover:bg-white/10 cursor-pointer"
                    title={showCode ? 'Hide code' : 'Show code'}
                  >
                    {showCode ? <EyeOff className="w-4 h-4 text-[#B68A4C]" /> : <Eye className="w-4 h-4 text-[#B68A4C]" />}
                  </button>
                  <button
                    onClick={copyInviteCode}
                    className="px-3 py-1.5 rounded-lg bg-[#8B5E34] hover:bg-[#B68A4C] text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedCode ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              </div>
            )}

            {activeInvites.length > 0 && (
              <div className="space-y-2 pt-1">
                <p className="text-[10px] uppercase tracking-widest text-[#B68A4C] font-bold">
                  Active invitations ({activeInvites.length})
                </p>
                {activeInvites.map((inv) => (
                  <div
                    key={inv.id}
                    className="flex items-center justify-between gap-2 bg-black/20 rounded-lg px-3 py-2 text-[11px]"
                  >
                    <div className="min-w-0">
                      <p className="font-mono text-white/90 truncate">ID {inv.id.slice(0, 8)}…</p>
                      <p className="text-gray-400">
                        Expires {new Date(inv.expiresAt).toLocaleString()}
                      </p>
                    </div>
                    <button
                      onClick={() => handleRevoke(inv.id)}
                      disabled={inviteBusy}
                      className="px-2.5 py-1 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-200 text-[10px] font-bold flex items-center gap-1 cursor-pointer disabled:opacity-60"
                    >
                      <Ban className="w-3 h-3" /> Revoke
                    </button>
                  </div>
                ))}
              </div>
            )}
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
