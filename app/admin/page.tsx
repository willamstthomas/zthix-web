"use client";

import React, { useState } from 'react';
import { Database, Zap, Activity } from 'lucide-react';

export default function ZthixAdminCommand() {
  const [passcode, setPasscode] = useState('');
  const [status, setStatus] = useState<'idle' | 'sweeping' | 'success' | 'error'>('idle');
  const [log, setLog] = useState<string>('SYSTEM READY. AWAITING COMMAND.');

  const executeSweep = async () => {
    if (!passcode) return;
    setStatus('sweeping');
    setLog('INITIATING UESA FINANCIAL SWEEP...');

    try {
      const res = await fetch('/api/admin/sweep', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminPasscode: passcode })
      });

      if (res.ok) {
        setStatus('success');
        setLog('SWEEP COMPLETE. LEDGERS M & H SYNCHRONIZED. EVENTS LOCKED.');
      } else {
        setStatus('error');
        setLog('AUTHENTICATION FAILED OR EDGE NODE TIMEOUT.');
      }
    } catch (err) {
      setStatus('error');
      setLog('FATAL NETWORK ERROR. LEDGER INTEGRITY UNKNOWN.');
    }
  };

  return (
    <div className="min-h-screen bg-[#030712] text-slate-300 font-mono flex flex-col items-center justify-center p-6 selection:bg-purple-900/50">
      <div className="max-w-xl w-full bg-[#060A14] border border-slate-800 p-8 rounded-lg shadow-[0_0_50px_rgba(168,85,247,0.05)] relative overflow-hidden">
        
        <div className="absolute inset-0 opacity-10 mix-blend-screen pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at center, #a855f7 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>

        <div className="flex items-center justify-between mb-8 border-b border-slate-800 pb-4 relative z-10">
          <div className="flex items-center gap-3">
            <Database className="w-6 h-6 text-purple-500" />
            <h1 className="text-lg font-bold tracking-widest text-white uppercase">UESA Master Command</h1>
          </div>
          <span className="text-[10px] text-purple-500 tracking-widest bg-purple-900/30 px-2 py-1 rounded">ROOT ACCESS</span>
        </div>

        <div className="space-y-6 mb-8 relative z-10">
          <div className="bg-black border border-slate-800 p-4 rounded h-32 overflow-y-auto flex flex-col justify-end">
            <div className="flex items-center gap-2 mb-2">
              <Activity className={`w-4 h-4 ${status === 'sweeping' ? 'text-purple-500 animate-spin' : 'text-slate-600'}`} />
              <span className="text-xs font-bold uppercase tracking-widest text-slate-500">Terminal Log</span>
            </div>
            <p className={`text-sm ${status === 'success' ? 'text-green-400' : status === 'error' ? 'text-red-400' : 'text-purple-400'}`}>
              &gt; {log}
            </p>
          </div>

          <div>
            <label className="block text-[10px] text-slate-500 mb-1.5 uppercase tracking-widest font-bold">Root Passcode</label>
            <input 
              type="password" 
              value={passcode} 
              onChange={e => setPasscode(e.target.value)} 
              className="w-full bg-slate-900 border border-slate-700 rounded px-4 py-3 text-sm text-white focus:border-purple-500 outline-none transition-colors" 
            />
          </div>
        </div>

        <button 
          onClick={executeSweep}
          disabled={status === 'sweeping'}
          className="w-full bg-purple-900/20 border border-purple-500/50 text-purple-400 py-4 rounded hover:bg-purple-900/40 hover:border-purple-500 flex items-center justify-center gap-2 transition-all active:scale-95 text-xs font-bold tracking-widest shadow-[0_0_15px_rgba(168,85,247,0.1)] disabled:opacity-50 disabled:pointer-events-none relative z-10"
        >
          <Zap className="w-5 h-5" /> {status === 'sweeping' ? 'EXECUTING SWEEP...' : 'FORCE SETTLEMENT SWEEP'}
        </button>

      </div>
    </div>
  );
}
