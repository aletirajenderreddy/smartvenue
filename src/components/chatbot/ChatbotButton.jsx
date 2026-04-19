/**
 * ChatbotButton.jsx
 * Floating role-aware chatbot with Gemini + local fallback.
 * Appears on all dashboard pages for admin, participant, and vendor.
 */
import { useEffect, useRef, useState } from 'react';
import { Bot, Send, X, MessageSquare, Sparkles, ChevronDown } from 'lucide-react';
import { askChatbot } from '../../services/chatbot.service';

const ROLE_CONFIG = {
  admin: {
    name: 'AdminBot',
    color: 'from-violet-600 to-purple-700',
    glow: 'shadow-violet-500/40',
    badge: 'Admin AI',
    icon: '🛡️',
    placeholder: 'Ask about crowd, vendors, SOS…',
  },
  participant: {
    name: 'EventGuide',
    color: 'from-blue-600 to-cyan-700',
    glow: 'shadow-blue-500/40',
    badge: 'Your Guide',
    icon: '🎟️',
    placeholder: 'Ask about schedule, WiFi, food…',
  },
  vendor: {
    name: 'VendorBot',
    color: 'from-emerald-600 to-teal-700',
    glow: 'shadow-emerald-500/40',
    badge: 'Vendor AI',
    icon: '🏪',
    placeholder: 'Ask about orders, event logistics…',
  },
};

const QUICK_QUESTIONS = {
  admin: ['Open SOS alerts?', 'Total participants?', 'Live orders count?'],
  participant: ["What's the WiFi?", "What's next on schedule?", 'My seat number?'],
  vendor: ['Pending orders?', "Today's schedule?", 'Admin contact?'],
};

function TypingIndicator() {
  return (
    <div className="flex items-end gap-2">
      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-white/10 text-sm flex-shrink-0">
        🤖
      </div>
      <div className="rounded-2xl rounded-bl-sm bg-white/10 px-4 py-3">
        <div className="flex gap-1">
          <span className="h-1.5 w-1.5 rounded-full bg-white/60 animate-bounce" style={{ animationDelay: '0ms' }} />
          <span className="h-1.5 w-1.5 rounded-full bg-white/60 animate-bounce" style={{ animationDelay: '150ms' }} />
          <span className="h-1.5 w-1.5 rounded-full bg-white/60 animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </div>
  );
}

