'use strict';
import { CONSTANTS } from './constants.js';
import { gameState } from './main.js';
import { gameEvents, eventManager } from './events.js';
import { logger } from './logger.js';


export const getContainer = (source) => ({
    'new-skills': gameState.newSkills,
    'new-things': gameState.newThings,
    'player-equipment': gameState.player.equipment,
    'player-inventory': gameState.player.inventory,
    'player-equipment-stats-left': gameState.player.equipment,
    'player-skills-stats-right': gameState.player.inventory,
    'player-equipment-stats-right': gameState.player.equipment,
    'player-skills-stats-left': gameState.player.inventory,
    'enemy-equipment': ( gameState.currentStage === 'choice' ? gameState.newThings : ( gameState.enemy ? gameState.enemy.equipment : null )),
    'enemy-skills': ( gameState.currentStage === 'choice' ? gameState.newSkills : ( gameState.enemy ? gameState.enemy.skills : null )),
    'enemy-equipment-stats-left': ( gameState.enemy ? gameState.enemy.equipment : null ),
    'enemy-skills-stats-left': ( gameState.enemy ? gameState.enemy.skills : null ),
    'enemy-equipment-stats-right': ( gameState.enemy ? gameState.enemy.equipment : null ),
    'enemy-skills-stats-right': ( gameState.enemy ? gameState.enemy.skills : null ),
    'player-skills': gameState.player.skills
})[source];

const getTargetContainer = (targetId, item) => {
    if (targetId.startsWith('player-equipment') && !item.skill) {
        return gameState.player.equipment;
    }
    if (targetId.startsWith('player-inventory') && !item.skill) {
        return gameState.player.inventory;
    }
    if (targetId.startsWith('player-skills') && item.skill) {
        return gameState.player.skills;
    }
    return null;
};


export function handleDragOver(e) {
    e.preventDefault();
}


