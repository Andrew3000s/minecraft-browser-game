// Player system for Minecraft browser game

class Player {
    constructor(x, y, world) {
        this.x = x;
        this.y = y;
        this.width = 24;
        this.height = 48;
        this.world = world;
        
        // Physics
        this.velocityX = 0;
        this.velocityY = 0;
        this.speed = 150; // pixels per second
        this.jumpPower = 400;
        this.gravity = 800;
        this.onGround = false;
        this.inWater = false;
        this.inLiquid = false;
        this.isDiving = false;
        this.isSwimming = false;
        
        // Oxygen system
        this.oxygen = 100;
        this.maxOxygen = 100;
        this.oxygenDepletionRate = 10; // O2 per second underwater
        this.oxygenRecoveryRate = 30; // O2 per second when not underwater
        this.lowOxygenDamageRate = 2; // damage per second when O2 is 0
        this.lastOxygenDamageTime = 0;
        
        // Game properties
        this.health = 20;
        this.maxHealth = 20;
        // this.inventory = {
        //     \'DIRT\': Infinity,
        //     \'STONE\': Infinity,
        //     \'WOOD\': Infinity,
        //     \'LEAVES\': Infinity,
        //     \'GRASS\': Infinity,
        //     \'SAND\': Infinity,
        //     \'WATER_BUCKET\': 1, // Example starting item
        //     \'TORCH\': 16 // Added Torch to starting inventory
        // };
        this.inventory = this.initializeInventory(); // Use method for array-based slot inventory
        this.activeSlot = 0;
        this.inventorySlots = 9; // Number of inventory slots
        
        // NEW: Separate materials inventory for crafting (from mob drops)
        this.maxMaterialsSlots = 48; // MOVED UP: Must be set before initializing materialsInventory
        this.materialsInventory = this.initializeMaterialsInventory();
        
        // Player statistics for Game Over screen
        this.blocksMined = 0;
        this.blocksPlaced = 0;
        this.mobsKilled = 0;
        this.distanceTraveled = 0;
        this.lastPosition = { x: this.x, y: this.y };
        
        // Mining
        this.miningProgress = 0;
        this.miningBlock = null;
        this.miningSpeed = 1.0;
        
        // Animation
        this.facing = 1; // 1 for right, -1 for left
        this.animationFrame = 0;
        this.animationTime = 0;
        
        // Action animations
        this.isMining = false;
        this.isAttacking = false;
        this.isPlacing = false;
        this.actionAnimationTime = 0;
        this.actionAnimationDuration = 300; // 300ms for action animations
        this.placingAnimationDuration = 400; // Slightly longer for placing animation
        
        // Combat properties
        this.attackDamage = 5;
        this.attackRange = 50;
        this.lastAttackTime = 0;
        this.attackCooldown = 500; // 0.5 seconds between attacks
        
        // Damage animation system
        this.isDamaged = false;
        this.damageAnimationTime = 0;
        this.damageAnimationDuration = 600; // 600ms damage flash animation
        this.damageFlashInterval = 100; // Flash every 100ms during damage animation
        this.damageShakeIntensity = 3; // Pixel shake intensity
        
        // Visual damage system based on health percentage
        this.damageLevel = 0; // 0 = no damage, 1-4 = increasing damage levels
        this.lastHealthPercentage = 100;
        
        // Initialize damage level based on starting health
        this.updateDamageLevel();
        
        // Liquid damage tracking
        this.lastLiquidDamageTime = null;
        
        // Swimming and oxygen system
        this.inLiquid = false;
        this.isSwimming = false;
        this.isDiving = false;
        this.oxygen = 100;
        this.maxOxygen = 100;
        this.oxygenDepletionRate = 10; // O2/second underwater
        this.oxygenRecoveryRate = 20; // O2/second above water
        this.lowOxygenDamageRate = 1; // Damage per second when O2 = 0
        this.lastOxygenDamageTime = 0;
        this.lastLowOxygenWarning = 0;
    }

    initializeInventory() {
        const inventory = new Array(this.inventorySlots).fill(null);

        // Slot 0: Diamond Pickaxe
        inventory[0] = { type: BlockTypes.DIAMOND_PICKAXE, count: 1 };

        // Slot 1: Torches (reduced from 64 to 6)
        inventory[1] = { type: BlockTypes.TORCH, count: 6 };

        // Slot 2: Dirt (reduced from 64 to 6)
        inventory[2] = { type: BlockTypes.DIRT, count: 6 };
        
        // Slot 3: Stone (reduced from 64 to 6)
        inventory[3] = { type: BlockTypes.STONE, count: 6 };

        // Slot 4: Wood (reduced from 64 to 6)
        inventory[4] = { type: BlockTypes.WOOD, count: 6 };
        
        // Slot 5: Sand (reduced from 64 to 6)
        inventory[5] = { type: BlockTypes.SAND, count: 6 };
        
        // Slot 6: Grass (reduced from 64 to 6)
        inventory[6] = { type: BlockTypes.GRASS, count: 6 };
        
        // Slot 7: Leaves (reduced from 64 to 6)
        inventory[7] = { type: BlockTypes.LEAVES, count: 6 };
        
        // Slot 8: Coal Ore (reduced from 32 to 6)
        inventory[8] = { type: BlockTypes.COAL_ORE, count: 6 };

        return inventory;
    }

    initializeMaterialsInventory() {
        // Initialize empty materials inventory for mob drops
        return new Array(this.maxMaterialsSlots).fill(null);
    }

    update(deltaTime, input) {
        // Store previous position for distance calculation
        const prevX = this.x;
        const prevY = this.y;
        
        this.handleInput(input, deltaTime);
        this.updatePhysics(deltaTime);
        this.updateAnimation(deltaTime);
        this.updateDamageAnimation(deltaTime); // Add damage animation update
        this.checkLiquidStatus();
        this.updateOxygen(deltaTime); // Ensure this is called every frame
        
        // Update distance traveled
        const deltaX = this.x - prevX;
        const deltaY = this.y - prevY;
        const distanceMoved = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        this.distanceTraveled += distanceMoved;
    }

    handleInput(input, deltaTime) {
        // Input handling without debug logging
        
        const movement = input.getMovementInput();
        
        // Check diving state
        this.isDiving = input.isDiving();
        
        // 🌊 Sistema avanzato di fisica dei fluidi per il player
        if (this.inLiquid) {
            this.handleAdvancedFluidMovement(movement, deltaTime);
        } else {
            this.handleNormalMovement(movement, deltaTime);
        }
        
        // Jumping (only when on ground or if in a liquid to allow jumping out)
        if (input.isJumping() && (this.onGround || this.inLiquid)) {
            this.velocityY = -this.jumpPower;
            this.onGround = false;
            
            if (this.inLiquid && window.game?.particles) {
                // Splash effect when jumping out of liquid
                window.game.particles.addWaterSplash(this.x + this.width / 2, this.y + this.height);
            }
        }

        // 🔥 CRITICAL FIX: Handle mouse clicks for mining and placing
        // Handle left click for mining OR combat
        if (input.isMouseLeftPressed()) {
            const mousePos = input.getMousePosition();
            
            // Check if we're targeting an entity first (for combat)
            const worldPos = Utils.screenToWorld(mousePos.x, mousePos.y, window.game.camera);
            let entityUnderMouse = null;
            
            if (window.game?.entityManager) {
                for (const entity of window.game.entityManager.entities) {
                    if (!entity.alive) continue;
                    
                    if (worldPos.x >= entity.x && worldPos.x <= entity.x + entity.width &&
                        worldPos.y >= entity.y && worldPos.y <= entity.y + entity.height) {
                        entityUnderMouse = entity;
                        break;
                    }
                }
            }
            
            if (entityUnderMouse) {
                // Combat: attacking an entity
                this.handleCombat(mousePos);
            } else {
                // Mining: no entity under mouse, try to mine block
                this.handleMining(mousePos, deltaTime);
            }
        } else {
            // Reset mining when not clicking
            if (this.miningBlock) {
                this.miningProgress = 0;
                this.miningBlock = null;
                this.isMining = false;
            }
        }

        // Handle right click for placing
        if (input.isMouseRightPressed()) {
            const mousePos = input.getMousePosition();
            this.handlePlacing(mousePos);
        }
    }

