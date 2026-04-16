'use client';

import React, { useState, useEffect } from 'react';
import GameContainer from '@/components/Game/GameContainer';
import { Sword, Wand2, Shield, Zap, Heart, Trophy, User, Package, Zap as ManaIcon, Target } from 'lucide-react';

export default function Home() {
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
    lifeSteal: 0,
    bleedChance: 0
  });

  return (
    <main className="h-screen w-screen grid grid-cols-[260px_1fr_260px] grid-rows-[100px_1fr_140px] gap-3 p-3 bg-[#1a1423]">
      {/* HEADER */}
      <header className="panel col-span-3 flex justify-between items-center px-6">
        <div className="flex flex-col gap-2 w-[300px]">
          <div className="h-6 bg-black border-2 border-[#4d3d60] relative overflow-hidden">
            <div 
              className="h-full bg-[#ff4d6d] transition-all duration-300" 
              style={{ width: `${Math.max(0, (stats.hp / stats.maxHp) * 100)}%` }}
            />
            <span className="absolute inset-0 flex items-center px-2 text-[10px] font-bold uppercase text-white drop-shadow-[1px_1px_#000]">
              HP: {stats.hp} / {stats.maxHp}
            </span>
          </div>
          <div className="h-6 bg-black border-2 border-[#4d3d60] relative overflow-hidden">
            <div 
              className="h-full bg-[#4cc9f0] transition-all duration-300" 
              style={{ width: `${Math.max(0, (stats.mp / stats.maxMp) * 100)}%` }}
            />
            <span className="absolute inset-0 flex items-center px-2 text-[10px] font-bold uppercase text-white drop-shadow-[1px_1px_#000]">
              MP: {stats.mp} / {stats.maxMp}
            </span>
          </div>
        </div>

        <div className="text-center">
          <div className="text-2xl font-bold text-[#ffcc33] uppercase">RODADA {stats.wave}</div>
          <div className="text-[10px] opacity-70 uppercase">Monstros Restantes: {stats.enemiesLeft}</div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-[#ffcc33] font-bold uppercase text-[10px]">Arma Atual</div>
            <div className="text-white font-bold uppercase text-[14px]">{stats.weapon}</div>
          </div>
          <div className="h-10 w-10 border-2 border-[#ffcc33] flex items-center justify-center bg-black/40">
             {stats.weapon === 'magic' && <Zap size={20} className="text-[#a388ee]" />}
             {stats.weapon === 'pistol' && <Target size={20} className="text-[#ff4d6d]" />}
             {stats.weapon === 'knife' && <Sword size={20} className="text-[#cccccc]" />}
          </div>
        </div>

        <div className="text-right">
          <div className="text-[#ffcc33] font-bold">Level {stats.level}</div>
          <div className="text-[11px] uppercase opacity-80">Gato Bombado Mago</div>
        </div>
      </header>

      {/* LEFT SIDEBAR */}
      <aside className="panel flex flex-col gap-4 p-4 overflow-y-auto">
        <div>
          <h2 className="text-[12px] border-b-2 border-[#4d3d60] pb-1 mb-3 text-[#a388ee] uppercase font-bold flex items-center gap-2">
            <User size={14} /> Atributos Físicos
          </h2>
          <StatRow label="Força" value={stats.strength} />
          <StatRow label="Definição" value={stats.definition} />
          <StatRow label="Resistência" value={stats.stamina} />
          <StatRow label="Agilidade" value={stats.agility} />
        </div>

        <div>
          <h2 className="text-[12px] border-b-2 border-[#4d3d60] pb-1 mb-3 text-[#a388ee] uppercase font-bold flex items-center gap-2">
            <ManaIcon size={14} /> Poderes Mágicos
          </h2>
          <StatRow label="Inteligência" value={stats.intelligence} />
          <StatRow label="Mana Regen" value={`+${stats.manaRegen}/s`} />
          <StatRow label="Arcano" value={stats.arcane} />
        </div>

        <div>
          <h2 className="text-[12px] border-b-2 border-[#4d3d60] pb-1 mb-3 text-[#ff4d6d] uppercase font-bold flex items-center gap-2">
            <Shield size={14} /> Efeitos Especiais
          </h2>
          <StatRow label="Life Steal" value={`+${stats.lifeSteal} HP/Kill`} />
          <StatRow label="Sangramento" value={`${Math.floor(stats.bleedChance * 100)}%`} />
        </div>
      </aside>

      {/* ARENA */}
      <section className="relative border-[6px] border-[#3d3051] bg-[radial-gradient(circle,#3d3051_0%,#1a1423_100%)] overflow-hidden flex items-center justify-center">
        <div className="absolute inset-0 opacity-20 pointer-events-none">
          <div className="w-full h-full border-[1px] border-dashed border-[#a388ee] rounded-full animate-[spin_20s_linear_infinite]" />
        </div>
        <div className="w-full h-full relative z-10">
          <GameContainer onStatsUpdate={setStats} />
        </div>
        <div className="absolute bottom-4 right-4 bg-black/50 px-3 py-1 text-[10px] uppercase tracking-widest pointer-events-none flex flex-col items-end gap-1">
          <div>Arena: Coliseum of Meow-gic</div>
          <div className="text-[#a388ee]">Click Esquerdo: Atirar</div>
          <div className="text-[#ffcc33]">Espaço: Garras</div>
          <div className="text-[#4cc9f0]">Click Direito: Especial (Mana)</div>
        </div>
      </section>

      {/* RIGHT SIDEBAR */}
      <aside className="panel flex flex-col gap-4 p-4 overflow-y-auto">
        <div>
          <h2 className="text-[12px] border-b-2 border-[#4d3d60] pb-1 mb-3 text-[#a388ee] uppercase font-bold flex items-center gap-2">
            <Package size={14} /> Inventário
          </h2>
          <StatRow label="Garras de Ferro" value="Equipado" />
          <StatRow label="Manto de Cetim" value="Equipado" />
          <StatRow label="Anel Arcano" value="Lvl 3" />
        </div>

        <div className="mt-auto">
          <h2 className="text-[12px] border-b-2 border-[#4d3d60] pb-1 mb-3 text-[#a388ee] uppercase font-bold">
            Próximos Drops
          </h2>
          <div className="grid grid-cols-2 gap-2">
            <DropSlot icon="🛡️" />
            <DropSlot icon="⚡" />
            <DropSlot icon="🧪" />
            <DropSlot icon="🍗" />
          </div>
        </div>
      </aside>

      {/* FOOTER ACTION BAR */}
      <footer className="panel col-span-3 grid grid-cols-8 gap-2 p-2">
        <ActionSlot k="1" icon="⚔️" name="Golpe Brutal" selected />
        <ActionSlot k="2" icon="🔥" name="Bola de Fogo" />
        <ActionSlot k="3" icon="🌀" name="Vórtice" />
        <ActionSlot k="4" icon="✨" name="Escudo Luz" />
        <ActionSlot k="5" icon="💊" name="Poção Vida" />
        <ActionSlot k="6" icon="🧪" name="Poção Mana" />
        <ActionSlot k="7" icon="⭐" name="Ultimate" />
        <ActionSlot k="M" icon="🗺️" name="Mapa" />
      </footer>
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

function ActionSlot({ k, icon, name, selected = false }: { k: string; icon: string; name: string; selected?: boolean }) {
  return (
    <div className={`
      relative flex flex-col items-center justify-center border-[3px] transition-all cursor-pointer
      ${selected ? 'border-[#ffcc33] bg-[#2d2642]' : 'border-[#4d3d60] bg-[#1a1423] hover:border-[#a388ee]'}
    `}>
      <span className="absolute top-1 right-1.5 text-[8px] text-gray-500 font-bold">{k}</span>
      <span className="text-2xl mb-1">{icon}</span>
      <span className="text-[8px] uppercase opacity-70 text-center px-1">{name}</span>
    </div>
  );
}
