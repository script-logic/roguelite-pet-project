
import { gameState } from './main.js';


// Инициализация данных для графиков
export function initBattleCanvasData() {
    return {
        timePoints: [],

        // Player 1 data
        player1HP: [],
        player1Shield: [],
        player1Poison: [],
        player1Fire: [],
        player1Freeze: [],
        player1PhysicalShieldDamageTaken: [],
        player1FireShieldDamageTaken: [],

        //summarazing
        player1PhysicalDamage: [0],
        player1FatiqueDamage: [0],
        player1MagicalDamage: [0],
        player1PoisonDamage: [0],
        player1FireDamage: [0],
        player1PhysicalShieldDamage: [0],
        player1FireShieldDamage: [0],
        player1Healing: [0],
        player1Dispel: [0],
        player1AddShield: [0],

        // Player 2 data
        player2HP: [],
        player2Shield: [],
        player2Poison: [],
        player2Fire: [],
        player2Freeze: [],
        player2PhysicalShieldDamageTaken: [],
        player2FireShieldDamageTaken: [],

        //summarizing
        player2PhysicalDamage: [0],
        player2FatiqueDamage: [0],
        player2MagicalDamage: [0],
        player2PoisonDamage: [0],
        player2FireDamage: [0],
        player2PhysicalShieldDamage: [0],
        player2FireShieldDamage: [0],
        player2Healing: [0],
        player2Dispel: [0],
        player2AddShield: [0],
    };
}


// Update chart data
export function updateChartData(timestamp) {
    const { player, enemy } = gameState;
    const data = gameState.currentBattle.battleCanvasDataFull;

    // Add timestamp
    data.timePoints.push(timestamp);

    // Update player and enemy data
    data.player1HP.push(player.hp);
    data.player1Shield.push(player.shield);
    data.player2HP.push(enemy.hp);
    data.player2Shield.push(enemy.shield);

    // Update debuff data
    data.player1Poison.push(player.debuffs.poison);
    data.player1Fire.push(player.debuffs.burn);
    data.player1Freeze.push(player.debuffs.freeze);
    data.player2Poison.push(enemy.debuffs.poison);
    data.player2Fire.push(enemy.debuffs.burn);
    data.player2Freeze.push(enemy.debuffs.freeze);

    // For damage data, duplicate last values if no new damage occurred
    const damageAndSupportKeys = [
        'player1PhysicalDamage',
        'player1FatiqueDamage', 'player1MagicalDamage', 'player1PoisonDamage', 'player1FireDamage',
        'player1PhysicalShieldDamage', 'player1FireShieldDamage', 'player1Healing', 'player1Dispel', 'player1AddShield', 'player2PhysicalDamage',
        'player2FatiqueDamage', 
        'player2MagicalDamage', 'player2PoisonDamage', 'player2FireDamage', 'player2PhysicalShieldDamage',
        'player2FireShieldDamage', 'player2Healing', 'player2Dispel', 'player2AddShield',
    ];

    damageAndSupportKeys.forEach(key => {
        if (data[key].length > 0) {
            // Duplicate the last value to maintain continuous lines on the chart
            data[key].push(data[key][data[key].length - 1]);
        }
    });

    // Render active chart only if needed
    const activeTab = document.querySelector('.chart-tab.active');
    if (activeTab) {
        renderChart(activeTab.dataset.chart);
    }
}


