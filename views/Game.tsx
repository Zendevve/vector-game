
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Tile } from '../components/Tile';
import { Button } from '../components/Button';
import { TileType, GameMode } from '../types';
import { soundManager } from '../utils/sound';
import { Pause, Play, RotateCcw } from 'lucide-react';

interface GameProps {
  mode: GameMode;
  onEndGame: (score: number, reason?: {title: string, desc: string}) => void;
  onBackToMenu: () => void;
  highScore: number;
}

// Configuration Constants
const TIME_DECREMENT_INTERVAL = 10;

// Adaptive Difficulty Logic
const calculateDifficulty = (level: number) => {
  let gridSize = 3;
  
  // Grid Size scaling
  if (level >= 25) gridSize = 5;
  else if (level >= 10) gridSize = 4;

  // Time Limit Scaling (ms)
  let timeLimit = 5000;
  if (gridSize === 3) {
      // Levels 1-9: 5.0s -> 4.2s
      timeLimit = Math.max(2000, 5000 - ((level - 1) * 100));
  } else if (gridSize === 4) {
      // Levels 10-24: Reset to 5.5s -> 4.1s (Compensate for larger grid)
      timeLimit = Math.max(2000, 5500 - ((level - 10) * 100));
  } else {
      // Levels 25+: Reset to 5.0s -> 2.0s (High speed)
      timeLimit = Math.max(1500, 5000 - ((level - 25) * 120));
  }

  // Wall Density Scaling
  let wallCountMin = 0;
  let wallCountMax = 0;

  if (gridSize === 3) {
      wallCountMin = level > 5 ? 1 : 0;
      wallCountMax = level > 5 ? 2 : 1;
  } else if (gridSize === 4) {
      // Gradual increase
      const tierLevel = level - 10;
      wallCountMin = 2 + Math.floor(tierLevel / 5); 
      wallCountMax = 4 + Math.floor(tierLevel / 5);
  } else {
      // High density
      const tierLevel = level - 25;
      wallCountMin = 5 + Math.floor(tierLevel / 4);
      wallCountMax = 8 + Math.floor(tierLevel / 4);
  }
  
  // Safety cap
  const maxWalls = (gridSize * gridSize) - 5; // Leave space for player, target, and path
  wallCountMax = Math.min(wallCountMax, maxWalls);
  wallCountMin = Math.min(wallCountMin, wallCountMax);

  return { gridSize, timeLimit, wallCountMin, wallCountMax };
};

