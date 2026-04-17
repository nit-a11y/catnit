export type GameState = 'menu' | 'playing' | 'upgrade' | 'gameover' | 'paused';

interface EngineCallbacks {
  onStateChange: (state: GameState) => void;
  onScoreChange: (score: number) => void;
  onLevelChange: (level: number) => void;
  onStatsUpdate: (stats: any) => void;
  onUpgradeRequired: (upgrades: any[]) => void;
}

export class GameEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private callbacks: EngineCallbacks;
  private animationId: number | null = null;
  
  private state: GameState = 'menu';
  private score: number = 0;
  private level: number = 1;
  private xp: number = 0;
  private lastTime: number = 0;
  private totalGameTime: number = 0;
  
  private player: Player;
  private pet: Pet;
  private enemies: Enemy[] = [];
  private projectiles: Projectile[] = [];
  private enemyProjectiles: Projectile[] = [];
  private particles: Particle[] = [];
  private floatingTexts: FloatingText[] = [];
  private experienceGems: ExperienceGem[] = [];
  
  private keys: Set<string> = new Set();
  private mousePos = { x: 0, y: 0 };
  private joystickMove = { x: 0, y: 0 };
  
  private spawnTimer = 0;
  private spawnInterval = 1000; // Faster default
  private difficultyMultiplier = 1.0;
  
  private screenShake = 0;
  private lastBossTime = 0;
  
  // Sistema de câmera
  private camera = {
    x: 0,
    y: 0,
    zoom: 1.0,
    targetX: 0,
    targetY: 0,
    smoothFactor: 0.08
  };
  
  // Limites do mundo (maior que o canvas)
  private worldBounds = {
    width: 1600,
    height: 1200
  };

  constructor(canvas: HTMLCanvasElement, callbacks: EngineCallbacks) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.callbacks = callbacks;
    this.player = new Player(canvas.width / 2, canvas.height / 2);
    this.pet = new Pet(this.player.x - 40, this.player.y - 40);
    
    this.setupInput();
  }

  private setupInput() {
    window.addEventListener('keydown', (e) => {
      this.keys.add(e.code);
      
      if (e.code === 'Escape' || e.code === 'KeyP') {
        this.togglePause();
      }

      if (this.state === 'playing') {
        if (e.code === 'Digit1') this.executeAction('melee');
        if (e.code === 'Digit2') this.executeAction('fireball');
        if (e.code === 'Digit3') this.executeAction('vortex');
        if (e.code === 'Digit4') this.executeAction('shield');
        if (e.code === 'Digit5') this.executeAction('potion_hp');
        if (e.code === 'Digit6') this.executeAction('potion_mp');
        if (e.code === 'Digit7') this.executeAction('ultimate');
        if (e.code === 'KeyM') this.executeAction('map');
      }
    });
    window.addEventListener('keyup', (e) => this.keys.delete(e.code));
    
    this.canvas.addEventListener('mousemove', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      // Converter coordenadas de tela para coordenadas de mundo
      this.mousePos.x = ((e.clientX - rect.left) * (this.canvas.width / rect.width)) + this.camera.x;
      this.mousePos.y = ((e.clientY - rect.top) * (this.canvas.height / rect.height)) + this.camera.y;
    });

    this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
    
    this.canvas.addEventListener('mousedown', (e) => {
      if (this.state === 'playing') {
        if (e.button === 0) { // Left Click
          this.executeAction('shoot');
        } else if (e.button === 2) { // Right Click - Special
          this.executeAction('special');
        }
      }
    });
    
    window.addEventListener('keydown', (e) => {
      if (e.code === 'Space' && this.state === 'playing') {
        this.executeAction('melee');
      }
    });
  }

  public togglePause() {
    if (this.state === 'playing') {
      this.state = 'paused';
      this.callbacks.onStateChange('paused');
    } else if (this.state === 'paused') {
      this.state = 'playing';
      this.callbacks.onStateChange('playing');
      this.lastTime = performance.now();
      this.loop(this.lastTime);
    }
  }

  public setJoystickMove(x: number, y: number) {
    this.joystickMove.x = x;
    this.joystickMove.y = y;
  }

  public setCharacter(type: string) {
    this.player.switchCharacter(type);
    this.updateStats();
  }

  public setPet(type: string) {
    if (type === 'none') {
      this.pet = new Pet(-1000, -1000); // Hide offscreen
    } else {
      this.pet = new Pet(this.player.x - 40, this.player.y - 40);
    }
  }

  public setPower(type: string) {
    this.player.setActivePower(type);
  }

  private getNearestEnemy(): Enemy | null {
    if (this.enemies.length === 0) return null;
    let nearestDist = Infinity;
    let nearest: Enemy | null = null;
    for (const e of this.enemies) {
      const d = Math.sqrt((e.x - this.player.x)**2 + (e.y - this.player.y)**2);
      if (d < nearestDist) {
        nearestDist = d;
        nearest = e;
      }
    }
    return nearest;
  }

  public executeAction(action: string) {
    if (this.state !== 'playing') return;

    const floatingText = (t: string, c: string) => {
      this.floatingTexts.push(new FloatingText(this.player.x, this.player.y - 40, t, c));
    };

    const target = this.getNearestEnemy() || undefined;

    switch (action) {
      case 'shoot':
        if (this.player.shoot(this.mousePos, this.projectiles, target)) {
          this.screenShake = this.player.currentWeapon === 'pistol' ? 5 : 2;
        }
        break;
      case 'special':
        if (this.player.special(this.mousePos, this.projectiles, floatingText, target)) {
          this.screenShake = 15;
        }
        break;
      case 'dash': this.player.dash(this.joystickMove.x, this.joystickMove.y); break;
      case 'melee':
        if (this.player.melee(this.enemies, (enemy) => this.killEnemy(enemy))) {
          this.screenShake = 10;
        }
        break;
      case 'fireball':
        if (this.player.fireball(this.mousePos, this.projectiles, floatingText, target)) {
          this.screenShake = 8;
        }
        break;
      case 'vortex':
        if (this.player.vortex(this.mousePos, this.projectiles, floatingText, target)) {
          this.screenShake = 5;
        }
        break;
      case 'shield':
        this.player.activateShield(floatingText);
        break;
      case 'potion_hp':
        this.player.usePotionHP(floatingText);
        break;
      case 'potion_mp':
        this.player.usePotionMP(floatingText);
        break;
      case 'ultimate':
        if (this.player.useUltimate(this.enemies, (e) => this.killEnemy(e), floatingText)) {
          this.screenShake = 50;
        }
        break;
      case 'map':
        floatingText("RADAR ATIVADO!", "#ffcc33");
        // Visual effect: highlight enemies
        this.enemies.forEach(e => {
          this.createExplosion(e.x, e.y, '#ffcc33', 3);
        });
        break;
      case 'switch_weapon_magic':
        this.player.switchWeapon('magic');
        break;
      case 'switch_weapon_pistol':
        this.player.switchWeapon('pistol');
        break;
      case 'switch_weapon_knife':
        this.player.switchWeapon('knife');
        break;
      case 'active_power':
        if (this.player.activePower === 'fireball') this.executeAction('fireball');
        else if (this.player.activePower === 'vortex') this.executeAction('vortex');
        else if (this.player.activePower === 'shield') this.executeAction('shield');
        break;
    }
  }

  public start() {
    this.state = 'playing';
    if (this.animationId) cancelAnimationFrame(this.animationId);
    this.lastTime = performance.now();
    this.totalGameTime = 0;
    this.lastBossTime = 0;
    this.difficultyMultiplier = 1.0;
    this.loop(this.lastTime);
  }

  public reset() {
    this.score = 0;
    this.level = 1;
    this.xp = 0;
    this.player = new Player(this.canvas.width / 2, this.canvas.height / 2);
    this.pet = new Pet(this.player.x - 40, this.player.y - 40);
    this.enemies = [];
    this.projectiles = [];
    this.enemyProjectiles = [];
    this.particles = [];
    this.floatingTexts = [];
    this.experienceGems = [];
    this.spawnInterval = 1000;
    this.totalGameTime = 0;
    this.lastBossTime = 0;
    this.difficultyMultiplier = 1.0;
    this.callbacks.onScoreChange(0);
    this.callbacks.onLevelChange(1);
    this.updateStats();
  }

  public destroy() {
    if (this.animationId) cancelAnimationFrame(this.animationId);
  }

  public applyUpgrade(upgrade: any) {
    this.player.applyUpgrade(upgrade);
    this.state = 'playing';
    // Scalingdifficulty slightly after upgrade
    this.difficultyMultiplier += 0.1;
    this.updateStats();
    
    // Ensure loop restarts
    if (this.animationId) cancelAnimationFrame(this.animationId);
    this.lastTime = performance.now();
    this.loop(this.lastTime);
  }

  private updateStats() {
    this.callbacks.onStatsUpdate({
      hp: Math.floor(this.player.hp),
      maxHp: this.player.maxHp,
      mp: Math.floor(this.player.mp),
      maxMp: this.player.maxMp,
      level: this.level,
      wave: this.level,
      enemiesLeft: this.enemies.length,
      strength: this.player.strength,
      definition: this.player.definition,
      stamina: this.player.stamina,
      agility: Math.floor(this.player.speed * 100),
      intelligence: this.player.intelligence,
      manaRegen: this.player.manaRegen,
      arcane: this.player.arcane,
      weapon: this.player.currentWeapon,
      inventory: this.player.weaponInventory,
      character: this.player.characterClass,
      lifeSteal: this.player.lifeSteal,
      bleedChance: this.player.bleedChance,
      activePower: this.player.activePower,
      cooldowns: { ...this.player.cooldowns },
      xp: this.xp,
      score: this.score
    });
  }

  private loop(timestamp: number) {
    if (this.state !== 'playing') return;
    
    const deltaTime = Math.min(timestamp - this.lastTime, 100);
    this.lastTime = timestamp;
    this.totalGameTime += deltaTime;

    this.update(deltaTime);
    this.updateCamera();
    this.draw();

    this.animationId = requestAnimationFrame((t) => this.loop(t));
  }

  update(dt: number) {
    // Difficulty scaling
    this.difficultyMultiplier += dt / 60000; // Increases by 1 every minute
    this.spawnInterval = Math.max(200, 1000 / this.difficultyMultiplier);

    // Player movement
    let dx = this.joystickMove.x;
    let dy = this.joystickMove.y;
    if (this.keys.has('KeyW')) dy -= 1;
    if (this.keys.has('KeyS')) dy += 1;
    if (this.keys.has('KeyA')) dx -= 1;
    if (this.keys.has('KeyD')) dx += 1;
    
    this.player.update(dx, dy, dt, this.canvas.width, this.canvas.height);
    this.pet.update(this.player, this.enemies, this.projectiles, dt);

    // Archero Style: Stop to Shoot with Auto-Targeting
    const isMoving = Math.abs(dx) > 0.05 || Math.abs(dy) > 0.05;
    if (!isMoving && this.enemies.length > 0 && this.state === 'playing') {
      const target = this.getNearestEnemy() || undefined;
      if (target) {
        // Automatically aim at the nearest enemy when stopped
        this.mousePos = { x: target.x, y: target.y };
        this.executeAction('shoot');
      }
    }

    // Continuous Spawning
    this.spawnTimer += dt;
    if (this.spawnTimer > this.spawnInterval) {
      this.spawnEnemy();
      this.spawnTimer = 0;
    }

    // Boss Spawning (Every 1 minute now for more action)
    if (this.totalGameTime - this.lastBossTime > 60000) {
      this.spawnBoss();
      this.lastBossTime = this.totalGameTime;
    }

    // Update Gems
    this.experienceGems = this.experienceGems.filter(gem => {
      gem.update(this.player, dt);
      if (gem.collectDist < 10) {
        this.addXp(gem.value);
        return false;
      }
      return true;
    });

    // Update Projectiles
    this.projectiles = this.projectiles.filter(p => {
      p.update(dt);
      
      // Auto-target nearest if no target
      if (!p.target || p.target.hp <= 0) {
        const nearest = this.getNearestEnemy();
        if (nearest) p.target = nearest;
      }

      for (const enemy of this.enemies) {
        if (p.collidesWith(enemy)) {
          const crit = Math.random() > 0.9;
          const dmg = crit ? p.damage * 2 : p.damage;
          enemy.takeDamage(dmg);
          
          // Apply Bleed
          if (this.player.bleedChance > 0 && Math.random() < this.player.bleedChance) {
            enemy.applyBleed(this.player.strength * 0.2);
          }

          if (p.paralyzeDuration > 0) {
            enemy.applyParalyze(p.paralyzeDuration);
          }

          // Efeitos visuais aprimorados para impacto
          this.createExplosion(p.x, p.y, p.color);
          this.createImpactEffect(p.x, p.y, p.color);
          
          // Efeito especial para críticos
          if (crit) {
            this.createExplosion(p.x, p.y, '#ffcc33', 15);
            for (let i = 0; i < 4; i++) {
              const angle = (Math.PI * 2 * i) / 4;
              const particle = new Particle(p.x, p.y, '#ffcc33');
              particle.vx = Math.cos(angle) * 0.4;
              particle.vy = Math.sin(angle) * 0.4;
              particle.size = 3;
              particle.decay = 0.003;
              this.particles.push(particle);
            }
          }
          
          this.floatingTexts.push(new FloatingText(enemy.x, enemy.y, Math.floor(dmg).toString(), crit ? '#ffcc33' : p.color));
          if (enemy.hp <= 0) this.killEnemy(enemy);
          return false;
        }
      }
      return p.x > 0 && p.x < this.canvas.width && p.y > 0 && p.y < this.canvas.height;
    });

    // Update Enemy Projectiles
    this.enemyProjectiles = this.enemyProjectiles.filter(p => {
      p.update(dt);
      if (p.collidesWith(this.player)) {
        this.player.takeDamage(p.damage);
        this.screenShake = 10;
        this.createExplosion(p.x, p.y, p.color, 5);
        if (this.player.hp <= 0) {
          this.state = 'gameover';
          this.callbacks.onStateChange('gameover');
        }
        return false;
      }
      return p.x > 0 && p.x < this.canvas.width && p.y > 0 && p.y < this.canvas.height;
    });

    // Update Enemies
    this.enemies.forEach(enemy => {
      enemy.update(this.player, dt, this.totalGameTime, (e) => {
        const angle = Math.atan2(this.player.y - e.y, this.player.x - e.x);
        const p = new Projectile(e.x, e.y, angle, e.damage, 'bullet');
        p.color = '#ff0000'; // Enemy bullets are red
        this.enemyProjectiles.push(p);
      });
      if (enemy.collidesWith(this.player)) {
        const dmg = enemy.damage * (dt / 1000);
        this.player.takeDamage(dmg);
        this.screenShake = 5;
        if (this.player.hp <= 0) {
          this.state = 'gameover';
          this.callbacks.onStateChange('gameover');
        }
      }
    });

    // Update Particles & Floating Texts
    this.particles = this.particles.filter(p => { p.update(dt); return p.life > 0; });
    this.floatingTexts = this.floatingTexts.filter(t => { t.update(dt); return t.life > 0; });

    // Shake decay
    if (this.screenShake > 0) this.screenShake *= 0.9;

    // Stats sync
    this.updateStats();

    // Level completion (handled by XP now)
  }

  private updateCamera() {
    // Definir posição alvo da câmera (centrar no jogador)
    this.camera.targetX = this.player.x - this.canvas.width / 2;
    this.camera.targetY = this.player.y - this.canvas.height / 2;
    
    // Aplicar smooth follow
    this.camera.x += (this.camera.targetX - this.camera.x) * this.camera.smoothFactor;
    this.camera.y += (this.camera.targetY - this.camera.y) * this.camera.smoothFactor;
    
    // Limitar câmera dentro dos limites do mundo
    this.camera.x = Math.max(0, Math.min(this.worldBounds.width - this.canvas.width, this.camera.x));
    this.camera.y = Math.max(0, Math.min(this.worldBounds.height - this.canvas.height, this.camera.y));
  }

  private addXp(amount: number) {
    this.xp += amount;
    const nextLevelXp = 100 + (this.level * 50);
    if (this.xp >= nextLevelXp) {
      this.xp -= nextLevelXp;
      this.levelUp();
    }
  }

  private spawnEnemy() {
    const side = Math.floor(Math.random() * 4);
    let x, y;
    
    // Spawn inimigos nas bordas do mundo (considerando a posição da câmera)
    const camLeft = this.camera.x;
    const camRight = this.camera.x + this.canvas.width;
    const camTop = this.camera.y;
    const camBottom = this.camera.y + this.canvas.height;
    
    if (side === 0) { 
      x = camLeft + Math.random() * this.canvas.width; 
      y = camTop - 20; 
    }
    else if (side === 1) { 
      x = camRight + 20; 
      y = camTop + Math.random() * this.canvas.height; 
    }
    else if (side === 2) { 
      x = camLeft + Math.random() * this.canvas.width; 
      y = camBottom + 20; 
    }
    else { 
      x = camLeft - 20; 
      y = camTop + Math.random() * this.canvas.height; 
    }
    
    const type = Math.random() > 0.9 ? 'tank' : (Math.random() > 0.7 ? 'fast' : 'normal');
    // Stats scale with difficulty multiplier
    const scaling = this.difficultyMultiplier;
    const enemy = new Enemy(x, y, this.level, type, this.totalGameTime);
    enemy.maxHp *= scaling;
    enemy.hp = enemy.maxHp;
    enemy.damage *= (1 + (scaling - 1) * 0.5);
    
    this.enemies.push(enemy);
  }

  private spawnBoss() {
    const x = this.camera.x + this.canvas.width / 2;
    const y = this.camera.y - 50;
    const boss = new Enemy(x, y, this.level, 'boss', this.totalGameTime);
    this.enemies.push(boss);
    this.floatingTexts.push(new FloatingText(x, y + 100, "BOSS DOG CHEGOU!", "#ff4d6d"));
  }

  private killEnemy(enemy: Enemy) {
    this.enemies = this.enemies.filter(e => e !== enemy);
    this.score += enemy.points;
    
    // Drop Gem
    this.experienceGems.push(new ExperienceGem(enemy.x, enemy.y, enemy.points));

    // Life Steal / Regen on kill
    if (this.player.lifeSteal > 0) {
      const heal = this.player.lifeSteal;
      this.player.hp = Math.min(this.player.maxHp, this.player.hp + heal);
      this.floatingTexts.push(new FloatingText(this.player.x, this.player.y - 20, `+${Math.floor(heal)} HP`, "#ff4d6d"));
    }

    this.callbacks.onScoreChange(this.score);
    
    // Criar explosão aprimorada com efeitos de impacto
    this.createExplosion(enemy.x, enemy.y, enemy.color, 20);
    this.createImpactEffect(enemy.x, enemy.y, enemy.color);
    
    // Efeito especial para inimigos bosses
    if (enemy.type === 'boss') {
      this.createExplosion(enemy.x, enemy.y, '#ffcc33', 30);
      for (let i = 0; i < 8; i++) {
        const angle = (Math.PI * 2 * i) / 8;
        const particle = new Particle(enemy.x, enemy.y, '#ffcc33');
        particle.vx = Math.cos(angle) * 0.5;
        particle.vy = Math.sin(angle) * 0.5;
        particle.size = 4;
        particle.decay = 0.002;
        this.particles.push(particle);
      }
    }
    
    this.floatingTexts.push(new FloatingText(enemy.x, enemy.y, `+${enemy.points}`, '#ffcc33'));
  }

  private levelUp() {
    this.level++;
    this.callbacks.onLevelChange(this.level);
    this.state = 'upgrade';
    this.callbacks.onUpgradeRequired(this.generateUpgrades());
  }

  private generateUpgrades() {
    const pool = [
      { type: 'attribute_str', name: 'Força Bruta', description: 'Aumenta Força e Dano Físico', value: 10 },
      { type: 'attribute_def', name: 'Definição Muscular', description: 'Aumenta Definição e Resiliência', value: 10 },
      { type: 'attribute_sta', name: 'Resistência de Elite', description: 'Aumenta Resistência e Vida Máxima', value: 10 },
      { type: 'attribute_agi', name: 'Agilidade Superior', description: 'Aumenta Agilidade e Velocidade', value: 20 },
      { type: 'magic', name: 'Sabedoria Arcana', description: 'Aumenta Inteligência e Dano Mágico', value: 15 },
      { type: 'mana', name: 'Fluxo de Mana', description: 'Aumenta Mana Máxima e Regeneração', value: 100 },
      { type: 'pistol', name: 'Pistola 9mm', description: 'Adiciona Pistola ao Inventário', value: 0 },
      { type: 'knife', name: 'Faca de Arremesso', description: 'Adiciona Facas ao Inventário', value: 0 },
      { type: 'lifesteal', name: 'Sede de Sangue', description: 'Recupera Vida ao matar inimigos', value: 5 },
      { type: 'bleed', name: 'Lâmina Serrilhada', description: 'Chance de causar Sangramento', value: 0.2 },
    ];
    return pool.sort(() => 0.5 - Math.random()).slice(0, 3);
  }

  private createExplosion(x: number, y: number, color: string, count = 8) {
    // Criar explosão com partículas de diferentes tamanhos e velocidades
    for (let i = 0; i < count; i++) {
      const particle = new Particle(x, y, color);
      // Adicionar variação de tamanho e velocidade
      particle.size = 2 + Math.random() * 8;
      particle.decay = 0.001 + Math.random() * 0.003;
      this.particles.push(particle);
    }
    
    // Adicionar partículas de luz para explosões maiores
    if (count > 12) {
      for (let i = 0; i < 4; i++) {
        const lightParticle = new Particle(x, y, '#ffffff');
        lightParticle.size = 1 + Math.random() * 3;
        lightParticle.decay = 0.002;
        this.particles.push(lightParticle);
      }
    }
  }

  private createImpactEffect(x: number, y: number, color: string) {
    // Criar efeito de impacto visual
    for (let i = 0; i < 6; i++) {
      const particle = new Particle(x, y, color);
      const angle = (Math.PI * 2 * i) / 6;
      particle.vx = Math.cos(angle) * 0.3;
      particle.vy = Math.sin(angle) * 0.3;
      particle.size = 3;
      particle.decay = 0.005;
      this.particles.push(particle);
    }
  }

  private createTrailEffect(x: number, y: number, color: string) {
    // Criar rastro para movimentos rápidos
    const particle = new Particle(x, y, color);
    particle.size = 2;
    particle.decay = 0.008;
    this.particles.push(particle);
  }

  private draw() {
    this.ctx.save();
    
    // Aplicar screen shake antes da câmera
    if (this.screenShake > 0.5) {
      this.ctx.translate((Math.random() - 0.5) * this.screenShake, (Math.random() - 0.5) * this.screenShake);
    }

    // Preencher fundo
    this.ctx.fillStyle = '#1a1423';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Aplicar transformação da câmera
    this.ctx.translate(-this.camera.x, -this.camera.y);
    
    // Desenhar grid do mundo (considerando os limites do mundo)
    this.ctx.strokeStyle = '#2d1e3e';
    this.ctx.lineWidth = 1;
    const gridOffset = (Date.now() / 50) % 40;
    const startX = Math.floor(this.camera.x / 40) * 40;
    const startY = Math.floor(this.camera.y / 40) * 40;
    const endX = Math.min(this.worldBounds.width, this.camera.x + this.canvas.width);
    const endY = Math.min(this.worldBounds.height, this.camera.y + this.canvas.height);
    
    for (let x = startX; x < endX; x += 40) {
      this.ctx.beginPath(); 
      this.ctx.moveTo(x, startY); 
      this.ctx.lineTo(x, endY); 
      this.ctx.stroke();
    }
    for (let y = startY; y < endY; y += 40) {
      this.ctx.beginPath(); 
      this.ctx.moveTo(startX, y); 
      this.ctx.lineTo(endX, y); 
      this.ctx.stroke();
    }

    // Desenhar elementos do jogo (agora com coordenadas de mundo)
    this.particles.forEach(p => p.draw(this.ctx));
    this.experienceGems.forEach(g => g.draw(this.ctx));
    this.projectiles.forEach(p => p.draw(this.ctx));
    this.enemyProjectiles.forEach(p => p.draw(this.ctx));
    this.enemies.forEach(e => e.draw(this.ctx));
    this.player.draw(this.ctx, 16);
    this.pet.draw(this.ctx);
    this.floatingTexts.forEach(t => t.draw(this.ctx));

    // Restaurar contexto para elementos da UI
    this.ctx.restore();
  }
}

