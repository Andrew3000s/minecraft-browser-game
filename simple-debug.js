// SIMPLE DROP DEBUG TEST
// Copy this to browser console when the main game is loaded

console.log('🔧 SIMPLE DROP DEBUG TEST');

// Test EntityTypes constants
console.log('EntityTypes object:', EntityTypes);
console.log('EntityTypes.CHICKEN =', EntityTypes.CHICKEN);

// Test entity creation step by step
console.log('\n--- Step 1: Creating test chicken ---');
const testChicken = new Entity(0, 0, EntityTypes.CHICKEN);

console.log('Test chicken type:', testChicken.type);
console.log('Test chicken dropItems from constructor:', testChicken.dropItems);

// Test getDropItems directly
console.log('\n--- Step 2: Testing getDropItems() directly ---');
const directDrops = testChicken.getDropItems();
console.log('Direct drops result:', directDrops);

// Test comparison
console.log('\n--- Step 3: Type comparison tests ---');
console.log('testChicken.type === EntityTypes.CHICKEN:', testChicken.type === EntityTypes.CHICKEN);
console.log('testChicken.type === "chicken":', testChicken.type === "chicken");
console.log('typeof testChicken.type:', typeof testChicken.type);
console.log('typeof EntityTypes.CHICKEN:', typeof EntityTypes.CHICKEN);

// Test the switch statement logic manually
console.log('\n--- Step 4: Manual switch test ---');
switch(testChicken.type) {
    case EntityTypes.CHICKEN:
        console.log('✅ Switch matched EntityTypes.CHICKEN');
        break;
    case 'chicken':
        console.log('✅ Switch matched literal "chicken"');
        break;
    default:
        console.log('❌ Switch fell through to default');
        console.log('Value being tested:', testChicken.type);
}

console.log('\n--- Test Complete ---');
