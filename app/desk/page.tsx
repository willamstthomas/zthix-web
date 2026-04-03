"use client";

import React, { useState } from 'react';
import { Shield, CheckCircle2, XCircle, Terminal } from 'lucide-react';

export default function ZthixClerkDesk() {
  const [ticketId, setTicketId] = useState('');
  const [clerkId, setClerkId] = useState('');
  const [projectType, setProjectType] = useState<'OPSCORE' | 'RECON'>('OPSCORE');
  const [passcode, setPasscode] = useState('');
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');

  const submitResolution = async (outcome: 'GREEN' | 'RED') => {
    if (!ticketId || !clerkId || !passcode) return;
    setStatus('submitting');

    try {
      const res = await fetch('/api/clerk/resolve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticketId, clerkId, projectType, outcome, passcode })
      });

      if (res.ok) {
        setStatus('success');
        setTimeout(() => {
          setStatus('idle');
          setTicketId(''); // Clear the ticket for the next file, but keep Clerk ID populated
        }, 2000);
      } else {
        setStatus('error');
        setTimeout(() => setStatus('idle'), 3000);
      }
    } catch (err) {
      setStatus('error');
      setTimeout(() => setStatus('idle'), 3000);
    }
  };

  return (
    <div className="min-h-screen bg-[#030712] text-slate-300 font-mono flex flex-col items-center justify-center p-6 selection:bg-cyan-900/50">
      <div className="max-w-md w-full bg-[#060A14] border border-slate-800 p-8 rounded-lg shadow-[0_0_50px_rgba(6,182,212,0.05)] relative overflow-hidden">
        
        <div className="absolute inset-0 opacity-10 mix-blend-screen pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at center, #06b6d4 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>

        <div className="flex items-center justify-between mb-8 border-b border-slate-800 pb-4 relative z-10">
          <div className="flex items-center gap-3">
            <Terminal className="w-6 h-6 text-cyan-500" />
            <h1 className="text-lg font-bold tracking-widest text-white uppercase">OPERATOR DESK</h1>
          </div>
          <span className="text-[10px] text-cyan-500 tracking-widest bg-cyan-900/30 px-2 py-1 rounded">SECURE</span>
        </div>

        <div className="space-y-5 mb-8 relative z-10">
          <div>
            <label className="block text-[10px] text-slate-500 mb-1.5 uppercase tracking-widest font-bold">Clearance Passcode</label>
            <input 
              type="password" 
              value={passcode} 
              onChange={e => setPasscode(e.target.value)} 
              className="w-full bg-slate-900 border border-slate-700 rounded px-4 py-3 text-sm text-white focus:border-cyan-500 outline-none transition-colors" 
            />
          </div>
          <div>
            <label className="block text-[10px] text-slate-500 mb-1.5 uppercase tracking-widest font-bold">Clerk ID (e.g. H1)</label>
            <input 
              type="text" 
              value={clerkId} 
              onChange={e => setClerkId(e.target.value.toUpperCase())} 
              className="w-full bg-slate-900 border border-slate-700 rounded px-4 py-3 text-sm text-white focus:border-cyan-500 outline-none transition-colors" 
            />
          </div>
          <div>
            <label className="block text-[10px] text-slate-500 mb-1.5 uppercase tracking-widest font-bold">Target ZTHIX-UID</label>
            <input 
              type="text" 
              value={ticketId} 
              onChange={e => setTicketId(e.target.value.toUpperCase())} 
              placeholder="ZTHIX-REQ-XXXXXX" 
              className="w-full bg-slate-900 border border-slate-700 rounded px-4 py-3 text-sm text-cyan-400 font-bold focus:border-cyan-500 outline-none transition-colors placeholder-slate-700" 
            />
          </div>
          <div>
            <label className="block text-[10px] text-slate-500 mb-1.5 uppercase tracking-widest font-bold">Project Architecture</label>
            <select 
              value={projectType} 
              onChange={e => setProjectType(e.target.value as 'OPSCORE' | 'RECON')} 
              className="w-full bg-slate-900 border border-slate-700 rounded px-4 py-3 text-sm text-white focus:border-cyan-500 outline-none transition-colors"
            >
              <option value="OPSCORE">OPSCORE</option>
              <option value="RECON">RECON</option>
            </select>
          </div>
        </div>

        {status === 'idle' && (
          <div className="grid grid-cols-2 gap-4 relative z-10">
            <button 
              onClick={() => submitResolution('GREEN')} 
              className="bg-green-900/20 border border-green-500/50 text-green-400 py-4 rounded hover:bg-green-900/40 hover:border-green-500 flex items-center justify-center gap-2 transition-all active:scale-95 text-xs font-bold tracking-widest shadow-[0_0_15px_rgba(34,197,94,0.1)]"
            >
              <CheckCircle2 className="w-5 h-5" /> GREEN
            </button>
            <button 
              onClick={() => submitResolution('RED')} 
              className="bg-red-900/20 border border-red-500/50 text-red-400 py-4 rounded hover:bg-red-900/40 hover:border-red-500 flex items-center justify-center gap-2 transition-all active:scale-95 text-xs font-bold tracking-widest shadow-[0_0_15px_rgba(239,68,68,0.1)]"
            >
              <XCircle className="w-5 h-5" /> RED
            </button>
          </div>
        )}
        {status === 'submitting' && <div className="text-center py-4 text-cyan-500 font-bold text-xs tracking-widest animate-pulse border border-cyan-900 rounded bg-cyan-950/30">TRANSMITTING...</div>}
        {status === 'success' && <div className="text-center py-4 text-green-400 border border-green-500 rounded bg-green-950/30 font-bold text-xs tracking-widest">LEDGER HASH LOCKED</div>}
        {status === 'error' && <div className="text-center py-4 text-red-400 border border-red-500 rounded bg-red-950/30 font-bold text-xs tracking-widest">TRANSMISSION FAILED</div>}
      </div>
    </div>
  );
}
