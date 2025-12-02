
import { gameState } from './main.js';
import { categoryThingTier } from './itemsBD.js';

const testingMultiplier = null; // 5 or null

function randomizeSkillStat(indexOfTier, startingValues, growthPower, valueFunctions) {
    const result = {};
    const maxStandart = (index = 0) => startingValues[index] * Math.pow(growthPower, indexOfTier);
    //logger.warn(`maxStandart`,maxStandart);
    const minStandart = (index = 0) => startingValues[index] * (indexOfTier === 0 ? 0.1 : Math.pow(growthPower, Math.round(indexOfTier - 1)));
    //logger.warn(`minStandart`,minStandart);
    const standartFunc = (index = 0) => Math.max(1, Math.round(Math.random() * (maxStandart(index) - minStandart(index)) + minStandart(index)));
    
    //logger.warn(`standartFunc`,standartFunc);
    
    if (!valueFunctions || valueFunctions.length === 0) {
		startingValues.forEach((value, i) => 
        result[`value${i}`] = standartFunc(i));
        //logger.warn(`result['value0']`,result['value0']);
        
    } else {
		valueFunctions.forEach((func, i) => {
            if (func === 'standart') {
                result[`value${i}`] = standartFunc(i);
            } else if (typeof func === 'function') {
                    //logger.warn('func',func);
                    const max = func(i, 0);
                    //logger.warn('max',max);
                    const min = indexOfTier === 0 ?
                    startingValues[i] * 0.1 : 
                    func(i, -1);
                    //logger.warn('min',min);
                    result[`value${i}`] = Math.max(1, Math.round(Math.random() * (max - min) + min));
                };
            })
        };

    //logger.warn('result',result);
    const resultValues = [];
    for (let i = 0; i < Object.keys(result).length; i++) {
    	resultValues.push(result[`value${i}`])
    }

        //logger.warn('resultValues',resultValues);
       return resultValues; 
        
}

