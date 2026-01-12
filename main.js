'use strict';
import { CONSTANTS } from './constants.js';
import { ChoiceContainer } from './slots.js';
import { Item, Skill } from './thing.js';
import { Renderer } from './renderer.js';
import { gameEvents } from './events.js';
import { logger } from './logger.js';
import { settings } from './settings.js';
import { generateChoice } from './choice.js';
import { eventHandlersOn } from './eventHandlers.js';
import { startBattle } from './battle.js';
import { Player, Enemy } from './characters.js';
import { skillManager } from './skillEffects.js';
document.documentElement.style.setProperty('--slot-scale', CONSTANTS.SLOT_VH_VW_SCALE);


export class GameState {
    constructor() {
        this.settings = settings;
        this.allBattlesStatistics = {};
        this.roundNumber = 1;
        this.currentStage = CONSTANTS.STAGES[0];
        this.currentBattle = null;
        this.player = new Player(this);
        this.enemy = null;
        this.newSkills = null;
        this.newThings = null;
        this.isAnimating = false;
        this.renderer = new Renderer(this);
        this.itemCountSwapFlag = 0;

        Object.entries(eventHandlersOn).forEach(([event, handler]) => {
            gameEvents.on(event, handler);
        });

        gameEvents.once('gameInitialized', () => {
            this.init();
        });
    }


    handleStartChoice() {
        generateChoice();
    }


    async handleStartPrepare() {
        this.enemy = new Enemy(this);

        const itemsToAdd = Math.min(CONSTANTS.START_ITEMS, 9);
        const skillsToAdd = Math.min(CONSTANTS.START_SKILLS, 6);
        const thingsToGenerateFromRound = {
            item: itemsToAdd,
            skill: skillsToAdd,
        };

        for (let i = 0; i < this.roundNumber; i++) {
            const skillOrItem = ['skill', 'item'][Math.round(Math.random())];
            thingsToGenerateFromRound[skillOrItem] += 1;
        }

        logger.warn('thingsToGenerateFromRound', thingsToGenerateFromRound);

        try {
            for (let i = 0; i < Math.min(thingsToGenerateFromRound.item, 9); i++) {

                const emptySlots = [...this.enemy.equipment.slots.entries()]
                    .filter(([_, slot]) => slot === null)
                    .map(([index]) => index);

                if (!emptySlots.length) break;

                const randomSlotId = emptySlots[Math.floor(Math.random() * emptySlots.length)];
                const isBotItem = true;
                const excludeTags = Object.keys(this.enemy.equippedItemTags)
                    .filter(tag => CONSTANTS.JUST_ONE_THING_WEAR.includes(tag) && this.enemy.equippedItemTags[tag] > 0);

                logger.warn('excludeTags', excludeTags);

                // Generate and add item
                const thing = await generateThing(`enemy item slot ${randomSlotId}`, 'item', isBotItem, excludeTags);
                this.enemy.equipment.add(thing, randomSlotId);
                thing.setPlace('enemy-equipment');
                this.enemy.setEquippedItemTags();
            };

            for (let i = 0; i < Math.min(thingsToGenerateFromRound.skill, 6); i++) {

                const emptySlots = [...this.enemy.skills.slots.entries()]
                    .filter(([_, slot]) => slot === null)
                    .map(([index]) => index);

                if (!emptySlots.length) break;

                const randomSlotId = emptySlots[Math.floor(Math.random() * emptySlots.length)];
                const isBotItem = true;

                // Generate and add item
                const thing = await generateThing(`enemy skill slot ${randomSlotId}`, 'skill', isBotItem);
                this.enemy.skills.add(thing, randomSlotId);
                thing.setPlace('enemy-skills');
            };

            recalculateItemStaticModificators(this.enemy, 'enemy-equipment');

            this.update();
            this.renderer.updateStats(gameState.player);
            this.renderer.updateStats(gameState.enemy);
            document.querySelector('.statistics-right-buttons-container .active-button')?.click();
            document.querySelector('.statistics-left-buttons-container .active-button')?.click();

            Object.entries(this.enemy.debuffs).forEach(([debuff, value]) => {
                this.enemy.debuffs[debuff] = 0;
                gameEvents.emit(`debuffChange`, {
                    target: this.enemy,
                    effect: debuff,
                    battleTime: 0

                });
            });
        } catch (error) {
            logger.error('Initialization failed:', error);
        }
    }


