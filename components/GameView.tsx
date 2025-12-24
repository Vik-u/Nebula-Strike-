
import React, { useRef, useEffect, useState, useCallback } from 'react';
import { GameState, Target, Particle, Point } from '../types';

interface GameViewProps {
  onGameOver: (score: number) => void;
  gameState: GameState;
  onCalibrated: () => void;
  onRestart: () => void;
  onExit: () => void;
  currentLevel: number;
}

const MISSION_DURATION = 60;

interface Star {
  x: number;
  y: number;
  z: number;
  size: number;
  opacity: number;
}

// Additional planetary data for visual variety
interface PlanetSurface {
  type: 'rocky' | 'gas' | 'ice';
  features: { x: number, y: number, r: number, color: string }[];
  bands?: { y: number, h: number, color: string }[];
}

const GameView: React.FC<GameViewProps> = ({ onGameOver, gameState, onCalibrated, onRestart, onExit, currentLevel }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameCanvasRef = useRef<HTMLCanvasElement>(null);
  
  const scoreRef = useRef(0);
  const [score, setScore] = useState(0);
  const targetsRef = useRef<(Target & { scale: number, ring?: boolean, surface: PlanetSurface })[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const lastTargetTimeRef = useRef(0);
  
  // Space Background State
  const starsRef = useRef<Star[]>([]);
  const nebulaHueRef = useRef(260); // Start with deep purples
  
  // Timer logic
  const timeLeftRef = useRef(MISSION_DURATION);
  const [displayTime, setDisplayTime] = useState(MISSION_DURATION);
  const lastTimeTickRef = useRef(0);
  
  // Smoothing
  const rawHandPosRef = useRef<Point | null>(null);
  const smoothedHandPosRef = useRef<Point | null>(null);
  const [sensitivity, setSensitivity] = useState(0.7); 
  
  const isPinchingRef = useRef(false);
  const lastShotTimeRef = useRef(0);
  const requestIdRef = useRef<number>();
  
  const calibrationProgressRef = useRef(0);
  const [displayProgress, setDisplayProgress] = useState(0); 
  const [countdown, setCountdown] = useState<number | null>(null);
  const [handStatus, setHandStatus] = useState<'DISCONNECTED' | 'READY'>('DISCONNECTED');
  const isCalibratingRef = useRef(false);
  const dynamicRingRadiusRef = useRef(180);

  // Initialize Stars
  useEffect(() => {
    const stars: Star[] = [];
    for (let i = 0; i < 400; i++) {
      stars.push({
        x: Math.random() * 3000 - 1500,
        y: Math.random() * 3000 - 1500,
        z: Math.random() * 1000,
        size: Math.random() * 1.5 + 0.5,
        opacity: Math.random() * 0.6 + 0.2
      });
    }
    starsRef.current = stars;
  }, []);

  useEffect(() => {
    if (!videoRef.current || !canvasRef.current) return;

    // @ts-ignore
    const hands = new window.Hands({
      locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
    });

    hands.setOptions({
      maxNumHands: 1,
      modelComplexity: 1,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5
    });

    hands.onResults((results: any) => {
      const canvas = gameCanvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();

      if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
        setHandStatus('READY');
        const landmarks = results.multiHandLandmarks[0];
        const indexTip = landmarks[8];
        const thumbTip = landmarks[4];

        rawHandPosRef.current = {
          x: (1 - indexTip.x) * rect.width,
          y: indexTip.y * rect.height
        };

        const dx = indexTip.x - thumbTip.x;
        const dy = indexTip.y - thumbTip.y;
        const dist = Math.sqrt(dx*dx + dy*dy);
        isPinchingRef.current = dist < 0.12;
      } else {
        setHandStatus('DISCONNECTED');
        rawHandPosRef.current = null;
        isPinchingRef.current = false;
      }
    });

    // @ts-ignore
    const camera = new window.Camera(videoRef.current, {
      onFrame: async () => {
        if (videoRef.current) await hands.send({ image: videoRef.current });
      },
      width: 1280,
      height: 720
    });
    camera.start();

    return () => {
      camera.stop();
      hands.close();
    };
  }, []);

  const spawnTarget = useCallback(() => {
    if (gameState !== GameState.PLAYING) return;
    const canvas = gameCanvasRef.current;
    if (!canvas) return;

    const maxSize = 90 + Math.random() * 110;
    const speedScale = 1.0 + (currentLevel * 0.4);
    
    // Generate Surface Details
    const type = Math.random() > 0.6 ? 'gas' : (Math.random() > 0.5 ? 'ice' : 'rocky');
    const baseHue = Math.random() * 360;
    const surface: PlanetSurface = {
      type,
      features: [],
      bands: []
    };

    if (type === 'gas') {
      const bandCount = 5 + Math.floor(Math.random() * 5);
      for (let i = 0; i < bandCount; i++) {
        surface.bands?.push({
          y: (i / bandCount) * 2 - 1,
          h: (1 / bandCount) * (Math.random() + 0.5),
          color: `hsla(${baseHue + (Math.random() - 0.5) * 40}, 50%, ${30 + Math.random() * 40}%, 0.6)`
        });
      }
    } else {
      const featureCount = 8 + Math.floor(Math.random() * 10);
      for (let i = 0; i < featureCount; i++) {
        surface.features.push({
          x: (Math.random() - 0.5) * 1.5,
          y: (Math.random() - 0.5) * 1.5,
          r: 0.1 + Math.random() * 0.4,
          color: `hsla(${baseHue + (Math.random() - 0.5) * 30}, ${type === 'rocky' ? 30 : 60}%, ${type === 'rocky' ? 20 : 80}%, 0.4)`
        });
      }
    }

    targetsRef.current.push({
      id: Math.random().toString(36).substring(7),
      x: Math.random() * canvas.width,
      y: Math.random() * (canvas.height * 0.3),
      vx: (Math.random() - 0.5) * 8 * speedScale,
      vy: (2.5 + Math.random() * 4.5) * speedScale,
      size: maxSize,
      scale: 0.05,
      health: 1,
      type: 'basic',
      points: 250,
      color: `hsl(${baseHue}, 60%, 50%)`,
      ring: Math.random() > 0.75,
      surface
    });
  }, [currentLevel, gameState]);

  const fireLaser = (from: Point) => {
    const now = Date.now();
    if (now - lastShotTimeRef.current < 60) return;
    lastShotTimeRef.current = now;

    targetsRef.current = targetsRef.current.filter(t => {
      const currentSize = t.size * t.scale;
      const tx = t.x;
      const ty = t.y;
      const dist = Math.sqrt(Math.pow(tx - from.x, 2) + Math.pow(ty - from.y, 2));
      
      if (dist < currentSize) {
        scoreRef.current += t.points;
        setScore(scoreRef.current);
        for (let i = 0; i < 30; i++) {
          particlesRef.current.push({
            x: tx, y: ty,
            vx: (Math.random() - 0.5) * 60,
            vy: (Math.random() - 0.5) * 60,
            life: 1.0, color: t.color
          });
        }
        return false;
      }
      return true;
    });
  };

  const startCountdown = useCallback(() => {
    if (isCalibratingRef.current) return;
    isCalibratingRef.current = true;
    setCountdown(3);
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev === 1) {
          clearInterval(timer);
          onCalibrated();
          return null;
        }
        return prev ? prev - 1 : null;
      });
    }, 1000);
  }, [onCalibrated]);

  const gameLoop = useCallback((time: number) => {
    const canvas = gameCanvasRef.current;
    const bgCanvas = canvasRef.current;
    if (!canvas || !bgCanvas) return;
    const ctx = canvas.getContext('2d');
    const bgCtx = bgCanvas.getContext('2d');
    if (!ctx || !bgCtx) return;

    if (canvas.width !== canvas.clientWidth || canvas.height !== canvas.clientHeight) {
      canvas.width = canvas.clientWidth;
      canvas.height = canvas.clientHeight;
      bgCanvas.width = canvas.width;
      bgCanvas.height = canvas.height;
    }

    // 1. DRAW ENHANCED SPACE BACKGROUND (MILKY WAY TYPE)
    bgCtx.fillStyle = '#010108';
    bgCtx.fillRect(0, 0, bgCanvas.width, bgCanvas.height);

    // Dynamic Nebula Pathways
    nebulaHueRef.current = (nebulaHueRef.current + 0.05) % 360;
    
    // Path 1 (Teal/Blue)
    const grad1 = bgCtx.createRadialGradient(bgCanvas.width * 0.3, bgCanvas.height * 0.4, 0, bgCanvas.width * 0.5, bgCanvas.height * 0.5, bgCanvas.width * 0.8);
    grad1.addColorStop(0, `hsla(${(nebulaHueRef.current + 40) % 360}, 60%, 15%, 0.4)`);
    grad1.addColorStop(0.5, `hsla(${(nebulaHueRef.current + 20) % 360}, 40%, 10%, 0.2)`);
    grad1.addColorStop(1, 'transparent');
    bgCtx.fillStyle = grad1;
    bgCtx.fillRect(0, 0, bgCanvas.width, bgCanvas.height);

    // Path 2 (Purple/Pink - Milky Way Core)
    const grad2 = bgCtx.createEllipseGradient ? null : bgCtx.createRadialGradient(bgCanvas.width * 0.7, bgCanvas.height * 0.6, 0, bgCanvas.width * 0.6, bgCanvas.height * 0.5, bgCanvas.width * 0.9);
    if (grad2) {
      grad2.addColorStop(0, `hsla(${nebulaHueRef.current}, 50%, 12%, 0.4)`);
      grad2.addColorStop(0.6, `hsla(${(nebulaHueRef.current - 30) % 360}, 30%, 5%, 0.2)`);
      grad2.addColorStop(1, 'transparent');
      bgCtx.fillStyle = grad2;
      bgCtx.fillRect(0, 0, bgCanvas.width, bgCanvas.height);
    }

    // Stars
    bgCtx.fillStyle = '#fff';
    starsRef.current.forEach(s => {
      s.z -= 1.8;
      if (s.z <= 1) {
        s.z = 1000;
        s.x = Math.random() * 3000 - 1500;
        s.y = Math.random() * 3000 - 1500;
      }
      const k = 150 / s.z;
      const px = s.x * k + bgCanvas.width / 2;
      const py = s.y * k + bgCanvas.height / 2;
      const size = s.size * k;

      if (px >= 0 && px <= bgCanvas.width && py >= 0 && py <= bgCanvas.height) {
        bgCtx.globalAlpha = s.opacity * (1 - s.z / 1000);
        bgCtx.beginPath();
        bgCtx.arc(px, py, size, 0, Math.PI * 2);
        bgCtx.fill();
      }
    });
    bgCtx.globalAlpha = 1.0;

    // 2. LOGIC
    if (smoothedHandPosRef.current && rawHandPosRef.current) {
      smoothedHandPosRef.current.x += (rawHandPosRef.current.x - smoothedHandPosRef.current.x) * sensitivity;
      smoothedHandPosRef.current.y += (rawHandPosRef.current.y - smoothedHandPosRef.current.y) * sensitivity;
    } else if (rawHandPosRef.current) {
      smoothedHandPosRef.current = { ...rawHandPosRef.current };
    }

    if (gameState === GameState.PLAYING) {
      if (time - lastTimeTickRef.current > 1000) {
        timeLeftRef.current -= 1;
        setDisplayTime(timeLeftRef.current);
        lastTimeTickRef.current = time;
        if (timeLeftRef.current <= 0) onGameOver(scoreRef.current);
      }

      if (time - lastTargetTimeRef.current > 650 / (1 + currentLevel * 0.45)) {
        spawnTarget();
        lastTargetTimeRef.current = time;
      }
      
      targetsRef.current = targetsRef.current.filter(t => {
        t.x += t.vx; t.y += t.vy;
        t.scale = Math.min(1.4, t.scale + 0.006);
        if (t.x < 0 || t.x > canvas.width) t.vx *= -1;
        return t.y < canvas.height + 300;
      });
    }

    particlesRef.current.forEach(p => {
      p.x += p.vx; p.y += p.vy; p.life -= 0.04;
    });
    particlesRef.current = particlesRef.current.filter(p => p.life > 0);

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 3. DRAW DETAILED PLANETS
    targetsRef.current.forEach(t => {
      const r = t.size * t.scale / 2;
      ctx.save();
      ctx.translate(t.x, t.y);
      
      // Ring Behind
      if (t.ring) {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
        ctx.lineWidth = 12 * t.scale;
        ctx.beginPath();
        ctx.ellipse(0, 0, r * 2.3, r * 0.5, Math.PI / 8, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Planet Shadow/Glow
      ctx.shadowBlur = 45 * t.scale;
      ctx.shadowColor = t.color;

      // Surface Clipping
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.clip();

      // Base Planet Color
      const pGrad = ctx.createLinearGradient(-r, -r, r, r);
      pGrad.addColorStop(0, t.color);
      pGrad.addColorStop(1, '#000');
      ctx.fillStyle = pGrad;
      ctx.fill();

      // Draw Surface Features
      if (t.surface.type === 'gas') {
        t.surface.bands?.forEach(b => {
          ctx.fillStyle = b.color;
          ctx.fillRect(-r * 2, b.y * r, r * 4, b.h * r);
        });
      } else {
        t.surface.features.forEach(f => {
          ctx.fillStyle = f.color;
          ctx.beginPath();
          ctx.arc(f.x * r, f.y * r, f.r * r, 0, Math.PI * 2);
          ctx.fill();
        });
      }

      // Secondary Lighting Overlay
      const highlight = ctx.createRadialGradient(-r * 0.3, -r * 0.3, 0, 0, 0, r * 1.5);
      highlight.addColorStop(0, 'rgba(255,255,255,0.2)');
      highlight.addColorStop(1, 'transparent');
      ctx.fillStyle = highlight;
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();

      // Sharp atmospheric rim
      ctx.save();
      ctx.translate(t.x, t.y);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.lineWidth = 1.5 * t.scale;
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    });
    ctx.shadowBlur = 0;

    // Particles
    particlesRef.current.forEach(p => {
      ctx.globalAlpha = p.life;
      ctx.fillStyle = p.color;
      ctx.beginPath(); ctx.arc(p.x, p.y, 5 * p.life, 0, Math.PI * 2); ctx.fill();
    });
    ctx.globalAlpha = 1;

    // CALIBRATION
    if (gameState === GameState.CALIBRATING && !isCalibratingRef.current) {
      const cX = canvas.width / 2;
      const cY = canvas.height / 2;
      const ringR = dynamicRingRadiusRef.current;
      
      ctx.strokeStyle = 'rgba(0, 255, 255, 0.2)';
      ctx.lineWidth = 15;
      ctx.beginPath(); ctx.arc(cX, cY, ringR, 0, Math.PI * 2); ctx.stroke();

      if (smoothedHandPosRef.current) {
        const h = smoothedHandPosRef.current;
        const dist = Math.sqrt(Math.pow(h.x - cX, 2) + Math.pow(h.y - cY, 2));
        ctx.setLineDash([10, 10]);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(h.x, h.y); ctx.lineTo(cX, cY); ctx.stroke();
        ctx.setLineDash([]);

        if (dist < ringR) {
          ctx.strokeStyle = isPinchingRef.current ? '#00FF00' : '#FFFF00';
          ctx.lineWidth = 12;
          ctx.beginPath(); ctx.arc(cX, cY, ringR, 0, Math.PI * 2); ctx.stroke();
          calibrationProgressRef.current = Math.min(calibrationProgressRef.current + (isPinchingRef.current ? 4.5 : 2.5), 100);
          if (calibrationProgressRef.current >= 100) startCountdown();
        } else {
          calibrationProgressRef.current = Math.max(calibrationProgressRef.current - 0.4, 0);
        }
        setDisplayProgress(calibrationProgressRef.current);
      }
      
      ctx.fillStyle = 'rgba(255,255,255,0.05)';
      ctx.fillRect(cX - 200, cY + 220, 400, 12);
      ctx.fillStyle = '#00FFFF';
      ctx.fillRect(cX - 200, cY + 220, (calibrationProgressRef.current / 100) * 400, 12);
    }

    // RETICLE
    if (smoothedHandPosRef.current) {
      const { x, y } = smoothedHandPosRef.current;
      const color = isPinchingRef.current ? '#f0f' : '#0ff';
      ctx.strokeStyle = color;
      ctx.lineWidth = 4;
      ctx.beginPath(); ctx.arc(x, y, 45, 0, Math.PI * 2); 
      ctx.moveTo(x - 65, y); ctx.lineTo(x + 65, y);
      ctx.moveTo(x, y - 65); ctx.lineTo(x, y + 65);
      ctx.stroke();

      if (isPinchingRef.current && gameState === GameState.PLAYING) {
        fireLaser({ x, y });
        ctx.beginPath();
        ctx.moveTo(x, canvas.height); ctx.lineTo(x, y);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.lineWidth = 12;
        ctx.stroke();
        
        // Lens flare effect at tip
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(x, y, 15, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    requestIdRef.current = requestAnimationFrame(gameLoop);
  }, [gameState, spawnTarget, currentLevel, onGameOver, sensitivity, startCountdown]);

  useEffect(() => {
    if (gameState === GameState.LOBBY || gameState === GameState.GAMEOVER) {
      isCalibratingRef.current = false;
      setCountdown(null);
    }
    if (gameState === GameState.CALIBRATING) {
      calibrationProgressRef.current = 0;
      timeLeftRef.current = MISSION_DURATION;
      setDisplayTime(MISSION_DURATION);
      scoreRef.current = 0;
      setScore(0);
      targetsRef.current = [];
      particlesRef.current = [];
      isCalibratingRef.current = false;
    }
    requestIdRef.current = requestAnimationFrame(gameLoop);
    return () => { if (requestIdRef.current) cancelAnimationFrame(requestIdRef.current); };
  }, [gameState, gameLoop]);

  return (
    <div className="relative w-full h-full bg-[#010108] overflow-hidden">
      <video ref={videoRef} className="hidden" playsInline muted />
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full object-cover" />
      <canvas ref={gameCanvasRef} className="absolute inset-0 w-full h-full z-10" />

      {gameState === GameState.PLAYING && (
        <div className="absolute top-12 left-12 z-20 flex flex-col items-start drop-shadow-xl">
          <span className="text-cyan-500 font-mono text-xs uppercase tracking-[0.8em] mb-2 font-black opacity-80">Sync Data Stream</span>
          <span className="text-9xl font-black text-white font-mono leading-none tracking-tighter italic drop-shadow-[0_0_25px_rgba(255,255,255,0.4)]">{score.toLocaleString()}</span>
        </div>
      )}

      {gameState === GameState.PLAYING && (
        <div className="absolute top-12 right-12 z-20 text-right drop-shadow-xl">
          <span className="text-emerald-500 font-mono text-xs uppercase tracking-[0.8em] mb-2 font-black opacity-80">Solar Seconds</span>
          <div className={`text-9xl font-black font-mono leading-none italic ${displayTime < 10 ? 'text-red-500 animate-pulse' : 'text-white'}`}>
            {displayTime}s
          </div>
        </div>
      )}

      {gameState === GameState.CALIBRATING && !isCalibratingRef.current && (
        <div className="absolute inset-0 flex flex-col items-center justify-center z-20 pointer-events-none">
          <div className="bg-black/70 px-16 py-10 rounded-[4rem] border border-cyan-500/40 backdrop-blur-3xl text-center shadow-[0_0_100px_rgba(6,182,212,0.1)]">
            <h2 className="text-7xl font-black text-white italic uppercase tracking-tighter mb-4 neon-text">Uplink Synching</h2>
            <p className="text-cyan-400 font-mono uppercase tracking-[0.3em] text-sm animate-pulse">Position Index Finger in Ring</p>
          </div>
        </div>
      )}

      {countdown !== null && (
        <div className="absolute inset-0 flex items-center justify-center z-50 bg-black/50 backdrop-blur-md">
          <div className="text-[45rem] font-black text-cyan-400 italic animate-bounce drop-shadow-[0_0_150px_rgba(0,255,255,0.8)]">
            {countdown}
          </div>
        </div>
      )}

      {gameState === GameState.GAMEOVER && (
        <div className="absolute inset-0 z-50 bg-black/95 flex items-center justify-center p-12">
          <div className="text-center space-y-12 p-24 bg-slate-950/90 rounded-[6rem] border-2 border-cyan-400/30 backdrop-blur-3xl max-w-5xl w-full shadow-[0_0_150px_rgba(0,255,255,0.15)]">
            <h2 className="text-[12rem] font-black text-cyan-400 italic tracking-tighter leading-none uppercase drop-shadow-2xl">MISSION COMPLETE</h2>
            <div className="space-y-4">
              <span className="text-slate-500 font-mono text-2xl uppercase tracking-[1.2em]">Data Harvested</span>
              <div className="text-[14rem] font-mono text-white font-black leading-none">{score.toLocaleString()}</div>
            </div>
            <div className="flex gap-10 justify-center pt-10">
              <button onClick={onRestart} className="px-28 py-14 bg-cyan-500 hover:bg-white text-black font-black uppercase tracking-[0.6em] rounded-[5rem] transition-all text-5xl transform hover:scale-110 shadow-[0_0_100px_rgba(6,182,212,0.8)]">RE-SYNC</button>
              <button onClick={onExit} className="px-20 py-14 border-4 border-slate-800 text-slate-500 hover:text-white font-black uppercase tracking-widest rounded-[5rem] hover:bg-slate-900 transition-all text-3xl">DOCK SHIP</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GameView;
