

import { CONSTANTS } from './constants.js';
import { gameEvents } from './events.js';
import { gameState } from './main.js';
import { logger } from './logger.js';

// Main class to handle skill application
export class SkillManager {
  constructor() {
    this.appliedSkills = {
      player: new Map(),
      enemy: new Map()
    };

    // Initialize event listeners
    this.initializeEvents();
  }

  initializeEvents() {
    // Register for skill-related events
    gameEvents.on('newStage_battle', this.applyBattleStartSkills.bind(this));
    gameEvents.on('itemActivated', this.applyItemActivationSkills.bind(this));
    gameEvents.on('debuffChange', this.applyDebuffRelatedSkills.bind(this));

    // Register for damage and healing events
    gameEvents.on('damageCalculated', this.modifyDamage.bind(this));
    gameEvents.on('healingCalculated', this.modifyHealing.bind(this));
    gameEvents.on('shieldCalculated', this.modifyShield.bind(this));

    // Threshold-based events
    gameEvents.on('playerHPchange', this.checkThresholdSkills.bind(this, 'player'));
    gameEvents.on('enemyHPchange', this.checkThresholdSkills.bind(this, 'enemy'));
  }

  // Apply skills for characters at battle start
  applyBattleStartSkills() {
    setTimeout(() => {
      this.processSkills('player');
      this.processSkills('enemy');
    }, 30);
  }

  // Process all skills of a character
  processSkills(characterType) {
    const character = characterType === 'player' ? gameState.player : gameState.enemy;
    if (!character) return;

    // Clear previously applied skills
    this.appliedSkills[characterType].clear();

    // Process each equipped skill
    character.skills.slots.forEach(skill => {
      if (!skill) return;

      // Store skill info for future reference
      this.appliedSkills[characterType].set(skill.skillName, {
        calculatedValues: skill.calculatedValues,
        skillType: skill.skillType,
        processed: false
      });

      // Apply immediate effects based on skill type
      this.processSkillByType(skill, character, characterType);
    });
  }

  // Process skill based on its type
  processSkillByType(skill, character, characterType) {
    const skillData = this.appliedSkills[characterType].get(skill.skillName);

    switch (skill.skillType) {
      case 'battle_start':
        //logger.warn('skill, character, characterType',skill, character, characterType);
        this.applyBattleStartEffect(skill, character, characterType);
        break;
      case 'damage_modifier':
      case 'defense_modifier':
      case 'health_modifier':
      case 'debuff_enhancement':
      case 'synergy':
      case 'item_efficiency':
      case 'item_specialist':
      case 'category_bonus':
        // These are applied dynamically during relevant actions
        skillData.processed = true;
        break;
      case 'passive_effect':
        this.applyPassiveEffect(skill, character, characterType);
        break;
    }
  }

  // Apply battle start skills
  applyBattleStartEffect(skill, character, characterType) {
    const skillData = this.appliedSkills[characterType].get(skill.skillName);
    if (!skillData || skillData.processed) return;

    switch (skill.skillName) {
      case 'Resourceful':
        // Start battle with X% bonus shield
        const shieldBonus = Math.floor(character.max_hp * (skillData.calculatedValues[0] / 100));
        character.shield += shieldBonus;
        gameEvents.emit(`${characterType}SPchange`);
        this.logSkillEffect(characterType, skill.skillName, `Gained ${shieldBonus} initial shield`);
        break;

      case 'Chronoshift':
        // First X random items activation is instant
        // We'll set a counter that will be checked during item activations
        //logger.error('applyBattleStartEffect',);
        skillData.remainingInstants = skillData.calculatedValues[0];
        this.logSkillEffect(characterType, skill.skillName, `Next ${skillData.remainingInstants} item activations will be instant`);
        break;

      case 'Preparation':
        // Begin battles with X random enemy debuffs
        const debuffs = ['poison', 'burn', 'freeze'];
        const opponent = characterType === 'player' ? gameState.enemy : gameState.player;
        const debuffAmount = skillData.calculatedValues[0];
        if (!opponent) break;
        for (let i = 0; i < debuffs.length; i++) {
          // Add a random debuff
          const currentDebuff = debuffs[i];
          opponent.debuffs[currentDebuff] += Math.floor(debuffAmount);

          // Notify about debuff change
          gameEvents.emit('debuffChange', {
            target: opponent,
            effect: currentDebuff,
            battleTime: 0
          });
        }
        logger.warn('opponent.debuffs', opponent.debuffs);
        this.logSkillEffect(characterType, skill.skillName, ` applied ${debuffAmount} debuffs to opponent's each debuff`);
        break;

      case 'Second Wind':
        // Once per battle recovery at low health - set up the flag
        skillData.secondWindUsed = false;
        skillData.healthThreshold = skillData.calculatedValues[1];
        skillData.healAmount = skillData.calculatedValues[0];
        break;
    }

    skillData.processed = true;
  }

