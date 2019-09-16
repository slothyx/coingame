console.log("Running Coingame.");

const cache = {};

const simulateMoves = function(game) {
   
    const winMoves = [];
    const looseMoves = [];

    for (let i = 0; i < game.length; i++) {

        for (let coinsToRemove = 1; coinsToRemove <= game[i]; coinsToRemove++) {

            game[i] = game[i] - coinsToRemove;

            const winner = determineWinner(game);

            game[i] = game[i] + coinsToRemove;

            const newChild = { beginCount: game[i], countToRemove: coinsToRemove };
            if (winner === 2) {
                if (!containsChild(winMoves, newChild)) {
                    winMoves.push(newChild);
                }
            } else {
                if (!containsChild(looseMoves, newChild)) {
                    looseMoves.push(newChild);
                }
            }
        }
    }

    return {
        winMoves,
        looseMoves,
    }

}

const determineWinner = function (game) {

    const key = generateKey(game);

    if (key in cache) { return cache[key].winner };

    if (game.length === 0 || game.every((coinCount) => coinCount === 0)) {
        addToCache(key, { winner: 2, children: [] });
        return 2;
    }

    const { winMoves, looseMoves } = simulateMoves(game);

    if (winMoves.length > 0) {
        addToCache(key, { winner: 1, children: winMoves });
        return 1;
    } else {
        addToCache(key, { winner: 2, children: looseMoves });
        return 2;
    }
}

const containsChild = function (moves, newChild) {
    for (let child of moves) {
        if (child.beginCount === newChild.beginCount && child.countToRemove === newChild.countToRemove) {
            return true;
        }
    }
    return false;
}

const addToCache = function (key, winner) {
    cache[key] = winner;
}

const generateKey = function (game) {
    const coinCounts = game.filter((coinCount) => coinCount !== 0);

    coinCounts.sort((a, b) => a - b);

    return coinCounts.join();
}

const getTree = function (game) {
    const key = generateKey(game);
    const winner = determineWinner(game);
    const node = { name: key, children: [], winner, game: [...game] };

    for (var child of cache[key].children) {
        for (var i = 0; i < game.length; i++) {
            if (game[i] === child.beginCount) {
                game[i] = game[i] - child.countToRemove;
                const childKey = generateKey(game);
                node.children.push({ name: childKey, children: [], winner: determineWinner(game), game: [...game] });
                game[i] = game[i] + child.countToRemove;
                break;
            }
        }
    }

    return node;
}

const printCacheSize = function () {
    let cacheSize = 0;
    for (const {} in cache) {
        ++cacheSize;
    }
    console.log(`Cache size: ${cacheSize}`);
}

const runTests = function() {
    console.log("Running tests.");

    console.assert(determineWinner([]) === 2, "Player 2 wins!");
    console.assert(determineWinner([1]) === 1, "Player 1 wins! [1]");
    console.assert(determineWinner([1, 2]) === 1, "Player 1 wins! [1, 2]");
    console.assert(determineWinner([1, 2, 3]) === 2, "Player 2 wins! [1, 2, 3]");
    console.assert(determineWinner([1, 2, 3, 4]) === 1, "Player 1 wins! [1, 2, 3, 4]");
    console.assert(determineWinner([1, 2, 3, 4, 5]) === 1, "Player 1 wins! [1, 2, 3, 4, 5]");

    console.log(`[1, 2, 3, 4, 5, 6] --> Winner: Player ${determineWinner([1, 2, 3, 4, 5, 6])}`);
    console.log(`[1, 2, 3, 4, 5, 6, 7] --> Winner: Player ${determineWinner([1, 2, 3, 4, 5, 6, 7])}`);
    console.log(`[1, 2, 3, 4, 5, 6, 7, 8] --> Winner: Player ${determineWinner([1, 2, 3, 4, 5, 6, 7, 8])}`);

    console.log("Tests done.");
}();
