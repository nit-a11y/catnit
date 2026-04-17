'use client';

import React, { useEffect, useRef, useState, useImperativeHandle, forwardRef } from 'react';
import { GameEngine } from '@/lib/game/engine';
import Overlay from './Overlay';

interface GameContainerProps {
  onStatsUpdate?: (stats: any) => void;
  isInstallable?: boolean;
  onInstall?: () => void;
}

export interface GameContainerHandle {
  executeAction: (action: string) => void;
  togglePause: () => void;
  setJoystickMove: (x: number, y: number) => void;
}

const GameContainer = forwardRef<GameContainerHandle, GameContainerProps>(({ onStatsUpdate, isInstallable, onInstall }, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<GameEngine | null>(null);
  const [gameState, setGameState] = useState<'menu' | 'playing' | 'upgrade' | 'gameover' | 'paused'>('menu');
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [availableUpgrades, setAvailableUpgrades] = useState<any[]>([]);

  useImperativeHandle(ref, () => ({
    executeAction: (action: string) => {
      engineRef.current?.executeAction(action);
    },
    togglePause: () => {
      engineRef.current?.togglePause();
    },
    setJoystickMove: (x: number, y: number) => {
      engineRef.current?.setJoystickMove(x, y);
    }
  }));

  useEffect(() => {
    if (!canvasRef.current) return;

    const engine = new GameEngine(canvasRef.current, {
      onStateChange: (state) => setGameState(state as any),
      onScoreChange: (s) => setScore(s),
      onLevelChange: (l) => setLevel(l),
      onStatsUpdate: (stats) => onStatsUpdate?.(stats),
      onUpgradeRequired: (upgrades) => {
        setAvailableUpgrades(upgrades);
        setGameState('upgrade');
      }
    });

    engineRef.current = engine;
    return () => engine.destroy();
  }, [onStatsUpdate]);

  const startGame = (characterType: string, petType: string, powerType: string) => {
    if (engineRef.current) {
      engineRef.current.setCharacter(characterType);
      engineRef.current.setPet(petType);
      engineRef.current.setPower(powerType);
      engineRef.current.start();
      setGameState('playing');
    }
  };

  const resumeGame = () => {
    if (gameState === 'paused') {
      engineRef.current?.togglePause();
    }
  };

  const switchCharacter = (type: string) => {
    engineRef.current?.setCharacter(type);
    resumeGame();
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
        state={gameState as any} 
        score={score} 
        level={level}
        upgrades={availableUpgrades}
        isInstallable={isInstallable}
        onInstall={onInstall}
        onStart={startGame}
        onRestart={restartGame}
        onSelectUpgrade={selectUpgrade}
        onResume={resumeGame}
        onSwitchCharacter={switchCharacter}
      />
    </div>
  );
});

GameContainer.displayName = 'GameContainer';

export default GameContainer;
