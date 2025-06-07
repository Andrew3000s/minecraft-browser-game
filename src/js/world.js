// World generation and management system

class World {
    constructor(width = 200, height = 100) {
        this.width = width;
        this.height = height;
        this.blockSize = 32;
        this.blocks = {};
        this.liquidUpdateCounter = 0; // To slow down liquid physics
        this.liquidUpdateInterval = 30; // Update liquids every 30 ticks (increased from 15)
        
        // 🌊 NUOVO: Sistema avanzato di fisica dei fluidi
        this.advancedFluidPhysics = null; // Inizializzato dopo che il gioco è caricato
        this.useAdvancedFluidPhysics = true; // Flag per abilitare/disabilitare
        
        this.generateWorld();
    }

    // 🌊 Inizializza il sistema avanzato di fisica dei fluidi
    initializeAdvancedFluidPhysics(game) {
        this.advancedFluidPhysics = new FluidPhysics(this);
        this.useAdvancedFluidPhysics = true;
        
        // Memorizza riferimento al game se fornito
        if (game) {
            this.game = game;
        }
        
        // 🚀 Inizializza sistemi avanzati (turbolenza ed erosione)
        if (this.advancedFluidPhysics.initializeAdvancedSystems) {
            this.advancedFluidPhysics.initializeAdvancedSystems();
        }
        
        // 🔥 FIXED: Removed debug logs for cleaner console output
    }

    generateWorld() {
        // 🔥 FIXED: Removed debug logging for cleaner console output
        
        // Generate terrain
        for (let x = 0; x < this.width; x++) {
            const terrainHeight = Utils.generateTerrain(x, 15, 0.02) + 60;
            
            for (let y = 0; y < this.height; y++) {
                let blockType = BlockTypes.AIR;
                
                if (y === this.height - 1) {
                    // Bedrock layer
                    blockType = BlockTypes.BEDROCK;
                } else if (y > terrainHeight + 10) {
                    // Deep underground - stone with ores
                    if (Math.random() < 0.05) {
                        const oreRand = Math.random();
                        if (oreRand < 0.6) blockType = BlockTypes.COAL_ORE;
                        else if (oreRand < 0.9) blockType = BlockTypes.IRON_ORE;
                        else blockType = BlockTypes.DIAMOND_ORE;
                    } else {
                        blockType = BlockTypes.STONE;
                    }
                } else if (y > terrainHeight + 3) {
                    // Underground - dirt and stone
                    blockType = Math.random() < 0.7 ? BlockTypes.DIRT : BlockTypes.STONE;
                } else if (y > terrainHeight) {
                    // Surface and shallow underground
                    blockType = BlockTypes.DIRT;
                } else if (y === Math.floor(terrainHeight)) {
                    // Surface
                    blockType = BlockTypes.GRASS;
                } else {
                    // Above surface - air or water
                    const waterLevel = 45; // Level for water bodies
                    if (y > waterLevel && terrainHeight < waterLevel) {
                        blockType = BlockTypes.WATER;
                    } else {
                        blockType = BlockTypes.AIR;
                    }
                }
                
                if (blockType !== BlockTypes.AIR) {
                    this.setBlock(x, y, blockType);
                }
            }
        }
        
        // Generate trees
        this.generateTrees();
        
        // 🔧 NEW: Generate underground liquid areas
        this.generateUndergroundLiquids();
        
        // 🔥 FIXED: Removed debug logging for cleaner console output
    }

    generateTrees() {
        for (let x = 5; x < this.width - 5; x += Utils.randomInt(3, 8)) {
            const surfaceY = this.findSurfaceLevel(x);
            if (surfaceY !== -1 && this.getBlock(x, surfaceY) === BlockTypes.GRASS) {
                this.generateTree(x, surfaceY);
            }
        }
    }

