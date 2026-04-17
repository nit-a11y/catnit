export interface LoreItem {
  id: string;
  name: string;
  type: string;
  icon: string;
  description: string;
  lore: string;
  stats?: { [key: string]: string | number };
}

export const GATMORIO_DATA: {
  weapons: LoreItem[];
  powers: LoreItem[];
  enemies: LoreItem[];
} = {
  weapons: [
    {
      id: 'magic',
      name: 'Cajado Arcano',
      type: 'Magia',
      icon: '🪄',
      description: 'Lança esferas de energia mágica purpurinada.',
      lore: 'Forjado a partir do galho da Árvore de Catnip Ancestral, este cajado ressoa com a frequência de ronronares cósmicos.',
      stats: { 'Dano': 'Baseado em Inteligência', 'Velocidade': 'Média', 'Efeito': 'Teleguiado' }
    },
    {
      id: 'pistol',
      name: 'Gato-Glock',
      type: 'Distância',
      icon: '🔫',
      description: 'Uma arma de fogo rápida para gatos que preferem manter distância.',
      lore: 'Encontrada nos restos de um antigo navio pirata felino, esta arma foi adaptada para usar atum comprimido como munição.',
      stats: { 'Dano': 'Alto', 'Cadência': 'Rápida', 'Efeito': 'Dano Físico' }
    },
    {
      id: 'knife',
      name: 'Garras de Prata (Facas)',
      type: 'Arremesso',
      icon: '🔪',
      description: 'Lâminas afiadas que cortam o ar e os inimigos.',
      lore: 'Originalmente pertenceram ao Clã das Patas Silenciosas. São feitas de uma liga metálica que nunca perde o fio.',
      stats: { 'Dano': 'Médio', 'Cadência': 'Média', 'Efeito': 'Possibilidade de Sangramento' }
    }
  ],
  powers: [
    {
      id: 'fireball',
      name: 'Bola de Fogo',
      type: 'Habilidade Ativa',
      icon: '🔥',
      description: 'Um projétil explosivo de calor escaldante.',
      lore: 'Dizem que o primeiro gato a usar este poder estava tentando secar o pelo após um banho forçado. O resultado foi explosivo.',
      stats: { 'Custo': '25 MP', 'Dano': '200% Inteligência' }
    },
    {
      id: 'vortex',
      name: 'Vórtice Miau',
      type: 'Controle de Grupo',
      icon: '🌀',
      description: 'Cria um remoinho que suga e causa dano contínuo.',
      lore: 'Inspirado no comportamento de perseguir a própria cauda em velocidades transcendentais.',
      stats: { 'Custo': '35 MP', 'Dano': '50% Arcano por Segundo' }
    },
    {
      id: 'shield',
      name: 'Escudo Solar',
      type: 'Defesa',
      icon: '✨',
      description: 'Uma barreira de luz que bloqueia todo o dano por 5 segundos.',
      lore: 'O gato canaliza a energia de tirar uma soneca sob um raio de sol para criar uma proteção impenetrável.',
      stats: { 'Custo': '30 MP', 'Duração': '5 segundos' }
    },
    {
      id: 'ultimate',
      name: 'Miau-calipse',
      type: 'Suprema',
      icon: '⭐',
      description: 'Chama uma chuva de meteoros felinos em toda a arena.',
      lore: 'A lenda diz que quando sete gatos ronronam em uníssono sob a lua cheia, o céu se abre em fúria felina.',
      stats: { 'Custo': '80 MP', 'Dano': '1000% Inteligência' }
    },
    {
      id: 'melee',
      name: 'Golpe Brutal',
      type: 'Habilidade Passiva/Ativa',
      icon: '⚔️',
      description: 'Um golpe devastador de curto alcance.',
      lore: 'Às vezes, a melhor magia é uma patada bem dada.',
      stats: { 'Custo': '0 MP', 'Dano': '300% Força', 'Cooldown': '0.4s' }
    }
  ],
  enemies: [
    {
      id: 'standard',
      name: 'Rato de Esgoto',
      type: 'Básico',
      icon: '🐭',
      description: 'Um rato comum que invadiu o território felino.',
      lore: 'Estes ratos foram corrompidos por uma dieta à base de lixo radioativo e audácia excessiva.',
      stats: { 'Vida': 'Baixa', 'Ameaça': '1/5' }
    },
    {
      id: 'tank',
      name: 'Rato Alquimista (Tank)',
      type: 'Resistente',
      icon: '🐹',
      description: 'Grande, pesado e com pele blindada por poções.',
      lore: 'Bebeu poções de crescimento para revidar os abusos sofridos nos laboratórios de testes de cosméticos.',
      stats: { 'Vida': 'Muito Alta', 'Dano': 'Médio', 'Ameaça': '3/5' }
    },
    {
      id: 'boss',
      name: 'Rei Rato',
      type: 'Chefe',
      icon: '👑',
      description: 'O líder supremo da invasão roedora.',
      lore: 'A lenda diz que ele é a personificação do medo que os gatos sentem de ficar sem catnip.',
      stats: { 'Vida': 'Imensa', 'Dano': 'Letal', 'Ameaça': '5/5' }
    }
  ]
};
