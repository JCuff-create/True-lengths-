import React, { useState } from 'react';
import { UserProfile } from '../../types';
import { X, User, Edit3, Check, Camera, Sparkles, Phone, Mail, Award, Scissors } from 'lucide-react';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile;
  allProfiles?: UserProfile[];
  onUpdateProfile: (updated: UserProfile) => void;
  onCreateProfile?: (newProfile: UserProfile) => void;
  onSelectProfile?: (profileId: string) => void;
  onDeleteProfile?: (profileId: string) => void;
}

const PRESET_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
  'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&w=300&q=80',
  'https://images.unsplash.com/photo-1589156280159-27698a70f29e?auto=format&fit=crop&w=300&q=80',
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=300&q=80',
  'https://images.unsplash.com/photo-1523824921871-d6f1a15151f1?auto=format&fit=crop&w=300&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80',
];

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

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onUpdateProfile,
}) => {
  // Edit State
  const [editName, setEditName] = useState(currentUser.name || '');
  const [editEmail, setEditEmail] = useState(currentUser.email || '');
  const [editPhone, setEditPhone] = useState(currentUser.phone || '');
  const [editAvatar, setEditAvatar] = useState(currentUser.avatar || PRESET_AVATARS[0]);
  const [editHairType, setEditHairType] = useState(currentUser.hairType || '4C - High Density Coily');
  const [editNotes, setEditNotes] = useState(currentUser.notes || '');

  const [toastMsg, setToastMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim()) return;

    const updated: UserProfile = {
      ...currentUser,
      name: editName.trim(),
      email: editEmail.trim(),
      phone: editPhone.trim(),
      avatar: editAvatar,
      hairType: editHairType,
      notes: editNotes.trim(),
    };

    onUpdateProfile(updated);
    showToast('Profile changes saved successfully! ✨');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setEditAvatar(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-[#FAF8F5] border border-[#B68A4C]/30 w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-[#2D2D2D] via-[#3A332C] to-[#2D2D2D] text-[#FAF8F5] p-5 sm:p-6 flex items-center justify-between border-b border-[#B68A4C]/30 relative">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-[#B68A4C]/20 border border-[#B68A4C]/40 flex items-center justify-center text-[#B68A4C]">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-serif text-lg sm:text-xl font-bold tracking-wide flex items-center gap-2">
                User Profile <Sparkles className="w-4 h-4 text-[#B68A4C]" />
              </h2>
              <p className="text-xs text-[#FAF8F5]/70">Edit and update profile details</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/10 text-[#FAF8F5]/80 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toast Alert */}
        {toastMsg && (
          <div className="bg-[#8B5E34] text-[#FAF8F5] text-xs font-semibold px-4 py-2 text-center flex items-center justify-center gap-2 animate-in fade-in">
            <Check className="w-4 h-4 text-[#B68A4C]" />
            <span>{toastMsg}</span>
          </div>
        )}

        {/* Body Area */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1">
          <form onSubmit={handleSaveEdit} className="space-y-5">
              
              {/* Profile Avatar & Header Card */}
              <div className="bg-[#F4F1EC] p-4 rounded-2xl border border-[#B68A4C]/20 flex flex-col sm:flex-row items-center gap-4">
                <div className="relative group">
                  <div className="w-20 h-20 rounded-full border-2 border-[#B68A4C] overflow-hidden bg-[#2D2D2D] shadow-md flex items-center justify-center text-white font-bold text-2xl">
                    {editAvatar ? (
                      <img src={editAvatar} alt={editName} className="w-full h-full object-cover" />
                    ) : (
                      editName.charAt(0) || 'C'
                    )}
                  </div>
                  <label className="absolute bottom-0 right-0 bg-[#8B5E34] text-white p-1.5 rounded-full shadow-md cursor-pointer hover:bg-[#B68A4C] transition-colors">
                    <Camera className="w-3.5 h-3.5" />
                    <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
                  </label>
                </div>

                <div className="flex-1 text-center sm:text-left space-y-1">
                  <div className="flex items-center justify-center sm:justify-start gap-2">
                    <h3 className="font-serif font-bold text-[#2D2D2D] text-lg">{currentUser.name}</h3>
                    <span className="bg-[#B68A4C]/15 text-[#8B5E34] border border-[#B68A4C]/30 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                      {currentUser.loyaltyTier || 'Gold'} Member
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 flex items-center justify-center sm:justify-start gap-1">
                    <Mail className="w-3 h-3 text-[#8B5E34]" /> {currentUser.email}
                  </p>
                  <p className="text-xs text-[#8B5E34] flex items-center justify-center sm:justify-start gap-1 font-medium">
                    <Award className="w-3.5 h-3.5" /> {currentUser.loyaltyPoints || 0} Salon Points Available
                  </p>
                </div>
              </div>

              {/* Preset Avatar Selection */}
              <div>
                <label className="block text-xs font-semibold text-[#2D2D2D] mb-1.5">
                  Select Preset Photo Avatar
                </label>
                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                  {PRESET_AVATARS.map((url, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setEditAvatar(url)}
                      className={`w-10 h-10 rounded-full overflow-hidden border-2 transition-all cursor-pointer shrink-0 ${
                        editAvatar === url ? 'border-[#8B5E34] scale-110 shadow-sm' : 'border-transparent opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img src={url} alt={`Preset ${i}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Form Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#2D2D2D] mb-1">Full Name</label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-white border border-[#B68A4C]/30 rounded-xl text-xs text-[#2D2D2D] focus:outline-none focus:ring-2 focus:ring-[#8B5E34]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#2D2D2D] mb-1">Email Address</label>
                  <input
                    type="email"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-white border border-[#B68A4C]/30 rounded-xl text-xs text-[#2D2D2D] focus:outline-none focus:ring-2 focus:ring-[#8B5E34]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#2D2D2D] mb-1">Phone Number</label>
                  <input
                    type="tel"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    placeholder="(555) 000-0000"
                    className="w-full px-3 py-2 bg-white border border-[#B68A4C]/30 rounded-xl text-xs text-[#2D2D2D] focus:outline-none focus:ring-2 focus:ring-[#8B5E34]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#2D2D2D] mb-1">Hair Type / Texture</label>
                  <select
                    value={editHairType}
                    onChange={(e) => setEditHairType(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-[#B68A4C]/30 rounded-xl text-xs text-[#2D2D2D] focus:outline-none focus:ring-2 focus:ring-[#8B5E34] cursor-pointer"
                  >
                    {HAIR_TYPES.map((type) => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#2D2D2D] mb-1">Custom Avatar URL (Optional)</label>
                <input
                  type="url"
                  value={editAvatar}
                  onChange={(e) => setEditAvatar(e.target.value)}
                  placeholder="https://..."
                  className="w-full px-3 py-2 bg-white border border-[#B68A4C]/30 rounded-xl text-xs text-[#2D2D2D] focus:outline-none focus:ring-2 focus:ring-[#8B5E34]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#2D2D2D] mb-1">Styling Preferences & Hair Goals</label>
                <textarea
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  rows={2}
                  placeholder="e.g. Sensitive scalp, loves silk presses with steam treatments, natural length goals..."
                  className="w-full px-3 py-2 bg-white border border-[#B68A4C]/30 rounded-xl text-xs text-[#2D2D2D] focus:outline-none focus:ring-2 focus:ring-[#8B5E34]"
                />
              </div>

              <div className="pt-2 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#8B5E34] to-[#B68A4C] text-[#FAF8F5] text-xs font-bold shadow-md hover:opacity-90 cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" /> Save Profile Changes
                </button>
              </div>

            </form>

        </div>

      </div>
    </div>
  );
};