  // Apply passive effect skills
  applyPassiveEffect(skill, character, characterType) {
    const skillData = this.appliedSkills[characterType].get(skill.skillName);
    if (!skillData || skillData.processed) return;

    switch (skill.skillName) {
      case 'Shield Generator':
        // Set up a passive shield generation timer
        if (gameState.currentBattle) {
          skillData.timerId = setInterval(() => {
            if (gameState.currentStage !== 'battle' || gameState.currentBattle?.battleEnded) {
              clearInterval(skillData.timerId);
              return;
            }

            // Generate shield
            const shieldAmount = skillData.calculatedValues[0];
            character.shield += shieldAmount;
            gameEvents.emit(`${characterType}SPchange`);

            // Record shield for statistics
            if (gameState.currentBattle) {
              const targetIndex = characterType === 'player' ? '1' : '2';
              gameState.currentBattle.recordShield(targetIndex, shieldAmount, skill);
            }

            this.logSkillEffect(characterType, skill.skillName, `Generated ${shieldAmount} shield`);
          }, 1000); // Every 1 second as per description
        }
        break;

    }

    skillData.processed = true;
  }

  // Check and apply item activation related skills
  applyItemActivationSkills(item) {
    const characterType = item.place.startsWith('player') ? 'player' : 'enemy';
    const character = characterType === 'player' ? gameState.player : gameState.enemy;

    this.appliedSkills[characterType].forEach((skillData, skillName) => {
      switch (skillName) {
        case 'Swift Casting':
          // Effect already applied in the item animation speed calculation
          break;

        case 'Chronoshift':
          // Check if we still have instant activations
          if (skillData.remainingInstants && skillData.remainingInstants > 0) {
            //logger.error('applyItemActivationSkills',);
            //logger.error('skillData.remainingInstants',skillData.remainingInstants);
            // This will be handled in the animate method of the Item class
            skillData.remainingInstants--;
            //logger.error('skillData.remainingInstants',skillData.remainingInstants);
            this.logSkillEffect(characterType, skillName, `Instant item activation! Remaining: ${skillData.remainingInstants}`);
          }
          break;

        case 'Time Warp':
          // Chance to reset item timers
          const chance = skillData.calculatedValues[0];
          if (Math.random() * 100 < chance) {
            // Reset all item timers for this character
            character.equipment.slots.forEach(equipItem => {
              if (equipItem && equipItem.place.startsWith(characterType)) {
                equipItem.height = 0;
              }
            });
            this.logSkillEffect(characterType, skillName, `Reset all item timers!`);
          }
          break;

        case 'Temporal Mastery':
          // Every third activation is faster
          if (!skillData.activationCount) skillData.activationCount = 0;
          skillData.activationCount++;

          if (skillData.activationCount % 3 === 0) {
            // This will be handled by adding a temporary boost to the item
            // We'll implement this in the animate method of Item class
            this.logSkillEffect(characterType, skillName, `Third activation speed boost applied!`);
          }
          break;
      }
    });
  }

