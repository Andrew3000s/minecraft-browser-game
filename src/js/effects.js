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
