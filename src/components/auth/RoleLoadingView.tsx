import React from 'react';
import { Sparkles, ShieldCheck } from 'lucide-react';

export const RoleLoadingView: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#FAF8F5] flex flex-col items-center justify-center p-6 text-[#2D2D2D]">
      <div className="max-w-md w-full bg-white border border-[#B68A4C]/30 p-8 rounded-3xl shadow-xl text-center space-y-6 animate-in fade-in zoom-in duration-300">
        
        {/* Logo Avatar */}
        <div className="relative mx-auto w-20 h-20">
          <div className="w-full h-full rounded-full bg-gradient-to-tr from-[#8B5E34] via-[#B68A4C] to-[#2D2D2D] p-1 shadow-md animate-pulse">
            <div className="w-full h-full bg-[#2D2D2D] rounded-full flex items-center justify-center text-[#B68A4C] font-serif font-bold text-2xl">
              TL
            </div>
          </div>
          <div className="absolute -bottom-1 -right-1 bg-[#8B5E34] text-white p-1.5 rounded-full border-2 border-white shadow-xs">
            <Sparkles className="w-4 h-4 text-[#B68A4C]" />
          </div>
        </div>

        {/* Text */}
        <div className="space-y-2">
          <h2 className="font-serif text-2xl font-bold text-[#2D2D2D]">
            True Lengths Salon OS
          </h2>
          <p className="text-xs text-[#8B5E34] font-medium flex items-center justify-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-[#B68A4C]" /> Verifying Role Permissions & Firestore Credentials...
          </p>
        </div>

        {/* Spinner Bar */}
        <div className="w-full bg-[#F4F1EC] h-2 rounded-full overflow-hidden border border-[#B68A4C]/20">
          <div className="bg-gradient-to-r from-[#8B5E34] via-[#B68A4C] to-[#8B5E34] h-full w-1/2 animate-[shimmer_1.5s_infinite] rounded-full"></div>
        </div>

        <p className="text-[11px] text-gray-500">
          Securing session with Firebase Authentication & Role Access Controls
        </p>

      </div>
    </div>
  );
};