    handleStartBattle() {
        if (!gameState.enemy) {
            setTimeout(() => {
                if (gameState.enemy) {
                } else {
                    logger.error('Enemy was not created');
                }
            }, 100);
            return;
        }
        startBattle();
    }


    handleItemMoved(data) {
        const { item, source, target, targetId, targetContainer, itemSwap } = data;
        item.place = target;

        const isLootStage = this.currentStage === 'loot';
        const isSourceEnemy = source === 'enemy-equipment' || source === 'enemy-skills';
        const isSourceChoice = ['new-things', 'new-skills'].includes(source);

        if (source === 'player-equipment' || target === 'player-equipment') {
            gameState.player.setEquippedItemTags();
            logger.warn('gameState.player.equippedItemTags', gameState.player.equippedItemTags);
            recalculateItemStaticModificators(gameState.player, target, itemSwap, targetId);
        }

        if (source === 'player-inventory' || target === 'player-inventory') {
            recalculateItemStaticModificators(gameState.player, target, itemSwap, targetId);
        }

        if (isLootStage && isSourceEnemy) {
            this.handleEnemyLoot();
            item.isBotItem = false;
            gameState.renderer.renderLastLogMessage(`<span>You have looted item from enemy and resolve choice. ${document.querySelector('.battle-log-message').innerHTML}</span>`);
        } else if (isSourceChoice) {
            this.removeChoiceContainer(source);
            const finishChoiceButton = document.getElementById('finish-choice-button');
            if (finishChoiceButton) finishChoiceButton.style.visibility = 'hidden';
        }

        document.querySelector('.statistics-left-buttons-container .active-button')?.click();
        document.querySelector('.statistics-right-buttons-container .active-button')?.click();
    }


    handleEnemyLoot(resolveChoice = true) {
        document.querySelector('.enemy-character-bars').style.display = 'none';
        document.querySelector('#enemy-equipment')?.remove();
        document.querySelector('#enemy-skills')?.remove();
        const buttonResolveLoot = document.querySelector('#resolve-loot-button');
        if (buttonResolveLoot) {
            buttonResolveLoot.style.visibility = 'hidden';
        }
        this.enemy = null;
        this.update();
        gameEvents.emit('nextStage', resolveChoice);
    }


    removeChoiceContainer(source) {
        const choiceContainerElement = document.getElementById('choice-container');

        if (choiceContainerElement) {
            choiceContainerElement.remove();
            this.newSkills = null;
            this.newThings = null;
            gameEvents.emit('choiceContainerRemove');
            gameEvents.emit('nextStage');
        }
    }


    update() {
        requestAnimationFrame(() => {
            this.renderer.updateRoundStageInfo();
            this.renderer.renderHero();
            if (this.enemy) {
                this.renderer.renderEnemy();
            }
        });
    }


    updateNewContainers() {
        this.newSkills = new ChoiceContainer(CONSTANTS.CHOICE_CONTAINER_SIZE);
        this.newThings = new ChoiceContainer(CONSTANTS.CHOICE_CONTAINER_SIZE);
    }


    animateEquippedItems() {
        this.player.equipment.slots.forEach(item => {
            if (item && item.place === 'player-equipment') {
                item.animate();
            }
        });
    }


    resetAnimation() {
        this.player.equipment.slots.forEach(item => {
            if (item) {
                item.reset();
            }
        });
    }
}


export const gameState = new GameState();


async function generateThing(description, thingType, isBotItem = false, excludeEquippedItems = null) {
    switch (thingType) {
        case 'item':
            const item = new Item(
                description,
                isBotItem,
                excludeEquippedItems
            );
            document.body.appendChild(item.container);
            return item;

        case 'skill':
            const skill = new Skill(
                description,
                isBotItem
            );
            document.body.appendChild(skill.container);
            return skill;

        default:
            return;
    }
}



