import { useState, useEffect, useCallback, useRef } from 'react';
import { X, MessageCircle, ChevronRight } from 'lucide-react';
import type { NPCData, NPCDialogueNode } from './world/npcData';
import { getDynamicGreeting } from './world/npcData';
import { sfx } from '../sfx';

interface DialoguePanelProps {
  npc: NPCData;
  onAction: (action: string) => void;
  onClose: () => void;
}

export default function DialoguePanel({ npc, onAction, onClose }: DialoguePanelProps) {
  const [currentNodeId, setCurrentNodeId] = useState('start');
  const [typedText, setTypedText] = useState('');
  const [isTyping, setIsTyping] = useState(true);
  const greetingRef = useRef<string>('');

  if (!greetingRef.current) {
    greetingRef.current = getDynamicGreeting(npc);
  }

  const currentNode: NPCDialogueNode | undefined = npc.dialogue.find(n => n.id === currentNodeId);

  const currentNodeText = currentNode?.text ?? greetingRef.current;

  // Typewriter effect + speak text with NPC voice
  useEffect(() => {
    setTypedText('');
    setIsTyping(true);
    let i = 0;
    const text = currentNodeText;
    // Speak the line with the NPC's voice profile
    sfx.speakAs(text, npc.voicePitch ?? 1.0, npc.voiceRate ?? 1.0);
    const interval = setInterval(() => {
      if (i < text.length) {
        setTypedText(text.slice(0, i + 1));
        i++;
      } else {
        setIsTyping(false);
        clearInterval(interval);
      }
    }, 25);
    return () => clearInterval(interval);
  }, [currentNodeId, currentNodeText]);

  const handleChoice = useCallback((choice: { label: string; nextNode?: string; action?: string }) => {
    if (choice.action) {
      onAction(choice.action);
    }
    if (choice.nextNode) {
      setCurrentNodeId(choice.nextNode);
    } else if (!choice.action) {
      onClose();
    }
  }, [onAction, onClose]);

  const handleEndConversation = useCallback(() => {
    try { window.speechSynthesis?.cancel(); } catch { /* ignore */ }
    onClose();
  }, [onClose]);

  // End conversation node
  useEffect(() => {
    if (currentNode?.endConversation && !isTyping) {
      // Show the final text, then user can close
    }
  }, [currentNode, isTyping]);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-950/60 backdrop-blur-sm p-0 sm:p-4">
      <div className="w-full sm:max-w-2xl bg-slate-900/95 border-2 border-white/10 rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl" style={{ animation: 'slideUp 0.3s ease-out' }}>
        {/* NPC header */}
        <div className="flex items-center gap-3 p-4 border-b border-white/10 bg-slate-950/50">
          {/* NPC avatar */}
          <div className="relative flex-shrink-0">
            <div
              className="w-14 h-14 rounded-full border-2 border-white/20 flex items-center justify-center text-2xl"
              style={{ background: `linear-gradient(135deg, ${npc.shirtColor}, ${npc.pantsColor})` }}
            >
              <svg viewBox="0 0 24 24" className="w-8 h-8" fill="white">
                <circle cx="12" cy="8" r="4" />
                <path d="M12 14c-4 0-8 2-8 5v1h16v-1c0-3-4-5-8-5z" />
              </svg>
            </div>
            <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 border-2 border-slate-900 flex items-center justify-center">
              <MessageCircle size={10} className="text-white" />
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-bold text-white text-base">{npc.name}</div>
            <div className="text-xs text-slate-400">{npc.role}</div>
          </div>
          <button
            onClick={onClose}
            className="flex-shrink-0 w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
            aria-label="Close conversation"
          >
            <X size={18} />
          </button>
          {/* Voice indicator */}
          <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-500/15 border border-blue-500/30">
            <span className="text-[9px] text-blue-400 font-bold">VOICE</span>
          </div>
        </div>

        {/* Dialogue text */}
        <div className="p-4 min-h-[80px]">
          <div className="flex gap-2">
            <div className="flex-shrink-0 w-1 rounded-full bg-emerald-500/50" />
            <p className="text-sm sm:text-base text-slate-100 leading-relaxed">
              {typedText}
              {isTyping && <span className="inline-block w-0.5 h-4 bg-emerald-400 ml-0.5 animate-pulse" />}
            </p>
          </div>
        </div>

        {/* Choices */}
        {!isTyping && currentNode && !currentNode.endConversation && (
          <div className="p-4 pt-0 space-y-2" style={{ animation: 'fadeIn 0.2s ease-out' }}>
            {currentNode.choices?.map((choice, i) => (
              <button
                key={i}
                onClick={() => handleChoice(choice)}
                className="w-full flex items-center justify-between gap-2 px-4 py-3 bg-white/5 hover:bg-emerald-950/40 border border-white/10 hover:border-emerald-500/40 rounded-xl text-left text-sm text-slate-200 hover:text-white transition-all hover:scale-[1.02]"
              >
                <span>{choice.label}</span>
                <ChevronRight size={16} className="text-slate-500 flex-shrink-0" />
              </button>
            ))}
          </div>
        )}

        {/* End conversation button */}
        {!isTyping && currentNode?.endConversation && (
          <div className="p-4 pt-0">
            <button
              onClick={handleEndConversation}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition-all hover:scale-[1.02]"
            >
              <MessageCircle size={16} />
              End Conversation
            </button>
          </div>
        )}

        {/* Talking indicator */}
        {isTyping && (
          <div className="px-4 pb-3 flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
        )}
      </div>

      <style>{`
        @keyframes fadeIn {
          0% { opacity: 0; transform: translateY(5px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideUp {
          0% { transform: translateY(30px); opacity: 0; }
          100% { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
