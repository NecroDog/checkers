const gridSizeX = 8;
const gridSizeY = 8;
const cells = createCells();

let currentTurn = 'black';
let selectedChecker = null;
let continueTurn = false;

let checkers = createChekers();
let allowedCells;

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

        // Убиваем вражескую шашку, если таковая имеется
        for (let i = 0; i < allowedCells.length; i++) {

            let array = allowedCells[i];

            let curCell = array[0];
            let dead = array[1];

            if (curCell === this && dead) {

                const parent = dead.parentElement;
                parent.removeChild(dead);

                let curArray = null;
                if (dead.classList.contains('white')) {
                    curArray = checkers.whites;
                } else {
                    curArray = checkers.blacks;
                };

                for (let i = 0; i < curArray.length; i++) {

                    if (dead === curArray[i]) {
                        curArray.splice(i, 1);
                        wasKilled = true;
                    };

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

function markAllowedCells(array) {

    array.forEach(pairCellDead => {

        const cell = pairCellDead[0];
        const dead = pairCellDead[1];

        cell.classList.add('cell-allowed');

        // Отметим возможность убийства
        if (dead) {
            dead.classList.add('dead');
        };

    });

}

function getAllowedCells(checker, onlyKill = false) {

    let allowed = [];

    const opposite = getOpposite();

    // Получаем текущую позицию шашки
    const position = getCheckerPosition(checker);

    const row = position[0];
    const cell = position[1];

    // Для обычной шашки доступен 1 шаг, а для дамки - на всю диагональ доски
    let countSteps = 1;
    const isQueen = checker.classList.contains('queen');
    if (isQueen) {
        countSteps = gridSizeY - 1;
    };

    // Получаем возможные комбинации направлений с учетом сдвига и количества доступных шагов
    let cellsAround = [];

    for (let i = 1; i < countSteps + 1; i++) {
        cellsAround.push([row - i, cell - i, -i, -i]);
        cellsAround.push([row - i, cell + i, -i, +i]);
        cellsAround.push([row + i, cell - i, +i, -i]);
        cellsAround.push([row + i, cell + i, +i, +i]);
    }

    // В зависимости от стороны (белые или черные), доступные ячейки будут разными
    const forwardDirection = getForwardDirection(cellsAround);
    const backwardDirection = getBackwardDirection(cellsAround);

    // Отметим доступные для перемещения ячейки в прямом направлении
    forwardDirection.forEach(position => {

        // Получаем ячейку по доступным координатам
        let cell = getCellByPosition(position);

        // Если ячейка существует
        if (cell) {
            // и на ней нет шашек, отметим её как доступную
            if (cell.children.length === 0) {
                if (!onlyKill) {
                    allowed.push([cell, null]);
                }
            } else {

                // Иначе получаем шашку, находящуюся в ячейке
                const child = cell.children[0];

                // Если она вражеская, то отметим ячейки за ней (если таковые имеются)
                if (child.classList.contains(opposite)) {

                    // Координаты с учетом сдвига
                    let newRow = position[0] + position[2];
                    let newCell = position[1] + position[3];

                    let newPosition = [newRow, newCell];

                    // Ищем ячейку, находящуюся за вражеской и отмечаем её
                    cell = getCellByPosition(newPosition);
                    if (cell && cell.children.length === 0) {
                        allowed.push([cell, child]);
                    }
                }
            }
        }
    });

    // Отметим доступные для перемещения ячейки в обратном направлении
    backwardDirection.forEach(position => {

        // В обратном направлении можем только перемещаться на позицию за вражеской шашкой
        // Получим ячейку по координатам
        let cell = getCellByPosition(position);

        // Если ячейка существует и она не пустая
        if (cell && cell.children.length != 0) {

            const child = cell.children[0];

            if (child.classList.contains(opposite)) {
                // Координаты с учетом сдвига
                let newRow = position[0] + position[2];
                let newCell = position[1] + position[3];

                let newPosition = [newRow, newCell];

                // Ищем ячейку, находящуюся за вражеской и отмечаем её
                cell = getCellByPosition(newPosition);
                if (cell && cell.children.length === 0) {
                    allowed.push([cell, child]);
                };
            };
        }

    });

    function getForwardDirection(array) {

        const half = Math.ceil(array.length / 2);

        const firstHalf = array.splice(0, half);
        const secondHalf = array.splice(-half);

        if (currentTurn === 'white') {
            return firstHalf;
        } else {
            return secondHalf;
        }
    };

    function getBackwardDirection(array) {

        const half = Math.ceil(array.length / 2);

        const firstHalf = array.splice(0, half);
        const secondHalf = array.splice(-half);

        if (currentTurn === 'white') {
            return secondHalf;
        } else {
            return firstHalf;
        }
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
    const deadCells = document.querySelectorAll('.dead');

    cellsAllowed.forEach(cell => {
        cell.classList.remove('cell-allowed');
    });

    deadCells.forEach(checker => {
        checker.classList.remove('dead');
    });

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


