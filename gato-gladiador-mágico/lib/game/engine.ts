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
  private lastTime: number = 0;
  private totalGameTime: number = 0;
  
  private player: Player;
  private enemies: Enemy[] = [];
  private projectiles: Projectile[] = [];
  private particles: Particle[] = [];
  private floatingTexts: FloatingText[] = [];
  
  private keys: Set<string> = new Set();
  private mousePos = { x: 0, y: 0 };
  
  private spawnTimer = 0;
  private spawnInterval = 2000;
  private enemiesToSpawn = 0;
  
  private screenShake = 0;
  private lastBossTime = 0;

  constructor(canvas: HTMLCanvasElement, callbacks: EngineCallbacks) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.callbacks = callbacks;
    this.player = new Player(canvas.width / 2, canvas.height / 2);
    
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
      this.mousePos.x = (e.clientX - rect.left) * (this.canvas.width / rect.width);
      this.mousePos.y = (e.clientY - rect.top) * (this.canvas.height / rect.height);
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

  public setCharacter(type: string) {
    this.player.switchCharacter(type);
    this.updateStats();
  }

  public executeAction(action: string) {
    if (this.state !== 'playing') return;

    const floatingText = (t: string, c: string) => {
      this.floatingTexts.push(new FloatingText(this.player.x, this.player.y - 40, t, c));
    };

    switch (action) {
      case 'shoot':
        if (this.player.shoot(this.mousePos, this.projectiles)) {
          this.screenShake = this.player.currentWeapon === 'pistol' ? 5 : 2;
        }
        break;
      case 'special':
        if (this.player.special(this.mousePos, this.projectiles, floatingText)) {
          this.screenShake = 15;
        }
        break;
      case 'melee':
        if (this.player.melee(this.enemies, (enemy) => this.killEnemy(enemy))) {
          this.screenShake = 10;
        }
        break;
      case 'fireball':
        if (this.player.fireball(this.mousePos, this.projectiles, floatingText)) {
          this.screenShake = 8;
        }
        break;
      case 'vortex':
        if (this.player.vortex(this.mousePos, this.projectiles, floatingText)) {
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
    }
  }

  public start() {
    this.state = 'playing';
    if (this.animationId) cancelAnimationFrame(this.animationId);
    this.lastTime = performance.now();
    this.enemiesToSpawn = 5 + this.level * 3;
    this.totalGameTime = 0;
    this.lastBossTime = 0;
    this.loop(this.lastTime);
  }

  public reset() {
    this.score = 0;
    this.level = 1;
    this.player = new Player(this.canvas.width / 2, this.canvas.height / 2);
    this.enemies = [];
    this.projectiles = [];
    this.particles = [];
    this.floatingTexts = [];
    this.spawnInterval = 2000;
    this.totalGameTime = 0;
    this.lastBossTime = 0;
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
    this.enemiesToSpawn = 5 + this.level * 3;
    this.spawnInterval = Math.max(500, 2000 - this.level * 100);
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
      enemiesLeft: this.enemies.length + this.enemiesToSpawn,
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
      bleedChance: this.player.bleedChance
    });
  }

  private loop(timestamp: number) {
    if (this.state !== 'playing') return;
    
    const deltaTime = Math.min(timestamp - this.lastTime, 100);
    this.lastTime = timestamp;
    this.totalGameTime += deltaTime;

    this.update(deltaTime);
    this.draw();

    this.animationId = requestAnimationFrame((t) => this.loop(t));
  }

  private update(dt: number) {
    // Player movement
    let dx = 0;
    let dy = 0;
    if (this.keys.has('KeyW')) dy -= 1;
    if (this.keys.has('KeyS')) dy += 1;
    if (this.keys.has('KeyA')) dx -= 1;
    if (this.keys.has('KeyD')) dx += 1;
    
    this.player.update(dx, dy, dt, this.canvas.width, this.canvas.height);

    // Spawning
    this.spawnTimer += dt;
    if (this.spawnTimer > this.spawnInterval && this.enemiesToSpawn > 0) {
      this.spawnEnemy();
      this.spawnTimer = 0;
      this.enemiesToSpawn--;
    }

    // Boss Spawning (Every 2 minutes = 120000ms)
    if (this.totalGameTime - this.lastBossTime > 120000) {
      this.spawnBoss();
      this.lastBossTime = this.totalGameTime;
    }

    // Update Projectiles
    this.projectiles = this.projectiles.filter(p => {
      p.update(dt);
      for (const enemy of this.enemies) {
        if (p.collidesWith(enemy)) {
          const crit = Math.random() > 0.9;
          const dmg = crit ? p.damage * 2 : p.damage;
          enemy.takeDamage(dmg);
          
          // Apply Bleed
          if (this.player.bleedChance > 0 && Math.random() < this.player.bleedChance) {
            enemy.applyBleed(this.player.strength * 0.2);
          }

          this.createExplosion(p.x, p.y, p.color);
          this.floatingTexts.push(new FloatingText(enemy.x, enemy.y, Math.floor(dmg).toString(), crit ? '#ffcc33' : p.color));
          if (enemy.hp <= 0) this.killEnemy(enemy);
          return false;
        }
      }
      return p.x > 0 && p.x < this.canvas.width && p.y > 0 && p.y < this.canvas.height;
    });

    // Update Enemies
    this.enemies.forEach(enemy => {
      enemy.update(this.player, dt, this.totalGameTime);
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

    // Level completion
    if (this.enemiesToSpawn === 0 && this.enemies.length === 0) {
      this.levelUp();
    }
  }

  private spawnEnemy() {
    const side = Math.floor(Math.random() * 4);
    let x, y;
    if (side === 0) { x = Math.random() * this.canvas.width; y = -20; }
    else if (side === 1) { x = this.canvas.width + 20; y = Math.random() * this.canvas.height; }
    else if (side === 2) { x = Math.random() * this.canvas.width; y = this.canvas.height + 20; }
    else { x = -20; y = Math.random() * this.canvas.height; }
    
    const type = Math.random() > 0.8 ? 'tank' : (Math.random() > 0.6 ? 'fast' : 'normal');
    this.enemies.push(new Enemy(x, y, this.level, type, this.totalGameTime));
  }

  private spawnBoss() {
    const x = this.canvas.width / 2;
    const y = -50;
    const boss = new Enemy(x, y, this.level, 'boss', this.totalGameTime);
    this.enemies.push(boss);
    this.floatingTexts.push(new FloatingText(x, y + 100, "BOSS DOG CHEGOU!", "#ff4d6d"));
  }

  private killEnemy(enemy: Enemy) {
    this.enemies = this.enemies.filter(e => e !== enemy);
    this.score += enemy.points;
    
    // Life Steal / Regen on kill
    if (this.player.lifeSteal > 0) {
      const heal = this.player.lifeSteal;
      this.player.hp = Math.min(this.player.maxHp, this.player.hp + heal);
      this.floatingTexts.push(new FloatingText(this.player.x, this.player.y - 20, `+${Math.floor(heal)} HP`, "#ff4d6d"));
    }

    this.callbacks.onScoreChange(this.score);
    this.createExplosion(enemy.x, enemy.y, enemy.color, 20);
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
    for (let i = 0; i < count; i++) {
      this.particles.push(new Particle(x, y, color));
    }
  }

  private draw() {
    this.ctx.save();
    if (this.screenShake > 0.5) {
      this.ctx.translate((Math.random() - 0.5) * this.screenShake, (Math.random() - 0.5) * this.screenShake);
    }

    this.ctx.fillStyle = '#1a1423';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Arena Grid
    this.ctx.strokeStyle = '#2d1e3e';
    this.ctx.lineWidth = 1;
    for (let i = 0; i < this.canvas.width; i += 40) {
      this.ctx.beginPath(); this.ctx.moveTo(i, 0); this.ctx.lineTo(i, this.canvas.height); this.ctx.stroke();
    }
    for (let i = 0; i < this.canvas.height; i += 40) {
      this.ctx.beginPath(); this.ctx.moveTo(0, i); this.ctx.lineTo(this.canvas.width, i); this.ctx.stroke();
    }

    this.particles.forEach(p => p.draw(this.ctx));
    this.projectiles.forEach(p => p.draw(this.ctx));
    this.enemies.forEach(e => e.draw(this.ctx));
    this.player.draw(this.ctx);
    this.floatingTexts.forEach(t => t.draw(this.ctx));

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
  lifeSteal = 0;
  bleedChance = 0;
  shieldTimer = 0;
  
  // Attributes for UI
  strength = 10; definition = 10; stamina = 10; intelligence = 10; arcane = 10;
  
  private meleeCooldown = 0;
  private isMeleeing = false;
  private muzzleFlash = 0;

  constructor(x: number, y: number) {
    this.x = x; this.y = y;
  }

  update(dx: number, dy: number, dt: number, cw: number, ch: number) {
    const mag = Math.sqrt(dx * dx + dy * dy);
    // Speed depends on agility (speed attribute)
    const currentSpeed = this.speed;
    if (mag > 0) {
      this.x += (dx / mag) * currentSpeed * dt;
      this.y += (dy / mag) * currentSpeed * dt;
    }
    this.x = Math.max(this.radius, Math.min(cw - this.radius, this.x));
    this.y = Math.max(this.radius, Math.min(ch - this.radius, this.y));
    
    if (this.meleeCooldown > 0) this.meleeCooldown -= dt;
    if (this.meleeCooldown <= 300) this.isMeleeing = false;
    
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

  switchWeapon(type: string) {
    if (this.weaponInventory.includes(type)) {
      this.currentWeapon = type as any;
    }
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.save();
    ctx.translate(this.x, this.y);
    
    const muscleScale = this.characterClass === 'bulky' ? 1.4 : (this.characterClass === 'mage' ? 0.9 : 1.1);
    const bonusScale = 1 + (this.strength - 10) / 100;
    const finalScale = muscleScale * bonusScale;
    
    // Cape (longer for mage)
    ctx.fillStyle = this.characterClass === 'mage' ? '#4c1d95' : '#7e22ce';
    ctx.beginPath();
    const capeLen = this.characterClass === 'mage' ? 35 : 25;
    ctx.moveTo(-15, -5); ctx.lineTo(-20 * finalScale, capeLen); ctx.lineTo(20 * finalScale, capeLen); ctx.lineTo(15, -5);
    ctx.fill();

    // Body
    ctx.fillStyle = this.characterClass === 'ninja' ? '#222' : '#d1d1d1';
    ctx.fillRect(-15, -15, 30, 30);
    
    // Arms (bigger for bulky)
    ctx.fillStyle = this.characterClass === 'ninja' ? '#333' : '#b0b0b0';
    ctx.fillRect(-20 * finalScale - 5, -5, 10 * finalScale, 20);
    ctx.fillRect(15, -5, 10 * finalScale, 20);
    
    // Head
    ctx.fillStyle = this.characterClass === 'ninja' ? '#222' : '#d1d1d1';
    ctx.fillRect(-10, -25, 20, 15);
    
    // Ears
    ctx.beginPath();
    ctx.moveTo(-10, -25); ctx.lineTo(-15, -35); ctx.lineTo(-5, -25);
    ctx.moveTo(10, -25); ctx.lineTo(15, -35); ctx.lineTo(5, -25);
    ctx.fill();
    
    // Eyes
    ctx.fillStyle = this.mp > 20 ? '#a388ee' : '#555';
    ctx.fillRect(-6, -20, 3, 3); ctx.fillRect(3, -20, 3, 3);
    
    // Shield Visual
    if (this.shieldTimer > 0) {
      ctx.strokeStyle = '#4cc9f0';
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(0, 0, 30, 0, Math.PI * 2); ctx.stroke();
      ctx.globalAlpha = 0.2;
      ctx.fillStyle = '#4cc9f0';
      ctx.fill();
      ctx.globalAlpha = 1.0;
    }
    
    // Weapon Visual
    if (this.currentWeapon === 'pistol') {
      ctx.fillStyle = '#333';
      ctx.fillRect(15, 0, 15, 8);
      if (this.muzzleFlash > 0) {
        ctx.fillStyle = '#ffcc33';
        ctx.beginPath(); ctx.arc(35, 4, 8, 0, Math.PI * 2); ctx.fill();
      }
    } else if (this.currentWeapon === 'knife') {
      ctx.fillStyle = '#aaa';
      ctx.fillRect(15, -5, 4, 15);
      ctx.fillStyle = '#555';
      ctx.fillRect(15, 10, 4, 5);
    }
    
    if (this.isMeleeing) {
      ctx.strokeStyle = '#ffcc33';
      ctx.lineWidth = 4;
      ctx.beginPath(); ctx.arc(0, 0, 45, -Math.PI/3, Math.PI/3); ctx.stroke();
    }
    
    ctx.restore();
  }

  shoot(mousePos: { x: number, y: number }, projectiles: Projectile[]) {
    const angle = Math.atan2(mousePos.y - this.y, mousePos.x - this.x);
    
    if (this.currentWeapon === 'magic') {
      projectiles.push(new Projectile(this.x, this.y, angle, this.intelligence + this.arcane, 'magic'));
    } else if (this.currentWeapon === 'pistol') {
      this.muzzleFlash = 50;
      projectiles.push(new Projectile(this.x, this.y, angle, this.strength * 1.2, 'bullet'));
    } else if (this.currentWeapon === 'knife') {
      projectiles.push(new Projectile(this.x, this.y, angle, this.strength * 0.8, 'knife'));
    }
    
    return true;
  }

  special(mousePos: { x: number, y: number }, projectiles: Projectile[], floatingText: (t: string, c: string) => void) {
    const manaCost = 40;
    if (this.mp < manaCost) {
      floatingText("MANA INSUFICIENTE!", "#ff4d6d");
      return false;
    }
    this.mp -= manaCost;
    
    const baseAngle = Math.atan2(mousePos.y - this.y, mousePos.x - this.x);
    
    if (this.currentWeapon === 'magic') {
      // Magic Special: Nova de Chamas
      for (let i = 0; i < 12; i++) {
        const angle = baseAngle + (i * Math.PI * 2 / 12);
        projectiles.push(new Projectile(this.x, this.y, angle, (this.intelligence + this.arcane) * 1.5, 'magic'));
      }
      floatingText("MEOW-NOVA!", "#a388ee");
    } else if (this.currentWeapon === 'pistol') {
      // Pistol Special: Rajada Rápida
      for (let i = -1; i <= 1; i++) {
        const angle = baseAngle + (i * 0.2);
        projectiles.push(new Projectile(this.x, this.y, angle, this.strength * 2, 'bullet'));
      }
      floatingText("RAJADA MORTAL!", "#ffcc33");
    } else if (this.currentWeapon === 'knife') {
      // Knife Special: Ciclone de Lâminas
      for (let i = 0; i < 8; i++) {
        const angle = baseAngle + (i * Math.PI * 2 / 8);
        projectiles.push(new Projectile(this.x, this.y, angle, this.strength * 1.5, 'knife'));
      }
      floatingText("TEMPESTADE DE FACAS!", "#cccccc");
    }
    
    return true;
  }

  melee(enemies: Enemy[], onKill: (e: Enemy) => void) {
    if (this.meleeCooldown > 0) return false;
    this.meleeCooldown = 400;
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

  fireball(mousePos: { x: number, y: number }, projectiles: Projectile[], floatingText: (t: string, c: string) => void) {
    const manaCost = 25;
    if (this.mp < manaCost) { floatingText("MANA INSUFICIENTE!", "#ff4d6d"); return false; }
    this.mp -= manaCost;
    const angle = Math.atan2(mousePos.y - this.y, mousePos.x - this.x);
    projectiles.push(new Projectile(this.x, this.y, angle, (this.intelligence + this.arcane) * 2, 'magic'));
    floatingText("FIREBALL!", "#ffcc33");
    return true;
  }

  vortex(mousePos: { x: number, y: number }, projectiles: Projectile[], floatingText: (t: string, c: string) => void) {
    const manaCost = 35;
    if (this.mp < manaCost) { floatingText("MANA INSUFICIENTE!", "#ff4d6d"); return false; }
    this.mp -= manaCost;
    const angle = Math.atan2(mousePos.y - this.y, mousePos.x - this.x);
    // Vortex is a special slow projectile that hits multiple times
    const p = new Projectile(this.x, this.y, angle, this.arcane * 0.5, 'magic');
    p.radius = 80; // Large radius
    projectiles.push(p);
    floatingText("VÓRTICE!", "#4cc9f0");
    return true;
  }

  activateShield(floatingText: (t: string, c: string) => void) {
    const manaCost = 30;
    if (this.mp < manaCost) { floatingText("MANA INSUFICIENTE!", "#ff4d6d"); return; }
    this.mp -= manaCost;
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
    const manaCost = 80;
    if (this.mp < manaCost) { floatingText("MANA INSUFICIENTE!", "#ff4d6d"); return false; }
    this.mp -= manaCost;
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
  
  private bleedTimer = 0;
  private bleedDamage = 0;

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
    } else {
      this.hp = (30 + level * 15) * timeScale; this.speed = 0.07 * timeScale; this.damage = 22 * timeScale; this.points = 20; this.color = '#ff4d6d';
    }
    this.maxHp = this.hp;
  }

  update(player: Player, dt: number, gameTime: number) {
    const dx = player.x - this.x; const dy = player.y - this.y;
    const mag = Math.sqrt(dx * dx + dy * dy);
    if (mag > 0) { this.x += (dx / mag) * this.speed * dt; this.y += (dy / mag) * this.speed * dt; }
    
    // Bleed effect
    if (this.bleedTimer > 0) {
      this.bleedTimer -= dt;
      this.hp -= this.bleedDamage * (dt / 1000);
    }
    
    // Boss special power: Dash
    if (this.type === 'boss' && Math.random() < 0.01) {
      this.x += (dx / mag) * 50;
      this.y += (dy / mag) * 50;
    }
  }

  applyBleed(dmg: number) {
    this.bleedTimer = 3000; // 3 seconds
    this.bleedDamage = dmg;
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.save();
    ctx.translate(this.x, this.y);
    
    if (this.type === 'boss') {
      // Draw Dog Boss
      ctx.fillStyle = '#8b4513';
      ctx.fillRect(-30, -30, 60, 60);
      ctx.fillStyle = '#000';
      ctx.fillRect(-20, -15, 8, 8); ctx.fillRect(12, -15, 8, 8); // Eyes
      ctx.fillStyle = '#5d2e0a';
      ctx.fillRect(-35, -35, 15, 30); ctx.fillRect(20, -35, 15, 30); // Ears
    } else {
      ctx.fillStyle = this.color;
      ctx.beginPath(); ctx.arc(0, 0, this.radius, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#000'; ctx.lineWidth = 2; ctx.stroke();
    }
    
    if (this.bleedTimer > 0) {
      ctx.fillStyle = '#ff0000';
      ctx.beginPath(); ctx.arc(0, 0, this.radius + 2, 0, Math.PI * 2); ctx.stroke();
    }
    
    ctx.restore();
    
    if (this.hp < this.maxHp) {
      ctx.fillStyle = '#000'; ctx.fillRect(this.x - 15, this.y - this.radius - 10, 30, 4);
      ctx.fillStyle = '#ff4d6d'; ctx.fillRect(this.x - 15, this.y - this.radius - 10, 30 * (this.hp / this.maxHp), 4);
    }
  }

  takeDamage(amount: number) { this.hp -= amount; }
  collidesWith(other: { x: number, y: number, radius: number }) {
    const dist = Math.sqrt((this.x - other.x)**2 + (this.y - other.y)**2);
    return dist < this.radius + other.radius;
  }
}

class Projectile {
  x: number; y: number; vx: number; vy: number; radius: number; damage: number; color: string; type: string;

  constructor(x: number, y: number, angle: number, damage: number, type: string) {
    this.x = x; this.y = y; this.type = type;
    const speed = type === 'bullet' ? 0.8 : (type === 'knife' ? 0.4 : 0.5);
    this.vx = Math.cos(angle) * speed; this.vy = Math.sin(angle) * speed;
    this.damage = damage;
    this.color = type === 'bullet' ? '#ff0000' : (type === 'knife' ? '#cccccc' : '#a388ee');
    this.radius = type === 'magic' ? 10 : 6;
  }

  update(dt: number) { this.x += this.vx * dt; this.y += this.vy * dt; }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.save();
    ctx.translate(this.x, this.y);
    
    if (this.type === 'knife') {
      ctx.font = '20px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('🔪', 0, 0);
    } else if (this.type === 'bullet') {
      ctx.fillStyle = '#ff0000';
      ctx.beginPath(); ctx.arc(0, 0, 4, 0, Math.PI * 2); ctx.fill();
      ctx.shadowBlur = 5; ctx.shadowColor = '#ff0000'; ctx.fill();
    } else {
      ctx.fillStyle = this.color;
      ctx.beginPath(); ctx.arc(0, 0, this.radius, 0, Math.PI * 2); ctx.fill();
      ctx.shadowBlur = 15; ctx.shadowColor = this.color; ctx.fill();
    }
    
    ctx.restore();
  }

  collidesWith(enemy: Enemy) {
    const dist = Math.sqrt((this.x - enemy.x)**2 + (this.y - enemy.y)**2);
    return dist < this.radius + enemy.radius;
  }
}

class Particle {
  x: number; y: number; vx: number; vy: number; life = 1.0; color: string;

  constructor(x: number, y: number, color: string) {
    this.x = x; this.y = y; this.color = color;
    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * 0.25;
    this.vx = Math.cos(angle) * speed; this.vy = Math.sin(angle) * speed;
  }

  update(dt: number) { this.x += this.vx * dt; this.y += this.vy * dt; this.life -= dt / 600; }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.globalAlpha = this.life; ctx.fillStyle = this.color;
    ctx.fillRect(this.x, this.y, 4, 4); ctx.globalAlpha = 1.0;
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
