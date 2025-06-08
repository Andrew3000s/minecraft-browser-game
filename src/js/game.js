// Main game engine for Minecraft browser game

class MinecraftGame {    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        // Set canvas size to fullscreen
        this.resizeCanvas();
        
        // Add window resize listener for fullscreen support
        this.resizeHandler = () => this.resizeCanvas();
        window.addEventListener('resize', this.resizeHandler);
        
        // Game state
        this.lastTime = 0;
        this.camera = { x: 0, y: 0 };
        this.gameRunning = false;
        this.isLoaded = false;
        this.isCommandGuideVisible = false; // Aggiunta per tracciare la visibilità della guida
        this.survivalTime = 0; // MODIFIED: Added survival time
        
        // Make game accessible globally for debugging
        window.game = this;
        
        // Check if BlockTypes is available
        if (typeof BlockTypes === 'undefined') {
            console.error('BlockTypes not found! Make sure blocks.js is loaded first.');
            throw new Error('BlockTypes not found');
        }
          // 🔥 FIXED: Removed verbose initialization logging
        this.initializeAsync();
    }    // Handle window resize for fullscreen support
    resizeCanvas() {
        const rect = this.canvas.getBoundingClientRect();
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        
        // Update canvas style to match
        this.canvas.style.width = window.innerWidth + 'px';
        this.canvas.style.height = window.innerHeight + 'px';
        
        // Update camera bounds if world exists
        if (this.world && this.player) {
            this.camera = this.player.getCameraPosition(this.canvas.width, this.canvas.height);
            this.clampCamera();
        }
    }    async initializeAsync() {
        try {
            // Ensure loading screen is visible
            const loadingElement = document.getElementById('loadingScreen');
            if (loadingElement) {
                loadingElement.style.display = 'flex';
                loadingElement.classList.remove('hidden');
            }
            
            // 🔥 FIXED: Removed verbose initialization logging
            
            // Show loading progress
            this.updateLoadingProgress(10, 'Initializing input system...');
            await this.delay(100);
            
            // Initialize input system
            if (typeof InputManager === 'undefined') {
                throw new Error('InputManager class not found');            }
            this.input = new InputManager(this.canvas);
            // 🔥 FIXED: Removed verbose initialization logging
            
            // Initialize effects and sound
            if (typeof ParticleSystem === 'undefined') {
                throw new Error('ParticleSystem class not found');
            }
            this.particles = new ParticleSystem();            if (typeof SoundSystem === 'undefined') {
                throw new Error('SoundSystem class not found');
            }
            this.sound = new SoundSystem();
            
            if (typeof CraftingSystem === 'undefined') {
                throw new Error('CraftingSystem class not found');
            }
            this.crafting = new CraftingSystem();
              // 🔥 FIXED: Removed verbose initialization logging
            
            // Initialize crafting recipes after BlockTypes is available
            if (typeof initializeCraftingRecipes === 'function') {
                initializeCraftingRecipes();
                // 🔥 FIXED: Removed verbose initialization logging
            } else {
                console.warn('⚠ initializeCraftingRecipes function not found');
            }
              this.updateLoadingProgress(30, 'Generating world terrain...');
            await this.delay(100);
            
            // Initialize world with progress callback
            if (typeof World === 'undefined') {
                throw new Error('World class not found');            }
            this.world = new World(200, 100);
            // 🔥 FIXED: Removed verbose initialization logging
            
            // 🌊 Inizializza sistema avanzato di fisica dei fluidi
            if (this.world.initializeAdvancedFluidPhysics) {
                this.world.initializeAdvancedFluidPhysics(this);
            }
            
            this.updateLoadingProgress(70, 'Spawning player...');
            await this.delay(100);
            
            // Find spawn position
            const spawnX = this.world.width * this.world.blockSize / 2;
            const spawnY = this.findSpawnY(spawnX);
            
            if (typeof Player === 'undefined') {
                throw new Error('Player class not found');
            }
            this.player = new Player(spawnX, spawnY, this.world);
            // 🔥 FIXED: Removed verbose initialization logging
            
            this.updateLoadingProgress(85, 'Initializing entities...');
            await this.delay(100);
              // Initialize entity system
            if (typeof EntityManager === 'undefined') {                throw new Error('EntityManager class not found');
            }
            this.entityManager = new EntityManager();
            // 🔥 FIXED: Removed verbose initialization logging
            
            // Initialize notification system
            this.notifications = new NotificationSystem();
            // 🔥 FIXED: Removed verbose initialization logging
            
            // Initialize tooltip system
            this.tooltips = new TooltipSystem();
            // 🔥 FIXED: Removed verbose initialization logging
              // Initialize time system
            this.timeSystem = new TimeSystem();
            // 🔥 FIXED: Removed verbose initialization logging
            
            this.updateLoadingProgress(90, 'Creating user interface...');
            await this.delay(100);
              // UI elements
            this.createUI();
            
            // Initialize audio settings panel after UI creation
            this.audioSettingsPanel = new AudioSettingsPanel(this.sound);
            
            // Setup music control after UI creation
            this.setupMusicControl();
            
            this.updateLoadingProgress(100, 'Ready to play!');
            await this.delay(500);
            
            // Hide loading screen
            const loadingScreen = document.getElementById('loadingScreen');
            if (loadingScreen) {
                loadingScreen.classList.add('hidden');
            }            this.isLoaded = true;
            // 🔥 Game initialization completed successfully
            
            // Automatically start the game after successful initialization
            this.start();
            
        } catch (error) {
            console.error('Error initializing game:', error);
        }
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }    updateLoadingProgress(percentage, message) {
        const progressBar = document.querySelector('.loading-progress');
        const loadingText = document.querySelector('.loading-screen p');
        const loadingPercentage = document.querySelector('.loading-percentage');
        
        if (progressBar) {
            progressBar.style.width = percentage + '%';
        }
        
        if (loadingText) {
            loadingText.textContent = message;
        }
        
        if (loadingPercentage) {
            loadingPercentage.textContent = Math.round(percentage) + '%';
        }
    }

    findSpawnY(x) {
        const blockX = Math.floor(x / this.world.blockSize);
        for (let y = 0; y < this.world.height; y++) {
            if (this.world.getBlock(blockX, y) !== BlockTypes.AIR && 
                this.world.getBlock(blockX, y) !== BlockTypes.WATER) {
                return (y - 2) * this.world.blockSize; // Spawn 2 blocks above surface
            }
        }
        return 100; // Default spawn height
    }

    createUI() {        // Create UI overlay
        const uiOverlay = document.createElement('div');
        uiOverlay.className = 'ui-overlay';        uiOverlay.innerHTML = `            <div id="position">Position: 0, 0</div>
            <div id="blockInfo">Block: Air</div>
            <div id="entityCount">Entities: 0</div>
            <div id="fps">FPS: 0</div>
            <div id="timeDisplay">🌙 00:00 (Light: 10%)</div>
        `;
        document.body.appendChild(uiOverlay);        // Create health bar
        const healthBar = document.createElement('div');
        healthBar.className = 'health-bar';
        healthBar.id = 'healthBar';
        document.body.appendChild(healthBar);

        // Create oxygen bar
        const oxygenBar = document.createElement('div');
        oxygenBar.className = 'oxygen-bar';
        oxygenBar.id = 'oxygenBar';
        oxygenBar.innerHTML = `
            <div class="oxygen-fill" id="oxygenFill"></div>
            <div class="oxygen-text" id="oxygenText">O2: 100%</div>
        `;
        document.body.appendChild(oxygenBar);

        // Create inventory UI
        const inventory = document.createElement('div');
        inventory.className = 'inventory';
        inventory.id = 'inventory';
        document.body.appendChild(inventory);        // Create controls info
        // const controls = document.createElement('div');
        // controls.className = 'controls';
        // controls.innerHTML = `
        //     <div>WASD - Movimento</div>
        //     <div>Spazio - Salto</div>
        //     <div>Click Sinistro - Scava</div>
        //     <div>Click Destro - Piazza</div>
        //     <div>Rotella Mouse - Cambia Blocco</div>
        //     <div>1-9 - Seleziona Inventario</div>
        //     <div>I - Mostra/Nascondi Inventario</div>
        //     <div>B - Lascia Cadere 1 Blocco</div>
        //     <div>C - Apri Crafting</div>
        // `;
        // document.body.appendChild(controls);        // Remove crosshair - using mouse indicator instead
        const gameContainer = document.createElement('div');
        gameContainer.className = 'game-container';
        gameContainer.appendChild(this.canvas);
        document.body.appendChild(gameContainer);        this.updateUI();
    }    setupMusicControl() {
        const musicControl = document.getElementById('musicControl');
        if (musicControl) {
            musicControl.addEventListener('click', () => {
                // Open audio settings panel instead of simple toggle
                if (this.audioSettingsPanel) {
                    this.audioSettingsPanel.show();
                } else {
                    console.warn('Audio settings panel not initialized');
                }
            });
            
            // Start background music by default
            if (this.sound.musicEnabled) {
                this.sound.startBackgroundMusic();
            }
        } else {
            console.warn('Music control element not found');
        }
    }toggleCommandGuide() {
        this.isCommandGuideVisible = !this.isCommandGuideVisible;
        
        if (this.isCommandGuideVisible) {
            this.renderCommandGuide();
        } else {
            this.removeCommandGuide();
        }
    }    renderCommandGuide() {
        this.removeCommandGuide(); // Remove if already exists to avoid duplicates

        const commandGuideElement = document.createElement('div');
        commandGuideElement.id = 'commandGuideScreen';
        commandGuideElement.className = 'command-guide-screen';
        
        commandGuideElement.innerHTML = `
            <div class="guide-header">
                <h2>🎮 Minecraft Browser Game - Controls Guide</h2>
                <p class="guide-subtitle">Press 'G' to close this guide</p>
            </div>
            
            <div class="guide-content">
                <div class="controls-section">
                    <h3>🕹️ Basic Controls</h3>
                    <div class="controls-grid">
                        <div class="control-item">
                            <span class="key">WASD</span>
                            <span class="action">Player movement</span>
                        </div>
                        <div class="control-item">
                            <span class="key">Space</span>
                            <span class="action">Jump</span>
                        </div>
                        <div class="control-item">
                            <span class="key">Left Click</span>
                            <span class="action">Mine / Break blocks</span>
                        </div>
                        <div class="control-item">
                            <span class="key">Right Click</span>
                            <span class="action">Place blocks</span>
                        </div>
                    </div>
                </div>
                
                <div class="controls-section">
                    <h3>📦 Inventory & Items</h3>
                    <div class="controls-grid">
                        <div class="control-item">
                            <span class="key">Mouse Wheel</span>
                            <span class="action">Scroll inventory slots</span>
                        </div>
                        <div class="control-item">
                            <span class="key">1-9</span>
                            <span class="action">Direct slot selection</span>
                        </div>
                        <div class="control-item">
                            <span class="key">I</span>
                            <span class="action">Show/Hide inventory</span>
                        </div>
                        <div class="control-item">
                            <span class="key">B</span>
                            <span class="action">Drop 1 block</span>
                        </div>
                    </div>
                </div>
                
                <div class="controls-section">
                    <h3>🎵 Audio & Interface</h3>
                    <div class="controls-grid">
                        <div class="control-item">
                            <span class="key">M</span>
                            <span class="action">Open audio panel</span>
                        </div>
                        <div class="control-item">
                            <span class="key">C</span>
                            <span class="action">Open crafting menu</span>
                        </div>
                        <div class="control-item">
                            <span class="key">G</span>
                            <span class="action">Show/Hide this guide</span>
                        </div>
                        <div class="control-item">
                            <span class="key">🎵 Button</span>
                            <span class="action">Advanced audio settings</span>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="guide-footer">
                <p>💡 <strong>Tip:</strong> Use the audio panel (M key) to fully customize your sound experience!</p>
            </div>        `;
        document.body.appendChild(commandGuideElement);
    }    removeCommandGuide() {
        const commandGuideElement = document.getElementById('commandGuideScreen');
        if (commandGuideElement) {
            commandGuideElement.remove();
        }
    }

    updateUI() {
        // 🔥 ERROR HANDLING FIX: Safe DOM element access
        // Update position
        const posElement = document.getElementById('position');
        if (posElement && this.player && this.world) {
            const blockX = Math.floor(this.player.x / this.world.blockSize);
            const blockY = Math.floor(this.player.y / this.world.blockSize);
            posElement.textContent = `Position: ${blockX}, ${blockY}`;
        }
        
        // Update time display
        const timeElement = document.getElementById('timeDisplay');
        if (timeElement && this.timeSystem) {
            const currentTime = this.timeSystem.getTimeString();
            const lightLevel = Math.round(this.timeSystem.getLightLevel() * 100);
            const timeOfDay = this.timeSystem.isDay() ? '☀️' : '🌙';
            timeElement.textContent = `${timeOfDay} ${currentTime} (Light: ${lightLevel}%)`;
        }        
        // Update block/entity info under mouse
        const mousePos = this.input?.getMousePosition();
        if (!mousePos || !this.camera) return; // Early exit if input system not ready
        
        const worldPos = Utils.screenToWorld(mousePos.x, mousePos.y, this.camera);
        
        // Check if mouse is over any entity first
        let entityUnderMouse = null;
        if (this.entityManager?.entities) {
            for (const entity of this.entityManager.entities) {
                if (!entity.alive) continue;
                
                if (worldPos.x >= entity.x && worldPos.x <= entity.x + entity.width &&
                    worldPos.y >= entity.y && worldPos.y <= entity.y + entity.height) {
                    entityUnderMouse = entity;
                    break;
                }
            }
        }
        
        const blockInfoElement = document.getElementById('blockInfo');
        if (blockInfoElement) {
            if (entityUnderMouse) {
                // Show entity name with proper capitalization
                const entityName = entityUnderMouse.type.charAt(0).toUpperCase() + entityUnderMouse.type.slice(1);
                const healthInfo = `${entityUnderMouse.health}/${entityUnderMouse.maxHealth} HP`;
                const status = entityUnderMouse.isHostile ? 'Hostile' : 'Peaceful';
                blockInfoElement.textContent = `Entity: ${entityName} (${status}, ${healthInfo})`;
            } else if (this.world) {
                // Show block info
                const blockX = Math.floor(worldPos.x / this.world.blockSize);
                const blockY = Math.floor(worldPos.y / this.world.blockSize);
                const blockType = this.world.getBlock(blockX, blockY);
                blockInfoElement.textContent = `Block: ${BlockNames[blockType] || 'Unknown'}`;
            }
        }

        // Update entity count
        const entityCountElement = document.getElementById('entityCount');
        if (entityCountElement && this.entityManager) {
            entityCountElement.textContent = `Entities: ${this.entityManager.getEntityCount()}`;
        }        // Update health bar
        this.updateHealthBar();

        // Update oxygen bar
        this.updateOxygenBar();        // Update inventory
        this.updateInventory();
    }updateHealthBar() {
        const healthBar = document.getElementById('healthBar');
        if (!healthBar) return;

        healthBar.innerHTML = '';
        const maxHearts = Math.ceil(this.player.maxHealth / 2);
        
        for (let i = 0; i < maxHearts; i++) {
            const heart = document.createElement('div');
            heart.className = 'heart';
            
            const healthForThisHeart = this.player.health - (i * 2);
            if (healthForThisHeart <= 0) {
                heart.classList.add('empty');
            }
            
            healthBar.appendChild(heart);
        }
    }

    updateOxygenBar() {
        const oxygenFill = document.getElementById('oxygenFill');
        const oxygenText = document.getElementById('oxygenText');
        
        if (!oxygenFill || !oxygenText || !this.player) return;
        
        const oxygenPercent = Math.round((this.player.oxygen / this.player.maxOxygen) * 100);
        
        // Update fill width
        oxygenFill.style.width = `${oxygenPercent}%`;
        
        // Update text
        oxygenText.textContent = `O2: ${oxygenPercent}%`;
        
        // Change color based on oxygen level
        if (oxygenPercent > 50) {
            oxygenFill.style.background = 'linear-gradient(90deg, #4169E1, #87CEEB)'; // Blue
        } else if (oxygenPercent > 20) {
            oxygenFill.style.background = 'linear-gradient(90deg, #FFD700, #FFA500)'; // Yellow/Orange
        } else {
            oxygenFill.style.background = 'linear-gradient(90deg, #FF4500, #FF0000)'; // Red
        }
        
        // Show/hide oxygen bar based on whether player is in water or has low oxygen
        const oxygenBar = document.getElementById('oxygenBar');
        if (oxygenBar) {
            if (this.player.inWater || oxygenPercent < 100) {
                oxygenBar.style.display = 'block';
            } else {
                oxygenBar.style.display = 'none';
            }
        }
    }

    updateInventory() {
        const inventory = document.getElementById('inventory');
        if (!inventory) return;

        inventory.innerHTML = '';
        
        for (let i = 0; i < this.player.inventory.length; i++) {
            const slot = document.createElement('div');
            slot.className = 'inventory-slot';
            if (i === this.player.activeSlot) {
                slot.classList.add('active');
            }
            
            const item = this.player.inventory[i];
            if (item) {
                // Create a mini canvas for the block icon
                const iconCanvas = document.createElement('canvas');
                iconCanvas.width = 32;
                iconCanvas.height = 32;
                const iconCtx = iconCanvas.getContext('2d');
                
                const tempBlock = new Block(item.type, 0, 0);
                tempBlock.render(iconCtx, 0, 0, 32, false);
                
                slot.appendChild(iconCanvas);
                
                // Add count if more than 1
                if (item.count > 1) {
                    const count = document.createElement('div');
                    count.style.position = 'absolute';
                    count.style.bottom = '2px';
                    count.style.right = '2px';
                    count.style.fontSize = '12px';
                    count.style.color = 'white';
                    count.style.textShadow = '1px 1px 2px black';
                    count.textContent = item.count;
                    slot.style.position = 'relative';
                    slot.appendChild(count);
                }
            }
            
            slot.addEventListener('click', () => {
                this.player.setActiveSlot(i);
                this.updateInventory();
            });
            
            inventory.appendChild(slot);
        }    }    gameLoop(currentTime) {
        if (!this.gameRunning) return;

        const deltaTime = (currentTime - this.lastTime) / 1000;
        this.lastTime = currentTime;

        // Limit delta time to prevent large jumps
        const clampedDeltaTime = Math.min(deltaTime, 1/30);

        this.update(clampedDeltaTime);
        this.render();

        // Update FPS
        const fpsElement = document.getElementById('fps');
        if (fpsElement && deltaTime > 0) {
            fpsElement.textContent = `FPS: ${Math.round(1 / deltaTime)}`;
        }

        // Continue the game loop
        requestAnimationFrame((time) => this.gameLoop(time));
    }    update(deltaTime) {        // Update time system
        this.timeSystem.update(deltaTime);
        
        // MODIFIED: Update survival time if game is running
        if (this.gameRunning) {
            this.survivalTime += deltaTime;
        }        // Update player
        this.player.update(deltaTime, this.input);
        
        // 🐛 DEBUG: Verify game loop is calling player update
        if (Math.random() < 0.01) { // Log occasionally
            // Game loop updating player
        }        // Update entities
        this.entityManager.update(deltaTime, this.world, this.player);        

        // 🌊 Update liquid physics with deltaTime for advanced fluid system - REACTIVATED with optimizations
        if (Math.random() < 0.3) { // Update liquid physics 30% of frames for good fluidity without blocking input
            this.world.updateLiquidPhysics(deltaTime);
        }

        // Update particles
        this.particles.update(deltaTime);

        // Update camera to follow player
        this.camera = this.player.getCameraPosition(this.canvas.width, this.canvas.height);

        // Keep camera within world bounds
        this.camera.x = Utils.clamp(this.camera.x, 0, this.world.width * this.world.blockSize - this.canvas.width);
        this.camera.y = Utils.clamp(this.camera.y, 0, this.world.height * this.world.blockSize - this.canvas.height);

        // Update UI periodically
        if (Math.random() < 0.1) { // Update UI less frequently for performance
            this.updateUI();
        }
    }render() {
        // Clear canvas with time-based sky color
        this.ctx.fillStyle = this.timeSystem.getSkyColor();
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Add stars effect during night
        if (this.timeSystem.isNight()) {
            this.renderStars();
        }

        // Render world normally (no lighting overlay here)
        this.world.render(this.ctx, this.camera, this.canvas.width, this.canvas.height);

        // Render entities
        this.entityManager.render(this.ctx, this.camera);

        // Render particles
        this.particles.render(this.ctx, this.camera);

        // Render player
        this.player.render(this.ctx, this.camera);

        // Apply darkness overlay for night (but reduced where torches are)
        const lightLevel = this.timeSystem.getLightLevel();
        if (lightLevel < 1.0) {
            this.renderDarknessWithTorches();
            
            // Add warm torch glow effects on top
            this.renderTorchGlow();
        }

        // Render UI elements (always full brightness)
        this.renderMiningProgress();
        this.renderBlockPreview();
        this.renderMouseIndicator();
        
        // Update tooltips for entities under mouse
        this.updateEntityTooltips();
    }    renderDarknessWithTorches() {
        this.ctx.save();
        
        // Create darkness overlay only during night
        const lightLevel = this.timeSystem.getLightLevel();
        if (lightLevel >= 0.95) { // Only apply darkness when light level is below 95%
            this.ctx.restore();
            return; // No darkness during bright day
        }

        // 🔥 PERFORMANCE FIX: Reuse lighting canvas to prevent memory issues
        if (!this.lightingCanvas) {
            this.lightingCanvas = document.createElement('canvas');
            this.lightingCtx = this.lightingCanvas.getContext('2d');
        }
        
        // Update canvas size if needed
        if (this.lightingCanvas.width !== this.canvas.width || this.lightingCanvas.height !== this.canvas.height) {
            this.lightingCanvas.width = this.canvas.width;
            this.lightingCanvas.height = this.canvas.height;
        }
        
        // Clear previous frame
        this.lightingCtx.clearRect(0, 0, this.lightingCanvas.width, this.lightingCanvas.height);
        
        // Apply natural darkness with warm colors
        const darknessAlpha = Math.min(0.75, Math.max(0.05, 1.0 - lightLevel)); // More gentle darkness
        this.lightingCtx.fillStyle = `rgba(20, 30, 50, ${darknessAlpha})`; // Warmer, less harsh darkness
        this.lightingCtx.fillRect(0, 0, this.lightingCanvas.width, this.lightingCanvas.height);
        
        // Add torch illumination with additive blending
        this.lightingCtx.globalCompositeOperation = 'lighter';
        
        // 🔥 PERFORMANCE FIX: Optimize visible area calculation with reduced padding
        const padding = 6; // Reduced from 8 for better performance
        const startX = Math.max(0, Math.floor(this.camera.x / this.world.blockSize) - padding);
        const endX = Math.min(this.world.width, Math.ceil((this.camera.x + this.canvas.width) / this.world.blockSize) + padding);
        const startY = Math.max(0, Math.floor(this.camera.y / this.world.blockSize) - padding);
        const endY = Math.min(this.world.height, Math.ceil((this.camera.y + this.canvas.height) / this.world.blockSize) + padding);
        
        // 🔥 PERFORMANCE FIX: Spatial optimization - collect torches first
        const visibleTorches = [];
        for (let x = startX; x < endX; x++) {
            for (let y = startY; y < endY; y++) {
                const block = this.world.getBlockInstance(x, y);
                if (block && block.type === BlockTypes.TORCH) {
                    const screenX = x * this.world.blockSize - this.camera.x + this.world.blockSize / 2;
                    const screenY = y * this.world.blockSize - this.camera.y + this.world.blockSize / 2;
                    
                    // Only add if on screen or close to it
                    if (screenX > -100 && screenX < this.canvas.width + 100 && 
                        screenY > -100 && screenY < this.canvas.height + 100) {
                        visibleTorches.push({ x: screenX, y: screenY });
                    }
                }
            }
        }
        
        // 🔥 PERFORMANCE FIX: Process limited number of torches per frame
        const maxTorchesPerFrame = Math.min(30, visibleTorches.length); // Reduced from 50
        const processedTorches = visibleTorches.slice(0, maxTorchesPerFrame);
        
        // Render torch lighting with optimized function
        for (const torch of processedTorches) {
            this.createOptimizedTorchLight(this.lightingCtx, torch.x, torch.y);
        }
        
        // Apply lighting to main canvas with proper blending
        this.ctx.globalCompositeOperation = 'multiply';
        this.ctx.drawImage(this.lightingCanvas, 0, 0);
        
        this.ctx.restore();
    }

    // 🔥 PERFORMANCE FIX: Optimized torch light rendering
    createOptimizedTorchLight(ctx, centerX, centerY) {
        // Simpler flickering calculation for better performance
        const time = Date.now() * 0.001; // Use seconds for stability
        const flickerX = Math.sin(time * 1.2 + centerX * 0.01) * 1.5;
        const flickerY = Math.sin(time * 1.5 + centerY * 0.01) * 1;
        const effectiveCenterX = centerX + flickerX;
        const effectiveCenterY = centerY + flickerY;
        
        // Simplified flickering intensity
        const flickerIntensity = 0.85 + Math.sin(time * 0.8) * 0.1;
          // Single gradient for better performance - increased radius for better illumination
        const lightRadius = 100 + flickerIntensity * 18; // Increased radius for better torch light coverage
        const lightGradient = ctx.createRadialGradient(
            effectiveCenterX, effectiveCenterY, 0,
            effectiveCenterX, effectiveCenterY, lightRadius
        );
        
        // Warm torch colors - fewer stops for better performance
        lightGradient.addColorStop(0, `rgba(255, 230, 150, ${0.8 * flickerIntensity})`);
        lightGradient.addColorStop(0.4, `rgba(255, 200, 100, ${0.6 * flickerIntensity})`);
        lightGradient.addColorStop(0.8, `rgba(255, 160, 60, ${0.3 * flickerIntensity})`);
        lightGradient.addColorStop(1, 'rgba(255, 140, 40, 0)');
        
        ctx.fillStyle = lightGradient;
        ctx.beginPath();
        ctx.arc(effectiveCenterX, effectiveCenterY, lightRadius, 0, Math.PI * 2);
        ctx.fill();
    }createProperTorchLight(centerX, centerY) {
        // Add synchronized flickering to torch position
        const flickerX = Math.sin(Date.now() * 0.012 + centerX * 0.01) * 2;
        const flickerY = Math.sin(Date.now() * 0.015 + centerY * 0.01) * 1.5;
        const effectiveCenterX = centerX + flickerX;
        const effectiveCenterY = centerY + flickerY;
        
        // Flickering intensity for natural torch behavior
        const flickerIntensity = Math.sin(Date.now() * 0.008) * 0.15 + 0.85;
          // Create proper darkness removal (not white overlay)
        // Use black gradient to remove darkness overlay correctly
        const innerRadius = 95 + flickerIntensity * 35; // Increased inner radius for better coverage
        const innerGradient = this.ctx.createRadialGradient(
            effectiveCenterX, effectiveCenterY, 0,
            effectiveCenterX, effectiveCenterY, innerRadius
        );
        // Use black with varying alpha to "cut out" darkness properly
        innerGradient.addColorStop(0, 'rgba(0, 0, 0, 1)');    // Full darkness removal at center
        innerGradient.addColorStop(0.6, 'rgba(0, 0, 0, 1)');  // Full removal extends further
        innerGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');    // Fade to no removal
        
        this.ctx.fillStyle = innerGradient;
        this.ctx.fillRect(
            effectiveCenterX - innerRadius, 
            effectiveCenterY - innerRadius, 
            innerRadius * 2, 
            innerRadius * 2
        );
          // Outer dim illumination for better transition
        const outerRadius = 190 + flickerIntensity * 55; // Increased outer radius for smoother light transition
        const outerGradient = this.ctx.createRadialGradient(
            effectiveCenterX, effectiveCenterY, innerRadius * 0.5, // Start from half of innerRadius for smoother blend
            effectiveCenterX, effectiveCenterY, outerRadius
        );
        outerGradient.addColorStop(0, 'rgba(0, 0, 0, 0.6)'); // Stronger initial removal for outer glow
        outerGradient.addColorStop(0.7, 'rgba(0, 0, 0, 0.2)'); // Adjusted falloff
        outerGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');   // No removal at edge
        
        this.ctx.fillStyle = outerGradient;
        this.ctx.fillRect(
            effectiveCenterX - outerRadius, 
            effectiveCenterY - outerRadius, 
            outerRadius * 2, 
            outerRadius * 2
        );
    }

    createTorchLight(centerX, centerY, darknessAlpha) {
        // Add slight random flickering to torch position
        const flickerX = Math.sin(Date.now() * 0.012 + centerX * 0.01) * 2;
        const flickerY = Math.sin(Date.now() * 0.015 + centerY * 0.01) * 1.5;
        const effectiveCenterX = centerX + flickerX;
        const effectiveCenterY = centerY + flickerY;
          // Inner bright light with flickering intensity
        const flickerIntensity = Math.sin(Date.now() * 0.008) * 0.15 + 0.85;
        const innerRadius = 65 + flickerIntensity * 22; // Increased inner radius for better light coverage
        let gradient = this.ctx.createRadialGradient(effectiveCenterX, effectiveCenterY, 0, effectiveCenterX, effectiveCenterY, innerRadius);
        gradient.addColorStop(0, `rgba(0, 0, 0, ${darknessAlpha * 0.95})`); // Almost full cutout at center
        gradient.addColorStop(0.5, `rgba(0, 0, 0, ${darknessAlpha * 0.4})`); // Partial cutout
        gradient.addColorStop(1, `rgba(0, 0, 0, 0)`); // No cutout at edge
        
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(effectiveCenterX - innerRadius, effectiveCenterY - innerRadius, innerRadius * 2, innerRadius * 2);
          // Outer dim light
        const outerRadius = 150 + flickerIntensity * 35; // Increased outer radius for better light spread
        gradient = this.ctx.createRadialGradient(effectiveCenterX, effectiveCenterY, innerRadius * 0.8, effectiveCenterX, effectiveCenterY, outerRadius);
        gradient.addColorStop(0, `rgba(0, 0, 0, 0)`); // Start transparent
        gradient.addColorStop(0.6, `rgba(0, 0, 0, ${darknessAlpha * 0.25})`); // Slight cutout
        gradient.addColorStop(1, `rgba(0, 0, 0, 0)`); // No cutout at edge
        
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(effectiveCenterX - outerRadius, effectiveCenterY - outerRadius, outerRadius * 2, outerRadius * 2);
    }    renderTorchGlow() {
        this.ctx.save();
        this.ctx.globalCompositeOperation = 'screen'; // Additive blending for warm glow
        
        // Find torches in visible area and add enhanced warm glow
        const startX = Math.max(0, Math.floor(this.camera.x / this.world.blockSize) - 8);
        const endX = Math.min(this.world.width, Math.ceil((this.camera.x + this.canvas.width) / this.world.blockSize) + 8);
        const startY = Math.max(0, Math.floor(this.camera.y / this.world.blockSize) - 8);
        const endY = Math.min(this.world.height, Math.ceil((this.camera.y + this.canvas.height) / this.world.blockSize) + 8);
        
        for (let x = startX; x < endX; x++) {
            for (let y = startY; y < endY; y++) {
                const block = this.world.getBlockInstance(x, y);
                if (block && block.type === BlockTypes.TORCH) {
                    const screenX = x * this.world.blockSize - this.camera.x + this.world.blockSize / 2;
                    const screenY = y * this.world.blockSize - this.camera.y + this.world.blockSize / 2;
                    
                    // Add synchronized flickering
                    const flickerX = Math.sin(Date.now() * 0.012 + x * 0.01) * 2;
                    const flickerY = Math.sin(Date.now() * 0.015 + y * 0.01) * 1.5;
                    const effectiveCenterX = screenX + flickerX;
                    const effectiveCenterY = screenY + flickerY;
                    
                    // Flickering intensity
                    const flickerIntensity = Math.sin(Date.now() * 0.008) * 0.15 + 0.85;
                    
                    // Enhanced warm orange glow - multiple layers
                      // Inner bright glow
                    const innerGlowRadius = 38 + flickerIntensity * 12; // Increased glow radius for better visibility
                    const innerGradient = this.ctx.createRadialGradient(
                        effectiveCenterX, effectiveCenterY, 0,
                        effectiveCenterX, effectiveCenterY, innerGlowRadius
                    );
                    innerGradient.addColorStop(0, `rgba(255, 200, 100, ${0.7 * flickerIntensity})`); // Bright warm center
                    innerGradient.addColorStop(0.5, `rgba(255, 160, 60, ${0.4 * flickerIntensity})`); // Orange
                    innerGradient.addColorStop(1, `rgba(200, 100, 30, ${0.2 * flickerIntensity})`); // Dark orange
                    
                    this.ctx.fillStyle = innerGradient;
                    this.ctx.fillRect(
                        effectiveCenterX - innerGlowRadius, 
                        effectiveCenterY - innerGlowRadius, 
                        innerGlowRadius * 2, 
                        innerGlowRadius * 2
                    );
                      // Outer subtle glow
                    const outerGlowRadius = 65 + flickerIntensity * 18; // Increased outer glow for better ambiance
                    const outerGradient = this.ctx.createRadialGradient(
                        effectiveCenterX, effectiveCenterY, innerGlowRadius,
                        effectiveCenterX, effectiveCenterY, outerGlowRadius
                    );
                    outerGradient.addColorStop(0, `rgba(150, 80, 20, ${0.15 * flickerIntensity})`); // Dim warm
                    outerGradient.addColorStop(0.7, `rgba(100, 50, 10, ${0.08 * flickerIntensity})`); // Very dim
                    outerGradient.addColorStop(1, 'rgba(50, 25, 5, 0)'); // Transparent edge
                    
                    this.ctx.fillStyle = outerGradient;
                    this.ctx.fillRect(
                        effectiveCenterX - outerGlowRadius, 
                        effectiveCenterY - outerGlowRadius, 
                        outerGlowRadius * 2, 
                        outerGlowRadius * 2
                    );
                }
            }
        }
        
        this.ctx.restore();
    }

    renderStars() {
        // Enhanced star field for night sky
        this.ctx.save();
        
        const starCount = 200; // Increased star count
        const starSeed = Math.floor(this.camera.x / 200) * 1000 + Math.floor(this.camera.y / 200); // Adjusted seed for smoother parallax

        for (let i = 0; i < starCount; i++) {
            // Use Utils.noise for more organic positioning, seeded with starSeed and i
            // The numbers (e.g., 0.1, 0.2, 5, 7) are arbitrary factors to vary the noise input
            const noiseX = Utils.noise(starSeed + i * 0.1, starSeed - i * 0.2);
            const noiseY = Utils.noise(starSeed + i * 0.3, starSeed + i * 0.4);
            
            const x = (noiseX * this.canvas.width * 1.5) % this.canvas.width; // Spread stars wider, then wrap
            const y = (noiseY * this.canvas.height * 0.7) % (this.canvas.height / 1.8); // Concentrate in upper part, allow some lower

            // Vary star size
            const sizeNoise = Utils.noise(i * 5, starSeed * 0.05);
            let starSize = 1;
            if (sizeNoise < 0.33) {
                starSize = 1;
            } else if (sizeNoise < 0.66) {
                starSize = 2;
            } else {
                starSize = Utils.randomInt(1,2); // Can be 1x2 or 2x1 if we draw rects differently or just a larger square
            }
            
            // Vary base brightness
            const baseBrightnessNoise = Utils.noise(i * 7, starSeed * 0.01);
            const baseAlpha = Utils.lerp(0.3, 1.0, baseBrightnessNoise); // Stars vary in inherent brightness

            // Twinkling effect (current one is good)
            const twinkle = Math.sin(this.timeSystem.gameTime * 1.5 + i * 0.5) * 0.4 + 0.6; // Adjusted twinkle
            
            this.ctx.fillStyle = '#FFFFFF';
            this.ctx.globalAlpha = twinkle * baseAlpha * 0.9; // Combine base brightness with twinkle, overall slightly dimmer
            
            if (starSize === 1) {
                this.ctx.fillRect(x, y, 1, 1);
            } else {
                // For larger stars, can draw a 2x1, 1x2 or 2x2 rect.
                // For simplicity, let's make them 2x2 for now if size is 2.
                this.ctx.fillRect(x - 0.5, y - 0.5, starSize, starSize); // Center the larger stars
            }
        }
        
        this.ctx.restore();
    }

    renderMiningProgress() {
        if (this.player.miningBlock && this.player.miningProgress > 0) {
            const [x, y] = this.player.miningBlock.split(',').map(Number);
            const screenX = x * this.world.blockSize - this.camera.x;
            const screenY = y * this.world.blockSize - this.camera.y;

            const block = this.world.getBlockInstance(x, y);
            if (block) {
                const progress = this.player.miningProgress / block.hardness;
                
                // Draw crack overlay
                this.ctx.save();
                this.ctx.globalAlpha = 0.7;
                this.ctx.strokeStyle = '#FF0000';
                this.ctx.lineWidth = 2;
                
                const numCracks = Math.floor(progress * 5) + 1;
                for (let i = 0; i < numCracks; i++) {
                    this.ctx.beginPath();
                    this.ctx.moveTo(screenX + Math.random() * this.world.blockSize, 
                                   screenY + Math.random() * this.world.blockSize);
                    this.ctx.lineTo(screenX + Math.random() * this.world.blockSize, 
                                   screenY + Math.random() * this.world.blockSize);
                    this.ctx.stroke();
                }
                
                this.ctx.restore();
            }
        }
    }

    renderBlockPreview() {
        const activeItem = this.player.inventory[this.player.activeSlot];
        if (!activeItem || !this.input.isMouseRightPressed()) return;

        const mousePos = this.input.getMousePosition();
        const worldPos = Utils.screenToWorld(mousePos.x, mousePos.y, this.camera);
        const blockX = Math.floor(worldPos.x / this.world.blockSize);
        const blockY = Math.floor(worldPos.y / this.world.blockSize);

        // Check if block is in range
        const distance = Utils.distance(
            this.player.x + this.player.width / 2, this.player.y + this.player.height / 2,
            blockX * this.world.blockSize + this.world.blockSize / 2,
            blockY * this.world.blockSize + this.world.blockSize / 2
        );

        if (distance <= 150 && this.world.getBlock(blockX, blockY) === BlockTypes.AIR) {            const screenX = blockX * this.world.blockSize - this.camera.x;
            const screenY = blockY * this.world.blockSize - this.camera.y;

            this.ctx.save();
            this.ctx.globalAlpha = 0.5;
            const previewBlock = new Block(activeItem.type, blockX, blockY);
            previewBlock.render(this.ctx, screenX, screenY, this.world.blockSize);
            this.ctx.restore();
        }
    }    renderMouseIndicator() {
        const mousePos = this.input.getMousePosition();
        const worldPos = Utils.screenToWorld(mousePos.x, mousePos.y, this.camera);
        
        // Check if mouse is over any entity first
        let entityUnderMouse = null;
        for (const entity of this.entityManager.entities) {
            if (!entity.alive) continue;
            
            if (worldPos.x >= entity.x && worldPos.x <= entity.x + entity.width &&
                worldPos.y >= entity.y && worldPos.y <= entity.y + entity.height) {
                entityUnderMouse = entity;
                break;
            }
        }
        
        if (entityUnderMouse) {
            // Draw entity highlight
            const screenX = entityUnderMouse.x - this.camera.x;
            const screenY = entityUnderMouse.y - this.camera.y;
            
            this.ctx.save();
            const highlightColor = entityUnderMouse.isHostile ? '#FF6666' : '#66FF66';
            this.ctx.strokeStyle = highlightColor;
            this.ctx.lineWidth = 2;
            this.ctx.setLineDash([3, 3]);
            this.ctx.strokeRect(screenX - 2, screenY - 2, entityUnderMouse.width + 4, entityUnderMouse.height + 4);
            
            // Add glow effect
            this.ctx.fillStyle = `${highlightColor}22`;
            this.ctx.fillRect(screenX - 2, screenY - 2, entityUnderMouse.width + 4, entityUnderMouse.height + 4);
            
            this.ctx.restore();
        } else {
            // Original block highlighting code
            const blockX = Math.floor(worldPos.x / this.world.blockSize);
            const blockY = Math.floor(worldPos.y / this.world.blockSize);
            
            // Check if block is in range
            const distance = Utils.distance(
                this.player.x + this.player.width / 2, this.player.y + this.player.height / 2,
                blockX * this.world.blockSize + this.world.blockSize / 2,
                blockY * this.world.blockSize + this.world.blockSize / 2
            );
            
            if (distance <= 150) { // Only show if in range
                const screenX = blockX * this.world.blockSize - this.camera.x;
                const screenY = blockY * this.world.blockSize - this.camera.y;
                
                // Draw block outline
                this.ctx.save();
                this.ctx.strokeStyle = '#FFFFFF';
                this.ctx.lineWidth = 2;
                this.ctx.setLineDash([5, 5]);
                this.ctx.strokeRect(screenX, screenY, this.world.blockSize, this.world.blockSize);
                
                // Add subtle fill for better visibility
                this.ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
                this.ctx.fillRect(screenX, screenY, this.world.blockSize, this.world.blockSize);
                
                this.ctx.restore();
            }
        }
    }
    
    updateEntityTooltips() {
        const mousePos = this.input.getMousePosition();
        const worldPos = Utils.screenToWorld(mousePos.x, mousePos.y, this.camera);
        
        // Check if mouse is over any entity
        let entityUnderMouse = null;
        
        for (const entity of this.entityManager.entities) {
            if (!entity.alive) continue;
            
            // Check if mouse position is within entity bounds
            if (worldPos.x >= entity.x && worldPos.x <= entity.x + entity.width &&
                worldPos.y >= entity.y && worldPos.y <= entity.y + entity.height) {
                entityUnderMouse = entity;
                break;
            }
        }
          // Update tooltip system
        if (this.tooltips) {
            this.tooltips.updateTooltipForEntity(entityUnderMouse, mousePos.x, mousePos.y);
        }
    }

    start() {
        if (!this.isLoaded) {
            // 🔥 FIXED: Removed debug log for cleaner console output
            setTimeout(() => this.start(), 100);
            return;
        }
        
        // 🔥 FIXED: Removed verbose game loop logging
        this.gameRunning = true;
        this.lastTime = performance.now();
        this.gameLoop(this.lastTime);
        // 🔥 Game loop started
    }

    stop() {
        // 🔥 FIXED: Removed verbose stop logging
        this.gameRunning = false;
    }

    handlePlayerDeath(deathPosition) { // Added deathPosition parameter
        // This method is called from player.js when the player's health reaches 0
        // 🔥 FIXED: Removed debug log for cleaner console output
        this.lastDeathPosition = deathPosition; // Store for respawn
        this.triggerGameOver(this.survivalTime); // MODIFIED: Pass survival time
    }

    triggerGameOver(survivalTime) { // MODIFIED: Accept survivalTime
        // 🔥 FIXED: Removed debug log for cleaner console output
        
        // Stop the game loop
        this.gameRunning = false;
        
        // Play death sound if available
        if (this.sound && typeof this.sound.playPlayerDeath === 'function') {
            this.sound.playPlayerDeath();
        }

        // Show game over screen instead of just a notification
        this.showGameOverScreen(survivalTime); // MODIFIED: Pass survival time

        // After a delay, offer to restart or go to main menu (simplified: restart for now)
        // setTimeout(() => { // MODIFIED: Removed automatic restart
            // For now, just reload the game to restart
            // In a more complex game, you might show a menu
            // this.showGameOverMenu(); 
            // this.restartGame(); 
        // }, 3000); // Wait 3 seconds before restarting // MODIFIED: Removed automatic restart
    }    // Method to show a game over menu (placeholder)
    // showGameOverMenu() { // This function can be removed or repurposed if not used
    //     console.log("Displaying Game Over Menu (placeholder)");
    // }

    showGameOverScreen(survivalTime) { // MODIFIED: Accept survivalTime
        this.removeCommandGuide(); // Ensure command guide is not visible

        // Remove existing game over screen if any
        this.hideGameOverScreen();

        const minutes = Math.floor(survivalTime / 60);
        const seconds = Math.floor(survivalTime % 60);
        const timeString = `${minutes}m ${seconds}s`;

        // Calculate statistics
        const entitiesKilled = this.entityManager?.entitiesKilled || 0;
        const blocksMined = this.player?.blocksMined || 0;
        const blocksPlaced = this.player?.blocksPlaced || 0;
        
        // Calculate distance traveled from spawn
        const spawnX = this.player?.spawnX || 0;
        const spawnY = this.player?.spawnY || 0;
        const currentX = this.player?.x || 0;
        const currentY = this.player?.y || 0;
        const distanceTraveled = Math.floor(Math.sqrt(
            Math.pow(currentX - spawnX, 2) + Math.pow(currentY - spawnY, 2)
        ) / 32); // Convert from pixels to blocks
        
        // Calculate total score
        const totalScore = (entitiesKilled * 50) + (blocksMined * 10) + (blocksPlaced * 5) + Math.floor(survivalTime);        const gameOverScreen = document.createElement('div');
        gameOverScreen.id = 'gameOverScreen';
        gameOverScreen.className = 'game-over-screen'; // For styling
        gameOverScreen.innerHTML = `
            <h1>GAME OVER</h1>
            <p>You Died!</p>
            <div class="game-stats">
                <h3>📊 Game Statistics</h3>
                <div class="stats-grid">
                    <div class="stat-item">
                        <span class="stat-label">⏰ Survival Time:</span>
                        <span class="stat-value">${timeString}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">⛏️ Blocks Mined:</span>
                        <span class="stat-value">${blocksMined}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">🧱 Blocks Placed:</span>
                        <span class="stat-value">${blocksPlaced}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">⚔️ Enemies Killed:</span>
                        <span class="stat-value">${entitiesKilled}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">🚶 Distance Traveled:</span>
                        <span class="stat-value">${distanceTraveled} blocks</span>
                    </div>
                    <div class="stat-item total-score">
                        <span class="stat-label">🏆 Total Score:</span>
                        <span class="stat-value">${totalScore} points</span>
                    </div>
                </div>
            </div>            <button id="retryButton">Retry</button>
        `;
        document.body.appendChild(gameOverScreen);

        const retryButton = document.getElementById('retryButton');
        if (retryButton) {
            retryButton.addEventListener('click', () => {
                this.hideGameOverScreen();
                this.restartGame();
            });
        }
    }

    hideGameOverScreen() {
        const gameOverScreen = document.getElementById('gameOverScreen');
        if (gameOverScreen) {
            gameOverScreen.remove();
        }
    }    // Method to restart the game
    restartGame() {
        // 🔥 FIXED: Removed debug log for cleaner console output
        this.hideGameOverScreen(); // Ensure game over screen is hidden

        // Stop current game loop and reset all timers
        this.gameRunning = false;
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }

        // Clean up resize listener
        if (this.resizeHandler) {
            window.removeEventListener('resize', this.resizeHandler);
        }

        // 1. Clear existing UI elements that might persist or duplicate
        this.clearDynamicUI();
        
        // Fix canvas positioning issues
        this.resetCanvasState();
        
        // Re-add resize listener
        this.resizeHandler = () => this.resizeCanvas();
        window.addEventListener('resize', this.resizeHandler);

        // 2. Reset game state variables
        this.gameRunning = false;
        this.isLoaded = false;
        this.camera = { x: 0, y: 0 };
        this.lastTime = 0;
        this.survivalTime = 0; // MODIFIED: Reset survival time

        // 3. Determine spawn position: near last death or world spawn
        let spawnX, spawnY;
        if (this.lastDeathPosition) {
            // 🔥 FIXED: Removed debug log for cleaner console output
            const safeSpawn = this.findSafeSpawnNear(this.lastDeathPosition.x, this.lastDeathPosition.y);
            spawnX = safeSpawn.x;
            spawnY = safeSpawn.y;
        } else {
            // 🔥 FIXED: Removed debug log for cleaner console output
            spawnX = this.world.width * this.world.blockSize / 2;
            spawnY = this.findSpawnY(spawnX);
        }

        // 4. Re-create the player at the new spawn point
        if (typeof Player === 'undefined') {
            throw new Error('Player class not found for restart');
        }
        this.player = new Player(spawnX, spawnY, this.world); // World should persist or be re-gen if needed

        // 5. Reset entities (or re-initialize EntityManager if it holds state like score)
        if (typeof EntityManager === 'undefined') {
            throw new Error('EntityManager class not found for restart');
        }
        this.entityManager = new EntityManager(); // Clears existing entities

        // 6. Reset other systems as needed (e.g., notifications, time)
        this.notifications = new NotificationSystem();
        this.timeSystem = new TimeSystem(); // Reset time

        // 7. Re-create essential UI
        this.createUI(); // MODIFIED: Re-create the base UI structure
        this.updateUI(); // Ensure UI reflects new player state

        // 8. Hide game over screen / clear notifications if they are modal
        // (Assuming notifications clear themselves or a new one will replace)

        // 9. Start the game again
        this.isLoaded = true; // Mark as loaded to allow start
        this.start();
        // 🔥 FIXED: Removed debug log for cleaner console output
    }

    clearDynamicUI() {
        // Remove elements that are dynamically added and might duplicate on restart
        const elementsToRemove = ['position', 'blockInfo', 'entityCount', 'fps', 'timeDisplay', 'healthBar', 'oxygenBar', 'inventory', 'commandGuideScreen', 'gameOverScreen']; // Added gameOverScreen
        elementsToRemove.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.remove();
        });
        // Also remove the .ui-overlay if it exists
        const uiOverlay = document.querySelector('.ui-overlay');
        if (uiOverlay) uiOverlay.remove();
    }

    findSafeSpawnNear(targetX, targetY, searchRadius = 10, maxAttempts = 20) {
        // 🔥 FIXED: Removed debug log for cleaner console output
        for (let attempt = 0; attempt < maxAttempts; attempt++) {
            // Try a random offset within the search radius
            const offsetX = (Math.random() - 0.5) * 2 * searchRadius * this.world.blockSize;
            const offsetY = (Math.random() - 0.5) * 2 * searchRadius * this.world.blockSize;
            
            let spawnCandidateX = Math.floor((targetX + offsetX) / this.world.blockSize);
            let spawnCandidateY = Math.floor((targetY + offsetY) / this.world.blockSize);

            // Clamp to world boundaries
            spawnCandidateX = Utils.clamp(spawnCandidateX, 0, this.world.width - 1);
            spawnCandidateY = Utils.clamp(spawnCandidateY, 0, this.world.height - 3); // Ensure space for player

            // Check upwards from this candidate Y to find the first non-solid block with solid ground below
            for (let y = spawnCandidateY; y >= 0; y--) {
                const blockAtHead = this.world.getBlock(spawnCandidateX, y);
                const blockAtFeet = this.world.getBlock(spawnCandidateX, y + 1);
                const blockBelowFeet = this.world.getBlock(spawnCandidateX, y + 2);

                // Need 2 air blocks for player height, and solid ground below that
                if (blockAtHead === BlockTypes.AIR && 
                    blockAtFeet === BlockTypes.AIR && 
                    this.world.isSolid(spawnCandidateX, y + 2) &&
                    !this.world.isLiquid(blockBelowFeet) && // Don't spawn on top of liquid
                    !this.world.isLiquid(blockAtFeet) &&
                    !this.world.isLiquid(blockAtHead)) {
                    
                    const finalX = spawnCandidateX * this.world.blockSize;
                    const finalY = y * this.world.blockSize;
                    // 🔥 FIXED: Removed debug log for cleaner console output
                    return { x: finalX, y: finalY };
                }
            }
        }

        // If no safe spot found near death, fallback to world spawn
        console.warn("Could not find safe spawn near death location. Falling back to world spawn.");
        const worldSpawnX = this.world.width * this.world.blockSize / 2;
        const worldSpawnY = this.findSpawnY(worldSpawnX);
        return { x: worldSpawnX, y: worldSpawnY };
    }

    // Utility to clamp camera to world bounds
    clampCamera() {
        this.camera.x = Utils.clamp(this.camera.x, 0, this.world.width * this.world.blockSize - this.canvas.width);
        this.camera.y = Utils.clamp(this.camera.y, 0, this.world.height * this.world.blockSize - this.canvas.height);
    }    resetCanvasState() {
        // Fix canvas positioning and dimension issues that might occur on restart
        if (this.canvas) {
            // Reset canvas transform and clear any offset issues
            this.ctx.setTransform(1, 0, 0, 1, 0, 0);
            
            // Ensure canvas is properly sized to fullscreen
            this.resizeCanvas();
            
            // Reset any CSS transforms that might have been applied
            this.canvas.style.transform = '';
            this.canvas.style.position = 'fixed';
            this.canvas.style.left = '0';
            this.canvas.style.top = '0';
        }
    }
}