class Player {
  x: number; y: number;
  radius = 20; speed = 0.2;
  hp = 100; maxHp = 100;
  mp = 100; maxMp = 100;
  manaRegen = 5;
  
  // New Mechanics
  currentWeapon: 'magic' | 'pistol' | 'knife' = 'magic';
  weaponInventory: string[] = ['magic'];
  characterClass: 'bulky' | 'ninja' | 'mage' = 'bulky';
  activePower: string = 'fireball'; 
  lifeSteal = 0;
  bleedChance = 0;
  shieldTimer = 0;
  
  // Attributes for UI
  strength = 10; definition = 10; stamina = 10; intelligence = 10; arcane = 10; cooldownReduction = 10; // %
  
  public cooldowns: Record<string, number> = {
    shoot: 0,
    special: 0,
    melee: 0,
    activePower: 0,
    ultimate: 0,
    dash: 0
  };

  private isMeleeing = false;
  private isDashing = false;
  private dashTimer = 0;
  private dashDir = { x: 0, y: 0 };
  private muzzleFlash = 0;

  constructor(x: number, y: number) {
    this.x = x; this.y = y;
  }

  update(dx: number, dy: number, dt: number, cw: number, ch: number) {
    if (this.dashTimer > 0) {
      this.dashTimer -= dt;
      this.x += this.dashDir.x * 0.8 * dt;
      this.y += this.dashDir.y * 0.8 * dt;
      if (this.dashTimer <= 0) this.isDashing = false;
    } else {
      const mag = Math.sqrt(dx * dx + dy * dy);
      // Speed depends on agility (speed attribute)
      const currentSpeed = this.speed;
      if (mag > 0) {
        this.x += (dx / mag) * currentSpeed * dt;
        this.y += (dy / mag) * currentSpeed * dt;
      }
    }
    this.x = Math.max(this.radius, Math.min(cw - this.radius, this.x));
    this.y = Math.max(this.radius, Math.min(ch - this.radius, this.y));
    
    // Update cooldowns
    for (const key in this.cooldowns) {
      if (this.cooldowns[key] > 0) {
        this.cooldowns[key] -= dt;
      }
    }
    
    if (this.cooldowns.melee <= 300) this.isMeleeing = false;
    
    if (this.muzzleFlash > 0) this.muzzleFlash -= dt;
    if (this.shieldTimer > 0) this.shieldTimer -= dt;
    
    // Mana regen
    const regenFactor = this.characterClass === 'mage' ? 1.5 : 1;
    this.mp = Math.min(this.maxMp, this.mp + (this.manaRegen * regenFactor * dt / 1000));
  }

