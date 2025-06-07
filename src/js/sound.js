// Simple sound system for Minecraft browser game
// Uses Web Audio API to generate basic sounds

class SoundSystem {    constructor() {
        this.audioContext = null;
        this.enabled = false; // Disabilitato finché non c'è interazione utente
        this.userInteracted = false; // Traccia se l'utente ha già interagito
        this.volume = 0.3;
        
        // Music system
        this.musicEnabled = true;
        this.musicVolume = 0.1;
        this.currentMusic = null;
        this.musicGainNode = null;
        
        this.initAudio();
        
        // Aggiungi listener per la prima interazione utente
        this.addUserInteractionListeners();
    }    initAudio() {
        try {
            // Non inizializziamo l'AudioContext immediatamente per evitare il warning
            // Verrà inizializzato al primo tentativo di riproduzione dopo interazione utente
            // Manteniamo enabled = false finché non c'è interazione
        } catch (e) {
            console.warn('Web Audio API not supported, sound disabled');
            this.enabled = false;
        }
    }
    
    // Aggiunge listener per la prima interazione utente
    addUserInteractionListeners() {
        const enableAudio = () => {
            if (!this.userInteracted) {
                this.userInteracted = true;
                this.enabled = true;
                // 🔥 FIXED: Removed debug log for cleaner console output
                
                // Rimuovi i listener dopo la prima interazione
                document.removeEventListener('click', enableAudio);
                document.removeEventListener('keydown', enableAudio);
                document.removeEventListener('touchstart', enableAudio);
            }
        };
        
        // Aggiungi listener per vari tipi di interazione
        document.addEventListener('click', enableAudio, { once: true });
        document.addEventListener('keydown', enableAudio, { once: true });
        document.addEventListener('touchstart', enableAudio, { once: true });
    }
    
