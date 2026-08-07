import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { STYLIST_INVITE_CODE } from '../../lib/roles';
import {
  Sparkles,
  Lock,
  Mail,
  User,
  Phone,
  AlertCircle,
  KeyRound,
  ShieldCheck,
  Scissors,
} from 'lucide-react';

export const WelcomeAuthView: React.FC = () => {
  const {
    signIn,
    signUpCustomer,
    signUpStaff,
    authError,
    clearError,
    loading
  } = useAuth();

  const [mode, setMode] = useState<'signin' | 'register_customer' | 'staff_login'>('signin');
  const [staffMode, setStaffMode] = useState<'signin' | 'register'>('signin');

  // Form Fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [hairType, setHairType] = useState('4C - High Density Coily');
  const [inviteCode, setInviteCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const HAIR_TYPES = [
    '4C - High Density Coily',
    '4B - Kinky Coily',
    '4A - Soft Coily',
    '3C - Deep Curls',
    '3B/3A - Curly / Waves',
    'Locs & Sisterlocks',
    'Relaxed / Straightened',
    'Transitioning to Natural'
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    clearError();

    try {
      if (mode === 'signin') {
        await signIn(email, password);
      } else if (mode === 'register_customer') {
        await signUpCustomer({
          email,
          pass: password,
          name: fullName,
          phone,
          hairType
        });
      } else if (mode === 'staff_login') {
        if (staffMode === 'signin') {
          await signIn(email, password);
        } else {
          await signUpStaff({
            email,
            pass: password,
            name: fullName,
            phone,
            inviteCode
          });
        }
      }
    } catch (err) {
      console.error('Auth action error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      
      {/* Background Decorative Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-gradient-to-b from-[#B68A4C]/10 via-[#8B5E34]/5 to-transparent blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 space-y-6">
        
        {/* Salon Branding Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#2D2D2D] border-2 border-[#B68A4C] shadow-lg text-[#B68A4C] font-serif font-bold text-2xl tracking-widest">
            TL
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight text-[#2D2D2D]">
            TRUE LENGTHS
          </h1>
          <p className="text-xs uppercase tracking-widest text-[#8B5E34] font-semibold">
            LUXURY HAIR CARE & SALON OS
          </p>
        </div>

        {/* Auth Box */}
        <div className="bg-white border border-[#B68A4C]/30 shadow-2xl rounded-3xl p-6 sm:p-8 space-y-6">
          
          {/* Navigation Tabs */}
          <div className="flex rounded-2xl bg-[#F4F1EC] p-1 border border-[#B68A4C]/20 text-xs font-semibold">
            <button
              type="button"
              onClick={() => { setMode('signin'); clearError(); }}
              className={`flex-1 py-2 rounded-xl transition-all cursor-pointer ${
                mode === 'signin'
                  ? 'bg-[#8B5E34] text-[#FAF8F5] shadow-sm'
                  : 'text-[#2D2D2D] hover:text-[#8B5E34]'
              }`}
            >
              Sign In
            </button>

            <button
              type="button"
              onClick={() => { setMode('register_customer'); clearError(); }}
              className={`flex-1 py-2 rounded-xl transition-all cursor-pointer ${
                mode === 'register_customer'
                  ? 'bg-[#8B5E34] text-[#FAF8F5] shadow-sm'
                  : 'text-[#2D2D2D] hover:text-[#8B5E34]'
              }`}
            >
              Create Account
            </button>

            <button
              type="button"
              onClick={() => { setMode('staff_login'); setStaffMode('signin'); clearError(); }}
              className={`flex-1 py-2 rounded-xl transition-all cursor-pointer ${
                mode === 'staff_login'
                  ? 'bg-[#2D2D2D] text-[#B68A4C] shadow-sm'
                  : 'text-[#2D2D2D] hover:text-[#8B5E34]'
              }`}
            >
              Staff Portal
            </button>
          </div>

          {/* Mode Description Banner */}
          <div className="bg-[#FAF8F5] p-3 rounded-2xl border border-[#B68A4C]/20 text-xs text-[#8B5E34] flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#B68A4C] shrink-0" />
            {mode === 'signin' && (
              <span>Sign in to open your permanently assigned portal (customer, stylist, or owner).</span>
            )}
            {mode === 'register_customer' && (
              <span>Create a customer account only. Stylist and owner roles cannot be chosen here.</span>
            )}
            {mode === 'staff_login' && (
              <span>Staff sign-in for existing stylists/owners, or stylist registration with an owner invite.</span>
            )}
          </div>

          {/* Error Banner */}
          {authError && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-xs p-3 rounded-2xl flex items-start justify-between gap-2 animate-in fade-in">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <span>{authError}</span>
              </div>
              <button
                type="button"
                onClick={clearError}
                className="text-red-500 hover:text-red-800 font-bold"
              >
                ✕
              </button>
            </div>
          )}

          {mode === 'staff_login' && (
            <div className="flex rounded-xl bg-[#F4F1EC] p-1 border border-[#B68A4C]/15 text-[11px] font-semibold">
              <button
                type="button"
                onClick={() => { setStaffMode('signin'); clearError(); }}
                className={`flex-1 py-1.5 rounded-lg cursor-pointer ${
                  staffMode === 'signin' ? 'bg-white text-[#2D2D2D] shadow-sm' : 'text-[#8B5E34]'
                }`}
              >
                Staff Sign In
              </button>
              <button
                type="button"
                onClick={() => { setStaffMode('register'); clearError(); }}
                className={`flex-1 py-1.5 rounded-lg cursor-pointer ${
                  staffMode === 'register' ? 'bg-white text-[#2D2D2D] shadow-sm' : 'text-[#8B5E34]'
                }`}
              >
                Stylist Invite Signup
              </button>
            </div>
          )}

          {/* Auth Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {(mode === 'register_customer' || (mode === 'staff_login' && staffMode === 'register')) && (
              <div>
                <label className="block text-xs font-semibold text-[#2D2D2D] mb-1">Full Name</label>
                <div className="relative">
                  <User className="w-4 h-4 text-[#8B5E34] absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    placeholder="e.g. Jasmine Taylor"
                    className="w-full pl-9 pr-3 py-2 bg-white border border-[#B68A4C]/30 rounded-xl text-xs text-[#2D2D2D] focus:outline-none focus:ring-2 focus:ring-[#8B5E34]"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-[#2D2D2D] mb-1">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#8B5E34] absolute left-3 top-2.5" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder={mode === 'staff_login' ? 'stylist@truelengths.com' : 'jasmine@example.com'}
                  className="w-full pl-9 pr-3 py-2 bg-white border border-[#B68A4C]/30 rounded-xl text-xs text-[#2D2D2D] focus:outline-none focus:ring-2 focus:ring-[#8B5E34]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#2D2D2D] mb-1">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#8B5E34] absolute left-3 top-2.5" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2 bg-white border border-[#B68A4C]/30 rounded-xl text-xs text-[#2D2D2D] focus:outline-none focus:ring-2 focus:ring-[#8B5E34]"
                />
              </div>
            </div>

            {mode === 'register_customer' && (
              <>
                <div>
                  <label className="block text-xs font-semibold text-[#2D2D2D] mb-1">Phone Number (Optional)</label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-[#8B5E34] absolute left-3 top-2.5" />
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="(555) 234-5678"
                      className="w-full pl-9 pr-3 py-2 bg-white border border-[#B68A4C]/30 rounded-xl text-xs text-[#2D2D2D] focus:outline-none focus:ring-2 focus:ring-[#8B5E34]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#2D2D2D] mb-1">Hair Type / Texture</label>
                  <select
                    value={hairType}
                    onChange={(e) => setHairType(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-[#B68A4C]/30 rounded-xl text-xs text-[#2D2D2D] focus:outline-none focus:ring-2 focus:ring-[#8B5E34] cursor-pointer"
                  >
                    {HAIR_TYPES.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
              </>
            )}

            {mode === 'staff_login' && staffMode === 'register' && (
              <div className="pt-1 space-y-2">
                <label className="block text-xs font-semibold text-[#2D2D2D] mb-1">
                  Owner Stylist Invite Code (Required)
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-[#B68A4C] absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value)}
                    required
                    placeholder={STYLIST_INVITE_CODE}
                    className="w-full pl-9 pr-3 py-2 bg-white border border-[#B68A4C]/30 rounded-xl text-xs text-[#2D2D2D] focus:outline-none focus:ring-2 focus:ring-[#8B5E34]"
                  />
                </div>
                <p className="text-[10px] text-gray-500 flex items-start gap-1">
                  <Scissors className="w-3 h-3 mt-0.5 shrink-0 text-[#8B5E34]" />
                  Creates a stylist account in pending status. Owner Carolyn R. must approve before portal access. Owner accounts cannot be created here.
                </p>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting || loading}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#8B5E34] to-[#B68A4C] text-[#FAF8F5] text-xs font-bold shadow-md hover:opacity-95 transition-all cursor-pointer flex items-center justify-center gap-2 mt-2"
            >
              {isSubmitting ? (
                <span>Authenticating...</span>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  {mode === 'signin' && 'Sign In'}
                  {mode === 'register_customer' && 'Create Customer Account'}
                  {mode === 'staff_login' && staffMode === 'signin' && 'Staff Sign In'}
                  {mode === 'staff_login' && staffMode === 'register' && 'Request Stylist Access'}
                </>
              )}
            </button>

          </form>

        </div>

        {/* Security Footer Note */}
        <p className="text-center text-[10px] text-gray-500 max-w-xs mx-auto">
          Roles are locked in Firestore after login. Protected by Firebase Authentication & security rules.
        </p>

      </div>
    </div>
  );
};