    // 🌊 Gestione movimento avanzato nei fluidi
    handleAdvancedFluidMovement(movement, deltaTime) {
        this.isSwimming = true;
        
        // Ottieni proprietà del fluido corrente
        const fluidProps = this.getFluidProperties();
        if (!fluidProps) {
            // Fallback al sistema base
            this.handleBasicFluidMovement(movement, deltaTime);
            return;
        }
        
        // Calcola resistenza al movimento basata su viscosità
        const viscosityFactor = Math.min(fluidProps.viscosity / 1000, 0.9);
        const speedMultiplier = 1.0 - viscosityFactor;
        
        // Movimento orizzontale nel fluido
        if (movement.x !== 0) {
            this.velocityX = movement.x * this.speed * speedMultiplier;
            this.facing = movement.x > 0 ? 1 : -1;
        } else {
            // Attrito aumentato basato su viscosità
            this.velocityX *= (0.8 - viscosityFactor * 0.3);
        }
        
        // Movimento verticale nel fluido
        if (movement.y !== 0) {
            this.velocityY = movement.y * this.speed * speedMultiplier * 0.7;
        } else if (!this.isDiving) {
            // Galleggiamento basato su densità del fluido
            const buoyancyForce = this.calculateBuoyancy(fluidProps);
            this.velocityY += buoyancyForce * deltaTime;
        }
        
        // Immersione con Ctrl
        if (this.isDiving) {
            const sinkRate = 100 * (1 + viscosityFactor);
            this.velocityY = Math.min(this.velocityY + sinkRate * deltaTime, 100);
        }
        
        // Effetti di corrente
        this.applyFluidCurrents(deltaTime);
        
        // Gravità ridotta nel fluido
        this.gravity = 200 * (1 - fluidProps.density / 3000);
    }

    // 🏊 Movimento base nei fluidi (fallback)
    handleBasicFluidMovement(movement, deltaTime) {
        this.isSwimming = true;
        
        // Horizontal movement in liquid (slower)
        if (movement.x !== 0) {
            this.velocityX = movement.x * this.speed * 0.6; // 60% speed in liquid
            this.facing = movement.x > 0 ? 1 : -1;
        } else {
            this.velocityX *= 0.9; // Higher friction in liquid
        }
        
        // Vertical movement in liquid
        if (movement.y !== 0) {
            this.velocityY = movement.y * this.speed * 0.5; // Slower vertical movement
        } else if (!this.isDiving) {
            // Float to surface when not diving
            this.velocityY = Math.max(this.velocityY - 50 * deltaTime, -30);
        }
        
        // Diving with Ctrl
        if (this.isDiving) {
            this.velocityY = Math.min(this.velocityY + 100 * deltaTime, 100);
        }
        
        // Reduce gravity in liquid
        this.gravity = 200;
    }

    // 🚶 Movimento normale (fuori dai fluidi)
    handleNormalMovement(movement, deltaTime) {
        this.isSwimming = false;
        this.gravity = 800; // Normal gravity
        
        // Normal horizontal movement
        if (movement.x !== 0) {
            this.velocityX = movement.x * this.speed;
            this.facing = movement.x > 0 ? 1 : -1;
        } else {
            this.velocityX *= 0.8; // Friction
        }
    }

    // 🌊 Ottieni proprietà del fluido in cui si trova il player
    getFluidProperties() {
        if (!this.world?.advancedFluidPhysics) return null;
        
        const playerBlockX = Math.floor((this.x + this.width / 2) / this.world.blockSize);
        const playerBlockY = Math.floor((this.y + this.height / 2) / this.world.blockSize);
        
        const blockType = this.world.getBlock(playerBlockX, playerBlockY);
        return this.world.advancedFluidPhysics.getFluidProperties(blockType);
    }

    // ⚖️ Calcola forza di galleggiamento
    calculateBuoyancy(fluidProps) {
        // Forza di galleggiamento: F = ρ_fluid * V_submerged * g
        // Semplificata per il gioco
        const playerDensity = 985; // kg/m³ (corpo umano in acqua)
        const densityDifference = fluidProps.density - playerDensity;
        
        // Galleggiamento positivo (sale) se il fluido è più denso
        // Galleggiamento negativo (affonda) se il fluido è meno denso
        const buoyancyForce = (densityDifference / 1000) * 50; // Scala per il gioco
        
        return Math.max(-100, Math.min(100, buoyancyForce));
    }

    // 🌊 Applica effetti delle correnti fluide
    applyFluidCurrents(deltaTime) {
        if (!this.world?.advancedFluidPhysics) return;
        
        const playerBlockX = Math.floor((this.x + this.width / 2) / this.world.blockSize);
        const playerBlockY = Math.floor((this.y + this.height / 2) / this.world.blockSize);
        
        // Ottieni corrente locale
        const current = this.world.advancedFluidPhysics.getCurrentAt(playerBlockX, playerBlockY);
        if (!current) return;
        
        // Applica forza della corrente
        const currentForceX = Math.cos(current.direction) * current.strength * deltaTime;
        const currentForceY = Math.sin(current.direction) * current.strength * deltaTime;
        
        this.velocityX += currentForceX;
        this.velocityY += currentForceY;
        
        // Limita velocità massima causata dalle correnti
        const maxCurrentVelocity = 150;
        if (Math.abs(this.velocityX) > maxCurrentVelocity) {
            this.velocityX = Math.sign(this.velocityX) * maxCurrentVelocity;
        }
        if (Math.abs(this.velocityY) > maxCurrentVelocity) {
            this.velocityY = Math.sign(this.velocityY) * maxCurrentVelocity;
        }
    }

    updatePhysics(deltaTime) {
        // Apply gravity
        // if (!this.inWater) { // OLD condition based on head in water
        //     this.velocityY += this.gravity * deltaTime;
        // } else {
        //     this.velocityY *= 0.9; // Water resistance
        //     if (this.velocityY > 50) this.velocityY = 50; // Terminal velocity in water
        // }

        // Apply gravity and liquid physics adjustments
        if (this.inLiquid) {
            // Gravity value (e.g., 200 for liquid) is set in handleInput based on inLiquid
            this.velocityY += this.gravity * deltaTime; 

            // Liquid resistance and terminal velocity for vertical movement
            this.velocityY *= 0.9; // Resistance factor (can be tuned)
            const terminalVelocityInLiquid = 60; // pixels/sec (can be tuned)
            if (this.velocityY > terminalVelocityInLiquid) {
                this.velocityY = terminalVelocityInLiquid;
            }
            // Note: Upward movement/buoyancy is primarily handled in handleInput
        } else {
            // Gravity value (e.g., 800 for air) is set in handleInput based on !inLiquid
            this.velocityY += this.gravity * deltaTime; // Normal gravity
        }
        
        // Move horizontally
        const newX = this.x + this.velocityX * deltaTime;
        if (!this.checkCollision(newX, this.y)) {
            this.x = newX;
        } else {
            this.velocityX = 0;
        }
        
        // Move vertically
        const newY = this.y + this.velocityY * deltaTime;
        if (!this.checkCollision(this.x, newY)) {
            this.y = newY;
            this.onGround = false;
        } else {
            if (this.velocityY > 0) {
                this.onGround = true;
            }
            this.velocityY = 0;
        }
        
        // Keep player in world bounds
        this.x = Utils.clamp(this.x, 0, this.world.width * this.world.blockSize - this.width);
        this.y = Utils.clamp(this.y, 0, this.world.height * this.world.blockSize - this.height);
    }

