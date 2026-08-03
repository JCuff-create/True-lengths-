import React, { useState } from 'react';
import { GalleryItem } from '../../types';
import { X, ArrowLeft, Clock, DollarSign, Calendar, Sparkles, Scissors, CheckCircle2, ShieldCheck, Heart } from 'lucide-react';

interface PortfolioDetailModalProps {
  item: GalleryItem | null;
  onClose: () => void;
  onBookThisLook?: (item: GalleryItem) => void;
}

export const PortfolioDetailModal: React.FC<PortfolioDetailModalProps> = ({
  item,
  onClose,
  onBookThisLook,
}) => {
  if (!item) return null;

  // Build list of all angle images available
  const allImages = [
    item.afterUrl,
    ...(item.additionalImages || []),
    ...(item.beforeUrl ? [item.beforeUrl] : []),
  ];

  const [activeImageIndex, setActiveImageIndex] = useState<number>(0);
  const [liked, setLiked] = useState<boolean>(false);
  const [likeCount, setLikeCount] = useState<number>(item.likes || 120);

  const handleToggleLike = () => {
    if (liked) {
      setLikeCount((prev) => prev - 1);
      setLiked(false);
    } else {
      setLikeCount((prev) => prev + 1);
      setLiked(true);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-md animate-fade-in overflow-y-auto">
      
      {/* Click outside to close */}
      <div className="fixed inset-0" onClick={onClose} />

      {/* Main Container */}
      <div className="relative w-full max-w-3xl bg-[#FAF8F5] text-[#2D2D2D] rounded-[28px] border border-[#B68A4C]/30 shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col z-10 animate-slide-up">
        
        {/* Top Floating Controls */}
        <div className="p-4 sm:p-5 bg-[#FAF8F5]/90 backdrop-blur-md border-b border-[#B68A4C]/15 flex items-center justify-between shrink-0 sticky top-0 z-20">
          <button
            onClick={onClose}
            className="inline-flex items-center gap-2 text-xs font-bold text-[#8B5E34] hover:text-[#7A5A3A] bg-[#F4F1EC] hover:bg-[#EFEAE2] px-3.5 py-2 rounded-full border border-[#B68A4C]/25 transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Portfolio</span>
          </button>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleToggleLike}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all border ${
                liked
                  ? 'bg-rose-50 text-rose-600 border-rose-200'
                  : 'bg-[#F4F1EC] text-[#2D2D2D]/70 border-[#B68A4C]/20 hover:text-rose-600'
              }`}
            >
              <Heart className={`w-3.5 h-3.5 ${liked ? 'fill-rose-600' : ''}`} />
              <span>{likeCount}</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-full text-[#2D2D2D]/60 hover:text-[#2D2D2D] hover:bg-[#F4F1EC] transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Scroll Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-6 sm:space-y-8">
          
          {/* Main Showcase Gallery Section */}
          <div className="space-y-3">
            <div className="relative aspect-4/3 sm:aspect-16/10 rounded-[22px] overflow-hidden bg-[#2D2D2D] border border-[#B68A4C]/20 shadow-md group">
              <img
                src={allImages[activeImageIndex] || item.afterUrl}
                alt={item.title}
                className="w-full h-full object-cover transition-all duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
              
              {/* Image Badge */}
              <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
                <span className="px-3 py-1 rounded-full bg-black/60 backdrop-blur-md text-[#FAF8F5] text-[10px] font-bold uppercase tracking-wider border border-white/20">
                  {activeImageIndex === 0 ? 'Main Result' : item.beforeUrl && activeImageIndex === allImages.length - 1 ? 'Before Transformation' : `Angle View ${activeImageIndex + 1}`}
                </span>
                <span className="text-[10px] text-white/80 font-medium bg-black/50 px-2.5 py-0.5 rounded-full">
                  Photo {activeImageIndex + 1} of {allImages.length}
                </span>
              </div>
            </div>

            {/* Angle Thumbnails Carousel */}
            {allImages.length > 1 && (
              <div className="flex items-center gap-2.5 overflow-x-auto pb-1 no-scrollbar">
                {allImages.map((imgUrl, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImageIndex(idx)}
                    className={`relative w-20 h-20 sm:w-22 sm:h-22 rounded-xl overflow-hidden shrink-0 border-2 transition-all cursor-pointer ${
                      activeImageIndex === idx
                        ? 'border-[#8B5E34] ring-2 ring-[#B68A4C]/30 scale-105 shadow-sm'
                        : 'border-[#B68A4C]/20 opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img src={imgUrl} alt={`Angle ${idx + 1}`} className="w-full h-full object-cover" />
                    {item.beforeUrl && idx === allImages.length - 1 && (
                      <span className="absolute inset-x-0 bottom-0 bg-black/70 text-white text-[8px] font-bold text-center py-0.5">
                        BEFORE
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Transformation Title & Stylist Bar */}
          <div className="space-y-3 pb-2 border-b border-[#B68A4C]/15">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-[#B68A4C]/15 border border-[#B68A4C]/30 text-[#8B5E34] text-[11px] font-bold uppercase tracking-wider">
                {item.category}
              </span>
              <span className="text-xs text-[#2D2D2D]/60 flex items-center gap-1 font-medium">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                Verified Salon Transformation
              </span>
            </div>

            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#2D2D2D] leading-tight">
              {item.title}
            </h2>

            <p className="text-xs sm:text-sm text-[#8B5E34] font-semibold flex items-center gap-1.5">
              <span>Crafted by {item.stylistName}</span>
              <span className="text-[#2D2D2D]/30">•</span>
              <span className="text-[#2D2D2D]/60 font-normal">{item.date}</span>
            </p>
          </div>

          {/* Key Specs Grid (Apple Glass-style) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-[#F4F1EC] border border-[#B68A4C]/20 rounded-2xl p-3.5 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#B68A4C] flex items-center gap-1">
                <Clock className="w-3 h-3" /> Time Required
              </span>
              <p className="font-serif font-bold text-sm text-[#2D2D2D]">
                {item.duration || '2.0 Hours'}
              </p>
            </div>

            <div className="bg-[#F4F1EC] border border-[#B68A4C]/20 rounded-2xl p-3.5 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#B68A4C] flex items-center gap-1">
                <DollarSign className="w-3 h-3" /> Investment
              </span>
              <p className="font-serif font-bold text-sm text-[#2D2D2D]">
                {item.priceRange || '$150 - $200'}
              </p>
            </div>

            <div className="bg-[#F4F1EC] border border-[#B68A4C]/20 rounded-2xl p-3.5 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#B68A4C] flex items-center gap-1">
                <Calendar className="w-3 h-3" /> Maintenance
              </span>
              <p className="font-serif font-bold text-sm text-[#2D2D2D]">
                {item.maintenanceCycle || '6-8 Weeks'}
              </p>
            </div>

            <div className="bg-[#F4F1EC] border border-[#B68A4C]/20 rounded-2xl p-3.5 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#B68A4C] flex items-center gap-1">
                <Scissors className="w-3 h-3" /> Hair Texture
              </span>
              <p className="font-serif font-bold text-sm text-[#2D2D2D] truncate">
                {item.hairTextureType || 'Types 3A - 4C'}
              </p>
            </div>
          </div>

          {/* Service Performed Narrative */}
          <div className="space-y-2 bg-[#FAF8F5] border border-[#B68A4C]/20 rounded-2xl p-4 sm:p-5 shadow-2xs">
            <h4 className="font-serif font-bold text-base text-[#2D2D2D] flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#B68A4C]" />
              <span>Transformation & Technique</span>
            </h4>
            <p className="text-xs sm:text-sm text-[#2D2D2D]/85 leading-relaxed">
              {item.description || item.servicePerformed || 'Detailed bespoke transformation using True Lengths healthy hair protocol.'}
            </p>
            {item.servicePerformed && (
              <div className="pt-2 border-t border-[#B68A4C]/15 text-xs text-[#8B5E34] font-medium flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Service: <strong className="font-bold text-[#2D2D2D]">{item.servicePerformed}</strong></span>
              </div>
            )}
          </div>

          {/* Products Used Section */}
          {item.productsUsed && item.productsUsed.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-serif font-bold text-sm text-[#2D2D2D]">
                Products Used During Treatment
              </h4>
              <div className="flex flex-wrap gap-2">
                {item.productsUsed.map((prod, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#F4F1EC] border border-[#B68A4C]/25 text-xs text-[#8B5E34] font-semibold"
                  >
                    <Sparkles className="w-3 h-3 text-[#B68A4C]" />
                    <span>{prod}</span>
                  </span>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Footer CTA */}
        <div className="p-4 sm:p-5 bg-[#FAF8F5] border-t border-[#B68A4C]/20 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="text-center sm:text-left">
            <p className="text-xs font-bold text-[#2D2D2D]">Love this exact look?</p>
            <p className="text-[11px] text-[#8B5E34]">Book with {item.stylistName} or select this transformation service.</p>
          </div>

          <button
            onClick={() => {
              if (onBookThisLook) onBookThisLook(item);
              onClose();
            }}
            className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-[#8B5E34] hover:bg-[#7A5A3A] text-[#FAF8F5] text-xs font-bold shadow-md transition-all flex items-center justify-center gap-2 group cursor-pointer"
          >
            <Scissors className="w-4 h-4 text-[#B68A4C]" />
            <span>Book This Look</span>
          </button>
        </div>

      </div>
    </div>
  );
};
