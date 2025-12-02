
import { gameState } from './main.js';
import { gameEvents } from './events.js';
import { CONSTANTS } from './constants.js';
import { logger } from './logger.js';
import { handleDrop, handleDragOver} from './dragAndDrop.js';


export const eventHandlersOn = {
    stateUpdated: () => gameState.update(),
    nextStage: (resolveChoice) => {
        const stages = CONSTANTS.STAGES;
        const nextIndex = (stages.indexOf(gameState.currentStage) + 1) % stages.length;
        gameState.currentStage = stages[nextIndex];
        gameEvents.emit(`newStage_${gameState.currentStage}`, resolveChoice);
    },

    newStage_choice: (resolveChoice = false) => {                             
        const checkboxModified = document.querySelector('#statistics-left-item-modified-stats-checkbox');
        if (checkboxModified.checked === false) {
            checkboxModified.click();
        }
        const checkboxBase = document.querySelector('#statistics-left-item-base-stats-checkbox');
        if (checkboxBase.checked === true) {
            checkboxBase.click();
        }
        gameState.roundNumber += 1;
        gameState.player.resetHealthShield();

        if (resolveChoice) {
            gameEvents.emit('nextStage');
            gameEvents.emit('choiceContainerRemove');
            gameState.update();
        } else {              
            gameState.renderer.renderLastLogMessage(`Round ${gameState.roundNumber} have started! You can loot 1 any item or skill from choice container.`);
            const buttonFinishChoice = document.querySelector('#finish-choice-button');
            if (buttonFinishChoice) buttonFinishChoice.style.visibility = 'visible';
            gameState.handleStartChoice();
            gameState.update();
        }
    },

    newStage_prepare: () => {
        gameState.renderer.renderLastLogMessage(`Prepare for battle by inspecting your enemy and choosing equipment for fight! Or you can retreat to find another enemy...`);
        gameState.handleStartPrepare();
        gameState.update();
    },

    newStage_battle: () => {
        if (!gameState.enemy) {
            logger.debug('Enemy was not created else');
        };
        gameState.renderer.renderLastLogMessage(`The battle have started!`);
        gameState.handleStartBattle();
        
        document.querySelector('#statistics-right-game-log-button')?.click();
        gameState.update();
    },

    newStage_loot: () => {
        gameState.renderer.renderLastLogMessage(`You have won! Items indicates base stats instead of modified while looting. Loot 1 item from enemy or if you will resolve then you will get chance to loot 1 new item from choice generator!`);
        document.querySelector('#statistics-right-enemy-equipment-button')?.click();
        const checkboxModified = document.querySelector('#statistics-left-item-modified-stats-checkbox');
        if (checkboxModified.checked === true) {
            checkboxModified.click();
            const checkboxBase = document.querySelector('#statistics-left-item-base-stats-checkbox');
            if (checkboxBase.checked === false) {
                checkboxBase.click();
            }
        }
        gameState.handleStartLoot();
        const buttonResolveLoot = document.querySelector('#resolve-loot-button');
        if (buttonResolveLoot) {
            buttonResolveLoot.style.visibility = 'visible';
        }
        gameState.update();
    },

    itemMoved: (data) => {
        gameState.handleItemMoved(data);
        gameState.update();
    },

    animationStarted: () => {
        gameState.isAnimating = true;
        gameState.animateEquippedItems();
    },

    animationStopped: () => {
        gameState.isAnimating = false;
        gameState.resetAnimation();
    },

    choiceGenerated: (data) => {
        if (!gameState.newSkills || !gameState.newThings) {
            gameState.updateNewContainers();
            gameState.renderer.renderChoice();
        }
    },

    choiceContainerRemove: () => {
        const buttonResume = document.querySelector('#resume-button');
        const buttonRetreat = document.querySelector('#retreat-button');
    	if (buttonResume && buttonRetreat) {
        	buttonResume.style.visibility = 'visible';
            buttonRetreat.style.visibility = 'visible';
        }
    
    }
}

const animateButton = document.getElementById('animateButton');
const stopAnimateButton = document.getElementById('stopAnimateButton');

if (animateButton) {
    animateButton.addEventListener('click', () => {
        gameEvents.emit('animationStarted');
        gameEvents.emit('createEnemy');
    });
}

if (stopAnimateButton) {
    stopAnimateButton.addEventListener('click', () => {
        gameEvents.emit('animationStopped');
    });
}

const buttonResume = document.querySelector('#resume-button');

if (buttonResume) {
    buttonResume.addEventListener('click', () => {
        const buttonRetreat = document.querySelector('#retreat-button');
        if (buttonRetreat) {
            buttonRetreat.style.visibility = 'hidden';
        }
        buttonResume.style.visibility = 'hidden';
        gameEvents.emit('nextStage');
    });
}

const buttonRetreat = document.querySelector('#retreat-button');

if (buttonRetreat) {
    buttonRetreat.addEventListener('click', () => {
        gameEvents.emit('newStage_prepare');
        logger.debug('gameState', gameState)
    });
}

const buttonResolveLoot = document.querySelector('#resolve-loot-button');

if (buttonResolveLoot) {
    buttonResolveLoot.addEventListener('click', () => {
    const resolveChoice = false;
    gameState.handleEnemyLoot(resolveChoice)    
    });
}

const buttonFinishChoice = document.querySelector('#finish-choice-button');

