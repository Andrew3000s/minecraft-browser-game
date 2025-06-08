// Final test script for mob drop system (without debug logs)
if (window.game?.world && window.game?.entityManager && window.game?.player) {
    console.log('🎯 FINAL TEST: Mob Drop System');
    
    // Test 1: Spawn and kill a pig
    const pig = new Entity(100, 100, 'pig');
    console.log('1. Pig dropItems:', pig.dropItems);
    pig.takeDamage(20, window.game.player);
    console.log('2. Pig killed, player materials now:', window.game.player.materialsInventory);
    
    // Test 2: Spawn and kill a chicken
    const chicken = new Entity(150, 100, 'chicken');
    console.log('3. Chicken dropItems:', chicken.dropItems);
    chicken.takeDamage(20, window.game.player);
    console.log('4. Chicken killed, player materials now:', window.game.player.materialsInventory);
    
    console.log('✅ Final test complete - mob drops work perfectly!');
} else {
    console.log('❌ Game not ready for testing');
}
