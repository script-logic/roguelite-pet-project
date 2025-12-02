'use strict';
import { CONSTANTS } from './constants.js';
import { handleDragOver, handleDrop, setupDragAndDrop, getContainer } from './dragAndDrop.js';
import { eventManager, gameEvents } from './events.js';
import { logger } from './logger.js';
import { gameState, shouldApplyEffect } from './main.js';
import { allTags } from './itemsBD.js';
import { renderChart } from './charts.js';
import { wiki } from './wiki.js';
import { localization } from './localization.js';


export class Renderer {
    constructor(gameState) {
        this.gameState = gameState;
        this.UIstyleSet = Math.floor(Math.random() * 5) + 1;
        this.chartsContainer = null;
        this.domCache = {
            slots: new Map(),
            containers: new Map(),
            tables: new Map()
        };
                
        gameEvents.on('playerHPchange', () => {
			this.updateStats(gameState.player);
        });
        
        gameEvents.on('playerSPchange', () => {
			this.updateStats(gameState.player);
        });
           
        gameEvents.on('enemyHPchange', () => {
			this.updateStats(gameState.enemy);
        });
        
        gameEvents.on('enemySPchange', () => {
			this.updateStats(gameState.enemy);
        });
        
        gameEvents.on('debuffChange', (data) => {
			this.updateEffects(data.target, data.effect, data.battleTime);
        });
        
        eventManager.addHandler('render', this.renderHero.bind(this), 100);
        gameEvents.on('domUpdated', this.updateDomElements.bind(this));
        gameEvents.on('nextStage', this.updateRoundStageInfo.bind(this));
    }


    static getIcon(key) {
        return CONSTANTS.ICON_MAP[key] || '';
    }
    
    
    highlightSlot(slot, itemTier, stopHighlight = false) {
        itemTier = 'trash';
        const tierColor = {
            trash: 'white',
            /*simple: 'white',
            good: 'white',
            epic: 'white',
            legendary: 'white'*/
        };
        Object.values(tierColor).forEach(color => document.querySelectorAll(`.selected-slot-${color}`).forEach(el => el.classList.remove(`selected-slot-${color}`)));

        if (!slot || stopHighlight) return;

        slot.classList.add(`selected-slot-${tierColor[itemTier]}`);

        const id = slot.id;
        const isStats = id.includes('-stats');

        if (isStats) {
            let baseId = id.replace('-stats', '').replace('-left', '').replace('-right', '');
            if (gameState.currentStage === 'choice' && id.includes('enemy')) {
            	baseId = baseId.replace('enemy-equipment', 'new-things').replace('enemy-skills', 'new-skills');
            }
            const baseElement = document.getElementById(baseId);
            if (baseElement) baseElement.classList.add(`selected-slot-${tierColor[itemTier]}`);
        } else {
            const parts = id.split('-');
            const prefix = `${parts[0]}-${parts[1]}`.replace('new-things','enemy-equipment').replace('new-skills','enemy-skills');
            const suffix = parts[parts.length - 1];

            [`${prefix}-stats-left-${suffix}`, `${prefix}-stats-right-${suffix}`]
                .forEach(addSlotId => {
                const element = document.getElementById(addSlotId);
                if (element) element.classList.add(`selected-slot-${tierColor[itemTier]}`);
            });
        }
    }

    
    handleAnimation() {
        if (!this.gameState.isAnimating) return;
        this.updateAnimations();
    }
    
    
    updateDomElements() {
    //
    }
    
    
    updateRoundStageInfo() {
    	const roundInfo = document.querySelector('#round-info');
    	const stageInfo = document.querySelector('#stage-info');
        roundInfo.textContent = `Round ${gameState.roundNumber}`;
        stageInfo.textContent = `Stage: ${gameState.currentStage}`;
    }
    
    
    updateAnimations() {
        this.gameState.player.equipment.slots.forEach(item => {
            if (item && item.place === 'player-equipment') {
                item.animate();
            }
        });
    }
    
    
    getCachedElement(id, creator) {
        if (!this.domCache.slots.has(id)) {
            this.domCache.slots.set(id, creator());
        }
        return this.domCache.slots.get(id);
    }
    
    
    getOrCreateTable(id) {
        let isNewTable = false;
        if (!this.domCache.tables.has(id)) {
            const table = document.createElement('table');
            table.id = id;
            this.domCache.tables.set(id, table);
            isNewTable = true;
        }
        return { container: this.domCache.tables.get(id), 
                isNewTable};
    }


