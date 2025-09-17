// Loading screen functionality
function updateProgress(percentage) {
    const progressFill = document.getElementById('progressFill');
    const progressText = document.getElementById('progressText');
    const roundedPercentage = Math.round(percentage);
    console.log('Progress:', roundedPercentage + '%');
    if (progressFill && progressText) {
        progressFill.style.width = roundedPercentage + '%';
        progressText.textContent = roundedPercentage + '%';
    }
}

function hideLoadingScreen() {
    const loadingScreen = document.getElementById('loadingScreen');
    const mainApp = document.getElementById('mainApp');
    if (loadingScreen && mainApp) {
        loadingScreen.style.opacity = '0';
        setTimeout(() => {
            loadingScreen.style.display = 'none';
            mainApp.classList.remove('hidden');
        }, 500);
    }
}

function showErrorScreen(message = 'Unable to load data. Please check your internet connection.') {
    const loadingScreen = document.getElementById('loadingScreen');
    const errorScreen = document.getElementById('errorScreen');
    const errorMessage = document.getElementById('errorMessage');
    const mainApp = document.getElementById('mainApp');
    
    if (loadingScreen) loadingScreen.style.display = 'none';
    if (mainApp) mainApp.classList.add('hidden');
    if (errorMessage) errorMessage.textContent = message;
    if (errorScreen) {
        errorScreen.style.display = 'flex';
        setupPullToRefresh();
    }
}

function hideErrorScreen() {
    const errorScreen = document.getElementById('errorScreen');
    if (errorScreen) errorScreen.style.display = 'none';
}

function setupPullToRefresh() {
    const errorScreen = document.getElementById('errorScreen');
    const pullIndicator = document.getElementById('pullIndicator');
    let startY = 0;
    let currentY = 0;
    let isPulling = false;
    
    errorScreen.addEventListener('touchstart', (e) => {
        startY = e.touches[0].clientY;
        isPulling = errorScreen.scrollTop === 0;
    });
    
    errorScreen.addEventListener('touchmove', (e) => {
        if (!isPulling) return;
        currentY = e.touches[0].clientY;
        const pullDistance = currentY - startY;
        
        if (pullDistance > 0) {
            e.preventDefault();
            const opacity = Math.min(pullDistance / 100, 1);
            pullIndicator.style.opacity = opacity;
        }
    });
    
    errorScreen.addEventListener('touchend', () => {
        if (!isPulling) return;
        const pullDistance = currentY - startY;
        
        if (pullDistance > 80) {
            location.reload();
        } else {
            pullIndicator.style.opacity = 0;
        }
        isPulling = false;
    });
}

// Initialize loading at 0%
updateProgress(0);

