
export class GameStorage {
    static save(gameState) {
        localStorage.setItem('gameState', JSON.stringify(gameState));
    }

    static load() {
        return JSON.parse(localStorage.getItem('gameState'));
    }
    
    static clear() {
        localStorage.removeItem('gameState');
    }
}



