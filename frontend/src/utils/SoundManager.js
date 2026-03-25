import { BASE_SOUNDS, SOUND_TYPES } from './BaseSounds';

class SoundManager {
  constructor() {
    this.sounds = BASE_SOUNDS;
    this.audioCache = {};
    this.isSoundEnabled = this.getSoundPreference();
    this.volume = this.getVolumePreference();
    this.preloadSounds();
  }

  preloadSounds() {
    Object.entries(this.sounds).forEach(([type, base64]) => {
      const audio = new Audio(base64);
      audio.preload = 'auto';
      this.audioCache[type] = audio;
    });
  }

  play(soundType) {
    if (!this.isSoundEnabled) return;

    const audioElement = this.audioCache[soundType];
    if (audioElement) {
      try {
        audioElement.currentTime = 0;
        audioElement.volume = this.volume;
        audioElement.play().catch(error => {
          console.warn(`Sound playback warning: ${error.message}`);
        });
      } catch (error) {
        console.warn(`Sound playback error: ${error.message}`);
      }
    }
  }
  
    // Random celebratory sounds
    playRandomCelebration() {
      const celebrationSounds = [
        SOUND_TYPES.ACHIEVEMENT_UNLOCKED,
        SOUND_TYPES.LEVEL_UP,
        SOUND_TYPES.TOP_RANK
      ];
      const randomSound = celebrationSounds[
        Math.floor(Math.random() * celebrationSounds.length)
      ];
      this.play(randomSound);
    }
  
    // Adjust volume
    setVolume(volume) {
      this.volume = Math.max(0, Math.min(1, volume));
      // localStorage.setItem('soundVolume', this.volume.toString());
    }
  
    // Toggle sound on/off
    toggleSound() {
      this.isSoundEnabled = !this.isSoundEnabled;
      // localStorage.setItem('soundEnabled', this.isSoundEnabled.toString());
    }
  
    // Get sound preference from localStorage
    getSoundPreference() {
      const storedPreference = localStorage.getItem('soundEnabled');
      return storedPreference === null ? true : storedPreference === 'true';
    }
  
    // Get volume preference from localStorage
    getVolumePreference() {
      const storedVolume = localStorage.getItem('soundVolume');
      return storedVolume ? parseFloat(storedVolume) : 0.5;
    }
  
    // Sound configuration component
    createSoundConfigModal() {
      // This could be a modal or a component for sound settings
      return {
        isSoundEnabled: this.isSoundEnabled,
        volume: this.volume,
        toggleSound: () => this.toggleSound(),
        setVolume: (vol) => this.setVolume(vol)
      };
    }
  }
  
  export const soundManager = new SoundManager();
  export { SOUND_TYPES };