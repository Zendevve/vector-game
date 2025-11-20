# VECTOR
### PRECISION GRID NAVIGATION SYSTEM

**VECTOR** is a high-speed, minimalist puzzle challenge designed to test reflex and cognitive precision. Navigate the unit to the target destination under strict time constraints while adapting to dynamically shifting grid parameters.

## // PROTOCOLS

### 01 RUN
Standard operation mode. Navigate the **UNIT** (White) to the **GOAL** (Cyan).
- Walls act as physical barriers.
- Collisions with walls or grid borders result in a time penalty.
- Difficulty adapts via grid expansion (3x3 to 5x5) and reduced time limits.

### 02 FLOOR IS LAVA
Zero tolerance environment.
- Wall contact results in immediate termination (Incineration).
- Moving out of bounds results in immediate termination (Void Fall).
- Precision is mandatory.

## // CONTROLS

| Interface | Input Method |
| :--- | :--- |
| **Desktop** | `WASD` or `Arrow Keys` for orthogonal movement. |
| **Mobile** | Swipe gestures anywhere on screen. |

## // SYSTEM ARCHITECTURE

Constructed with a focus on performance, responsiveness, and a stark brutalist aesthetic.

- **Core**: React 19 + TypeScript
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Persistence**: Local Storage for high score retention

## // INITIALIZATION

To deploy the system locally:

```bash
# Install dependencies
npm install

# Initialize development server
npm run dev

# Compile for production
npm run build
```

---
*System Version 3.7*
*Created by ZenDevve*