    getOrCreateSlot(key, className) {
        if (!this.domCache.slots.has(key)) {
            const slot = document.createElement('td');
            slot.id = key;
            slot.className = `${className}-slot`;

            slot.addEventListener('dragover', handleDragOver);
            slot.addEventListener('drop', handleDrop);

            this.domCache.slots.set(key, slot);
        } else {
            this.domCache.slots.get(key).innerHTML = '';
        }
        return this.domCache.slots.get(key);
    }

    
    renderGrid(containerId, target, rows, cols, slotType, isStats = false) {
        
        const { container, isNewTable } = this.getOrCreateTable(containerId);
        container.innerHTML = '';
        for (let row = 0; row < rows; row++) {
            const tr = container.insertRow();
            for (let col = 0; col < cols; col++) {
                const slotId = row * cols + col;
                const slotKey = `${slotType}-${slotId}`;

                let slot = this.getOrCreateSlot(slotKey, slotType);
                if (isNewTable && !containerId.includes('stat')) {

                    updateSlotBeforeStyle(slot, this.UIstyleSet);
                }
                tr.appendChild(slot);

                isStats 
                    ? this.updateStatContent(slot, slotType, slotId)
                : this.updateSlotContent(slot, slotType, slotId);
            }
        }

        if (target) {
            const element = document.querySelector(target);

            if (element) {

                if (gameState.currentStage === 'choice' && container.id.includes('enemy')) {
                    container.style.marginTop = '8vh';
                } else {
                    container.style.marginTop = '0vh';
                
                }

                if (container.id.includes('skills-stats')) {
                    container.style.marginBlockStart = '4vh';
                }
                element.appendChild(container);
            }
        }

        if (isNewTable && !containerId.includes('stat')) {
            this.setUI(containerId.replace('-', '_').replace('-', '_'));
        }
        return container;
    }


    updateSlotContent(slot, slotType, slotId) {
        const storage = this.getStorageByType(slotType);
        const newItem = storage?.slots[slotId];
        const currentItem = slot.firstChild?.parentNode === slot ? slot.firstChild : null;

        if (newItem?.container !== currentItem) {
            slot.innerHTML = '';
            if (newItem) {
                slot.appendChild(newItem.container);
                
                setupDragAndDrop(newItem.container, slotId, slotType);
            }
        }
    }   
    
    
    updateStatContent(slot, slotType, slotId) {
        const storage = this.getStorageByType(slotType);
        const newItem = storage?.slots[slotId];
        const currentItem = slot.firstChild?.parentNode === slot ? slot.firstChild : null;

        if (newItem?.container !== currentItem) {
            slot.innerHTML = '';
            if (newItem) {
                
                newItem.skill ?
                this.renderSkillStats(newItem, slot) :    
        		this.renderItemStats(newItem, slot);
                
                slotType = slotType.replace('-stats', '').replace('-left', '').replace('-right', '');
                if (gameState.currentStage === 'choice' && slotType.split('-').includes('enemy')) {
                	slotType = slotType.replace('enemy', 'new').replace('equipment', 'things');
                };
                setupDragAndDrop(slot, slotId, slotType);
            }
        }
    }
    

    getStorageByType(slotType) {
        const { player, enemy, newSkills, newThings, currentBattle } = this.gameState;

        const storageMap = {
            'player-inventory': player.inventory,
            'player-equipment': player.equipment,
            'player-skills': player.skills,
            'enemy-equipment': enemy?.equipment || newThings,
            'enemy-skills': enemy?.skills || newSkills,
            'new-skills': newSkills,
            'new-things': newThings,
            'game-log-left': currentBattle?.statistics || null,
            'game-log-right': currentBattle?.statistics || null
        };

        ['player', 'enemy'].forEach(character => {
            ['inventory', 'equipment', 'skills'].forEach(type => {
                ['left', 'right'].forEach(side => {
                    const key = `${character}-${type}-stats-${side}`;
                    storageMap[key] = character === 'player' 
                        ? player[type]
                    : (enemy?.[type] || (type === 'equipment' ? newThings : newSkills));
                });
            });
        });

        return storageMap[slotType] || null;
    }
    
    
	renderHero() {
    	this.renderInventory();
        this.renderSkills('.body-skills', 'player');
        this.renderEquipment('.body-equipment-left', 'player');
    }
    
    
    renderEnemy() {
        document.querySelector('.enemy-character-bars').style.display = 'block';
        this.renderSkills('.body-enemy-skills', 'enemy');
        this.renderEquipment('.body-equipment-right', 'enemy');
    }
    
    
    renderInventory() {
        this.renderGrid(
            'player-inventory',
            '.body-inventory', 
            CONSTANTS.INVENTORY_ROWS, 
            CONSTANTS.INVENTORY_COLS, 
            'player-inventory'
        );
    }
    

    renderEquipment(query, character) {
        this.renderGrid(
            `${character}-equipment`, 
            query, 
            CONSTANTS.EQUIPMENT_ROWS, 
            CONSTANTS.EQUIPMENT_COLS, 
            `${character}-equipment`
        );
    }
    