    checkCollision(x, y) {
        const collisionBoxes = this.world.getCollisionBoxes(x, y, this.width, this.height);
        return collisionBoxes.length > 0;
    }

    checkLiquidStatus() {
        const playerFootX = Math.floor((this.x + this.width / 2) / this.world.blockSize);
        const playerFootY = Math.floor((this.y + this.height) / this.world.blockSize); // Check at player's feet
        const playerHeadX = Math.floor((this.x + this.width / 2) / this.world.blockSize);
        const playerHeadY = Math.floor(this.y / this.world.blockSize); // Check at player's head

        const blockAtFeet = this.world.getBlock(playerFootX, playerFootY);
        const blockAtHead = this.world.getBlock(playerHeadX, playerHeadY);

        const wasInWater = this.inWater;
        
        // Player is in water if their head is in water (for oxygen purposes)
        this.inWater = blockAtHead === BlockTypes.WATER;
        // Player is in some liquid if either feet or head are in a liquid (for physics and other effects)
        this.inLiquid = [BlockTypes.WATER, BlockTypes.LAVA, BlockTypes.ACID].includes(blockAtFeet) || 
                        [BlockTypes.WATER, BlockTypes.LAVA, BlockTypes.ACID].includes(blockAtHead);

        // Water splash effect when entering water (feet based)
        if (!wasInWater && blockAtFeet === BlockTypes.WATER && window.game?.sound && window.game?.particles) {
            window.game.sound.playWaterSplash();
            window.game.particles.addWaterSplash(this.x + this.width / 2, this.y + this.height);
        }
        
        // Damage from dangerous liquids (feet based for now, can be expanded)
        const now = Date.now();
        const dangerousLiquidAtFeet = blockAtFeet === BlockTypes.LAVA || blockAtFeet === BlockTypes.ACID;
        // Optional: Consider if head in dangerous liquid should also cause damage
        // const dangerousLiquidAtHead = blockAtHead === BlockTypes.LAVA || blockAtHead === BlockTypes.ACID;

        if (dangerousLiquidAtFeet) {
            if (!this.lastLiquidDamageTime || now - this.lastLiquidDamageTime > 500) {
                const damageAmount = blockAtFeet === BlockTypes.LAVA ? 4 : 2;
                const liquidName = blockAtFeet === BlockTypes.LAVA ? "lava" : "acid";
                
                this.takeDamage(damageAmount);
                this.lastLiquidDamageTime = now;
                
                if (window.game?.notifications) {
                    window.game.notifications.addNotification(
                        `🔥 Taking damage from ${liquidName}! Get out!`,
                        'warning',
                        2000
                    );
                }
                
                if (window.game?.particles) {
                    window.game.particles.addDamageEffect(
                        this.x + this.width / 2, 
                        this.y + this.height / 2
                    );
                }
            }
        } else {
            this.lastLiquidDamageTime = null;
        }
    }

    updateOxygen(deltaTime) {
        const now = Date.now();
        if (this.inWater) { // Oxygen depletes if head is in water
            this.oxygen -= this.oxygenDepletionRate * deltaTime;
            if (this.oxygen < 0) this.oxygen = 0;

            if (this.oxygen === 0) {
                if (now - this.lastOxygenDamageTime > 1000) { // Damage every 1 second
                    this.takeDamage(this.lowOxygenDamageRate); 
                    this.lastOxygenDamageTime = now;
                    if (window.game?.notifications) {
                        window.game.notifications.addNotification(
                            'Drowning! Low oxygen!',
                            'danger',
                            1500
                        );
                    }
                     // Add visual/audio cues for drowning if desired
                    if (window.game?.sound) {
                        window.game.sound.playPlayerDamage(); // Generic damage sound
                    }
                }
            } else if (this.oxygen < 30 && now - this.lastLowOxygenWarning > 5000) { // Warn every 5 seconds if oxygen is low
                if (window.game?.notifications) {
                    window.game.notifications.addNotification(
                        'Oxygen critical!',
                        'warning',
                        3000
                    );
                }
                this.lastLowOxygenWarning = now;
            }
        } else {
            // Recover oxygen if not in water (head not submerged)
            if (this.oxygen < this.maxOxygen) {
                this.oxygen += this.oxygenRecoveryRate * deltaTime;
                if (this.oxygen > this.maxOxygen) this.oxygen = this.maxOxygen;
            }
        }
    }

    updateAnimation(deltaTime) {
        this.animationTime += deltaTime;
        if (Math.abs(this.velocityX) > 10) {
            this.animationFrame = Math.floor(this.animationTime * 8) % 4;
        } else {
            this.animationFrame = 0;
        }

        // Update action animations
        if (this.isMining || this.isAttacking || this.isPlacing) {
            this.actionAnimationTime += deltaTime * 1000; // Convert to milliseconds
            
            const currentDuration = this.isPlacing ? this.placingAnimationDuration : this.actionAnimationDuration;
            
            if (this.actionAnimationTime >= currentDuration) {
                this.isMining = false;
                this.isAttacking = false;
                this.isPlacing = false;
                this.actionAnimationTime = 0;
            }
        }
        
        this.updateDamageAnimation(deltaTime); // Update damage animation every frame
    }

    // 🔥 CRITICAL FIX: Implement handleMining method for left click block breaking
    handleMining(mousePos, deltaTime) {
        if (!window.game || !this.world) {
            return;
        }

        // Convert mouse position to world coordinates using real game camera
        const worldPos = Utils.screenToWorld(mousePos.x, mousePos.y, window.game.camera);
        const blockX = Math.floor(worldPos.x / this.world.blockSize);
        const blockY = Math.floor(worldPos.y / this.world.blockSize);

        // Check if block is in range (improved range from FINAL_FIXES_COMPLETED.md)
        const distance = Utils.distance(
            this.x + this.width / 2, this.y + this.height / 2,
            blockX * this.world.blockSize + this.world.blockSize / 2,
            blockY * this.world.blockSize + this.world.blockSize / 2
        );

        const minRange = 20; // Minimum distance to prevent issues
        const maxRange = 150; // Normal mining range - restored from test value
        
        if (distance < minRange || distance > maxRange) {
            // Reset mining if out of range
            if (this.miningBlock) {
                this.miningProgress = 0;
                this.miningBlock = null;
                this.isMining = false;
            }
            return;
        }

        const block = this.world.getBlockInstance(blockX, blockY);
        if (!block || !block.isBreakable()) {
            // Reset mining if no valid block
            if (this.miningBlock) {
                this.miningProgress = 0;
                this.miningBlock = null;
                this.isMining = false;
            }
            return;
        }

        const blockKey = `${blockX},${blockY}`;

        // Check if we're mining a different block
        if (this.miningBlock && this.miningBlock !== blockKey) {
            // Reset mining for new block
            this.miningProgress = 0;
        }

        this.miningBlock = blockKey;
        this.isMining = true;
        this.actionAnimationTime = 0;

        // Check if player has diamond pickaxe for instant mining
        const activeItem = this.inventory[this.activeSlot];
        const hasDiamondPickaxe = activeItem && activeItem.type === BlockTypes.DIAMOND_PICKAXE;

        if (hasDiamondPickaxe) {
            // Instant mining with diamond pickaxe
            this.completeMining(blockX, blockY, block);
        } else {
            // Progressive mining
            this.miningProgress += deltaTime * this.miningSpeed;

            if (this.miningProgress >= block.getHardness()) {
                this.completeMining(blockX, blockY, block);
            }
        }
    }

