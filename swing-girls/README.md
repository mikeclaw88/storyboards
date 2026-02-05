# Swing Girls

A 3D golf training game featuring charming characters and accessible gameplay.

## Tech Stack

- **React** + **TypeScript** - UI framework
- **Three.js** / **React Three Fiber** - 3D graphics
- **Tailwind CSS** - Styling
- **shadcn/ui** - UI components
- **Zustand** - State management

## Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## Project Structure

```
swing-girls/
├── public/
│   ├── models/
│   │   ├── characters/      # Rigged FBX characters (no animations)
│   │   └── clubs/           # Golf club FBX models
│   ├── animations/          # Standalone animation FBX files
│   ├── config.json          # Motion/club configuration
│   └── golf_editor.html      # Golf Editor tool
├── src/
│   ├── components/          # React UI components
│   ├── config/              # Configuration types and defaults
│   ├── scenes/              # Three.js scenes
│   ├── hooks/               # Custom hooks
│   ├── stores/              # Zustand stores
│   └── utils/               # Utility functions
└── docs/                    # Documentation
```

## Golf Editor

Access the Golf Editor at `/golf_editor.html` during development.

**Features:**
- Keyframe-based club animation with Catmull-Rom interpolation
- Real-time preview with animation scrubbing
- Club model settings (pivot, rotation, scale)
- Per-character and per-animation configurations
- Undo support (Ctrl+Z)
- Export/Import JSON configuration

## Documentation

- [Game Design](./docs/game-design.md) - Game concept and features
- [Tech Stack](./docs/tech-stack.md) - Technical architecture
- [Character Design](./docs/character-design.md) - Character specifications
- [Animation System](./docs/animation-system.md) - Animation retargeting system
- [Gameplay](./docs/gameplay.md) - Mechanics and systems

## Development Status

- [x] Project setup (React + Three.js)
- [x] Basic 3D scene with lighting and shadows
- [x] Character/Animation selection UI
- [x] Dynamic asset discovery (characters & animations)
- [x] Animation retargeting system
- [x] Swing mechanics prototype (gesture-based)
- [x] Swing result display (Power/Accuracy/Score)
- [x] Screen mode switching (Selection/Playing)
- [x] Golf club attachment system (FBX model)
- [x] Golf Editor with keyframe animation
- [x] Club Editor for model configuration
- [x] Catmull-Rom spline interpolation
- [x] Ball physics with realistic aerodynamics
  - [x] Air drag and Magnus effect (backspin lift)
  - [x] Bouncing on ground contact
  - [x] Rolling with friction until stop
- [x] Golf tee with ball placement
- [x] Camera system
  - [x] Initial position behind character (-Z)
  - [x] Ball tracking when traveling far
  - [x] Smooth return to character after ball stops
- [x] Configurable impact time per character/animation
- [x] Retry button for quick testing
- [ ] Training mode curriculum
- [ ] Course play

## License

Private project - All rights reserved
