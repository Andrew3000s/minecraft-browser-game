// Utility functions for the Minecraft browser game

class Utils {
    static clamp(value, min, max) {
        return Math.min(Math.max(value, min), max);
    }

    static distance(x1, y1, x2, y2) {
        return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
    }

    static lerp(start, end, factor) {
        return start + (end - start) * factor;
    }

    static randomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    static randomFloat(min, max) {
        return Math.random() * (max - min) + min;
    }

    static degToRad(degrees) {
        return degrees * Math.PI / 180;
    }

    static radToDeg(radians) {
        return radians * 180 / Math.PI;
    }

    static getMousePos(canvas, event) {
        const rect = canvas.getBoundingClientRect();
        return {
            x: event.clientX - rect.left,
            y: event.clientY - rect.top
        };
    }

    static worldToScreen(worldX, worldY, camera) {
        const zoom = camera.zoom || 1.0;
        return {
            x: (worldX - camera.x) * zoom,
            y: (worldY - camera.y) * zoom
        };
    }

    static screenToWorld(screenX, screenY, camera) {
        const zoom = camera.zoom || 1.0;
        return {
            x: screenX / zoom + camera.x,
            y: screenY / zoom + camera.y
        };
    }

    static gridSnap(value, gridSize) {
        return Math.floor(value / gridSize) * gridSize;
    }

    static noise(x, y) {
        // Simple pseudo-random noise function
        let n = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
        return n - Math.floor(n);
    }

    static generateTerrain(x, amplitude = 50, frequency = 0.01) {
        return Math.floor(amplitude * (Math.sin(x * frequency) + Math.sin(x * frequency * 2) * 0.5 + Math.sin(x * frequency * 4) * 0.25));
    }

    static hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    }

    static rgbToHex(r, g, b) {
        return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
    }
}