    renderSkills(query, character) {
        this.renderGrid(
            `${character}-skills`, 
            query, 
            CONSTANTS.SKILLS_ROWS, 
            CONSTANTS.SKILLS_COLS, 
            `${character}-skills`
        );
    }
    
    
	renderPlayerStats(side) {
    	this.renderPlayerSkillsStats(side);
    	this.renderPlayerEquipmentStats(side);
    }
    
    
	renderEnemyStats(side) {
        this.renderEnemySkillsStats(side);
    	this.renderEnemyEquipmentStats(side);
    	
    }
    
    
    renderPlayerEquipmentStats(side) {
        this.renderGrid(
            `player-equipment-stats-${side}`, 
            `.statistics-${side}-content-container`, 
            CONSTANTS.EQUIPMENT_ROWS, 
            CONSTANTS.EQUIPMENT_COLS,
            `player-equipment-stats-${side}`,
            true,
        );
    }
    

    renderPlayerSkillsStats(side) { 
        this.renderGrid(
            `player-skills-stats-${side}`, 
            `.statistics-${side}-content-container`,
            CONSTANTS.SKILLS_ROWS, 
            CONSTANTS.SKILLS_COLS,
            `player-skills-stats-${side}`,
            true,
        );
    }
    

    renderEnemyEquipmentStats(side) { 
        this.renderGrid(
            `enemy-equipment-stats-${side}`, 
            `.statistics-${side}-content-container`,
            ( gameState.currentStage === 'choice' ? CONSTANTS.CHOICE_ROWS : CONSTANTS.EQUIPMENT_ROWS), 
            CONSTANTS.EQUIPMENT_COLS,
            `enemy-equipment-stats-${side}`,
            true,
        );
    }
    

    renderEnemySkillsStats(side) { 
        this.renderGrid(
            `enemy-skills-stats-${side}`,
            `.statistics-${side}-content-container`,
            ( gameState.currentStage === 'choice' ? CONSTANTS.CHOICE_ROWS : CONSTANTS.SKILLS_ROWS), 
            CONSTANTS.SKILLS_COLS,
            `enemy-skills-stats-${side}`,
            true,
        );
    }
    
    
    renderInventoryStats(side) {
        this.renderGrid(
            `player-inventory-stats-${side}`,
            `.statistics-${side}-content-container`,
            CONSTANTS.INVENTORY_STATS_ROWS, 
            CONSTANTS.INVENTORY_STATS_COLS,
            `player-inventory-stats-${side}`,
            true,
        );
    }
    

    // Создание контейнера для графиков
    initChartContainer() {
        const container = document.getElementById('battle-charts-container');
        if (!container) {
            const chartsContainer = document.createElement('div');
            chartsContainer.id = 'battle-charts-container';
            chartsContainer.innerHTML = `
                <div class="chart-tabs">
                	<button class="chart-tab active" data-chart="damage">Damage</button>
                    <button class="chart-tab" data-chart="health">Health & Shield</button>
                    <button class="chart-tab" data-chart="debuffs">Debuffs</button>
                    
                    <button class="chart-tab" data-chart="effects">Effects</button>
                </div>
                <div class="chart-container">
                    <canvas id="battle-chart"></canvas>
                </div>
            `;
            
            // Добавляем обработчики для вкладок
            return chartsContainer;
        }
        
    }

    
    renderGameLog(side) { 
        const gameLogContainer = document.querySelector(`.statistics-${side}-content-container`);
        gameLogContainer.innerHTML = '';
        const gameLogFull = document.createElement('div');
        gameLogFull.classList.add('game-log-and-charts');
        const gameLog = document.createElement('div');
        gameLog.classList.add('game-log-text');
        gameLogContainer.appendChild(gameLogFull);

        if (!this.chartsContainer) {
            this.chartsContainer = this.initChartContainer();
        }

        gameLogFull.appendChild(this.chartsContainer);
        const tabs = document.querySelectorAll('.chart-tab');
        tabs.forEach(tab => {
            if (!tab.getAttribute('data-has-click-listener')) {
                tab.setAttribute('data-has-click-listener', 'true');
                tab.addEventListener('click', () => {
                    tabs.forEach(t => t.classList.remove('active'));
                    tab.classList.add('active');
                    renderChart(tab.dataset.chart);
                })
            };
        });

        gameLogFull.appendChild(gameLog);

        if (gameLog && gameState.currentBattle && gameState.currentBattle.statistics) {
            gameState.currentBattle.statistics.forEach((message) => this.renderLogMessage(message, gameLog))
        } else if (gameState.allBattlesStatistics[gameState.roundNumber]) { gameState.allBattlesStatistics[gameState.roundNumber].forEach((message) => this.renderLogMessage(message, gameLog))
                                                                          } else if (gameState.allBattlesStatistics[gameState.roundNumber - 1]) {gameState.allBattlesStatistics[gameState.roundNumber - 1].forEach((message) => this.renderLogMessage(message, gameLog))
                                                                                                                                                }
    }
    

