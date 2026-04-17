'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Book, X, Sword, Zap, Skull, Shield, Info, History } from 'lucide-react';
import { GATMORIO_DATA, LoreItem } from '@/lib/game/lore';

interface GatmorioProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Gatmorio({ isOpen, onClose }: GatmorioProps) {
  const [activeTab, setActiveTab] = useState<'weapons' | 'powers' | 'enemies'>('weapons');
  const [selectedItem, setSelectedItem] = useState<LoreItem | null>(GATMORIO_DATA.weapons[0]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#1a1423]/90 backdrop-blur-md"
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            className="w-full max-w-5xl h-[85vh] bg-[#2d1e3e] border-[6px] border-[#4d3d60] shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col relative"
          >
            {/* Header */}
            <div className="bg-[#4d3d60] p-4 flex justify-between items-center border-b-[4px] border-black/20">
              <div className="flex items-center gap-3">
                <div className="bg-[#ffcc33] p-2 rounded-lg">
                  <Book size={24} className="text-[#1a1423]" />
                </div>
                <h1 className="text-3xl font-black text-[#ffcc33] italic uppercase tracking-tighter">Gatmório Ancestral</h1>
              </div>
              <button 
                onClick={onClose}
                className="p-2 hover:bg-white/10 rounded-full transition-colors text-white/60 hover:text-white"
              >
                <X size={32} />
              </button>
            </div>

            <div className="flex-1 flex overflow-hidden">
              {/* Sidebar Tabs */}
              <div className="w-20 md:w-64 bg-black/30 border-r-[4px] border-black/10 flex flex-col">
                <TabButton 
                  active={activeTab === 'weapons'} 
                  icon={<Sword size={20} />} 
                  label="Armas" 
                  onClick={() => { setActiveTab('weapons'); setSelectedItem(GATMORIO_DATA.weapons[0]); }} 
                />
                <TabButton 
                  active={activeTab === 'powers'} 
                  icon={<Zap size={20} />} 
                  label="Poderes" 
                  onClick={() => { setActiveTab('powers'); setSelectedItem(GATMORIO_DATA.powers[0]); }} 
                />
                <TabButton 
                  active={activeTab === 'enemies'} 
                  icon={<Skull size={20} />} 
                  label="Bestiário" 
                  onClick={() => { setActiveTab('enemies'); setSelectedItem(GATMORIO_DATA.enemies[0]); }} 
                />
                
                <div className="mt-auto p-4 hidden md:block">
                  <div className="text-[10px] text-[#a388ee] font-black uppercase tracking-[0.2em] mb-1">Status do Registro</div>
                  <div className="text-white/40 text-[9px] uppercase">Acesso concedido pela喵-munity</div>
                </div>
              </div>

              {/* List Area */}
              <div className="w-48 md:w-80 bg-black/20 overflow-y-auto p-2 border-r-[2px] border-white/5">
                {GATMORIO_DATA[activeTab].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setSelectedItem(item)}
                    className={`
                      w-full text-left p-4 mb-2 border-2 transition-all flex items-center gap-3 group
                      ${selectedItem?.id === item.id 
                        ? 'border-[#ffcc33] bg-[#ffcc33]/10 text-[#ffcc33]' 
                        : 'border-[#4d3d60] hover:border-[#a388ee] text-white/70 hover:text-white'}
                    `}
                  >
                    <span className="text-3xl group-hover:scale-110 transition-transform">{item.icon}</span>
                    <span className="font-black uppercase italic tracking-tighter text-sm md:text-base truncate">{item.name}</span>
                  </button>
                ))}
              </div>

              {/* Detail Area */}
              <div className="flex-1 overflow-y-auto bg-[radial-gradient(circle_at_center,#2d1e3e_0%,#1a1423_100%)] p-6 md:p-10 relative">
                {selectedItem ? (
                  <motion.div
                    key={selectedItem.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="space-y-8"
                  >
                    <div className="flex flex-col md:flex-row gap-6 items-start">
                      <div className="w-24 h-24 md:w-32 md:h-32 bg-[#ffcc33]/20 border-4 border-[#ffcc33] rounded-2xl flex items-center justify-center text-6xl shadow-[0_0_30px_rgba(255,204,51,0.2)]">
                        {selectedItem.icon}
                      </div>
                      <div className="flex-1">
                        <div className="text-[#a388ee] font-bold uppercase tracking-[0.3em] text-xs mb-2">/ {selectedItem.type}</div>
                        <h2 className="text-4xl md:text-6xl font-black text-white italic uppercase tracking-tighter leading-none mb-4">{selectedItem.name}</h2>
                        <p className="text-[#ffcc33] text-lg font-bold leading-tight">{selectedItem.description}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      {/* Lore Section */}
                      <section className="bg-black/30 border-l-4 border-[#a388ee] p-5 rounded-r-xl">
                        <div className="flex items-center gap-2 text-[#a388ee] font-black uppercase text-xs mb-3 italic">
                          <History size={14} /> Fragmento de História
                        </div>
                        <p className="text-white/80 leading-relaxed italic text-sm md:text-base">
                          &quot;{selectedItem.lore}&quot;
                        </p>
                      </section>

                      {/* Stats Section */}
                      <section className="bg-black/30 border-l-4 border-[#ffcc33] p-5 rounded-r-xl">
                        <div className="flex items-center gap-2 text-[#ffcc33] font-black uppercase text-xs mb-3 italic">
                          <Info size={14} /> Dados Técnicos
                        </div>
                        <div className="space-y-3">
                          {Object.entries(selectedItem.stats || {}).map(([key, val]) => (
                            <div key={key} className="flex justify-between items-center border-b border-white/5 pb-1">
                              <span className="text-white/50 text-[10px] uppercase font-bold">{key}</span>
                              <span className="text-white font-black uppercase italic text-sm">{val}</span>
                            </div>
                          ))}
                        </div>
                      </section>
                    </div>

                    {/* Footer decoration */}
                    <div className="pt-10 flex border-t border-white/5 gap-4 opacity-20">
                      {[1, 2, 3, 4, 5].map(i => (
                        <div key={i} className="h-1 flex-1 bg-white/20 rounded-full" />
                      ))}
                    </div>
                  </motion.div>
                ) : (
                  <div className="h-full flex items-center justify-center text-white/20 font-black uppercase italic text-4xl">
                    Selecione um Registro
                  </div>
                )}
              </div>
            </div>
            
            {/* Action Bar */}
            <div className="bg-[#1a1423] p-4 flex justify-end border-t-2 border-white/5">
              <button 
                onClick={onClose}
                className="bg-[#ffcc33] text-[#1a1423] font-black px-8 py-3 uppercase italic tracking-tighter hover:bg-[#a388ee] hover:text-white transition-all transform active:scale-95"
              >
                Retornar ao Mundo
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function TabButton({ active, icon, label, onClick }: { active: boolean; icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`
        relative flex flex-col md:flex-row items-center gap-4 p-5 md:px-6 md:py-5 transition-all
        ${active ? 'bg-[#ffcc33] text-[#1a1423]' : 'text-white/50 hover:text-white hover:bg-white/5'}
      `}
    >
      {active && (
        <motion.div 
          layoutId="tab-active" 
          className="absolute inset-x-0 bottom-0 h-1 md:h-auto md:w-1 md:inset-y-0 md:left-0 bg-white"
        />
      )}
      <div className={`${active ? 'scale-125' : ''} transition-transform`}>
        {icon}
      </div>
      <span className="font-black uppercase italic tracking-tighter text-[10px] md:text-lg hidden md:block">
        {label}
      </span>
    </button>
  );
}
