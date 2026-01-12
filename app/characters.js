'use strict';

import { Inventory, Equipment, Skills } from './slots.js';
import { gameState } from './main.js';
import { logger } from './logger.js';
import { gameEvents } from './events.js';

class Creature {
    constructor(gameState) {
        this.equipment = new Equipment;
        this.skills = new Skills;
        this.max_hp = this.setMaxHP(gameState);
        this.hp = this.max_hp;
        this.shield = 0;
        this.equippedItemTags = {};
        this.debuffs = {
            poison: 0,
            burn: 0,
            freeze: 0,
        };
    }

    setMaxHP(gameState) {
        return 15 * gameState.roundNumber;
    }

    setEquippedItemTags() {
        const result = {};
        const summarizeTags = (slots) => {
            logger.warn('slots', slots);
            slots.forEach(item => {
                logger.warn('item', item);
                if (item && !item.skill) {
                    item.type.forEach(type => {
                        if (result[type]) {
                            logger.warn('type', type);
                            logger.warn('result[type]', result[type]);
                            result[type]++
                            logger.warn('result', result);
                        } else {
                            result[type] = 1;
                        }
                    });
                }
            });
        };
        summarizeTags(this.equipment.slots);
        this.equippedItemTags = result;
    }
}


export class Player extends Creature {
    constructor(gameState) {
        super(gameState)
        this.inventory = new Inventory;
        this.characterType = 'player';
    }

    resetHealthShield() {
        this.max_hp = this.setMaxHP(gameState);
        this.hp = this.max_hp;
        this.shield = 0;
        Object.entries(this.debuffs).forEach(([debuff, value]) => {
            this.debuffs[debuff] = 0;
            gameEvents.emit(`debuffChange`, { target: this, effect: debuff });
        });
        gameEvents.emit(`playerHPchange`);
        gameEvents.emit(`playerSPchange`);

    }
}


export class Enemy extends Creature {
    constructor(gameState) {
        super(gameState);
        this.characterType = 'enemy';
    }
}



