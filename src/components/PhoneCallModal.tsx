import { useState, useEffect, useRef, useCallback } from 'react';
import { Phone, PhoneOff, Volume2, VolumeX, Users, UserPlus, GripHorizontal, Send, MessageSquare } from 'lucide-react';
import type { LifeEvent } from '../types';
import { sfx } from '../sfx';

interface PhoneCallModalProps {
  event: LifeEvent;
  onResolve: (choiceIndex: number) => void;
  onDismiss: () => void;
  onPhaseChange?: (phase: 'incoming' | 'connected' | 'ended') => void;
}

const CALLER_NAMES: Record<string, string> = {
  birthday_party: 'Your Best Friend',
  family_trip: 'Mom',
  friend_drinks: 'Coworker',
  partner_date: 'Your Partner',
  luxury_car: 'Car Dealership',
  shopping_spree: 'Shopping Buddy',
  gym_upgrade: 'Gym Sales Rep',
  apartment_upgrade: 'Leasing Agent',
  start_youtube: 'Content Creator Friend',
  crypto_investment: 'Crypto Friend',
  side_business: 'Startup Friend',
  real_estate_flip: 'Real Estate Agent',
};

interface Participant {
  id: string;
  name: string;
  avatar: string;
  color: string;
  speaking: boolean;
  onHold: boolean;
  joinedAt: number;
}

interface ChatMessage {
  from: string;
  fromName: string;
  text: string;
  isPlayer: boolean;
  timestamp: number;
}

const EXTRA_PARTICIPANTS: { id: string; name: string; avatar: string; color: string; personality: string }[] = [
  { id: 'p_lawyer', name: 'Lawyer', avatar: '⚖️', color: '#5a4a2a', personality: 'formal and precise, gives legal advice' },
  { id: 'p_agent', name: 'Real Estate Agent', avatar: '🏠', color: '#2a5a4a', personality: 'enthusiastic about properties and deals' },
  { id: 'p_advisor', name: 'Financial Advisor', avatar: '📊', color: '#2a4a5a', personality: 'analytical and cautious about money decisions' },
  { id: 'p_partner', name: 'Your Partner', avatar: '💜', color: '#5a2a4a', personality: 'supportive but concerned about finances' },
  { id: 'p_friend', name: 'Your Friend', avatar: '🤝', color: '#4a5a2a', personality: 'casual and encouraging, sometimes impulsive' },
];

const PARTICIPANT_RESPONSES: Record<string, string[]> = {
  'p_lawyer': [
    "From a legal standpoint, you should consider the liability here.",
    "I'd recommend getting that in writing before committing.",
    "The contract terms look reasonable, but let me review the fine print.",
    "You have options here. We could negotiate better terms.",
    "Make sure there are no hidden clauses in the agreement.",
    "I'll draft a protective clause for you. Standard procedure.",
  ],
  'p_agent': [
    "This is a hot market right now — properties are moving fast!",
    "I've seen similar deals go through at 15% above asking.",
    "Location is everything. This one checks all the boxes.",
    "We could counter-offer and see if they bite.",
    "I have three more listings that might interest you.",
    "The neighborhood value has gone up 20% year over year!",
  ],
  'p_advisor': [
    "Let's look at this from a numbers perspective...",
    "Your risk exposure here is moderate. I'd diversify.",
    "Based on your current portfolio, this could be a good fit.",
    "I'd recommend setting aside an emergency fund first.",
    "The ROI projections look promising over 5 years.",
    "Have you considered the tax implications of this move?",
  ],
  'p_partner': [
    "I trust your judgment on this, but let's talk it through.",
    "How will this affect our monthly budget?",
    "I'm excited about this! But let's not rush into anything.",
    "Whatever you decide, I'm with you on this.",
    "Maybe we should sleep on it before deciding?",
    "I love the idea — just want to make sure we're covered.",
  ],
  'p_friend': [
    "Dude, go for it! Life's too short to play it safe.",
    "I did something similar last year and it worked out great!",
    "Hmm, that's a tough one. What does your gut say?",
    "You've been working hard, you deserve this.",
    "Let me know if you need any help with it!",
    "Trust the process. You've got this figured out.",
  ],
  'primary': [
    "So what do you think? Are you interested?",
    "I really think this could be a great opportunity for you.",
    "Take your time to decide, no pressure.",
    "Let me know if you have any questions about it.",
    "I've been thinking about this and wanted your input.",
    "This won't be available forever, just saying.",
  ],
};

