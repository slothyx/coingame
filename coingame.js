console.log("Running Coingame.");

const cache = {};
var mode = undefined;
var getTreeDelegate = undefined;

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

const getDownTree = function (game) {
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

const searchUpToSteps = 5;
const getUpTree = function (game) {
	game = game.filter(e => e !== 0);
	
    const key = generateKey(game);
	const parentWinner = determineWinner(game);
    const node = { name: key, children: [], winner: parentWinner, game: [...game] };

	game.push(0);
	for (let i in game) {
		const origSteps = game[i];
		for (let step = 0; step < searchUpToSteps; step++) {
			game[i]++;
			if (determineWinner(game) !== parentWinner){
				node.children.push({ name: generateKey(game), children: [], winner: determineWinner(game), game: [...game] });
			}
		}
		game[i] = origSteps;
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

const runTests = function () {
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
}
();

const showTree = function (game) {

    var treeData = [getTreeDelegate(game)];
    printCacheSize();

    // ************** Generate the tree diagram	 *****************
    // We used a slightly modified version of http://bl.ocks.org/d3noob/8375092
    var margin = {
        top: 20,
        right: 120,
        bottom: 20,
        left: 120
    },
    width = 5000 - margin.right - margin.left,
    height = 1000 - margin.top - margin.bottom;

    var i = 0,
    duration = 750,
    root;

    var tree = d3.layout.tree()
        .size([height, width]);

    var diagonal = d3.svg.diagonal()
        .projection(function (d) {
            return [d.y, d.x];
        });

    var svgs = document.getElementsByTagName("svg");
    for (var index = svgs.length - 1; index >= 0; index--) {
        svgs[index].parentNode.removeChild(svgs[index]);
    }

    var svg = d3.select("body").append("svg")
        .attr("width", width + margin.right + margin.left)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    root = treeData[0];
    root.x0 = height / 2;
    root.y0 = 0;

    update(root);

    d3.select(self.frameElement).style("height", "500px");

    function update(source) {

        // Compute the new tree layout.
        var nodes = tree.nodes(root).reverse(),
        links = tree.links(nodes);

        // Normalize for fixed-depth.
        nodes.forEach(function (d) {
            d.y = d.depth * 180;
        });

        // Update the nodes…
        var node = svg.selectAll("g.node")
            .data(nodes, function (d) {
                return d.id || (d.id = ++i);
            });

        // Enter any new nodes at the parent's previous position.
        var nodeEnter = node.enter().append("g")
            .attr("class", "node")
            .attr("transform", function (d) {
                return "translate(" + source.y0 + "," + source.x0 + ")";
            })
            .on("click", click);

        nodeEnter.append("circle")
        .attr("r", 1e-6)
        .style("fill", function (d) {
            return d.winner === 1 ? "green" : "red";
        })

        nodeEnter.append("text")
        .attr("x", function (d) {
            return d.children || d._children ? -13 : 13;
        })
        .attr("dy", ".35em")
        .attr("text-anchor", function (d) {
            return d.children || d._children ? "end" : "start";
        })
        .text(function (d) {
            return d.name + " -->" + d.winner;
        })
        .style("fill-opacity", 1e-6);

        // Transition nodes to their new position.
        var nodeUpdate = node.transition()
            .duration(duration)
            .attr("transform", function (d) {
                return "translate(" + d.y + "," + d.x + ")";
            });

        nodeUpdate.select("circle")
        .attr("r", 10)
        .style("fill", function (d) {
            return d.winner === 1 ? "green" : "red";
        });

        nodeUpdate.select("text")
        .style("fill-opacity", 1);

        // Transition exiting nodes to the parent's new position.
        var nodeExit = node.exit().transition()
            .duration(duration)
            .attr("transform", function (d) {
                return "translate(" + source.y + "," + source.x + ")";
            })
            .remove();

        nodeExit.select("circle")
        .attr("r", 1e-6);

        nodeExit.select("text")
        .style("fill-opacity", 1e-6);

        // Update the links…
        var link = svg.selectAll("path.link")
            .data(links, function (d) {
                return d.target.id;
            });

        // Enter any new links at the parent's previous position.
        link.enter().insert("path", "g")
        .attr("class", "link")
        .attr("d", function (d) {
            var o = {
                x: source.x0,
                y: source.y0
            };
            return diagonal({
                source: o,
                target: o
            });
        });

        // Transition links to their new position.
        link.transition()
        .duration(duration)
        .attr("d", diagonal);

        // Transition exiting nodes to the parent's new position.
        link.exit().transition()
        .duration(duration)
        .attr("d", function (d) {
            var o = {
                x: source.x,
                y: source.y
            };
            return diagonal({
                source: o,
                target: o
            });
        })
        .remove();

        // Stash the old positions for transition.
        nodes.forEach(function (d) {
            d.x0 = d.x;
            d.y0 = d.y;
        });
    }

    // Toggle children on click.
    function click(d) {
        if (d.children) {
            d.children = null;
        } else {
            d.children = getTreeDelegate(d.game).children;
        }
        update(d);
    }
}

const showInitialTree = (function () {
	mode = "down";
	getTreeDelegate = getDownTree;
	showTree([1, 2, 3, 4, 5, 6]);
})();

const initInputs = (function () {
    const input = document.getElementById("gameInput");
    const loadButton = document.getElementById("loadTree");
    const output = document.getElementById("loadTreeOutput");
    const toggleUpDownButton = document.getElementById("toggleUpDown");

    loadButton.onclick = function () {
        try {
            showTree(parseGameInput(input.value));
        } catch (err) {
            console.log(err)
            output.innerText = err;
        }
    }
    toggleUpDownButton.onclick = function () {
        if(mode === "down"){
			mode = "up";
			getTreeDelegate = getUpTree;
			showTree([]);
		} else {
			mode = "down";
			getTreeDelegate = getDownTree;
			showTree([1, 2, 3, 4, 5, 6]);
		}
    }
})();

const parseGameInput = function (gameInput) {
    return gameInput
		.split(",")
		.map(e => e.trim())
		.map(function (e) {
        if (isNaN(e)) {
            throw "not a number: " + e;
        }
        return Number(e);
    });
}
