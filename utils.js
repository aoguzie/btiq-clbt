// Define a global variable to hold the object iterator function
let globalObjectIterator;

// Define the generator function to iterate over objects
function* objectIterator(obj) {
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      yield [key, obj[key]];
    }
  }
}

// Function to initialize the global object iterator
function initializeGlobalObjectIterator(obj) {
  globalObjectIterator = objectIterator(obj);
}

// Function to get the next key-value pair from the iterator
function getNextObjectEntry() {
  return globalObjectIterator.next().value;
}
// check for empty array objects
function cleanArr(arr) {
  // Check if the input is an array
  if (!Array.isArray(arr)) {
    console.error('Input is not an array.');
    return [];
  }

  return arr.filter(item => {
    if (Array.isArray(item)) {
      const filteredNestedArray = cleanArr(item);
      return filteredNestedArray.length > 0;
    }
    return typeof item !== 'undefined';
  }).filter(item => Array.isArray(item) ? item.length > 0 : true);
}
// calculate totals
function tot(...numbers) {
  if (numbers.length === 0) {
    return 0;
  }

  let total = 0;
  for (let i = 0; i < numbers.length; i++) {
    total += numbers[i];
  }

  return total;
}

// calculate percentages
function perc(x, y) {
  if (y === 0) {
    throw new Error("Cannot divide by zero.");
  }

  return (x / y) * 100;
}

// recursively flatten an array
function flattenObject(obj, parentKey = '') {
  let result = {};

  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      const currentKey = parentKey ? `${parentKey}.${key}` : key;

      if (typeof obj[key] === 'object' && obj[key] !== null) {
        const nestedObject = flattenObject(obj[key], currentKey);
        result = { ...result, ...nestedObject };
      } else {
        result[currentKey] = obj[key];
      }
    }
  }

  return result;
}

// predictions
function predictMostLikelyOutcome(data) {
  const outcomes = data.map(item => ({
    outcome: item.outcome,
    params: item.params,
    probability: item.probability,
  }));

  outcomes.sort((a, b) => b.probability - a.probability);

  return outcomes.length > 0 ? outcomes[0] : null;
}

function predictOVUNOutcome(ovunData) {
  // Add the code to predict the most likely outcome for OVUN using relativity of outcomes and probability patterns
  let prediction;
  const overOutcome = ovunData.find(outcome => outcome.outcome === 'over');
  const underOutcome = ovunData.find(outcome => outcome.outcome === 'under');
  if (overOutcome && underOutcome) {
      if (overOutcome.probability > underOutcome.probability) {
          prediction = 'over';
      } else if (overOutcome.probability < underOutcome.probability) {
          prediction = 'under';
      } else {
          prediction = 'uncertain';
      }
  } else {
      prediction = 'unknown';
  }
  return prediction;
}

 // Function to predict AHDP outcome based on the handicap values
 function predictAHDPOutcome(ahdpData) {
  if (ahdpData && ahdpData.submarkets && ahdpData.submarkets['period=ft'] && ahdpData.submarkets['period=ft'].selections && ahdpData.submarkets['period=ft'].selections.length > 0) {
    const positiveOutcome = ahdpData.submarkets['period=ft'].selections.find(outcome => outcome.params.includes('handicap='));
    if (positiveOutcome) {
      const positiveHandicap = parseFloat(positiveOutcome.params.split('=')[1]);
      if (positiveHandicap > 0) {
        return 'home';
      }
    }
    const negativeOutcome = ahdpData.submarkets['period=ft'].selections.find(outcome => outcome.params.includes('handicap=-'));
    if (negativeOutcome) {
      const negativeHandicap = parseFloat(negativeOutcome.params.split('=')[1]);
      if (negativeHandicap < 0) {
        return 'away';
      }
    }
  }
  return 'unknown';
}

