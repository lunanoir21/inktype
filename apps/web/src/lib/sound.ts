"use client";

/**
 * Keypress and error sounds, synthesized with the Web Audio API so there are
 * no audio files to download.
 */

let ctx: AudioContext | null = null;
let noise: AudioBuffer | null = null;

function audio(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    ctx = new Ctor();
  }
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

function noiseBuffer(ac: AudioContext): AudioBuffer {
  if (noise) return noise;
  const length = Math.floor(ac.sampleRate * 0.03);
  noise = ac.createBuffer(1, length, ac.sampleRate);
  const data = noise.getChannelData(0);
  for (let i = 0; i < length; i++) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, 4);
  return noise;
}

/** A soft typewriter-ish click. */
export function playKey(volume: number): void {
  const ac = audio();
  if (!ac) return;
  const src = ac.createBufferSource();
  src.buffer = noiseBuffer(ac);
  src.playbackRate.value = 0.9 + Math.random() * 0.25;
  const filter = ac.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.value = 2400 + Math.random() * 600;
  filter.Q.value = 0.9;
  const gain = ac.createGain();
  gain.gain.value = 0.5 * volume;
  src.connect(filter).connect(gain).connect(ac.destination);
  src.start();
}

/** A low, short thud for mistakes. */
export function playError(volume: number): void {
  const ac = audio();
  if (!ac) return;
  const osc = ac.createOscillator();
  osc.type = "triangle";
  osc.frequency.setValueAtTime(190, ac.currentTime);
  osc.frequency.exponentialRampToValueAtTime(90, ac.currentTime + 0.12);
  const gain = ac.createGain();
  gain.gain.setValueAtTime(0.35 * volume, ac.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + 0.14);
  osc.connect(gain).connect(ac.destination);
  osc.start();
  osc.stop(ac.currentTime + 0.15);
}
