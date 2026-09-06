import { useRef, useState, useCallback } from 'react';

interface JoystickProps {
  onMove: (dx: number, dz: number) => void;
  onEnd: () => void;
}

export default function Joystick({ onMove, onEnd }: JoystickProps) {
  const baseRef = useRef<HTMLDivElement>(null);
  const [knobPos, setKnobPos] = useState({ x: 0, y: 0 });
  const [active, setActive] = useState(false);
  const touchId = useRef<number | null>(null);
  const MAX_RADIUS = 50;

  const handleStart = useCallback((clientX: number, clientY: number, id?: number) => {
    setActive(true);
    touchId.current = id ?? null;
  }, []);

  const handleMove = useCallback((clientX: number, clientY: number) => {
    if (!baseRef.current) return;
    const rect = baseRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    let dx = clientX - centerX;
    let dy = clientY - centerY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist > MAX_RADIUS) {
      dx = (dx / dist) * MAX_RADIUS;
      dy = (dy / dist) * MAX_RADIUS;
    }
    setKnobPos({ x: dx, y: dy });
    // Normalize to -1..1 and compute movement vector
    const nx = dx / MAX_RADIUS;
    const ny = dy / MAX_RADIUS;
    // In screen space: dx = right, dy = down
    // In 3D: forward = -Z, right = +X
    // Up on joystick (ny < 0) = forward (dz negative)
    // Right on joystick (nx > 0) = right (dx positive)
    onMove(nx, ny);
  }, [onMove]);

  const handleEnd = useCallback(() => {
    setActive(false);
    setKnobPos({ x: 0, y: 0 });
    touchId.current = null;
    onEnd();
  }, [onEnd]);

  // Touch handlers
  const onTouchStart = (e: React.TouchEvent) => {
    e.preventDefault();
    const t = e.changedTouches[0];
    handleStart(t.clientX, t.clientY, t.identifier);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    e.preventDefault();
    for (let i = 0; i < e.changedTouches.length; i++) {
      const t = e.changedTouches[i];
      if (t.identifier === touchId.current) {
        handleMove(t.clientX, t.clientY);
      }
    }
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    e.preventDefault();
    for (let i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === touchId.current) {
        handleEnd();
      }
    }
  };

  // Mouse handlers (for desktop testing)
  const onMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    handleStart(e.clientX, e.clientY);
    const mm = (ev: MouseEvent) => handleMove(ev.clientX, ev.clientY);
    const mu = () => {
      handleEnd();
      window.removeEventListener('mousemove', mm);
      window.removeEventListener('mouseup', mu);
    };
    window.addEventListener('mousemove', mm);
    window.addEventListener('mouseup', mu);
  };

  return (
    <div
      ref={baseRef}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      onTouchCancel={onTouchEnd}
      onMouseDown={onMouseDown}
      className="relative w-32 h-32 rounded-full touch-none select-none"
      style={{
        background: active
          ? 'radial-gradient(circle, rgba(30,41,59,0.8) 0%, rgba(15,23,42,0.9) 100%)'
          : 'radial-gradient(circle, rgba(30,41,59,0.5) 0%, rgba(15,23,42,0.6) 100%)',
        border: active ? '2px solid rgba(251,191,36,0.6)' : '2px solid rgba(255,255,255,0.15)',
        backdropFilter: 'blur(8px)',
        boxShadow: active ? '0 0 20px rgba(251,191,36,0.3)' : '0 4px 12px rgba(0,0,0,0.4)',
      }}
    >
      {/* Direction indicators */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="absolute top-2 text-slate-500 text-xs font-bold">FWD</div>
        <div className="absolute bottom-2 text-slate-500 text-xs font-bold">BACK</div>
        <div className="absolute left-2 text-slate-500 text-xs font-bold">L</div>
        <div className="absolute right-2 text-slate-500 text-xs font-bold">R</div>
      </div>

      {/* Knob */}
      <div
        className="absolute w-14 h-14 rounded-full"
        style={{
          left: '50%',
          top: '50%',
          transform: `translate(calc(-50% + ${knobPos.x}px), calc(-50% + ${knobPos.y}px))`,
          background: active
            ? 'radial-gradient(circle, #fbbf24 0%, #f59e0b 100%)'
            : 'radial-gradient(circle, #64748b 0%, #475569 100%)',
          border: '2px solid rgba(255,255,255,0.3)',
          boxShadow: active ? '0 0 12px rgba(251,191,36,0.5)' : '0 2px 6px rgba(0,0,0,0.3)',
          transition: active ? 'none' : 'transform 0.15s ease-out, background 0.15s',
        }}
      />
    </div>
  );
}
