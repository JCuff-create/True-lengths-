import React, { useState } from 'react';
import { RevenueMetric } from '../../types';
import { Sparkles, ArrowUpRight } from 'lucide-react';

interface OwnerDashboardProps {
  metrics: RevenueMetric;
  lowStockCount?: number;
  onOpenAIMarketing: () => void;
  onOpenInventory: () => void;
  onOpenOwnerAI: () => void;
  onOpenPortfolio?: () => void;
  onOpenServices?: () => void;
}

export const OwnerDashboard: React.FC<OwnerDashboardProps> = ({
  metrics,
  lowStockCount = 0,
  onOpenAIMarketing,
  onOpenInventory,
  onOpenOwnerAI,
  onOpenPortfolio,
  onOpenServices,
}) => {
  const [timeframe, setTimeframe] = useState<string>('This Month');
  const hasData = metrics.totalAppointments > 0 || metrics.topServices.length > 0;

  return (
    <div className="space-y-6 pb-12 bg-[#2D2D2D] text-[#FAF8F5] p-6 sm:p-8 rounded-3xl border border-[#B68A4C]/30 shadow-2xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#B68A4C]/20 pb-5">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-[#B68A4C]">
            Executive Operating System
          </span>
          <h2 className="font-serif text-3xl font-bold text-[#FAF8F5]">Owner Dashboard</h2>
        </div>

        <div className="flex items-center space-x-3">
          <select
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value)}
            className="bg-[#3D3D3D] text-[#FAF8F5] text-xs font-semibold px-3.5 py-2 rounded-xl border border-[#B68A4C]/30 focus:outline-none"
          >
            <option value="This Month">This Month</option>
            <option value="Last Month">Last Month</option>
            <option value="Quarter To Date">Quarter To Date</option>
            <option value="Year To Date">Year To Date</option>
          </select>

          <button
            onClick={onOpenOwnerAI}
            className="bg-[#B68A4C] hover:bg-[#8B5E34] text-[#FAF8F5] text-xs font-bold px-4 py-2 rounded-xl shadow-xs transition-all flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Business Advisor</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[#3D3D3D] border border-[#B68A4C]/30 rounded-2xl p-4 sm:p-5 space-y-2 shadow-xs">
          <p className="text-[11px] font-medium text-[#FAF8F5]/70">Appointments</p>
          <div className="flex items-baseline justify-between">
            <h3 className="font-serif text-2xl sm:text-3xl font-bold text-[#FAF8F5]">
              {metrics.totalAppointments}
            </h3>
            {metrics.appointmentsGrowth > 0 && (
              <span className="text-xs font-bold text-emerald-400 flex items-center">
                +{metrics.appointmentsGrowth}% <ArrowUpRight className="w-3 h-3 ml-0.5" />
              </span>
            )}
          </div>
        </div>

        <div className="bg-[#3D3D3D] border border-[#B68A4C]/30 rounded-2xl p-4 sm:p-5 space-y-2 shadow-xs">
          <p className="text-[11px] font-medium text-[#FAF8F5]/70">Clients</p>
          <div className="flex items-baseline justify-between">
            <h3 className="font-serif text-2xl sm:text-3xl font-bold text-[#FAF8F5]">
              {metrics.newClients}
            </h3>
          </div>
        </div>

        <div className="bg-[#3D3D3D] border border-[#B68A4C]/30 rounded-2xl p-4 sm:p-5 space-y-2 shadow-xs">
          <p className="text-[11px] font-medium text-[#FAF8F5]/70">Revenue (completed)</p>
          <div className="flex items-baseline justify-between">
            <h3 className="font-serif text-2xl sm:text-3xl font-bold text-[#FAF8F5]">
              ${metrics.totalRevenue.toLocaleString()}
            </h3>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
        <div className="bg-[#3D3D3D] border border-[#B68A4C]/30 rounded-2xl p-6 space-y-4">
          <h3 className="font-serif font-bold text-lg text-[#FAF8F5]">Top Services Revenue</h3>
          {!hasData || metrics.topServices.length === 0 ? (
            <p className="text-xs text-[#FAF8F5]/60 py-8 text-center">
              No completed appointments yet. Metrics appear once services are booked and completed.
            </p>
          ) : (
            <div className="space-y-4">
              {metrics.topServices.map((svc) => (
                <div key={svc.name} className="space-y-1.5">
                  <div className="flex justify-between text-xs font-medium">
                    <span className="text-[#FAF8F5]">{svc.name}</span>
                    <span className="text-[#B68A4C] font-bold">{svc.percentage}%</span>
                  </div>
                  <div className="w-full bg-[#2D2D2D] h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-[#B68A4C] h-full rounded-full transition-all duration-1000"
                      style={{ width: `${svc.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-[#3D3D3D] border border-[#B68A4C]/30 rounded-2xl p-6 space-y-4 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center space-x-2 text-[#B68A4C]">
              <Sparkles className="w-5 h-5" />
              <h3 className="font-serif font-bold text-lg text-[#FAF8F5]">Salon Operations</h3>
            </div>
            <p className="text-xs text-[#FAF8F5]/80 leading-relaxed">
              Manage your live catalog, inventory, and marketing. All owner changes are saved to
              Firestore and persist after refresh and re-login.
            </p>
          </div>

          <div className="space-y-2 pt-2">
            {onOpenServices && (
              <button
                onClick={onOpenServices}
                className="w-full bg-[#B68A4C] hover:bg-[#8B5E34] text-[#FAF8F5] font-bold py-3 rounded-xl text-xs transition-all shadow-xs cursor-pointer"
              >
                Manage Services & Loyalty Rewards
              </button>
            )}
            <button
              onClick={onOpenAIMarketing}
              className="w-full bg-[#8B5E34] hover:bg-[#7A5A3A] text-[#FAF8F5] font-bold py-3 rounded-xl text-xs transition-all shadow-xs cursor-pointer"
            >
              Launch AI Campaign Generator
            </button>
            {onOpenPortfolio && (
              <button
                onClick={onOpenPortfolio}
                className="w-full bg-[#8B5E34] hover:bg-[#7A5A3A] text-[#FAF8F5] font-bold py-3 rounded-xl text-xs transition-all shadow-xs cursor-pointer"
              >
                Manage Master Portfolio
              </button>
            )}
            <button
              onClick={onOpenInventory}
              className="w-full bg-[#2D2D2D] hover:bg-[#252525] border border-[#B68A4C]/30 text-[#FAF8F5] font-semibold py-3 rounded-xl text-xs transition-all cursor-pointer"
            >
              {lowStockCount > 0
                ? `Review Low Stock Alert (${lowStockCount})`
                : 'Review Inventory'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
