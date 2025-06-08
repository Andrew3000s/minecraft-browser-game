// Weather system for Minecraft browser game
// Includes clouds, rain, snow, hail, wind and dynamic weather changes

class WeatherSystem {
    constructor(canvas, world, timeSystem, soundSystem = null) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.world = world;
        this.timeSystem = timeSystem;
        this.soundSystem = soundSystem;
          // Current weather state - INITIALIZE WITH STABLE CLEAR WEATHER
        this.currentWeather = 'clear';
        this.weatherIntensity = 1.0;  // Start with full intensity for clear weather
        this.weatherTransition = 1.0; // Start fully transitioned
        this.weatherDuration = 0;        this.weatherTimer = 0;        // Grace period to prevent immediate weather changes on startup
        this.initialGracePeriod = 30; // 30 seconds before first weather change can occur
        this.startupLockout = true;   // Hard lock for startup phase
        
        // Wind system
        this.wind = {
            direction: Math.random() * Math.PI * 2, // Wind direction in radians
            strength: 0, // Wind strength 0-1
            gustiness: Math.random() * 0.5 + 0.5, // How gusty the wind is
            gustTimer: 0
        };
        
        // Cloud system
        this.clouds = [];
        this.cloudDensity = 0.3; // How cloudy it is (0-1)
        this.initializeClouds();
        
        // Precipitation particles
        this.precipitation = [];
        this.maxPrecipitation = 500;
        
        // Weather types and their properties
        this.weatherTypes = {
            clear: {
                cloudCover: 0.1,
                precipitationChance: 0,
                windStrength: 0.1,
                visibility: 1.0,
                temperature: 1.0
            },
            cloudy: {
                cloudCover: 0.7,
                precipitationChance: 0,
                windStrength: 0.3,
                visibility: 0.9,
                temperature: 0.8
            },
            overcast: {
                cloudCover: 0.95,
                precipitationChance: 0,
                windStrength: 0.4,
                visibility: 0.8,
                temperature: 0.7
            },
            rain: {
                cloudCover: 0.9,
                precipitationChance: 0.8,
                windStrength: 0.5,
                visibility: 0.6,
                temperature: 0.6
            },
            storm: {
                cloudCover: 1.0,
                precipitationChance: 1.0,
                windStrength: 0.8,
                visibility: 0.4,
                temperature: 0.5
            },
            snow: {
                cloudCover: 0.8,
                precipitationChance: 0.7,
                windStrength: 0.3,
                visibility: 0.7,
                temperature: 0.2
            },
            blizzard: {
                cloudCover: 1.0,
                precipitationChance: 1.0,
                windStrength: 0.9,
                visibility: 0.3,
                temperature: 0.1
            },
            hail: {
                cloudCover: 0.95,
                precipitationChance: 0.9,
                windStrength: 0.6,
                visibility: 0.5,
                temperature: 0.4
            }
        };        // Weather change probabilities (per minute of game time)
        this.weatherTransitions = {
            clear: { cloudy: 0.05, rain: 0.02, snow: 0.01 }, // Increased probabilities for clear weather
            cloudy: { clear: 0.2, overcast: 0.3, rain: 0.2, snow: 0.1 },
            overcast: { cloudy: 0.3, rain: 0.4, storm: 0.1, snow: 0.15 },
            rain: { cloudy: 0.3, overcast: 0.2, storm: 0.15, clear: 0.1 },
            storm: { rain: 0.6, overcast: 0.3, hail: 0.1 },
            snow: { cloudy: 0.4, blizzard: 0.1, clear: 0.2, overcast: 0.3 },
            blizzard: { snow: 0.7, overcast: 0.3 },
            hail: { storm: 0.5, rain: 0.3, overcast: 0.2 }};
        