// Function to calculate probabilities for AHDP predictions
function calculateAHDPOutcomeProbability(ahdpData, prediction) {
  if (ahdpData && ahdpData.submarkets && ahdpData.submarkets['period=ft'] && ahdpData.submarkets['period=ft'].selections && ahdpData.submarkets['period=ft'].selections.length > 0) {
    const outcome = ahdpData.submarkets['period=ft'].selections.find(outcome => outcome.outcome === prediction);
    if (outcome) {
      return outcome.probability;
    }
  }
  return 0;
}

// Function to calculate probabilities for OVUN predictions
function calculateOVUNProbability(ovunData, prediction) {
  if (ovunData && Array.isArray(ovunData) && ovunData.length > 0) {
    const outcome = ovunData.find(outcome => outcome.outcome === prediction);
    if (outcome) {
      return outcome.probability;
    }
  }
  return 0;
}

// Function to predict the winner and number of goals expected
function predictMatchOutcome(scoresData) {
  // Check if the scoresData array is empty or undefined
  if (!scoresData || scoresData.length === 0) {
    return {
      winner: "Unknown",
      homeGoals: 0,
      awayGoals: 0,
    };
  }

  // Find the outcome with the highest probability
  const maxProbOutcome = scoresData.reduce((max, outcome) => (outcome.probability > max.probability ? outcome : max));

  // Check if the outcome is undefined or in the wrong format
  if (!maxProbOutcome || typeof maxProbOutcome.outcome !== "string" || !maxProbOutcome.outcome.includes("=")) {
    return {
      winner: "Unknown",
      homeGoals: 0,
      awayGoals: 0,
    };
  }

  // Split the outcome string to get the scores
  const [homeScore, awayScore] = maxProbOutcome.outcome.split("=")[1].split(":");

  // Convert scores to integers
  const homeGoals = parseInt(homeScore);
  const awayGoals = parseInt(awayScore);

  // Determine the winner based on the scores
  let winner;
  if (homeGoals > awayGoals) {
    winner = "Home";
  } else if (homeGoals < awayGoals) {
    winner = "Away";
  } else {
    winner = "Draw";
  }

  return {
    winner: winner,
    homeGoals: homeGoals,
    awayGoals: awayGoals,
  };
}


function predictMatchProb(scoresData) {
  // Filter out 'other' outcomes from the scores data
  const filteredScoresData = scoresData.filter(item => item.outcome !== "other");

  // Calculate probabilities for Home Win, Draw, and Away Win
  let homeWinProbability = 0;
  let drawProbability = 0;
  let awayWinProbability = 0;
  
  filteredScoresData.forEach(item => {
    const scores = item.outcome.split("=")[1].split(":");
    const homeScore = parseInt(scores[0]);
    const awayScore = parseInt(scores[1]);
    const probability = item.probability || 0;

    if (homeScore > awayScore) {
      homeWinProbability += probability;
    } else if (homeScore < awayScore) {
      awayWinProbability += probability;
    } else {
      drawProbability += probability;
    }
  });

  // return { homeWin: (100*homeWinProbability).toFixed(2), draw: (100*drawProbability).toFixed(2), awayWin: (100*awayWinProbability).toFixed(2) };
  
    var content = '<div class="row"><span class="col-sm">'+'Home: '+ (100*homeWinProbability).toFixed(2)+'%'+'</span><span class="col-sm">'+'Draw: '+ (100*drawProbability).toFixed(2)+'%'+'</span><span class="col-sm">'+'Away: '+'%'+(100*awayWinProbability).toFixed(2)+'</span></div>';
    return content;


}