  // Apply debuff-related skills
  applyDebuffRelatedSkills(data) {
    const { target, effect } = data;
    const characterType = target === gameState.player ? 'player' : 'enemy';
    const opponent = characterType === 'player' ? gameState.enemy : gameState.player;
    const opponentType = characterType === 'player' ? 'enemy' : 'player';

    // Check for skills that react to debuffs
    this.appliedSkills[characterType].forEach((skillData, skillName) => {
      switch (skillName) {
        case 'Venom Contagion':
          // Chance to spread poison
          if (effect === 'poison' && target.debuffs.poison > 0) {
            const chance = skillData.calculatedValues[0];
            if (Math.random() * 100 < chance) {
              // Spread poison to opponent
              opponent.debuffs.poison += 1;
              gameEvents.emit('debuffChange', {
                target: opponent,
                effect: 'poison',
                battleTime: data.battleTime
              });
              this.logSkillEffect(characterType, skillName, `Spread poison to opponent!`);
            }
          }
          break;

      }
    });

    // Check for opponent's skills that affect debuffs
    this.appliedSkills[opponentType].forEach((skillData, skillName) => {
      switch (skillName) {
        case 'Toxin Master':
          // Enemy poison skills chance to fail
          if (effect === 'poison' && Math.random() * 100 < skillData.calculatedValues[0]) {
            // Negate the poison application
            target.debuffs.poison = Math.max(0, target.debuffs.poison - 1);
            this.logSkillEffect(opponentType, skillName, `Negated poison application!`);
          }
          break;

      }
    });

    // Handle debuff decay modification
    if (gameState.currentBattle) {
      const decayRates = gameState.currentBattle.DEBUFF_DECAY_RATES;

      this.appliedSkills[characterType].forEach((skillData, skillName) => {
        switch (skillName) {
          case 'Lingering Venom':
            if (effect === 'poison') {
              // Modify decay rate for poison
              const slowFactor = 1 - (skillData.calculatedValues[0] / 100);
              const oldRate = decayRates.poison;
              decayRates.poison = (battleTime) => {
                const baseDecay = oldRate(battleTime);
                return baseDecay * slowFactor; // Slower decay
              };
            }
            break;

          case 'Lingering Embers':
            if (effect === 'burn') {
              // Modify decay rate for burn
              const slowFactor = 1 - (skillData.calculatedValues[0] / 100);
              const oldRate = decayRates.fire;
              decayRates.fire = (battleTime) => {
                const baseDecay = oldRate(battleTime);
                return baseDecay * slowFactor; // Slower decay
              };
            }
            break;

          case 'Permafrost':
            if (effect === 'freeze') {
              // Modify decay rate for freeze
              const slowFactor = 1 - (skillData.calculatedValues[0] / 100);
              const oldRate = decayRates.freeze;
              decayRates.freeze = (battleTime) => {
                const baseDecay = oldRate(battleTime);
                return baseDecay * slowFactor; // Slower decay
              };
            }
            break;
        }
      });
    }
  }