    generateTree(x, surfaceY) {
        const treeHeight = Utils.randomInt(4, 7);
        
        // Tree trunk
        for (let y = surfaceY - treeHeight; y < surfaceY; y++) {
            this.setBlock(x, y, BlockTypes.WOOD);
        }
        
        // Tree leaves
        const leavesY = surfaceY - treeHeight;
        for (let dx = -2; dx <= 2; dx++) {
            for (let dy = -2; dy <= 1; dy++) {
                if (Math.abs(dx) + Math.abs(dy) < 3 && Math.random() < 0.8) {
                    const leafX = x + dx;
                    const leafY = leavesY + dy;
                    if (this.isValidPosition(leafX, leafY) && this.getBlock(leafX, leafY) === BlockTypes.AIR) {
                        this.setBlock(leafX, leafY, BlockTypes.LEAVES);
                    }
                }
            }
        }
    }

    // 🔧 NEW: Generate underground liquid areas (water, lava, acid)
    generateUndergroundLiquids() {
        // Generate occasional underground liquid pools
        const numLiquidAreas = Math.floor(this.width / 20); // About 10 areas for 200 width
        
        for (let i = 0; i < numLiquidAreas; i++) {
            const centerX = Math.floor(Math.random() * (this.width - 10)) + 5;
            const centerY = Math.floor(Math.random() * 20) + 70; // Deep underground
            
            // Choose liquid type
            const liquidTypes = [BlockTypes.WATER, BlockTypes.LAVA, BlockTypes.ACID];
            const liquidType = liquidTypes[Math.floor(Math.random() * liquidTypes.length)];
            
            // Generate liquid area (3x3 to 5x5)
            const size = Math.floor(Math.random() * 3) + 3;
            
            for (let dx = -size; dx <= size; dx++) {
                for (let dy = -Math.floor(size/2); dy <= Math.floor(size/2); dy++) {
                    const x = centerX + dx;
                    const y = centerY + dy;
                    
                    if (this.isValidPosition(x, y)) {
                        // Check if we're replacing stone or dirt (not ores)
                        const currentBlock = this.getBlock(x, y);
                        if (currentBlock === BlockTypes.STONE || currentBlock === BlockTypes.DIRT) {
                            // Create circular-ish liquid area
                            const distance = Math.sqrt(dx * dx + dy * dy);
                            if (distance <= size * 0.8 && Math.random() < 0.8) {
                                this.setBlock(x, y, liquidType);
                            }
                        }
                    }
                }
            }
        }
    }

    findSurfaceLevel(x) {
        for (let y = 0; y < this.height; y++) {
            const blockType = this.getBlock(x, y);
            if (blockType !== BlockTypes.AIR && blockType !== BlockTypes.WATER && 
                blockType !== BlockTypes.LAVA && blockType !== BlockTypes.ACID) {
                return y;
            }
        }
        return -1;
    }

    getBlockKey(x, y) {
        return `${x},${y}`;
    }

    setBlock(x, y, type) {
        if (!this.isValidPosition(x, y)) return false;
        
        if (type === BlockTypes.AIR) {
            delete this.blocks[this.getBlockKey(x, y)];
        } else {
            this.blocks[this.getBlockKey(x, y)] = new Block(type, x, y);
        }
        return true;
    }

    getBlock(x, y) {
        if (!this.isValidPosition(x, y)) return BlockTypes.BEDROCK;
        
        const block = this.blocks[this.getBlockKey(x, y)];
        return block ? block.type : BlockTypes.AIR;
    }

    getBlockInstance(x, y) {
        return this.blocks[this.getBlockKey(x, y)] || null;
    }

    isValidPosition(x, y) {
        return x >= 0 && x < this.width && y >= 0 && y < this.height;
    }

    isSolid(x, y) {
        const block = this.getBlockInstance(x, y);
        return block ? block.isSolid() : false;
    }

    canWalkThrough(x, y) {
        const block = this.getBlockInstance(x, y);
        return block ? block.canWalkThrough() : true;
    }

    breakBlock(x, y) {
        const blockX = Math.floor(x / this.blockSize);
        const blockY = Math.floor(y / this.blockSize);
        
        const block = this.getBlockInstance(blockX, blockY);
        if (block && block.isBreakable()) {
            this.setBlock(blockX, blockY, BlockTypes.AIR);
            return block.type;
        }
        return null;
    }

    placeBlock(x, y, blockType) {
        const blockX = Math.floor(x / this.blockSize);
        const blockY = Math.floor(y / this.blockSize);
        
        const currentBlock = this.getBlock(blockX, blockY);
        // Allow placing blocks only on AIR (not on liquids)
        if (currentBlock === BlockTypes.AIR) {
            this.setBlock(blockX, blockY, blockType);
            return true;
        }
        return false;
    }

