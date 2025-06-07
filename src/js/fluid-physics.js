// 🌊 ADVANCED FLUID PHYSICS SYSTEM
// Sistema avanzato di fisica dei fluidi per Minecraft Browser Game
// Implementa pressione, viscosità, correnti e simulazione realistica

class FluidPhysics {
    constructor(world) {
        this.world = world;
        
        // 🔧 Proprietà fisiche dei fluidi con miglioramenti molecolari
        this.fluidProperties = {
            [BlockTypes.WATER]: {
                density: 1000,      // kg/m³
                viscosity: 1.0,     // Pa·s
                surfaceTension: 0.07, // N/m
                compressibility: 0.00045, // 1/Pa
                thermalExpansion: 0.00021, // 1/K
                evaporationRate: 0.001,
                freezingPoint: 273.15, // K
                boilingPoint: 373.15,  // K
                color: '#4169E1',
                transparency: 0.7,
                flowResistance: 0.1,
                buoyancyFactor: 1.0,
                // 🧬 Nuove proprietà molecolari
                contactAngle: 15,      // gradi - angolo di contatto con superfici
                cohesionStrength: 0.5, // Forza di coesione molecolare
                vanDerWaalsRange: 2,   // Raggio di influenza forze van der Waals
                molecularSize: 0.3,    // Dimensione relativa molecole                polarMoment: 1.85,     // Momento di dipolo (Debye)
                hydrogenBonds: true,   // Capacità di legami idrogeno
                meniscusIntensity: 0.8, // Intensità effetto menisco
                polarizability: 1.5    // Polarizzabilità per forze di dispersione
            },
            [BlockTypes.LAVA]: {
                density: 2800,      // kg/m³ (molto più denso)
                viscosity: 100000,  // Pa·s (molto viscoso)
                surfaceTension: 0.4, // N/m (alta tensione superficiale)
                compressibility: 0.00001, // 1/Pa (incomprimibile)
                thermalExpansion: 0.0001, // 1/K
                evaporationRate: 0.0001,
                freezingPoint: 1173.15, // K (900°C)
                boilingPoint: 1473.15,  // K (1200°C)
                color: '#FF4500',
                transparency: 0.8,
                flowResistance: 0.8,
                buoyancyFactor: 2.8,
                temperature: 1200, // °C
                // 🧬 Proprietà molecolari lava
                contactAngle: 45,      // gradi
                cohesionStrength: 1.2, // Forza alta per silicati fusi
                vanDerWaalsRange: 1.5,
                molecularSize: 0.8,                polarMoment: 0.5,
                hydrogenBonds: false,
                meniscusIntensity: 0.4,
                thermalEmission: 0.9,   // Emissione termica
                polarizability: 0.8     // Polarizzabilità ridotta per lava
            },
            [BlockTypes.ACID]: {
                density: 1200,      // kg/m³
                viscosity: 0.5,     // Pa·s (meno viscoso dell'acqua)
                surfaceTension: 0.05, // N/m
                compressibility: 0.0003, // 1/Pa
                thermalExpansion: 0.0003, // 1/K
                evaporationRate: 0.002,
                freezingPoint: 263.15, // K (-10°C)
                boilingPoint: 363.15,  // K (90°C)
                color: '#32CD32',
                transparency: 0.6,
                flowResistance: 0.05,
                buoyancyFactor: 1.2,
                corrosive: true,
                // 🧬 Proprietà molecolari acido
                contactAngle: 5,       // gradi - bagna tutto
                cohesionStrength: 0.3,
                vanDerWaalsRange: 2.5, // Range maggiore per reattività
                molecularSize: 0.2,                polarMoment: 2.1,      // Altamente polare
                hydrogenBonds: true,
                meniscusIntensity: 1.2, // Effetto menisco molto forte
                reactivity: 0.9,        // Reattività chimica
                polarizability: 2.0     // Alta polarizzabilità per acido
            }
        };

        // 🌊 Sistema di pressione fluidi
        this.pressureMap = new Map();
        this.flowVelocityMap = new Map();
        this.temperatureMap = new Map();
        
        // ⚡ Ottimizzazioni performance
        this.fluidUpdateCounter = 0;
        this.fluidUpdateInterval = 15; // Aggiornamenti più frequenti per fluidità
        this.maxFluidUpdatesPerFrame = 50;
        
        // 🌊 Sistema di onde e superficie
        this.surfaceWaves = new Map();
        this.waveAmplitude = 3;
        this.waveFrequency = 0.02;
        this.waveSpeed = 2;
        
        // 💨 Sistema di correnti
        this.currentMap = new Map();
        this.currentStrength = 50;
        
        // 🎯 Cache per ottimizzazioni
        this.fluidCache = new Map();
        this.lastCacheUpdate = 0;
        this.cacheUpdateInterval = 100; // ms
        
        // 🌪️ Sistema di turbolenza avanzato
        this.turbulenceSystem = null;
        this.enableTurbulence = true;
        
        // 🪨 Sistema di erosione e sedimenti
        this.erosionSystem = null;
        this.enableErosion = true;
          // ⚡ Sistema di ottimizzazione performance
        this.performanceManager = null;
        this.enablePerformanceOptimization = true;
        this.frameCounter = 0;
        
        // 🔬 Debug mode per visualizzazione forze molecolari
        this.debugMode = false;
        
        // 🧬 API per controllo funzionalità molecolari avanzate
        this.enableMolecularPhysics = true;
    }    // 🚀 Inizializzazione sistemi avanzati
    initializeAdvancedSystems() {
        // Carica sistemi di turbolenza ed erosione se disponibili
        if (this.enableTurbulence && typeof FluidTurbulence !== 'undefined') {
            this.turbulenceSystem = new FluidTurbulence(this);
            console.log('🌪️ Advanced Turbulence System initialized');
        }
        
        if (this.enableErosion && typeof FluidErosion !== 'undefined') {
            this.erosionSystem = new FluidErosion(this);
            console.log('🪨 Advanced Erosion System initialized');
        }
        
        // Carica sistema di ottimizzazione performance
        if (this.enablePerformanceOptimization && typeof FluidPerformanceManager !== 'undefined') {
            this.performanceManager = new FluidPerformanceManager(this);
            console.log('⚡ Advanced Performance Manager initialized');
        }
    }    // 🔄 Aggiornamento principale del sistema fluidi
    updateFluidPhysics(deltaTime) {
        this.fluidUpdateCounter++;
        this.frameCounter++;
        
        // ⚡ Aggiorna performance manager per primo
        if (this.performanceManager && this.enablePerformanceOptimization) {
            this.performanceManager.update(deltaTime, this.frameCounter);
        }
        
        if (this.fluidUpdateCounter < this.fluidUpdateInterval) {
            return;
        }
        this.fluidUpdateCounter = 0;

        // Aggiorna cache se necessario
        this.updateFluidCache();
        
        // Trova tutti i fluidi da aggiornare
        let fluidsToUpdate = this.findFluidsToUpdate();
        
        // 🚀 Applica ottimizzazioni performance se disponibili
        if (this.performanceManager && this.enablePerformanceOptimization) {
            fluidsToUpdate = this.performanceManager.optimizeFluidUpdate(fluidsToUpdate, this.frameCounter);
            const maxUpdates = this.performanceManager.getMaxFluidUpdates();
            this.maxFluidUpdatesPerFrame = maxUpdates;
        }
        
        // Limita il numero di aggiornamenti per frame per le performance
        const maxUpdates = Math.min(fluidsToUpdate.length, this.maxFluidUpdatesPerFrame);
        
        for (let i = 0; i < maxUpdates; i++) {
            const fluid = fluidsToUpdate[i];
            this.processAdvancedFluidFlow(fluid.x, fluid.y, fluid.type, deltaTime);
        }
        
        // Aggiorna onde e effetti di superficie
        this.updateSurfaceEffects(deltaTime);
        
        // Aggiorna correnti
        this.updateCurrents(deltaTime);
        
        // Aggiorna temperatura e evaporazione
        this.updateThermodynamics(deltaTime);
        
        // 🌪️ Aggiorna sistema di turbolenza
        if (this.turbulenceSystem && this.enableTurbulence) {
            this.turbulenceSystem.update(deltaTime);
        }
          // 🪨 Aggiorna sistema di erosione - DISABILITATO
        // if (this.erosionSystem && this.enableErosion) {
        //     this.erosionSystem.update(deltaTime);
        // }
    }

