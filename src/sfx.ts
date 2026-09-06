let ctx: AudioContext | null = null;
let musicGain: GainNode | null = null;
let musicPlaying = false;
let speechEnabled = true;

function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!ctx) {
    try {
      ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch { return null; }
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

interface ToneOpts {
  freq: number;
  duration: number;
  type?: OscillatorType;
  volume?: number;
  delay?: number;
  sweep?: number;
}

function tone({ freq, duration, type = 'sine', volume = 0.15, delay = 0, sweep }: ToneOpts) {
  const audio = getCtx();
  if (!audio) return;
  const osc = audio.createOscillator();
  const gain = audio.createGain();
  const start = audio.currentTime + delay;
  osc.type = type;
  osc.frequency.setValueAtTime(freq, start);
  if (sweep) osc.frequency.exponentialRampToValueAtTime(sweep, start + duration);
  gain.gain.setValueAtTime(0, start);
  gain.gain.linearRampToValueAtTime(volume, start + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.001, start + duration);
  osc.connect(gain);
  gain.connect(audio.destination);
  osc.start(start);
  osc.stop(start + duration);
}

function speak(text: string) {
  if (!speechEnabled) return;
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  try {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.rate = 1.0; u.pitch = 1.0; u.volume = 0.7;
    window.speechSynthesis.speak(u);
  } catch { /* silent */ }
}

function startMusic() {
  const audio = getCtx();
  if (!audio || musicPlaying) return;
  musicPlaying = true;
  musicGain = audio.createGain();
  musicGain.gain.value = 0.03;
  musicGain.connect(audio.destination);

  const chords = [
    [220.00, 261.63, 329.63],
    [174.61, 220.00, 261.63],
    [261.63, 329.63, 392.00],
    [196.00, 246.94, 293.66],
  ];
  let chordIndex = 0;
  let chordOscs: OscillatorNode[] = [];

  function playChord() {
    if (!musicPlaying || !musicGain || !audio) return;
    chordOscs.forEach(o => { try { o.stop(); } catch { /* ignore */ } });
    chordOscs = [];
    const chord = chords[chordIndex % chords.length];
    chord.forEach((freq) => {
      const osc = audio.createOscillator();
      const g = audio.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      const now = audio.currentTime;
      g.gain.setValueAtTime(0, now);
      g.gain.linearRampToValueAtTime(0.4, now + 1.5);
      g.gain.linearRampToValueAtTime(0.3, now + 3.5);
      g.gain.linearRampToValueAtTime(0, now + 4.5);
      osc.connect(g);
      g.connect(musicGain!);
      osc.start(now);
      osc.stop(now + 4.8);
      chordOscs.push(osc);
    });
    chordIndex++;
    setTimeout(playChord, 4000);
  }
  playChord();
}

function stopMusic() {
  musicPlaying = false;
  if (musicGain) { try { musicGain.disconnect(); } catch { /* ignore */ } musicGain = null; }
}

function monthName(m: number): string {
  const names = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  return names[m - 1] || 'Unknown';
}

// === Ambient sound generators ===
let ambientNodes: { stop: () => void }[] = [];
let ambientEnabled = true;

function noiseBurst(duration: number, volume: number, filterFreq: number, type: BiquadFilterType = 'bandpass'): void {
  const audio = getCtx();
  if (!audio) return;
  const bufferSize = Math.floor(audio.sampleRate * duration);
  const buffer = audio.createBuffer(1, bufferSize, audio.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
  const src = audio.createBufferSource();
  src.buffer = buffer;
  const filter = audio.createBiquadFilter();
  filter.type = type;
  filter.frequency.value = filterFreq;
  filter.Q.value = 2;
  const gain = audio.createGain();
  gain.gain.setValueAtTime(0, audio.currentTime);
  gain.gain.linearRampToValueAtTime(volume, audio.currentTime + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + duration);
  src.connect(filter);
  filter.connect(gain);
  gain.connect(audio.destination);
  src.start();
  src.stop(audio.currentTime + duration);
}

function birdChirp(): void {
  const audio = getCtx();
  if (!audio) return;
  const baseFreq = 2000 + Math.random() * 1500;
  const numNotes = 2 + Math.floor(Math.random() * 3);
  for (let i = 0; i < numNotes; i++) {
    tone({ freq: baseFreq + i * 200, duration: 0.06, type: 'sine', volume: 0.04, delay: i * 0.08, sweep: baseFreq + i * 200 + 300 });
  }
}

function dogBark(): void {
  noiseBurst(0.08, 0.06, 600, 'bandpass');
  setTimeout(() => noiseBurst(0.08, 0.06, 600, 'bandpass'), 120);
  setTimeout(() => noiseBurst(0.06, 0.05, 700, 'bandpass'), 240);
}

function catMeow(): void {
  tone({ freq: 800, duration: 0.3, type: 'sine', volume: 0.05, sweep: 1100 });
  setTimeout(() => tone({ freq: 700, duration: 0.25, type: 'sine', volume: 0.04, sweep: 900 }), 320);
}

function phoneRing(): void {
  const audio = getCtx();
  if (!audio) return;
  // Classic two-tone ring: 440Hz + 480Hz, 2s on, 4s off pattern
  const ringOnce = () => {
    if (!ambientEnabled) return;
    const osc1 = audio.createOscillator();
    const osc2 = audio.createOscillator();
    const gain = audio.createGain();
    osc1.frequency.value = 440;
    osc2.frequency.value = 480;
    osc1.type = 'sine';
    osc2.type = 'sine';
    gain.gain.setValueAtTime(0, audio.currentTime);
    gain.gain.linearRampToValueAtTime(0.08, audio.currentTime + 0.05);
    gain.gain.linearRampToValueAtTime(0.08, audio.currentTime + 1.9);
    gain.gain.linearRampToValueAtTime(0, audio.currentTime + 2.0);
    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(audio.destination);
    osc1.start();
    osc2.start();
    osc1.stop(audio.currentTime + 2.0);
    osc2.stop(audio.currentTime + 2.0);
  };
  ringOnce();
  setTimeout(ringOnce, 2500); // second ring burst
}

function startAmbient(): void {
  const audio = getCtx();
  if (!audio || ambientNodes.length > 0) return;
  ambientEnabled = true;

  // Low street rumble — continuous brown noise filtered
  const bufferSize = audio.sampleRate * 2;
  const buffer = audio.createBuffer(1, bufferSize, audio.sampleRate);
  const data = buffer.getChannelData(0);
  let lastOut = 0;
  for (let i = 0; i < bufferSize; i++) {
    const white = Math.random() * 2 - 1;
    data[i] = (lastOut + 0.02 * white) / 1.02;
    lastOut = data[i];
    data[i] *= 3.5;
  }
  const src = audio.createBufferSource();
  src.buffer = buffer;
  src.loop = true;
  const filter = audio.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 120;
  const gain = audio.createGain();
  gain.gain.value = 0.015;
  src.connect(filter);
  filter.connect(gain);
  gain.connect(audio.destination);
  src.start();
  ambientNodes.push({
    stop: () => { try { src.stop(); } catch { /* ignore */ } gain.disconnect(); },
  });

  // Random ambient events: birds, dogs, cats
  let stopped = false;
  const eventLoop = () => {
    if (stopped || !ambientEnabled) return;
    const roll = Math.random();
    if (roll < 0.5) birdChirp();
    else if (roll < 0.7) dogBark();
    else if (roll < 0.8) catMeow();
    const nextDelay = 3000 + Math.random() * 6000;
    setTimeout(eventLoop, nextDelay);
  };
  setTimeout(eventLoop, 2000);
  ambientNodes.push({ stop: () => { stopped = true; } });
}

function stopAmbient(): void {
  ambientEnabled = false;
  ambientNodes.forEach(n => n.stop());
  ambientNodes = [];
}

function setAmbientEnabled(enabled: boolean): void {
  ambientEnabled = enabled;
  if (!enabled) {
    ambientNodes.forEach(n => n.stop());
    ambientNodes = [];
  } else {
    startAmbient();
  }
}

// Speak with a specific voice character (pitch, rate)
function speakAs(text: string, pitch: number, rate: number): void {
  if (!speechEnabled) return;
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  try {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.rate = rate;
    u.pitch = pitch;
    u.volume = 0.8;
    window.speechSynthesis.speak(u);
  } catch { /* silent */ }
}

export const sfx = {
  click: () => tone({ freq: 800, duration: 0.05, type: 'sine', volume: 0.08 }),
  hover: () => tone({ freq: 1200, duration: 0.03, type: 'sine', volume: 0.04 }),
  select: () => { tone({ freq: 600, duration: 0.08, type: 'triangle', volume: 0.1 }); tone({ freq: 900, duration: 0.08, type: 'triangle', volume: 0.08, delay: 0.04 }); },
  action: () => { tone({ freq: 500, duration: 0.1, type: 'square', volume: 0.06, sweep: 800 }); tone({ freq: 800, duration: 0.12, type: 'sine', volume: 0.08, delay: 0.06 }); },
  success: () => { tone({ freq: 523, duration: 0.1, type: 'sine', volume: 0.12 }); tone({ freq: 659, duration: 0.1, type: 'sine', volume: 0.12, delay: 0.08 }); tone({ freq: 784, duration: 0.15, type: 'sine', volume: 0.14, delay: 0.16 }); },
  error: () => tone({ freq: 200, duration: 0.15, type: 'sawtooth', volume: 0.08, sweep: 100 }),
  milestone: () => { tone({ freq: 523, duration: 0.12, type: 'triangle', volume: 0.12 }); tone({ freq: 659, duration: 0.12, type: 'triangle', volume: 0.12, delay: 0.1 }); tone({ freq: 784, duration: 0.12, type: 'triangle', volume: 0.14, delay: 0.2 }); tone({ freq: 1047, duration: 0.2, type: 'triangle', volume: 0.16, delay: 0.3 }); },
  turn: () => tone({ freq: 400, duration: 0.08, type: 'sine', volume: 0.08, sweep: 600 }),
  income: () => { tone({ freq: 880, duration: 0.08, type: 'sine', volume: 0.1 }); tone({ freq: 1100, duration: 0.1, type: 'sine', volume: 0.08, delay: 0.04 }); tone({ freq: 1320, duration: 0.12, type: 'sine', volume: 0.1, delay: 0.08 }); },
  loan: () => { tone({ freq: 300, duration: 0.1, type: 'sawtooth', volume: 0.08 }); tone({ freq: 200, duration: 0.15, type: 'sine', volume: 0.06, delay: 0.08 }); },
  startMusic, stopMusic,
  setMusicVolume: (v: number) => { if (musicGain) musicGain.gain.value = v; },
  setSpeechEnabled: (enabled: boolean) => { speechEnabled = enabled; },
  speak,
  guideNextMove: (actionsLeft: number, month: number, year: number) => {
    if (actionsLeft > 0) speak(`It's ${monthName(month)} ${year}. You have ${actionsLeft} action${actionsLeft > 1 ? 's' : ''} remaining this month. Choose your next move.`);
    else speak(`It's ${monthName(month)} ${year}. You've used all your actions. End your turn to advance to the next month.`);
  },
  guideActionTaken: (actionName: string, cashChange: number) => {
    const sign = cashChange >= 0 ? 'gained' : 'lost';
    speak(`${actionName}. You ${sign} ${Math.abs(cashChange)} dollars.`);
  },
  guideMilestone: (level: number) => speak(`Congratulations! You've reached level ${level}!`),
  guideIncome: (amount: number) => speak(`Income collected! You received ${amount} dollars this month.`),
  guideNewGame: (name: string, archetype: string) => speak(`Welcome, ${name}. You are starting as a ${archetype}. Your freedom path begins now.`),
  guideLoan: (amount: number) => speak(`Bank loan approved. You received ${amount} dollars. Remember to make monthly payments.`),
  guideLowEnergy: () => speak("Your energy is running low. Consider a rest or wellness activity to recharge."),
  guideLowHappiness: () => speak("Your happiness is dropping. Try something fun to boost your mood."),
  guideHighCash: (amount: number) => speak(`You now have ${amount} dollars. Consider investing in assets to build passive income.`),
  guideWealthMilestone: (amount: number) => speak(`Incredible! You've crossed ${amount} dollars in net worth. You're on your way to financial freedom!`),
  guideFirstAsset: () => speak("Your first asset! This is the beginning of your passive income journey."),
  guideLoanPaidOff: (purpose: string) => speak(`Congratulations! Your loan for ${purpose} has been fully paid off.`),
  guideNewMonth: (month: number, year: number, cash: number, income: number) => {
    const monthNameStr = monthName(month);
    let msg = `Welcome to ${monthNameStr} ${year}.`;
    if (income > 0) msg += ` You earned ${income} dollars in passive income.`;
    if (cash < 200) msg += ` Cash is tight — be careful with spending.`;
    else if (cash > 50000) msg += ` You're building real wealth. Consider investing.`;
    speak(msg);
  },
  guideEndTurnReminder: (actionsLeft: number) => {
    if (actionsLeft === 1) speak("One action left. Make it count!");
    else speak(`${actionsLeft} actions remaining. Keep going!`);
  },
  guideRestart: () => speak("Starting a new game. Your freedom journey begins anew."),
  guideExit: () => speak("Thanks for playing FreedomPath. See you next time."),
  startAmbient,
  stopAmbient,
  setAmbientEnabled,
  phoneRing,
  speakAs,
  birdChirp,
  dogBark,
  catMeow,
};
