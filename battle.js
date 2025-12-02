
'use strict';
import { CONSTANTS } from './constants.js';
import { gameEvents, eventManager } from './events.js';
import { gameState } from './main.js';
import { logger } from './logger.js';
import { initBattleCanvasData, updateChartData } from './charts.js';
import { localization } from './localization.js';

export class CurrentBattle {
    constructor() {
        this.fatiqueStartSecond = CONSTANTS.FATIQUE_START_SECOND;
    
    this.playerFatigueMods = { delay: 0, reduction: 1.0 };
    this.enemyFatigueMods = { delay: 0, reduction: 1.0 };
    
    this.fatiqueDamage = (battleTime, target) => {
        const mods = target === gameState.player ? 
                    this.playerFatigueMods : this.enemyFatigueMods;
        
        const adjustedTime = battleTime - this.fatiqueStartSecond - mods.delay;
        if (adjustedTime <= 0) return 0;
        
        return Math.max(1, Math.pow(adjustedTime, Math.log(adjustedTime / 5)) * mods.reduction);
    };
        
        this.freezeSlowMultiplier = 0.75; // 0 - 1
        this.multipliers = {
        	physicalDamageMultiplier: (self) => Math.max(1, self.debuffs.poison),
        	shieldMultiplier: (self) => 1 / Math.max(1, self.debuffs.burn),
        	healingMultiplier: (self, target) => Math.max(1, self.debuffs.freeze) / Math.max(1, target.debuffs.poison),
        	magicDamageMultiplier: (self) => Math.max(1, self.debuffs.burn),
        }
        
        // Константы для расчетов
        this.DEBUFF_DECAY_RATES = {
            poison: (battleTime) => 1 - Math.max(0.1, 1 - battleTime / 60),
            fire: (battleTime) => 1 - Math.max(0.1, 1 - battleTime / 60),
            freeze: (battleTime) => 1 - Math.max(0.1, 1 - battleTime / 60)
        };
        this.POISON_DAMAGE_RATE = 1;
        this.FIRE_DAMAGE_RATE = 1;
        this.FREEZE_ATTACK_PENALTY = 1;
        
        // Состояние битвы
        this.statistics = [];
        this.startTime = performance.now();
        this.battleEnded = false;
        this.timerInterval = null;
        
        // Данные для графиков
        this.battleCanvasDataFull = initBattleCanvasData();
        
        // Количество активаций разных эффектов на каждом предмете
        this.itemsBatteStats = {};
        
        // Инициализация
        this.startTimer();

        // Initialize regeneration timers
        this.playerRegenerationTimer = null;
        this.enemyRegenerationTimer = null;

        // Start regeneration effects
        this.startRegenerationEffects();
        
        gameEvents.on('itemActivated', this.handleItemActivation.bind(this));
        
    }
    