// Notification system for game events
class NotificationSystem {
    constructor() {
        this.notifications = [];
        this.container = null;
        this.createContainer();
        
        // Anti-spam system
        this.notificationCooldowns = new Map(); // Track cooldowns for specific message types
        this.defaultCooldown = 1000; // 1 second default cooldown between similar notifications
    }
    
    createContainer() {
        this.container = document.createElement('div');
        this.container.className = 'notifications';
        this.container.style.cssText = `
            position: absolute;
            top: 80px;
            right: 10px;
            z-index: 1000;
            display: flex;
            flex-direction: column;
            gap: 5px;
            pointer-events: none;
        `;
        document.body.appendChild(this.container);
    }
      addNotification(message, type = 'info', duration = 3000) {
        // Anti-spam: Check if we recently showed a similar notification
        const messageKey = `${type}_${message.substring(0, 30)}`; // Use first 30 chars as key
        const now = Date.now();
        
        if (this.notificationCooldowns.has(messageKey)) {
            const lastShown = this.notificationCooldowns.get(messageKey);
            if (now - lastShown < this.defaultCooldown) {
                return; // Skip this notification to prevent spam
            }
        }
        
        // Update cooldown timestamp
        this.notificationCooldowns.set(messageKey, now);
        
        // Clean up old cooldown entries (older than 5 seconds)
        for (const [key, timestamp] of this.notificationCooldowns.entries()) {
            if (now - timestamp > 5000) {
                this.notificationCooldowns.delete(key);
            }
        }
        
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
        const colors = {
            info: '#00BFFF',
            success: '#00FF00',
            warning: '#FFA500',
            error: '#FF0000',
            combat: '#FF69B4'
        };
        
        notification.style.cssText = `
            background: rgba(0, 0, 0, 0.8);
            color: ${colors[type] || colors.info};
            padding: 8px 12px;
            border-radius: 4px;
            font-size: 12px;
            font-weight: bold;
            text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8);
            opacity: 0;
            transform: translateX(50px);
            transition: all 0.3s ease;
            border-left: 3px solid ${colors[type] || colors.info};
        `;
        
        this.container.appendChild(notification);
        
        // Animate in
        setTimeout(() => {
            notification.style.opacity = '1';
            notification.style.transform = 'translateX(0)';
        }, 10);
        
        // Animate out and remove
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transform = 'translateX(50px)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, duration);
    }
}