    render(ctx, camera, canvasWidth, canvasHeight) {
        const startX = Math.max(0, Math.floor(camera.x / this.blockSize) - 1);
        const endX = Math.min(this.width, Math.ceil((camera.x + canvasWidth) / this.blockSize) + 1);
        const startY = Math.max(0, Math.floor(camera.y / this.blockSize) - 1);
        const endY = Math.min(this.height, Math.ceil((camera.y + canvasHeight) / this.blockSize) + 1);

        for (let x = startX; x < endX; x++) {
            for (let y = startY; y < endY; y++) {
                const block = this.getBlockInstance(x, y);
                if (block) {
                    const screenX = x * this.blockSize - camera.x;
                    const screenY = y * this.blockSize - camera.y;
                    
                    // 🌊 Render avanzato per fluidi
                    if (this.useAdvancedFluidPhysics && this.advancedFluidPhysics && this.isLiquid(block.type)) {
                        this.renderAdvancedFluid(ctx, x, y, block, screenX, screenY);
                    } else {
                        // Render block normale
                        block.render(ctx, screenX, screenY, this.blockSize);
                    }
                }
            }
        }
    }

    // 🌊 Rendering avanzato per fluidi con effetti visivi realistici
    renderAdvancedFluid(ctx, blockX, blockY, block, screenX, screenY) {
        const fluidProps = this.advancedFluidPhysics.getFluidProperties(block.type);
        if (!fluidProps) {
            block.render(ctx, screenX, screenY, this.blockSize);
            return;
        }

        // Salva stato del context
        ctx.save();

        // Applica trasparenza
        ctx.globalAlpha = fluidProps.transparency;

        // Calcola offset delle onde per la superficie
        const surfaceWave = this.advancedFluidPhysics.getSurfaceWaveAt(blockX, blockY);
        let renderY = screenY;
        
        // Controlla se è superficie (aria sopra)
        const blockAbove = this.getBlock(blockX, blockY - 1);
        if (blockAbove === BlockTypes.AIR) {
            renderY += surfaceWave;
        }

        // Render base del fluido
        ctx.fillStyle = fluidProps.color;
        ctx.fillRect(screenX, renderY, this.blockSize, this.blockSize);

        // Effetti aggiuntivi basati sul tipo di fluido
        this.renderFluidEffects(ctx, blockX, blockY, block.type, screenX, renderY);

        // Render indicatori di flusso (correnti)
        this.renderFlowIndicators(ctx, blockX, blockY, screenX, renderY);

        // Ripristina stato del context
        ctx.restore();

        // Aggiungi texture base
        block.addTexture(ctx, screenX, renderY, this.blockSize);
    }

    // 🎨 Effetti visivi specifici per tipo di fluido
    renderFluidEffects(ctx, blockX, blockY, fluidType, screenX, screenY) {
        switch (fluidType) {
            case BlockTypes.WATER:
                this.renderWaterEffects(ctx, blockX, blockY, screenX, screenY);
                break;
            case BlockTypes.LAVA:
                this.renderLavaEffects(ctx, blockX, blockY, screenX, screenY);
                break;
            case BlockTypes.ACID:
                this.renderAcidEffects(ctx, blockX, blockY, screenX, screenY);
                break;
        }
    }

    // 💧 Effetti visivi acqua
    renderWaterEffects(ctx, blockX, blockY, screenX, screenY) {
        const time = Date.now() * 0.001;
        
        // Riflessioni luminose
        ctx.save();
        ctx.globalAlpha = 0.3;
        ctx.fillStyle = '#87CEEB';
        
        const reflectionOffset = Math.sin(time * 2 + blockX * 0.5) * 3;
        ctx.fillRect(
            screenX + reflectionOffset, 
            screenY + this.blockSize * 0.7, 
            this.blockSize * 0.6, 
            this.blockSize * 0.1
        );
        
        ctx.restore();

        // Bolle occasionali
        if (Math.random() < 0.001) {
            this.createBubbleEffect(blockX, blockY);
        }
    }