async function main() {

    try {
        setTimeout(() => {
            gameState.renderer.setUI('body');
            gameState.renderer.setUI('equipment_stat_slots');
            gameState.renderer.setUI('skills_stat_slots');
            gameState.renderer.setUI('trash_bin');
        }, 10);

        gameState.renderer.renderLastLogMessage(`New game started! Press F11 to enter fullscreen mode. 
    Left panel: Detailed stats for your inventory items and skills.

    Center panel (top to bottom): Your active buffs, Health, Shields, Skills, Equipped Items, Backpack.

    Right panel: Menu to select a skill or item.

Make your choice and an enemy will appear. You can attack it or find another foe. Defeating an enemy with rare loot allows you to claim it!

Your goal: Survive as many rounds as you can!`);
        ['poison', 'burn', 'freeze'].forEach(debuff => gameEvents.emit('debuffChange', {
            target: gameState.player,
            effect: debuff,
            battleTime: null,
        }));

        const itemsToAdd = Math.min(CONSTANTS.START_ITEMS, 9);
        const skillsToAdd = Math.min(CONSTANTS.START_SKILLS, 6);

        for (let i = 0; i < itemsToAdd; i++) {

            const emptySlots = [...gameState.player.equipment.slots.entries()]
                .filter(([_, slot]) => slot === null)
                .map(([index]) => index);

            if (!emptySlots.length) break;

            const randomSlotId = emptySlots[Math.floor(Math.random() * emptySlots.length)];
            const isBotItem = false;
            const excludeTags = Object.keys(gameState.player.equippedItemTags)
                .filter(tag => CONSTANTS.JUST_ONE_THING_WEAR.includes(tag) && gameState.player.equippedItemTags[tag] > 0);

            const thing = await generateThing(`player item slot ${randomSlotId}`, 'item', false, excludeTags);
            gameState.player.equipment.add(thing, randomSlotId);
            thing.setPlace('player-equipment');
            gameState.player.setEquippedItemTags();
        };

        for (let i = 0; i < Math.min(skillsToAdd, 6); i++) {

            const emptySlots = [...gameState.player.skills.slots.entries()]
                .filter(([_, slot]) => slot === null)
                .map(([index]) => index);

            if (!emptySlots.length) break;

            const randomSlotId = emptySlots[Math.floor(Math.random() * emptySlots.length)];
            const isBotItem = false;
            // Generate and add item
            const thing = await generateThing(`player skill slot ${randomSlotId}`, 'skill', isBotItem);
            gameState.player.skills.add(thing, randomSlotId);
            thing.setPlace('player-skills');
        };

        recalculateItemStaticModificators(gameState.player, 'player-equipment');

        document.querySelector('#statistics-left-player-equipment-button')?.classList.add('active-button');
        document.querySelector('#statistics-right-enemy-equipment-button')?.classList.add('active-button');

        await generateChoice();

        gameState.renderer.updateStats(gameState.player);
        document.querySelector('.statistics-left-buttons-container .active-button')?.click();
        window.skillManager = skillManager;
        logger.warn('window.skillManager', window.skillManager);
        skillManager.processSkills('player');
        gameState.update();
    } catch (error) {
        logger.error('Initialization failed:', error);
    }
}