  // Modify damage based on skills
  modifyDamage(damageData) {
    const { source, target, damageType, amount } = damageData;
    const sourceType = source === gameState.player ? 'player' : 'enemy';
    const targetType = target === gameState.player ? 'player' : 'enemy';
    let finalDamage = amount;

    // Apply attacker damage modifiers
    this.appliedSkills[sourceType].forEach((skillData, skillName) => {
      switch (skillName) {
        case 'Physical Damage Amplifier':
          if (damageType === 'physical') {
            finalDamage *= (1 + (skillData.calculatedValues[0] / 100));
          }
          break;

        case 'Magical Damage Amplifier':
          if (damageType === 'magical') {
            finalDamage *= (1 + (skillData.calculatedValues[0] / 100));
          }
          break;

        case 'Critical Strike Master':
          // Chance for double damage
          if (Math.random() * 100 < skillData.calculatedValues[0]) {
            finalDamage *= 2;
            this.logSkillEffect(sourceType, skillName, 'Critical strike! Double damage!');
          }
          break;

        case 'Combo Striker':
          // Increase damage on consecutive attacks
          if (!skillData.comboTarget) {
            skillData.comboTarget = target;
            skillData.comboMultiplier = 1;
          } else if (skillData.comboTarget === target) {
            skillData.comboMultiplier += (skillData.calculatedValues[0] / 100);
            finalDamage *= skillData.comboMultiplier;
            this.logSkillEffect(sourceType, skillName, `Combo attack! Damage x${skillData.comboMultiplier.toFixed(2)}`);
          } else {
            // Reset combo if attacking different target
            skillData.comboTarget = target;
            skillData.comboMultiplier = 1;
          }
          break;

        case 'Execution Specialist':
          // More damage to low health targets
          const healthThreshold = skillData.calculatedValues[1];
          const targetHealthPercent = (target.hp / target.max_hp) * 100;

          if (targetHealthPercent < healthThreshold) {
            const bonusDamage = skillData.calculatedValues[0] / 100;
            finalDamage *= (1 + bonusDamage);
            this.logSkillEffect(sourceType, skillName, `Execution damage bonus! +${(bonusDamage * 100)}%`);
          }
          break;

        case 'Toxic Expert':
          if (damageType === 'poison') {
            finalDamage *= (1 + (skillData.calculatedValues[0] / 100));
          }
          break;

        case 'Pyromancer':
          if (damageType === 'fire') {
            finalDamage *= (1 + (skillData.calculatedValues[0] / 100));
          }
          break;

        case 'Inferno':
          // Chance for fire critical
          if (damageType === 'fire' && Math.random() * 100 < skillData.calculatedValues[0]) {
            finalDamage *= 2;
            this.logSkillEffect(sourceType, skillName, 'Fire critical strike! Double damage!');
          }
          break;

        case 'Heat Transfer':
          // Bonus damage to shields with fire
          if (damageType === 'fire' && target.shield > 0) {
            finalDamage *= (1 + (skillData.calculatedValues[0] / 100));
            this.logSkillEffect(sourceType, skillName, 'Shield heat transfer! Bonus damage!');
          }
          break;

        case 'Weapon Master':
          // Weapons deal more damage
          logger.warn('source', source);
          logger.warn('source.equipment.equipment', source.equipment);
          logger.warn('source.equipment.slots', source.equipment.slots);
          if (source.equipment.slots.some(item => item && item.type && item.type.includes('weapon'))) {
            finalDamage *= (1 + (skillData.calculatedValues[0] / 100));
          }
          break;

        case 'Elemental Resonance':
          // Damage if target has all 3 debuffs
          if (target.debuffs.poison > 0 && target.debuffs.burn > 0 && target.debuffs.freeze > 0) {
            // Add periodic damage (handled separately in the battle timer)
            finalDamage += skillData.calculatedValues[0];
            this.logSkillEffect(sourceType, skillName, `Elemental resonance damage! +${skillData.calculatedValues[0]}`);
          }
          break;
      }
    });

    // Apply target damage reduction
    this.appliedSkills[targetType].forEach((skillData, skillName) => {
      switch (skillName) {
        case 'Damage Reduction':
          // Reduce all damage
          finalDamage *= (1 - (skillData.calculatedValues[0] / 100));
          break;

        case 'Physical Resistance':
          // Reduce physical damage
          if (damageType === 'physical') {
            finalDamage *= (1 - (skillData.calculatedValues[0] / 100));
          }
          break;

        case 'Magical Ward':
          // Reduce magical damage
          if (damageType === 'magical') {
            finalDamage *= (1 - (skillData.calculatedValues[0] / 100));
          }
          break;

        case 'Last Stand':
          // Damage reduction at low health
          const healthThreshold = skillData.calculatedValues[1];
          const targetHealthPercent = (target.hp / target.max_hp) * 100;

          if (targetHealthPercent < healthThreshold) {
            const damageReduction = skillData.calculatedValues[0] / 100;
            finalDamage *= (1 - damageReduction);
            this.logSkillEffect(targetType, skillName, `Last stand! Damage reduced by ${(damageReduction * 100)}%`);
          }
          break;

        case 'Endurance':
          // Reduce fatigue damage
          if (damageType === 'fatique') {
            finalDamage *= (1 - (skillData.calculatedValues[0] / 100));
          }
          break;
      }
    });

    // Apply cross-character skill effects
    const sourceSkills = this.appliedSkills[sourceType];
    const targetSkills = this.appliedSkills[targetType];

    // Check for brittle ice effect (frozen targets take more physical damage)
    if (targetSkills.has('Brittle Ice') && damageType === 'physical' && target.debuffs.freeze > 0) {
      const brittleData = targetSkills.get('Brittle Ice');
      const bonusDamage = brittleData.calculatedValues[0] / 100;
      finalDamage *= (1 + bonusDamage);
      this.logSkillEffect(targetType, 'Brittle Ice', `Target is brittle! ${(bonusDamage * 100)}% more physical damage!`);
    }

    // Apply Elemental Harmony from source if target has multiple debuffs
    if (sourceSkills.has('Elemental Harmony')) {
      const harmonyData = sourceSkills.get('Elemental Harmony');
      const debuffCount = Object.values(target.debuffs).filter(v => v > 0).length;

      if (debuffCount > 1) {
        const bonusPerDebuff = harmonyData.calculatedValues[0] / 100;
        finalDamage *= (1 + (bonusPerDebuff * (debuffCount - 1)));
        this.logSkillEffect(sourceType, 'Elemental Harmony', `Multiple debuffs! Damage increased!`);
      }
    }

    // Return modified damage (rounded to integer)
    return Math.round(finalDamage);
  }

