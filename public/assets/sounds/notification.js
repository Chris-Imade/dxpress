// Notification Sound Manager with proper error handling and browser compatibility
class NotificationSoundManager {
    constructor() {
        this.audioContext = null;
        this.soundBuffer = null;
        this.isSupported = false;
        this.isInitialized = false;
        this.initPromise = null;
        
        this.init();
    }

    async init() {
        if (this.initPromise) {
            return this.initPromise;
        }

        this.initPromise = this._initialize();
        return this.initPromise;
    }

    async _initialize() {
        try {
            // Check for Web Audio API support
            if (!window.AudioContext && !window.webkitAudioContext) {
                console.warn('Web Audio API not supported');
                return;
            }

            // Create audio context with user gesture handling
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            // Handle suspended context (Chrome autoplay policy)
            if (this.audioContext.state === 'suspended') {
                // Will be resumed on first user interaction
                document.addEventListener('click', () => this.resumeContext(), { once: true });
                document.addEventListener('touchstart', () => this.resumeContext(), { once: true });
            }

            // Pre-generate the sound buffer
            this.soundBuffer = this.createSoundBuffer();
            this.isSupported = true;
            this.isInitialized = true;
            
        } catch (error) {
            console.warn('Failed to initialize notification sound:', error);
            this.isSupported = false;
        }
    }

    async resumeContext() {
        if (this.audioContext && this.audioContext.state === 'suspended') {
            try {
                await this.audioContext.resume();
            } catch (error) {
                console.warn('Failed to resume audio context:', error);
            }
        }
    }

    createSoundBuffer() {
        if (!this.audioContext) return null;

        try {
            const duration = 0.8; // Increased duration for fuller sound
            const sampleRate = this.audioContext.sampleRate;
            const numSamples = duration * sampleRate;
            const buffer = this.audioContext.createBuffer(1, numSamples, sampleRate);
            const channelData = buffer.getChannelData(0);

            // Create a pleasant chime sound (C major chord arpeggio)
            const frequencies = [523.25, 659.25, 783.99]; // C5, E5, G5
            
            for (let i = 0; i < numSamples; i++) {
                let sample = 0;
                const t = i / sampleRate;
                
                frequencies.forEach((freq, index) => {
                    const delay = index * 0.08; // Slightly longer delay between notes
                    if (t >= delay) {
                        const noteTime = t - delay;
                        // Gentler exponential decay that doesn't cut off abruptly
                        const envelope = Math.exp(-noteTime * 2.5) * (1 - Math.exp(-noteTime * 20));
                        sample += Math.sin(2 * Math.PI * freq * noteTime) * envelope * 0.25;
                    }
                });
                
                channelData[i] = sample;
            }

            return buffer;
        } catch (error) {
            console.warn('Failed to create sound buffer:', error);
            return null;
        }
    }

    async play() {
        try {
            await this.init();
            
            if (!this.isSupported || !this.audioContext || !this.soundBuffer) {
                return false;
            }

            // Resume context if suspended
            await this.resumeContext();

            const source = this.audioContext.createBufferSource();
            const gainNode = this.audioContext.createGain();
            
            source.buffer = this.soundBuffer;
            gainNode.gain.value = 0.3; // Volume control
            
            source.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            source.start();
            return true;
            
        } catch (error) {
            console.warn('Failed to play notification sound:', error);
            return false;
        }
    }
}

// Create global instance
const notificationSoundManager = new NotificationSoundManager();

// Legacy function for backward compatibility
async function playGeneratedNotificationSound() {
    return await notificationSoundManager.play();
}

// Export for use in other scripts
window.playGeneratedNotificationSound = playGeneratedNotificationSound;