  switchCharacter(type: string) {
    this.characterClass = type as any;
    if (type === 'bulky') {
      this.strength += 5;
      this.stamina += 5;
      this.maxHp += 50;
      this.hp = Math.min(this.maxHp, this.hp + 50);
    } else if (type === 'ninja') {
      this.speed += 0.05;
      this.bleedChance += 0.1;
    } else if (type === 'mage') {
      this.intelligence += 5;
      this.maxMp += 100;
      this.mp = Math.min(this.maxMp, this.mp + 100);
    }
  }

  dash(dx: number, dy: number) {
    if (this.cooldowns.dash > 0) return;
    this.isDashing = true;
    this.dashTimer = 200;
    const mag = Math.sqrt(dx * dx + dy * dy);
    if (mag > 0) {
      this.dashDir = { x: dx / mag, y: dy / mag };
    } else {
      this.dashDir = { x: 1, y: 0 };
    }
    this.cooldowns.dash = 2000; // 2s cooldown
  }

  setActivePower(type: string) {
    this.activePower = type;
  }

  switchWeapon(type: string) {
    if (this.weaponInventory.includes(type)) {
      this.currentWeapon = type as any;
    }
  }

  draw(ctx: CanvasRenderingContext2D, dt: number) {
    ctx.save();
    
    // Floating animation
    const floatOffset = Math.sin(Date.now() / 300) * 5;
    ctx.translate(this.x, this.y + floatOffset);
    
    // Movement Tilt
    // (Assuming rotation towards target or movement)
    
    const muscleScale = this.characterClass === 'bulky' ? 1.4 : (this.characterClass === 'mage' ? 0.9 : 1.1);
    const bonusScale = 1 + (this.strength - 10) / 100;
    const finalScale = muscleScale * bonusScale;
    
    // Mana Aura
    if (this.mp > 80) {
      ctx.save();
      ctx.globalAlpha = 0.3;
      ctx.fillStyle = '#a388ee';
      ctx.shadowBlur = 20;
      ctx.shadowColor = '#a388ee';
      ctx.beginPath(); ctx.arc(0, 0, 35 * finalScale, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }

    // Cape (flowing)
    ctx.fillStyle = this.characterClass === 'mage' ? '#4c1d95' : '#7e22ce';
    ctx.beginPath();
    const capeLen = (this.characterClass === 'mage' ? 40 : 30) + Math.sin(Date.now() / 150) * 5;
    ctx.moveTo(-15, -5); 
    ctx.quadraticCurveTo(-25 * finalScale, capeLen, 0, capeLen + 10);
    ctx.quadraticCurveTo(25 * finalScale, capeLen, 15, -5);
    ctx.fill();

    // Body
    ctx.fillStyle = this.characterClass === 'ninja' ? '#1a1a1a' : '#e5e5e5';
    ctx.shadowBlur = 10;
    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    ctx.fillRect(-15 * finalScale, -15 * finalScale, 30 * finalScale, 30 * finalScale);
    
    // Chest Plate
    ctx.fillStyle = this.characterClass === 'bulky' ? '#6b7280' : 'rgba(255,255,255,0.1)';
    ctx.fillRect(-10 * finalScale, -10 * finalScale, 20 * finalScale, 15 * finalScale);

    // Arms
    ctx.fillStyle = this.characterClass === 'ninja' ? '#262626' : '#cccccc';
    ctx.fillRect(-22 * finalScale, -5 * finalScale, 10 * finalScale, 22 * finalScale); // Left
    ctx.fillRect(12 * finalScale, -5 * finalScale, 10 * finalScale, 22 * finalScale); // Right
    
    // Head & Ears
    ctx.fillStyle = this.characterClass === 'ninja' ? '#1a1a1a' : '#e5e5e5';
    ctx.fillRect(-12, -28, 24, 18);
    
    // Cat Ears
    ctx.beginPath();
    ctx.moveTo(-12, -28); ctx.lineTo(-18, -42); ctx.lineTo(-4, -28);
    ctx.moveTo(12, -28); ctx.lineTo(18, -42); ctx.lineTo(4, -28);
    ctx.fill();
    
    // Eyes (Glow)
    const eyeColor = this.mp > 20 ? '#a388ee' : '#4b5563';
    ctx.shadowBlur = this.mp > 50 ? 10 : 0;
    ctx.shadowColor = eyeColor;
    ctx.fillStyle = eyeColor;
    ctx.fillRect(-8, -22, 4, 4); ctx.fillRect(4, -22, 4, 4);
    
    // Shield
    if (this.shieldTimer > 0) {
      ctx.save();
      const pulse = 1 + Math.sin(Date.now() / 100) * 0.1;
      ctx.strokeStyle = '#4cc9f0';
      ctx.lineWidth = 4;
      ctx.setLineDash([5, 5]);
      ctx.beginPath(); ctx.arc(0, 0, 40 * pulse, 0, Math.PI * 2); ctx.stroke();
      ctx.globalAlpha = 0.2;
      ctx.fillStyle = '#4cc9f0';
      ctx.fill();
      ctx.restore();
    }
    
    // Weapon (Polished and characterized)
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    if (this.currentWeapon === 'pistol') {
      ctx.font = '24px Arial';
      ctx.shadowBlur = 10;
      ctx.shadowColor = '#ff4d6d';
      ctx.fillText('🔫', 25 * finalScale, 0);
      
      if (this.muzzleFlash > 0) {
        ctx.fillStyle = '#fff';
        ctx.shadowBlur = 15;
        ctx.beginPath(); ctx.arc(40 * finalScale, 0, 15, 0, Math.PI * 2); ctx.fill();
      }
    } else if (this.currentWeapon === 'knife') {
      ctx.save();
      ctx.rotate(Math.sin(Date.now() / 100) * 0.5);
      ctx.font = '28px Arial';
      ctx.shadowBlur = 10;
      ctx.shadowColor = '#cccccc';
      ctx.fillText('🔪', 30 * finalScale, 0);
      ctx.restore();
    } else {
      // Magic Staff
      ctx.save();
      ctx.rotate(Math.sin(Date.now() / 200) * 0.2);
      ctx.font = '32px Arial';
      ctx.shadowBlur = 20;
      ctx.shadowColor = '#a388ee';
      ctx.fillText('🪄', 25 * finalScale, -10);
      
      // Floating Magic Orb
      const orbPulse = 1 + Math.sin(Date.now() / 150) * 0.2;
      ctx.fillStyle = '#a388ee';
      ctx.shadowBlur = 20;
      ctx.shadowColor = '#a388ee';
      ctx.beginPath(); 
      ctx.arc(35 * finalScale, -30 + Math.sin(Date.now()/100) * 5, 8 * orbPulse, 0, Math.PI * 2); 
      ctx.fill();
      ctx.restore();
    }
    
    if (this.isMeleeing) {
      ctx.save();
      ctx.globalAlpha = 0.5;
      ctx.strokeStyle = '#ffcc33';
      ctx.lineWidth = 8;
      ctx.lineCap = 'round';
      ctx.beginPath(); ctx.arc(0, 0, 55, -Math.PI/2.5, Math.PI/2.5); ctx.stroke();
      ctx.restore();
    }
    
    ctx.restore();
  }

  private getCooldown(baseMs: number) {
    return baseMs * (1 - this.cooldownReduction / 100);
  }

  shoot(mousePos: { x: number, y: number }, projectiles: Projectile[], target?: Enemy) {
    if (this.cooldowns.shoot > 0) return false;
    this.cooldowns.shoot = this.getCooldown(this.currentWeapon === 'pistol' ? 150 : 400);
    
    // Auto-aim if target is present
    let angle;
    if (target) {
      angle = Math.atan2(target.y - this.y, target.x - this.x);
    } else {
      angle = Math.atan2(mousePos.y - this.y, mousePos.x - this.x);
    }

    let p: Projectile;
    if (this.currentWeapon === 'magic') {
      p = new Projectile(this.x, this.y, angle, this.intelligence + this.arcane, 'magic');
    } else if (this.currentWeapon === 'pistol') {
      this.muzzleFlash = 50;
      p = new Projectile(this.x, this.y, angle, this.strength * 1.2, 'bullet');
    } else {
      p = new Projectile(this.x, this.y, angle, this.strength * 0.8, 'knife');
    }
    
    if (target) p.target = target;
    projectiles.push(p);
    
    return true;
  }

  special(mousePos: { x: number, y: number }, projectiles: Projectile[], floatingText: (t: string, c: string) => void, target?: Enemy) {
    if (this.cooldowns.special > 0) return false;
    const manaCost = 40;
    if (this.mp < manaCost) {
      floatingText("MANA INSUFICIENTE!", "#ff4d6d");
      return false;
    }
    this.mp -= manaCost;
    this.cooldowns.special = this.getCooldown(4000); // 4s cooldown
    
    const baseAngle = Math.atan2(mousePos.y - this.y, mousePos.x - this.x);
    
    if (this.currentWeapon === 'magic') {
      // Magic Special: Nova de Chamas
      for (let i = 0; i < 12; i++) {
        const angle = baseAngle + (i * Math.PI * 2 / 12);
        const p = new Projectile(this.x, this.y, angle, (this.intelligence + this.arcane) * 1.5, 'magic');
        if (target) p.target = target;
        projectiles.push(p);
      }
      floatingText("MEOW-NOVA!", "#a388ee");
    } else if (this.currentWeapon === 'pistol') {
      // Pistol Special: Rajada Rápida
      for (let i = -1; i <= 1; i++) {
        const angle = baseAngle + (i * 0.2);
        const p = new Projectile(this.x, this.y, angle, this.strength * 2, 'bullet');
        if (target) p.target = target;
        projectiles.push(p);
      }
      floatingText("RAJADA MORTAL!", "#ffcc33");
    } else if (this.currentWeapon === 'knife') {
      // Knife Special: Ciclone de Lâminas
      for (let i = 0; i < 8; i++) {
        const angle = baseAngle + (i * Math.PI * 2 / 8);
        const p = new Projectile(this.x, this.y, angle, this.strength * 1.5, 'knife');
        if (target) p.target = target;
        projectiles.push(p);
      }
      floatingText("TEMPESTADE DE FACAS!", "#cccccc");
    }
    
    return true;
  }

  melee(enemies: Enemy[], onKill: (e: Enemy) => void) {
    if (this.cooldowns.melee > 0) return false;
    this.cooldowns.melee = this.getCooldown(800); // Increased melee cooldown for better balance
    this.isMeleeing = true;
    
    let hit = false;
    enemies.forEach(enemy => {
      const dist = Math.sqrt((enemy.x - this.x)**2 + (enemy.y - this.y)**2);
      if (dist < 70) {
        enemy.takeDamage(this.strength * 3);
        if (enemy.hp <= 0) onKill(enemy);
        hit = true;
      }
    });
    return hit;
  }

  takeDamage(amount: number) {
    if (this.shieldTimer > 0) return;
    const reduced = amount * (1 - (this.definition / 250));
    this.hp -= reduced;
  }

  fireball(mousePos: { x: number, y: number }, projectiles: Projectile[], floatingText: (t: string, c: string) => void, target?: Enemy) {
    if (this.cooldowns.activePower > 0) return false;
    const manaCost = 25;
    if (this.mp < manaCost) { floatingText("MANA INSUFICIENTE!", "#ff4d6d"); return false; }
    this.mp -= manaCost;
    this.cooldowns.activePower = this.getCooldown(5000); // 5s
    const angle = Math.atan2(mousePos.y - this.y, mousePos.x - this.x);
    const p = new Projectile(this.x, this.y, angle, (this.intelligence + this.arcane) * 2, 'magic');
    if (target) p.target = target;
    projectiles.push(p);
    floatingText("FIREBALL!", "#ffcc33");
    return true;
  }

  vortex(mousePos: { x: number, y: number }, projectiles: Projectile[], floatingText: (t: string, c: string) => void, target?: Enemy) {
    if (this.cooldowns.activePower > 0) return false;
    const manaCost = 35;
    if (this.mp < manaCost) { floatingText("MANA INSUFICIENTE!", "#ff4d6d"); return false; }
    this.mp -= manaCost;
    this.cooldowns.activePower = this.getCooldown(8000); // 8s
    const angle = Math.atan2(mousePos.y - this.y, mousePos.x - this.x);
    // Vortex is a special slow projectile that hits multiple times
    const p = new Projectile(this.x, this.y, angle, this.arcane * 0.5, 'magic');
    p.radius = 80; 
    if (target) p.target = target;
    projectiles.push(p);
    floatingText("VÓRTICE!", "#4cc9f0");
    return true;
  }

  activateShield(floatingText: (t: string, c: string) => void) {
    if (this.cooldowns.activePower > 0) return;
    const manaCost = 30;
    if (this.mp < manaCost) { floatingText("MANA INSUFICIENTE!", "#ff4d6d"); return; }
    this.mp -= manaCost;
    this.cooldowns.activePower = this.getCooldown(12000); // 12s
    this.shieldTimer = 5000; // 5 seconds
    floatingText("ESCUDO ATIVO!", "#4cc9f0");
  }

  usePotionHP(floatingText: (t: string, c: string) => void) {
    const heal = this.maxHp * 0.4;
    this.hp = Math.min(this.maxHp, this.hp + heal);
    floatingText("CURA!", "#ff4d6d");
  }

  usePotionMP(floatingText: (t: string, c: string) => void) {
    const regen = this.maxMp * 0.4;
    this.mp = Math.min(this.maxMp, this.mp + regen);
    floatingText("MANA!", "#4cc9f0");
  }

  useUltimate(enemies: Enemy[], onKill: (e: Enemy) => void, floatingText: (t: string, c: string) => void) {
    if (this.cooldowns.ultimate > 0) return false;
    const manaCost = 80;
    if (this.mp < manaCost) { floatingText("MANA INSUFICIENTE!", "#ff4d6d"); return false; }
    this.mp -= manaCost;
    this.cooldowns.ultimate = this.getCooldown(25000); // 25s
    enemies.forEach(e => {
      e.takeDamage(this.intelligence * 10);
      if (e.hp <= 0) onKill(e);
    });
    floatingText("MEOW-CALYPSE!", "#ffcc33");
    return true;
  }

  applyUpgrade(upgrade: any) {
    if (upgrade.type === 'attribute_str') { this.strength += upgrade.value; }
    if (upgrade.type === 'attribute_def') { this.definition += upgrade.value; }
    if (upgrade.type === 'attribute_sta') { 
      this.stamina += upgrade.value; 
      const hpBonus = upgrade.value * 5;
      this.maxHp += hpBonus; 
      this.hp += hpBonus; 
    }
    if (upgrade.type === 'attribute_agi') { this.speed += upgrade.value / 1000; }
    if (upgrade.type === 'magic') { this.intelligence += upgrade.value; this.arcane += 5; }
    if (upgrade.type === 'mana') { this.maxMp += upgrade.value; this.manaRegen += 2; this.mp = this.maxMp; }
    if (upgrade.type === 'pistol') {
      if (!this.weaponInventory.includes('pistol')) this.weaponInventory.push('pistol');
      this.currentWeapon = 'pistol';
    }
    if (upgrade.type === 'knife') {
      if (!this.weaponInventory.includes('knife')) this.weaponInventory.push('knife');
      this.currentWeapon = 'knife';
    }
    if (upgrade.type === 'lifesteal') this.lifeSteal += upgrade.value;
    if (upgrade.type === 'bleed') this.bleedChance += upgrade.value;
  }
}

class Enemy {
  x: number; y: number; radius = 15; speed: number; hp: number; maxHp: number; damage: number; points: number; color: string; type: string;
  attackTimer = 0;
  
