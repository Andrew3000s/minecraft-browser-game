// Input handling system for Minecraft browser game

class InputManager {
    constructor(canvas) {
        this.canvas = canvas;
        this.keys = {};
        this.mouse = {
            x: 0,
            y: 0,
            leftPressed: false,
            rightPressed: false,
            wheelDelta: 0
        };
        
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Keyboard events
        document.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
            
            // Prevent default for game keys
            if (['KeyW', 'KeyA', 'KeyS', 'KeyD', 'Space', 'ShiftLeft', 'ControlLeft', 'ControlRight'].includes(e.code)) {
                e.preventDefault();
            }
        });

        document.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        });

        // Mouse events with improved precision
        this.canvas.addEventListener('mousedown', (e) => {
            this.updateMousePosition(e);

            if (e.button === 0) { // Left click
                console.log("🐛 DEBUG: Left mouse DOWN detected in InputManager"); // DEBUG
                this.mouse.leftPressed = true;
            } else if (e.button === 2) { // Right click
                console.log("🐛 DEBUG: Right mouse DOWN detected in InputManager"); // DEBUG
                this.mouse.rightPressed = true;
            }
            
            e.preventDefault();
        });

        this.canvas.addEventListener('mouseup', (e) => {
            this.updateMousePosition(e);
            
            if (e.button === 0) {
                console.log("🐛 DEBUG: Left mouse UP detected in InputManager"); // DEBUG
                this.mouse.leftPressed = false;
            } else if (e.button === 2) {
                console.log("🐛 DEBUG: Right mouse UP detected in InputManager"); // DEBUG
                this.mouse.rightPressed = false;
            }
        });

        this.canvas.addEventListener('mousemove', (e) => {
            this.updateMousePosition(e);
        });

        this.canvas.addEventListener('wheel', (e) => {
            this.mouse.wheelDelta = e.deltaY;
            e.preventDefault();
        });

        // Prevent context menu on right click
        this.canvas.addEventListener('contextmenu', (e) => {
            e.preventDefault();
        });

        // Number keys for inventory selection
        document.addEventListener('keydown', (e) => {
            if (e.code >= 'Digit1' && e.code <= 'Digit9') {
                const slot = parseInt(e.code.replace('Digit', '')) - 1;
                if (window.game && window.game.player) {
                    window.game.player.setActiveSlot(slot);
                }
            }
            
            // C key for crafting
            if (e.code === 'KeyC') {
                if (window.game && window.game.crafting) {
                    window.game.crafting.toggleCraftingMenu();
                }
            }
            
            // I key for inventory expansion
            if (e.code === 'KeyI') {
                if (window.game && window.game.player) {
                    window.game.player.toggleInventoryExpansion();
                }
            }
            
            // B key for dropping single block
            if (e.code === 'KeyB') {
                if (window.game && window.game.player) {
                    window.game.player.dropSingleBlock();
                }
            }
        });
    }

    isKeyPressed(keyCode) {
        return !!this.keys[keyCode];
    }

    isMouseLeftPressed() {
        const isPressed = this.mouse.leftPressed;
        if (isPressed) {
            console.log("🐛 DEBUG: isMouseLeftPressed() returning true"); // DEBUG
        }
        return isPressed;
    }

    isMouseRightPressed() {
        const isPressed = this.mouse.rightPressed;
        if (isPressed) {
            console.log("🐛 DEBUG: isMouseRightPressed() returning true"); // DEBUG
        }
        return isPressed;
    }

    getMousePosition() {
        return { x: this.mouse.x, y: this.mouse.y };
    }

    getWheelDelta() {
        const delta = this.mouse.wheelDelta;
        this.mouse.wheelDelta = 0; // Reset after reading
        return delta;
    }

    // Improved mouse position tracking with better precision
    updateMousePosition(event) {
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;
        
        // Account for canvas scaling and pixel-perfect positioning
        this.mouse.x = Math.round((event.clientX - rect.left) * scaleX);
        this.mouse.y = Math.round((event.clientY - rect.top) * scaleY);
    }

    // Movement input helpers
    getMovementInput() {
        const movement = { x: 0, y: 0 };
        
        if (this.isKeyPressed('KeyA')) movement.x -= 1;
        if (this.isKeyPressed('KeyD')) movement.x += 1;
        if (this.isKeyPressed('KeyW')) movement.y -= 1;
        if (this.isKeyPressed('KeyS')) movement.y += 1;
        
        // Normalize diagonal movement
        if (movement.x !== 0 && movement.y !== 0) {
            const length = Math.sqrt(movement.x * movement.x + movement.y * movement.y);
            movement.x /= length;
            movement.y /= length;
        }
        
        return movement;
    }

    isJumping() {
        return this.isKeyPressed('Space');
    }

    isSneaking() {
        return this.isKeyPressed('ShiftLeft');
    }

    isDiving() {
        return this.isKeyPressed('ControlLeft') || this.isKeyPressed('ControlRight');
    }
}