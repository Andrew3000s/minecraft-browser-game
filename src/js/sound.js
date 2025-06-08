// Simple sound system for Minecraft browser game
// Uses Web Audio API to generate basic sounds

class SoundSystem {    constructor() {
        this.audioContext = null;
        this.enabled = true; // ✅ FIXED: Audio enabled by default
        this.userInteracted = false; // Traccia se l'utente ha già interagito
        this.volume = 0.4; // ✅ FIXED: Higher default volume for better audibility
        
        // Music system
        this.musicEnabled = true;
        this.musicVolume = 0.15; // ✅ FIXED: Higher music volume
        this.currentMusic = null;
        this.musicGainNode = null;
        
        // 🎵 AUDIO CATEGORIES SYSTEM - Advanced sound configuration
        this.audioCategories = {
            music: { enabled: true, volume: 0.15, name: 'Background Music' }, // ✅ FIXED: Higher volume
            playerActions: { enabled: true, volume: 0.08, name: 'Player Actions' }, // ✅ FIXED: Higher volume
            blockInteractions: { enabled: true, volume: 0.2, name: 'Block Interactions' }, // ✅ FIXED: Higher volume
            combat: { enabled: true, volume: 0.25, name: 'Combat & Mobs' }, // ✅ FIXED: Higher volume
            environmental: { enabled: true, volume: 0.15, name: 'Environmental' }, // ✅ FIXED: Higher volume
            ui: { enabled: true, volume: 0.2, name: 'UI & Notifications' } // ✅ FIXED: Higher volume
        };
        
        this.initAudio();
        this.loadAudioSettings();
        
        // Aggiungi listener per la prima interazione utente
        this.addUserInteractionListeners();
    }initAudio() {
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
                console.log('🎵 Audio system activated after user interaction');
                
                // Start background music immediately after interaction
                setTimeout(() => {
                    if (this.audioCategories.music.enabled) {
                        this.startBackgroundMusic();
                    }
                }, 100);
                
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
        this.playCategorySound(200 + Math.random() * 100, 0.1, 'square', 'blockInteractions', 1.0);
    }
    
    playBlockPlace() {
        this.playCategorySound(300 + Math.random() * 50, 0.08, 'sine', 'blockInteractions', 1.0);
    }
      playJump() {
        this.playCategorySound(400, 0.1, 'sine', 'playerActions', 1.0);
    }
      // 🦵 LANDING SOUND: Soft, consistent landing sound for when touching ground after falling
    playLanding() {
        // Create a single, soft thud sound - consistent frequency for better user experience
        this.playCategorySound(200, 0.06, 'sine', 'playerActions', 1.0);
    }
    
    playPlayerDamage() {
        this.playCategorySound(150, 0.2, 'sawtooth', 'combat', 1.0);
    }
    
    playPlayerDeath() {
        // Play a dramatic death sound sequence
        setTimeout(() => this.playCategorySound(200, 0.3, 'sawtooth', 'combat', 1.0), 0);
        setTimeout(() => this.playCategorySound(150, 0.4, 'triangle', 'combat', 0.75), 200);
        setTimeout(() => this.playCategorySound(100, 0.6, 'sine', 'combat', 0.5), 500);
        setTimeout(() => this.playCategorySound(80, 0.8, 'sine', 'combat', 0.25), 800);
    }
    
    playMobDeath() {
        // Play a sequence of descending tones
        setTimeout(() => this.playCategorySound(300, 0.1, 'square', 'combat', 1.0), 0);
        setTimeout(() => this.playCategorySound(250, 0.1, 'square', 'combat', 0.75), 100);
        setTimeout(() => this.playCategorySound(200, 0.2, 'square', 'combat', 0.5), 200);
    }
    
