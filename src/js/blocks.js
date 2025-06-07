// Block system for Minecraft browser game

const BlockTypes = {
    AIR: 0,
    DIRT: 1,
    GRASS: 2,
    STONE: 3,
    WOOD: 4,
    LEAVES: 5,
    SAND: 6,
    WATER: 7,
    LAVA: 8,
    ACID: 9,
    COAL_ORE: 10,
    IRON_ORE: 11,
    DIAMOND_ORE: 12,
    BEDROCK: 13,
    TORCH: 14,
    GOLD_ORE: 15, // Added GOLD_ORE
    // Tools
    DIAMOND_PICKAXE: 100,
    // Mob Materials (start from 200)
    BONE: 200,
    LEATHER: 201,
    FEATHER: 202,
    WOOL: 203,
    STRING: 204,
    GUNPOWDER: 205,
    // Food items (start from 300)
    PORK: 300,
    BEEF: 301,
    CHICKEN_MEAT: 302,
    MUTTON: 303,
    // Weapons/Tools (start from 400)
    ARROW: 400
};

const BlockColors = {
    [BlockTypes.AIR]: 'transparent',
    [BlockTypes.DIRT]: '#8B4513',
    [BlockTypes.GRASS]: '#228B22',
    [BlockTypes.STONE]: '#696969',
    [BlockTypes.WOOD]: '#DEB887',
    [BlockTypes.LEAVES]: '#32CD32',
    [BlockTypes.SAND]: '#F4A460',
    [BlockTypes.WATER]: '#4169E1',
    [BlockTypes.LAVA]: '#FF4500',
    [BlockTypes.ACID]: '#32CD32',
    [BlockTypes.COAL_ORE]: '#2F2F2F',
    [BlockTypes.IRON_ORE]: '#CD853F',
    [BlockTypes.DIAMOND_ORE]: '#00CED1',
    [BlockTypes.BEDROCK]: '#1C1C1C',
    [BlockTypes.TORCH]: '#FFA500',
    [BlockTypes.GOLD_ORE]: '#FFD700', // Added GOLD_ORE color
    [BlockTypes.DIAMOND_PICKAXE]: '#00FFFF',
    // Mob Materials
    [BlockTypes.BONE]: '#F5F5DC',
    [BlockTypes.LEATHER]: '#8B4513',
    [BlockTypes.FEATHER]: '#FFFFFF',
    [BlockTypes.WOOL]: '#F0F8FF',
    [BlockTypes.STRING]: '#C0C0C0',
    [BlockTypes.GUNPOWDER]: '#2F4F2F',
    // Food items
    [BlockTypes.PORK]: '#FFB6C1',
    [BlockTypes.BEEF]: '#8B0000',
    [BlockTypes.CHICKEN_MEAT]: '#FFF8DC',
    [BlockTypes.MUTTON]: '#CD853F',
    // Weapons/Tools
    [BlockTypes.ARROW]: '#8B4513'
};

const BlockNames = {
    [BlockTypes.AIR]: 'Air',
    [BlockTypes.DIRT]: 'Dirt',
    [BlockTypes.GRASS]: 'Grass',
    [BlockTypes.STONE]: 'Stone',
    [BlockTypes.WOOD]: 'Wood',
    [BlockTypes.LEAVES]: 'Leaves',
    [BlockTypes.SAND]: 'Sand',
    [BlockTypes.WATER]: 'Water',
    [BlockTypes.LAVA]: 'Lava',
    [BlockTypes.ACID]: 'Acid',
    [BlockTypes.COAL_ORE]: 'Coal Ore',
    [BlockTypes.IRON_ORE]: 'Iron Ore',
    [BlockTypes.DIAMOND_ORE]: 'Diamond Ore',
    [BlockTypes.BEDROCK]: 'Bedrock',
    [BlockTypes.TORCH]: 'Torch',
    [BlockTypes.GOLD_ORE]: 'Gold Ore', // Added GOLD_ORE name
    [BlockTypes.DIAMOND_PICKAXE]: 'Diamond Pickaxe',
    // Mob Materials
    [BlockTypes.BONE]: 'Bone',
    [BlockTypes.LEATHER]: 'Leather',
    [BlockTypes.FEATHER]: 'Feather',
    [BlockTypes.WOOL]: 'Wool',
    [BlockTypes.STRING]: 'String',
    [BlockTypes.GUNPOWDER]: 'Gunpowder',
    // Food items
    [BlockTypes.PORK]: 'Pork',
    [BlockTypes.BEEF]: 'Beef',
    [BlockTypes.CHICKEN_MEAT]: 'Chicken',
    [BlockTypes.MUTTON]: 'Mutton',
    // Weapons/Tools
    [BlockTypes.ARROW]: 'Arrow'
};

