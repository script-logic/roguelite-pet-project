

import { CONSTANTS } from './constants.js';
import { logger } from './logger.js';
import { gameState } from './main.js'

const testingMultiplier = null; // 5 or null

export const categoryThingTier = ['trash', 'simple', 'good', 'epic', 'legendary'];

export const categoryWorldEpoch = {
	world: ['real', 'cyber', 'fantasy'],
    epoch: ['ancient', 'medieval', 'modern', 'future'],
};


export const categoryThingType = {
    weapon: ['melee', 'ranged', 'magical'],
    shield: ['techno', 'magical'],
    upperBodyEquipment: ['light', 'heavy', 'magical'],
    bottomBodyEquipment: ['light', 'heavy', 'magical'],
    boots: ['light', 'heavy', 'magical'],
    gloves: ['light', 'heavy', 'magical'],
    helmet: ['light', 'heavy', 'magical'],
    necklace: ['techno', 'magical'],
    ring: ['techno', 'magical'],
	companion: [ 'human', 'monster', 'pet', 'robot'],
	property: [ 'building', 'machine', 'terra'],
};

export const allTags = ['real', 'cyber', 'fantasy', 'ancient', 'medieval', 'modern', 'future', 'melee', 'ranged', 'magical', 'techno', 'light', 'heavy', 'human', 'monster', 'pet', 'robot', 'building', 'machine', 'terra'];
Object.keys(categoryThingType).forEach(el => allTags.push(el));

export const baseStats = {
	baseSpeed: 0,
    baseShield: 0,
    basePhysAttack: 0,
    basePoison: 0,
    baseBurn: 0,
    baseFreeze: 0,
    baseMagic: 0,
    baseHeal: 0,
    baseDispel: 0,
}

export const baseStatsFirstRound = {
    basePhysAttack: 0,
    basePoison: 0,
    baseBurn: 0,
    baseMagic: 0,
    baseDispel: 0,
}

const dependenceVariety = [
    /*'highestRow', 
    'middleRow', 
    'lowestRow',
    'leftColumn', 
    'middleColumn', 
    'rightColumn',   
    'thisSlot', */
    'nearUpperSlot', 
    'nearRightSlot', 
    'nearBottomSlot',
    'nearLeftSlot', 
    'thisColumn',
    'thisRow', 
    'type'
];

export const itemEffects = {
	baseSpeed_Up: dependenceVariety,
    baseShield_Up: dependenceVariety,
    basePhysAttack_Up: dependenceVariety,
    basePoison_Up: dependenceVariety,
    baseBurn_Up: dependenceVariety,
    baseFreeze_Up: dependenceVariety,
    baseMagic_Up: dependenceVariety,
    baseHeal_Up: dependenceVariety,
    baseDispel_Up: dependenceVariety,
}

export function generateItem(tierCategories, worldEpochCategories, thingTypeCategories, isBotItem = false, excludeEquippedItems = null) {

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
            logger.warn('chance',chance);
            // Random roll
            const roll = Math.random() * (testingMultiplier ? testingMultiplier : 100);
            logger.warn('roll', roll);
            if (roll < chance) {
                return arr[i];
            }
        }

        // Fallback to trash if nothing else is selected
        return arr[0]; // 'trash'
    };
    
    const getRandomKey = (obj) => {
        const keys = Object.keys(obj);
        return keys[Math.floor(Math.random() * keys.length)];
    };

    // Создаем массив с фиксированным порядком свойств
    const itemType = {
        0: getTierCategory(tierCategories),  // tier
        1: getRandomFromArray(worldEpochCategories.world), // world
        2: '', // epoch
        3: '', // mainCategory
        4: '', // specificType
    };
    
    let epochCategory;
	if (itemType[CONSTANTS.ITEM_INDICES.WORLD] === 'cyber') {
        epochCategory = getRandomFromArray(worldEpochCategories.epoch.filter(type => type !== 'ancient' && type !== 'medieval'));
    } else {
    	epochCategory = getRandomFromArray(worldEpochCategories.epoch);
    }
    let thingTypeCategoriesFiltered;
    if (excludeEquippedItems && excludeEquippedItems.length > 0) {
        thingTypeCategoriesFiltered = Object.keys(thingTypeCategories).filter(type => !excludeEquippedItems.includes(type));
    }
    //logger.warn('thingTypeCategoriesFiltered',thingTypeCategoriesFiltered);
    const mainCategory = thingTypeCategoriesFiltered ? getRandomFromArray(thingTypeCategoriesFiltered) : getRandomKey(thingTypeCategories);
    //logger.warn('mainCategory',mainCategory)
    
    let specificType;
    if (itemType[CONSTANTS.ITEM_INDICES.WORLD] === 'real') {
        specificType = getRandomFromArray(thingTypeCategories[mainCategory].filter(type => type !== 'magical'));
    } else {
    	specificType = getRandomFromArray(thingTypeCategories[mainCategory]);
    }
    
    itemType[CONSTANTS.ITEM_INDICES.TIME] = epochCategory;
    itemType[CONSTANTS.ITEM_INDICES.MAIN_CATEGORY] = mainCategory;
    itemType[CONSTANTS.ITEM_INDICES.SPECIFIC_TYPE] = specificType;

    const itemTypeArray = Object.values(itemType);
    const itemStats = generateItemStats(itemTypeArray, isBotItem);

    // Возвращаем объект с типом предмета и его статами
    return {
        type: itemTypeArray,
        ...itemStats
    };
}


