export class AudioManager {
  private ctx: AudioContext | null = null;
  private volume = 0.7;

  setVolume(value: number) {
    this.volume = value;
  }

  playTone(freq: number, duration = 0.12) {
    if (!this.ctx) {
      this.ctx = new AudioContext();
    }
    const ctx = this.ctx;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = freq;
    gain.gain.value = this.volume * 0.2;
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + duration);
  }

  playCoin() {
    this.playTone(880, 0.1);
  }

  playPowerup() {
    this.playTone(660, 0.2);
  }

  playHit() {
    this.playTone(220, 0.3);
  }
}
