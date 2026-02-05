# Swing Girls - Game Design Document

## Overview

**Title:** Swing Girls
**Genre:** 3D Golf Training / Casual Sports
**Platform:** Web Browser (Desktop/Mobile)
**Engine:** Three.js + React

## Concept

A casual 3D golf training game featuring charming characters who guide players through golf fundamentals. The game focuses on approachable gameplay with stylized visuals.

## Core Pillars

1. **Accessible Golf Mechanics** - Simple controls that are easy to learn
2. **Character-Driven Experience** - Memorable trainers with unique personalities
3. **Progressive Training** - Structured lessons from basics to advanced techniques

## Swing Mechanics

### Pull-to-Swing Gesture

The game uses an intuitive pull-to-swing gesture system:

1. **Pull Phase (Backswing)**
   - Player touches/clicks and drags downward
   - Character animation scrubs proportionally from frame 0 to backswing top position
   - Pull progress (0-100%) directly maps to animation time (0 to backswingTopTime)
   - Visual feedback shows power gauge filling

2. **Release Phase (Downswing)**
   - Player releases or swipes upward
   - Animation continues from current scrubbed position through impact
   - Swing speed and direction affect ball trajectory
   - Ball launches at impact time (configured per animation)

3. **Result Calculation**
   - Power: Based on pull distance and release speed
   - Accuracy: Based on horizontal deviation during swing
   - Combined score determines ball flight characteristics

### Animation Timing Configuration

Animation timing is configured at the animation level (not per-character):

```json
{
  "animations": {
    "golf_drive": {
      "backswingTopTime": 0.8,
      "impactTime": 1.168
    }
  }
}
```

- **backswingTopTime**: Time point where backswing reaches its peak (used for pull scrubbing)
- **impactTime**: Time point where club contacts ball (triggers ball launch)

## Game Modes

### Training Mode
- Tutorial sessions with character guides
- Skill-based challenges (driving, putting, approach shots)
- Progressive difficulty levels

### Practice Range
- Free play driving range
- Target practice with scoring
- Club selection practice

### Course Play
- Multiple themed courses
- Stroke play mechanics
- Par tracking and scoring

## Target Audience

- Casual gamers interested in sports games
- Golf enthusiasts looking for practice tools
- Players who enjoy character-driven experiences

## Monetization (Future)

- Cosmetic items (outfits, golf equipment skins)
- Additional courses (DLC)
- Character unlocks
