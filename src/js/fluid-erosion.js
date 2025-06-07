// 🪨 ADVANCED EROSION AND SEDIMENTATION SYSTEM
// Sistema di erosione e depositi sedimentari per ambiente realistico

class FluidErosion {
    constructor(fluidPhysics) {
        this.fluidPhysics = fluidPhysics;
        this.world = fluidPhysics.world;
        
        // 🪨 Proprietà di resistenza dei materiali
        this.materialResistance = {
            [BlockTypes.DIRT]: 0.1,      // Facile da erodere
            [BlockTypes.SAND]: 0.05,     // Molto facile da erodere
            [BlockTypes.STONE]: 0.8,     // Difficile da erodere
            [BlockTypes.GRANITE]: 0.95,  // Molto resistente
            [BlockTypes.WOOD]: 0.3,      // Moderatamente resistente
            [BlockTypes.LEAVES]: 0.01,   // Quasi nessuna resistenza
        };
        
        // 🏊 Velocità minima per erosione
        this.erosionThreshold = 30; // velocità flusso
        this.acidErosionMultiplier = 3.0;
        this.heatErosionMultiplier = 2.0;
        
        // 🧱 Sistema sedimenti
        this.sedimentMap = new Map();
        this.sedimentCapacity = 0.1; // capacità di trasporto
        this.depositionRate = 0.02;
        
        // 📊 Tracciamento erosione
        this.erosionEvents = [];
        this.totalErosion = 0;
    }
    
    // 🌊 Processo di erosione principale
    processErosion(x, y, fluidType, flowVelocity, deltaTime) {
        const flowMagnitude = flowVelocity.magnitude;
        
        // Controlla se la velocità supera la soglia di erosione
        if (flowMagnitude < this.erosionThreshold) return false;
        
        const fluidProps = this.fluidPhysics.getFluidProperties(fluidType);
        let erosionPower = this.calculateErosionPower(flowMagnitude, fluidProps);
        
        // Controlla blocchi circostanti per erosione
        const directions = [
            { dx: 0, dy: 1 },   // Sotto (più probabile)
            { dx: 1, dy: 0 },   // Destra
            { dx: -1, dy: 0 },  // Sinistra
            { dx: 0, dy: -1 },  // Sopra
        ];
        
        let erosionOccurred = false;
        
        for (const dir of directions) {
            const targetX = x + dir.dx;
            const targetY = y + dir.dy;
            
            if (!this.world.isValidPosition(targetX, targetY)) continue;
            
            const targetBlock = this.world.getBlock(targetX, targetY);
            
            // Controlla se il blocco può essere eroso
            if (this.canErode(targetBlock, erosionPower, deltaTime)) {
                // Esegui erosione
                const sedimentType = this.erodeBlock(targetX, targetY, targetBlock, erosionPower);
                
                if (sedimentType) {
                    // Trasporta sedimenti nel fluido
                    this.addSedimentToFlow(x, y, sedimentType, 1);
                    erosionOccurred = true;
                    
                    // Aggiungi effetti visivi
                    this.addErosionParticles(targetX, targetY, targetBlock);
                    
                    // Registra evento di erosione
                    this.recordErosionEvent(targetX, targetY, targetBlock, erosionPower);
                    
                    break; // Un blocco per volta per frame
                }
            }
        }
        
        return erosionOccurred;
    }
    
    // ⚡ Calcola potere erosivo
    calculateErosionPower(flowVelocity, fluidProps) {
        let power = Math.pow(flowVelocity / 100, 2); // Legge di potenza
        
        // Modificatori per tipo di fluido
        if (fluidProps.corrosive) {
            power *= this.acidErosionMultiplier;
        }
        
        if (fluidProps.temperature > 100) {
            power *= this.heatErosionMultiplier;
        }
        
        // Effetto densità
        power *= Math.sqrt(fluidProps.density / 1000);
        
        return Math.min(power, 1.0);
    }
    
    // 🔍 Controlla se un blocco può essere eroso
    canErode(blockType, erosionPower, deltaTime) {
        if (blockType === BlockTypes.AIR) return false;
        if (this.world.isLiquid(blockType)) return false;
        
        const resistance = this.materialResistance[blockType] || 0.5;
        const erosionChance = (erosionPower - resistance) * deltaTime * 0.1;
        
        return erosionChance > 0 && Math.random() < erosionChance;
    }
    
    // 🪨 Erode un blocco
    erodeBlock(x, y, blockType, erosionPower) {
        // Determina che tipo di sedimento produce
        let sedimentType;
        
        switch (blockType) {
            case BlockTypes.DIRT:
                sedimentType = 'soil';
                break;
            case BlockTypes.SAND:
                sedimentType = 'sand';
                break;
            case BlockTypes.STONE:
            case BlockTypes.GRANITE:
                sedimentType = 'rock';
                break;
            case BlockTypes.WOOD:
                sedimentType = 'organic';
                break;
            default:
                sedimentType = 'debris';
        }
        
        // Rimuovi il blocco e sostituisci con aria
        this.world.setBlock(x, y, BlockTypes.AIR);
        
        // Aggiorna contatori
        this.totalErosion++;
        
        return sedimentType;
    }
    
