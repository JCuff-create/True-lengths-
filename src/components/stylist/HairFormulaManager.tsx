import React, { useState } from 'react';
import { HairFormula } from '../../types';
import { FileText, Plus, Save, User, Calendar, Check, X } from 'lucide-react';

interface HairFormulaManagerProps {
  formulas: HairFormula[];
  selectedClientId?: string;
  onSaveFormula: (newFormula: HairFormula) => void;
}

export const HairFormulaManager: React.FC<HairFormulaManagerProps> = ({
  formulas,
  selectedClientId,
  onSaveFormula,
}) => {
  const [showForm, setShowForm] = useState<boolean>(false);
  const [clientName, setClientName] = useState<string>('Jasmine R.');
  const [serviceName, setServiceName] = useState<string>('Caramel Honey Balayage');
  const [baseFormula, setBaseFormula] = useState<string>('Wella Illumina 6/37 + 20vol (Root shadow)');
  const [developerVolume, setDeveloperVolume] = useState<string>('20 Vol / 30 Vol for mid-lengths');
  const [highlightToner, setHighlightToner] = useState<string>('Redken Shades EQ 09N + 09G equal parts');
  const [processingTime, setProcessingTime] = useState<string>('35 mins ambient room temp');
  const [notes, setNotes] = useState<string>('Lifted cleanly without brassiness.');
  const [isSaved, setIsSaved] = useState<boolean>(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formulaObj: HairFormula = {
      id: `f-${Date.now()}`,
      clientId: selectedClientId || 'cust-1',
      clientName,
      date: new Date().toISOString().split('T')[0],
      serviceName,
      baseFormula,
      developerVolume,
      highlightToner,
      processingTime,
      notes,
      stylistName: 'Tina M.',
    };

    onSaveFormula(formulaObj);
    setIsSaved(true);
    setTimeout(() => {
      setIsSaved(false);
      setShowForm(false);
    }, 1500);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-[#B68A4C]">Technical Records</p>
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#2D2D2D]">Client Hair Formulas</h2>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-[#8B5E34] hover:bg-[#7A5A3A] text-[#FAF8F5] text-xs font-semibold px-4 py-2.5 rounded-xl shadow-xs transition-all flex items-center gap-1.5"
        >
          {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          <span>{showForm ? 'Close Form' : 'New Formula'}</span>
        </button>
      </div>

      {/* New Formula Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-[#FAF8F5] border border-[#B68A4C]/30 rounded-2xl p-6 space-y-4 shadow-sm">
          <h3 className="font-serif font-bold text-lg text-[#2D2D2D] border-b border-[#B68A4C]/20 pb-3">
            Add Hair Color & Chemical Formula
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#2D2D2D] mb-1">Client Name</label>
              <input
                type="text"
                required
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                className="w-full bg-[#F4F1EC] border border-[#B68A4C]/30 rounded-xl px-3.5 py-2 text-xs text-[#2D2D2D] focus:outline-none focus:ring-2 focus:ring-[#8B5E34]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#2D2D2D] mb-1">Service Rendered</label>
              <input
                type="text"
                required
                value={serviceName}
                onChange={(e) => setServiceName(e.target.value)}
                className="w-full bg-[#F4F1EC] border border-[#B68A4C]/30 rounded-xl px-3.5 py-2 text-xs text-[#2D2D2D] focus:outline-none focus:ring-2 focus:ring-[#8B5E34]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#2D2D2D] mb-1">Base Formula / Root Shadow</label>
              <input
                type="text"
                value={baseFormula}
                onChange={(e) => setBaseFormula(e.target.value)}
                className="w-full bg-[#F4F1EC] border border-[#B68A4C]/30 rounded-xl px-3.5 py-2 text-xs text-[#2D2D2D] focus:outline-none focus:ring-2 focus:ring-[#8B5E34]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#2D2D2D] mb-1">Developer Volume</label>
              <input
                type="text"
                value={developerVolume}
                onChange={(e) => setDeveloperVolume(e.target.value)}
                className="w-full bg-[#F4F1EC] border border-[#B68A4C]/30 rounded-xl px-3.5 py-2 text-xs text-[#2D2D2D] focus:outline-none focus:ring-2 focus:ring-[#8B5E34]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#2D2D2D] mb-1">Highlight / Toner Recipe</label>
              <input
                type="text"
                value={highlightToner}
                onChange={(e) => setHighlightToner(e.target.value)}
                className="w-full bg-[#F4F1EC] border border-[#B68A4C]/30 rounded-xl px-3.5 py-2 text-xs text-[#2D2D2D] focus:outline-none focus:ring-2 focus:ring-[#8B5E34]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#2D2D2D] mb-1">Processing Time</label>
              <input
                type="text"
                value={processingTime}
                onChange={(e) => setProcessingTime(e.target.value)}
                className="w-full bg-[#F4F1EC] border border-[#B68A4C]/30 rounded-xl px-3.5 py-2 text-xs text-[#2D2D2D] focus:outline-none focus:ring-2 focus:ring-[#8B5E34]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#2D2D2D] mb-1">Stylist Technical Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="w-full bg-[#F4F1EC] border border-[#B68A4C]/30 rounded-xl p-3 text-xs text-[#2D2D2D] focus:outline-none focus:ring-2 focus:ring-[#8B5E34]"
            />
          </div>

          <button
            type="submit"
            disabled={isSaved}
            className="w-full bg-[#B68A4C] hover:bg-[#8B5E34] text-[#FAF8F5] font-bold py-3 rounded-xl shadow-xs transition-all text-xs flex items-center justify-center gap-2"
          >
            {isSaved ? (
              <span className="flex items-center gap-2">
                <Check className="w-4 h-4" /> Formula Saved to Client Record
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Save className="w-4 h-4" /> Save Formula Entry
              </span>
            )}
          </button>
        </form>
      )}

      {/* Formula History Cards */}
      <div className="space-y-4">
        {formulas.map((form) => (
          <div
            key={form.id}
            className="bg-[#FAF8F5] border border-[#B68A4C]/25 rounded-2xl p-5 shadow-2xs space-y-3"
          >
            <div className="flex justify-between items-start border-b border-[#B68A4C]/15 pb-3">
              <div>
                <span className="text-[10px] font-bold text-[#B68A4C] uppercase tracking-wider">
                  {form.serviceName}
                </span>
                <h4 className="font-serif font-bold text-lg text-[#2D2D2D]">{form.clientName}</h4>
                <p className="text-xs text-[#8B5E34]">Formulated by {form.stylistName}</p>
              </div>
              <span className="text-xs font-semibold text-[#2D2D2D]/60 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-[#B68A4C]" /> {form.date}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {form.baseFormula && (
                <div className="bg-[#F4F1EC] p-3 rounded-xl border border-[#B68A4C]/15">
                  <span className="text-[10px] font-bold text-[#8B5E34] uppercase block">Base Color</span>
                  <span className="text-[#2D2D2D] font-medium">{form.baseFormula}</span>
                </div>
              )}

              {form.highlightToner && (
                <div className="bg-[#F4F1EC] p-3 rounded-xl border border-[#B68A4C]/15">
                  <span className="text-[10px] font-bold text-[#8B5E34] uppercase block">Toner / Gloss</span>
                  <span className="text-[#2D2D2D] font-medium">{form.highlightToner}</span>
                </div>
              )}

              {form.developerVolume && (
                <div className="bg-[#F4F1EC] p-3 rounded-xl border border-[#B68A4C]/15">
                  <span className="text-[10px] font-bold text-[#8B5E34] uppercase block">Developer</span>
                  <span className="text-[#2D2D2D] font-medium">{form.developerVolume}</span>
                </div>
              )}

              {form.processingTime && (
                <div className="bg-[#F4F1EC] p-3 rounded-xl border border-[#B68A4C]/15">
                  <span className="text-[10px] font-bold text-[#8B5E34] uppercase block">Processing</span>
                  <span className="text-[#2D2D2D] font-medium">{form.processingTime}</span>
                </div>
              )}
            </div>

            {form.notes && (
              <p className="text-xs text-[#2D2D2D]/80 bg-[#F4F1EC]/60 p-3 rounded-xl italic border border-[#B68A4C]/10">
                "{form.notes}"
              </p>
            )}
          </div>
        ))}
      </div>

    </div>
  );
};