    startRegenerationEffects() {
        // Clear any existing timers
        if (this.playerRegenerationTimer) clearInterval(this.playerRegenerationTimer);
        if (this.enemyRegenerationTimer) clearInterval(this.enemyRegenerationTimer);

        // Set up player regeneration timer if the skill is active
        if (window.skillManager && window.skillManager.hasSkill('player', 'Regeneration')) {
            this.playerRegenerationTimer = setInterval(() => {
                if (this.battleEnded || gameState.currentStage !== 'battle') {
                    clearInterval(this.playerRegenerationTimer);
                    return;
                }

                const regenAmount = window.skillManager.getRegenerationAmount(gameState.player);
                if (regenAmount > 0) {
                    gameState.player.hp = Math.min(gameState.player.max_hp, gameState.player.hp + regenAmount);

                    // Record healing and update UI
                    const timestamp = Math.round((performance.now() - this.startTime) / 100) / 10;
                    this.recordHealing('1', regenAmount, null);
                    gameEvents.emit('playerHPchange');

                    // Add to battle log
                    const battleLogMessageData = [
                        `<span style="cursor: pointer" title="${localization[gameState.settings.localization]['Regeneration']}">💚</span>`,
                        { 
                            regeneration: [
                                `🎯${localization[gameState.settings.localization]['player']}`, 
                                `💊 ${regenAmount}`
                            ] 
                        }
                    ];
                    this.addBattleLog(timestamp, battleLogMessageData);
                }
            }, 1000); // Every second
        }

        // Set up enemy regeneration timer if the skill is active
        if (window.skillManager && window.skillManager.hasSkill('enemy', 'Regeneration') && gameState.enemy) {
            this.enemyRegenerationTimer = setInterval(() => {
                if (this.battleEnded || gameState.currentStage !== 'battle') {
                    clearInterval(this.enemyRegenerationTimer);
                    return;
                }

                const regenAmount = window.skillManager.getRegenerationAmount(gameState.enemy);
                if (regenAmount > 0) {
                    gameState.enemy.hp = Math.min(gameState.enemy.max_hp, gameState.enemy.hp + regenAmount);

                    // Record healing and update UI
                    const timestamp = Math.round((performance.now() - this.startTime) / 100) / 10;
                    this.recordHealing('2', regenAmount, null);
                    gameEvents.emit('enemyHPchange');

                    // Add to battle log
                    const battleLogMessageData = [
                        `<span style="cursor: pointer" title="${localization[gameState.settings.localization]['regeneration']}">💚</span>`,
                        { 
                            regeneration: [
                                `🎯${localization[gameState.settings.localization]['enemy']}`, 
                                `💊 ${regenAmount}`
                            ] 
                        }
                    ];
                    this.addBattleLog(timestamp, battleLogMessageData);
                }
            }, 1000); // Every second
        }
    }

    
    // Активация дебаффов
    debuffsActivated() {
        if (this.battleEnded || gameState.currentStage !== 'battle') return;
        
        const timestamp = Math.round((performance.now() - this.startTime) / 100) / 10;
        const battleLogMessageData = [`<span style="cursor: pointer" title="${localization[gameState.settings.localization]['Debuff activation']}">➰</span>`];
        const targets = [gameState.enemy, gameState.player];
        for (const target of targets) {
            const targetType = target === gameState.player ? 'player' : 'enemy';
            const debuffsTimeResistance = [`🎯${localization[gameState.settings.localization][targetType]}`];
            
            if (Math.floor(timestamp) > this.fatiqueStartSecond) {
                 const checkStopBattle = this.processFatique(target, timestamp, battleLogMessageData);
                if (checkStopBattle === 'stopBattle') break; 
            }
            
            if (Math.round(timestamp % 2) !== 0) {
                battleLogMessageData[0] = battleLogMessageData[0].replace('➰', '➰💥').replace('➰💥💥', '➰💥');
                const checkStopBattle = this.processActiveDebuffs(target, timestamp, battleLogMessageData);
                if (checkStopBattle === 'stopBattle') break; 
            } else {
                battleLogMessageData[0] = battleLogMessageData[0].replace('➰', '➰🔽').replace('➰🔽🔽', '➰🔽');

                // Расчет затухания дебаффов
                const decayRate = {
                    poison: this.DEBUFF_DECAY_RATES.poison(timestamp),
                    burn: this.DEBUFF_DECAY_RATES.fire(timestamp),
                    freeze: this.DEBUFF_DECAY_RATES.freeze(timestamp)
                };

                // Применяем затухание и обновляем сообщение
                this.applyDebuffDecay('poison', target, decayRate.poison, debuffsTimeResistance);
                this.applyDebuffDecay('burn', target, decayRate.burn, debuffsTimeResistance);
                this.applyDebuffDecay('freeze', target, decayRate.freeze, debuffsTimeResistance);
            }
            
            // Добавляем сообщение в лог, если есть что добавлять
            if (debuffsTimeResistance.length > 1) {
                battleLogMessageData.push({debuffsTimeResistance});
            }
            
            // Уведомляем о изменениях HP и SP
            this.notifyStateChanges(targetType);
        }
        
        // Обновляем данные для графиков
        updateChartData(timestamp);

        if (window.skillManager) {
            // Check player's Elemental Resonance against enemy
            this.checkElementalResonance(gameState.player, gameState.enemy, timestamp, battleLogMessageData);

            // Check enemy's Elemental Resonance against player
            this.checkElementalResonance(gameState.enemy, gameState.player, timestamp, battleLogMessageData);
        }
        
        // Добавляем сообщение в лог боя
        if (battleLogMessageData.length > 1) {
            this.addBattleLog(timestamp, battleLogMessageData);
        }
    }
    
    // Вспомогательный метод для обработки активных дебаффов
    processActiveDebuffs(target, timestamp, battleLogMessageData) {
        const debuffs = Object.entries(target.debuffs);
        for (const [debuff, value] of debuffs) {
            if (value > 0) {
                return this.processDebuff(debuff, value, target, timestamp, battleLogMessageData);
            }
        }
    }
    
    checkElementalResonance(source, target, timestamp, battleLogMessageData) {
        if (!source || !target) return;

        const sourceType = source === gameState.player ? 'player' : 'enemy';
        const targetType = target === gameState.player ? 'player' : 'enemy';

        // Check if target has all three debuffs
        if (target.debuffs.poison > 0 && target.debuffs.burn > 0 && target.debuffs.freeze > 0) {
            // Check if source has Elemental Resonance skill
            const resonanceDamage = window.skillManager.getElementalResonanceDamage(source);

            if (resonanceDamage > 0) {
                // Apply damage
                target.hp = Math.max(0, target.hp - resonanceDamage);

                // Record damage
                const targetIndex = targetType === 'player' ? '2' : '1';
                this.recordDamage(targetIndex, 'Physical', resonanceDamage, null, timestamp);

                // Add to battle log
                battleLogMessageData.push({
                    elementalResonance: [
                        `🎯${localization[gameState.settings.localization][targetType]}`, 
                        `⚡ ${resonanceDamage}`
                    ]
                });

                // Notify of HP change
                gameEvents.emit(`${targetType}HPchange`);

                // Check if battle should end
                this.checkBattleEnd(target, timestamp, battleLogMessageData);
            }
        }
    }
    
