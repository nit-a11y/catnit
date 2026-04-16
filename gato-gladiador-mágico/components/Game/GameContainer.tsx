'use client';

import React, { useEffect, useRef, useState } from 'react';
import { GameEngine } from '@/lib/game/engine';
import Overlay from './Overlay';

interface GameContainerProps {
  onStatsUpdate?: (stats: any) => void;
}

const GameContainer: React.FC<GameContainerProps> = ({ onStatsUpdate }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<GameEngine | null>(null);
  const [gameState, setGameState] = useState<'menu' | 'playing' | 'upgrade' | 'gameover'>('menu');
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [availableUpgrades, setAvailableUpgrades] = useState<any[]>([]);

  useEffect(() => {
    if (!canvasRef.current) return;

    const engine = new GameEngine(canvasRef.current, {
      onStateChange: (state) => setGameState(state),
      onScoreChange: (s) => setScore(s),
      onLevelChange: (l) => setLevel(l),
      onStatsUpdate: (stats) => onStatsUpdate?.(stats),
      onUpgradeRequired: (upgrades) => {
        setAvailableUpgrades(upgrades);
        setGameState('upgrade');
      }
    });

    engineRef.current = engine;

    return () => {
      engine.destroy();
    };
  }, [onStatsUpdate]);

  const startGame = () => {
    if (engineRef.current) {
      engineRef.current.start();
      setGameState('playing');
    }
  };

  const selectUpgrade = (upgrade: any) => {
    if (engineRef.current) {
      engineRef.current.applyUpgrade(upgrade);
      setGameState('playing');
    }
  };

  const restartGame = () => {
    if (engineRef.current) {
      engineRef.current.reset();
      engineRef.current.start();
      setGameState('playing');
    }
  };

  return (
    <div className="relative w-full h-full flex items-center justify-center bg-transparent">
      <canvas
        ref={canvasRef}
        className="w-full h-full cursor-crosshair"
        width={800}
        height={450}
      />
      
      <Overlay 
        state={gameState} 
        score={score} 
        level={level}
        upgrades={availableUpgrades}
        onStart={startGame}
        onRestart={restartGame}
        onSelectUpgrade={selectUpgrade}
      />
    </div>
  );
};

export default GameContainer;