function predictBothTeamsToScore(scoresData) {
  // Filter out 'other' outcomes from the scores data
  const filteredScoresData = scoresData.filter(item => item.outcome !== "other");

  // Filter scores data to get the outcomes where both teams scored
  const bothTeamsScoreOutcomes = filteredScoresData.filter(item => {
    const scores = item.outcome.split("=")[1];
    return scores && scores.split(":")[0] !== "0" && scores.split(":")[1] !== "0";
  });

  // Filter scores data to get the outcomes where only home team scored
  const homeTeamScoresOutcomes = filteredScoresData.filter(item => {
    const scores = item.outcome.split("=")[1];
    return scores && scores.split(":")[0] !== "0" && scores.split(":")[1] == "0";
  });

  // Filter scores data to get the outcomes where only away team scored
  const awayTeamScoresOutcomes = filteredScoresData.filter(item => {
    const scores = item.outcome.split("=")[1];
    return scores && scores.split(":")[0] === "0" && scores.split(":")[1] !== "0";
  });

  // Find the probability for '0:0'
  const zeroZeroOutcome = filteredScoresData.find(item => item.outcome === "score=0:0");
  const zeroZeroProbability = zeroZeroOutcome ? zeroZeroOutcome.probability : 0;

  // Calculate the total probability for both teams scoring
  const bttsProbability = calTot(bothTeamsScoreOutcomes);
  // Calculate the mean probability for both teams scoring
  const bothTeamsScoreProbability = calculateMeanProbability(bothTeamsScoreOutcomes);

  // Calculate the mean probability for only home team scoring
  const homeTeamScoresProbability = calculateMeanProbability(homeTeamScoresOutcomes);

  // Calculate the mean probability for only away team scoring
  const awayTeamScoresProbability = calculateMeanProbability(awayTeamScoresOutcomes);

  // Calculate the overall mean probability for both teams scoring
  const totalProbabilities = [bothTeamsScoreProbability, homeTeamScoresProbability, awayTeamScoresProbability, zeroZeroProbability].filter(prob => !isNaN(prob));
  const meanBothTeamsToScoreProbability = totalProbabilities.length > 0 ? totalProbabilities.reduce((sum, prob) => sum + prob, 0) / totalProbabilities.length : 0;

  return (100*bttsProbability).toFixed(2);
}

// Function to calculate the mean probability from an array of outcomes
function calculateMeanProbability(outcomes) {
  if (outcomes.length === 0) {
    return 0;
  }

  const totalProbability = outcomes.reduce((sum, item) => sum + (item.probability || 0), 0);
  return totalProbability / outcomes.length;
}
// Function to calculate the total probability from an array of outcomes
function calTot(outcomes) {
    const totalProbability = outcomes.reduce((sum, item) => sum + (item.probability || 0), 0);
  return totalProbability;
}

// over/under from cs
function predictTotalGoals(scoresData) {
  // Filter out 'other' outcomes from the scores data
  const filteredScoresData = scoresData.filter(item => item.outcome !== "other");
  const thresholds = [1.5, 2.5, 3.5, 4.5];
  let content = '';
  thresholds.forEach(thresh => {
    // Sum probability for Over and Under cases
    let pOver = 0, pUnder = 0;
    filteredScoresData.forEach(item => {
      const scores = item.outcome.split("=")[1].split(":");
      const totalGoals = parseInt(scores[0]) + parseInt(scores[1]);
      if (totalGoals > thresh) {
        pOver += item.probability || 0;
      } else {
        pUnder += item.probability || 0;
      }
    });
    // Calculate market-style odds
    const oddsOver = pOver > 0 ? 1/pOver : null;
    const oddsUnder = pUnder > 0 ? 1/pUnder : null;
    // Overround stripping
    const overround = pOver + pUnder;
    const overProbFair = overround > 0 ? pOver / overround : 0;
    const underProbFair = overround > 0 ? pUnder / overround : 0;
    const oddsOverFair = overProbFair > 0 ? 1 / overProbFair : null;
    const oddsUnderFair = underProbFair > 0 ? 1 / underProbFair : null;
    content += `<span class='ou'>Over ${thresh}: ${oddsOverFair ? oddsOverFair.toFixed(2) : 'N/A'} <span class='probability'>${(100*overProbFair).toFixed(2)}%</span></span>&nbsp;`;
    content += `<span class='ou'>Under ${thresh}: ${oddsUnderFair ? oddsUnderFair.toFixed(2) : 'N/A'} <span class='probability'>${(100*underProbFair).toFixed(2)}%</span></span>&nbsp;`;
  });
  return content;
}


