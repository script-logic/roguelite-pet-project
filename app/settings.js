
import { eventManager, gameEvents } from './events.js';


class Settings {
    constructor() {
        this.thingTooltipFlag = true;
        this.fullscreenMode = false;
        this.localization = 'russian';

        gameEvents.on('settingsChange', (property, newValue) => this[property] = newValue)
    }

}


export const settings = new Settings();