  // Modify healing based on skills
  modifyHealing(healingData) {
    const { source, amount } = healingData;
    const sourceType = source === gameState.player ? 'player' : 'enemy';
    let finalHealing = amount;


    this.appliedSkills[sourceType].forEach((skillData, skillName) => {
      switch (skillName) {

        case 'Regeneration':
          if (healingData.fromRegeneration) {
            finalHealing = (source.max_hp * skillData.calculatedValues[0]) / 100;
          }
          break;

      }
    });

    return Math.round(finalHealing);
  }

  // Modify shield based on skills
  modifyShield(shieldData) {
    const { source, amount } = shieldData;
    const sourceType = source === gameState.player ? 'player' : 'enemy';
    let finalShield = amount;

    this.appliedSkills[sourceType].forEach((skillData, skillName) => {
      switch (skillName) {
        case 'Shield Efficiency':
          finalShield *= (1 + (skillData.calculatedValues[0] / 100));
          break;

        case 'Armor Expert':
          // Check if source has defense equipment
          const hasDefenseEquipment = source.equipment.slots.some(item => {
            return item && item.type &&
              (item.type.includes('shield') ||
                item.type.includes('light') ||
                item.type.includes('heavy'));
          });

          if (hasDefenseEquipment) {
            finalShield *= (1 + (skillData.calculatedValues[0] / 100));
          }
          break;
      }
    });

    return Math.round(finalShield);
  }

  // Check for health threshold based skills
  checkThresholdSkills(characterType) {
    const character = characterType === 'player' ? gameState.player : gameState.enemy;
    if (!character) return;

    const healthPercent = (character.hp / character.max_hp) * 100;

    this.appliedSkills[characterType].forEach((skillData, skillName) => {
      switch (skillName) {
        case 'Second Wind':
          if (!skillData.secondWindUsed &&
            healthPercent <= skillData.healthThreshold) {
            // Trigger one-time healing
            skillData.secondWindUsed = true;

            const healAmount = Math.round((character.max_hp * skillData.healAmount) / 100);
            character.hp = Math.min(character.max_hp, character.hp + healAmount);

            // Notify about HP change
            gameEvents.emit(`${characterType}HPchange`);

            // Record healing for stats
            if (gameState.currentBattle) {
              const targetIndex = characterType === 'player' ? '1' : '2';
              gameState.currentBattle.recordHealing(targetIndex, healAmount, null);
            }

            this.logSkillEffect(characterType, skillName, `Second wind triggered! Healed for ${healAmount} HP`);
          }
          break;

      }
    });
  }

  // Helper to log skill effects
  logSkillEffect(characterType, skillName, message) {
    const timestamp = gameState.currentBattle ?
      Math.round((performance.now() - gameState.currentBattle.startTime) / 100) / 10 : 0;

    const skillIcon = '✨';
    const entityName = characterType === 'player' ? 'Player' : 'Enemy';

    const logEntry = {
      time: `⏳${timestamp}`,
      message: [
        `${skillIcon} <b>${skillName}</b>`,
        { skillEffect: [`${entityName}`, message] }
      ]
    };

    // Add to battle log
    if (gameState.currentBattle) {
      gameState.currentBattle.statisticsPush(timestamp, logEntry.message);
      gameState.currentBattle.addBattleLog(timestamp, logEntry.message);
    }
  }

  // Get skill boost for a given stat type (used by Item.animate)
  getItemSpeedBoost(item) {
    const characterType = item.place.startsWith('player') ? 'player' : 'enemy';
    let speedMultiplier = 1.0;

    // Check for skills that affect item activation speed
    this.appliedSkills[characterType].forEach((skillData, skillName) => {
      switch (skillName) {
        case 'Swift Casting':
          speedMultiplier *= (1 + (skillData.calculatedValues[0] / 100));
          break;

        case 'Temporal Mastery':
          if (skillData.activationCount && skillData.activationCount % 3 === 0) {
            speedMultiplier *= (1 + (skillData.calculatedValues[0] / 100));
          }
          break;

        case 'Chronoshift':
          if (skillData.remainingInstants && skillData.remainingInstants > 0) {
            logger.warn('skillData.remainingInstants', skillData.remainingInstants);
            // Instant activation (1000x speed)
            speedMultiplier = 1000;
          }
          break;
      }
    });

    return speedMultiplier;
  }