    renderLogMessage(message, container) {
        const battleLogMessage = document.createElement('div');
        battleLogMessage.classList.add('battle-log-message');
        message = this.formatMessage(message);
        battleLogMessage.innerHTML = message;
        container.appendChild(battleLogMessage);
        container.scrollTop = container.scrollHeight;
    }
	

    renderLastLogMessage(message) {
        const lastLog = document.querySelector(`.last-log-message`);
        lastLog.innerHTML = '';
        const battleLogMessage = document.createElement('div');
        battleLogMessage.classList.add('battle-log-message');
        message = this.formatMessage(message);
        battleLogMessage.innerHTML = message;
        lastLog.appendChild(battleLogMessage);
    }
    

    formatMessage(message) {
        try {
            const parsedMessage = JSON.parse(message);
            const time = parsedMessage['time'];
            const source = parsedMessage['message'][0];
            const formattedMessage = [`<span style="display: inline-flex;">${time} ${source}</span>`];
            parsedMessage['message'].slice(1, parsedMessage['message'].length ).forEach(info => 
                                                                                        Object.entries(info).forEach(([comment, value]) => formattedMessage.push(`<span style="justify-content: space-between; display: flex; flex-direction: row"><span style="text-align: start; ">${localization[gameState.settings.localization][comment] ? localization[gameState.settings.localization][comment] : comment}</span> <span style="text-align: end; ">${value.join(' ')}</span></span>`)));
            return formattedMessage.join('');
        } catch {
            return message;
        }
    }
    

    renderItemStats(item, container) {
        const checkboxes = {
            header: document.querySelector('#statistics-left-item-header-checkbox'),
            baseStats: document.querySelector('#statistics-left-item-base-stats-checkbox'),
            modifiedStats: document.querySelector('#statistics-left-item-modified-stats-checkbox'),
            effects: document.querySelector('#statistics-left-item-effects-checkbox')
        };
        
        const statContainer = document.createElement('div');
        statContainer.classList.add('stat-container');

        if (checkboxes.header?.checked) {
            this.renderItemHeader(item, statContainer);
        }

        if (checkboxes.baseStats?.checked) {
            this.renderStatSection(item, statContainer, CONSTANTS.STAT_SECTION_TITLES.base, item.baseStats, Renderer.getIcon);
        }

        if (checkboxes.modifiedStats?.checked) {
            this.renderStatSection(item, statContainer, CONSTANTS.STAT_SECTION_TITLES.final, item.battleStats, Renderer.getIcon);
        }

        if (checkboxes.effects?.checked) {
            this.renderStatSection(item, statContainer, CONSTANTS.STAT_SECTION_TITLES.modificators, item.effects, Renderer.getIcon);
        }
        const itemTier = item.type[0];
        statContainer.setAttribute('style',
                        `background-image: url("assets/testing_ui/cards/${itemTier}/${itemTier}_${this.UIstyleSet}.jfif");
                    `);
        
        container.appendChild(statContainer);
    }
    
    
    renderSkillStats(skill, container) {
		const statContainer = document.createElement('div');
        statContainer.classList.add('stat-container');
        
        const iconTagsContainer = document.createElement('div');
        iconTagsContainer.className = 'stat-item-stats-icon-tags';
        
        const skillIcon = document.createElement('img');
        skillIcon.src = skill.image.src;
        skillIcon.title = skill.localizedName;
        skillIcon.style.cursor = 'pointer';
        
        iconTagsContainer.appendChild(skillIcon);
            logger.debug('skill.associatedStats', skill.associatedStats);
        skill.associatedStats.forEach(stat => {
            logger.debug('stat (skill)', stat);
            const statElement = document.createElement('div');
            statElement.className = 'stat-item-stats-tag';
            statElement.style.cursor = 'help';
            statElement.innerHTML = Renderer.getIcon(stat);
            if (wiki.stats[stat]) {
            	statElement.title = `${wiki.stats[stat]()}`;
            } else if (wiki.type[stat]) {
            	statElement.title = `${wiki.type[stat]}`;
            } else if (wiki.dependencies[stat]) {
            	statElement.title = `${wiki.dependencies[stat]}`;
            }
            iconTagsContainer.appendChild(statElement);
        });        

        iconTagsContainer.setAttribute('style',
                        `height: 25%;
                    `);
        
        statContainer.appendChild(iconTagsContainer);
        
        statContainer.innerHTML += 
        `<span class="stat-skill-description">${skill.localizedDescription}</span>`;
        
        
        statContainer.setAttribute('style',
                        `height: 100%;
                    `);


        const skillTier = skill.tier;
        statContainer.setAttribute('style',
                        `background-image: url("assets/testing_ui/cards/${skillTier}/${skillTier}_${this.UIstyleSet}.jfif");
                    `);
        
        container.appendChild(statContainer);
    }
    
    
    renderItemHeader(item, container) {
        const iconTagsContainer = document.createElement('div');
        iconTagsContainer.className = 'stat-item-stats-icon-tags';
        iconTagsContainer.setAttribute('style',
                        `height: 25%;
                    `);

        const itemIcon = document.createElement('img');
        itemIcon.src = item.image.src;
        itemIcon.title = item.description;
        itemIcon.style.cursor = 'pointer';
        iconTagsContainer.appendChild(itemIcon);
        
        item.type.slice(1, item.type.length).forEach(tag => {
            if (tag) {
                const tagElement = document.createElement('div');
                tagElement.className = 'stat-item-stats-tag';
                tagElement.innerHTML = Renderer.getIcon(tag);
                tagElement.title = `${wiki.type[tag]}`;
                tagElement.style.cursor = 'help';
                iconTagsContainer.appendChild(tagElement);
            }
        });

        container.appendChild(iconTagsContainer);
    }