// Tooltip system for game elements
class TooltipSystem {
    constructor() {
        this.tooltip = null;
        this.createTooltip();
    }
    
    createTooltip() {
        this.tooltip = document.createElement('div');
        this.tooltip.className = 'game-tooltip';
        this.tooltip.style.cssText = `
            position: absolute;
            background: rgba(0, 0, 0, 0.9);
            color: white;
            padding: 8px 12px;
            border-radius: 4px;
            font-size: 12px;
            font-weight: bold;
            z-index: 1000;
            pointer-events: none;
            visibility: hidden;
            opacity: 0;
            transition: opacity 0.2s;
            border: 1px solid #666;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
        `;
        document.body.appendChild(this.tooltip);
    }
    
    showTooltip(text, x, y) {
        this.tooltip.textContent = text;
        this.tooltip.style.left = x + 'px';
        this.tooltip.style.top = (y - 40) + 'px';
        this.tooltip.style.visibility = 'visible';
        this.tooltip.style.opacity = '1';
    }
    
    hideTooltip() {
        this.tooltip.style.visibility = 'hidden';
        this.tooltip.style.opacity = '0';
    }
    
    updateTooltipForEntity(entity, mouseX, mouseY) {
        if (!entity) {
            this.hideTooltip();
            return;
        }
        
        const healthPercent = Math.round((entity.health / entity.maxHealth) * 100);
        const status = entity.isHostile ? 'Hostile' : 'Peaceful';
        const tooltipText = `${entity.type.toUpperCase()} - ${status}\nHealth: ${entity.health}/${entity.maxHealth} (${healthPercent}%)`;
        
        this.showTooltip(tooltipText, mouseX, mouseY);
    }
}