    // Metodo per inizializzare l'AudioContext solo quando necessario e dopo interazione utente
    ensureAudioContext() {
        if (!this.enabled || !this.userInteracted) {
            return false; // Non creare AudioContext se non c'è stata interazione utente
        }
        
        if (!this.audioContext) {
            try {
                this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
                // 🔥 FIXED: Removed debug log for cleaner console output
            } catch (e) {
                console.warn('Failed to create AudioContext:', e);
                this.enabled = false;
                return false;
            }
        }
        
        // Resume il context se è sospeso
        if (this.audioContext.state === 'suspended') {
            this.audioContext.resume().catch(e => {
                console.warn('Failed to resume AudioContext:', e);
            });
        }
        
        return this.audioContext && this.audioContext.state !== 'closed';
    }
      playTone(frequency, duration, type = 'sine', volume = this.volume) {
        if (!this.enabled || !this.ensureAudioContext()) return;
        
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.frequency.value = frequency;
        oscillator.type = type;
        
        gainNode.gain.setValueAtTime(volume, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);
        
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + duration);
    }
    
    playBlockBreak() {
        this.playTone(200 + Math.random() * 100, 0.1, 'square', 0.2);
    }
    
    playBlockPlace() {
        this.playTone(300 + Math.random() * 50, 0.08, 'sine', 0.15);
    }
      playJump() {
        this.playTone(400, 0.1, 'sine', 0.03);
    }
      // 🦵 LANDING SOUND: Soft, consistent landing sound for when touching ground after falling
    playLanding() {
        // Create a single, soft thud sound - consistent frequency for better user experience
        this.playTone(200, 0.06, 'sine', 0.02);
    }
    
    playPlayerDamage() {
        this.playTone(150, 0.2, 'sawtooth', 0.3);
    }
    
    playPlayerDeath() {
        // Play a dramatic death sound sequence
        setTimeout(() => this.playTone(200, 0.3, 'sawtooth', 0.4), 0);
        setTimeout(() => this.playTone(150, 0.4, 'triangle', 0.3), 200);
        setTimeout(() => this.playTone(100, 0.6, 'sine', 0.2), 500);
        setTimeout(() => this.playTone(80, 0.8, 'sine', 0.1), 800);
    }
    
    playMobDeath() {
        // Play a sequence of descending tones
        setTimeout(() => this.playTone(300, 0.1, 'square', 0.2), 0);
        setTimeout(() => this.playTone(250, 0.1, 'square', 0.15), 100);
        setTimeout(() => this.playTone(200, 0.2, 'square', 0.1), 200);
    }
    
    playWaterSplash() {
                this.playTone(600 + Math.random() * 200, 0.15, 'triangle', 0.1);
    }
    
    playExplosion() {
        // Simulate a complex explosion sound
        // Low rumble
        this.playTone(50 + Math.random() * 20, 0.5, 'sawtooth', this.volume * 1.2); 
        // Sharp crack
        setTimeout(() => this.playTone(800 + Math.random() * 200, 0.1, 'square', this.volume * 0.8), 50);
        // Debris/noise
        setTimeout(() => {
            if (!this.enabled || !this.ensureAudioContext()) return;
            const bufferSize = this.audioContext.sampleRate * 0.5; // 0.5 seconds of noise
            const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
            const output = buffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) {
                output[i] = (Math.random() * 2 - 1) * 0.3; // White noise, reduced amplitude
            }
            const source = this.audioContext.createBufferSource();
            source.buffer = buffer;
            const gainNode = this.audioContext.createGain();
            gainNode.gain.setValueAtTime(this.volume * 0.7, this.audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.5);
            source.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            source.start();
        }, 80);
    }

    playCreeperCountdown() {
        // Play a creeper hiss/countdown sound - distinctive sizzling sound
        const baseFreq = 150 + Math.random() * 50; // Random hiss frequency
        const duration = 0.2;
        
        // Create a hissing sound using filtered noise
        if (!this.enabled || !this.audioContext) return;
        
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        const filter = this.audioContext.createBiquadFilter();
        
        oscillator.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        // Setup oscillator for hiss sound
        oscillator.frequency.value = baseFreq;
        oscillator.type = 'sawtooth';
        
        // Setup filter for that characteristic creeper hiss
        filter.type = 'highpass';
        filter.frequency.value = 100 + Math.random() * 200;
        filter.Q.value = 0.5;
        
        // Envelope for dramatic effect
        gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(this.volume * 0.3, this.audioContext.currentTime + 0.05);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);
        
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + duration);
    }

    playCreeperCountdown() {
        // Play a creeper hiss/countdown sound - distinctive sizzling sound
        const baseFreq = 150 + Math.random() * 50; // Random hiss frequency
        const duration = 0.2;
        
        // Create a hissing sound using filtered noise
        if (!this.enabled || !this.audioContext) return;
        
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        const filter = this.audioContext.createBiquadFilter();
        
        oscillator.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        // Setup oscillator for hiss sound
        oscillator.frequency.value = baseFreq;
        oscillator.type = 'sawtooth';
        
        // Setup filter for that characteristic creeper hiss
        filter.type = 'highpass';
        filter.frequency.value = 100 + Math.random() * 200;
        filter.Q.value = 0.5;
        
        // Envelope for dramatic effect
        gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(this.volume * 0.3, this.audioContext.currentTime + 0.05);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);
        
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + duration);
    }
    
    setVolume(volume) {
        this.volume = Math.max(0, Math.min(1, volume));
    }
    
    toggle() {
        this.enabled = !this.enabled;
        return this.enabled;
    }
    
    // Music management methods
    startBackgroundMusic() {
        if (!this.enabled || !this.audioContext || !this.musicEnabled) return;
        
        // Stop any existing music
        this.stopBackgroundMusic();
        
        // Create a simple ambient music loop
        this.createAmbientMusic();
    }
      stopBackgroundMusic() {
        if (this.currentMusic) {
            this.currentMusic.stop();
            this.currentMusic = null;
        }
    }
    
    toggleMusic() {
        this.musicEnabled = !this.musicEnabled;
        if (this.musicEnabled) {
            this.startBackgroundMusic();
        } else {
            this.stopBackgroundMusic();
        }
        return this.musicEnabled;
    }
    
    createAmbientMusic() {
        if (!this.enabled || !this.audioContext) return;
        
        // Create a simple ambient music using oscillators
        const playAmbientTone = (delay = 0) => {
            setTimeout(() => {
                if (!this.musicEnabled || !this.audioContext) return;
                
                const oscillator = this.audioContext.createOscillator();
                const gainNode = this.audioContext.createGain();
                
                oscillator.connect(gainNode);
                gainNode.connect(this.audioContext.destination);
                
                // Random peaceful frequencies
                const baseFreq = 220 + Math.random() * 100; // A3 to C4 range
                oscillator.frequency.value = baseFreq;
                oscillator.type = 'sine';
                
                // Soft volume with fade in/out
                gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
                gainNode.gain.linearRampToValueAtTime(this.musicVolume, this.audioContext.currentTime + 1);
                gainNode.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + 4);
                
                oscillator.start(this.audioContext.currentTime);
                oscillator.stop(this.audioContext.currentTime + 5);
                
                this.currentMusic = oscillator;
                
                // Schedule next tone
                if (this.musicEnabled) {
                    playAmbientTone(3000 + Math.random() * 4000); // 3-7 seconds
                }
            }, delay);
        };
        
        // Start the ambient music loop
        playAmbientTone();
    }
    
    setMusicVolume(volume) {
        this.musicVolume = Math.max(0, Math.min(0.3, volume)); // Max 0.3 for background music
    }
}
