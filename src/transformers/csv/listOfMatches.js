import flipObject from '../../auxiliary/flipObject';
import stableSort from '../../auxiliary/stableSort';
import pluralizeResult from '../auxiliary/pluralizeResult';
import calculateTotal from '../auxiliary/calculateTotal';
import addPositions from '../auxiliary/calculatePositions';


function getResult(score, opponentScore) {
    if (score > opponentScore) {
        return 'win';
    } else if (score < opponentScore) {
        return 'loss'
    } else if (score === opponentScore) {
        return 'draw'
    }
}

function transformMatchesList(jsonList, params) {
    const resultChange = flipObject(params['resultMapping']);

    const [headers, ...matches] = jsonList;
    const roundsNames = [...new Set(matches.map(match => match[0]))];
    const itemsNames = [...new Set([...matches.map(match => match[1]), ...matches.map(match => match[3])])];

    const itemsStats = new Map();
    const initialStats = { change: null, total: 0, rounds: 0, wins: 0, losses: 0, draws: 0 };
    itemsNames.forEach(name => itemsStats.set(name, Object.assign({}, initialStats)));

    const results = roundsNames.map(round => {
        const roundResults = new Map();
        matches.filter(match => match[0] === round)
            .forEach(match => {
                const homeItem = {
                    name: match[1],
                    score: Number.parseInt(match[2], 10)
                };
                const awayItem = {
                    name: match[3],
                    score: Number.parseInt(match[4], 10)
                };

                homeItem.result = getResult(homeItem.score, awayItem.score);
                awayItem.result = getResult(awayItem.score, homeItem.score);

                [homeItem, awayItem].forEach(item => {
                    const stats = itemsStats.get(item.name);
                    stats.rounds++;
                    stats[pluralizeResult(item.result)]++;
                    stats.change = resultChange[item.result];
                    stats.total = calculateTotal(params['totalValue'], stats);

                    roundResults.set(item.name, Object.assign({}, stats));
                });
            });
        itemsNames.filter(name => !roundResults.has(name))
            .forEach(name => {
                const stats = itemsStats.get(name);
                stats.change = null;
                stats.total = calculateTotal(params['totalValue'], stats);
                roundResults.set(name, Object.assign({}, stats));
            });

        return roundResults;
    });

    if (params['startRoundName']) {
        const startRoundResults = new Map(itemsNames.map(item => [item, Object.assign({}, initialStats)]));
        results.unshift(startRoundResults);
        roundsNames.unshift(params['startRoundName']);
    }

    return {
        status: 'success',
        roundsNames: roundsNames,
        extraColumnsNames: [],
        results: results
    };
}

export default transformMatchesList;