    // Helper method to complete mining
    completeMining(blockX, blockY, block) {
        // Break the block
        const brokenBlockType = this.world.breakBlock(
            blockX * this.world.blockSize, 
            blockY * this.world.blockSize
        );

        if (brokenBlockType) {
            // Add to inventory
            this.addToInventory(brokenBlockType, 1);

            // Update statistics
            this.blocksMined++;

            // Play effects
            if (window.game.sound) {
                window.game.sound.playBlockBreak();
            }

            if (window.game.particles) {
                window.game.particles.addBlockBreakEffect(
                    blockX * this.world.blockSize + this.world.blockSize / 2,
                    blockY * this.world.blockSize + this.world.blockSize / 2,
                    brokenBlockType
                );
            }

            // Reset mining state
            this.miningProgress = 0;
            this.miningBlock = null;
            this.isMining = false;
        }
    }

    // 🔥 CRITICAL FIX: Implement handlePlacing method for right click block placement
    handlePlacing(mousePos) {
        if (!window.game || !this.world) {
            return;
        }

        const activeItem = this.inventory[this.activeSlot];
        if (!activeItem || activeItem.count <= 0) {
            return;
        }

        // Check if item is placeable (no mob drops or tools)
        if (!Block.isPlaceable(activeItem.type)) {
            if (window.game.notifications) {
                window.game.notifications.addNotification(
                    `${this.getItemDisplayName(activeItem.type)} cannot be placed as a block!`,
                    'warning',
                    2000
                );
            }
            return;
        }

        // Convert mouse position to world coordinates using real game camera
        const worldPos = Utils.screenToWorld(mousePos.x, mousePos.y, window.game.camera);
        const blockX = Math.floor(worldPos.x / this.world.blockSize);
        const blockY = Math.floor(worldPos.y / this.world.blockSize);

        // Check if block is in range
        const distance = Utils.distance(
            this.x + this.width / 2, this.y + this.height / 2,
            blockX * this.world.blockSize + this.world.blockSize / 2,
            blockY * this.world.blockSize + this.world.blockSize / 2
        );

        if (distance > 150) { // Normal placing range - restored from test value
            return; // Max placing range
        }

        // Check if position is valid for placing
        const currentBlock = this.world.getBlock(blockX, blockY);
        if (currentBlock !== BlockTypes.AIR && !this.world.isLiquid(currentBlock)) {
            return; // Can't place on solid blocks
        }

        // Special rules for torch placement - only on solid blocks
        if (activeItem.type === BlockTypes.TORCH) {
            if (!this.canPlaceTorchAt(blockX, blockY)) {
                if (window.game.notifications) {
                    window.game.notifications.addNotification(
                        'Torches can only be placed on solid blocks!', 
                        'warning', 
                        2000
                    );
                }
                return;
            }
        }

        // Place the block
        const placed = this.world.placeBlock(
            blockX * this.world.blockSize,
            blockY * this.world.blockSize,
            activeItem.type
        );

        if (placed) {
            // Reduce item count
            activeItem.count--;
            if (activeItem.count <= 0) {
                this.inventory[this.activeSlot] = null;
            }

            // Update statistics
            this.blocksPlaced++;

            // Play effects
            if (window.game.sound) {
                window.game.sound.playBlockPlace();
            }

            if (window.game.particles) {
                window.game.particles.addBlockBreakEffect(
                    blockX * this.world.blockSize + this.world.blockSize / 2,
                    blockY * this.world.blockSize + this.world.blockSize / 2,
                    activeItem.type
                );
            }

            // Start placing animation
            this.isPlacing = true;
            this.actionAnimationTime = 0;

            // Update inventory UI
            if (window.game.updateInventory) {
                window.game.updateInventory();
            }
        }
    }

    // Helper method to check if torch can be placed at position
    canPlaceTorchAt(blockX, blockY) {
        // Check for solid blocks in adjacent positions (support for torch)
        const adjacentPositions = [
            { x: blockX, y: blockY + 1 }, // Below
            { x: blockX, y: blockY - 1 }, // Above  
            { x: blockX - 1, y: blockY }, // Left
            { x: blockX + 1, y: blockY }  // Right
        ];

        for (const pos of adjacentPositions) {
            if (this.world.isValidPosition(pos.x, pos.y)) {
                const adjacentBlock = this.world.getBlockInstance(pos.x, pos.y);
                if (adjacentBlock && adjacentBlock.isSolid()) {
                    return true; // Found at least one solid adjacent block
                }
            }
        }

        return false; // No solid adjacent blocks found
    }

    updateAnimation(deltaTime) {
        this.animationTime += deltaTime;
        if (Math.abs(this.velocityX) > 10) {
            this.animationFrame = Math.floor(this.animationTime * 8) % 4;
        } else {
            this.animationFrame = 0;
        }

        // Update action animations
        if (this.isMining || this.isAttacking || this.isPlacing) {
            this.actionAnimationTime += deltaTime * 1000; // Convert to milliseconds
            
            const currentDuration = this.isPlacing ? this.placingAnimationDuration : this.actionAnimationDuration;
            
            if (this.actionAnimationTime >= currentDuration) {
                this.isMining = false;
                this.isAttacking = false;
                this.isPlacing = false;
                this.actionAnimationTime = 0;
            }
        }
        
        this.updateDamageAnimation(deltaTime); // Update damage animation every frame
    }

    addToInventory(blockType, count) {
        // Try to add to existing stack
        for (let i = 0; i < this.inventory.length; i++) {
            const item = this.inventory[i];
            if (item && item.type === blockType && item.count < 64) {
                const addAmount = Math.min(count, 64 - item.count);
                item.count += addAmount;
                count -= addAmount;
                if (count <= 0) {
                    if (window.game && window.game.notifications) {
                        window.game.notifications.addNotification(`Collected ${this.getItemDisplayName(blockType)}`, 'info', 1000);
                    }
                    return true;
                }
            }
        }
        
        // Find empty slot
        for (let i = 0; i < this.inventory.length; i++) {
            if (!this.inventory[i]) {
                this.inventory[i] = {
                    type: blockType,
                    count: Math.min(count, 64)
                };
                if (window.game && window.game.notifications) {
                    window.game.notifications.addNotification(`Collected ${this.getItemDisplayName(blockType)}`, 'info', 2500);
                }
                return true;
            }
        }
        
        if (window.game && window.game.notifications) {
            window.game.notifications.addNotification(`Inventory full for ${this.getItemDisplayName(blockType)}`, 'warning', 3000);
        }
        return false; // Inventory full
    }