  // Check if an activation should trigger special effects
  checkItemActivationEffects(item) {
    const characterType = item.place.startsWith('player') ? 'player' : 'enemy';
    const character = characterType === 'player' ? gameState.player : gameState.enemy;
    const opponent = characterType === 'player' ? gameState.enemy : gameState.player;

    // Apply category-based boosts
    this.appliedSkills[characterType].forEach((skillData, skillName) => {
      let stat, categoryCheck, boost;

      switch (skillName) {
        case 'Real World Specialist':
          if (item.type && item.type.includes('real')) {
            this.boostItemStats(item, skillData.calculatedValues[0]);
          }
          break;

        case 'Cyber Specialist':
          if (item.type && item.type.includes('cyber')) {
            this.boostItemStats(item, skillData.calculatedValues[0]);
          }
          break;

        case 'Fantasy Specialist':
          if (item.type && item.type.includes('fantasy')) {
            this.boostItemStats(item, skillData.calculatedValues[0]);
          }
          break;

        case 'Ancient Specialist':
          if (item.type && item.type.includes('ancient')) {
            this.boostItemStats(item, skillData.calculatedValues[0]);
          }
          break;

        case 'Accessory Enthusiast':
          if (item.type && (item.type.includes('ring') || item.type.includes('necklace'))) {
            this.boostItemStats(item, skillData.calculatedValues[0]);
          }
          break;

        case 'Companion Bond':
          if (item.type && item.type.includes('companion')) {
            this.boostItemStats(item, skillData.calculatedValues[0]);
          }
          break;

        case 'Independence':
          // Boost stats affected from self
          if (item.staticModificators && Object.keys(item.staticModificators).length > 0) {
            // Find which stats are affected by self
            this.boostItemStats(item, skillData.calculatedValues[0], true);
          }
          break;

        case 'Row Synergy':
          // Similar to Independence but for row effects
          if (item.staticModificators && Object.keys(item.staticModificators).length > 0) {
            this.boostItemStats(item, skillData.calculatedValues[0], false, true);
          }
          break;

        case 'Column Synergy':
          // Similar to Independence but for column effects
          if (item.staticModificators && Object.keys(item.staticModificators).length > 0) {
            this.boostItemStats(item, skillData.calculatedValues[0], false, false, true);
          }
          break;

        case 'Debilitating Strike':
          // Physical attacks have chance to apply random debuff
          if (item.battleStats.basePhysAttack &&
            Math.random() * 100 < skillData.calculatedValues[0]) {

            // Apply a random debuff to opponent
            const debuffs = ['poison', 'burn', 'freeze'];
            const randomDebuff = debuffs[Math.floor(Math.random() * debuffs.length)];

            opponent.debuffs[randomDebuff] += 1;

            gameEvents.emit('debuffChange', {
              target: opponent,
              effect: randomDebuff,
              battleTime: gameState.currentBattle ?
                (performance.now() - gameState.currentBattle.startTime) / 1000 : 0
            });

            this.logSkillEffect(characterType, skillName, `Applied ${randomDebuff} debuff to opponent!`);
          }
          break;

        case 'Deep Freeze':
          // Chance to double freeze debuff
          if (item.battleStats.baseFreeze &&
            Math.random() * 100 < skillData.calculatedValues[0]) {

            // Double the freeze effect of this activation
            item.battleStats.baseFreeze *= 2;
            this.logSkillEffect(characterType, skillName, `Freeze effect doubled!`);
          }
          break;
      }
    });

    return item;
  }

  // Helper method to boost item stats by percentage
  boostItemStats(item, percentage, selfOnly = false, rowOnly = false, columnOnly = false) {
    const boostFactor = percentage / 100;

    // Apply boost to base stats
    Object.keys(item.battleStats).forEach(stat => {
      // Skip non-numerical values
      if (typeof item.battleStats[stat] === 'number') {
        // Apply specific filter logic if needed
        if ((selfOnly && this.isStatSelfModified(item, stat)) ||
          (rowOnly && this.isStatRowModified(item, stat)) ||
          (columnOnly && this.isStatColumnModified(item, stat)) ||
          (!selfOnly && !rowOnly && !columnOnly)) {

          // Apply boost
          item.battleStats[stat] = Math.round(item.battleStats[stat] * (1 + boostFactor));
        }
      }
    });
  }

