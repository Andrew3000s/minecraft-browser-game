// DEBUG SCRIPT for Mob Rendering and Spawning System
// Copy and paste this script into the browser console to test the fixes

console.log("🎯 Starting Mob Rendering & Spawning Debug Test...");

// Test 1: Check current rendering buffer settings
console.log("\n=== TEST 1: Rendering Buffer Analysis ===");
if (window.game?.entityManager?.entities?.length > 0) {
    const testEntity = window.game.entityManager.entities[0];
    console.log("✅ Found entity for testing:", testEntity.type);
    
    // Check canvas dimensions
    const canvas = window.game.canvas;
    console.log("Canvas dimensions:", { 
        width: canvas?.width || 'unknown', 
        height: canvas?.height || 'unknown' 
    });
    
    // Check camera position
    const camera = window.game.camera;
    console.log("Camera position:", { 
        x: camera?.x || 'unknown', 
        y: camera?.y || 'unknown' 
    });
    
    // Calculate screen position
    const screenX = testEntity.x - (camera?.x || 0);
    const screenY = testEntity.y - (camera?.y || 0);
    console.log("Entity screen position:", { x: screenX, y: screenY });
    
    // Test culling boundaries
    const canvasWidth = canvas?.width || 800;
    const canvasHeight = canvas?.height || 600;
    const buffer = 150; // New buffer size
    
    const wouldBeCulled = (
        screenX < -testEntity.width - buffer || 
        screenX > canvasWidth + buffer || 
        screenY < -testEntity.height - buffer || 
        screenY > canvasHeight + buffer
    );
    
    console.log("Culling test with 150px buffer:", {
        wouldBeCulled: wouldBeCulled,
        leftBound: -testEntity.width - buffer,
        rightBound: canvasWidth + buffer,
        topBound: -testEntity.height - buffer,
        bottomBound: canvasHeight + buffer
    });
} else {
    console.log("❌ No entities available for testing");
}

// Test 2: Force spawn entity and check spawning logic
console.log("\n=== TEST 2: Spawning System Test ===");
if (window.game?.entityManager && window.game?.player && window.game?.world) {
    const entityManager = window.game.entityManager;
    const player = window.game.player;
    
    console.log("Player position:", { x: player.x, y: player.y });
    
    // Get actual canvas dimensions for spawning
    const canvasWidth = window.game.canvas?.width || 800;
    const canvasHeight = window.game.canvas?.height || 600;
    console.log("Spawning viewport:", { width: canvasWidth, height: canvasHeight });
    
    // Check spawn buffer
    const buffer = 100; // New buffer size
    console.log("Spawn buffer:", buffer + "px");
    
    // Calculate spawn zones
    const playerCenterX = player.x + player.width / 2;
    const playerCenterY = player.y + player.height / 2;
    
    const spawnZones = {
        top: {
            minY: playerCenterY - canvasHeight / 2 - buffer - buffer,
            maxY: playerCenterY - canvasHeight / 2 - buffer
        },
        right: {
            minX: playerCenterX + canvasWidth / 2 + buffer,
            maxX: playerCenterX + canvasWidth / 2 + buffer + buffer
        },
        bottom: {
            minY: playerCenterY + canvasHeight / 2 + buffer,
            maxY: playerCenterY + canvasHeight / 2 + buffer + buffer
        },
        left: {
            minX: playerCenterX - canvasWidth / 2 - buffer - buffer,
            maxX: playerCenterX - canvasWidth / 2 - buffer
        }
    };
    
    console.log("Spawn zones:", spawnZones);
    
    // Try to spawn a test entity
    const entitiesBefore = entityManager.entities.length;
    entityManager.spawnRandomEntity(window.game.world, player);
    const entitiesAfter = entityManager.entities.length;
    
    if (entitiesAfter > entitiesBefore) {
        const newEntity = entityManager.entities[entityManager.entities.length - 1];
        console.log("✅ Successfully spawned entity:", {
            type: newEntity.type,
            position: { x: newEntity.x, y: newEntity.y },
            distanceFromPlayer: Math.sqrt(
                Math.pow(newEntity.x - playerCenterX, 2) + 
                Math.pow(newEntity.y - playerCenterY, 2)
            )
        });
        
        // Check if spawn is actually outside visible area
        const screenX = newEntity.x - window.game.camera.x;
        const screenY = newEntity.y - window.game.camera.y;
        const isVisible = (
            screenX > -50 && screenX < canvasWidth + 50 &&
            screenY > -50 && screenY < canvasHeight + 50
        );
        console.log("Spawn visibility check:", {
            screenPosition: { x: screenX, y: screenY },
            isVisible: isVisible,
            shouldBeInvisible: !isVisible ? "✅ GOOD" : "❌ BAD - spawned in visible area!"
        });
    } else {
        console.log("❌ Failed to spawn entity (may be at max capacity or no valid spawn location)");
        console.log("Current entity count:", entitiesBefore + "/" + entityManager.maxEntities);
    }
} else {
    console.log("❌ Game components not available for spawning test");
}

