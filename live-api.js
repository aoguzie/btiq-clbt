let liveMatches = new Map();
let previousMatches = new Map();
let eventSource = null;

function startLiveUpdates() {
    if (eventSource) return;
    
    const fetchData = async () => {
        try {
            const response = await fetch('https://www.cloudbet.com/sports-api/c/v6/sports/events?live=true&locale=en&markets=soccer.match_odds&markets=soccer.asian_handicap&markets=soccer.total_goals&sports=soccer');
            const data = await response.json();
            
            liveMatches.clear();
            console.log('API Response:', data);
            
            if (data && data.length > 0) {
                data.forEach(sport => {
                    if (sport.key === 'soccer' && sport.competitions) {
                        sport.competitions.forEach(competition => {
                            const name = (competition.name || '').toLowerCase();
                            const key = (competition.key || '').toLowerCase();
                            
                            if (!name.includes('srl') && !name.includes('virtual') && !name.includes('simulated') &&
                                !key.includes('srl') && !key.includes('virtual') && !key.includes('simulated') &&
                                competition.events) {
                                competition.events.forEach(event => {
                                    if (event.status === 'TRADING_LIVE') {
                                        const match = processLiveMatch(event, competition);
                                        if (match) {
                                            previousMatches.set(match.id, liveMatches.get(match.id));
                                            liveMatches.set(match.id, match);
                                            updateMatchDisplay(match);
                                        }
                                    }
                                });
                            }
                        });
                    }
                });
            }
            
            console.log('Live matches found:', liveMatches.size);
        } catch (error) {
            console.log('Fetch error:', error);
            console.log('Response type:', typeof data);
        }
    };
    
    fetchData();
    eventSource = setInterval(fetchData, 1000);
}



function extractMatchOdds(event) {
    const matchOdds = event.markets?.['soccer.match_odds']?.submarkets?.['period=ft'];
    if (!matchOdds?.selections) return { home: 0, draw: 0, away: 0 };
    const home = matchOdds.selections.find(s => s.outcome === 'home')?.probability || 0;
    const draw = matchOdds.selections.find(s => s.outcome === 'draw')?.probability || 0;
    const away = matchOdds.selections.find(s => s.outcome === 'away')?.probability || 0;
    return { home, draw, away };
}

function extractTotalGoals(event) {
    const totalGoals = event.markets?.['soccer.total_goals']?.submarkets?.['period=ft'];
    if (!totalGoals?.selections) return [];
    return totalGoals.selections.map(s => ({
        outcome: s.outcome,
        probability: s.probability,
        threshold: parseFloat(s.params?.split('=')[1]) || 2.5
    }));
}

function extractHandicap(event) {
    const handicap = event.markets?.['soccer.asian_handicap']?.submarkets?.['period=ft'];
    if (!handicap?.selections) return [];
    return handicap.selections.map(s => ({
        probability: s.probability,
        outcome: s.outcome,
        handicap: parseFloat(s.params?.split('=')[1]) || 0
    }));
}

function renderLiveMatches(matches) {
    return matches.map(match => `
        <div class="match" data-match-id="${match.id}">
            <div class="teams">${match.teams}</div>
            <div class="score">${match.score || '0-0'}</div>
            <div class="time">${match.time || ''}</div>
            <div class="probability">${(match.prob1 * 100).toFixed(1)}%</div>
        </div>
    `).join('');
}

function updateLiveMatch(eventData) {
    const match = processLiveMatch(eventData);
    if (match) {
        liveMatches.set(match.id, match);
        updateMatchDisplay(match);
    }
}

function getTrend(current, previous) {
    if (!previous) return '';
    const diff = current - previous;
    if (Math.abs(diff) < 0.01) return '';
    return diff > 0 ? '\u{1F44D}' : '\u{1F44E}';
}

function processLiveMatch(event, competition) {
    const matchOdds = extractMatchOdds(event);
    const totalGoals = extractTotalGoals(event);
    const handicap = extractHandicap(event);
    const previous = previousMatches.get(event.id);
    
    const timeExtended = event.metadata?.eventTime || 'xx';
    const matchSeconds = event.metadata?.matchTimeSeconds || 0;
    const minutes = Math.floor(matchSeconds / 60);
    const seconds = matchSeconds % 60;
    const preciseTime = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    
    let period = '';
    if (minutes === 0 && timeExtended === 'HT') {
        period = '\u{23F8}\u{FE0F} HT';
    } else if (minutes <= 45) {
        period = '1H';
    } else if (minutes > 45 && minutes <= 90) {
        period = '2H';
    } else if (minutes > 90 && minutes <= 120) {
        period = 'ET';
    } else if (minutes > 120) {
        period = 'PEN';
    }
    
    const displayTime = timeExtended === 'HT' ? `${period}` : `${timeExtended}  ${period}`;
    
    return {
        id: event.id || 'xx',
        team1: event.home?.name || 'xx',
        team2: event.away?.name || 'xx',
        teams: `${event.home?.name || 'xx'} vs ${event.away?.name || 'xx'}`,
        league: competition?.name || 'xx',
        country: competition?.category?.name || 'xx',
        score: event.metadata?.score ? `${event.metadata.score[0] || 'x'}-${event.metadata.score[1] || 'x'}` : 'xx',
        time: displayTime,
        start: event.startTime || 'xx',
        prob1: matchOdds.home || 0,
        probx: matchOdds.draw || 0,
        prob2: matchOdds.away || 0,
        trend1: getTrend(matchOdds.home, previous?.prob1) || '',
        trendx: getTrend(matchOdds.draw, previous?.probx) || '',
        trend2: getTrend(matchOdds.away, previous?.prob2) || '',
        ovun: totalGoals || [],
        AHDP: handicap || [],
        bestOU: totalGoals.length > 0 ? totalGoals.reduce((max, curr) => curr.probability > max.probability ? curr : max) : null,
        bestHDP: handicap.length > 0 ? handicap.reduce((max, curr) => curr.probability > max.probability ? curr : max) : null,
        topOU: totalGoals.sort((a, b) => b.probability - a.probability).slice(0, 4) || [],
        topHDP: handicap.sort((a, b) => b.probability - a.probability).slice(0, 4) || [],
        isLive: event.status === 'TRADING_LIVE' || false
    };
}

function updateMatchDisplay(match) {
    const matchElement = document.querySelector(`[data-match-id="${match.id}"]`);
    if (matchElement) {
        const probElement = matchElement.querySelector('.probability');
        if (probElement) {
            probElement.innerHTML = `${(match.prob1 * 100).toFixed(1)}%`;
        }
    }
}

function initLiveMatches() {
    startLiveUpdates();
    return Array.from(liveMatches.values());
}