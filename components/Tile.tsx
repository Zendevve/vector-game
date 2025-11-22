import React from 'react';
import { TileType, GameMode } from '../types';

interface TileProps {
  type: TileType;
  isHit?: boolean;
  isDanger?: boolean;
  isVisited?: boolean;
  mode?: GameMode;
}

export const Tile: React.FC<TileProps> = ({ type, isHit, isDanger, isVisited, mode }) => {
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
        } else if (mode === GameMode.LAVA) {
             // Lava Wall State: Dark red with internal glow
             baseClass += " bg-red-900/80 border-red-600/50 shadow-[0_0_10px_rgba(220,38,38,0.2)]";
             // Intensify if player is adjacent
             if (isDanger) {
                 baseClass += " animate-danger-pulse border-red-500";
             }
        } else if (isDanger) {
             // Legacy/Fallback warning state
             baseClass += " bg-neutral-900 animate-danger-pulse z-10";
        } else {
             // Normal state - Solid Gray
             baseClass += " bg-neutral-900 border border-neutral-800"; 
        }
        break;
    case TileType.EMPTY:
    default:
        if (mode === GameMode.FRAGILE && isVisited) {
            // Cracked/Fragile state: Hollow, indigo border, low opacity
            baseClass += " bg-transparent border border-indigo-500/30 shadow-[inset_0_0_10px_rgba(99,102,241,0.1)] scale-90";
        } else {
            // Minimal dark background
            baseClass += " bg-neutral-950/50 border border-white/10";
        }
        break;
  }

  return (
    <div 
      className={baseClass}
      role="presentation"
    />
  );
};