// Time and day/night cycle system
class TimeSystem {
    constructor() {
        this.dayLength = 300; // 5 minutes per full cycle
        this.timeSpeed = 0.7; // Progression speed
        
        // Start at random time for game variety
        const randomStartTime = Math.random() * this.dayLength;
        this.gameTime = randomStartTime;
        
        // 🔥 FIXED: Removed debug log for cleaner console output
    }
    
    update(deltaTime) {
        this.gameTime += deltaTime * this.timeSpeed;
    }
    
    getDayProgress() {
        return (this.gameTime % this.dayLength) / this.dayLength;
    }
    
    isDay() {
        const hour = this.getDayProgress() * 24;
        return hour >= 6 && hour < 19; // Day from 6:00 to 19:00 (13 hours)
    }
    
    isNight() {
        return !this.isDay();
    }
    
    isSunrise() {
        const hour = this.getDayProgress() * 24;
        return hour >= 5 && hour < 7; // Sunrise transition
    }
    
    isSunset() {
        const hour = this.getDayProgress() * 24;
        return hour >= 18 && hour < 20; // Sunset transition
    }
    
    getSkyColor() {
        const hour = this.getDayProgress() * 24;
        
        if (hour >= 5 && hour < 7) {
            // Sunrise - warm orange to blue
            const progress = (hour - 5) / 2; // 0 to 1 over 2 hours
            const r = Math.floor(Utils.lerp(255, 135, progress));
            const g = Math.floor(Utils.lerp(165, 206, progress));
            const b = Math.floor(Utils.lerp(0, 235, progress));
            return `rgb(${r}, ${g}, ${b})`;
        } else if (hour >= 6 && hour < 18) {
            // Day - bright blue
            return '#87CEEB';
        } else if (hour >= 18 && hour < 20) {
            // Sunset - blue to warm orange
            const progress = (hour - 18) / 2; // 0 to 1 over 2 hours
            const r = Math.floor(Utils.lerp(135, 255, progress));
            const g = Math.floor(Utils.lerp(206, 165, progress));
            const b = Math.floor(Utils.lerp(235, 0, progress));
            return `rgb(${r}, ${g}, ${b})`;
        } else {
            // Night - dark blue gradient
            const midnightDist = Math.abs(12 - (hour > 12 ? hour - 12 : hour + 12)) / 12;
            const r = Math.floor(10 + midnightDist * 30);
            const g = Math.floor(15 + midnightDist * 35);
            const b = Math.floor(35 + midnightDist * 55);
            return `rgb(${r}, ${g}, ${b})`;
        }
    }
    
