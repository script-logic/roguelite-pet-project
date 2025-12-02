'use strict';
import { CONSTANTS } from './constants.js';

export class Slots {
    constructor(size) {
        if (!Number.isInteger(size) || size <= 0) {
            throw new Error('Size must be a positive number');
        }
        this.slots = Array(size).fill(null);
        this.size = size;
    }

    add(item, slotId) {
        if (slotId >= 0 && slotId < this.size && !this.slots[slotId]) {
            this.slots[slotId] = item;
            return true;
        }
        return false;
    }

    remove(slotId) {
        if (slotId >= 0 && slotId < this.size) {
            const item = this.slots[slotId];
            this.slots[slotId] = null;
            return item;
        }
        return null;
    }

    get(slotId) {
        return (slotId >= 0 && slotId < this.size) ? this.slots[slotId] : null;
    }
}

export class Inventory extends Slots {
    constructor() {
        super(CONSTANTS.INVENTORY_SIZE);
    }
}

export class Equipment extends Slots {
    constructor() {
        super(CONSTANTS.EQUIPMENT_SIZE);
    }
}

export class Skills extends Slots {
    constructor() {
        super(CONSTANTS.SKILLS_SIZE);
    }
}

export class ChoiceContainer extends Slots {
    constructor(size) {
        super(size);
    }
}

export class EquipmentStats extends Slots {
    constructor() {
        super(CONSTANTS.EQUIPMENT_SIZE);
    }
}

export class SkillsStats extends Slots {
    constructor() {
        super(CONSTANTS.SKILLS_SIZE);
    }
}

export class InventoryStats extends Slots {
    constructor() {
        super(CONSTANTS.INVENTORY_STATS_SIZE);
    }
}













