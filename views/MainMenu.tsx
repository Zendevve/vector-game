import React, { useState } from 'react';
import { Button } from '../components/Button';
import { GameMode } from '../types';
import { HighScores } from '../utils/storage';
import { X, HelpCircle } from 'lucide-react';

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
      setShowHelp(true);
  };

  const handleCloseHelp = () => {
      setShowHelp(false);
  };

  return (
    <div className="flex flex-col items-center min-h-screen w-full max-w-md mx-auto p-8 font-sans relative">
      <style>{`
        @keyframes intro-logo {
          0% { opacity: 0; transform: scale(0.95) translateY(10px); filter: blur(10px); }
          100% { opacity: 1; transform: scale(1) translateY(0); filter: blur(0); }
        }
        @keyframes intro-subtitle {
          0% { opacity: 0; letter-spacing: 1.5em; filter: blur(4px); }
          100% { opacity: 1; letter-spacing: 0.6em; filter: blur(0); }
        }
        @keyframes intro-fade-up {
          0% { opacity: 0; transform: translateY(20px); }
          100% { opacity: 1; transform: translateY(0); }
        }
      `}</style>
      
      {/* Main Content Wrapper for Vertical Centering */}
      <div className="flex-1 flex flex-col items-center justify-center w-full">
        
        {/* Sleek Minimalist Header */}
        <div className="flex flex-col items-center mb-20 select-none">
          <h1 
            className="text-8xl md:text-9xl font-bold text-white tracking-tighter"
            style={{ animation: 'intro-logo 1.2s cubic-bezier(0.16, 1, 0.3, 1) forwards' }}
          >
            VECTOR
          </h1>
          <span 
            className="mt-6 text-[10px] font-mono font-medium text-neutral-500 uppercase opacity-0"
            style={{ animation: 'intro-subtitle 1.4s cubic-bezier(0.16, 1, 0.3, 1) 0.4s forwards' }}
          >
            Precision Challenge
          </span>
        </div>

        {/* Menu Actions */}
        <div 
          className="flex flex-col gap-4 w-full max-w-[320px]"
          style={{ animation: 'intro-fade-up 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.6s forwards', opacity: 0 }}
        >
          <Button 
            variant="primary" 
            size="lg" 
            fullWidth 
            onClick={() => onStartGame(GameMode.CLASSIC)}
            onMouseEnter={() => handleMouseEnter("REACH THE TARGET. AVOID WALLS. BE QUICK.")}
            onMouseLeave={handleMouseLeave}
            className="relative group"
          >
            <div className="flex items-center justify-between w-full px-2">
              <span>RUN</span>
              <span className="text-[10px] font-mono font-normal text-neutral-500 group-hover:text-white transition-colors">
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
             <div className="flex items-center justify-between w-full px-2">
              <span>FLOOR IS LAVA</span>
              <span className="text-[10px] font-mono font-normal text-red-900 group-hover:text-red-400 transition-colors">
                BEST {highScores[GameMode.LAVA] || 0}
              </span>
            </div>
          </Button>
        </div>

        {/* Dynamic Description Area */}
        <div 
          className="h-12 mt-10 flex items-center justify-center"
          style={{ animation: 'intro-fade-up 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.8s forwards', opacity: 0 }}
        >
          <span className="text-[10px] font-mono text-neutral-500 tracking-widest text-center max-w-[200px] leading-tight uppercase">
              {activeDesc}
          </span>
        </div>
      </div>
      
      {/* Footer Actions */}
      <div 
        className="mt-auto pt-8 flex flex-col items-center gap-6"
        style={{ animation: 'intro-fade-up 0.8s cubic-bezier(0.16, 1, 0.3, 1) 1.0s forwards', opacity: 0 }}
      >
        <button 
            onClick={handleHelpClick}
            className="text-neutral-600 hover:text-white transition-colors flex flex-col items-center gap-2 group"
        >
            <HelpCircle size={20} className="group-hover:scale-110 transition-transform" />
            <span className="text-[9px] font-bold tracking-widest uppercase">How to Play</span>
        </button>

        <div className="flex flex-col items-center gap-1">
            <div className="text-neutral-800 text-[10px] font-bold tracking-widest uppercase">
                CREATED BY ZENDEVVE
            </div>
            <div className="text-neutral-900 text-[9px] font-mono select-none">
                SYS.V.3.7
            </div>
        </div>
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
                            <div className="bg-neutral-900 p-3 rounded-none border border-neutral-800">
                                <div className="text-center mb-1 font-bold text-neutral-500">DESKTOP</div>
                                <div className="text-center text-white">ARROW KEYS</div>
                                <div className="text-center text-[9px] text-neutral-600 mt-1">WASD SUPPORTED</div>
                            </div>
                            <div className="bg-neutral-900 p-3 rounded-none border border-neutral-800">
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