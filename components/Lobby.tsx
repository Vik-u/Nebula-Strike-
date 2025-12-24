
import React from 'react';
import { MissionData } from '../types';

interface LobbyProps {
  mission: MissionData;
  highScore: number;
  onStart: () => void;
  error: string | null;
}

const Lobby: React.FC<LobbyProps> = ({ mission, highScore, onStart, error }) => {
  return (
    <div className="absolute inset-0 flex items-center justify-center p-6 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-slate-900 to-black overflow-auto">
      <div className="max-w-2xl w-full bg-black/80 backdrop-blur-md border border-cyan-500/30 p-8 rounded-2xl neon-border">
        <header className="mb-8 border-b border-cyan-500/20 pb-4">
          <h1 className="text-4xl font-black text-cyan-400 tracking-tighter italic uppercase neon-text">
            NEBULA STRIKE
          </h1>
          <p className="text-cyan-600 font-mono text-sm tracking-widest mt-2 uppercase">
            Gesture Control Prototype v2.5
          </p>
        </header>

        <section className="mb-10 space-y-4">
          <div className="bg-cyan-500/5 p-4 rounded border-l-4 border-cyan-500">
            <h2 className="text-cyan-300 font-bold uppercase mb-1">{mission.title}</h2>
            <p className="text-slate-300 leading-relaxed italic">"{mission.briefing}"</p>
          </div>
          
          <div className="grid grid-cols-2 gap-4 mt-6">
            <div className="p-4 bg-slate-900/50 rounded border border-slate-800">
              <span className="block text-slate-500 text-xs uppercase font-bold tracking-widest mb-1">High Score</span>
              <span className="text-2xl font-mono text-cyan-400">{highScore.toLocaleString()}</span>
            </div>
            <div className="p-4 bg-slate-900/50 rounded border border-slate-800">
              <span className="block text-slate-500 text-xs uppercase font-bold tracking-widest mb-1">Control Mode</span>
              <span className="text-lg font-mono text-emerald-400">INDEX FINGER TRACK</span>
            </div>
          </div>
        </section>

        <section className="mb-10">
          <h3 className="text-cyan-500 font-bold uppercase text-xs mb-3 tracking-[0.2em]">Deployment Instructions</h3>
          <ul className="space-y-2 text-sm text-slate-400 font-mono">
            <li className="flex items-start">
              <span className="text-cyan-500 mr-2">▶</span> 
              <span>Use your **Index Finger** to aim at targets.</span>
            </li>
            <li className="flex items-start">
              <span className="text-cyan-500 mr-2">▶</span> 
              <span>**Pinch** (Index + Thumb) or **Hold Stable** to fire.</span>
            </li>
            <li className="flex items-start">
              <span className="text-cyan-500 mr-2">▶</span> 
              <span>Destroy cosmic entities before they evade your sensors.</span>
            </li>
          </ul>
        </section>

        {error && <p className="text-red-500 text-xs font-mono mb-4">{error}</p>}

        <button 
          onClick={onStart}
          className="w-full py-4 bg-cyan-600 hover:bg-cyan-500 text-black font-black uppercase tracking-widest rounded-lg transition-all transform hover:scale-[1.02] active:scale-95 shadow-[0_0_20px_rgba(6,182,212,0.5)]"
        >
          Initiate Mission
        </button>
        
        <p className="text-center text-[10px] text-slate-600 mt-6 uppercase tracking-widest font-mono">
          Camera Access Required for Finger Tracking
        </p>
      </div>
    </div>
  );
};

export default Lobby;
