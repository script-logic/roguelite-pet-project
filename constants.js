'use strict';

export const CONSTANTS = {
    FATIQUE_START_SECOND: 50,
    START_ITEMS: 1,
    START_SKILLS: 1,
    MAX_CLICK_DURATION: 300,
    GAME_EVENTS_MAX_LISTENERS: 10,
    TOUCH_DELAY: 100,
    ICON_WIDTH: 100,
    ICON_HEIGHT: 100,
    SLOT_VH_VW_SCALE: 13,
    STAGES: ['choice', 'prepare', 'battle', 'loot'],
    ITEM_INDICES: {
        TIER: 0,
        WORLD: 1,
        TIME: 2,
        MAIN_CATEGORY: 3,
        SPECIFIC_TYPE: 4,
    },
    
    CHOICE_ROWS: 1,
	CHOICE_COLS: 3,
    get CHOICE_CONTAINER_SIZE() {
        return this.CHOICE_ROWS * this.CHOICE_COLS;
    },
    INVENTORY_ROWS: 2,
    INVENTORY_COLS: 5,
    get INVENTORY_SIZE() {
        return this.INVENTORY_ROWS * this.INVENTORY_COLS;
    },
    EQUIPMENT_ROWS: 3,
    EQUIPMENT_COLS: 3,
    get EQUIPMENT_SIZE() {
        return this.EQUIPMENT_ROWS * this.EQUIPMENT_COLS;
    },
    SKILLS_ROWS: 2,
    SKILLS_COLS: 3,
    get SKILLS_SIZE() {
        return this.SKILLS_ROWS * this.SKILLS_COLS;
    },
    INVENTORY_STATS_COLS: 3,
    get INVENTORY_STATS_ROWS() {
        return Math.ceil(this.INVENTORY_SIZE / this.INVENTORY_STATS_COLS);
    },
    get INVENTORY_STATS_SIZE() {
        return this.INVENTORY_STATS_COLS * this.INVENTORY_STATS_ROWS;
    },
    STAT_SECTION_TITLES: {
        base: `Base stats:`,
        final: `Final stats:`,
        modificators: `Modificators:`
    },
    JUST_ONE_THING_WEAR: [
        /*'weapon',
        'shield',*/
        'upperBodyEquipment',
        'bottomBodyEquipment',
        'boots',
        'gloves',
        'helmet',
        'necklace',
	],
    TEXT_TO_ICON_FUNCTION: (items) => {
        return items.map(item => CONSTANTS.ICON_MAP[item] || item);
    },
    ICON_MAP: {
        // Position icons
        'thisSlot': '⟳',
        'nearUpperSlot': '⇧', 
        'nearRightSlot': '⇨',
        'nearBottomSlot': '⇩',
        'nearLeftSlot': '⇦',
        'highestRow': '☶',
        'middleRow': '☵',
        'lowestRow': '☳',
        'leftColumn': '<span class="rotate90">☳</span>',
        'middleColumn': '<span class="rotate90">☵</span>',
        'rightColumn': '<span class="rotate90">☶</span>',
        'thisColumn': '|',
        'thisRow': '—',

        // Stat and effect icons
        'baseSpeed': '⏳', 'baseSpeed_Up': '⏳',
        'baseShield': '🛡️', 'baseShield_Up': '🛡️',
        'basePhysAttack': '⚔️', 'basePhysAttack_Up': '⚔️',
        'basePoison': '☠️', 'basePoison_Up': '☠️',
        'baseBurn': '🔥', 'baseBurn_Up': '🔥',
        'baseFreeze': '❄️', 'baseFreeze_Up': '❄️',
        'baseMagic': '✨', 'baseMagic_Up': '✨',
        'baseHeal': '💊', 'baseHeal_Up': '💊',
        'baseDispel': '🌀', 'baseDispel_Up': '🌀',

        // Item quality and type icons
        'trash': '⬜', 'simple': '🟩', 'good': '🟦', 'epic': '🟪', 'legendary': '🟥',
        'real': '🌐', 'cyber': '💻', 'fantasy': '🧙', 'ancient': '🏛️',
        'medieval': '🏰', 'modern': '🏢', 'future': '🌆', 'weapon': '🗡️', 'shield': '🛡️', 'upperBodyEquipment': '🧥', 'bottomBodyEquipment': '👖',
        'boots': '🥾', 'gloves': '🧤', 'helmet': '🧢', 'ring': '💍',
        'necklace': '📿', 'companion': '🧑‍🤝‍🧑', 'human': '🚶',
        'monster': '👹', 'pet': '🐾', 'robot': '🤖', 'property': '🔑',
        'building': '🏠', 'machine': '⚙️', 'terra': '🏝️', 'melee': '🔪',
        'ranged': '🏹', 'magical': '🔮', 'techno': '📡', 'light': '🧵',
        'heavy': '🔩', 'maxHP': '🧡', 'fatique': '⚡',
    },
};

CONSTANTS.JUST_ONE_THING_WEAR_ICONS_SET = new Set(
    CONSTANTS.TEXT_TO_ICON_FUNCTION(CONSTANTS.JUST_ONE_THING_WEAR)
);
    
    
    
//🌌🧬🟫🟧💠🌃🌐🏙️🚀☘️🏞️