    renderStatSection(item, container, title, stats, getIconFn) {
        const div = document.createElement('div');
        div.classList.add('all-stats-info-container');

        Object.entries(stats).forEach(([key, value]) => {
            const stat = document.createElement('div');
            stat.classList.add(`stat-info-container`);
            stat.classList.add(`stat-info-container-${title.split(' ')[0].replace(':', '')}`);

            const statIcon = document.createElement('span');
            statIcon.innerHTML = getIconFn(key);
            stat.appendChild(statIcon);

            if (value.type) {
                const statIconDependencies = document.createElement('span');
                statIconDependencies.innerHTML = getIconFn(value.type);
                stat.appendChild(statIconDependencies);
                stat.title = `${wiki.statMods[key](value.type, value.value)}`;
            } else {
                stat.title = `${wiki.stats[key](value)}`;
            }
            const statDigit = document.createElement('span');
            const valueDigit = value.value !== undefined ? value.value : value;
            statDigit.textContent = valueDigit;

            statDigit.classList.add('stat-digit');
            if (valueDigit > 9) {
                statDigit.setAttribute('style', 'transform: scaleX(0.9);')
            }

            stat.appendChild(statDigit);
            
            stat.style.cursor = 'help';
            div.appendChild(stat);
        });
		const statSection = document.createElement('div');
        statSection.classList.add(`stat-section`);
        statSection.setAttribute('style',
                        `height: ${title.includes('Modificators') ? '50%' : '25%'};
                    `);
        const titleSpan = document.createElement('span');
        //titleSpan.innerHTML = `<h4>${title}</h4>`;
        statSection.appendChild(titleSpan);
        statSection.appendChild(div);
        container.appendChild(statSection);
    }
    

highlightSourceBonuses(sourceItem, containerType, sourceIndex) {
    if (!sourceItem?.effects) return;

    // Create a cache for DOM elements
    const domCache = new Map();
    const getElement = (selector) => {
        if (!domCache.has(selector)) {
            domCache.set(selector, document.querySelector(selector));
        }
        return domCache.get(selector);
    };

    // Normalize container type
    const isPlayerEquipmentItem = containerType.includes('player-equipment');
    const normalizedType = containerType.replace('enemy', 'player')
        .replace(/new-(things|skills)/g, 'player-equipment')
        .replace('inventory', 'equipment');

    // Get stat classes once
    const baseStatClass = CONSTANTS.STAT_SECTION_TITLES.base.split(' ')[0].replace(':', '');
    const finalStatClass = CONSTANTS.STAT_SECTION_TITLES.final.split(' ')[0].replace(':', '');
    
    // Calculate source position once
    const sourceRow = Math.floor(sourceIndex / CONSTANTS.EQUIPMENT_COLS);
    const sourceCol = sourceIndex % CONSTANTS.EQUIPMENT_COLS;

    // Get container
    const targetContainer = getContainer(normalizedType);
    if (!targetContainer) return;

    // Common positional effect types
    const positionalEffectTypes = [
        'nearUpperSlot', 'nearRightSlot', 'nearBottomSlot', 'nearLeftSlot',
        'thisRow', 'thisColumn', ...allTags
    ];

    // Calculate applicable slots and their effects once
    const applicableEffects = new Map();

    // Process each effect once to determine where it applies
    Object.entries(sourceItem.effects).forEach(([effectKey, effectData]) => {
        const { type: dependenceType } = effectData;
        const effectBaseKey = CONSTANTS.ICON_MAP[effectKey];
        
        // Skip if no icon mapping exists
        if (!effectBaseKey) return;

        // Determine which slots this effect applies to
        targetContainer.slots.forEach((targetItem, targetIndex) => {
            if (!targetItem) return;
            
            const formattedTargetTagsKeys = (targetItem.type)
            .map(key => CONSTANTS.ICON_MAP[key]);
            const targetTagsKeys = new Set(formattedTargetTagsKeys);

            const targetRow = Math.floor(targetIndex / CONSTANTS.EQUIPMENT_COLS);
            const targetCol = targetIndex % CONSTANTS.EQUIPMENT_COLS;

            const isApplicable = isPlayerEquipmentItem && 
                shouldApplyEffect(dependenceType, sourceIndex, targetIndex, 
                                  sourceRow, sourceCol, targetRow, targetCol, 
                                  sourceItem, targetItem);

            const isPositionalEffect = positionalEffectTypes.some(type => dependenceType.includes(type));
            
    		const isTagEffect = allTags.some(type => dependenceType.includes(type));;
            const isSelfEffect = sourceIndex === targetIndex;

            if (!applicableEffects.has(targetIndex)) {
                applicableEffects.set(targetIndex, { applicable: [], positional: [] });
            }

            const effects = applicableEffects.get(targetIndex);
            if (isApplicable) {
                effects.applicable.push(effectBaseKey);
                
                
            } else if (isPositionalEffect && !isSelfEffect && (!isTagEffect || targetTagsKeys.has(CONSTANTS.ICON_MAP[dependenceType]))) {
                effects.positional.push({ baseKey: effectBaseKey, dependenceType });
            }
        });
    });

    // Apply highlighting in a batch using fewer DOM operations
    applicableEffects.forEach((effects, targetIndex) => {
        // Select all stat elements for this target just once
        const statSelector = `
            #${normalizedType}-stats-left-${targetIndex} .stat-info-container-${baseStatClass}, 
            #${normalizedType}-stats-right-${targetIndex} .stat-info-container-${baseStatClass}, 
            #${normalizedType}-stats-left-${targetIndex} .stat-info-container-${finalStatClass}, 
            #${normalizedType}-stats-right-${targetIndex} .stat-info-container-${finalStatClass}
        `;
        
        const statsElements = document.querySelectorAll(statSelector);
        if (!statsElements.length) return;

        statsElements.forEach(statEl => {
            const html = statEl.innerHTML;
            
            // Check applicable effects first (more common case)
            if (effects.applicable.some(key => html.includes(key))) {
                statEl.classList.add('source-bonus-highlight');
            } 
            // Then check positional effects
            else {
                for (const { baseKey, dependenceType } of effects.positional) {
                    if (html.includes(baseKey)) {
                        statEl.classList.add('missing-source-bonus-highlight');
                        break;
                    }
                }
            }
        });
    });
}


highlightTargetBonuses(targetItem, containerType, targetIndex) {
    if (!targetItem?.battleStats) return;

    // Create a cache for DOM elements
    const domCache = new Map();
    const getElement = (selector) => {
        if (!domCache.has(selector)) {
            domCache.set(selector, document.querySelector(selector));
        }
        return domCache.get(selector);
    };

    // Normalize container type
    const isPlayerEquipmentItem = containerType.includes('player-equipment');
    const normalizedType = containerType.replace('enemy', 'player')
        .replace(/new-(things|skills)/g, 'player-equipment')
        .replace('inventory', 'equipment');

    // Get modifier stat class
    const modStatClass = CONSTANTS.STAT_SECTION_TITLES.modificators.split(' ')[0].replace(':', '');

    // Calculate target position once
    const targetRow = Math.floor(targetIndex / CONSTANTS.EQUIPMENT_COLS);
    const targetCol = targetIndex % CONSTANTS.EQUIPMENT_COLS;

    // Get container
    const sourceContainer = getContainer(normalizedType);
    if (!sourceContainer) return;

    // Cache target battle stat keys for faster lookups
    const formattedBattleStatsKeys = Object.keys(targetItem.battleStats)
        .map(key => CONSTANTS.ICON_MAP[key])
        .filter(Boolean); // Remove undefined/null values
    
    const targetElementTagsSelector = `
            #${containerType}-stats-left-${targetIndex} .stat-item-stats-tag, 
            #${containerType}-stats-right-${targetIndex} .stat-item-stats-tag
        `;
    
    const formattedTargetTagsKeys = (targetItem.type)
        .map(key => CONSTANTS.ICON_MAP[key]);
    
    const targetStatsKeys = new Set(formattedBattleStatsKeys);
    const targetTagsKeys = new Set(formattedTargetTagsKeys);
    
    // Common positional effect types
    const positionalEffectTypes = [
        'nearUpperSlot', 'nearRightSlot', 'nearBottomSlot', 'nearLeftSlot',
        'thisRow', 'thisColumn', ...allTags,
    ];
    
    const selfExcludeEffectTypes = [
        'nearUpperSlot', 'nearRightSlot', 'nearBottomSlot', 'nearLeftSlot'
    ];

    // Calculate applicable source effects once
    const sourceEffects = new Map();

    // Process all source items and their potential effects on this target
    sourceContainer.slots.forEach((sourceItem, sourceIndex) => {
        if (!sourceItem?.effects) return;
        
        const sourceTagsSelector = `
            #${normalizedType}-stats-left-${sourceIndex} .stat-item-stats-tag, 
            #${normalizedType}-stats-right-${sourceIndex} .stat-item-stats-tag
        `;
        const tagsElements = document.querySelectorAll(sourceTagsSelector);
        tagsElements.forEach(tag => {
            const tagHTML = tag.innerHTML;
            if (targetTagsKeys.has(tagHTML) && targetItem !== sourceItem) {
            
                if (CONSTANTS.JUST_ONE_THING_WEAR_ICONS_SET.has(tagHTML) ) {
                    tag.classList.add('tag-crimson-highlight');
                } else {
                    tag.classList.add('tag-green-highlight');
                }
            }
        });
        
        const sourceRow = Math.floor(sourceIndex / CONSTANTS.EQUIPMENT_COLS);
        const sourceCol = sourceIndex % CONSTANTS.EQUIPMENT_COLS;
        const isSelfEffect = sourceIndex === targetIndex;
        
        const formattedSourceTagsKeys = (sourceItem.type)
        .map(key => CONSTANTS.ICON_MAP[key]);
        const sourceTagsKeys = new Set(formattedSourceTagsKeys);

        // Process each effect just once
        Object.entries(sourceItem.effects).forEach(([effectKey, effectData]) => {
            const { type: dependenceType } = effectData;
            const effectBaseKey = CONSTANTS.ICON_MAP[effectKey];
            
            // Skip if no icon mapping or target doesn't have this stat
            if (!effectBaseKey || !targetStatsKeys.has(effectBaseKey)) return;

            // Determine if this effect applies to the target
            const isApplicable = isPlayerEquipmentItem && 
                shouldApplyEffect(dependenceType, sourceIndex, targetIndex, 
                                 sourceRow, sourceCol, targetRow, targetCol, 
                                 sourceItem, targetItem);

            const isPositionalEffect = positionalEffectTypes.some(type => dependenceType.includes(type));
            const isTagEffect = allTags.some(type => dependenceType.includes(type));;
            const isExcludeEffect = selfExcludeEffectTypes.includes(dependenceType);

            if (!sourceEffects.has(sourceIndex)) {
                sourceEffects.set(sourceIndex, []);
            }

            sourceEffects.get(sourceIndex).push({
                effectBaseKey,
                dependenceType: CONSTANTS.ICON_MAP[dependenceType],
                isApplicable,
                isPositionalEffect,
                isSelfEffect,
                isExcludeEffect,
                isTagEffect
            });
        });
    });

    // Apply highlighting efficiently with minimal DOM operations
    sourceEffects.forEach((effects, sourceIndex) => {
        // Get all modifier elements for this source just once
        const statsSelector = `
            #${normalizedType}-stats-left-${sourceIndex} .stat-info-container-${modStatClass}, 
            #${normalizedType}-stats-right-${sourceIndex} .stat-info-container-${modStatClass}
        `;
        
        const statsElements = document.querySelectorAll(statsSelector);
        if (!statsElements.length) return;

        statsElements.forEach(statEl => {
            const html = statEl.innerText;
            
            // Process each effect for this source element
            for (const effect of effects) {
                const { 
                    effectBaseKey, dependenceType, isApplicable, 
                    isPositionalEffect, isSelfEffect, isExcludeEffect, isTagEffect 
                } = effect;
                if (!html.includes(effectBaseKey)) continue;

                if (isApplicable) {
                    statEl.classList.add('target-bonus-highlight');
                    break;
                } else if (isPositionalEffect && 
                          !(isSelfEffect && isExcludeEffect)
                          && (!isTagEffect || targetTagsKeys.has(dependenceType))) {
                    statEl.classList.add('missing-target-bonus-highlight');
                }
            }
        });
    });
}


clearAllBonusHighlights() {
    // Query all elements once and use classlist operations efficiently
    const elements = document.querySelectorAll(
        '.source-bonus-highlight, .target-bonus-highlight, ' +
        '.missing-source-bonus-highlight, .missing-target-bonus-highlight, ' + '.tag-green-highlight, .tag-crimson-highlight' 
    );
    
    elements.forEach(el => {
        el.classList.remove('source-bonus-highlight', 'target-bonus-highlight',
                           'missing-source-bonus-highlight', 'missing-target-bonus-highlight', 'tag-green-highlight', 'tag-crimson-highlight');
    });
}


