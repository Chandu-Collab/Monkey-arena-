# 🍌 Grab the Banana — 3D Jungle Arena Game

An action-packed 3D browser game built with **Babylon.js**, **TypeScript**, and **Vite**.

---

## 🎮 Gameplay & Mechanics

1. **Mission Briefing**:
   - The game begins with an interactive Mission Briefing card.
   - Click **START MISSION 🍌** or wait for the 5-second countdown to start playing.

2. **Dual-Ring Defense System**:
   - 🔵 **Outer Circle (12.5m)**: Enemy defender monkeys standing near the center will hurl fish from their hands!
   - 🔴 **Inner Circle (4.6m)**: Defender monkeys awaken and actively chase you to protect the pedestal.
   - 🏃 **Immunity Through Movement**: Rival monkeys can only damage you if you stop / stand still. *Keep moving!*

3. **Banana Snatch & Extraction**:
   - Reach the center pedestal and press <kbd>E</kbd> to snatch the **Golden Banana**.
   - 🌧️ **Falling Sky Fish Hazard**: Fishes plummet straight down from the sky into animated ground water ponds with splash effects.
   - 🟢 **2-Second Blinking Safe Home**: The moving green extraction portal blinks on a 2-second cycle (active for 2s, cloaked for 2s). Enter while it's active to escape and win!

---

## 🕹️ Controls

| Action | Key / Input |
|---|---|
| Move | <kbd>W</kbd> / <kbd>A</kbd> / <kbd>S</kbd> / <kbd>D</kbd> |
| Jump | <kbd>SPACE</kbd> |
| Sprint | <kbd>SHIFT</kbd> |
| Snatch Banana | <kbd>E</kbd> |
| Camera Orbit / Zoom | Mouse Drag / Scroll Wheel |

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+ recommended)
- npm / yarn / pnpm

### Installation & Run Locally
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

---

## 🛠️ Tech Stack
- **Engine**: [Babylon.js](https://www.babylonjs.com/) (3D WebGL / WebGPU Rendering, Procedural Mesh & Lighting)
- **Language**: TypeScript
- **Audio**: Web Audio API Procedural Synthesizers (no external audio assets required)
- **Bundler**: Vite