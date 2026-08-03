import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage } from '../../types';
import { Sparkles, Send, Bot, RefreshCw, ArrowRight } from 'lucide-react';

export const CustomerAIAssistant: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'm1',
      sender: 'assistant',
      text: "Hi Jasmine! Welcome to True Lengths. I'm your virtual specialist for textured hair care (3A-4C), silk presses, protective styles, loc care, and melanin skin treatments. How can I assist your crown today?",
      timestamp: 'Just now',
      actionablePrompts: [
        'How do I care for my silk press in humidity?',
        'Best hydration routine for 4C hair?',
        'How often should I oil & wash knotless braids?',
        'Facial treatments for dark spots & hyperpigmentation?'
      ],
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const defaultPrompts = [
    'How do I care for my silk press in humidity?',
    'Best hydration routine for 4C hair?',
    'How often should I oil & wash knotless braids?',
    'Facial treatments for dark spots & hyperpigmentation?',
    'Scalp care for locs & protective styles?',
    'How much are starter locs & retwists?',
    'What heat protectant prevents heat damage?'
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSendMessage = async (promptToSend?: string) => {
    const text = promptToSend || inputText.trim();
    if (!text || isLoading) return;

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!promptToSend) setInputText('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/ai/customer-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: text, history: messages }),
      });

      const data = await response.json();
      const replyText = data.text || "Thank you for reaching out to True Lengths! How else can I assist your natural hair & melanin skin care journey?";
      const suggestions = (data.suggestions && data.suggestions.length > 0)
        ? data.suggestions
        : [
            "How do I maintain my silk press in humidity?",
            "What products should I use for scalp hydration?",
            "Book a Melanin Glow Facial for hyperpigmentation"
          ];

      const assistantMsg: ChatMessage = {
        id: `a-${Date.now()}`,
        sender: 'assistant',
        text: replyText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        actionablePrompts: suggestions,
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      console.error('Error fetching AI response:', err);
      const fallbackMsg: ChatMessage = {
        id: `a-${Date.now()}`,
        sender: 'assistant',
        text: "I'm available to answer your questions on silk press care, 4C hair hydration, knotless braids, loc retwists, and dark spot facials!",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        actionablePrompts: [
          "Silk Press Anti-Humidity Routine",
          "Knotless Braid Scalp Maintenance",
          "Book Melanin Dark Spot Facial"
        ],
      };
      setMessages((prev) => [...prev, fallbackMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto flex flex-col h-[calc(100vh-16rem)] min-h-[460px] max-h-[660px] bg-[#FAF8F5] border border-[#B68A4C]/25 rounded-2xl shadow-md overflow-hidden relative z-0">
      
      {/* Concierge Header */}
      <div className="bg-[#FAF8F5] border-b border-[#B68A4C]/20 p-3.5 flex items-center justify-between shrink-0">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#8B5E34] to-[#B68A4C] p-[1px] shadow-xs">
            <div className="w-full h-full bg-[#2D2D2D] rounded-full flex items-center justify-center text-[#B68A4C] font-serif font-bold text-sm">
              TL
            </div>
          </div>
          <div>
            <h3 className="font-serif font-bold text-[#2D2D2D] text-sm sm:text-base flex items-center gap-1.5">
              AI Salon & Skin Assistant <Sparkles className="w-4 h-4 text-[#B68A4C]" />
            </h3>
            <p className="text-[10px] sm:text-[11px] text-[#8B5E34]">Textured Hair & Melanin Skin Specialist</p>
          </div>
        </div>

        <button
          onClick={() => {
            setMessages([
              {
                id: `m-${Date.now()}`,
                sender: 'assistant',
                text: "Hi Jasmine! How can I assist your crown and melanin skin care today?",
                timestamp: 'Just now',
                actionablePrompts: [
                  'How do I care for my silk press in humidity?',
                  'Best hydration routine for 4C hair?',
                  'Facial treatments for dark spots & hyperpigmentation?'
                ]
              }
            ]);
          }}
          className="p-1.5 rounded-xl bg-white hover:bg-gray-100 text-[#8B5E34] text-xs font-semibold border border-[#B68A4C]/30 flex items-center gap-1 cursor-pointer shrink-0"
          title="Reset Chat"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Reset
        </button>
      </div>

      {/* Messages Stream */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex items-start gap-3 ${msg.sender === 'user' ? 'flex-row-reverse' : ''}`}
          >
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${
                msg.sender === 'user'
                  ? 'bg-[#8B5E34] text-white'
                  : 'bg-[#2D2D2D] text-[#B68A4C]'
              }`}
            >
              {msg.sender === 'user' ? 'J' : <Bot className="w-4 h-4" />}
            </div>

            <div
              className={`max-w-[85%] rounded-2xl p-4 text-xs leading-relaxed shadow-xs ${
                msg.sender === 'user'
                  ? 'bg-[#8B5E34] text-white rounded-tr-xs'
                  : 'bg-white text-[#2D2D2D] border border-[#B68A4C]/20 rounded-tl-xs'
              }`}
            >
              <p className="whitespace-pre-wrap">{msg.text}</p>

              {/* Interactive Follow-up Suggestions */}
              {msg.sender === 'assistant' && msg.actionablePrompts && msg.actionablePrompts.length > 0 && (
                <div className="mt-3 pt-2.5 border-t border-[#B68A4C]/20 space-y-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#8B5E34] flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-[#B68A4C]" /> Continue Conversation:
                  </span>
                  <div className="flex flex-col gap-1.5">
                    {msg.actionablePrompts.map((sug, sIdx) => (
                      <button
                        key={sIdx}
                        onClick={() => handleSendMessage(sug)}
                        className="w-full text-left bg-[#FAF8F5] hover:bg-[#8B5E34] text-[#2D2D2D] hover:text-white border border-[#B68A4C]/30 px-3 py-1.5 rounded-xl text-xs font-medium transition-all flex items-center justify-between gap-2 group cursor-pointer"
                      >
                        <span className="flex-1">{sug}</span>
                        <ArrowRight className="w-3.5 h-3.5 text-[#B68A4C] group-hover:text-white shrink-0 group-hover:translate-x-0.5 transition-transform" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <span
                className={`block text-[9px] mt-1.5 text-right ${
                  msg.sender === 'user' ? 'text-white/70' : 'text-[#2D2D2D]/50'
                }`}
              >
                {msg.timestamp}
              </span>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[#2D2D2D] text-[#B68A4C] flex items-center justify-center text-xs font-bold">
              <Bot className="w-4 h-4 animate-spin" />
            </div>
            <div className="bg-white border border-[#B68A4C]/20 rounded-2xl rounded-tl-xs p-3 text-xs flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-[#B68A4C] animate-ping" />
              <span className="text-[#8B5E34] font-medium">Consulting True Lengths Knowledge Engine...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Quick Prompts */}
      <div className="p-2.5 bg-[#FAF8F5] border-t border-[#B68A4C]/15 flex overflow-x-auto gap-2 no-scrollbar">
        {defaultPrompts.map((p, idx) => (
          <button
            key={idx}
            onClick={() => handleSendMessage(p)}
            className="shrink-0 bg-white hover:bg-[#8B5E34] hover:text-white text-[#8B5E34] border border-[#B68A4C]/30 px-3 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer whitespace-nowrap"
          >
            {p}
          </button>
        ))}
      </div>

      {/* Input */}
      <div className="p-3 bg-white border-t border-[#B68A4C]/20 flex items-center gap-2">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
          placeholder="Ask a question about styles, prices, or care..."
          className="flex-1 bg-[#FAF8F5] border border-[#B68A4C]/30 rounded-full px-4 py-2 text-xs text-[#2D2D2D] focus:outline-none focus:ring-2 focus:ring-[#B68A4C]"
        />
        <button
          onClick={() => handleSendMessage()}
          disabled={!inputText.trim() || isLoading}
          className="w-9 h-9 rounded-full bg-[#8B5E34] hover:bg-[#B68A4C] disabled:opacity-50 text-white flex items-center justify-center transition-all shrink-0 cursor-pointer"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>

    </div>
  );
};
