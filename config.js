// Новый файл
export const config = {
    development: {
        apiUrl: 'http://localhost:3000',
        debug: true
    },
    production: {
        apiUrl: 'https://api.game.com',
        debug: false
    },
    testing: {
        apiUrl: 'http://localhost:3001',
        debug: true
    }
};

const ENV = window.__ENV__ || 'development';
export const currentConfig = config[ENV];