    // 🔍 Trova fluidi da aggiornare con priorità intelligente
    findFluidsToUpdate() {
        const fluids = [];
        const playerX = Math.floor(this.world.game?.player?.x / this.world.blockSize || 0);
        const playerY = Math.floor(this.world.game?.player?.y / this.world.blockSize || 0);
        
        for (let x = 0; x < this.world.width; x++) {
            for (let y = 0; y < this.world.height; y++) {
                const blockType = this.world.getBlock(x, y);
                if (this.world.isLiquid(blockType)) {
                    // Calcola distanza dal player per priorità
                    const distance = Math.sqrt((x - playerX) ** 2 + (y - playerY) ** 2);
                    fluids.push({ x, y, type: blockType, distance });
                }
            }
        }
        
        // Ordina per distanza (più vicini al player hanno priorità)
        fluids.sort((a, b) => a.distance - b.distance);
        
        return fluids;
    }

    // 🌊 Processo avanzato di flusso fluidi
    processAdvancedFluidFlow(x, y, fluidType, deltaTime) {
        const fluidProps = this.fluidProperties[fluidType];
        if (!fluidProps) return false;

        // Calcola pressione locale
        const pressure = this.calculatePressure(x, y, fluidType);
        
        // Calcola gradiente di pressione
        const pressureGradient = this.calculatePressureGradient(x, y);
        
        // Applica fisica avanzata dei fluidi
        return this.applyAdvancedFluidDynamics(x, y, fluidType, pressure, pressureGradient, deltaTime);
    }

    // 📊 Calcolo della pressione idrostatica
    calculatePressure(x, y, fluidType) {
        const fluidProps = this.fluidProperties[fluidType];
        let pressure = 0;
        
        // Pressione idrostatica: P = ρgh
        const gravity = 9.81; // m/s²
        
        // Conta la profondità del fluido sopra questo punto
        let depth = 0;
        for (let checkY = y - 1; checkY >= 0; checkY--) {
            const blockAbove = this.world.getBlock(x, checkY);
            if (this.world.isLiquid(blockAbove)) {
                depth++;
            } else {
                break;
            }
        }
        
        // Calcola pressione idrostatica
        pressure = fluidProps.density * gravity * depth * this.world.blockSize / 1000;
        
        // Aggiungi pressione atmosferica
        pressure += 101325; // Pa
        
        // Cache del risultato
        const key = `${x},${y}`;
        this.pressureMap.set(key, pressure);
        
        return pressure;
    }

    // 📈 Calcolo del gradiente di pressione
    calculatePressureGradient(x, y) {
        const directions = [
            { dx: 1, dy: 0 },   // Destra
            { dx: -1, dy: 0 },  // Sinistra
            { dx: 0, dy: 1 },   // Giù
            { dx: 0, dy: -1 }   // Su
        ];
        
        const gradients = [];
        const basePressure = this.pressureMap.get(`${x},${y}`) || 0;
        
        for (const dir of directions) {
            const nx = x + dir.dx;
            const ny = y + dir.dy;
            
            if (this.world.isValidPosition(nx, ny)) {
                const neighborBlock = this.world.getBlock(nx, ny);
                let neighborPressure = basePressure;
                
                if (this.world.isLiquid(neighborBlock)) {
                    neighborPressure = this.pressureMap.get(`${nx},${ny}`) || basePressure;
                } else if (neighborBlock === BlockTypes.AIR) {
                    neighborPressure = 101325; // Pressione atmosferica
                }
                
                gradients.push({
                    direction: dir,
                    gradient: neighborPressure - basePressure
                });
            }
        }
        
        return gradients;
    }

    // ⚡ Applicazione dinamica avanzata dei fluidi
    applyAdvancedFluidDynamics(x, y, fluidType, pressure, pressureGradients, deltaTime) {
        const fluidProps = this.fluidProperties[fluidType];
        let actionTaken = false;        // Verifica che il blocco sia ancora del tipo corretto
        if (this.world.getBlock(x, y) !== fluidType) {
            return false;
        }
          // 1. Interazioni chimiche avanzate - TEMPORANEAMENTE DISABILITATE
        // if (this.processChemicalReactions(x, y, fluidType)) {
        //     return true;
        // }
        
        // 2. Flusso governato dalla pressione (Equazione di Navier-Stokes semplificata)
        const flowVelocity = this.calculateFlowVelocity(pressureGradients, fluidProps, deltaTime);
        
        // 3. Flusso verso il basso (gravità)
        if (this.tryFlowDown(x, y, fluidType, flowVelocity)) {
            return true;
        }
        
        // 4. Flusso orizzontale basato su pressione
        if (this.tryPressureBasedFlow(x, y, fluidType, pressureGradients, flowVelocity)) {
            actionTaken = true;
        }
          // 5. Effetti di viscosità
        this.applyViscosityEffects(x, y, fluidType, deltaTime);
        
        // 6. Forze intermolecolari avanzate (tensione superficiale, capillarità, van der Waals)
        this.applyIntermolecularForces(x, y, fluidType, deltaTime);
        
        // 7. Aggiorna velocità e correnti
        this.updateFlowVelocity(x, y, flowVelocity);
        
        return actionTaken;
    }