class Block {
    constructor(type, x, y) {
        this.type = type;
        this.x = x;
        this.y = y;
        this.hardness = this.getHardness();
    }

    getHardness() {
        switch (this.type) {
            case BlockTypes.AIR: return 0;
            case BlockTypes.DIRT: return 0.5;
            case BlockTypes.GRASS: return 0.6;
            case BlockTypes.SAND: return 0.5;
            case BlockTypes.WOOD: return 2.0;
            case BlockTypes.LEAVES: return 0.2;
            case BlockTypes.STONE: return 1.5;
            case BlockTypes.COAL_ORE: return 3.0;
            case BlockTypes.IRON_ORE: return 3.0;
            case BlockTypes.DIAMOND_ORE: return 3.0;
            case BlockTypes.GOLD_ORE: return 2.5; // Added GOLD_ORE hardness
            case BlockTypes.WATER: return 0;
            case BlockTypes.LAVA: return 0;
            case BlockTypes.ACID: return 0;
            case BlockTypes.BEDROCK: return 1000;
            case BlockTypes.TORCH: return 0.1;
            default: return 1.0;
        }
    }

    isSolid() {
        return this.type !== BlockTypes.AIR && this.type !== BlockTypes.WATER && 
               this.type !== BlockTypes.LAVA && this.type !== BlockTypes.ACID && 
               this.type !== BlockTypes.TORCH;
    }

    isBreakable() {
        return this.type !== BlockTypes.AIR && 
               this.type !== BlockTypes.BEDROCK &&
               this.type !== BlockTypes.WATER &&
               this.type !== BlockTypes.LAVA &&
               this.type !== BlockTypes.ACID;
    }

    canWalkThrough() {
        return this.type === BlockTypes.AIR || this.type === BlockTypes.WATER || 
               this.type === BlockTypes.LAVA || this.type === BlockTypes.ACID;
    }

    render(ctx, x, y, size, showBorder = true) {
        if (this.type === BlockTypes.AIR) return;

        const color = BlockColors[this.type];
        ctx.fillStyle = color;
        ctx.fillRect(x, y, size, size);

        // Add texture/pattern for some blocks
        this.addTexture(ctx, x, y, size);

        // Border
        if (showBorder) {
            ctx.strokeStyle = this.getBorderColor();
            ctx.lineWidth = 1;
            ctx.strokeRect(x + 0.5, y + 0.5, size - 1, size - 1);
        }
    }