    playWaterSplash() {
        this.playCategorySound(600 + Math.random() * 200, 0.15, 'triangle', 'environmental', 1.0);
    }
      playExplosion() {
        // Multi-layered explosion sound with category-based volume
        const combatVolume = this.getCategoryVolume('combat');
        if (combatVolume <= 0) return;
        
        // Low rumble
        this.playTone(50 + Math.random() * 20, 0.5, 'sawtooth', combatVolume * 1.2); 
        // Sharp crack
        setTimeout(() => this.playTone(800 + Math.random() * 200, 0.1, 'square', combatVolume * 0.8), 50);
        // Debris/noise with category volume
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
            gainNode.gain.setValueAtTime(combatVolume * 0.7, this.audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.5);
            source.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            source.start();
        }, 80);
    }    playCreeperCountdown() {
        // Play a creeper hiss/countdown sound with category-based volume
        const combatVolume = this.getCategoryVolume('combat');
        if (combatVolume <= 0) return;
        
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
        
        // Envelope for dramatic effect with category volume
        gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(combatVolume * 0.3, this.audioContext.currentTime + 0.05);
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
        if (!this.enabled || !this.audioContext || !this.audioCategories.music.enabled) return;
        
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
        const wasEnabled = this.audioCategories.music.enabled;
        this.toggleCategory('music');
        
        if (this.audioCategories.music.enabled && !wasEnabled) {
            this.startBackgroundMusic();
        } else if (!this.audioCategories.music.enabled && wasEnabled) {
            this.stopBackgroundMusic();
        }
        
        return this.audioCategories.music.enabled;
    }
    
    createAmbientMusic() {
        if (!this.enabled || !this.audioContext) return;
        
        // Create a simple ambient music using oscillators
        const playAmbientTone = (delay = 0) => {
            setTimeout(() => {
                if (!this.audioCategories.music.enabled || !this.audioContext) return;
                
                const oscillator = this.audioContext.createOscillator();
                const gainNode = this.audioContext.createGain();
                
                oscillator.connect(gainNode);
                gainNode.connect(this.audioContext.destination);
                
                // Random peaceful frequencies
                const baseFreq = 220 + Math.random() * 100; // A3 to C4 range
                oscillator.frequency.value = baseFreq;
                oscillator.type = 'sine';
                
                // Soft volume with fade in/out using category volume
                const musicVolume = this.getCategoryVolume('music');
                gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
                gainNode.gain.linearRampToValueAtTime(musicVolume, this.audioContext.currentTime + 1);
                gainNode.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + 4);
                
                oscillator.start(this.audioContext.currentTime);
                oscillator.stop(this.audioContext.currentTime + 5);
                
                this.currentMusic = oscillator;
                
                // Schedule next tone
                if (this.audioCategories.music.enabled) {
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
    
    // 🎵 AUDIO CATEGORIES MANAGEMENT - Advanced configuration system
    
    // Load audio settings from localStorage
    loadAudioSettings() {
        try {
            const savedSettings = localStorage.getItem('minecraftAudioSettings');
            if (savedSettings) {
                const settings = JSON.parse(savedSettings);
                
                // Apply saved settings to audio categories
                Object.keys(this.audioCategories).forEach(category => {
                    if (settings[category]) {
                        this.audioCategories[category] = { 
                            ...this.audioCategories[category], 
                            ...settings[category] 
                        };
                    }
                });
                
                // Apply global settings
                if (settings.masterVolume !== undefined) {
                    this.volume = settings.masterVolume;
                }
            }
        } catch (error) {
            console.warn('Failed to load audio settings:', error);
        }
    }
    
    // Save audio settings to localStorage
    saveAudioSettings() {
        try {
            const settings = {
                ...this.audioCategories,
                masterVolume: this.volume
            };
            localStorage.setItem('minecraftAudioSettings', JSON.stringify(settings));
        } catch (error) {
            console.warn('Failed to save audio settings:', error);
        }
    }
    
    // Get volume for a specific category
    getCategoryVolume(category) {
        if (!this.audioCategories[category] || !this.audioCategories[category].enabled) {
            return 0;
        }
        return this.audioCategories[category].volume * this.volume;
    }
    
    // Set volume for a specific category
    setCategoryVolume(category, volume) {
        if (this.audioCategories[category]) {
            this.audioCategories[category].volume = Math.max(0, Math.min(1, volume));
            this.saveAudioSettings();
        }
    }
    
    // Toggle a specific category
    toggleCategory(category) {
        if (this.audioCategories[category]) {
            this.audioCategories[category].enabled = !this.audioCategories[category].enabled;
            this.saveAudioSettings();
            return this.audioCategories[category].enabled;
        }
        return false;
    }
    
    // Get all categories data
    getAllCategories() {
        return { ...this.audioCategories };
    }
      // Play sound with category-based volume
    playCategorySound(frequency, duration, type, category, volumeMultiplier = 1) {
        const categoryVolume = this.getCategoryVolume(category);
        if (categoryVolume <= 0) return; // Category disabled or volume 0
        
        this.playTone(frequency, duration, type, categoryVolume * volumeMultiplier);
    }
    
    // Weather sounds
    playRainSound() {
        if (!this.enabled || !this.userInteracted) return;
        
        // Create rain noise effect
        const categoryVolume = this.getCategoryVolume('environmental');
        if (categoryVolume <= 0) return;
        
        try {
            if (!this.audioContext) {
                this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            }
            
            const bufferSize = this.audioContext.sampleRate * 0.1; // 0.1 second buffer
            const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
            const data = buffer.getChannelData(0);
            
            // Generate rain noise
            for (let i = 0; i < bufferSize; i++) {
                data[i] = (Math.random() * 2 - 1) * 0.3; // White noise
            }
            
            const source = this.audioContext.createBufferSource();
            const gainNode = this.audioContext.createGain();
            
            source.buffer = buffer;
            source.loop = true;
            
            gainNode.gain.value = categoryVolume * this.volume * 0.5;
            
            source.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            source.start();
            
            // Stop after a short duration to prevent continuous noise
            setTimeout(() => {
                if (source.stop) source.stop();
            }, 200);
            
        } catch (error) {
            console.warn('Rain sound failed:', error);
        }
    }
    
    playThunderSound() {
        if (!this.enabled || !this.userInteracted) return;
        
        // Thunder rumble effect
        this.playCategorySound(40 + Math.random() * 30, 2.0, 'sawtooth', 'environmental', 0.8);
        
        // Lightning crack
        setTimeout(() => {
            this.playCategorySound(800 + Math.random() * 400, 0.3, 'square', 'environmental', 0.6);
        }, 100);
    }
    
    playWindSound() {
        if (!this.enabled || !this.userInteracted) return;
        
        // Wind whoosh effect
        this.playCategorySound(150 + Math.random() * 100, 1.5, 'sawtooth', 'environmental', 0.4);
    }
    
    playSnowSound() {
        if (!this.enabled || !this.userInteracted) return;
        
        // Soft snow falling effect
        this.playCategorySound(2000 + Math.random() * 1000, 0.5, 'sine', 'environmental', 0.2);
    }
}