export const skillsPool = {
   
    // COMBAT ENHANCEMENT SKILLS
    // Damage Modifiers

    'Physical Damage Amplifier': {
        calculateValues: function(tier) {
            const trashTierMaxValues = [10];
            const indexOfTier = categoryThingTier.indexOf(tier);
            const growthPower = 1.775;
            return randomizeSkillStat(indexOfTier, trashTierMaxValues, growthPower);
        },
        associatedStats: ['basePhysAttack'],
        skillType: 'damage_modifier',
        possibleTiers: ['trash','simple', 'good', 'epic', 'legendary']
    },

    'Magical Damage Amplifier': {
        calculateValues: function(tier) {
            const trashTierMaxValues = [10];
            const indexOfTier = categoryThingTier.indexOf(tier);
            const growthPower = 1.775;
            return randomizeSkillStat(indexOfTier, trashTierMaxValues, growthPower);
        },
        associatedStats: ['baseMagic'],
        skillType: 'damage_modifier',
        possibleTiers: ['trash','simple', 'good', 'epic', 'legendary']
    },

    'Critical Strike Master': {
        calculateValues: function(tier) {
            const trashTierMaxValues = [5];
            const indexOfTier = categoryThingTier.indexOf(tier);
            const growthPower = 1.775;
            return randomizeSkillStat(indexOfTier, trashTierMaxValues, growthPower);
        },
        associatedStats: ['basePhysAttack', 'baseMagic'],
        skillType: 'damage_modifier',
        possibleTiers: ['trash','simple', 'good', 'epic', 'legendary']
    },

    'Combo Striker': {
        calculateValues: function(tier) {
            const trashTierMaxValues = [5];
            const indexOfTier = categoryThingTier.indexOf(tier);
            const growthPower = 1.775;
            return randomizeSkillStat(indexOfTier, trashTierMaxValues, growthPower);
        },
        associatedStats: ['basePhysAttack', 'baseMagic'],
        skillType: 'damage_modifier',
        possibleTiers: ['trash','simple', 'good', 'epic', 'legendary']
    },

    'Execution Specialist': {
        calculateValues: function(tier) {
            const trashTierMaxValues = [5, 20];
            const indexOfTier = categoryThingTier.indexOf(tier);
            const growthPower = 2;
            const value2Function = (index, offset) => trashTierMaxValues[index] * Math.pow(1.25, indexOfTier + offset);
            return randomizeSkillStat(indexOfTier, trashTierMaxValues, growthPower, ['standart', value2Function]);
        },
        associatedStats: ['basePhysAttack', 'baseMagic'],
        skillType: 'damage_modifier',
        possibleTiers: ['trash','simple', 'good', 'epic', 'legendary']
    },

    // Defense Modifiers
    'Shield Efficiency': {
        calculateValues: function(tier) {
            const trashTierMaxValues = [10];
            const indexOfTier = categoryThingTier.indexOf(tier);
            const growthPower = 1.775;
            return randomizeSkillStat(indexOfTier, trashTierMaxValues, growthPower);
        },
        associatedStats: ['baseShield'],
        skillType: 'defense_modifier',
        possibleTiers: ['trash','simple', 'good', 'epic', 'legendary']
    },

    'Damage Reduction': {
        calculateValues: function(tier) {
            const trashTierMaxValues = [10];
            const indexOfTier = categoryThingTier.indexOf(tier);
            const growthPower = 1.4;
            return randomizeSkillStat(indexOfTier, trashTierMaxValues, growthPower);
        },
        associatedStats: ['basePhysAttack', 'baseMagic'],
        skillType: 'defense_modifier',
        possibleTiers: ['trash','simple', 'good', 'epic', 'legendary']
    },

    'Physical Resistance': {
        calculateValues: function(tier) {
            const trashTierMaxValues = [5];
            const indexOfTier = categoryThingTier.indexOf(tier);
            const growthPower = 1.775;
            return randomizeSkillStat(indexOfTier, trashTierMaxValues, growthPower);
        },
        associatedStats: ['basePhysAttack'],
        skillType: 'defense_modifier',
        possibleTiers: ['trash','simple', 'good', 'epic', 'legendary']
    },

    'Magical Ward': {
        calculateValues: function(tier) {
            const trashTierMaxValues = [5];
            const indexOfTier = categoryThingTier.indexOf(tier);
            const growthPower = 1.775;
            return randomizeSkillStat(indexOfTier, trashTierMaxValues, growthPower);
        },
        associatedStats: ['baseMagic'],
        skillType: 'defense_modifier',
        possibleTiers: ['trash','simple', 'good', 'epic', 'legendary']
    },

    // Health Management
    'Vitality': {
        calculateValues: function(tier) {
            const trashTierMaxValues = [10];
            const indexOfTier = categoryThingTier.indexOf(tier);
            const growthPower = 1.775;
            return randomizeSkillStat(indexOfTier, trashTierMaxValues, growthPower);
        },
        associatedStats: ['maxHP'],
        skillType: 'health_modifier',
        possibleTiers: ['trash','simple', 'good', 'epic', 'legendary']
    },

    'Life Leech': {
        calculateValues: function(tier) {
            const trashTierMaxValues = [3];
            const indexOfTier = categoryThingTier.indexOf(tier);
            const growthPower = 1.775;
            return randomizeSkillStat(indexOfTier, trashTierMaxValues, growthPower);
        },
        associatedStats: ['baseHeal', 'basePhysAttack',],
        skillType: 'health_modifier',
        possibleTiers: ['trash','simple', 'good', 'epic', 'legendary']
    },

    'Regeneration': {
        calculateValues: function(tier) {
            const trashTierMaxValues = [1];
            const indexOfTier = categoryThingTier.indexOf(tier);
            const growthPower = 1.3;
            return randomizeSkillStat(indexOfTier, trashTierMaxValues, growthPower);
        },
        associatedStats: ['baseHeal', 'maxHP'],
        skillType: 'health_modifier',
        possibleTiers: ['trash','simple', 'good', 'epic', 'legendary']
    },

    'Last Stand': {
        calculateValues: function(tier) {
            const trashTierMaxValues = [2, 20];
            const indexOfTier = categoryThingTier.indexOf(tier);
            const growthPower = 2;
            const value2Function = (index, offset) => trashTierMaxValues[index] * Math.pow(1.25, indexOfTier + offset);
            return randomizeSkillStat(indexOfTier, trashTierMaxValues, growthPower, ['standart', value2Function]);
        },
        associatedStats: ['baseMagic', 'basePhysAttack', 'basePoison', 'baseBurn'],
        skillType: 'threshold_effect',
        possibleTiers: ['trash','simple', 'good', 'epic', 'legendary']
    },

    // DEBUFF MANIPULATION SKILLS
    // Poison Specialization
   /* 'Toxic Expert': {
        calculateValues: function(tier) {
            const trashTierMaxValues = [5];
            const indexOfTier = categoryThingTier.indexOf(tier);
            const growthPower = 2;
            return randomizeSkillStat(indexOfTier, trashTierMaxValues, growthPower);
        },
        associatedStats: ['basePoison'],
        skillType: 'debuff_enhancement',
        possibleTiers: ['trash','simple', 'good', 'epic', 'legendary']
    },*/

    'Lingering Venom': {
        calculateValues: function(tier) {
            const trashTierMaxValues = [5];
            const indexOfTier = categoryThingTier.indexOf(tier);
            const growthPower = 2;
            return randomizeSkillStat(indexOfTier, trashTierMaxValues, growthPower);
        },
        associatedStats: ['basePoison'],
        skillType: 'debuff_enhancement',
        possibleTiers: ['trash','simple', 'good', 'epic', 'legendary']
    },

    /*'Venom Contagion': {
        calculateValues: function(tier) {
            const trashTierMaxValues = [2];
            const indexOfTier = categoryThingTier.indexOf(tier);
            const growthPower = 2;
            return randomizeSkillStat(indexOfTier, trashTierMaxValues, growthPower);
        },
        associatedStats: ['basePoison'],
        skillType: 'chance_effect',
        possibleTiers: ['trash','simple', 'good', 'epic', 'legendary']
    },*/

    /*'Toxin Master': {
        calculateValues: function(tier) {
            const trashTierMaxValues = [2];
            const indexOfTier = categoryThingTier.indexOf(tier);
            const growthPower = 2;
            return randomizeSkillStat(indexOfTier, trashTierMaxValues, growthPower);
        },
        associatedStats: ['basePoison'],
        skillType: 'debuff_enhancement',
        possibleTiers: ['trash','simple', 'good', 'epic', 'legendary']
    },*/

    // Burn Specialization
    /*'Pyromancer': {
        calculateValues: function(tier) {
            const trashTierMaxValues = [5];
            const indexOfTier = categoryThingTier.indexOf(tier);
            const growthPower = 2;
            return randomizeSkillStat(indexOfTier, trashTierMaxValues, growthPower);
        },
        associatedStats: ['baseBurn'],
        skillType: 'debuff_enhancement',
        possibleTiers: ['trash','simple', 'good', 'epic', 'legendary']
    },*/

    'Lingering Embers': {
        calculateValues: function(tier) {
            const trashTierMaxValues = [5];
            const indexOfTier = categoryThingTier.indexOf(tier);
            const growthPower = 2;
            return randomizeSkillStat(indexOfTier, trashTierMaxValues, growthPower);
        },
        associatedStats: ['baseBurn'],
        skillType: 'debuff_enhancement',
        possibleTiers: ['trash','simple', 'good', 'epic', 'legendary']
    },
/*
    'Heat Transfer': {
        calculateValues: function(tier) {
            const trashTierMaxValues = [5];
            const indexOfTier = categoryThingTier.indexOf(tier);
            const growthPower = 2;
            return randomizeSkillStat(indexOfTier, trashTierMaxValues, growthPower);
        },
        associatedStats: ['baseBurn', 'baseShield'],
        skillType: 'debuff_enhancement',
        possibleTiers: ['trash','simple', 'good', 'epic', 'legendary']
    },*/

    /*'Inferno': {
        calculateValues: function(tier) {
            const trashTierMaxValues = [5];
            const indexOfTier = categoryThingTier.indexOf(tier);
            const growthPower = 2;
            return randomizeSkillStat(indexOfTier, trashTierMaxValues, growthPower);
        },
        associatedStats: ['baseBurn'],
        skillType: 'chance_effect',
        possibleTiers: ['trash','simple', 'good', 'epic', 'legendary']
    },*/

    // Freeze Specialization
    /*'Cryomancer': {
        calculateValues: function(tier) {
            const trashTierMaxValues = [2];
            const indexOfTier = categoryThingTier.indexOf(tier);
            const growthPower = 2;
            return randomizeSkillStat(indexOfTier, trashTierMaxValues, growthPower);
        },
        associatedStats: ['baseFreeze'],
        skillType: 'debuff_enhancement',
        possibleTiers: ['trash','simple', 'good', 'epic', 'legendary']
    },*/

    'Permafrost': {
        calculateValues: function(tier) {
            const trashTierMaxValues = [5];
            const indexOfTier = categoryThingTier.indexOf(tier);
            const growthPower = 2;
            return randomizeSkillStat(indexOfTier, trashTierMaxValues, growthPower);
        },
        associatedStats: ['baseFreeze'],
        skillType: 'debuff_enhancement',
        possibleTiers: ['trash','simple', 'good', 'epic', 'legendary']
    },

    'Brittle Ice': {
        calculateValues: function(tier) {
            const trashTierMaxValues = [10];
            const indexOfTier = categoryThingTier.indexOf(tier);
            const growthPower = 1.6;
            return randomizeSkillStat(indexOfTier, trashTierMaxValues, growthPower);
        },
        associatedStats: ['baseFreeze', 'basePhysAttack'],
        skillType: 'debuff_enhancement',
        possibleTiers: ['trash','simple', 'good', 'epic', 'legendary']
    },

    /*'Deep Freeze': {
        calculateValues: function(tier) {
            const trashTierMaxValues = [2];
            const indexOfTier = categoryThingTier.indexOf(tier);
            const growthPower = 2;
            return randomizeSkillStat(indexOfTier, trashTierMaxValues, growthPower);
        },
        associatedStats: ['baseFreeze'],
        skillType: 'chance_effect',
        possibleTiers: ['trash','simple', 'good', 'epic', 'legendary']
    },*/

    // Debuff Synergy
    'Elemental Harmony': {
        calculateValues: function(tier) {
            const trashTierMaxValues = [3];
            const indexOfTier = categoryThingTier.indexOf(tier);
            const growthPower = 1.5;
            return randomizeSkillStat(indexOfTier, trashTierMaxValues, growthPower);
        },
        associatedStats: ['basePoison','baseBurn','baseFreeze'],
        skillType: 'synergy',
        possibleTiers: ['trash','simple', 'good', 'epic', 'legendary']
    },

    'Debilitating Strike': {
        calculateValues: function(tier) {
            const trashTierMaxValues = [12];
            const indexOfTier = categoryThingTier.indexOf(tier);
            const growthPower = 1.68;
            return randomizeSkillStat(indexOfTier, trashTierMaxValues, growthPower);
        },
        associatedStats:['basePhysAttack', 'basePoison', 'baseBurn', 'baseFreeze'],
        skillType: 'chance_effect',
        possibleTiers: ['trash','simple', 'good', 'epic', 'legendary']
    },

    'Elemental Resonance': {
        calculateValues: function(tier) {
            const trashTierMaxValues = [2];
            const indexOfTier = categoryThingTier.indexOf(tier);
            const growthPower = 1.5;
            return randomizeSkillStat(indexOfTier, trashTierMaxValues, growthPower);
        },
        associatedStats: ['basePoison','baseBurn','baseFreeze', 'basePhysAttack'],
        skillType: 'synergy',
        possibleTiers: ['trash','simple', 'good', 'epic', 'legendary']
    },

    // UTILITY SKILLS
    // Timer Manipulation
    'Swift Casting': {
        calculateValues: function(tier) {
            const trashTierMaxValues = [2];
            const indexOfTier = categoryThingTier.indexOf(tier);
            const growthPower = 1.5;
            return randomizeSkillStat(indexOfTier, trashTierMaxValues, growthPower);
        },
        associatedStats: ['baseSpeed'],
        skillType: 'item_efficiency',
        possibleTiers: ['trash','simple', 'good', 'epic', 'legendary']
    },

    'Time Warp': {
        calculateValues: function(tier) {
            const trashTierMaxValues = [5];
            const indexOfTier = categoryThingTier.indexOf(tier);
            const growthPower = 1.5;
            return randomizeSkillStat(indexOfTier, trashTierMaxValues, growthPower);
        },
        associatedStats: ['baseSpeed'],
        skillType: 'chance_effect',
        possibleTiers: ['trash','simple', 'good', 'epic', 'legendary']
    },

    /*

    'Temporal Mastery': {
        calculateValues: function(tier) {
            const trashTierMaxValues = [5];
            const indexOfTier = categoryThingTier.indexOf(tier);
            const growthPower = 1.5;
            return randomizeSkillStat(indexOfTier, trashTierMaxValues, growthPower);
        },
        associatedStats: ['baseSpeed'],
        skillType: 'item_efficiency',
        possibleTiers: ['trash','simple', 'good', 'epic', 'legendary']
    },*/

    // Resource Management
    'Shield Generator': {
        calculateValues: function(tier) {
            const trashTierMaxValues = [1];
            const indexOfTier = categoryThingTier.indexOf(tier);
            const growthPower = 1.25;
            return randomizeSkillStat(indexOfTier, trashTierMaxValues, growthPower);
        },
        associatedStats: ['baseShield'],
        skillType: 'passive_effect',
        possibleTiers: ['trash','simple', 'good', 'epic', 'legendary']
    },

    'Resourceful': {
        calculateValues: function(tier) {
            const trashTierMaxValues = [12];
            const indexOfTier = categoryThingTier.indexOf(tier);
            const growthPower = 1.68;
            return randomizeSkillStat(indexOfTier, trashTierMaxValues, growthPower);
        },
        associatedStats: ['baseShield', 'maxHP'],
        skillType: 'battle_start',
        possibleTiers: ['trash','simple', 'good', 'epic', 'legendary']
    },

    // Battle Control
    'Battle Extension': {
        calculateValues: function(tier) {
            const trashTierMaxValues = [2];
            const indexOfTier = categoryThingTier.indexOf(tier);
            const growthPower = 1.2;
            return randomizeSkillStat(indexOfTier, trashTierMaxValues, growthPower);
        },
        associatedStats: ['fatique'],
        skillType: 'damage_reduction',
        possibleTiers: ['trash','simple', 'good', 'epic', 'legendary']
    },

    'Endurance': {
        calculateValues: function(tier) {
            const trashTierMaxValues = [2];
            const indexOfTier = categoryThingTier.indexOf(tier);
            const growthPower = 2;
            return randomizeSkillStat(indexOfTier, trashTierMaxValues, growthPower);
        },
        associatedStats: ['fatique'],
        skillType: 'damage_reduction',
        possibleTiers: ['trash','simple', 'good', 'epic', 'legendary']
    },

    'Second Wind': {
        calculateValues: function(tier) {
            const trashTierMaxValues = [12, 10];
            const indexOfTier = categoryThingTier.indexOf(tier);
            const growthPower = 1.68;
            const value2Function = function(index, offset) {return 100 - Math.max(12, trashTierMaxValues[1] * indexOfTier * 2)};
            return randomizeSkillStat(indexOfTier, trashTierMaxValues, growthPower, ['standart', value2Function]);
        },
        associatedStats: ['baseHeal', 'maxHP'],
        skillType: 'threshold_effect',
        possibleTiers: ['trash','simple', 'good', 'epic', 'legendary']
    },
    // SYNERGY SKILLS
    // Item Synergy
    /*'Independence': {
        calculateValues: function(tier) {
            const trashTierMaxValues = [10];
            const indexOfTier = categoryThingTier.indexOf(tier);
            const growthPower = 1.8;
            return randomizeSkillStat(indexOfTier, trashTierMaxValues, growthPower);
        },
        associatedStats: ['thisSlot'],
        skillType: 'synergy',
        possibleTiers: ['trash','simple', 'good', 'epic', 'legendary']
    },

    'Row Synergy': {
        calculateValues: function(tier) {
            const trashTierMaxValues = [10];
            const indexOfTier = categoryThingTier.indexOf(tier);
            const growthPower = 1.4;
            return randomizeSkillStat(indexOfTier, trashTierMaxValues, growthPower);
        },
        associatedStats: ['thisRow'],
        skillType: 'synergy',
        possibleTiers: ['trash','simple', 'good', 'epic', 'legendary']
    },

    'Column Synergy': {
        calculateValues: function(tier) {
            const trashTierMaxValues = [10];
            const indexOfTier = categoryThingTier.indexOf(tier);
            const growthPower = 1.4;
            return randomizeSkillStat(indexOfTier, trashTierMaxValues, growthPower);
        },
        associatedStats: ['thisColumn'],
        skillType: 'synergy',
        possibleTiers: ['trash','simple', 'good', 'epic', 'legendary']
    },

    // Type Synergy
    'Real World Specialist': {
        calculateValues: function(tier) {
            const trashTierMaxValues = [10];
            const indexOfTier = categoryThingTier.indexOf(tier);
            const growthPower = 1.775;
            return randomizeSkillStat(indexOfTier, trashTierMaxValues, growthPower);
        },
        associatedStats: ['real'],
        skillType: 'item_specialist',
        possibleTiers: ['trash','simple', 'good', 'epic', 'legendary']
    },

    'Cyber Specialist': {
        calculateValues: function(tier) {
            const trashTierMaxValues = [10];
            const indexOfTier = categoryThingTier.indexOf(tier);
            const growthPower = 1.775;
            return randomizeSkillStat(indexOfTier, trashTierMaxValues, growthPower);
        },
        associatedStats: ['cyber'],
        skillType: 'item_specialist',
        possibleTiers: ['trash','simple', 'good', 'epic', 'legendary']
    },

    'Fantasy Specialist': {
        calculateValues: function(tier) {
            const trashTierMaxValues = [10];
            const indexOfTier = categoryThingTier.indexOf(tier);
            const growthPower = 1.775;
            return randomizeSkillStat(indexOfTier, trashTierMaxValues, growthPower);
        },
        associatedStats: ['fantasy'],
        skillType: 'item_specialist',
        possibleTiers: ['trash','simple', 'good', 'epic', 'legendary']
    },

    'Ancient Specialist': {
        calculateValues: function(tier) {
            const trashTierMaxValues = [10];
            const indexOfTier = categoryThingTier.indexOf(tier);
            const growthPower = 1.775;
            return randomizeSkillStat(indexOfTier, trashTierMaxValues, growthPower);
        },
        associatedStats: ['ancient'],
        skillType: 'item_specialist',
        possibleTiers: ['trash','simple', 'good', 'epic', 'legendary']
    },

    // Category Enhancement
    'Weapon Master': {
        calculateValues: function(tier) {
            const trashTierMaxValues = [10];
            const indexOfTier = categoryThingTier.indexOf(tier);
            const growthPower = 1.775;
            return randomizeSkillStat(indexOfTier, trashTierMaxValues, growthPower);
        },
        associatedStats: ['weapon','basePhysAttack','baseMagic'],
        skillType: 'category_bonus',
        possibleTiers: ['trash','simple', 'good', 'epic', 'legendary']
    },

    'Armor Expert': {
        calculateValues: function(tier) {
            const trashTierMaxValues = [10];
            const indexOfTier = categoryThingTier.indexOf(tier);
            const growthPower = 2;
            return randomizeSkillStat(indexOfTier, trashTierMaxValues, growthPower);
        },
        associatedStats: ['shield','heavy','light'],
        skillType: 'category_bonus',
        possibleTiers: ['trash','simple', 'good', 'epic', 'legendary']
    },

    'Accessory Enthusiast': {
        calculateValues: function(tier) {
            const trashTierMaxValues = [10];
            const indexOfTier = categoryThingTier.indexOf(tier);
            const growthPower = 1.775;
            return randomizeSkillStat(indexOfTier, trashTierMaxValues, growthPower);
        },
        associatedStats: ['ring', 'necklace'],
        skillType: 'category_bonus',
        possibleTiers: ['trash','simple', 'good', 'epic', 'legendary']
    },

    'Companion Bond': {
        calculateValues: function(tier) {
            const trashTierMaxValues = [10];
            const indexOfTier = categoryThingTier.indexOf(tier);
            const growthPower = 1.775;
            return randomizeSkillStat(indexOfTier, trashTierMaxValues, growthPower);
        },
        associatedStats: ['companion'],
        skillType: 'category_bonus',
        possibleTiers: ['trash','simple', 'good', 'epic', 'legendary']
    },*/

    // META GAMEPLAY SKILLS
    // Battle Rewards

    'Preparation': {
        calculateValues: function(tier) {
            const trashTierMaxValues = [2];
            const indexOfTier = categoryThingTier.indexOf(tier);
            const growthPower = 1.6;
            return randomizeSkillStat(indexOfTier, trashTierMaxValues, growthPower);
        },
        associatedStats: ['basePoison','baseBurn','baseFreeze',],
        skillType: 'battle_start',
        possibleTiers: ['trash','simple', 'good', 'epic', 'legendary']
    },
}