    getTimeString() {
        const progress = this.getDayProgress();
        const hours = Math.floor(progress * 24);
        const minutes = Math.floor((progress * 24 * 60) % 60);
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    }
    
    // Get lighting level for rendering (0.0 = dark, 1.0 = bright)
    getLightLevel() {
        const hour = this.getDayProgress() * 24;
        
        if (hour >= 7 && hour < 18) {
            // Full daylight (7:00 - 18:00)
            return 1.0;
        } else if (hour >= 6 && hour < 7) {
            // Dawn transition (6:00 - 7:00) - gradual brightening
            const progress = hour - 6;
            return Utils.lerp(0.2, 1.0, progress);
        } else if (hour >= 18 && hour < 19) {
            // Dusk transition (18:00 - 19:00) - gradual darkening
            const progress = hour - 18;
            return Utils.lerp(1.0, 0.2, progress);
        } else {
            // Night (19:00 - 6:00) - low light level
            return 0.15; // Slightly brighter for better torch contrast
        }
    }
}

// 🎵 AUDIO SETTINGS PANEL CLASS - Advanced sound configuration UI
class AudioSettingsPanel {    constructor(soundSystem) {
        console.log('AudioSettingsPanel constructor called with:', soundSystem);
        this.soundSystem = soundSystem;
        this.panel = null;
        this.overlay = null;
        this.isVisible = false;
        