  private bleedTimer = 0;
  private bleedDamage = 0;
  private paralyzeTimer = 0;
  private flashTimer = 0;

  constructor(x: number, y: number, level: number, type: string, gameTime: number) {
    this.x = x; this.y = y; this.type = type;
    
    // Difficulty Scaling over time
    const timeScale = 1 + (gameTime / 60000) * 0.2; // 20% stronger every minute
    
    if (type === 'boss') {
      this.hp = 500 + level * 100; this.speed = 0.05; this.damage = 50; this.points = 500; this.color = '#8b4513'; this.radius = 40;
    } else if (type === 'tank') {
      this.hp = (60 + level * 25) * timeScale; this.speed = 0.04 * timeScale; this.damage = 35 * timeScale; this.points = 50; this.color = '#4d3d60'; this.radius = 25;
    } else if (type === 'fast') {
      this.hp = (20 + level * 8) * timeScale; this.speed = 0.14 * timeScale; this.damage = 12 * timeScale; this.points = 30; this.color = '#ffcc33'; this.radius = 12;
    } else if (type === 'ranged') {
      this.hp = (25 + level * 10) * timeScale; this.speed = 0.05 * timeScale; this.damage = 15 * timeScale; this.points = 40; this.color = '#a388ee'; this.radius = 14;
    } else {
      this.hp = (30 + level * 15) * timeScale; this.speed = 0.07 * timeScale; this.damage = 22 * timeScale; this.points = 20; this.color = '#ff4d6d';
    }
    this.maxHp = this.hp;
  }

