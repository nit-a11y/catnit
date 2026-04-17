'use client';

import React, { useState, useEffect, useRef } from 'react';
import GameContainer, { GameContainerHandle } from '@/components/Game/GameContainer';
import { Joystick } from '@/components/Game/Joystick';
import { Gatmorio } from '@/components/Game/Gatmorio';
import { useIsMobile } from '@/hooks/use-mobile';
import { motion, AnimatePresence } from 'motion/react';
import { Sword, Wand2, Shield, Zap, Heart, Trophy, User, Package, Zap as ManaIcon, Target, Settings, Menu, X, Book, Download } from 'lucide-react';

export default function Home() {
  const isMobile = useIsMobile();
  const engineRef = useRef<GameContainerHandle>(null);
  const [activeAction, setActiveAction] = useState('1');
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isGatmorioOpen, setIsGatmorioOpen] = useState(false);
  const [stats, setStats] = useState({
    hp: 100,
    maxHp: 100,
    mp: 100,
    maxMp: 100,
    level: 1,
    wave: 1,
    enemiesLeft: 0,
    strength: 10,
    definition: 10,
    stamina: 10,
    agility: 20,
    intelligence: 10,
    manaRegen: 5,
    arcane: 10,
    weapon: 'magic',
    inventory: ['magic'] as string[],
    character: 'bulky',
    lifeSteal: 0,
    bleedChance: 0,
    activePower: 'fireball',
    xp: 0,
    score: 0,
    cooldowns: {
      shoot: 0,
      special: 0,
      melee: 0,
      activePower: 0,
      ultimate: 0,
      dash: 0
    } as Record<string, number>
  });

  const [sidebarsOverridden, setSidebarsOverridden] = useState<boolean | null>(null);
  const showSidebars = sidebarsOverridden !== null ? sidebarsOverridden : !isMobile;

  useEffect(() => {
    // Service Worker Registration
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').then((registration) => {
          console.log('SW registered:', registration);
        }).catch((error) => {
          console.log('SW registration failed:', error);
        });
      });
    }

    // PWA Install Prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'KeyG') {
        setIsGatmorioOpen(prev => !prev);
        return;
      }
      
      const keyMap: Record<string, string> = {
        'Digit1': '1', 'Digit2': '2', 'Digit3': '3', 'Digit4': '4', 
        'Digit5': '5', 'Digit6': '6', 'Digit7': '7', 'KeyM': 'M'
      };
      if (keyMap[e.code]) {
        setActiveAction(keyMap[e.code]);
        // Limpa o destaque após um curto período
        setTimeout(() => setActiveAction(''), 200);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsInstallable(false);
    }
    setDeferredPrompt(null);
  };

  return (
    <main className={`h-screen w-screen grid ${isMobile ? 'grid-cols-1 grid-rows-[60px_1fr]' : 'grid-cols-[260px_1fr_260px] grid-rows-[100px_1fr_140px]'} gap-3 p-3 bg-[#1a1423] overflow-hidden`}>
      {/* HEADER */}
      <header className={`panel ${isMobile ? '' : 'col-span-3'} flex justify-between items-center px-4 md:px-6`}>
        <div className={`flex flex-col gap-1 ${isMobile ? 'w-[120px]' : 'w-[350px]'}`}>
          <div className="h-4 md:h-6 bg-black border-2 border-[#4d3d60] relative overflow-hidden group">
            <div 
              className="health-bar h-full transition-all duration-500 ease-out" 
              style={{ width: `${Math.max(0, (stats.hp / stats.maxHp) * 100)}%` }}
            />
            {isMobile && <span className="absolute inset-0 flex items-center justify-center text-[8px] font-bold text-white uppercase drop-shadow-md animate-pulse">{stats.hp}</span>}
          </div>
          <div className="h-4 md:h-6 bg-black border-2 border-[#4d3d60] relative overflow-hidden group">
            <div 
              className="mana-bar h-full transition-all duration-500 ease-out" 
              style={{ width: `${Math.max(0, (stats.mp / stats.maxMp) * 100)}%` }}
            />
            {isMobile && <span className="absolute inset-0 flex items-center justify-center text-[8px] font-bold text-white uppercase drop-shadow-md animate-pulse">{stats.mp}</span>}
          </div>
        </div>

        <div className="text-center">
          <div className={`${isMobile ? 'text-lg' : 'text-3xl'} font-black text-[#ffcc33] uppercase leading-tight italic tracking-tighter`}>MIAU-DA {stats.wave}</div>
          {!isMobile && <div className="text-[10px] opacity-70 uppercase font-bold tracking-widest text-[#a388ee]">Inimigos: {stats.enemiesLeft}</div>}
        </div>

        <div className="flex items-center gap-2 md:gap-4">
          {isMobile && (
            <button 
              onClick={() => setSidebarsOverridden(!showSidebars)}
              className="p-2 border-2 border-[#ffcc33] text-[#ffcc33] bg-[#ffcc33]/10 rounded-lg active:scale-90"
            >
              <Menu size={24} />
            </button>
          )}
          {!isMobile && (
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-[#ffcc33] font-bold uppercase text-[10px] opacity-60">Equipado</div>
                <div className="text-white font-black uppercase text-[16px] tracking-tight">{stats.weapon === 'magic' ? 'Cajado Arcano' : stats.weapon === 'pistol' ? 'Gato-Glock' : 'Garras de Prata'}</div>
              </div>
              <div className="h-12 w-12 border-2 border-[#ffcc33] flex items-center justify-center bg-black/40 shadow-[0_0_15px_rgba(255,204,51,0.2)]">
                {stats.weapon === 'magic' && <Zap size={24} className="text-[#a388ee]" />}
                {stats.weapon === 'pistol' && <Target size={24} className="text-[#ff4d6d]" />}
                {stats.weapon === 'knife' && <Sword size={24} className="text-[#cccccc]" />}
              </div>
            </div>
          )}
          
          <button 
            onClick={() => setIsGatmorioOpen(true)}
            className="btn-magic p-2 rounded-lg animate-glow-pulse"
            title="Gatmório (G)"
          >
            <Book size={isMobile ? 20 : 24} />
          </button>
          
          <button 
            onClick={() => engineRef.current?.togglePause()}
            className="btn-primary px-3 md:px-5 py-2 rounded-lg text-[12px]"
          >
            {isMobile ? <Settings size={20}/> : 'Pausa [P]'}
          </button>
        </div>
      </header>

      {/* LEFT SIDEBAR (Stats) */}
      <AnimatePresence>
        {(showSidebars || !isMobile) && (
          <motion.aside 
            initial={isMobile ? { x: -300 } : {}}
            animate={{ x: 0 }}
            exit={isMobile ? { x: -300 } : {}}
            className={`panel flex flex-col gap-4 p-4 overflow-y-auto ${isMobile ? 'absolute left-3 top-[70px] bottom-[110px] w-[240px] z-[60] bg-[#1a1423]/95' : ''}`}
          >
            {isMobile && <button onClick={() => setSidebarsOverridden(false)} className="self-end text-white/50"><X size={20}/></button>}
            <div>
              <h2 className="text-[12px] border-b-2 border-[#4d3d60] pb-1 mb-3 text-[#a388ee] uppercase font-bold flex items-center gap-2">
                <User size={14} /> Atributos
              </h2>
              <StatRow label="Força" value={stats.strength} />
              <StatRow label="Definição" value={stats.definition} />
              <StatRow label="Resistência" value={stats.stamina} />
              <StatRow label="Agilidade" value={stats.agility} />
              <StatRow label="Recarga" value={`${(stats as any).cooldownReduction || 0}%`} />
            </div>

            <div>
              <h2 className="text-[12px] border-b-2 border-[#4d3d60] pb-1 mb-3 text-[#f0f0f0] uppercase font-bold flex items-center gap-2">
                <Settings size={14} /> Sistema
              </h2>
              <div className="flex flex-col gap-2">
                <button 
                  onClick={() => setIsGatmorioOpen(true)}
                  className="text-[10px] uppercase text-left hover:text-[#ffcc33] transition-colors flex items-center gap-2"
                >
                  <Book size={12} /> Abrir Gatmório
                </button>
                <button className="text-[10px] uppercase text-left hover:text-[#ffcc33] transition-colors">Ajustar Áudio</button>
                <button className="text-[10px] uppercase text-left hover:text-[#ffcc33] transition-colors">Gráficos Retrô</button>
                {isInstallable && (
                  <button 
                    onClick={handleInstallClick}
                    className="text-[10px] uppercase text-left text-[#ffcc33] font-black border-2 border-[#ffcc33] p-2 mt-2 flex items-center justify-center gap-2 hover:bg-[#ffcc33] hover:text-[#1a1423] transition-all animate-pulse"
                  >
                    <Download size={14} /> Instalar Offline
                  </button>
                )}
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* CENTER ARENA */}
      <div className="relative overflow-hidden group border-[4px] md:border-[6px] border-[#3d3051] bg-[#1a1423] touch-none">
        {/* Environment Juice: Background Glows */}
        <div className="absolute top-[20%] left-[20%] w-[200px] md:w-[400px] h-[200px] md:h-[400px] bg-[#7e22ce]/5 blur-[60px] md:blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[20%] right-[20%] w-[200px] md:w-[400px] h-[200px] md:h-[400px] bg-[#4cc9f0]/5 blur-[60px] md:blur-[120px] pointer-events-none" />
        
        <GameContainer 
          ref={engineRef} 
          onStatsUpdate={setStats} 
          isInstallable={isInstallable}
          onInstall={handleInstallClick}
        />
        
        {/* MOBILE HUD - TOP BAR */}
        {isMobile && (
          <div className="absolute top-0 left-0 right-0 p-4 z-[50] flex flex-col items-center gap-2 pointer-events-none">
            {/* Health & XP Cluster */}
            <div className="w-full max-w-[300px] flex flex-col gap-1">
              {/* HP Bar */}
              <div className="h-6 w-full bg-black/40 border-2 border-[#ff4d6d]/30 overflow-hidden relative rounded-full shadow-[0_0_15px_rgba(255,77,109,0.2)]">
                <motion.div 
                  initial={false}
                  animate={{ width: `${(stats.hp / stats.maxHp) * 100}%` }}
                  className="h-full bg-gradient-to-r from-[#ff4d6d] to-[#ff758f] relative"
                >
                  <div className="absolute inset-0 bg-white/20 animate-pulse" />
                </motion.div>
                <div className="absolute inset-0 flex items-center justify-center text-[10px] font-black text-white px-2 drop-shadow-md">
                  HP: {Math.ceil(stats.hp)} / {stats.maxHp}
                </div>
              </div>
              
              {/* XP Bar */}
              <div className="h-2 w-full bg-black/40 overflow-hidden relative rounded-full">
                <motion.div 
                  animate={{ width: `${(stats.xp % 100)}%` }} // Assuming 100 XP per level for UI
                  className="h-full bg-[#ffcc33]"
                />
              </div>
              
              {/* MP Bar */}
              <div className="h-4 w-full bg-black/40 border border-[#a388ee]/30 overflow-hidden relative rounded-full">
                <motion.div 
                  animate={{ width: `${(stats.mp / stats.maxMp) * 100}%` }}
                  className="h-full bg-gradient-to-r from-[#a388ee] to-[#bdb2ff]"
                />
                <div className="absolute inset-0 flex items-center justify-center text-[8px] font-black text-white px-2 uppercase italic">
                  Energy: {Math.ceil(stats.mp)}
                </div>
              </div>
            </div>
            
            {/* Level & Points Indicator */}
            <div className="flex gap-4 items-center">
              <div className="bg-black/60 px-3 py-1 border border-[#ffcc33]/50 rounded-md text-[10px] font-bold text-[#ffcc33] uppercase tracking-wider flex items-center gap-2">
                Level {stats.level}
              </div>
              <div className="bg-black/60 px-3 py-1 border border-white/20 rounded-md text-[10px] font-bold text-white uppercase tracking-wider">
                {stats.score} PTS
              </div>
            </div>
          </div>
        )}

        {/* MOBILE CONTROLS */}
        {isMobile && (
          <div className="absolute inset-0 pointer-events-none z-40">
            <Joystick 
              onMove={(x, y) => engineRef.current?.setJoystickMove(x, y)}
              onEnd={() => engineRef.current?.setJoystickMove(0, 0)}
            />
            
            <div className="absolute right-4 bottom-4 size-48 pointer-events-none">
              <div className="relative w-full h-full pointer-events-auto flex items-center justify-center">
                {/* Main Action Button - Dash/Dodge in Archero variants */}
                <button 
                  onTouchStart={(e) => { e.preventDefault(); engineRef.current?.executeAction('dash'); }}
                  className="w-22 h-22 rounded-full bg-gradient-to-br from-[#ffcc33] to-[#ff9900] border-4 border-white/40 flex flex-col items-center justify-center shadow-[0_5px_20px_rgba(255,204,51,0.4)] active:scale-90 active:brightness-125 transition-all z-20 group relative overflow-hidden"
                >
                  <Zap size={28} className="text-white drop-shadow-md" />
                  <span className="text-[8px] font-black text-white uppercase tracking-tighter">Dodge</span>
                  {/* Cooldown Spinner */}
                  {(stats as any).cooldowns?.dash > 0 && (
                     <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                        <span className="text-sm font-bold text-[#ffcc33]">{Math.ceil((stats as any).cooldowns.dash / 1000)}s</span>
                     </div>
                  )}
                </button>

                {/* Satellite Skills */}
                <div className="absolute w-full h-full">
                  {/* Special / Weapon Action */}
                  <button 
                    onTouchStart={(e) => { e.preventDefault(); engineRef.current?.executeAction('special'); }}
                    className="absolute top-0 right-0 w-14 h-14 rounded-full bg-[#a388ee]/90 backdrop-blur-sm border-2 border-white/20 flex items-center justify-center text-white shadow-lg active:scale-85 transition-all"
                  >
                    <Target size={20} />
                    {(stats as any).cooldowns?.special > 0 && (
                      <div className="absolute inset-0 bg-black/70 rounded-full flex items-center justify-center text-[10px] font-bold text-white">
                        {Math.ceil((stats as any).cooldowns.special / 1000)}s
                      </div>
                    )}
                  </button>

                  {/* Active Power */}
                  <button 
                    onTouchStart={(e) => { e.preventDefault(); engineRef.current?.executeAction('active_power'); }}
                    className="absolute top-2 right-16 w-12 h-12 rounded-full bg-orange-600/90 backdrop-blur-sm border-2 border-white/20 flex items-center justify-center text-white shadow-lg active:scale-85 transition-all"
                  >
                    <span className="text-lg">
                      {stats.activePower === 'fireball' ? '🔥' : stats.activePower === 'vortex' ? '🌀' : '🛡️'}
                    </span>
                    {(stats as any).cooldowns?.activePower > 0 && (
                      <div className="absolute inset-0 bg-black/70 rounded-full flex items-center justify-center text-[10px] font-bold text-white">
                        {Math.ceil((stats as any).cooldowns.activePower / 1000)}s
                      </div>
                    )}
                  </button>

                  {/* Melee */}
                  <button 
                    onTouchStart={(e) => { e.preventDefault(); engineRef.current?.executeAction('melee'); }}
                    className="absolute bottom-2 left-0 w-12 h-12 rounded-full bg-gray-700/90 backdrop-blur-sm border-2 border-white/20 flex items-center justify-center text-white shadow-lg active:scale-85 transition-all"
                  >
                    <Sword size={18} />
                  </button>
                </div>
              </div>
            </div>
            
            {/* Quick Potions Area */}
            <div className="absolute left-4 bottom-28 z-[40] flex flex-col gap-2 pointer-events-auto">
               <button 
                onTouchStart={(e) => { e.preventDefault(); engineRef.current?.executeAction('potion_hp'); }}
                className="w-10 h-10 rounded-full bg-red-600/30 backdrop-blur-sm border-2 border-red-500 flex items-center justify-center text-lg shadow-lg active:scale-90"
              >
                💊
              </button>
              <button 
                onTouchStart={(e) => { e.preventDefault(); engineRef.current?.executeAction('potion_mp'); }}
                className="w-10 h-10 rounded-full bg-blue-600/30 backdrop-blur-sm border-2 border-blue-500 flex items-center justify-center text-lg shadow-lg active:scale-90"
              >
                🧪
              </button>
            </div>
          </div>
        )}

        <div className="absolute bottom-4 right-4 bg-black/50 px-3 py-1 text-[10px] uppercase tracking-widest pointer-events-none flex flex-col items-end gap-1 z-20">
          <div>Arena: Coliseum of Meow-gic</div>
          <div className="text-[#a388ee]">Especial: Click Direito</div>
        </div>
      </div>

      {/* RIGHT SIDEBAR (Inventory) */}
      <AnimatePresence>
        {(showSidebars || !isMobile) && (
          <motion.aside 
            initial={isMobile ? { x: 300 } : {}}
            animate={{ x: 0 }}
            exit={isMobile ? { x: 300 } : {}}
            className={`panel flex flex-col gap-4 p-4 overflow-y-auto ${isMobile ? 'absolute right-3 top-[70px] bottom-[110px] w-[240px] z-[60] bg-[#1a1423]/95 text-right' : ''}`}
          >
            <div>
              <h2 className="text-[12px] border-b-2 border-[#4d3d60] pb-1 mb-3 text-[#a388ee] uppercase font-bold flex items-center justify-between gap-2">
                {isMobile ? <><div/><Package size={14} /></> : <><Package size={14} /> Inventário</>}
              </h2>
              <div className="flex flex-col gap-2">
                {stats.inventory.map((item) => (
                  <div 
                    key={item}
                    onClick={() => engineRef.current?.executeAction('switch_weapon_' + item)}
                    className={`
                      p-2 border-2 text-[10px] uppercase font-bold cursor-pointer transition-all flex items-center gap-2
                      ${stats.weapon === item ? 'border-[#ffcc33] bg-[#2d2642]' : 'border-[#4d3d60] hover:border-[#a388ee]'}
                      ${isMobile ? 'flex-row-reverse' : ''}
                    `}
                  >
                    {item === 'magic' && <Zap size={12} className="text-[#a388ee]" />}
                    {item === 'pistol' && <Target size={12} className="text-[#ff4d6d]" />}
                    {item === 'knife' && <Sword size={12} className="text-[#cccccc]" />}
                    <span className="flex-1">{item === 'magic' ? 'Magia' : item === 'pistol' ? 'Pistola' : 'Facas'}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-auto">
              <h2 className="text-[12px] border-b-2 border-[#4d3d60] pb-1 mb-3 text-[#a388ee] uppercase font-bold">
                Drop Slots
              </h2>
              <div className="grid grid-cols-2 gap-2">
                <DropSlot icon="🛡️" />
                <DropSlot icon="⚡" />
                <DropSlot icon="🧪" />
                <DropSlot icon="🍗" />
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* FOOTER ACTION BAR - HIDDEN ON MOBILE */}
      {!isMobile && (
        <footer className="panel col-span-3 grid grid-cols-7 gap-4 p-4 border-t-4 border-[#3d3051]">
          <ActionSlot 
            k="1" 
            icon="⚔️" 
            name="Melee" 
            cooldown={(stats as any).cooldowns?.melee}
            onClick={() => engineRef.current?.executeAction('melee')} 
          />
          <ActionSlot 
            k="2" 
            icon="✨" 
            name="Especial" 
            cooldown={(stats as any).cooldowns?.special}
            onClick={() => engineRef.current?.executeAction('special')} 
          />
          <ActionSlot 
            k="3" 
            icon={stats.activePower === 'fireball' ? "🔥" : stats.activePower === 'vortex' ? "🌀" : "🛡️"} 
            name={stats.activePower.toUpperCase()} 
            cooldown={(stats as any).cooldowns?.activePower}
            onClick={() => engineRef.current?.executeAction('active_power')} 
          />
          <ActionSlot 
            k="4" 
            icon="💊" 
            name="Cura" 
            onClick={() => engineRef.current?.executeAction('potion_hp')} 
          />
          <ActionSlot 
            k="5" 
            icon="🧪" 
            name="Mana" 
            onClick={() => engineRef.current?.executeAction('potion_mp')} 
          />
          <ActionSlot 
            k="6" 
            icon="⭐" 
            name="ULTIMATE" 
            cooldown={(stats as any).cooldowns?.ultimate}
            onClick={() => engineRef.current?.executeAction('ultimate')} 
          />
          <ActionSlot 
            k="G" 
            icon="📖" 
            name="GATMÓRIO" 
            onClick={() => setIsGatmorioOpen(true)} 
          />
        </footer>
      )}
      <Gatmorio 
        isOpen={isGatmorioOpen} 
        onClose={() => setIsGatmorioOpen(false)} 
      />
    </main>
  );
}

function StatRow({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex justify-between mb-1 text-[11px] font-mono">
      <span className="opacity-80">{label}</span>
      <span className="text-[#ffcc33] font-bold">{value}</span>
    </div>
  );
}

function DropSlot({ icon }: { icon: string }) {
  return (
    <div className="bg-[#1a1423] h-10 border border-[#4d3d60] flex items-center justify-center text-lg hover:border-[#a388ee] transition-colors cursor-pointer">
      {icon}
    </div>
  );
}

function ActionSlot({ k, icon, name, onClick, cooldown }: { k: string; icon: string | React.ReactNode; name: string; onClick?: () => void; cooldown?: number }) {
  return (
    <button 
      onClick={onClick}
      className="relative flex flex-col items-center justify-center bg-black/40 border-2 border-[#4d3d60] p-2 rounded-lg hover:border-[#ffcc33] group transition-all active:scale-95"
    >
      <div className="text-2xl mb-1 group-hover:scale-110 transition-transform">{icon}</div>
      <div className="text-[9px] font-black text-white/40 uppercase tracking-tighter truncate w-full text-center">{name}</div>
      <div className="absolute top-1 right-1 text-[8px] font-mono text-[#ffcc33] opacity-60 bg-black/50 px-1 rounded">{k}</div>
      
      {cooldown !== undefined && cooldown > 0 && (
        <div className="absolute inset-0 bg-black/80 flex items-center justify-center rounded-lg overflow-hidden">
          <span className="text-white font-black text-sm">{Math.ceil(cooldown / 1000)}s</span>
          <motion.div 
            initial={{ scaleY: 1 }}
            animate={{ scaleY: 0 }}
            transition={{ duration: cooldown / 1000, ease: 'linear' }}
            className="absolute inset-0 bg-white/10 origin-bottom"
          />
        </div>
      )}
    </button>
  );
}

function MobileActionButton({ icon, onClick }: { icon: string; onClick: () => void }) {
  return (
    <button 
      onTouchStart={onClick}
      className="w-12 h-12 rounded-full bg-black/40 border-2 border-[#4d3d60] flex items-center justify-center text-xl active:scale-90 active:border-[#a388ee] transition-all"
    >
      {icon}
    </button>
  );
}
