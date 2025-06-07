// ⚡ ADVANCED PERFORMANCE OPTIMIZATION SYSTEM
// Sistema di ottimizzazione performance per simulazioni fluide complesse

class FluidPerformanceManager {
    constructor(fluidPhysics) {
        this.fluidPhysics = fluidPhysics;
        this.world = fluidPhysics.world;
        
        // 📊 Monitoraggio performance
        this.frameTime = 0;
        this.avgFrameTime = 16.67; // 60 FPS target
        this.frameHistory = [];
        this.maxHistorySize = 60;
        
        // 🎯 Level of Detail (LOD)
        this.lodLevels = {
            HIGH: { distance: 50, updateRate: 1, particleRate: 1.0 },
            MEDIUM: { distance: 100, updateRate: 2, particleRate: 0.5 },
            LOW: { distance: 200, updateRate: 4, particleRate: 0.2 },
            MINIMAL: { distance: Infinity, updateRate: 8, particleRate: 0.1 }
        };
        
        // 🌊 Spatial hashing per fluidi
        this.spatialHash = new Map();
        this.hashCellSize = 64; // pixels
        this.lastHashUpdate = 0;
        this.hashUpdateInterval = 500; // ms
        
        // 🔧 Adaptive quality
        this.qualityLevel = 'HIGH';
        this.adaptiveQuality = true;
        this.performanceTarget = 16.67; // ms per frame (60 FPS)
        
        // 📈 Statistics
        this.stats = {
            fluidsProcessed: 0,
            particlesGenerated: 0,
            erosionEvents: 0,
            vorticesCreated: 0,
            optimizationsApplied: 0
        };
    }
    
    // 📊 Aggiorna metriche performance
    updatePerformanceMetrics(deltaTime) {
        this.frameTime = deltaTime;
        this.frameHistory.push(deltaTime);
        
        if (this.frameHistory.length > this.maxHistorySize) {
            this.frameHistory.shift();
        }
        
        // Calcola media mobile
        this.avgFrameTime = this.frameHistory.reduce((sum, time) => sum + time, 0) / this.frameHistory.length;
        
        // Adaptive quality adjustment
        if (this.adaptiveQuality) {
            this.adjustQualityLevel();
        }
    }
    
    // 🎯 Regola automaticamente il livello di qualità
    adjustQualityLevel() {
        const targetTime = this.performanceTarget;
        const currentTime = this.avgFrameTime;
        
        if (currentTime > targetTime * 1.5 && this.qualityLevel !== 'MINIMAL') {
            // Performance troppo bassa, riduci qualità
            const levels = Object.keys(this.lodLevels);
            const currentIndex = levels.indexOf(this.qualityLevel);
            if (currentIndex < levels.length - 1) {
                this.qualityLevel = levels[currentIndex + 1];
                this.stats.optimizationsApplied++;
                console.log(`⚡ Quality reduced to ${this.qualityLevel} (avg frame time: ${currentTime.toFixed(2)}ms)`);
            }
        } else if (currentTime < targetTime * 0.8 && this.qualityLevel !== 'HIGH') {
            // Performance buona, aumenta qualità
            const levels = Object.keys(this.lodLevels);
            const currentIndex = levels.indexOf(this.qualityLevel);
            if (currentIndex > 0) {
                this.qualityLevel = levels[currentIndex - 1];
                console.log(`⚡ Quality increased to ${this.qualityLevel} (avg frame time: ${currentTime.toFixed(2)}ms)`);
            }
        }
    }
    
    // 🗺️ Aggiorna spatial hash per fluidi
    updateSpatialHash() {
        const now = Date.now();
        if (now - this.lastHashUpdate < this.hashUpdateInterval) return;
        
        this.spatialHash.clear();
        
        for (let x = 0; x < this.world.width; x++) {
            for (let y = 0; y < this.world.height; y++) {
                const blockType = this.world.getBlock(x, y);
                if (this.world.isLiquid(blockType)) {
                    const hashX = Math.floor(x / this.hashCellSize);
                    const hashY = Math.floor(y / this.hashCellSize);
                    const key = `${hashX},${hashY}`;
                    
                    if (!this.spatialHash.has(key)) {
                        this.spatialHash.set(key, []);
                    }
                    
                    this.spatialHash.get(key).push({ x, y, type: blockType });
                }
            }
        }
        
        this.lastHashUpdate = now;
    }
    
    // 🎯 Determina LOD per una posizione
    getLODLevel(x, y) {
        if (!this.world.game?.player) return this.lodLevels[this.qualityLevel];
        
        const player = this.world.game.player;
        const playerX = Math.floor(player.x / this.world.blockSize);
        const playerY = Math.floor(player.y / this.world.blockSize);
        
        const distance = Math.sqrt((x - playerX) ** 2 + (y - playerY) ** 2);
        
        // Seleziona LOD basato su distanza e qualità globale
        const globalLOD = this.lodLevels[this.qualityLevel];
        
        if (distance < globalLOD.distance * 0.3) {
            return this.lodLevels.HIGH;
        } else if (distance < globalLOD.distance * 0.6) {
            return this.lodLevels.MEDIUM;
        } else if (distance < globalLOD.distance) {
            return this.lodLevels.LOW;
        } else {
            return this.lodLevels.MINIMAL;
        }
    }
    
    // ⏱️ Controlla se un fluido dovrebbe essere aggiornato
    shouldUpdateFluid(x, y, frameCount) {
        const lod = this.getLODLevel(x, y);
        return (frameCount % lod.updateRate) === 0;
    }
    
