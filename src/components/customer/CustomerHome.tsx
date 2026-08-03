import React, { useState } from 'react';
import { Service, GalleryItem, Appointment, UserProfile } from '../../types';
import { Calendar, Sparkles, ChevronRight, Clock, Star, ArrowRight, ArrowUpRight } from 'lucide-react';
import { PortfolioDetailModal } from './PortfolioDetailModal';

interface CustomerHomeProps {
  user: UserProfile;
  services: Service[];
  gallery: GalleryItem[];
  upcomingAppointment?: Appointment;
  onBookNow: () => void;
  onSelectCategory: (category: string) => void;
  onViewGallery: () => void;
  onOpenAI: () => void;
  onViewAppointments: () => void;
}

export const CustomerHome: React.FC<CustomerHomeProps> = ({
  user,
  services,
  gallery,
  upcomingAppointment,
  onBookNow,
  onSelectCategory,
  onViewGallery,
  onOpenAI,
  onViewAppointments,
}) => {
  const [selectedPortfolioItem, setSelectedPortfolioItem] = useState<GalleryItem | null>(null);

  const categories = [
    { name: 'Silk Press', icon: '✨', description: 'Thermal silk finish' },
    { name: 'Braids', icon: '👑', description: 'Knotless & protective' },
    { name: 'Color', icon: '🎨', description: 'Custom formulation' },
    { name: 'Balayage', icon: '☀️', description: 'Dimensional warmth' },
  ];

  const handleBookThisLook = (item: GalleryItem) => {
    if (item.category) {
      onSelectCategory(item.category);
    } else {
      onBookNow();
    }
  };

  return (
    <div className="space-y-8 sm:space-y-12 pb-16">
      
      {/* Detail Modal Overlay */}
      <PortfolioDetailModal
        item={selectedPortfolioItem}
        onClose={() => setSelectedPortfolioItem(null)}
        onBookThisLook={handleBookThisLook}
      />

      {/* Welcome Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-[#B68A4C]">Welcome Back</p>
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#2D2D2D] flex items-center gap-2">
            Good morning, {user.name.split(' ')[0]} <span className="text-xl">✨</span>
          </h2>
          {user.hairType && (
            <p className="text-xs text-[#8B5E34] font-medium mt-0.5">
              Hair Texture: <span className="font-semibold">{user.hairType}</span> • <span className="text-[#B68A4C]">{user.loyaltyTier || 'Gold'} VIP</span>
            </p>
          )}
        </div>
        <button
          onClick={onOpenAI}
          className="flex items-center gap-2 bg-[#F4F1EC] hover:bg-[#EFEAE2] text-[#8B5E34] px-3.5 py-2 rounded-full border border-[#B68A4C]/30 text-xs font-semibold shadow-xs transition-all hover:scale-102 cursor-pointer"
        >
          <Sparkles className="w-3.5 h-3.5 text-[#B68A4C]" />
          <span>AI assistant</span>
        </button>
      </div>

      {/* Luxury Hero Banner */}
      <div className="relative overflow-hidden rounded-[24px] bg-[#2D2D2D] text-[#FAF8F5] shadow-lg border border-[#B68A4C]/20">
        <div className="absolute inset-0 bg-gradient-to-r from-[#2D2D2D] via-[#2D2D2D]/80 to-transparent z-10" />
        <img
          src="https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=1200&q=80"
          alt="True Lengths Hair"
          className="absolute right-0 top-0 h-full w-2/3 object-cover opacity-60 mix-blend-luminosity"
        />
        <div className="relative z-20 p-6 sm:p-10 max-w-lg space-y-4">
          <span className="inline-block px-3 py-1 bg-[#B68A4C]/20 border border-[#B68A4C]/40 text-[#B68A4C] text-[11px] font-semibold tracking-wider uppercase rounded-full">
            Healthy Hair First
          </span>
          <h3 className="font-serif text-3xl sm:text-4xl font-bold leading-tight text-[#FAF8F5]">
            Look your best. Every day.
          </h3>
          <p className="text-sm text-[#F4F1EC]/80 font-light leading-relaxed">
            Experience bespoke silk presses, hand-painted balayage, and tension-free knotless braids curated specifically for your natural hair texture.
          </p>
          <div className="pt-2">
            <button
              onClick={onBookNow}
              className="bg-[#B68A4C] hover:bg-[#8B5E34] text-[#FAF8F5] font-medium px-6 py-3 rounded-xl shadow-md transition-all flex items-center gap-2 group cursor-pointer"
            >
              <span>Book Appointment</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </button>
          </div>
        </div>
      </div>

      {/* Active Upcoming Appointment Banner if exists */}
      {upcomingAppointment && (
        <div className="bg-[#FAF8F5] border border-[#B68A4C]/30 rounded-2xl p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start space-x-4">
            <div className="w-12 h-12 rounded-xl bg-[#8B5E34]/10 border border-[#8B5E34]/20 flex flex-col items-center justify-center text-[#8B5E34] font-serif font-bold text-sm shrink-0">
              <span className="text-[10px] uppercase font-sans font-medium text-[#B68A4C]">MAY</span>
              <span>24</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs px-2 py-0.5 rounded-full bg-[#B68A4C]/15 text-[#8B5E34] font-semibold">
                  Confirmed
                </span>
                <span className="text-xs text-[#2D2D2D]/60 flex items-center gap-1">
                  <Clock className="w-3 h-3" /> {upcomingAppointment.time}
                </span>
              </div>
              <h4 className="font-serif font-bold text-[#2D2D2D] text-base mt-1">
                {upcomingAppointment.serviceName}
              </h4>
              <p className="text-xs text-[#8B5E34]">with {upcomingAppointment.stylistName}</p>
            </div>
          </div>

          <button
            onClick={onViewAppointments}
            className="text-xs font-semibold text-[#8B5E34] hover:text-[#B68A4C] border border-[#8B5E34]/30 px-4 py-2 rounded-lg hover:bg-[#F4F1EC] transition-all text-center cursor-pointer"
          >
            Manage Appointment
          </button>
        </div>
      )}

      {/* Service Categories Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-serif text-xl font-bold text-[#2D2D2D]">Our Services</h3>
          <button
            onClick={onBookNow}
            className="text-xs font-semibold text-[#8B5E34] hover:text-[#B68A4C] flex items-center gap-1 cursor-pointer"
          >
            <span>View all</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          {categories.map((cat) => (
            <button
              key={cat.name}
              onClick={() => onSelectCategory(cat.name)}
              className="group bg-[#F4F1EC] hover:bg-[#FAF8F5] border border-[#B68A4C]/20 hover:border-[#B68A4C]/50 rounded-2xl p-4 text-left transition-all hover:shadow-md cursor-pointer"
            >
              <div className="w-10 h-10 rounded-xl bg-[#FAF8F5] border border-[#B68A4C]/20 flex items-center justify-center text-lg mb-3 shadow-2xs group-hover:scale-105 transition-transform">
                {cat.icon}
              </div>
              <h4 className="font-serif font-bold text-sm text-[#2D2D2D] group-hover:text-[#8B5E34]">
                {cat.name}
              </h4>
              <p className="text-[11px] text-[#2D2D2D]/60 mt-0.5">{cat.description}</p>
            </button>
          ))}
        </div>
      </div>

      {/* REDESIGNED FEATURED TRANSFORMATIONS SECTION */}
      <div className="pt-6 pb-4 space-y-6">
        
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="space-y-1">
            <h3 className="font-serif text-2xl sm:text-3xl font-bold text-[#2D2D2D] tracking-tight">
              Featured Transformations
            </h3>
            <p className="text-xs sm:text-sm text-[#8B5E34]/90 font-medium">
              Real work created at True Lengths.
            </p>
          </div>

          <button
            onClick={onViewGallery}
            className="self-start sm:self-auto inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-[#F4F1EC] hover:bg-[#8B5E34] text-[#8B5E34] hover:text-[#FAF8F5] border border-[#B68A4C]/30 text-xs font-bold transition-all shadow-2xs hover:shadow-sm cursor-pointer group"
          >
            <span>View Full Portfolio</span>
            <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
          </button>
        </div>

        {/* Horizontally Scrolling Carousel with Snapping Behavior */}
        <div className="relative">
          <div className="flex gap-5 sm:gap-6 overflow-x-auto snap-x snap-mandatory scrollbar-none pb-6 pt-2 -mx-4 px-4 sm:-mx-6 sm:px-6">
            {gallery.map((item) => (
              <div
                key={item.id}
                onClick={() => setSelectedPortfolioItem(item)}
                className="w-[280px] sm:w-[320px] shrink-0 snap-start rounded-[24px] overflow-hidden bg-[#2D2D2D] border border-[#B68A4C]/25 shadow-md hover:shadow-2xl hover:-translate-y-1.5 transition-all duration-500 group relative cursor-pointer aspect-[3/4]"
              >
                {/* Edge-to-Edge High-Quality Hair Photography */}
                <img
                  src={item.afterUrl}
                  alt={item.title}
                  className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-108"
                />

                {/* Dark Gradient Overlay at Bottom */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-90 group-hover:opacity-95 transition-opacity" />

                {/* Top Badge Overlay */}
                {item.beforeUrl && (
                  <div className="absolute top-4 left-4 z-10">
                    <span className="px-3 py-1 rounded-full bg-black/60 backdrop-blur-md text-[#FAF8F5] text-[9px] font-bold uppercase tracking-wider border border-white/20">
                      Before / After
                    </span>
                  </div>
                )}

                {/* Content Overlay */}
                <div className="absolute bottom-5 left-5 right-5 text-white space-y-1 z-10">
                  <span className="inline-block text-[#B68A4C] text-[11px] font-bold uppercase tracking-widest">
                    {item.category}
                  </span>
                  <h4 className="font-serif font-bold text-lg sm:text-xl leading-tight text-white group-hover:text-[#F4F1EC]">
                    {item.title}
                  </h4>
                  <p className="text-[#E2D8C8] text-xs font-medium pt-0.5">
                    by {item.stylistName}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Salon Philosophy & AI Concierge Card */}
      <div className="bg-[#FAF8F5] border border-[#B68A4C]/25 rounded-[24px] p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xs">
        <div className="space-y-2 max-w-lg">
          <div className="flex items-center space-x-1 text-[#B68A4C]">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="w-4 h-4 fill-[#B68A4C]" />
            ))}
          </div>
          <h4 className="font-serif text-xl font-bold text-[#2D2D2D]">Unsure which treatment fits your hair?</h4>
          <p className="text-xs text-[#2D2D2D]/70 leading-relaxed">
            Our AI Salon Concierge offers personalized hair analysis, product recommendations, and custom appointment planning based on your natural texture.
          </p>
        </div>
        <button
          onClick={onOpenAI}
          className="shrink-0 bg-[#8B5E34] hover:bg-[#7A5A3A] text-[#FAF8F5] font-semibold px-5 py-2.5 rounded-xl text-xs flex items-center gap-2 shadow-sm transition-all cursor-pointer"
        >
          <Sparkles className="w-4 h-4 text-[#B68A4C]" />
          <span>Ask AI Assistant</span>
        </button>
      </div>

    </div>
  );
};

