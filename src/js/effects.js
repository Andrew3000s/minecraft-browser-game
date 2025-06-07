// Effects system for particles and animations

class ParticleSystem {
    constructor() {
        this.particles = [];
    }

    update(deltaTime) {
        this.particles = this.particles.filter(particle => {
            particle.update(deltaTime);
            return particle.alive;
        });
    }

    render(ctx, camera) {
        this.particles.forEach(particle => {
            particle.render(ctx, camera);
        });
    }    addBlockBreakEffect(x, y, blockType) {
        const color = BlockColors[blockType];
        const numParticles = 8;
        
        for (let i = 0; i < numParticles; i++) {
            this.particles.push(new Particle({
                x: x + Math.random() * 32,
                y: y + Math.random() * 32,
                velocityX: (Math.random() - 0.5) * 200,
                velocityY: (Math.random() - 0.5) * 200 - 50,
                color: color,
                size: Math.random() * 4 + 2,
                life: 1.0,
                gravity: 300
            }));
        }
    }

    addBlockPlaceEffect(x, y, blockType) {
        const color = BlockColors[blockType];
        const numParticles = 6;
        
        for (let i = 0; i < numParticles; i++) {
            this.particles.push(new Particle({
                x: x + (Math.random() - 0.5) * 24,
                y: y + (Math.random() - 0.5) * 24,
                velocityX: (Math.random() - 0.5) * 100,
                velocityY: (Math.random() - 0.5) * 80 - 30, // Gentler upward motion
                color: color,
                size: Math.random() * 3 + 1, // Smaller particles than break effect
                life: 0.8, // Shorter life than break effect
                gravity: 200 // Less gravity for gentler fall
            }));
        }
    }

    addWaterSplash(x, y) {
        const numParticles = 6;
        
        for (let i = 0; i < numParticles; i++) {
            this.particles.push(new Particle({
                x: x,
                y: y,
                velocityX: (Math.random() - 0.5) * 100,
                velocityY: -Math.random() * 100,
                color: '#4169E1',
                size: Math.random() * 3 + 1,
                life: 0.8,
                gravity: 400
            }));
        }
    }

    addJumpDust(x, y) {
        const numParticles = 4;
        
        for (let i = 0; i < numParticles; i++) {
            this.particles.push(new Particle({
                x: x + Math.random() * 24,
                y: y + 48,
                velocityX: (Math.random() - 0.5) * 50,
                velocityY: -Math.random() * 30,
                color: '#D2B48C',
                size: Math.random() * 2 + 1,
                life: 0.5,
                gravity: 200
            }));
        }
    }

    // 🦵 LANDING EFFECT: Creates dust impact when entities land from falls
    addLandingImpact(x, y, fallHeight = 0, entityWidth = 24) {
        // Calculate intensity based on fall height
        const intensity = Math.min(Math.max(fallHeight / 100, 0.3), 2.0); // Scale 0.3-2.0 based on fall height
        const numParticles = Math.floor(6 + intensity * 8); // 6-22 particles based on intensity
        
        // Create dust cloud at feet level
        for (let i = 0; i < numParticles; i++) {
            // Spread particles across entity width (under the feet)
            const spreadX = (Math.random() - 0.5) * (entityWidth + 20);
            const spreadY = Math.random() * 8; // Small vertical spread at ground level
            
            this.particles.push(new Particle({
                x: x + entityWidth / 2 + spreadX,
                y: y + spreadY,
                velocityX: (Math.random() - 0.5) * 80 * intensity,
                velocityY: -Math.random() * 40 * intensity - 10,
                color: this.getLandingDustColor(),
                size: Math.random() * 3 + 1,
                life: 0.6 + Math.random() * 0.4,
                gravity: 250
            }));
        }
        
        // Add additional ground impact shockwave for hard landings
        if (intensity > 1.2) {
            this.addGroundShockwave(x + entityWidth / 2, y, intensity);
        }
    }

    // 💥 GROUND SHOCKWAVE: Additional effect for hard landings
    addGroundShockwave(centerX, groundY, intensity) {
        const numWaveParticles = Math.floor(8 * intensity);
        
        for (let i = 0; i < numWaveParticles; i++) {
            const angle = (i / numWaveParticles) * Math.PI * 2;
            const distance = 15 + Math.random() * 25;
            
            this.particles.push(new Particle({
                x: centerX + Math.cos(angle) * distance,
                y: groundY + Math.random() * 5,
                velocityX: Math.cos(angle) * 60,
                velocityY: -Math.random() * 20 - 5,
                color: '#8B7355', // Brown dust color
                size: Math.random() * 2 + 1,
                life: 0.8,
                gravity: 200
            }));
        }
    }

    // 🎨 Get appropriate dust color based on environment
    getLandingDustColor() {
        const dustColors = [
            '#D2B48C', // Light brown (dirt)
            '#8B7355', // Medium brown
            '#A0522D', // Sienna
            '#CD853F', // Peru
            '#DEB887'  // Burlywood
        ];
        return dustColors[Math.floor(Math.random() * dustColors.length)];
    }