    trashBin(source, sourceContainer, sourceId) {
        const clearType = source.includes('equipment') ? 
              'clearPlayerItem' : 
        source.includes('skills') ? 
              'clearPlayerSkill':
        null;
        sourceContainer.remove(sourceId);
        this.gameState.update();

        document.querySelector('.statistics-left-buttons-container .active-button')?.click();
        document.querySelector('.statistics-right-buttons-container .active-button')?.click();
        gameEvents.emit('itemRemoved', {
            sourceId,
            source
        });
    }

    updateStats(character) {
        if (!character) {
            return;
        }

        const target = character === this.gameState.player ? 'player' : 'enemy';
        const elements = {
            healthFill: document.querySelector(`.${target}-health-fill`),
            shieldFill: document.querySelector(`.${target}-shield-fill`),
            healthText: document.querySelector(`.${target}-health-text`),
            shieldText: document.querySelector(`.${target}-shield-text`)
        };

        const healthPercent = (character.hp / character.max_hp) * 100;
        elements.healthFill.style.width = `${healthPercent}%`;
        elements.healthText.innerHTML = `${character.hp}🧡`;

        const shieldPercent = Math.min((character.shield / character.max_hp) * 100, 100);
        elements.shieldFill.style.width = `${shieldPercent}%`;
        elements.shieldText.innerHTML = `${character.shield}🛡️`;
    }