// Test 3: Monitor rendering performance
console.log("\n=== TEST 3: Rendering Performance Monitor ===");
let renderCount = 0;
let visibleEntities = 0;
let totalEntities = 0;

if (window.game?.entityManager) {
    totalEntities = window.game.entityManager.entities.length;
    
    // Count visible entities
    for (const entity of window.game.entityManager.entities) {
        if (entity.alive) {
            const camera = window.game.camera;
            const screenX = entity.x - camera.x;
            const screenY = entity.y - camera.y;
            const canvasWidth = window.game.canvas?.width || 800;
            const canvasHeight = window.game.canvas?.height || 600;
            const buffer = 150; // New buffer
            
            const isVisible = !(
                screenX < -entity.width - buffer || 
                screenX > canvasWidth + buffer || 
                screenY < -entity.height - buffer || 
                screenY > canvasHeight + buffer
            );
            
            if (isVisible) {
                visibleEntities++;
            }
        }
    }
    
    console.log("Rendering statistics:", {
        totalEntities: totalEntities,
        visibleEntities: visibleEntities,
        culledEntities: totalEntities - visibleEntities,
        cullingEfficiency: totalEntities > 0 ? 
            Math.round((1 - visibleEntities / totalEntities) * 100) + "%" : "N/A"
    });
}

// Test 4: Simulate player movement and check entity visibility
console.log("\n=== TEST 4: Movement Simulation Test ===");
if (window.game?.player && window.game?.entityManager?.entities?.length > 0) {
    const player = window.game.player;
    const originalX = player.x;
    const originalY = player.y;
    
    console.log("Original player position:", { x: originalX, y: originalY });
    
    // Test movement in each direction
    const movements = [
        { name: "Move Right", x: originalX + 200, y: originalY },
        { name: "Move Left", x: originalX - 200, y: originalY },
        { name: "Move Down", x: originalX, y: originalY + 200 },
        { name: "Move Up", x: originalX, y: originalY - 200 }
    ];
    
    movements.forEach(movement => {
        // Temporarily move player
        player.x = movement.x;
        player.y = movement.y;
        
        // Update camera
        const cameraPos = player.getCameraPosition(
            window.game.canvas?.width || 800,
            window.game.canvas?.height || 600
        );
        window.game.camera.x = cameraPos.x;
        window.game.camera.y = cameraPos.y;
        
        // Count visible entities
        let visible = 0;
        window.game.entityManager.entities.forEach(entity => {
            if (entity.alive) {
                const screenX = entity.x - window.game.camera.x;
                const screenY = entity.y - window.game.camera.y;
                const canvasWidth = window.game.canvas?.width || 800;
                const canvasHeight = window.game.canvas?.height || 600;
                const buffer = 150;
                
                const isVisible = !(
                    screenX < -entity.width - buffer || 
                    screenX > canvasWidth + buffer || 
                    screenY < -entity.height - buffer || 
                    screenY > canvasHeight + buffer
                );
                
                if (isVisible) visible++;
            }
        });
        
        console.log(movement.name + ":", {
            newPosition: { x: movement.x, y: movement.y },
            visibleEntities: visible,
            totalEntities: window.game.entityManager.entities.length
        });
    });
    
    // Restore original position
    player.x = originalX;
    player.y = originalY;
    const cameraPos = player.getCameraPosition(
        window.game.canvas?.width || 800,
        window.game.canvas?.height || 600
    );
    window.game.camera.x = cameraPos.x;
    window.game.camera.y = cameraPos.y;
    
    console.log("✅ Player position restored to:", { x: originalX, y: originalY });
}

console.log("\n🎯 Mob Rendering & Spawning Debug Test Complete!");
console.log("📋 Summary of improvements:");
console.log("  • Rendering buffer increased from 50px to 150px");
console.log("  • Spawning uses actual canvas dimensions");
console.log("  • Spawning buffer increased from 50px to 100px");
console.log("  • Minimum spawn distance increased from 150px to 200px");