// Function to reverse the Poisson distribution and calculate expected goals for a given probability
function reversePoisson(probability) {
  const threshold = 0.001; // Threshold to determine the maximum number of goals
  let sum = 0;
  let goals = 0;

  while (probability > 0) {
    sum += probability;
    probability *= goals / (goals + 1);
    goals++;

    // Break the loop if the probability becomes negligible
    if (probability < threshold) {
      break;
    }
  }

  return sum;
}

// Function to calculate the expected goals for home and away teams
function calculateExpectedGoals(scoresData) {
  let expectedGoals = {
    home: 0,
    away: 0,
  };

  if (Array.isArray(scoresData) && scoresData.length > 0) {
    scoresData.forEach((item) => {
      if (item.outcome && typeof item.outcome === 'string') {
        const outcome = item.outcome.split("=");
        if (outcome.length === 2 && outcome[1].includes(":")) {
          const goalSplit = outcome[1].split(":");
          const homeGoals = parseInt(goalSplit[0]);
          const awayGoals = parseInt(goalSplit[1]);
          const probability = item.probability || 0;

          expectedGoals.home += reversePoisson(probability) * homeGoals;
          expectedGoals.away += reversePoisson(probability) * awayGoals;
        }
      }
    });
  }

  return expectedGoals;
}

// deep filter
function deepFilter(arr, searchList) {
  return _.filter(arr, (item) => {
    if (_.isArray(item)) {
      // Recurse into nested arrays
      return deepFilter(item, searchList).length > 0;
    } else if (_.isString(item)) {
      // Filter based on the searchList
      return !searchList.some((searchText) => item.includes(searchText));
    }
    // Include non-string elements in the result
    return true;
  });
}

// Calculate true odds/probabilities for Asian Handicap market only
function calculateAHDPMarketTrueOdds(selections) {
  // Group by handicap value from params
  const grouped = {};
  selections.forEach(sel => {
    let hcap = null;
    if (typeof sel.params === 'string' && sel.params.startsWith('handicap=')) {
      hcap = sel.params.replace('handicap=', '');
    }
    if (!grouped[hcap]) grouped[hcap] = [];
    grouped[hcap].push(sel);
  });
  let result = [];
  Object.entries(grouped).forEach(([hcap, group]) => {
    // Use probabilities if present, else fallback to price
    const hasProb = group.every(s => typeof s.probability === 'number' && !isNaN(s.probability));
    let rawProbs;
    if (hasProb) {
      rawProbs = group.map(s => s.probability);
    } else {
      rawProbs = group.map(s => s.price > 0 ? 1/s.price : 0);
    }
    const overround = rawProbs.reduce((sum, prob) => sum + prob, 0);
    const trueProbs = rawProbs.map(prob => overround > 0 ? prob / overround : 0);
    const trueOdds = trueProbs.map(prob => (prob > 0 ? 1 / prob : null));
    group.forEach((sel, i) => {
      result.push({
        ...sel,
        handicap: hcap,
        impliedProbability: rawProbs[i],
        trueProbability: trueProbs[i],
        trueOdds: trueOdds[i]
      });
    });
  });
  return result;
}

