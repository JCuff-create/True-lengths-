import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, RevenueMetric } from '../../types';
import { Sparkles, Send, Crown, Bot, ArrowRight, MessageSquare, RefreshCw } from 'lucide-react';

interface OwnerAIAssistantProps {
  metrics: RevenueMetric;
}

export const OwnerAIAssistant: React.FC<OwnerAIAssistantProps> = ({ metrics }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'om1',
      sender: 'assistant',
      text: "Good morning Carolyn. I am your True Lengths Executive AI Operations Advisor. Monthly revenue is currently at $24,350 (+12.5% MoM). How can I assist your business growth today?",
      timestamp: 'Just now',
      actionablePrompts: [
        "Who hasn't returned in 8 weeks?",
        "Which service yields highest profit margin?",
        "Show top performing stylist revenue"
      ],
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const ownerPrompts = [
    "Who hasn't returned in 8 weeks?",
    'Which stylist earned the most this month?',
    'Which services are most profitable?',
    'Predict inventory shortages.',
    "Summarize today's business.",
    'Recommend ways to increase revenue.',
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Helper to build contextual fallback suggestions if API doesn't return any
  const getFallbackSuggestions = (text: string): string[] => {
    const lower = text.toLowerCase();
    if (lower.includes('inactive') || lower.includes('8 week') || lower.includes('client')) {
      return [
        "Draft automated SMS campaign for 14 inactive clients",
        "Offer 15% VIP discount coupon to re-engage",
        "Show client retention rate breakdown by stylist"
      ];
    }
    if (lower.includes('stylist') || lower.includes('earning') || lower.includes('carolyn') || lower.includes('tina')) {
      return [
        "Compare Carolyn R. vs Tina M. revenue contribution",
        "Set monthly target incentives for stylists",
        "View average appointment duration per stylist"
      ];
    }
    if (lower.includes('inventory') || lower.includes('stock') || lower.includes('serum') || lower.includes('backbar')) {
      return [
        "Auto-reorder Silk Thermal Protectant Serum now",
        "Which backbar products have highest markup?",
        "View forecasted stockout dates for next week"
      ];
    }
    return [
      "How can we increase client retention to 75%?",
      "Which days of the week have lowest booking density?",
      "Draft Instagram promotion for Friday Silk Press openings"
    ];
  };

  const handleSendMessage = async (promptToSend?: string) => {
    const text = promptToSend || inputText.trim();
    if (!text || isLoading) return;

    const userMsg: ChatMessage = {
      id: `ou-${Date.now()}`,
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!promptToSend) setInputText('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/ai/owner-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: text, businessData: metrics }),
      });

      const data = await response.json();
      const replyText = data.text || "I have analyzed your salon telemetry data.";
      const suggestions = (data.suggestions && data.suggestions.length > 0)
        ? data.suggestions
        : getFallbackSuggestions(text);

      const assistantMsg: ChatMessage = {
        id: `oa-${Date.now()}`,
        sender: 'assistant',
        text: replyText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        actionablePrompts: suggestions,
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      console.error(err);
      const fallbackMsg: ChatMessage = {
        id: `oa-${Date.now()}`,
        sender: 'assistant',
        text: "Executive Advisor Telemetry: Today's revenue projected at $1,280 across 5 appointments. Carolyn R. leads in Silk Press volume.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        actionablePrompts: getFallbackSuggestions(text),
      };
      setMessages((prev) => [...prev, fallbackMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto flex flex-col h-[calc(100vh-16rem)] min-h-[460px] max-h-[660px] bg-[#2D2D2D] text-[#FAF8F5] border border-[#B68A4C]/30 rounded-3xl shadow-2xl overflow-hidden relative z-0">
      
      {/* Executive Header */}
      <div className="bg-[#2D2D2D] border-b border-[#B68A4C]/20 p-4 flex items-center justify-between shrink-0">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full bg-[#B68A4C] text-[#FAF8F5] flex items-center justify-center font-bold text-sm shadow-md">
            <Crown className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-serif font-bold text-[#FAF8F5] text-base flex items-center gap-1.5">
              AI Business Advisor <Sparkles className="w-4 h-4 text-[#B68A4C]" />
            </h3>
            <p className="text-[11px] text-[#B68A4C]">True Lengths Executive Intelligence & Analytics</p>
          </div>
        </div>

        <button
          onClick={() => {
            setMessages([
              {
                id: `om-${Date.now()}`,
                sender: 'assistant',
                text: "Conversation reset. Good morning Carolyn, how can I assist your business growth today?",
                timestamp: 'Just now',
                actionablePrompts: [
                  "Who hasn't returned in 8 weeks?",
                  "Which service yields highest profit margin?",
                  "Show top performing stylist revenue"
                ]
              }
            ]);
          }}
          className="p-2 rounded-xl bg-[#3D3D3D] hover:bg-[#4D4D4D] text-[#B68A4C] hover:text-[#FAF8F5] transition-all text-xs flex items-center gap-1.5 border border-[#B68A4C]/30 cursor-pointer"
          title="Restart Conversation"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Reset Chat
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex items-start gap-3 ${msg.sender === 'user' ? 'flex-row-reverse' : ''}`}
          >
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${
                msg.sender === 'user'
                  ? 'bg-[#B68A4C] text-[#FAF8F5]'
                  : 'bg-[#3D3D3D] text-[#B68A4C] border border-[#B68A4C]/30'
              }`}
            >
              {msg.sender === 'user' ? <Crown className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
            </div>

            <div
              className={`max-w-[85%] rounded-2xl p-4 text-xs leading-relaxed shadow-xs ${
                msg.sender === 'user'
                  ? 'bg-[#B68A4C] text-[#FAF8F5] rounded-tr-xs'
                  : 'bg-[#3D3D3D] text-[#FAF8F5] border border-[#B68A4C]/25 rounded-tl-xs'
              }`}
            >
              <p className="whitespace-pre-wrap">{msg.text}</p>
              
              {/* Interactive Suggestions for Assistant Messages */}
              {msg.sender === 'assistant' && msg.actionablePrompts && msg.actionablePrompts.length > 0 && (
                <div className="mt-3.5 pt-3 border-t border-[#B68A4C]/25 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#B68A4C] flex items-center gap-1">
                      <Sparkles className="w-3 h-3" /> Suggested Follow-ups:
                    </span>
                    <span className="text-[9px] text-[#FAF8F5]/50 italic">Click to continue</span>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    {msg.actionablePrompts.map((promptText, pIdx) => (
                      <button
                        key={pIdx}
                        onClick={() => handleSendMessage(promptText)}
                        className="w-full text-left bg-[#2D2D2D] hover:bg-[#8B5E34] text-[#FAF8F5] border border-[#B68A4C]/30 hover:border-[#B68A4C] px-3 py-2 rounded-xl text-xs font-medium transition-all flex items-center justify-between gap-2 group cursor-pointer shadow-2xs"
                      >
                        <span className="flex-1 leading-snug">{promptText}</span>
                        <ArrowRight className="w-3.5 h-3.5 text-[#B68A4C] group-hover:text-white shrink-0 group-hover:translate-x-1 transition-transform" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <span
                className={`block text-[9px] mt-2 text-right ${
                  msg.sender === 'user' ? 'text-[#FAF8F5]/70' : 'text-[#FAF8F5]/50'
                }`}
              >
                {msg.timestamp}
              </span>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[#3D3D3D] text-[#B68A4C] flex items-center justify-center text-xs font-bold border border-[#B68A4C]/30">
              <Bot className="w-4 h-4 animate-spin" />
            </div>
            <div className="bg-[#3D3D3D] border border-[#B68A4C]/20 text-[#FAF8F5] rounded-2xl rounded-tl-xs p-3 text-xs flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-[#B68A4C] animate-ping" />
              <span className="text-[#B68A4C] font-medium">Analyzing telemetry & formulating strategic suggestions...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Quick Starter Prompts Row */}
      <div className="p-2.5 bg-[#3D3D3D]/90 border-t border-[#B68A4C]/20 flex overflow-x-auto gap-2 no-scrollbar shrink-0">
        <span className="shrink-0 text-[10px] font-bold text-[#B68A4C] uppercase tracking-wider self-center px-1 flex items-center gap-1">
          <MessageSquare className="w-3 h-3" /> Prompts:
        </span>
        {ownerPrompts.map((p, idx) => (
          <button
            key={idx}
            onClick={() => handleSendMessage(p)}
            className="shrink-0 bg-[#2D2D2D] hover:bg-[#B68A4C] hover:text-[#FAF8F5] text-[#B68A4C] border border-[#B68A4C]/30 px-3 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer whitespace-nowrap"
          >
            {p}
          </button>
        ))}
      </div>

      {/* Input */}
      <div className="p-3 bg-[#2D2D2D] border-t border-[#B68A4C]/20 flex items-center gap-2 shrink-0">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
          placeholder="Ask business intelligence question..."
          className="flex-1 bg-[#3D3D3D] border border-[#B68A4C]/30 rounded-full px-4 py-2.5 text-xs text-[#FAF8F5] focus:outline-none focus:ring-2 focus:ring-[#B68A4C]"
        />
        <button
          onClick={() => handleSendMessage()}
          disabled={!inputText.trim() || isLoading}
          className="w-10 h-10 rounded-full bg-[#B68A4C] hover:bg-[#8B5E34] disabled:opacity-50 text-[#FAF8F5] flex items-center justify-center transition-all shrink-0 cursor-pointer"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>

    </div>
  );
};

