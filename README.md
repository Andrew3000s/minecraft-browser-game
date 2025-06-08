# 🏗️ Minecraft Browser Game - Enhanced Edition

A complete and realistic Minecraft game that you can play directly in your browser! Built with HTML5 Canvas and advanced JavaScript, now featuring realistic lighting and complete functionality.

## 📁 Project Structure

```
minecraft-browser-game/
├── 📁 src/                    # Main source code
│   ├── js/                    # Game JavaScript files
│   ├── css/                   # CSS styles
│   └── assets/               # Resources (sounds, images)
├── 📁 tests/                  # Test files
│   ├── html/                  # HTML interface tests
│   ├── js/                    # Pure JavaScript tests
│   └── system/               # Complete system tests
├── 📁 debug/                  # Debug tools
│   ├── html/                  # Debug tools with UI
│   └── js/                    # Debug scripts
├── 📁 docs/                   # Complete documentation
├── 📁 archive/               # Backup and archive files
├── index.html               # Main game file
└── README.md               # This file
```

## 🚀 Quick Start

1. **Start the game**: Open `index.html` in browser
2. **For testing**: Go to `tests/html/` for specific tests
3. **For debugging**: Use files in `debug/html/` during development
4. **For docs**: Check `docs/` for complete documentation

## ✨ New Features (Enhanced Edition)

### 💡 **Realistic Lighting System**
- **Working Torches**: Torches now actually illuminate the environment during night
- **Authentic Lighting**: Advanced lighting system that reveals surrounding blocks
- **Atmospheric Effects**: Natural torch flickering with warm orange light
- **Night Vision**: Authentic Minecraft experience where torches are essential

### 📦 **Complete Expanded Inventory**
- **9 Complete Slots**: Inventory pre-loaded with tools and blocks
- **Diamond Pickaxe**: Tool for instant mining (slot 1)
- **64 Torches**: For extended lighting (slot 2)
- **Various Blocks**: Dirt, Stone, Wood, Sand, Grass, Leaves, Coal (slots 3-9)
- **Professional UI**: Visual counters and icons for each item

### 🎮 **Optimized Controls**
- **B Key**: Precise drop system - drops 1 block at a time
- **I Key**: Toggle inventory without auto-drop
- **English Interface**: Complete English interface

## 🎮 Core Features

### 🌍 Procedural World
- Automatic terrain generation with hills and valleys
- Diversified biomes with grass, stone, sand and water
- Procedurally generated trees
- Underground minerals (coal, iron, diamond)
- 200x100 blocks world

### 🌅 Complete Day/Night Cycle
- **Realistic Duration**: 5 minutes for complete cycle
- **Natural Transitions**: Dawn and sunset with gradient colors
- **Night Stars**: Starry sky during night
- **Dynamic Atmosphere**: Sky colors that change in real time

### 👤 Advanced Player System
- Smooth movement with WASD
- Realistic physics with gravity
- Jump and water movement
- Health system with visual hearts
- Smooth walking animations

### 🔨 Professional Building System
- **Diamond Pickaxe**: Breaks blocks instantly (except bedrock)
- **Visual Mining**: Progressive indicators with realistic cracks
- **Block Preview**: Semi-transparent placement preview
- **Mouse Indicator**: Dashed outline on target blocks
- **Limited Range**: Realistic reach system (150 units)

### 🎨 Advanced Graphics and UI
- Authentic Minecraft pixelated rendering
- **Lighting Engine**: Advanced lighting system with composite blending
- **Particle System**: Particle effects for block breaking, jumps, damage
- **Complete UI**: Health, inventory, time, position, FPS
- **Visual Feedback**: Audio-visual effects for every action

## 🕹️ Complete Controls

| Key/Input | Action |
|-----------|--------|
| **W, A, S, D** | Movement |
| **Space** | Jump |
| **Left Click** | Destroy block |
| **Right Click** | Place block |
| **Mouse Wheel** | Change active block |
| **1-9** | Inventory selection |
| **I** | Show/Hide inventory |
| **B** | Drop 1 block |
| **C** | Open crafting |

