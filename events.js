'use strict';
import { logger } from './logger.js';
import { CONSTANTS } from './constants.js';

class EventManager {
    constructor() {
        this.handlers = new Map();
        this.throttleTimers = new Map();
        this.queue = new Map();
    }

    addHandler(eventType, handler, throttleTime = 16) {
        if (!this.handlers.has(eventType)) {
            this.handlers.set(eventType, new Set());
        }
        
        const wrappedHandler = (event) => {
            if (this.throttleTimers.has(eventType)) {
                // Добавляем в очередь если идет throttling
                if (!this.queue.has(eventType)) {
                    this.queue.set(eventType, []);
                }
                this.queue.get(eventType).push(event);
                return;
            }

            this.throttleTimers.set(eventType, setTimeout(() => {
                this.throttleTimers.delete(eventType);
                // Обрабатываем очередь
                if (this.queue.has(eventType)) {
                    const queuedEvents = this.queue.get(eventType);
                    this.queue.delete(eventType);
                    queuedEvents.forEach(e => handler(e));
                }
            }, throttleTime));

            handler(event);
        };

        this.handlers.get(eventType).add(wrappedHandler);
        return () => this.removeHandler(eventType, wrappedHandler);
    }

    removeHandler(eventType, handler) {
        if (this.handlers.has(eventType)) {
            this.handlers.get(eventType).delete(handler);
        }
    }

    // Метод для очистки всех обработчиков
    clearHandlers() {
        this.handlers.clear();
        this.throttleTimers.clear();
        this.queue.clear();
    }
}


class EventEmitter {
    constructor() {
        this.events = {};
        this.maxListeners = CONSTANTS.GAME_EVENTS_MAX_LISTENERS;
    }

    on(event, callback) {
        if (!this.events[event]) {
            this.events[event] = [];
        }
        
        if (this.events[event].length >= this.maxListeners) {
            logger.warn(`Max listeners (${this.maxListeners}) exceeded for event: ${event}`);
        }
            
        this.events[event].push(callback);
        
        logger.on(event, callback);
        return () => this.off(event, callback);
    }

    once(event, callback) {
        const wrapper = (...args) => {
            callback(...args);
            logger.once(event, callback);
            this.off(event, wrapper);
        };
        return this.on(event, wrapper);
    }

    emit(event, ...args) {
        logger.emit('передано в эмит:', event, ...args);
        if (this.events[event]) {
            this.events[event].forEach(callback => {
                try {
                    //logger.emit(`слушает: ${callback}`, event, ...args);
                    callback(...args);
                } catch (error) {
                    logger.error(`Error in event handler for ${event}:`, error);
                }
            });
        }
    }
    
    off(event, callback) {
        if (this.events[event]) {
            logger.off(event, callback);
            this.events[event] = this.events[event].filter(cb => cb !== callback);
        }
    }

    // Установка максимального количества слушателей
    setMaxListeners(n) {
        this.maxListeners = n;
    }

    // Получение всех слушателей для события
    listeners(event) {
        return this.events[event] || [];
    }

    // Очистка всех обработчиков для события
    removeAllListeners(event) {
        if (event) {
            delete this.events[event];
        } else {
            this.events = {};
        }
    }
}

export const gameEvents = new EventEmitter();
export const eventManager = new EventManager();






