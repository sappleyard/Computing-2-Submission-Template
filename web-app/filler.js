import R from "./ramda.js";

/**
 * filler.js is a module to model and run the game Filler.
 * @namespace Filler
 */

const Filler = Object.create(null);

/**
 * 6 possible colors in the game, represented by integers.
 * @memberof Filler
 * @typedef {0|1|2|3|4|5} ColorIndex
 */

Filler.color_red = 0;
Filler.color_green = 1;
Filler.color_yellow = 2;
Filler.color_blue = 3;
Filler.color_purple = 4;
Filler.color_orange = 5;

/**
 * Mapping from color index to display color name.
 * @memberof Filler
 * @type {string[]}
 */
Filler.COLORS = [
    "red",
    "green",
    "yellow",
    "blue",
    "purple",
    "orange"
];

/**
 * Default number of rows in the grid.
 * @memberof Filler
 * @type {number}
 */
Filler.ROWS = 7;

/**
 * Default number of columns in the grid.
 * @memberof Filler
 * @type {number}
 */
Filler.COLS = 8;

/**
 * Create a new grid of random color indices.
 * @memberof Filler
 * @function
 * @returns {number[][]} A 2D array representing a 7x8 grid with random color indices (0–5).
 */

Filler.empty_grid = function () {
    const getRandomDifferentColor = (exclude) => {
        const validColors = R.without(exclude, R.range(0, Filler.COLORS.length));
        return validColors[Math.floor(Math.random() * validColors.length)];
    };

    const grid = [];

    for (let row = 0; row < Filler.ROWS; row++) {
        const newRow = [];
        for (let col = 0; col < Filler.COLS; col++) {
            const exclude = [];
            if (col > 0) exclude.push(newRow[col - 1]);         // Left neighbor
            if (row > 0) exclude.push(grid[row - 1][col]);      // Top neighbor

            let color;
            do {
                color = getRandomDifferentColor(exclude);
            } while (
                // Prevent bottom-left == top-right during assignment
                (row === Filler.ROWS - 1 && col === 0 && color === grid[0]?.[Filler.COLS - 1]) ||
                (row === 0 && col === Filler.COLS - 1 && color === grid[Filler.ROWS - 1]?.[0])
            );

            newRow.push(color);
        }
        grid.push(newRow);
    }

    return grid;
};

function create_initial_game_state() {
    const grid = Filler.empty_grid();
    return {
        grid,
        currentPlayer: 1, // Player 1 starts
        turn: 0,
        history: [],
    };
}


/**
 * Determine allowed color changes for a player.
 * @memberof Filler
 * @function
 * @param {1|2} player 
 * @param {number[][]} grid
 * @returns {ColorIndex[]}
 */

Filler.allowed_colors = function (player, grid) {
    const ROWS = Filler.ROWS;
    const COLS = Filler.COLS;

    const start = player === 1 ? [ROWS - 1, 0] : [0, COLS - 1];
    const opponentStart = player === 1 ? [0, COLS - 1] : [ROWS - 1, 0];

    const playerColor = grid[start[0]][start[1]];
    const opponentColor = grid[opponentStart[0]][opponentStart[1]];

    const visited = Array.from({ length: ROWS }, () => Array(COLS).fill(false));
    const playerRegion = [];
    const queue = [start];

    
    while (queue.length > 0) {
        const [r, c] = queue.shift();
        if (r < 0 || r >= ROWS || c < 0 || c >= COLS) continue;
        if (visited[r][c] || grid[r][c] !== playerColor) continue;

        visited[r][c] = true;
        playerRegion.push([r, c]);

        queue.push([r + 1, c], [r - 1, c], [r, c + 1], [r, c - 1]);
    }

    const adjacentColors = new Set();

    
    for (const [r, c] of playerRegion) {
        const neighbors = [
            [r + 1, c],
            [r - 1, c],
            [r, c + 1],
            [r, c - 1],
        ];
        for (const [nr, nc] of neighbors) {
            if (
                nr >= 0 &&
                nr < ROWS &&
                nc >= 0 &&
                nc < COLS &&
                !visited[nr][nc]
            ) {
                const color = grid[nr][nc];
                if (color !== playerColor && color !== opponentColor) {
                    adjacentColors.add(color);
                }
            }
        }
    }

    return Array.from(adjacentColors);
};

function is_valid_move(player, color, grid) {
    const allowed = Filler.allowed_colors(player, grid);
    return allowed.includes(color);
}


// fucntion takes in the current grid and retunrs 2 matricies, 1 that is
//  the squares controlled by playwer 1 with all the other swaures and 0 and one 
// that is all the squarews contolled by player 2 with all the other swuares as 0
/**
 * Get control matrices for each player.
 * @memberof Filler
 * @function
 * @param {number[][]} grid - 
 * @returns {[number[][], number[][]]} 
 */