function generateItemStats(itemType, isBotItem = false) {
    const stats = {
        baseSpeed: Math.floor(Math.random() * 5) + 5
    };
    const effects = {};
    
    // Получаем индекс тира предмета из categoryThingTier
    const tierIndex = categoryThingTier.indexOf(itemType[0]) + 1;
    const isReal = itemType[1] === 'real';
    const baseStatsNumber = Math.floor(Math.random() * (tierIndex - 1)) + 1;
    const effectsNumber = tierIndex - baseStatsNumber;
    
    // Генерация базовых статов
    if (tierIndex > 0) {
        const baseStatsKeys = (gameState.roundNumber === 1 && !isBotItem ?  Object.keys(baseStatsFirstRound) : Object.keys(baseStats));
        for (let i = 0; i < baseStatsNumber; i++) {
            const randomStatKey = baseStatsKeys[Math.floor(Math.random() * baseStatsKeys.length)];
            
            // Пропускаем magical для real предметов
            if (isReal && randomStatKey === 'baseMagic') {
                i--;
                continue;
            }
            let statRangeMultiplier = 1;
            if (randomStatKey === 'basePhysAttack' || randomStatKey === 'baseMagic') statRangeMultiplier = 2;
            // прибавляем к существующему значению или добавляем новое
            if (Object.keys(stats).includes(randomStatKey)) {
                stats[randomStatKey] += Math.floor(Math.random() * tierIndex * statRangeMultiplier) + 1;
            } else {
                stats[randomStatKey] = Math.floor(Math.random() * tierIndex * statRangeMultiplier) + 1;
            }
        }
    }

    //  Генерация эффектов
    if (tierIndex > 0) {
        const effectKeys = Object.keys(itemEffects).filter(key => {
            // Фильтруем magical эффекты для real предметов
            return !(isReal && key.includes('magic'));
        });

        for (let i = 0; i < effectsNumber; i++) {
            const randomEffectKey = effectKeys[Math.floor(Math.random() * effectKeys.length)];
            let dependency = dependenceVariety[Math.floor(Math.random() * dependenceVariety.length)];
            
            if (dependency === 'type') {
                const categoryTypes = [
                    ...new Set([
                        ...Object.values(categoryThingType).flat(),
                        ...Object.values(categoryWorldEpoch).flat(),
                        ...Object.values(categoryThingType).flat()
                    ])
                ];
                dependency = categoryTypes[Math.floor(Math.random() * categoryTypes.length)];
            }

            // Добавляем значение к эффекту
            if (Object.keys(effects).includes(randomEffectKey)) {
                effects[randomEffectKey].value += Math.floor(Math.random() * tierIndex) + 1;
            } else {
                effects[randomEffectKey] = {
                    type: dependency,
                    value: Math.floor(Math.random() * tierIndex) + 1
                };
            }
        }
    }

    return { stats, effects };
}



