  update(player: Player, dt: number, gameTime: number, onShoot?: (enemy: Enemy) => void) {
    if (this.paralyzeTimer > 0) {
      this.paralyzeTimer -= dt;
      return; // Stop moving when paralyzed
    }

    if (this.flashTimer > 0) this.flashTimer -= dt;

    const dx = player.x - this.x; const dy = player.y - this.y;
    const mag = Math.sqrt(dx * dx + dy * dy);
    
    // Ranged enemies try to keep distance
    if (this.type === 'ranged') {
      if (mag > 250) {
        this.x += (dx / mag) * this.speed * dt;
        this.y += (dy / mag) * this.speed * dt;
      } else if (mag < 180) {
        this.x -= (dx / mag) * this.speed * dt;
        this.y -= (dy / mag) * this.speed * dt;
      }
      
      this.attackTimer += dt;
      if (this.attackTimer > 2500) {
        if (onShoot) onShoot(this);
        this.attackTimer = 0;
      }
    } else {
      if (mag > 0) { this.x += (dx / mag) * this.speed * dt; this.y += (dy / mag) * this.speed * dt; }
    }
    
    // Bleed effect
    if (this.bleedTimer > 0) {
      this.bleedTimer -= dt;
      this.hp -= this.bleedDamage * (dt / 1000);
    }
    
    // Boss special power: Dash
    if (this.type === 'boss' && Math.random() < 0.005) {
      this.x += (dx / mag) * 30;
      this.y += (dy / mag) * 30;
    }
  }