  // Helper method to determine if a stat is modified by self
  isStatSelfModified(item, stat) {
    return item.effects &&
      Object.entries(item.effects).some(([effect, data]) => {
        return effect.includes(stat) && data.type === 'thisSlot';
      });
  }

  // Helper method to determine if a stat is modified by row
  isStatRowModified(item, stat) {
    return item.effects &&
      Object.entries(item.effects).some(([effect, data]) => {
        return effect.includes(stat) && data.type === 'thisRow';
      });
  }

  // Helper method to determine if a stat is modified by column
  isStatColumnModified(item, stat) {
    return item.effects &&
      Object.entries(item.effects).some(([effect, data]) => {
        return effect.includes(stat) && data.type === 'thisColumn';
      });
  }

  // Check for skills that modify fatigue
  getFatigueMods(character) {
    const characterType = character === gameState.player ? 'player' : 'enemy';
    let fatigueMods = {
      delay: 0,  // Additional seconds before fatigue starts
      reduction: 1.0  // Multiplier for fatigue damage (1.0 = 100%)
    };

    this.appliedSkills[characterType].forEach((skillData, skillName) => {
      switch (skillName) {
        case 'Battle Extension':
          fatigueMods.delay += skillData.calculatedValues[0];
          break;
        case 'Endurance':
          fatigueMods.reduction *= (1 - (skillData.calculatedValues[0] / 100));
          break;
      }
    });

    return fatigueMods;
  }

  getLifeLeechAmount(character, damageDealt) {
    const characterType = character === gameState.player ? 'player' : 'enemy';
    let lifeLeechAmount = 0;
    let source = '';

    this.appliedSkills[characterType].forEach((skillData, skillName) => {
      if (skillName === 'Life Leech') {
        const leechPercentage = skillData.calculatedValues[0];
        const healAmount = Math.floor((damageDealt * leechPercentage) / 100);

        if (healAmount > 0) {
          lifeLeechAmount += healAmount;
          source = 'Life Leech';
          this.logSkillEffect(characterType, skillName, `Leeched ${healAmount} health from attack`);
        }
      }
    });

    return { amount: lifeLeechAmount, source };
  }

  // Add these methods to SkillManager in skillEffects.js
  hasSkill(characterType, skillName) {
    return this.appliedSkills[characterType] && this.appliedSkills[characterType].has(skillName);
  }

  getRegenerationAmount(character) {
    const characterType = character === gameState.player ? 'player' : 'enemy';

    if (this.hasSkill(characterType, 'Regeneration')) {
      const skillData = this.appliedSkills[characterType].get('Regeneration');
      const regenPercentage = skillData.calculatedValues[0];
      const healAmount = Math.floor((character.max_hp * regenPercentage) / 100);

      this.logSkillEffect(characterType, 'Regeneration', `Regenerated ${healAmount} health`);
      return healAmount;
    }

    return 0;
  }

  getElementalResonanceDamage(character) {
    const characterType = character === gameState.player ? 'player' : 'enemy';

    if (this.hasSkill(characterType, 'Elemental Resonance')) {
      const skillData = this.appliedSkills[characterType].get('Elemental Resonance');
      const damage = skillData.calculatedValues[0];

      this.logSkillEffect(characterType, 'Elemental Resonance', `Applied ${damage} resonance damage`);
      return damage;
    }

    return 0;
  }

