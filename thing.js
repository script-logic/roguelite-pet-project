'use strict';
import { gameState } from './main.js'
import { CONSTANTS } from './constants.js';
import { logger } from './logger.js';
import { wiki } from './wiki.js';
import { generateItem, categoryThingTier, categoryWorldEpoch, categoryThingType } from './itemsBD.js';
import { generateSkill, skillsPool } from './skillsBD.js';
import { localization } from './localization.js';

export class Thing {
    constructor(description, isBotItem = false) {
        this.fallbackSrc = `./assets/itemsImg/1.jfif`;
        this._tooltipElement = document.createElement('div');
        this._tooltipElement.className = 'thing-tooltip';
        this.container = this.createContainer();
        this.height = 0;
        this.animationStarted = false;  
        this.description = description;
        this.place = null;
        this.lastTime = performance.now();
        this.currentBattleStats = {};
        this.isBotItem = isBotItem;
    }
    
    get tooltip() {
        this.updateTooltip();
        return this._tooltipElement;
    }
    
    positionTooltip(event) {
    const tooltip = this._tooltipElement;
    const rect = tooltip.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    let left = event.clientX + 10; // Default position (10px to the right of cursor)
    let top = event.clientY + 10;  // Default position (10px below cursor)
    
    // Check right edge
    if (left + rect.width > viewportWidth) {
        left = event.clientX - rect.width - 10; // Position to the left of cursor
    }
    
    // Check bottom edge
    if (top + rect.height > viewportHeight) {
        top = viewportHeight - rect.height; // Position above the cursor
        
    }
    
    // Ensure we don't go off the left or top edge
    left = Math.max(0, left);
    top = Math.max(0, top);
    
    tooltip.style.left = `${left}px`;
    tooltip.style.top = `${top}px`;
}
     
    setPlace(place) {
    	this.place = place;
        this.updateTooltip();
    }

    setDescription(description) {
        if (typeof description !== 'string') {
            throw new Error('Description must be a string');
        }
        this.description = description;
        this.updateTooltip();
    }
}


export class Skill extends Thing {
    constructor(description, isBotItem = false) {
        super(description, isBotItem);
        this.skill = true;
        this.item = false;
        this.generatedSkill = generateSkill(categoryThingTier, skillsPool, isBotItem);
        this.skillName = this.generatedSkill[1];
        this.tier = this.generatedSkill[0];
        //this.type = this.generatedSkill.type;
        
        // Получаем базовые данные скилла
        const skillData = skillsPool[this.skillName];
        if (!skillData) {
            throw new Error(`Skill ${this.skillName} not found in skill pool`);
        }
        
        this.skillType = skillData.skillType;
        this.associatedStats = skillData.associatedStats || [];
        
        // Рассчитываем значения для данного тира
        this.calculatedValues = skillData.calculateValues(this.tier);
        
        // Создаем локализованную информацию
        this.updateLocalizedData();
        
        
        this.updateTooltip();
    }
    
    updateLocalizedData() {
        const currentLocale = gameState.settings.localization;
        //logger.warn('this.skillName',this.skillName);
        //logger.warn('currentLocale',currentLocale);
        const localeData = localization[currentLocale][this.skillName];
        
        this.localizedName = localeData.localizedName;
        
        // Формируем описание с подставленными значениями
        const descParts = localeData.localizedDescriptionParts;
        let description = descParts[0];
        for (let i = 0; i < this.calculatedValues.length; i++) {
            description += ' ' + this.calculatedValues[i];
            if (i + 1 < descParts.length) {
                description += descParts[i + 1];
            }
        }
        
        this.localizedDescription = description;
    }
    
    // Метод применения скилла (может принимать объект, на который нужно повлиять)
    applyEffect(target) {
        // Логика применения эффекта
    }
    
    updateTooltip() {
        let tooltipContent = `<div class="tooltip-description">${this.localizedDescription}</div>`;
        this._tooltipElement.innerHTML = tooltipContent;
    }

    createContainer() {
        const container = document.createElement('div');
        container.className = 'container';
        container.title = '';

        const image = document.createElement('img');
        image.src = this.fallbackSrc;
        image.className = 'image';

        container.append(this._tooltipElement, image);
        this.image = image;

        // Add mousemove event to position tooltip
        container.addEventListener('mousemove', (e) => {
            if (gameState.settings.thingTooltipFlag) this.positionTooltip(e);

        });

        return container;
    }
    
}

