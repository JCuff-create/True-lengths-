import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types';
import {
  Sparkles,
  Lock,
  Mail,
  User,
  Phone,
  Scissors,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  ShieldCheck,
  UserPlus,
  Crown
} from 'lucide-react';

export const WelcomeAuthView: React.FC = () => {
  const {
    signIn,
    signUpCustomer,
    signUpStaff,
    demoQuickLogin,
    authError,
    clearError,
    loading
  } = useAuth();

  const [mode, setMode] = useState<'signin' | 'register_customer' | 'staff_login'>('signin');

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
        // First try standard staff sign in, if fails with user-not-found then offer staff registration
        try {
          await signIn(email, password);
        } catch (err: any) {
          if (fullName.trim()) {
            // Attempt staff sign up with invite code
            await signUpStaff({
              email,
              pass: password,
              name: fullName,
              phone,
              inviteCode
            });
          } else {
            throw err;
          }
        }
      }
    } catch (err) {
      console.error("Auth action error:", err);
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
              onClick={() => { setMode('staff_login'); clearError(); }}
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
              <span>Sign in with your email and password to access your appointments & rewards.</span>
            )}
            {mode === 'register_customer' && (
              <span>Create your customer account. (Receives 100 bonus loyalty points!)</span>
            )}
            {mode === 'staff_login' && (
              <span>Stylist & Salon Owner Portal. Stylists must be approved by Owner Carolyn R.</span>
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

          {/* Auth Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {(mode === 'register_customer' || (mode === 'staff_login' && fullName !== '')) && (
              <div>
                <label className="block text-xs font-semibold text-[#2D2D2D] mb-1">Full Name</label>
                <div className="relative">
                  <User className="w-4 h-4 text-[#8B5E34] absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required={mode === 'register_customer'}
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
                  placeholder={mode === 'staff_login' ? 'carolyn.owner@truelengths.com' : 'jasmine@example.com'}
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

            {mode === 'staff_login' && (
              <div className="pt-1">
                <label className="block text-xs font-semibold text-[#2D2D2D] mb-1">
                  Owner Staff VIP Invite Code (Optional)
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-[#B68A4C] absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value)}
                    placeholder="Enter TL-STYLIST-VIP to bypass review"
                    className="w-full pl-9 pr-3 py-2 bg-white border border-[#B68A4C]/30 rounded-xl text-xs text-[#2D2D2D] focus:outline-none focus:ring-2 focus:ring-[#8B5E34]"
                  />
                </div>
                <p className="text-[10px] text-gray-500 mt-1">
                  Unverified staff accounts enter a pending state awaiting Owner approval.
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
                  {mode === 'staff_login' && 'Staff Sign In / Register'}
                </>
              )}
            </button>

          </form>

          {/* Instant Quick Demo Switcher */}
          <div className="pt-4 border-t border-[#B68A4C]/20 space-y-3">
            <p className="text-center text-[11px] font-bold text-[#8B5E34] uppercase tracking-wider flex items-center justify-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-[#B68A4C]" /> Instant Role Demo Login
            </p>

            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => demoQuickLogin('customer')}
                className="p-2 rounded-xl bg-[#FAF8F5] border border-[#B68A4C]/30 hover:border-[#8B5E34] text-center transition-all cursor-pointer group"
              >
                <User className="w-4 h-4 text-[#8B5E34] mx-auto mb-1 group-hover:scale-110 transition-transform" />
                <span className="block text-[11px] font-bold text-[#2D2D2D]">Customer</span>
                <span className="block text-[9px] text-[#8B5E34]">Jasmine R.</span>
              </button>

              <button
                type="button"
                onClick={() => demoQuickLogin('stylist')}
                className="p-2 rounded-xl bg-[#FAF8F5] border border-[#B68A4C]/30 hover:border-[#8B5E34] text-center transition-all cursor-pointer group"
              >
                <Scissors className="w-4 h-4 text-[#8B5E34] mx-auto mb-1 group-hover:scale-110 transition-transform" />
                <span className="block text-[11px] font-bold text-[#2D2D2D]">Stylist</span>
                <span className="block text-[9px] text-[#8B5E34]">Carolyn R.</span>
              </button>

              <button
                type="button"
                onClick={() => demoQuickLogin('owner')}
                className="p-2 rounded-xl bg-[#2D2D2D] border border-[#B68A4C] text-center transition-all cursor-pointer group"
              >
                <Crown className="w-4 h-4 text-[#B68A4C] mx-auto mb-1 group-hover:scale-110 transition-transform" />
                <span className="block text-[11px] font-bold text-[#FAF8F5]">Owner</span>
                <span className="block text-[9px] text-[#B68A4C]">Carolyn R.</span>
              </button>
            </div>
          </div>

        </div>

        {/* Security Footer Note */}
        <p className="text-center text-[10px] text-gray-500 max-w-xs mx-auto">
          Protected by Firebase Role-Based Security Rules & Firestore Document Controls.
        </p>

      </div>
    </div>
  );
};
