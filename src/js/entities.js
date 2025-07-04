// Entity System for Minecraft Browser Game
// Handles mobs, NPCs, and other moving entities

// Entity types
const EntityTypes = {
    // Friendly mobs
    PIG: 'pig',
    COW: 'cow',
    CHICKEN: 'chicken',
    SHEEP: 'sheep',
    
    // Hostile mobs
    ZOMBIE: 'zombie',
    SKELETON: 'skeleton',
    SPIDER: 'spider',
    CREEPER: 'creeper'
};

// Arrow/Projectile class for skeleton ranged attacks
class Arrow {
    constructor(x, y, targetX, targetY, shooter) {
        this.x = x;
        this.y = y;
        this.shooter = shooter;
        this.width = 4;
        this.height = 2;
        this.speed = 300; // pixels per second
        this.damage = 2;
        this.alive = true;
        this.maxLifetime = 5000; // 5 seconds max flight time
        this.spawnTime = Date.now();
        
        // Calculate direction to target
        const dx = targetX - x;
        const dy = targetY - y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 0) {
            this.velocityX = (dx / distance) * this.speed;
            this.velocityY = (dy / distance) * this.speed;
        } else {
            this.velocityX = this.speed;
            this.velocityY = 0;
        }
        
        // Calculate arrow rotation for rendering
        this.rotation = Math.atan2(dy, dx);
    }
    
    update(deltaTime, world, player) {
        if (!this.alive) return;
        
        // Check lifetime
        if (Date.now() - this.spawnTime > this.maxLifetime) {
            this.alive = false;
            return;
        }
        
        // Update position
        this.x += this.velocityX * deltaTime;
        this.y += this.velocityY * deltaTime;
        
        // Check collision with player
        if (this.checkCollisionWithPlayer(player)) {
            player.takeDamage(this.damage);
            if (window.game?.notifications) {
                window.game.notifications.addNotification(
                    `🏹 Hit by arrow! -${this.damage} HP`, 
                    'damage', 
                    1500
                );
            }
            this.alive = false;
            return;
        }
        
        // Check collision with blocks
        if (this.checkCollisionWithWorld(world)) {
            this.alive = false;
            return;
        }
    }
    
    checkCollisionWithPlayer(player) {
        return this.x < player.x + player.width &&
               this.x + this.width > player.x &&
               this.y < player.y + player.height &&
               this.y + this.height > player.y;
    }
    
    checkCollisionWithWorld(world) {
        const blockX = Math.floor(this.x / world.blockSize);
        const blockY = Math.floor(this.y / world.blockSize);
        
        const block = world.getBlockInstance(blockX, blockY);
        return block && block.isSolid();
    }
    
    render(ctx, camera) {
        if (!this.alive) return;
        
        const screenX = this.x - camera.x;
        const screenY = this.y - camera.y;
        
        // Don't render if outside screen
        const canvasWidth = ctx.canvas ? ctx.canvas.width : 800;
        const canvasHeight = ctx.canvas ? ctx.canvas.height : 600;
        
        if (screenX < -10 || screenX > canvasWidth + 10 || 
            screenY < -10 || screenY > canvasHeight + 10) {
            return;
        }
        
        ctx.save();
        ctx.translate(screenX + this.width/2, screenY + this.height/2);
        ctx.rotate(this.rotation);
        
        // Arrow shaft
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(-8, -1, 12, 2);
        
        // Arrow head
        ctx.fillStyle = '#C0C0C0';
        ctx.fillRect(4, -2, 4, 4);
        
        // Arrow fletching
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(-6, -2, 2, 1);
        ctx.fillRect(-6, 1, 2, 1);
        
        ctx.restore();
    }
}

// Base Entity class
class Entity {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type;
        // 🔧 MOB SCALING: Increased size to match player proportions
        this.width = 24;  // Increased from 16 to match player width
        this.height = 32; // Increased from 16 to be proportional to player height
        this.velocityX = 0;
        this.velocityY = 0;
        this.onGround = false;
        this.health = 10;
        this.maxHealth = 10;
        this.alive = true;
          // AI properties
        this.targetX = x;
        this.targetY = y;
        this.moveSpeed = 20;
        this.baseMoveSpeed = 20; // Store original speed
        this.jumpSpeed = 200;
        this.lastDirectionChange = Date.now();
        this.directionChangeInterval = 2000 + Math.random() * 3000; // 2-5 seconds
        this.facing = Math.random() > 0.5 ? 1 : -1;
          // Animation
        this.animationTime = 0;
        this.animationFrame = 0;
        
        // TTL (Time To Live) system for entity management
        this.spawnTime = Date.now();
        this.maxLifespan = this.getMaxLifespan(); // Entity lifespan in milliseconds
        this.naturalDeath = false; // Flag for natural death (not killed by player)        // Behavior flags
        this.isHostile = this.getHostileFlag();
        this.detectionRange = this.isHostile ? 100 : 50;
        this.attackRange = 48; // Increased from 24 to allow proper melee combat
        this.attackDamage = this.getAttackDamage();
          // Creeper-specific properties
        this.isAboutToExplode = false;
        this.explosionTimer = 0;
        this.explosionDelay = 2000; // 2 seconds fuse time
        this.explosionRadius = 40; // Explosion radius for block damage
        this.lastCountdownSound = 0; // Track when last countdown sound played        // Drop items        
        this.dropItems = this.getDropItems();
        
        // FAILSAFE: If dropItems is empty for friendly mobs, force some default drops
        if ((!this.dropItems || this.dropItems.length === 0) && !this.isHostile) {
            switch(this.type) {
                case 'chicken':
                    this.dropItems = [{ type: 'food', name: 'chicken', amount: 1 }];
                    break;
                case 'pig':
                    this.dropItems = [{ type: 'food', name: 'pork', amount: 1 }];
                    break;
                case 'cow':
                    this.dropItems = [{ type: 'food', name: 'beef', amount: 1 }];
                    break;
                case 'sheep':
                    this.dropItems = [{ type: 'food', name: 'mutton', amount: 1 }];
                    break;
            }
        }
        this.lastAttackTime = 0;
        this.attackCooldown = 1000; // 1 second between attacks
        this.killedBy = null; // Tracks who killed this entity (\'player\', \'mob\', etc.)
        
        // Smart jumping system
        this.lastJumpTime = 0; // Track last jump time for cooldown

        // Skeleton-specific ranged attack properties
        if (this.type === EntityTypes.SKELETON) {
            this.rangedAttackRange = 120; // Longer range for bow attacks
            this.rangedAttackCooldown = 2500; // 2.5 seconds between arrow shots
            this.lastRangedAttackTime = 0;
            this.rangedAttackChance = 0.6; // 60% chance to use bow instead of melee when in range
            this.bowDrawTime = 800; // Time to draw bow before shooting
            this.isDrawingBow = false;
            this.bowDrawStartTime = 0;
        }        // Liquid and Oxygen properties for mobs
        this.inWater = false; // True if head is in water
        this.inLiquid = false; // True if any part is in any liquid (water, lava, acid)
        this.oxygen = 100;
        this.maxOxygen = 100;
        this.oxygenDepletionRate = 15; // O2 per second underwater, slightly faster for mobs
        this.oxygenRecoveryRate = 40; // O2 per second when not underwater
        this.lowOxygenDamageRate = 1; // Damage per second when O2 is 0
        this.lastOxygenDamageTime = 0;
        this.lastLiquidDamageTime = 0;
        // By default, mobs cannot breathe underwater. Specific mobs (e.g., fish, squid if added) could override this.
        // Undead mobs (Zombies, Skeletons) should not take drowning damage.
        this.canBreatheUnderwater = (this.type === EntityTypes.ZOMBIE || this.type === EntityTypes.SKELETON);
        
