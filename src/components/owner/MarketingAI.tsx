import React, { useState, useRef, useEffect } from 'react';
import { auth } from '../../lib/firebase';
import { MARKETING_SEGMENTS, MARKETING_TEMPLATES, requestMarketing, requestMarketingCopy, createMarketingDraft,
  loadMarketingDraft, saveMarketingDraft, marketingDraftText, type MarketingDraft, type MarketingSegment } from '../../lib/marketing';
import { Sparkles, Copy, Check, Send, Instagram, MessageSquare, RefreshCw, Upload, Camera, X, Smartphone, Mail, Download, Plus } from 'lucide-react';

export const MarketingAI: React.FC = () => {
  const ownerUid = auth.currentUser?.uid || '';
  const [draft, setDraft] = useState<MarketingDraft>(() => {
    try { return (ownerUid && loadMarketingDraft(window.localStorage, ownerUid)) || createMarketingDraft(); }
    catch { return createMarketingDraft(); }
  });
  const { segment, channel, title: promoGoal, message: generatedContent, campaignId } = draft;
  const [marketingImage, setMarketingImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [recipientCount, setRecipientCount] = useState<number | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [saved, setSaved] = useState(false);
  const sent = draft.delivered !== null;
  const busy = isSending || isGenerating;
  const deliveryStatus = sent ? `Delivered to ${draft.delivered} customer notification inbox${draft.delivered === 1 ? '' : 'es'}. Customers can read it when they open the app.` : null;
  useEffect(() => {
    try { setSaved(Boolean(ownerUid) && saveMarketingDraft(window.localStorage, ownerUid, draft)); }
    catch { setSaved(false); }
    setCopied(false);
  }, [draft, ownerUid]);
  const editDraft = (patch: Partial<Pick<MarketingDraft, 'segment' | 'channel' | 'title' | 'message'>>) => {
    setDraft((current) => ({ ...current, ...patch, campaignId: crypto.randomUUID(), delivered: null }));
    setRecipientCount(null); setError(null);
  };
  const newCampaign = () => { setDraft(createMarketingDraft()); setRecipientCount(null); setMarketingImage(null); setError(null); };

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle uploading file from Camera Roll / Device
  const handleFileUpload = (file: File) => {
    if (busy) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size === 0 || file.size > 5 * 1024 * 1024) {
      setError('Choose a JPG, PNG, or WEBP image up to 5 MB.');
      return;
    }
    setError(null);
    const reader = new FileReader();
    reader.onload = (e) => {
      if (typeof e.target?.result === 'string') {
        setMarketingImage(e.target.result);
      }
    };
    reader.onerror = () => setError('This image could not be opened. Choose another file.');
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileUpload(e.target.files[0]);
      e.target.value = '';
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleGenerate = async () => {
    if (busy || !promoGoal.trim()) return;
    setIsGenerating(true);
    setError(null);
    try {
      if (!auth.currentUser) throw new Error('Sign in as the salon owner to generate copy.');
      const text = await requestMarketingCopy({ segment, channel, title: promoGoal }, await auth.currentUser.getIdToken());
      editDraft({ message: text });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'AI copy could not be generated. Your draft was kept.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(generatedContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { setError('Copy failed. Select and copy the draft text manually.'); }
  };

  const handleBroadcast = async (previewOnly = false) => {
    if (isSending || isGenerating || sent || channel !== 'in-app') return;
    setIsSending(true); setError(null);
    try {
      if (!auth.currentUser) throw new Error('Sign in as the salon owner to send a campaign.');
      const token = await auth.currentUser.getIdToken();
      const action = previewOnly || recipientCount === null ? 'preview' : 'send';
      const result = await requestMarketing(action, { campaignId, segment, title: promoGoal, message: generatedContent }, token);
      if (action === 'preview') {
        setRecipientCount(result.delivered);
        if (!result.delivered) setError('No eligible customers match this segment. Nothing was sent.');
      } else {
        setDraft((current) => ({ ...current, delivered: result.delivered }));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delivery was not confirmed. Retry without editing to avoid duplicates.');
    } finally { setIsSending(false); }
  };

  const handleDownload = () => {
    const url = URL.createObjectURL(new Blob([marketingDraftText(draft)], { type: 'text/plain;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url; link.download = 'true-lengths-campaign.txt'; link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16">
      
      {/* Header */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-[#B68A4C]">Marketing Engine</p>
        <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#2D2D2D]">AI Campaign & Creative Studio</h2>
        <p className="text-xs text-[#2D2D2D]/60 mt-1">
          Create a campaign, review the audience, and send it to customer app inboxes. Export drafts for other channels.
        </p>
        <div className="flex flex-wrap items-center justify-between gap-3 mt-4">
          <p role="status" className="text-xs text-[#2D2D2D]/70">{saved ? 'Text draft saved on this device' : 'Draft could not be saved on this device. Download a copy to keep it.'}</p>
          <button type="button" onClick={newCampaign} disabled={busy} className="flex items-center gap-1 text-xs font-bold text-[#8B5E34] disabled:opacity-50"><Plus className="w-4 h-4" /> New campaign</button>
        </div>
      </div>

      {/* Generator Controls Grid */}
      <div className="bg-[#FAF8F5] border border-[#B68A4C]/30 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xs">
        <div className="space-y-2">
          <p className="text-xs font-bold">Start with a template</p>
          <div className="flex flex-wrap gap-2">{MARKETING_TEMPLATES.map((template) => (
            <button key={template.name} type="button" disabled={busy} onClick={() => editDraft({ title: template.title, message: template.message, segment: template.segment })}
              className="rounded-xl border border-[#B68A4C]/40 px-3 py-2 text-xs text-[#8B5E34] hover:bg-[#F4F1EC] disabled:opacity-50">{template.name}</button>
          ))}</div>
        </div>
        
        {/* Row 1: Segment & Channel */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-[#2D2D2D] mb-1.5">Target Client Segment</label>
            <select
              value={segment}
              aria-label="Target client segment"
              onChange={(e) => editDraft({ segment: e.target.value as MarketingSegment })}
              disabled={busy}
              className="w-full bg-[#F4F1EC] border border-[#B68A4C]/30 rounded-xl px-3.5 py-2.5 text-xs text-[#2D2D2D] focus:outline-none focus:ring-2 focus:ring-[#8B5E34]"
            >
              {MARKETING_SEGMENTS.map((value) => <option key={value} value={value}>{value}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#2D2D2D] mb-1.5">Marketing Channel</label>
            <div className="grid grid-cols-2 gap-1 bg-[#F4F1EC] p-1 rounded-xl border border-[#B68A4C]/20 text-xs">
              {(['in-app', 'instagram', 'sms', 'email'] as const).map((ch) => (
                <button
                  key={ch}
                  type="button"
                  disabled={busy}
                  aria-pressed={channel === ch}
                  onClick={() => { if (ch !== channel) editDraft({ channel: ch }); }}
                  className={`flex-1 py-2 font-bold rounded-lg capitalize transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    channel === ch ? 'bg-[#8B5E34] text-[#FAF8F5] shadow-xs' : 'text-[#2D2D2D]/70 hover:text-[#2D2D2D]'
                  }`}
                >
                  {ch === 'instagram' && <Instagram className="w-3.5 h-3.5" />}
                  {ch === 'sms' && <Smartphone className="w-3.5 h-3.5" />}
                  {ch === 'email' && <Mail className="w-3.5 h-3.5" />}
                  {ch === 'in-app' && <MessageSquare className="w-3.5 h-3.5" />}
                  <span>{ch === 'in-app' ? 'App inbox' : ch}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Campaign Goal */}
        <div>
          <label className="block text-xs font-bold text-[#2D2D2D] mb-1.5">Campaign Goal / Offer</label>
          <input
            type="text"
            maxLength={120}
            disabled={busy}
            aria-label="Campaign goal or offer"
            value={promoGoal}
            onChange={(e) => editDraft({ title: e.target.value })}
            placeholder="E.g., 15% off midweek Silk Press or Fill Friday slots"
            className="w-full bg-[#F4F1EC] border border-[#B68A4C]/30 rounded-xl px-3.5 py-2.5 text-xs text-[#2D2D2D] focus:outline-none focus:ring-2 focus:ring-[#8B5E34]"
          />
        </div>

        {/* CAMERA ROLL IMAGE UPLOADER */}
        <div className="space-y-3 pt-2 border-t border-[#B68A4C]/15">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-[#2D2D2D] flex items-center gap-1.5">
              <Camera className="w-4 h-4 text-[#B68A4C]" />
              <span>Campaign Visual / Photo (From Camera Roll)</span>
            </label>
            {marketingImage && (
              <button
                type="button"
                disabled={busy}
                onClick={() => setMarketingImage(null)}
                className="text-[11px] text-rose-600 font-semibold hover:underline flex items-center gap-1"
              >
                <X className="w-3 h-3" /> Remove Image
              </button>
            )}
          </div>

          {/* Hidden File Input */}
          <input
            type="file"
            ref={fileInputRef}
            accept="image/jpeg,image/png,image/webp"
            disabled={busy}
            onChange={handleFileChange}
            className="hidden"
          />

          {/* Drag & Drop Upload Zone */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => { if (!busy) fileInputRef.current?.click(); }}
            role="button" tabIndex={busy ? -1 : 0} aria-label="Choose campaign photo" aria-disabled={busy}
            onKeyDown={(event) => { if (!busy && ['Enter', ' '].includes(event.key)) { event.preventDefault(); fileInputRef.current?.click(); } }}
            className={`relative rounded-2xl border-2 border-dashed p-5 transition-all cursor-pointer text-center flex flex-col items-center justify-center space-y-2 ${
              isDragging
                ? 'border-[#8B5E34] bg-[#8B5E34]/10'
                : 'border-[#B68A4C]/40 bg-[#F4F1EC] hover:bg-[#EFEAE2] hover:border-[#8B5E34]'
            }`}
          >
            {marketingImage ? (
              <div className="relative w-full max-w-sm aspect-16/9 rounded-xl overflow-hidden border border-[#B68A4C]/30 shadow-xs group">
                <img
                  src={marketingImage}
                  alt="Marketing Visual"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 text-white text-xs font-bold">
                  <Upload className="w-4 h-4" />
                  <span>Choose Different Photo from Camera Roll</span>
                </div>
              </div>
            ) : (
              <>
                <div className="w-10 h-10 rounded-full bg-[#FAF8F5] border border-[#B68A4C]/30 flex items-center justify-center text-[#8B5E34] shadow-2xs">
                  <Upload className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-[#2D2D2D]">
                    Click to select from Camera Roll / Photos
                  </p>
                  <p className="text-[11px] text-[#2D2D2D]/60">
                    or drag & drop your salon photography file here (PNG, JPG, WEBP)
                  </p>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Generate Action Button */}
        <button
          onClick={handleGenerate}
          disabled={busy || !promoGoal.trim()}
          className="w-full bg-[#8B5E34] hover:bg-[#7A5A3A] text-[#FAF8F5] font-bold py-3.5 rounded-xl text-xs transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
        >
          {isGenerating ? (
            <span className="flex items-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin" /> Generating Luxury AI Copy...
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#B68A4C]" /> Generate AI Copy
            </span>
          )}
        </button>

      </div>

      {/* Campaign Mockup & Live Preview Card */}
      <div className="bg-[#2D2D2D] text-[#FAF8F5] border border-[#B68A4C]/30 rounded-3xl p-6 sm:p-8 space-y-5 shadow-xl relative">
        <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-[#B68A4C]/20 pb-4">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#B68A4C] flex items-center gap-2">
            {channel === 'instagram' && <Instagram className="w-4 h-4 text-rose-400" />}
            {channel === 'sms' && <Smartphone className="w-4 h-4 text-emerald-400" />}
            {channel === 'email' && <Mail className="w-4 h-4 text-amber-400" />}
            <span>{channel === 'in-app' ? 'Customer inbox message' : `${channel.toUpperCase()} draft`}</span>
          </span>

          <div className="flex flex-wrap gap-2"><button
            type="button" onClick={handleDownload}
            className="text-xs font-semibold text-[#B68A4C] bg-[#3D3D3D] px-3 py-1.5 rounded-xl border border-[#B68A4C]/30 flex items-center gap-1"
          ><Download className="w-3.5 h-3.5" /> Download draft</button><button
            onClick={handleCopy}
            className="text-xs font-semibold text-[#B68A4C] hover:text-[#FAF8F5] bg-[#3D3D3D] px-3.5 py-1.5 rounded-xl border border-[#B68A4C]/30 transition-all flex items-center gap-1.5 cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied!' : 'Copy message'}</span>
          </button></div>
        </div>

        {/* Live Channel Mockup Box */}
        <div className="bg-[#3D3D3D] rounded-2xl border border-[#B68A4C]/25 overflow-hidden shadow-inner">
          
          {/* Header Bar of Mockup */}
          <div className="bg-[#2D2D2D] px-4 py-2.5 border-b border-[#B68A4C]/20 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 font-serif font-bold text-[#FAF8F5]">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>True Lengths Salon</span>
            </div>
            <span className="text-[10px] text-[#B68A4C] font-semibold">
              To: {segment}
            </span>
          </div>

          <div className="p-4 sm:p-6 space-y-4">
            {/* Attached Camera Roll Image in Broadcast */}
            {marketingImage && (
              <div className="rounded-xl overflow-hidden border border-[#B68A4C]/30 max-h-72 aspect-16/9 bg-[#2D2D2D]">
                <img
                  src={marketingImage}
                  alt="Campaign Visual"
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            {/* AI Copy text */}
            <label className="block text-xs space-y-2">
              <span>Campaign message</span>
              <textarea value={generatedContent} onChange={(event) => editDraft({ message: event.target.value })}
                maxLength={4000} disabled={isSending || isGenerating} rows={9}
                className="w-full rounded-xl bg-[#2D2D2D] p-3 text-xs leading-relaxed text-[#FAF8F5]" />
            </label>
            <p className="text-[11px] text-[#FAF8F5]/60">{generatedContent.length.toLocaleString()} / 4,000 characters{channel === 'sms' ? ' · Aim for 160 characters for a short SMS draft.' : ''}</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
          <p className="text-[11px] text-[#FAF8F5]/60">
            {channel === 'in-app'
              ? 'Message text is delivered to customer app inboxes. Photos remain in this draft; no device push is sent.'
              : 'Draft only. Copy this content to your connected publishing or messaging service.'}
          </p>
          <button
            onClick={() => void handleBroadcast()}
            disabled={channel !== 'in-app' || isSending || isGenerating || sent || recipientCount === 0 || !generatedContent.trim() || !promoGoal.trim()}
            className="w-full sm:w-auto bg-[#B68A4C] hover:bg-[#8B5E34] disabled:opacity-50 text-[#FAF8F5] font-bold text-xs px-6 py-3 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" /> {isSending ? 'Checking delivery…' : sent ? 'Delivered' : channel !== 'in-app' ? 'Copy draft to send externally' : recipientCount === null ? 'Preview customer audience' : `Send to ${recipientCount} customer inbox${recipientCount === 1 ? '' : 'es'}`}
          </button>
        </div>
        {recipientCount !== null && !sent && <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
          <p>{recipientCount} eligible customers match this segment. {recipientCount ? 'Confirm to send the message to their app inboxes.' : 'Try All Customers or refresh after new customer activity.'}</p>
          <button type="button" disabled={busy} onClick={() => void handleBroadcast(true)} className="underline text-[#B68A4C] disabled:opacity-50">Refresh audience</button>
        </div>}
        {error && <p role="alert" className="text-sm text-rose-200">{error}</p>}
        {deliveryStatus && <p role="status" className="text-sm text-emerald-200">{deliveryStatus}</p>}
      </div>

    </div>
  );
};

