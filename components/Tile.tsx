import React from 'react';
import { TileType } from '../types';

interface TileProps {
  type: TileType;
}

export const Tile: React.FC<TileProps> = ({ type }) => {
  let baseClass = "w-full h-full rounded-md transition-all duration-200";
  
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
        // Dark gray, subtle
        baseClass += " bg-neutral-900 border border-neutral-800"; 
        break;
    case TileType.EMPTY:
    default:
        // Minimal dark background
        baseClass += " bg-neutral-950/50 border border-white/5";
        break;
  }

  return (
    <div className="aspect-square p-[2px]">
      <div 
        className={baseClass}
        role="presentation"
      />
    </div>
  );
};