  // Add these methods to SkillManager in skillEffects.js
  applyItemCategoryEnhancements(character) {
    const characterType = character === gameState.player ? 'player' : 'enemy';

    // Skip if no skills are applied
    if (!this.appliedSkills[characterType] || this.appliedSkills[characterType].size === 0) {
      return;
    }

    // Process each item
    character.equipment.slots.forEach((item, slotIndex) => {
      if (!item || !item.type) return;

      // Check for world type bonuses (Real/Cyber/Fantasy/Ancient)
      this.appliedSkills[characterType].forEach((skillData, skillName) => {
        let worldTypeBonus = 0;

        switch (skillName) {
          case 'Real World Specialist':
            if (item.type.includes('real')) {
              worldTypeBonus = skillData.calculatedValues[0];
            }
            break;
          case 'Cyber Specialist':
            if (item.type.includes('cyber')) {
              worldTypeBonus = skillData.calculatedValues[0];
            }
            break;
          case 'Fantasy Specialist':
            if (item.type.includes('fantasy')) {
              worldTypeBonus = skillData.calculatedValues[0];
            }
            break;
          case 'Ancient Specialist':
            if (item.type.includes('ancient')) {
              worldTypeBonus = skillData.calculatedValues[0];
            }
            break;
        }

        // Apply world type bonus if applicable
        if (worldTypeBonus > 0) {
          this.applyItemStatBonus(item, worldTypeBonus);
        }

        // Check for category bonuses
        let categoryBonus = 0;

        switch (skillName) {
          case 'Weapon Master':
            if (item.type.includes('weapon')) {
              categoryBonus = skillData.calculatedValues[0];
            }
            break;
          case 'Armor Expert':
            if (item.type.some(tag => ['shield', 'light', 'heavy'].includes(tag))) {
              categoryBonus = skillData.calculatedValues[0];
            }
            break;
          case 'Accessory Enthusiast':
            if (item.type.some(tag => ['ring', 'necklace'].includes(tag))) {
              categoryBonus = skillData.calculatedValues[0];
            }
            break;
          case 'Companion Bond':
            if (item.type.includes('companion')) {
              categoryBonus = skillData.calculatedValues[0];
            }
            break;
        }

        // Apply category bonus if applicable
        if (categoryBonus > 0) {
          this.applyItemStatBonus(item, categoryBonus);
        }
      });
    });
  }

  applyItemSynergies(character) {
    const characterType = character === gameState.player ? 'player' : 'enemy';

    // Skip if no skills are applied
    if (!this.appliedSkills[characterType] || this.appliedSkills[characterType].size === 0) {
      return;
    }

    // Process synergy skills
    this.appliedSkills[characterType].forEach((skillData, skillName) => {
      let selfBonus = 0, rowBonus = 0, columnBonus = 0;

      switch (skillName) {
        case 'Independence':
          selfBonus = skillData.calculatedValues[0];
          break;
        case 'Row Synergy':
          rowBonus = skillData.calculatedValues[0];
          break;
        case 'Column Synergy':
          columnBonus = skillData.calculatedValues[0];
          break;
      }

      // Apply synergy bonuses if applicable
      if (selfBonus > 0 || rowBonus > 0 || columnBonus > 0) {
        character.equipment.slots.forEach((item, slotIndex) => {
          if (!item || !item.effects) return;

          const sourceRow = Math.floor(slotIndex / CONSTANTS.EQUIPMENT_COLS);
          const sourceCol = slotIndex % CONSTANTS.EQUIPMENT_COLS;

          // Check each effect to see if it affects self, row, or column
          Object.entries(item.effects).forEach(([effectKey, effectData]) => {
            const { type: dependenceType, value: effectValue } = effectData;

            // Apply self bonus
            if (selfBonus > 0 && dependenceType === 'thisSlot') {
              this.applyBonusToSpecificEffect(item, effectKey, selfBonus);
            }

            // Apply row bonus
            if (rowBonus > 0 && dependenceType === 'thisRow') {
              this.applyBonusToSpecificEffect(item, effectKey, rowBonus);
            }

            // Apply column bonus
            if (columnBonus > 0 && dependenceType === 'thisColumn') {
              this.applyBonusToSpecificEffect(item, effectKey, columnBonus);
            }
          });
        });
      }
    });
  }

  applyItemStatBonus(item, percentage) {
    const bonusFactor = percentage / 100;

    // Apply bonus to base stats
    Object.keys(item.baseStats).forEach(stat => {
      if (typeof item.baseStats[stat] === 'number') {
        item.baseStats[stat] = Math.round(item.baseStats[stat] * (1 + bonusFactor));
      }
    });

    // Update battle stats
    item.battleStats = { ...item.baseStats };

    // Re-apply any static modificators
    if (item.staticModificators) {
      Object.entries(item.staticModificators).forEach(([stat, value]) => {
        if (item.battleStats[stat]) {
          item.battleStats[stat] += value;
        }
      });
    }

    // Update tooltip
    item.updateTooltip();
  }

  applyBonusToSpecificEffect(item, effectKey, percentage) {
    if (!item.effects[effectKey]) return;

    const bonusFactor = percentage / 100;
    const originalValue = item.effects[effectKey].value;

    // Apply bonus to effect value
    item.effects[effectKey].value = Math.round(originalValue * (1 + bonusFactor));

    // Update tooltip
    item.updateTooltip();
  }
}

// Initialize skill manager as a singleton
export const skillManager = new SkillManager();


















