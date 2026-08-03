import React, { useState, useRef } from 'react';
import { GalleryItem, Stylist } from '../../types';
import { Heart, Sparkles, X, User, Upload, Camera, Plus, CheckCircle2, Image as ImageIcon } from 'lucide-react';
import { PortfolioDetailModal } from './PortfolioDetailModal';

interface GalleryViewProps {
  gallery: GalleryItem[];
  onBookNow?: () => void;
  currentRole?: 'customer' | 'stylist' | 'owner';
  onAddGalleryItem?: (newItem: Omit<GalleryItem, 'id' | 'likes'>) => void;
  stylists?: Stylist[];
}

export const GalleryView: React.FC<GalleryViewProps> = ({
  gallery,
  onBookNow,
  currentRole,
  onAddGalleryItem,
  stylists = [],
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedItem, setSelectedItem] = useState<GalleryItem | null>(null);

  // Camera Roll Upload State
  const [uploadedImageDataUrl, setUploadedImageDataUrl] = useState<string | null>(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState<boolean>(false);
  
  const [uploadFormData, setUploadFormData] = useState({
    title: '',
    category: 'Silk Press',
    stylistName: stylists[0]?.name || 'Carolyn R.',
    description: '',
    hairTextureType: 'Texture Type 3A - 4C',
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  const categories = [
    'All',
    'Silk Press',
    'Custom Color',
    'Balayage',
    'Braids',
    'Natural Hair',
    'Precision Cuts',
    'Pixie Cuts',
    'Protective Styles'
  ];

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (!file.type.startsWith('image/')) {
        alert('Please select a valid image file from your camera roll.');
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setUploadedImageDataUrl(event.target.result as string);
          setUploadFormData({
            title: file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ') || 'New Transformation Look',
            category: 'Silk Press',
            stylistName: stylists[0]?.name || 'Carolyn R.',
            description: 'Fresh client transformation uploaded directly from salon camera roll.',
            hairTextureType: 'Texture Type 3A - 4C',
          });
          setIsUploadModalOpen(true);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePublishUpload = (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadedImageDataUrl || !uploadFormData.title.trim()) return;

    if (onAddGalleryItem) {
      onAddGalleryItem({
        title: uploadFormData.title,
        category: uploadFormData.category,
        afterUrl: uploadedImageDataUrl,
        stylistName: uploadFormData.stylistName,
        date: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
        description: uploadFormData.description,
        hairTextureType: uploadFormData.hairTextureType,
        isFeatured: true,
      });
    }

    setIsUploadModalOpen(false);
    setUploadedImageDataUrl(null);
  };

  const filteredGallery = gallery.filter((item) => {
    if (selectedCategory === 'All') return true;
    return item.category.toLowerCase().includes(selectedCategory.toLowerCase());
  });

  return (
    <div className="space-y-6 pb-12">
      
      {/* Portfolio Detail Modal */}
      <PortfolioDetailModal
        item={selectedItem}
        onClose={() => setSelectedItem(null)}
        onBookThisLook={() => {
          if (onBookNow) onBookNow();
        }}
      />

      {/* Hidden File Input for Camera Roll Selection */}
      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Title & Owner Camera Roll Upload Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#FAF8F5] border border-[#B68A4C]/30 p-6 rounded-3xl shadow-xs">
        <div className="space-y-1">
          <span className="text-xs font-semibold uppercase tracking-widest text-[#B68A4C]">Portfolio</span>
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#2D2D2D]">True Lengths Master Portfolio</h2>
          <p className="text-xs text-[#2D2D2D]/70 max-w-xl">
            Real clients, authentic hair transformations crafted with health-first protocols.
          </p>
        </div>

        {/* Camera Roll Upload Button (Only visible to Owner) */}
        {currentRole === 'owner' && (
          <div className="shrink-0 flex items-center gap-2">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full sm:w-auto bg-[#8B5E34] hover:bg-[#7A5A3A] text-[#FAF8F5] font-bold px-5 py-3 rounded-2xl text-xs transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer group"
              title="Upload photo directly from your device camera roll into the Master Portfolio"
            >
              <Camera className="w-4 h-4 text-[#FAF8F5] group-hover:scale-110 transition-transform" />
              <span>Upload Image from Camera Roll</span>
              <Plus className="w-3.5 h-3.5 text-[#B68A4C] ml-0.5" />
            </button>
          </div>
        )}
      </div>

      {/* Filter Category Pills */}
      <div className="flex overflow-x-auto gap-2 pb-2 no-scrollbar">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`shrink-0 px-4 py-2 rounded-full text-xs font-semibold transition-all border cursor-pointer ${
              selectedCategory === cat
                ? 'bg-[#8B5E34] text-[#FAF8F5] border-[#8B5E34] shadow-xs'
                : 'bg-[#F4F1EC] text-[#2D2D2D]/80 border-[#B68A4C]/20 hover:border-[#8B5E34]'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Gallery Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-5">
        {filteredGallery.map((item) => (
          <div
            key={item.id}
            onClick={() => setSelectedItem(item)}
            className="group relative aspect-3/4 rounded-[20px] overflow-hidden bg-[#2D2D2D] border border-[#B68A4C]/25 shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer"
          >
            <img
              src={item.afterUrl}
              alt={item.title}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-108"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent opacity-85 group-hover:opacity-95 transition-opacity" />
            
            {item.beforeUrl && (
              <span className="absolute top-3 left-3 bg-black/60 backdrop-blur-md text-[#FAF8F5] text-[9px] font-bold px-2.5 py-1 rounded-full uppercase border border-white/20 z-10">
                Before / After
              </span>
            )}

            <div className="absolute bottom-3.5 left-3.5 right-3.5 text-white z-10">
              <span className="text-[10px] uppercase tracking-wider text-[#B68A4C] font-semibold">
                {item.category}
              </span>
              <h4 className="font-serif text-sm font-bold truncate leading-tight text-[#FAF8F5]">
                {item.title}
              </h4>
              <p className="text-[10px] text-[#F4F1EC]/80 flex items-center justify-between mt-1">
                <span>by {item.stylistName}</span>
                <span className="flex items-center gap-1 text-[#B68A4C] font-semibold">
                  <Heart className="w-3 h-3 fill-[#B68A4C]" /> {item.likes}
                </span>
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* CAMERA ROLL PUBLISH MODAL */}
      {isUploadModalOpen && uploadedImageDataUrl && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-[#FAF8F5] border border-[#B68A4C]/40 rounded-3xl p-6 sm:p-8 max-w-lg w-full space-y-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-[#B68A4C]/20 pb-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#B68A4C]">Camera Roll Upload</span>
                <h3 className="font-serif text-xl font-bold text-[#2D2D2D]">Publish Photo to Master Portfolio</h3>
              </div>
              <button
                onClick={() => setIsUploadModalOpen(false)}
                className="p-1.5 rounded-full text-[#2D2D2D]/60 hover:text-[#2D2D2D] hover:bg-[#F4F1EC]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Uploaded Photo Preview */}
            <div className="relative aspect-4/3 rounded-2xl overflow-hidden border border-[#B68A4C]/30 shadow-md bg-[#2D2D2D]">
              <img
                src={uploadedImageDataUrl}
                alt="Camera roll preview"
                className="w-full h-full object-cover"
              />
              <span className="absolute bottom-3 left-3 bg-black/70 backdrop-blur-md text-[#FAF8F5] text-[10px] font-bold px-3 py-1 rounded-full flex items-center gap-1">
                <Camera className="w-3 h-3 text-[#B68A4C]" /> Camera Roll Selected
              </span>
            </div>

            {/* Form Details */}
            <form onSubmit={handlePublishUpload} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#2D2D2D] mb-1">Look Title *</label>
                <input
                  type="text"
                  required
                  value={uploadFormData.title}
                  onChange={(e) => setUploadFormData({ ...uploadFormData, title: e.target.value })}
                  className="w-full bg-[#F4F1EC] text-[#2D2D2D] text-xs px-3.5 py-2.5 rounded-xl border border-[#B68A4C]/30 focus:outline-none focus:border-[#8B5E34]"
                  placeholder="e.g. Honey Caramel Balayage & Blowout"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#2D2D2D] mb-1">Category</label>
                  <select
                    value={uploadFormData.category}
                    onChange={(e) => setUploadFormData({ ...uploadFormData, category: e.target.value })}
                    className="w-full bg-[#F4F1EC] text-[#2D2D2D] text-xs px-3 py-2.5 rounded-xl border border-[#B68A4C]/30 focus:outline-none"
                  >
                    {categories.filter((c) => c !== 'All').map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#2D2D2D] mb-1">Stylist</label>
                  <select
                    value={uploadFormData.stylistName}
                    onChange={(e) => setUploadFormData({ ...uploadFormData, stylistName: e.target.value })}
                    className="w-full bg-[#F4F1EC] text-[#2D2D2D] text-xs px-3 py-2.5 rounded-xl border border-[#B68A4C]/30 focus:outline-none"
                  >
                    {stylists.length > 0 ? (
                      stylists.map((st) => (
                        <option key={st.id} value={st.name}>{st.name}</option>
                      ))
                    ) : (
                      <option value="Carolyn R.">Carolyn R.</option>
                    )}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#2D2D2D] mb-1">Description / Notes</label>
                <textarea
                  rows={2}
                  value={uploadFormData.description}
                  onChange={(e) => setUploadFormData({ ...uploadFormData, description: e.target.value })}
                  className="w-full bg-[#F4F1EC] text-[#2D2D2D] text-xs px-3.5 py-2 rounded-xl border border-[#B68A4C]/30 focus:outline-none"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsUploadModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-[#F4F1EC] text-[#2D2D2D] text-xs font-bold hover:bg-[#EFEAE2]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-[#8B5E34] hover:bg-[#7A5A3A] text-[#FAF8F5] text-xs font-bold transition-all shadow-md flex items-center gap-2 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Publish to Portfolio</span>
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
};