export class Item extends Thing {
    constructor(description, isBotItem = false, excludeEquippedItems = null) {
        super(description, isBotItem, excludeEquippedItems);
        this.skill = false;
        this.item = true;
        this.generatedItem = generateItem(categoryThingTier, categoryWorldEpoch, categoryThingType, isBotItem, excludeEquippedItems);
        this.type = this.generatedItem.type;
        this.setImageUrl();
        this.baseStats = this.generatedItem.stats;
        this.staticModificators = {};
        this.scalingModificators = {};
        this.battleStats = this.mergeStats(this.baseStats, this.staticModificators);
        this.effects = this.generatedItem.effects;
        
        this.updateTooltip();
    }

    animate(onAnimationUpdate) {
        if (!gameState.isAnimating) {
            this.reset();
            return;
        }

        const currentTime = performance.now();
        let deltaTime = (currentTime - this.lastTime) / 1000;
        deltaTime = Math.min(deltaTime, 1/30);
        this.lastTime = currentTime;

        // Apply skill effects to animation speed
        let speedMultiplier = 1.0;
        if (gameState.currentBattle && window.skillManager) {
            speedMultiplier = window.skillManager.getItemSpeedBoost(this);
        }

        // Default freeze slow logic
        const freezeEffectMultiplier = gameState.currentBattle ? 
              Math.pow(gameState.currentBattle.freezeSlowMultiplier, 
                       (this.place.includes('player') ? 
                        gameState.player.debuffs.freeze : 
                        gameState.enemy.debuffs.freeze) / 100) : 
        1.0;

        const heightChange = (100 / (60 / (this.battleStats.baseSpeed * freezeEffectMultiplier))) * deltaTime * speedMultiplier;
        this.height += heightChange;

        // If we reached or exceeded 100%, activate the effect
        if (this.height >= 100) {
            // Apply any skill effects to the item before activation
            if (window.skillManager) {
                window.skillManager.checkItemActivationEffects(this);
            }

            if (onAnimationUpdate) {
                onAnimationUpdate(this);
            }
            this.height = 0; // Reset after activation
        }

        this.overlay.style.height = `${this.height}%`;
        this.animationFrame = requestAnimationFrame(() => this.animate(onAnimationUpdate));
    }
    
    reset() {
        this.height = 0;
        this.overlay.style.height = '0%';
        this.image.style.opacity = '';
        this.animationStarted = false;
        this.lastTime = performance.now();
        cancelAnimationFrame(this.animationFrame);
    }
    
    setImageUrl(recursiveIndexes = [1, 2, 3]) {
    const img = this.image;
    const formattedTagList = this.type.slice(1, this.type.length).join('_');
    const mainSrc = `./assets/itemsImg/${formattedTagList}.jpg`;
    const self = this;

    return new Promise((resolve, reject) => {
        // Set error handler before setting src
        img.onerror = function() {
            if (recursiveIndexes && recursiveIndexes.length > 0) {
                const rollIndex = Math.floor(Math.random() * recursiveIndexes.length);
                const randomIndex = recursiveIndexes[rollIndex];

                // Remove used index from array
                recursiveIndexes.splice(rollIndex, 1);

                // Set new source with random index
                img.src = `./assets/itemsImg/${formattedTagList}(${randomIndex}).jpg`;

                // Call recursively with updated indexes but wait for result
                self.setImageUrl(recursiveIndexes)
                    .then(resolve)
                    .catch(reject);
            } else {
                // Apply the fallback directly
                img.src = self.fallbackSrc;

                // Add a console log to verify
                console.log("Applying fallback image:", self.fallbackSrc);

                // Only remove the error handler AFTER the fallback has loaded
                img.onload = function() {
                    img.onerror = null;
                    img.onload = null;
                    resolve();
                };
                
                // Ensure we resolve even if fallback fails
                img.onerror = function() {
                    console.error("Even fallback image failed to load");
                    img.onerror = null;
                    img.onload = null;
                    resolve(); // Still resolve to prevent hanging
                };
            }
        };

        // Success handler
        img.onload = function() {
            img.onerror = null;
            img.onload = null;
            resolve();
        };

        // Set the initial source
        img.src = mainSrc;
    });
}

    
    mergeStats(baseStats, staticModificators, addNewStats = false) {
        const result = { ...baseStats };
        if (addNewStats) {
            logger.debug('addNewStats', addNewStats);
            for (let key in staticModificators) {
                if (addNewStats && staticModificators[key]) {
                    result[key] = (result[key] || 0) + staticModificators[key];
                }
            }
        } else {
            logger.debug('addNewStats', addNewStats);
            for (let key in staticModificators) {
            logger.debug('key in staticModificators', key);
                if (result[key]) {
            logger.debug('result[key]', result[key]);
                    result[key] += staticModificators[key];
                }
            }
        }
        
        this.updateTooltip();
        
        return result;
    }
    

