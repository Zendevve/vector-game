import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Tile } from '../components/Tile';
import { Button } from '../components/Button';
import { TileType, GameMode } from '../types';
import { Pause, Play, RotateCcw, ChevronUp, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { haptics } from '../utils/haptics';

interface GameProps {
  mode: GameMode;
  onEndGame: (level: number, reason?: {title: string, desc: string}) => void;
  onBackToMenu: () => void;
  highScore: number;
}

const TIME_DECREMENT_INTERVAL = 10;

interface Particle {
  id: number;
  x: number; 
  y: number; 
  vx: number;
  vy: number;
  life: number; 
  color: string;
  size: number;
  decay: number;
}

const calculateDifficulty = (level: number) => {
  let gridSize = 3;
  let wallCountMin = 0;
  let wallCountMax = 0;
  let timeLimit = 5000;
  let complexity = 0;

  if (level <= 5) {
      gridSize = 3;
      wallCountMin = level <= 2 ? 0 : 1;
      wallCountMax = level <= 2 ? 0 : 2;
      timeLimit = Math.max(3800, 5000 - (level * 240)); 
      complexity = 0;
  } 
  else if (level <= 15) {
      gridSize = 4;
      wallCountMin = 2;
      wallCountMax = 4;
      timeLimit = Math.max(3200, 5000 - ((level - 5) * 180));
      complexity = 0.2;
  }
  else if (level <= 30) {
      gridSize = 4;
      wallCountMin = 4;
      wallCountMax = 8;
      timeLimit = Math.max(2000, 3200 - ((level - 15) * 80));
      complexity = 0.5;
  }
  else if (level <= 50) {
      gridSize = 5;
      wallCountMin = 6;
      wallCountMax = 10;
      timeLimit = Math.max(2500, 4500 - ((level - 30) * 100));
      complexity = 0.7;
  }
  else {
      gridSize = 5;
      wallCountMin = 10;
      wallCountMax = 15;
      timeLimit = Math.max(1200, 2500 - ((level - 50) * 50));
      complexity = 0.9;
  }
  
  const area = gridSize * gridSize;
  const safeLimit = area - 6; 
  
  wallCountMax = Math.min(wallCountMax, safeLimit);
  wallCountMin = Math.min(wallCountMin, wallCountMax);

  return { gridSize, timeLimit, wallCountMin, wallCountMax, complexity };
};

export const Game: React.FC<GameProps> = ({ mode, onEndGame, onBackToMenu, highScore }) => {
  const [level, setLevel] = useState<number>(1);
  const levelRef = useRef<number>(1);

  const [gridSize, setGridSize] = useState<number>(3);
  const [timeLeft, setTimeLeft] = useState<number>(5000);
  const [maxTime, setMaxTime] = useState<number>(5000);
  
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  
  // Pause Menu Navigation: 0=Resume, 1=Retry, 2=Abort
  const [pauseIndex, setPauseIndex] = useState<number>(0);
  
  const [playerIndex, setPlayerIndex] = useState<number>(0);
  const [targetIndex, setTargetIndex] = useState<number>(0);
  const [walls, setWalls] = useState<Set<number>>(new Set());
  const [visitedIndices, setVisitedIndices] = useState<Set<number>>(new Set());
  const [hitWallIndex, setHitWallIndex] = useState<number | null>(null);

  const [particles, setParticles] = useState<Particle[]>([]);
  const [swipeFeedback, setSwipeFeedback] = useState<{ direction: 'UP' | 'DOWN' | 'LEFT' | 'RIGHT', id: number } | null>(null);

  const timerRef = useRef<number | null>(null);
  const touchStartRef = useRef<{x: number, y: number} | null>(null);
  const hitTimeoutRef = useRef<number | null>(null);
  const isProcessingMove = useRef<boolean>(false);
  const inputBuffer = useRef<{dx: number, dy: number}[]>([]);
  const movePlayerRef = useRef<((dx: number, dy: number) => void) | null>(null);
  const moveTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    levelRef.current = level;
  }, [level]);

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

  const generateRandomPath = (size: number, start: number, end: number): Set<number> => {
      const stack = [start];
      const pathMap = new Map<number, number>(); 
      const visited = new Set([start]);
      
      while (stack.length > 0) {
          const current = stack.pop()!;
          if (current === end) {
              const path = new Set<number>();
              let temp = end;
              while (temp !== start) {
                  path.add(temp);
                  temp = pathMap.get(temp)!;
              }
              path.add(start);
              return path;
          }

          const row = Math.floor(current / size);
          const col = current % size;
          const directions = [[0, 1], [0, -1], [1, 0], [-1, 0]];
          
          for (let i = directions.length - 1; i > 0; i--) {
              const j = Math.floor(Math.random() * (i + 1));
              [directions[i], directions[j]] = [directions[j], directions[i]];
          }

          for (const [dy, dx] of directions) {
              const newRow = row + dy;
              const newCol = col + dx;
              if (newRow >= 0 && newRow < size && newCol >= 0 && newCol < size) {
                  const nextIndex = newRow * size + newCol;
                  if (!visited.has(nextIndex)) {
                      visited.add(nextIndex);
                      pathMap.set(nextIndex, current);
                      stack.push(nextIndex);
                  }
              }
          }
      }
      return new Set();
  };

  const generateLevel = useCallback((currentSize: number, currentPlayerIndex: number, currentLevel: number) => {
    const { wallCountMin, wallCountMax, complexity } = calculateDifficulty(currentLevel);
    const totalTiles = currentSize * currentSize;
    
    setVisitedIndices(new Set());

    let newTargetIndex: number;
    let newWalls: Set<number>;
    let attempts = 0;
    const MAX_ATTEMPTS = 50;

    const pRow = Math.floor(currentPlayerIndex / currentSize);
    const pCol = currentPlayerIndex % currentSize;

    do {
        newWalls = new Set();
        const possibleTargets: number[] = [];
        for (let i = 0; i < totalTiles; i++) {
            if (i === currentPlayerIndex) continue;
            const tRow = Math.floor(i / currentSize);
            const tCol = i % currentSize;
            const dist = Math.abs(tRow - pRow) + Math.abs(tCol - pCol);
            if (dist > 1) possibleTargets.push(i);
        }

        if (possibleTargets.length === 0) {
            for (let i = 0; i < totalTiles; i++) {
                 if (i !== currentPlayerIndex) possibleTargets.push(i);
            }
        }

        newTargetIndex = possibleTargets[Math.floor(Math.random() * possibleTargets.length)];
        const useCorridorStrategy = Math.random() < complexity;

        if (useCorridorStrategy) {
            const guaranteedPath = generateRandomPath(currentSize, currentPlayerIndex, newTargetIndex);
            const allOtherTiles: number[] = [];
            for (let i = 0; i < totalTiles; i++) {
                if (!guaranteedPath.has(i)) allOtherTiles.push(i);
            }
            const fillFactor = 0.4 + (Math.random() * 0.3); 
            for (const tileIndex of allOtherTiles) {
                if (Math.random() < fillFactor) newWalls.add(tileIndex);
            }
        } else {
            const possibleWalls: number[] = [];
            for (let i = 0; i < totalTiles; i++) {
                if (i !== currentPlayerIndex && i !== newTargetIndex) possibleWalls.push(i);
            }
            for (let i = possibleWalls.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [possibleWalls[i], possibleWalls[j]] = [possibleWalls[j], possibleWalls[i]];
            }
            const count = Math.floor(Math.random() * (wallCountMax - wallCountMin + 1)) + wallCountMin;
            for (let i = 0; i < count; i++) {
                if (possibleWalls.length > 0) newWalls.add(possibleWalls.pop()!);
            }
        }
        attempts++;
    } while (!isSolvable(currentSize, currentPlayerIndex, newTargetIndex, newWalls) && attempts < MAX_ATTEMPTS);

    if (attempts >= MAX_ATTEMPTS) newWalls.clear();

    setTargetIndex(newTargetIndex);
    setWalls(newWalls);
  }, []);

  const spawnParticles = (index: number, type: 'SUCCESS' | 'COLLISION') => {
    const row = Math.floor(index / gridSize);
    const col = index % gridSize;
    const tilePercent = 100 / gridSize;
    const startX = (col * tilePercent) + (tilePercent / 2);
    const startY = (row * tilePercent) + (tilePercent / 2);

    let count = 8;
    if (type === 'SUCCESS') count = 12;

    const newParticles: Particle[] = [];
    for (let i = 0; i < count; i++) {
        const angle = (Math.PI * 2 * i) / count;
        let speed = Math.random() * 0.5 + 0.2; 
        let decay = 0.04;
        let size = Math.random() * 4 + 2;
        let color = '#ffffff';

        if (type === 'SUCCESS') {
            color = Math.random() > 0.5 ? '#06b6d4' : '#ffffff';
        } else if (type === 'COLLISION') {
            if (mode === GameMode.FRAGILE) {
                 color = Math.random() > 0.5 ? '#818cf8' : '#312e81'; 
            } else {
                 color = Math.random() > 0.5 ? '#dc2626' : '#262626';
            }
        }
        
        newParticles.push({
            id: Math.random(),
            x: startX,
            y: startY,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            life: 1.0,
            color,
            size,
            decay
        });
    }
    setParticles(prev => [...prev, ...newParticles]);
  };

  useEffect(() => {
    if (particles.length === 0) return;
    let animationFrameId: number;
    const updateParticles = () => {
        setParticles(prevParticles => {
            const updated = prevParticles.map(p => ({
                ...p,
                x: p.x + p.vx,
                y: p.y + p.vy,
                life: p.life - p.decay,
            })).filter(p => p.life > 0);
            return updated;
        });
        animationFrameId = requestAnimationFrame(updateParticles);
    };
    animationFrameId = requestAnimationFrame(updateParticles);
    return () => cancelAnimationFrame(animationFrameId);
  }, [particles.length]); 
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = canvas.width = window.innerWidth;
    let height = canvas.height = window.innerHeight;
    const bgParticles: {x: number, y: number, speed: number, size: number, alpha: number}[] = [];
    const particleCount = 60;

    for (let i = 0; i < particleCount; i++) {
        bgParticles.push({
            x: Math.random() * width,
            y: Math.random() * height,
            speed: Math.random() * 0.15 + 0.05,
            size: Math.random() * 2 + 1,
            alpha: Math.random() * 0.08 + 0.02
        });
    }

    let animationId: number;
    const animate = () => {
        ctx.clearRect(0, 0, width, height);
        ctx.fillStyle = '#fff';
        bgParticles.forEach(p => {
            p.y -= p.speed;
            if (p.y < 0) p.y = height;
            ctx.globalAlpha = p.alpha;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
        });
        animationId = requestAnimationFrame(animate);
    };
    animate();
    const handleResize = () => {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);
    return () => {
        cancelAnimationFrame(animationId);
        window.removeEventListener('resize', handleResize);
    };
  }, []);

  const initializeGame = useCallback(() => {
    const startLevel = 1;
    const startParams = calculateDifficulty(startLevel);
    
    setLevel(startLevel);
    levelRef.current = startLevel;
    
    setGridSize(startParams.gridSize);
    setTimeLeft(startParams.timeLimit);
    setMaxTime(startParams.timeLimit);
    
    const startPlayer = 0;
    setPlayerIndex(startPlayer);
    generateLevel(startParams.gridSize, startPlayer, startLevel);
    setHitWallIndex(null);
    setParticles([]);
    setSwipeFeedback(null);
    
    isProcessingMove.current = false;
    inputBuffer.current = [];
    if (moveTimeoutRef.current) {
        clearTimeout(moveTimeoutRef.current);
        moveTimeoutRef.current = null;
    }
    
    setIsPlaying(true);
    setIsPaused(false);
    setPauseIndex(0); // Reset pause cursor
  }, [generateLevel]);

  useEffect(() => {
    initializeGame();
    return () => stopTimer();
  }, []);

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
  }, [isPlaying, isPaused]);

  const handleGameOver = (reason?: { title: string, desc: string }) => {
    stopTimer();
    setIsPlaying(false);
    onEndGame(levelRef.current, reason);
  };

  const movePlayer = useCallback((dx: number, dy: number) => {
    if (!isPlaying || isPaused) return;
    
    if (isProcessingMove.current) {
        if (inputBuffer.current.length < 2) {
            inputBuffer.current.push({dx, dy});
        }
        return;
    }
    
    isProcessingMove.current = true;
    moveTimeoutRef.current = window.setTimeout(() => {
        isProcessingMove.current = false;
        if (inputBuffer.current.length > 0) {
            const nextMove = inputBuffer.current.shift();
            if (nextMove && movePlayerRef.current) {
                movePlayerRef.current(nextMove.dx, nextMove.dy);
            }
        }
    }, 100);

    const row = Math.floor(playerIndex / gridSize);
    const col = playerIndex % gridSize;
    const newRow = row + dy;
    const newCol = col + dx;

    if (newRow < 0 || newRow >= gridSize || newCol < 0 || newCol >= gridSize) {
        
        if (mode === GameMode.LAVA) {
            haptics.failure();
            handleGameOver({ title: 'SIGNAL LOST', desc: 'UNIT FELL INTO VOID' });
        } else {
            haptics.thud();
            if (mode === GameMode.FRAGILE) {
                 // Stun penalty in Fragile Mode
                 isProcessingMove.current = true; 
                 setTimeout(() => { isProcessingMove.current = false; }, 400);
            } else {
                 // Time penalty in Classic
                 setTimeLeft(prev => Math.max(0, prev - 500));
            }
        }
        return; 
    }

    const newIndex = newRow * gridSize + newCol;
    
    if (walls.has(newIndex)) {
        setHitWallIndex(newIndex);
        spawnParticles(newIndex, 'COLLISION');
        haptics.thud();
        
        if (mode === GameMode.LAVA) {
            haptics.failure();
            handleGameOver({ title: 'CRITICAL FAILURE', desc: 'INCINERATED BY FIREWALL' });
            return;
        }
        
        if (mode === GameMode.FRAGILE) {
             // Stun penalty
             isProcessingMove.current = true;
             setTimeout(() => { isProcessingMove.current = false; }, 400);
        } else {
             setTimeLeft(prev => Math.max(0, prev - 500));
        }

        if (hitTimeoutRef.current) clearTimeout(hitTimeoutRef.current);
        hitTimeoutRef.current = window.setTimeout(() => {
            setHitWallIndex(null);
            hitTimeoutRef.current = null;
        }, 200);
        return;
    }

    if (mode === GameMode.FRAGILE && visitedIndices.has(newIndex)) {
         setHitWallIndex(newIndex);
         spawnParticles(newIndex, 'COLLISION');
         haptics.failure();
         handleGameOver({ title: 'STRUCTURAL COLLAPSE', desc: 'ATTEMPTED TO CROSS DECAYED PATH' });
         return;
    }

    if (newIndex === targetIndex) {
        spawnParticles(newIndex, 'SUCCESS');
        haptics.success();
        
        const nextLevel = level + 1;
        setLevel(nextLevel);
        
        const diffParams = calculateDifficulty(nextLevel);
        setMaxTime(diffParams.timeLimit);
        setTimeLeft(diffParams.timeLimit);

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
        haptics.tick();
        if (mode === GameMode.FRAGILE) {
            setVisitedIndices(prev => new Set(prev).add(playerIndex));
        }
        setPlayerIndex(newIndex);
    }
  }, [gridSize, isPlaying, isPaused, targetIndex, walls, generateLevel, playerIndex, mode, visitedIndices, level]);

  useEffect(() => {
      movePlayerRef.current = movePlayer;
  }, [movePlayer]);

  // Keyboard & Pause Logic
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        if (e.repeat) return; // Block key hold repeats

        // Global Pause Toggle
        if (e.key === 'Escape' || e.key === 'p' || e.key === 'P') {
            e.preventDefault();
            setIsPaused(prev => {
                if (!prev) setPauseIndex(0); // Reset selection when pausing
                return !prev;
            });
            haptics.playClick();
            return;
        }

        if (isPaused) {
             // Pause Menu Navigation
             // Vertical Navigation (Resume <-> Retry/Abort)
             if (['ArrowUp', 'w', 'W', 'ArrowDown', 's', 'S'].includes(e.key)) {
                 e.preventDefault();
                 setPauseIndex(prev => (prev === 0 ? 1 : 0));
                 haptics.tick();
             } 
             // Horizontal Navigation (Retry <-> Abort)
             else if (['ArrowLeft', 'a', 'A', 'ArrowRight', 'd', 'D'].includes(e.key)) {
                 e.preventDefault();
                 if (pauseIndex === 1 || pauseIndex === 2) {
                     setPauseIndex(prev => (prev === 1 ? 2 : 1));
                     haptics.tick();
                 }
             } 
             // Selection
             else if (e.key === 'Enter' || e.key === ' ') {
                 e.preventDefault();
                 haptics.playClick();
                 if (pauseIndex === 0) setIsPaused(false);
                 else if (pauseIndex === 1) initializeGame();
                 else if (pauseIndex === 2) onBackToMenu();
             }
             return;
        }

        if (!isPlaying) return;

        // Game Movement
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
  }, [movePlayer, isPlaying, isPaused, initializeGame, pauseIndex, onBackToMenu]);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartRef.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY
    };
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    // Empty as we handle swipe on end
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartRef.current || !isPlaying || isPaused) return;

    const currentX = e.changedTouches[0].clientX;
    const currentY = e.changedTouches[0].clientY;
    
    const diffX = currentX - touchStartRef.current.x;
    const diffY = currentY - touchStartRef.current.y;
    
    const absX = Math.abs(diffX);
    const absY = Math.abs(diffY);
    
    const SWIPE_THRESHOLD = 30;

    if (Math.max(absX, absY) > SWIPE_THRESHOLD) {
        if (absX > absY) {
            const dir = diffX > 0 ? 1 : -1;
            movePlayer(dir, 0);
            setSwipeFeedback({ direction: diffX > 0 ? 'RIGHT' : 'LEFT', id: Date.now() });
        } else {
            const dir = diffY > 0 ? 1 : -1;
            movePlayer(0, dir);
            setSwipeFeedback({ direction: diffY > 0 ? 'DOWN' : 'UP', id: Date.now() });
        }
    }
    
    touchStartRef.current = null;
  };

  const playerRow = Math.floor(playerIndex / gridSize);
  const playerCol = playerIndex % gridSize;
  const playerOverlayClass = "absolute transition-all duration-100 ease-out p-1 z-30";

  return (
    <div 
        className="flex flex-col h-screen w-full max-w-md mx-auto bg-[#050505] relative overflow-hidden font-sans touch-none"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
    >
      <canvas ref={canvasRef} className="absolute inset-0 z-0 pointer-events-none opacity-50" />
      <style>{`
         @keyframes swipe-fade {
           0% { opacity: 0; transform: scale(0.8); }
           20% { opacity: 1; transform: scale(1.2); }
           100% { opacity: 0; transform: scale(1.5); }
         }
         @keyframes tile-enter {
           0% { opacity: 0; transform: scale(0.9); }
           100% { opacity: 1; transform: scale(1); }
         }
      `}</style>

      <div className="flex justify-between items-end p-8 pb-2 w-full z-20">
        <div className="flex flex-col">
          <div className="flex items-baseline gap-2 mb-1">
            <span className="text-neutral-600 text-[10px] font-bold tracking-[0.2em]">GRID</span>
            <span className="text-neutral-700 text-[10px] font-bold tracking-wider">
                BEST {Math.max(level, highScore).toString().padStart(2, '0')}
            </span>
          </div>
          <span className="text-5xl font-black text-white tracking-tighter leading-none font-mono">
            {level.toString().padStart(2, '0')}
          </span>
        </div>

        <div className="flex flex-col items-end">
           <span className={`text-[10px] font-bold tracking-[0.2em] mb-1 ${mode === GameMode.LAVA ? 'text-red-600' : mode === GameMode.FRAGILE ? 'text-indigo-400' : 'text-neutral-600'}`}>
             {mode === GameMode.LAVA ? 'LAVA MODE' : mode === GameMode.FRAGILE ? 'FRAGILE MODE' : 'TIMER'}
           </span>
           <span className={`text-3xl font-bold tracking-tight font-mono ${timeLeft < 1000 ? 'text-red-500' : 'text-white'}`}>
            {(timeLeft / 1000).toFixed(2)}s
          </span>
        </div>
      </div>

      <div className="w-full px-8 mb-8 z-20">
        <div className="h-[2px] w-full bg-neutral-900">
            <div 
                className={`h-full ${mode === GameMode.LAVA ? 'bg-red-500' : mode === GameMode.FRAGILE ? 'bg-indigo-500' : 'bg-white'}`}
                style={{ width: `${Math.max(0, (timeLeft / maxTime) * 100)}%` }}
            />
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6 relative z-10">
        <div 
            className="grid relative transition-all duration-500"
            style={{
              width: 'min(100%, 55vh)',
              aspectRatio: '1/1',
              gridTemplateColumns: `repeat(${gridSize}, minmax(0, 1fr))`,
              gridTemplateRows: `repeat(${gridSize}, minmax(0, 1fr))`
            }}
        >
          {Array.from({ length: gridSize * gridSize }).map((_, index) => {
            let type = TileType.EMPTY;
            if (index === playerIndex) type = TileType.EMPTY; 
            else if (index === targetIndex) type = TileType.TARGET;
            else if (walls.has(index)) type = TileType.WALL;
            
            const isHit = index === hitWallIndex;
            const isVisited = visitedIndices.has(index);
            
            const pRow = Math.floor(playerIndex / gridSize);
            const pCol = playerIndex % gridSize;
            const tRow = Math.floor(index / gridSize);
            const tCol = index % gridSize;
            const isAdjacent = Math.abs(pRow - tRow) + Math.abs(pCol - tCol) === 1;
            
            const isDanger = (mode === GameMode.LAVA && walls.has(index) && isAdjacent);
            const staggerDelay = (tRow + tCol) * 20;

            return (
                <div 
                    key={`${gridSize}-${index}`}
                    className="w-full h-full p-1"
                    style={{ 
                        animation: `tile-enter 0.3s cubic-bezier(0.2, 0, 0.2, 1) ${staggerDelay}ms backwards` 
                    }}
                >
                    <Tile type={type} isHit={isHit} isDanger={isDanger} isVisited={isVisited} mode={mode} />
                </div>
            );
          })}

          <div 
             className={playerOverlayClass}
             style={{
                 width: `${100 / gridSize}%`,
                 height: `${100 / gridSize}%`,
                 left: `${(playerCol / gridSize) * 100}%`,
                 top: `${(playerRow / gridSize) * 100}%`,
             }}
          >
              <Tile type={TileType.PLAYER} />
          </div>

          {particles.map(p => (
            <div
                key={p.id}
                className="absolute pointer-events-none rounded-none z-50"
                style={{
                    left: `${p.x}%`,
                    top: `${p.y}%`,
                    width: `${p.size}px`,
                    height: `${p.size}px`,
                    backgroundColor: p.color,
                    opacity: p.life,
                    transform: 'translate(-50%, -50%)'
                }}
            />
          ))}
        </div>
        
        {swipeFeedback && (
             <div 
                key={swipeFeedback.id}
                className="absolute inset-0 flex items-center justify-center pointer-events-none z-50"
                style={{ animation: 'swipe-fade 0.5s ease-out forwards' }}
             >
                <div className="text-white/20">
                    {swipeFeedback.direction === 'UP' && <ChevronUp size={120} strokeWidth={1} />}
                    {swipeFeedback.direction === 'DOWN' && <ChevronDown size={120} strokeWidth={1} />}
                    {swipeFeedback.direction === 'LEFT' && <ChevronLeft size={120} strokeWidth={1} />}
                    {swipeFeedback.direction === 'RIGHT' && <ChevronRight size={120} strokeWidth={1} />}
                </div>
             </div>
        )}
      </div>

      <div className="p-8 pb-10 flex flex-col items-center gap-6 mt-auto w-full z-20">
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

      {isPaused && (
        <div className="absolute inset-0 bg-[#050505] z-50 flex flex-col items-center justify-center p-8 animate-in fade-in duration-200">
            
            <div className="w-full border-t-2 border-white mb-8"></div>

            <div className="w-full mb-12">
                <div className="flex items-center gap-2 mb-2">
                    <div className="w-1.5 h-1.5 bg-yellow-500 rounded-full animate-pulse"></div>
                    <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-[0.3em]">Status</span>
                </div>
                <h2 className="text-5xl font-black text-white tracking-tighter uppercase mb-2">
                    PAUSED
                </h2>
                <p className="text-neutral-400 font-mono text-xs tracking-wide">AWAITING DIRECTIVE</p>
            </div>

            <div className="grid grid-cols-2 w-full gap-4 mb-12">
                <div className="bg-neutral-900/50 border border-neutral-800 p-5 rounded-lg">
                    <div className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider mb-2">Current Grid</div>
                    <div className="text-3xl font-black text-white font-mono">{level.toString().padStart(2, '0')}</div>
                </div>
                <div className="bg-neutral-900/50 border border-neutral-800 p-5 rounded-lg">
                    <div className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider mb-2">Time Left</div>
                    <div className={`text-3xl font-black font-mono ${timeLeft < 1000 ? 'text-red-500' : 'text-cyan-500'}`}>
                        {(timeLeft / 1000).toFixed(2)}s
                    </div>
                </div>
            </div>

            <div className="w-full flex flex-col gap-4">
                <Button 
                    variant="primary" 
                    size="lg" 
                    fullWidth 
                    isSelected={pauseIndex === 0}
                    onClick={() => setIsPaused(false)}
                >
                    RESUME (ENTER)
                </Button>
                <div className="grid grid-cols-2 gap-4">
                    <Button 
                        variant="secondary" 
                        fullWidth 
                        isSelected={pauseIndex === 1}
                        onClick={initializeGame}
                    >
                        RETRY
                    </Button>
                    <Button 
                        variant="danger" 
                        fullWidth 
                        isSelected={pauseIndex === 2}
                        onClick={onBackToMenu}
                    >
                        ABORT
                    </Button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};