
import { currentConfig } from './config.js';

export const logger = {
    debug: (message,  ...args) => {
        if (currentConfig.debug) {
            console.log(`[DEBUG] ${message}`,  ...args);
        }
    },
    error: (message, error) => {
        console.error(`[ERROR] ${message}`, error);
    },
    warn: (message,  ...args) => {
        console.warn(`[WARN] ${message}`,  ...args);
    },
    emit: (message,  ...args) => {
        if (currentConfig.debug) {
            console.log(`[EMIT] ${message}`,  ...args);
        }
    },
    on: (message,  ...args) => {
        if (currentConfig.debug) {
            console.log(`[ON] ${message}`,  ...args);
        }
    },
    once: (message,  ...args) => {
        if (currentConfig.debug) {
            console.log(`[ONCE] ${message}`,  ...args);
        }
    },
    off: (message,  ...args) => {
        if (currentConfig.debug) {
            console.log(`[OFF] ${message}`,  ...args);
        }
    },
};