    // Вспомогательный метод для применения затухания дебаффов
    applyDebuffDecay(debuffName, target, decayRate, debuffsTimeResistance) {
        const mappedName = debuffName === 'burn' ? 'burn' : debuffName;
        const symbol = debuffName === 'poison' ? '☠️' : debuffName === 'burn' ? '🔥' : '❄️';
        
        const cut = Math.floor(target.debuffs[mappedName] * decayRate);
        if (cut !== 0) {
            
            target.debuffs[mappedName] = Math.max(0, target.debuffs[mappedName] - cut);
            
            const freezeInfo = (debuffName === 'freeze' ? ` ${localization[gameState.settings.localization]['now has slower attack speed for']} ${Math.round((1 - Math.pow(this.freezeSlowMultiplier, (target.debuffs.freeze / 100))) * 100 * 100) / 100}%` : null);
            debuffsTimeResistance.push(`${freezeInfo ? freezeInfo : ''} 🔽${symbol}${cut}`);
            
            // Обновляем данные графика
            const targetIndex = target === gameState.player ? '1' : '2';
            this.recordDebuffChange(targetIndex, debuffName, target.debuffs[mappedName]);
        }
    }
    
    // Вспомогательный метод для уведомления об изменениях состояния
    notifyStateChanges(targetType) {
        eventManager.addHandler('gameEvents.emit', gameEvents.emit(`${targetType}HPchange`));
        eventManager.addHandler('gameEvents.emit', gameEvents.emit(`${targetType}SPchange`));
    }
    
    // Запись изменений дебаффов для графиков
    recordDebuffChange(targetIndex, debuffType, value, item) {
        const timestamp = Math.round((performance.now() - this.startTime) / 100) / 10;
        const mappedType = debuffType === 'burn' ? 'Fire' : 
                          debuffType === 'poison' ? 'Poison' : 'Freeze';
        
        this.battleCanvasDataFull[`player${targetIndex}${mappedType}`].push(value);
    }

    recordDamage(targetIndex, damageType, amount, item, timestamp) {
        if (amount <= 0) return;
        
        const dataKey = `player${targetIndex}${damageType}Damage`;
        if (this.battleCanvasDataFull[dataKey]) {

            // Get the latest value (or 0 if array is empty)
            const lastValue = this.battleCanvasDataFull[dataKey].length > 0 
            ? this.battleCanvasDataFull[dataKey][this.battleCanvasDataFull[dataKey].length - 1] 
            : 0;

            // Add the new damage to the accumulated value
            const newValue = lastValue + amount;
            this.battleCanvasDataFull[dataKey].push(newValue);
        
            // Record stats for the item if provided
            if (item) {
                this.recordItemStats(item, damageType, amount);
            }

        }
    }


    // Add new method to track item statistics
    recordItemStats(item, effectType, value) {
        if (!item) return;

        // Initialize item stats if not yet present
        const itemData = {
        	itemName: item.description || localization[gameState.settings.localization]['unknown'],
        	itemId: item.container.offsetParent.id,
        };

        logger.warn('itemData', itemData);

        if (!this.itemsBatteStats[itemData.itemId]) {
            this.itemsBatteStats[itemData.itemId] = {
                item: item,
                activations: 0,
                effects: {}
            };
        }

        // Increment activations counter
        this.itemsBatteStats[itemData.itemId].activations = (this.itemsBatteStats[itemData.itemId].activations || 0) + 1;

        // Add effect value
        if (!this.itemsBatteStats[itemData.itemId].effects[effectType]) {
            this.itemsBatteStats[itemData.itemId].effects[effectType] = 0;
        }
        this.itemsBatteStats[itemData.itemId].effects[effectType] += value;
    }

    // Helper functions for item stats
    /*function summarizeActivations(item) {
        return item?.activations || 0;
    }

    function summarizeEffectValue(item, effectType) {
        return item?.effects?.[effectType] || 0;
    }*/
    
    // Запись лечения для графиков
    recordHealing(targetIndex, amount, item) {
        if (amount <= 0) return;
        
        const dataKey = `player${targetIndex}Healing`;
        if (this.battleCanvasDataFull[dataKey]) {

            // Get the latest value (or 0 if array is empty)
            const lastValue = this.battleCanvasDataFull[dataKey].length > 0 
            ? this.battleCanvasDataFull[dataKey][this.battleCanvasDataFull[dataKey].length - 1] 
            : 0;

            // Add the new damage to the accumulated value
            const newValue = lastValue + amount;
            this.battleCanvasDataFull[dataKey].push(newValue);
        }
        if (item) {
            this.recordItemStats(item, 'heal', amount);
        }
    }    
    
    // Запись щитов для графиков    
    recordShield(targetIndex, amount, item) {
        if (amount <= 0) return;
        
        const dataKey = `player${targetIndex}AddShield`;
        if (this.battleCanvasDataFull[dataKey]) {

            // Get the latest value (or 0 if array is empty)
            const lastValue = this.battleCanvasDataFull[dataKey].length > 0 
            ? this.battleCanvasDataFull[dataKey][this.battleCanvasDataFull[dataKey].length - 1] 
            : 0;

            // Add the new damage to the accumulated value
            const newValue = lastValue + amount;
            this.battleCanvasDataFull[dataKey].push(newValue);
        }
        if (item) {
            this.recordItemStats(item, 'shield', amount);
        }
    }
    