    // 🔥 Effetti visivi lava
    renderLavaEffects(ctx, blockX, blockY, screenX, screenY) {
        const time = Date.now() * 0.001;
        
        // Incandescenza pulsante
        ctx.save();
        ctx.globalAlpha = 0.4 + Math.sin(time * 3 + blockX + blockY) * 0.2;
        ctx.fillStyle = '#FFD700';
        ctx.fillRect(screenX, screenY, this.blockSize, this.blockSize);
        ctx.restore();

        // Scintille occasionali
        if (Math.random() < 0.002) {
            this.createSparkEffect(blockX, blockY);
        }

        // Calore distorsione (effetto ondulatorio)
        ctx.save();
        ctx.globalAlpha = 0.15;
        
        const heatOffset = Math.sin(time * 4 + blockX * 0.3) * 2;
        ctx.fillStyle = '#FF4500';
        ctx.fillRect(
            screenX + heatOffset, 
            screenY - 2, 
            this.blockSize, 
            4
        );
        
        ctx.restore();
    }

    // 🧪 Effetti visivi acido
    renderAcidEffects(ctx, blockX, blockY, screenX, screenY) {
        const time = Date.now() * 0.001;
        
        // Effetto corrosivo (bolle verdi)
        ctx.save();
        ctx.globalAlpha = 0.6;
        
        const bubbleSize = 3 + Math.sin(time * 5 + blockX + blockY) * 2;
        ctx.fillStyle = '#90EE90';
        ctx.beginPath();
        ctx.arc(
            screenX + this.blockSize * 0.3 + Math.sin(time + blockX) * 5,
            screenY + this.blockSize * 0.4 + Math.cos(time + blockY) * 3,
            bubbleSize,
            0,
            Math.PI * 2
        );
        ctx.fill();
        
        ctx.restore();

        // Vapori tossici occasionali
        if (Math.random() < 0.003) {
            this.createToxicVaporEffect(blockX, blockY);
        }
    }

    // 💨 Indicatori di flusso (correnti)
    renderFlowIndicators(ctx, blockX, blockY, screenX, screenY) {
        const flowVelocity = this.advancedFluidPhysics.getFlowVelocityAt(blockX, blockY);
        
        if (flowVelocity.magnitude > 5) {
            ctx.save();
            ctx.globalAlpha = 0.4;
            ctx.strokeStyle = '#FFFFFF';
            ctx.lineWidth = 2;
            
            // Disegna freccia di direzione del flusso
            const centerX = screenX + this.blockSize / 2;
            const centerY = screenY + this.blockSize / 2;
            const arrowLength = Math.min(flowVelocity.magnitude * 0.2, this.blockSize * 0.4);
            
            const angle = Math.atan2(flowVelocity.y, flowVelocity.x);
            const endX = centerX + Math.cos(angle) * arrowLength;
            const endY = centerY + Math.sin(angle) * arrowLength;
            
            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.lineTo(endX, endY);
            ctx.stroke();
            
            // Punta della freccia
            const arrowHeadLength = 5;
            ctx.beginPath();
            ctx.moveTo(endX, endY);
            ctx.lineTo(
                endX - arrowHeadLength * Math.cos(angle - Math.PI / 6),
                endY - arrowHeadLength * Math.sin(angle - Math.PI / 6)
            );
            ctx.moveTo(endX, endY);
            ctx.lineTo(
                endX - arrowHeadLength * Math.cos(angle + Math.PI / 6),
                endY - arrowHeadLength * Math.sin(angle + Math.PI / 6)
            );
            ctx.stroke();
            
            ctx.restore();
        }
    }

    // 🎭 Effetti particellari avanzati
    createBubbleEffect(blockX, blockY) {
        if (!window.game?.particles) return;
        
        const worldX = blockX * this.blockSize + this.blockSize / 2;
        const worldY = blockY * this.blockSize + this.blockSize / 2;
        
        window.game.particles.particles.push(new Particle({
            x: worldX + (Math.random() - 0.5) * this.blockSize,
            y: worldY + (Math.random() - 0.5) * this.blockSize,
            velocityX: (Math.random() - 0.5) * 20,
            velocityY: -Math.random() * 40 - 20,
            color: '#E0F6FF',
            size: Math.random() * 4 + 2,
            life: 1.0 + Math.random() * 0.5,
            gravity: -50 // Le bolle salgono
        }));
    }

