"use client";

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Shield, Fingerprint, QrCode, Loader2, AlertTriangle, ExternalLink, Copy, CheckCircle2 } from 'lucide-react';

interface InvoiceItem {
  project: string;
  volume: number;
  subtotal_usd: number;
  uids: string[];
}

interface InvoicePayload {
  sei: string;
  total_usd: string;
  items: InvoiceItem[];
  message?: string;
}

function SettlementGateway() {
  const searchParams = useSearchParams();
  const sei = searchParams.get('sei');

  const [invoice, setInvoice] = useState<InvoicePayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [copiedUid, setCopiedUid] = useState<string | null>(null);

  useEffect(() => {
    if (!sei) {
      setLoading(false);
      setError(true);
      return;
    }

    const fetchLedger = async () => {
      try {
        const res = await fetch(`/api/client/invoice?sei=${sei}`);
        if (!res.ok) throw new Error('Ledger failure');
        const data = await res.json();
        setInvoice(data);
      } catch (err) {
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchLedger();
  }, [sei]);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedUid(text);
    setTimeout(() => setCopiedUid(null), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#030712] flex flex-col items-center justify-center font-mono">
        <Loader2 className="w-12 h-12 text-cyan-500 animate-spin mb-4" />
        <p className="text-cyan-500 font-bold tracking-widest text-sm animate-pulse">SYNCHRONIZING WITH LEDGER M...</p>
      </div>
    );
  }

  if (error || !sei) {
    return (
      <div className="min-h-screen bg-[#030712] flex flex-col items-center justify-center font-mono p-6">
        <AlertTriangle className="w-16 h-16 text-red-500 mb-6" />
        <h1 className="text-red-500 font-bold tracking-widest text-xl mb-2">INVALID PAYLOAD</h1>
        <p className="text-slate-400 text-sm">The requested SEI parameter is missing or rejected by the edge node.</p>
      </div>
    );
  }

  const isZeroBalance = invoice?.total_usd === "0.00" || invoice?.items.length === 0;

  return (
    <div className="min-h-screen bg-[#030712] text-slate-300 font-mono py-16 px-4 flex flex-col items-center selection:bg-cyan-900/50">
      
      {/* Header */}
      <div className="max-w-xl w-full flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <Database className="w-6 h-6 text-cyan-500 hidden" /> 
          <img src="/zthix-logo.png" alt="ZTHIX" className="h-6 object-contain" />
          <span className="text-white font-bold tracking-[0.2em] text-sm uppercase">B2B Settlement</span>
        </div>
        <div className={`flex items-center gap-2 text-[10px] font-bold tracking-widest px-3 py-1.5 rounded border ${isZeroBalance ? 'bg-green-900/20 text-green-400 border-green-500/50' : 'bg-orange-900/20 text-orange-400 border-orange-500/50'}`}>
          <Shield className="w-3.5 h-3.5" />
          {isZeroBalance ? 'LEDGER CLEARED' : 'LIABILITY PENDING'}
        </div>
      </div>

      {/* Main Terminal */}
      <div className="max-w-xl w-full bg-[#060A14] border border-slate-800 rounded-lg p-6 md:p-10 shadow-[0_0_50px_rgba(6,182,212,0.05)] relative overflow-hidden">
        
        <div className="mb-8 pb-8 border-b border-slate-800">
          <p className="text-[10px] text-slate-500 tracking-widest font-bold uppercase mb-2">Target SEI / USCI</p>
          <h2 className="text-3xl font-bold text-white tracking-wider">{sei}</h2>
        </div>

        {isZeroBalance ? (
          <div className="text-center py-10">
            <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-6" />
            <h3 className="text-green-400 font-bold text-lg tracking-widest mb-2">NO OUTSTANDING LIABILITY</h3>
            <p className="text-slate-500 text-sm">This SEI has no pending charges in UESA Ledger M.</p>
          </div>
        ) : (
          <>
            {/* Itemized Breakdown */}
            <div className="mb-8">
              <p className="text-[10px] text-slate-500 tracking-widest font-bold uppercase mb-4 border-b border-slate-800 pb-2">Itemized Liability Breakdown</p>
              
              <div className="space-y-6">
                {invoice?.items.map((item, idx) => (
                  <div key={idx} className="bg-slate-900/50 border border-slate-800 rounded p-4">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h4 className="text-cyan-400 font-bold text-sm tracking-widest uppercase flex items-center gap-2">
                          <Fingerprint className="w-4 h-4" /> {item.project} AUDIT
                        </h4>
                        <p className="text-xs text-slate-500 mt-1">Volume Processed: {item.volume} Units</p>
                      </div>
                      <div className="text-right">
                        <span className="text-white font-bold">${item.subtotal_usd.toFixed(2)}</span>
                      </div>
                    </div>
                    
                    {/* UID Proof Ledger */}
                    <div className="bg-black border border-slate-800 rounded p-3 h-24 overflow-y-auto">
                      <p className="text-[9px] text-slate-500 mb-2 tracking-widest uppercase">Cryptographic Hashes Generated:</p>
                      {item.uids.map(uid => (
                        <div key={uid} className="flex items-center justify-between group hover:bg-slate-900 p-1 rounded">
                          <span className="text-xs text-slate-400 font-mono">{uid}</span>
                          <div className="flex gap-2">
                            <button onClick={() => handleCopy(uid)} className="text-slate-600 hover:text-cyan-500 transition-colors">
                              {copiedUid === uid ? <CheckCircle2 className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                            </button>
                            <a href={`https://zthix.com/verify/${uid}`} target="_blank" rel="noopener noreferrer" className="text-slate-600 hover:text-cyan-500 transition-colors">
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Total and Payment */}
            <div className="border-t border-slate-800 pt-8 flex flex-col md:flex-row gap-8 items-center justify-between">
              <div className="flex gap-4">
                <div className="text-center">
                  <div className="w-20 h-20 bg-white rounded flex items-center justify-center p-1 mb-2">
                     <QrCode className="w-full h-full text-black" />
                  </div>
                  <span className="text-[9px] text-slate-500 tracking-widest uppercase font-bold">Alipay</span>
                </div>
                <div className="text-center">
                  <div className="w-20 h-20 bg-white rounded flex items-center justify-center p-1 mb-2">
                     <QrCode className="w-full h-full text-black" />
                  </div>
                  <span className="text-[9px] text-slate-500 tracking-widest uppercase font-bold">WeChat</span>
                </div>
              </div>

              <div className="text-center md:text-right">
                <p className="text-[10px] text-slate-500 tracking-widest font-bold uppercase mb-1">Total Liability</p>
                <p className="text-4xl font-bold text-white tracking-wider mb-2">${invoice?.total_usd} <span className="text-lg text-slate-500">USD</span></p>
                <p className="text-[9px] text-cyan-500/70 max-w-[200px] leading-relaxed">
                  * RMB exchange rate based on day of payment. Processing limits reset upon cryptographic receipt.
                </p>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#030712] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-cyan-500 animate-spin" />
      </div>
    }>
      <SettlementGateway />
    </Suspense>
  );
}
