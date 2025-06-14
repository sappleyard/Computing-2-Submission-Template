/*jslint long */
import R from "../web-app/ramda.js";
import Filler from "../web-app/filler.js";
import assert from "assert";

/**
 * This test suite verifies the functionality of the Filler.empty_grid function.
 */
describe("", function () {

    let grid;

    before(function () {
        grid = Filler.empty_grid();
        console.log(grid.map(row => row.join(" ")).join("\n"));

        const allowed1 = Filler.allowed_colors(1, grid);
        const allowed2 = Filler.allowed_colors(2, grid);

        console.log("Player 1 allowed colors:", allowed1.map(i => `${Filler.COLORS[i]} [${i}]`).join(", "));
        console.log("Player 2 allowed colors:", allowed2.map(i => `${Filler.COLORS[i]} [${i}]`).join(", "));
    });

    it("The grid has the correct number of rows", function () {
        assert.strictEqual(grid.length, Filler.ROWS);
    });

    it("Each row has the correct number of columns", function () {
        grid.forEach(function (row) {
            assert.strictEqual(row.length, Filler.COLS);
        });
    });

    it("All cells contain only valid color indices", function () {
        const allCells = grid.flat();
        const validIndices = R.range(0, Filler.COLORS.length);
        const areValid = allCells.every(function (cell) {
            return Number.isInteger(cell) && validIndices.includes(cell);
        });
        assert.ok(areValid);
    });

    it("No two adjacent cells (horizontaly) have the same color index", function () {
        for (let row = 0; row < Filler.ROWS; row++) {
            for (let col = 0; col < Filler.COLS; col++) {
                const current = grid[row][col];
                if (row > 0) assert.notStrictEqual(current, grid[row - 1][col]);
            }
        }
    });

    it("No two adjacent cells (verticaly) have the same color index", function () {
        for (let row = 0; row < Filler.ROWS; row++) {
            for (let col = 0; col < Filler.COLS; col++) {
                const current = grid[row][col];
                if (col > 0) assert.notStrictEqual(current, grid[row][col - 1]);
            }
        }
    });

    it("Top-right and bottom-left corners have different color indices", function () {
        assert.notStrictEqual(grid[0][Filler.COLS - 1], grid[Filler.ROWS - 1][0]);
    });

    it("Check if the game is won", function () {
    const result = Filler.is_game_won(grid);
    console.log("Game won:", result);
    });




});