    createSparkEffect(blockX, blockY) {
        if (!window.game?.particles) return;
        
        const worldX = blockX * this.blockSize + this.blockSize / 2;
        const worldY = blockY * this.blockSize + this.blockSize / 2;
        
        for (let i = 0; i < 3; i++) {
            window.game.particles.particles.push(new Particle({
                x: worldX + (Math.random() - 0.5) * this.blockSize,
                y: worldY + (Math.random() - 0.5) * this.blockSize,
                velocityX: (Math.random() - 0.5) * 100,
                velocityY: -Math.random() * 100 - 50,
                color: ['#FFD700', '#FFA500', '#FF6347'][Math.floor(Math.random() * 3)],
                size: Math.random() * 2 + 1,
                life: 0.3 + Math.random() * 0.2,
                gravity: 300
            }));
        }
    }

    createToxicVaporEffect(blockX, blockY) {
        if (!window.game?.particles) return;
        
        const worldX = blockX * this.blockSize + this.blockSize / 2;
        const worldY = blockY * this.blockSize + this.blockSize / 2;
        
        for (let i = 0; i < 2; i++) {
            window.game.particles.particles.push(new Particle({
                x: worldX + (Math.random() - 0.5) * this.blockSize,
                y: worldY - this.blockSize / 2,
                velocityX: (Math.random() - 0.5) * 30,
                velocityY: -Math.random() * 60 - 30,
                color: ['#9ACD32', '#228B22'][Math.floor(Math.random() * 2)],
                size: Math.random() * 6 + 4,
                life: 2.0 + Math.random() * 1.0,
                gravity: -40 // I vapori salgono
            }));
        }
    }

    // Physics collision detection
    getCollisionBoxes(x, y, width, height) {
        const boxes = [];
        const startX = Math.floor(x / this.blockSize);
        const endX = Math.floor((x + width) / this.blockSize);
        const startY = Math.floor(y / this.blockSize);
        const endY = Math.floor((y + height) / this.blockSize);

        for (let bx = startX; bx <= endX; bx++) {
            for (let by = startY; by <= endY; by++) {
                if (this.isSolid(bx, by)) {
                    boxes.push({
                        x: bx * this.blockSize,
                        y: by * this.blockSize,
                        width: this.blockSize,
                        height: this.blockSize
                    });
                }
            }
        }

        return boxes;
    }
    
    // 🔧 NEW: Liquid physics system
    updateLiquidPhysics(deltaTime) {
        // 🌊 Usa il sistema avanzato se disponibile
        if (this.useAdvancedFluidPhysics && this.advancedFluidPhysics) {
            this.advancedFluidPhysics.updateFluidPhysics(deltaTime);
            return;
        }
        
        // Sistema base di fallback
        this.updateBasicLiquidPhysics();
    }
    
    // 🔧 Sistema base di fisica dei fluidi (fallback)
    updateBasicLiquidPhysics() {
        this.liquidUpdateCounter++;
        if (this.liquidUpdateCounter < this.liquidUpdateInterval) {
            return; // Skip this update to slow down liquids
        }
        this.liquidUpdateCounter = 0; // Reset the counter

        const liquidsToUpdate = [];
        for (let x = 0; x < this.width; x++) {
            for (let y = 0; y < this.height; y++) { // Iterate y from top to bottom (0 to this.height - 1)
                const blockType = this.getBlock(x, y);
                if (this.isLiquid(blockType)) {
                    liquidsToUpdate.push({ x, y, type: blockType });
                }
            }
        }

        // Sort liquids to process those higher up (smaller y) first.
        // This helps propagate cascades downwards correctly in a single "stabilization" cycle.
        liquidsToUpdate.sort((a, b) => a.y - b.y);

        if (liquidsToUpdate.length === 0) {
            return; // No liquids to update // MODIFIED: was break
        }

        for (const liquid of liquidsToUpdate) {
            // Check if the block is still a liquid of the expected type,
            // it might have been changed by a previous processing in the same while loop.
            if (this.getBlock(liquid.x, liquid.y) === liquid.type) {
                // MODIFIED: No longer need to track changedInIteration for the removed while loop
                this.processLiquidFlow(liquid.x, liquid.y, liquid.type);
                // if (this.processLiquidFlow(liquid.x, liquid.y, liquid.type)) {
                //     changedInIteration = true; // An action was taken, continue the while loop
                // }
            }
        }
        // } // MODIFIED: Removed end of while loop
    }
    
