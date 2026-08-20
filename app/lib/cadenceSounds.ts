type AudioContextConstructor = typeof AudioContext;

export function createCadenceAudioContext() {
  const AudioContextClass = window.AudioContext
    || (window as typeof window & { webkitAudioContext?: AudioContextConstructor }).webkitAudioContext;
  return AudioContextClass ? new AudioContextClass() : null;
}

export async function playCadenceBlockSound(context: AudioContext) {
  if (context.state === "suspended") await context.resume();
  if (context.state !== "running") return;

  const now = context.currentTime;
  const output = context.createGain();
  output.gain.setValueAtTime(0.0001, now);
  output.gain.exponentialRampToValueAtTime(0.1, now + 0.006);
  output.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);
  output.connect(context.destination);

  const oscillator = context.createOscillator();
  oscillator.type = "sine";
  oscillator.frequency.setValueAtTime(659.25, now);
  oscillator.connect(output);
  oscillator.start(now);
  oscillator.stop(now + 0.12);
}
