import React, { useState, useEffect, useRef } from 'react';
import { Appointment, HairFormula, Stylist } from '../../types';
import { Clock, Scissors, Check, Play, Pause, RotateCcw, FileText, User, Edit3, Save, X, Camera, CheckCircle, Sparkles, Upload } from 'lucide-react';

interface StylistScheduleProps {
  stylist: Stylist;
  appointments: Appointment[];
  formulas: HairFormula[];
  onOpenFormula: (clientId: string, clientName: string) => void;
  onUpdateStatus: (appointmentId: string, status: 'upcoming' | 'in_progress' | 'completed') => void;
  onUpdateStylist?: (updatedStylist: Stylist) => void;
}

const PRESET_AVATARS = [
  { label: 'Carolyn R.', url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=250' },
  { label: 'Studio Glam', url: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=250' },
  { label: 'Luxury Luxe', url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250' },
  { label: 'Modern Master', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=250' },
];

export const StylistSchedule: React.FC<StylistScheduleProps> = ({
  stylist,
  appointments,
  formulas,
  onOpenFormula,
  onUpdateStatus,
  onUpdateStylist,
}) => {
  const [currentStylist, setCurrentStylist] = useState<Stylist>(stylist);
  const [isEditingProfile, setIsEditingProfile] = useState<boolean>(false);

  // Edit Form Fields
  const [editName, setEditName] = useState<string>(stylist.name);
  const [editTitle, setEditTitle] = useState<string>(stylist.roleTitle);
  const [editCommission, setEditCommission] = useState<number>(Math.round(stylist.commissionRate * 100));
  const [editAvatar, setEditAvatar] = useState<string>(stylist.avatar);
  const [editBio, setEditBio] = useState<string>(stylist.bio || '');
  const [editSpecialties, setEditSpecialties] = useState<string>(stylist.specialties ? stylist.specialties.join(', ') : '');

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

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

  // Sync prop changes if stylist prop updates from outside
  useEffect(() => {
    setCurrentStylist(stylist);
  }, [stylist]);

  const handleOpenEdit = () => {
    setEditName(currentStylist.name);
    setEditTitle(currentStylist.roleTitle);
    setEditCommission(Math.round(currentStylist.commissionRate * 100));
    setEditAvatar(currentStylist.avatar);
    setEditBio(currentStylist.bio || '');
    setEditSpecialties(currentStylist.specialties ? currentStylist.specialties.join(', ') : '');
    setIsEditingProfile(true);
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: Stylist = {
      ...currentStylist,
      name: editName.trim() || currentStylist.name,
      roleTitle: editTitle.trim() || currentStylist.roleTitle,
      commissionRate: Math.min(Math.max(editCommission, 0), 100) / 100,
      avatar: editAvatar.trim() || currentStylist.avatar,
      bio: editBio.trim(),
      specialties: editSpecialties
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
    };

    setCurrentStylist(updated);
    if (onUpdateStylist) {
      onUpdateStylist(updated);
    }
    setIsEditingProfile(false);
    setToastMessage('Profile updated successfully!');
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Processing Timer State (e.g. 35 mins color processing)
  const [timerSeconds, setTimerSeconds] = useState<number>(35 * 60);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isTimerRunning && timerSeconds > 0) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => prev - 1);
      }, 1000);
    } else if (timerSeconds === 0) {
      setIsTimerRunning(false);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, timerSeconds]);

  const formatTimer = (totalSecs: number) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const myAppointments = appointments.filter((a) => a.stylistId === currentStylist.id || true);

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">

      {/* Success Toast Notification */}
      {toastMessage && (
        <div className="bg-emerald-900/90 border border-emerald-500/50 text-emerald-100 px-4 py-3 rounded-xl flex items-center justify-between shadow-lg animate-fade-in">
          <div className="flex items-center gap-2 text-xs font-semibold">
            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{toastMessage}</span>
          </div>
          <button onClick={() => setToastMessage(null)} className="text-emerald-300 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
      
      {/* STYLIST PROFILE HEADER */}
      <div className="bg-[#FAF8F5] border border-[#B68A4C]/25 p-4 sm:p-6 rounded-2xl shadow-xs transition-all relative">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          
          <div className="flex items-center space-x-3 sm:space-x-4">
            <div className="relative group cursor-pointer" onClick={handleOpenEdit} title="Click to edit profile photo">
              <img
                src={currentStylist.avatar}
                alt={currentStylist.name}
                className="w-14 h-14 sm:w-16 sm:h-16 rounded-full object-cover border-2 border-[#B68A4C] shadow-sm group-hover:opacity-85 transition-opacity"
              />
              <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera className="w-4 h-4 text-white" />
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-bold text-[#B68A4C] tracking-wider">
                  Stylist Portal
                </span>
                <span className="bg-[#B68A4C]/15 text-[#8B5E34] text-[10px] font-bold px-2 py-0.5 rounded-full border border-[#B68A4C]/20">
                  Editable Profile
                </span>
              </div>
              <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#2D2D2D]">
                {currentStylist.name}
              </h2>
              <p className="text-xs sm:text-sm text-[#8B5E34] font-medium">{currentStylist.roleTitle}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Commission Badge */}
            <div className="bg-[#F4F1EC] border border-[#B68A4C]/20 px-3.5 sm:px-4 py-2 rounded-xl text-right">
              <p className="text-[10px] text-[#2D2D2D]/60 uppercase font-bold">Commission Split</p>
              <p className="font-serif font-bold text-base sm:text-lg text-[#8B5E34]">
                {Math.round(currentStylist.commissionRate * 100)}%
              </p>
            </div>

            {/* Edit Profile Action Button */}
            <button
              onClick={handleOpenEdit}
              className="bg-[#8B5E34] hover:bg-[#7A5A3A] text-[#FAF8F5] text-xs font-bold px-3.5 py-2.5 rounded-xl border border-[#B68A4C]/40 shadow-xs transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
            >
              <Edit3 className="w-4 h-4" />
              <span>Edit Profile</span>
            </button>
          </div>
        </div>

        {/* Bio / Specialties Quick Row */}
        {(currentStylist.bio || (currentStylist.specialties && currentStylist.specialties.length > 0)) && (
          <div className="mt-4 pt-3 border-t border-[#B68A4C]/15 text-xs text-[#2D2D2D]/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            {currentStylist.bio && (
              <p className="italic line-clamp-1 max-w-xl">"{currentStylist.bio}"</p>
            )}
            {currentStylist.specialties && currentStylist.specialties.length > 0 && (
              <div className="flex flex-wrap gap-1 shrink-0">
                {currentStylist.specialties.slice(0, 3).map((spec, idx) => (
                  <span key={idx} className="bg-[#F4F1EC] text-[#8B5E34] text-[10px] font-bold px-2 py-0.5 rounded-md border border-[#B68A4C]/20">
                    {spec}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* EDIT PROFILE MODAL / EXPANDABLE CARD */}
      {isEditingProfile && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#FAF8F5] border border-[#B68A4C]/40 rounded-2xl max-w-lg w-full p-5 sm:p-6 shadow-2xl space-y-5 my-8">
            <div className="flex items-center justify-between border-b border-[#B68A4C]/20 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-[#8B5E34] text-[#FAF8F5] flex items-center justify-center">
                  <User className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-lg text-[#2D2D2D]">Edit Stylist Profile</h3>
                  <p className="text-xs text-[#8B5E34]">Update your public name, role, photo, and commission split</p>
                </div>
              </div>
              <button
                onClick={() => setIsEditingProfile(false)}
                className="p-1.5 rounded-lg hover:bg-[#F4F1EC] text-[#2D2D2D]/60 hover:text-[#2D2D2D] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4">
              
              {/* Photo & Presets */}
              <div className="space-y-2.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-[#8B5E34]">
                  Profile Photo
                </label>
                
                {/* Hidden File Input */}
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />

                <div className="flex flex-col sm:flex-row sm:items-center gap-3 bg-[#F4F1EC] p-3 rounded-xl border border-[#B68A4C]/25">
                  <div className="flex items-center gap-3 shrink-0">
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="relative group cursor-pointer"
                      title="Click to select image file"
                    >
                      <img
                        src={editAvatar}
                        alt="Preview"
                        className="w-14 h-14 rounded-full object-cover border-2 border-[#B68A4C] shrink-0 shadow-xs"
                        onError={(e) => {
                          (e.target as HTMLElement).setAttribute('src', 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=250');
                        }}
                      />
                      <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Camera className="w-4 h-4 text-white" />
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="bg-[#8B5E34] hover:bg-[#7A5A3A] text-[#FAF8F5] text-xs font-bold px-3 py-2 rounded-xl border border-[#B68A4C]/40 transition-all flex items-center gap-1.5 cursor-pointer shrink-0 shadow-xs"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>Upload Photo</span>
                    </button>
                  </div>

                  {/* URL fallback input */}
                  <div className="flex-1 min-w-0">
                    <span className="text-[10px] text-[#2D2D2D]/60 font-semibold block mb-0.5">Or paste image URL:</span>
                    <input
                      type="url"
                      value={editAvatar}
                      onChange={(e) => setEditAvatar(e.target.value)}
                      placeholder="https://..."
                      className="w-full bg-[#FAF8F5] border border-[#B68A4C]/30 rounded-lg px-2.5 py-1.5 text-xs font-medium text-[#2D2D2D] focus:outline-none focus:border-[#8B5E34]"
                    />
                  </div>
                </div>

                {/* Preset Avatars Selection */}
                <div className="space-y-1 pt-1">
                  <span className="text-[10px] text-[#2D2D2D]/60 font-semibold">Or pick a salon preset photo:</span>
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                    {PRESET_AVATARS.map((preset, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setEditAvatar(preset.url)}
                        className={`flex items-center gap-1.5 px-2 py-1 rounded-lg border text-[11px] font-medium transition-all shrink-0 cursor-pointer ${
                          editAvatar === preset.url
                            ? 'bg-[#8B5E34] text-[#FAF8F5] border-[#8B5E34]'
                            : 'bg-[#F4F1EC] text-[#2D2D2D] border-[#B68A4C]/25 hover:border-[#8B5E34]'
                        }`}
                      >
                        <img src={preset.url} alt={preset.label} className="w-4 h-4 rounded-full object-cover" />
                        <span>{preset.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Name & Title Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#8B5E34] mb-1">
                    Stylist Name
                  </label>
                  <input
                    type="text"
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full bg-[#F4F1EC] border border-[#B68A4C]/30 rounded-xl px-3 py-2 text-xs font-bold text-[#2D2D2D] focus:outline-none focus:border-[#8B5E34]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#8B5E34] mb-1">
                    Role Title
                  </label>
                  <input
                    type="text"
                    required
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    placeholder="e.g. Master Stylist & Extensionist"
                    className="w-full bg-[#F4F1EC] border border-[#B68A4C]/30 rounded-xl px-3 py-2 text-xs font-semibold text-[#2D2D2D] focus:outline-none focus:border-[#8B5E34]"
                  />
                </div>
              </div>

              {/* Commission Split Slider & Input */}
              <div className="bg-[#F4F1EC] p-3.5 rounded-xl border border-[#B68A4C]/25 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-[#8B5E34]">
                    Commission Split %
                  </label>
                  <span className="font-serif font-bold text-sm text-[#8B5E34] bg-[#FAF8F5] px-2.5 py-0.5 rounded-md border border-[#B68A4C]/20">
                    {editCommission}%
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="10"
                    max="90"
                    step="5"
                    value={editCommission}
                    onChange={(e) => setEditCommission(parseInt(e.target.value, 10))}
                    className="flex-1 accent-[#8B5E34] cursor-pointer"
                  />
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={editCommission}
                    onChange={(e) => setEditCommission(parseInt(e.target.value, 10) || 0)}
                    className="w-16 bg-[#FAF8F5] border border-[#B68A4C]/30 rounded-lg px-2 py-1 text-xs font-bold text-center text-[#2D2D2D]"
                  />
                </div>
              </div>

              {/* Bio Textarea */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#8B5E34] mb-1">
                  Professional Bio
                </label>
                <textarea
                  rows={2}
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  placeholder="Short professional summary..."
                  className="w-full bg-[#F4F1EC] border border-[#B68A4C]/30 rounded-xl p-3 text-xs text-[#2D2D2D] focus:outline-none focus:border-[#8B5E34]"
                />
              </div>

              {/* Specialties */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#8B5E34] mb-1">
                  Specialties (Comma Separated)
                </label>
                <input
                  type="text"
                  value={editSpecialties}
                  onChange={(e) => setEditSpecialties(e.target.value)}
                  placeholder="e.g. Silk Press, Balayage, Micro-Links, Locs"
                  className="w-full bg-[#F4F1EC] border border-[#B68A4C]/30 rounded-xl px-3 py-2 text-xs text-[#2D2D2D] focus:outline-none focus:border-[#8B5E34]"
                />
              </div>

              {/* Form Actions */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#B68A4C]/20">
                <button
                  type="button"
                  onClick={() => setIsEditingProfile(false)}
                  className="px-4 py-2 rounded-xl bg-[#F4F1EC] hover:bg-[#EAE5DC] text-[#2D2D2D] text-xs font-bold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#8B5E34] hover:bg-[#7A5A3A] text-[#FAF8F5] text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Profile Changes</span>
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* Processing Countdown Timer Widget */}
      <div className="bg-[#2D2D2D] text-[#FAF8F5] border border-[#B68A4C]/30 rounded-2xl p-5 shadow-md flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="space-y-1">
          <span className="text-[10px] font-bold text-[#B68A4C] uppercase tracking-wider flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" /> Processing Countdown
          </span>
          <h4 className="font-serif text-lg font-bold">Hair Color / Steamer Timer</h4>
          <p className="text-xs text-[#F4F1EC]/70">Track ambient color processing and deep steam treatments.</p>
        </div>

        <div className="flex items-center space-x-4">
          <div className="font-mono text-3xl font-bold tracking-wider text-[#FAF8F5] bg-[#3D3D3D] px-4 py-2 rounded-xl border border-[#B68A4C]/30">
            {formatTimer(timerSeconds)}
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsTimerRunning(!isTimerRunning)}
              className="p-2.5 rounded-xl bg-[#B68A4C] hover:bg-[#8B5E34] text-[#FAF8F5] shadow-xs transition-all cursor-pointer"
            >
              {isTimerRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </button>
            <button
              onClick={() => {
                setIsTimerRunning(false);
                setTimerSeconds(35 * 60);
              }}
              className="p-2.5 rounded-xl bg-[#3D3D3D] hover:bg-[#4D4D4D] text-[#FAF8F5] transition-all cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Daily Schedule Timeline */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-serif font-bold text-xl text-[#2D2D2D]">Today's Client Schedule</h3>
          <span className="text-xs font-semibold text-[#8B5E34] bg-[#F4F1EC] px-3 py-1 rounded-full border border-[#B68A4C]/20">
            {myAppointments.length} Appointments
          </span>
        </div>

        <div className="space-y-3">
          {myAppointments.map((apt) => (
            <div
              key={apt.id}
              className={`p-5 rounded-2xl border transition-all shadow-2xs ${
                apt.status === 'in_progress'
                  ? 'bg-[#FAF8F5] border-[#8B5E34] ring-2 ring-[#8B5E34]/20'
                  : 'bg-[#F4F1EC]/70 border-[#B68A4C]/20'
              }`}
            >
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 rounded-xl bg-[#8B5E34] text-[#FAF8F5] flex flex-col items-center justify-center shrink-0 shadow-2xs">
                    <span className="text-[10px] font-bold uppercase">TIME</span>
                    <span className="font-serif text-xs font-bold">{apt.time.split(' ')[0]}</span>
                  </div>

                  <div>
                    <div className="flex items-center space-x-2">
                      <h4 className="font-serif font-bold text-base text-[#2D2D2D]">{apt.customerName}</h4>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${
                          apt.status === 'in_progress'
                            ? 'bg-[#B68A4C] text-[#FAF8F5]'
                            : apt.status === 'completed'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-[#FAF8F5] text-[#8B5E34] border border-[#8B5E34]/30'
                        }`}
                      >
                        {apt.status.replace('_', ' ')}
                      </span>
                    </div>

                    <p className="text-xs text-[#8B5E34] font-medium">{apt.serviceName} (${apt.price})</p>
                    {apt.notes && (
                      <p className="text-xs text-[#2D2D2D]/70 italic mt-1 bg-[#FAF8F5] p-2 rounded-lg border border-[#B68A4C]/15">
                        "{apt.notes}"
                      </p>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center space-x-2 w-full sm:w-auto">
                  <button
                    onClick={() => onOpenFormula(apt.customerId, apt.customerName)}
                    className="flex-1 sm:flex-none text-xs font-semibold text-[#8B5E34] bg-[#FAF8F5] hover:bg-[#F4F1EC] border border-[#8B5E34]/30 px-3 py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Hair Formula</span>
                  </button>

                  {apt.status !== 'completed' && (
                    <button
                      onClick={() =>
                        onUpdateStatus(
                          apt.id,
                          apt.status === 'upcoming' ? 'in_progress' : 'completed'
                        )
                      }
                      className="flex-1 sm:flex-none text-xs font-bold text-[#FAF8F5] bg-[#8B5E34] hover:bg-[#7A5A3A] px-4 py-2 rounded-xl transition-all flex items-center justify-center gap-1 shadow-xs cursor-pointer"
                    >
                      {apt.status === 'upcoming' ? (
                        <>
                          <Scissors className="w-3.5 h-3.5" /> Start
                        </>
                      ) : (
                        <>
                          <Check className="w-3.5 h-3.5" /> Complete
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