    isLiquid(blockType) {
        return blockType === BlockTypes.WATER || 
               blockType === BlockTypes.LAVA || 
               blockType === BlockTypes.ACID;
    }
    
    // Renamed from canLiquidFlowTo and simplified
    canSpreadTo(x, y, liquidType) { // Checks if a liquid can spread into cell (x,y)
        // This function is no longer actively used by the main flow logic,
        // but I'm leaving it in case it's needed for other logic or debugging.
        // The control logic is now integrated into processLiquidFlow.
        if (!this.isValidPosition(x, y)) return false;
        const targetBlock = this.getBlock(x, y);
        // Liquids can only spread into air for now.
        // This prevents complex interactions like obsidian generation or liquid overwriting,
        // keeping the focus on correct flow mechanics.
        return targetBlock === BlockTypes.AIR;
    }

    processLiquidFlow(x, y, type) { // Changed signature: z removed, type is the liquid type
        let actionTaken = false;
        const currentBlockType = this.getBlock(x, y); // Use 2D getBlock

        // Check if the source block is still the liquid we intend to process
        if (currentBlockType !== type) {
            return false; // Source block changed (e.g., by interaction or previous flow), stop flow
        }

        // Helper function for liquid interactions
        const checkAndTransform = (sourceX, sourceY, neighborX, neighborY, interactingBlockType, resultBlockType) => {
            const actualNeighborBlockType = this.getBlock(neighborX, neighborY);
            if (actualNeighborBlockType === interactingBlockType) {
                this.setBlock(sourceX, sourceY, BlockTypes.AIR); // Current liquid block turns to air
                if (typeof this.addBlockToUpdate === 'function') {
                    this.addBlockToUpdate(sourceX, sourceY); // Update after source block changes
                }

                this.setBlock(neighborX, neighborY, resultBlockType);  // Interacting block transforms
                if (typeof this.addBlockToUpdate === 'function') {
                    this.addBlockToUpdate(neighborX, neighborY); // Update after neighbor block changes
                }

                if (resultBlockType === BlockTypes.STONE || resultBlockType === BlockTypes.GOLD_ORE) { // Check against direct BlockType
                    if (window.game && window.game.sound) { // MODIFIED: soundSystem to sound
                        window.game.sound.playTone(100, 0.2, 'sawtooth'); // Generic interaction sound
                    }
                }
                return true; // Interaction occurred
            }
            return false;
        };

        // Interaction checks with adjacent blocks (2D: up, down, left, right)
        const interactionDirections = [
            { dx: 0, dy: 1 },  // Down
            { dx: 0, dy: -1 }, // Up
            { dx: 1, dy: 0 },  // Right
            { dx: -1, dy: 0 }  // Left
        ];

        for (const dir of interactionDirections) {
            const nx = x + dir.dx;
            const ny = y + dir.dy;

            if (!this.isValidPosition(nx, ny)) continue;

            // Check specific interactions based on the current liquid type
            if (type === BlockTypes.WATER) {
                if (checkAndTransform(x, y, nx, ny, BlockTypes.LAVA, BlockTypes.STONE)) return true;
                if (checkAndTransform(x, y, nx, ny, BlockTypes.ACID, BlockTypes.GOLD_ORE)) return true; // MODIFIED: Water + Acid = Gold Ore
            } else if (type === BlockTypes.LAVA) {
                if (checkAndTransform(x, y, nx, ny, BlockTypes.WATER, BlockTypes.STONE)) return true;
                if (checkAndTransform(x, y, nx, ny, BlockTypes.ACID, BlockTypes.STONE)) return true;
            } else if (type === BlockTypes.ACID) {
                if (checkAndTransform(x, y, nx, ny, BlockTypes.WATER, BlockTypes.GOLD_ORE)) return true; // MODIFIED: Acid + Water = Gold Ore
                if (checkAndTransform(x, y, nx, ny, BlockTypes.LAVA, BlockTypes.STONE)) return true;
            }
        }

        // If an interaction changed the current block, stop further processing for this original liquid block
        if (this.getBlock(x, y) !== type) {
            return true; // Return true because an action (transformation) was taken
        }

        // Gravity: Try to flow down first
        const belowX = x;
        const belowY = y + 1; // Y increases downwards

        if (this.isValidPosition(belowX, belowY)) {
            const blockBelowType = this.getBlock(belowX, belowY);
            if (blockBelowType === BlockTypes.AIR) {
                // Re-check source block before moving, as an interaction might have occurred with a diagonal block
                // not covered by the direct adjacency checks above, or if checkAndTransform didn't return immediately.
                if (this.getBlock(x, y) === type) {
                    this.setBlock(belowX, belowY, type);
                    this.setBlock(x, y, BlockTypes.AIR);
                    if (typeof this.addBlockToUpdate === 'function') {
                        this.addBlockToUpdate(belowX, belowY);
                        this.addBlockToUpdate(x, y);
                    }
                    return true; // Action taken: flowed down
                } else {
                    return false; // Source block changed
                }
            }
        }

        // Horizontal spread: only if it can't flow down and wasn't transformed
        if (this.getBlock(x, y) !== type) {
            return false; // Source block changed
        }

        const horizontalDirections2D = [
            { dx: 1, dy: 0 },  // Right
            { dx: -1, dy: 0 }  // Left
        ];

        // Shuffle directions for more natural spread
        for (let i = horizontalDirections2D.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [horizontalDirections2D[i], horizontalDirections2D[j]] = [horizontalDirections2D[j], horizontalDirections2D[i]];
        }

        for (const dir of horizontalDirections2D) {
            const hx = x + dir.dx;
            const hy = y + dir.dy; // dir.dy is 0 for these horizontal directions

            if (this.isValidPosition(hx, hy)) { // Corrected: added parentheses
                const horizontalBlockType = this.getBlock(hx, hy);
                if (horizontalBlockType === BlockTypes.AIR) {
                    // Re-check source block before spreading
                    if (this.getBlock(x, y) === type) {
                        this.setBlock(hx, hy, type); // Duplicate liquid to the side
                        if (typeof this.addBlockToUpdate === 'function') {
                            this.addBlockToUpdate(hx, hy);
                        }
                        actionTaken = true; // Mark action, continue spreading to other horizontal blocks if possible
                    } else {
                        break; // Source block changed, stop spreading from this original source
                    }
                }
            }
        }
        return actionTaken; // Return whether any horizontal spread occurred
    }