    updateEffects(character, effect, battleTime) {
        if (!character) {
            return;
        }

        const target = character === this.gameState.player ? 'player' : 'enemy';
        const element = document.querySelector(`.${target}-income-${effect} .${effect}-digit`);

        element.textContent = `${character.debuffs[effect]}`;
        element.parentNode.title = `${wiki.debuff[effect](battleTime, character)}`;
        element.parentNode.style.cursor = 'help';
    }


    setUI(part = false) {
        logger.warn('part', part);
        const set = this.UIstyleSet;
        const UI = {

            body: `assets/testing_ui/body/body_${Math.floor(Math.random() * 14)}.jfif`,
            trash_bin: `assets/testing_ui/trash_bin/trash_bin_${set}.jfif`,
            buttons: `assets/testing_ui/buttons/buttons_${set}.jfif`,
        };
        if (part === 'buttons') {
            const list = document.querySelectorAll('button');

            logger.warn(`Found ${list.length} elements to update`);
            if (list.length > 0) {
                list.forEach(button => {

                    button.setAttribute('style', `
                        background-image: url("${UI.buttons}");
                    `)
                });
            }
        } else if (part === 'trash_bin') {
            const list = document.querySelectorAll('.trash-bin');

            if (list.length > 0) {
                list.forEach(slot => {

                    /*slot.setAttribute('style', `
                        background-image: url("${UI[part]}");
                    `)*/
                });
            }
        } else if (part === 'body') {
            const element = document.querySelector('body');

            element.setAttribute('style', `
                        background-image: url("${UI.body}");
                    `);
        } else if (part) {
            const element = document.getElementById(`${part.replace('_', '-').replace('_', '-')}`);
            if (element) {
                element.setAttribute('style', `background-image: url("${UI[part]}");`)
            }

        } else {
            try {
                Object.entries(UI).forEach(([UIelement, path]) => {
                    logger.warn(`UIelement`, UIelement);
                    const element = document.getElementById(`${UIelement.replace('_', '-').replace('_', '-')}`);
                    if (element) {
                        element.setAttribute('style', `background-image: url("${path}");`);
                    }
                }

                                          );
            } catch {
                logger.warn('no interface', Error)
            }
        }
    }
}