        // 🔥 SUNLIGHT BURN SYSTEM: Properties for hostile mobs burning in daylight
        this.isBurning = false;
        this.burnDamageRate = 1; // Damage per second when burning
        this.lastBurnDamageTime = 0;
        this.burnEffectTime = 0; // For visual burn effect animation
        this.canBurnInSunlight = this.isHostile; // Only hostile mobs burn in sunlight        // 🏔️ FALL DAMAGE SYSTEM: Track falling height for damage calculation
        this.fallStartHeight = this.y; // Height when falling started  
        this.maxFallHeight = this.y;   // Maximum height reached during fall
        this.isFalling = false;        // Whether entity is currently falling
        this.minDamageHeight = 3 * 32; // 3 blocks minimum height (32 = block size)
        this.fallDamageMultiplier = 1; // Damage per block fallen above minimum
        this.lastGroundY = this.y;     // Last Y position when on ground
        this.isVoluntaryJump = false;  // Track if currently in a voluntary jump
        this.maxVoluntaryJumpProtection = 5 * 32; // Max distance protected for voluntary jumps (5 blocks)
    }
    
    getHostileFlag() {
        return [EntityTypes.ZOMBIE, EntityTypes.SKELETON, EntityTypes.SPIDER, EntityTypes.CREEPER].includes(this.type);
    }    getAttackDamage() {
        switch(this.type) {
            case EntityTypes.ZOMBIE: return 3;
            case EntityTypes.SKELETON: return 2;
            case EntityTypes.SPIDER: return 2;
            case EntityTypes.CREEPER: return 8; // Explosion damage
            default: return 0;
        }
    }
    
    getMaxLifespan() {
        // TTL system: entities despawn after some time to prevent overcrowding
        switch(this.type) {
            case EntityTypes.ZOMBIE:
            case EntityTypes.SKELETON:
            case EntityTypes.SPIDER:
            case EntityTypes.CREEPER:
                return 300000; // Hostile mobs: 5 minutes
            case EntityTypes.PIG:
            case EntityTypes.COW:
            case EntityTypes.CHICKEN:
            case EntityTypes.SHEEP:
                return 600000; // Peaceful mobs: 10 minutes
            default:
                return 300000; // Default: 5 minutes
        }
    }    getDropItems() {
        // Define what items each mob drops when killed
        switch(this.type) {            case EntityTypes.PIG:
                const pigDrops = [{ type: 'food', name: 'pork', amount: 1 + Math.floor(Math.random() * 2) }];
                return pigDrops;
            case EntityTypes.COW:
                const cowDrops = [
                    { type: 'food', name: 'beef', amount: 1 + Math.floor(Math.random() * 2) },
                    { type: 'material', name: 'leather', amount: Math.floor(Math.random() * 2) }
                ];
                return cowDrops;
            case EntityTypes.CHICKEN:
                const chickenDrops = [
                    { type: 'food', name: 'chicken', amount: 1 },
                    { type: 'material', name: 'feather', amount: Math.floor(Math.random() * 3) }
                ];
                return chickenDrops;
            case EntityTypes.SHEEP:
                const sheepDrops = [
                    { type: 'food', name: 'mutton', amount: 1 + Math.floor(Math.random() * 2) },
                    { type: 'material', name: 'wool', amount: 1 + Math.floor(Math.random() * 2) }
                ];
                return sheepDrops;
            case EntityTypes.ZOMBIE:
                const zombieDrops = Math.random() < 0.1 ? [{ type: 'material', name: 'bone', amount: 1 }] : [];
                return zombieDrops;
            case EntityTypes.SKELETON:
                const skeletonDrops = [
                    { type: 'material', name: 'bone', amount: 1 + Math.floor(Math.random() * 2) },
                    { type: 'weapon', name: 'arrow', amount: Math.floor(Math.random() * 3) }
                ];
                return skeletonDrops;
            case EntityTypes.SPIDER:
                const spiderDrops = [{ type: 'material', name: 'string', amount: Math.floor(Math.random() * 3) }];
                return spiderDrops;
            case EntityTypes.CREEPER:
                const creeperDrops = [{ type: 'explosive', name: 'gunpowder', amount: Math.floor(Math.random() * 2) }];
                return creeperDrops;            default:
                console.warn(`Unknown entity type: "${this.type}"`);
                return [];
        }
    }

    mapDropNameToBlockType(dropName) {
        // Map drop item names to BlockTypes for materials inventory
        const mapping = {
            // Food items
            'pork': BlockTypes.PORK,
            'beef': BlockTypes.BEEF,
            'chicken': BlockTypes.CHICKEN_MEAT,
            'mutton': BlockTypes.MUTTON,
            
            // Material items
            'bone': BlockTypes.BONE,
            'leather': BlockTypes.LEATHER,
            'feather': BlockTypes.FEATHER,
            'wool': BlockTypes.WOOL,
            'string': BlockTypes.STRING,
            'gunpowder': BlockTypes.GUNPOWDER,
            
            // Weapon items
            'arrow': BlockTypes.ARROW
        };
        
        return mapping[dropName] || null;
    }
      update(deltaTime, world, player) {
        if (!this.alive) return;
        
        this.animationTime += deltaTime;
        
        // TTL system: check if entity should naturally despawn
        const currentTime = Date.now();
        if (currentTime - this.spawnTime > this.maxLifespan) {
            this.naturalDeath = true;
            this.alive = false;
            // 🔥 FIXED: Removed debug log for cleaner console output
            return;
        }        // Liquid and oxygen updates
        if (world) { // Ensure world is available
            this.checkLiquidStatus(world);
            this.updateOxygen(deltaTime);
        }
        
        // 🔥 SUNLIGHT BURN SYSTEM: Hostile mobs burn during daylight
        this.updateSunlightBurn(deltaTime);
          // Simple AI behavior
        this.updateAI(deltaTime, player, world);
        
        // Apply gravity
        this.velocityY += 800 * deltaTime; // Gravity
        
        // Update position
        this.x += this.velocityX * deltaTime;
        this.y += this.velocityY * deltaTime;
        
        // 🏔️ FALL DAMAGE SYSTEM: Track falling state and height for entities
        this.updateFallTracking();
        
        // Collision detection
        this.handleCollisions(world);
        
        // Boundary checks
        if (this.x < 0) this.x = 0;
        if (this.x > world.width * world.blockSize - this.width) {
            this.x = world.width * world.blockSize - this.width;
        }
        
        // Remove if fallen too far
        if (this.y > world.height * world.blockSize + 100) {
            this.alive = false;
        }    }
      updateAI(deltaTime, player, world) {
        const now = Date.now();
        const distanceToPlayer = this.getDistanceToPlayer(player);          // Hostile behavior - find targets (player or peaceful mobs)
        if (this.isHostile) {
            let target = null;
            let targetDistance = Infinity;
              // First priority: attack player if close enough
            if (distanceToPlayer < this.detectionRange) {
                target = player;
                targetDistance = distanceToPlayer;
            } else {
                // Second priority: find nearby peaceful mobs to attack
                const nearbyPeacefulMobs = this.findNearbyPeacefulMobs();
                if (nearbyPeacefulMobs.length > 0) {
                    // Attack closest peaceful mob
                    target = nearbyPeacefulMobs[0].mob;
                    targetDistance = nearbyPeacefulMobs[0].distance;
                }
            }
              // Special Creeper behavior
            if (this.type === EntityTypes.CREEPER && target && targetDistance < this.attackRange * 1.5) {
                if (!this.isAboutToExplode) {
                    // Start explosion countdown
                    this.isAboutToExplode = true;
                    this.explosionTimer = 0;
                    this.lastCountdownSound = 0;
                    
                    // Show warning notification
                    if (window.game?.notifications) {
                        window.game.notifications.addNotification(
                            `⚠️ CREEPER ABOUT TO EXPLODE!`, 
                            'warning', 
                            2000
                        );
                    }
                    
                    // Play initial countdown sound
                    if (window.game?.sound) {
                        window.game.sound.playCreeperCountdown();
                        this.lastCountdownSound = Date.now();
                    }
                }
                
                // Update explosion timer
                this.explosionTimer += deltaTime * 1000;
                
                // Play countdown sound every 400ms for that characteristic creeper hiss
                const now = Date.now();
                if (now - this.lastCountdownSound > 400) {
                    if (window.game?.sound) {
                        window.game.sound.playCreeperCountdown();
                        this.lastCountdownSound = now;
                    }
                }
                
                // Explode when timer reaches delay
                if (this.explosionTimer >= this.explosionDelay) {
                    this.explode(target);
                    return; // Exit early as creeper is now dead
                }
                
                // Stop moving when about to explode
                this.velocityX = 0;            } else {
                // Normal hostile behavior
                if (target) {
                    this.targetX = target.x;
                    this.targetY = target.y;
                    
                    // Special Skeleton ranged attack behavior
                    if (this.type === EntityTypes.SKELETON) {
                        this.handleSkeletonAttack(target, targetDistance, now);
                    }                    // Attack if close enough (non-creeper, non-skeleton mobs)
                    else if (this.type !== EntityTypes.CREEPER && targetDistance < this.attackRange && now - this.lastAttackTime > this.attackCooldown) {
                        if (target === player) {
                            this.attackPlayer(player);
                        } else {
                            this.attackMob(target);
                        }
                        this.lastAttackTime = now;
                    }
                } else {
                    // No targets found, wander randomly
                    if (now - this.lastDirectionChange > this.directionChangeInterval) {
                        this.chooseNewDirection();
                        this.lastDirectionChange = now;
                        this.directionChangeInterval = 2000 + Math.random() * 3000;
                    }
                }
            }
        } else {
            // Peaceful mob behavior - flee from hostile mobs
            const nearbyHostileMobs = this.findNearbyHostileMobs();
            if (nearbyHostileMobs.length > 0) {
                const threat = nearbyHostileMobs[0];
                // Run away from hostile mob
                this.fleeFrom(threat.mob);
            } else {
                // Normal passive wandering
                if (now - this.lastDirectionChange > this.directionChangeInterval) {
                    this.chooseNewDirection();
                    this.lastDirectionChange = now;
                    this.directionChangeInterval = 2000 + Math.random() * 3000;
                }
            }
        }
          // Move towards target
        const deltaX = this.targetX - this.x;
        if (Math.abs(deltaX) > 8) {
            this.facing = deltaX > 0 ? 1 : -1;
            
            // Check if mob has been stuck in same position
            const currentPos = { x: Math.floor(this.x), y: Math.floor(this.y) };
            if (!this.lastPosition) {
                this.lastPosition = currentPos;
                this.stuckCounter = 0;
            }
              // If mob hasn't moved much, increment stuck counter
            const distanceMoved = Math.abs(currentPos.x - this.lastPosition.x) + Math.abs(currentPos.y - this.lastPosition.y);
            if (distanceMoved < 3) { // Reduced threshold for more sensitive detection
                this.stuckCounter = (this.stuckCounter || 0) + 1;
            } else {
                this.stuckCounter = 0;
                this.lastPosition = currentPos;
            }
            
            // If stuck for too long, try alternative behavior
            if (this.stuckCounter > 20) { // Reduced from 30 to 20 (about 0.33 seconds)
                // Try to jump more aggressively
                if (this.onGround && this.shouldJump(world)) {
                    this.jump();
                }
                
                // Or try moving in a slightly different direction
                if (this.stuckCounter > 40) { // After 0.66 seconds, change target slightly
                    this.targetX += (Math.random() - 0.5) * 48; // Smaller random offset
                    this.stuckCounter = 0;
                }
            }
            
            this.velocityX = this.facing * this.moveSpeed;
        } else {
            this.velocityX *= 0.8; // Slow down when near target
        }
          // Jump if there's an obstacle
        if (this.shouldJump(world)) {
            this.jump();
        }
    }
      chooseNewDirection() {
        // Random movement for passive mobs
        const angle = Math.random() * Math.PI * 2;
        const distance = 50 + Math.random() * 100;
        this.targetX = this.x + Math.cos(angle) * distance;
        this.targetY = this.y; // Keep same Y level
        
        // Reset speed to normal when not fleeing
        if (!this.isHostile) {
            this.moveSpeed = this.baseMoveSpeed;
        }
    }
    
    getDistanceToPlayer(player) {
        const dx = this.x - (player.x + player.width / 2);
        const dy = this.y - (player.y + player.height / 2);
        return Math.sqrt(dx * dx + dy * dy);
    }    shouldJump(world) {
        if (!this.onGround || !world) return false;
          // Check for jump cooldown to prevent spam jumping
        const now = Date.now();
        if (!this.lastJumpTime) this.lastJumpTime = 0;
        if (now - this.lastJumpTime < 750) return false; // Reduced from 1000ms to 750ms
        
        // Only jump if we're actively moving
        if (Math.abs(this.velocityX) < 5) return false;
          // Intelligent obstacle detection
        const obstacleInfo = this.detectObstacleAhead(world);
        if (obstacleInfo.hasObstacle && obstacleInfo.canJumpOver) {
            this.lastJumpTime = now;
            // Optional debug logging (uncomment for testing)
            // console.log(`${this.type} jumping over ${obstacleInfo.height}-block obstacle`);
            return true;
        }
        
        // Small chance for random jumping (reduced from 2% to 0.3%)
        return Math.random() < 0.003;
    }
      detectObstacleAhead(world) {
        if (!world) return { hasObstacle: false, canJumpOver: false };
        
        // Look ahead in the direction of movement with improved distance
        const lookAheadDistance = this.width + 12; // Look further ahead
        const checkX = this.facing > 0 ? 
            this.x + this.width + lookAheadDistance : 
            this.x - lookAheadDistance;
        
        // Check for obstacles at mob's foot level and above
        const mobFootY = this.y + this.height;
        const mobCenterX = Math.floor(checkX / world.blockSize);
        const mobFootBlockY = Math.floor(mobFootY / world.blockSize);
        
        // Also check one block closer for more reliable detection
        const checkXClose = this.facing > 0 ? 
            this.x + this.width + 4 : 
            this.x - 4;
        const mobCenterXClose = Math.floor(checkXClose / world.blockSize);
        
        // Check if there's a solid block directly ahead at foot level (both close and far)
        const blockAhead = world.getBlock(mobCenterX, mobFootBlockY);
        const blockAheadClose = world.getBlock(mobCenterXClose, mobFootBlockY);
        const blockAbove = world.getBlock(mobCenterX, mobFootBlockY - 1);
        const blockAbove2 = world.getBlock(mobCenterX, mobFootBlockY - 2);
        
        // Check both close and far ahead positions
        const hasObstacleAhead = (blockAhead !== BlockTypes.AIR && world.isSolid(mobCenterX, mobFootBlockY)) ||
                                (blockAheadClose !== BlockTypes.AIR && world.isSolid(mobCenterXClose, mobFootBlockY));
        
        if (hasObstacleAhead) {
            // There's an obstacle - check if we can jump over it
            const obstacleHeight = Math.max(
                this.getObstacleHeight(world, mobCenterX, mobFootBlockY),
                this.getObstacleHeight(world, mobCenterXClose, mobFootBlockY)
            );
            
            const canJumpOver = obstacleHeight <= 2 && // Can jump over 1-2 block high obstacles
                               blockAbove2 === BlockTypes.AIR; // Need clear space above for landing
            
            return { 
                hasObstacle: true, 
                canJumpOver: canJumpOver,
                height: obstacleHeight 
            };
        }
        
        return { hasObstacle: false, canJumpOver: false };
    }
    
    getObstacleHeight(world, blockX, startY) {
        let height = 0;
        let checkY = startY;
        
        // Count how many blocks high the obstacle is (max 4 blocks to avoid infinite loops)
        while (height < 4 && checkY >= 0 && world.isSolid(blockX, checkY)) {
            height++;
            checkY--;
        }
        
        return height;
    }    jump() {
        if (this.onGround) {
            // Increase jump power to help clear obstacles
            this.velocityY = -this.jumpSpeed * 1.2; // 20% more jump power for obstacle clearing
            this.onGround = false;
            
            // 🏔️ FALL DAMAGE SYSTEM: Mark this as a voluntary jump (no fall damage)
            this.isVoluntaryJump = true;
            // DON'T reset fall tracking here - just reset the falling state and heights
            // but keep the voluntary jump flag intact
            this.isFalling = false;
            this.maxFallHeight = this.y;
            this.fallStartHeight = this.y;
            this.lastGroundY = this.y;
            
            // Add a small forward boost when jumping to help clear obstacles
            if (Math.abs(this.velocityX) > 0) {
                const jumpBoost = this.facing * 10; // Small forward momentum
                this.velocityX += jumpBoost;
            }
              // Visual feedback - spawn jump particles if particle system exists
            if (window.game?.particles) {
                window.game.particles.addJumpDust(this.x, this.y + this.height);
            }
            
            // 🔊 JUMP SOUND: Disabled for mobs to prevent audio clutter
            // Only player should make jump sounds for better user experience
            // if (window.game?.sound) {
            //     window.game.sound.playJump();
            // }
        }
    }attackPlayer(player) {        
        // Simple attack - deal damage to player
        if (this.type === EntityTypes.CREEPER) {
            // Creeper explosion (simplified)
            player.takeDamage(this.attackDamage, this); // Pass self as attacker
            this.alive = false; // Creeper dies after explosion
        } else {
            player.takeDamage(this.attackDamage, this); // Pass self as attacker
        }
    }
    
    attackMob(targetMob) {
        // Mob-vs-mob combat
        if (this.type === EntityTypes.CREEPER) {
            // Creeper explosion damages the target mob
            targetMob.takeDamage(this.attackDamage, this); // Pass self as attacker
            this.alive = false; // Creeper dies after explosion
            
            // Show explosion notification ONLY if the target is the player or it's a mob vs mob that the player should be aware of.
            // For now, let's assume player should always be notified of creeper explosions near other mobs.
            if (window.game?.notifications) {
                window.game.notifications.addNotification(
                    `💥 Creeper exploded near ${targetMob.type}!`, 
                    'warning', 
                    3000
                );
            }
        } else {
            targetMob.takeDamage(this.attackDamage, this); // Pass self as attacker
            
            // NO notification or sound if a hostile mob attacks a peaceful mob.
            // Player should only be notified/hear sounds for actions directly involving them or their direct kills.
            // if (window.game?.notifications) {
            //     window.game.notifications.addNotification(
            //         `⚔️ ${this.type} attacked ${targetMob.type}!`, 
            //         'combat', 
            //         2000
            //     );
            // }
        }
          // NO sound if a hostile mob attacks a peaceful mob.
        // if (window.game?.sound) {
        //     window.game.sound.playDamage();
        // }
    }
    
    // Skeleton-specific attack handler
    handleSkeletonAttack(target, targetDistance, now) {
        // Handle bow drawing state
        if (this.isDrawingBow) {
            // Check if bow draw time is complete
            if (now - this.bowDrawStartTime >= this.bowDrawTime) {
                // Shoot arrow
                this.shootArrow(target);
                this.isDrawingBow = false;
                this.lastRangedAttackTime = now;
                this.lastAttackTime = now;
            }
            // Stop moving while drawing bow
            this.velocityX = 0;
            return;
        }
        
        // Decide between ranged and melee attack
        const useRangedAttack = targetDistance <= this.rangedAttackRange && 
                               targetDistance > this.attackRange * 1.5 && // Prefer ranged if not too close
                               Math.random() < this.rangedAttackChance &&
                               now - this.lastRangedAttackTime > this.rangedAttackCooldown;
        
        if (useRangedAttack) {
            // Start drawing bow
            this.isDrawingBow = true;
            this.bowDrawStartTime = now;
            
            // Show notification for arrow attack
            if (target === window.game?.player && window.game?.notifications) {
                window.game.notifications.addNotification(
                    `🏹 Skeleton is drawing its bow!`, 
                    'warning', 
                    1500
                );
            }
        }
        // Melee attack if close enough
        else if (targetDistance < this.attackRange && now - this.lastAttackTime > this.attackCooldown) {
            if (target === window.game?.player) {
                this.attackPlayer(target);
            } else {
                this.attackMob(target);
            }
            this.lastAttackTime = now;
        }
    }
    
    // Shoot arrow at target
    shootArrow(target) {
        if (!window.game?.entityManager) return;
        
        // Calculate arrow spawn position (from skeleton's bow)
        const arrowX = this.x + this.width / 2;
        const arrowY = this.y + this.height / 3; // Bow height
        
        // Calculate target position with some prediction for moving targets
        let targetX = target.x + target.width / 2;
        let targetY = target.y + target.height / 2;
        
        // Lead the target if it's moving
        if (target.velocityX && Math.abs(target.velocityX) > 10) {
            const timeToTarget = Math.sqrt(
                Math.pow(targetX - arrowX, 2) + Math.pow(targetY - arrowY, 2)
            ) / 300; // Arrow speed
            targetX += target.velocityX * timeToTarget * 0.5; // Lead by half the time
        }
        
        // Create and add arrow to entity manager
        const arrow = new Arrow(arrowX, arrowY, targetX, targetY, this);
        
        // Add arrow to a separate arrows array in entity manager
        if (!window.game.entityManager.arrows) {
            window.game.entityManager.arrows = [];
        }
        window.game.entityManager.arrows.push(arrow);
          // Play arrow shooting sound
        if (window.game?.sound) {
            // Use existing damage sound or create new arrow sound
            window.game.sound.playPlayerDamage(); // Using available sound function
        }
        
        // 🔥 FIXED: Removed debug log for cleaner console output
    }
    
    findNearbyPeacefulMobs() {
        if (!window.game?.entityManager) return [];
        
        const peacefulMobs = [];
        
        for (const entity of window.game.entityManager.entities) {
            if (entity === this || !entity.alive || entity.isHostile) continue;
            
            const distance = this.getDistanceToEntity(entity);
            if (distance < this.detectionRange) {
                peacefulMobs.push({ mob: entity, distance: distance });
            }
        }
        
        // Sort by distance (closest first)
        peacefulMobs.sort((a, b) => a.distance - b.distance);
        return peacefulMobs;
    }
    
    findNearbyHostileMobs() {
        if (!window.game?.entityManager) return [];
        
        const hostileMobs = [];
        
        for (const entity of window.game.entityManager.entities) {
            if (entity === this || !entity.alive || !entity.isHostile) continue;
            
            const distance = this.getDistanceToEntity(entity);
            if (distance < this.detectionRange) {
                hostileMobs.push({ mob: entity, distance: distance });
            }
        }
        
        // Sort by distance (closest first)
        hostileMobs.sort((a, b) => a.distance - b.distance);
        return hostileMobs;
    }
    
    getDistanceToEntity(entity) {
        const dx = this.x + this.width / 2 - (entity.x + entity.width / 2);
        const dy = this.y + this.height / 2 - (entity.y + entity.height / 2);
        return Math.sqrt(dx * dx + dy * dy);
    }
      fleeFrom(threatMob) {
        // Calculate direction away from threat
        const dx = this.x - threatMob.x;
        const dy = this.y - threatMob.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 0) {
            // Set target position away from threat
            const fleeDistance = 100;
            this.targetX = this.x + (dx / distance) * fleeDistance;
            this.targetY = this.y; // Keep same Y level
            
            // Increase movement speed when fleeing
            this.moveSpeed = 30; // Faster when scared
        }
    }
    
    explode(target) {
        // Damage the target
        if (target) {
            // Pass 'this' (the creeper) as the attacker
            target.takeDamage(this.attackDamage, this);
        }
        
        // Damage blocks in explosion radius
        this.damageBlocks();
        
        // Create explosion effect
        if (window.game?.particles) {
            // Create explosion particles
            for (let i = 0; i < 15; i++) {
                window.game.particles.addGlitter(
                    this.x + this.width / 2 + (Math.random() - 0.5) * this.explosionRadius,
                    this.y + this.height / 2 + (Math.random() - 0.5) * this.explosionRadius
                );
            }
        }
        
        // Show explosion notification
        if (window.game?.notifications) {
            window.game.notifications.addNotification(
                `💥 CREEPER EXPLODED! Blocks damaged!`, 
                'warning', 
                4000
            );
        }
        
        // Play explosion sound
        if (window.game?.sound) {
            window.game.sound.playExplosion(); // Use new explosion sound
        }
        
        // Kill the creeper
        this.alive = false;
    }
      damageBlocks() {
        if (!window.game?.world) return;
        
        const world = window.game.world;
        const centerX = this.x + this.width / 2;
        const centerY = this.y + this.height / 2;
        
        // Calculate block coordinates for explosion area
        const startBlockX = Math.max(0, Math.floor((centerX - this.explosionRadius) / world.blockSize));
        const endBlockX = Math.min(world.width - 1, Math.floor((centerX + this.explosionRadius) / world.blockSize));
        const startBlockY = Math.max(0, Math.floor((centerY - this.explosionRadius) / world.blockSize));
        const endBlockY = Math.min(world.height - 1, Math.floor((centerY + this.explosionRadius) / world.blockSize));
        
        let blocksDestroyed = 0;
        const blocksToDestroy = []; // Track blocks and their distances for guaranteed destruction
        
        // First pass: collect all destructible blocks with their distances
        for (let bx = startBlockX; bx <= endBlockX; bx++) {
            for (let by = startBlockY; by <= endBlockY; by++) {
                const blockWorldX = bx * world.blockSize + world.blockSize / 2;
                const blockWorldY = by * world.blockSize + world.blockSize / 2;
                
                // Calculate distance from explosion center
                const distance = Math.sqrt(
                    Math.pow(blockWorldX - centerX, 2) + 
                    Math.pow(blockWorldY - centerY, 2)
                );
                
                // Only consider blocks within explosion radius
                if (distance <= this.explosionRadius) {
                    const currentBlock = world.getBlock(bx, by);
                    
                    // Don't destroy bedrock or air blocks
                    if (currentBlock !== BlockTypes.AIR && currentBlock !== BlockTypes.BEDROCK) {
                        blocksToDestroy.push({
                            x: bx,
                            y: by,
                            distance: distance,
                            block: currentBlock
                        });
                    }
                }
            }
        }
        
        // Sort blocks by distance (closest first) to prioritize destruction
        blocksToDestroy.sort((a, b) => a.distance - b.distance);
        
        // Second pass: destroy blocks with guaranteed minimum
        for (let i = 0; i < blocksToDestroy.length; i++) {
            const blockInfo = blocksToDestroy[i];
            let shouldDestroy = false;
            
            if (blocksDestroyed < 2) {
                // Guarantee at least 2 blocks are destroyed (closest ones)
                shouldDestroy = true;
            } else {
                // Use probability for remaining blocks
                const blockInstance = world.getBlockInstance(blockInfo.x, blockInfo.y);
                let destructionChance = 0.7; // Base chance
                if (blockInstance && blockInstance.hardness) {
                    // Reduce chance for harder blocks
                    destructionChance /= blockInstance.hardness;
                }
                shouldDestroy = Math.random() < destructionChance;
            }
            
            if (shouldDestroy) {
                world.setBlock(blockInfo.x, blockInfo.y, BlockTypes.AIR);
                blocksDestroyed++;
            }
        }
        
        // 🔥 FIXED: Removed debug log for cleaner console output
    }
      handleCollisions(world) {
        // Safety checks to prevent crashes
        if (!world || !world.blockSize || world.blockSize <= 0) {
            console.warn('Invalid world object in handleCollisions');
            return;
        }

        if (!this.x || !this.y || !this.width || !this.height) {
            console.warn('Invalid entity dimensions in handleCollisions');
            return;
        }

        this.onGround = false;
        
        try {
            // Get potential collision blocks with boundary checks
            const startX = Math.max(0, Math.floor(this.x / world.blockSize));
            const endX = Math.min(world.width - 1, Math.floor((this.x + this.width) / world.blockSize));
            const startY = Math.max(0, Math.floor(this.y / world.blockSize));
            const endY = Math.min(world.height - 1, Math.floor((this.y + this.height) / world.blockSize));
            
            // Additional safety check
            if (startX > endX || startY > endY) {
                return;
            }
            
            for (let bx = startX; bx <= endX; bx++) {
                for (let by = startY; by <= endY; by++) {
                    // Additional boundary checks
                    if (bx < 0 || bx >= world.width || by < 0 || by >= world.height) {
                        continue;
                    }

                    const block = world.getBlockInstance(bx, by);
                    if (block && typeof block.isSolid === 'function' && block.isSolid()) {
                        const blockX = bx * world.blockSize;
                        const blockY = by * world.blockSize;
                        
                        // Check collision with additional safety checks
                        if (this.x < blockX + world.blockSize &&
                            this.x + this.width > blockX &&
                            this.y < blockY + world.blockSize &&
                            this.y + this.height > blockY) {
                            
                            // Resolve collision with safe calculations
                            const overlapX = Math.min(
                                Math.abs(this.x + this.width - blockX), 
                                Math.abs(blockX + world.blockSize - this.x)
                            );
                            const overlapY = Math.min(
                                Math.abs(this.y + this.height - blockY), 
                                Math.abs(blockY + world.blockSize - this.y)
                            );
                            

                            // Prevent infinite values
                            if (!isFinite(overlapX) || !isFinite(overlapY)) {
                                continue;
                            }
                              if (overlapX < overlapY) {
                                // Horizontal collision
                                if (this.x < blockX) {
                                    this.x = blockX - this.width;
                                } else {
                                    this.x = blockX + world.blockSize;
                                }
                                
                                // Instead of completely stopping, try to find alternative path
                                if (this.velocityX !== 0) {
                                    // Check if we can move around the obstacle
                                    const canMoveUp = !world.isSolid(Math.floor((this.x + this.width/2) / world.blockSize), 
                                                                   Math.floor((this.y - 8) / world.blockSize));
                                    const canMoveDown = !world.isSolid(Math.floor((this.x + this.width/2) / world.blockSize), 
                                                                     Math.floor((this.y + this.height + 8) / world.blockSize));
                                    
                                    // Small upward/downward nudge to help navigate around obstacles
                                    if (canMoveUp && Math.random() < 0.3) {
                                        this.velocityY -= 20;
                                    } else if (canMoveDown && Math.random() < 0.3 && !this.onGround) {
                                        this.velocityY += 20;
                                    }
                                }
                                

                                this.velocityX = 0;                            } else {                                // Vertical collision
                                if (this.y < blockY) {
                                    // 🏔️ FALL DAMAGE SYSTEM: Check for fall damage before landing
                                    if (this.velocityY > 0 && this.isFalling) {
                                        this.applyFallDamage();
                                    }
                                    
                                    // 🦵 LANDING EFFECTS: Add visual impact effects only for significant landings
                                    if (this.velocityY > 0 && window.game?.particles && this.isFalling) {
                                        const fallHeight = this.y - this.maxFallHeight; // Calculate fall height before reset
                                        // Only show effects for falls of at least 0.5 blocks (16 pixels) to avoid constant effects
                                        if (fallHeight > 16) {
                                            window.game.particles.addLandingImpact(this.x, this.y + this.height, fallHeight, this.width);
                                        }
                                    }
                                      // 🔊 LANDING SOUND: Disabled for mobs to prevent audio clutter  
                                    // Only player should make landing sounds for better user experience
                                    // if (this.velocityY > 0 && window.game?.sound && this.isFalling) {
                                    //     window.game.sound.playLanding();
                                    // }
                                    
                                    this.y = blockY - this.height;
                                    this.velocityY = 0;
                                    this.onGround = true;
                                    
                                    // 🏔️ FALL DAMAGE SYSTEM: Reset fall tracking when landing
                                    this.resetFallTracking();
                                } else {
                                    this.y = blockY + world.blockSize;
                                    this.velocityY = 0;
                                }
                            }
                            
                            // Ensure entity position remains valid
                            this.x = Math.max(0, Math.min(this.x, world.width * world.blockSize - this.width));
                            this.y = Math.max(0, Math.min(this.y, world.height * world.blockSize - this.height));
                        }
                    }
                }
            }
        } catch (error) {
            console.error('Error in handleCollisions:', error);
            // Reset to safe position if collision detection fails
            this.velocityX = 0;
            this.velocityY = 0;
        }
    }
    checkLiquidStatus(world) {
        if (!world || !this.alive) return;

        const entityFootX = Math.floor((this.x + this.width / 2) / world.blockSize);
        const entityFootY = Math.floor((this.y + this.height) / world.blockSize);
        const entityHeadX = Math.floor((this.x + this.width / 2) / world.blockSize);
        const entityHeadY = Math.floor(this.y / world.blockSize);

        const blockAtFeet = world.getBlock(entityFootX, entityFootY);
        const blockAtHead = world.getBlock(entityHeadX, entityHeadY);

        // For oxygen, only head in water matters
        this.inWater = blockAtHead === BlockTypes.WATER;
        // For general liquid physics/damage, any part in liquid matters
        this.inLiquid = [BlockTypes.WATER, BlockTypes.LAVA, BlockTypes.ACID].includes(blockAtFeet) ||
                        [BlockTypes.WATER, BlockTypes.LAVA, BlockTypes.ACID].includes(blockAtHead);

        // Damage from dangerous liquids (Lava, Acid)
        // Mobs take damage if their feet or head are in a dangerous liquid.
        const now = Date.now();
        let dangerousLiquidType = null;

        if (blockAtFeet === BlockTypes.LAVA || blockAtHead === BlockTypes.LAVA) {
            dangerousLiquidType = BlockTypes.LAVA;
        } else if (blockAtFeet === BlockTypes.ACID || blockAtHead === BlockTypes.ACID) {
            dangerousLiquidType = BlockTypes.ACID;
        }

        if (dangerousLiquidType) {
            if (now - this.lastLiquidDamageTime > 1000) { // Damage every 1 second for mobs in dangerous liquids
                const damageAmount = dangerousLiquidType === BlockTypes.LAVA ? 4 : 2; // Lava hurts more
                this.takeDamage(damageAmount, 'liquid'); // Attacker is 'liquid'
                this.lastLiquidDamageTime = now;
                // console.log(`${this.type} taking ${damageAmount} damage from ${BlockNames[dangerousLiquidType]}`);

                // Optional: Add particle effect for mob taking liquid damage
                if (window.game?.particles) {
                    window.game.particles.addDamageEffect(this.x + this.width / 2, this.y + this.height / 2);
                }
            }
        } else {
            this.lastLiquidDamageTime = 0; // Reset timer if not in dangerous liquid
        }
    }

    updateOxygen(deltaTime) {
        if (!this.alive || this.canBreatheUnderwater) return; // No oxygen logic if can breathe underwater or dead

        const now = Date.now();
        if (this.inWater) { // Oxygen depletes if head is in water
            this.oxygen -= this.oxygenDepletionRate * deltaTime;
            if (this.oxygen < 0) this.oxygen = 0;

            if (this.oxygen === 0) {
                if (now - this.lastOxygenDamageTime > 1000) { // Damage every 1 second
                    this.takeDamage(this.lowOxygenDamageRate, 'drowning'); // Attacker is 'drowning'
                    this.lastOxygenDamageTime = now;
                    // console.log(`${this.type} taking ${this.lowOxygenDamageRate} damage from drowning`);
                     // Optional: Add particle effect for mob drowning
                }
            }        } else {
            // Recover oxygen if not in water (head not submerged)
            if (this.oxygen < this.maxOxygen) {
                this.oxygen += this.oxygenRecoveryRate * deltaTime;
                if (this.oxygen > this.maxOxygen) this.oxygen = this.maxOxygen;
            }
        }
    }    // 🏔️ FALL DAMAGE SYSTEM: Track falling state and maximum height for entities
    updateFallTracking() {
        // If moving downward (positive velocityY), we're falling
        if (this.velocityY > 0) {
            if (!this.isFalling) {
                // Start of fall - record starting height
                this.isFalling = true;
                this.fallStartHeight = this.maxFallHeight; // Use the highest point reached
            }
            
            // ⚠️ VOLUNTARY JUMP PROTECTION LIMIT: Disable protection if falling too far
            if (this.isVoluntaryJump) {
                const currentFallDistance = this.y - this.maxFallHeight;
                if (currentFallDistance > this.maxVoluntaryJumpProtection) {
                    this.isVoluntaryJump = false; // Disable protection after falling 5+ blocks
                    // Note: Entities don't show notifications like players, but protection is removed
                }
            }
            
            // DON'T clear voluntary jump flag here - only clear it when landing or protection limit reached
            // This allows voluntary jumps to remain protected throughout the entire jump (up to the limit)
        } else if (this.velocityY < 0) {
            // Moving upward - update maximum height reached
            this.maxFallHeight = Math.min(this.maxFallHeight, this.y);
        }
        
        // Always track the maximum height (lowest Y value) reached
        if (this.y < this.maxFallHeight) {
            this.maxFallHeight = this.y;
        }
    }
      // 🏔️ FALL DAMAGE SYSTEM: Apply fall damage when entity lands
    applyFallDamage() {
        // Don't apply damage if this was a voluntary jump
        if (!this.isFalling || !this.alive || this.isVoluntaryJump) return;
        
        // Calculate fall distance in pixels
        const fallDistance = this.y - this.maxFallHeight;
        
        // Only apply damage if fall is significant (more than 3 blocks)
        if (fallDistance > this.minDamageHeight) {
            // Calculate damage: 1 damage per block beyond the minimum
            const blocksSize = 32; // Standard block size
            const excessBlocks = Math.floor((fallDistance - this.minDamageHeight) / blocksSize);
            const damage = Math.max(1, excessBlocks * this.fallDamageMultiplier);
            
            // Apply the damage
            this.takeDamage(damage, 'fall');
            
            // Show notification only for visible mobs or if near player
            const distanceToPlayer = window.game?.player ? 
                this.getDistanceToPlayer(window.game.player) : Infinity;
            
            if (distanceToPlayer < 150 && window.game?.notifications) { // Only show if close to player
                window.game.notifications.addNotification(
                    `💥 ${this.type.toUpperCase()} took fall damage! -${damage} HP`,
                    'info',
                    2000
                );
            }
            
            // Add visual effects
            if (window.game?.particles && distanceToPlayer < 200) { // Only show effects if reasonably close
                // Add impact particles at landing point
                for (let i = 0; i < 5; i++) {
                    window.game.particles.addDamageEffect(
                        this.x + this.width / 2 + (Math.random() - 0.5) * 15,
                        this.y + this.height
                    );
                }
            }
        }
    }
      // 🏔️ FALL DAMAGE SYSTEM: Reset fall tracking when entity is on ground
    resetFallTracking() {
        this.isFalling = false;
        this.maxFallHeight = this.y;
        this.fallStartHeight = this.y;
        this.lastGroundY = this.y;
        this.isVoluntaryJump = false; // Reset voluntary jump flag
    }    updateSunlightBurn(deltaTime) {
        if (!this.alive || !this.canBurnInSunlight) return;
        
        // Check if it's daytime and mob is exposed to sunlight
        const isDay = window.game?.timeSystem?.isDay() || false;
        
        // Check for weather-based protection during precipitation
        let weatherProtection = false;
        if (window.game?.weather) {
            const currentWeather = window.game.weather.getCurrentWeather();
            if (currentWeather && currentWeather.type) {
                // Precipitation weather types provide protection from sunlight burning
                const precipitationWeatherTypes = ['rain', 'storm', 'snow', 'blizzard', 'hail'];
                weatherProtection = precipitationWeatherTypes.includes(currentWeather.type);
            }
        }
        
        if (isDay && !this.inWater && !weatherProtection) {
            // Start burning if not already burning
            if (!this.isBurning) {
                this.isBurning = true;
                this.burnEffectTime = 0;
                
                // Show notification for hostile mob burning
                if (window.game?.notifications) {
                    window.game.notifications.addNotification(
                        `☀️ ${this.type.toUpperCase()} burns in sunlight!`, 
                        'warning', 
                        3000
                    );
                }
            }
            
            // Apply burn damage
            const now = Date.now();
            if (now - this.lastBurnDamageTime > 1000) { // Damage every second
                this.takeDamage(this.burnDamageRate, 'sunlight');
                this.lastBurnDamageTime = now;
            }
            
            // Update burn effect animation
            this.burnEffectTime += deltaTime;
        } else {
            // Stop burning if it's night, mob is in water, or weather provides protection
            if (this.isBurning) {
                this.isBurning = false;
                this.burnEffectTime = 0;
            }
        }
    }    takeDamage(amount, attacker = null) { // Added attacker parameter
        this.health -= amount;
        
        if (this.health <= 0) {
            this.alive = false;
            
            // More robust attacker identification that doesn't rely on instanceof
            if (attacker && attacker.constructor && attacker.constructor.name === 'Player') {
                this.killedBy = 'player';
            } else if (attacker && attacker.type && typeof attacker.type === 'string' && attacker.isHostile !== undefined) {
                // This is likely an Entity (has type property and isHostile flag)
                this.killedBy = 'mob';
            } else if (typeof attacker === 'string') {
                // String attacker (e.g., 'liquid', 'drowning', 'environment')
                this.killedBy = attacker;
            } else if (attacker && attacker.inventory && attacker.materialsInventory) {
                // Another way to detect player - has inventory properties
                this.killedBy = 'player';
            } else {
                this.killedBy = 'environment';
            }
            
            this.onDeath();
        }
    }onDeath() {
        // Only count kills and drop items if killed by player (not natural death)
        if (!this.naturalDeath && this.killedBy === 'player') {
            // Safe access to game systems
            if (window.game?.entityManager) {
                window.game.entityManager.entitiesKilled++;
            }
            
            // Play death sound only if killed by player
            if (window.game?.sound) {
                window.game.sound.playMobDeath();
            }
            
            // Drop items when mob dies (only when killed by player)
            if (this.dropItems && this.dropItems.length > 0) {
                // Actually add items to player's materials inventory (NOT main inventory)
                if (window.game?.player) {
                    this.dropItems.forEach(item => {
                        const materialType = this.mapDropNameToBlockType(item.name);
                        if (materialType !== null) {
                            // Force adding to materials inventory for mob drops
                            window.game.player.addToMaterialsInventory(materialType, item.amount);
                        }
                    });
                }
                
                // Show notification for drops with enhanced message only if killed by player
                if (window.game?.notifications) {
                    let dropMessage = `💀 ${this.type.toUpperCase()} KILLED! ` ;
                    dropMessage += "Dropped: " + this.dropItems.map(item => `${item.amount}x ${item.name}`).join(", ");
                    window.game.notifications.addNotification(dropMessage, 'success', 4000);
                }
                
                // Create visual drop effect only if killed by player
                if (window.game?.particles) {
                    // Add sparkle effect where mob died
                    for (let i = 0; i < 5; i++) {
                        window.game.particles.addGlitter(
                            this.x + this.width / 2 + (Math.random() - 0.5) * 20,
                            this.y + this.height / 2 + (Math.random() - 0.5) * 20
                        );
                    }
                }
            }
        }
    }    render(ctx, camera) {
        if (!this.alive) return;
        
        // Since we're now rendering in world coordinates due to EntityManager zoom transform,
        // we render directly at entity's world position
        const worldX = this.x;
        const worldY = this.y;
        
        // Get canvas dimensions for bounds checking (need to account for zoom)
        const zoom = camera.zoom || 1.0;
        const canvasWidth = ctx.canvas ? ctx.canvas.width / zoom : 800 / zoom;
        const canvasHeight = ctx.canvas ? ctx.canvas.height / zoom : 600 / zoom;
        const buffer = 150 / zoom; // Adjust buffer for zoom level
        
        // Check bounds in world coordinates relative to camera
        if (worldX < camera.x - this.width - buffer || 
            worldX > camera.x + canvasWidth + buffer || 
            worldY < camera.y - this.height - buffer || 
            worldY > camera.y + canvasHeight + buffer) {
            return;
        }
        
        // Ensure entity is always visible regardless of lighting
        ctx.save();
        ctx.globalCompositeOperation = 'source-over'; // Normal rendering for entities
        
        // Add fire visual effects for burning mobs
        if (this.isBurning && this.isHostile) {
            this.renderBurningEffects(ctx, worldX, worldY);
        }
        
        this.renderEntity(ctx, worldX, worldY);
        
        // Health bar for hostile mobs or when damaged
        if ((this.isHostile || this.health < this.maxHealth) && this.health > 0) {
            this.renderHealthBar(ctx, worldX, worldY);
        }
        
        // Add fire particles for burning mobs
        if (this.isBurning && this.isHostile) {
            // Add fire particles periodically
            if (Math.random() < 0.3 && window.game?.particles) {
                const centerX = this.x + this.width / 2;
                const centerY = this.y + this.height / 2;
                window.game.particles.addSunlightFireEffect(centerX, centerY);
            }
        }
        
        ctx.restore();
    }
    
    renderEntity(ctx, screenX, screenY) {
        const moving = Math.abs(this.velocityX) > 5;
        const animOffset = moving ? Math.sin(this.animationTime * 10) * 2 : 0;
        
        switch(this.type) {
            case EntityTypes.PIG:
                this.renderPig(ctx, screenX, screenY, animOffset);
                break;
            case EntityTypes.COW:
                this.renderCow(ctx, screenX, screenY, animOffset);
                break;
            case EntityTypes.CHICKEN:
                this.renderChicken(ctx, screenX, screenY, animOffset);
                break;
            case EntityTypes.SHEEP:
                this.renderSheep(ctx, screenX, screenY, animOffset);
                break;
            case EntityTypes.ZOMBIE:
                this.renderZombie(ctx, screenX, screenY, animOffset);
                break;
            case EntityTypes.SKELETON:
                this.renderSkeleton(ctx, screenX, screenY, animOffset);
                break;
            case EntityTypes.SPIDER:
                this.renderSpider(ctx, screenX, screenY, animOffset);
                break;
            case EntityTypes.CREEPER:
                this.renderCreeper(ctx, screenX, screenY, animOffset);
                break;
        }
    }
      renderPig(ctx, x, y, animOffset) {
        // 🔧 SCALED: Pig body (increased scale)
        ctx.fillStyle = '#FFB6C1';
        ctx.fillRect(x + 3, y + 12, 18, 9);
        
        // Pig head
        ctx.fillRect(x + 6, y + 6, 12, 9);
        
        // Pig legs
        ctx.fillStyle = '#FFB6C1';
        ctx.fillRect(x + 4, y + 18 + animOffset, 3, 6);
        ctx.fillRect(x + 9, y + 18 - animOffset, 3, 6);
        ctx.fillRect(x + 12, y + 18 + animOffset, 3, 6);
        ctx.fillRect(x + 16, y + 18 - animOffset, 3, 6);
        
        // Pig snout
        ctx.fillStyle = '#FF69B4';
        ctx.fillRect(x + 9, y + 9, 6, 3);
        
        // Eyes
        ctx.fillStyle = '#000';
        ctx.fillRect(x + 7, y + 7, 1, 1);
        ctx.fillRect(x + 15, y + 7, 1, 1);
    }
      renderCow(ctx, x, y, animOffset) {
        // 🔧 SCALED: Cow body (increased scale)
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(x + 1, y + 12, 21, 9);
        
        // Cow head
        ctx.fillRect(x + 4, y + 4, 15, 10);
        
        // Black spots
        ctx.fillStyle = '#000';
        ctx.fillRect(x + 4, y + 13, 3, 3);
        ctx.fillRect(x + 12, y + 15, 4, 3);
        ctx.fillRect(x + 16, y + 12, 3, 3);
        
        // Cow legs
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(x + 3, y + 18 + animOffset, 3, 6);
        ctx.fillRect(x + 7, y + 18 - animOffset, 3, 6);
        ctx.fillRect(x + 13, y + 18 + animOffset, 3, 6);
        ctx.fillRect(x + 18, y + 18 - animOffset, 3, 6);
        
        // Eyes
        ctx.fillStyle = '#000';
        ctx.fillRect(x + 7, y + 7, 1, 1);
        ctx.fillRect(x + 15, y + 7, 1, 1);
        
        // Horns
        ctx.fillRect(x + 6, y + 4, 1, 3);
        ctx.fillRect(x + 16, y + 4, 1, 3);
    }
      renderChicken(ctx, x, y, animOffset) {
        // 🔧 SCALED: Chicken body (increased scale)
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(x + 6, y + 12, 12, 9);
        
        // Chicken head
        ctx.fillRect(x + 9, y + 6, 6, 6);
        
        // Chicken beak
        ctx.fillStyle = '#FFA500';
        ctx.fillRect(x + 15, y + 9, 3, 1);
        
        // Chicken legs
        ctx.fillStyle = '#FFA500';
        ctx.fillRect(x + 9, y + 18 + animOffset, 1, 6);
        ctx.fillRect(x + 13, y + 18 - animOffset, 1, 6);
        
        // Eyes
        ctx.fillStyle = '#000';
        ctx.fillRect(x + 10, y + 7, 1, 1);
        
        // Wing
        ctx.fillStyle = '#F0F0F0';
        ctx.fillRect(x + 7, y + 13, 3, 4);
        
        // Comb
        ctx.fillStyle = '#FF0000';
        ctx.fillRect(x + 10, y + 4, 3, 3);
    }
      renderSheep(ctx, x, y, animOffset) {
        // 🔧 SCALED: Sheep wool body (increased scale)
        ctx.fillStyle = '#F0F0F0';
        ctx.fillRect(x + 1, y + 9, 21, 12);
        
        // Sheep head
        ctx.fillStyle = '#000';
        ctx.fillRect(x + 6, y + 6, 12, 9);
        
        // Sheep legs
        ctx.fillRect(x + 4, y + 18 + animOffset, 3, 6);
        ctx.fillRect(x + 9, y + 18 - animOffset, 3, 6);
        ctx.fillRect(x + 12, y + 18 + animOffset, 3, 6);
        ctx.fillRect(x + 16, y + 18 - animOffset, 3, 6);
        
        // Eyes
        ctx.fillStyle = '#FFF';
        ctx.fillRect(x + 9, y + 9, 1, 1);
        ctx.fillRect(x + 13, y + 9, 1, 1);
    }
      renderZombie(ctx, x, y, animOffset) {
        // 🔧 SCALED: Zombie body (increased scale)
        ctx.fillStyle = '#4F7942';
        ctx.fillRect(x + 6, y + 12, 12, 12);
        
        // Zombie head
        ctx.fillStyle = '#90EE90';
        ctx.fillRect(x + 6, y + 3, 12, 9);
        
        // Zombie arms
        ctx.fillStyle = '#90EE90';
        const armSwing = Math.sin(this.animationTime * 6) * 6;
        ctx.fillRect(x + 1, y + 13 + armSwing, 4, 9);
        ctx.fillRect(x + 19, y + 13 - armSwing, 4, 9);
        
        // Zombie legs
        ctx.fillStyle = '#4F7942';
        ctx.fillRect(x + 7, y + 21 + animOffset, 3, 6);
        ctx.fillRect(x + 13, y + 21 - animOffset, 3, 6);
        
        // Eyes (red)
        ctx.fillStyle = '#FF0000';
        ctx.fillRect(x + 7, y + 6, 1, 1);
        ctx.fillRect(x + 15, y + 6, 1, 1);
        
        // Mouth
        ctx.fillStyle = '#000';
        ctx.fillRect(x + 9, y + 9, 6, 1);
    }      renderSkeleton(ctx, x, y, animOffset) {
        // 🔧 SCALED: Skeleton body (increased scale)
        ctx.fillStyle = '#F0F0F0';
        ctx.fillRect(x + 6, y + 12, 12, 12);
        
        // Skeleton head
        ctx.fillRect(x + 6, y + 3, 12, 9);
        
        // Skeleton arms - different position when drawing bow
        if (this.isDrawingBow) {
            // Arms extended for bow drawing
            ctx.fillRect(x + 1, y + 13, 4, 9); // Left arm straight
            ctx.fillRect(x + 19, y + 11, 4, 9); // Right arm raised
            
            // Draw bow string when drawing
            ctx.strokeStyle = '#FFFFFF';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(x + 25, y + 9);
            ctx.lineTo(x + 22, y + 15);
            ctx.lineTo(x + 25, y + 21);
            ctx.stroke();
            
            // Draw arrow being drawn
            ctx.fillStyle = '#8B4513';
            ctx.fillRect(x + 16, y + 14, 8, 1);
            ctx.fillStyle = '#C0C0C0';
            ctx.fillRect(x + 24, y + 13, 2, 3);
        } else {
            // Normal arm swing
            const armSwing = Math.sin(this.animationTime * 6) * 4;
            ctx.fillRect(x + 1, y + 13 + armSwing, 4, 9);
            ctx.fillRect(x + 19, y + 13 - armSwing, 4, 9);
        }
        
        // Skeleton legs
        ctx.fillRect(x + 7, y + 21 + animOffset, 3, 6);
        ctx.fillRect(x + 13, y + 21 - animOffset, 3, 6);
        
        // Eye sockets (black)
        ctx.fillStyle = '#000';
        ctx.fillRect(x + 7, y + 6, 3, 3);
        ctx.fillRect(x + 13, y + 6, 3, 3);
        
        // Bow (simple) - always visible
        ctx.strokeStyle = '#8B4513';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(x + 25, y + 15, 6, 0, Math.PI);
        ctx.stroke();
    }
      renderSpider(ctx, x, y, animOffset) {
        // 🔧 SCALED: Spider body (increased scale)
        ctx.fillStyle = '#800080';
        ctx.fillRect(x + 6, y + 9, 12, 9);
        
        // Spider head
        ctx.fillRect(x + 9, y + 6, 6, 6);
        
        // Spider legs
        const legMove = Math.sin(this.animationTime * 12) * 3;
        ctx.fillStyle = '#400040';
        // Left legs
        ctx.fillRect(x, y + 10 + legMove, 6, 1);
        ctx.fillRect(x + 1, y + 13 - legMove, 6, 1);
        ctx.fillRect(x, y + 16 + legMove, 6, 1);
        // Right legs
        ctx.fillRect(x + 18, y + 10 - legMove, 6, 1);
        ctx.fillRect(x + 17, y + 13 + legMove, 6, 1);
        ctx.fillRect(x + 18, y + 16 - legMove, 6, 1);
        
        // Eyes (red, multiple)
        ctx.fillStyle = '#FF0000';
        ctx.fillRect(x + 9, y + 7, 1, 1);
        ctx.fillRect(x + 13, y + 7, 1, 1);
        ctx.fillRect(x + 10, y + 6, 1, 1);
        ctx.fillRect(x + 12, y + 6, 1, 1);
    }    renderCreeper(ctx, x, y, animOffset) {
        // Base colors
        let bodyColor = '#00FF00';
        let faceColor = '#008000';
        
        // Explosion animation - flashing effect when about to explode
        if (this.isAboutToExplode) {
            const flashProgress = this.explosionTimer / this.explosionDelay;
            const flashSpeed = Math.max(2, 8 * flashProgress); // Flash faster as explosion approaches
            const flash = Math.sin(Date.now() * flashSpeed * 0.01) > 0;
            
            if (flash) {
                // Flash to bright red/orange colors
                bodyColor = flashProgress > 0.7 ? '#FF0000' : '#FFAA00';
                faceColor = flashProgress > 0.7 ? '#AA0000' : '#CC5500';
            } else {
                // Darker colors during flash off
                bodyColor = '#006600';
                faceColor = '#004400';
            }
            
            // Add explosion warning glow effect
            if (flashProgress > 0.5) {
                ctx.save();
                ctx.globalAlpha = 0.3 + 0.3 * Math.sin(Date.now() * 0.02);
                ctx.fillStyle = '#FF4500';
                ctx.fillRect(x - 3, y - 3, 30, 36);
                ctx.restore();
            }
        }
        
        // 🔧 SCALED: Creeper body (increased scale)
        ctx.fillStyle = bodyColor;
        ctx.fillRect(x + 6, y + 12, 12, 12);
        
        // Creeper head
        ctx.fillRect(x + 6, y + 3, 12, 9);
        
        // Creeper legs
        ctx.fillRect(x + 7, y + 21 + animOffset, 3, 6);
        ctx.fillRect(x + 13, y + 21 - animOffset, 3, 6);
        
        // Creeper face pattern
        ctx.fillStyle = faceColor;
        ctx.fillRect(x + 7, y + 6, 1, 3);
        ctx.fillRect(x + 15, y + 6, 1, 3);
        ctx.fillRect(x + 10, y + 7, 3, 1);
        ctx.fillRect(x + 9, y + 9, 6, 1);
        ctx.fillRect(x + 10, y + 10, 3, 1);
        
        // Mouth
        ctx.fillStyle = '#000';
        ctx.fillRect(x + 10, y + 9, 3, 1);
        
        // Explosion countdown visual indicator
        if (this.isAboutToExplode) {
            const progress = this.explosionTimer / this.explosionDelay;
            
            // Draw countdown bar above creeper
            ctx.fillStyle = '#000';
            ctx.fillRect(x + 3, y - 12, 18, 6);
            
            // Fill bar based on countdown progress
            const barColor = progress > 0.8 ? '#FF0000' : progress > 0.5 ? '#FF8800' : '#FFAA00';
            ctx.fillStyle = barColor;
            ctx.fillRect(x + 4, y - 10, Math.floor(16 * progress), 2);
            
            // Show countdown number
            ctx.fillStyle = '#FFFFFF';
            ctx.font = '12px monospace';
            ctx.textAlign = 'center';
            const timeLeft = Math.ceil((this.explosionDelay - this.explosionTimer) / 1000);
            ctx.fillText(timeLeft.toString(), x + 12, y - 15);
        }
    }
    
    renderHealthBar(ctx, x, y) {
        const barWidth = 16;
        const barHeight = 2;
        const healthRatio = this.health / this.maxHealth;
        
        // Background
        ctx.fillStyle = '#000';
        ctx.fillRect(x, y - 6, barWidth, barHeight);
        
        // Health
        ctx.fillStyle = healthRatio > 0.5 ? '#00FF00' : healthRatio > 0.25 ? '#FFFF00' : '#FF0000';
        ctx.fillRect(x, y - 6, barWidth * healthRatio, barHeight);
    }

    renderBurningEffects(ctx, screenX, screenY) {
        if (!this.isBurning) return;
        
        // Animate burning effect using burnEffectTime
        const time = this.burnEffectTime;
        const flickerIntensity = Math.sin(time * 8) * 0.3 + 0.7;
        
        ctx.save();
        
        // Create flickering fire overlay
        ctx.globalAlpha = 0.4 * flickerIntensity;
        ctx.fillStyle = '#FF4500';
        ctx.fillRect(screenX - 2, screenY - 2, this.width + 4, this.height + 4);
        
        // Add bright fire edges
        ctx.globalAlpha = 0.6 * flickerIntensity;
        ctx.fillStyle = '#FFD700';
        ctx.fillRect(screenX - 1, screenY - 1, this.width + 2, this.height + 2);
        
        // Add core fire effect

        ctx.globalAlpha = 0.3 * flickerIntensity;
        ctx.fillStyle = '#FF6600';
        ctx.fillRect(screenX, screenY, this.width, this.height);
        
        // Add flame-like spikes around the mob
        for (let i = 0; i < 6; i++) {
            const angle = (i / 6) * Math.PI * 2 + time * 2;
            const flameX = screenX + this.width / 2 + Math.cos(angle) * (this.width / 2 + 3);
            const flameY = screenY + this.height / 2 + Math.sin(angle) * (this.height / 2 + 3);
            const flameSize = 2 + Math.sin(time * 6 + i) * 1;
            
            ctx.globalAlpha = 0.5 * flickerIntensity;
            ctx.fillStyle = '#FF4500';
            ctx.fillRect(flameX - flameSize/2, flameY - flameSize/2, flameSize, flameSize);
        }
        
        ctx.restore();
    }
}

