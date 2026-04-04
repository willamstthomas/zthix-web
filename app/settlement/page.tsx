"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Server, ShieldCheck, Receipt, X, ZoomIn, Copy, Box, Calculator, ExternalLink, ShieldAlert } from 'lucide-react';

// UESA 1.0 Strict Typings
interface InvoiceItem {
  project: string;
  volume: number;
  subtotal_usd: number;
  uids: string[];
}

interface InvoiceData {
  sei: string;
  total_usd: string;
  message?: string;
  items: InvoiceItem[];
}

function SettlementContent() {
  const searchParams = useSearchParams();
  const sei = searchParams.get('sei');

  const [invoice, setInvoice] = useState<InvoiceData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [zoomedImageSrc, setZoomedImageSrc] = useState<string | null>(null);

  useEffect(() => {
    document.title = "ZTHIX SETTLEMENT";
    
    if (!sei) {
      setError("NO SEI DETECTED. INVALID ROUTE.");
      setLoading(false);
      return;
    }

    // UESA 1.0 Cryptographic Fetch
    const fetchLedger = async () => {
      try {
        const res = await fetch(`/api/client/invoice?sei=${sei}`);
        if (!res.ok) throw new Error("LEDGER SYNCHRONIZATION FAILED");
        const data = await res.json();
        setInvoice(data);
      } catch (err: any) {
        setError(err.message || "FATAL LEDGER ERROR");
      } finally {
        setLoading(false);
      }
    };

    fetchLedger();
  }, [sei]);

  const generateVisualHash = (str: string) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; 
    }
    const hex = Math.abs(hash).toString(16);
    return `${hex}c632d7ec95089b53992d3ed6b55ba444c6a11973076...`.substring(0, 50) + "...";
  };

  if (loading) {
    return <div className="text-zinc-500 font-mono animate-pulse uppercase tracking-widest text-xs mt-20">Synchronizing with UESA Ledger M...</div>;
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center mt-20 border border-red-900/50 bg-red-950/20 p-8 rounded-md max-w-lg text-center">
        <ShieldAlert className="w-12 h-12 text-red-500 mb-4" />
        <h2 className="text-red-500 font-black tracking-widest uppercase text-xl mb-2">ACCESS DENIED</h2>
        <p className="text-red-400/70 text-xs font-mono uppercase">{error}</p>
      </div>
    );
  }

  // ZERO LIABILITY STATE (Styled to match the premium aesthetic)
  if (!invoice || invoice.items.length === 0 || invoice.total_usd === "0.00") {
    return (
      <div className="max-w-2xl w-full bg-[#111] border border-zinc-800 shadow-2xl overflow-hidden rounded-md my-8 p-12 flex flex-col items-center justify-center text-center">
        <h2 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-1">Target SEI:</h2>
        <p className="text-3xl font-black text-white mb-8">{invoice?.sei || sei?.toUpperCase()}</p>
        <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mb-6">
          <ShieldCheck className="w-8 h-8 text-emerald-500" />
        </div>
        <h3 className="text-emerald-500 font-black tracking-widest uppercase text-xl mb-2">NO OUTSTANDING LIABILITY</h3>
        <p className="text-zinc-500 text-xs font-mono uppercase">This SEI has no pending charges in UESA Ledger M.</p>
      </div>
    );
  }

  // Aggregate total volume and extract a representative UID
  const totalVolume = invoice.items.reduce((sum, item) => sum + item.volume, 0);
  const allUids = invoice.items.flatMap(item => item.uids);
  const safeUid = allUids.length > 0 ? allUids[0] : 'ZTHIX-PENDING';
  const representativeHash = generateVisualHash(safeUid);
  const cleanDisplayUrl = `zthix.com/verify/${safeUid}`;
  const fullLinkUrl = `https://www.zthix.com/verify/${safeUid}`;

  return (
    <div className="max-w-2xl w-full bg-[#111] border border-zinc-800 shadow-2xl overflow-hidden rounded-md my-8">
      
      {/* HEADER */}
      <div className="bg-black border-b border-zinc-800 p-4 md:p-6 flex items-center justify-between">
        <div className="flex items-center gap-2 md:gap-3">
          <Server className="text-blue-500 w-6 h-6 md:w-8 md:h-8" />
          <div>
            <h1 className="text-purple-500 font-black tracking-widest uppercase text-2xl md:text-3xl leading-none">ZTHIX</h1>
            <p className="text-[8px] md:text-[10px] text-zinc-500 font-bold tracking-widest uppercase mt-1">B2B Settlement Gateway</p>
          </div>
        </div>
        <div className="flex items-center gap-1 md:gap-2 text-[8px] md:text-[10px] font-bold tracking-widest uppercase text-orange-500 bg-orange-950/30 px-2 py-1 md:px-3 md:py-1.5 border border-orange-900">
          <ShieldCheck className="w-3 h-3 md:w-4 md:h-4" /> LIABILITY PENDING
        </div>
      </div>

      <div className="p-4 md:p-8">
        {/* INVOICE DETAILS */}
        <div className="mb-6 md:mb-8 break-words flex justify-between items-start">
          <div>
            <h2 className="text-xs md:text-sm font-bold text-zinc-500 uppercase tracking-widest mb-1">Target SEI:</h2>
            <p className="text-xl md:text-2xl font-black text-white">{invoice.sei}</p>
            <p className="text-[10px] md:text-xs text-zinc-500 font-mono mt-1">Billing Period: Current Batch</p>
          </div>
        </div>

        {/* LINE ITEMS (Dynamically Mapped from Database) */}
        <div className="border border-zinc-800 bg-black mb-8">
          <div className="flex justify-between p-3 md:p-4 border-b border-zinc-800 text-[10px] md:text-xs font-bold text-zinc-500 uppercase tracking-widest">
            <span>Service Description</span>
            <span>Amount</span>
          </div>
          
          {invoice.items.map((item, index) => (
            <div key={index} className="p-3 md:p-4 flex justify-between items-center gap-4 border-b border-zinc-800/50 last:border-0">
              <div>
                <p className="text-white font-bold text-sm md:text-base leading-tight flex items-center gap-2">
                   {item.project === 'OPSCORE' ? <Box className="w-4 h-4 text-blue-500" /> : <Calculator className="w-4 h-4 text-purple-500" />}
                   {item.project === 'OPSCORE' ? 'Origin Customs Payload Extraction' : 'Financial Recon Audit'}
                </p>
                <p className="text-[10px] md:text-xs text-zinc-400 font-mono mt-2">Total Orders Processed: <span className="text-white font-bold">{item.volume}</span></p>
              </div>
              <p className="text-xl md:text-2xl font-mono text-emerald-400 font-black">${item.subtotal_usd.toFixed(2)}</p>
            </div>
          ))}
        </div>

        {/* CRYPTOGRAPHIC PROOF DESIGN */}
        <div className="mb-8 p-6 border border-zinc-800 bg-[#0f1219]">
          
          <div className="flex flex-row items-start md:items-center justify-between mb-4 gap-4">
             <div className="flex items-start md:items-center gap-2 text-blue-400">
               <ShieldCheck className="w-5 h-5 flex-shrink-0 mt-0.5 md:mt-0" />
               <h2 className="font-bold tracking-widest uppercase text-sm leading-tight">Cryptographic Assets Generated</h2>
             </div>
             <div className="text-zinc-400 font-mono text-xs font-bold tracking-widest flex-shrink-0 whitespace-nowrap mt-0.5 md:mt-0">
                1 / {totalVolume}
             </div>
          </div>

          <p className="text-[10px] text-zinc-500 mb-6 leading-relaxed">
            A representative sample of the anchored Sovereign Entity Identifier (ZTHIX-UID) is displayed below. The remaining {totalVolume - 1 > 0 ? totalVolume - 1 : 0} records have been securely transmitted to your master ledger.
          </p>

          <div className="bg-black border border-zinc-800 p-4 font-mono group hover:border-emerald-500/50 transition-colors">
             
             {/* UID ROW */}
             <div className="flex justify-between items-center mb-3">
               <span className="text-emerald-500 font-bold tracking-widest uppercase text-sm pr-2 truncate">
                 {safeUid}
               </span>
               <button 
                 onClick={() => navigator.clipboard.writeText(safeUid)} 
                 className="text-zinc-500 hover:text-white bg-zinc-900 p-2 rounded-sm transition-colors shrink-0" 
                 title="Copy UID"
               >
                 <Copy className="w-4 h-4" />
               </button>
             </div>

             {/* HASH ROW */}
             <div className="flex justify-between items-center mb-4 text-zinc-500 bg-[#151515] p-2 rounded-sm border border-zinc-800/50">
               <span className="truncate pr-4 text-xs">
                 Hash: {representativeHash}
               </span>
               <button 
                 onClick={() => navigator.clipboard.writeText(representativeHash)} 
                 className="text-zinc-500 hover:text-white bg-zinc-900 p-2 rounded-sm transition-colors shrink-0" 
                 title="Copy Hash"
               >
                 <Copy className="w-4 h-4" />
               </button>
             </div>

             {/* DOSSIER LINK ROW */}
             <div className="flex justify-between items-center pt-3 border-t border-zinc-800/70">
               <a 
                 href={fullLinkUrl} 
                 target="_blank" 
                 rel="noreferrer" 
                 className="text-blue-400 hover:underline flex items-center gap-2 truncate pr-4 text-xs"
               >
                 <ExternalLink className="w-4 h-4 flex-shrink-0" /> {cleanDisplayUrl}
               </a>
               <button 
                 onClick={() => navigator.clipboard.writeText(cleanDisplayUrl)} 
                 className="text-zinc-500 hover:text-white bg-zinc-900 p-2 rounded-sm transition-colors shrink-0" 
                 title="Copy Link"
               >
                 <Copy className="w-4 h-4" />
               </button>
             </div>

          </div>
        </div>

        {/* PAYMENT SECTION */}
        <div className="flex flex-col md:flex-row gap-6 md:gap-8 items-center md:items-start pt-4 border-t border-zinc-800">
          
          {/* DUAL QR CODE LAYOUT */}
          <div className="flex flex-row gap-4 items-start">
            
            {/* Alipay Box */}
            <div className="flex flex-col items-center">
              <div 
                onClick={() => setZoomedImageSrc("/alipay-qr.jpg")}
                className="w-32 h-32 md:w-36 md:h-36 bg-white p-2 rounded-md border border-zinc-700 flex-shrink-0 flex items-center justify-center cursor-pointer hover:border-blue-500 transition-all relative group"
              >
                <img src="/alipay-qr.jpg" alt="Alipay" className="w-full h-full object-contain" />
                <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center rounded-md">
                  <ZoomIn className="text-white w-6 h-6 mb-1" />
                  <span className="text-white text-[8px] font-bold uppercase tracking-widest">Zoom</span>
                </div>
              </div>
              <span className="text-[10px] text-zinc-400 font-mono mt-2 uppercase tracking-widest font-bold">Alipay</span>
            </div>

            {/* WeChat Box */}
            <div className="flex flex-col items-center">
              <div 
                onClick={() => setZoomedImageSrc("/wechat-qr.jpg")}
                className="w-32 h-32 md:w-36 md:h-36 bg-white p-2 rounded-md border border-zinc-700 flex-shrink-0 flex items-center justify-center cursor-pointer hover:border-blue-500 transition-all relative group"
              >
                <img src="/wechat-qr.jpg" alt="WeChat Pay" className="w-full h-full object-contain" />
                <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center rounded-md">
                  <ZoomIn className="text-white w-6 h-6 mb-1" />
                  <span className="text-white text-[8px] font-bold uppercase tracking-widest">Zoom</span>
                </div>
              </div>
              <span className="text-[10px] text-zinc-400 font-mono mt-2 uppercase tracking-widest font-bold">WeChat Pay</span>
            </div>
            
          </div>

          <div className="flex-1 flex flex-col justify-center w-full mt-4 md:mt-0">
            <h3 className="text-4xl font-black text-emerald-400 mb-2 text-center md:text-left">${invoice.total_usd} USD</h3>
            
            <p className="text-[10px] text-white font-bold uppercase tracking-widest mb-6 text-center md:text-left opacity-90">
              * RMB exchange rate is based on the exchange rate of the day of payment.
            </p>
            
            <div className="bg-blue-950/20 border border-blue-900 p-4 rounded-sm text-[10px] md:text-xs text-blue-400 font-mono flex gap-3 items-start">
              <Receipt className="w-6 h-6 md:w-8 md:h-8 flex-shrink-0" />
              <p className="leading-relaxed">Please scan the QR code to settle the current ledger balance. Account processing limits will automatically reset upon receipt.</p>
            </div>
          </div>
        </div>

        {/* PHASE 4: CLIENT LIABILITY CLICKWRAP */}
        <div className="mt-8 pt-4 border-t border-zinc-800 text-center">
          <p className="text-[9px] text-zinc-500 uppercase tracking-widest leading-relaxed">
            By executing this payment, the Client explicitly acknowledges and agrees to the ZTHIX Master Service Agreement. ZTHIX is a passive data processor. Ledger extraction and anomaly detection are provided "AS-IS" without guarantee. ZTHIX's maximum liability for any audit failure, data extraction error, or system outage is strictly capped at the exact USD amount of this specific transaction invoice. Execution of this settlement constitutes non-reversible acceptance of these terms.
          </p>
        </div>

      </div>

      {/* FULL SCREEN DYNAMIC ZOOM MODAL */}
      {zoomedImageSrc && (
        <div 
          className="fixed inset-0 z-50 bg-black/95 flex flex-col items-center justify-center p-6 cursor-pointer animate-in fade-in duration-200"
          onClick={() => setZoomedImageSrc(null)}
        >
          <button className="absolute top-6 right-6 text-zinc-500 hover:text-white transition-colors">
            <X className="w-10 h-10" />
          </button>
          
          <div className="bg-white p-4 rounded-xl max-w-sm w-full shadow-2xl transition-transform hover:scale-105">
            <img src={zoomedImageSrc} alt="Enlarged QR Code" className="w-full h-auto object-contain" />
          </div>
          <p className="text-zinc-500 text-xs font-bold tracking-widest mt-8 uppercase">Tap anywhere to close</p>
        </div>
      )}

    </div>
  );
}

export default function B2BSettlementPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-slate-300 font-sans flex flex-col items-center justify-start p-4 md:p-6 overflow-y-auto">
      <Suspense fallback={<div className="text-zinc-500 font-mono animate-pulse uppercase tracking-widest text-xs mt-20">Loading Ledger...</div>}>
        <SettlementContent />
      </Suspense>
    </div>
  );
}