// Отрисовка графика
export function renderChart (chartType) {
    if (!gameState.currentBattle) return;
    const ctx = document.getElementById('battle-chart');

    // Уничтожаем существующий график, если он есть
    if (window.battleChart) {
        window.battleChart.destroy();
    }

    // Определяем данные и настройки в зависимости от типа графика
    let chartConfig;

    switch(chartType) {
        case 'health':
            chartConfig = {
                type: 'line',
                data: {
                    labels: gameState.currentBattle.battleCanvasDataFull.timePoints,
                    datasets: [
                        {
                            label: 'Player HP',
                            data: gameState.currentBattle.battleCanvasDataFull.player1HP,
                            borderColor: 'rgba(75, 192, 192, 1)',
                            backgroundColor: 'rgba(75, 192, 192, 0.2)',
                            fill: true
                        },
                        {
                            label: 'Player Shield',
                            data: gameState.currentBattle.battleCanvasDataFull.player1Shield,
                            borderColor: 'rgba(54, 162, 235, 1)',
                            backgroundColor: 'rgba(54, 162, 235, 0.2)',
                            fill: true
                        },
                        {
                            label: 'Enemy HP',
                            data: gameState.currentBattle.battleCanvasDataFull.player2HP,
                            borderColor: 'rgba(75, 192, 192, 1)',
                            backgroundColor: 'rgba(75, 192, 192, 0.2)',
                            borderDash: [5, 5],
                            fill: true
                        },
                        {
                            label: 'Enemy Shield',
                            data: gameState.currentBattle.battleCanvasDataFull.player2Shield,
                            borderColor: 'rgba(54, 162, 235, 1)',
                            backgroundColor: 'rgba(54, 162, 235, 0.2)',
                            borderDash: [5, 5],
                            fill: true
                        }
                    ]
                }
            };
            break;

        case 'debuffs':
            chartConfig = {
                type: 'line',
                data: {
                    labels: gameState.currentBattle.battleCanvasDataFull.timePoints,
                    datasets: [
                        {
                            label: 'Player Poison',
                            data: gameState.currentBattle.battleCanvasDataFull.player1Poison,
                            borderColor: 'rgba(75, 192, 75, 1)',
                            backgroundColor: 'rgba(75, 192, 75, 0.2)',
                            borderDash: [5, 5]
                        },
                        {
                            label: 'Player Fire',
                            data: gameState.currentBattle.battleCanvasDataFull.player1Fire,
                            borderColor: 'rgba(255, 159, 64, 1)',
                            backgroundColor: 'rgba(255, 159, 64, 0.2)',
                            borderDash: [5, 5]
                        },
                        {
                            label: 'Player Freeze',
                            data: gameState.currentBattle.battleCanvasDataFull.player1Freeze,
                            borderColor: 'rgba(54, 162, 235, 1)',
                            backgroundColor: 'rgba(54, 162, 235, 0.2)',
                            borderDash: [5, 5]
                        },
                        {
                            label: 'Enemy Poison',
                            data: gameState.currentBattle.battleCanvasDataFull.player2Poison,
                            borderColor: 'rgba(75, 192, 75, 1)',
                            backgroundColor: 'rgba(75, 192, 75, 0.2)'
                        },
                        {
                            label: 'Enemy Fire',
                            data: gameState.currentBattle.battleCanvasDataFull.player2Fire,
                            borderColor: 'rgba(255, 159, 64, 1)',
                            backgroundColor: 'rgba(255, 159, 64, 0.2)'
                        },
                        {
                            label: 'Enemy Freeze',
                            data: gameState.currentBattle.battleCanvasDataFull.player2Freeze,
                            borderColor: 'rgba(54, 162, 235, 1)',
                            backgroundColor: 'rgba(54, 162, 235, 0.2)'
                        }
                    ]
                }
            };
            break;

        case 'damage':
            chartConfig = {
                type: 'line',
                data: {
                    labels: gameState.currentBattle.battleCanvasDataFull.timePoints,
                    datasets: [
                        {
                            label: 'Player Physical Damage',
                            data: gameState.currentBattle.battleCanvasDataFull.player1PhysicalDamage,
                            borderColor: 'rgba(54, 162, 235, 1)',
                            backgroundColor: 'rgba(54, 162, 235, 0.5)'
                        },
                        {
                            label: 'Player Fatique Damage',
                            data: gameState.currentBattle.battleCanvasDataFull.player1FatiqueDamage,
                            borderColor: 'rgba(50, 50, 50, 1)',
                            backgroundColor: 'rgba(50, 50, 50, 0.5)'
                        },
                        {
                            label: 'Player Magical Damage',
                            data: gameState.currentBattle.battleCanvasDataFull.player1MagicalDamage,
                            borderColor: 'rgba(153, 102, 255, 1)',
                            backgroundColor: 'rgba(153, 102, 255, 0.5)'
                        },
                        {
                            label: 'Player Poison Damage',
                            data: gameState.currentBattle.battleCanvasDataFull.player1PoisonDamage,
                            borderColor: 'rgba(75, 192, 75, 1)',
                            backgroundColor: 'rgba(75, 192, 75, 0.5)'
                        },
                        {
                            label: 'Player Fire Damage',
                            data: gameState.currentBattle.battleCanvasDataFull.player1FireDamage,
                            borderColor: 'rgba(255, 159, 64, 1)',
                            backgroundColor: 'rgba(255, 159, 64, 0.5)'
                        },
                        {
                            label: 'Enemy Physical Damage',
                            data: gameState.currentBattle.battleCanvasDataFull.player2PhysicalDamage,
                            borderColor: 'rgba(54, 162, 235, 1)',
                            backgroundColor: 'rgba(54, 162, 235, 0.2)',
                            borderDash: [5, 5]
                        },
                        {
                            label: 'Enemy Fatique Damage',
                            data: gameState.currentBattle.battleCanvasDataFull.player2FatiqueDamage,
                            borderColor: 'rgba(50, 50, 50, 1)',
                            backgroundColor: 'rgba(50, 50, 50, 0.5)',
                            borderDash: [5, 5]
                        },
                        {
                            label: 'Enemy Magical Damage',
                            data: gameState.currentBattle.battleCanvasDataFull.player2MagicalDamage,
                            borderColor: 'rgba(153, 102, 255, 1)',
                            backgroundColor: 'rgba(153, 102, 255, 0.2)',
                            borderDash: [5, 5]
                        },
                        {
                            label: 'Enemy Poison Damage',
                            data: gameState.currentBattle.battleCanvasDataFull.player2PoisonDamage,
                            borderColor: 'rgba(75, 192, 75, 1)',
                            backgroundColor: 'rgba(75, 192, 75, 0.2)',
                            borderDash: [5, 5]
                        },
                        {
                            label: 'Enemy Fire Damage',
                            data: gameState.currentBattle.battleCanvasDataFull.player2FireDamage,
                            borderColor: 'rgba(255, 159, 64, 1)',
                            backgroundColor: 'rgba(255, 159, 64, 0.2)',
                            borderDash: [5, 5]
                        }
                    ]
                },
                /*options: {
                        scales: {
                            x: {
                                stacked: true
                            },
                            y: {
                                stacked: true
                            }
                        }
                    }*/
            };
            break;

        case 'effects':
            chartConfig = {
                type: 'line',
                data: {
                    labels: gameState.currentBattle.battleCanvasDataFull.timePoints,
                    datasets: [
                        {
                            label: 'Player Healing',
                            data: gameState.currentBattle.battleCanvasDataFull.player1Healing,
                            borderColor: 'rgba(75, 192, 192, 1)',
                            backgroundColor: 'rgba(75, 192, 192, 0.2)'
                        },
                        {
                            label: 'Player Dispel',
                            data: gameState.currentBattle.battleCanvasDataFull.player1Dispel,
                            borderColor: 'rgba(153, 102, 255, 1)',
                            backgroundColor: 'rgba(153, 102, 255, 0.2)'
                        },
                        {
                            label: 'Player Add Shield',
                            data: gameState.currentBattle.battleCanvasDataFull.player1AddShield,
                            borderColor: 'rgba(200, 200, 200, 1)',
                            backgroundColor: 'rgba(200, 200, 200, 0.2)'
                        },
                        {
                            label: 'Enemy Healing',
                            data: gameState.currentBattle.battleCanvasDataFull.player2Healing,
                            borderColor: 'rgba(75, 192, 192, 1)',
                            backgroundColor: 'rgba(75, 192, 192, 0.2)',
                            borderDash: [5, 5]
                        },
                        {
                            label: 'Enemy Dispel',
                            data: gameState.currentBattle.battleCanvasDataFull.player2Dispel,
                            borderColor: 'rgba(153, 102, 255, 1)',
                            backgroundColor: 'rgba(153, 102, 255, 0.2)',
                            borderDash: [5, 5]
                        },
                        {
                            label: 'Enemy Add Shield',
                            data: gameState.currentBattle.battleCanvasDataFull.player2AddShield,
                            borderColor: 'rgba(200, 200, 200, 1)',
                            backgroundColor: 'rgba(200, 200, 200, 0.2)',
                            borderDash: [5, 5]
                        }
                    ]
                }
            };
            break;
    }

    // Общие настройки для всех графиков
    if (chartConfig) {
        chartConfig.options = chartConfig.options || {};
        chartConfig.options.responsive = true;
        chartConfig.options.maintainAspectRatio = false;
        chartConfig.options.animation = {
            duration: 0 // Отключаем анимацию для производительности
        };
        chartConfig.options.scales = {
            y: {
                beginAtZero: true //или min: 0
            }
        };

        // Создаем график
        window.battleChart = new Chart(ctx, chartConfig);
    }
}




