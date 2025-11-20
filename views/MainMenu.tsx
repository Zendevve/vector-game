
import React, { useState } from 'react';
import { Button } from '../components/Button';
import { GameMode } from '../types';
import { HighScores } from '../utils/storage';
import { X, HelpCircle, Settings as SettingsIcon } from 'lucide-react';
import { soundManager } from '../utils/sound';

interface MainMenuProps {
  onStartGame: (mode: GameMode) => void;
  highScores: HighScores;
}

export const MainMenu: React.FC<MainMenuProps> = ({ onStartGame, highScores }) => {
  const [activeDesc, setActiveDesc] = useState<string>("SELECT PROTOCOL");
  const [showHelp, setShowHelp] = useState<boolean>(false);

  const handleMouseEnter = (text: string) => {
    setActiveDesc(text);
  };

  const handleMouseLeave = () => {
    setActiveDesc("SELECT PROTOCOL");
  };

  const handleHelpClick = () => {
      soundManager.playClick();
      setShowHelp(true);
  };

  const handleCloseHelp = () => {
      soundManager.playClick();
      setShowHelp(false);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen w-full max-w-md mx-auto p-8 relative">
      
      {/* Header */}
      <div className="mb-24 text-center animate-in fade-in slide-in-from-top-8 duration-700 select-none">
        <h1 className="text-8xl font-black text-white mb-4 tracking-tighter leading-none">
          VECTOR
        </h1>
        <div className="flex items-center justify-center gap-3 opacity-60">
            <div className="h-[1px] w-6 bg-white"></div>
            <span className="text-[10px] font-mono font-bold uppercase tracking-[0.4em] text-white">
                Precision Challenge
            </span>
            <div className="h-[1px] w-6 bg-white"></div>
        </div>
      </div>

      {/* Menu Actions */}
      <div className="flex flex-col gap-4 w-full max-w-[280px] animate-in fade-in zoom-in-95 duration-500 delay-150">
        <Button 
          variant="primary" 
          size="lg" 
          fullWidth 
          onClick={() => onStartGame(GameMode.CLASSIC)}
          onMouseEnter={() => handleMouseEnter("REACH THE TARGET. AVOID WALLS. BE QUICK.")}
          onMouseLeave={handleMouseLeave}
          className="relative group"
        >
          <div className="flex items-center justify-between w-full">
            <span>RUN</span>
            <span className="text-[10px] font-mono font-normal text-neutral-400 group-hover:text-black transition-colors">
              BEST {highScores[GameMode.CLASSIC] || 0}
            </span>
          </div>
        </Button>
        
        <Button 
          variant="danger" 
          size="lg" 
          fullWidth 
          onClick={() => onStartGame(GameMode.LAVA)}
          onMouseEnter={() => handleMouseEnter("EXTREME HAZARD. WALLS KILL. VOID FALLS FATAL.")}
          onMouseLeave={handleMouseLeave}
          className="relative group"
        >
           <div className="flex items-center justify-between w-full">
            <span>FLOOR IS LAVA</span>
            <span className="text-[10px] font-mono font-normal text-red-400 group-hover:text-red-100 transition-colors">
              BEST {highScores[GameMode.LAVA] || 0}
            </span>
          </div>
        </Button>
      </div>

      {/* Dynamic Description Area */}
      <div className="h-12 mt-8 flex items-center justify-center animate-in fade-in duration-700 delay-300">
        <span className="text-[10px] font-mono text-neutral-500 tracking-widest text-center max-w-[200px] leading-tight uppercase">
            {activeDesc}
        </span>
      </div>
      
      {/* Footer Actions */}
      <div className="absolute bottom-12 flex gap-8 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-500">
        <button 
            onClick={handleHelpClick}
            className="text-neutral-600 hover:text-white transition-colors flex flex-col items-center gap-2 group"
        >
            <HelpCircle size={20} className="group-hover:scale-110 transition-transform" />
            <span className="text-[9px] font-bold tracking-widest uppercase">How to Play</span>
        </button>
      </div>

      {/* Version */}
      <div className="absolute bottom-4 text-neutral-900 text-[9px] font-mono">
        SYS.V.3.1
      </div>

      {/* Help Modal */}
      {showHelp && (
        <div className="absolute inset-0 bg-black/95 z-50 flex flex-col items-center justify-center p-8 animate-in fade-in duration-200">
             <div className="w-full max-w-sm">
                <div className="flex justify-between items-center mb-8 border-b border-white/20 pb-4">
                    <h2 className="text-xl font-bold tracking-widest text-white">DIRECTIVES</h2>
                    <button onClick={handleCloseHelp} className="text-neutral-400 hover:text-white">
                        <X size={24} />
                    </button>
                </div>

                <div className="space-y-8 font-mono text-xs text-neutral-300">
                    <div>
                        <h3 className="text-white font-bold mb-2 tracking-wider text-sm">OBJECTIVE</h3>
                        <p className="leading-relaxed text-neutral-400">
                            Navigate the <span className="text-white font-bold">WHITE UNIT</span> to the <span className="text-cyan-400 font-bold">CYAN TARGET</span>. 
                            <br/>Each success resets the clock and increases difficulty.
                        </p>
                    </div>

                    <div>
                         <h3 className="text-white font-bold mb-2 tracking-wider text-sm">CONTROLS</h3>
                         <div className="grid grid-cols-2 gap-4">
                            <div className="bg-neutral-900 p-3 rounded border border-neutral-800">
                                <div className="text-center mb-1 font-bold text-neutral-500">DESKTOP</div>
                                <div className="text-center text-white">ARROW KEYS</div>
                                <div className="text-center text-[9px] text-neutral-600 mt-1">WASD SUPPORTED</div>
                            </div>
                            <div className="bg-neutral-900 p-3 rounded border border-neutral-800">
                                <div className="text-center mb-1 font-bold text-neutral-500">MOBILE</div>
                                <div className="text-center text-white">SWIPE</div>
                                <div className="text-center text-[9px] text-neutral-600 mt-1">ANYWHERE ON SCREEN</div>
                            </div>
                         </div>
                    </div>

                    <div>
                        <h3 className="text-white font-bold mb-2 tracking-wider text-sm">PROTOCOLS</h3>
                        <ul className="space-y-3">
                            <li className="flex gap-3">
                                <span className="text-neutral-500 font-bold">01</span>
                                <span><strong className="text-white">RUN:</strong> Standard operation. Walls block path. Time is your enemy.</span>
                            </li>
                            <li className="flex gap-3">
                                <span className="text-red-500 font-bold">02</span>
                                <span><strong className="text-red-400">LAVA:</strong> Zero tolerance. Hitting a wall or swiping into the void causes immediate termination.</span>
                            </li>
                        </ul>
                    </div>
                </div>

                <div className="mt-12">
                    <Button fullWidth variant="primary" size="sm" onClick={handleCloseHelp}>ACKNOWLEDGE</Button>
                </div>
             </div>
        </div>
      )}
    </div>
  );
};
    