// Entity Manager class
class EntityManager {
    constructor() {
        this.entities = [];
        this.arrows = []; // Array to hold arrows shot by skeletons
        this.maxEntities = 20;
        this.spawnTimer = 0;
        this.baseSpawnCooldown = 5000; // 5 seconds base spawn time
        this.entitiesKilled = 0; // Track killed entities for Game Over stats
        
        // Debug: Log initialization
        // 🔥 FIXED: Removed debug log for cleaner console output
    }
    
    update(deltaTime, world, player) {
        this.spawnTimer += deltaTime * 1000;          // Update all entities
        for (let i = this.entities.length - 1; i >= 0; i--) {
            const entity = this.entities[i];
            entity.update(deltaTime, world, player);
            
            // Remove dead entities
            if (!entity.alive) {
                this.entities.splice(i, 1);
            }
        }

        // Update all arrows
        for (let i = this.arrows.length - 1; i >= 0; i--) {
            const arrow = this.arrows[i];
            arrow.update(deltaTime, world, player);
            
            // Remove dead arrows
            if (!arrow.alive) {
                this.arrows.splice(i, 1);
            }
        }

        // Adjust spawn rate based on time of day
        let spawnCooldown = this.baseSpawnCooldown;
        if (window.game?.timeSystem) {
            if (window.game.timeSystem.isNight()) {
                spawnCooldown = this.baseSpawnCooldown * 0.3; // Faster spawning at night (was 0.7)
            } else {
                spawnCooldown = this.baseSpawnCooldown * 1.3; // Slower spawning during day
            }
        }
          // Debug: Log spawn attempt conditions
        if (this.spawnTimer > spawnCooldown) {
            // 🔥 FIXED: Removed debug log for cleaner console output
        }
          // Check for entity spawn attempts
        if (this.spawnTimer >= spawnCooldown && this.entities.length < this.maxEntities) {
            this.spawnTimer = 0;
            this.spawnRandomEntity(world, player);
        }
    }    spawnRandomEntity(world, player) {
        // 🔧 IMPROVED: Calculate spawn position outside player's viewport with proper safe zone
        const canvasWidth = window.game?.canvas?.width || 800;
        const canvasHeight = window.game?.canvas?.height || 600;
        
        // Use actual viewport dimensions with larger buffer for safe spawning
        const viewportWidth = canvasWidth;
        const viewportHeight = canvasHeight;
        const buffer = 100; // 🔧 INCREASED: Larger buffer to ensure spawning outside visible area (was 50)
        
        let spawnX, spawnY;
        let attempts = 0;
        const maxAttempts = 10;
        
        do {
            // Choose a side to spawn from (0=top, 1=right, 2=bottom, 3=left)
            const side = Math.floor(Math.random() * 4);
            const playerCenterX = player.x + player.width / 2;
            const playerCenterY = player.y + player.height / 2;
            
            switch(side) {
                case 0: // Top
                    spawnX = playerCenterX + (Math.random() - 0.5) * (viewportWidth + buffer * 2);
                    spawnY = playerCenterY - viewportHeight / 2 - buffer - Math.random() * buffer;
                    break;
                case 1: // Right
                    spawnX = playerCenterX + viewportWidth / 2 + buffer + Math.random() * buffer;
                    spawnY = playerCenterY + (Math.random() - 0.5) * (viewportHeight + buffer * 2);
                    break;
                case 2: // Bottom
                    spawnX = playerCenterX + (Math.random() - 0.5) * (viewportWidth + buffer * 2);
                    spawnY = playerCenterY + viewportHeight / 2 + buffer + Math.random() * buffer;
                    break;
                case 3: // Left
                    spawnX = playerCenterX - viewportWidth / 2 - buffer - Math.random() * buffer;
                    spawnY = playerCenterY + (Math.random() - 0.5) * (viewportHeight + buffer * 2);
                    break;
            }
            
            attempts++;
        } while (attempts < maxAttempts && this.isPositionNearPlayer(spawnX, spawnY, player, 200)); // 🔧 INCREASED: Larger minimum distance (was 150)// Make sure spawn position is valid (on solid ground)
        const groundY = this.findGroundLevel(world, spawnX);
        if (groundY === -1) {
            return; // No valid ground found
        }
          // Limit total entities to prevent overcrowding
        if (this.entities.length >= this.maxEntities) {
            return;
        }
        
        // Choose entity type based on day/night cycle
        const friendlyTypes = [EntityTypes.PIG, EntityTypes.COW, EntityTypes.CHICKEN, EntityTypes.SHEEP];
        const hostileTypes = [EntityTypes.ZOMBIE, EntityTypes.SKELETON, EntityTypes.SPIDER, EntityTypes.CREEPER];
        
        let useHostile = false;
        let hostileChance = 0.2; // Default 20% hostile
          // Get time information from game if available
        if (window.game?.timeSystem) {
            const timeSystem = window.game.timeSystem;
            if (timeSystem.isNight()) {
                // During night: 70% hostile, 30% friendly
                hostileChance = 0.7;
            } else {
                // During day: 10% hostile, 90% friendly
                hostileChance = 0.1;
            }
        }
        
        useHostile = Math.random() < hostileChance;
        const typeArray = useHostile ? hostileTypes : friendlyTypes;
        const entityType = typeArray[Math.floor(Math.random() * typeArray.length)];
        
        const entity = new Entity(spawnX, groundY - 16, entityType);
        this.entities.push(entity);
          const timeOfDay = window.game?.timeSystem ? 
            (window.game.timeSystem.isNight() ? 'Night' : 'Day') : 'Unknown';
        // 🔥 FIXED: Removed debug log for cleaner console output
    }
    