    // 🧪 Reazioni chimiche avanzate tra fluidi
    processChemicalReactions(x, y, fluidType) {
        const reactions = [
            // Acqua + Lava = Pietra + Vapore
            {
                reactants: [BlockTypes.WATER, BlockTypes.LAVA],
                products: [BlockTypes.STONE],
                energyRelease: 1000, // kJ/mol
                steamGeneration: true
            },
            // Acido + Acqua = Oro + Calore
            {
                reactants: [BlockTypes.ACID, BlockTypes.WATER],
                products: [BlockTypes.GOLD_ORE],
                energyRelease: 500,
                heatGeneration: true
            },
            // Acido + Lava = Pietra + Gas Tossico
            {
                reactants: [BlockTypes.ACID, BlockTypes.LAVA],
                products: [BlockTypes.STONE],
                energyRelease: 1500,
                toxicGas: true
            }
        ];
        
        const directions = [
            { dx: 0, dy: 1 }, { dx: 0, dy: -1 },
            { dx: 1, dy: 0 }, { dx: -1, dy: 0 },
            { dx: 1, dy: 1 }, { dx: -1, dy: -1 },
            { dx: 1, dy: -1 }, { dx: -1, dy: 1 }
        ];
        
        for (const dir of directions) {
            const nx = x + dir.dx;
            const ny = y + dir.dy;
            
            if (!this.world.isValidPosition(nx, ny)) continue;
            
            const neighborBlock = this.world.getBlock(nx, ny);
            
            for (const reaction of reactions) {
                if (reaction.reactants.includes(fluidType) && 
                    reaction.reactants.includes(neighborBlock)) {
                    
                    // Esegui reazione
                    this.executeChemicalReaction(x, y, nx, ny, reaction);
                    return true;
                }
            }
        }
        
        return false;
    }    // ⚗️ Esecuzione reazione chimica MIGLIORATA
    executeChemicalReaction(x1, y1, x2, y2, reaction) {
        // Reazioni più realistiche che non eliminano liquidi inutilmente
        
        if (reaction.reactants.includes(BlockTypes.WATER) && reaction.reactants.includes(BlockTypes.LAVA)) {
            // Acqua + Lava = Pietra (sostituisce SOLO la lava, acqua rimane)
            const waterPos = this.world.getBlock(x1, y1) === BlockTypes.WATER ? {x: x1, y: y1} : {x: x2, y: y2};
            const lavaPos = this.world.getBlock(x1, y1) === BlockTypes.LAVA ? {x: x1, y: y1} : {x: x2, y: y2};
            
            this.world.setBlock(lavaPos.x, lavaPos.y, BlockTypes.STONE);
            // L'acqua rimane acqua (realismo: si raffredda ma non scompare)
            
        } else if (reaction.reactants.includes(BlockTypes.ACID) && reaction.reactants.includes(BlockTypes.WATER)) {
            // Acido + Acqua = Diluizione (casualità se genera oro)
            if (Math.random() < 0.3) { // Solo 30% possibilità di generare oro
                const acidPos = this.world.getBlock(x1, y1) === BlockTypes.ACID ? {x: x1, y: y1} : {x: x2, y: y2};
                this.world.setBlock(acidPos.x, acidPos.y, BlockTypes.GOLD_ORE);
                // L'acqua rimane acqua
            }
            // Altrimenti nessuna trasformazione (diluizione)
            
        } else if (reaction.reactants.includes(BlockTypes.ACID) && reaction.reactants.includes(BlockTypes.LAVA)) {
            // Acido + Lava = Reazione violenta
            const acidPos = this.world.getBlock(x1, y1) === BlockTypes.ACID ? {x: x1, y: y1} : {x: x2, y: y2};
            const lavaPos = this.world.getBlock(x1, y1) === BlockTypes.LAVA ? {x: x1, y: y1} : {x: x2, y: y2};
            
            this.world.setBlock(acidPos.x, acidPos.y, BlockTypes.STONE);
            // La lava rimane lava (è più resistente)
            
        } else {
            // Reazione generica (fallback) - trasforma solo un blocco casuale
            const productBlock = reaction.products[0];
            if (Math.random() < 0.5) {
                this.world.setBlock(x1, y1, productBlock);
            } else {
                this.world.setBlock(x2, y2, productBlock);
            }
        }
        
        // Effetti speciali (unchanged)
        if (reaction.steamGeneration) {
            this.generateSteamEffect(x1, y1);
        }
        
        if (reaction.heatGeneration) {
            this.generateHeatEffect(x1, y1);
        }
        
        if (reaction.toxicGas) {
            this.generateToxicGasEffect(x1, y1);
        }
        
        // Suono della reazione
        if (window.game?.sound) {
            window.game.sound.playTone(200 + reaction.energyRelease / 10, 0.3, 'square');
        }
        
        // Particelle della reazione
        if (window.game?.particles) {
            this.addReactionParticles(x1, y1, reaction);
        }
    }

    // 💨 Calcolo velocità di flusso (Navier-Stokes semplificato)
    calculateFlowVelocity(pressureGradients, fluidProps, deltaTime) {
        const velocity = { x: 0, y: 0 };
        
        for (const gradient of pressureGradients) {
            // Equazione semplificata: v = -∇P / (ρ * viscosity)
            const force = -gradient.gradient / (fluidProps.density * fluidProps.viscosity);
            
            velocity.x += force * gradient.direction.dx * deltaTime;
            velocity.y += force * gradient.direction.dy * deltaTime;
        }
        
        // Limita la velocità massima
        const maxVelocity = 100 / fluidProps.viscosity;
        const magnitude = Math.sqrt(velocity.x ** 2 + velocity.y ** 2);
        
        if (magnitude > maxVelocity) {
            velocity.x = (velocity.x / magnitude) * maxVelocity;
            velocity.y = (velocity.y / magnitude) * maxVelocity;
        }
        
        return velocity;
    }

    // ⬇️ Flusso verso il basso migliorato
    tryFlowDown(x, y, fluidType, flowVelocity) {
        const belowY = y + 1;
        
        if (!this.world.isValidPosition(x, belowY)) return false;
        
        const blockBelow = this.world.getBlock(x, belowY);
        
        if (blockBelow === BlockTypes.AIR) {
            // Calcola probabilità di flusso basata su viscosità
            const fluidProps = this.fluidProperties[fluidType];
            const flowProbability = 1.0 - (fluidProps.viscosity / 100000);
            
            if (Math.random() < flowProbability) {
                this.world.setBlock(x, belowY, fluidType);
                this.world.setBlock(x, y, BlockTypes.AIR);
                
                // Aggiungi effetti particellari
                this.addFlowParticles(x, y, fluidType, 'down');
                
                return true;
            }
        }
        
        return false;
    }

    // ↔️ Flusso orizzontale basato su pressione
    tryPressureBasedFlow(x, y, fluidType, pressureGradients, flowVelocity) {
        let actionTaken = false;
        const fluidProps = this.fluidProperties[fluidType];
        
        // Ordina i gradienti per forza (maggiore pressione = flusso più probabile)
        const sortedGradients = pressureGradients
            .filter(g => g.gradient > 0) // Solo dove la pressione è minore
            .sort((a, b) => Math.abs(b.gradient) - Math.abs(a.gradient));
        
        for (const gradient of sortedGradients.slice(0, 2)) { // Max 2 direzioni per frame
            const nx = x + gradient.direction.dx;
            const ny = y + gradient.direction.dy;
            
            if (!this.world.isValidPosition(nx, ny)) continue;
            
            const neighborBlock = this.world.getBlock(nx, ny);
            
            if (neighborBlock === BlockTypes.AIR) {
                // Probabilità di flusso basata su gradiente di pressione e viscosità
                const flowProbability = Math.min(
                    Math.abs(gradient.gradient) / 10000,
                    1.0 - (fluidProps.viscosity / 200000)
                );
                
                if (Math.random() < flowProbability) {
                    this.world.setBlock(nx, ny, fluidType);
                    
                    // Non rimuovere il blocco sorgente per flusso orizzontale (spread)
                    // questo simula la pressione che spinge il fluido
                    
                    this.addFlowParticles(x, y, fluidType, 'horizontal');
                    actionTaken = true;
                }
            }
        }
        
        return actionTaken;
    }

    // 🌊 Aggiornamento effetti superficie
    updateSurfaceEffects(deltaTime) {
        const time = Date.now() * 0.001; // Converti in secondi
        
        // Aggiorna onde per tutti i fluidi di superficie
        for (let x = 0; x < this.world.width; x++) {
            for (let y = 0; y < this.world.height; y++) {
                const blockType = this.world.getBlock(x, y);
                
                if (this.world.isLiquid(blockType)) {
                    // Controlla se è superficie (aria sopra)
                    const blockAbove = this.world.getBlock(x, y - 1);
                    if (blockAbove === BlockTypes.AIR) {
                        // Calcola offset onda
                        const waveOffset = Math.sin(
                            time * this.waveSpeed + 
                            x * this.waveFrequency
                        ) * this.waveAmplitude;
                        
                        this.surfaceWaves.set(`${x},${y}`, waveOffset);
                    }
                }
            }
        }
    }