document.addEventListener('DOMContentLoaded', function() {
    const today = moment().startOf('day').toISOString();
    const tomorrow = moment().add(1, 'days').toISOString();
    const yesterday = moment().subtract(1, 'days').toISOString();
    const p1week = moment().subtract(1, 'months').toISOString();
    const p1month = moment().subtract(1, 'months').toISOString();
    const ptmonth = moment().subtract(6, 'months').toISOString();
    const n1week = moment().add(2, 'weeks').toISOString();
    const n2week = moment().add(2, 'weeks').toISOString();
    const n1month = moment().add(1, 'months').toISOString();
    const todayUNIX = moment(today).unix();
    const p1weekUNIX = moment(p1week).unix();
    const n1weekUNIX = moment(n1week).unix();
    const n2weekUNIX = moment(n2week).unix();
  
    var money = new Intl.NumberFormat().format;
  
    const fbdata = [];
  
    console.log(_.isEmpty([]));
    const markets =
        '&markets=soccer.asian_handicap&markets=soccer.total_goals&markets=soccer.both_teams_to_score&markets=soccer.team_total_goals&markets=soccer.total_goals_period_first_half&markets=soccer.correct_score&markets=soccer.total_corners&markets=soccer.freetext&markets=soccer.halftime_fulltime_result';
    const filters = ["Virtual Football World Cup", "SRL International Friendlies", "Virtual"];
    // create XHR function with time-based progress simulation
    function fetchData(url, progressCallback) {
        return new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.open('GET', url, true);
            
            let startTime = Date.now();
            let progressInterval;
            
            if (progressCallback) {
                progressInterval = setInterval(() => {
                    const elapsed = Date.now() - startTime;
                    const progress = Math.min(Math.round(elapsed / 50), 90); // 90% max in 4.5 seconds
                    progressCallback(progress);
                }, 100);
            }
            
            xhr.addEventListener('load', function() {
                if (progressInterval) clearInterval(progressInterval);
                if (progressCallback) progressCallback(100);
                
                if (xhr.status >= 200 && xhr.status < 300) {
                    try {
                        const data = JSON.parse(xhr.responseText);
                        resolve(data);
                    } catch (error) {
                        reject(new Error('Invalid JSON response'));
                    }
                } else {
                    reject(new Error('Network response was not ok'));
                }
            });
            
            xhr.addEventListener('error', function() {
                if (progressInterval) clearInterval(progressInterval);
                reject(new Error('Network error'));
            });
            
            xhr.send();
        });
    }
  
    // Update past matches from current data
    function updatePastMatches(currentMatches) {
        var existingPast = JSON.parse(localStorage.getItem('pastMatches') || '[]');
        var now = moment();
        
        // Add current matches that are now past
        var newPastMatches = currentMatches.filter(match => moment(match.start).isBefore(now));
        
        // Combine and remove duplicates
        var allPast = [...existingPast, ...newPastMatches];
        var uniquePast = allPast.filter((match, index, self) => 
            index === self.findIndex(m => m.teams === match.teams && m.start === match.start)
        );
        
        // Keep only last 7 days
        var sevenDaysAgo = moment().subtract(7, 'days');
        var filteredPast = uniquePast.filter(match => moment(match.start).isAfter(sevenDaysAgo));
        
        localStorage.setItem('pastMatches', JSON.stringify(filteredPast));
    }
    
    fetchData('https://www.cloudbet.com/sports-api/c/v6/sports/events?from=' + todayUNIX + '&to=' + moment().add(7, 'days').unix() + '&sports=soccer&markets=soccer.match_odds' + markets + '&limit=1000&locale=en', 
        function(fetchProgress) {
            updateProgress(fetchProgress);
        })
        .then(data => {
            console.log(data)
            
            const res = (data.sports[0].competitions).filter(x => {
                const name = (x.name || '').toLowerCase().trim();
                const key = (x.key || '').toLowerCase().trim();
                return (
                    !name.includes('srl') &&
                    !name.includes('virtual') &&
                    !name.includes('simulated') &&
                    // !name.includes('cup') &&
                    !key.includes('srl') &&
                    !key.includes('virtual') &&
                    !key.includes('simulated') 
                    // !key.includes('cup')
                );
            });
            
            // console.log(res);
           // Loop through each item in the data array
for (const item of res) {
    const { category, name } = item; // Destructure the "category" and "name" properties
  
    // Loop through each event in the "events" array
    for (const event of item.events) {
      // Add "category" and "name" properties to each event
      event.country = category.name; // Use spread syntax to copy the category object
      event.league = name;
    }
  
    // Remove the original "category" and "name" properties from the item
    delete item.category;
    delete item.name;
  }
  console.log(res);
            res.forEach(function (fb) {
                try {
                    fb.events.forEach((f) => {
                        if (
                            typeof f.markets["soccer.match_odds"] !== 'undefined'
                            && typeof f.markets["soccer.both_teams_to_score"] !== 'undefined'
                            && typeof f.markets["soccer.total_goals"] !== 'undefined'
                            && typeof f.markets["soccer.asian_handicap"] !== 'undefined'
                            && typeof f.markets["soccer.team_total_goals"] !== 'undefined'
                            && typeof f.markets["soccer.halftime_fulltime_result"] !== 'undefined'
                            && typeof _.filter(f.markets["soccer.total_goals"].submarkets["period=ft"].selections, { 'params': "total=1.5" }) !== 'undefined'
                            && typeof _.filter(f.markets["soccer.total_goals"].submarkets["period=ft"].selections, { 'params': "total=2.5" }) !== 'undefined'
                            && typeof _.filter(f.markets["soccer.total_goals"].submarkets["period=ft"].selections, { 'params': "total=3.5" }) !== 'undefined'
                            && typeof _.filter(f.markets["soccer.total_goals"].submarkets["period=ft"].selections, { 'params': "total=4.5" }) !== 'undefined'
                            && typeof f.markets["soccer.correct_score"].submarkets["period=ft"].selections !== 'undefined'
                        ) {
                            fbdata.push(f);
                        }
                    });
                } catch (error) {
  
                }
            });
            console.log(fbdata);
            const fb = fbdata.map(function (f) {
                function getLogo(media) {
                    if (!media || !Array.isArray(media)) return null;
                    const logoObj = media.find(m => m.type === "LOGO" && m.url);
                    return logoObj ? logoObj.url : null;
                }
                return {
                    start: f.startTime,
                    matchday: f.metadata.matchDay,
                    country: f.country,
                    league: f.league,
                    teams: f.name,
                    team1: f.home.name,
                    team2: f.away.name,
                    team1Logo: getLogo(f.home.media),
                    team2Logo: getLogo(f.away.media),
                    odd1: f.markets["soccer.match_odds"]?.submarkets["period=ft"]?.selections?.[0]?.price || null,
                    oddx: f.markets["soccer.match_odds"]?.submarkets["period=ft"]?.selections?.[1]?.price || null,
                    odd2: f.markets["soccer.match_odds"]?.submarkets["period=ft"]?.selections?.[2]?.price || null,
                    prob1: f.markets["soccer.match_odds"]?.submarkets["period=ft"]?.selections?.[0]?.probability || null,
                    probx: f.markets["soccer.match_odds"]?.submarkets["period=ft"]?.selections?.[1]?.probability || null,
                    prob2: f.markets["soccer.match_odds"]?.submarkets["period=ft"]?.selections?.[2]?.probability || null,
                    max1: f.markets["soccer.match_odds"]?.submarkets["period=ft"]?.selections?.[0]?.maxStake || null,
                    maxx: f.markets["soccer.match_odds"]?.submarkets["period=ft"]?.selections?.[1]?.maxStake || null,
                    max2: f.markets["soccer.match_odds"]?.submarkets["period=ft"]?.selections?.[2]?.maxStake || null,
                    ttg: f.markets["soccer.team_total_goals"] || null,
                    AHDP: f.markets["soccer.asian_handicap"] || null,
                    cs: f.markets["soccer.correct_score"]?.submarkets?.["period=ft"]?.selections || null,
                    ovun: f.markets["soccer.total_goals"]?.submarkets?.["period=ft"]?.selections || null,
                    bts: f.markets["soccer.both_teams_to_score"] || null                
                }
            });

            // Preload all logos after fb array creation
            fb.forEach(function(m) {
                if (m.team1Logo) { var img1 = new Image(); img1.src = m.team1Logo; }
                if (m.team2Logo) { var img2 = new Image(); img2.src = m.team2Logo; }
            });
            
            // Update past matches with current data
            updatePastMatches(fb);
  console.log(fb)
            function createCard(league,title, content) {
                var card = document.createElement("div");
                card.classList.add("prediction-card");
                card.innerHTML = `
                    <div class="match-header">
                        <div class="teams-name">${league}</div>
                        <div class="confidence-badge">${title}</div>
                    </div>
                    <div class="card-content">${content}</div>
                `;
                return card;
            }
  
            function formatProbability(probability, maxProbability = 1, minProbability = 0) {
                var range = maxProbability - minProbability;
                var greenThreshold = maxProbability - range * 0.5;
                var redThreshold = minProbability + range * 0.5;
  
                if (probability >= 0.66) {
                    return `<span class="probability-green">${(probability * 100).toFixed(2)}%</span>`;
                } else if (probability >= 0.55 && probability <=0.66) {
                    return `<span class="probability-yellow">${(probability * 100).toFixed(2)}%</span>`;
                } else {
                    return `<span class="probability-red">${(probability * 100).toFixed(2)}%</span>`;
                }
            }
  
            function formatDate(dateTimeString) {
                return new Date(dateTimeString).toLocaleString();
            }
            function createOvunTable(ovunData) {
                ovunData.sort((a, b) => b.probability - a.probability);
                var rows = "";
                ovunData.forEach(function (ovun) {
                    if (ovun.probability >= 0.6) {
                        // Support both .params and .threshold for merged objects
                        var cleanParams = '';
                        if (ovun.params !== undefined) {
                            cleanParams = String(ovun.params).replace('total=', '');
                        } else if (ovun.threshold !== undefined) {
                            cleanParams = ovun.threshold;
                        }
                        var combinedType = `${ovun.outcome} ${cleanParams}`;
                        rows += `<tr><td>${combinedType}</td><td>${parseFloat(ovun.price).toFixed(2)}</td><td>${formatProbability(ovun.probability)}</td></tr>`;
                    }
                });
                return `<table class="market-table"><thead><tr><th>Total</th><th>Odds</th><th>Prob</th></tr></thead><tbody>${rows}</tbody></table>`;
            }
          function createTeamTGCardContent(teamTGData) {
            var content = "";
            teamTGData.forEach(function (teamTG) {
                var teamTGText = `${teamTG.outcome} (${teamTG.params}): ${teamTG.price} (Probability: ${formatProbability(teamTG.probability)})<br>`;
                content += teamTGText;
            });
            return content;
        }
  
        function createAHDPTable(ahdpData) {
            var rows = "";
            ahdpData.forEach(function (ahdp) {
                if (ahdp.probability >= 0.6) {
                    var cleanParams = ahdp.params.replace('handicap=', '');
                    var combinedTeam = `${ahdp.outcome} ${cleanParams}`;
                    rows += `<tr><td>${combinedTeam}</td><td>${parseFloat(ahdp.price).toFixed(2)}</td><td>${formatProbability(ahdp.probability)}</td></tr>`;
                }
            });
            return `<table class="market-table"><thead><tr><th>Handicap</th><th>Odds</th><th>Prob</th></tr></thead><tbody>${rows}</tbody></table>`;
        }
  
            function createBtsCardContent(btsData) {
                var content = `${btsData.selections[0].outcome}: ${btsData.selections[0].price} (${formatProbability(btsData.selections[0].probability)}),
                               ${btsData.selections[1].outcome}: ${btsData.selections[1].price} (${formatProbability(btsData.selections[1].probability)})`;
                
                               return content;
            }
  
            // Track show odds state globally
            let showOdds = true;
            // On DOMContentLoaded, initialize showOdds based on localStorage and set event
            document.addEventListener('DOMContentLoaded', function() {
                const showOddsToggle = document.getElementById('showOddsToggle');
                if (showOddsToggle) {
                    const saved = localStorage.getItem('showOdds');
                    showOdds = saved === null ? true : saved === 'true';
                    showOddsToggle.checked = showOdds;
                    showOddsToggle.addEventListener('change', function() {
                        showOdds = showOddsToggle.checked;
                        localStorage.setItem('showOdds', showOdds);
                        filterMatchesByDay(currentDay);
                    });
                }
            });
            function createTeam1DrawTeam2Content(match, oddsSys) {
                // oddsSys.markets.market1X2.selections[0|1|2]: Home, Draw, Away
                const fair = oddsSys?.markets?.market1X2?.selections;
                return `
                    <div class="odds-grid">
                        <div class="outcome-box home">
                            <div class="outcome-label">Home</div>
                            ${showOdds && fair && fair[0]?.trueOdds ? `<div class="odds-value">${fair[0].trueOdds.toFixed(2)}</div>` : ''}
                            <div class="probability">${fair && fair[0]?.trueProbability ? formatProbability(fair[0].trueProbability) : ''}</div>
                        </div>
                        <div class="outcome-box draw">
                            <div class="outcome-label">Draw</div>
                            ${showOdds && fair && fair[1]?.trueOdds ? `<div class="odds-value">${fair[1].trueOdds.toFixed(2)}</div>` : ''}
                            <div class="probability">${fair && fair[1]?.trueProbability ? formatProbability(fair[1].trueProbability) : ''}</div>
                        </div>
                        <div class="outcome-box away">
                            <div class="outcome-label">Away</div>
                            ${showOdds && fair && fair[2]?.trueOdds ? `<div class="odds-value">${fair[2].trueOdds.toFixed(2)}</div>` : ''}
                            <div class="probability">${fair && fair[2]?.trueProbability ? formatProbability(fair[2].trueProbability) : ''}</div>
                        </div>
                    </div>
                `;
            }

  
            function shouldHideCard(startDateTime) {
                return false;
            }
  
            var currentDay = 0;
            var isPastMode = false;
            
            function filterMatchesByDay(dayOffset = currentDay) {
                if (isPastMode) {
                    showPastMatches();
                    return;
                }
                var matchPercentageInput = document.getElementById("matchPercentage");
                var bttsPercentageInput = document.getElementById("bttsPercentage");
                var ovunPercentageInput = document.getElementById("ovunPercentage");
                var ahdpPercentageInput = document.getElementById("ahdpPercentage") || document.getElementById("ahdp_percentage");
                
                var matchPercentage = (parseFloat(matchPercentageInput.value) || 0) / 100;
                var bttsPercentage = (parseFloat(bttsPercentageInput.value) || 0) / 100;
                var ovunPercentage = (parseFloat(ovunPercentageInput.value) || 0) / 100;
                var ahdpPercentage = (ahdpPercentageInput && ahdpPercentageInput.value) ? (parseFloat(ahdpPercentageInput.value) || 0) / 100 : 0;
  
                var matchesContainer = document.getElementById("matchesContainer");
                matchesContainer.innerHTML = "";
                
                var targetDate = moment().add(dayOffset, 'days').format('YYYY-MM-DD');
                var dayMatches = fb.filter(match => moment(match.start).format('YYYY-MM-DD') === targetDate);
                
                // Check if no matches for this day
                if (dayMatches.length === 0) {
                    matchesContainer.innerHTML = '<div class="no-matches"><span style="font-size: 100px;">☕</span><span style="font-size: 30px;">No Scheduled Matches</span> </div>';
                    return;
                }
                
                // Sort matches by time
                dayMatches.sort((a, b) => new Date(a.start) - new Date(b.start));
                
                // Ensure scroll to top after cards render (robust)
                setTimeout(function() {
                window.scrollTo(0, 0);
                }, 10);
  
                // Merges marketOU selections into match.ovun
            function mergeOUSelections(ouSelections, ovunSelections) {
                if (!ouSelections || !Array.isArray(ouSelections) || !ovunSelections || !Array.isArray(ovunSelections)) {
                    return ovunSelections || [];
                }
                // Extract numeric threshold from either .threshold or .params (like 'total=2.5')
                function extractThreshold(o) {
                    if (o.threshold !== undefined) return parseFloat(o.threshold);
                    if (o.params !== undefined && typeof o.params === 'string' && o.params.startsWith('total=')) {
                        return parseFloat(o.params.replace('total=', ''));
                    }
                    return undefined;
                }
                function key(o) {
                    return o.outcome + '|' + extractThreshold(o);
                }
                const ouMap = new Map(ouSelections.map(o => [key(o), o]));
                const merged = ovunSelections.map(orig => ouMap.has(key(orig)) ? ouMap.get(key(orig)) : orig);
                const ovunKeys = new Set(ovunSelections.map(key));
                ouSelections.forEach(o => {
                    if (!ovunKeys.has(key(o))) merged.push(o);
                });
                // Remove any remaining duplicates on key
                const seen = new Set();
                return merged.filter(o => {
                    const k = key(o);
                    if (seen.has(k)) return false;
                    seen.add(k);
                    return true;
                });
            }

            dayMatches.forEach(function (match) {
                const oddsys = analyzeBettingData(match)
                // console.log(match.cs)
                console.log(oddsys)

                var mergedOvun = mergeOUSelections(
                    oddsys?.markets?.marketOU?.selections,
                    match.ovun
                );
                var matchProbability = match.prob1;
                var bttsProbability = match.bts?.submarkets?.["period=ft"]?.selections?.[0]?.probability || 0;
                var maxOvunProbability = Math.max(...mergedOvun.map(ovun => ovun.probability));
                // var maxTeamTGProbability = Math.max(...match.ttg.submarkets["period=ft&team=away"].selections.map(teamTG => teamTG.probability), ...match.ttg.submarkets["period=ft&team=home"].selections.map(teamTG => teamTG.probability));
  
                    const matchOutcomePrediction = predictMatchOutcome(match.cs);
                    const matchPrediction = predictMatchProb(match.cs);
                    const bothTeamsToScorePrediction = predictBothTeamsToScore(match.cs);
                    const TGPred = predictTotalGoals(match.cs)
                    const expectedGoals = calculateExpectedGoals(match.cs);
                    // console.log("Expected Goals for Home Team:", expectedGoals.home);
                    // console.log("Expected Goals for Away Team:", expectedGoals.away);
                    // console.log("Match Outcome Prediction:", matchOutcomePrediction);
                    // console.log("Match Probabilities:", matchPrediction);
                    // console.log("BTTS Prediction:", bothTeamsToScorePrediction);
                    // console.log("Total goals:", TGPred);
                    
                    // predictions
                    const ovunpred = (predictOVUNOutcome(match.ovun))
                    
                    const ahdpred = (predictAHDPOutcome(match.AHDP))
                    
                  //   console.log('ovun:'+ovunpred)
                  //   console.log('hdp:'+ahdpred)
  
                    var maxHandicapProbability = 0;
                    if (match.AHDP && match.AHDP.submarkets && match.AHDP.submarkets["period=ft"] && Array.isArray(match.AHDP.submarkets["period=ft"].selections)) {
                        maxHandicapProbability = Math.max(...match.AHDP.submarkets["period=ft"].selections.map(sel => sel && sel.probability || 0));
                    }
                    if (
                        matchProbability >= matchPercentage &&
                        bttsProbability >= bttsPercentage &&
                        maxOvunProbability >= ovunPercentage &&
                        maxHandicapProbability >= ahdpPercentage &&
                        !shouldHideCard(match.start) &&
                        !match.teams.includes("SRL") &&
                        !match.teams.includes("(Srl)")&&
                        match.matchday >= 0
                    ) {
                        var cardContents = [];
  
                        var matchCardContent = `
                            <div class="match-header-info">
                                <span class="team-names">
                                    <span class="team1">
                                        <img src="${match.team1Logo || 'https://placehold.co/24x24?text=T1'}" class="team-logo" alt="${match.team1}">
                                        <span class="team1-name">${match.team1}</span>
                                    </span>
                                    <span class="vs">vs</span>
                                    <span class="team2">
                                        <img src="${match.team2Logo || 'https://placehold.co/24x24?text=T2'}" class="team-logo" alt="${match.team2}">
                                        <span class="team2-name">${match.team2}</span>
                                    </span>
                                </span>
                            </div>
                            ${createTeam1DrawTeam2Content(match, oddsys)}
                        `;
                        cardContents.push(matchCardContent);
  
                        var bttsOdds = oddsys.markets.marketBTS?.selections?.[0]?.trueOdds;
                        var bttsProb = oddsys.markets.marketBTS?.selections?.[0]?.trueProbability;
                        var tgProbsRaw = predictTotalGoals(match.cs);
                        var tgProbs = Array.isArray(tgProbsRaw) ? tgProbsRaw : [];
                        var ouBlock = tgProbs.length > 0
                            ? tgProbs.map(tg => `<span class='ou'>O${tg.threshold}: ${(100*tg.over).toFixed(2)}% | U${tg.threshold}: ${(100*tg.under).toFixed(2)}%</span>`).join('<br>')
                            : '<span class="ou">No Over/Under data</span>';

                        var scoringContent =
                            `<div class="btts"><b>BTTS: </b> ${(formatProbability(bttsProb !== undefined ? (bttsProb).toFixed(2) : '0.00'))} <br></div>` +
                            `<div class="xg">&nbsp;&nbsp;&nbsp;<b>xG: </b> ${expectedGoals.home.toFixed(1)} - ${expectedGoals.away.toFixed(1)}</div>`+
                            `<div class="cs">&nbsp;&nbsp;&nbsp;<b>Correct Score: </b> ${Math.round(expectedGoals.home)} : ${Math.round(expectedGoals.away)}</div>`;
                        cardContents.push(`<div class="compact-stats">⚽  ${scoringContent}</div>`);
  

  
                        var tablesRow = `<div class="tables-row">`;
                        var ovunTable = createOvunTable(mergedOvun);
                        tablesRow += `<div class="table-col"><h4>📊 OVER/UNDER</h4>${ovunTable}</div>`;
                        
                        if (match.AHDP && match.AHDP.submarkets["period=ft"]) {
                            match.AHDP.submarkets["period=ft"].selections.sort((a, b) => b.probability - a.probability);
                            var ahdpTable = createAHDPTable(match.AHDP.submarkets["period=ft"].selections);
                            tablesRow += `<div class="table-col"><h4>⚖️ HANDICAP</h4>${ahdpTable}</div>`;
                        }
                        
                        tablesRow += `</div>`;
                        cardContents.push(tablesRow);
  
                        var card = createCard(`${match.league}`,`${match.country} | ${new Date(match.start).toLocaleDateString()} | ${new Date(match.start).toLocaleTimeString('en-US', {hour: '2-digit', minute:'2-digit'})}`, cardContents.join(""));
                        matchesContainer.appendChild(card);
                    }
                    
                });
            }
  
            // Create date tabs
            var dayTabsContainer = document.getElementById('dayTabs');
            
            // Add Live tab first
            var liveTab = document.createElement('div');
            liveTab.classList.add('tab');
            liveTab.dataset.day = 'live';
            liveTab.textContent = '🔴 Live';
            dayTabsContainer.appendChild(liveTab);
            
            // Add day tabs
            for (let i = 0; i < 7; i++) {
                var tab = document.createElement('div');
                tab.classList.add('tab');
                if (i === 0) tab.classList.add('active');
                tab.dataset.day = i;
                var date = moment().add(i, 'days');
                tab.textContent = i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : date.format('MMM DD');
                dayTabsContainer.appendChild(tab);
            }
            
            function showLiveMatches() {
                var matchesContainer = document.getElementById('matchesContainer');
                matchesContainer.innerHTML = '<div class="no-matches">🔄 Loading live matches...</div>';
                
                function updateLiveDisplay() {
                    const matches = Array.from(liveMatches.values());
                    if (matches.length > 0) {
                        matchesContainer.innerHTML = matches.map(createLiveCard).join('');
                    } else {
                        matchesContainer.innerHTML = '<div class="no-matches"><span style="font-size: 100px;">⚽</span><br><span style="font-size: 30px;">No Live Matches Available</span><br><span style="font-size: 16px; color: #999;">Check back later for live games</span></div>';
                    }
                }
                
                updateLiveDisplay();
                setInterval(updateLiveDisplay, 2000);
            }
            
            function createLiveCard(match) {
                return createCard(
                    match.league || 'Live Match',
                    `🔴 LIVE | ${match.country || 'Unknown'} | ${match.time || ''}`,
                    `
                        <div class="match-header-info">
                            <div class="team-names">
                                <span class="team1">
                                    <span class="team1-name">${match.team1}</span>
                                </span>
                                <span class="vs">vs</span>
                                <span class="team2">
                                    <span class="team2-name">${match.team2}</span>
                                </span>
                            </div>
                        </div>
                        <div class="odds-grid">
                            <div class="outcome-box home">
                                <div class="outcome-label">Home</div>
                                <div class="probability">${formatProbability(match.prob1)}</div>
                            </div>
                            <div class="outcome-box draw">
                                <div class="outcome-label">Draw</div>
                                <div class="probability">${formatProbability(match.probx || 0)}</div>
                            </div>
                            <div class="outcome-box away">
                                <div class="outcome-label">Away</div>
                                <div class="probability">${formatProbability(match.prob2 || 0)}</div>
                            </div>
                        </div>
                    `
                );
            }
            
            function showPastMatches() {
                var matchesContainer = document.getElementById('matchesContainer');
                matchesContainer.innerHTML = '';
                
                var pastMatches = JSON.parse(localStorage.getItem('pastMatches') || '[]');
                if (pastMatches.length === 0) {
                    matchesContainer.innerHTML = '<div class="no-matches">Coming Soon</div>';
                    return;
                }
                
                // Sort past matches by date (newest first)
                pastMatches.sort((a, b) => new Date(b.start) - new Date(a.start));
                
                pastMatches.forEach(function(match) {
                    var card = createCard(match.teams, `<div class="match-info">${match.league} | ${new Date(match.start).toLocaleDateString()} ${new Date(match.start).toLocaleTimeString('en-US', {hour: '2-digit', minute:'2-digit'})}</div>`);
                    matchesContainer.appendChild(card);
                });
            }
            
            // Add event listeners to tabs
            document.querySelectorAll('.tab').forEach(tab => {
                tab.addEventListener('click', function() {
                    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
                    this.classList.add('active');
                    if (this.dataset.day === 'live') {
                        showLiveMatches();
                    } else {
                        currentDay = parseInt(this.dataset.day);
                        filterMatchesByDay(currentDay);
                    }
                });
            });

            // Burger/side menu interactions
            const burger = document.getElementById('burgerBtn');
            const sideMenu = document.getElementById('sideMenu');
            const sideMenuOverlay = document.getElementById('sideMenuOverlay');
            const sideMenuClose = document.getElementById('sideMenuClose');

            function openSideMenu() {
                if (sideMenu) sideMenu.style.display = 'block';
                if (sideMenuOverlay) sideMenuOverlay.style.display = 'block';
            }
            function closeSideMenu() {
                if (sideMenu) sideMenu.style.display = 'none';
                if (sideMenuOverlay) sideMenuOverlay.style.display = 'none';
            }
            if (burger) burger.addEventListener('click', openSideMenu);
            if (sideMenuOverlay) sideMenuOverlay.addEventListener('click', closeSideMenu);
            if (sideMenuClose) sideMenuClose.addEventListener('click', closeSideMenu);

            // Side menu actions
            var rateBtn = document.getElementById('rateBtn');
            if (rateBtn) rateBtn.onclick = function() {
                window.open('https://play.google.com/store/apps/details?id=com.betiq.app', '_blank');
                closeSideMenu();
            };
            var shareBtn = document.getElementById('shareBtn');
            if (shareBtn) shareBtn.onclick = function() {
                const shareUrl = 'https://play.google.com/store/apps/details?id=com.betiq.app';
                if (navigator.share) {
                    navigator.share({ title: 'Bet iQ', text: 'Try the Bet iQ app!', url: shareUrl });
                } else {
                    prompt('Copy and share this URL:', shareUrl);
                }
                closeSideMenu();
            };
            var aboutBtn = document.getElementById('aboutBtn');
            if (aboutBtn) aboutBtn.onclick = function() {
                alert('Bet iQ powered by Big Data, backed by the community. Predict, cashout and enjoy!\n\nversion 2.1.');
                closeSideMenu();
            };
            var feedbackBtn = document.getElementById('feedbackBtn');
            if (feedbackBtn) feedbackBtn.onclick = function() {
                window.open('mailto:support@betiq.ai?subject=Feedback%20for%20Bet iQ%20app','_blank');
                closeSideMenu();
            };
            
            // Add event listeners to the input fields for filtering
            var filterInputs = document.querySelectorAll("#matchPercentage, #bttsPercentage, #ovunPercentage, #ahdpPercentage, #teamTGPercentage");
            filterInputs.forEach(function (input) {
                input.addEventListener("input", () => filterMatchesByDay(currentDay));
            });
  
            // Initialize live matches
            if (typeof initLiveMatches === 'function') {
                initLiveMatches();
                console.log('Live matches initialized');
            }
            
            // Call the function to populate the cards initially
            filterMatchesByDay(0);
            
            // Complete loading and show main app
            updateProgress(100);
            setTimeout(() => {
                hideLoadingScreen();
            }, 500);
        })
        .catch(error => {
            console.error('Failed to load data:', error);
            showErrorScreen('Failed to load match data. Please check your connection and try again.');
        });
  
  });