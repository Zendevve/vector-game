import React from 'react';
import { Button } from '../components/Button';
import { GameMode } from '../types';

interface MainMenuProps {
  onStartGame: (mode: GameMode) => void;
}

export const MainMenu: React.FC<MainMenuProps> = ({ onStartGame }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen w-full max-w-md mx-auto p-8 relative">
      
      {/* Header */}
      <div className="mb-20 text-center tracking-tighter">
        <h1 className="text-7xl font-black text-white mb-2 tracking-[-0.05em]">
          VECTOR
        </h1>
        <div className="text-gray-500 text-xs font-bold uppercase tracking-[0.3em]">
           Precision Challenge
        </div>
      </div>

      {/* Menu Actions */}
      <div className="flex flex-col gap-3 w-full max-w-[280px]">
        <Button 
          variant="primary" 
          size="lg" 
          fullWidth 
          onClick={() => onStartGame(GameMode.CLASSIC)}
        >
          Run
        </Button>
        
        <Button 
          variant="secondary" 
          size="lg" 
          fullWidth 
          onClick={() => onStartGame(GameMode.CHALLENGE)}
        >
          Hardcore
        </Button>
        
        <Button 
          variant="secondary" 
          size="lg" 
          fullWidth 
          onClick={() => onStartGame(GameMode.LAVA)}
        >
          Survival
        </Button>
      </div>
      
      {/* Footer Actions */}
      <div className="mt-8 flex gap-4">
        <button className="text-neutral-600 text-xs hover:text-white transition-colors uppercase font-bold tracking-widest">Profile</button>
        <button className="text-neutral-600 text-xs hover:text-white transition-colors uppercase font-bold tracking-widest">Settings</button>
      </div>

      {/* Version */}
      <div className="absolute bottom-8 text-neutral-800 text-[10px] font-mono">
        SYS.V.2.0
      </div>
    </div>
  );
};