
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GameState, MissionData } from './types';
import GameView from './components/GameView';
import Lobby from './components/Lobby';
import { getMissionBriefing } from './services/geminiService';

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(GameState.LOADING);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [mission, setMission] = useState<MissionData | null>(null);
  const [level, setLevel] = useState(1);
  const [error, setError] = useState<string | null>(null);

  const initGame = useCallback(async () => {
    setGameState(GameState.LOADING);
    try {
      const briefing = await getMissionBriefing(level);
      setMission(briefing);
      setGameState(GameState.LOBBY);
    } catch (err) {
      setError("System initialization failed. Check your connection.");
      setGameState(GameState.LOBBY);
    }
  }, [level]);

  useEffect(() => {
    initGame();
  }, [initGame]);

  const startCalibration = () => {
    setScore(0);
    setGameState(GameState.CALIBRATING);
  };

  const startGame = () => {
    setGameState(GameState.PLAYING);
  };

  const handleGameOver = (finalScore: number) => {
    if (finalScore > highScore) setHighScore(finalScore);
    setScore(finalScore);
    setGameState(GameState.GAMEOVER);
  };

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden select-none">
      {gameState === GameState.LOADING && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black z-50">
          <div className="w-16 h-16 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-cyan-400 font-mono tracking-widest uppercase">Initializing Neural Link...</p>
        </div>
      )}

      {gameState === GameState.LOBBY && mission && (
        <Lobby 
          mission={mission} 
          highScore={highScore} 
          onStart={startCalibration} 
          error={error}
        />
      )}

      {(gameState === GameState.CALIBRATING || gameState === GameState.PLAYING || gameState === GameState.GAMEOVER) && (
        <GameView 
          onGameOver={handleGameOver} 
          gameState={gameState}
          onCalibrated={startGame}
          onRestart={startCalibration}
          onExit={() => setGameState(GameState.LOBBY)}
          currentLevel={level}
        />
      )}
    </div>
  );
};

export default App;
