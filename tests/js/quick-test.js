// QUICK DROP TEST
// Run this in browser console after the game loads

console.log('🚀 Quick Drop Test Starting...');

// Wait for game to be ready
setTimeout(() => {
    if (window.game && window.game.player && window.game.entityManager) {
        console.log('✅ Game ready, spawning test chicken...');
        
        // Spawn a chicken near the player
        const chicken = new Entity(
            window.game.player.x + 50, 
            window.game.player.y, 
            EntityTypes.CHICKEN
        );
        
        // Add to entity manager
        window.game.entityManager.entities.push(chicken);
        console.log('✅ Chicken spawned with dropItems:', chicken.dropItems);
        
        // Immediately kill it with player as attacker
        setTimeout(() => {
            console.log('🗡️ Killing chicken...');
            chicken.takeDamage(100, window.game.player);
            
            // Check player inventory after a short delay
            setTimeout(() => {
                console.log('📦 Player materials inventory:', window.game.player.materialsInventory);
            }, 100);
        }, 500);
        
    } else {
        console.error('❌ Game not ready yet');
    }
}, 1000);

console.log('⏱️ Test will run in 1 second...');
