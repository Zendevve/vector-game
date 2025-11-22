import React, { useState, useEffect } from 'react';
import { MainMenu } from './views/MainMenu';
import { Game } from './views/Game';
import { ViewState, GameMode } from './types';
import { Button } from './components/Button';
import { getHighScores, saveHighScore, HighScores } from './utils/storage';
import { haptics } from './utils/haptics';

const App: React.FC = () => {
  const [viewState, setViewState] = useState<ViewState>(ViewState.MENU);
  const [lastScore, setLastScore] = useState<number>(0);
  const [gameOverDetails, setGameOverDetails] = useState<{title: string, desc: string}>({ title: 'Terminated', desc: 'Time limit exceeded' });
  const [highScores, setHighScores] = useState<HighScores>(getHighScores());
  const [activeMode, setActiveMode] = useState<GameMode>(GameMode.CLASSIC);
  
  // Game Over Navigation: 0=Retry, 1=Abort
  const [gameOverIndex, setGameOverIndex] = useState<number>(0);

  const handleStartGame = (mode: GameMode) => {
    setActiveMode(mode);
    setViewState(ViewState.GAME);
  };

  const handleEndGame = (score: number, reason?: { title: string, desc: string }) => {
    setLastScore(score);
    
    if (reason) {
        setGameOverDetails(reason);
    } else {
        setGameOverDetails({ title: 'TERMINATED', desc: 'TIME LIMIT EXCEEDED' });
    }

    const newScores = saveHighScore(activeMode, score);
    setHighScores(newScores);

    setViewState(ViewState.GAME_OVER);
    setGameOverIndex(0); // Reset selection
  };

  const handleBackToMenu = () => {
    setViewState(ViewState.MENU);
  };

  const handleRetry = () => {
    setViewState(ViewState.GAME);
  };

  // Keyboard Navigation for Game Over Screen
  useEffect(() => {
    if (viewState !== ViewState.GAME_OVER) return;

    const handleKeyDown = (e: KeyboardEvent) => {
        switch(e.key) {
            case 'ArrowUp': 
            case 'w': 
            case 'W':
                e.preventDefault();
                setGameOverIndex(prev => (prev === 1 ? 0 : 1));
                haptics.tick();
                break;
            case 'ArrowDown': 
            case 's': 
            case 'S':
                e.preventDefault();
                setGameOverIndex(prev => (prev === 0 ? 1 : 0));
                haptics.tick();
                break;
            case 'Enter':
            case ' ':
                e.preventDefault();
                haptics.playClick();
                if (gameOverIndex === 0) handleRetry();
                else handleBackToMenu();
                break;
        }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [viewState, gameOverIndex]);

  const getGameOverStyle = (title: string) => {
    switch (title) {
        case 'CRITICAL FAILURE': 
            return 'text-red-600 animate-burn';
        case 'SIGNAL LOST': 
            return 'text-neutral-500 animate-glitch';
        case 'STRUCTURAL COLLAPSE': 
            return 'text-indigo-500 animate-pulse';
        case 'TERMINATED': 
            return 'text-red-500';
        default:
            return 'text-white';
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white selection:bg-white selection:text-black font-sans">
      <style>{`
        @keyframes burn-pulse {
            0%, 100% { text-shadow: none; opacity: 1; }
            50% { text-shadow: 0 0 15px rgba(220, 38, 38, 0.4); opacity: 0.9; }
        }
        .animate-burn {
            animation: burn-pulse 3s ease-in-out infinite;
        }

        @keyframes text-glitch {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.7; }
            52% { opacity: 0.9; }
            54% { opacity: 0.7; }
        }
        .animate-glitch {
            animation: text-glitch 2s steps(1) infinite;
        }
      `}</style>
      
      {viewState === ViewState.MENU && (
        <MainMenu 
          onStartGame={handleStartGame} 
          highScores={highScores} 
          activeMode={activeMode}
        />
      )}

      {viewState === ViewState.GAME && (
        <Game 
          mode={activeMode}
          onEndGame={handleEndGame} 
          onBackToMenu={handleBackToMenu} 
          highScore={highScores[activeMode] || 0}
        />
      )}

      {viewState === ViewState.GAME_OVER && (
        <div className="flex flex-col items-center justify-center min-h-screen w-full max-w-md md:max-w-md mx-auto p-8 animate-in fade-in zoom-in-95 duration-300">
            
            <div className="w-full border-t-2 border-white mb-8"></div>

            <div className="w-full mb-12">
                <div className="text-[10px] font-bold text-neutral-500 uppercase tracking-[0.3em] mb-2">Status</div>
                <h2 className={`text-5xl font-black uppercase tracking-tighter ${getGameOverStyle(gameOverDetails.title)}`}>
                    {gameOverDetails.title}
                </h2>
                <p className="text-neutral-400 mt-2 font-mono text-sm">{gameOverDetails.desc}</p>
            </div>

            <div className="grid grid-cols-2 w-full gap-4 mb-12">
                <div className="bg-neutral-900/50 border border-neutral-800 p-6 rounded-lg">
                    <div className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider mb-2">Grid Reached</div>
                    <div className="text-4xl font-black text-white font-mono">{lastScore.toString().padStart(2, '0')}</div>
                </div>
                <div className="bg-neutral-900/50 border border-neutral-800 p-6 rounded-lg flex flex-col justify-between">
                    <div className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider mb-2">Rating</div>
                    <div className="text-xl font-bold text-cyan-500">
                        {lastScore > (highScores[activeMode] || 0) ? 'NEW PB' : (lastScore > 20 ? 'S-TIER' : lastScore > 10 ? 'A-TIER' : 'C-TIER')}
                    </div>
                </div>
            </div>

            <div className="flex flex-col w-full gap-4">
                <Button 
                    variant="primary" 
                    size="lg" 
                    fullWidth 
                    isSelected={gameOverIndex === 0}
                    onClick={handleRetry}
                >
                    Reinitialize (ENTER)
                </Button>
                <Button 
                    variant="danger" 
                    size="lg" 
                    fullWidth 
                    isSelected={gameOverIndex === 1}
                    onClick={handleBackToMenu}
                >
                    Abort
                </Button>
            </div>
        </div>
      )}
    </div>
  );
};

export default App;