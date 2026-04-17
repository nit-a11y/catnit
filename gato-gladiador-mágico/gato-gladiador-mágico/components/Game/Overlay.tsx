'use client';

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sword, Wand2, Shield, Zap, Heart, Trophy, User, Target, FlaskConical, Cloud, Settings, X } from 'lucide-react';

interface OverlayProps {
  state: 'menu' | 'playing' | 'upgrade' | 'gameover' | 'paused';
  score: number;
  level: number;
  upgrades: any[];
  isInstallable?: boolean;
  onInstall?: () => void;
  onStart: (characterType: string, petType: string, powerType: string) => void;
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
  isInstallable,
  onInstall,
  onStart, 
  onRestart, 
  onSelectUpgrade,
  onResume,
  onSwitchCharacter
}) => {
  const [selectionStep, setSelectionStep] = React.useState<'title' | 'character' | 'pet' | 'power' | 'settings'>('title');
  const [selectedCharacter, setSelectedCharacter] = React.useState('bulky');
  const [selectedPet, setSelectedPet] = React.useState('cloud');
  const [selectedPower, setSelectedPower] = React.useState('fireball');

  const handleStart = () => {
    onStart(selectedCharacter, selectedPet, selectedPower);
    setSelectionStep('title');
  };

  return (
    <AnimatePresence>
      {state === 'menu' && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-[#1a1423]/95 flex flex-col items-center justify-center z-[100] p-4 text-center overflow-y-auto"
        >
          {selectionStep === 'title' && (
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="flex flex-col items-center">
              <motion.h1 
                initial={{ y: -50 }}
                animate={{ y: 0 }}
                className="text-4xl md:text-6xl font-black text-[#ffcc33] mb-2 tracking-tighter italic uppercase"
                style={{ textShadow: '4px 4px #4d3d60' }}
              >
                GATO GLADIADOR <span className="text-[#a388ee]">MÁGICO</span>
              </motion.h1>
              <p className="text-[#f0f0f0]/70 mb-8 font-mono uppercase tracking-widest text-xs">O Coliseu dos Felinos Bombados</p>
              
              <div className="flex flex-col gap-4 w-full max-w-xs">
                <button 
                  onClick={() => setSelectionStep('character')}
                  className="btn-primary py-4 px-8 text-xl animate-bounce-in"
                >
                  INICIAR BATALHA
                </button>
                <button 
                  onClick={() => setSelectionStep('settings')}
                  className="bg-[#2d1e3e] text-white/70 py-2 border-2 border-[#4d3d60] hover:border-[#ffcc33] transition-all flex items-center justify-center gap-2 uppercase font-bold text-sm"
                >
                  <Settings size={16} /> Configurações
                </button>
              </div>
            </motion.div>
          )}

          {selectionStep === 'character' && (
            <motion.div initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} className="w-full max-w-2xl">
              <h2 className="text-3xl font-black text-[#ffcc33] mb-6 italic uppercase">Escolha seu Gladiador</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                <SelectionCard 
                  title="Gato Bárbaro" 
                  desc="+Vida e Dano Brutal" 
                  icon={<Trophy className="text-[#ffcc33]" />} 
                  selected={selectedCharacter === 'bulky'} 
                  onClick={() => setSelectedCharacter('bulky')} 
                />
                <SelectionCard 
                  title="Gato Ninja" 
                  desc="+Velocidade e Crítico" 
                  icon={<Zap className="text-yellow-400" />} 
                  selected={selectedCharacter === 'ninja'} 
                  onClick={() => setSelectedCharacter('ninja')} 
                />
                <SelectionCard 
                  title="Gato Sacerdote" 
                  desc="Magia e Regeneração de Mana" 
                  icon={<Wand2 className="text-[#4cc9f0]" />} 
                  selected={selectedCharacter === 'mage'} 
                  onClick={() => setSelectedCharacter('mage')} 
                />
              </div>
              <button 
                onClick={() => setSelectionStep('pet')}
                className="bg-[#ffcc33] text-[#1a1423] font-black py-3 px-12 border-b-4 border-[#4d3d60] hover:bg-[#a388ee] hover:text-white transition-all transform hover:scale-105 active:scale-95 uppercase tracking-tighter"
              >
                PRÓXIMO
              </button>
            </motion.div>
          )}

          {selectionStep === 'pet' && (
            <motion.div initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} className="w-full max-w-2xl">
              <h2 className="text-3xl font-black text-[#ffcc33] mb-6 italic uppercase">Escolha seu Acompanhante</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                <SelectionCard 
                  title="Nuvem d'Água" 
                  desc="Ataques Teleguiados & Paralisia" 
                  icon={<Cloud className="text-[#4cc9f0]" />} 
                  selected={selectedPet === 'cloud'} 
                  onClick={() => setSelectedPet('cloud')} 
                />
                <SelectionCard 
                  title="Nenhum" 
                  desc="Desafio Hardcore!" 
                  icon={<X className="text-gray-500" />} 
                  selected={selectedPet === 'none'} 
                  onClick={() => setSelectedPet('none')} 
                />
              </div>
              <div className="flex gap-4 justify-center">
                <button 
                  onClick={() => setSelectionStep('character')}
                  className="bg-[#2d1e3e] text-white font-bold py-3 px-8 border-b-4 border-black/30 opacity-70 hover:opacity-100 transition-all uppercase"
                >
                  VOLTAR
                </button>
                <button 
                  onClick={() => setSelectionStep('power')}
                  className="bg-[#ffcc33] text-[#1a1423] font-bold py-3 px-12 border-b-4 border-[#4d3d60] hover:bg-[#a388ee] hover:text-white transition-all transform hover:scale-105 active:scale-95 uppercase text-xl"
                >
                  PRÓXIMO
                </button>
              </div>
            </motion.div>
          )}

          {selectionStep === 'power' && (
            <motion.div initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} className="w-full max-w-2xl">
              <h2 className="text-3xl font-black text-[#ffcc33] mb-6 italic uppercase tracking-tighter">Escolha seu Poder Escalar</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                <SelectionCard 
                  title="Bola de Fogo" 
                  desc="Dano Explosivo em Área" 
                  icon={<div className="text-3xl">🔥</div>} 
                  selected={selectedPower === 'fireball'} 
                  onClick={() => setSelectedPower('fireball')} 
                />
                <SelectionCard 
                  title="Vórtice Miau" 
                  desc="Controle de Grupo & Sugação" 
                  icon={<div className="text-3xl">🌀</div>} 
                  selected={selectedPower === 'vortex'} 
                  onClick={() => setSelectedPower('vortex')} 
                />
                <SelectionCard 
                  title="Escudo Solar" 
                  desc="Imunidade Temporária" 
                  icon={<div className="text-3xl">✨</div>} 
                  selected={selectedPower === 'shield'} 
                  onClick={() => setSelectedPower('shield')} 
                />
              </div>
              <div className="flex gap-4 justify-center">
                <button 
                  onClick={() => setSelectionStep('pet')}
                  className="bg-[#2d1e3e] text-white font-bold py-3 px-8 border-b-4 border-black/30 opacity-70 hover:opacity-100 transition-all uppercase"
                >
                  VOLTAR
                </button>
                <button 
                  onClick={handleStart}
                  className="bg-[#ffcc33] text-[#1a1423] font-bold py-3 px-12 border-b-4 border-[#4d3d60] hover:bg-[#a388ee] hover:text-white transition-all transform hover:scale-105 active:scale-95 uppercase text-xl"
                >
                  BATALHAR!
                </button>
              </div>
            </motion.div>
          )}

          {selectionStep === 'settings' && (
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="panel p-8 w-full max-w-md bg-[#2d1e3e]">
              <h2 className="text-3xl font-black text-[#ffcc33] mb-6 italic uppercase flex items-center justify-center gap-3">
                <Settings size={24} /> Ajustes
              </h2>
              <div className="flex flex-col gap-6 mb-8 text-left">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white uppercase text-sm">Som Master</span>
                  <input type="range" className="accent-[#ffcc33]" />
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white uppercase text-sm">Efeitos Visuais</span>
                  <input type="checkbox" defaultChecked className="w-6 h-6 accent-[#ffcc33]" />
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white uppercase text-sm">Controles Mobile</span>
                  <input type="checkbox" defaultChecked className="w-6 h-6 accent-[#ffcc33]" />
                </div>
                {isInstallable && (
                  <button 
                    onClick={onInstall}
                    className="w-full bg-[#ffcc33] text-[#1a1423] font-black py-4 border-2 border-white flex items-center justify-center gap-3 hover:scale-105 transition-all text-lg animate-pulse"
                  >
                    🚀 INSTALAR JOGO OFFLINE
                  </button>
                )}
              </div>
              <button 
                onClick={() => setSelectionStep('title')}
                className="w-full bg-[#3d3051] text-white font-bold py-3 border-b-4 border-black/30 hover:bg-[#a388ee] transition-all uppercase"
              >
                VOLTAR AO MENU
              </button>
            </motion.div>
          )}
        </motion.div>
      )}

      {state === 'paused' && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-[#1a1423]/95 backdrop-blur-md flex flex-col items-center justify-center z-50 p-8 overflow-y-auto"
        >
          <h2 className="text-4xl md:text-5xl font-black text-[#a388ee] mb-4 md:mb-8 italic uppercase outline-text">PAUSA TÁTICA</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 w-full max-w-4xl mb-6 md:mb-12">
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

          <div className="flex flex-col gap-4 w-full max-w-sm">
            {isInstallable && (
              <button 
                onClick={onInstall}
                className="w-full bg-gradient-to-r from-[#ffcc33] to-[#ff9900] text-[#1a1423] font-black py-3 px-6 border-b-4 border-black/30 hover:scale-105 transition-all flex items-center justify-center gap-2 uppercase italic text-sm"
              >
                🎁 Instalar Gato Gladiador (Offline)
              </button>
            )}
            <button 
              onClick={onResume}
              className="panel bg-[#ffcc33] text-[#1a1423] font-bold py-4 px-12 border-b-4 border-[#4d3d60] hover:bg-[#a388ee] hover:text-white transition-all transform hover:scale-105 active:scale-95 text-xl md:text-2xl uppercase"
            >
              VOLTAR AO COMBATE
            </button>
          </div>
        </motion.div>
      )}

      {state === 'upgrade' && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-[#2d1e3e]/60 backdrop-blur-sm flex flex-col items-center justify-center z-[70] p-8"
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
          className="absolute inset-0 bg-[#ff4d6d]/80 flex flex-col items-center justify-center z-[70] p-8 text-center"
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

function SelectionCard({ title, desc, icon, selected, onClick }: { title: string, desc: string, icon: React.ReactNode, selected: boolean, onClick: () => void }) {
  return (
    <motion.div 
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={`selection-card cursor-pointer ${selected ? 'selected' : ''}`}
    >
      <div className="text-4xl mb-4 group-hover:scale-110 transition-transform flex justify-center">
        {icon}
      </div>
      <h3 className="text-lg font-bold text-[#ffcc33] mb-2 uppercase text-center">{title}</h3>
      <p className="text-[10px] text-white/60 font-mono text-center uppercase">{desc}</p>
    </motion.div>
  );
}

function CharacterCard({ name, type, desc, icon, onSelect }: { name: string, type: string, desc: string, icon: React.ReactNode, onSelect: (t: string) => void }) {
  return (
    <motion.div 
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={() => onSelect(type)}
      className="selection-card cursor-pointer"
    >
      <div className="text-4xl mb-4 group-hover:scale-110 transition-transform flex justify-center">
        {icon}
      </div>
      <h3 className="text-lg font-bold text-[#ffcc33] mb-2 uppercase text-center">{name}</h3>
      <p className="text-[10px] text-white/60 font-mono text-center uppercase">{desc}</p>
    </motion.div>
  );
}

export default Overlay;