export const Game: React.FC<GameProps> = ({ mode, onEndGame, onBackToMenu, highScore }) => {
  // Game State
  const [score, setScore] = useState<number>(1); 
  const scoreRef = useRef<number>(1); // Ref to keep track of score inside closures
  
  const [gridSize, setGridSize] = useState<number>(3);
  const [timeLeft, setTimeLeft] = useState<number>(5000);
  const [maxTime, setMaxTime] = useState<number>(5000);
  
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  
  // Board State
  const [playerIndex, setPlayerIndex] = useState<number>(0);
  const [targetIndex, setTargetIndex] = useState<number>(0);
  const [walls, setWalls] = useState<Set<number>>(new Set());
  const [hitWallIndex, setHitWallIndex] = useState<number | null>(null);

  const timerRef = useRef<number | null>(null);
  const touchStartRef = useRef<{x: number, y: number} | null>(null);
  const hitTimeoutRef = useRef<number | null>(null);

  // Sync Ref with State
  useEffect(() => {
    scoreRef.current = score;
  }, [score]);

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
  const generateLevel = useCallback((currentSize: number, currentPlayerIndex: number, currentLevel: number) => {
    const { wallCountMin, wallCountMax } = calculateDifficulty(currentLevel);
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

        // Pick Walls based on difficulty
        const count = Math.floor(Math.random() * (wallCountMax - wallCountMin + 1)) + wallCountMin;

        for (let i = 0; i < count; i++) {
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

  // Start Game / Restart Logic
  const initializeGame = useCallback(() => {
    soundManager.playStart();
    const startLevel = 1;
    const startParams = calculateDifficulty(startLevel);
    
    setScore(startLevel);
    scoreRef.current = startLevel; 

    setGridSize(startParams.gridSize);
    setTimeLeft(startParams.timeLimit);
    setMaxTime(startParams.timeLimit);
    
    const startPlayer = 0;
    setPlayerIndex(startPlayer);
    generateLevel(startParams.gridSize, startPlayer, startLevel);
    setHitWallIndex(null);
    
    setIsPlaying(true);
    setIsPaused(false);
  }, [generateLevel]);

  // Initial Load
  useEffect(() => {
    initializeGame();
    return () => stopTimer();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Timer
  const startTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = window.setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 0) {
          handleGameOver({ title: 'TERMINATED', desc: 'TIME LIMIT EXCEEDED' });
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

  const handleGameOver = (reason?: { title: string, desc: string }) => {
    stopTimer();
    setIsPlaying(false);
    soundManager.playGameOver();
    
    const finalScore = scoreRef.current;
    
    // Small delay for visual feedback (if any) before screen switch
    setTimeout(() => {
        onEndGame(finalScore, reason);
    }, 100);
  };

  // Movement & Progression
  const movePlayer = useCallback((dx: number, dy: number) => {
    if (!isPlaying || isPaused) return;

    const row = Math.floor(playerIndex / gridSize);
    const col = playerIndex % gridSize;
    const newRow = row + dy;
    const newCol = col + dx;

    // CHECK BOUNDS
    if (newRow < 0 || newRow >= gridSize || newCol < 0 || newCol >= gridSize) {
        // LAVA MODE: Moving out of bounds is fatal (Void Fall)
        if (mode === GameMode.LAVA) {
            handleGameOver({ title: 'SIGNAL LOST', desc: 'UNIT FELL INTO VOID' });
        }
        return; // Classic mode just blocks
    }

    const newIndex = newRow * gridSize + newCol;
    
    // CHECK WALLS
    if (walls.has(newIndex)) {
        setHitWallIndex(newIndex);
        soundManager.playError();
        
        // LAVA MODE: Touching a wall is fatal (Firewall)
        if (mode === GameMode.LAVA) {
            handleGameOver({ title: 'CRITICAL FAILURE', desc: 'INCINERATED BY FIREWALL' });
            return;
        }

        // Classic Mode: Penalize or Block
        if (hitTimeoutRef.current) clearTimeout(hitTimeoutRef.current);
        hitTimeoutRef.current = window.setTimeout(() => {
            setHitWallIndex(null);
            hitTimeoutRef.current = null;
        }, 200);
        
        return;
    }

    if (newIndex === targetIndex) {
        soundManager.playTap();
        
        const nextLevel = score + 1;
        setScore(nextLevel);
        
        const diffParams = calculateDifficulty(nextLevel);
        setMaxTime(diffParams.timeLimit);
        setTimeLeft(diffParams.timeLimit);

        // Handle Grid Resizing if difficulty tier increases
        if (diffParams.gridSize !== gridSize) {
            const currentRow = newRow;
            const currentCol = newCol;
            const newPlayerIndex = currentRow * diffParams.gridSize + currentCol;
            
            setGridSize(diffParams.gridSize);
            setPlayerIndex(newPlayerIndex);
            generateLevel(diffParams.gridSize, newPlayerIndex, nextLevel);
        } else {
            setPlayerIndex(newIndex);
            generateLevel(gridSize, newIndex, nextLevel);
        }

    } else {
        soundManager.playMove();
        setPlayerIndex(newIndex);
    }
  }, [gridSize, isPlaying, isPaused, targetIndex, walls, generateLevel, playerIndex, score, mode]);

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
            case 'r': case 'R': initializeGame(); break;
        }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [movePlayer, isPlaying, isPaused, initializeGame]);

  // Swipe Handling
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartRef.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY
    };
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartRef.current) return;

    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;
    
    const diffX = touchEndX - touchStartRef.current.x;
    const diffY = touchEndY - touchStartRef.current.y;
    
    const absX = Math.abs(diffX);
    const absY = Math.abs(diffY);
    
    if (Math.max(absX, absY) > 30) {
        if (absX > absY) {
            movePlayer(diffX > 0 ? 1 : -1, 0);
        } else {
            movePlayer(0, diffY > 0 ? 1 : -1);
        }
    }
    
    touchStartRef.current = null;
  };

  const getGridCols = () => {
    if (gridSize === 3) return 'grid-cols-3';
    if (gridSize === 4) return 'grid-cols-4';
    if (gridSize === 5) return 'grid-cols-5';
    return 'grid-cols-3';
  };

  return (
    <div 
        className="flex flex-col h-screen w-full max-w-md mx-auto bg-[#050505] relative overflow-hidden font-sans"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
    >
      
      {/* Minimalist HUD */}
      <div className="flex justify-between items-end p-8 pb-2">
        <div className="flex flex-col">
          <div className="flex items-baseline gap-2 mb-1">
            <span className="text-neutral-600 text-[10px] font-bold tracking-[0.2em]">GRID</span>
            <span className="text-neutral-700 text-[10px] font-bold tracking-wider">
                BEST {Math.max(score, highScore).toString().padStart(2, '0')}
            </span>
          </div>
          <span className="text-5xl font-black text-white tracking-tighter leading-none font-mono">
            {score.toString().padStart(2, '0')}
          </span>
        </div>

        <div className="flex flex-col items-end">
           <span className={`text-[10px] font-bold tracking-[0.2em] mb-1 ${mode === GameMode.LAVA ? 'text-red-600' : 'text-neutral-600'}`}>
             {mode === GameMode.LAVA ? 'LAVA MODE' : 'TIMER'}
           </span>
           <span className={`text-3xl font-bold tracking-tight font-mono ${timeLeft < 1000 ? 'text-red-500' : 'text-white'}`}>
            {(timeLeft / 1000).toFixed(2)}s
          </span>
        </div>
      </div>

      {/* Progress Line */}
      <div className="w-full px-8 mb-8">
        <div className="h-[2px] w-full bg-neutral-900">
            <div 
                className={`h-full transition-all duration-75 ease-linear ${mode === GameMode.LAVA ? 'bg-red-500' : 'bg-white'}`}
                style={{ width: `${(timeLeft / maxTime) * 100}%` }}
            />
        </div>
      </div>

      {/* Game Board */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 relative z-10">
        <div className={`grid ${getGridCols()} gap-2 w-full aspect-square max-w-[380px] transition-all duration-500`}>
          {Array.from({ length: gridSize * gridSize }).map((_, index) => {
            let type = TileType.EMPTY;
            if (index === playerIndex) type = TileType.PLAYER;
            else if (index === targetIndex) type = TileType.TARGET;
            else if (walls.has(index)) type = TileType.WALL;
            
            const isHit = index === hitWallIndex;

            return <Tile key={index} type={type} isHit={isHit} />;
          })}
        </div>
      </div>

      {/* Minimal Bottom Controls */}
      <div className="p-8 pb-10 flex flex-col items-center gap-6 mt-auto">
        <div className="flex gap-8 items-center">
            <button 
                onClick={initializeGame}
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
                <Button fullWidth variant="secondary" onClick={initializeGame}>Restart</Button>
                <Button fullWidth variant="ghost" onClick={onBackToMenu}>Abort</Button>
            </div>
        </div>
      )}
    </div>
  );
};