  applyBleed(dmg: number) {
    this.bleedTimer = 3000; // 3 seconds
    this.bleedDamage = dmg;
  }

  applyParalyze(duration: number) {
    this.paralyzeTimer = duration;
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.save();
    ctx.translate(this.x, this.y);
    
    if (this.flashTimer > 0) {
      ctx.globalAlpha = 0.5 + Math.sin(Date.now() / 20) * 0.5;
      ctx.filter = 'brightness(200%) white';
    }

    const pulse = 1 + Math.sin(Date.now() / 200) * 0.05;
    
    // Characterization using Emojis and themed icons
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    if (this.type === 'boss') {
      ctx.shadowBlur = 30;
      ctx.shadowColor = '#8b4513';
      ctx.font = `${50 * pulse}px Arial`;
      ctx.fillText('👹', 0, 0);
      
      // HP Bar for Boss is bigger
      const barW = 100;
      ctx.fillStyle = '#000'; ctx.fillRect(-barW/2, -50, barW, 8);
      ctx.fillStyle = '#ff0000'; ctx.fillRect(-barW/2, -50, barW * (this.hp / this.maxHp), 8);
    } else if (this.type === 'tank') {
      ctx.shadowBlur = 15;
      ctx.shadowColor = '#4cc9f0';
      ctx.font = `${this.radius * 2 * pulse}px Arial`;
      ctx.fillText('🦾', 0, 0);
    } else if (this.type === 'fast') {
      ctx.shadowBlur = 15;
      ctx.shadowColor = '#ffcc33';
      ctx.font = `${this.radius * 2 * pulse}px Arial`;
      ctx.fillText('⚡', 0, 0);
    } else if (this.type === 'ranged') {
      ctx.shadowBlur = 15;
      ctx.shadowColor = '#a388ee';
      ctx.font = `${this.radius * 2.2 * pulse}px Arial`;
      ctx.fillText('🏹', 0, 0);
    } else {
      ctx.shadowBlur = 10;
      ctx.shadowColor = this.color;
      ctx.font = `${this.radius * 2 * pulse}px Arial`;
      ctx.fillText('👾', 0, 0);
    }
    
    if (this.bleedTimer > 0) {
      ctx.strokeStyle = '#ff0000';
      ctx.lineWidth = 4;
      ctx.setLineDash([2, 4]);
      ctx.beginPath(); ctx.arc(0, 0, this.radius + 5, 0, Math.PI * 2); ctx.stroke();
    }

    if (this.paralyzeTimer > 0) {
      ctx.strokeStyle = '#4cc9f0';
      ctx.lineWidth = 4;
      ctx.beginPath();
      const s = this.radius + 8;
      ctx.moveTo(-s, -s); ctx.lineTo(s, s);
      ctx.moveTo(s, -s); ctx.lineTo(-s, s);
      ctx.stroke();
    }
    
    ctx.restore();
    
    // HP Bar
    if (this.hp < this.maxHp) {
      const barW = this.radius * 2;
      ctx.fillStyle = '#000'; ctx.fillRect(this.x - barW/2, this.y - this.radius - 15, barW, 6);
      ctx.fillStyle = '#ff4d6d'; ctx.fillRect(this.x - barW/2, this.y - this.radius - 15, barW * (this.hp / this.maxHp), 6);
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 1; ctx.strokeRect(this.x - barW/2, this.y - this.radius - 15, barW, 6);
    }
  }