        // Adjust clouds for clear weather without triggering sounds
        this.adjustCloudsForWeather('clear');
    }
      initializeClouds() {
        this.clouds = [];
        const numClouds = Math.floor(20 + Math.random() * 30);
        
        for (let i = 0; i < numClouds; i++) {
            this.clouds.push({
                x: Math.random() * this.canvas.width * 3, // Spread clouds wider than screen
                y: Math.random() * this.canvas.height * 0.4, // Upper portion of sky
                width: 80 + Math.random() * 120,
                height: 40 + Math.random() * 60,
                opacity: 0.3 + Math.random() * 0.5,
                speed: 0.5 + Math.random() * 2,
                depth: Math.random(), // For parallax effect
                puffiness: Math.random() * 0.5 + 0.5, // How puffy/rounded the cloud is
                darkness: Math.random() * 0.3 // How dark the cloud is (for storm clouds)
            });
        }
        // Clouds initialized
    }
      update(deltaTime) {
        // Update weather timer
        this.weatherTimer += deltaTime;        // Decrease initial grace period
        if (this.initialGracePeriod > 0) {
            this.initialGracePeriod -= deltaTime;
            // Release startup lockout when grace period expires
            if (this.initialGracePeriod <= 0 && this.startupLockout) {
                this.startupLockout = false;
                // 🔧 FIX: Force weatherTimer to trigger first check immediately after grace period
                this.weatherTimer = this.getWeatherChangeInterval();
            }
        }// Check for weather changes (every 10-60 seconds based on current weather)
        // But only after grace period has expired AND startup lockout is released
        const changeInterval = this.getWeatherChangeInterval();        if (this.weatherTimer >= changeInterval && this.initialGracePeriod <= 0 && !this.startupLockout) {
            // Weather change check triggered
            this.considerWeatherChange();
            this.weatherTimer = 0;
        }
        
        // Update weather transition
        if (this.weatherTransition < 1.0) {
            this.weatherTransition += deltaTime * 0.5; // Smooth weather transitions
            this.weatherTransition = Math.min(1.0, this.weatherTransition);
        }
        
        // Update wind system
        this.updateWind(deltaTime);
        
        // Update clouds
        this.updateClouds(deltaTime);
          // Update precipitation
        this.updatePrecipitation(deltaTime);
        
        // Play ambient weather sounds
        this.playAmbientWeatherSounds();
        
        // Update weather intensity based on time of day
        this.updateWeatherIntensity();
    }
    
    updateWind(deltaTime) {
        const weather = this.weatherTypes[this.currentWeather];
        const targetWindStrength = weather.windStrength * this.weatherIntensity;
        
        // Smooth wind strength changes
        this.wind.strength += (targetWindStrength - this.wind.strength) * deltaTime * 0.5;
        
        // Add wind gusts
        this.wind.gustTimer += deltaTime;
        if (this.wind.gustTimer >= this.wind.gustiness) {
            this.wind.direction += (Math.random() - 0.5) * 0.5; // Random direction change
            this.wind.gustTimer = 0;
            this.wind.gustiness = Math.random() * 3 + 1; // Next gust timing
        }
        
        // Gradual wind direction changes
        this.wind.direction += (Math.random() - 0.5) * deltaTime * 0.1;
    }
    
    updateClouds(deltaTime) {
        const windForceX = Math.cos(this.wind.direction) * this.wind.strength * 10;
        const windForceY = Math.sin(this.wind.direction) * this.wind.strength * 2;
        
        for (let cloud of this.clouds) {
            // Move clouds with wind
            cloud.x += (cloud.speed + windForceX * cloud.depth) * deltaTime * 60;
            cloud.y += windForceY * cloud.depth * deltaTime * 60;
            
            // Reset clouds that move off screen
            if (cloud.x > this.canvas.width + cloud.width) {
                cloud.x = -cloud.width;
                cloud.y = Math.random() * this.canvas.height * 0.4;
            }
            
            // Update cloud properties based on weather
            const weather = this.weatherTypes[this.currentWeather];
            const targetOpacity = weather.cloudCover * (0.3 + Math.random() * 0.5);
            cloud.opacity += (targetOpacity - cloud.opacity) * deltaTime * 0.5;
            
            // Make storm clouds darker
            if (this.currentWeather === 'storm' || this.currentWeather === 'hail') {
                cloud.darkness = Math.min(0.6, cloud.darkness + deltaTime * 0.3);
            } else {
                cloud.darkness = Math.max(0, cloud.darkness - deltaTime * 0.2);
            }
        }
    }
      updatePrecipitation(deltaTime) {
        const weather = this.weatherTypes[this.currentWeather];
        const shouldPrecipitate = Math.random() < weather.precipitationChance * this.weatherIntensity;
        
        // 🔧 FIX: Increase precipitation creation rate for better visual effect
        const precipitationRate = weather.precipitationChance * this.weatherIntensity;
        if (precipitationRate > 0 && this.precipitation.length < this.maxPrecipitation) {
            // Create multiple particles per frame for dense precipitation
            const particlesToCreate = Math.min(5, Math.floor(precipitationRate * 10));
            for (let i = 0; i < particlesToCreate; i++) {
                if (Math.random() < precipitationRate) {
                    this.createPrecipitationParticle();
                }
            }
        }        // Update existing precipitation
        for (let i = this.precipitation.length - 1; i >= 0; i--) {
            const particle = this.precipitation[i];
            this.updatePrecipitationParticle(particle, deltaTime);
            
            // Remove particles that are off screen or have lived too long
            // 🔧 FIX: Use camera-relative coordinates for bounds checking
            const camera = this.camera || { x: 0, y: 0 };
            const screenX = particle.x - camera.x;
            const screenY = particle.y - camera.y;
            
            const shouldRemove = (screenY > this.canvas.height + 100 || 
                                screenX < -200 || screenX > this.canvas.width + 200 ||
                                screenY < -300 || // Allow particles to exist above screen
                                particle.life <= 0);
              if (shouldRemove) {
                this.precipitation.splice(i, 1);
            }
        }
    }createPrecipitationParticle() {
        const windEffect = Math.cos(this.wind.direction) * this.wind.strength * 100;
        
        // 🔧 FIX: Create particles above the visible screen area
        const camera = this.camera || { x: 0, y: 0 };
        
        let particle = {
            // Create particles across the full width of the screen with wind effect
            x: camera.x + (Math.random() - 0.5) * this.canvas.width * 1.5 + windEffect,            // Create particles well above the screen so they fall into view
            y: camera.y - 100 - Math.random() * 200,
            life: 8.0, // Longer life for better visibility
            type: this.getPrecipitationType()
        };
          // Set particle properties based on type
        switch (particle.type) {
            case 'rain':
                particle.vx = Math.cos(this.wind.direction) * this.wind.strength * 50;
                particle.vy = 200 + Math.random() * 100;
                particle.width = 2 + Math.random() * 2;  // Larger raindrops
                particle.height = 12 + Math.random() * 16;  // Longer raindrops
                particle.opacity = 0.7 + Math.random() * 0.3;  // More opaque
                break;
                
            case 'snow':
                particle.vx = Math.cos(this.wind.direction) * this.wind.strength * 20;
                particle.vy = 30 + Math.random() * 40;
                particle.width = 3 + Math.random() * 4;  // Larger snowflakes
                particle.height = particle.width;
                particle.opacity = 0.9 + Math.random() * 0.1;  // Very opaque
                particle.rotation = Math.random() * Math.PI * 2;
                particle.rotationSpeed = (Math.random() - 0.5) * 2;
                break;            case 'hail':
                particle.vx = Math.cos(this.wind.direction) * this.wind.strength * 80;
                particle.vy = 150 + Math.random() * 150;
                particle.width = 6 + Math.random() * 8;  // Much larger hail (increased from 4-9 to 6-14)
                particle.height = particle.width;
                particle.opacity = 1.0;  // Fully opaque for maximum visibility
                particle.bounce = 0.4;  // Better bounce effect
                particle.rotation = Math.random() * Math.PI * 2;  // Random initial rotation
                particle.rotationSpeed = (Math.random() - 0.5) * 4;  // Rotation speed for visibility
                break;
        }
        
        this.precipitation.push(particle);
    }
    
    updatePrecipitationParticle(particle, deltaTime) {
        // Apply wind force
        const windForceX = Math.cos(this.wind.direction) * this.wind.strength * 30;
        const windForceY = Math.sin(this.wind.direction) * this.wind.strength * 10;
        
        particle.vx += windForceX * deltaTime;
        particle.vy += windForceY * deltaTime;
        
        // Update position
        particle.x += particle.vx * deltaTime;
        particle.y += particle.vy * deltaTime;
        
        // Type-specific updates
        switch (particle.type) {
            case 'snow':
                // Snow drifts and rotates
                particle.vx += Math.sin(Date.now() * 0.001 + particle.x * 0.01) * 10 * deltaTime;
                particle.rotation += particle.rotationSpeed * deltaTime;
                break;
                  case 'hail':
                // Hail bounces off surfaces and rotates for visibility
                if (particle.y >= this.canvas.height - 10 && particle.vy > 0) {
                    particle.vy *= -particle.bounce;
                    particle.vx *= 0.8; // Friction
                    particle.bounce *= 0.7; // Lose bounce energy
                }
                // Add rotation for enhanced visibility
                if (particle.rotation !== undefined) {
                    particle.rotation += particle.rotationSpeed * deltaTime;
                }
                break;
        }
          // Fade out over time
        particle.life -= deltaTime;
        
        // Keep opacity stable until near end of life, then fade out
        const fadeThreshold = 1.0; // Start fading when life < 1 second
        if (particle.life < fadeThreshold) {
            particle.opacity = particle.opacity * (particle.life / fadeThreshold);
        }
    }
    
    getPrecipitationType() {
        switch (this.currentWeather) {
            case 'rain':
            case 'storm':
                return 'rain';
            case 'snow':
            case 'blizzard':
                return 'snow';
            case 'hail':
                return 'hail';
            default:
                return 'rain';
        }
    }
      updateWeatherIntensity() {
        // Weather is more intense during certain times        // Add safety check for timeSystem
        if (!this.timeSystem || typeof this.timeSystem.getTimeOfDay !== 'function') {
            this.weatherIntensity = 1.0 * this.weatherTransition;
            return;
        }
        
        const timeOfDay = this.timeSystem.getTimeOfDay();
        let baseIntensity = 1.0;
        
        // Storms are more intense at night
        if (this.currentWeather === 'storm' || this.currentWeather === 'blizzard') {
            baseIntensity = this.timeSystem.isNight() ? 1.2 : 0.8;
        }
          this.weatherIntensity = baseIntensity * this.weatherTransition;
    }
    
    considerWeatherChange() {
        // SAFETY CHECK: Prevent any weather changes during startup lockout
        if (this.startupLockout || this.initialGracePeriod > 0) {
            return;
        }
        
        const transitions = this.weatherTransitions[this.currentWeather];
        if (!transitions) return;
          // Calculate total probability
        let totalProb = Object.values(transitions).reduce((sum, prob) => sum + prob, 0);
        
        // Add seasonal and time-based modifiers
        const timeModifier = this.getTimeBasedModifier();
        const finalProb = totalProb * timeModifier;
        
        // Random roll for weather change
        const roll = Math.random();
        if (roll < finalProb) {
            // Choose new weather based on probabilities
            let cumulative = 0;
            const targetRoll = Math.random() * totalProb;
              for (let [newWeather, probability] of Object.entries(transitions)) {
                cumulative += probability;
                if (targetRoll <= cumulative) {
                    this.changeWeather(newWeather);
                    break;
                }
            }
        }
    }getTimeBasedModifier() {
        // Weather changes are more likely during dawn/dusk
        // Add safety check for timeSystem
        if (!this.timeSystem || typeof this.timeSystem.getTimeOfDay !== 'function') {
            return 1.0; // Default modifier if timeSystem not available
        }
        
        const timeOfDay = this.timeSystem.getTimeOfDay();        // Special case: Clear weather should be more stable but not locked
        if (this.currentWeather === 'clear') {
            return 0.3; // Make clear weather 3x less likely to change (instead of 100x)
        }
        
        if (timeOfDay >= 5 && timeOfDay <= 7) return 1.5; // Dawn
        if (timeOfDay >= 18 && timeOfDay <= 20) return 1.5; // Dusk
        if (this.timeSystem.isNight()) return 1.2; // Night
        return 1.0; // Day
    }
      getWeatherChangeInterval() {
        // Different weather types have different stability
        const baseInterval = {
            clear: 45, // 45 seconds instead of 2 minutes
            cloudy: 40,
            overcast: 35,
            rain: 30,
            storm: 25,
            snow: 35,
            blizzard: 20,
            hail: 15
        };
        
        return baseInterval[this.currentWeather] || 60;
    }
    
    changeWeather(newWeather) {
        // CRITICAL SAFETY CHECK: Block any weather changes during startup lockout
        if (this.startupLockout || this.initialGracePeriod > 0) {
            return;
        }
          if (this.weatherTypes[newWeather]) {
            this.currentWeather = newWeather;
            this.weatherTransition = 0;
            this.weatherDuration = 0;
            
            // Play weather transition sound
            this.playWeatherSound(newWeather);
            
            // Clear old precipitation when weather changes significantly
            if (this.getPrecipitationType() !== this.getPrecipitationType()) {
                this.precipitation = [];
            }
            
            // Adjust cloud properties for new weather
            this.adjustCloudsForWeather(newWeather);
        }
    }
    
    adjustCloudsForWeather(weather) {
        const weatherProps = this.weatherTypes[weather];
        
        // Add more clouds for stormy weather
        if (weather === 'storm' || weather === 'blizzard' || weather === 'hail') {
            while (this.clouds.length < 40) {
                this.clouds.push({
                    x: Math.random() * this.canvas.width * 3,
                    y: Math.random() * this.canvas.height * 0.5,
                    width: 100 + Math.random() * 150,
                    height: 60 + Math.random() * 80,
                    opacity: 0.6 + Math.random() * 0.4,
                    speed: 1 + Math.random() * 3,
                    depth: Math.random(),
                    puffiness: Math.random() * 0.3 + 0.7,
                    darkness: 0.3 + Math.random() * 0.5
                });
            }
        }
        
        // Remove clouds for clear weather
        if (weather === 'clear' && this.clouds.length > 15) {
            this.clouds = this.clouds.slice(0, 15);
        }
    }
    
    render(camera, ctx = null) {
        // Use provided context or fall back to weather system's own context
        const renderCtx = ctx || this.ctx;
        if (!renderCtx) {
            return;
        }
        
        // Safety check for camera properties
        if (!camera || typeof camera.x !== 'number' || typeof camera.y !== 'number') {
            return;
        }
        
        // Store camera reference for particle creation
        this.camera = camera;
        
        // Default zoom if not provided
        if (typeof camera.zoom !== 'number') {
            camera.zoom = 1.0;
        }
        
        // Store the original context and temporarily use the provided one
        const originalCtx = this.ctx;
        this.ctx = renderCtx;
        
        // Render all weather effects
        this.renderClouds(camera);
        this.renderPrecipitation(camera);
        this.renderWeatherEffects();
        
        // Restore original context
        this.ctx = originalCtx;
    }
    
    renderClouds(camera) {
        this.ctx.save();
        
        // Sort clouds by depth for proper layering
        const sortedClouds = this.clouds.slice().sort((a, b) => a.depth - b.depth);
        
        for (let cloud of sortedClouds) {
            // Apply parallax effect
            const parallaxX = cloud.x - (camera.x * cloud.depth * 0.1);
            const parallaxY = cloud.y - (camera.y * cloud.depth * 0.05);
              // Check if cloud is visible (simple bounds check)
            if (parallaxX + cloud.width > 0 && parallaxX - cloud.width < this.canvas.width &&
                parallaxY + cloud.height > 0 && parallaxY - cloud.height < this.canvas.height) {
                this.ctx.globalAlpha = cloud.opacity * this.weatherIntensity;
                this.renderCloud(parallaxX, parallaxY, cloud);
            }
        }
        
        this.ctx.restore();
    }
    
    renderCloud(x, y, cloud) {
        // Cloud color based on weather and time of day
        let cloudColor = this.getCloudColor(cloud);
        
        this.ctx.fillStyle = cloudColor;
        this.ctx.beginPath();
        
        // Create puffy cloud shape using multiple circles
        const numPuffs = Math.floor(cloud.puffiness * 8) + 3;
        const puffSize = cloud.width / numPuffs;
        
        for (let i = 0; i < numPuffs; i++) {
            const puffX = x + (i * puffSize * 0.7) + Math.sin(i) * puffSize * 0.3;
            const puffY = y + Math.cos(i * 1.3) * cloud.height * 0.3;
            const radius = puffSize * (0.5 + Math.sin(i * 2) * 0.3);
            
            this.ctx.arc(puffX, puffY, radius, 0, Math.PI * 2);
        }
        
        this.ctx.fill();
    }
      getCloudColor(cloud) {
        // Safe fallbacks for timeSystem methods
        let lightLevel = 1.0;
        if (this.timeSystem && typeof this.timeSystem.getLightLevel === 'function') {
            lightLevel = this.timeSystem.getLightLevel();
        }
        
        // Base cloud color
        let r = 255, g = 255, b = 255;
        
        // Apply time of day tinting
        if (lightLevel < 0.8) {
            r = Math.floor(r * (0.5 + lightLevel * 0.5));
            g = Math.floor(g * (0.5 + lightLevel * 0.5));
            b = Math.floor(b * (0.6 + lightLevel * 0.4));
        }
        
        // Storm clouds are darker
        if (cloud.darkness > 0) {
            const darkFactor = 1 - cloud.darkness;
            r = Math.floor(r * darkFactor);
            g = Math.floor(g * darkFactor);
            b = Math.floor(b * darkFactor);
        }
        
        return `rgb(${r}, ${g}, ${b})`;
    }
      renderPrecipitation(camera) {
        if (!this.ctx) {
            return;
        }
        
        this.ctx.save();
        
        let renderedCount = 0;
        for (let particle of this.precipitation) {
            // Use zoom-aware coordinate transformation
            const screenPos = Utils.worldToScreen(particle.x, particle.y, camera);
            const zoom = camera.zoom || 1.0;
              // More generous clipping bounds for testing
            if (screenPos.x < -100 || screenPos.x > this.canvas.width + 100 ||
                screenPos.y < -100 || screenPos.y > this.canvas.height + 100) {
                continue;
            }
            
            this.ctx.globalAlpha = particle.opacity;
            this.renderPrecipitationParticle(screenPos.x, screenPos.y, particle, zoom);
            renderedCount++;
        }
        
        this.ctx.restore();
    }      renderPrecipitationParticle(x, y, particle, zoom = 1.0) {
        switch (particle.type) {
            case 'rain':
                this.ctx.strokeStyle = '#4A90E2';  // More visible blue color
                this.ctx.lineWidth = Math.max(2, particle.width * zoom);  // Scale line width with zoom
                this.ctx.beginPath();
                this.ctx.moveTo(x, y);
                this.ctx.lineTo(x + particle.vx * 0.02 * zoom, y + particle.height * zoom);
                this.ctx.stroke();
                break;
                
            case 'snow':
                this.ctx.save();
                this.ctx.translate(x, y);
                this.ctx.rotate(particle.rotation);
                this.ctx.fillStyle = '#FFFFFF';
                this.ctx.shadowColor = '#CCCCCC';
                this.ctx.shadowBlur = 2 * zoom;
                
                // Draw larger snowflake scaled by zoom
                const snowSize = Math.max(3, particle.width * zoom);
                this.ctx.beginPath();
                this.ctx.arc(0, 0, snowSize, 0, Math.PI * 2);
                this.ctx.fill();
                
                // Add snowflake arms
                this.ctx.strokeStyle = '#FFFFFF';
                this.ctx.lineWidth = 2 * zoom;
                for (let i = 0; i < 6; i++) {
                    this.ctx.save();
                    this.ctx.rotate((Math.PI * 2 * i) / 6);
                    this.ctx.beginPath();
                    this.ctx.moveTo(0, 0);
                    this.ctx.lineTo(0, -snowSize);
                    this.ctx.stroke();
                    this.ctx.restore();
                }
                
                this.ctx.restore();
                break;            case 'hail':
                // Maximum visibility hail with enhanced effects, scaled by zoom
                const hailSize = Math.max(8, particle.width * zoom * 1.8); // Scale with zoom
                
                // Add rotation transform if available
                this.ctx.save();
                this.ctx.translate(x, y);
                if (particle.rotation !== undefined) {
                    this.ctx.rotate(particle.rotation);
                }
                
                // Add glowing shadow effect for maximum contrast
                this.ctx.shadowColor = '#4A90E2';
                this.ctx.shadowBlur = 15 * zoom;
                this.ctx.shadowOffsetX = 0;
                this.ctx.shadowOffsetY = 0;
                
                // Main hail body with high-contrast gradient
                const gradient = this.ctx.createRadialGradient(
                    -hailSize * 0.3, -hailSize * 0.3, 0,
                    0, 0, hailSize
                );
                gradient.addColorStop(0, '#FFFFFF');
                gradient.addColorStop(0.4, '#F0F8FF');
                gradient.addColorStop(0.7, '#D0D8FF');
                gradient.addColorStop(1, '#8090C0');
                
                this.ctx.fillStyle = gradient;
                this.ctx.strokeStyle = '#2040A0';  // Darker, more contrasting border
                this.ctx.lineWidth = 3 * zoom;  // Scale border with zoom
                this.ctx.beginPath();
                this.ctx.arc(0, 0, hailSize, 0, Math.PI * 2);
                this.ctx.fill();
                this.ctx.stroke();
                
                // Enhanced primary highlight for 3D effect
                this.ctx.shadowBlur = 0;  // Remove shadow for highlights
                this.ctx.fillStyle = '#FFFFFF';
                this.ctx.globalAlpha = 0.9;
                this.ctx.beginPath();
                this.ctx.arc(-hailSize * 0.3, -hailSize * 0.3, 
                           hailSize * 0.4, 0, Math.PI * 2);
                this.ctx.fill();
                
                // Secondary highlight for extra dimensionality
                this.ctx.fillStyle = '#F8FCFF';
                this.ctx.globalAlpha = 0.7;
                this.ctx.beginPath();
                this.ctx.arc(-hailSize * 0.2, -hailSize * 0.2, 
                           hailSize * 0.25, 0, Math.PI * 2);
                this.ctx.fill();
                
                // Small bright center highlight
                this.ctx.fillStyle = '#FFFFFF';
                this.ctx.globalAlpha = 1.0;
                this.ctx.beginPath();
                this.ctx.arc(-hailSize * 0.15, -hailSize * 0.15, 
                           hailSize * 0.12, 0, Math.PI * 2);
                this.ctx.fill();
                
                this.ctx.restore();
                // Reset alpha to particle opacity
                this.ctx.globalAlpha = particle.opacity;
                break;
        }
    }
    
    renderWeatherEffects() {
        const weather = this.weatherTypes[this.currentWeather];
        const visibility = weather.visibility;
        
        if (visibility < 1.0) {
            // Render fog/visibility reduction
            this.ctx.save();
            this.ctx.globalAlpha = (1.0 - visibility) * 0.3 * this.weatherIntensity;
            
            let fogColor = '#CCCCCC';
            if (this.currentWeather === 'storm' || this.currentWeather === 'hail') {
                fogColor = '#888888';
            } else if (this.currentWeather === 'snow' || this.currentWeather === 'blizzard') {
                fogColor = '#F0F8FF';
            }
            
            this.ctx.fillStyle = fogColor;
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            this.ctx.restore();
        }
    }
    
    // Get current weather info for other systems
    getCurrentWeather() {
        return {
            type: this.currentWeather,
            intensity: this.weatherIntensity,
            wind: {
                direction: this.wind.direction,
                strength: this.wind.strength
            },
            properties: this.weatherTypes[this.currentWeather]
        };
    }    // Force weather change (for testing or special events)
    forceWeatherChange(weatherType) {
        // RESPECT GRACE PERIOD: Only allow force weather if grace period has expired
        if (this.startupLockout || this.initialGracePeriod > 0) {
            return false;
        }
        
        if (this.weatherTypes[weatherType]) {
            this.changeWeather(weatherType);
            
            // 🔧 FIX: Force immediate transition and intensity for instant visual feedback
            this.weatherTransition = 1.0;
            this.weatherIntensity = 1.0;
            
            // Force some precipitation for immediate visual feedback
            if (weatherType === 'rain' || weatherType === 'snow' || weatherType === 'storm' || weatherType === 'hail') {
                for (let i = 0; i < 100; i++) {
                    this.createPrecipitationParticle();
                }
            }
            return true;
        }
        return false;
    }
    
    // Get weather description for UI
    getWeatherDescription() {
        const intensity = this.weatherIntensity;
        const weather = this.currentWeather;
          const descriptions = {
            clear: intensity > 0.8 ? 'Clear skies' : 'Mostly clear',
            cloudy: intensity > 0.8 ? 'Cloudy' : 'Partly cloudy',
            overcast: 'Overcast',
            rain: intensity > 0.8 ? 'Heavy rain' : 'Light rain',
            storm: 'Thunderstorm',
            snow: intensity > 0.8 ? 'Heavy snow' : 'Light snow',
            blizzard: 'Blizzard',
            hail: 'Hailstorm'
        };
        return descriptions[weather] || weather;
    }
    
    playWeatherSound(weather) {
        if (!this.soundSystem) return;
        
        switch (weather) {
            case 'rain':
                this.soundSystem.playRainSound();
                break;
            case 'storm':
                this.soundSystem.playThunderSound();
                setTimeout(() => this.soundSystem.playRainSound(), 500);
                break;
            case 'snow':
            case 'blizzard':
                this.soundSystem.playSnowSound();
                if (weather === 'blizzard') {
                    setTimeout(() => this.soundSystem.playWindSound(), 300);
                }
                break;
            case 'hail':
                this.soundSystem.playRainSound();
                setTimeout(() => this.soundSystem.playWindSound(), 200);
                break;
        }
    }
    
    playAmbientWeatherSounds() {
        if (!this.soundSystem || Math.random() > 0.02) return; // 2% chance per update
        
        switch (this.currentWeather) {
            case 'rain':
                if (Math.random() < 0.3) this.soundSystem.playRainSound();
                break;
            case 'storm':
                if (Math.random() < 0.1) this.soundSystem.playThunderSound();
                if (Math.random() < 0.4) this.soundSystem.playRainSound();
                break;
            case 'snow':
                if (Math.random() < 0.2) this.soundSystem.playSnowSound();
                break;
            case 'blizzard':
                if (Math.random() < 0.3) this.soundSystem.playWindSound();
                if (Math.random() < 0.2) this.soundSystem.playSnowSound();
                break;
            case 'hail':
                if (Math.random() < 0.3) this.soundSystem.playRainSound();
                break;
        }
    }
    
    getCurrentWeatherInfo() {
        return {
            weather: this.currentWeather,
            intensity: this.weatherIntensity,
            windDirection: this.wind.direction,
            windStrength: this.wind.strength,
            cloudCover: this.cloudDensity,
            visibility: this.weatherTypes[this.currentWeather]?.visibility || 1.0
        };
    }    // Debug methods for testing weather
    forceWeather(weatherType) {
        // RESPECT GRACE PERIOD: Only allow force weather if grace period has expired
        if (this.startupLockout || this.initialGracePeriod > 0) {
            return false;
        }
        
        if (this.weatherTypes[weatherType]) {
            this.changeWeather(weatherType);
            return true;
        }
        return false;
    }
      // Create test particles guaranteed to be visible
    createTestParticles(count = 50) {
        const camera = this.camera || { x: 0, y: 0 };
        
        for (let i = 0; i < count; i++) {
            const particle = {
                // Create particles in visible screen area
                x: camera.x + (i % 10) * (this.canvas.width / 10),
                y: camera.y + Math.floor(i / 10) * 50,
                vx: (Math.random() - 0.5) * 50,
                vy: 100 + Math.random() * 100,
                width: 2 + Math.random() * 2,
                height: 8 + Math.random() * 12,
                opacity: 0.8 + Math.random() * 0.2,
                life: 10.0, // Long life for testing
                type: 'rain'
            };
            this.precipitation.push(particle);
        }
    }
    
    getAvailableWeatherTypes() {
        return Object.keys(this.weatherTypes);
    }
      setWeatherIntensity(intensity) {
        this.weatherIntensity = Math.max(0, Math.min(1, intensity));
    }
}

