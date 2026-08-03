import React, { useState } from 'react';
import { LoyaltyReward, GiftCard } from '../../types';
import { Crown, Sparkles, Gift, Check, ArrowRight } from 'lucide-react';

interface LoyaltyGiftCardsProps {
  loyaltyPoints: number;
  rewards: LoyaltyReward[];
  giftCards: GiftCard[];
  onRedeemReward: (reward: LoyaltyReward) => void;
  onBuyGiftCard: (amount: number, recipientName: string) => void;
}

export const LoyaltyGiftCards: React.FC<LoyaltyGiftCardsProps> = ({
  loyaltyPoints,
  rewards,
  giftCards,
  onRedeemReward,
  onBuyGiftCard,
}) => {
  const [activeTab, setActiveTab] = useState<'loyalty' | 'giftcards'>('loyalty');
  const [gcAmount, setGcAmount] = useState<number>(100);
  const [recipient, setRecipient] = useState<string>('');
  const [isPurchased, setIsPurchased] = useState<boolean>(false);

  const handleBuy = (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipient.trim()) return;
    onBuyGiftCard(gcAmount, recipient);
    setIsPurchased(true);
    setTimeout(() => {
      setIsPurchased(false);
      setRecipient('');
    }, 2000);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12">
      
      {/* Title */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-[#B68A4C]">Perks & Gifting</p>
        <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#2D2D2D]">Loyalty & Gift Cards</h2>
      </div>

      {/* Tabs */}
      <div className="flex p-1 bg-[#F4F1EC] rounded-xl border border-[#B68A4C]/20">
        <button
          onClick={() => setActiveTab('loyalty')}
          className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
            activeTab === 'loyalty'
              ? 'bg-[#8B5E34] text-[#FAF8F5] shadow-xs'
              : 'text-[#2D2D2D]/70 hover:text-[#2D2D2D]'
          }`}
        >
          Loyalty Rewards ({loyaltyPoints} pts)
        </button>
        <button
          onClick={() => setActiveTab('giftcards')}
          className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
            activeTab === 'giftcards'
              ? 'bg-[#8B5E34] text-[#FAF8F5] shadow-xs'
              : 'text-[#2D2D2D]/70 hover:text-[#2D2D2D]'
          }`}
        >
          Digital Gift Cards
        </button>
      </div>

      {/* LOYALTY TAB */}
      {activeTab === 'loyalty' && (
        <div className="space-y-6">
          
          {/* Gold VIP Status Card */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-tr from-[#8B5E34] via-[#B68A4C] to-[#2D2D2D] p-6 text-[#FAF8F5] shadow-lg border border-[#B68A4C]/30 space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <span className="inline-flex items-center gap-1 bg-[#FAF8F5]/20 text-[#FAF8F5] text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider backdrop-blur-xs">
                  <Crown className="w-3.5 h-3.5" /> Gold VIP Member
                </span>
                <h3 className="font-serif text-3xl font-bold mt-2">{loyaltyPoints} Points</h3>
              </div>
              <Sparkles className="w-8 h-8 text-[#FAF8F5]/60" />
            </div>

            <p className="text-xs text-[#F4F1EC]/90 font-light leading-relaxed">
              Earn 1 point for every $1 spent on appointments and haircare products at True Lengths.
            </p>

            <div className="pt-2 border-t border-[#FAF8F5]/20 flex justify-between text-xs text-[#F4F1EC]/80">
              <span>Next Tier: Platinum (500 pts)</span>
              <span>150 pts to go</span>
            </div>
          </div>

          {/* Available Rewards Catalog */}
          <div className="space-y-3">
            <h3 className="font-serif font-bold text-lg text-[#2D2D2D]">Redeemable Rewards</h3>

            {rewards.map((reward) => {
              const canRedeem = loyaltyPoints >= reward.pointsRequired;
              return (
                <div
                  key={reward.id}
                  className="bg-[#FAF8F5] border border-[#B68A4C]/25 rounded-2xl p-4 flex items-center justify-between gap-4 shadow-2xs"
                >
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#B68A4C]">
                      {reward.category}
                    </span>
                    <h4 className="font-serif font-bold text-sm text-[#2D2D2D]">{reward.title}</h4>
                    <p className="text-xs text-[#2D2D2D]/70">{reward.description}</p>
                    <p className="text-xs font-bold text-[#8B5E34]">{reward.pointsRequired} Points</p>
                  </div>

                  <button
                    onClick={() => canRedeem && onRedeemReward(reward)}
                    disabled={!canRedeem}
                    className={`shrink-0 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                      canRedeem
                        ? 'bg-[#8B5E34] text-[#FAF8F5] hover:bg-[#7A5A3A] shadow-xs'
                        : 'bg-[#F4F1EC] text-[#2D2D2D]/40 border border-[#B68A4C]/10 cursor-not-allowed'
                    }`}
                  >
                    {canRedeem ? 'Redeem' : 'Need More Pts'}
                  </button>
                </div>
              );
            })}
          </div>

        </div>
      )}

      {/* GIFT CARDS TAB */}
      {activeTab === 'giftcards' && (
        <div className="space-y-6">
          
          {/* Active Gift Cards */}
          <div className="space-y-3">
            <h3 className="font-serif font-bold text-lg text-[#2D2D2D]">Your Active Gift Cards</h3>
            {giftCards.length === 0 ? (
              <p className="text-xs text-[#2D2D2D]/60 bg-[#F4F1EC] p-4 rounded-xl">No active gift cards.</p>
            ) : (
              giftCards.map((gc) => (
                <div
                  key={gc.id}
                  className="bg-gradient-to-r from-[#2D2D2D] to-[#3D3D3D] text-[#FAF8F5] p-5 rounded-2xl border border-[#B68A4C]/40 shadow-md flex justify-between items-center"
                >
                  <div>
                    <span className="text-[10px] uppercase tracking-widest text-[#B68A4C] font-bold">
                      True Lengths Digital Card
                    </span>
                    <h4 className="font-serif text-xl font-bold tracking-wider mt-1">{gc.code}</h4>
                    <p className="text-xs text-[#F4F1EC]/70">From: {gc.senderName}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-[#B68A4C]">Balance</p>
                    <p className="font-serif text-2xl font-bold text-[#FAF8F5]">${gc.currentBalance}</p>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Buy Gift Card Form */}
          <div className="bg-[#FAF8F5] border border-[#B68A4C]/30 rounded-2xl p-6 space-y-4 shadow-sm">
            <h3 className="font-serif font-bold text-lg text-[#2D2D2D]">Send a True Lengths Experience</h3>
            <p className="text-xs text-[#2D2D2D]/70">
              Gift a loved one a luxury silk press, custom balayage, or protective braided styling session.
            </p>

            <form onSubmit={handleBuy} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#2D2D2D] mb-1.5">Select Amount</label>
                <div className="grid grid-cols-4 gap-2">
                  {[50, 100, 150, 250].map((amt) => (
                    <button
                      type="button"
                      key={amt}
                      onClick={() => setGcAmount(amt)}
                      className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                        gcAmount === amt
                          ? 'bg-[#8B5E34] text-[#FAF8F5] border-[#8B5E34]'
                          : 'bg-[#F4F1EC] text-[#2D2D2D] border-[#B68A4C]/20'
                      }`}
                    >
                      ${amt}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#2D2D2D] mb-1.5">Recipient Name</label>
                <input
                  type="text"
                  required
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                  placeholder="E.g., Michelle Obama"
                  className="w-full bg-[#F4F1EC] border border-[#B68A4C]/30 rounded-xl px-4 py-2.5 text-xs text-[#2D2D2D] focus:outline-none focus:ring-2 focus:ring-[#8B5E34]"
                />
              </div>

              <button
                type="submit"
                disabled={isPurchased}
                className="w-full bg-[#B68A4C] hover:bg-[#8B5E34] text-[#FAF8F5] font-bold py-3.5 rounded-xl shadow-md transition-all text-xs flex items-center justify-center gap-2"
              >
                {isPurchased ? (
                  <span className="flex items-center gap-2">
                    <Check className="w-4 h-4" /> Gift Card Sent!
                  </span>
                ) : (
                  <span>Purchase ${gcAmount} Gift Card</span>
                )}
              </button>
            </form>
          </div>

        </div>
      )}

    </div>
  );
};