    // 🎨 Controlla se generare particelle
    shouldGenerateParticles(x, y) {
        const lod = this.getLODLevel(x, y);
        return Math.random() < lod.particleRate;
    }
    
    // 🌊 Ottimizza aggiornamento fluidi
    optimizeFluidUpdate(fluidsToUpdate, frameCount) {
        const optimizedFluids = [];
        
        for (const fluid of fluidsToUpdate) {
            if (this.shouldUpdateFluid(fluid.x, fluid.y, frameCount)) {
                optimizedFluids.push(fluid);
            }
        }
        
        // Limita numero massimo basato su performance
        const maxFluids = this.getMaxFluidUpdates();
        
        if (optimizedFluids.length > maxFluids) {
            // Prioritizza fluidi più vicini al player
            return optimizedFluids.slice(0, maxFluids);
        }
        
        this.stats.fluidsProcessed = optimizedFluids.length;
        return optimizedFluids;
    }
    
    // 📊 Calcola numero massimo di aggiornamenti fluidi
    getMaxFluidUpdates() {
        const baseLine = {
            'HIGH': 80,
            'MEDIUM': 60,
            'LOW': 40,
            'MINIMAL': 20
        };
        
        let maxUpdates = baseLine[this.qualityLevel];
        
        // Aggiusta basato su performance attuale
        if (this.avgFrameTime > this.performanceTarget * 1.2) {
            maxUpdates *= 0.7;
        } else if (this.avgFrameTime < this.performanceTarget * 0.9) {
            maxUpdates *= 1.3;
        }
        
        return Math.round(Math.max(maxUpdates, 10));
    }
    
    // 🔥 Ottimizza sistema di particelle
    optimizeParticleSystem() {
        if (!window.game?.particles) return;
        
        const particles = window.game.particles.particles;
        const lod = this.lodLevels[this.qualityLevel];
        
        // Limita numero particelle basato su qualità
        const maxParticles = Math.round(1000 * lod.particleRate);
        
        if (particles.length > maxParticles) {
            // Rimuovi particelle più vecchie
            particles.sort((a, b) => (a.life || 1) - (b.life || 1));
            particles.splice(0, particles.length - maxParticles);
            this.stats.optimizationsApplied++;
        }
    }
    
    // 🌪️ Ottimizza sistema turbolenza
    optimizeTurbulence() {
        if (!this.fluidPhysics.turbulenceSystem) return;
        
        const turbulence = this.fluidPhysics.turbulenceSystem;
        const lod = this.lodLevels[this.qualityLevel];
        
        // Limita numero vortici
        const maxVortices = Math.round(50 * lod.particleRate);
        
        if (turbulence.vortexMap.size > maxVortices) {
            // Rimuovi vortici più deboli
            const sortedVortices = Array.from(turbulence.vortexMap.entries())
                .sort((a, b) => a[1].strength - b[1].strength);
            
            const toRemove = sortedVortices.slice(0, turbulence.vortexMap.size - maxVortices);
            toRemove.forEach(([key]) => turbulence.vortexMap.delete(key));
            
            this.stats.optimizationsApplied++;
        }
    }
    
    // 🪨 Ottimizza sistema erosione
    optimizeErosion() {
        if (!this.fluidPhysics.erosionSystem) return;
        
        const erosion = this.fluidPhysics.erosionSystem;
        const lod = this.lodLevels[this.qualityLevel];
        
        // Limita siti di sedimento attivi
        const maxSedimentSites = Math.round(100 * lod.particleRate);
        
        if (erosion.sedimentMap.size > maxSedimentSites) {
            // Rimuovi siti con meno sedimenti
            const sortedSites = Array.from(erosion.sedimentMap.entries())
                .sort((a, b) => (a[1].totalSediment || 0) - (b[1].totalSediment || 0));
            
            const toRemove = sortedSites.slice(0, erosion.sedimentMap.size - maxSedimentSites);
            toRemove.forEach(([key]) => erosion.sedimentMap.delete(key));
            
            this.stats.optimizationsApplied++;
        }
    }
    
    // 🔄 Aggiornamento principale delle ottimizzazioni
    update(deltaTime, frameCount) {
        this.updatePerformanceMetrics(deltaTime);
        this.updateSpatialHash();
        
        // Ottimizza sistemi ogni pochi frame
        if (frameCount % 30 === 0) {
            this.optimizeParticleSystem();
            this.optimizeTurbulence();
            this.optimizeErosion();
        }
    }
    
    // 📊 Ottieni statistiche performance
    getPerformanceStats() {
        return {
            currentFrameTime: this.frameTime,
            averageFrameTime: this.avgFrameTime,
            fps: Math.round(1000 / this.avgFrameTime),
            qualityLevel: this.qualityLevel,
            spatialHashCells: this.spatialHash.size,
            ...this.stats
        };
    }
    
    // 🎛️ Controlli manuali
    setQualityLevel(level) {
        if (this.lodLevels[level]) {
            this.qualityLevel = level;
            this.adaptiveQuality = false;
            console.log(`⚡ Quality manually set to ${level}`);
        }
    }
    
    enableAdaptiveQuality() {
        this.adaptiveQuality = true;
        console.log('⚡ Adaptive quality enabled');
    }
    
    disableAdaptiveQuality() {
        this.adaptiveQuality = false;
        console.log('⚡ Adaptive quality disabled');
    }
    
    // 🔧 Reset statistics
    resetStats() {
        this.stats = {
            fluidsProcessed: 0,
            particlesGenerated: 0,
            erosionEvents: 0,
            vorticesCreated: 0,
            optimizationsApplied: 0
        };
        this.frameHistory = [];
    }
}
