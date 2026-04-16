'use client';

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sword, Wand2, Shield, Zap, Heart, Trophy, User, Target, FlaskConical } from 'lucide-react';

interface OverlayProps {
  state: 'menu' | 'playing' | 'upgrade' | 'gameover' | 'paused';
  score: number;
  level: number;
  upgrades: any[];
  onStart: () => void;
  onRestart: () => void;
  onSelectUpgrade: (upgrade: any) => void;
  onResume: () => void;
  onSwitchCharacter: (type: string) => void;
}

const Overlay: React.FC<OverlayProps> = ({ 
  state, 
  score, 
  level, 
  upgrades, 
  onStart, 
  onRestart, 
  onSelectUpgrade,
  onResume,
  onSwitchCharacter
}) => {
  return (
    <AnimatePresence>
      {state === 'paused' && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-[#1a1423]/95 backdrop-blur-md flex flex-col items-center justify-center z-50 p-8"
        >
          <h2 className="text-5xl font-black text-[#a388ee] mb-8 italic uppercase outline-text">PAUSA TÁTICA</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl mb-12">
            <CharacterCard 
              name="Gato Bárbaro" 
              type="bulky" 
              desc="+Força & +Vida" 
              icon={<Trophy className="text-[#ffcc33]" />} 
              onSelect={onSwitchCharacter} 
            />
            <CharacterCard 
              name="Gato Ninja" 
              type="ninja" 
              desc="+Velocidade & +Sangramento" 
              icon={<Zap className="text-yellow-400" />} 
              onSelect={onSwitchCharacter} 
            />
            <CharacterCard 
              name="Gato Sacerdote" 
              type="mage" 
              desc="+Mana & +Inteligência" 
              icon={<Wand2 className="text-[#4cc9f0]" />} 
              onSelect={onSwitchCharacter} 
            />
          </div>

          <button 
            onClick={onResume}
            className="panel bg-[#ffcc33] text-[#1a1423] font-bold py-4 px-12 border-b-4 border-[#4d3d60] hover:bg-[#a388ee] hover:text-white transition-all transform hover:scale-110 active:scale-95 text-2xl uppercase"
          >
            VOLTAR AO COMBATE
          </button>
        </motion.div>
      )}

      {state === 'menu' && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-[#1a1423]/90 flex flex-col items-center justify-center z-10 p-8 text-center"
        >
          <motion.h1 
            initial={{ y: -50 }}
            animate={{ y: 0 }}
            className="text-6xl font-black text-[#ffcc33] mb-2 tracking-tighter italic uppercase"
            style={{ textShadow: '4px 4px #4d3d60' }}
          >
            GATO GLADIADOR <span className="text-[#a388ee]">MÁGICO</span>
          </motion.h1>
          <p className="text-[#f0f0f0]/70 mb-8 font-mono uppercase tracking-widest">O Coliseu dos Felinos Bombados</p>
          
          <div className="flex flex-col gap-4 w-full max-w-xs">
            <button 
              onClick={onStart}
              className="bg-[#ffcc33] text-[#1a1423] font-bold py-4 px-8 border-b-4 border-[#4d3d60] hover:bg-[#a388ee] hover:text-white transition-all transform hover:scale-105 active:scale-95 text-xl uppercase"
            >
              INICIAR BATALHA
            </button>
          </div>
        </motion.div>
      )}

      {state === 'upgrade' && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-[#2d1e3e]/60 backdrop-blur-sm flex flex-col items-center justify-center z-10 p-8"
        >
          <h2 className="text-4xl font-black text-[#ffcc33] mb-8 italic uppercase tracking-tighter">ESCOLHA SEU PODER!</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl">
            {upgrades.map((upgrade, i) => (
              <motion.button
                key={i}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: i * 0.1 }}
                onClick={() => onSelectUpgrade(upgrade)}
                className="bg-[#1a1423] border-4 border-[#4d3d60] p-6 hover:border-[#a388ee] hover:bg-[#2d1e3e] transition-all flex flex-col items-center text-center group"
              >
                <div className="w-16 h-16 bg-[#a388ee]/20 border-2 border-[#a388ee]/30 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  {upgrade.type.includes('attribute_str') && <Sword className="text-[#ffcc33] w-8 h-8" />}
                  {upgrade.type.includes('attribute_def') && <Shield className="text-green-400 w-8 h-8" />}
                  {upgrade.type.includes('attribute_sta') && <Heart className="text-[#ff4d6d] w-8 h-8" />}
                  {upgrade.type.includes('attribute_agi') && <Zap className="text-yellow-400 w-8 h-8" />}
                  {upgrade.type.includes('magic') && <Wand2 className="text-[#4cc9f0] w-8 h-8" />}
                  {upgrade.type.includes('mana') && <FlaskConical className="text-[#a388ee] w-8 h-8" />}
                  {upgrade.type.includes('pistol') && <Target className="text-[#ff0000] w-8 h-8" />}
                  {upgrade.type.includes('knife') && <Sword className="text-[#cccccc] w-8 h-8" />}
                  {upgrade.type.includes('lifesteal') && <Heart className="text-[#ff4d6d] w-8 h-8" />}
                  {upgrade.type.includes('bleed') && <Target className="text-red-500 w-8 h-8" />}
                </div>
                <h3 className="text-xl font-bold text-[#f0f0f0] mb-2 uppercase tracking-tight">{upgrade.name}</h3>
                <p className="text-[#f0f0f0]/60 text-sm font-mono">{upgrade.description}</p>
              </motion.button>
            ))}
          </div>
        </motion.div>
      )}

      {state === 'gameover' && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-[#ff4d6d]/80 flex flex-col items-center justify-center z-10 p-8 text-center"
        >
          <Trophy className="w-20 h-20 text-[#ffcc33] mb-4 animate-bounce" />
          <h2 className="text-6xl font-black text-white mb-2 italic uppercase">DERROTADO!</h2>
          <p className="text-white/80 mb-8 font-mono text-xl uppercase">
            Você sobreviveu até o Nível {level}<br/>
            Pontuação: {score}
          </p>
          <button 
            onClick={onRestart}
            className="bg-white text-[#ff4d6d] font-bold py-4 px-12 border-b-4 border-gray-300 hover:bg-gray-100 transition-all transform hover:scale-105 active:scale-95 text-xl uppercase"
          >
            TENTAR NOVAMENTE
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

function CharacterCard({ name, type, desc, icon, onSelect }: { name: string, type: string, desc: string, icon: React.ReactNode, onSelect: (t: string) => void }) {
  return (
    <motion.div 
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={() => onSelect(type)}
      className="bg-[#2d1e3e] border-4 border-[#4d3d60] p-6 cursor-pointer hover:border-[#ffcc33] group transition-all"
    >
      <div className="text-4xl mb-4 group-hover:scale-110 transition-transform flex justify-center">
        {icon}
      </div>
      <h3 className="text-lg font-bold text-[#ffcc33] mb-1 uppercase text-center">{name}</h3>
      <p className="text-[10px] text-white/60 font-mono text-center uppercase">{desc}</p>
    </motion.div>
  );
}

export default Overlay;
