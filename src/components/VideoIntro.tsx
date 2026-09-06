import { useState, useEffect, useRef } from 'react';
import { SkipForward, Play } from 'lucide-react';

interface VideoIntroProps {
  onComplete: () => void;
}

interface Clip {
  src: string;
  title: string;
  subtitle: string;
  duration: number;
  zoom: 'in' | 'out' | 'pan-right' | 'pan-left';
}

const CLIPS: Clip[] = [
  {
    src: 'https://images.pexels.com/photos/1486222/pexels-photo-1486222.jpeg?auto=compress&cs=tinysrgb&w=1920',
    title: 'Every journey begins with a single step',
    subtitle: 'Your path to financial freedom starts here',
    duration: 4500,
    zoom: 'in',
  },
  {
    src: 'https://images.pexels.com/photos/3184292/pexels-photo-3184292.jpeg?auto=compress&cs=tinysrgb&w=1920',
    title: 'Build wealth. Build independence.',
    subtitle: 'Invest, grow, and escape the 9-to-5',
    duration: 4500,
    zoom: 'pan-right',
  },
  {
    src: 'https://images.pexels.com/photos/3184339/pexels-photo-3184339.jpeg?auto=compress&cs=tinysrgb&w=1920',
    title: 'Live life on your own terms',
    subtitle: 'Welcome to FreedomPath',
    duration: 4500,
    zoom: 'out',
  },
];

const ZOOM_STYLES: Record<string, string> = {
  'in': 'animate-kenburns-in',
  'out': 'animate-kenburns-out',
  'pan-right': 'animate-kenburns-pan-right',
  'pan-left': 'animate-kenburns-pan-left',
};

export default function VideoIntro({ onComplete }: VideoIntroProps) {
  const [currentClip, setCurrentClip] = useState(0);
  const [fadeOut, setFadeOut] = useState(false);
  const [skipped, setSkipped] = useState(false);
  const [imagesLoaded, setImagesLoaded] = useState<Set<number>>(new Set());
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clip = CLIPS[currentClip];

  useEffect(() => {
    setFadeOut(false);
  }, [currentClip]);

  // Preload all images
  useEffect(() => {
    CLIPS.forEach((c, i) => {
      const img = new Image();
      img.onload = () => setImagesLoaded(prev => new Set(prev).add(i));
      img.src = c.src;
    });
  }, []);

  useEffect(() => {
    if (imagesLoaded.size === 0) return;
    if (!imagesLoaded.has(currentClip)) return;

    timerRef.current = setTimeout(() => {
      if (currentClip < CLIPS.length - 1) {
        setFadeOut(true);
        setTimeout(() => setCurrentClip(c => c + 1), 500);
      } else {
        handleComplete();
      }
    }, clip.duration);

    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [currentClip, imagesLoaded, clip.duration]);

  const handleComplete = () => {
    setFadeOut(true);
    setTimeout(onComplete, 600);
  };

  const handleSkip = () => {
    if (skipped) return;
    setSkipped(true);
    if (timerRef.current) clearTimeout(timerRef.current);
    handleComplete();
  };

  return (
    <div className={`fixed inset-0 z-50 bg-black overflow-hidden transition-opacity duration-500 ${fadeOut ? 'opacity-0' : 'opacity-100'}`}>
      {/* Cinematic image with Ken Burns effect */}
      <div className="absolute inset-0 overflow-hidden">
        <img
          key={currentClip}
          src={clip.src}
          alt=""
          className={`w-full h-full object-cover ${ZOOM_STYLES[clip.zoom]}`}
        />
      </div>

      {/* Cinematic letterbox bars */}
      <div className="absolute top-0 left-0 right-0 h-[8vh] bg-black z-10" />
      <div className="absolute bottom-0 left-0 right-0 h-[8vh] bg-black z-10" />

      {/* Dark gradient overlay for readability */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/40 z-10" />

      {/* Title overlay */}
      <div className="absolute inset-0 z-20 flex flex-col items-center justify-end pb-[14vh] px-6 text-center">
        <h1
          key={`title-${currentClip}`}
          className="text-3xl sm:text-5xl md:text-6xl font-black text-white tracking-tight drop-shadow-2xl"
          style={{ animation: 'fadeInUp 1.2s ease-out forwards' }}
        >
          {clip.title}
        </h1>
        <p
          key={`subtitle-${currentClip}`}
          className="mt-4 text-base sm:text-xl text-amber-300/90 font-medium drop-shadow-lg"
          style={{ animation: 'fadeInUp 1.2s ease-out 0.4s both' }}
        >
          {clip.subtitle}
        </p>
      </div>

      {/* Progress dots */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 flex gap-2">
        {CLIPS.map((_, i) => (
          <div
            key={i}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              i === currentClip ? 'w-8 bg-amber-400' : 'w-1.5 bg-white/40'
            }`}
          />
        ))}
      </div>

      {/* Skip button */}
      <button
        onClick={handleSkip}
        disabled={skipped}
        className="absolute top-4 right-4 z-20 flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 text-white text-sm font-medium transition-all hover:scale-105 disabled:opacity-50"
      >
        <SkipForward size={16} />
        Skip Intro
      </button>

      {/* Loading indicator */}
      {imagesLoaded.size === 0 && (
        <div className="absolute inset-0 z-20 flex items-center justify-center">
          <div className="text-amber-400 font-bold text-lg animate-pulse">Loading...</div>
        </div>
      )}

      {/* Hint */}
      {currentClip === 0 && imagesLoaded.size > 0 && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 text-white/40 text-xs">
          <Play size={12} fill="currentColor" />
          <span>FreedomPath Intro</span>
        </div>
      )}

      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes kenburnsIn {
          from { transform: scale(1.0) translate(0, 0); }
          to { transform: scale(1.15) translate(-2%, -1%); }
        }
        @keyframes kenburnsOut {
          from { transform: scale(1.15) translate(2%, 1%); }
          to { transform: scale(1.0) translate(0, 0); }
        }
        @keyframes kenburnsPanRight {
          from { transform: scale(1.1) translate(-3%, 0); }
          to { transform: scale(1.1) translate(3%, 0); }
        }
        @keyframes kenburnsPanLeft {
          from { transform: scale(1.1) translate(3%, 0); }
          to { transform: scale(1.1) translate(-3%, 0); }
        }
        .animate-kenburns-in { animation: kenburnsIn 4.5s ease-out forwards; }
        .animate-kenburns-out { animation: kenburnsOut 4.5s ease-out forwards; }
        .animate-kenburns-pan-right { animation: kenburnsPanRight 4.5s ease-in-out forwards; }
        .animate-kenburns-pan-left { animation: kenburnsPanLeft 4.5s ease-in-out forwards; }
      `}</style>
    </div>
  );
}