## 🚀 How to Play

1. Open `index.html` in your browser
2. Wait for world loading
3. Use WASD to move
4. Left click to destroy blocks
5. Right click to place blocks
6. Explore and build!

## 🏗️ Project Structure

```
minecraft-browser-game/
├── index.html              # Main HTML file
├── README.md              # This file
└── src/
    ├── css/
    │   ├── style.css      # Base UI styles
    │   └── game.css       # Game-specific styles
    └── js/
        ├── game.js        # Main game engine
        ├── player.js      # Player system
        ├── world.js       # World generation and management
        ├── blocks.js      # Block system
        ├── input.js       # Input handling
        └── utils.js       # Utility functions
```

## 🧱 Block Types

- **🟫 Dirt** - Basic building block
- **🟩 Grass** - Natural surface
- **⬜ Stone** - Resistant material
- **🟤 Wood** - From chopped trees
- **🟢 Leaves** - Natural decoration
- **🟨 Sand** - Granular block
- **⚫ Coal Ore** - Fuel
- **🟠 Iron Ore** - Precious metal
- **💎 Diamond Ore** - Rare gem

### 🔧 Special Tools
- **⛏️ Diamond Pickaxe** - Advanced tool for instant mining
  - Distinctive cyan color
  - Breaks any block instantly (except bedrock)
  - Available at game start in first inventory slot

## ⚡ Technical Features

- **Engine**: JavaScript ES6+ with Canvas API
- **Physics**: Custom collision system
- **Rendering**: Optimized with viewport culling
- **Performance**: 60 FPS target with optimized game loop
- **Memory**: Efficient block management with sparse arrays

## 🆕 Recent Improvements

### ✨ New Features
- **🎯 Centered Game**: Game is now perfectly centered in browser window for optimal visual experience
- **⛏️ Diamond Pickaxe**: New powerful tool that breaks blocks instantly
  - Distinctive cyan color in inventory
  - Instant mining for all blocks (except bedrock)
  - Available from start in first slot
- **💧 Improved Water Generation**: Water now appears correctly at ground level instead of in sky
- **🎯 Block Indicator**: White dashed outline clearly shows which block you're targeting
- **👁️ Improved Block Preview**: Blocks to be placed appear semi-transparent for better visualization

### 🔧 Technical Improvements
- Optimized CSS layout with flexbox for perfect centering
- Enhanced rendering system for visual indicators
- Optimized world generation logic
- Enhanced inventory management with new tools

## 🛠️ Advanced Features

### Physics System
- Realistic gravity
- Precise collisions
- Water resistance (now correctly positioned at ground level)
- Terrain friction

### World Generation
- Noise algorithm for natural terrain
- Intelligent tree placement
- **Improved Water**: Correct water generation at ground level
- Realistic mineral distribution
- Safe player spawn

### UI/UX
- Visual feedback for mining
- **Improved Block Preview**: Semi-transparent rendering
- **Mouse Indicator**: White dashed outline on target blocks
- **Centered Layout**: Game perfectly centered in browser window
- Contextual information
- Responsive design

## 🐛 Debug and Development

The game includes debug features:
- Real-time player position
- FPS counter
- Block information
- JavaScript console accessible via `window.game`

## 🔧 Customization

You can easily modify:
- World dimensions in `world.js`
- Block types in `blocks.js`
- Controls in `input.js`
- Visual styles in CSS files

## 📱 Compatibility

- ✅ Chrome/Chromium
- ✅ Firefox
- ✅ Safari
- ✅ Edge
- 📱 Mobile (limited touch controls)

## 🚀 Performance

- **Optimized Rendering**: Only visible blocks are rendered
- **Efficient Memory**: Sparse array for empty block management
- **60 FPS Target**: Optimized game loop for smooth performance

---

**Have fun building and exploring your Minecraft world! 🎮**