    // Add material to dedicated materials inventory (from mob drops)
    addToMaterialsInventory(materialType, count) {
        // 🔥 FIXED: Removed verbose debug logging for cleaner console output
        const isMobDrop = (materialType >= 200);
        if (!isMobDrop) {
            return this.addToInventory(materialType, count);
        }

        // Try to add to existing stack in materials inventory first
        for (let i = 0; i < this.materialsInventory.length; i++) {
            const item = this.materialsInventory[i];
            if (item && item.type === materialType && item.count < 64) {
                const addAmount = Math.min(count, 64 - item.count);
                item.count += addAmount;
                count -= addAmount;
                if (count <= 0) {
                    if (window.game && window.game.notifications) {
                        window.game.notifications.addNotification(`Materials: +${addAmount} ${this.getMaterialDisplayName(materialType)}`, 'success', 3000);
                    }
                    return true;
                }
            }
        }

        // Find empty slot in materials inventory
        if (count > 0) {
            for (let i = 0; i < this.materialsInventory.length; i++) {
                if (!this.materialsInventory[i]) {
                    const addAmount = Math.min(count, 64);
                    this.materialsInventory[i] = {
                        type: materialType,
                        count: addAmount
                    };
                    count -= addAmount;
                    if (window.game && window.game.notifications) {
                        window.game.notifications.addNotification(`New material: ${this.getMaterialDisplayName(materialType)}`, 'success', 1500);
                    }
                    if (count <= 0) {
                        return true;
                    }
                }
            }
        }
        
        // If items still remain after trying materials inventory
        if (count > 0) { 
            const addedToMain = this.addToInventory(materialType, count); 
            
            if (addedToMain) {
                return true; 
            } else {
                if (window.game && window.game.notifications) {
                    window.game.notifications.addNotification(`All inventories full! ${this.getMaterialDisplayName(materialType)} lost!`, 'warning', 2000);
                }
                return false;
            }
        } else {
            return true;
        }
    }

    getMaterialDisplayName(materialType) {
        const materialNames = {
            [BlockTypes.BONE]: 'Bone',
            [BlockTypes.LEATHER]: 'Leather',
            [BlockTypes.FEATHER]: 'Feather',
            [BlockTypes.WOOL]: 'Wool',
            [BlockTypes.STRING]: 'String',
            [BlockTypes.GUNPOWDER]: 'Gunpowder',
            [BlockTypes.PORK]: 'Pork',
            [BlockTypes.BEEF]: 'Beef',
            [BlockTypes.CHICKEN_MEAT]: 'Chicken',
            [BlockTypes.MUTTON]: 'Mutton'
        };
        return materialNames[materialType] || 'Unknown Material';
    }

    setActiveSlot(slot) {
        if (slot >= 0 && slot < this.inventory.length) {
            this.activeSlot = slot;
        }
    }

    handleCombat(mousePos) {
        const now = Date.now();
        if (now - this.lastAttackTime < this.attackCooldown) return;
        
        // Start attacking animation
        this.isAttacking = true;
        this.actionAnimationTime = 0;
        
        const worldPos = Utils.screenToWorld(mousePos.x, mousePos.y, window.game.camera);
        
        // Check if there are entities in attack range (all entities, not just hostile)
        if (window.game?.entityManager) {
            const nearbyEntities = window.game.entityManager.entities.filter(entity => {
                if (!entity.alive) return false; // Remove isHostile filter to allow attacking all mobs
                
                const distance = Utils.distance(
                    this.x + this.width / 2, this.y + this.height / 2,
                    entity.x + entity.width / 2, entity.y + entity.height / 2
                );
                
                return distance <= this.attackRange;
            });
            
            if (nearbyEntities.length > 0) {
                // Attack the nearest hostile entity
                let nearestEntity = nearbyEntities[0];
                let nearestDistance = Utils.distance(
                    this.x + this.width / 2, this.y + this.height / 2,
                    nearestEntity.x + nearestEntity.width / 2, nearestEntity.y + nearestEntity.height / 2
                );
                
                for (const entity of nearbyEntities) {
                    const distance = Utils.distance(
                        this.x + this.width / 2, this.y + this.height / 2,
                        entity.x + entity.width / 2, entity.y + entity.height / 2
                    );
                    if (distance < nearestDistance) {
                        nearestEntity = entity;
                        nearestDistance = distance;
                    }
                }
                
                // Deal damage to the nearest entity
                const wasAlive = nearestEntity.alive;
                nearestEntity.takeDamage(this.attackDamage, this);
                this.lastAttackTime = now;
                
                // Play attack sound
                if (window.game?.sound) {
                    window.game.sound.playPlayerDamage(); // MODIFIED: Changed to playPlayerDamage
                }
                
                // Check if entity was killed
                if (wasAlive && !nearestEntity.alive) {
                    // Increment mobs killed counter for Game Over statistics
                    this.mobsKilled++;
                    
                    if (window.game?.notifications) {
                        window.game.notifications.addNotification(
                            `Killed ${nearestEntity.type}!`, 
                            'combat',
                            2000
                        );
                    }
                }
                
                // Add combat effects
                if (window.game?.particles) {
                    window.game.particles.addDamageEffect(
                        nearestEntity.x + nearestEntity.width / 2, 
                        nearestEntity.y + nearestEntity.height / 2
                    );
                }
                
                // 🔥 FIXED: Removed combat debug log for cleaner console output
                return true; // Attack was successful
            }
        }
        
        return false; // No attack was made
    }

    render(ctx, camera) {
        const baseScreenX = this.x - camera.x;
        const baseScreenY = this.y - camera.y;
        
        // Apply damage shake to screen position
        const shake = this.getDamageShake();
        const screenX = baseScreenX + shake.x;
        const screenY = baseScreenY + shake.y;
        
        // Player body with damage effects applied underneath
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(screenX + 4, screenY + 16, 16, 24);
        
        // Player head
        ctx.fillStyle = '#FDBCB4';
        ctx.fillRect(screenX + 6, screenY + 4, 12, 12);
        
        // Apply progressive damage effects first (under flash effect)
        this.renderProgressiveDamage(ctx, screenX, screenY);
        
        // Player eyes
        ctx.fillStyle = '#000';
        ctx.fillRect(screenX + 8, screenY + 7, 2, 2);
        ctx.fillRect(screenX + 12, screenY + 7, 2, 2);
        
        // Player arms with action animations
        ctx.fillStyle = '#FDBCB4';
        const walkingArmOffset = Math.sin(this.animationTime * 8) * 2 * (Math.abs(this.velocityX) > 10 ? 1 : 0);
        
        // Calculate action animation offsets
        let leftArmOffset = walkingArmOffset;
        let rightArmOffset = -walkingArmOffset;
        
        if (this.isMining || this.isAttacking) {
            // Fast swinging motion for mining/attacking
            const swingProgress = this.actionAnimationTime / this.actionAnimationDuration;
            const swingIntensity = Math.sin(swingProgress * Math.PI * 4) * 8; // Fast swing
            rightArmOffset = swingIntensity * this.facing;
            
            // Add visual effect for mining
            if (this.isMining) {
                ctx.save();
                ctx.globalAlpha = 0.7;
                ctx.fillStyle = '#FFD700';
                ctx.fillRect(screenX + 18 + rightArmOffset, screenY + 18, 6, 2);
                ctx.restore();
            }
            
            // Add visual effect for attacking
            if (this.isAttacking) {
                ctx.save();
                ctx.globalAlpha = 0.5;
                ctx.fillStyle = '#FF4444';
                ctx.fillRect(screenX + 18 + rightArmOffset, screenY + 16, 8, 4);
                ctx.restore();
            }
        }
        
        if (this.isPlacing) {
            // Enhanced placing motion - more noticeable animation with both arms
            const placeProgress = this.actionAnimationTime / this.placingAnimationDuration;
            const placeOffset = Math.sin(placeProgress * Math.PI) * 5; // Increased from 3 to 5
            
            // Both arms move for placing motion - more realistic
            rightArmOffset = placeOffset;
            leftArmOffset = -placeOffset * 0.5; // Left arm moves opposite but less
            
            // Enhanced visual effect for placing with multiple elements
            ctx.save();
            
            // Main placing indicator
            ctx.globalAlpha = 0.7;
            ctx.fillStyle = '#90EE90';
            ctx.fillRect(screenX + 16, screenY + 20 + placeOffset, 5, 5); // Slightly larger
            
            // Add sparkle effect during placement
            ctx.globalAlpha = 0.8 * Math.sin(placeProgress * Math.PI * 2);
            ctx.fillStyle = '#FFFF00';
            ctx.fillRect(screenX + 15, screenY + 19 + placeOffset, 2, 2);
            ctx.fillRect(screenX + 20, screenY + 19 + placeOffset, 2, 2);
            ctx.fillRect(screenX + 17.5, screenY + 23 + placeOffset, 2, 2);
            
            // Add glow effect
            ctx.globalAlpha = 0.3;
            ctx.fillStyle = '#90EE90';
            ctx.fillRect(screenX + 14, screenY + 18 + placeOffset, 8, 8);
            
            ctx.restore();
        }
        
        // Render arms with calculated offsets
        ctx.fillRect(screenX + 2, screenY + 18 + leftArmOffset, 4, 12);
        ctx.fillRect(screenX + 18, screenY + 18 + rightArmOffset, 4, 12);
        
        // Render held item in right hand
        this.renderHeldItem(ctx, screenX, screenY, rightArmOffset);
        
        // Player legs
        const legOffset = Math.sin(this.animationTime * 8) * 3 * (Math.abs(this.velocityX) > 10 ? 1 : 0);
        ctx.fillStyle = '#0000FF';
        ctx.fillRect(screenX + 8, screenY + 40 + legOffset, 3, 8);
        ctx.fillRect(screenX + 13, screenY + 40 - legOffset, 3, 8);
        
        // Apply damage flash effect on top of everything
        this.renderDamageFlash(ctx, screenX, screenY);
    }