        try {
            this.createPanel();
            this.bindEvents();
            console.log('AudioSettingsPanel initialized successfully');
            console.log('Panel created:', !!this.panel);
            console.log('Overlay created:', !!this.overlay);
            console.log('Overlay in DOM:', document.body.contains(this.overlay));
        } catch (error) {
            console.error('Error initializing AudioSettingsPanel:', error);
        }
    }
      createPanel() {
        // Create overlay
        this.overlay = document.createElement('div');
        this.overlay.className = 'audio-settings-overlay';
        
        // Create panel
        this.panel = document.createElement('div');
        this.panel.className = 'audio-settings-panel';
        
        this.panel.innerHTML = `
            <div class="audio-settings-header">
                <h2>🎵 Audio Settings</h2>
                <button class="close-button" type="button">×</button>
            </div>
            
            <div class="audio-settings-content">
                <div class="audio-category">
                    <div class="category-header">
                        <span class="category-title">🔊 Master Volume</span>
                    </div>
                    <div class="category-controls">
                        <input type="range" class="volume-slider" id="masterVolume" 
                               min="0" max="1" step="0.01" value="${this.soundSystem.volume}">
                        <span class="volume-value">${Math.round(this.soundSystem.volume * 100)}%</span>
                    </div>
                </div>
                
                ${this.generateCategoryHTML()}
            </div>
            
            <div class="audio-settings-footer">
                <button class="reset-button" type="button">🔄 Reset to Defaults</button>
                <button class="save-button" type="button">💾 Save Settings</button>
            </div>
        `;
        
        this.overlay.appendChild(this.panel);
        document.body.appendChild(this.overlay);
    }
    
