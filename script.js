const gridSizeX = 8;
const gridSizeY = 8;
const cells = createCells();

let currentTurn = 'white';
let selectedChecker = null;
let continueTurn = false;

let checkers = createChekers();
let allowedCells;
let canBeKilled = [];

checkers.whites[0].classList.add('queen');

addEventListeners();

function cellClick() {

    if (this.classList.contains('cell-allowed') && selectedChecker) {

        // Перемещаем шашку в новую позицию
        const position = getCheckerPosition(selectedChecker);
        const cell = getCellByPosition(position);

        cell.removeChild(selectedChecker);
        this.appendChild(selectedChecker);

        let becameQueen = false;

        if (this.classList.contains('cell-queen')) {
            selectedChecker.classList.add('queen');
            becameQueen = true;
        }

        let wasKilled = false;

        for (let i = 0; i < canBeKilled.length; i++) {

            let doomed = canBeKilled[0];
            let parent = doomed.parentElement;

            parent.removeChild(doomed);

            let curArray = null;
            if (doomed.classList.contains('white')) {
                curArray = checkers.whites;
            } else {
                curArray = checkers.blacks;
            };

            for (let j = 0; j < curArray.length; j++) {

                if (doomed === curArray[j]) {
                    curArray.splice(j, 1);
                    wasKilled = true;
                };

            };

        }

        allowedCells = null;
        clearAllowedCells();

        markSelectedChecker(selectedChecker);

        // Проверим, может ли шашка продолжить движение для убийства
        allowedCells = getAllowedCells(selectedChecker, true);
        if (allowedCells.length && wasKilled || becameQueen) {

            continueTurn = true;
            markAllowedCells(allowedCells);
            markSelectedChecker(selectedChecker);

        } else {
            selectedChecker = null;
            continueTurn = false;
            setNextPlayer();
        }

    }
}

function checkerClick() {

    clearAllowedCells();
    markSelectedChecker(this);

    if (this.classList.contains('selected')) {

        allowedCells = getAllowedCells(this);

        markAllowedCells(allowedCells);

        selectedChecker = this;

    };

}

function allowedMouseOver(e) {

    const cell = e.target;
    const diagonal = findDiagonal(cell);

    let canAdd = false;

    for (let i = diagonal.length - 1; i >= 0; i--) {

        const arr = diagonal[i];
        const arrCell = arr[0];
        const arrChecker = arr[1];

        if (arrCell === cell) {
            canAdd = true;
        };

        if (canAdd) {
            if (arrChecker) {
                canBeKilled.push(arrChecker);
                arrChecker.classList.add('dead');
            };
        };
    };

    function findDiagonal(cell) {

        for (let i = 0; i < allowedCells.length; i++) {
            const diag = allowedCells[i];
            for (let j = 0; j < diag.length; j++) {
                const item = diag[j][0];
                if (item === cell) {
                    return diag;
                };
            };
        };

    };

}

function allowedMouseLeave(e) {

    canBeKilled = [];

    const dead = document.querySelectorAll('.dead');

    dead.forEach(item => {
        item.classList.remove('dead');
    });

}

function markAllowedCells(array) {

    const flatened = array.flat(5);

    flatened.forEach(item => {

        if (item && item.classList.contains('cell')) {
            item.classList.add('cell-allowed');
            item.addEventListener('mouseover', allowedMouseOver);
            item.addEventListener('mouseleave', allowedMouseLeave);
        };

    });

}

function getDiagonals(checker) {

    let diagonals = [];

    // Получаем текущую позицию шашки
    const [row, cell] = getCheckerPosition(checker);

    // Все комбинации смещений от row и cell
    const offsets = [[1, 1], [-1, -1], [-1, 1], [1, -1]];

    for (let i = 0; i < offsets.length; i++) {

        let diagonal = [];

        for (let j = 1; j < gridSizeY; j++) {

            let position = [row + j * offsets[i][0], cell + j * offsets[i][1]];
            let tile = getCellByPosition(position);

            if (tile) {
                diagonal.push(tile);
            }

        };

        diagonals.push(diagonal);

    };

    return diagonals;

}

function isFriendlyChecker(checker) {

    if (checker.classList.contains(currentTurn)) {
        return true;
    } else {
        return false;
    };

}

function getContainingChecker(cell) {

    if (cell.children.length) {
        for (let i = 0; i < cell.children.length; i++) {
            if (cell.children[i].classList.contains('checker')) {
                return cell.children[i];
            }
        }
    } else {
        return null;
    }

    return null;
}

function getAllowedCells(checker, onlyKill = false) {

    const diagonals = getDiagonals(checker);
    const isQueen = checker.classList.contains('queen');

    let allowed = [];

    for (let d = 0; d < diagonals.length; d++) {

        let currentDiagonal = diagonals[d];
        let prevChecker = null;
        let currentAllowed = [];

        for (let i = 0; i < currentDiagonal.length; i++) {

            const cell = currentDiagonal[i];
            const containingChecker = getContainingChecker(cell);

            // На первой встречной "своей" шашке прерываем обход
            if (containingChecker && isFriendlyChecker(containingChecker)) {
                break;
            };

            const isForward = isForwardDirection(checker, cell, isQueen);

            // Ходить на вражескую всегда запрещено
            if (containingChecker) {
                prevChecker = containingChecker;
                continue;
            };

            // Если это пустая ячейка, но предыдущая не пустая, то разрешено
            if (prevChecker && !containingChecker) {

                currentAllowed.push([cell, prevChecker]);
                prevChecker = null;

                // Для обычной шашки на этом разрешенные ходы завершаются
                if (!isQueen) {
                    break;
                };

                continue;

            };

            // Если впереди нет шашки, то всегда разрешено
            if (isForward && !containingChecker && !onlyKill) {
                prevChecker = null;
                currentAllowed.push([cell, null]);
                if (!isQueen) {
                    break;
                };
            };

        };

        if (currentAllowed.length) {
            allowed.push(currentAllowed);
        };

    };

    function isForwardDirection(checker, cell, isQueen) {

        if (isQueen) {
            return true;
        }

        const parentCell = checker.parentElement;

        if (currentTurn === 'white') {
            if (parentCell.id > cell.id) {
                return true;
            } else {
                return false;
            }
        } else {
            if (+parentCell.id < cell.id) {
                return true;
            } else {
                return false;
            }
        };

    };

    return allowed;
}