if (buttonFinishChoice) {
    buttonFinishChoice.addEventListener('click', () => {
        buttonFinishChoice.style.visibility = 'hidden';
        document.getElementById('choice-container').remove();
        gameState.newSkills = null;
        gameState.newThings = null;
        gameEvents.emit('choiceContainerRemove');
        gameEvents.emit('nextStage');
    });
}

    
                              
window.addEventListener('resize', () => {
    gameState.update();
});

document.addEventListener('dblclick', (e) => {
    e.preventDefault();
}, { passive: false });


const trashBin = document.querySelector('.trash-bin');
trashBin.addEventListener('dragover', handleDragOver);
trashBin.addEventListener('drop', handleDrop);
trashBin.title = 'Drop item here for destruct it';


function handleStatisticsClick(side, buttonId, renderFunction) {
    const button = document.querySelector(buttonId);
    if (!button) return;

    button.addEventListener('click', function() {
        // Обновляем активную кнопку
        if (!this.classList.contains('active-button')) {
            const container = document.querySelector(`.statistics-${side}-content-container`);
            while (container.firstChild) {
                container.removeChild(container.firstChild);
            }
            document.querySelectorAll(`.statistics-${side}-buttons-container .active-button`)
                .forEach(btn => btn.classList.remove('active-button'));
            this.classList.add('active-button');
        } 
        // Вызываем соответствующий метод рендера
        gameState.renderer[renderFunction](side);
    });
}

// Конфигурация кнопок
const buttonConfig = [
    ['player-equipment', 'renderPlayerStats'],
    ['player-inventory', 'renderInventoryStats'],
    ['enemy-equipment', 'renderEnemyStats'],
    ['result-player-stats', 'renderResultPlayerStats'],
    ['result-enemy-stats', 'renderResultEnemyStats'],
    ['game-log', 'renderGameLog']
];

// Применяем обработчики для левой и правой панели
['left', 'right'].forEach(side => {
    buttonConfig.forEach(([buttonType, renderFunction]) => {
        handleStatisticsClick(
            side,
            `#statistics-${side}-${buttonType}-button`,
            renderFunction
        );
    });
});


document.querySelector('#statistics-left-item-header-checkbox').addEventListener('click', () => {
    document.querySelector('.statistics-left-buttons-container .active-button')?.click();
    document.querySelector('.statistics-right-buttons-container .active-button')?.click();
});

document.querySelector('#statistics-left-item-base-stats-checkbox').addEventListener('click', () => {
    document.querySelector('.statistics-left-buttons-container .active-button')?.click();
    document.querySelector('.statistics-right-buttons-container .active-button')?.click();
});

document.querySelector('#statistics-left-item-modified-stats-checkbox').addEventListener('click', () => {
    document.querySelector('.statistics-left-buttons-container .active-button')?.click();
    document.querySelector('.statistics-right-buttons-container .active-button')?.click();
});


document.addEventListener('mousedown', function(event) {
    if (event.button === 1 && !event.target.classList.contains('battle-log-message')) {
        gameState.settings.thingTooltipFlag = !gameState.settings.thingTooltipFlag;
        gameEvents.emit('settingsChange', 'thingTooltipFlag', gameState.settings.thingTooltipFlag);
        
        // Добавляем или удаляем класс для всего документа
        if (!gameState.settings.thingTooltipFlag) {
            document.body.classList.add('tooltips-disabled');
        } else {
            document.body.classList.remove('tooltips-disabled');
        }
        
        logger.warn('gameState.settings', gameState.settings);
    }
});


let mouseDownTime = 0;

// Вспомогательная функция для добавления обработчиков событий
function addClickHandlers(selector, leftButtonSelector, rightButtonSelector) {
    const element = document.querySelector(selector);
    element.title = `LMB / RMB for open this container in left / right panel`;
    
    // Обработчик клика
    element?.addEventListener('mousedown', (e) => {
        mouseDownTime = Date.now();
    });
    
    element?.addEventListener('mouseup', (e) => {
        const clickDuration = Date.now() - mouseDownTime;
        if (clickDuration < CONSTANTS.MAX_CLICK_DURATION && e.srcElement?.localName !== 'button') {
            const targetSelector = e.button === 0 
                ? leftButtonSelector  // Левая кнопка мыши
                : e.button === 2 
                    ? rightButtonSelector  // Правая кнопка мыши
                    : null;
            
            if (targetSelector) {
                document.querySelector(targetSelector)?.click();
            }
        }
    });
    
    // Предотвращаем появление контекстного меню
    element?.addEventListener('contextmenu', (e) => e.preventDefault());
}

// Добавляем обработчики для всех нужных элементов
addClickHandlers(
    '.body-inventory', 
    '#statistics-left-player-inventory-button', 
    '#statistics-right-player-inventory-button'
);

addClickHandlers(
    '.body-equipment-right', 
    '#statistics-left-enemy-equipment-button', 
    '#statistics-right-enemy-equipment-button'
);

addClickHandlers(
    '.body-equipment-left', 
    '#statistics-left-player-equipment-button', 
    '#statistics-right-player-equipment-button'
);

addClickHandlers(
    '.last-log-message', 
    '#statistics-left-game-log-button', 
    '#statistics-right-game-log-button'
);

addClickHandlers(
    '.player-character-bars', 
    '#statistics-left-result-player-stats-button', 
    '#statistics-right-result-player-stats-button'
);

addClickHandlers(
    '.enemy-character-bars', 
    '#statistics-left-result-enemy-stats-button', 
    '#statistics-right-result-enemy-stats-button'
);








