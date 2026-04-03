"use client";

import React, { useState, useRef } from 'react';
import JSZip from 'jszip';
import { 
  Shield, 
  Database, 
  Lock, 
  Fingerprint, 
  Network,
  Cpu,
  ChevronRight,
  Globe2,
  ExternalLink,
  FileCheck,
  Target,
  Loader2,
  Send,
  Copy,
  CheckCircle2,
  Briefcase
} from 'lucide-react';

export default function ZthixDeterministicStorefront() {
  const [lang, setLang] = useState<'EN' | 'CN'>('EN');
  
  // UPLOAD WORKFLOW STATES
  const [fileName, setFileName] = useState<string | null>(null);
  const [uploadState, setUploadState] = useState<'idle' | 'packing' | 'hashing' | 'ready'>('idle');
  const [ticketId, setTicketId] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [contactInfo, setContactInfo] = useState<string>(''); 
  const [projectType, setProjectType] = useState<'OPSCORE' | 'RECON'>('OPSCORE'); // UESA Intake Valve
  const fileInputRef = useRef<HTMLInputElement>(null);

  const xhsProfileUrl = "https://www.xiaohongshu.com/user/profile/6996a9f700000000210240ba?m_source=pwa";

  // CORE TRANSMISSION LOGIC (Client-Side Palletization)
  const executePayloadTransmission = async (files: File[]) => {
    const randomHex = Math.floor(Math.random() * 16777215).toString(16).toUpperCase().padStart(6, '0');
    const generatedTicketId = `ZTHIX-REQ-${randomHex}`;
    setTicketId(generatedTicketId);

    try {
      const formData = new FormData();
      
      if (files && files.length > 0) {
        if (files.length === 1) {
          // Single file bypasses zip
          setUploadState('hashing');
          formData.append('file', files[0]);
        } else {
          // Multiple files get packed into a ZIP pallet
          setUploadState('packing');
          const zip = new JSZip();
          files.forEach(f => zip.file(f.name, f));
          const zipBlob = await zip.generateAsync({ type: 'blob' });
          const zipFile = new File([zipBlob], `${generatedTicketId}-Consolidated.zip`, { type: 'application/zip' });
          formData.append('file', zipFile);
          setUploadState('hashing');
        }
      }

      formData.append('ticketId', generatedTicketId);
      formData.append('contactInfo', contactInfo || 'Anonymous / Not Provided');
      formData.append('projectType', projectType); // Attach target engine for the Ledger

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        setUploadState('ready');
      } else {
        setUploadState('idle');
      }
    } catch (error) {
      setUploadState('idle');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const fileArray = Array.from(e.target.files);
      if (fileArray.length === 1) {
        setFileName(fileArray[0].name);
      } else {
        setFileName(`${fileArray.length} files selected / 已选择 ${fileArray.length} 个文件`);
      }
      executePayloadTransmission(fileArray);
    }
  };

  const handleCopyTicket = () => {
    navigator.clipboard.writeText(ticketId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const t = {
    EN: {
      hero_title: "ZTHIX Global Trade Risk Control System",
      hero_desc: "ZTHIX Global Trade Risk Control System uses deterministic \"mathematical model + manual\" dual review to replace purely manual visual document review, and performs responsibility or error tracing to ensure that customs/shipping company penalties are intercepted before goods are loaded into containers.",
      status_label: "SYSTEM STATUS: SECURE",
      
      pipeline_title: "Dual Review Workflow",
      pipeline_nodes: ["Data Ingestion", "VALIDATION\nMATH", "Manual Override", "Dossier Lock"],

      trigger_title: "Liability Interception Parameters",
      triggers: [
        { title: "SEI Weight Discrepancies", desc: "SEI misdeclarations cause carrier penalties. Our mathematical model invalidates incorrect payloads before gate-in." },
        { title: "Untrusted Human Variables", desc: "Visual document review by your Authorized Broker fails. We replace it with deterministic mathematical verification." },
        { title: "Liability Allocation", desc: "When fines occur, factories deny fault. ZTHIX provides the mathematical evidence to force accountability." },
        { title: "Incoterm Fraud", desc: "SEI inserts hidden terminal charges into FOB invoices. We detect and isolate the anomaly." }
      ],
      
      value_title: "ZTHIX Core Infrastructure",
      values: [
        { title: "ZTHIX-UID Generation", desc: "Every transaction is assigned a persistent ZTHIX-UID. Untrusted human data is quarantined until mathematical proofs align." },
        { title: "Immutable Compliance Dossier", desc: "Clean data generates a verifiable dossier (www.zthix.com/verify/ZTHIX-UID). You hold the absolute proof of origin." },
        { title: "Authorized Broker Integration", desc: "Seamless data handoffs to your Authorized Broker, eliminating manual data entry liabilities." }
      ],
      
      audit_title: "Risk Control Audit Test Form",
      audit_desc: "Upload standard commercial documents. The ZTHIX engine will run a mathematical autopsy to isolate liabilities and track error origins.",
      contact_input_placeholder: "Enter WeChat or Email",
      btn_upload: "SELECT LOCAL PAYLOAD",
      packing_text: "CONSOLIDATING CARGO...",
      hashing_text: "TRANSMITTING TO SECURE EDGE...",
      ready_title: "LOCAL SECURE TICKET ID SECURED",
      ready_desc: "Copy your secure Ticket ID below; it is the only proof of your Zthix trial order result. Zthix staff will reply to you with the result within 12 hours. You can also contact the on-duty specialist directly on RedNote.",
      btn_transmit: "OPEN REDNOTE TO COMMUNICATION",
      copy_btn: "COPY TICKET",
      copied_btn: "COPIED!",
      opscore_label: "OPSCORE (Logistics Check)",
      recon_label: "RECON (Financial Autopsy)",
      
      contact_title: "OPERATIONAL CENTER",
      contact_links: [
        { label: "EMAIL: INFO@ZTHIX.COM", url: "mailto:info@zthix.com" },
        { label: "REDNOTE: ZTHIX-Will", url: xhsProfileUrl },
        { label: "WHATSAPP: ZTHIX-Will", url: "https://wa.me/8613611052816" }
      ],
      footer_loc: "Location: Zhanjiang Port, Guangdong",
      footer_legal: "ZTHIX Mathematical Verification Protocol. EU Data Standards Compliant."
    },
    CN: {
      hero_title: "ZTHIX跨境风控系统",
      hero_desc: "ZTHIX跨境风控系统, 采用确定性“数学模型+人工”双审核, 替代纯人工肉眼审单, 并进行责任或错误溯源追踪, 确保在货物装柜前拦截海关/船司罚单。",
      status_label: "系统状态：安全",
      
      pipeline_title: "双重审核工作流",
      pipeline_nodes: ["数据摄入", "数学验证\n引擎", "人工终核", "档案锁定"],

      trigger_title: "责任拦截参数",
      triggers: [
        { title: "SEI 重量瞒报", desc: "外贸工厂/公司瞒报导致船公司罚款。我们的数学模型在进港前使错误数据无效化。" },
        { title: "不可信的人类变量", desc: "您的Authorized Broker进行的纯人工视觉审单经常失误。我们采用确定性“数学验证+人工”双审核取代。" },
        { title: "责任绝对分配", desc: "发生罚款时外贸工厂/公司拒不认账。ZTHIX提供数学铁证以强制追责。" },
        { title: "贸易术语欺诈", desc: "外贸工厂/公司将隐蔽费用夹带进FOB发票。系统自动检测并隔离此类异常。" }
      ],
      
      value_title: "ZTHIX核心基础设施",
      values: [
        { title: "ZTHIX-UID 生成", desc: "每笔交易分配唯一的ZTHIX-UID。不可信的人类数据将被隔离，直至数学证明完全吻合。" },
        { title: "Immutable Compliance Dossier 溯源追踪", desc: "干净的数据生成可验证档案 (www.zthix.com/verify/ZTHIX-UID)。您将掌握绝对的原产地证据。" },
        { title: "Authorized Broker 协同", desc: "向您的Authorized Broker进行无缝的追踪溯源数据交接，彻底消除人工录入带来的责任风险。" }
      ],
      
      audit_title: "风控审计试单",
      audit_desc: "上传标准商业单证。ZTHIX引擎将执行数学解剖以隔离责任和错误追踪溯源。",
      contact_input_placeholder: "输入微信号或邮箱",
      btn_upload: "选择本地文件",
      packing_text: "正在打包多个文件...",
      hashing_text: "正在传输至边缘节点...",
      ready_title: "本地安全凭证号已经生成",
      ready_desc: "请复制下方的凭证号，它是您获取zthix试单结果的唯一凭证。zthix工作人员将在12小时内回复您试单结果。您也可以直接在小红书上与值班专员联系。",
      btn_transmit: "小红书交流",
      copy_btn: "复制凭证号",
      copied_btn: "已复制!",
      opscore_label: "OPSCORE (物流审计)",
      recon_label: "RECON (财务解剖)",
      
      contact_title: "运营中心",
      contact_links: [
        { label: "EMAIL: info@zthix.com", url: "mailto:info@zthix.com" },
        { label: "REDNOTE: ZTHIX-Will", url: xhsProfileUrl },
        { label: "WHATSAPP: ZTHIX-Will", url: "https://wa.me/8613611052816" }
      ],
      footer_loc: "坐标：广东 · 湛江港",
      footer_legal: "ZTHIX 数学验证协议。符合欧盟数据标准。"
    }
  };

  const active = t[lang];

  return (
    <div className="min-h-screen bg-[#030712] text-slate-300 font-sans selection:bg-cyan-900/50 overflow-x-hidden">
      
      {/* EU BACKGROUND GRID */}
      <div className="fixed inset-0 z-0 pointer-events-none opacity-20">
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="eu-grid" width="60" height="60" patternUnits="userSpaceOnUse">
              <path d="M 60 0 L 0 0 0 60" fill="none" stroke="#1e293b" strokeWidth="0.5"/>
              <circle cx="60" cy="60" r="1" fill="#334155" opacity="0.5"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#eu-grid)" />
        </svg>
      </div>

      {/* TOP NAVIGATION */}
      <nav className="relative z-50 border-b border-slate-800 bg-[#030712]/90 backdrop-blur-md sticky top-0">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center relative z-10">
          <div className="flex items-center gap-3 relative z-10">
            <img src="/zthix-logo.png" alt="ZTHIX Logo" className="h-7 w-auto object-contain shrink-0" />
            <span className="text-white font-bold tracking-[0.2em] text-lg uppercase">ZTHIX</span>
          </div>
          <button 
            onClick={() => {
              setLang(lang === 'EN' ? 'CN' : 'EN');
              setUploadState('idle'); 
              setFileName(null);
            }}
            className="flex items-center gap-2.5 text-xs font-mono text-indigo-500 hover:text-indigo-400 transition-all border border-indigo-800/50 px-5 py-2 rounded-full hover:border-indigo-500 hover:shadow-[0_0_15px_rgba(79,70,229,0.3)] bg-indigo-950/30"
          >
            <Globe2 className="w-4 h-4 text-indigo-500" /> {lang === 'EN' ? '中文' : 'ENGLISH'}
          </button>
        </div>
      </nav>

      {/* HERO SECTION */}
      <section className="relative z-10 pt-20 pb-20 px-6 max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-12 min-h-[70vh]">
        <div className="lg:w-1/2 relative z-10 text-left">
          <div className="mb-6 flex items-center gap-3">
            <div className="w-2 h-2 bg-cyan-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(6,182,212,0.6)]"></div>
            <span className="text-[11px] font-mono tracking-widest text-slate-400 uppercase">{active.status_label}</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-bold text-white tracking-tight leading-[1.1] mb-4">
            {active.hero_title}
          </h1>
          <p className="text-lg md:text-xl text-cyan-50/70 leading-relaxed font-light border-l-2 border-cyan-600 pl-6 text-left">
            {active.hero_desc}
          </p>
        </div>
        
        {/* HERO IMAGE PORT */}
        <div className="lg:w-1/2 w-full relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-cyan-600 to-blue-600 rounded-xl blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
          <div className="relative h-[400px] w-full bg-slate-900 rounded-xl border border-slate-700 overflow-hidden shadow-2xl">
            <img 
              src="https://images.unsplash.com/photo-1559297434-fae8a1916a79?q=80&w=2000&auto=format&fit=crop" 
              alt="Global Logistics Network" 
              className="w-full h-full object-cover opacity-80 mix-blend-luminosity hover:mix-blend-normal transition-all duration-700"
            />
            <div className="absolute inset-0 bg-cyan-900/20 mix-blend-color"></div>
          </div>
        </div>
      </section>

      {/* PROCESS WORKFLOW */}
      <section className="relative z-10 py-16 bg-[#050A15] border-y border-slate-800">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <h3 className="text-sm font-mono text-cyan-500 uppercase tracking-widest mb-12">{active.pipeline_title}</h3>
          <div className="flex flex-col md:flex-row justify-center items-center gap-4 md:gap-0">
            {active.pipeline_nodes.map((node, i) => (
              <React.Fragment key={i}>
                <div className="w-32 h-32 rounded-full border border-slate-700 bg-gradient-to-br from-slate-900 to-black flex items-center justify-center shadow-[0_0_30px_rgba(6,182,212,0.05)] hover:border-cyan-500 transition-colors z-10 relative">
                  <span className="text-xs font-bold text-slate-300 w-20 whitespace-pre-line leading-relaxed">{node}</span>
                </div>
                {i < active.pipeline_nodes.length - 1 && (
                  <div className="hidden md:block w-16 h-0.5 bg-slate-800 relative z-0">
                    <div className="absolute inset-0 bg-cyan-500 w-full animate-[pulse_2s_ease-in-out_infinite]"></div>
                  </div>
                )}
                {i < active.pipeline_nodes.length - 1 && (
                  <div className="block md:hidden h-8 w-0.5 bg-cyan-800 relative z-0"></div>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      </section>

      {/* TRIGGERS */}
      <section className="relative z-10 py-24 px-6 max-w-7xl mx-auto flex flex-col lg:flex-row gap-16 items-center">
        <div className="lg:w-1/3 w-full relative">
           <div className="aspect-square bg-[#0a0f1c] rounded-2xl border border-slate-800 relative flex items-center justify-center overflow-hidden">
             <img 
                src="/risk-nodes-clean.png" 
                alt="Logistics network visualization" 
                className="absolute inset-0 w-full h-full object-cover opacity-30 mix-blend-screen"
             />
             <Network className="w-24 h-24 text-green-500 relative z-10" />
           </div>
        </div>

        <div className="lg:w-2/3 w-full">
          <h3 className="text-2xl font-bold text-white uppercase tracking-widest mb-10 border-b border-slate-800 pb-4">
            {active.trigger_title}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {active.triggers.map((trigger, idx) => (
              <div key={idx} className="bg-[#050A15] border border-slate-800 p-6 hover:border-indigo-600/50 transition-colors flex gap-6 items-start group relative">
                <Target className="w-5 h-5 text-purple-500 mt-1 flex-shrink-0 relative z-10" />
                <div className="relative z-10">
                  <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-3 leading-none relative z-10">{trigger.title}</h4>
                  <p className="text-xs text-slate-400 leading-relaxed font-mono relative z-10">{trigger.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* INFRASTRUCTURE VALUES */}
      <section className="relative z-10 py-20 bg-[#02040A] border-t border-slate-800/80">
        <div className="max-w-7xl mx-auto px-6">
          <h3 className="text-center text-xl font-bold text-white uppercase tracking-widest mb-16">{active.value_title}</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {active.values.map((val, idx) => (
              <div key={idx} className="bg-[#060A14] p-8 border border-slate-800/60 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-indigo-900/20 to-transparent group-hover:from-indigo-800/40 transition-colors duration-500"></div>
                <div className="text-indigo-400 mb-6 group-hover:text-indigo-300 transition-colors">
                  {idx === 0 ? <Fingerprint className="w-8 h-8 group-hover:scale-110 transition-transform duration-500" /> : idx === 1 ? <Lock className="w-8 h-8 group-hover:scale-110 transition-transform duration-500" /> : <Database className="w-8 h-8 group-hover:scale-110 transition-transform duration-500" />}
                </div>
                <h4 className="text-sm font-bold text-white uppercase tracking-widest mb-4 relative z-10">{val.title}</h4>
                <p className="text-xs text-slate-400 leading-relaxed relative z-10 text-left">{val.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CROSSHAIR DIVIDER PORT */}
      <div className="relative z-20 flex justify-center -mb-16 mt-4 pointer-events-none">
        <img 
          src="/zthix-crosshair.png" 
          alt="ZTHIX Target Crosshair" 
          className="w-48 h-auto opacity-90 drop-shadow-[0_0_15px_rgba(34,197,94,0.3)]" 
        />
      </div>

      {/* THE CONCIERGE AUDIT UI */}
      <section className="relative z-10 pt-32 pb-24 bg-black">
        <div className="max-w-4xl mx-auto px-6 relative z-10">
          <div className="border border-slate-800 bg-[#060A14] rounded-lg overflow-hidden shadow-[0_0_50px_rgba(6,182,212,0.05)] relative z-10 p-10 md:p-16 text-center min-h-[400px] flex flex-col justify-center">
            
            <div className="absolute inset-0 opacity-10 mix-blend-screen pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at center, #06b6d4 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
            
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              multiple 
              onChange={handleFileChange}
            />

            {/* STATE 1: IDLE */}
            {uploadState === 'idle' && (
              <>
                <h3 className="text-2xl font-bold text-white uppercase tracking-widest mb-4 relative z-10 leading-tight">{active.audit_title}</h3>
                <p className="text-sm text-slate-400 max-w-xl mx-auto mb-8 leading-relaxed font-mono relative z-10 font-medium">
                  {active.audit_desc}
                </p>

                {/* UESA INTAKE VALVE: Opscore vs Recon Selector */}
                <div className="flex justify-center gap-4 mb-8 relative z-10">
                  <button
                    onClick={() => setProjectType('OPSCORE')}
                    className={`px-6 py-3 rounded text-xs font-bold font-mono tracking-wider transition-all border ${
                      projectType === 'OPSCORE' 
                        ? 'bg-cyan-900/40 text-cyan-400 border-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.3)]' 
                        : 'bg-slate-900 text-slate-500 border-slate-700 hover:border-slate-600 hover:text-slate-400'
                    }`}
                  >
                    <Shield className="w-4 h-4 inline-block mr-2" />
                    {active.opscore_label}
                  </button>
                  <button
                    onClick={() => setProjectType('RECON')}
                    className={`px-6 py-3 rounded text-xs font-bold font-mono tracking-wider transition-all border ${
                      projectType === 'RECON' 
                        ? 'bg-purple-900/40 text-purple-400 border-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.3)]' 
                        : 'bg-slate-900 text-slate-500 border-slate-700 hover:border-slate-600 hover:text-slate-400'
                    }`}
                  >
                    <Briefcase className="w-4 h-4 inline-block mr-2" />
                    {active.recon_label}
                  </button>
                </div>

                <input 
                  type="text" 
                  value={contactInfo}
                  onChange={(e) => setContactInfo(e.target.value)}
                  placeholder={active.contact_input_placeholder}
                  className="w-full max-w-sm mx-auto mb-6 bg-slate-900 border border-slate-700 rounded px-4 py-3 text-sm text-white font-mono focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 transition-all block relative z-10 placeholder-slate-600"
                />

                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 relative z-10">
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="bg-transparent border border-cyan-500 hover:bg-cyan-900/30 text-cyan-400 font-mono font-bold text-xs px-8 py-4 rounded transition-all flex items-center gap-3 shadow-[0_0_15px_rgba(6,182,212,0.2)] hover:-translate-y-0.5 active:scale-95 group/drop w-full sm:w-auto justify-center"
                  >
                    <Cpu className="w-5 h-5 text-cyan-500 group-hover/drop:scale-110 transition-transform duration-500" />
                    {active.btn_upload}
                    <ChevronRight className="w-5 h-5 group-hover/drop:translate-x-0.5 transition-transform" />
                  </button>
                </div>
              </>
            )}

            {/* STATE 2: PACKING */}
            {uploadState === 'packing' && (
              <div className="flex flex-col items-center justify-center animate-pulse relative z-10">
                <Loader2 className="w-16 h-16 text-cyan-500 animate-spin mb-6" />
                <h3 className="text-xl font-bold text-cyan-400 font-mono tracking-widest">{active.packing_text}</h3>
                <p className="text-xs text-slate-500 font-mono mt-4">Target Payload: {fileName}</p>
              </div>
            )}

            {/* STATE 3: HASHING/TRANSMITTING */}
            {uploadState === 'hashing' && (
              <div className="flex flex-col items-center justify-center animate-pulse relative z-10">
                <Loader2 className="w-16 h-16 text-cyan-500 animate-spin mb-6" />
                <h3 className="text-xl font-bold text-cyan-400 font-mono tracking-widest">{active.hashing_text}</h3>
                <p className="text-xs text-slate-500 font-mono mt-4">Target Payload: {fileName}</p>
              </div>
            )}

            {/* STATE 4: READY FOR HANDOFF */}
            {uploadState === 'ready' && (
              <div className="relative z-10 flex flex-col items-center animate-[fadeIn_0.5s_ease-out]">
                <div className="w-16 h-16 bg-green-500/10 border border-green-500 rounded-full flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(34,197,94,0.2)]">
                  <FileCheck className="w-8 h-8 text-green-400" />
                </div>
                <h3 className="text-2xl font-bold text-white uppercase tracking-widest mb-4">{active.ready_title}</h3>
                
                <p className="text-sm text-slate-400 max-w-md mx-auto mb-6 leading-relaxed font-mono">
                  {active.ready_desc}
                </p>

                <div className="bg-slate-900 border border-slate-700 rounded-lg p-1 mb-8 flex items-center shadow-inner w-full max-w-sm">
                  <div className="px-4 py-3 flex-1 text-center">
                    <span className="text-xl font-mono font-bold text-cyan-400 tracking-[0.2em]">{ticketId}</span>
                  </div>
                  <button 
                    onClick={handleCopyTicket}
                    className={`h-full px-4 py-3 rounded text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all ${copied ? 'bg-green-600/20 text-green-400 border border-green-500/50' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
                  >
                    {copied ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    {copied ? active.copied_btn : active.copy_btn}
                  </button>
                </div>

                <a 
                  href={xhsProfileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-green-700 hover:bg-green-600 text-white font-mono font-bold text-xs px-10 py-4 rounded transition-all flex items-center gap-3 mx-auto shadow-[0_0_20px_rgba(21,128,61,0.3)] hover:-translate-y-0.5 active:scale-95 group/send"
                >
                  <Send className="w-5 h-5 text-white group-hover/send:-translate-y-1 group-hover/send:translate-x-1 transition-transform" />
                  {active.btn_transmit}
                </a>
                
                <button 
                  onClick={() => {
                    setUploadState('idle');
                    setFileName(null);
                    setCopied(false);
                    setContactInfo('');
                  }}
                  className="mt-8 text-xs text-slate-500 hover:text-slate-300 font-mono underline underline-offset-4"
                >
                  {lang === 'EN' ? 'Continue Uploading New File' : '继续上传新文件'}
                </button>
              </div>
            )}
            
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="relative z-50 border-t border-slate-800 bg-[#02040A] py-12 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6 relative z-10">
          <div className="text-center md:text-left relative z-10">
            <h4 className="text-white font-bold uppercase tracking-widest text-[11px] mb-4 flex items-center justify-center md:justify-start gap-2 relative z-10">
              <Globe2 className="w-4 h-4 text-slate-400 relative z-10" /> {active.contact_title}
            </h4>
            <div className="flex flex-col gap-3 text-[11px] font-mono text-slate-400 relative z-10 font-bold uppercase tracking-widest">
              {/* Native Copy-to-Clipboard Email Row */}
              <button 
                onClick={() => navigator.clipboard.writeText('info@zthix.com')}
                className="text-slate-400 hover:text-white transition-colors flex items-center justify-center md:justify-start gap-2 relative z-10 font-bold uppercase tracking-widest group cursor-pointer text-left"
                title="Click to copy email address"
              >
                EMAIL: info@zthix.com <Copy className="w-3.5 h-3.5 relative z-10 group-active:scale-90 transition-transform" />
              </button>
              
              {/* Filter out the old email link, render the rest (RedNote/WhatsApp) with ExternalLink arrow */}
              {active.contact_links.filter(l => !l.label.includes('EMAIL')).map((link, idx) => (
                <a 
                  key={idx}
                  href={link.url} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-slate-400 hover:text-slate-300 transition-colors flex items-center justify-center md:justify-start gap-2 relative z-10 font-bold uppercase tracking-widest"
                >
                  {link.label} <ExternalLink className="w-3.5 h-3.5 relative z-10" />
                </a>
              ))}
            </div>
            <p className="text-[10px] font-mono text-slate-300 uppercase tracking-widest mt-6 relative z-10 font-bold tracking-[0.2em]">{active.footer_loc}</p>
          </div>
          
          <div className="text-center md:text-right border-t md:border-t-0 md:border-l border-slate-800 pt-6 md:pt-0 md:pl-6 relative z-10 leading-relaxed font-bold tracking-[0.1em]">
            <p className="text-[10px] font-mono text-slate-600 uppercase relative z-10">
              {active.footer_legal} <br/>
              SYSTEM: ZTHIX // STATUS: ACTIVE
            </p>
          </div>
        </div>
      </footer>

    </div>
  );
}
