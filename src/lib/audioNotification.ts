// Luxury Audio Notification Synthesizer using Web Audio API
// No external mp3 files required - works instantly across modern browsers!

export function playLuxuryOrderChime(): void {
  if (typeof window === 'undefined') return;

  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();

    // Play a luxury 3-tone ascending bell chime (E5 -> G#5 -> B5)
    const notes = [659.25, 830.61, 987.77];
    const now = ctx.currentTime;

    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.12);

      // Smooth attack and natural exponential decay
      gain.gain.setValueAtTime(0, now + idx * 0.12);
      gain.gain.linearRampToValueAtTime(0.28, now + idx * 0.12 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.12 + 0.6);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + idx * 0.12);
      osc.stop(now + idx * 0.12 + 0.65);
    });

    // Close audio context after chime completes
    setTimeout(() => {
      ctx.close().catch(() => {});
    }, 1200);
  } catch (err) {
    console.warn('Audio notification could not play:', err);
  }
}
