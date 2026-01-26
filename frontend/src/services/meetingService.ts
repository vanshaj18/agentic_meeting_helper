/**
 * Meeting Service for handling screen/tab sharing and Broadcast Channel API
 */

export interface MeetingStream {
  stream: MediaStream;
  type: 'screen' | 'window' | 'tab';
}

export class MeetingService {
  private broadcastChannel: BroadcastChannel | null = null;
  private mediaStream: MediaStream | null = null;
  private recognition: any = null;
  private isListening = false;

  /**
   * Request screen/tab/window sharing
   */
  async requestScreenShare(): Promise<MeetingStream> {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          displaySurface: 'browser' as any,
          cursor: 'always' as any,
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100,
        },
      });

      this.mediaStream = stream;

      // Handle stream end
      stream.getVideoTracks()[0].addEventListener('ended', () => {
        this.stopScreenShare();
      });

      return {
        stream,
        type: 'tab', // Default to tab sharing
      };
    } catch (error: any) {
      console.error('Error requesting screen share:', error);
      throw new Error(error.message || 'Failed to request screen share');
    }
  }

  /**
   * Initialize Broadcast Channel for meeting integration
   */
  initializeBroadcastChannel(sessionId: number): void {
    this.broadcastChannel = new BroadcastChannel(`meeting-session-${sessionId}`);
    
    this.broadcastChannel.onmessage = (event) => {
      console.log('Broadcast message received:', event.data);
      // Handle messages from meeting platforms
    };
  }

  /**
   * Send message via Broadcast Channel
   */
  sendBroadcastMessage(message: any): void {
    if (this.broadcastChannel) {
      this.broadcastChannel.postMessage(message);
    }
  }

  /**
   * Initialize Web Speech API for Speech-to-Text
   */
  initializeSpeechRecognition(
    onTranscript: (text: string, isFinal: boolean) => void,
    onError?: (error: string) => void
  ): void {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      onError?.('Speech recognition not supported in this browser');
      return;
    }

    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    this.recognition = new SpeechRecognition();
    
    this.recognition.continuous = true;
    this.recognition.interimResults = true;
    this.recognition.lang = 'en-US';

    this.recognition.onresult = (event: any) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript + ' ';
        } else {
          interimTranscript += transcript;
        }
      }

      if (finalTranscript) {
        onTranscript(finalTranscript.trim(), true);
      } else if (interimTranscript) {
        onTranscript(interimTranscript, false);
      }
    };

    this.recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      onError?.(event.error);
    };

    this.recognition.onend = () => {
      if (this.isListening) {
        // Restart if still listening
        try {
          this.recognition.start();
        } catch (e) {
          console.error('Failed to restart recognition:', e);
        }
      }
    };
  }

  /**
   * Start speech recognition
   */
  startSpeechRecognition(): void {
    if (this.recognition && !this.isListening) {
      try {
        this.recognition.start();
        this.isListening = true;
      } catch (error) {
        console.error('Failed to start speech recognition:', error);
      }
    }
  }

  /**
   * Stop speech recognition
   */
  stopSpeechRecognition(): void {
    if (this.recognition && this.isListening) {
      this.isListening = false;
      this.recognition.stop();
    }
  }

  /**
   * Stop screen share
   */
  stopScreenShare(): void {
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((track) => track.stop());
      this.mediaStream = null;
    }
  }

  /**
   * Cleanup all resources
   */
  cleanup(): void {
    this.stopScreenShare();
    this.stopSpeechRecognition();
    if (this.broadcastChannel) {
      this.broadcastChannel.close();
      this.broadcastChannel = null;
    }
  }
}

export const meetingService = new MeetingService();
