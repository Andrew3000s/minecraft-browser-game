// Crafting system for Minecraft browser game

// This will be initialized after BlockTypes is available
let CraftingRecipes = {};

function initializeCraftingRecipes() {
    CraftingRecipes = {
        // Wood planks from wood
        [BlockTypes.WOOD]: {
            result: BlockTypes.WOOD,
            count: 4,
            ingredients: [
                { type: BlockTypes.WOOD, count: 1 }
            ]
        },
        
        // Tools and advanced blocks would go here
        // For now, keeping it simple with basic recipes
    };
}

class CraftingSystem {
    constructor() {
        this.isOpen = false;
        this.selectedRecipe = null;
        
        // Initialize recipes when BlockTypes is available
        if (typeof BlockTypes !== 'undefined') {
            initializeCraftingRecipes();
        }
    }

    canCraft(recipe, inventory) {
        return recipe.ingredients.every(ingredient => {
            const totalCount = this.countItemInInventory(inventory, ingredient.type);
            return totalCount >= ingredient.count;
        });
    }

    countItemInInventory(inventory, itemType) {
        return inventory.reduce((total, slot) => {
            return total + (slot && slot.type === itemType ? slot.count : 0);
        }, 0);
    }

    craft(recipe, inventory) {
        if (!this.canCraft(recipe, inventory)) {
            return false;
        }

        // Remove ingredients
        recipe.ingredients.forEach(ingredient => {
            let remaining = ingredient.count;
            for (let i = 0; i < inventory.length && remaining > 0; i++) {
                const slot = inventory[i];
                if (slot && slot.type === ingredient.type) {
                    const toRemove = Math.min(remaining, slot.count);
                    slot.count -= toRemove;
                    remaining -= toRemove;
                    
                    if (slot.count <= 0) {
                        inventory[i] = null;
                    }
                }
            }
        });

        // Add result
        return this.addToInventory(inventory, recipe.result, recipe.count);
    }

    addToInventory(inventory, itemType, count) {
        // Try to add to existing stacks first
        for (let i = 0; i < inventory.length; i++) {
            const slot = inventory[i];
            if (slot && slot.type === itemType && slot.count < 64) {
                const addAmount = Math.min(count, 64 - slot.count);
                slot.count += addAmount;
                count -= addAmount;
                if (count <= 0) return true;
            }
        }

        // Find empty slots
        for (let i = 0; i < inventory.length; i++) {
            if (!inventory[i]) {
                inventory[i] = {
                    type: itemType,
                    count: Math.min(count, 64)
                };
                count -= Math.min(count, 64);
                if (count <= 0) return true;
            }
        }

        return count <= 0;
    }

    toggleCraftingMenu() {
        this.isOpen = !this.isOpen;
        this.updateCraftingUI();
    }

    updateCraftingUI() {
        let craftingMenu = document.getElementById('craftingMenu');
        
        if (this.isOpen && !craftingMenu) {
            // Create crafting menu
            craftingMenu = document.createElement('div');
            craftingMenu.id = 'craftingMenu';
            craftingMenu.className = 'crafting-menu';
            craftingMenu.innerHTML = `
                <div class="crafting-header">
                    <h3>Crafting</h3>
                    <button id="closeCrafting">×</button>
                </div>
                <div class="crafting-recipes" id="craftingRecipes">
                    <!-- Recipes will be populated here -->
                </div>
            `;
            document.body.appendChild(craftingMenu);

            // Add close button event
            document.getElementById('closeCrafting').addEventListener('click', () => {
                this.toggleCraftingMenu();
            });

            this.populateRecipes();
        } else if (!this.isOpen && craftingMenu) {
            craftingMenu.remove();
        }
    }

    populateRecipes() {
        const recipesContainer = document.getElementById('craftingRecipes');
        if (!recipesContainer) return;

        recipesContainer.innerHTML = '';

        Object.entries(CraftingRecipes).forEach(([resultType, recipe]) => {
            const recipeElement = document.createElement('div');
            recipeElement.className = 'recipe-item';
            
            const canCraft = window.game && window.game.player ? 
                this.canCraft(recipe, window.game.player.inventory) : false;
            
            if (!canCraft) {
                recipeElement.classList.add('disabled');
            }

            recipeElement.innerHTML = `
                <div class="recipe-ingredients">
                    ${recipe.ingredients.map(ing => `
                        <div class="ingredient">
                            <div class="ingredient-icon" data-type="${ing.type}"></div>
                            <span>${ing.count}</span>
                        </div>
                    `).join('')}
                </div>
                <div class="recipe-arrow">→</div>
                <div class="recipe-result">
                    <div class="result-icon" data-type="${recipe.result}"></div>
                    <span>${recipe.count}</span>
                </div>
            `;

            if (canCraft) {
                recipeElement.addEventListener('click', () => {
                    if (window.game && window.game.player) {
                        this.craft(recipe, window.game.player.inventory);
                        this.populateRecipes(); // Refresh recipes
                        window.game.updateInventory(); // Update inventory UI
                    }
                });
            }

            recipesContainer.appendChild(recipeElement);
        });

        // Render block icons
        this.renderRecipeIcons();
    }

    renderRecipeIcons() {
        const icons = document.querySelectorAll('.ingredient-icon, .result-icon');
        icons.forEach(icon => {
            const blockType = parseInt(icon.dataset.type);
            const canvas = document.createElement('canvas');
            canvas.width = 24;
            canvas.height = 24;
            const ctx = canvas.getContext('2d');
            
            const block = new Block(blockType, 0, 0);
            block.render(ctx, 0, 0, 24, false);
            
            icon.appendChild(canvas);
        });
    }
}
