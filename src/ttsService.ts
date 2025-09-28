import { EdgeSpeechTTS } from '@lobehub/tts';

export interface TTSConfig {
  locale?: string;
  voice?: string;
  rate?: number;
  pitch?: number;
  volume?: number;
}

export class TTSService {
  private tts: EdgeSpeechTTS;
  private config: TTSConfig;
  private currentAudio: HTMLAudioElement | null = null;

  constructor(config: TTSConfig = {}) {
    this.config = {
      locale: 'en-US',
      voice: 'en-US-AriaNeural', // Female voice
      rate: 0.9,
      pitch: 1,
      volume: 0.8,
      ...config
    };

    // Initialize EdgeSpeechTTS
    this.tts = new EdgeSpeechTTS({ 
      locale: this.config.locale || 'en-US' 
    });
  }

  async speak(text: string): Promise<void> {
    try {
      // Stop any current speech
      this.stop();

      console.log('Generating speech with Lobe TTS...', { text: text.substring(0, 50) + '...' });

      // Create speech synthesis request payload
      const payload = {
        input: text,
        options: {
          voice: this.config.voice || 'en-US-JennyNeural',
        },
      };

      // Generate speech using EdgeSpeechTTS
      const response = await this.tts.create(payload);
      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);

      console.log('Audio generated, creating audio element...');

      // Create audio element and play
      const audio = new Audio(audioUrl);
      
      // Set up event listeners
      audio.addEventListener('loadstart', () => {
        console.log('Audio loading started');
        this.onStart?.();
      });

      audio.addEventListener('canplaythrough', () => {
        console.log('Audio ready to play');
      });

      audio.addEventListener('play', () => {
        console.log('Audio playback started');
      });

      audio.addEventListener('ended', () => {
        console.log('Audio playback ended');
        this.onEnd?.();
        URL.revokeObjectURL(audioUrl); // Clean up
        this.currentAudio = null;
      });

      audio.addEventListener('error', (error) => {
        console.error('TTS Audio error:', error);
        this.onError?.(error);
        URL.revokeObjectURL(audioUrl); // Clean up
        this.currentAudio = null;
      });

      // Set audio properties
      audio.volume = this.config.volume || 0.8;
      audio.playbackRate = this.config.rate || 0.9;

      // Store reference for stopping
      this.currentAudio = audio;

      console.log('Starting audio playback...');
      // Play the audio
      await audio.play();

    } catch (error) {
      console.error('TTS Error:', error);
      this.onError?.(error);
      throw error;
    }
  }

  stop(): void {
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio.currentTime = 0;
      this.currentAudio = null;
    }
    
    // Also stop any browser speech synthesis as fallback
    if (speechSynthesis.speaking) {
      speechSynthesis.cancel();
    }
  }

  isSpeaking(): boolean {
    return this.currentAudio ? !this.currentAudio.paused : speechSynthesis.speaking;
  }

  // Event callbacks
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (error: any) => void;
}

// Create a singleton instance
export const ttsService = new TTSService();