function setNextPlayer() {

    currentTurn = getOpposite();

}

function getOpposite() {
    let opposite = 'black';
    if (currentTurn === 'black') {
        opposite = 'white';
    }
    return opposite;
}

function getCheckerPosition(checker) {

    const grid = cells.grid;

    for (let i = 0; i < grid.length; i++) {

        for (let j = 0; j < grid[i].length; j++) {

            const cell = grid[i][j];

            if (cell.children[0] === checker) {
                return [i, j];
            }

        }

    }

}

function clearAllowedCells() {

    const cellsAllowed = document.querySelectorAll('.cell-allowed');

    cellsAllowed.forEach(cell => {
        cell.classList.remove('cell-allowed');
        cell.removeEventListener('mouseover', allowedMouseOver);
        cell.removeEventListener('mouseleave', allowedMouseLeave);
    });

    allowedCells = null;

}

function markSelectedChecker(item) {

    if (item.classList.contains(currentTurn)) {

        if (continueTurn && item != selectedChecker) {
            alert('Завершите ход!');
        } else {

            const selected = document.querySelectorAll('.selected');

            selected.forEach(checker => {
                if (item != checker) {
                    checker.classList.remove('selected');
                }
            });

            item.classList.toggle('selected');
        }

    } else {
        alert('Сейчас ходит другая сторона!');
    }

}

function getCellByPosition(position) {

    const row = position[0];
    const cell = position[1];

    if ((row >= 0 && row <= gridSizeX - 1) && (cell >= 0 && cell <= gridSizeY - 1)) {
        return cells.grid[position[0]][position[1]];
    } else {
        return null;
    }

}

function createChekers() {

    const blacksCount = 12;
    const whitesCount = 12;

    let checkers = {
        blacks: [],
        whites: []
    };

    for (let i = 0; i < blacksCount; i++) {
        let checker = createChecker('black', i);
        checkers.blacks.push(checker);
    }

    const whitesStart = cells.blacks.length - blacksCount;

    for (let i = 0; i < whitesCount; i++) {
        let checker = createChecker('white', whitesStart + i);
        checkers.whites.push(checker);
    }

    function createChecker(className, index) {

        const cell = cells.blacks[index];
        const checker = document.createElement('div');

        checker.classList.add('checker');
        checker.classList.add(className);
        checker.id = index;

        cell.appendChild(checker);

        return checker;

    }

    return checkers;

}

function addEventListeners() {

    const checkersArray = document.querySelectorAll('.checker');

    checkersArray.forEach(checker => {
        checker.addEventListener('click', checkerClick);
    })

    cells.blacks.forEach(cell => {
        cell.addEventListener('click', cellClick);
    })

}

function createCells() {

    const board = document.querySelector('.chess-board');
    const boardSize = gridSizeX * gridSizeY;

    let cellsArray = [];

    // Добавляем элементы ячеек в chess-board
    for (let i = 0; i < boardSize; i++) {

        const cell = document.createElement('div');

        cell.classList.add('cell');
        cell.id = i;

        board.appendChild(cell);

        cellsArray.push(cell);

    }

    function getCells(array) {

        let cells = {
            whites: [],
            blacks: [],
            grid: []
        }

        let rowNum = 0; // Номер текущей строки
        const cellsInRow = gridSizeX;

        let row = []; // Массив строки (с ячейками)

        // Обходим все ячейки
        for (let i = 0; i < array.length; i++) {

            const cell = array[i];

            // Определяем, какая это строка с ячейками
            if (i % cellsInRow === 0) {
                rowNum++;

                // Если массив строки не пустой, добавляем его в сетку
                if (row.length != 0) {
                    cells.grid.push(row);
                    row = [];
                }
            }

            // Добавляем ячейку в массив строки
            row.push(cell);

            // Заполняем массивы ячеек (сверху вниз)
            // Если строка нечетная, то первой будет белая ячейка
            if (rowNum % 2 != 0) {
                if (i % 2 === 0) {
                    cells.whites.push(cell);
                } else {
                    cells.blacks.push(cell);
                }
                // .. в противном случае - первой будет черная ячейка
            } else {
                if (i % 2 === 0) {
                    cells.blacks.push(cell);
                } else {
                    cells.whites.push(cell);
                }
            }

        }

        // добавляем последний массив строки в сетку
        cells.grid.push(row);

        return cells;
    }

    function paintCells(cells) {

        cells.whites.forEach(element => {
            element.classList.add('cell-white');
        });

        cells.blacks.forEach(element => {
            element.classList.add('cell-black');
        });

        // Отметим ячейки, в которых шашка может стать дамкой
        let indexRows = [0, cells.grid.length - 1];
        indexRows.forEach(i => {
            let row = cells.grid[i];
            row.forEach(cell => {
                if (cell.classList.contains('cell-black')) {
                    cell.classList.add('cell-queen');
                };
            });
        });

    }

    let cells = getCells(cellsArray);
    paintCells(cells);

    return cells;

}