    // Запись диспела для графиков
    recordDispel(targetIndex, amount, item) {
        if (amount <= 0) return;
        
        const dataKey = `player${targetIndex}Dispel`;
        if (this.battleCanvasDataFull[dataKey]) {

            // Get the latest value (or 0 if array is empty)
            const lastValue = this.battleCanvasDataFull[dataKey].length > 0 
            ? this.battleCanvasDataFull[dataKey][this.battleCanvasDataFull[dataKey].length - 1] 
            : 0;

            // Add the new damage to the accumulated value
            const newValue = lastValue + amount;
            this.battleCanvasDataFull[dataKey].push(newValue);
        }
        
        if (item) {
            this.recordItemStats(item, 'dispel', amount);
        }
    }
    
    // Метод запуска таймера
    startTimer() {
        this.stopTimer(); // Очищаем предыдущий таймер
        this.timerInterval = setInterval(() => {
            if (!this.battleEnded) {
                this.debuffsActivated();
            } else {
                this.stopTimer();
            }
        }, 1000);
    }
    
    // Остановка таймера
    stopTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }

    // Обработка активации предмета
    handleItemActivation(item) {
        if (this.battleEnded || gameState.currentStage !== 'battle') return;
        
        const timestamp = Math.round((performance.now() - this.startTime) / 100) / 10;
        const battleLogMessageData = [`<img src="${item.image.src}" class="log-item-img" title="${item.description}">`];
        const isPlayerItem = item.place === 'player-equipment';
        const target = isPlayerItem ? gameState.enemy : gameState.player;
        const source = isPlayerItem ? gameState.player : gameState.enemy;
        const stats = item.battleStats;

        // Обработка эффектов предмета
        this.processItemEffects(stats, target, source, timestamp, battleLogMessageData, item);
        
        // Обновление UI
        this.updateUIAfterItemAction();
        
        // Обновляем данные для графиков
        updateChartData(timestamp);
        
        // Добавляем запись в лог боя
        this.addBattleLog(timestamp, battleLogMessageData);
    }
    
    // Обработка эффектов предмета
    processItemEffects(stats, target, source, timestamp, battleLogMessageData, item) {
        const effects = [
            { name: 'basePhysAttack', handler: this.dealDamage, targetObject: target },
            { name: 'baseShield', handler: this.addShield, targetObject: source },
            { name: 'baseHeal', handler: this.heal, targetObject: source },
            { name: 'baseDispel', handler: this.dispel, targetObject: source },
            { name: 'basePoison', handler: this.addPoison, targetObject: target },
            { name: 'baseBurn', handler: this.addBurn, targetObject: target },
            { name: 'baseFreeze', handler: this.addFreeze, targetObject: target },
            { name: 'baseMagic', handler: this.dealMagicDamage, targetObject: target }
        ];
        
        for (const effect of effects) {
            if (stats[effect.name] && stats[effect.name] > 0) {
                effect.handler.call(this, effect.targetObject, stats[effect.name], timestamp, battleLogMessageData, item);
            }
        }
    }
    
    // Обновление UI после действия предмета
    updateUIAfterItemAction() {
        const events = ['playerHPchange', 'playerSPchange', 'enemyHPchange', 'enemySPchange'];
        events.forEach(event => {
            eventManager.addHandler('gameEvents.emit', gameEvents.emit(event));
        });
    }
    
    // Обработка дебаффа
    processDebuff(debuff, value, target, timestamp, battleLogMessageData) {
        if (debuff === 'poison' && value > 0) {
            const checkStopBattle = this.processPoisonDebuff(target, value, timestamp, battleLogMessageData);
            if (checkStopBattle) return checkStopBattle;
        }
        
        if (debuff === 'burn' && value > 0) {
            const checkStopBattle = this.processBurnDebuff(target, value, timestamp, battleLogMessageData);
            if (checkStopBattle) return checkStopBattle;
        }
    }

    // Обработка усталости    
    processFatique(target, timestamp, battleLogMessageData) {
        const targetType = target === gameState.player ? 'player' : 'enemy';
        const targetIndex = targetType === 'player' ? '2' : '1';
        let fatiqueDamage = Math.round(this.fatiqueDamage(timestamp, target));
        let skillBonus;

        // Apply skill-based modifications
        if (window.skillManager) {
            const damageData = {
                target: target,
                damageType: 'fatique',
                amount: fatiqueDamage
            };
            const completeDamage = window.skillManager.modifyDamage(damageData);
            skillBonus = Math.round((completeDamage - fatiqueDamage) * 10) / 10;
            fatiqueDamage = completeDamage;
        }

        target.hp = Math.max(0, target.hp - fatiqueDamage);
        battleLogMessageData.push({fatiqueDamage : [`${skillBonus ? skillBonus + ' total from skills ': ''} 🎯${localization[gameState.settings.localization][targetType]}`, `⚡${fatiqueDamage}`]});

        // Запись урона для графиков
        this.recordDamage(targetIndex, 'Fatique', fatiqueDamage, null, timestamp);

	return this.checkBattleEnd(target, timestamp, battleLogMessageData);
    }
    
    // Обработка эффекта яда
    processPoisonDebuff(target, value, timestamp, battleLogMessageData) {
        const targetType = target === gameState.player ? 'player' : 'enemy';
        const targetIndex = targetType === 'player' ? '2' : '1';
        let poisonDamage = value * this.POISON_DAMAGE_RATE; 
        let skillBonus;

        // Apply skill-based modifications
        if (window.skillManager) {
            const damageData = {
                target: target,
                damageType: 'poison',
                amount: poisonDamage
            };
            const completeDamage = window.skillManager.modifyDamage(damageData);
            skillBonus = Math.round((completeDamage - poisonDamage) * 10) / 10;
            poisonDamage = completeDamage;
        }
        
        target.hp = Math.max(0, target.hp - poisonDamage);
        battleLogMessageData.push({dealPoisonDamage: [`${skillBonus ? skillBonus + ' total from skills ': ''} 🎯${localization[gameState.settings.localization][targetType]}`, `☠️${poisonDamage}`]});
        
        // Запись урона для графиков
        this.recordDamage(targetIndex, 'Poison', poisonDamage, null, timestamp);
        
        return this.checkBattleEnd(target, timestamp, battleLogMessageData);
    }
    
    // Обработка эффекта огня
    processBurnDebuff(target, value, timestamp, battleLogMessageData) {
        const targetType = target === gameState.player ? 'player' : 'enemy';
        const targetIndex = targetType === 'player' ? '2' : '1';
        let burnDamage = value * this.FIRE_DAMAGE_RATE; 
        
        let skillBonus;
        // Apply skill-based modifications
        if (window.skillManager) {
            const damageData = {
                target: target,
                damageType: 'fire',
                amount: burnDamage
            };
            const completeDamage = window.skillManager.modifyDamage(damageData);
            skillBonus = Math.round((completeDamage - burnDamage) * 10) / 10;
            burnDamage = completeDamage;
        }
        
        // Обработка щита
        if (target.shield > 0) {
            const shieldAbsorption = Math.min(target.shield, burnDamage);
            target.shield -= shieldAbsorption;
            battleLogMessageData.push({shieldDamage: [`${skillBonus ? skillBonus + ' total from skills ': ''} 🎯${localization[gameState.settings.localization][targetType]}`, `🔥⇨🛡️${shieldAbsorption}`]});
            burnDamage -= shieldAbsorption;
            
            // Запись урона по щиту для графиков
            this.recordDamage(targetIndex, 'FireShield', shieldAbsorption, null, timestamp);
        }
        
        // Если остался урон после щита
        if (burnDamage > 0) {
            target.hp = Math.max(0, target.hp - burnDamage);
            battleLogMessageData.push({hpDamage: [`${skillBonus ? skillBonus + ' total from skills ': ''} 🎯${localization[gameState.settings.localization][targetType]}`, `🔥${burnDamage}`]});
            
            // Запись урона для графиков
            this.recordDamage(targetIndex, 'Fire', burnDamage, null, timestamp);
        }
        
        return this.checkBattleEnd(target, timestamp, battleLogMessageData);
    }
    
    // Запись статистики боя
    statisticsPush(timestamp, battleLogMessageData){
        const logEntry = {
            time: `⏳${timestamp}`, 
            message: battleLogMessageData
        };
        if (battleLogMessageData.length > 1) {
            this.statistics?.push(JSON.stringify(logEntry));
        }
        return logEntry;
    }

    // Добавление сообщения в лог боя
    addBattleLog(timestamp, battleLogMessageData) {
        if (this.battleEnded) return;
        
        const battleLogMessage = document.createElement('div');
        battleLogMessage.classList.add('battle-log-message');
        const logEntry = JSON.stringify(this.statisticsPush(timestamp, battleLogMessageData));
        battleLogMessage.innerHTML = gameState.renderer.formatMessage(logEntry);
        gameState.renderer.renderLastLogMessage(logEntry);
        
        // Добавляем сообщение во все активные логи
        if (battleLogMessageData.length > 1) {
            ['left', 'right'].forEach(side => {
                const button = document.querySelector(`#statistics-${side}-game-log-button`);
                if (button?.classList.contains('active-button')) {
                    const battleLog = document.querySelector(`.statistics-${side}-content-container .game-log-text`);
                    if (battleLog) {
                        battleLog.appendChild(battleLogMessage.cloneNode(true));
                        battleLog.scrollTop = battleLog.scrollHeight;
                    }
                }
            });
        }
    }
    
    // Нанесение физического урона
    dealDamage(target, damage, timestamp, battleLogMessageData, item = null) {
        const opponent = (target === gameState.player ? gameState.enemy : gameState.player);
        const targetType = target === gameState.player ? 'player' : 'enemy';
        const targetIndex = targetType === 'player' ? '2' : '1';
        const startingDamage = damage;
        // Коэффициент урона зависит от стаков яда противника
        const physicalDamageMultiplier = this.multipliers.physicalDamageMultiplier(opponent);

        damage = Math.round(damage * physicalDamageMultiplier);
        let skillBonus;

        // Apply skill-based modifications
        if (window.skillManager) {
            const damageData = {
                source: opponent,
                target: target,
                damageType: 'physical',
                amount: damage
            };
            const completeDamage = window.skillManager.modifyDamage(damageData);
            skillBonus = Math.round((completeDamage - damage) * 10) / 10;
            damage = completeDamage;
        }
        
        // Обработка щита
        if (target.shield > 0) {
            const shieldAbsorption = Math.min(target.shield, damage);
            target.shield -= shieldAbsorption;
            battleLogMessageData.push({shieldDamage: [`${startingDamage}x${Math.round(physicalDamageMultiplier)} ${localization[gameState.settings.localization]['multiplied']} ${localization[gameState.settings.localization]['(Berserker)']} ${skillBonus ? 'and ' + skillBonus + ' total from skills': ''} 🎯${localization[gameState.settings.localization][targetType]}`, `⚔️⇨🛡️${shieldAbsorption}`]});
            damage -= shieldAbsorption;
            
            // Запись урона по щиту для графиков
            this.recordDamage(targetIndex, 'PhysicalShield', shieldAbsorption, item, timestamp);
        }
        
        // Если остался урон после щита
        if (damage > 0) {
            target.hp = Math.max(0, target.hp - damage);
            battleLogMessageData.push({hpDamage: [`${startingDamage}x${Math.round(physicalDamageMultiplier)} ${localization[gameState.settings.localization]['multiplied']} ${localization[gameState.settings.localization]['(Berserker)']} ${skillBonus ? 'and ' + skillBonus + ' total from skills': ''} 🎯${localization[gameState.settings.localization][targetType]}`, `⚔️${damage}`]});
            
            // Запись урона для графиков
            this.recordDamage(targetIndex, 'Physical', damage, item, timestamp);
        }

        // Check for Life Leech skill
        if (window.skillManager && opponent) {
            // For physical damage, apply life leech if the skill is active
            const lifeLeechData = window.skillManager.getLifeLeechAmount(opponent, damage);

            if (lifeLeechData.amount > 0) {
                // Apply the healing
                opponent.hp = Math.min(opponent.max_hp, opponent.hp + lifeLeechData.amount);

                // Add to battle log
                battleLogMessageData.push({
                    lifeLeech: [
                        `${lifeLeechData.source} 🎯${localization[gameState.settings.localization][opponent === gameState.player ? 'player' : 'enemy']}`, 
                        `💊 ${lifeLeechData.amount}`
                    ]
                });

                // Record the healing for statistics
                const healerIndex = opponent === gameState.player ? '1' : '2';
                this.recordHealing(healerIndex, lifeLeechData.amount, item);

                // Notify of HP change
                gameEvents.emit(`${opponent === gameState.player ? 'player' : 'enemy'}HPchange`);
            }
        }

        return this.checkBattleEnd(target, timestamp, battleLogMessageData);
    }
    
    // Добавление щита
    addShield(target, shield, timestamp, battleLogMessageData, item = null) {
        const opponent = (target === gameState.player ? gameState.enemy : gameState.player);
        const targetType = target === gameState.player ? 'player' : 'enemy';
        const startingShield = shield;
        
        // Коэффициент щита зависит от стаков ожога противника
        const shieldMultiplier = this.multipliers.shieldMultiplier(opponent);
        shield = Math.round(shield * shieldMultiplier);
    
        let skillBonus;
        // Apply skill-based modifications
        if (window.skillManager) {
            const shieldData = {
                source: target,
                amount: shield
            };
            const completeShield = window.skillManager.modifyShield(shieldData);
            skillBonus = Math.round((completeShield - shield) * 10) / 10;
            shield = completeShield;
        }
        
        target.shield += shield;
        battleLogMessageData.push({addShield: [`${startingShield}x${Math.round(shieldMultiplier * 100) / 100} ${localization[gameState.settings.localization]['multiplied']}  ${localization[gameState.settings.localization]['(Coal shield)']} ${skillBonus ? 'and ' + skillBonus + ' total from skills': ''} 🎯${localization[gameState.settings.localization][targetType]}`, `🛡️ ${shield}`]});
        
        const targetIndex = targetType === 'player' ? '1' : '2';
        this.recordShield(targetIndex, shield, item);
        
    }
    
    // Лечение
    heal(target, heal, timestamp, battleLogMessageData, item = null) {
        const startingHeal = heal;
        const opponent = (target === gameState.player ? gameState.enemy : gameState.player);
        const targetType = target === gameState.player ? 'player' : 'enemy';
        const targetIndex = targetType === 'player' ? '1' : '2';
        
        // Коэффициент лечения зависит от стаков заморозки противника и стаков яда цели
        const healingMultiplier = this.multipliers.healingMultiplier(opponent, target);
        let healAmount = Math.round(heal * healingMultiplier);
    
        let skillBonus;
        // Apply skill-based modifications
        if (window.skillManager) {
            const healData = {
                source: target,
                amount: healAmount
            };
            const completeHeal = window.skillManager.modifyHealing(healData);
            skillBonus = Math.round((completeHeal - healAmount) * 10) / 10;
            healAmount = completeHeal;
        }
        
        // Ограничиваем лечение максимальным здоровьем
        const previousHP = target.hp;
        target.hp = Math.min(target.max_hp, target.hp + healAmount);
        const actualHealAmount = target.hp - previousHP;
        
        if (actualHealAmount > 0) {
            battleLogMessageData.push({healed: [`${startingHeal}x${Math.round(healingMultiplier * 100) / 100} ${localization[gameState.settings.localization]['multiplied']} ${localization[gameState.settings.localization]['(Cryogenic)']}   ${skillBonus ? 'and ' + skillBonus + ' total from skills': ''} ${actualHealAmount - healAmount === 0 ? '' : '(limited by max HP)'} 🎯${localization[gameState.settings.localization][targetType]}`, `💊 ${actualHealAmount}`]});
            
            // Запись лечения для графиков
            this.recordHealing(targetIndex, actualHealAmount);
        }
    }
    
    // Снятие дебаффов
    dispel(target, dispelCount, timestamp, battleLogMessageData, item = null) {
        const targetType = target === gameState.player ? 'player' : 'enemy';
        const targetIndex = targetType === 'player' ? '1' : '2';
        const dispelMessage = [`🎯${localization[gameState.settings.localization][targetType]}`];
        
        // Находим активные дебаффы
        const activeDebuffs = Object.entries(target.debuffs)
            .filter(([debuff, value]) => value > 0)
            .map(([debuff]) => debuff);
            
        if (activeDebuffs.length === 0) return;
        
        // Отслеживаем количество снятых стаков дебаффов
        const removedDebuffs = {};
        let totalRemoved = 0;
        
        // Снимаем дебаффы
        for (let i = 0; i < dispelCount && activeDebuffs.length > 0; i++) {
            // Выбираем случайный дебафф
            const randomIndex = Math.floor(Math.random() * activeDebuffs.length);
            const debuffToRemove = activeDebuffs[randomIndex];
            
            // Отслеживаем снятие
            removedDebuffs[debuffToRemove] = (removedDebuffs[debuffToRemove] || 0) + 1;
            totalRemoved++;
            
            // Снимаем стак дебаффа
            target.debuffs[debuffToRemove]--;
            
            // Если все стаки сняты, удаляем из списка активных
            if (target.debuffs[debuffToRemove] <= 0) {
                activeDebuffs.splice(randomIndex, 1);
            }
        }
        
        // Добавляем эффекты диспела в лог боя
        Object.entries(removedDebuffs).forEach(([debuff, value]) => {
            const debuffSymbol = {
                poison: '☠️',
                burn: '🔥', 
                freeze: '❄️'
            };
            dispelMessage.push(`💠${debuffSymbol[debuff]}${value}`);
            
            // Уведомляем об изменении дебаффа
            gameEvents.emit('debuffChange', {
                target, 
                effect: debuff,
                battleTime: timestamp,
                
            });
        });
        
        // Добавляем в лог, если были сняты дебаффы
        if (dispelMessage.length > 1) {
            battleLogMessageData.push({dispel: dispelMessage});
            
            // Запись диспела для графиков
            this.recordDispel(targetIndex, totalRemoved);
        }
    }
    
    // Добавление эффекта яда
    addPoison(target, poison, timestamp, battleLogMessageData, item = null) {
        const targetType = target === gameState.player ? 'player' : 'enemy';
        const targetIndex = targetType === 'player' ? '1' : '2';
        
        target.debuffs.poison += poison;
        battleLogMessageData.push({addPoison: [`🎯${localization[gameState.settings.localization][targetType]}`, `☠️🔺${poison}`]});
        
        // Уведомляем об изменении дебаффа
        gameEvents.emit('debuffChange', { 
            target, 
            effect: 'poison', 
            battleTime: timestamp, });
        if (item) {
            this.recordItemStats(item, 'poison', poison);
        }
    }
    
    // Добавление эффекта ожога
    addBurn(target, burn, timestamp, battleLogMessageData, item = null) {
        const targetType = target === gameState.player ? 'player' : 'enemy';
        const targetIndex = targetType === 'player' ? '1' : '2';
        
        target.debuffs.burn += burn;
        battleLogMessageData.push({addBurn: [`🎯${localization[gameState.settings.localization][targetType]}`, `🔥🔺${burn}`]});
        
        // Уведомляем об изменении дебаффа
        gameEvents.emit('debuffChange', { 
            target, 
            effect: 'burn', 
            battleTime: timestamp, });
        
        if (item) {
            this.recordItemStats(item, 'burn', burn);
        }
    }
    
    // Добавление эффекта заморозки
    addFreeze(target, freeze, timestamp, battleLogMessageData, item = null) {
        const targetType = target === gameState.player ? 'player' : 'enemy';
        const targetIndex = targetType === 'player' ? '1' : '2';
        
        target.debuffs.freeze += freeze;
        battleLogMessageData.push({addFreeze: [`🎯${localization[gameState.settings.localization][targetType]} ${localization[gameState.settings.localization]['now has slower attack speed for']} ${Math.round((1 - Math.pow(this.freezeSlowMultiplier, (target.debuffs.freeze / 100))) * 100 * 100) / 100}% `, `❄️🔺${freeze}`]});
        
        // Уведомляем об изменении дебаффа
        gameEvents.emit('debuffChange', { target, effect: 'freeze', 
                battleTime: timestamp, });
        if (item) {
            this.recordItemStats(item, 'freeze', freeze);
        }
    }
    
    // Нанесение магического урона
    dealMagicDamage(target, magicDamage, timestamp, battleLogMessageData, item = null) {
        const startingDamage = magicDamage;
        const opponent = (target === gameState.player ? gameState.enemy : gameState.player);
        const targetType = target === gameState.player ? 'player' : 'enemy';
        const attacker = targetType === 'player' ? '2' : '1';
        
        // Коэффициент магического урона зависит от стаков ожога противника
        const magicDamageMultiplier = this.multipliers.magicDamageMultiplier(opponent);
        magicDamage = Math.round(magicDamage * magicDamageMultiplier);
    
        let skillBonus;
        // Apply skill-based modifications
        if (window.skillManager) {
            const damageData = {
                source: opponent,
                target: target,
                damageType: 'magical',
                amount: magicDamage
            };
            const completeDamage = window.skillManager.modifyDamage(damageData);
            skillBonus = Math.round((completeDamage - magicDamage) * 10) / 10;
            magicDamage = completeDamage;
        }
        
        target.hp = Math.max(0, target.hp - magicDamage);
        battleLogMessageData.push({dealMagicDamage: [`${startingDamage}x${Math.round(magicDamageMultiplier)} ${localization[gameState.settings.localization]['multiplied']} ${localization[gameState.settings.localization]['(Fire power)']}  ${skillBonus ? 'and ' + skillBonus + ' total from skills': ''} 🎯${localization[gameState.settings.localization][targetType]}`, `✨${magicDamage}`]});
        
        // Запись магического урона для графиков
        this.recordDamage(attacker, 'Magical', magicDamage, item, timestamp);

        return this.checkBattleEnd(target, timestamp, battleLogMessageData);
    }
    
    // Проверка окончания боя
    checkBattleEnd(target, timestamp, battleLogMessageData) {
        if (target.hp <= 0 && !this.battleEnded) {
            this.battleEnded = true;
            this.stopTimer();
            
            // Останавливаем анимацию
            gameState.resetAnimation();
            gameState.isAnimating = false;
            
            // Уведомляем об изменении HP и SP
            const targetType = target === gameState.player ? 'player' : 'enemy';
            gameEvents.emit(`${targetType}HPchange`);
            gameEvents.emit(`${targetType}SPchange`);
            
            // Обрабатываем окончание боя
            this.handleBattleEnd(target === gameState.enemy, timestamp, battleLogMessageData);
            return 'stopBattle';
        }
        return false;
    }

    // Обработка окончания боя
    handleBattleEnd(playerWon, timestamp, battleLogMessageData) {
        if (gameState.currentStage !== 'battle') return;
        
        gameState.isAnimating = false;
        gameState.resetAnimation();
        
        // Сохраняем финальные данные для графиков
        updateChartData(timestamp);
        
        if (playerWon) {
            // Сохраняем статистику боя
            this.statisticsPush(timestamp, battleLogMessageData);
            gameState.allBattlesStatistics[gameState.roundNumber] = [...this.statistics];
            this.statistics = null;
            
            // Обновляем игровые логи
            this.updateGameLogs();
            
            // Переходим к следующему этапу
            gameEvents.removeAllListeners('itemActivated');
            logger.warn('this.itemsBatteStats', this.itemsBatteStats);
            gameEvents.emit('nextStage');
        } else {
            // Завершаем игру
            gameEvents.removeAllListeners('itemActivated');
            
            logger.warn('this.itemsBatteStats', this.itemsBatteStats);
            gameEvents.emit('gameOver');
            gameState.renderer.renderLastLogMessage('Game over!');
        }
    }
    
    // Обновление игровых логов
    updateGameLogs() {
        ['left', 'right'].forEach(side => {
            const button = document.querySelector(`#statistics-${side}-game-log-button`);
            if (button?.classList.contains('active-button')) {
                gameState.renderer.renderGameLog(side);
            }
        });
    }
}

// Функция запуска боя
export function startBattle() {
    gameState.currentBattle = new CurrentBattle();
    gameState.isAnimating = true;

    // Initialize skill effects for battle
    if (window.skillManager) {
        // Update fatigue modifiers based on skills
        gameState.currentBattle.playerFatigueMods = 
            window.skillManager.getFatigueMods(gameState.player);
        gameState.currentBattle.enemyFatigueMods = 
            window.skillManager.getFatigueMods(gameState.enemy);
    }

    // Start item animations
    const handleItemAnimation = (slots) => {
        slots.forEach(item => {
            if (item && !item.skill) {
                item.animate(item => gameEvents.emit('itemActivated', item));
            }
        });
    };

    handleItemAnimation(gameState.player.equipment.slots);
    handleItemAnimation(gameState.enemy.equipment.slots);
}