// analyze odds
function analyzeBettingData(data) {
  // Helper function to calculate true odds for a set of outcomes
  const calculateMarketTrueOdds = (selections) => {
    // Step 1: Calculate implied probabilities from odds
    const impliedProbs = selections.map(s => (s.price > 0 ? 1 / s.price : 0));
    // Step 2: Calculate the market overround
    const overround = impliedProbs.reduce((sum, prob) => sum + prob, 0);
    // Step 3: Proportional normalization to get fair probabilities
    const trueProbs = impliedProbs.map(prob => overround > 0 ? prob / overround : 0);
    // Step 4: Calculate true odds from normalized probabilities
    const trueOdds = trueProbs.map(prob => (prob > 0 ? 1 / prob : null));

    return {
      selections: selections.map((sel, i) => ({
        ...sel,
        impliedProbability: impliedProbs[i],
        trueProbability: trueProbs[i],
        trueOdds: trueOdds[i]
      })),
      overround
    };
  };

  // Process main 1X2 market
  const market1X2 = {
    name: "1X2",
    selections: [
      { outcome: "Home", price: data.odd1, probability: data.prob1 },
      { outcome: "Draw", price: data.oddx, probability: data.probx },
      { outcome: "Away", price: data.odd2, probability: data.prob2 }
    ],
    ...calculateMarketTrueOdds([
      { outcome: "Home", price: data.odd1 },
      { outcome: "Draw", price: data.oddx },
      { outcome: "Away", price: data.odd2 }
    ])
  };

  // Process Asian Handicap market
  const marketAH = data?.AHDP?.submarkets?.["period=ft"]?.selections ? {
    name: "Asian Handicap",
    ...(data?.AHDP?.submarkets?.["period=ft"]?.selections ? calculateMarketTrueOdds(data.AHDP.submarkets["period=ft"].selections) : {})  } : null;

  // Process Over/Under markets using correct score probabilities from marketCS
  let marketOU = null;
  if (Array.isArray(data?.cs)) {
    const thresholds = [1.5, 2.5, 3.5, 4.5];
    let ouSelections = [];
    thresholds.forEach(thresh => {
      let over = 0, under = 0;
      data.cs.forEach(item => {
        // item.outcome looks like 'score=2:1' etc.
        if (!item || !item.outcome || !item.outcome.includes('=')) return;
        const parts = item.outcome.split('=')[1].split(':');
        const home = parseInt(parts[0]), away = parseInt(parts[1]);
        const total = home + away;
        if (!isNaN(total) && typeof item.probability === 'number') {
          if (total > thresh) { over += item.probability; }
          else { under += item.probability; }
        }
      });
      const overround = over + under;
      const pOverFair = overround > 0 ? over / overround : 0;
      const pUnderFair = overround > 0 ? under / overround : 0;
      const priceOver = 1/pOverFair;
      const priceUnder = 1/pUnderFair;  
      ouSelections.push({ outcome: 'over', threshold: thresh,price: priceOver, probability: pOverFair });
      ouSelections.push({ outcome: 'under', threshold: thresh, price: priceUnder, probability: pUnderFair });
    });
    marketOU = { name: "Over/Under", selections: ouSelections };
  } else if (data?.ovun) {
    marketOU = {
      name: "Over/Under",
      ...calculateMarketTrueOdds(data.ovun)
    };
  }

  // Process Both Teams to Score market
  const marketBTS = data?.bts?.submarkets?.["period=ft"]?.selections ? {
    name: "Both Teams to Score", 
    ...(data?.bts?.submarkets?.["period=ft"]?.selections ? calculateMarketTrueOdds(data.bts.submarkets["period=ft"].selections) : {})  } : null;

  // Process Correct Score market
  const marketCS = data?.cs ? {
    name: "Correct Score",
    ...calculateMarketTrueOdds(data.cs)
  } : null;

  // Process Team Total Goals markets
  const marketTTG = data?.ttg?.submarkets?.["period=ft&team=home"]?.selections && 
                    data?.ttg?.submarkets?.["period=ft&team=away"]?.selections ? {
    name: "Team Total Goals",
    submarkets: {
      home: data?.ttg?.submarkets?.["period=ft&team=home"]?.selections ? calculateMarketTrueOdds(data.ttg.submarkets["period=ft&team=home"].selections) : null,
      away: data?.ttg?.submarkets?.["period=ft&team=away"]?.selections ? calculateMarketTrueOdds(data.ttg.submarkets["period=ft&team=away"].selections) : null    }
  } : null;
  return {
    matchInfo: {
      teams: data?.teams,
      start: data?.start,
      league: data?.country && data?.league ? `${data.country} - ${data.league}` : ''
    },
    markets: {
      market1X2,
      marketAH, 
      marketOU,
      marketBTS,
      marketCS,
      marketTTG
    }
  };
}

// Example usage:
// const bettingAnalysis = analyzeBettingData(yourDataStructure);
// console.log(bettingAnalysis);