    renderHeldItem(ctx, screenX, screenY, armOffset) {
        const activeItem = this.inventory[this.activeSlot];
        if (activeItem && activeItem.count > 0) {
            // Position the item in the right hand
            const itemX = screenX + 20; // Right of right arm
            const itemY = screenY + 22 - armOffset; // Aligned with hand
            const itemSize = 8; // Mini block size
            
            // Create a mini block to render
            const miniBlock = new Block(activeItem.type, 0, 0);
            miniBlock.render(ctx, itemX, itemY, itemSize);
        }
    }

    getCameraPosition(canvasWidth, canvasHeight) {
        return {
            x: this.x - canvasWidth / 2 + this.width / 2,
            y: this.y - canvasHeight / 2 + this.height / 2
        };
    }

    toggleInventoryExpansion() {
        // Implementation for inventory expansion system - Second inventory panel
        let expandedInventory = document.getElementById('expanded-inventory');
        
        if (!expandedInventory) {
            // Create expanded inventory panel
            expandedInventory = document.createElement('div');
            expandedInventory.id = 'expanded-inventory';
            expandedInventory.className = 'expanded-inventory';
            expandedInventory.style.cssText = `
                position: absolute;
                top: 20px;
                right: 20px;
                width: 350px;
                background: rgba(58, 32, 12, 0.95);
                border: 3px solid #8B4513;
                border-radius: 8px;
                padding: 15px;
                display: none;
                z-index: 200;
                box-shadow: 0 0 20px rgba(0, 0, 0, 0.8);
                max-height: 80vh;
                overflow-y: auto;
            `;
            
            // Add title
            const title = document.createElement('h3');
            title.textContent = 'Expanded Inventory';
            title.style.cssText = `
                color: white;
                text-align: center;
                margin: 0 0 15px 0;
                font-size: 18px;
                text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.8);
            `;
            expandedInventory.appendChild(title);
            
            // Add main inventory section
            const mainSection = document.createElement('div');
            mainSection.innerHTML = '<h4 style="color: white; margin: 0 0 10px 0;">Main Inventory</h4>';
            expandedInventory.appendChild(mainSection);
            
            // Add inventory grid
            const grid = document.createElement('div');
            grid.id = 'expanded-inventory-grid';
            grid.style.cssText = `
                display: grid;
                grid-template-columns: repeat(3, 1fr);
                gap: 8px;
                margin-bottom: 20px;
            `;
            expandedInventory.appendChild(grid);
            
            // Add materials section
            const materialsSection = document.createElement('div');
            materialsSection.innerHTML = '<h4 style="color: #FFD700; margin: 0 0 10px 0;">Materials from Mobs</h4>';
            expandedInventory.appendChild(materialsSection);
            
            // Add materials grid
            const materialsGrid = document.createElement('div');
            materialsGrid.id = 'materials-inventory-grid';
            materialsGrid.style.cssText = `
                display: grid;
                grid-template-columns: repeat(3, 1fr);
                gap: 8px;
                margin-bottom: 15px;
            `;
            expandedInventory.appendChild(materialsGrid);
            
            // Add close button
            const closeButton = document.createElement('button');
            closeButton.textContent = 'Close (I)';
            closeButton.style.cssText = `
                width: 100%;
                padding: 8px;
                background: #8B4513;
                color: white;
                border: 2px solid #A0522D;
                border-radius: 4px;
                cursor: pointer;
                font-size: 14px;
            `;
            closeButton.onclick = () => this.toggleInventoryExpansion();
            expandedInventory.appendChild(closeButton);
            
            document.body.appendChild(expandedInventory);
        }
        
        // Toggle visibility
        const isVisible = expandedInventory.style.display !== 'none';
        
        if (isVisible) {
            expandedInventory.style.display = 'none';
            
            if (window.game && window.game.notifications) {
                window.game.notifications.addNotification(
                    'Expanded inventory closed', 
                    'info', 
                    1500
                );
            }
        } else {
            expandedInventory.style.display = 'block';
            this.updateExpandedInventory();
            
            if (window.game && window.game.notifications) {
                window.game.notifications.addNotification(
                    'Expanded inventory opened!', 
                    'success', 
                    1500
                );
            }
        }
        
        // 🔥 FIXED: Removed inventory toggle debug log for cleaner console output
    }