    // 🌊 Ottieni offset onda superficie
    getSurfaceWaveAt(x, y) {
        // Validazione input
        if (typeof x !== 'number' || typeof y !== 'number') {
            return 0;
        }
        
        // Arrotonda alle coordinate intere
        const roundedX = Math.floor(x);
        const roundedY = Math.floor(y);
        
        // Controlla se esiste un'onda per queste coordinate
        const key = `${roundedX},${roundedY}`;
        const waveOffset = this.surfaceWaves.get(key);
        
        if (waveOffset !== undefined) {
            return waveOffset;
        }
        
        // Se non c'è un'onda precalcolata, calcola in tempo reale
        const blockType = this.world.getBlock(roundedX, roundedY);
        if (this.world.isLiquid(blockType)) {
            const blockAbove = this.world.getBlock(roundedX, roundedY - 1);
            if (blockAbove === BlockTypes.AIR) {
                const time = Date.now() * 0.001;
                const waveOffset = Math.sin(
                    time * this.waveSpeed + 
                    roundedX * this.waveFrequency
                ) * this.waveAmplitude;
                
                // Salva il risultato per ottimizzare future chiamate
                this.surfaceWaves.set(key, waveOffset);
                return waveOffset;
            }
        }
        
        // Nessuna onda per questa posizione
        return 0;
    }

    // 💨 Aggiornamento correnti
    updateCurrents(deltaTime) {
        // Genera correnti in grandi corpi d'acqua
        for (let x = 0; x < this.world.width; x += 5) {
            for (let y = 0; y < this.world.height; y += 5) {
                if (this.world.getBlock(x, y) === BlockTypes.WATER) {
                    // Controlla se è un grande corpo d'acqua
                    const waterSize = this.calculateWaterBodySize(x, y);
                    
                    if (waterSize > 20) {
                        // Genera corrente
                        const currentDirection = Math.random() * Math.PI * 2;
                        const currentStrength = this.currentStrength * (waterSize / 100);
                        
                        this.currentMap.set(`${x},${y}`, {
                            direction: currentDirection,
                            strength: currentStrength,
                            lastUpdate: Date.now()
                        });
                    }
                }
            }
        }
    }

    // 🌡️ Aggiornamento termodinamica
    updateThermodynamics(deltaTime) {
        for (let x = 0; x < this.world.width; x += 3) {
            for (let y = 0; y < this.world.height; y += 3) {
                const blockType = this.world.getBlock(x, y);
                const fluidProps = this.fluidProperties[blockType];
                
                if (fluidProps) {
                    // Simulazione temperature ambiente
                    let ambientTemp = 20; // °C
                    
                    // Temperatura basata su profondità
                    if (y > 60) {
                        ambientTemp += (y - 60) * 0.5; // Geotermia
                    }
                      // Evaporazione - DISABILITATA
                    // if (blockType === BlockTypes.WATER && ambientTemp > 80) {
                    //     if (Math.random() < fluidProps.evaporationRate * deltaTime) {
                    //         this.world.setBlock(x, y, BlockTypes.AIR);
                    //         this.generateSteamEffect(x, y);
                    //     }
                    // }
                      // Solidificazione lava - DISABILITATA
                    // if (blockType === BlockTypes.LAVA && ambientTemp < 800) {
                    //     // Controlla se c'è acqua nelle vicinanze
                    //     if (this.hasWaterNearby(x, y)) {
                    //         if (Math.random() < 0.1 * deltaTime) {
                    //             this.world.setBlock(x, y, BlockTypes.STONE);
                    //             this.generateSteamEffect(x, y);
                    //         }
                    //     }
                    // }
                }
            }
        }
    }

    // 🎯 Funzioni di utilità e cache

    updateFluidCache() {
        const now = Date.now();
        if (now - this.lastCacheUpdate < this.cacheUpdateInterval) {
            return;
        }
        
        this.lastCacheUpdate = now;
        this.fluidCache.clear();
        
        // Cache proprietà fluidi frequentemente usate
        for (let x = 0; x < this.world.width; x += 2) {
            for (let y = 0; y < this.world.height; y += 2) {
                const blockType = this.world.getBlock(x, y);
                if (this.world.isLiquid(blockType)) {
                    this.fluidCache.set(`${x},${y}`, {
                        type: blockType,
                        properties: this.fluidProperties[blockType],
                        lastUpdate: now
                    });
                }
            }
        }
    }

    calculateWaterBodySize(startX, startY) {
        const visited = new Set();
        const queue = [{x: startX, y: startY}];
        let size = 0;
        
        while (queue.length > 0 && size < 200) { // Limite per performance
            const {x, y} = queue.shift();
            const key = `${x},${y}`;
            
            if (visited.has(key)) continue;
            visited.add(key);
            
            if (this.world.getBlock(x, y) === BlockTypes.WATER) {
                size++;
                
                // Aggiungi vicini
                const neighbors = [
                    {x: x+1, y}, {x: x-1, y},
                    {x, y: y+1}, {x, y: y-1}
                ];
                
                for (const neighbor of neighbors) {
                    if (this.world.isValidPosition(neighbor.x, neighbor.y)) {
                        queue.push(neighbor);
                    }
                }
            }
        }
        
        return size;
    }

    hasWaterNearby(x, y) {
        for (let dx = -2; dx <= 2; dx++) {
            for (let dy = -2; dy <= 2; dy++) {
                if (this.world.isValidPosition(x + dx, y + dy)) {
                    if (this.world.getBlock(x + dx, y + dy) === BlockTypes.WATER) {
                        return true;
                    }
                }
            }        }
        return false;
    }

    // 🌊 Applica effetti di viscosità al fluido
    applyViscosityEffects(x, y, fluidType, deltaTime) {
        const fluidProps = this.fluidProperties[fluidType];
        if (!fluidProps) return;

        const viscosity = fluidProps.viscosity;
        if (viscosity <= 0) return;

        // Calcola il gradiente di velocità per applicare attrito viscoso
        const currentVelocity = this.getFlowVelocityAt(x, y);
        const neighbors = [
            { dx: -1, dy: 0 }, { dx: 1, dy: 0 },
            { dx: 0, dy: -1 }, { dx: 0, dy: 1 }
        ];

        let totalViscousForce = { x: 0, y: 0 };
        let neighborCount = 0;

        for (const neighbor of neighbors) {
            const nx = x + neighbor.dx;
            const ny = y + neighbor.dy;
            const neighborBlock = this.world.getBlock(nx, ny);
            
            if (neighborBlock && this.world.isLiquid(neighborBlock.type)) {
                const neighborVelocity = this.getFlowVelocityAt(nx, ny);
                
                // Calcola differenza di velocità (gradiente)
                const velocityDiff = {
                    x: neighborVelocity.x - currentVelocity.x,
                    y: neighborVelocity.y - currentVelocity.y
                };
                
                // Forza viscosa proporzionale al gradiente di velocità
                const viscousConstant = viscosity * 0.001 * deltaTime;
                totalViscousForce.x += velocityDiff.x * viscousConstant;
                totalViscousForce.y += velocityDiff.y * viscousConstant;
                neighborCount++;
            }
        }

        if (neighborCount > 0) {
            // Media delle forze viscose
            totalViscousForce.x /= neighborCount;
            totalViscousForce.y /= neighborCount;
            
            // Applica la forza viscosa modificando la velocità
            const newVelocity = {
                x: currentVelocity.x + totalViscousForce.x,
                y: currentVelocity.y + totalViscousForce.y
            };
            
            // Limite massimo di velocità basato sulla viscosità
            const maxVelocity = Math.max(0.1, 1.0 / (viscosity * 0.001 + 1));
            const magnitude = Math.sqrt(newVelocity.x ** 2 + newVelocity.y ** 2);
            
            if (magnitude > maxVelocity) {
                const scale = maxVelocity / magnitude;
                newVelocity.x *= scale;
                newVelocity.y *= scale;
            }
            
            // Aggiorna la velocità di flusso
            this.updateFlowVelocity(x, y, newVelocity);
        }
    }

    updateFlowVelocity(x, y, velocity) {
        const key = `${x},${y}`;
        this.flowVelocityMap.set(key, {
            x: velocity.x,
            y: velocity.y,
            magnitude: Math.sqrt(velocity.x ** 2 + velocity.y ** 2),
            lastUpdate: Date.now()
        });    
    }
    
