
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { Bloom, EffectComposer } from '@react-three/postprocessing';
import { Scene } from './components/Scene';
import { HandTracker } from './components/HandTracker';
import { HandData } from './types';
import { Hand, Info, Snowflake, Sparkles, ZoomIn, PenLine, X, CheckCircle2, Volume2, VolumeX } from 'lucide-react';

const App: React.FC = () => {
  const [handData, setHandData] = useState<HandData>({
    x: 0.5,
    y: 0.5,
    z: 0.5,
    isOpen: true,
    isPointing: false,
    isPinching: false,
    isFist: false,
    indexTip: null,
    detected: false,
  });

  const [showInstructions, setShowInstructions] = useState(true);
  const [isBlessingModalOpen, setIsBlessingModalOpen] = useState(false);
  const [blessingText, setBlessingText] = useState('');
  const [blessingCount, setBlessingCount] = useState(0);
  const [showSuccess, setShowSuccess] = useState(false);
  const [customBlessingRequest, setCustomBlessingRequest] = useState<{text: string, timestamp: number} | null>(null);

  const [isMuted, setIsMuted] = useState(false);
  const bgmRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const savedCount = localStorage.getItem('celestial_blessing_count');
    if (savedCount) {
      setBlessingCount(parseInt(savedCount));
    } else {
      const initial = 12450 + Math.floor(Math.random() * 5000);
      setBlessingCount(initial);
      localStorage.setItem('celestial_blessing_count', initial.toString());
    }

    const bgm = new Audio('https://www.chosic.com/wp-content/uploads/2021/11/Jingle-Bells-Instrumental.mp3');
    bgm.loop = true;
    bgm.volume = 0.3;
    bgmRef.current = bgm;

    return () => {
      bgm.pause();
      bgmRef.current = null;
    };
  }, []);

  const handleHandUpdate = useCallback((data: HandData) => {
    setHandData(data);
  }, []);

  const handleStart = () => {
    setShowInstructions(false);
    if (bgmRef.current) bgmRef.current.play().catch(() => {});
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
    if (bgmRef.current) bgmRef.current.muted = !isMuted;
  };

  const playChime = () => {
    const chime = new Audio('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
    chime.volume = 0.5;
    chime.play().catch(() => {});
  };

  const handleSubmitBlessing = (e: React.FormEvent) => {
    e.preventDefault();
    if (!blessingText.trim()) return;

    playChime();
    setCustomBlessingRequest({ text: blessingText, timestamp: Date.now() });
    
    const newCount = blessingCount + 1;
    setBlessingCount(newCount);
    localStorage.setItem('celestial_blessing_count', newCount.toString());
    
    setIsBlessingModalOpen(false);
    setBlessingText('');
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 5000);
  };

  return (
    <div className="relative w-full h-screen bg-[#010409] overflow-hidden select-none">
      <Canvas
        camera={{ position: [0, 5, 15], fov: 45 }}
        gl={{ antialias: false, stencil: false, depth: true }}
        dpr={[1, 2]}
      >
        <color attach="background" args={['#010409']} />
        <Scene handData={handData} customBlessingRequest={customBlessingRequest} />
        
        <EffectComposer enableNormalPass={false}>
          <Bloom luminanceThreshold={0.8} mipmapBlur intensity={1.2} radius={0.4} />
        </EffectComposer>
      </Canvas>

      <div className="absolute top-4 left-4 flex gap-2 z-20">
        <button 
          onClick={() => setShowInstructions(true)} 
          className="p-2.5 bg-black/40 border border-white/10 rounded-full text-zinc-400 hover:text-white transition-all backdrop-blur-md"
        >
          <Info size={16} />
        </button>
        <button 
          onClick={toggleMute} 
          className="p-2.5 bg-black/40 border border-white/10 rounded-full text-zinc-400 hover:text-white transition-all backdrop-blur-md"
        >
          {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
        </button>
      </div>

      <div className="absolute top-4 right-4 w-20 h-15 bg-black/40 border border-white/10 rounded-xl overflow-hidden backdrop-blur-md shadow-2xl transition-opacity hover:opacity-100 opacity-60 z-20">
        <HandTracker onUpdate={handleHandUpdate} />
      </div>

      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 w-full px-6 max-w-4xl z-20">
        <button 
          onClick={() => setIsBlessingModalOpen(true)}
          className="group flex items-center gap-1.5 px-4 py-1.5 bg-emerald-600/10 hover:bg-emerald-600/30 border border-emerald-500/20 hover:border-emerald-400/40 rounded-full backdrop-blur-xl transition-all active:scale-95 shadow-[0_0_10px_rgba(16,185,129,0.05)] mb-1"
        >
          <PenLine size={10} className="text-emerald-400 group-hover:scale-110 transition-transform" />
          <span className="text-[9px] font-bold text-emerald-500 tracking-wider uppercase">挂上祝福</span>
        </button>

        <div className="flex items-center gap-5 px-6 py-3 bg-black/40 border border-white/10 rounded-2xl backdrop-blur-xl shadow-2xl overflow-x-auto no-scrollbar">
          <div className={`flex flex-col items-center gap-1 transition-colors ${handData.detected ? 'text-emerald-400' : 'text-zinc-600'}`}>
            <Hand size={16} />
            <span className="text-[8px] font-bold uppercase tracking-wider">Tracker</span>
          </div>
          <div className="w-[1px] h-6 bg-white/10 flex-shrink-0" />
          <div className="grid grid-cols-2 md:grid-cols-3 gap-x-5 gap-y-1 text-[9px] md:text-xs font-medium text-zinc-300 min-w-max">
            <div className="flex items-center gap-2">
              <div className={`w-1.5 h-1.5 rounded-full ${handData.isPinching ? 'bg-amber-400 animate-ping' : 'bg-zinc-500'}`} />
              Pinch (Draw Luck)
            </div>
            <div className="flex items-center gap-2">
              <div className={`w-1.5 h-1.5 rounded-full ${handData.isOpen ? 'bg-emerald-500' : 'bg-zinc-500'}`} />
              Open (Explode)
            </div>
            <div className="flex items-center gap-2">
              <div className={`w-1.5 h-1.5 rounded-full ${handData.isFist ? 'bg-blue-500' : 'bg-zinc-500'}`} />
              Fist (Regather)
            </div>
            <div className="flex items-center gap-2">
              <div className={`w-1.5 h-1.5 rounded-full ${handData.isPointing ? 'bg-cyan-400' : 'bg-zinc-500'}`} />
              Point (Light)
            </div>
            <div className="flex items-center gap-2">
              <div className={`w-1.5 h-1.5 rounded-full ${handData.detected ? 'bg-purple-400' : 'bg-zinc-500'}`} />
              Move X (Rotate)
            </div>
             <div className="flex items-center gap-2">
              <div className={`w-1.5 h-1.5 rounded-full ${handData.detected ? 'bg-rose-400' : 'bg-zinc-500'}`} />
              Move Z (Zoom)
            </div>
          </div>
        </div>
      </div>

      {showSuccess && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 flex items-center gap-3 px-6 py-3 bg-emerald-950/80 border border-emerald-500/50 rounded-2xl backdrop-blur-xl animate-bounce z-50">
          <CheckCircle2 className="text-emerald-400" size={20} />
          <div className="text-xs text-white">
            <p className="font-bold">祝福已升空！</p>
            <p className="opacity-70 text-[10px]">你是第 {blessingCount.toLocaleString()} 位在冬夜留下光芒的人</p>
          </div>
        </div>
      )}

      {isBlessingModalOpen && (
        <div className="absolute inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-md p-6">
          <div className="relative w-full max-w-md bg-[#0a0f16] border border-emerald-900/50 rounded-3xl p-8 shadow-[0_0_50px_rgba(16,185,129,0.15)] animate-in fade-in zoom-in duration-300">
            <button 
              onClick={() => setIsBlessingModalOpen(false)}
              className="absolute top-4 right-4 p-2 text-zinc-500 hover:text-white transition-colors"
            >
              <X size={20} />
            </button>
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-emerald-500/10 rounded-2xl text-emerald-400">
                <Sparkles size={24} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">留下你的祝愿</h2>
                <p className="text-xs text-zinc-500 italic">你的文字将化作星光挂在树梢</p>
              </div>
            </div>
            
            <form onSubmit={handleSubmitBlessing}>
              <textarea
                autoFocus
                maxLength={40}
                value={blessingText}
                onChange={(e) => setBlessingText(e.target.value)}
                placeholder="在此输入你的冬日祝福..."
                className="w-full h-32 bg-white/5 border border-white/10 rounded-2xl p-4 text-white text-sm placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500/50 transition-colors resize-none mb-6"
              />
              <button 
                type="submit"
                disabled={!blessingText.trim()}
                className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:hover:bg-emerald-600 text-white font-bold rounded-xl shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                挂上树梢
              </button>
            </form>
          </div>
        </div>
      )}

      {showInstructions && (
        <div className="absolute inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="max-w-md w-full p-8 bg-[#0a0f16] border border-emerald-900/50 rounded-3xl shadow-2xl text-white">
            <div className="flex justify-center mb-6">
              <div className="p-4 bg-emerald-500/10 rounded-full text-emerald-400">
                <Snowflake size={48} className="animate-pulse" />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-center mb-2 bg-gradient-to-r from-emerald-400 to-white bg-clip-text text-transparent">
              Celestial Forest
            </h1>
            <p className="text-zinc-400 text-center mb-8 text-sm leading-relaxed">
              Experience the magic of the Christmas tree with your hands.
            </p>
            
            <ul className="space-y-3 mb-8">
              <li className="flex gap-4 p-3 bg-white/5 rounded-2xl border border-white/5">
                <div className="w-10 h-10 flex-shrink-0 flex items-center justify-center bg-amber-500/20 rounded-xl text-amber-400">
                  <Sparkles size={20} />
                </div>
                <div>
                  <p className="font-semibold text-sm text-zinc-200">Pinch & Move</p>
                  <p className="text-xs text-zinc-500">Draw cards and rotate the forest by moving your hand.</p>
                </div>
              </li>
              <li className="flex gap-4 p-3 bg-white/5 rounded-2xl border border-white/5">
                <div className="w-10 h-10 flex-shrink-0 flex items-center justify-center bg-blue-500/20 rounded-xl text-blue-400">
                  <Hand size={20} />
                </div>
                <div>
                  <p className="font-semibold text-sm text-zinc-200">Palm Open / Fist</p>
                  <p className="text-xs text-zinc-500">Explode the tree into a nebula, or clench to regather.</p>
                </div>
              </li>
              <li className="flex gap-4 p-3 bg-white/5 rounded-2xl border border-white/5">
                <div className="w-10 h-10 flex-shrink-0 flex items-center justify-center bg-rose-500/20 rounded-xl text-rose-400">
                  <ZoomIn size={20} />
                </div>
                <div>
                  <p className="font-semibold text-sm text-zinc-200">Depth Zoom</p>
                  <p className="text-xs text-zinc-500">Move hand closer or further to zoom the camera.</p>
                </div>
              </li>
            </ul>

            <button onClick={handleStart} className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-lg shadow-emerald-900/20 transition-all active:scale-95">
              Enter the Forest
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
