import React, { useState } from 'react';
import { 
  MessageSquare, 
  Send, 
  Calendar, 
  MapPin, 
  ShieldCheck, 
  Sparkles, 
  Phone, 
  CheckCircle2, 
  Clock 
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { CompatibilityBadge } from '../components/ui/CompatibilityBadge';
import { Badge } from '../components/ui/Badge';

export const EnquiriesPage = () => {
  const [activeChatId, setActiveChatId] = useState('chat-1');
  const [messageText, setMessageText] = useState('');

  const conversations = [
    {
      id: 'chat-1',
      name: 'Aditya Sharma',
      role: 'Host · Koramangala Penthouse',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
      lastMessage: 'Hi Shiva, Saturday 4 PM works great for the flat visit!',
      time: '12:45 PM',
      unread: 1,
      compatibilityScore: 94,
      roomTitle: 'Sunlit Master Bedroom in 3BHK Penthouse',
    },
    {
      id: 'chat-2',
      name: 'Pooja Hegde',
      role: 'Host · HSR Sector 2',
      avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=150&q=80',
      lastMessage: 'The kitchen is strictly vegetarian. Let me know if that works.',
      time: 'Yesterday',
      unread: 0,
      compatibilityScore: 88,
      roomTitle: 'Minimalist Garden-Facing Room in HSR',
    },
    {
      id: 'chat-3',
      name: 'Rohan Kulkarni',
      role: 'Flatmate · Baner Pune',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
      lastMessage: 'Shared the WiFi speed test screenshot. 300 Mbps ping 5ms.',
      time: '2 days ago',
      unread: 0,
      compatibilityScore: 78,
      roomTitle: 'Airy High-Rise Room overlooking Baner Hills',
    }
  ];

  const activeChat = conversations.find(c => c.id === activeChatId) || conversations[0];

  const [messages, setMessages] = useState([
    { id: 1, sender: 'them', text: 'Hi Shiva! Saw your 22-factor profile. 94% compatibility is very reassuring, especially our aligned WFH and quiet hours.', time: '11:15 AM' },
    { id: 2, sender: 'me', text: 'Hello Aditya! Yes, loved the Koramangala listing. Is it possible to see the room in person this weekend?', time: '12:10 PM' },
    { id: 3, sender: 'them', text: 'Hi Shiva, Saturday 4 PM works great for the flat visit! I can show you the room and introduce our third flatmate.', time: '12:45 PM' }
  ]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!messageText.trim()) return;

    const newMsg = {
      id: Date.now(),
      sender: 'me',
      text: messageText,
      time: 'Just now'
    };

    setMessages([...messages, newMsg]);
    setMessageText('');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
      
      <div className="bg-white rounded-3xl border border-black/[0.06] shadow-apple overflow-hidden flex flex-col md:flex-row h-[750px]">
        
        {/* Left Column: Conversation List */}
        <div className="w-full md:w-80 lg:w-96 border-r border-surface-200 flex flex-col shrink-0">
          <div className="p-4 border-b border-surface-200">
            <h2 className="text-lg font-semibold text-ink-primary">Enquiries & Visits</h2>
            <p className="text-xs text-ink-secondary">Direct chats with verified room hosts</p>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-surface-200">
            {conversations.map((c) => (
              <button
                key={c.id}
                onClick={() => setActiveChatId(c.id)}
                className={`w-full p-4 text-left flex items-start gap-3 transition-colors ${
                  activeChatId === c.id ? 'bg-surface-50' : 'hover:bg-surface-50/60'
                }`}
              >
                <div className="relative shrink-0">
                  <img src={c.avatar} alt={c.name} className="w-12 h-12 rounded-full object-cover" />
                  {c.unread > 0 && (
                    <span className="absolute top-0 right-0 w-3 h-3 bg-brand-600 rounded-full border-2 border-white" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="font-semibold text-sm text-ink-primary truncate">{c.name}</span>
                    <span className="text-[10px] text-ink-tertiary">{c.time}</span>
                  </div>
                  <div className="flex items-center gap-1.5 mb-1">
                    <CompatibilityBadge score={c.compatibilityScore} showLabel={false} size="sm" />
                    <span className="text-[11px] text-ink-secondary truncate">{c.roomTitle}</span>
                  </div>
                  <p className="text-xs text-ink-tertiary truncate">{c.lastMessage}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Right Column: Active Conversation */}
        <div className="flex-1 flex flex-col bg-surface-50/40">
          
          {/* Chat Header */}
          <div className="p-4 bg-white border-b border-surface-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img src={activeChat.avatar} alt={activeChat.name} className="w-10 h-10 rounded-full object-cover" />
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="font-semibold text-sm text-ink-primary">{activeChat.name}</h3>
                  <CompatibilityBadge score={activeChat.compatibilityScore} size="sm" />
                </div>
                <p className="text-xs text-ink-secondary">{activeChat.roomTitle}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="secondary" size="sm" icon={Calendar}>
                Visit Scheduled: Sat 4 PM
              </Button>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 p-6 overflow-y-auto space-y-4">
            
            {/* Visit card attachment */}
            <div className="max-w-md mx-auto p-4 rounded-2xl bg-white border border-brand-200 shadow-subtle text-xs text-center space-y-2">
              <div className="inline-flex p-2 rounded-xl bg-brand-50 text-brand-700">
                <Calendar className="w-5 h-5" />
              </div>
              <div className="font-semibold text-sm text-ink-primary">Physical Flat Visit Scheduled</div>
              <p className="text-ink-secondary">Saturday, 4:00 PM · Koramangala 4th Block</p>
              <div className="pt-2 flex justify-center gap-2">
                <Badge variant="emerald" size="sm">Confirmed by Host</Badge>
              </div>
            </div>

            {/* Bubble list */}
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex flex-col ${m.sender === 'me' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-md p-3.5 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                    m.sender === 'me'
                      ? 'bg-brand-600 text-white rounded-tr-none'
                      : 'bg-white text-ink-primary border border-surface-200 rounded-tl-none shadow-2xs'
                  }`}
                >
                  {m.text}
                </div>
                <span className="text-[10px] text-ink-tertiary mt-1 px-1">{m.time}</span>
              </div>
            ))}

          </div>

          {/* Input Bar */}
          <form onSubmit={handleSendMessage} className="p-4 bg-white border-t border-surface-200 flex items-center gap-3">
            <input
              type="text"
              placeholder="Type your message or ask about house rules..."
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              className="flex-1 bg-surface-50 border border-surface-200 rounded-xl px-4 py-2.5 text-sm text-ink-primary focus:outline-none focus:border-brand-600 focus:bg-white transition-all"
            />
            <Button type="submit" variant="primary" size="md" icon={Send}>
              Send
            </Button>
          </form>

        </div>

      </div>

    </div>
  );
};