    // 🏊 Aggiungi sedimenti al flusso
    addSedimentToFlow(x, y, sedimentType, amount) {
        const key = `${x},${y}`;
        const existing = this.sedimentMap.get(key) || {};
        
        existing[sedimentType] = (existing[sedimentType] || 0) + amount;
        existing.totalSediment = Object.values(existing).reduce((sum, val) => {
            return typeof val === 'number' ? sum + val : sum;
        }, 0);
        existing.lastUpdate = Date.now();
        
        this.sedimentMap.set(key, existing);
    }
    
    // 🧱 Processo di deposizione sedimenti
    processDeposition(x, y, fluidType, flowVelocity, deltaTime) {
        const key = `${x},${y}`;
        const sediments = this.sedimentMap.get(key);
        
        if (!sediments || sediments.totalSediment <= 0) return false;
        
        const flowMagnitude = flowVelocity.magnitude;
        const fluidProps = this.fluidPhysics.getFluidProperties(fluidType);
        
        // Calcola capacità di trasporto corrente
        const transportCapacity = this.calculateTransportCapacity(flowMagnitude, fluidProps);
        
        // Se i sedimenti superano la capacità, deposita
        if (sediments.totalSediment > transportCapacity) {
            const excessSediment = sediments.totalSediment - transportCapacity;
            const depositionAmount = Math.min(excessSediment, this.depositionRate * deltaTime);
            
            if (depositionAmount > 0) {
                return this.depositSediment(x, y, sediments, depositionAmount);
            }
        }
        
        return false;
    }
    
    // 📦 Calcola capacità di trasporto
    calculateTransportCapacity(flowVelocity, fluidProps) {
        // Capacità proporzionale alla velocità al quadrato
        const baseCapacity = Math.pow(flowVelocity / 100, 1.5) * this.sedimentCapacity;
        
        // Modificatori per tipo di fluido
        let capacity = baseCapacity * (fluidProps.density / 1000);
        
        if (fluidProps.viscosity > 1000) {
            capacity *= 2; // Fluidi viscosi trasportano più sedimenti
        }
        
        return Math.max(capacity, 0);
    }
    
    // 🏗️ Deposita sedimenti
    depositSediment(x, y, sediments, amount) {
        // Trova posizione appropriata per la deposizione
        const depositPosition = this.findDepositionSite(x, y);
        
        if (depositPosition) {
            // Determina tipo di blocco da creare
            const blockType = this.selectDepositBlockType(sediments);
            
            if (blockType) {
                this.world.setBlock(depositPosition.x, depositPosition.y, blockType);
                
                // Rimuovi sedimenti dalla mappa
                this.removeSedimentFromFlow(x, y, amount, sediments);
                
                // Effetti visivi
                this.addDepositionParticles(depositPosition.x, depositPosition.y, blockType);
                
                return true;
            }
        }
        
        return false;
    }
    
    // 📍 Trova sito di deposizione
    findDepositionSite(x, y) {
        // Preferenza per depositi in basso
        const candidates = [
            { x, y: y + 1, priority: 3 },     // Direttamente sotto
            { x: x + 1, y: y + 1, priority: 2 }, // Diagonale destra-basso
            { x: x - 1, y: y + 1, priority: 2 }, // Diagonale sinistra-basso
            { x: x + 1, y, priority: 1 },     // Destra
            { x: x - 1, y, priority: 1 },     // Sinistra
        ];
        
        // Ordina per priorità e trova primo sito valido
        candidates.sort((a, b) => b.priority - a.priority);
        
        for (const pos of candidates) {
            if (this.world.isValidPosition(pos.x, pos.y)) {
                const blockType = this.world.getBlock(pos.x, pos.y);
                if (blockType === BlockTypes.AIR) {
                    return pos;
                }
            }
        }
        
        return null;
    }
    
    // 🧱 Seleziona tipo di blocco per deposito
    selectDepositBlockType(sediments) {
        // Trova sedimento più abbondante
        let maxType = '';
        let maxAmount = 0;
        
        for (const [type, amount] of Object.entries(sediments)) {
            if (typeof amount === 'number' && amount > maxAmount) {
                maxAmount = amount;
                maxType = type;
            }
        }
        
        // Mappa sedimenti a blocchi
        switch (maxType) {
            case 'soil':
                return BlockTypes.DIRT;
            case 'sand':
                return BlockTypes.SAND;
            case 'rock':
                return Math.random() > 0.7 ? BlockTypes.STONE : BlockTypes.DIRT;
            case 'organic':
                return BlockTypes.DIRT;
            default:
                return BlockTypes.DIRT;
        }
    }
    
