import { gameState } from './main.js';
import { CONSTANTS } from './constants.js';
import { Item, Skill } from './thing.js';
import { logger } from './logger.js';
import { setupDragAndDrop } from './dragAndDrop.js';


async function createAndAddItem(container, index, type) {
    switch (type) {
        case 'item':
            try {
                const item = new Item(`item ${Math.random() * 10 | 0}`);
                if (container.add(item, index)) {
                    setupDragAndDrop(item.container, index, `new-${type}s`);
                    return item;
                }
            } catch (error) {
                logger.error(`Error handling ${type}:`, error);
            }
            return null;
            
        case 'skill':
            try {
                const skill = new Skill(`skill ${Math.random() * 10 | 0}`);
                if (container.add(skill, index)) {
                    setupDragAndDrop(skill.container, index, `new-${type}s`);
                    return skill;
                }
            } catch (error) {
                logger.error(`Error handling ${type}:`, error);
            }
            return null;
            
        default:
            return;
    }
}


export async function generateChoice() {
    try {    
        logger.debug('Choice generation started');
        gameEvents.emit('choiceGenerationStarted');

        const choiceContainerId = 'choice-container';
        const oldChoiceContainer = document.getElementById(choiceContainerId);
        if (oldChoiceContainer) {
            oldChoiceContainer.remove();
        }

        if (!gameState.newSkills || !gameState.newThings) {
            gameState.updateNewContainers();
        }

        const choiceContainer = document.createElement('div');
        choiceContainer.id = choiceContainerId;

        const newSkills = [];
        const newThings = [];

        for (let i = 0; i < CONSTANTS.CHOICE_CONTAINER_SIZE; i++) {
            const skill = await createAndAddItem(gameState.newSkills, i, 'skill');
            const thing = await createAndAddItem(gameState.newThings, i, 'item');
        newSkills.push(skill);
        newThings.push(thing);
        }


        const createTitle = (text, id) => {
            const title = document.createElement('div');
            title.innerHTML = `${text}<br>⇩`;
            title.id = id;
            return title;
        };

        const createSlotGrid = (type) => {
            const slotGrid = gameState.renderer.renderGrid(
                `new-${type}s`, 
                'player-choice-container',
                CONSTANTS.CHOICE_ROWS, 
                CONSTANTS.CHOICE_COLS, 
                `new-${type}s`
            );
            slotGrid.style.marginBottom = type === 'skills' ? '3px' : '';
            return slotGrid;
        };
        choiceContainer.appendChild(createTitle('choose 1 new skill', 'new-skills-title'));
        choiceContainer.appendChild(createSlotGrid('skill'));
        choiceContainer.appendChild(createTitle('or 1 new item', 'new-things-title'));
        choiceContainer.appendChild(createSlotGrid('thing'));

        

        document.querySelector('.body-equipment-right').appendChild(choiceContainer);

        gameEvents.emit('choiceGenerated', {
            choiceContainer,
            skills: newSkills,
            items: newThings
        });
        document.querySelector('.statistics-right-buttons-container .active-button')?.click();
        
        
    }  catch (error) {
        logger.error('Failed to generate choice:', error);
    }
}

if (document.getElementById('generateItems')) {
    document.getElementById('generateItems').addEventListener('click', () => {
        generateChoice();
    });
}