    // 🌊 Ottieni velocità di flusso locale
    getFlowVelocityAt(x, y) {
        // Validazione input
        if (typeof x !== 'number' || typeof y !== 'number') {
            return { x: 0, y: 0, magnitude: 0 };
        }
        
        // Arrotonda alle coordinate intere
        const roundedX = Math.floor(x);
        const roundedY = Math.floor(y);
        
        // Controlla se esiste una velocità memorizzata per queste coordinate
        const key = `${roundedX},${roundedY}`;
        const storedVelocity = this.flowVelocityMap.get(key);
        
        if (storedVelocity) {
            return storedVelocity;
        }
        
        // Se non c'è velocità memorizzata, calcola in base al tipo di fluido
        const blockType = this.world.getBlock(roundedX, roundedY);
        if (this.world.isLiquid(blockType)) {
            // Calcola velocità base basata su pressione locale
            const pressure = this.calculatePressure(roundedX, roundedY, blockType);
            const pressureGradients = this.calculatePressureGradient(roundedX, roundedY);
            const fluidProps = this.fluidProperties[blockType];
            
            if (fluidProps && pressureGradients.length > 0) {
                const velocity = this.calculateFlowVelocity(pressureGradients, fluidProps, 0.016);
                
                // Salva il risultato per ottimizzare future chiamate
                this.updateFlowVelocity(roundedX, roundedY, velocity);
                return {
                    x: velocity.x,
                    y: velocity.y,
                    magnitude: Math.sqrt(velocity.x ** 2 + velocity.y ** 2)
                };
            }
        }
        
        // Nessun flusso per questa posizione
        return { x: 0, y: 0, magnitude: 0 };
    }

    // 🎨 Effetti visivi avanzati

    addFlowParticles(x, y, fluidType, direction) {
        if (!window.game?.particles) return;
        
        // 🚀 Controlla se generare particelle basato su performance
        if (this.performanceManager && this.enablePerformanceOptimization) {
            if (!this.performanceManager.shouldGenerateParticles(x, y)) {
                return;
            }
        }
        
        const worldX = x * this.world.blockSize + this.world.blockSize / 2;
        const worldY = y * this.world.blockSize + this.world.blockSize / 2;
        const fluidProps = this.fluidProperties[fluidType];
        
        for (let i = 0; i < 3; i++) {
            let velocityX = (Math.random() - 0.5) * 50;
            let velocityY = (Math.random() - 0.5) * 50;
              if (direction === 'down') {
                velocityY = Math.random() * 100 + 50;
            } else if (direction === 'horizontal') {
                velocityX = (Math.random() - 0.5) * 100;
                velocityY = (Math.random() - 0.5) * 30;
            } else if (direction === 'intermolecular') {
                // Particelle più lente e delicate per forze intermolecolari
                velocityX = (Math.random() - 0.5) * 40;
                velocityY = (Math.random() - 0.5) * 40;
            }
            
            window.game.particles.particles.push(new Particle({
                x: worldX + (Math.random() - 0.5) * 20,
                y: worldY + (Math.random() - 0.5) * 20,
                velocityX: velocityX,
                velocityY: velocityY,
                color: fluidProps.color,
                size: Math.random() * 2 + 1,
                life: 0.5 + Math.random() * 0.5,
                gravity: 200 / fluidProps.viscosity,
                transparency: fluidProps.transparency
            }));
        }
    }

    generateSteamEffect(x, y) {
        if (!window.game?.particles) return;
        
        const worldX = x * this.world.blockSize + this.world.blockSize / 2;
        const worldY = y * this.world.blockSize + this.world.blockSize / 2;
        
        for (let i = 0; i < 8; i++) {
            window.game.particles.particles.push(new Particle({
                x: worldX + (Math.random() - 0.5) * 30,
                y: worldY + (Math.random() - 0.5) * 30,
                velocityX: (Math.random() - 0.5) * 40,
                velocityY: -Math.random() * 120 - 80,
                color: '#E6E6FA',
                size: Math.random() * 4 + 2,
                life: 1.5 + Math.random() * 1.0,
                gravity: -100, // Vapore sale
                transparency: 0.6
            }));
        }
    }

    generateHeatEffect(x, y) {
        if (!window.game?.particles) return;
        
        const worldX = x * this.world.blockSize + this.world.blockSize / 2;
        const worldY = y * this.world.blockSize + this.world.blockSize / 2;
        
        for (let i = 0; i < 5; i++) {
            window.game.particles.particles.push(new Particle({
                x: worldX + (Math.random() - 0.5) * 25,
                y: worldY + (Math.random() - 0.5) * 25,
                velocityX: (Math.random() - 0.5) * 60,
                velocityY: -Math.random() * 80 - 40,
                color: ['#FFD700', '#FFA500', '#FF6347'][Math.floor(Math.random() * 3)],
                size: Math.random() * 3 + 1,
                life: 0.8 + Math.random() * 0.7,
                gravity: -50,
                transparency: 0.8
            }));
        }
    }

    generateToxicGasEffect(x, y) {
        if (!window.game?.particles) return;
        
        const worldX = x * this.world.blockSize + this.world.blockSize / 2;
        const worldY = y * this.world.blockSize + this.world.blockSize / 2;
        
        for (let i = 0; i < 6; i++) {
            window.game.particles.particles.push(new Particle({
                x: worldX + (Math.random() - 0.5) * 35,
                y: worldY + (Math.random() - 0.5) * 35,
                velocityX: (Math.random() - 0.5) * 80,
                velocityY: -Math.random() * 60 - 30,
                color: ['#9ACD32', '#228B22', '#32CD32'][Math.floor(Math.random() * 3)],
                size: Math.random() * 5 + 3,
                life: 2.0 + Math.random() * 1.5,
                gravity: -80,
                transparency: 0.4
            }));
        }
    }

    addReactionParticles(x, y, reaction) {
        const worldX = x * this.world.blockSize + this.world.blockSize / 2;
        const worldY = y * this.world.blockSize + this.world.blockSize / 2;
        
        const colors = reaction.steamGeneration ? ['#E6E6FA', '#F0F8FF'] :
                      reaction.toxicGas ? ['#9ACD32', '#32CD32'] :
                      ['#FFD700', '#FFA500'];
        
        for (let i = 0; i < 12; i++) {
            window.game.particles.particles.push(new Particle({
                x: worldX + (Math.random() - 0.5) * 40,
                y: worldY + (Math.random() - 0.5) * 40,
                velocityX: (Math.random() - 0.5) * 150,
                velocityY: -Math.random() * 150 - 50,
                color: colors[Math.floor(Math.random() * colors.length)],
                size: Math.random() * 4 + 2,
                life: 1.0 + Math.random() * 1.0,
                gravity: reaction.steamGeneration ? -120 : 200,
                transparency: 0.7
            }));
        }
    }