function updateSlotBeforeStyle(slot, imageNumber) {
  // Получаем id или класс слота для создания уникального селектора
  const slotId = slot.id || '';
  const slotClass = slot.className || '';
  
  // Создаем уникальный id для стиля, если его нет
  if (!slotId && !slot.hasAttribute('data-slot-id')) {
    const uniqueId = 'slot-' + Math.random().toString(36).substr(2, 9);
    slot.setAttribute('data-slot-id', uniqueId);
  }
  
  const uniqueSelector = slotId ? 
    `#${slotId}::before` : 
    (slot.hasAttribute('data-slot-id') ? 
      `[data-slot-id="${slot.getAttribute('data-slot-id')}"]::before` : 
      `.${slotClass.replace(/ /g, '.')}::before`);
  
  // Создаем или обновляем стилевое правило
  let styleEl = document.getElementById('dynamic-slot-styles');
  if (!styleEl) {
    styleEl = document.createElement('style');
    styleEl.id = 'dynamic-slot-styles';
    document.head.appendChild(styleEl);
  }
  
  // Добавляем новое правило
  const cssRule = `
    ${uniqueSelector} {
      content: "";
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-image: url("assets/testing_ui/cells/cells_${imageNumber}.jfif");
      background-size: 100% 100%;
      opacity: 0.7;
      z-index: 1;
      pointer-events: none;
    }
  `;
  
  // Добавляем правило в таблицу стилей
  if (styleEl.sheet) {
    if (styleEl.sheet.cssRules) {
      // Ищем существующее правило для этого селектора и удаляем его
      for (let i = 0; i < styleEl.sheet.cssRules.length; i++) {
        if (styleEl.sheet.cssRules[i].selectorText === uniqueSelector) {
          styleEl.sheet.deleteRule(i);
          break;
        }
      }
    }
    styleEl.sheet.insertRule(cssRule, styleEl.sheet.cssRules ? styleEl.sheet.cssRules.length : 0);
  } else {
    styleEl.textContent += cssRule;
  }
}

