# Nebula Strike: Finger Commander

**Nebula Strike** is an immersive, browser-based space shooter that turns your hand into a high-powered laser controller. Using advanced computer vision and AI, it tracks your finger movements through your webcam to provide a "touchless" gaming experience.

## 🚀 Experience the Future of Interaction

Forget controllers. **Nebula Strike** utilizes your webcam to track your hand landmarks in real-time. By calculating the distance between your thumb and index finger, the game detects "pinch" gestures to fire lasers at cosmic entities.

### Key Features
- **Gesture-Based Aiming**: Real-time tracking of the index finger landmark for precision aiming.
- **AI-Generated Briefings**: Missions are dynamically created using the **Gemini 3 Flash** model to provide unique sci-fi flavor for every session.
- **Deep Space Visuals**: A 3D parallax starfield and colorful nebula background that moves relative to your hand.
- **Detailed Planetary Targets**: Targets aren't just circles; they are procedurally textured planets (Gas Giants, Rocky Worlds, and Ice Planets) with atmospheric rim lighting and orbital rings.

---

## 🕹️ How to Play

### 1. Requirements
- A modern web browser (Chrome or Edge recommended).
- A webcam for hand tracking.
- Good lighting (helps the computer vision detect your hand).

### 2. Controls
| Action | Gesture |
| :--- | :--- |
| **Aim** | Point your **Index Finger** at the screen. The reticle will follow your fingertip. |
| **Fire Laser** | **Pinch** your thumb and index finger together. A beam will fire from the bottom of the screen to your reticle. |
| **Calibration** | Hover your reticle over the center ring during the start of the game and hold it steady to "sync" your neural link. |

---

## 🛠️ Technical Architecture

### Hand Tracking (MediaPipe)
The game uses the **MediaPipe Hands** library to extract 21 3D hand landmarks at 30+ FPS. 
- **Aiming**: We map the 2D coordinates of Landmark 8 (Index Finger Tip) to the canvas size.
- **Firing**: We calculate the Euclidean distance between Landmark 4 (Thumb Tip) and Landmark 8. If the distance falls below a specific threshold, a `fire` event is triggered.

### AI Intelligence (Google Gemini)
At the start of each round, the app calls the **Google Gemini API** (`gemini-3-flash-preview`) to:
1. Generate a creative mission title.
2. Write a short sci-fi briefing based on the current level.
3. Define a tactical objective.

### Rendering (HTML5 Canvas)
The game utilizes a dual-canvas system:
- **Background Canvas**: Renders the 3D starfield, nebula gradients, and parallax effects.
- **Game Canvas**: Handles the high-frequency rendering of planets, laser beams, particles, and the reticle.

---

## 💻 Getting Started for Developers

### Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/nebula-strike.git
   ```
2. Open `index.html` in your browser.
3. Ensure you have an environment variable `API_KEY` configured for the Gemini API.

### Project Structure
- `App.tsx`: Main state machine (Lobby -> Calibration -> Playing -> GameOver).
- `GameView.tsx`: The heart of the game, containing the logic for MediaPipe, the physics engine, and planet rendering.
- `Lobby.tsx`: The mission control interface.
- `geminiService.ts`: Handles the integration with the Google Generative AI SDK.

---

## 🌌 Disclaimer
This application uses your camera solely for local hand tracking. No video data is ever recorded, stored, or sent to any server. All processing happens directly in your browser.

---
*Created by a Senior Frontend Engineer with ❤️ and a passion for gesture-controlled interfaces.*