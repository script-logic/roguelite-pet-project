

export function validateItem(item) {
    if (!item || typeof item !== 'object') {
        throw new Error('Invalid item');
    }
    if (!item.container || !item.description) {
        throw new Error('Item missing required properties');
    }
}
