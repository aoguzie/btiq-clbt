const WebSocket = require('ws');
const fetch = require('node-fetch');

const wss = new WebSocket.Server({ port: 8080 });

wss.on('connection', (ws) => {
    const fetchData = async () => {
        try {
            const response = await fetch('https://www.cloudbet.com/sports-api/c/v6/sports/events?live=true&locale=en&markets=soccer.match_odds&markets=soccer.asian_handicap&markets=soccer.total_goals&sports=soccer');
            const data = await response.json();
            
            const events = [];
            data.forEach(sport => {
                if (sport.key === 'soccer' && sport.competitions) {
                    sport.competitions.forEach(competition => {
                        if (competition.events) {
                            events.push(...competition.events);
                        }
                    });
                }
            });
            
            ws.send(JSON.stringify({ events }));
        } catch (error) {
            console.log('Fetch error:', error);
        }
    };
    
    fetchData();
    const interval = setInterval(fetchData, 1000);
    
    ws.on('close', () => clearInterval(interval));
});

console.log('WebSocket server running on ws://localhost:8080');