    // Helper function to add particle effects for liquid flow
    addLiquidParticles(x, y, liquidType) {
        if (window.game?.particles) {
            const worldX = x * this.blockSize + this.blockSize / 2;
            const worldY = y * this.blockSize + this.blockSize / 2;

            if (liquidType === BlockTypes.WATER) {
                window.game.particles.addWaterSplash(worldX, worldY);
            } else if (liquidType === BlockTypes.LAVA) {
                window.game.particles.addLavaBurnEffect(worldX, worldY);
            } else if (liquidType === BlockTypes.ACID) {
                window.game.particles.addAcidBurnEffect(worldX, worldY);
            }
        }
    }

    // Old flowLiquidHorizontally and canLiquidFlowTo are removed or replaced by the logic above.
    // The canLiquidFlowTo was:
    // canLiquidFlowTo(x, y, liquidType) {
    //     if (!this.isValidPosition(x, y)) return false;
    //     const targetBlock = this.getBlock(x, y);
    //     if (targetBlock === BlockTypes.AIR) return true;
    //     if (liquidType === BlockTypes.WATER && this.isLiquid(targetBlock)) return true;
    //     return false;
    // }
    //
    // The flowLiquidHorizontally was:
    // flowLiquidHorizontally(fromX, fromY, toX, toY, liquidType) {
    //     const blockBelow = this.getBlock(toX, toY + 1);
    //     if (blockBelow === BlockTypes.AIR && this.isValidPosition(toX, toY + 1)) {
    //         this.setBlock(toX, toY, liquidType);
    //         // ... particle effects ...
    //     }
    // }
}
