import { vibrate } from '../../platform/device';

let audio: AudioContext | null = null;

function beep(ctx: AudioContext, at: number, freq = 880, length = 0.12) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(0.25, at);
  gain.gain.exponentialRampToValueAtTime(0.001, at + length);
  osc.connect(gain).connect(ctx.destination);
  osc.start(at);
  osc.stop(at + length);
}

/** One beep at 8 s, two at 12 s, plus a vibration where supported. */
export function playInspectionAlert(second: 8 | 12, opts: { sound: boolean }): void {
  vibrate(second === 8 ? 150 : 400);
  if (!opts.sound) return;
  try {
    audio ??= new AudioContext();
    const now = audio.currentTime;
    beep(audio, now);
    if (second === 12) beep(audio, now + 0.18);
  } catch {
    // audio unavailable
  }
}
