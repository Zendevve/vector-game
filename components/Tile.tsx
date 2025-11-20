import React from 'react';
import { TileType } from '../types';

interface TileProps {
  type: TileType;
  isHit?: boolean;
  isDanger?: boolean;
}

export const Tile: React.FC<TileProps> = ({ type, isHit, isDanger }) => {
  let baseClass = "w-full h-full rounded-md transition-all duration-100";
  
  switch (type) {
    case TileType.PLAYER:
        // Pure white, intense glow
        baseClass += " bg-white glow-white z-30 shadow-2xl transform scale-[0.95]";
        break;
    case TileType.TARGET:
        // Cyan/Teal, distinct
        baseClass += " bg-cyan-500 glow-cyan z-20 shadow-lg";
        break;
    case TileType.WALL:
        if (isHit) {
             // Impact state: Red, scaled up, glowing
             baseClass += " bg-red-600 border-red-400 shadow-[0_0_20px_rgba(220,38,38,0.6)] scale-105 z-40";
        } else if (isDanger) {
             // Danger warning state for Lava mode
             baseClass += " bg-neutral-900 animate-danger-pulse z-10";
        } else {
             // Normal state - Solid Gray
             baseClass += " bg-neutral-900 border border-neutral-800"; 
        }
        break;
    case TileType.EMPTY:
    default:
        // Minimal dark background
        baseClass += " bg-neutral-950/50 border border-white/10";
        break;
  }

  return (
    <div 
      className={baseClass}
      role="presentation"
    />
  );
};