    generateCategoryHTML() {
        return Object.keys(this.soundSystem.audioCategories).map(categoryKey => {
            const category = this.soundSystem.audioCategories[categoryKey];
            const volumePercent = Math.round(category.volume * 100);
            
            return `
                <div class="audio-category">
                    <div class="category-header">
                        <label class="category-toggle">
                            <input type="checkbox" ${category.enabled ? 'checked' : ''} 
                                   data-category="${categoryKey}">
                            <span class="category-title">${category.name}</span>
                        </label>
                    </div>
                    <div class="category-controls">
                        <input type="range" class="volume-slider" 
                               data-category="${categoryKey}"
                               min="0" max="1" step="0.01" 
                               value="${category.volume}"
                               ${!category.enabled ? 'disabled' : ''}>
                        <span class="volume-value">${volumePercent}%</span>
                    </div>
                </div>
            `;
        }).join('');
    }
    
    bindEvents() {
        // Close button
        this.panel.querySelector('.close-button').addEventListener('click', () => {
            this.hide();
        });
        
        // Overlay click to close
        this.overlay.addEventListener('click', (e) => {
            if (e.target === this.overlay) {
                this.hide();
            }
        });
        
        // ESC key to close
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isVisible) {
                this.hide();
            }
        });
        
        // Master volume control
        const masterVolumeSlider = this.panel.querySelector('#masterVolume');
        masterVolumeSlider.addEventListener('input', (e) => {
            const volume = parseFloat(e.target.value);
            this.soundSystem.volume = volume;
            this.updateVolumeDisplay(e.target.nextElementSibling, volume);
        });
        
        // Category toggles
        this.panel.addEventListener('change', (e) => {
            if (e.target.type === 'checkbox' && e.target.dataset.category) {
                const category = e.target.dataset.category;
                const enabled = e.target.checked;
                
                this.soundSystem.toggleCategory(category, enabled);
                
                // Enable/disable corresponding volume slider
                const slider = this.panel.querySelector(`input[type="range"][data-category="${category}"]`);
                if (slider) {
                    slider.disabled = !enabled;
                }
            }
        });
        
        // Volume sliders
        this.panel.addEventListener('input', (e) => {
            if (e.target.type === 'range' && e.target.dataset.category) {
                const category = e.target.dataset.category;
                const volume = parseFloat(e.target.value);
                
                this.soundSystem.setCategoryVolume(category, volume);
                this.updateVolumeDisplay(e.target.nextElementSibling, volume);
            }
        });
        
        // Reset button
        this.panel.querySelector('.reset-button').addEventListener('click', () => {
            this.resetToDefaults();
        });
        
        // Save button
        this.panel.querySelector('.save-button').addEventListener('click', () => {
            this.soundSystem.saveAudioSettings();
            this.showSaveConfirmation();
        });
    }
    
    updateVolumeDisplay(element, volume) {
        if (element && element.classList.contains('volume-value')) {
            element.textContent = `${Math.round(volume * 100)}%`;
        }
    }
      resetToDefaults() {
        // Reset to default values - ✅ FIXED: Updated to higher, more audible defaults
        this.soundSystem.volume = 0.4;
        
        const defaults = {
            music: { enabled: true, volume: 0.15 },
            playerActions: { enabled: true, volume: 0.08 },
            blockInteractions: { enabled: true, volume: 0.2 },
            combat: { enabled: true, volume: 0.25 },
            environmental: { enabled: true, volume: 0.15 },
            ui: { enabled: true, volume: 0.2 }
        };
        
        Object.keys(defaults).forEach(category => {
            this.soundSystem.setCategoryVolume(category, defaults[category].volume);
            this.soundSystem.toggleCategory(category, defaults[category].enabled);
        });
        
        // Update UI
        this.refreshUI();
        
        // Show confirmation
        this.showResetConfirmation();
    }
    
    refreshUI() {
        // Update master volume
        const masterSlider = this.panel.querySelector('#masterVolume');
        const masterValue = this.panel.querySelector('#masterVolume + .volume-value');
        masterSlider.value = this.soundSystem.volume;
        this.updateVolumeDisplay(masterValue, this.soundSystem.volume);
        
        // Update category controls
        Object.keys(this.soundSystem.audioCategories).forEach(categoryKey => {
            const category = this.soundSystem.audioCategories[categoryKey];
            
            // Update checkbox
            const checkbox = this.panel.querySelector(`input[type="checkbox"][data-category="${categoryKey}"]`);
            if (checkbox) {
                checkbox.checked = category.enabled;
            }
            
            // Update slider
            const slider = this.panel.querySelector(`input[type="range"][data-category="${categoryKey}"]`);
            const valueDisplay = slider ? slider.nextElementSibling : null;
            
            if (slider) {
                slider.value = category.volume;
                slider.disabled = !category.enabled;
                this.updateVolumeDisplay(valueDisplay, category.volume);
            }
        });
    }
    
    showSaveConfirmation() {
        const saveButton = this.panel.querySelector('.save-button');
        const originalText = saveButton.textContent;
        
        saveButton.textContent = '✅ Saved!';
        saveButton.style.backgroundColor = '#4CAF50';
        
        setTimeout(() => {
            saveButton.textContent = originalText;
            saveButton.style.backgroundColor = '';
        }, 1500);
    }
    
    showResetConfirmation() {
        const resetButton = this.panel.querySelector('.reset-button');
        const originalText = resetButton.textContent;
        
        resetButton.textContent = '✅ Reset!';
        resetButton.style.backgroundColor = '#ff9800';
          setTimeout(() => {
            resetButton.textContent = originalText;
            resetButton.style.backgroundColor = '';
        }, 1500);
    }
      show() {
        console.log('AudioSettingsPanel.show() called');
        
        // Debug panel state
        console.log('Panel exists:', !!this.panel);
        console.log('Overlay exists:', !!this.overlay);
        
        if (!this.overlay || !this.panel) {
            console.error('Panel or overlay not created!');
            return;
        }
        
        // Check if overlay is in DOM
        if (!document.body.contains(this.overlay)) {
            console.log('Overlay not in DOM, re-adding...');
            document.body.appendChild(this.overlay);
        }
        
        this.refreshUI();
        this.overlay.classList.add('show');
        this.isVisible = true;
        
        // Debug final state
        console.log('Show completed. Classes:', this.overlay.className);
        console.log('Computed display:', window.getComputedStyle(this.overlay).display);
        console.log('Computed opacity:', window.getComputedStyle(this.overlay).opacity);
    }
    
    hide() {
        this.overlay.classList.remove('show');
        setTimeout(() => {
            this.isVisible = false;
        }, 300);
    }
      toggle() {
        console.log('AudioSettingsPanel.toggle() called, isVisible:', this.isVisible);
        
        if (!this.overlay || !this.panel) {
            console.error('Cannot toggle: Panel or overlay not created!');
            return;
        }
        
        if (this.isVisible) {
            this.hide();
        } else {
            this.show();
        }
    }
}

// Initialize and start the game when the page loads
document.addEventListener('DOMContentLoaded', () => {
    // 🔥 FIXED: Removed debug log for cleaner console output
    
    // Add a small delay to ensure all scripts are fully loaded
    setTimeout(() => {
        try {
            const game = new MinecraftGame();
            // game.start() is now called automatically after initialization
        } catch (error) {
            console.error('Failed to start game:', error);
            
            // Show error message to user
            const loadingScreen = document.getElementById('loadingScreen');
            if (loadingScreen) {
                const loadingText = loadingScreen.querySelector('p');
                if (loadingText) {
                    loadingText.textContent = 'Errore durante il caricamento del gioco. Ricarica la pagina.';
                    loadingText.style.color = '#ff6b6b';
                }
            }
        }
    }, 100); // 100ms delay
});