// Weather particle system for advanced effects
class WeatherParticleSystem {
    constructor() {
        this.particles = [];
        this.maxParticles = 1000;
    }
    
    createLightning(x, y, intensity = 1.0) {
        // Create lightning bolt effect
        const segments = 8 + Math.floor(Math.random() * 6);
        const lightning = {
            type: 'lightning',
            segments: [],
            life: 0.3,
            maxLife: 0.3,
            intensity: intensity
        };
        
        let currentX = x;
        let currentY = y;
        
        for (let i = 0; i < segments; i++) {
            const nextX = currentX + (Math.random() - 0.5) * 100;
            const nextY = currentY + 50 + Math.random() * 30;
            
            lightning.segments.push({
                x1: currentX, y1: currentY,
                x2: nextX, y2: nextY,
                thickness: 2 + Math.random() * 3
            });
            
            currentX = nextX;
            currentY = nextY;
        }
        
        this.particles.push(lightning);
    }
    
    update(deltaTime) {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const particle = this.particles[i];
            particle.life -= deltaTime;
            
            if (particle.life <= 0) {
                this.particles.splice(i, 1);
            }
        }
    }
    
    render(ctx) {
        ctx.save();
        
        for (let particle of this.particles) {
            if (particle.type === 'lightning') {
                const alpha = particle.life / particle.maxLife;
                ctx.globalAlpha = alpha * particle.intensity;
                ctx.strokeStyle = '#FFFFFF';
                ctx.shadowColor = '#87CEEB';
                ctx.shadowBlur = 10;
                
                for (let segment of particle.segments) {
                    ctx.lineWidth = segment.thickness;
                    ctx.beginPath();
                    ctx.moveTo(segment.x1, segment.y1);
                    ctx.lineTo(segment.x2, segment.y2);
                    ctx.stroke();
                }
            }        }        ctx.restore();
    }
}