  takeDamage(amount: number) { 
    this.hp -= amount; 
    this.flashTimer = 100;
  }
  collidesWith(other: { x: number, y: number, radius: number }) {
    const dist = Math.sqrt((this.x - other.x)**2 + (this.y - other.y)**2);
    return dist < this.radius + other.radius;
  }
}

class Projectile {
  x: number; y: number; vx: number; vy: number; radius: number; damage: number; color: string; type: string;
  target: Enemy | null = null;
  paralyzeDuration = 0;
  history: {x: number, y: number}[] = [];
  maxHistory = 10;
  life = 0;

  constructor(x: number, y: number, angle: number, damage: number, type: string) {
    this.x = x; this.y = y; this.type = type;
    const speed = type === 'bullet' ? 0.9 : (type === 'knife' ? 0.45 : (type === 'water_drop' ? 0.35 : 0.6));
    this.vx = Math.cos(angle) * speed; this.vy = Math.sin(angle) * speed;
    this.damage = damage;
    this.color = type === 'bullet' ? '#ff4d6d' : (type === 'knife' ? '#cccccc' : (type === 'water_drop' ? '#4cc9f0' : '#ffcc33'));
    this.radius = type === 'magic' ? 12 : (type === 'water_drop' ? 10 : 8);
  }

  update(dt: number) { 
    this.life += dt;
    // Store history for trails
    this.history.unshift({ x: this.x, y: this.y });
    if (this.history.length > this.maxHistory) this.history.pop();

    if (this.target && this.target.hp > 0) {
      const dx = this.target.x - this.x;
      const dy = this.target.y - this.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist > 5) {
        const angle = Math.atan2(dy, dx);
        const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
        const turnSpeed = this.type === 'water_drop' ? 0.4 : 0.2; // Projectiles turn towards target
        
        const currentAngle = Math.atan2(this.vy, this.vx);
        let angleDiff = angle - currentAngle;
        
        // Normalize angle
        while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
        while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
        
        const finalAngle = currentAngle + Math.max(-turnSpeed, Math.min(turnSpeed, angleDiff));
        
        this.vx = Math.cos(finalAngle) * speed;
        this.vy = Math.sin(finalAngle) * speed;
      }
    }
    this.x += this.vx * dt; this.y += this.vy * dt; 
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.save();
    
    // Trail
    if (this.history.length > 2) {
      ctx.beginPath();
      ctx.strokeStyle = this.color;
      ctx.lineWidth = this.radius * 0.5;
      ctx.lineCap = 'round';
      ctx.globalAlpha = 0.2;
      ctx.moveTo(this.history[0].x, this.history[0].y);
      for(let i=1; i<this.history.length; i++) {
        ctx.lineTo(this.history[i].x, this.history[i].y);
      }
      ctx.stroke();
    }

