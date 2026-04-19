import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, Send, X } from 'lucide-react';
import { askGemini } from '../../services/gemini.service';

export default function ChatBot() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [busy, setBusy] = useState(false);
  const [messages, setMessages] = useState(JSON.parse(sessionStorage.getItem('smartvenuex-chat') || '[]'));

  const send = async () => {
    if (!query.trim() || busy) return;
    const next = [...messages, { role: 'user', text: query.trim() }];
    setMessages(next);
    setBusy(true);
    setQuery('');
    try {
      const response = await askGemini(query.trim());
      const merged = [...next, { role: 'ai', text: response.reply || 'Please check the nearest help desk.' }];
      setMessages(merged);
      sessionStorage.setItem('smartvenuex-chat', JSON.stringify(merged));
    } catch (err) {
      const merged = [...next, { role: 'ai', text: err.message || 'I could not reach Gemini right now.' }];
      setMessages(merged);
      sessionStorage.setItem('smartvenuex-chat', JSON.stringify(merged));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className='fixed bottom-20 right-4 z-50 md:bottom-6'>
      <button
        onClick={() => setOpen((value) => !value)}
        aria-label='Open SmartVenueX AI assistant'
        className='grid h-14 w-14 place-items-center rounded-full bg-accent text-white shadow-2xl'
      >
        {open ? <X aria-hidden='true' size={22} /> : <Bot aria-hidden='true' size={22} />}
      </button>
      <AnimatePresence>
        {open ? (
          <motion.section
            initial={{ y: 24, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 24, opacity: 0 }}
            className='absolute bottom-16 right-0 flex h-[28rem] w-[min(22rem,calc(100vw-2rem))] flex-col rounded-lg border border-white/10 bg-navy shadow-2xl'
            aria-label='Gemini AI chat'
          >
            <header className='border-b border-white/10 p-3'>
              <p className='font-heading font-bold'>Gemini Venue Assistant</p>
              <p className='text-xs text-white/60'>Ask about gates, crowd, exits, food, buses, or safety.</p>
            </header>
            <div className='flex-1 space-y-2 overflow-auto p-3'>
              {messages.length === 0 ? (
                <p className='rounded-md bg-white/10 p-3 text-sm text-white/70'>Try: Where is the nearest open food stall?</p>
              ) : null}
              {messages.map((message, index) => (
                <p
                  key={index}
                  className={`rounded-md p-3 text-sm ${
                    message.role === 'user' ? 'ml-8 bg-primary' : 'mr-8 bg-white/10 text-white/85'
                  }`}
                >
                  {message.text}
                </p>
              ))}
              {busy ? <p className='rounded-md bg-white/10 p-3 text-sm text-white/70'>Thinking with live venue context...</p> : null}
            </div>
            <div className='flex gap-2 border-t border-white/10 p-3'>
              <input
                className='min-w-0 flex-1 rounded-md bg-white/10 p-3 text-sm'
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') send();
                }}
                placeholder='Ask SmartVenueX'
                aria-label='Ask Gemini assistant'
              />
              <button className='grid w-12 place-items-center rounded-md bg-primary' onClick={send} aria-label='Send chat message'>
                <Send aria-hidden='true' size={18} />
              </button>
            </div>
          </motion.section>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
