import React, { useState, useRef } from 'react';
import { Sparkles, Copy, Check, Send, Instagram, MessageSquare, RefreshCw, Upload, Camera, Image as ImageIcon, X, Smartphone, Mail } from 'lucide-react';

export const MarketingAI: React.FC = () => {
  const [segment, setSegment] = useState<string>('Inactive Clients (8+ Weeks)');
  const [channel, setChannel] = useState<'instagram' | 'sms' | 'email'>('instagram');
  const [promoGoal, setPromoGoal] = useState<string>('Fill Friday Silk Press & Balayage Openings');
  const [marketingImage, setMarketingImage] = useState<string | null>(
    'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=1000&q=80'
  );
  const [generatedContent, setGeneratedContent] = useState<string>(
    `✨ Fall in love with your natural hair again at True Lengths.

It’s been a minute since your last silk press & steam treatment! Give your crown the luxury nourishment it deserves with our signature hydrating treatment and thermal heat protection.

🗓️ Limited Friday appointments available with Master Stylist Carolyn & Tina.
✨ Tap the link in bio to secure your spot today.

#TrueLengths #LuxuryHairCare #SilkPress #Balayage #HealthyHair`
  );
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [isDragging, setIsDragging] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle uploading file from Camera Roll / Device
  const handleFileUpload = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file (JPEG, PNG, WEBP, etc.)');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        setMarketingImage(e.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileUpload(e.target.files[0]);
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
    setIsGenerating(true);
    try {
      const prompt = `Write a luxury, compelling ${channel} promotional copy for a high-end salon named True Lengths.
Target Audience: ${segment}
Campaign Goal: ${promoGoal}
Tone: Warm, elegant, high-converting, professional.
Include call to action to book on the True Lengths app.`;

      const response = await fetch('/api/ai/owner-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });

      const data = await response.json();
      if (data.text) {
        setGeneratedContent(data.text);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const PRESET_MARKETING_PHOTOS = [
    { label: 'Silk Press', url: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=800&q=80' },
    { label: 'Copper Balayage', url: 'https://images.unsplash.com/photo-1580618672591-eb180b1a973f?auto=format&fit=crop&w=800&q=80' },
    { label: 'Crown Braids', url: 'https://images.unsplash.com/photo-1607779097040-26e80aa78e66?auto=format&fit=crop&w=800&q=80' },
    { label: 'Tapered Cut', url: 'https://images.unsplash.com/photo-1595476108010-b4d1f102b1b1?auto=format&fit=crop&w=800&q=80' },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16">
      
      {/* Header */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-[#B68A4C]">Marketing Engine</p>
        <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#2D2D2D]">AI Campaign & Creative Studio</h2>
        <p className="text-xs text-[#2D2D2D]/60 mt-1">
          Generate high-converting luxury promotional copy and pair with imagery from your camera roll or portfolio.
        </p>
      </div>

      {/* Generator Controls Grid */}
      <div className="bg-[#FAF8F5] border border-[#B68A4C]/30 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xs">
        
        {/* Row 1: Segment & Channel */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-[#2D2D2D] mb-1.5">Target Client Segment</label>
            <select
              value={segment}
              onChange={(e) => setSegment(e.target.value)}
              className="w-full bg-[#F4F1EC] border border-[#B68A4C]/30 rounded-xl px-3.5 py-2.5 text-xs text-[#2D2D2D] focus:outline-none focus:ring-2 focus:ring-[#8B5E34]"
            >
              <option value="Inactive Clients (8+ Weeks)">Inactive Clients (8+ Weeks)</option>
              <option value="Silk Press Enthusiasts">Silk Press Enthusiasts</option>
              <option value="Custom Color & Balayage Clients">Custom Color & Balayage Clients</option>
              <option value="VIP Gold Members">VIP Gold Members</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#2D2D2D] mb-1.5">Marketing Channel</label>
            <div className="flex bg-[#F4F1EC] p-1 rounded-xl border border-[#B68A4C]/20 text-xs">
              {(['instagram', 'sms', 'email'] as const).map((ch) => (
                <button
                  key={ch}
                  type="button"
                  onClick={() => setChannel(ch)}
                  className={`flex-1 py-2 font-bold rounded-lg capitalize transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    channel === ch ? 'bg-[#8B5E34] text-[#FAF8F5] shadow-xs' : 'text-[#2D2D2D]/70 hover:text-[#2D2D2D]'
                  }`}
                >
                  {ch === 'instagram' && <Instagram className="w-3.5 h-3.5" />}
                  {ch === 'sms' && <Smartphone className="w-3.5 h-3.5" />}
                  {ch === 'email' && <Mail className="w-3.5 h-3.5" />}
                  <span>{ch}</span>
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
            value={promoGoal}
            onChange={(e) => setPromoGoal(e.target.value)}
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
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />

          {/* Drag & Drop Upload Zone */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
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
          disabled={isGenerating}
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
        <div className="flex justify-between items-center border-b border-[#B68A4C]/20 pb-4">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#B68A4C] flex items-center gap-2">
            {channel === 'instagram' && <Instagram className="w-4 h-4 text-rose-400" />}
            {channel === 'sms' && <Smartphone className="w-4 h-4 text-emerald-400" />}
            {channel === 'email' && <Mail className="w-4 h-4 text-amber-400" />}
            <span>{channel.toUpperCase()} Broadcast Campaign Mockup</span>
          </span>

          <button
            onClick={handleCopy}
            className="text-xs font-semibold text-[#B68A4C] hover:text-[#FAF8F5] bg-[#3D3D3D] px-3.5 py-1.5 rounded-xl border border-[#B68A4C]/30 transition-all flex items-center gap-1.5 cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied!' : 'Copy Copywriting'}</span>
          </button>
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
            <p className="text-xs leading-relaxed whitespace-pre-wrap font-sans text-[#FAF8F5]/90">
              {generatedContent}
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
          <p className="text-[11px] text-[#FAF8F5]/60">
            Preview reflects what target clients will receive on {channel}.
          </p>
          <button
            onClick={() => alert(`Campaign dispatched to ${segment} via True Lengths Push & SMS Gateway!`)}
            className="w-full sm:w-auto bg-[#B68A4C] hover:bg-[#8B5E34] text-[#FAF8F5] font-bold text-xs px-6 py-3 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" /> Launch Broadcast to {segment}
          </button>
        </div>
      </div>

    </div>
  );
};