    ctx.translate(this.x, this.y);
    const rotation = Math.atan2(this.vy, this.vx);
    ctx.rotate(rotation);
    
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    if (this.type === 'knife') {
      ctx.rotate(this.life * 0.01); // Spinning knife
      ctx.font = '24px Arial';
      ctx.shadowBlur = 10;
      ctx.shadowColor = '#cccccc';
      ctx.fillText('🔪', 0, 0);
    } else if (this.type === 'bullet') {
      ctx.font = '16px Arial';
      ctx.shadowBlur = 10;
      ctx.shadowColor = '#ff4d6d';
      ctx.fillText('☄️', 0, 0);
    } else if (this.type === 'water_drop') {
      ctx.font = '18px Arial';
      ctx.shadowBlur = 15;
      ctx.shadowColor = '#4cc9f0';
      ctx.fillText('💧', 0, 0);
    } else {
      // Magic Projectile
      const pulse = 1 + Math.sin(this.life * 0.01) * 0.2;
      ctx.font = `${20 * pulse}px Arial`;
      ctx.shadowBlur = 20;
      ctx.shadowColor = '#a388ee';
      ctx.fillText('✨', 0, 0);
    }
    
    ctx.restore();
  }

  collidesWith(other: { x: number, y: number, radius: number }) {
    const dist = Math.sqrt((this.x - other.x)**2 + (this.y - other.y)**2);
    return dist < this.radius + other.radius;
  }
}

class Pet {
  x: number; y: number;
  radius = 15;
  shootTimer = 0;
  shootInterval = 1500;
  isStormy = false;

  constructor(x: number, y: number) {
    this.x = x; this.y = y;
  }

  update(player: Player, enemies: Enemy[], projectiles: Projectile[], dt: number) {
    // Follow player with a slight delay/smoothness
    const targetX = player.x - 40;
    const targetY = player.y - 40;
    this.x += (targetX - this.x) * 0.05;
    this.y += (targetY - this.y) * 0.05;

    // Check life for stormy state
    this.isStormy = (player.hp / player.maxHp) < 0.3;

    // Shooting
    this.shootTimer += dt;
    if (this.shootTimer > this.shootInterval && enemies.length > 0) {
      this.shootTimer = 0;
      
      // Find nearest enemy
      let nearestDist = Infinity;
      let nearestEnemy: Enemy | null = null;
      for (const e of enemies) {
        const d = Math.sqrt((e.x - this.x)**2 + (e.y - this.y)**2);
        if (d < nearestDist) {
          nearestDist = d;
          nearestEnemy = e;
        }
      }

      if (nearestEnemy) {
        const e = nearestEnemy as Enemy;
        const angle = Math.atan2(e.y - this.y, e.x - this.x);
        const p = new Projectile(this.x, this.y, angle, 10, 'water_drop');
        p.target = e;
        if (this.isStormy) {
          p.color = '#7e22ce'; // Purple/Stormy drops
          p.paralyzeDuration = 2000; // 2 seconds paralysis
        }
        projectiles.push(p);
      }
    }
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.save();
    ctx.translate(this.x, this.y);
    
    // Cloud shape
    ctx.fillStyle = this.isStormy ? '#333' : '#f0f0f0';
    if (this.isStormy) {
      ctx.shadowBlur = 15;
      ctx.shadowColor = '#a388ee';
    } else {
      ctx.shadowBlur = 10;
      ctx.shadowColor = '#4cc9f0';
    }

    ctx.beginPath();
    ctx.arc(0, 0, 10, 0, Math.PI * 2);
    ctx.arc(-8, 5, 8, 0, Math.PI * 2);
    ctx.arc(8, 5, 8, 0, Math.PI * 2);
    ctx.arc(0, 8, 7, 0, Math.PI * 2);
    ctx.fill();

    // If stormy, draw tiny lightning sparks
    if (this.isStormy && Math.random() < 0.2) {
      ctx.strokeStyle = '#a388ee';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, 10);
      ctx.lineTo((Math.random() - 0.5) * 10, 20);
      ctx.stroke();
    }

    ctx.restore();
  }
}

class Particle {
  x: number; y: number; vx: number; vy: number; life = 1.0; color: string;
  size: number;
  decay: number;

  constructor(x: number, y: number, color: string) {
    this.x = x; this.y = y; this.color = color;
    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * 0.4;
    this.vx = Math.cos(angle) * speed; this.vy = Math.sin(angle) * speed;
    this.size = 2 + Math.random() * 6;
    this.decay = 0.001 + Math.random() * 0.002;
  }

  update(dt: number) { 
    this.x += this.vx * dt; 
    this.y += this.vy * dt; 
    this.vx *= 0.98;
    this.vy *= 0.98;
    this.life -= this.decay * dt; 
  }

  draw(ctx: CanvasRenderingContext2D) {
    if (this.life <= 0) return;
    ctx.save();
    ctx.globalAlpha = this.life; 
    ctx.translate(this.x, this.y);
    ctx.rotate(this.life * 5); // Spinning particles

    const size = this.size * this.life;
    ctx.fillStyle = this.color;
    ctx.shadowBlur = 10;
    ctx.shadowColor = this.color;
    
    // Star/Sparkle shape
    ctx.beginPath();
    for(let i=0; i<5; i++) {
        ctx.lineTo(Math.cos((i*Math.PI*2/5)) * size, Math.sin((i*Math.PI*2/5)) * size);
        ctx.lineTo(Math.cos(((i+0.5)*Math.PI*2/5)) * size/2, Math.sin(((i+0.5)*Math.PI*2/5)) * size/2);
    }
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
}

class ExperienceGem {
  x: number; y: number; value: number;
  radius = 6;
  color = '#4cc9f0';
  speed = 0.5;
  collectDist = 0;

  constructor(x: number, y: number, value: number) {
    this.x = x; this.y = y; this.value = value;
  }

  update(player: Player, dt: number) {
    const dx = player.x - this.x;
    const dy = player.y - this.y;
    this.collectDist = Math.sqrt(dx*dx + dy*dy);

    if (this.collectDist < 150) {
      const mag = this.collectDist;
      this.x += (dx/mag) * this.speed * dt;
      this.y += (dy/mag) * this.speed * dt;
    }
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(Date.now() / 500);
    
    ctx.fillStyle = this.color;
    ctx.shadowBlur = 15;
    ctx.shadowColor = this.color;
    ctx.beginPath();
    ctx.moveTo(0, -this.radius);
    ctx.lineTo(this.radius, 0);
    ctx.lineTo(0, this.radius);
    ctx.lineTo(-this.radius, 0);
    ctx.closePath();
    ctx.fill();
    
    // Core glow
    ctx.globalAlpha = 0.5;
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(0, 0, this.radius * 0.4, 0, Math.PI * 2); ctx.fill();
    
    ctx.restore();
  }
}

class FloatingText {
  x: number; y: number; text: string; color: string; life = 1.0; vy = -0.05;

  constructor(x: number, y: number, text: string, color: string) {
    this.x = x; this.y = y; this.text = text; this.color = color;
  }

  update(dt: number) { this.y += this.vy * dt; this.life -= dt / 1000; }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.globalAlpha = this.life;
    ctx.fillStyle = this.color;
    ctx.font = 'bold 16px "Courier New"';
    ctx.textAlign = 'center';
    ctx.fillText(this.text, this.x, this.y);
    ctx.globalAlpha = 1.0;
  }
}