export function generateSkill(tierCategories, skillsPool, isBotItem = false, excludeEquippedItems = null) {

    const getRandomFromArray = (arr) => arr[Math.floor(Math.random() * arr.length)];
    const getTierCategory = (arr) => {
        // Determine maximum available tier based on round number (0-based index)
        const maxTierIndex = Math.min((testingMultiplier ? testingMultiplier : 0) + gameState.roundNumber - 1, arr.length - 1);

        // Start checking from the highest allowed tier
        for (let i = maxTierIndex; i >= 0; i--) {
            // Base chance that decreases exponentially for higher tiers
            // For the highest allowed tier, make it very low
            const baseChance = i === maxTierIndex ? testingMultiplier || 0.05 : 100 * Math.pow(0.25, maxTierIndex - i);
            //logger.warn('baseChance',baseChance);

            // Bonus from round progression - higher rounds increase all chances
            const roundBonus = (gameState.roundNumber - 1) * 0.05;
            //logger.warn('roundBonus',roundBonus);

            // Total chance for this tier
            const chance = Math.min(baseChance + roundBonus, 95); // Cap at 95% to always leave some randomness
            //logger.warn('chance',chance);
            // Random roll
            const roll = Math.random() * (testingMultiplier ? testingMultiplier : 100);
            //logger.warn('roll', roll);
            if (roll < chance) {
                return arr[i];
            }
        }

        return arr[0]; // 'trash'
    };

    const getRandomKey = (obj) => {
        const keys = Object.keys(obj);
        return keys[Math.floor(Math.random() * keys.length)];
    };

    return [
        getTierCategory(tierCategories),  // tier
        getRandomKey(skillsPool) // name
    ];
}




/*
'Chronoshift': {
        calculateValues: function(tier) {
            const trashTierMaxValues = [2];
            const indexOfTier = categoryThingTier.indexOf(tier);
            const growthPower = 1.5;
            const value1Function = function(index, offset) {return Math.max((indexOfTier + offset) * 2, 1)};
            return randomizeSkillStat(indexOfTier, trashTierMaxValues, growthPower, [value1Function]);
        },
        associatedStats: ['baseSpeed'],
        skillType: 'battle_start',
        possibleTiers: ['trash','simple', 'good', 'epic', 'legendary']
    }, 
    'Treasure Hunter': {
        calculateValues: function(tier) {
            const trashTierMaxValues = [1];
            const indexOfTier = categoryThingTier.indexOf(tier);
            const growthPower = 2;
            const value1Function = function(index, offset) {return indexOfTier + 1};
            return randomizeSkillStat(indexOfTier, trashTierMaxValues, growthPower, [value1Function]);
        },
        associatedStats: [],
        skillType: 'post_battle',
        possibleTiers: ['trash','simple', 'good', 'epic', 'legendary']
    },
*/












