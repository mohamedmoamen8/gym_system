/** Short scanner "click" beep via Web Audio API (no external file needed). */
export function playScanClick(): void {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.type = 'square';
    osc.frequency.setValueAtTime(1200, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.04);

    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.08);

    osc.onended = () => void ctx.close();
  } catch {
    // Audio not available — ignore silently
  }
}

/** Lower tone for denied / unknown scans. */
export function playScanDenied(): void {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.type = 'sine';
    osc.frequency.setValueAtTime(280, ctx.currentTime);

    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.25);

    osc.onended = () => void ctx.close();
  } catch {
    // Audio not available — ignore silently
  }
}

/**
 * Speak a welcome message after a successful scan.
 * Use `{name}` in the template to insert the member's name.
 * e.g. "Welcome coach, {name}" → "Welcome coach, Alex"
 */
export function speakWelcome(template: string, memberName?: string): void {
  if (!('speechSynthesis' in window)) return;

  const text = template.replace(/\{name\}/gi, memberName?.trim() || 'coach');

  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 0.95;
  utterance.pitch = 1;
  utterance.volume = 1;
  window.speechSynthesis.speak(utterance);
}

export function handleScanResult(options: {
  success: boolean;
  welcomeMessage: string;
  memberName?: string;
  soundEnabled: boolean;
}): void {
  if (!options.soundEnabled) return;

  if (options.success) {
    playScanClick();
    speakWelcome(options.welcomeMessage, options.memberName);
  } else {
    playScanDenied();
  }
}
