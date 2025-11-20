import React, { useState, useEffect } from 'react';
import { MainMenu } from './views/MainMenu';
import { Game } from './views/Game';
import { Settings } from './views/Settings';
import { ViewState, GameMode } from './types';
import { Button } from './components/Button';
import { soundManager } from './utils/sound';
import { getHighScores, saveHighScore, HighScores, getSettings, saveSettings, GameSettings } from './utils/storage';
import { Settings as SettingsIcon } from 'lucide-react';

const App: React.FC = () => {
  const [viewState, setViewState] = useState<ViewState>(ViewState.MENU);
  const [lastScore, setLastScore] = useState<number>(0);
  
  // Settings State
  const [settings, setSettings] = useState<GameSettings>(getSettings());
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  
  const [highScores, setHighScores] = useState<HighScores>(getHighScores());
  const [activeMode, setActiveMode] = useState<GameMode>(GameMode.CLASSIC);

  useEffect(() => {
    const initAudio = () => {
        soundManager.playStart(); 
        window.removeEventListener('click', initAudio);
    };
    window.addEventListener('click', initAudio);
    return () => window.removeEventListener('click', initAudio);
  }, []);

  // Apply Settings
  useEffect(() => {
    soundManager.setEnabled(settings.soundEnabled);
    soundManager.setVolume(settings.volume);
    saveSettings(settings);
  }, [settings]);

  const handleStartGame = (mode: GameMode) => {
    setActiveMode(mode);
    setViewState(ViewState.GAME);
  };

  const handleEndGame = (score: number) => {
    setLastScore(score);
    
    const newScores = saveHighScore(activeMode, score);
    setHighScores(newScores);

    setViewState(ViewState.GAME_OVER);
  };

  const handleBackToMenu = () => {
    setViewState(ViewState.MENU);
  };

  const handleRetry = () => {
    setViewState(ViewState.GAME);
  };

  const updateSettings = (newSettings: Partial<GameSettings>) => {
      setSettings(prev => ({ ...prev, ...newSettings }));
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white selection:bg-white selection:text-black font-sans">
      
      {/* Global Settings Button */}
      <div className="fixed top-6 right-6 z-40">
        <button 
            onClick={() => setIsSettingsOpen(true)}
            className="p-2 rounded-full text-neutral-600 hover:text-white hover:bg-white/10 transition-all"
            aria-label="Open Settings"
        >
            <SettingsIcon size={24} />
        </button>
      </div>

      <Settings 
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        volume={settings.volume}
        onVolumeChange={(v) => updateSettings({ volume: v })}
        soundEnabled={settings.soundEnabled}
        onSoundEnabledChange={(v) => updateSettings({ soundEnabled: v })}
        hapticsEnabled={settings.hapticsEnabled}
        onHapticsEnabledChange={(v) => updateSettings({ hapticsEnabled: v })}
      />

      {viewState === ViewState.MENU && (
        <MainMenu 
            onStartGame={handleStartGame} 
            onOpenSettings={() => setIsSettingsOpen(true)}
            highScores={highScores} 
        />
      )}

      {viewState === ViewState.GAME && (
        <Game 
          onEndGame={handleEndGame} 
          onBackToMenu={handleBackToMenu} 
          onOpenSettings={() => setIsSettingsOpen(true)}
          highScore={highScores[activeMode]}
          hapticsEnabled={settings.hapticsEnabled}
        />
      )}

      {viewState === ViewState.GAME_OVER && (
        <div className="flex flex-col items-center justify-center min-h-screen w-full max-w-md mx-auto p-8 animate-in fade-in zoom-in-95 duration-300">
            
            <div className="w-full border-t-2 border-white mb-8"></div>

            <div className="w-full mb-12">
                <div className="text-[10px] font-bold text-neutral-500 uppercase tracking-[0.3em] mb-2">Status</div>
                <h2 className="text-5xl font-black text-white uppercase tracking-tighter">Terminated</h2>
                <p className="text-neutral-400 mt-2 font-mono text-sm">Connection lost. Time limit exceeded.</p>
            </div>

            <div className="grid grid-cols-2 w-full gap-4 mb-12">
                <div className="bg-neutral-900/50 border border-neutral-800 p-6 rounded-lg">
                    <div className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider mb-2">Grid Reached</div>
                    <div className="text-4xl font-black text-white font-mono">{lastScore.toString().padStart(2, '0')}</div>
                </div>
                <div className="bg-neutral-900/50 border border-neutral-800 p-6 rounded-lg flex flex-col justify-between">
                    <div className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider mb-2">Rating</div>
                    <div className="text-xl font-bold text-cyan-500">
                        {lastScore > highScores[activeMode] ? 'NEW PB' : (lastScore > 20 ? 'S-TIER' : lastScore > 10 ? 'A-TIER' : 'C-TIER')}
                    </div>
                </div>
            </div>

            <div className="flex flex-col w-full gap-4">
                <Button 
                    variant="primary" 
                    size="lg" 
                    fullWidth 
                    onClick={handleRetry}
                >
                    Reinitialize
                </Button>
                <Button 
                    variant="secondary" 
                    size="lg" 
                    fullWidth 
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