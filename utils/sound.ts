// Simple AudioContext wrapper to avoid external assets
class SoundManager {
  private audioCtx: AudioContext | null = null;
  private enabled: boolean = true;
  private masterVolume: number = 0.5;

  constructor() {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        this.audioCtx = new AudioContextClass();
      }
    } catch (e) {
      console.error("Web Audio API not supported");
    }
  }

  public setEnabled(enabled: boolean) {
    this.enabled = enabled;
  }

  public setVolume(volume: number) {
    this.masterVolume = Math.max(0, Math.min(1, volume));
  }

  public playMove() {
    if (!this.enabled || !this.audioCtx) return;
    // Very short, quiet tick for movement
    this.playTone(200, 'sine', 0.03, 0.05);
  }

  public playTap() {
    if (!this.enabled || !this.audioCtx) return;
    // Success sound (high pitch ping)
    this.playTone(600, 'sine', 0.05);
    setTimeout(() => this.playTone(800, 'sine', 0.05), 50);
  }

  public playError() {
    if (!this.enabled || !this.audioCtx) return;
    this.playTone(150, 'sawtooth', 0.3);
  }

  public playGameOver() {
    if (!this.enabled || !this.audioCtx) return;
    this.playTone(300, 'sawtooth', 0.2);
    setTimeout(() => this.playTone(250, 'sawtooth', 0.2), 200);
    setTimeout(() => this.playTone(200, 'sawtooth', 0.4), 400);
  }

  public playStart() {
     if (!this.enabled || !this.audioCtx) return;
     this.playTone(400, 'triangle', 0.1);
     setTimeout(() => this.playTone(600, 'triangle', 0.3), 150);
  }

  private playTone(freq: number, type: OscillatorType, duration: number, volume: number = 0.1) {
    if (!this.audioCtx) return;
    
    // Resume context if suspended (browsers suspend audio context until user interaction)
    if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
    }

    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, this.audioCtx.currentTime);
    
    // Apply master volume to the requested volume
    const effectiveVolume = volume * this.masterVolume;

    gain.gain.setValueAtTime(effectiveVolume, this.audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.audioCtx.currentTime + duration);

    osc.connect(gain);
    gain.connect(this.audioCtx.destination);

    osc.start();
    osc.stop(this.audioCtx.currentTime + duration);
  }
}

export const soundManager = new SoundManager();