import React, { useState, useRef } from 'react';
import { GalleryItem, Stylist } from '../../types';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  Star,
  Eye,
  Heart,
  Image as ImageIcon,
  CheckCircle2,
  X,
  Sparkles,
  Layers,
  Scissors,
  Clock,
  DollarSign,
  Tag,
  UploadCloud,
  ArrowRight,
  Camera,
  Upload
} from 'lucide-react';
import { PortfolioDetailModal } from '../customer/PortfolioDetailModal';

interface PortfolioManagerProps {
  gallery: GalleryItem[];
  stylists: Stylist[];
  onAddGalleryItem: (newItem: Omit<GalleryItem, 'id' | 'likes'>) => void;
  onUpdateGalleryItem: (updatedItem: GalleryItem) => void;
  onDeleteGalleryItem: (id: string) => void;
}

// Pre-curated high-resolution salon transformation stock photos for quick 1-click selection
const PRESET_PHOTO_LIBRARY = [
  { name: 'Warm Copper Melt', category: 'Custom Color', url: 'https://images.unsplash.com/photo-1580618672591-eb180b1a973f?auto=format&fit=crop&w=1000&q=80' },
  { name: 'Sleek Silk Press', category: 'Silk Press', url: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=1000&q=80' },
  { name: 'Crown Braid Updo', category: 'Protective Styles', url: 'https://images.unsplash.com/photo-1607779097040-26e80aa78e66?auto=format&fit=crop&w=1000&q=80' },
  { name: 'Caramel Balayage', category: 'Balayage', url: 'https://images.unsplash.com/photo-1519699047748-de8e457a634e?auto=format&fit=crop&w=1000&q=80' },
  { name: 'Gold Honey Pixie', category: 'Pixie Cuts', url: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&w=1000&q=80' },
  { name: 'Precision Taper Cut', category: 'Precision Cuts', url: 'https://images.unsplash.com/photo-1595476108010-b4d1f102b1b1?auto=format&fit=crop&w=1000&q=80' },
  { name: 'Knotless Goddess Braids', category: 'Braids', url: 'https://images.unsplash.com/photo-1616683693504-3ea7e9ad6fec?auto=format&fit=crop&w=1000&q=80' },
  { name: 'Botanical Wash & Curl', category: 'Natural Hair', url: 'https://images.unsplash.com/photo-1523824921871-d6f1a15151f1?auto=format&fit=crop&w=1000&q=80' },
  { name: 'Dense Coil Before Photo', category: 'Before Photo', url: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=1000&q=80' },
];

const CATEGORIES = [
  'Silk Press',
  'Custom Color',
  'Balayage',
  'Braids',
  'Natural Hair',
  'Precision Cuts',
  'Pixie Cuts',
  'Protective Styles'
];

export const PortfolioManager: React.FC<PortfolioManagerProps> = ({
  gallery,
  stylists,
  onAddGalleryItem,
  onUpdateGalleryItem,
  onDeleteGalleryItem,
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  
  // Modals state
  const [isFormOpen, setIsFormOpen] = useState<boolean>(false);
  const [editingItem, setEditingItem] = useState<GalleryItem | null>(null);
  const [previewItem, setPreviewItem] = useState<GalleryItem | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Form Fields State
  const [formData, setFormData] = useState<{
    title: string;
    category: string;
    afterUrl: string;
    beforeUrl: string;
    additionalImages: string[];
    stylistName: string;
    date: string;
    description: string;
    servicePerformed: string;
    duration: string;
    priceRange: string;
    maintenanceCycle: string;
    hairTextureType: string;
    productsUsedInput: string;
    isFeatured: boolean;
  }>({
    title: '',
    category: 'Silk Press',
    afterUrl: '',
    beforeUrl: '',
    additionalImages: [],
    stylistName: stylists[0]?.name || 'Carolyn R.',
    date: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
    description: '',
    servicePerformed: '',
    duration: '2.0 Hours',
    priceRange: '$120 - $180',
    maintenanceCycle: '4 - 6 Weeks',
    hairTextureType: 'Texture Type 3A - 4C',
    productsUsedInput: '',
    isFeatured: false,
  });

  const [additionalUrlInput, setAdditionalUrlInput] = useState<string>('');

  const afterFileInputRef = useRef<HTMLInputElement>(null);
  const beforeFileInputRef = useRef<HTMLInputElement>(null);
  const angleFileInputRef = useRef<HTMLInputElement>(null);

  const handleAfterFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setFormData((prev) => ({ ...prev, afterUrl: event.target!.result as string }));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleBeforeFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setFormData((prev) => ({ ...prev, beforeUrl: event.target!.result as string }));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAngleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setFormData((prev) => ({
            ...prev,
            additionalImages: [...prev.additionalImages, event.target!.result as string],
          }));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Reset or Open Form for Add
  const handleOpenAddModal = () => {
    setEditingItem(null);
    setFormData({
      title: '',
      category: 'Silk Press',
      afterUrl: PRESET_PHOTO_LIBRARY[0].url,
      beforeUrl: '',
      additionalImages: [],
      stylistName: stylists[0]?.name || 'Carolyn R.',
      date: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
      description: '',
      servicePerformed: '',
      duration: '2.0 Hours',
      priceRange: '$120 - $180',
      maintenanceCycle: '4 - 6 Weeks',
      hairTextureType: 'Texture Type 3A - 4C',
      productsUsedInput: 'True Lengths Moisture Mist, Silk Infusion Drops',
      isFeatured: false,
    });
    setIsFormOpen(true);
  };

  // Open Form for Edit
  const handleOpenEditModal = (item: GalleryItem) => {
    setEditingItem(item);
    setFormData({
      title: item.title,
      category: item.category,
      afterUrl: item.afterUrl,
      beforeUrl: item.beforeUrl || '',
      additionalImages: item.additionalImages || [],
      stylistName: item.stylistName,
      date: item.date,
      description: item.description || '',
      servicePerformed: item.servicePerformed || '',
      duration: item.duration || '2.0 Hours',
      priceRange: item.priceRange || '$120 - $180',
      maintenanceCycle: item.maintenanceCycle || '4 - 6 Weeks',
      hairTextureType: item.hairTextureType || 'Texture Type 3A - 4C',
      productsUsedInput: (item.productsUsed || []).join(', '),
      isFeatured: !!item.isFeatured,
    });
    setIsFormOpen(true);
  };

  // Submit Handler
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.afterUrl.trim()) {
      alert('Please provide a title and at least one main photo URL.');
      return;
    }

    const productsUsedArray = formData.productsUsedInput
      .split(',')
      .map((p) => p.trim())
      .filter((p) => p.length > 0);

    if (editingItem) {
      // Update existing
      onUpdateGalleryItem({
        ...editingItem,
        title: formData.title,
        category: formData.category,
        afterUrl: formData.afterUrl,
        beforeUrl: formData.beforeUrl || undefined,
        additionalImages: formData.additionalImages,
        stylistName: formData.stylistName,
        date: formData.date,
        description: formData.description,
        servicePerformed: formData.servicePerformed,
        duration: formData.duration,
        priceRange: formData.priceRange,
        maintenanceCycle: formData.maintenanceCycle,
        hairTextureType: formData.hairTextureType,
        productsUsed: productsUsedArray,
        isFeatured: formData.isFeatured,
      });
    } else {
      // Add new
      onAddGalleryItem({
        title: formData.title,
        category: formData.category,
        afterUrl: formData.afterUrl,
        beforeUrl: formData.beforeUrl || undefined,
        additionalImages: formData.additionalImages,
        stylistName: formData.stylistName,
        date: formData.date,
        description: formData.description,
        servicePerformed: formData.servicePerformed,
        duration: formData.duration,
        priceRange: formData.priceRange,
        maintenanceCycle: formData.maintenanceCycle,
        hairTextureType: formData.hairTextureType,
        productsUsed: productsUsedArray,
        isFeatured: formData.isFeatured,
      });
    }

    setIsFormOpen(false);
  };

  // Add additional image URL
  const handleAddAdditionalUrl = () => {
    if (additionalUrlInput.trim()) {
      setFormData((prev) => ({
        ...prev,
        additionalImages: [...prev.additionalImages, additionalUrlInput.trim()],
      }));
      setAdditionalUrlInput('');
    }
  };

  const handleRemoveAdditionalUrl = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      additionalImages: prev.additionalImages.filter((_, i) => i !== index),
    }));
  };

  // Filtered Items
  const filteredGallery = gallery.filter((item) => {
    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
    const matchesSearch =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.stylistName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const totalLikes = gallery.reduce((sum, item) => sum + (item.likes || 0), 0);
  const featuredCount = gallery.filter((item) => item.isFeatured).length;

  return (
    <div className="space-y-6 pb-12 bg-[#2D2D2D] text-[#FAF8F5] p-6 sm:p-8 rounded-3xl border border-[#B68A4C]/30 shadow-2xl">
      
      {/* Customer Modal Preview Component */}
      <PortfolioDetailModal
        item={previewItem}
        onClose={() => setPreviewItem(null)}
      />

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#B68A4C]/20 pb-5">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-[#B68A4C]">
            Brand & Creative Studio
          </span>
          <h2 className="font-serif text-3xl font-bold text-[#FAF8F5]">Master Portfolio Manager</h2>
          <p className="text-xs text-[#FAF8F5]/70 mt-0.5">
            Upload, update, and feature client hair transformation photography across customer portals.
          </p>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="bg-[#B68A4C] hover:bg-[#8B5E34] text-[#FAF8F5] font-bold px-5 py-3 rounded-xl text-xs transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer group"
        >
          <Plus className="w-4 h-4 transition-transform group-hover:rotate-90" />
          <span>Add New Photo / Look</span>
        </button>
      </div>

      {/* KPI Stats Bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#3D3D3D] border border-[#B68A4C]/30 rounded-2xl p-4 space-y-1">
          <p className="text-[10px] font-bold uppercase tracking-wider text-[#B68A4C] flex items-center gap-1">
            <ImageIcon className="w-3.5 h-3.5" /> Total Photography
          </p>
          <h3 className="font-serif text-2xl font-bold text-[#FAF8F5]">{gallery.length} Looks</h3>
        </div>

        <div className="bg-[#3D3D3D] border border-[#B68A4C]/30 rounded-2xl p-4 space-y-1">
          <p className="text-[10px] font-bold uppercase tracking-wider text-[#B68A4C] flex items-center gap-1">
            <Heart className="w-3.5 h-3.5 text-rose-400" /> Client App Likes
          </p>
          <h3 className="font-serif text-2xl font-bold text-[#FAF8F5]">{totalLikes.toLocaleString()}</h3>
        </div>

        <div className="bg-[#3D3D3D] border border-[#B68A4C]/30 rounded-2xl p-4 space-y-1">
          <p className="text-[10px] font-bold uppercase tracking-wider text-[#B68A4C] flex items-center gap-1">
            <Star className="w-3.5 h-3.5 text-amber-400" /> Featured Frontpage
          </p>
          <h3 className="font-serif text-2xl font-bold text-[#FAF8F5]">{featuredCount} Active</h3>
        </div>

        <div className="bg-[#3D3D3D] border border-[#B68A4C]/30 rounded-2xl p-4 space-y-1">
          <p className="text-[10px] font-bold uppercase tracking-wider text-[#B68A4C] flex items-center gap-1">
            <Scissors className="w-3.5 h-3.5" /> Top Performer
          </p>
          <h3 className="font-serif text-sm font-bold text-[#FAF8F5] truncate">Carolyn C. (Custom Color)</h3>
        </div>
      </div>

      {/* Controls Bar: Search & Category Filter */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 pt-2">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#FAF8F5]/50" />
          <input
            type="text"
            placeholder="Search by title, category, or stylist name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#3D3D3D] text-[#FAF8F5] text-xs pl-10 pr-4 py-2.5 rounded-xl border border-[#B68A4C]/30 focus:outline-none focus:border-[#B68A4C] placeholder-[#FAF8F5]/40"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#FAF8F5]/50 hover:text-[#FAF8F5]"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          <button
            onClick={() => setSelectedCategory('All')}
            className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all border cursor-pointer ${
              selectedCategory === 'All'
                ? 'bg-[#B68A4C] text-[#FAF8F5] border-[#B68A4C]'
                : 'bg-[#3D3D3D] text-[#FAF8F5]/70 border-[#B68A4C]/20 hover:text-[#FAF8F5]'
            }`}
          >
            All Categories ({gallery.length})
          </button>
          {CATEGORIES.map((cat) => {
            const count = gallery.filter((g) => g.category === cat).length;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all border cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-[#B68A4C] text-[#FAF8F5] border-[#B68A4C]'
                    : 'bg-[#3D3D3D] text-[#FAF8F5]/70 border-[#B68A4C]/20 hover:text-[#FAF8F5]'
                }`}
              >
                {cat} {count > 0 && `(${count})`}
              </button>
            );
          })}
        </div>
      </div>

      {/* Portfolio Items Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {filteredGallery.map((item) => (
          <div
            key={item.id}
            className="group bg-[#3D3D3D] border border-[#B68A4C]/30 rounded-2xl overflow-hidden shadow-md hover:border-[#B68A4C]/70 transition-all flex flex-col justify-between"
          >
            {/* Image Container */}
            <div className="relative aspect-4/3 overflow-hidden bg-[#2D2D2D]">
              <img
                src={item.afterUrl}
                alt={item.title}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60" />

              {/* Badges Overlay */}
              <div className="absolute top-3 left-3 right-3 flex items-center justify-between z-10">
                <span className="px-2.5 py-0.5 rounded-full bg-black/60 backdrop-blur-md text-[#B68A4C] text-[10px] font-bold uppercase tracking-wider border border-[#B68A4C]/30">
                  {item.category}
                </span>

                {item.isFeatured && (
                  <span className="px-2 py-0.5 rounded-full bg-amber-500/90 text-black text-[9px] font-extrabold uppercase flex items-center gap-1 shadow-sm">
                    <Star className="w-2.5 h-2.5 fill-black" /> Featured
                  </span>
                )}
              </div>

              {/* Angle Count Badge */}
              <div className="absolute bottom-3 left-3 text-[10px] text-white/90 bg-black/60 px-2 py-0.5 rounded-full font-medium">
                {1 + (item.additionalImages?.length || 0) + (item.beforeUrl ? 1 : 0)} Photos
              </div>
            </div>

            {/* Info Section */}
            <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
              <div className="space-y-1">
                <h4 className="font-serif font-bold text-base text-[#FAF8F5] leading-snug line-clamp-1">
                  {item.title}
                </h4>
                <p className="text-xs text-[#B68A4C] font-semibold flex items-center justify-between">
                  <span>Styled by {item.stylistName}</span>
                  <span className="flex items-center gap-1 text-xs text-rose-300 font-bold">
                    <Heart className="w-3 h-3 fill-rose-400" /> {item.likes}
                  </span>
                </p>
                <p className="text-[11px] text-[#FAF8F5]/60 line-clamp-2 pt-1 leading-relaxed">
                  {item.description || item.servicePerformed || 'No detailed description provided.'}
                </p>
              </div>

              {/* Specs Pills */}
              <div className="flex flex-wrap gap-1.5 pt-1 text-[10px] font-medium text-[#FAF8F5]/70">
                <span className="px-2 py-0.5 rounded-md bg-[#2D2D2D] border border-[#B68A4C]/20">
                  {item.duration || '2 hrs'}
                </span>
                <span className="px-2 py-0.5 rounded-md bg-[#2D2D2D] border border-[#B68A4C]/20">
                  {item.priceRange || '$150+'}
                </span>
                <span className="px-2 py-0.5 rounded-md bg-[#2D2D2D] border border-[#B68A4C]/20">
                  {item.hairTextureType?.split('/')[0] || 'All Textures'}
                </span>
              </div>
            </div>

            {/* Owner Actions Bar */}
            <div className="p-3 bg-[#2D2D2D] border-t border-[#B68A4C]/20 flex items-center justify-between gap-1">
              <button
                onClick={() => setPreviewItem(item)}
                className="flex-1 py-1.5 rounded-lg bg-[#3D3D3D] hover:bg-[#4A4A4A] text-[#FAF8F5] text-[11px] font-semibold transition-all flex items-center justify-center gap-1 border border-[#B68A4C]/20 cursor-pointer"
                title="Preview client view"
              >
                <Eye className="w-3.5 h-3.5 text-[#B68A4C]" />
                <span>Preview</span>
              </button>

              <button
                onClick={() => handleOpenEditModal(item)}
                className="p-2 rounded-lg bg-[#3D3D3D] hover:bg-[#8B5E34] text-[#FAF8F5] transition-all border border-[#B68A4C]/20 cursor-pointer"
                title="Edit photo & details"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => {
                  onUpdateGalleryItem({ ...item, isFeatured: !item.isFeatured });
                }}
                className={`p-2 rounded-lg transition-all border cursor-pointer ${
                  item.isFeatured
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                    : 'bg-[#3D3D3D] text-[#FAF8F5]/50 hover:text-amber-300 border-[#B68A4C]/20'
                }`}
                title={item.isFeatured ? 'Remove from featured' : 'Pin to featured'}
              >
                <Star className={`w-3.5 h-3.5 ${item.isFeatured ? 'fill-amber-400 text-amber-400' : ''}`} />
              </button>

              <button
                onClick={() => setDeletingId(item.id)}
                className="p-2 rounded-lg bg-[#3D3D3D] hover:bg-rose-900/40 text-rose-300 transition-all border border-[#B68A4C]/20 cursor-pointer"
                title="Delete from portfolio"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredGallery.length === 0 && (
        <div className="text-center py-12 bg-[#3D3D3D] rounded-2xl border border-[#B68A4C]/20 space-y-3">
          <ImageIcon className="w-12 h-12 text-[#B68A4C]/40 mx-auto" />
          <p className="font-serif text-lg font-bold text-[#FAF8F5]">No photography found matching search</p>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('All');
            }}
            className="text-xs font-bold text-[#B68A4C] hover:underline"
          >
            Clear filters
          </button>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingId && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#2D2D2D] border border-[#B68A4C]/40 rounded-2xl p-6 max-w-md w-full space-y-4 text-center">
            <Trash2 className="w-12 h-12 text-rose-400 mx-auto" />
            <h3 className="font-serif font-bold text-xl text-[#FAF8F5]">Delete Portfolio Look?</h3>
            <p className="text-xs text-[#FAF8F5]/70">
              Are you sure you want to permanently remove this look from the True Lengths master portfolio?
            </p>
            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => setDeletingId(null)}
                className="flex-1 py-2.5 rounded-xl bg-[#3D3D3D] text-[#FAF8F5] text-xs font-bold hover:bg-[#4A4A4A] transition-all"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onDeleteGalleryItem(deletingId);
                  setDeletingId(null);
                }}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 transition-all shadow-md"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADD / EDIT PORTFOLIO ITEM MODAL */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-fade-in">
          <div className="relative w-full max-w-2xl bg-[#2D2D2D] border border-[#B68A4C]/40 rounded-[28px] p-6 sm:p-8 space-y-6 shadow-2xl my-auto text-[#FAF8F5] max-h-[92vh] overflow-y-auto">
            
            {/* Modal Top Title Bar */}
            <div className="flex items-center justify-between border-b border-[#B68A4C]/20 pb-4 sticky top-0 bg-[#2D2D2D] z-10">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#B68A4C]">
                  {editingItem ? 'Edit Portfolio Look' : 'New Master Portfolio Look'}
                </span>
                <h3 className="font-serif text-2xl font-bold text-[#FAF8F5]">
                  {editingItem ? editingItem.title : 'Add Transformation Photography'}
                </h3>
              </div>
              <button
                onClick={() => setIsFormOpen(false)}
                className="p-2 rounded-full text-[#FAF8F5]/60 hover:text-[#FAF8F5] hover:bg-[#3D3D3D] transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-6">
              
              {/* Section 1: Basic Information */}
              <div className="space-y-4">
                <h4 className="font-serif font-bold text-sm text-[#B68A4C] flex items-center gap-1.5 border-b border-[#B68A4C]/15 pb-1">
                  <Scissors className="w-4 h-4" /> Basic Look Details
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-[#FAF8F5]/80">Look Title *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Warm Copper Melt & Curtain Bangs"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="w-full bg-[#3D3D3D] text-[#FAF8F5] text-xs px-3.5 py-2.5 rounded-xl border border-[#B68A4C]/30 focus:outline-none focus:border-[#B68A4C]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-[#FAF8F5]/80">Category *</label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full bg-[#3D3D3D] text-[#FAF8F5] text-xs px-3.5 py-2.5 rounded-xl border border-[#B68A4C]/30 focus:outline-none focus:border-[#B68A4C]"
                    >
                      {CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-[#FAF8F5]/80">Lead Stylist</label>
                    <select
                      value={formData.stylistName}
                      onChange={(e) => setFormData({ ...formData, stylistName: e.target.value })}
                      className="w-full bg-[#3D3D3D] text-[#FAF8F5] text-xs px-3.5 py-2.5 rounded-xl border border-[#B68A4C]/30 focus:outline-none focus:border-[#B68A4C]"
                    >
                      {stylists.map((st) => (
                        <option key={st.id} value={st.name}>{st.name} ({st.role})</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-[#FAF8F5]/80">Date Completed</label>
                    <input
                      type="text"
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      className="w-full bg-[#3D3D3D] text-[#FAF8F5] text-xs px-3.5 py-2.5 rounded-xl border border-[#B68A4C]/30 focus:outline-none focus:border-[#B68A4C]"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[#FAF8F5]/80">Technique Description & Story</label>
                  <textarea
                    rows={3}
                    placeholder="Describe the formulation, technique, and transformation story..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full bg-[#3D3D3D] text-[#FAF8F5] text-xs px-3.5 py-2.5 rounded-xl border border-[#B68A4C]/30 focus:outline-none focus:border-[#B68A4C] placeholder-[#FAF8F5]/40"
                  />
                </div>
              </div>

              {/* Section 2: Photography & Image Selector */}
              <div className="space-y-4">
                <h4 className="font-serif font-bold text-sm text-[#B68A4C] flex items-center gap-1.5 border-b border-[#B68A4C]/15 pb-1">
                  <ImageIcon className="w-4 h-4" /> Photography & Image URLs
                </h4>

                {/* Hidden File Inputs for Camera Roll */}
                <input
                  type="file"
                  ref={afterFileInputRef}
                  accept="image/*"
                  onChange={handleAfterFileChange}
                  className="hidden"
                />
                <input
                  type="file"
                  ref={beforeFileInputRef}
                  accept="image/*"
                  onChange={handleBeforeFileChange}
                  className="hidden"
                />
                <input
                  type="file"
                  ref={angleFileInputRef}
                  accept="image/*"
                  onChange={handleAngleFileChange}
                  className="hidden"
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-[#FAF8F5]/80">Main Photo (After) *</label>
                      <button
                        type="button"
                        onClick={() => afterFileInputRef.current?.click()}
                        className="text-[11px] font-bold text-[#B68A4C] hover:text-[#FAF8F5] flex items-center gap-1 cursor-pointer"
                      >
                        <Camera className="w-3 h-3" /> From Camera Roll
                      </button>
                    </div>
                    <input
                      type="url"
                      required
                      placeholder="https://images.unsplash.com/photo-... or camera roll image"
                      value={formData.afterUrl}
                      onChange={(e) => setFormData({ ...formData, afterUrl: e.target.value })}
                      className="w-full bg-[#3D3D3D] text-[#FAF8F5] text-xs px-3.5 py-2.5 rounded-xl border border-[#B68A4C]/30 focus:outline-none focus:border-[#B68A4C]"
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-[#FAF8F5]/80">Before Photo (Optional)</label>
                      <button
                        type="button"
                        onClick={() => beforeFileInputRef.current?.click()}
                        className="text-[11px] font-bold text-[#B68A4C] hover:text-[#FAF8F5] flex items-center gap-1 cursor-pointer"
                      >
                        <Camera className="w-3 h-3" /> From Camera Roll
                      </button>
                    </div>
                    <input
                      type="url"
                      placeholder="https://images.unsplash.com/photo-... or camera roll image"
                      value={formData.beforeUrl}
                      onChange={(e) => setFormData({ ...formData, beforeUrl: e.target.value })}
                      className="w-full bg-[#3D3D3D] text-[#FAF8F5] text-xs px-3.5 py-2.5 rounded-xl border border-[#B68A4C]/30 focus:outline-none focus:border-[#B68A4C]"
                    />
                  </div>
                </div>

                {/* Additional Angle URLs */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-[#FAF8F5]/80">Additional Angle Photos</label>
                    <button
                      type="button"
                      onClick={() => angleFileInputRef.current?.click()}
                      className="text-[11px] font-bold text-[#B68A4C] hover:text-[#FAF8F5] flex items-center gap-1 cursor-pointer"
                    >
                      <Upload className="w-3 h-3" /> Upload Angle from Camera Roll
                    </button>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      placeholder="Paste additional angle photo URL..."
                      value={additionalUrlInput}
                      onChange={(e) => setAdditionalUrlInput(e.target.value)}
                      className="flex-1 bg-[#3D3D3D] text-[#FAF8F5] text-xs px-3.5 py-2 rounded-xl border border-[#B68A4C]/30 focus:outline-none focus:border-[#B68A4C]"
                    />
                    <button
                      type="button"
                      onClick={handleAddAdditionalUrl}
                      className="bg-[#3D3D3D] hover:bg-[#8B5E34] text-[#FAF8F5] px-4 py-2 rounded-xl text-xs font-bold border border-[#B68A4C]/30 transition-all shrink-0 cursor-pointer"
                    >
                      Add URL
                    </button>
                  </div>

                  {formData.additionalImages.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-2">
                      {formData.additionalImages.map((url, idx) => (
                        <div key={idx} className="flex items-center gap-1.5 bg-[#3D3D3D] px-2.5 py-1 rounded-lg border border-[#B68A4C]/20 text-[11px]">
                          <span className="truncate max-w-[180px] text-[#FAF8F5]/70">Angle {idx + 1}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveAdditionalUrl(idx)}
                            className="text-rose-400 hover:text-rose-200"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Section 3: Service Specs & Products */}
              <div className="space-y-4">
                <h4 className="font-serif font-bold text-sm text-[#B68A4C] flex items-center gap-1.5 border-b border-[#B68A4C]/15 pb-1">
                  <Tag className="w-4 h-4" /> Service Specs & Products Used
                </h4>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-[#FAF8F5]/80">Duration</label>
                    <input
                      type="text"
                      value={formData.duration}
                      onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                      className="w-full bg-[#3D3D3D] text-[#FAF8F5] text-xs px-3 py-2 rounded-xl border border-[#B68A4C]/30 focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-[#FAF8F5]/80">Price Range</label>
                    <input
                      type="text"
                      value={formData.priceRange}
                      onChange={(e) => setFormData({ ...formData, priceRange: e.target.value })}
                      className="w-full bg-[#3D3D3D] text-[#FAF8F5] text-xs px-3 py-2 rounded-xl border border-[#B68A4C]/30 focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-[#FAF8F5]/80">Maintenance</label>
                    <input
                      type="text"
                      value={formData.maintenanceCycle}
                      onChange={(e) => setFormData({ ...formData, maintenanceCycle: e.target.value })}
                      className="w-full bg-[#3D3D3D] text-[#FAF8F5] text-xs px-3 py-2 rounded-xl border border-[#B68A4C]/30 focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-[#FAF8F5]/80">Texture Type</label>
                    <input
                      type="text"
                      value={formData.hairTextureType}
                      onChange={(e) => setFormData({ ...formData, hairTextureType: e.target.value })}
                      className="w-full bg-[#3D3D3D] text-[#FAF8F5] text-xs px-3 py-2 rounded-xl border border-[#B68A4C]/30 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[#FAF8F5]/80">Products Used (Comma Separated)</label>
                  <input
                    type="text"
                    placeholder="e.g. Mizani Thermasmooth, Olaplex No. 3, True Lengths Botanical Silk Drops"
                    value={formData.productsUsedInput}
                    onChange={(e) => setFormData({ ...formData, productsUsedInput: e.target.value })}
                    className="w-full bg-[#3D3D3D] text-[#FAF8F5] text-xs px-3.5 py-2.5 rounded-xl border border-[#B68A4C]/30 focus:outline-none focus:border-[#B68A4C]"
                  />
                </div>

                <div className="flex items-center gap-3 bg-[#3D3D3D] p-3 rounded-xl border border-[#B68A4C]/20">
                  <input
                    type="checkbox"
                    id="isFeatured"
                    checked={formData.isFeatured}
                    onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
                    className="w-4 h-4 rounded text-[#B68A4C] focus:ring-[#B68A4C] accent-[#B68A4C] cursor-pointer"
                  />
                  <label htmlFor="isFeatured" className="text-xs font-semibold text-[#FAF8F5] cursor-pointer">
                    Pin as Featured Look on Client Home Carousel & Portfolio Highlight
                  </label>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#B68A4C]/20">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-5 py-3 rounded-xl bg-[#3D3D3D] hover:bg-[#4A4A4A] text-[#FAF8F5] text-xs font-bold transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-7 py-3 rounded-xl bg-[#B68A4C] hover:bg-[#8B5E34] text-[#FAF8F5] text-xs font-bold transition-all shadow-md flex items-center gap-2 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{editingItem ? 'Save Changes' : 'Publish Look to Portfolio'}</span>
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};
