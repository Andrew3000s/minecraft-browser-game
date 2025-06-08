// DEBUG SCRIPT for Mob Drop System
// Copy and paste this entire script into the browser console of the main game

console.log("🔧 Starting Mob Drop System Debug Test...");

// Test 1: Check if game objects exist
console.log("\n=== TEST 1: Game Objects Check ===");
console.log("game exists:", !!window.game);
console.log("game.player exists:", !!window.game?.player);
console.log("game.entityManager exists:", !!window.game?.entityManager);
console.log("game.notifications exists:", !!window.game?.notifications);

// Test 2: Check player object properties
console.log("\n=== TEST 2: Player Object Analysis ===");
if (window.game?.player) {
    console.log("Player type:", typeof window.game.player);
    console.log("Player constructor:", window.game.player.constructor.name);
    console.log("Player has inventory:", !!window.game.player.inventory);
    console.log("Player has materialsInventory:", !!window.game.player.materialsInventory);
    console.log("Player position:", { x: window.game.player.x, y: window.game.player.y });
}

// Test 3: Spawn a test mob and analyze it
console.log("\n=== TEST 3: Spawning Test Mob ===");
if (window.game?.entityManager && window.game?.player) {
    // Spawn a pig near the player
    const testMob = window.game.entityManager.spawnEntity('pig', window.game.player.x + 100, window.game.player.y);
    
    if (testMob) {
        console.log("✅ Test mob spawned:", testMob.type);
        console.log("Test mob constructor:", testMob.constructor.name);
        console.log("Test mob drop items:", testMob.dropItems);
        console.log("Test mob health:", testMob.health);
        
        // Test 4: Manual damage test
        console.log("\n=== TEST 4: Manual Damage Test ===");
        console.log("🎯 About to test takeDamage with player as attacker...");
        
        // First, let's examine what the player object looks like
        console.log("Player object before attack:", window.game.player);
        
        // Test the damage
        testMob.takeDamage(100, window.game.player);
        
        // Check if mob died and what happened
        console.log("Mob alive after damage:", testMob.alive);
        console.log("Mob killedBy:", testMob.killedBy);
        console.log("Current materials inventory:", window.game.player.materialsInventory);
        
    } else {
        console.log("❌ Failed to spawn test mob");
    }
} else {
    console.log("❌ Game or entityManager not available");
}

// Test 5: Check drop item mapping function
console.log("\n=== TEST 5: Drop Item Mapping Test ===");
if (window.game?.entityManager?.entities?.length > 0) {
    const testEntity = window.game.entityManager.entities.find(e => e.type === 'pig');
    if (testEntity && testEntity.mapDropNameToBlockType) {
        console.log("Testing drop name mapping:");
        console.log("'pork' maps to:", testEntity.mapDropNameToBlockType('pork'));
        console.log("'beef' maps to:", testEntity.mapDropNameToBlockType('beef'));
        console.log("'chicken' maps to:", testEntity.mapDropNameToBlockType('chicken'));
        console.log("'leather' maps to:", testEntity.mapDropNameToBlockType('leather'));
    }
}

console.log("\n🏁 Debug test complete! Check the output above for issues.");