    updateExpandedInventory() {
        const grid = document.getElementById('expanded-inventory-grid');
        if (!grid) return;
        
        grid.innerHTML = '';
        
        // Show detailed inventory with counts and info
        for (let i = 0; i < this.inventory.length; i++) {
            const slot = document.createElement('div');
            slot.style.cssText = `
                width: 80px;
                height: 80px;
                border: 2px solid #666;
                background: rgba(139, 69, 19, 0.6);
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                border-radius: 4px;
                position: relative;
                ${i === this.activeSlot ? 'border-color: #FFD700; box-shadow: 0 0 10px #FFD700;' : ''}
            `;
            
            const item = this.inventory[i];
            if (item) {
                // Create icon canvas
                const iconCanvas = document.createElement('canvas');
                iconCanvas.width = 48;
                iconCanvas.height = 48;
                const iconCtx = iconCanvas.getContext('2d');
                
                const tempBlock = new Block(item.type, 0, 0);
                tempBlock.render(iconCtx, 0, 0, 48, false);
                
                slot.appendChild(iconCanvas);
                
                // Add count
                const count = document.createElement('div');
                count.textContent = item.count;
                count.style.cssText = `
                    position: absolute;
                    bottom: 2px;
                    right: 2px;
                    color: white;
                    font-size: 12px;
                    font-weight: bold;
                    text-shadow: 1px 1px 2px black;
                `;
                slot.appendChild(count);
                
                // Add item name tooltip
                slot.title = `${this.getItemDisplayName(item.type)} (${item.count})`;
            } else {
                slot.style.opacity = '0.3';
                slot.title = 'Empty slot';
            }
            
            // Click to select slot
            slot.onclick = () => {
                this.setActiveSlot(i);
                if (window.game) {
                    window.game.updateInventory();
                }
                this.updateExpandedInventory();
            };
            
            grid.appendChild(slot);
        }
        
        // Update materials inventory grid
        const materialsGrid = document.getElementById('materials-inventory-grid');
        if (materialsGrid) {
            materialsGrid.innerHTML = '';
            
            // Show first 9 materials inventory slots
            for (let i = 0; i < Math.min(9, this.materialsInventory.length); i++) {
                const slot = document.createElement('div');
                slot.style.cssText = `
                    width: 80px;
                    height: 80px;
                    border: 2px solid #666;
                    background: rgba(139, 69, 19, 0.6);
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    border-radius: 4px;
                    position: relative;
                `;
                
                const material = this.materialsInventory[i];
                if (material) {
                    // Create icon canvas
                    const iconCanvas = document.createElement('canvas');
                    iconCanvas.width = 48;
                    iconCanvas.height = 48;
                    const iconCtx = iconCanvas.getContext('2d');
                    
                    // Render material icon
                    const tempBlock = new Block(material.type, 0, 0);
                    tempBlock.render(iconCtx, 0, 0, 48, false);
                    
                    slot.appendChild(iconCanvas);
                    
                    // Add count
                    const count = document.createElement('div');
                    count.textContent = material.count;
                    count.style.cssText = `
                        position: absolute;
                        bottom: 2px;
                        right: 2px;
                        color: #FFD700;
                        font-size: 12px;
                        font-weight: bold;
                        text-shadow: 1px 1px 2px black;
                    `;
                    slot.appendChild(count);
                    
                    // Add material name tooltip
                    slot.title = `${this.getMaterialDisplayName(material.type)} (${material.count})`;
                } else {
                    slot.style.opacity = '0.3';
                    slot.title = 'Empty material slot';
                }
                
                materialsGrid.appendChild(slot);
            }
        }
    }

    dropSingleBlock() {
        // Drop ONE block from active slot using B key (Minecraft style)
        const activeItem = this.inventory[this.activeSlot];
        
        if (activeItem && activeItem.count > 0) {
            const itemName = this.getItemDisplayName(activeItem.type);

            // Drop exactly 1 item
            // 🔥 FIXED: Removed drop debug log for cleaner console output

            if (window.game) {
                // Add visual effect for dropping item
                window.game.particles.addBlockBreakEffect(
                    this.x + this.width / 2, 
                    this.y + this.height / 2, 
                    activeItem.type
                );
                // Play drop sound
                window.game.sound.playBlockPlace();
            }

            activeItem.count -= 1;
            if (activeItem.count <= 0) {
                this.inventory[this.activeSlot] = null; // Clear the slot
            }
            
            // Notification for dropped item
            if (window.game && window.game.notifications) {
                window.game.notifications.addNotification(`Dropped 1 ${itemName}`, 'info', 1500);
            }
        } else {
            // No item to drop
            if (window.game && window.game.notifications) {
                window.game.notifications.addNotification('No item to drop', 'warning', 1000);
            }
        }
    }

    dropActiveSlotItem() {
        const activeItem = this.inventory[this.activeSlot];
        
        if (activeItem && activeItem.count > 0) {
            const dropAmount = Math.min(activeItem.count, 16); // Drop up to 16 items
            const itemName = this.getItemDisplayName(activeItem.type); // Correctly use activeItem.type

            // Simulate dropping the item (e.g., create a temporary entity or particle)
            // For now, just play effects
            // 🔥 FIXED: Removed drop debug log for cleaner console output

            if (window.game) {
                // Add visual effect for dropping item (can be similar to block break)
                window.game.particles.addBlockBreakEffect(
                    this.x + this.width / 2, 
                    this.y + this.height / 2, 
                    activeItem.type // Use the block type for particle color
                );
                // Play drop sound
                window.game.sound.playBlockPlace(); // Re-use place sound or add a specific drop sound
            }

            activeItem.count -= dropAmount;
            if (activeItem.count <= 0) {
                this.inventory[this.activeSlot] = null; // Clear the slot
                if (window.game && window.game.notifications) {
                    window.game.notifications.addNotification(`${itemName} removed from slot.`, 'info', 1500);
                }
            }
            
            // Notification for dropped item
            if (window.game && window.game.notifications) {
                window.game.notifications.addNotification(`Dropped ${dropAmount} ${itemName}.`, 'info', 2000);
            }
        } else if (activeItem && activeItem.count <= 0) {
             // This case should ideally not happen if count <= 0 means slot is nulled
             this.inventory[this.activeSlot] = null;
        }
    }

    getItemDisplayName(blockType) {
        return BlockNames[blockType] || 'Unknown Item';
    }

    takeDamage(amount, attacker = null) {
        this.health -= amount;
        
        // Trigger damage animation
        this.triggerDamageAnimation();
        
        // Update visual damage level based on new health
        this.updateDamageLevel();
        
        // Play damage sound based on attacker type
        if (window.game?.sound) {
            // Always play damage sound unless it's environmental damage that already has a specific sound
            if (attacker !== 'drowning' && attacker !== 'liquid') {
                window.game.sound.playPlayerDamage();
            }
        }

        if (this.health <= 0) {
            this.health = 0;
            this.die(attacker); // Pass attacker to die method
        }
    }

    // Handle player death
    die(attacker) {
        // 🔥 FIXED: Removed debug log for cleaner console output
        
        // Trigger the game's death handling system
        if (window.game && window.game.handlePlayerDeath) {
            window.game.handlePlayerDeath({
                x: this.x,
                y: this.y,
                killer: attacker
            });
        } else {
            console.error('Game death handler not found!');
        }
    }

    // Trigger damage animation when player takes damage
    triggerDamageAnimation() {
        this.isDamaged = true;
        this.damageAnimationTime = 0;
    }

    // Update visual damage level based on health percentage
    updateDamageLevel() {
        const healthPercentage = (this.health / this.maxHealth) * 100;
        
        // Calculate damage level based on health percentage
        if (healthPercentage >= 80) {
            this.damageLevel = 0; // No visible damage
        } else if (healthPercentage >= 60) {
            this.damageLevel = 1; // Light scratches and dirt
        } else if (healthPercentage >= 40) {
            this.damageLevel = 2; // Slightly torn clothes
        } else if (healthPercentage >= 20) {
            this.damageLevel = 3; // Heavily damaged clothes, visible wounds
        } else {
            this.damageLevel = 4; // Severely damaged, blood, torn clothes
        }
        
        this.lastHealthPercentage = healthPercentage;
    }

    // Update damage animation
    updateDamageAnimation(deltaTime) {
        if (this.isDamaged) {
            this.damageAnimationTime += deltaTime * 1000; // Convert to milliseconds
            
            // End damage animation after duration
            if (this.damageAnimationTime >= this.damageAnimationDuration) {
                this.isDamaged = false;
                this.damageAnimationTime = 0;
            }
        }
    }