    isPositionNearPlayer(x, y, player, minDistance) {
        const distance = Math.sqrt(
            Math.pow(x - (player.x + player.width / 2), 2) + 
            Math.pow(y - (player.y + player.height / 2), 2)
        );
        return distance < minDistance;
    }
      findGroundLevel(world, x) {
        const blockX = Math.floor(x / world.blockSize);
        
        // Improved ground finding: look for the top surface of solid ground
        let foundSurface = false;
        let groundY = -1;
        
        // Search from top to bottom
        for (let y = 0; y < world.height - 1; y++) {
            const currentBlock = world.getBlockInstance(blockX, y);
            const belowBlock = world.getBlockInstance(blockX, y + 1);
              // Surface found: current block is air/liquid and block below is solid
            if ((!currentBlock || !currentBlock.isSolid()) && 
                belowBlock && belowBlock.isSolid()) {
                groundY = y * world.blockSize;
                foundSurface = true;
                break;
            }
        }
        
        // Fallback: if no surface found, look for any solid block from top
        if (!foundSurface) {
            for (let y = 0; y < world.height; y++) {
                const block = world.getBlockInstance(blockX, y);                if (block && block.isSolid()) {
                    groundY = y * world.blockSize;
                    break;
                }
            }
        }        
        return groundY;
    }      render(ctx, camera) {
        const zoom = camera.zoom || 1.0;
        
        // Apply zoom transforms for entities like world rendering
        ctx.save();
        ctx.scale(zoom, zoom);
        ctx.translate(-camera.x, -camera.y);
        
        let visibleEntities = 0;
        for (const entity of this.entities) {
            if (entity.alive) {
                entity.render(ctx, camera);
                visibleEntities++;
            }
        }
        
        // Render all arrows
        for (const arrow of this.arrows) {
            if (arrow.alive) {
                arrow.render(ctx, camera);
            }
        }
        
        ctx.restore();
    }
    
    getEntityCount() {
        return this.entities.length;
    }
    
    getNearbyHostileEntities(x, y, range) {
        return this.entities.filter(entity => 
            entity.alive && 
            entity.isHostile && 
            Math.abs(entity.x - x) < range && 
            Math.abs(entity.y - y) < range
        );
    }
}