function ChatMessage({ msg }) {
  const isUser = msg.role === 'user';
  return (
    <div className={`flex items-end gap-2 ${isUser ? 'flex-row-reverse' : ''}`}>
      {!isUser && (
        <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-white/10 text-sm">
          🤖
        </div>
      )}
      <div
        className={`max-w-[82%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
          isUser
            ? 'rounded-br-sm bg-white/15 text-white'
            : `rounded-bl-sm bg-white/[0.08] text-white/90 ${msg.source === 'local' ? 'border border-amber-500/20' : ''}`
        }`}
        style={{ wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}
      >
        {/* Render basic markdown bold */}
        {msg.text.split(/(\*\*[^*]+\*\*)/).map((part, i) =>
          part.startsWith('**') && part.endsWith('**')
            ? <strong key={i}>{part.slice(2, -2)}</strong>
            : <span key={i}>{part}</span>
        )}
        {msg.source === 'local' && (
          <p className="mt-1 text-[10px] text-amber-400/70">Local data · Gemini unavailable</p>
        )}
      </div>
    </div>
  );
}

export default function ChatbotButton({ role, contextData, event }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [hasNew, setHasNew] = useState(false);
  const endRef = useRef(null);
  const inputRef = useRef(null);

  const cfg = ROLE_CONFIG[role] || ROLE_CONFIG.participant;
  const quickQs = QUICK_QUESTIONS[role] || [];

  // Scroll to bottom
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Focus input on open
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100);
      setHasNew(false);
    }
  }, [open]);

  // Welcome message
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([{
        id: 'welcome',
        role: 'bot',
        text: `Hi! I'm your **${cfg.name}** ${cfg.icon}\n\nI'm here to help you with anything about **${event?.name || 'this event'}**. Ask me about the schedule, WiFi, food stalls, your seat, or anything else!`,
        source: 'local',
      }]);
    }
  }, []);

  async function sendMessage(text) {
    const trimmed = (text || input).trim();
    if (!trimmed || loading) return;

    const userMsg = { id: Date.now(), role: 'user', text: trimmed };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const { reply, source } = await askChatbot(trimmed, role, contextData, event);
      const botMsg = { id: Date.now() + 1, role: 'bot', text: reply, source };
      setMessages((prev) => [...prev, botMsg]);
      if (!open) setHasNew(true);
    } catch (_err) {
      setMessages((prev) => [...prev, {
        id: Date.now() + 2,
        role: 'bot',
        text: 'Sorry, I had trouble responding. Please try again or contact the help desk.',
        source: 'error',
      }]);
    } finally {
      setLoading(false);
    }
  }

  function handleKey(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  return (
    <>
      {/* Chat panel */}
      <div
        className={`fixed bottom-24 right-4 z-50 w-[min(380px,calc(100vw-32px))] transition-all duration-300 ${
          open ? 'translate-y-0 opacity-100 pointer-events-auto' : 'translate-y-4 opacity-0 pointer-events-none'
        }`}
      >
        <div className="flex flex-col rounded-2xl border border-white/10 bg-[#0f1729]/95 backdrop-blur-xl shadow-2xl overflow-hidden max-h-[70vh]">
          {/* Header */}
          <div className={`flex items-center justify-between bg-gradient-to-r ${cfg.color} px-4 py-3`}>
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-base">
                {cfg.icon}
              </div>
              <div>
                <p className="text-sm font-bold text-white">{cfg.name}</p>
                <div className="flex items-center gap-1">
                  <Sparkles size={9} className="text-white/70" />
                  <p className="text-[10px] text-white/70">{cfg.badge} · Gemini AI</p>
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-full p-1.5 hover:bg-white/20 transition-colors"
            >
              <ChevronDown size={16} className="text-white" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[200px]">
            {messages.map((msg) => (
              <ChatMessage key={msg.id} msg={msg} />
            ))}
            {loading && <TypingIndicator />}
            <div ref={endRef} />
          </div>

          {/* Quick questions */}
          {messages.length <= 1 && (
            <div className="px-4 pb-2 flex flex-wrap gap-1.5">
              {quickQs.map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => sendMessage(q)}
                  className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs text-white/70 hover:bg-white/15 hover:text-white transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="border-t border-white/10 p-3">
            <div className="flex items-center gap-2 rounded-xl bg-white/10 border border-white/10 px-3 py-2">
              <textarea
                ref={inputRef}
                rows={1}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKey}
                placeholder={cfg.placeholder}
                className="flex-1 bg-transparent text-sm text-white placeholder:text-white/40 resize-none outline-none leading-relaxed"
                style={{ maxHeight: '80px', overflowY: 'auto' }}
              />
              <button
                type="button"
                onClick={() => sendMessage()}
                disabled={!input.trim() || loading}
                className={`flex-shrink-0 flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-r ${cfg.color} text-white transition-all disabled:opacity-40 hover:scale-110 active:scale-95`}
              >
                <Send size={14} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Floating button */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Open AI Chat Assistant"
        className={`fixed bottom-6 right-4 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br ${cfg.color} shadow-xl ${cfg.glow} transition-all duration-200 hover:scale-110 active:scale-95`}
        style={{ boxShadow: `0 0 20px 4px ${cfg.glow.replace('shadow-', '').replace('/40', '')}4d` }}
      >
        {open ? (
          <X size={22} className="text-white" />
        ) : (
          <div className="relative">
            <Bot size={22} className="text-white" />
            {hasNew && (
              <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-red-500 border-2 border-white animate-pulse" />
            )}
          </div>
        )}
        {/* Pulse ring */}
        {!open && (
          <span className={`absolute inset-0 rounded-full bg-gradient-to-br ${cfg.color} animate-ping opacity-20`} />
        )}
      </button>
    </>
  );
}
