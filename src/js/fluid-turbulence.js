// 🌪️ ADVANCED TURBULENCE SYSTEM
// Sistema di turbolenza per fluidi con vortici e flussi complessi

class FluidTurbulence {
    constructor(fluidPhysics) {
        this.fluidPhysics = fluidPhysics;
        this.world = fluidPhysics.world;
        
        // 🌀 Vortici e turbolenza
        this.vortexMap = new Map();
        this.turbulenceIntensity = 0.3;
        this.vortexLifetime = 5000; // ms
        
        // 🌊 Mixing zones
        this.mixingZones = new Map();
        this.mixingRate = 0.02;
        
        // 🔄 Reynolds number calculation
        this.reynoldsThreshold = 2000; // Transizione laminare -> turbolento
    }
    
    // 🧮 Calcolo numero di Reynolds
    calculateReynoldsNumber(velocity, fluidProps, characteristicLength) {
        // Re = ρvL/μ
        const density = fluidProps.density;
        const viscosity = fluidProps.viscosity;
        
        return (density * velocity * characteristicLength) / viscosity;
    }
    
    // 🌀 Genera vortici in aree di alta velocità
    generateVortices(deltaTime) {
        for (let x = 0; x < this.world.width; x += 3) {
            for (let y = 0; y < this.world.height; y += 3) {
                const flowData = this.fluidPhysics.getFlowVelocityAt(x, y);
                const blockType = this.world.getBlock(x, y);
                
                if (this.world.isLiquid(blockType) && flowData.magnitude > 50) {
                    const fluidProps = this.fluidPhysics.getFluidProperties(blockType);
                    const reynolds = this.calculateReynoldsNumber(
                        flowData.magnitude, 
                        fluidProps, 
                        this.world.blockSize
                    );
                    
                    // Se il flusso è turbolento, genera vortice
                    if (reynolds > this.reynoldsThreshold) {
                        this.createVortex(x, y, flowData.magnitude * 0.1, deltaTime);
                    }
                }
            }
        }
    }
    
    // 🌀 Crea vortice
    createVortex(x, y, strength, deltaTime) {
        const key = `${x},${y}`;
        const existing = this.vortexMap.get(key);
        
        if (existing) {
            // Incrementa forza del vortice esistente
            existing.strength = Math.min(existing.strength + strength * deltaTime, 100);
            existing.lastUpdate = Date.now();
        } else {
            // Crea nuovo vortice
            this.vortexMap.set(key, {
                x, y,
                strength: strength,
                radius: 3 + Math.random() * 2,
                rotation: Math.random() * Math.PI * 2,
                clockwise: Math.random() > 0.5,
                createdAt: Date.now(),
                lastUpdate: Date.now()
            });
        }
    }
    
    // 🌊 Applica effetti di turbolenza
    applyTurbulenceEffects(x, y, fluidType, deltaTime) {
        const turbulenceForce = this.calculateTurbulenceAt(x, y);
        
        if (turbulenceForce.magnitude > 0) {
            // Applica forza turbolenta al flusso
            const currentFlow = this.fluidPhysics.getFlowVelocityAt(x, y);
            const newFlow = {
                x: currentFlow.x + turbulenceForce.x * deltaTime,
                y: currentFlow.y + turbulenceForce.y * deltaTime
            };
            
            this.fluidPhysics.updateFlowVelocity(x, y, newFlow);
            
            // Effetti visivi di turbolenza
            this.addTurbulenceParticles(x, y, fluidType, turbulenceForce);
        }
    }
    
    // 🌀 Calcola forza di turbolenza in un punto
    calculateTurbulenceAt(x, y) {
        let totalForce = { x: 0, y: 0, magnitude: 0 };
        
        // Effetti dei vortici vicini
        for (const [key, vortex] of this.vortexMap) {
            const distance = Math.sqrt((x - vortex.x) ** 2 + (y - vortex.y) ** 2);
            
            if (distance < vortex.radius && distance > 0) {
                // Calcola forza tangenziale del vortice
                const angle = Math.atan2(y - vortex.y, x - vortex.x);
                const tangentialAngle = angle + (vortex.clockwise ? -Math.PI/2 : Math.PI/2);
                
                const forceIntensity = vortex.strength * (1 - distance / vortex.radius);
                
                totalForce.x += Math.cos(tangentialAngle) * forceIntensity;
                totalForce.y += Math.sin(tangentialAngle) * forceIntensity;
            }
        }
        
        // Turbolenza stocastica
        const randomTurbulence = this.turbulenceIntensity * (Math.random() - 0.5) * 2;
        totalForce.x += randomTurbulence * (Math.random() - 0.5);
        totalForce.y += randomTurbulence * (Math.random() - 0.5);
        
        totalForce.magnitude = Math.sqrt(totalForce.x ** 2 + totalForce.y ** 2);
        return totalForce;
    }
    
    // 🎨 Particelle di turbolenza
    addTurbulenceParticles(x, y, fluidType, turbulenceForce) {
        if (!window.game?.particles || Math.random() > 0.3) return;
        
        const worldX = x * this.world.blockSize + this.world.blockSize / 2;
        const worldY = y * this.world.blockSize + this.world.blockSize / 2;
        const fluidProps = this.fluidPhysics.getFluidProperties(fluidType);
        
        for (let i = 0; i < 2; i++) {
            window.game.particles.particles.push(new Particle({
                x: worldX + (Math.random() - 0.5) * 15,
                y: worldY + (Math.random() - 0.5) * 15,
                velocityX: turbulenceForce.x * 2 + (Math.random() - 0.5) * 30,
                velocityY: turbulenceForce.y * 2 + (Math.random() - 0.5) * 30,
                color: fluidProps.color,
                size: Math.random() * 1 + 0.5,
                life: 0.3 + Math.random() * 0.2,
                gravity: 50,
                transparency: 0.6
            }));
        }
    }
    
    // 🧹 Pulizia vortici scaduti
    cleanupVortices() {
        const now = Date.now();
        for (const [key, vortex] of this.vortexMap) {
            if (now - vortex.createdAt > this.vortexLifetime) {
                this.vortexMap.delete(key);
            }
        }
    }
    
    // 🔄 Aggiornamento principale
    update(deltaTime) {
        this.generateVortices(deltaTime);
        this.cleanupVortices();
        
        // Applica turbolenza a tutti i fluidi
        for (let x = 0; x < this.world.width; x += 2) {
            for (let y = 0; y < this.world.height; y += 2) {
                const blockType = this.world.getBlock(x, y);
                if (this.world.isLiquid(blockType)) {
                    this.applyTurbulenceEffects(x, y, blockType, deltaTime);
                }
            }
        }
    }
    
    // 📊 API pubblica
    getVortexAt(x, y) {
        return this.vortexMap.get(`${x},${y}`) || null;
    }
    
    getTurbulenceIntensityAt(x, y) {
        const force = this.calculateTurbulenceAt(x, y);
        return force.magnitude;
    }
}
