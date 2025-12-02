

export const wiki = {
    type: {
        trash: `Trash tier. Have only 1 random additional affix with 1-2 max value`, 
        simple: `Simple tier. Have only 2 random additional affixes with 1-4 max value. Same affixes are summarizing`,  
        good: `Good tier. Have 3 random additional affixes with 1-6 max value. Same affixes are summarizing`, 
        epic: `Epic tier. Have 4 random additional affixes with 1-8 max value. Same affixes are summarizing`, 
        legendary: `Legendary maximum tier. Have 5 random additional affixes with 1-10 max value. Same affixes are summarizing`,
        real: `Item from real world`, 
        cyber: `Item from cyber world`,  
        fantasy: `Item from fantasy world`, 
        ancient: `Item from ancient epoch`,  
        medieval: `Item from medieval epoch`,  
        modern: `Item from modern epoch`,
        future: `Item from future epoch`,  
        weapon:`This is the weapon`,   
        melee: `This weapon is melee type`,   
        ranged: `This weapon is ranged type`,   
        magical: `Magical type`,  
        shield: `This is the shield`,  
        techno: `Type is techno`,  
        upperBodyEquipment:`Chest armor. Can wear only 1 item of this type`,   
        light: `Light armor`,   
        heavy: `Heavy armor`,  
        bottomBodyEquipment:`Leg armor. Can wear only 1 item of this type`,  
        boots:`Boots. Can wear only 1 item of this type`,   
        gloves:`Gloves. Can wear only 1 item of this type`,   
        helmet:`Helmet. Can wear only 1 item of this type`, 
        necklace:`Necklace. Can wear only 1 item of this type`, 
        ring:`Ring`, 
        companion:`Companion`,  
        human:`Type of companion is human`,  
        monster:`Type of companion is monster`,  
        pet:`Type of companion is pet`, 
        robot:`Type of companion is robot`, 
        property:`This is a private property`,  
        building:`Type of the property is building`, 
        machine:`Type of the property is machine`,  
        terra:`Type of the property is terra`, 
    },
    stats: {
        baseSpeed: (value = 'some') => `Activating ${value} times per minute (every ${typeof value === 'string' ? value : Math.round(60 / value * 10) / 10} seconds)`,
        baseShield: (value = 'some') => `Every activation gives ${value} shield${value === 'some' || typeof value === 'number' && value > 1 ? 's' : ''} that can absorbs fire and physical damage. Coal shield: cuts by self fire debuffs (minimum x1)`,
        basePhysAttack: (value = 'some') => `Every activation attacks enemy with ${value} physical damage. Berserker: multiplied equal to self poison debuffs`,
        basePoison: (value = 'some') => `Every activation gives ${value} poison debuffs to enemy. Every even second of the battle enemy takes poison damage equal to sum of poison debuffs`,
        baseBurn: (value = 'some') => `Every activation gives ${value} fire debuffs to enemy. Every even second of the battle enemy takes fire damage equal to sum of fire debuffs`,
        baseFreeze: (value = 'some') => `Every activation gives ${value} freeze debuffs to enemy. Slowing enemy item activations`,
        baseMagic: (value = 'some') => `Every activation attacks enemy with ${value} magical damage. Don't blocked by shield. Fire power: multiplied equal to self fire debuffs`,
        baseHeal: (value = 'some') => `Every activation heals self with ${value} HP. Cryogenic: multiplied equal to self freeze debuffs but cuts by opponent poison (minimum x1)`,
        baseDispel: (value = 'some') => `Every activation dispel self debufs with sum of ${value}`,
        maxHP: (value = 'some') => `Maximum ${value} possible health points`,  
        fatique: (value = 'some') => `Deals ${value} physical damage every second when battle goes long`,
    },
    dependencies: {
        thisSlot: 'self', 
        nearUpperSlot: 'item in near upper slot, if it has this effect', 
        nearRightSlot: 'item in near right slot, if it has this effect', 
        nearBottomSlot: 'item in near bottom slot, if it has this effect',
        nearLeftSlot: 'item in near left slot, if it has this effect', 
        /*'highestRow', 
        'middleRow', 
        'lowestRow',
        'leftColumn', 
        'middleColumn', 
        'rightColumn',*/ 
        thisColumn: 'all items that have this effect (including self)  in column, in which this item is placed', 
        thisRow: 'all items that have this effect (including self) in row, in which this item is placed',  
        type: 'all equipped items (including self) that have this effect and tag',
    },
    statMods: {
        baseSpeed_Up: (dependence, value) => `Gives additional ${value} speed for ${wiki.dependencies[dependence] || wiki.dependencies.type}`,
        baseShield_Up: (dependence, value) => `Gives additional ${value} shield for ${wiki.dependencies[dependence] || wiki.dependencies.type}`,
        basePhysAttack_Up: (dependence, value) => `Gives additional ${value} physical attack for ${wiki.dependencies[dependence] || wiki.dependencies.type}`,
        basePoison_Up: (dependence, value) => `Gives additional ${value} poison for ${wiki.dependencies[dependence] || wiki.dependencies.type}`,
        baseBurn_Up: (dependence, value) => `Gives additional ${value} fire for ${wiki.dependencies[dependence] || wiki.dependencies.type}`,
        baseFreeze_Up: (dependence, value) => `Gives additional ${value} freeze for ${wiki.dependencies[dependence] || wiki.dependencies.type}`,
        baseMagic_Up: (dependence, value) => `Gives additional ${value} magical damage for ${wiki.dependencies[dependence] || wiki.dependencies.type}`,
        baseHeal_Up: (dependence, value) => `Gives additional ${value} heal for ${wiki.dependencies[dependence] || wiki.dependencies.type}`,
        baseDispel_Up: (dependence, value) => `Gives additional ${value} dispel for ${wiki.dependencies[dependence] || wiki.dependencies.type}`,
	},
    debuff: {
    	poison: (battleTime, character) => `Every even second of the battle this hero takes poison damage equal to sum of his poison debuffs. As far as battle goes resistance to poison is growth ${battleTime && battleTime > 0 ? 'and since battle goes ' + battleTime + ' seconds (since last update of this debuff), then every odd second debuff cuts for ' + (Math.floor(100 - Math.max(0.1, 1 - battleTime / 60) * 100)) + '% (rounded)' : ''}`,
        burn: (battleTime, character) => `Every even second of the battle this hero takes fire damage equal to sum of his fire debuffs. As far as battle goes resistance to fire is growth ${battleTime && battleTime > 0 ? 'and since battle goes ' + battleTime + ' seconds (since last update of this debuff), then every odd second debuff cuts for ' + (Math.floor(100 - Math.max(0.1, 1 - battleTime / 60) * 100)) + '% (rounded)' : ''}`,
        freeze: (battleTime, character) => `This hero losts ${Math.round((100 - (Math.pow(0.5, character.debuffs.freeze / 100) * 100)) * 100) / 100}% of his every item's attack speed. As far as battle goes resistance to freeze is growth ${battleTime && battleTime > 0 ? 'and since battle goes ' + battleTime + ' seconds (since last update of this debuff), then every odd second debuff cuts for ' + (Math.floor(100 - Math.max(0.1, 1 - battleTime / 60) * 100)) + '% (rounded)' : ''}`,
    }
}







