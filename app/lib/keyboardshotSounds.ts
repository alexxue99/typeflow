type AudioContextConstructor = typeof AudioContext;

export function createKeyboardshotAudioContext() {
  const AudioContextClass = window.AudioContext
    || (window as typeof window & { webkitAudioContext?: AudioContextConstructor }).webkitAudioContext;
  return AudioContextClass ? new AudioContextClass() : null;
}

export function playKeyboardshotSound(context: AudioContext, hit: boolean) {
  const now = context.currentTime;
  const output = context.createGain();
  output.gain.setValueAtTime(0.0001, now);
  output.gain.exponentialRampToValueAtTime(hit ? 0.13 : 0.1, now + 0.008);
  output.gain.exponentialRampToValueAtTime(0.0001, now + (hit ? 0.16 : 0.22));
  output.connect(context.destination);

  const frequencies = hit ? [523.25, 783.99] : [155.56, 138.59];
  frequencies.forEach((frequency, index) => {
    const oscillator = context.createOscillator();
    oscillator.type = hit ? "sine" : "sawtooth";
    oscillator.frequency.setValueAtTime(frequency, now);
    if (!hit) oscillator.frequency.exponentialRampToValueAtTime(frequency * 0.72, now + 0.2);
    oscillator.connect(output);
    oscillator.start(now + index * (hit ? 0.025 : 0));
    oscillator.stop(now + (hit ? 0.16 : 0.22));
  });
}
