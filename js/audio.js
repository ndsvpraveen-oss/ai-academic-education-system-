/**
 * ACADEMIQ OS: PROCEDURAL WEB AUDIO ENGINE
 * Zero external audio assets required. Synthesizes pristine UI feedback & study audio.
 */

class AudioEngine {
  constructor() {
    this.ctx = null;
    this.isMuted = false;
    this.ambientSource = null;
    this.ambientGain = null;
  }

  init() {
    if (!this.ctx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioContext();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.isMuted && this.ambientGain) {
      this.ambientGain.gain.setValueAtTime(0, this.ctx.currentTime);
    }
    return this.isMuted;
  }

  // Crisp futuristic micro-click
  playClick() {
    if (this.isMuted) return;
    this.init();
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(300, this.ctx.currentTime + 0.04);
      gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.04);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.045);
    } catch (e) {
      // Audio fallback silent
    }
  }

  // Card Flip Whoosh
  playCardFlip() {
    if (this.isMuted) return;
    this.init();
    try {
      const bufferSize = this.ctx.sampleRate * 0.08;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(800, this.ctx.currentTime);
      filter.frequency.exponentialRampToValueAtTime(2400, this.ctx.currentTime + 0.08);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.08);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);
      noise.start();
    } catch (e) {}
  }

  // Harmonic Celebratory Chime on Milestone / Task Complete
  playSuccess() {
    if (this.isMuted) return;
    this.init();
    try {
      const freqs = [523.25, 659.25, 783.99, 1046.50]; // C Major arpeggio
      freqs.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const delay = idx * 0.08;

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime + delay);

        gain.gain.setValueAtTime(0, this.ctx.currentTime + delay);
        gain.gain.linearRampToValueAtTime(0.14, this.ctx.currentTime + delay + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + delay + 0.5);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(this.ctx.currentTime + delay);
        osc.stop(this.ctx.currentTime + delay + 0.55);
      });
    } catch (e) {}
  }

  // Resonant Gong on Pomodoro Timer End
  playGong() {
    if (this.isMuted) return;
    this.init();
    try {
      const freqs = [220, 440, 660];
      freqs.forEach((freq) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

        gain.gain.setValueAtTime(0.18, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 2.5);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start();
        osc.stop(this.ctx.currentTime + 2.6);
      });
    } catch (e) {}
  }

  // Procedural 40Hz Gamma Wave Focus Generator
  startAmbientFocus(type = 'gamma') {
    if (this.isMuted) return;
    this.init();
    this.stopAmbientFocus();

    try {
      if (type === 'gamma') {
        // Binaural beat: 200Hz in left, 240Hz in right -> 40Hz perceptual difference
        const merger = this.ctx.createChannelMerger(2);
        const oscLeft = this.ctx.createOscillator();
        const oscRight = this.ctx.createOscillator();

        oscLeft.type = 'sine';
        oscLeft.frequency.value = 196; // G3
        oscRight.type = 'sine';
        oscRight.frequency.value = 236; // 40Hz difference

        this.ambientGain = this.ctx.createGain();
        this.ambientGain.gain.setValueAtTime(0.05, this.ctx.currentTime);

        oscLeft.connect(merger, 0, 0);
        oscRight.connect(merger, 0, 1);
        merger.connect(this.ambientGain);
        this.ambientGain.connect(this.ctx.destination);

        oscLeft.start();
        oscRight.start();

        this.ambientSource = {
          stop: () => {
            try {
              oscLeft.stop();
              oscRight.stop();
            } catch (e) {}
          }
        };
      }
    } catch (e) {}
  }

  stopAmbientFocus() {
    if (this.ambientSource) {
      try {
        this.ambientSource.stop();
      } catch (e) {}
      this.ambientSource = null;
    }
  }
}

window.academiqAudio = new AudioEngine();