function recalculateItemStaticModificators(target, itemPlaceTarget, itemSwap = null, itemSlotTarget = null) {
    const bonusStatsLogMessage = [];
    // Clear all static modifications first
    target.equipment.slots.forEach(item => {
        if (item) {
            item.staticModificators = {};
            item.battleStats = { ...item.baseStats };
        }
    });

    if (itemPlaceTarget.includes('inventory')) {
        target.inventory.slots.forEach(item => {
            if (item) {
                item.staticModificators = {};
                item.battleStats = { ...item.baseStats };
            }
        });
    }

    if (window.skillManager) {
        window.skillManager.applyItemCategoryEnhancements(target);
    }

    target.equipment.slots.forEach((sourceItem, sourceIndex) => {
        if (!sourceItem || !sourceItem.effects) return;

        const sourceRow = Math.floor(sourceIndex / CONSTANTS.EQUIPMENT_COLS);
        const sourceCol = sourceIndex % CONSTANTS.EQUIPMENT_COLS;

        Object.entries(sourceItem.effects).forEach(([effectKey, effectData]) => {
            const { type: dependenceType, value: effectValue } = effectData;

            const targetStat = effectKey.replace('_Up', '');

            target.equipment.slots.forEach((targetItem, targetIndex) => {
                if (!targetItem) return;

                const targetRow = Math.floor(targetIndex / CONSTANTS.EQUIPMENT_COLS);
                const targetCol = targetIndex % CONSTANTS.EQUIPMENT_COLS;

                if (shouldApplyEffect(dependenceType, sourceIndex, targetIndex, sourceRow, sourceCol, targetRow, targetCol, sourceItem, targetItem)) {
                    if (!targetItem.staticModificators[targetStat]) {
                        targetItem.staticModificators[targetStat] = 0;
                    }
                    targetItem.staticModificators[targetStat] += effectValue;

                    targetItem.battleStats = { ...targetItem.baseStats };

                    Object.entries(targetItem.staticModificators).forEach(([stat, value]) => {
                        if (targetItem.battleStats[stat]) {
                            targetItem.battleStats[stat] += value;
                            const logMessage = ((itemSlotTarget === sourceIndex ||
                                itemSlotTarget === targetIndex) &&
                                (effectKey.replace('_Up', '') === stat) ?
                                `<div class="applied-effect-container"><span>+${effectValue} ${CONSTANTS.ICON_MAP[effectKey]} applied to item</span><img src="${targetItem.image.src}" class="log-item-img" title="${targetItem.description} in slot ${targetIndex + 1}"><span> from item </span><img src="${sourceItem.image.src}" class="log-item-img" title="${sourceItem.description} in slot ${sourceIndex + 1}"></div>`
                                : null);
                            if (target.characterType === 'player' && logMessage) bonusStatsLogMessage.push(logMessage);
                        }
                    });
                }

                targetItem.updateTooltip()
            });
        });
    });

    if (window.skillManager) {
        window.skillManager.applyItemSynergies(target);
    }

    if (bonusStatsLogMessage.length && (!itemSwap || gameState.itemCountSwapFlag !== 1)) {
        gameState.renderer.renderLastLogMessage(bonusStatsLogMessage.join(''));
        if (itemSwap === 0) gameState.itemCountSwapFlag++;
        if (itemSwap === 1) gameState.itemCountSwapFlag = 0;
    } else if ((target.characterType === 'player' && !itemSwap) && (gameState.round)) {
        gameState.renderer.renderLastLogMessage(`No effect bonuses was applied to another items from this item replacement`);
    }
}


export function shouldApplyEffect(dependenceType, sourceIndex, targetIndex, sourceRow, sourceCol, targetRow, targetCol, sourceItem, targetItem) {
    switch (dependenceType) {
        case 'thisSlot':
            return sourceIndex === targetIndex;

        case 'nearUpperSlot':
            return targetRow === sourceRow - 1 && targetCol === sourceCol;

        case 'nearRightSlot':
            return targetCol === sourceCol + 1 && targetRow === sourceRow;

        case 'nearBottomSlot':
            return targetRow === sourceRow + 1 && targetCol === sourceCol;

        case 'nearLeftSlot':
            return targetCol === sourceCol - 1 && targetRow === sourceRow;

        case 'highestRow':
            return targetRow === 0;

        case 'middleRow':
            return targetRow === 1;

        case 'lowestRow':
            return targetRow === 2;

        case 'thisRow':
            return targetRow === sourceRow;

        case 'leftColumn':
            return targetCol === 0;

        case 'middleColumn':
            return targetCol === 1;

        case 'rightColumn':
            return targetCol === 2;

        case 'thisColumn':
            return targetCol === sourceCol;

        default:
            return targetItem.type && targetItem.type.includes(dependenceType);
    }
}






main();