const PLAYER_PROMPTS = [
  "Tell me more about this.",
  "What are the risks?",
  "How much would it cost?",
  "What's the timeline?",
  "I need to think about it.",
  "Sounds interesting, go on.",
  "What do you recommend?",
  "Can we negotiate the terms?",
];

export default function PhoneCallModal({ event, onResolve, onDismiss, onPhaseChange }: PhoneCallModalProps) {
  const [phase, setPhase] = useState<'incoming' | 'connected' | 'ended'>('incoming');
  const [callDuration, setCallDuration] = useState(0);
  const [muted, setMuted] = useState(false);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [activeChat, setActiveChat] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<Record<string, ChatMessage[]>>({});
  const [showChoices, setShowChoices] = useState(false);
  const phaseRef = useRef(phase);
  phaseRef.current = phase;
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Drag state
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0, px: 0, py: 0 });
  const modalRef = useRef<HTMLDivElement>(null);

  const callerName = CALLER_NAMES[event.id] ?? 'Unknown Caller';

  useEffect(() => {
    onPhaseChange?.(phase);
  }, [phase, onPhaseChange]);

  useEffect(() => {
    setParticipants([{
      id: 'primary',
      name: callerName,
      avatar: '📞',
      color: '#1e3a5a',
      speaking: true,
      onHold: false,
      joinedAt: 0,
    }]);
    setChatMessages({
      primary: [{
        from: 'primary',
        fromName: callerName,
        text: event.description,
        isPlayer: false,
        timestamp: Date.now(),
      }],
    });
  }, [callerName, event.description]);

  useEffect(() => {
    if (phase === 'connected') {
      const interval = setInterval(() => setCallDuration(d => d + 1), 1000);
      return () => clearInterval(interval);
    }
  }, [phase]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, activeChat]);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  // Drag handlers
  const handleDragStart = useCallback((clientX: number, clientY: number) => {
    setDragging(true);
    dragStart.current = { x: clientX, y: clientY, px: position.x, py: position.y };
  }, [position]);

  const handleDragMove = useCallback((clientX: number, clientY: number) => {
    if (!dragging) return;
    const dx = clientX - dragStart.current.x;
    const dy = clientY - dragStart.current.y;
    setPosition({ x: dragStart.current.px + dx, y: dragStart.current.py + dy });
  }, [dragging]);

  const handleDragEnd = useCallback(() => {
    setDragging(false);
  }, []);

  useEffect(() => {
    if (!dragging) return;
    const onMove = (e: MouseEvent) => handleDragMove(e.clientX, e.clientY);
    const onUp = () => handleDragEnd();
    const onTouchMove = (e: TouchEvent) => { e.preventDefault(); handleDragMove(e.touches[0].clientX, e.touches[0].clientY); };
    const onTouchEnd = () => handleDragEnd();
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    window.addEventListener('touchmove', onTouchMove, { passive: false });
    window.addEventListener('touchend', onTouchEnd);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
    };
  }, [dragging, handleDragMove, handleDragEnd]);

  const handleAnswer = () => {
    sfx.click();
    setPhase('connected');
    setActiveChat('primary');
  };

  const handleDecline = () => {
    sfx.click();
    setPhase('ended');
    setTimeout(() => onDismiss(), 500);
  };

  const handleChoice = (index: number) => {
    sfx.click();
    setPhase('ended');
    setTimeout(() => onResolve(index), 500);
  };

  const handleHangUp = () => {
    sfx.click();
    setPhase('ended');
    setTimeout(() => onDismiss(), 500);
  };

  const handleAddParticipant = (p: typeof EXTRA_PARTICIPANTS[0]) => {
    sfx.click();
    const newP: Participant = {
      id: p.id,
      name: p.name,
      avatar: p.avatar,
      color: p.color,
      speaking: false,
      onHold: false,
      joinedAt: callDuration,
    };
    setParticipants(prev => [...prev, newP]);
    setShowAddMenu(false);
    const joinMsg: ChatMessage = {
      from: p.id,
      fromName: p.name,
      text: `Hey! I just joined the call. What are we discussing?`,
      isPlayer: false,
      timestamp: Date.now(),
    };
    setChatMessages(prev => ({ ...prev, [p.id]: [joinMsg] }));
  };

  const toggleHold = (id: string) => {
    sfx.click();
    setParticipants(prev => prev.map(p => p.id === id ? { ...p, onHold: !p.onHold } : p));
  };

  const removeParticipant = (id: string) => {
    sfx.click();
    setParticipants(prev => prev.filter(p => p.id !== id));
    if (activeChat === id) setActiveChat('primary');
  };

  const sendMessage = (text: string) => {
    if (!activeChat) return;
    sfx.click();
    const playerMsg: ChatMessage = {
      from: 'player',
      fromName: 'You',
      text,
      isPlayer: true,
      timestamp: Date.now(),
    };
    setChatMessages(prev => ({
      ...prev,
      [activeChat]: [...(prev[activeChat] || []), playerMsg],
    }));

    // Simulate response after delay
    setTimeout(() => {
      const responses = PARTICIPANT_RESPONSES[activeChat] || PARTICIPANT_RESPONSES['primary'];
      const response = responses[Math.floor(Math.random() * responses.length)];
      const participant = participants.find(p => p.id === activeChat);
      const replyMsg: ChatMessage = {
        from: activeChat,
        fromName: participant?.name ?? 'Caller',
        text: response,
        isPlayer: false,
        timestamp: Date.now(),
      };
      setChatMessages(prev => ({
        ...prev,
        [activeChat]: [...(prev[activeChat] || []), replyMsg],
      }));
    }, 800 + Math.random() * 1200);
  };

  if (phase === 'ended') {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95">
        <div className="text-center" style={{ animation: 'fadeOut 0.5s ease-out' }}>
          <div className="text-6xl mb-4" style={{ animation: 'callPulse 1s ease-out' }}>📞</div>
          <p className="text-slate-400 text-sm">Call ended</p>
        </div>
        <style>{`
          @keyframes fadeOut { 0% { opacity: 1; } 100% { opacity: 0; } }
          @keyframes callPulse { 0% { transform: scale(1); } 50% { transform: scale(1.2); } 100% { transform: scale(1); } }
        `}</style>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 p-4">
      <div
        ref={modalRef}
        className="w-full max-w-md bg-slate-900 border border-white/10 rounded-3xl overflow-hidden shadow-2xl max-h-[90vh] flex flex-col"
        style={{
          animation: 'slideUp 0.3s ease-out',
          transform: `translate(${position.x}px, ${position.y}px)`,
          cursor: dragging ? 'grabbing' : 'default',
        }}
      >
        {/* Drag handle */}
        <div
          className="flex items-center justify-center py-2 cursor-grab active:cursor-grabbing select-none border-b border-white/5 bg-slate-800/50"
          onMouseDown={(e) => { e.preventDefault(); handleDragStart(e.clientX, e.clientY); }}
          onTouchStart={(e) => { handleDragStart(e.touches[0].clientX, e.touches[0].clientY); }}
        >
          <GripHorizontal size={18} className="text-slate-500" />
          <span className="ml-2 text-[10px] text-slate-600 font-medium uppercase tracking-wider">Drag to move</span>
        </div>

        {/* Call header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${phase === 'connected' ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500 animate-pulse'}`} />
            <span className="text-xs font-bold text-slate-400 flex items-center gap-1.5">
              {phase === 'incoming' ? 'INCOMING CALL' : (
                <>
                  {participants.length > 1 && <Users size={11} className="text-emerald-400" />}
                  {participants.length > 1 ? `CONFERENCE · ${formatTime(callDuration)}` : `CONNECTED · ${formatTime(callDuration)}`}
                </>
              )}
            </span>
          </div>
          <button
            onClick={() => { sfx.click(); setMuted(m => !m); }}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
          >
            {muted ? <VolumeX size={14} /> : <Volume2 size={14} />}
          </button>
        </div>

        {/* Content area - scrollable */}
        <div className="flex-1 overflow-y-auto min-h-0">
          {/* Caller info */}
          <div className="flex flex-col items-center py-4 px-4">
            {/* Participant avatars */}
            <div className="flex flex-wrap items-center justify-center gap-2 mb-3 max-w-[280px]">
              {participants.map(p => (
                <button
                  key={p.id}
                  onClick={() => { if (phase === 'connected') { sfx.click(); setActiveChat(p.id); } }}
                  className={`relative w-14 h-14 rounded-full border-2 flex items-center justify-center text-xl transition-all ${
                    activeChat === p.id ? 'ring-2 ring-amber-400 ring-offset-2 ring-offset-slate-900' : ''
                  }`}
                  style={{
                    background: `linear-gradient(135deg, ${p.color}, ${p.color}cc)`,
                    borderColor: p.onHold ? '#64748b' : activeChat === p.id ? '#fbbf24' : p.speaking ? '#10b981' : 'rgba(255,255,255,0.2)',
                    animation: phase === 'incoming' && p.id === 'primary' ? 'ringShake 0.5s ease-in-out infinite' : 'none',
                    opacity: p.onHold ? 0.5 : 1,
                  }}
                >
                  <span>{p.avatar}</span>
                  {p.onHold && (
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-slate-700 border border-white/20 flex items-center justify-center text-[8px] text-slate-300 font-bold">
                      II
                    </div>
                  )}
                  {activeChat === p.id && phase === 'connected' && (
                    <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-400 flex items-center justify-center">
                      <MessageSquare size={8} className="text-slate-900" />
                    </div>
                  )}
                </button>
              ))}
              {phase === 'connected' && participants.length < 5 && (
                <button
                  onClick={() => { sfx.click(); setShowAddMenu(s => !s); }}
                  className="w-14 h-14 rounded-full border-2 border-dashed border-white/20 hover:border-emerald-500/50 hover:bg-emerald-500/10 flex items-center justify-center text-slate-500 hover:text-emerald-400 transition-all"
                >
                  <UserPlus size={18} />
                </button>
              )}
            </div>

            {/* Add participant menu */}
            {showAddMenu && (
              <div className="mb-3 w-full bg-slate-950/60 rounded-xl border border-white/10 p-2 max-h-32 overflow-y-auto">
                {EXTRA_PARTICIPANTS.filter(ep => !participants.find(p => p.id === ep.id)).map(ep => (
                  <button
                    key={ep.id}
                    onClick={() => handleAddParticipant(ep)}
                    className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-white/5 transition-colors text-left"
                  >
                    <span className="text-lg">{ep.avatar}</span>
                    <span className="text-xs text-slate-200 font-medium">Add {ep.name}</span>
                  </button>
                ))}
                {EXTRA_PARTICIPANTS.every(ep => participants.find(p => p.id === ep.id)) && (
                  <p className="text-xs text-slate-500 text-center py-2">All participants added</p>
                )}
              </div>
            )}

            {phase === 'incoming' ? (
              <>
                <h2 className="text-xl font-black text-white mb-1">{callerName}</h2>
                <p className="text-sm text-slate-400 text-center">Calling about: {event.title}</p>
              </>
            ) : (
              <div className="text-center">
                <h2 className="text-base font-bold text-white">
                  {activeChat ? `Talking to: ${participants.find(p => p.id === activeChat)?.name}` : `${participants.length} on call`}
                </h2>
                <p className="text-[10px] text-slate-500 mt-0.5">Tap an avatar to switch conversations</p>
              </div>
            )}
          </div>

          {/* Incoming call buttons */}
          {phase === 'incoming' && (
            <div className="flex items-center justify-center gap-8 pb-6 px-4">
              <button onClick={handleDecline} className="flex flex-col items-center gap-2 group">
                <div className="w-16 h-16 rounded-full bg-red-500/20 border-2 border-red-500/50 group-hover:bg-red-500/30 flex items-center justify-center transition-colors">
                  <PhoneOff size={28} className="text-red-400" />
                </div>
                <span className="text-xs font-bold text-red-400">Decline</span>
              </button>
              <button onClick={handleAnswer} className="flex flex-col items-center gap-2 group">
                <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-500/50 group-hover:bg-emerald-500/30 flex items-center justify-center transition-colors" style={{ animation: 'answerPulse 1s ease-in-out infinite' }}>
                  <Phone size={28} className="text-emerald-400" />
                </div>
                <span className="text-xs font-bold text-emerald-400">Answer</span>
              </button>
            </div>
          )}

          {/* Connected: chat + controls */}
          {phase === 'connected' && activeChat && (
            <div className="px-4 pb-4">
              {/* Participant controls for conference */}
              {participants.length > 1 && (
                <div className="mb-3 space-y-1">
                  {participants.filter(p => p.id !== activeChat).map(p => (
                    <div key={p.id} className="flex items-center gap-2 bg-slate-950/40 rounded-lg px-2.5 py-1.5 border border-white/5">
                      <span className="text-sm">{p.avatar}</span>
                      <span className="flex-1 text-[11px] text-slate-300 font-medium truncate">{p.name}</span>
                      {p.onHold && <span className="text-[9px] text-amber-400 font-bold">HOLD</span>}
                      <button
                        onClick={() => toggleHold(p.id)}
                        className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                      >
                        {p.onHold ? 'Resume' : 'Hold'}
                      </button>
                      <button
                        onClick={() => removeParticipant(p.id)}
                        className="text-[10px] px-1.5 py-0.5 rounded bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors"
                      >
                        Drop
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Chat conversation area */}
              <div className="bg-slate-950/50 rounded-2xl border border-white/5 mb-3 max-h-48 overflow-y-auto">
                <div className="p-3 space-y-3">
                  {(chatMessages[activeChat] || []).map((msg, i) => (
                    <div key={i} className={`flex ${msg.isPlayer ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[80%] px-3 py-2 rounded-2xl ${
                        msg.isPlayer
                          ? 'bg-amber-500/20 border border-amber-500/30 text-amber-100'
                          : 'bg-slate-800/80 border border-white/5 text-slate-200'
                      }`}>
                        {!msg.isPlayer && (
                          <p className="text-[9px] text-emerald-400 font-bold mb-0.5">{msg.fromName}</p>
                        )}
                        <p className="text-xs leading-relaxed">{msg.text}</p>
                      </div>
                    </div>
                  ))}
                  <div ref={chatEndRef} />
                </div>
              </div>

              {/* Quick reply buttons */}
              <div className="flex flex-wrap gap-1.5 mb-3">
                {PLAYER_PROMPTS.slice(0, 4).map((prompt, i) => (
                  <button
                    key={i}
                    onClick={() => sendMessage(prompt)}
                    className="flex items-center gap-1 px-2.5 py-1.5 bg-white/5 hover:bg-amber-500/10 border border-white/10 hover:border-amber-500/30 rounded-full text-[10px] text-slate-300 hover:text-amber-300 font-medium transition-all"
                  >
                    <Send size={9} />
                    {prompt}
                  </button>
                ))}
              </div>
              <div className="flex flex-wrap gap-1.5 mb-4">
                {PLAYER_PROMPTS.slice(4).map((prompt, i) => (
                  <button
                    key={i}
                    onClick={() => sendMessage(prompt)}
                    className="flex items-center gap-1 px-2.5 py-1.5 bg-white/5 hover:bg-amber-500/10 border border-white/10 hover:border-amber-500/30 rounded-full text-[10px] text-slate-300 hover:text-amber-300 font-medium transition-all"
                  >
                    <Send size={9} />
                    {prompt}
                  </button>
                ))}
              </div>

              {/* Make decision button */}
              <button
                onClick={() => setShowChoices(c => !c)}
                className="w-full mb-2 px-4 py-2.5 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 rounded-xl text-amber-400 text-xs font-bold transition-colors text-center"
              >
                {showChoices ? 'Hide Decision Options' : 'Ready to Decide'}
              </button>

              {/* Choices */}
              {showChoices && (
                <div className="space-y-2 mb-3">
                  {event.choices.map((choice, i) => (
                    <button
                      key={i}
                      onClick={() => handleChoice(i)}
                      className="w-full text-left px-4 py-3 bg-white/5 hover:bg-emerald-950/40 border border-white/10 hover:border-emerald-500/40 rounded-xl transition-all hover:scale-[1.02]"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="font-bold text-sm text-slate-100">{choice.label}</div>
                          <div className="text-xs text-slate-400 mt-0.5">{choice.description}</div>
                        </div>
                        <div className="flex-shrink-0 text-xs text-slate-500">
                          {choice.previewImpact.cash ? (
                            <span className={choice.previewImpact.cash > 0 ? 'text-emerald-400' : 'text-red-400'}>
                              {choice.previewImpact.cash > 0 ? '+' : ''}${choice.previewImpact.cash.toLocaleString()}
                            </span>
                          ) : null}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Hang up */}
              <button
                onClick={handleHangUp}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-red-950/30 hover:bg-red-950/50 border border-red-700/30 rounded-xl text-red-400 text-sm font-bold transition-colors"
              >
                <PhoneOff size={14} />
                {participants.length > 1 ? 'End Conference' : 'Hang Up'}
              </button>
            </div>
          )}
        </div>

        <style>{`
          @keyframes ringShake { 0%, 100% { transform: rotate(0deg); } 25% { transform: rotate(-5deg); } 75% { transform: rotate(5deg); } }
          @keyframes answerPulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.08); } }
          @keyframes slideUp { 0% { transform: translateY(30px); opacity: 0; } 100% { transform: translateY(0); opacity: 1; } }
        `}</style>
      </div>
    </div>
  );
}