    addTexture(ctx, x, y, size) {
        ctx.save();
        
        switch (this.type) {
            case BlockTypes.GRASS:
                // Grass top
                ctx.fillStyle = '#90EE90';
                ctx.fillRect(x, y, size, size * 0.3);
                break;
                
            case BlockTypes.STONE:
                // Stone texture dots
                ctx.fillStyle = '#808080';
                for (let i = 0; i < 3; i++) {
                    const dotX = x + (size * 0.2) + (i * size * 0.3);
                    const dotY = y + size * 0.3 + (i % 2) * size * 0.3;
                    ctx.fillRect(dotX, dotY, 2, 2);
                }
                break;
                
            case BlockTypes.WOOD:
                // Wood rings
                ctx.strokeStyle = '#CD853F';
                ctx.lineWidth = 1;
                const centerX = x + size / 2;
                const centerY = y + size / 2;
                ctx.beginPath();
                ctx.arc(centerX, centerY, size * 0.2, 0, Math.PI * 2);
                ctx.stroke();
                ctx.beginPath();
                ctx.arc(centerX, centerY, size * 0.3, 0, Math.PI * 2);
                ctx.stroke();
                break;
                
            case BlockTypes.COAL_ORE:
            case BlockTypes.IRON_ORE:
            case BlockTypes.DIAMOND_ORE:
            case BlockTypes.GOLD_ORE: // Added GOLD_ORE to texture handling
                // Ore spots
                const oreColor = this.type === BlockTypes.COAL_ORE ? '#000' : 
                                this.type === BlockTypes.IRON_ORE ? '#C0C0C0' : 
                                this.type === BlockTypes.DIAMOND_ORE ? '#00FFFF' : '#FFD700'; // Added GOLD_ORE color for texture
                ctx.fillStyle = oreColor;
                ctx.fillRect(x + size * 0.2, y + size * 0.2, size * 0.2, size * 0.2);
                ctx.fillRect(x + size * 0.6, y + size * 0.6, size * 0.2, size * 0.2);
                break;
                
            case BlockTypes.WATER:
                // Water waves
                ctx.strokeStyle = '#1E90FF';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(x, y + size * 0.3);
                ctx.quadraticCurveTo(x + size * 0.5, y + size * 0.1, x + size, y + size * 0.3);
                ctx.stroke();
                break;
                
            case BlockTypes.LAVA:
                // Lava bubbles and glow
                ctx.fillStyle = '#FFD700';
                for (let i = 0; i < 4; i++) {
                    const bubbleX = x + Math.random() * size;
                    const bubbleY = y + Math.random() * size;
                    ctx.beginPath();
                    ctx.arc(bubbleX, bubbleY, 2, 0, Math.PI * 2);
                    ctx.fill();
                }
                // Lava glow effect
                ctx.globalAlpha = 0.3;
                ctx.fillStyle = '#FF8C00';
                ctx.fillRect(x, y, size, size);
                break;
                
            case BlockTypes.ACID:
                // Acid bubbles
                ctx.fillStyle = '#00FF00';
                for (let i = 0; i < 3; i++) {
                    const bubbleX = x + (i + 1) * size / 4;
                    const bubbleY = y + size * 0.6 + Math.sin(Date.now() * 0.005 + i) * 3;
                    ctx.beginPath();
                    ctx.arc(bubbleX, bubbleY, 2, 0, Math.PI * 2);
                    ctx.fill();
                }
                break;
                
            case BlockTypes.DIAMOND_PICKAXE:
                // Diamond pickaxe handle
                ctx.fillStyle = '#8B4513';
                ctx.fillRect(x + size * 0.4, y + size * 0.2, size * 0.2, size * 0.6);
                
                // Pickaxe head
                ctx.fillStyle = '#00FFFF';
                ctx.fillRect(x + size * 0.1, y + size * 0.1, size * 0.8, size * 0.3);
                
                // Pickaxe tip
                ctx.fillRect(x + size * 0.05, y + size * 0.15, size * 0.1, size * 0.2);
                ctx.fillRect(x + size * 0.85, y + size * 0.15, size * 0.1, size * 0.2);
                break;
                
            case BlockTypes.TORCH:
                // Torch stick
                ctx.fillStyle = '#8B4513';
                ctx.fillRect(x + size * 0.4, y + size * 0.3, size * 0.2, size * 0.6);
                
                // Torch flame
                ctx.fillStyle = '#FF4500';
                ctx.fillRect(x + size * 0.35, y + size * 0.1, size * 0.3, size * 0.3);
                
                // Flame highlight
                ctx.fillStyle = '#FFFF00';
                ctx.fillRect(x + size * 0.4, y + size * 0.15, size * 0.2, size * 0.2);
                
                // Torch glow effect
                ctx.save();
                ctx.globalAlpha = 0.3;
                ctx.fillStyle = '#FFD700';
                ctx.fillRect(x - size * 0.1, y - size * 0.1, size * 1.2, size * 1.2);
                ctx.restore();
                break;
        }
        
        ctx.restore();
    }

    getBorderColor() {
        switch (this.type) {
            case BlockTypes.WATER: return '#0000FF';
            case BlockTypes.LAVA: return '#FF0000';
            case BlockTypes.ACID: return '#00FF00';
            default: return '#000000';
        }
    }

    static getInventoryBlocks() {
        return [
            BlockTypes.DIRT,
            BlockTypes.GRASS,
            BlockTypes.STONE,
            BlockTypes.WOOD,
            BlockTypes.LEAVES,
            BlockTypes.SAND,
            BlockTypes.COAL_ORE,
            BlockTypes.IRON_ORE,
            BlockTypes.DIAMOND_ORE,
            BlockTypes.TORCH
        ];
    }

    // Check if a block type is placeable (not mob drops or tools)
    static isPlaceable(blockType) {
        // Only basic blocks and torch are placeable
        return blockType >= BlockTypes.AIR && blockType <= BlockTypes.GOLD_ORE && blockType !== BlockTypes.AIR; // MODIFIED: Adjusted range to include GOLD_ORE
    }

    // Check if a block type is a mob material/food (not placeable)
    static isMobDrop(blockType) {
        return blockType >= 200; // All mob materials start from 200
    }
}