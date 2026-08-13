import React, { useState } from 'react';
import { Service, LoyaltyReward } from '../../types';
import { X, Plus, Trash2, Check, Tag } from 'lucide-react';

interface ServiceCatalogManagerProps {
  services: Service[];
  rewards: LoyaltyReward[];
  onSaveService: (service: Service) => Promise<void>;
  onDeleteService: (id: string) => Promise<void>;
  onSaveReward: (reward: LoyaltyReward) => Promise<void>;
  onClose: () => void;
  newId: (prefix: string) => string;
}

const CATEGORIES: Service['category'][] = [
  'Silk Press',
  'Braids',
  'Color',
  'Balayage',
  'Treatments',
  'Locs & Cuts',
];

export const ServiceCatalogManager: React.FC<ServiceCatalogManagerProps> = ({
  services,
  rewards,
  onSaveService,
  onDeleteService,
  onSaveReward,
  onClose,
  newId,
}) => {
  const [tab, setTab] = useState<'services' | 'rewards'>('services');
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [category, setCategory] = useState<Service['category']>('Silk Press');
  const [price, setPrice] = useState(75);
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [description, setDescription] = useState('');
  const [rewardTitle, setRewardTitle] = useState('');
  const [pointsRequired, setPointsRequired] = useState(100);
  const [discountValue, setDiscountValue] = useState(25);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handleSaveService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    try {
      await onSaveService({
        id: newId('svc'),
        name: name.trim(),
        category,
        description: description.trim() || name.trim(),
        price: Number(price) || 0,
        durationMinutes: Number(durationMinutes) || 60,
        imageUrl:
          'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=800&q=80',
        popular: false,
      });
      setName('');
      setDescription('');
      showToast('Service saved to Firestore.');
    } catch {
      /* parent shows alert */
    } finally {
      setSaving(false);
    }
  };

  const handleSaveReward = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rewardTitle.trim()) return;
    setSaving(true);
    try {
      await onSaveReward({
        id: newId('reward'),
        title: rewardTitle.trim(),
        pointsRequired: Number(pointsRequired) || 0,
        discountValue: Number(discountValue) || 0,
        description: `${discountValue}% off / perk`,
        category: 'Service Discount',
      });
      setRewardTitle('');
      showToast('Loyalty reward saved to Firestore.');
    } catch {
      /* parent shows alert */
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-[#FAF8F5] border border-[#B68A4C]/30 w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        <div className="bg-[#2D2D2D] text-[#FAF8F5] p-5 flex items-center justify-between border-b border-[#B68A4C]/30">
          <div>
            <h2 className="font-serif text-xl font-bold">Services & Rewards</h2>
            <p className="text-xs text-[#FAF8F5]/70">Saved permanently to Firestore</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {toast && (
          <div className="bg-[#8B5E34] text-[#FAF8F5] text-xs font-semibold px-4 py-2 text-center flex items-center justify-center gap-2">
            <Check className="w-4 h-4" /> {toast}
          </div>
        )}

        <div className="flex border-b border-[#B68A4C]/20">
          <button
            onClick={() => setTab('services')}
            className={`flex-1 py-3 text-xs font-bold ${tab === 'services' ? 'text-[#8B5E34] border-b-2 border-[#8B5E34]' : 'text-gray-500'}`}
          >
            Services
          </button>
          <button
            onClick={() => setTab('rewards')}
            className={`flex-1 py-3 text-xs font-bold ${tab === 'rewards' ? 'text-[#8B5E34] border-b-2 border-[#8B5E34]' : 'text-gray-500'}`}
          >
            Loyalty Rewards
          </button>
        </div>

        <div className="p-5 overflow-y-auto space-y-4">
          {tab === 'services' ? (
            <>
              <form onSubmit={handleSaveService} className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-white border border-[#B68A4C]/20 rounded-2xl p-4">
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Service name"
                  className="sm:col-span-2 px-3 py-2 rounded-xl border border-[#B68A4C]/30 text-xs"
                  required
                />
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as Service['category'])}
                  className="px-3 py-2 rounded-xl border border-[#B68A4C]/30 text-xs"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(Number(e.target.value))}
                  placeholder="Price"
                  className="px-3 py-2 rounded-xl border border-[#B68A4C]/30 text-xs"
                />
                <input
                  type="number"
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(Number(e.target.value))}
                  placeholder="Duration (min)"
                  className="px-3 py-2 rounded-xl border border-[#B68A4C]/30 text-xs"
                />
                <input
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Description"
                  className="sm:col-span-2 px-3 py-2 rounded-xl border border-[#B68A4C]/30 text-xs"
                />
                <button
                  type="submit"
                  disabled={saving}
                  className="sm:col-span-2 py-2.5 rounded-xl bg-[#8B5E34] text-[#FAF8F5] text-xs font-bold flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" /> {saving ? 'Saving…' : 'Save Service to Firestore'}
                </button>
              </form>

              {services.length === 0 ? (
                <p className="text-xs text-center text-gray-500 py-6">No services yet.</p>
              ) : (
                <ul className="space-y-2">
                  {services.map((s) => (
                    <li
                      key={s.id}
                      className="flex items-center justify-between bg-white border border-[#B68A4C]/20 rounded-xl px-3 py-2"
                    >
                      <div>
                        <p className="text-xs font-bold text-[#2D2D2D]">{s.name}</p>
                        <p className="text-[10px] text-[#8B5E34]">
                          {s.category} · ${s.price} · {s.durationMinutes} min
                        </p>
                      </div>
                      <button
                        onClick={() => void onDeleteService(s.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </>
          ) : (
            <>
              <form onSubmit={handleSaveReward} className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-white border border-[#B68A4C]/20 rounded-2xl p-4">
                <input
                  value={rewardTitle}
                  onChange={(e) => setRewardTitle(e.target.value)}
                  placeholder="Reward title"
                  className="sm:col-span-2 px-3 py-2 rounded-xl border border-[#B68A4C]/30 text-xs"
                  required
                />
                <input
                  type="number"
                  value={pointsRequired}
                  onChange={(e) => setPointsRequired(Number(e.target.value))}
                  placeholder="Points required"
                  className="px-3 py-2 rounded-xl border border-[#B68A4C]/30 text-xs"
                />
                <input
                  type="number"
                  value={discountValue}
                  onChange={(e) => setDiscountValue(Number(e.target.value))}
                  placeholder="Discount value"
                  className="px-3 py-2 rounded-xl border border-[#B68A4C]/30 text-xs"
                />
                <button
                  type="submit"
                  disabled={saving}
                  className="sm:col-span-2 py-2.5 rounded-xl bg-[#8B5E34] text-[#FAF8F5] text-xs font-bold flex items-center justify-center gap-2"
                >
                  <Tag className="w-4 h-4" /> {saving ? 'Saving…' : 'Save Reward to Firestore'}
                </button>
              </form>

              {rewards.length === 0 ? (
                <p className="text-xs text-center text-gray-500 py-6">No loyalty rewards yet.</p>
              ) : (
                <ul className="space-y-2">
                  {rewards.map((r) => (
                    <li
                      key={r.id}
                      className="bg-white border border-[#B68A4C]/20 rounded-xl px-3 py-2"
                    >
                      <p className="text-xs font-bold text-[#2D2D2D]">{r.title}</p>
                      <p className="text-[10px] text-[#8B5E34]">
                        {r.pointsRequired} pts · ${r.discountValue} value
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