    // 🫧 Sistema di bolle e cavitazione avanzato
    generateBubbles(x, y, fluidType, pressure) {
        if (!window.game?.particles) return;
        
        const fluidProps = this.fluidProperties[fluidType];
        const temperature = fluidProps.temperature || 20; // °C
        const vaporPressure = this.calculateVaporPressure(fluidProps, temperature);
        
        // Cavitazione se pressione locale < pressione vapore
        if (pressure < vaporPressure && Math.random() < 0.015) {
            const worldX = x * this.world.blockSize + this.world.blockSize / 2;
            const worldY = y * this.world.blockSize + this.world.blockSize / 2;
            
            // Crea bolle di cavitazione con dimensioni basate su differenza di pressione
            const pressureDiff = vaporPressure - pressure;
            const bubbleCount = Math.floor(pressureDiff / 10000) + 1;
            
            for (let i = 0; i < Math.min(bubbleCount, 5); i++) {
                const bubbleSize = Math.random() * 4 + 1 + (pressureDiff / 50000);
                
                window.game.particles.particles.push(new Particle({
                    x: worldX + (Math.random() - 0.5) * 20,
                    y: worldY + (Math.random() - 0.5) * 20,
                    velocityX: (Math.random() - 0.5) * 25,
                    velocityY: -Math.random() * 35 - 15,
                    color: this.getBubbleColor(fluidType, temperature),
                    size: bubbleSize,
                    life: 0.4 + Math.random() * 0.6,
                    gravity: -60, // Bolle risalgono
                    transparency: 0.25,
                    type: 'cavitation_bubble',
                    // Proprietà speciali per bolle di cavitazione
                    implosionTime: 0.1 + Math.random() * 0.2,
                    maxSize: bubbleSize * 1.5
                }));
            }
        }
        
        // Bolle termiche per liquidi caldi con nucleazione
        if (temperature > 80) {
            const nucleationRate = Math.pow((temperature - 80) / 100, 2) * 0.008;
            if (Math.random() < nucleationRate) {
                this.generateThermalBubbles(x, y, fluidProps, temperature);
            }
        }
        
        // Bolle di gas dissolto
        if (fluidType === BlockTypes.WATER && Math.random() < 0.003) {
            this.generateDissolvedGasBubbles(x, y, pressure);
        }
    }

    // 🌡️ Bolle termiche per liquidi caldi migliorate
    generateThermalBubbles(x, y, fluidProps, temperature) {
        if (!window.game?.particles) return;
        
        const worldX = x * this.world.blockSize + this.world.blockSize / 2;
        const worldY = y * this.world.blockSize + this.world.blockSize / 2;
        
        const bubbleIntensity = Math.min((temperature - 80) / 50, 2.0);
        const bubbleCount = Math.floor(bubbleIntensity * 3) + 1;
        
        for (let i = 0; i < bubbleCount; i++) {
            const thermalVelocity = Math.sqrt(temperature / 100) * 20; // Velocità basata su energia termica
            
            window.game.particles.particles.push(new Particle({
                x: worldX + (Math.random() - 0.5) * 12,
                y: worldY + (Math.random() - 0.5) * 12,
                velocityX: (Math.random() - 0.5) * thermalVelocity,
                velocityY: -Math.random() * thermalVelocity - 25,
                color: this.getThermalBubbleColor(temperature),
                size: Math.random() * 3 + 0.8,
                life: 0.6 + Math.random() * 0.4,
                gravity: -90 - temperature * 0.1, // Più caldo = rise più veloce
                transparency: 0.4,
                type: 'thermal_bubble',
                expansionRate: temperature / 1000 // Espansione termica
            }));
        }
    }

    // 💨 Bolle di gas dissolto
    generateDissolvedGasBubbles(x, y, pressure) {
        if (!window.game?.particles) return;
        
        const worldX = x * this.world.blockSize + this.world.blockSize / 2;
        const worldY = y * this.world.blockSize + this.world.blockSize / 2;
        
        // Solubilità gas diminuisce con pressione minore (Legge di Henry)
        const gasSolubility = pressure / 101325; // Normalizzato a pressione atmosferica
        
        if (gasSolubility < 0.8) { // Gas si libera
            window.game.particles.particles.push(new Particle({
                x: worldX + (Math.random() - 0.5) * 8,
                y: worldY + (Math.random() - 0.5) * 8,
                velocityX: (Math.random() - 0.5) * 10,
                velocityY: -Math.random() * 20 - 5,
                color: '#E8F4FD',
                size: Math.random() * 2 + 0.5,
                life: 1.0 + Math.random() * 0.5,
                gravity: -30,
                transparency: 0.15,
                type: 'dissolved_gas_bubble'
            }));
        }
    }

    // 🎨 Colore bolle basato su tipo e temperatura
    getBubbleColor(fluidType, temperature) {
        if (fluidType === BlockTypes.LAVA) {
            return temperature > 1000 ? '#FFFF99' : '#FFE066';
        } else if (fluidType === BlockTypes.ACID) {
            return '#E6FFE6';
        } else {
            return temperature > 60 ? '#E0F0FF' : '#E8F4FD';
        }
    }

    // 🌡️ Colore bolle termiche
    getThermalBubbleColor(temperature) {
        if (temperature > 150) return '#FFFFCC';
        if (temperature > 120) return '#FFFFE0';
        if (temperature > 100) return '#F0FFFF';
        return '#E8F8FF';
    }

    // 💨 Calcola pressione vapore con equazione di Antoine
    calculateVaporPressure(fluidProps, temperature) {
        const tempK = temperature + 273.15; // Converti in Kelvin
        const boilingPoint = fluidProps.boilingPoint || 373.15; // K
        
        // Equazione di Antoine semplificata: log(P) = A - B/(C + T)
        // Parametri tipici per acqua
        const A = 8.07131, B = 1730.63, C = 233.426;
        
        if (fluidType === BlockTypes.WATER) {
            const logP = A - B / (C + temperature);
            return Math.pow(10, logP) * 133.322; // Converti mmHg in Pa
        } else {
            // Formula semplificata per altri fluidi
            const scaleFactor = tempK / boilingPoint;
            return 101325 * Math.pow(scaleFactor, 4); // Pa
        }
    }

    // 🧲 Forze di coesione tra molecole migliorate (van der Waals)
    calculateCohesionForces(x, y, fluidType) {
        const fluidProps = this.fluidProperties[fluidType];
        let cohesionForce = { x: 0, y: 0 };
        
        const cohesionStrength = fluidProps.cohesionStrength || 0.5;
        const vanDerWaalsRange = fluidProps.vanDerWaalsRange || 2;
        const molecularSize = fluidProps.molecularSize || 0.5;
        let neighborCount = 0;
        
        // Controlla fluidi vicini per forze intermolecolari
        for (let dx = -vanDerWaalsRange; dx <= vanDerWaalsRange; dx++) {
            for (let dy = -vanDerWaalsRange; dy <= vanDerWaalsRange; dy++) {
                if (dx === 0 && dy === 0) continue;
                
                const nx = x + dx;
                const ny = y + dy;
                
                if (this.world.isValidPosition(nx, ny)) {
                    const block = this.world.getBlock(nx, ny);
                    if (block === fluidType) {
                        neighborCount++;
                        const distance = Math.sqrt(dx*dx + dy*dy);
                        
                        // Potenziale di Lennard-Jones semplificato: V(r) = 4ε[(σ/r)^12 - (σ/r)^6]
                        const sigma = molecularSize; // Distanza a potenziale zero
                        const epsilon = cohesionStrength; // Profondità del pozzo di potenziale
                          if (distance > 0 && distance <= vanDerWaalsRange) {
                            const r_norm = sigma / distance;
                            // FIX: Riduci drasticamente le forze tra fluidi dello stesso tipo
                            // Le forze originali causano auto-interazioni eccessive quando 
                            // lo stesso liquido interagisce con se stesso
                            const sameTypeReduction = 0.001; // Riduzione del 99.9%
                            const reducedEpsilon = epsilon * sameTypeReduction;
                            
                            // Usa versione semplificata di Lennard-Jones per evitare forze esplosive
                            const lj_force = reducedEpsilon * (1.0 / (distance * distance)) * 0.001;
                            
                            // Applica forza molto ridotta per prevenire scomparsa fluidi
                            cohesionForce.x += (dx / distance) * lj_force;
                            cohesionForce.y += (dy / distance) * lj_force;
                        }
                    }
                }
            }
        }
        
        // Effetto densità locale - forza maggiore in zone dense
        const localDensity = neighborCount / (Math.PI * vanDerWaalsRange * vanDerWaalsRange);
        const densityFactor = Math.min(localDensity, 1.0);
        
        cohesionForce.x *= densityFactor;
        cohesionForce.y *= densityFactor;
        
        // Aggiungi effetto legami idrogeno per fluidi polari
        if (fluidProps.hydrogenBonds) {
            const hBondForce = this.calculateHydrogenBonds(x, y, fluidType, neighborCount);
            cohesionForce.x += hBondForce.x;
            cohesionForce.y += hBondForce.y;
        }
        
        return cohesionForce;
    }

