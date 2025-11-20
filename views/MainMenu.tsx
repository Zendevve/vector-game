import React from 'react';
import { Button } from '../components/Button';
import { GameMode } from '../types';
import { HighScores } from '../utils/storage';

interface MainMenuProps {
  onStartGame: (mode: GameMode) => void;
  highScores: HighScores;
}

export const MainMenu: React.FC<MainMenuProps> = ({ onStartGame, highScores }) => {
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
          className="relative group"
        >
          <div className="flex items-center justify-between w-full">
            <span>RUN</span>
            <span className="text-[10px] font-mono font-normal text-neutral-400 group-hover:text-black transition-colors">
              BEST {highScores[GameMode.CLASSIC]}
            </span>
          </div>
        </Button>
        
        <Button 
          variant="secondary" 
          size="lg" 
          fullWidth 
          onClick={() => onStartGame(GameMode.CHALLENGE)}
          className="relative group"
        >
           <div className="flex items-center justify-between w-full">
            <span>HARDCORE</span>
            <span className="text-[10px] font-mono font-normal text-neutral-600 group-hover:text-white transition-colors">
              BEST {highScores[GameMode.CHALLENGE]}
            </span>
          </div>
        </Button>
        
        <Button 
          variant="secondary" 
          size="lg" 
          fullWidth 
          onClick={() => onStartGame(GameMode.LAVA)}
          className="relative group"
        >
           <div className="flex items-center justify-between w-full">
            <span>SURVIVAL</span>
            <span className="text-[10px] font-mono font-normal text-neutral-600 group-hover:text-white transition-colors">
              BEST {highScores[GameMode.LAVA]}
            </span>
          </div>
        </Button>
      </div>
      
      {/* Footer Actions */}
      <div className="mt-8 flex gap-4">
        <button className="text-neutral-600 text-xs hover:text-white transition-colors uppercase font-bold tracking-widest">Profile</button>
        <button className="text-neutral-600 text-xs hover:text-white transition-colors uppercase font-bold tracking-widest">Settings</button>
      </div>

      {/* Version */}
      <div className="absolute bottom-8 text-neutral-800 text-[10px] font-mono">
        SYS.V.2.1
      </div>
    </div>
  );
};