    // ➖ Rimuovi sedimenti dal flusso
    removeSedimentFromFlow(x, y, amount, sediments) {
        const key = `${x},${y}`;
        const ratio = amount / sediments.totalSediment;
        
        for (const [type, typeAmount] of Object.entries(sediments)) {
            if (typeof typeAmount === 'number') {
                sediments[type] = Math.max(0, typeAmount - (typeAmount * ratio));
            }
        }
        
        sediments.totalSediment = Math.max(0, sediments.totalSediment - amount);
        
        if (sediments.totalSediment <= 0.01) {
            this.sedimentMap.delete(key);
        } else {
            this.sedimentMap.set(key, sediments);
        }
    }
    
    // 🎨 Effetti visivi erosione
    addErosionParticles(x, y, blockType) {
        if (!window.game?.particles) return;
        
        const worldX = x * this.world.blockSize + this.world.blockSize / 2;
        const worldY = y * this.world.blockSize + this.world.blockSize / 2;
        
        // Colore basato sul tipo di blocco
        let color = '#8B4513'; // Default: marrone
        switch (blockType) {
            case BlockTypes.DIRT:
                color = '#8B4513';
                break;
            case BlockTypes.SAND:
                color = '#F4A460';
                break;
            case BlockTypes.STONE:
                color = '#696969';
                break;
            case BlockTypes.WOOD:
                color = '#D2691E';
                break;
        }
        
        for (let i = 0; i < 5; i++) {
            window.game.particles.particles.push(new Particle({
                x: worldX + (Math.random() - 0.5) * 25,
                y: worldY + (Math.random() - 0.5) * 25,
                velocityX: (Math.random() - 0.5) * 60,
                velocityY: (Math.random() - 0.5) * 60,
                color: color,
                size: Math.random() * 2 + 1,
                life: 1.0 + Math.random() * 0.5,
                gravity: 150,
                transparency: 0.8
            }));
        }
    }
    
    // 🏗️ Effetti visivi deposizione
    addDepositionParticles(x, y, blockType) {
        if (!window.game?.particles) return;
        
        const worldX = x * this.world.blockSize + this.world.blockSize / 2;
        const worldY = y * this.world.blockSize + this.world.blockSize / 2;
        
        for (let i = 0; i < 3; i++) {
            window.game.particles.particles.push(new Particle({
                x: worldX + (Math.random() - 0.5) * 20,
                y: worldY + (Math.random() - 0.5) * 20,
                velocityX: (Math.random() - 0.5) * 30,
                velocityY: -Math.random() * 30 - 10,
                color: '#DEB887',
                size: Math.random() * 1.5 + 0.5,
                life: 0.5 + Math.random() * 0.3,
                gravity: 100,
                transparency: 0.9
            }));
        }
    }
    
    // 📝 Registra evento di erosione
    recordErosionEvent(x, y, blockType, erosionPower) {
        this.erosionEvents.push({
            x, y, blockType, erosionPower,
            timestamp: Date.now()
        });
        
        // Mantieni solo eventi recenti
        const cutoff = Date.now() - 30000; // 30 secondi
        this.erosionEvents = this.erosionEvents.filter(event => event.timestamp > cutoff);
    }
    
    // 🔄 Aggiornamento principale
    update(deltaTime) {
        const processedPositions = new Set();
        
        // Processo erosione e deposizione per tutti i fluidi attivi
        for (let x = 0; x < this.world.width; x += 2) {
            for (let y = 0; y < this.world.height; y += 2) {
                const key = `${x},${y}`;
                if (processedPositions.has(key)) continue;
                processedPositions.add(key);
                
                const blockType = this.world.getBlock(x, y);
                if (this.world.isLiquid(blockType)) {
                    const flowVelocity = this.fluidPhysics.getFlowVelocityAt(x, y);
                    
                    // Processo erosione
                    this.processErosion(x, y, blockType, flowVelocity, deltaTime);
                    
                    // Processo deposizione
                    this.processDeposition(x, y, blockType, flowVelocity, deltaTime);
                }
            }
        }
    }
    
    // 📊 API pubblica
    getTotalErosion() {
        return this.totalErosion;
    }
    
    getRecentErosionEvents() {
        return this.erosionEvents.slice(-10); // Ultimi 10 eventi
    }
    
    getSedimentAt(x, y) {
        return this.sedimentMap.get(`${x},${y}`) || null;
    }
    
    getErosionStats() {
        return {
            totalErosion: this.totalErosion,
            activeSedimentSites: this.sedimentMap.size,
            recentEvents: this.erosionEvents.length
        };
    }
}
