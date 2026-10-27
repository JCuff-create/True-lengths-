import React, { useState } from 'react';
import { InventoryItem } from '../../types';
import { inventoryStatus, inventoryThreshold, isLowStock, validPurchaseUrl, validateInventoryDetails, validateReceivedQuantity } from '../../lib/inventory';
import {
  Package,
  AlertTriangle,
  Plus,
  Edit2,
  Trash2,
  Search,
  X,
  Check,
  Boxes
} from 'lucide-react';

interface InventoryManagerProps {
  inventory: InventoryItem[];
  onRestockItem: (id: string, amount: number) => Promise<void>;
  onUpdateItem?: (updatedItem: InventoryItem) => Promise<void>;
  onAddItem?: (newItem: InventoryItem) => Promise<void>;
  onDeleteItem?: (id: string) => Promise<void>;
}

export const InventoryManager: React.FC<InventoryManagerProps> = ({
  inventory,
  onRestockItem,
  onUpdateItem,
  onAddItem,
  onDeleteItem,
}) => {
  const [filter, setFilter] = useState<'all' | 'low_stock' | string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);

  // Modal Form State
  const [formData, setFormData] = useState<{
    name: string;
    brand: string;
    category: InventoryItem['category'];
    stockCount: number;
    reorderLevel: number;
    unitCost: number;
    retailPrice: number;
    supplier: string;
    purchaseUrl: string;
  }>({
    name: '',
    brand: '',
    category: 'Styling & Oils',
    stockCount: 15,
    reorderLevel: 5,
    unitCost: 12.0,
    retailPrice: 28.0,
    supplier: 'True Lengths Labs',
    purchaseUrl: '',
  });

  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [receivingItem, setReceivingItem] = useState<InventoryItem | null>(null);
  const [receivedQuantity, setReceivedQuantity] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Filtered Items
  const filteredInventory = inventory.filter((item) => {
    // Search query filter
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.supplierName ?? item.supplier ?? '').toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (filter === 'low_stock') {
      return isLowStock(item);
    }
    if (filter !== 'all') {
      return item.category === filter;
    }
    return true;
  });

  // Open Add Modal
  const handleOpenAddModal = () => {
    setError(null);
    setEditingItem(null);
    setFormData({
      name: '',
      brand: 'True Lengths Pro',
      category: 'Styling & Oils',
      stockCount: 20,
      reorderLevel: 5,
      unitCost: 15.0,
      retailPrice: 35.0,
      supplier: 'True Lengths Labs',
      purchaseUrl: '',
    });
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (item: InventoryItem) => {
    setError(null);
    setEditingItem(item);
    setFormData({
      name: item.name,
      brand: item.brand,
      category: item.category,
      stockCount: item.stockCount,
      reorderLevel: inventoryThreshold(item),
      unitCost: item.unitCost,
      retailPrice: item.retailPrice,
      supplier: item.supplierName ?? item.supplier ?? '',
      purchaseUrl: item.purchaseUrl ?? '',
    });
    setIsModalOpen(true);
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pending || !formData.name.trim()) return;
    setError(null);
    setToastMessage(null);
    const item: InventoryItem = {
      ...editingItem,
      id: editingItem?.id ?? `inv-${crypto.randomUUID()}`,
      name: formData.name.trim(),
      brand: formData.brand.trim() || 'True Lengths Pro',
      category: formData.category,
      stockCount: formData.stockCount,
      reorderLevel: formData.reorderLevel,
      lowStockThreshold: formData.reorderLevel,
      unitCost: formData.unitCost,
      retailPrice: formData.retailPrice,
      supplier: formData.supplier.trim(),
      supplierName: formData.supplier.trim(),
      purchaseUrl: formData.purchaseUrl.trim(),
      status: inventoryStatus(formData),
    };
    setPending(true);
    try {
      validateInventoryDetails(item);
      if (editingItem) {
        if (!onUpdateItem) throw new Error('Inventory updates are unavailable.');
        await onUpdateItem(item);
      } else {
        if (!onAddItem) throw new Error('Adding inventory is unavailable.');
        await onAddItem(item);
      }
      showToast(`${editingItem ? 'Updated' : 'Added'} "${item.name}".`);
      setIsModalOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save product. Please retry.');
    } finally {
      setPending(false);
    }
  };

  const handleReceive = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!receivingItem || pending) return;
    setError(null);
    setToastMessage(null);
    const amount = Number(receivedQuantity);
    setPending(true);
    try {
      validateReceivedQuantity(amount);
      await onRestockItem(receivingItem.id, amount);
      showToast(`Received ${amount} units of ${receivingItem.name}. Stock updated.`);
      setReceivingItem(null);
      setReceivedQuantity('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to receive stock. Please retry.');
    } finally {
      setPending(false);
    }
  };

  const handleDelete = async (item: InventoryItem) => {
    if (!onDeleteItem || pending) return;
    setPending(true);
    setError(null);
    try {
      await onDeleteItem(item.id);
      showToast(`Removed "${item.name}" from inventory.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to remove product.');
    } finally {
      setPending(false);
    }
  };

  const CATEGORIES: InventoryItem['category'][] = [
    'Shampoo & Conditioner',
    'Styling & Oils',
    'Color & Lightener',
    'Extensions & Braiding Hair',
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      
      {error && !isModalOpen && !receivingItem && <p role="alert" className="text-sm text-red-800 bg-red-50 p-3 rounded-xl">{error}</p>}
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 bg-[#8B5E34] text-[#FAF8F5] border-2 border-[#B68A4C] px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-fade-in max-w-md w-full">
          <Package className="w-5 h-5 text-[#B68A4C] shrink-0" />
          <p className="text-xs font-bold leading-snug flex-1">{toastMessage}</p>
          <button onClick={() => setToastMessage(null)} className="p-1 hover:bg-[#FAF8F5]/10 rounded-lg">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#B68A4C]/20 pb-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-[#B68A4C]">Supply Chain OS</p>
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#2D2D2D]">Inventory & Backbar</h2>
          <p className="text-xs text-[#2D2D2D]/70 mt-0.5">
            Manage product stock counts, edit supplier pricing, and reorder backbar supplies.
          </p>
        </div>

        <button
          disabled={pending}
          onClick={handleOpenAddModal}
          className="bg-[#B68A4C] hover:bg-[#8B5E34] text-[#FAF8F5] font-bold text-xs px-4 py-2.5 rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" /> Add Product
        </button>
      </div>

      {/* Filters & Search Controls */}
      <div className="bg-[#FAF8F5] border border-[#B68A4C]/20 p-4 rounded-2xl space-y-3 shadow-2xs">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          
          {/* Search Bar */}
          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-[#8B5E34]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search product, brand, supplier..."
              className="w-full pl-9 pr-3 py-2 bg-white text-[#2D2D2D] text-xs rounded-xl border border-[#B68A4C]/30 focus:outline-none focus:border-[#B68A4C]"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Quick Category / Alert Filter Pills */}
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer border ${
                filter === 'all'
                  ? 'bg-[#8B5E34] text-[#FAF8F5] border-[#8B5E34]'
                  : 'bg-white text-[#2D2D2D] border-[#B68A4C]/20 hover:border-[#B68A4C]/50'
              }`}
            >
              All Items ({inventory.length})
            </button>

            <button
              onClick={() => setFilter('low_stock')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer border flex items-center gap-1 ${
                filter === 'low_stock'
                  ? 'bg-amber-700 text-white border-amber-700'
                  : 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600" /> Low Stock
            </button>

            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setFilter(filter === cat ? 'all' : cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer border ${
                  filter === cat
                    ? 'bg-[#8B5E34] text-[#FAF8F5] border-[#8B5E34]'
                    : 'bg-white text-[#2D2D2D]/80 border-[#B68A4C]/20 hover:border-[#B68A4C]/50'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

        </div>
      </div>

      <p className="text-xs text-[#2D2D2D]/70">
        Reorder opens your supplier’s website. Record deliveries with Receive Stock after products arrive.
      </p>

      {/* Inventory List */}
      <div className="space-y-3">
        {filteredInventory.length === 0 ? (
          <div className="p-8 text-center bg-[#FAF8F5] rounded-2xl border border-[#B68A4C]/20 text-[#2D2D2D]/60 space-y-2">
            <Boxes className="w-8 h-8 mx-auto text-[#B68A4C]" />
            <p className="text-sm font-semibold">
              {inventory.length === 0
                ? 'No inventory items yet.'
                : 'No inventory items found matching your filters.'}
            </p>
            {inventory.length > 0 && (
            <button
              onClick={() => {
                setFilter('all');
                setSearchQuery('');
              }}
              className="text-xs font-bold text-[#B68A4C] underline hover:text-[#8B5E34]"
            >
              Reset Filters
            </button>
            )}
          </div>
        ) : (
          filteredInventory.map((item) => {
            const isLow = isLowStock(item);
            const isOut = item.stockCount === 0;
            const purchaseUrl = validPurchaseUrl(item.purchaseUrl);

            return (
              <div
                key={item.id}
                className={`p-4 sm:p-5 rounded-2xl border transition-all shadow-2xs flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 ${
                  isOut
                    ? 'bg-red-50/60 border-red-300'
                    : isLow
                    ? 'bg-amber-50/60 border-amber-300'
                    : 'bg-[#FAF8F5] border-[#B68A4C]/25 hover:border-[#B68A4C]/60'
                }`}
              >
                {/* Left Item Details */}
                <div className="space-y-1.5 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-serif font-bold text-base text-[#2D2D2D]">{item.name}</h3>
                    <span
                      className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                        isOut
                          ? 'bg-red-100 text-red-800 border border-red-300'
                          : isLow
                          ? 'bg-amber-200 text-amber-900 border border-amber-300'
                          : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      }`}
                    >
                      {isOut ? 'Out of Stock · Low Stock' : isLow ? 'Low Stock' : 'In Stock'}
                    </span>
                    <span className="text-[10px] font-medium bg-[#8B5E34]/10 text-[#8B5E34] px-2 py-0.5 rounded-md border border-[#8B5E34]/20">
                      {item.category}
                    </span>
                  </div>

                  <p className="text-xs text-[#8B5E34]">
                    Brand: <span className="font-semibold text-[#2D2D2D]">{item.brand}</span> • Supplier:{' '}
                    <span className="font-semibold text-[#2D2D2D]">{item.supplierName ?? item.supplier ?? 'Not set'}</span>
                  </p>

                  <div className="flex items-center gap-4 text-xs text-[#2D2D2D]/70 font-medium">
                    <span>Unit Cost: <strong className="text-[#2D2D2D]">${item.unitCost.toFixed(2)}</strong></span>
                    <span>•</span>
                    <span>Retail: <strong className="text-emerald-700">${item.retailPrice.toFixed(2)}</strong></span>
                  </div>
                </div>

                {/* Right Action Controls */}
                <div className="flex flex-wrap items-center gap-4 w-full lg:w-auto justify-between lg:justify-end border-t lg:border-t-0 border-[#B68A4C]/15 pt-3 lg:pt-0">
                  
                  <div className="text-center bg-white px-3 py-1.5 rounded-xl border border-[#B68A4C]/30">
                    <strong className="font-serif text-base block">{item.stockCount} units</strong>
                    <span className="text-[10px]">Low stock at {inventoryThreshold(item)} or fewer</span>
                  </div>
                  {purchaseUrl && (
                    <a href={purchaseUrl} target="_blank" rel="noopener noreferrer"
                      aria-label={`Reorder ${item.name} (opens in a new tab)`}
                      className="bg-white text-[#8B5E34] border border-[#B68A4C]/40 font-semibold text-xs px-3 py-2 rounded-xl">
                      Reorder
                    </a>
                  )}
                  <button disabled={pending}
                    onClick={() => { setReceivingItem(item); setReceivedQuantity(''); setError(null); }}
                    className="bg-[#8B5E34] hover:bg-[#7A5A3A] text-[#FAF8F5] font-semibold text-xs px-3 py-2 rounded-xl disabled:opacity-50">
                    Receive Stock
                  </button>

                  {/* Edit Button */}
                  <button
                    disabled={pending}
                    onClick={() => handleOpenEditModal(item)}
                    className="p-2 rounded-xl bg-white hover:bg-[#B68A4C] text-[#8B5E34] hover:text-white border border-[#B68A4C]/30 transition-all shadow-2xs cursor-pointer"
                    title="Edit Inventory Item"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>

                  {/* Delete Button */}
                  <button
                    disabled={pending}
                    onClick={() => handleDelete(item)}
                    className="p-2 rounded-xl bg-white hover:bg-red-600 text-red-600 hover:text-white border border-red-200 transition-all shadow-2xs cursor-pointer"
                    title="Delete Inventory Item"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                </div>
              </div>
            );
          })
        )}
      </div>

      {receivingItem && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4">
          <form onSubmit={handleReceive} role="dialog" aria-modal="true" aria-labelledby="receive-title"
            className="bg-[#FAF8F5] border border-[#B68A4C]/40 rounded-3xl p-6 max-w-lg w-full space-y-4 shadow-2xl">
            <h3 id="receive-title" className="font-serif text-xl font-bold">Receive Stock</h3>
            <p className="text-sm">{receivingItem.name} — record products that have arrived.</p>
            <label htmlFor="received-quantity" className="block text-xs font-bold">Quantity received</label>
            <input id="received-quantity" autoFocus required type="number" min="1" step="1" disabled={pending}
              value={receivedQuantity} onChange={(e) => setReceivedQuantity(e.target.value)}
              className="w-full h-11 px-3.5 rounded-xl border border-[#B68A4C]/40 bg-white" />
            {error && <p role="alert" className="text-sm text-red-800">{error}</p>}
            <div className="flex justify-end gap-3">
              <button type="button" disabled={pending} onClick={() => setReceivingItem(null)} className="px-4 py-2 rounded-xl bg-gray-200">Cancel</button>
              <button type="submit" disabled={pending} className="px-4 py-2 rounded-xl bg-[#8B5E34] text-white disabled:opacity-50">{pending ? 'Saving…' : 'Receive Stock'}</button>
            </div>
          </form>
        </div>
      )}

      {/* EDIT / ADD INVENTORY MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-[#FAF8F5] text-[#2D2D2D] border border-[#B68A4C]/40 rounded-3xl p-6 sm:p-8 max-w-lg w-full space-y-5 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-[#B68A4C]/25 pb-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#B68A4C]">Supply Chain Management</span>
                <h3 className="font-serif text-xl font-bold text-[#2D2D2D]">
                  {editingItem ? `Edit Item: ${editingItem.name}` : 'Add New Inventory Product'}
                </h3>
              </div>
              <button
                disabled={pending} onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-full text-[#2D2D2D]/60 hover:text-[#2D2D2D] hover:bg-gray-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmitForm} className="space-y-4 text-xs">
              {error && <p role="alert" className="text-red-800">{error}</p>}
              <fieldset disabled={pending} className="space-y-4">
              
              {/* Product Name */}
              <div>
                <label className="block font-bold text-[#2D2D2D] mb-1">Product Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. True Lengths Moisture Steam Elixir"
                  className="w-full h-11 bg-white text-[#2D2D2D] text-xs px-3.5 rounded-xl border border-[#B68A4C]/40 focus:outline-none focus:border-[#B68A4C]"
                />
              </div>

              {/* Brand & Supplier Row */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#2D2D2D] mb-1">Brand Name</label>
                  <input
                    type="text"
                    value={formData.brand}
                    onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                    placeholder="e.g. True Lengths Pro"
                    className="w-full h-11 bg-white text-[#2D2D2D] text-xs px-3.5 rounded-xl border border-[#B68A4C]/40 focus:outline-none focus:border-[#B68A4C]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#2D2D2D] mb-1">Supplier</label>
                  <input
                    type="text"
                    value={formData.supplier}
                    onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                    placeholder="e.g. True Lengths Labs"
                    className="w-full h-11 bg-white text-[#2D2D2D] text-xs px-3.5 rounded-xl border border-[#B68A4C]/40 focus:outline-none focus:border-[#B68A4C]"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="purchase-url" className="block font-bold mb-1">Purchase URL (HTTPS)</label>
                <input id="purchase-url" type="url" value={formData.purchaseUrl}
                  onChange={(e) => setFormData({ ...formData, purchaseUrl: e.target.value })}
                  placeholder="https://www.amazon.com/… or another supplier"
                  className="w-full h-11 bg-white px-3.5 rounded-xl border border-[#B68A4C]/40" />
              </div>
              {/* Category */}
              <div>
                <label className="block font-bold text-[#2D2D2D] mb-1">Category</label>
                <select
                  value={formData.category}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      category: e.target.value as InventoryItem['category'],
                    })
                  }
                  className="w-full h-11 bg-white text-[#2D2D2D] text-xs px-3.5 rounded-xl border border-[#B68A4C]/40 focus:outline-none focus:border-[#B68A4C] cursor-pointer"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              {/* Stock Count & Reorder Level */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#2D2D2D] mb-1">Stock Count (Units)</label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    readOnly={Boolean(editingItem)}
                    aria-label="Stock count (use Receive Stock for deliveries)"
                    value={formData.stockCount}
                    onChange={(e) => setFormData({ ...formData, stockCount: Number(e.target.value) })}
                    className="w-full h-11 bg-white text-[#2D2D2D] text-xs font-bold px-3.5 rounded-xl border border-[#B68A4C]/40 focus:outline-none focus:border-[#B68A4C]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#2D2D2D] mb-1">Low-stock Threshold</label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={formData.reorderLevel}
                    onChange={(e) => setFormData({ ...formData, reorderLevel: Number(e.target.value) })}
                    className="w-full h-11 bg-white text-[#2D2D2D] text-xs font-bold px-3.5 rounded-xl border border-[#B68A4C]/40 focus:outline-none focus:border-[#B68A4C]"
                  />
                </div>
              </div>

              {/* Unit Cost & Retail Price */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#2D2D2D] mb-1">Unit Cost ($)</label>
                  <input
                    type="number"
                    step="0.50"
                    min="0"
                    value={formData.unitCost}
                    onChange={(e) => setFormData({ ...formData, unitCost: parseFloat(e.target.value || '0') })}
                    className="w-full h-11 bg-white text-[#2D2D2D] text-xs font-bold px-3.5 rounded-xl border border-[#B68A4C]/40 focus:outline-none focus:border-[#B68A4C]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#2D2D2D] mb-1">Retail Price ($)</label>
                  <input
                    type="number"
                    step="0.50"
                    min="0"
                    value={formData.retailPrice}
                    onChange={(e) => setFormData({ ...formData, retailPrice: parseFloat(e.target.value || '0') })}
                    className="w-full h-11 bg-white text-[#2D2D2D] text-xs font-bold px-3.5 rounded-xl border border-[#B68A4C]/40 focus:outline-none focus:border-[#B68A4C]"
                  />
                </div>
              </div>

              {/* Modal Action Footer */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#B68A4C]/20">
                <button
                  type="button"
                  disabled={pending} onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-gray-200 hover:bg-gray-300 text-[#2D2D2D] font-bold text-xs transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-[#B68A4C] hover:bg-[#8B5E34] text-[#FAF8F5] font-bold text-xs transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>{pending ? 'Saving…' : editingItem ? 'Save Changes' : 'Add Item to Inventory'}</span>
                </button>
              </div>

              </fieldset>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