    addDamageEffect(x, y) {
        // Add red damage particles
        for (let i = 0; i < 8; i++) {
            this.particles.push(new Particle({
                x: x + (Math.random() - 0.5) * 16,
                y: y + (Math.random() - 0.5) * 16,
                velocityX: (Math.random() - 0.5) * 100,
                velocityY: -Math.random() * 50 - 20,
                color: '#FF0000',
                size: Math.random() * 3 + 2,
                life: 0.8,
                gravity: 150
            }));
        }
    }    addGlitter(x, y) {
        // Add sparkle/glitter effect for mob deaths
        for (let i = 0; i < 6; i++) {
            this.particles.push(new Particle({
                x: x + (Math.random() - 0.5) * 20,
                y: y + (Math.random() - 0.5) * 20,
                velocityX: (Math.random() - 0.5) * 80,
                velocityY: -Math.random() * 40 - 10,
                color: ['#FFD700', '#FFFF00', '#FFA500', '#FF69B4'][Math.floor(Math.random() * 4)],
                size: Math.random() * 2 + 1,
                life: 1.2,
                gravity: 100
            }));
        }
    }

    addLavaBurnEffect(x, y) {
        // Add lava burn particles
        for (let i = 0; i < 6; i++) {
            this.particles.push(new Particle({
                x: x + (Math.random() - 0.5) * 20,
                y: y + (Math.random() - 0.5) * 20,
                velocityX: (Math.random() - 0.5) * 60,
                velocityY: -Math.random() * 80 - 20,
                color: ['#FF4500', '#FF6600', '#FFD700', '#FF8C00'][Math.floor(Math.random() * 4)],
                size: Math.random() * 3 + 2,
                life: 1.0,
                gravity: 120
            }));
        }
    }

    addAcidBurnEffect(x, y) {
        // Add acid burn particles
        for (let i = 0; i < 5; i++) {
            this.particles.push(new Particle({
                x: x + (Math.random() - 0.5) * 18,
                y: y + (Math.random() - 0.5) * 18,
                velocityX: (Math.random() - 0.5) * 70,
                velocityY: -Math.random() * 60 - 15,
                color: ['#32CD32', '#00FF00', '#7FFF00', '#ADFF2F'][Math.floor(Math.random() * 4)],
                size: Math.random() * 2 + 1,
                life: 0.8,
                gravity: 100
            }));
        }
    }

    addSuffocationEffect(x, y) {
        // Add blue/purple bubble particles for oxygen depletion
        const numParticles = 8;
        
        for (let i = 0; i < numParticles; i++) {
            this.particles.push(new Particle({
                x: x + (Math.random() - 0.5) * 20,
                y: y + (Math.random() - 0.5) * 15,
                velocityX: (Math.random() - 0.5) * 30,
                velocityY: -Math.random() * 50 - 20,
                color: ['#4169E1', '#6495ED', '#87CEEB', '#B0E0E6'][Math.floor(Math.random() * 4)],
                size: Math.random() * 4 + 2,
                life: 1.5,
                gravity: -50 // Bubbles float up
            }));
        }
    }

    addSunlightFireEffect(x, y) {
        // Add orange/red fire particles for hostile mobs burning in sunlight
        const numParticles = 6;
        
        for (let i = 0; i < numParticles; i++) {
            this.particles.push(new Particle({
                x: x + (Math.random() - 0.5) * 25,
                y: y + (Math.random() - 0.5) * 20,
                velocityX: (Math.random() - 0.5) * 40,
                velocityY: -Math.random() * 60 - 30,
                color: ['#FF4500', '#FF6600', '#FFD700', '#FF8C00', '#DC143C'][Math.floor(Math.random() * 5)],
                size: Math.random() * 3 + 1,
                life: 0.8 + Math.random() * 0.4,
                gravity: -20 // Fire rises up
            }));
        }
    }
}

class Particle {
    constructor(options) {
        this.x = options.x;
        this.y = options.y;
        this.velocityX = options.velocityX || 0;
        this.velocityY = options.velocityY || 0;
        this.color = options.color || '#FFFFFF';
        this.size = options.size || 2;
        this.life = options.life || 1.0;
        this.maxLife = this.life;
        this.gravity = options.gravity || 0;
        this.alive = true;
    }

    update(deltaTime) {
        this.x += this.velocityX * deltaTime;
        this.y += this.velocityY * deltaTime;
        this.velocityY += this.gravity * deltaTime;
        
        this.life -= deltaTime;
        if (this.life <= 0) {
            this.alive = false;
        }
    }

    render(ctx, camera) {
        if (!this.alive) return;
        
        const screenX = this.x - camera.x;
        const screenY = this.y - camera.y;
        
        ctx.save();
        ctx.globalAlpha = this.life / this.maxLife;
        ctx.fillStyle = this.color;
        ctx.fillRect(screenX, screenY, this.size, this.size);
        ctx.restore();
    }
}