    // Get damage flash effect (for red overlay)
    getDamageFlash() {
        if (!this.isDamaged) return 0;
        
        // Create flashing effect during damage animation
        const flashCycle = Math.floor(this.damageAnimationTime / this.damageFlashInterval);
        const isFlashing = flashCycle % 2 === 0;
        
        // Fade out the flash intensity over time
        const fadeProgress = this.damageAnimationTime / this.damageAnimationDuration;
        const intensity = isFlashing ? (1 - fadeProgress) * 0.7 : 0;
        
        return intensity;
    }

    // Get damage shake offset for screen shake effect
    getDamageShake() {
        if (!this.isDamaged) return { x: 0, y: 0 };
        
        // Create shake effect that diminishes over time
        const fadeProgress = this.damageAnimationTime / this.damageAnimationDuration;
        const currentIntensity = (1 - fadeProgress) * this.damageShakeIntensity;
        
        return {
            x: (Math.random() - 0.5) * 2 * currentIntensity,
            y: (Math.random() - 0.5) * 2 * currentIntensity
        };
    }

    // Heal method that also updates visual damage
    heal(amount) {
        const oldHealth = this.health;
        this.health = Math.min(this.maxHealth, this.health + amount);
        
        // Update visual damage level if health increased
        if (this.health > oldHealth) {
            this.updateDamageLevel();
        }
        
        return this.health - oldHealth; // Return actual amount healed
    }

    // Render damage animation and visual damage effects
    renderDamageAnimation(ctx, screenX, screenY) {
        // This method is kept for backwards compatibility but functionality moved to render()
        // Progressive damage is now rendered in main render method
        // Flash effect is now rendered separately at the end
    }

    // Render damage flash overlay (called at end of render method)
    renderDamageFlash(ctx, screenX, screenY) {
        const flashIntensity = this.getDamageFlash();
        if (flashIntensity > 0) {
            ctx.save();
            ctx.globalAlpha = flashIntensity;
            ctx.fillStyle = '#FF0000';
            ctx.fillRect(screenX, screenY, this.width, this.height);
            ctx.restore();
        }
    }

    // Render progressive damage effects based on health level
    renderProgressiveDamage(ctx, screenX, screenY) {
        if (this.damageLevel === 0) return; // No damage to show
        
        ctx.save();
        
        switch (this.damageLevel) {
            case 1: // Light damage (80-60% health)
                this.renderLightDamage(ctx, screenX, screenY);
                break;
            case 2: // Moderate damage (60-40% health)
                this.renderLightDamage(ctx, screenX, screenY);
                this.renderModerateDamage(ctx, screenX, screenY);
                break;
            case 3: // Heavy damage (40-20% health)
                this.renderLightDamage(ctx, screenX, screenY);
                this.renderModerateDamage(ctx, screenX, screenY);
                this.renderHeavyDamage(ctx, screenX, screenY);
                break;
            case 4: // Critical damage (20-0% health)
                this.renderLightDamage(ctx, screenX, screenY);
                this.renderModerateDamage(ctx, screenX, screenY);
                this.renderHeavyDamage(ctx, screenX, screenY);
                this.renderCriticalDamage(ctx, screenX, screenY);
                break;
        }
        
        ctx.restore();
    }

    // Light damage: dirt spots and small scratches
    renderLightDamage(ctx, screenX, screenY) {
        ctx.fillStyle = 'rgba(101, 67, 33, 0.6)'; // Brown dirt spots
        
        // Dirt spots on clothes
        ctx.fillRect(screenX + 6, screenY + 20, 2, 1);
        ctx.fillRect(screenX + 14, screenY + 24, 1, 2);
        ctx.fillRect(screenX + 10, screenY + 18, 1, 1);
        
        // Small scratches on face
        ctx.fillStyle = 'rgba(139, 0, 0, 0.4)';
        ctx.fillRect(screenX + 7, screenY + 6, 1, 1);
        ctx.fillRect(screenX + 13, screenY + 8, 1, 1);
    }

    // Moderate damage: torn clothes showing skin
    renderModerateDamage(ctx, screenX, screenY) {
        // Torn shirt patches showing skin underneath
        ctx.fillStyle = '#FDBCB4'; // Skin color
        ctx.fillRect(screenX + 5, screenY + 22, 2, 3); // Left tear
        ctx.fillRect(screenX + 17, screenY + 19, 2, 2); // Right tear
        ctx.fillRect(screenX + 11, screenY + 26, 3, 2); // Center tear
        
        // More dirt and grime
        ctx.fillStyle = 'rgba(60, 40, 20, 0.7)';
        ctx.fillRect(screenX + 7, screenY + 16, 3, 1);
        ctx.fillRect(screenX + 13, screenY + 30, 2, 2);
    }

    // Heavy damage: significant tears and visible wounds
    renderHeavyDamage(ctx, screenX, screenY) {
        // Large tears in clothes
        ctx.fillStyle = '#FDBCB4'; // Skin color
        ctx.fillRect(screenX + 4, screenY + 25, 4, 4); // Big left tear
        ctx.fillRect(screenX + 16, screenY + 21, 3, 5); // Big right tear
        
        // Visible wounds (red marks)
        ctx.fillStyle = 'rgba(139, 0, 0, 0.8)';
        ctx.fillRect(screenX + 5, screenY + 26, 2, 1); // Wound on exposed skin
        ctx.fillRect(screenX + 17, screenY + 23, 1, 2); // Another wound
        ctx.fillRect(screenX + 9, screenY + 7, 2, 1); // Face wound
        
        // Heavy dirt and damage
        ctx.fillStyle = 'rgba(40, 25, 15, 0.8)';
        ctx.fillRect(screenX + 6, screenY + 17, 4, 2);
        ctx.fillRect(screenX + 12, screenY + 28, 5, 2);
    }

    // Critical damage: severe tears, blood, and extensive damage
    renderCriticalDamage(ctx, screenX, screenY) {
        // Extensive clothing damage - mostly skin showing
        ctx.fillStyle = '#FDBCB4'; // Skin color
        ctx.fillRect(screenX + 3, screenY + 18, 6, 8); // Left side torn off
        ctx.fillRect(screenX + 15, screenY + 20, 5, 10); // Right side torn off
        
        // Blood stains
        ctx.fillStyle = 'rgba(100, 0, 0, 0.9)';
        ctx.fillRect(screenX + 4, screenY + 19, 3, 2); // Blood on exposed skin
        ctx.fillRect(screenX + 16, screenY + 22, 2, 3); // More blood
        ctx.fillRect(screenX + 8, screenY + 9, 3, 1); // Blood on face
        ctx.fillRect(screenX + 11, screenY + 6, 2, 1); // Forehead blood
        
        // Severe dirt and damage
        ctx.fillStyle = 'rgba(30, 20, 10, 0.9)';
        ctx.fillRect(screenX + 5, screenY + 15, 6, 3);
        ctx.fillRect(screenX + 10, screenY + 29, 8, 3);
        
        // Tattered cloth edges
        ctx.fillStyle = 'rgba(139, 69, 19, 0.6)'; // Darker brown for tattered edges
        ctx.fillRect(screenX + 2, screenY + 17, 1, 3);
        ctx.fillRect(screenX + 9, screenY + 16, 1, 2);
        ctx.fillRect(screenX + 20, screenY + 19, 1, 4);
        ctx.fillRect(screenX + 14, screenY + 30, 2, 1);
    }
}