Filler.get_control_matrices = function (grid) {
    const ROWS = Filler.ROWS;
    const COLS = Filler.COLS;

    const bfs = (startRow, startCol, color) => {
        const visited = Array.from({ length: ROWS }, () => Array(COLS).fill(false));
        const result = Array.from({ length: ROWS }, () => Array(COLS).fill(-1));
        const queue = [[startRow, startCol]];

        while (queue.length > 0) {
            const [r, c] = queue.shift();
            if (r < 0 || r >= ROWS || c < 0 || c >= COLS) continue;
            if (visited[r][c] || grid[r][c] !== color) continue;

            visited[r][c] = true;
            result[r][c] = color;

            queue.push([r + 1, c], [r - 1, c], [r, c + 1], [r, c - 1]);
        }

        return result;
    };

    const p1Start = [ROWS - 1, 0];
    const p2Start = [0, COLS - 1];
    const p1Color = grid[p1Start[0]][p1Start[1]];
    const p2Color = grid[p2Start[0]][p2Start[1]];

    const p1Matrix = bfs(p1Start[0], p1Start[1], p1Color);
    const p2Matrix = bfs(p2Start[0], p2Start[1], p2Color);

    return [p1Matrix, p2Matrix];
};

// fuction takes in p1Maxtirx and P2Matrix and returns the total number of squares currently controlled by each player 
/**
 * Count the number of squares controlled by each player.
 * @memberof Filler
 * @function
 * @param {number[][]} p1Matrix - Control matrix for Player 1.
 * @param {number[][]} p2Matrix - Control matrix for Player 2.
 * @returns {[number, number]} A tuple of [p1Count, p2Count].
 */
Filler.count_controlled_squares = function (p1Matrix, p2Matrix) {
    const count = R.pipe(
        R.flatten,
        R.filter(R.complement(R.equals(-1))),
        R.length
    );
    return [count(p1Matrix), count(p2Matrix)];
};


// function takes in player number, player colour choice, 
// current squares controlled by that player and the grid 
// and returns a new grid with all the players current squares apended to match their new colour choice. 

/**
 * Update the grid by changing the player's controlled tiles to the new color.
 * @memberof Filler
 * @function
 * @param {1|2} player - The player number (1 or 2).
 * @param {ColorIndex} newColor - The new color chosen by the player.
 * @param {number[][]} grid - The current grid.
 * @returns {number[][]} A new grid with updated player-controlled regions.
 */
Filler.update_player_color = function (player, newColor, grid) {
    const ROWS = Filler.ROWS;
    const COLS = Filler.COLS;
    const start = player === 1 ? [ROWS - 1, 0] : [0, COLS - 1];
    const originalColor = grid[start[0]][start[1]];

    if (originalColor === newColor) return grid.map(row => [...row]); // no change

    const newGrid = grid.map(row => [...row]);
    const visited = Array.from({ length: ROWS }, () => Array(COLS).fill(false));
    const queue = [start];

    // BFS to change all connected same-colored tiles
    while (queue.length > 0) {
        const [r, c] = queue.shift();
        if (r < 0 || r >= ROWS || c < 0 || c >= COLS) continue;
        if (visited[r][c] || newGrid[r][c] !== originalColor) continue;

        visited[r][c] = true;
        newGrid[r][c] = newColor;

        queue.push([r + 1, c], [r - 1, c], [r, c + 1], [r, c - 1]);
    }

    return newGrid;
};

function apply_move(state, color) {
    const { currentPlayer, grid } = state;

    if (!is_valid_move(currentPlayer, color, grid)) {
        throw new Error(`Invalid move: Color ${color} not allowed for Player ${currentPlayer}`);
    }

    const updatedGrid = Filler.update_player_color(currentPlayer, color, grid);

    return {
        ...state,
        grid: updatedGrid,
        currentPlayer: currentPlayer === 1 ? 2 : 1,
        turn: state.turn + 1,
        history: [...state.history, { player: currentPlayer, color }],
    };
}

function get_score(grid) {
    const [p1Matrix, p2Matrix] = Filler.get_control_matrices(grid);
    return countControlledSquares(p1Matrix, p2Matrix);
}

function is_game_over(grid) {
    return Filler.is_game_won(grid);
}

Filler.is_game_won = function (grid) {
    const unique = new Set(grid.flat());
    return unique.size <= 2;
};

function get_winner(grid) {
    const [p1, p2] = get_score(grid);
    if (p1 > p2) return 1;
    if (p2 > p1) return 2;
    return 0; // tie
}

export default Object.freeze(Filler);