    // 🔗 Calcola legami idrogeno per molecole polari
    calculateHydrogenBonds(x, y, fluidType, neighborCount) {
        const fluidProps = this.fluidProperties[fluidType];
        const polarMoment = fluidProps.polarMoment || 0;
        let hBondForce = { x: 0, y: 0 };
          if (polarMoment > 0) {
            // FIX: Riduci forza legami idrogeno per prevenire auto-interazioni eccessive
            const bondStrength = polarMoment * 0.001; // Ridotto da 0.1 a 0.001
            const orientationEffect = 0.1; // Semplificato e ridotto
            
            // Legami idrogeno creano forze direzionali molto ridotte
            for (let dx = -1; dx <= 1; dx++) {
                for (let dy = -1; dy <= 1; dy++) {
                    if (dx === 0 && dy === 0) continue;
                    
                    const nx = x + dx;
                    const ny = y + dy;
                    
                    if (this.world.isValidPosition(nx, ny)) {
                        const block = this.world.getBlock(nx, ny);
                        if (block === fluidType) {
                            const distance = Math.sqrt(dx*dx + dy*dy);
                            // FIX: Forza molto ridotta per evitare auto-interazioni problematiche
                            const bondForce = bondStrength * orientationEffect / (distance * distance + 1.0);
                            
                            hBondForce.x += (dx / distance) * bondForce * 0.01;
                            hBondForce.y += (dy / distance) * bondForce * 0.01;
                        }
                    }
                }
            }
        }
        
        return hBondForce;
    }

    // 🌊 Calcola tensione superficiale con curvatura
    calculateSurfaceTension(x, y, fluidType) {
        const fluidProps = this.fluidProperties[fluidType];
        const surfaceTension = fluidProps.surfaceTension || 0.07;
        
        // Calcola curvatura della superficie
        let curvature = 0;
        let airContactCount = 0;
        let totalContactCount = 0;
        
        // Controlla i vicini per determinare la curvatura
        const neighbors = [
            {dx: -1, dy: 0}, {dx: 1, dy: 0},
            {dx: 0, dy: -1}, {dx: 0, dy: 1},
            {dx: -1, dy: -1}, {dx: 1, dy: -1},
            {dx: -1, dy: 1}, {dx: 1, dy: 1}
        ];
        
        for (const neighbor of neighbors) {
            const nx = x + neighbor.dx;
            const ny = y + neighbor.dy;
            
            if (this.world.isValidPosition(nx, ny)) {
                const block = this.world.getBlock(nx, ny);
                totalContactCount++;
                
                if (block === BlockTypes.AIR) {
                    airContactCount++;
                    // Contributo alla curvatura basato sulla posizione
                    const weight = 1.0 / Math.sqrt(neighbor.dx * neighbor.dx + neighbor.dy * neighbor.dy);
                    curvature += weight;
                }
            }
        }
        
        // Normalizza la curvatura
        if (totalContactCount > 0) {
            curvature = curvature / totalContactCount;
        }
        
        // Forza di tensione superficiale proporzionale alla curvatura
        const tensionForce = surfaceTension * curvature;
        
        return {
            magnitude: tensionForce,
            curvature: curvature,
            airContact: airContactCount / totalContactCount
        };
    }

    // 🧪 Calcola azione capillare dinamica
    calculateCapillaryAction(x, y, fluidType) {
        const fluidProps = this.fluidProperties[fluidType];
        const contactAngle = fluidProps.contactAngle || Math.PI / 4; // 45 gradi default
        const surfaceTension = fluidProps.surfaceTension || 0.07;
        
        let capillaryForce = { x: 0, y: 0 };
        
        // Cerca blocchi solidi vicini per l'azione capillare
        for (let dx = -2; dx <= 2; dx++) {
            for (let dy = -2; dy <= 2; dy++) {
                if (dx === 0 && dy === 0) continue;
                
                const nx = x + dx;
                const ny = y + dy;
                
                if (this.world.isValidPosition(nx, ny)) {
                    const block = this.world.getBlock(nx, ny);
                    
                    // Verifica se è un blocco solido
                    if (block !== BlockTypes.AIR && !this.world.isLiquid(block)) {
                        const distance = Math.sqrt(dx * dx + dy * dy);
                        
                        if (distance <= 2.0) {
                            // Forza capillare inversamente proporzionale alla distanza
                            const capillaryStrength = surfaceTension * Math.cos(contactAngle) / distance;
                            
                            // Direzione verso il blocco solido (adesione)
                            capillaryForce.x += (dx / distance) * capillaryStrength * 0.01;
                            capillaryForce.y += (dy / distance) * capillaryStrength * 0.01;
                        }
                    }
                }
            }
        }
        
        return capillaryForce;
    }

    // ⚛️ Calcola forze di dispersione (forze di London)
    calculateDispersionForces(x, y, fluidType) {
        const fluidProps = this.fluidProperties[fluidType];
        const polarizability = fluidProps.polarizability || 1.0;
        
        let dispersionForce = { x: 0, y: 0 };
        
        // Le forze di dispersione sono sempre attrattive e di corto raggio
        const neighbors = [
            {dx: -1, dy: 0}, {dx: 1, dy: 0},
            {dx: 0, dy: -1}, {dx: 0, dy: 1}
        ];
        
        for (const neighbor of neighbors) {
            const nx = x + neighbor.dx;
            const ny = y + neighbor.dy;
            
            if (this.world.isValidPosition(nx, ny)) {
                const block = this.world.getBlock(nx, ny);
                
                if (this.world.isLiquid(block)) {
                    const neighborProps = this.fluidProperties[block];
                    const neighborPolarizability = neighborProps?.polarizability || 1.0;
                    
                    // Forza di dispersione proporzionale al prodotto delle polarizzabilità
                    const dispersionStrength = Math.sqrt(polarizability * neighborPolarizability) * 0.001;
                    
                    // Direzione verso il vicino (sempre attrattiva)
                    dispersionForce.x += neighbor.dx * dispersionStrength;
                    dispersionForce.y += neighbor.dy * dispersionStrength;
                }
            }
        }
        
        return dispersionForce;
    }

    // 📊 Ottieni pressione locale per cavitazione
    getPressureAt(x, y) {
        // Calcola pressione idrostatica basata sulla profondità
        let depth = 0;
        
        // Conta blocchi liquidi sopra questo punto
        for (let checkY = y - 1; checkY >= 0; checkY--) {
            if (this.world.isValidPosition(x, checkY)) {
                const block = this.world.getBlock(x, checkY);
                if (this.world.isLiquid(block)) {
                    const blockProps = this.fluidProperties[block];
                    depth += blockProps?.density || 1000;
                } else {
                    break; // Stop alla prima superficie
                }
            }
        }
        
        // Pressione = Pressione atmosferica + Pressione idrostatica
        const atmosphericPressure = 101325; // Pa
        const g = 9.81; // m/s²
        const hydrostaticPressure = depth * g * 0.1; // Fattore di scala per il gioco
          return atmosphericPressure + hydrostaticPressure;
    }