export function handleDrop(e) {
    e.preventDefault();
    const { id: sourceId, source } = JSON.parse(e.dataTransfer.getData('text/plain'));
    document.querySelectorAll('.dragging').forEach((el) => el.classList.remove('dragging'));
    if (e.target.closest('.trash-bin') && !['new-things', 'new-skills', 'enemy-equipment', 'enemy-skills'].includes(source)) {
        const sourceContainer = getContainer(source);
        gameState.renderer.trashBin(source, sourceContainer, sourceId);
    }
    
    const slot = e.target.closest('td');
    
	const targetId = slot ? parseInt(slot.id.replace('-stats', '').replace('-left', '').replace('-right','').split('-')[2]) : null;
    const sourceContainer = getContainer(source);
    const sourceItem = sourceContainer.get(sourceId);
    if (sourceItem) {
        gameState.renderer.highlightSlot(slot, sourceItem.tier);
    } else {
    
        gameState.renderer.highlightSlot(false, false, true);
    }
    if (!sourceItem) return;    
    
    if (gameState.currentStage === 'battle' || (gameState.currentStage !== 'loot' && (source === 'enemy-equipment' || source === 'enemy-skills'))) return;  
    const targetContainer = getTargetContainer(slot.id, sourceItem);
    
    if (targetContainer) {
        logger.warn('sourceItem',sourceItem);
        const targetItem = targetContainer.get(targetId);
        const mainCategoryIndex = CONSTANTS.ITEM_INDICES.MAIN_CATEGORY;
        //Проверка на имеющийся предмет такого же типа
        if (targetContainer === gameState.player.equipment && 
            CONSTANTS.JUST_ONE_THING_WEAR.includes(sourceItem.type[mainCategoryIndex]) && 
            !(sourceContainer === targetContainer) && 
            Object.keys(gameState.player.equippedItemTags).includes(sourceItem.type[mainCategoryIndex]) &&
            !(targetItem && targetItem.type[mainCategoryIndex] === sourceItem.type[mainCategoryIndex])) {
            	gameState.renderer.renderLastLogMessage(`<span style="color: crimson">You can't wear more ${sourceItem.type[mainCategoryIndex].replace('upperBodyEquipment', 'chest armor').replace('bottomBodyEquipment', 'leg armor')} else</span>`);
            	return;
        }
        // Если это тот же контейнер или перемещение между инвентарем и эквипом
        if (sourceContainer === targetContainer || 
           (source === 'player-equipment' && targetContainer === gameState.player.inventory) ||
           (source === 'player-inventory' && targetContainer === gameState.player.equipment)) {
            const targetItem = targetContainer.get(targetId);
            
            // Если в целевом слоте есть предмет
            if (targetItem) {
                const itemSwap = true;
                // Меняем предметы местами
                sourceContainer.remove(sourceId);
                targetContainer.remove(targetId);

                sourceContainer.add(targetItem, sourceId);
                targetContainer.add(sourceItem, targetId);

                // Обновляем place для обоих предметов
                const containerType = `${slot.id.split('-')[0]}-${slot.id.split('-')[1]}`;
                sourceItem.place = containerType;
                targetItem.place = containerType;

                // Emit события для обоих предметов
               gameEvents.emit('itemMoved', {
                   item: sourceItem,
                   sourceId,
                   targetId,
                   source,
                   target: slot.id.split('-').slice(0, 2).join('-'),
                   targetContainer: slot,
                   itemSwap,
               });
                
                gameEvents.emit('itemMoved', {
                    item: targetItem,
                    sourceId: targetId,
                    targetId: sourceId,
                    source: slot.id.split('-').slice(0, 2).join('-'),
                    target: slot.id.split('-').slice(0, 2).join('-'),
                    targetContainer: document.querySelector(`#${slot.id.split('-').slice(0, 2).join('-')}-${sourceId}`),
                    itemSwap,
                });

                return;
            }
        }
        
        // Если это НЕ тот же контейнер или перемещение между чойсом/врагом и эквипом
        if (sourceContainer !== targetContainer &&
           targetContainer === gameState.player.equipment) {
            const targetItem = targetContainer.get(targetId);
            
            // Если в целевом слоте есть предмет
            if (targetItem) {
                
                //ищем пустой слот (индекс) в ивентаре
                const firstEmptySlotIndex = gameState.player.inventory.slots.findIndex(slot => slot === null);
                if (firstEmptySlotIndex === -1) {
                  	gameState.renderer.renderLastLogMessage('There is no empty slots in inventory for this operation');  
                    return;
                }
				const itemSwap = true;
                // Меняем места предметов
                sourceContainer.remove(sourceId);
                targetContainer.remove(targetId);

                gameState.player.inventory.add(targetItem, firstEmptySlotIndex);
                targetContainer.add(sourceItem, targetId);

                // Обновляем place для обоих предметов
                const containerType = `${slot.id.split('-')[0]}-${slot.id.split('-')[1]}`;
                sourceItem.place = containerType;
                targetItem.place = 'inventory';

                // Emit события для обоих предметов
               gameEvents.emit('itemMoved', {
                   item: sourceItem,
                   sourceId,
                   targetId,
                   source,
                   target: slot.id.split('-').slice(0, 2).join('-'),
                   targetContainer: slot,
                   itemSwap,
               });
                
                gameEvents.emit('itemMoved', {
                    item: targetItem,
                    sourceId: targetId,
                    targetId: firstEmptySlotIndex,
                    source: slot.id.split('-').slice(0, 2).join('-'),
                    target: 'player-inventory',
                    targetContainer: document.querySelector(`#player-inventory-${firstEmptySlotIndex}`),
                    itemSwap,
                });

                return;
            }
        }
        
        // Стандартное поведение для разных контейнеров или пустого слота
        if (targetContainer.add(sourceItem, targetId)) {
            sourceContainer.remove(sourceId);
            
            gameEvents.emit('itemMoved', {
                item: sourceItem,
                sourceId,
                targetId,
                source,
                target: slot.id.split('-').slice(0, 2).join('-'),
                targetContainer: slot,
                itemSwap: false,
            });
        }
    }
}