    updateTooltip() {
        let tooltipContent = `<div class="tooltip-description">${this.description}</div>`;
        
        tooltipContent += `<div>Tags</div>`;
        
        if (this.type) {
            tooltipContent += `<div class="thing-tooltip-stats">
        <table class="type-table">
            <tbody>`;

            for (const tag of this.type) {
                tooltipContent += `
            <tr>
                <td>${CONSTANTS.ICON_MAP[tag]}</td>
                <td class="in-tooltip-description">${wiki.type[tag]}</td>
            </tr>`;
            };

            tooltipContent += `
            </tbody>
        </table>
    </div>`;
        }
        
        // Добавляем информацию о боевых статах
        let isAnyBaseStatModificated = false;
        const modificatedItemStats = () => {
            let tooltipContentFragment = '';
            if (this.battleStats) {
                tooltipContentFragment += `<div class="thing-tooltip-stats">
        <table class="battleStats-table">
            <tbody>`;
                let modificatedAffixesCount = 0;
                for (const [stat, value] of Object.entries(this.battleStats)) {
                    const isThisBaseStatModificated = this.baseStats[stat] !== value;
                    if (isThisBaseStatModificated) isAnyBaseStatModificated = true;
                    modificatedAffixesCount++;
                    tooltipContentFragment += `
            <tr>
                <td>${CONSTANTS.ICON_MAP[stat]}</td>
                <td${isThisBaseStatModificated ? ' style="color: lawngreen"' : ''}>${value}</td>
                <td class="in-tooltip-description">${wiki.stats[stat](value)}</td>
            </tr>`;
                };

                tooltipContentFragment += `
            </tbody>
        </table>
    </div>`;
            return modificatedAffixesCount > 0 ? `<div>Final stats</div>${tooltipContentFragment}` : '';   
            }
            
        }
        tooltipContent += modificatedItemStats();
        
        if (isAnyBaseStatModificated) {
            tooltipContent += `<div>Native item stats before modification</div>`;

            if (this.baseStats) {
                tooltipContent += `<div class="thing-tooltip-stats">
        <table class="baseStats-table">
            <tbody>`;

                for (const [stat, value] of Object.entries(this.baseStats)) {
                    if (this.battleStats && this.battleStats[stat] && this.battleStats[stat] !== value) {
                        tooltipContent += `
            <tr>
                <td>${CONSTANTS.ICON_MAP[stat]}</td>
                <td>${value}</td>
                <td class="in-tooltip-description">${wiki.stats[stat](value)}</td>
            </tr>`;
                    }
                };

                tooltipContent += `
            </tbody>
        </table>
    </div>`;
            }
        }

        // Добавляем информацию о эффектах, если они есть
        if (this.effects) {
            tooltipContent += `<div>Item modificators</div><div class="thing-tooltip-modificators">
        <table class="effects-table">
            <tbody>`;

            for (const [stat, value] of Object.entries(this.effects)) {
                tooltipContent += `
            <tr>
                <td>${CONSTANTS.ICON_MAP[stat]}</td>
                <td>${CONSTANTS.ICON_MAP[value.type]}</td>
                <td>${value.value}</td>
                <td class="in-tooltip-description">${wiki.statMods[stat](value.type, value.value)}</td>
            </tr>`;
            };

            tooltipContent += `
            </tbody>
        </table>
    </div>`;
        }

        tooltipContent += `<div>Click MMB to turn on/off this tooltips</div>`;

        this._tooltipElement.innerHTML = tooltipContent;
    }


    createContainer() {
        const container = document.createElement('div');
        container.className = 'container';
        container.title = '';

        const image = document.createElement('img');
        image.src = this.fallbackSrc;
        image.className = 'image';

        const overlay = document.createElement('div');
        overlay.className = 'overlay';

        container.append(this._tooltipElement, image, overlay);
        this.image = image;
        this.overlay = overlay;

        // Add mousemove event to position tooltip
        container.addEventListener('mousemove', (e) => {
            if (gameState.settings.thingTooltipFlag) this.positionTooltip(e);

        });

        return container;
    } 
}