    // 🌊 Applica forze intermolecolari complete (tensione superficiale, capillarità, van der Waals)
    applyIntermolecularForces(x, y, fluidType, deltaTime) {
        if (!this.enableMolecularPhysics) return;
        
        const fluidProps = this.fluidProperties[fluidType];
        if (!fluidProps) return;
        
        let totalForce = { x: 0, y: 0 };
        
        try {
            // 1. Calcola tensione superficiale
            const surfaceTension = this.calculateSurfaceTension(x, y, fluidType);
            if (surfaceTension && surfaceTension.magnitude > 0) {
                // La tensione superficiale agisce verso l'interno della superficie
                const surfaceDirection = this.getSurfaceNormal(x, y, fluidType);
                totalForce.x += surfaceDirection.x * surfaceTension.magnitude * 0.1;
                totalForce.y += surfaceDirection.y * surfaceTension.magnitude * 0.1;
            }
            
            // 2. Calcola azione capillare  
            const capillaryForce = this.calculateCapillaryAction(x, y, fluidType);
            if (capillaryForce) {
                totalForce.x += capillaryForce.x;
                totalForce.y += capillaryForce.y;
            }
            
            // 3. Calcola forze di dispersione (van der Waals)
            const dispersionForce = this.calculateDispersionForces(x, y, fluidType);
            if (dispersionForce) {
                totalForce.x += dispersionForce.x;
                totalForce.y += dispersionForce.y;
            }
            
            // 4. Calcola forze di coesione (già esistenti)
            const cohesionForce = this.calculateCohesionForces(x, y, fluidType);
            if (cohesionForce) {
                totalForce.x += cohesionForce.x * 0.5;
                totalForce.y += cohesionForce.y * 0.5;
            }
            
            // 5. Applica le forze al fluido se significative
            const forceMagnitude = Math.sqrt(totalForce.x * totalForce.x + totalForce.y * totalForce.y);
            
            if (forceMagnitude > 0.001) {
                // Converti le forze in probabilità di movimento
                const movementProbability = Math.min(forceMagnitude * deltaTime * 0.1, 0.3);
                
                if (Math.random() < movementProbability) {
                    // Determina direzione del movimento basata sulla forza risultante
                    const normalizedForce = {
                        x: totalForce.x / forceMagnitude,
                        y: totalForce.y / forceMagnitude
                    };
                    
                    // Trova la posizione target
                    const targetX = Math.round(x + normalizedForce.x);
                    const targetY = Math.round(y + normalizedForce.y);
                    
                    // Applica il movimento se possibile
                    if (this.world.isValidPosition(targetX, targetY)) {
                        const targetBlock = this.world.getBlock(targetX, targetY);
                        if (targetBlock === BlockTypes.AIR) {
                            // Movimento del fluido per forze intermolecolari
                            this.world.setBlock(targetX, targetY, fluidType);
                            
                            // Genera particelle per effetto visivo
                            if (Math.random() < 0.3) {
                                this.addFlowParticles(x, y, fluidType, 'intermolecular');
                            }
                        }
                    }
                }
                
                // Aggiorna la velocità del flusso per mantenere coerenza
                this.updateFlowVelocity(x, y, {
                    x: totalForce.x * deltaTime,
                    y: totalForce.y * deltaTime
                });
            }
            
        } catch (error) {
            console.warn(`Errore nel calcolo forze intermolecolari a (${x},${y}):`, error);
        }
    }
      // 🧭 Calcola normale alla superficie per tensione superficiale
    getSurfaceNormal(x, y, fluidType) {
        let normal = { x: 0, y: 0 };
        let airContacts = 0;
        
        // Controlla i vicini per determinare la direzione della superficie
        const neighbors = [
            {dx: -1, dy: 0}, {dx: 1, dy: 0},
            {dx: 0, dy: -1}, {dx: 0, dy: 1}
        ];
        
        for (const neighbor of neighbors) {
            const nx = x + neighbor.dx;
            const ny = y + neighbor.dy;
            
            if (this.world.isValidPosition(nx, ny)) {
                const block = this.world.getBlock(nx, ny);
                if (block === BlockTypes.AIR) {
                    // Superficie verso l'aria - normale punta verso l'interno del fluido
                    normal.x -= neighbor.dx;
                    normal.y -= neighbor.dy;
                    airContacts++;
                }
            }
        }
        
        // Normalizza il vettore
        if (airContacts > 0) {
            const magnitude = Math.sqrt(normal.x * normal.x + normal.y * normal.y);
            if (magnitude > 0) {
                normal.x /= magnitude;
                normal.y /= magnitude;
            }
        }
        
        return normal;
    }    // 🔍 Ottieni proprietà del fluido per tipo di blocco
    getFluidProperties(fluidType) {
        if (!fluidType || !this.fluidProperties) {
            return null;
        }
        
        // Restituisce le proprietà del fluido se esistono
        return this.fluidProperties[fluidType] || null;
    }

    // 💨 Ottieni dati corrente alla posizione specificata
    getCurrentAt(x, y) {
        // Validazione input
        if (typeof x !== 'number' || typeof y !== 'number') {
            return { direction: 0, strength: 0 };
        }
        
        // Arrotonda alle coordinate intere
        const roundedX = Math.floor(x);
        const roundedY = Math.floor(y);
        
        // Controlla se esiste una corrente per queste coordinate
        const key = `${roundedX},${roundedY}`;
        const current = this.currentMap.get(key);
        
        if (current) {
            return {
                direction: current.direction,
                strength: current.strength,
                lastUpdate: current.lastUpdate
            };
        }
        
        // Se non c'è corrente diretta, cerca nelle vicinanze per interpolazione
        for (let radius = 1; radius <= 3; radius++) {
            const nearby = [];
            
            for (let dx = -radius; dx <= radius; dx++) {
                for (let dy = -radius; dy <= radius; dy++) {
                    if (dx === 0 && dy === 0) continue;
                    
                    const nearbyKey = `${roundedX + dx},${roundedY + dy}`;
                    const nearbyCurrent = this.currentMap.get(nearbyKey);
                    
                    if (nearbyCurrent) {
                        const distance = Math.sqrt(dx * dx + dy * dy);
                        nearby.push({
                            ...nearbyCurrent,
                            distance: distance
                        });
                    }
                }
            }
            
            // Se trovate correnti nelle vicinanze, interpola
            if (nearby.length > 0) {
                let totalStrength = 0;
                let avgDirection = 0;
                let totalWeight = 0;
                
                for (const current of nearby) {
                    const weight = 1 / (current.distance + 1); // Peso inversamente proporzionale alla distanza
                    totalStrength += current.strength * weight;
                    avgDirection += current.direction * weight;
                    totalWeight += weight;
                }
                
                return {
                    direction: avgDirection / totalWeight,
                    strength: (totalStrength / totalWeight) * 0.5, // Riduci forza per interpolazione
                    interpolated: true
                };
            }
        }
        
        // Nessuna corrente trovata
        return { direction: 0, strength: 0 };
    }

    // ...existing code...
}

// 🌊 Estende la classe Particle per supportare trasparenza e nuovi effetti
class AdvancedParticle extends Particle {
    constructor(options) {
        super(options);
        this.transparency = options.transparency || 1.0;
        this.initialTransparency = this.transparency;
        this.maxLife = this.life;
    }
    
    update(deltaTime) {
        super.update(deltaTime);
        
        // Fade out basato sulla vita rimanente
        this.transparency = this.initialTransparency * (this.life / this.maxLife);
    }
    
    render(ctx) {
        const oldAlpha = ctx.globalAlpha;
        ctx.globalAlpha = this.transparency;
        super.render(ctx);
        ctx.globalAlpha = oldAlpha;
    }
}

// Rendi disponibili le classi globalmente
window.FluidPhysics = FluidPhysics;
window.AdvancedParticle = AdvancedParticle;