export function setupDragAndDrop(itemContainer, slotId, source) {
    if (!itemContainer || typeof slotId !== 'number' || typeof source !== 'string') {
        throw new Error('Invalid parameters');
    }

    // Удаляем существующие обработчики перед добавлением новых
    const oldListeners = itemContainer._dragDropListeners;
    if (oldListeners) {
        oldListeners.forEach(({event, handler}) => {
            itemContainer.removeEventListener(event, handler);
        });
    }

    const createTransferData = () => JSON.stringify({ id: slotId, source });

    const handleTouchStart = (e) => {
        e.preventDefault();
        const touch = e.touches[0];
        const touchTimeout = setTimeout(() => {
            e.target.setAttribute('data-transfer', createTransferData());
            e.target.style.opacity = '0.5';
            e.target.classList.add('dragging');
        }, CONSTANTS.TOUCH_DELAY);
        return { touch, touchTimeout };
    };

    const handleTouchMove = (e, hasTransfer) => {
        if (!hasTransfer) return;
        e.preventDefault();
        const touch = e.touches[0];
        const target = document.elementFromPoint(touch.clientX, touch.clientY);
        target && [...target.classList].some(className => className.includes('slot')) && target.classList.add('dragover');
    };

    const handleTouchEnd = (e, touchTimeout) => {
        document.querySelectorAll('.dragover').forEach(el => el.classList.remove('dragover'));
        e.target.classList.remove('dragging');
        clearTimeout(touchTimeout);
        e.target.style.opacity = '1';

        const data = e.target.getAttribute('data-transfer');
        if (!data) return;

        const dropTarget = document.elementFromPoint(e.changedTouches[0].clientX, e.changedTouches[0].clientY);
        if (dropTarget && dropTarget.closest('.trash-bin')) {
            handleDrop({
                preventDefault: () => {},
                dataTransfer: { getData: () => data },
                target: dropTarget
            });
        }
        if (dropTarget && [...dropTarget.classList].some(className => className.includes('slot'))) {
            handleDrop({
                preventDefault: () => {},
                dataTransfer: { getData: () => data },
                target: dropTarget
            });
            dropTarget.classList.add('dragover');
        }
        e.target.removeAttribute('data-transfer');
    };

    const handleDragStart = (e) => {
        e.dataTransfer.setData('text/plain', createTransferData());
        logger.warn('e.target',e.target);
        e.target.closest('.container').classList.add('dragging');
    };
    

const handleMouseOver = (e) => {
    
    const slot = e.target.closest('td');
    if (!slot || !slot.lastChild) return;
    
    // Получаем информацию о предмете
    const slotId = parseInt(slot.id.replace('-stats', '').replace('-left', '').replace('-right','').split('-')[2]);
    const containerType = slot.id.split('-').slice(0, 2).join('-');
    const container = getContainer(containerType);
    if (!container) return;
    
    const item = container.get(slotId);
    const isItemSkill = item.skill;
    const itemTier = isItemSkill ? item.tier : item.type[0];
    gameState.renderer.highlightSlot(slot, itemTier);
    if (!item || (!item.effects && !item.skill)) return;
    
    // Удаляем предыдущие подсветки
    gameState.renderer.clearAllBonusHighlights();
    
    // Подсветка бонусов, даваемых данным предметом другим предметам
    eventManager.addHandler('gameState.renderer.highlightSourceBonuses', gameState.renderer.highlightSourceBonuses(item, containerType, slotId));
    
    // Подсветка бонусов, получаемых данным предметом от других предметов
    eventManager.addHandler('gameState.renderer.highlightTargetBonuses', gameState.renderer.highlightTargetBonuses(item, containerType, slotId));

    const handleMouseOut = () => {
        gameState.renderer.clearAllBonusHighlights();
        const stopHighlight = true;
        
        gameState.renderer.highlightSlot(slot, null, stopHighlight);
        
        eventManager.clearHandlers();
        slot.removeEventListener('mouseout', handleMouseOut);
    };

    slot.addEventListener('mouseout', handleMouseOut);
};
    

    // Сохраняем ссылки на обработчики
    itemContainer._dragDropListeners = [
        { event: 'touchstart', handler: handleTouchStart },
        { event: 'touchmove', handler: e => handleTouchMove(e, e.target.hasAttribute('data-transfer')) },
        { event: 'touchend', handler: e => handleTouchEnd(e, null) },
        { event: 'dragstart', handler: handleDragStart },
        { event: 'mouseover', handler: e => handleMouseOver(e) },
    ];

    // Добавляем новые обработчики
    itemContainer._dragDropListeners.forEach(({event, handler}) => {
        itemContainer.addEventListener(event, handler, event === 'touchstart' ? { passive: false } : undefined);
    });

    itemContainer.setAttribute('draggable', 'true');
    itemContainer.classList.add('draggable');
}













