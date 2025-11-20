import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Tile } from '../components/Tile';
import { Button } from '../components/Button';
import { TileType } from '../types';
import { soundManager } from '../utils/sound';
import { Pause, Play, RotateCcw, ChevronUp, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';

interface GameProps {
  onEndGame: (score: number) => void;
  onBackToMenu: () => void;
}

// Configuration Constants
const INITIAL_TIME_LIMIT_MS = 5000; 
const TIME_DECREMENT_INTERVAL = 10;
const INITIAL_GRID_SIZE = 3;

export const Game: React.FC<GameProps> = ({ onEndGame, onBackToMenu }) => {
  // Game State
  const [gridSize, setGridSize] = useState<number>(INITIAL_GRID_SIZE);
  const [score, setScore] = useState<number>(1); 
  const [timeLeft, setTimeLeft] = useState<number>(INITIAL_TIME_LIMIT_MS);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  
  // Board State
  const [playerIndex, setPlayerIndex] = useState<number>(0);
  const [targetIndex, setTargetIndex] = useState<number>(0);
  const [walls, setWalls] = useState<Set<number>>(new Set());

  const timerRef = useRef<number | null>(null);

  // Helper: BFS to check if path exists
  const isSolvable = (size: number, start: number, end: number, currentWalls: Set<number>) => {
    const queue = [start];
    const visited = new Set([start]);
    
    while (queue.length > 0) {
        const current = queue.shift()!;
        if (current === end) return true;

        const row = Math.floor(current / size);
        const col = current % size;
        
        const directions = [[0, 1], [0, -1], [1, 0], [-1, 0]];
        
        for (const [dy, dx] of directions) {
            const newRow = row + dy;
            const newCol = col + dx;
            
            if (newRow >= 0 && newRow < size && newCol >= 0 && newCol < size) {
                const nextIndex = newRow * size + newCol;
                if (!currentWalls.has(nextIndex) && !visited.has(nextIndex)) {
                    visited.add(nextIndex);
                    queue.push(nextIndex);
                }
            }
        }
    }
    return false;
  };

  // Generate a new board state
  const generateLevel = useCallback((currentSize: number, currentPlayerIndex: number) => {
    const totalTiles = currentSize * currentSize;
    
    let newTargetIndex: number;
    let newWalls: Set<number>;
    let attempts = 0;
    const MAX_ATTEMPTS = 50;

    const pRow = Math.floor(currentPlayerIndex / currentSize);
    const pCol = currentPlayerIndex % currentSize;

    do {
        newWalls = new Set();
        
        // 1. Determine Valid Targets (Distance > 1)
        const possibleTargets: number[] = [];
        for (let i = 0; i < totalTiles; i++) {
            if (i === currentPlayerIndex) continue;

            const tRow = Math.floor(i / currentSize);
            const tCol = i % currentSize;
            const dist = Math.abs(tRow - pRow) + Math.abs(tCol - pCol);

            if (dist > 1) {
                possibleTargets.push(i);
            }
        }

        // Fallback
        if (possibleTargets.length === 0) {
            for (let i = 0; i < totalTiles; i++) {
                 if (i !== currentPlayerIndex) possibleTargets.push(i);
            }
        }

        newTargetIndex = possibleTargets[Math.floor(Math.random() * possibleTargets.length)];

        // 2. Determine Walls
        const possibleWalls: number[] = [];
        for (let i = 0; i < totalTiles; i++) {
            if (i !== currentPlayerIndex && i !== newTargetIndex) {
                possibleWalls.push(i);
            }
        }

        // Shuffle
        for (let i = possibleWalls.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [possibleWalls[i], possibleWalls[j]] = [possibleWalls[j], possibleWalls[i]];
        }

        // Pick Walls
        let wallCount = 0;
        if (currentSize === 3) wallCount = Math.random() > 0.7 ? 1 : 0;
        else if (currentSize === 4) wallCount = 2 + Math.floor(Math.random() * 2);
        else wallCount = 4 + Math.floor(Math.random() * 3);

        for (let i = 0; i < wallCount; i++) {
            if (possibleWalls.length > 0) {
                newWalls.add(possibleWalls.pop()!);
            }
        }
        attempts++;
    } while (!isSolvable(currentSize, currentPlayerIndex, newTargetIndex, newWalls) && attempts < MAX_ATTEMPTS);

    if (attempts >= MAX_ATTEMPTS) {
        newWalls.clear();
    }

    setTargetIndex(newTargetIndex);
    setWalls(newWalls);
  }, []);

  // Start Game
  useEffect(() => {
    soundManager.playStart();
    setScore(1);
    setGridSize(INITIAL_GRID_SIZE);
    setTimeLeft(INITIAL_TIME_LIMIT_MS);
    
    const startPlayer = 0;
    setPlayerIndex(startPlayer);
    generateLevel(INITIAL_GRID_SIZE, startPlayer);
    
    setIsPlaying(true);
    setIsPaused(false);

    return () => stopTimer();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Restart Game Logic
  const handleRestart = useCallback(() => {
    soundManager.playStart();
    setScore(1);
    setGridSize(INITIAL_GRID_SIZE);
    setTimeLeft(INITIAL_TIME_LIMIT_MS);
    
    const startPlayer = 0;
    setPlayerIndex(startPlayer);
    generateLevel(INITIAL_GRID_SIZE, startPlayer);
    
    setIsPlaying(true);
    setIsPaused(false);
  }, [generateLevel]);

  // Difficulty Scaling
  useEffect(() => {
    let newSize = INITIAL_GRID_SIZE;
    if (score >= 10) newSize = 4;
    if (score >= 25) newSize = 5;
    
    if (newSize !== gridSize) {
        const currentRow = Math.floor(playerIndex / gridSize);
        const currentCol = playerIndex % gridSize;
        const newPlayerIndex = currentRow * newSize + currentCol;

        setGridSize(newSize);
        setPlayerIndex(newPlayerIndex);
        generateLevel(newSize, newPlayerIndex);
    }
  }, [score, gridSize, playerIndex, generateLevel]);

  // Timer
  const startTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = window.setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 0) {
          handleGameOver();
          return 0;
        }
        return prev - TIME_DECREMENT_INTERVAL;
      });
    }, TIME_DECREMENT_INTERVAL);
  };

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  useEffect(() => {
    if (isPlaying && !isPaused) {
      startTimer();
    } else {
      stopTimer();
    }
    return () => stopTimer();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPlaying, isPaused]);

  const handleGameOver = () => {
    stopTimer();
    setIsPlaying(false);
    soundManager.playGameOver();
    setTimeout(() => {
        onEndGame(score);
    }, 100);
  };

  // Movement
  const movePlayer = useCallback((dx: number, dy: number) => {
    if (!isPlaying || isPaused) return;

    setPlayerIndex((prev) => {
        const row = Math.floor(prev / gridSize);
        const col = prev % gridSize;
        const newRow = row + dy;
        const newCol = col + dx;

        if (newRow < 0 || newRow >= gridSize || newCol < 0 || newCol >= gridSize) return prev;

        const newIndex = newRow * gridSize + newCol;
        
        if (walls.has(newIndex)) {
            soundManager.playError();
            return prev;
        }

        if (newIndex === targetIndex) {
            soundManager.playTap();
            setScore(s => s + 1);
            setTimeLeft(INITIAL_TIME_LIMIT_MS);
            generateLevel(gridSize, newIndex);
        } else {
            soundManager.playMove();
        }

        return newIndex;
    });
  }, [gridSize, isPlaying, isPaused, targetIndex, walls, generateLevel]);

  // Keyboard
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        if (!isPlaying || isPaused) return;
        if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " "].includes(e.key)) e.preventDefault();

        switch(e.key) {
            case 'ArrowUp': case 'w': case 'W': movePlayer(0, -1); break;
            case 'ArrowDown': case 's': case 'S': movePlayer(0, 1); break;
            case 'ArrowLeft': case 'a': case 'A': movePlayer(-1, 0); break;
            case 'ArrowRight': case 'd': case 'D': movePlayer(1, 0); break;
            case 'r': case 'R': handleRestart(); break;
        }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [movePlayer, isPlaying, isPaused, handleRestart]);

  const getGridCols = () => {
    if (gridSize === 3) return 'grid-cols-3';
    if (gridSize === 4) return 'grid-cols-4';
    if (gridSize === 5) return 'grid-cols-5';
    return 'grid-cols-3';
  };

  // D-Pad Button Component
  const DPadButton = ({ onClick, icon: Icon }: { onClick: any, icon: any }) => (
    <button 
        className="w-full h-full bg-neutral-900 border border-neutral-800 rounded-lg flex items-center justify-center active:bg-white active:text-black active:border-white transition-colors touch-none text-neutral-500"
        onPointerDown={(e) => { e.preventDefault(); onClick(); }}
    >
        <Icon size={24} strokeWidth={2.5} />
    </button>
  );

  return (
    <div className="flex flex-col h-screen w-full max-w-md mx-auto bg-[#050505] relative overflow-hidden font-sans">
      
      {/* Minimalist HUD */}
      <div className="flex justify-between items-end p-8 pb-2">
        <div className="flex flex-col">
          <span className="text-neutral-600 text-[10px] font-bold tracking-[0.2em] mb-1">GRID</span>
          <span className="text-5xl font-black text-white tracking-tighter leading-none font-mono">
            {score.toString().padStart(2, '0')}
          </span>
        </div>

        <div className="flex flex-col items-end">
           <span className="text-neutral-600 text-[10px] font-bold tracking-[0.2em] mb-1">TIMER</span>
           <span className={`text-3xl font-bold tracking-tight font-mono ${timeLeft < 1000 ? 'text-red-500' : 'text-white'}`}>
            {(timeLeft / 1000).toFixed(2)}s
          </span>
        </div>
      </div>

      {/* Progress Line */}
      <div className="w-full px-8 mb-8">
        <div className="h-[2px] w-full bg-neutral-900">
            <div 
                className="h-full bg-white transition-all duration-75 ease-linear" 
                style={{ width: `${(timeLeft / INITIAL_TIME_LIMIT_MS) * 100}%` }}
            />
        </div>
      </div>

      {/* Game Board */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 relative z-10">
        <div className={`grid ${getGridCols()} gap-2 w-full aspect-square max-w-[380px]`}>
          {Array.from({ length: gridSize * gridSize }).map((_, index) => {
            let type = TileType.EMPTY;
            if (index === playerIndex) type = TileType.PLAYER;
            else if (index === targetIndex) type = TileType.TARGET;
            else if (walls.has(index)) type = TileType.WALL;
            return <Tile key={index} type={type} />;
          })}
        </div>
      </div>

      {/* Minimal Controls */}
      <div className="p-8 pb-10 flex flex-col items-center gap-6">
        {/* Hidden on desktop, sleek on mobile */}
        <div className="grid grid-cols-3 gap-2 w-48 h-32">
            <div />
            <DPadButton icon={ChevronUp} onClick={() => movePlayer(0, -1)} />
            <div />
            
            <DPadButton icon={ChevronLeft} onClick={() => movePlayer(-1, 0)} />
            <DPadButton icon={ChevronDown} onClick={() => movePlayer(0, 1)} />
            <DPadButton icon={ChevronRight} onClick={() => movePlayer(1, 0)} />
        </div>

        <div className="flex gap-8 items-center">
            <button 
                onClick={handleRestart}
                className="text-neutral-600 hover:text-white transition-colors p-2"
                aria-label="Restart Run"
            >
               <RotateCcw size={20} />
            </button>

            <button 
                onClick={() => setIsPaused(!isPaused)}
                className="text-neutral-600 hover:text-white transition-colors p-2"
                aria-label={isPaused ? "Resume" : "Pause"}
            >
               {isPaused ? <Play size={20} /> : <Pause size={20} />}
            </button>
        </div>
      </div>

      {/* Paused Overlay */}
      {isPaused && (
        <div className="absolute inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-50 animate-in fade-in">
            <div className="w-full max-w-[240px] space-y-4 text-center">
                <h2 className="text-xl font-bold text-white tracking-[0.3em] mb-8 uppercase">Paused</h2>
                <Button fullWidth variant="primary" onClick={() => setIsPaused(false)}>Resume</Button>
                <Button fullWidth variant="secondary" onClick={handleRestart}>Restart</Button>
                <Button fullWidth variant="ghost" onClick={onBackToMenu}>Abort</Button>
            </div>
        </div>
      )}
    </div>
  );
};