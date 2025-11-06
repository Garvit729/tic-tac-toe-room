// Simple sound effects using Web Audio API
class SoundManager {
  constructor() {
    this.audioContext = null;
    this.enabled = true;
  }

  init() {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
  }

  playTone(frequency, duration, type = 'sine') {
    if (!this.enabled) return;
    
    try {
      this.init();
      
      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);
      
      oscillator.frequency.value = frequency;
      oscillator.type = type;
      
      gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(
        0.01,
        this.audioContext.currentTime + duration
      );
      
      oscillator.start(this.audioContext.currentTime);
      oscillator.stop(this.audioContext.currentTime + duration);
    } catch (error) {
      console.warn('Sound playback failed:', error);
    }
  }

  playMove() {
    this.playTone(800, 0.1, 'sine');
  }

  playWin() {
    this.playTone(523, 0.15, 'sine');
    setTimeout(() => this.playTone(659, 0.15, 'sine'), 150);
    setTimeout(() => this.playTone(784, 0.3, 'sine'), 300);
  }

  playLose() {
    this.playTone(400, 0.15, 'sine');
    setTimeout(() => this.playTone(350, 0.15, 'sine'), 150);
    setTimeout(() => this.playTone(300, 0.3, 'sine'), 300);
  }

  playJoin() {
    this.playTone(600, 0.1, 'sine');
  }

  toggle() {
    this.enabled = !this.enabled;
  }
}

export default new SoundManager();
