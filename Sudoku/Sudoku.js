'use strict';

var Sudoku = (function () {
  'use strict';

  var Sudoku = function (puzzleFile) {
    this.sudoku = puzzleFile;
    this.initialize();
  };

  Sudoku.prototype.sudoku = []
  Sudoku.prototype.rows = [];
  Sudoku.prototype.columns = [];
  Sudoku.prototype.squares = [];
  Sudoku.prototype.missingSolutions = [];
  Sudoku.prototype.missingSolutionsForRows = {};
  Sudoku.prototype.missingSolutionsForColumns = {};
  Sudoku.prototype.missingSolutionsForSquares = {};
  Sudoku.prototype.stack = [];
  Sudoku.prototype.guessedSolutions = [];
  Sudoku.prototype.currentNode = {};
  Sudoku.prototype.previousNode = {};

  Sudoku.prototype.initialize = function () {
    this.rows = [new Set(['1', '2', '3', '4', '5', '6', '7', '8', '9']),
                 new Set(['1', '2', '3', '4', '5', '6', '7', '8', '9']),
                 new Set(['1', '2', '3', '4', '5', '6', '7', '8', '9']),
                 new Set(['1', '2', '3', '4', '5', '6', '7', '8', '9']),
                 new Set(['1', '2', '3', '4', '5', '6', '7', '8', '9']),
                 new Set(['1', '2', '3', '4', '5', '6', '7', '8', '9']),
                 new Set(['1', '2', '3', '4', '5', '6', '7', '8', '9']),
                 new Set(['1', '2', '3', '4', '5', '6', '7', '8', '9']),
                 new Set(['1', '2', '3', '4', '5', '6', '7', '8', '9'])];

    this.columns = [new Set(['1', '2', '3', '4', '5', '6', '7', '8', '9']),
                 new Set(['1', '2', '3', '4', '5', '6', '7', '8', '9']),
                 new Set(['1', '2', '3', '4', '5', '6', '7', '8', '9']),
                 new Set(['1', '2', '3', '4', '5', '6', '7', '8', '9']),
                 new Set(['1', '2', '3', '4', '5', '6', '7', '8', '9']),
                 new Set(['1', '2', '3', '4', '5', '6', '7', '8', '9']),
                 new Set(['1', '2', '3', '4', '5', '6', '7', '8', '9']),
                 new Set(['1', '2', '3', '4', '5', '6', '7', '8', '9']),
                 new Set(['1', '2', '3', '4', '5', '6', '7', '8', '9'])];

    this.squares = [new Set(['1', '2', '3', '4', '5', '6', '7', '8', '9']),
                 new Set(['1', '2', '3', '4', '5', '6', '7', '8', '9']),
                 new Set(['1', '2', '3', '4', '5', '6', '7', '8', '9']),
                 new Set(['1', '2', '3', '4', '5', '6', '7', '8', '9']),
                 new Set(['1', '2', '3', '4', '5', '6', '7', '8', '9']),
                 new Set(['1', '2', '3', '4', '5', '6', '7', '8', '9']),
                 new Set(['1', '2', '3', '4', '5', '6', '7', '8', '9']),
                 new Set(['1', '2', '3', '4', '5', '6', '7', '8', '9']),
                 new Set(['1', '2', '3', '4', '5', '6', '7', '8', '9'])];

    this.findMissingNumbersForRows();
    this.findMissingNumbersForColumns();
    this.findMissingNumbersForSquares();
    this.findMissingSolutions();
    this.solveForSudoku();
  };

  Sudoku.prototype.solveForSudoku = function () {
    this.solve(this.missingSolutions[0]);
  };

  Sudoku.prototype.solve = function (node) {
    //stops the recursion when all the solutions are guessed
    if (node === null) {
      return;
    }

    //pick one of the possible values of the node
    this.currentNode = node;
    this.currentNode.guessedValue = this.findAvailableValue(this.currentNode);
    this.currentNode.allGuessedValues.push(this.currentNode.guessedValue);
    this.currentNode.values.set(this.currentNode.guessedValue, false);

    var isTheGuessedNumberProbable = this.regeneratePossibilities(this.currentNode);
    while (!isTheGuessedNumberProbable) {
      this.currentNode.values.set(this.currentNode.guessedValue, false);
      //reset all the nodes whose values have been set to false because of guesses in
      //the currentNode
      this.resetAllNodes(this.currentNode);
      //check if there are any other availble solution for the node
      var isExhausted = this.checkForExhaustionOfValues(this.currentNode);
      while (isExhausted) {
        //reset all its guessed values to available
        this.resetGuessedValues(this.currentNode);
        // this.currentNode.values.set(this.currentNode.guessedValue, true);
        var previousNode = this.stack.pop();
        previousNode.isVisited = false;
        this.resetAllNodes(previousNode);
        this.missingSolutions.push(previousNode);
        this.guessedSolutions.splice(this.guessedSolutions.indexOf(previousNode), 1);
        this.currentNode = previousNode;
        isExhausted = this.checkForExhaustionOfValues(this.currentNode);
      }

      //go to the next available solution for the node
      this.currentNode.guessedValue = this.findAvailableValue(this.currentNode);
      this.currentNode.values.set(this.currentNode.guessedValue, false);
      this.currentNode.allGuessedValues.push(this.currentNode.guessedValue);
      var rowNumber = this.currentNode.position[0];
      var columnNumber = this.currentNode.position[1];
      var squareNumber = 3 * Math.floor(rowNumber / 3) + Math.floor(columnNumber / 3);
      isTheGuessedNumberProbable = this.regeneratePossibilities(this.currentNode);
    }

    this.consider(this.currentNode);
    //find all the neighboring nodes, if not check for any remaining missingSolutions
    var nextNode = this.findNextNodeToVisit();
    //restart the process
    this.solve(nextNode);
  };

  Sudoku.prototype.resetAllNodes = function (node) {
    var rowNumber = node.position[0];
    var columnNumber = node.position[1];
    var squareNumber = 3 * (Math.floor(rowNumber / 3)) + Math.floor(columnNumber / 3);
    var rowMissingSolutions = this.missingSolutionsForRows[rowNumber];
    var columnMissingSolutions = this.missingSolutionsForColumns[columnNumber];
    var squareMissingSolutions = this.missingSolutionsForSquares[squareNumber];
    var hasNumber;
    var tempNode;

    if (rowMissingSolutions.length != 0) {
      for (var i = 0; i < rowMissingSolutions.length; i++) {
        tempNode = rowMissingSolutions[i];
        if (!tempNode.isVisited && tempNode != node) {
          hasNumber = tempNode.values.has(node.guessedValue);
          if (hasNumber) {
            tempNode.values.set(node.guessedValue, true);
          }
        }
      }
    }

    if (columnMissingSolutions.length != 0) {
      for (var i = 0; i < columnMissingSolutions.length; i++) {
        tempNode = columnMissingSolutions[i];
        if (!tempNode.isVisited && tempNode != node) {
          hasNumber = tempNode.values.has(node.guessedValue);
          if (hasNumber) {
            tempNode.values.set(node.guessedValue, true);
          }
        }
      }
    }

    if (squareMissingSolutions.length != 0) {
      for (var i = 0; i < squareMissingSolutions.length; i++) {
        tempNode = squareMissingSolutions[i];
        if (!tempNode.isVisited && tempNode != node) {
          hasNumber = tempNode.values.has(node.guessedValue);
          if (hasNumber) {
            tempNode.values.set(node.guessedValue, true);
          }
        }
      }
    }
  };

  Sudoku.prototype.findAvailableValue = function (node) {
    var values = [];
    node.values.forEach(function (isAvailable, value) {
      if (isAvailable) {
        values.push(value);
      }
    }.bind(this));

    return values[0];
  };

  Sudoku.prototype.resetGuessedValues = function (node) {
    node.allGuessedValues.forEach(function (v) {
      node.values.set(v, true);
    }.bind(this));

    node.allGuessedValues = [];
  };

  Sudoku.prototype.consider = function (node) {
    //push the node onto the stack
    node.isVisited = true;
    this.stack.push(node);
    var indexOfCurrentNode = this.missingSolutions.indexOf(node);
    this.missingSolutions.splice(indexOfCurrentNode, 1);
    this.guessedSolutions.push(node);
  };

  Sudoku.prototype.findNextNodeToVisit = function () {
    var nextNode = this.findUnvisitedNeighboringNodes(this.currentNode);
    //there are no more neighboring nodes
    if (!nextNode) {
      if (this.missingSolutions.length != 0) {
        nextNode = this.missingSolutions[0];
      } else {
        nextNode = null;
      }
    }

    return nextNode;
  };

  Sudoku.prototype.findUnvisitedNeighboringNodes = function (node) {
    var rowNumber = node.position[0];
    var columnNumber = node.position[1];
    var row = this.missingSolutionsForRows[rowNumber];
    var column = this.missingSolutionsForColumns[columnNumber];
    var rowIndexOfNode = row.indexOf(node);
    var columnIndexOfNode = column.indexOf(node);
    var neighboringNode;
    //if the node is not the last node of the row
    if (rowIndexOfNode < (row.length - 1)) {
      neighboringNode = row[rowIndexOfNode + 1];
    } else {
      if (rowIndexOfNode != 0) {
        neighboringNode = row[rowIndexOfNode - 1];
      }
    }

    if (!neighboringNode || neighboringNode.isVisited) {
      if (columnIndexOfNode < (column.length - 1)) {
        neighboringNode = column[columnIndexOfNode + 1];
      } else {
        if (columnIndexOfNode != 0) {
          neighboringNode = column[columnIndexOfNode - 1];
        }
      }
    }

    if (neighboringNode && !neighboringNode.isVisited) {
      return neighboringNode;
    }

    return null;
  };

  Sudoku.prototype.regeneratePossibilities = function (node) {
    var rowNumber = node.position[0];
    var columnNumber = node.position[1];
    var squareNumber = 3 * (Math.floor(rowNumber / 3)) + Math.floor(columnNumber / 3);
    var rowMissingSolutions = this.missingSolutionsForRows[rowNumber];
    var columnMissingSolutions = this.missingSolutionsForColumns[columnNumber];
    var squareMissingSolutions = this.missingSolutionsForSquares[squareNumber];
    var isAvailable;
    var hasNumber;
    var tempNode;
    var numberOfNodes;

    if (rowMissingSolutions.length != 0) {
      for (var i = 0; i < rowMissingSolutions.length; i++) {
        tempNode = rowMissingSolutions[i];
        if (!tempNode.isVisited && tempNode != node) {
          hasNumber = tempNode.values.has(node.guessedValue);
          isAvailable = tempNode.values.get(node.guessedValue);
          if (hasNumber && isAvailable) {
            tempNode.values.set(node.guessedValue, false);
          }

          //if the node runs out of values to check
          if (this.checkForExhaustionOfValues(tempNode)) {
            return false;
          };
        }
      }
    }

    if (columnMissingSolutions.length != 0) {
      for (var i = 0; i < columnMissingSolutions.length; i++) {
        tempNode = columnMissingSolutions[i];
        if (!tempNode.isVisited && tempNode != node) {
          hasNumber = tempNode.values.has(node.guessedValue);
          isAvailable = tempNode.values.get(node.guessedValue);
          if (hasNumber && isAvailable) {
            tempNode.values.set(node.guessedValue, false);
          }

          if (this.checkForExhaustionOfValues(tempNode)) {
            return false;
          };
        }
      }
    }

    if (squareMissingSolutions.length != 0) {
      for (var i = 0; i < squareMissingSolutions.length; i++) {
        tempNode = squareMissingSolutions[i];
        if (!tempNode.isVisited && tempNode != node) {
          hasNumber = tempNode.values.has(node.guessedValue);
          isAvailable = tempNode.values.get(node.guessedValue);
          if (hasNumber && isAvailable) {
            tempNode.values.set(node.guessedValue, false);
          }

          if (this.checkForExhaustionOfValues(tempNode)) {
            return false;
          };
        }
      }
    }

    return true;
  };

  Sudoku.prototype.checkForExhaustionOfValues = function (node) {
    var numberOfPossibleValues = node.values.size;
    for (var isAvailable of node.values.values()) {
      if (!isAvailable) {
        --numberOfPossibleValues;
      }
    }

    if (numberOfPossibleValues == 0) {
      return true;
    }

    return false;
  };

  Sudoku.prototype.findPossibilities = function (rowNumber, columnNumber, squareNumber) {
    var row = this.rows[rowNumber];
    var column = this.columns[columnNumber];
    var square = this.squares[squareNumber];
    var intersection = new Map();

    row.forEach(function (n) {
      if (column.has(n) && square.has(n)) {
        intersection.set(n, true);
      }
    });

    return intersection;
  };

  Sudoku.prototype.findMissingNumbersForRows = function () {
    var value;
    var i = 0;
    for (var r = 0; r < 9; r++) {
      for (var c = 0; c < 9; c++) {
        value = this.sudoku[r][c];
        if (value != '_') {
          this.rows[i].delete(value);
        }
      }
      ++i;
    }
  };

  Sudoku.prototype.findMissingNumbersForColumns = function () {
    var value;
    var i = 0;
    for (var r = 0; r < 9; r++) {
      i = 0;
      for (var c = 0; c < 9; c++) {
        value = this.sudoku[r][c];
        if (value != '_') {
          this.columns[i].delete(value);
        }
        ++i;
      }
    }
  };

  Sudoku.prototype.findMissingNumbersForSquares = function () {
    var i, j, squareNumber, value;
    for (var rowNumber = 0; rowNumber < 9; rowNumber++) {
      for (var columnNumber = 0; columnNumber < 9; columnNumber++) {
        value = this.sudoku[rowNumber][columnNumber];
        if (value != '_') {
          i = Math.floor(rowNumber / 3);
          j = Math.floor(columnNumber / 3);
          squareNumber = 3 * i + j;
          this.squares[squareNumber].delete(value);
        }
      }
    }
  };

  Sudoku.prototype.findMissingSolutions = function () {
    var value;
    var possibilities = new Set();
    var squareNumber;
    var i, j;
    var node;

    for (var rowNumber = 0; rowNumber < 9; rowNumber++) {
      for (var columnNumber = 0; columnNumber < 9; columnNumber++) {
        value = this.sudoku[rowNumber][columnNumber];
        if (value == '_') {
          i = Math.floor(rowNumber / 3);
          j = Math.floor(columnNumber / 3);
          squareNumber = 3 * i + j;
          possibilities = this.findPossibilities(rowNumber, columnNumber, squareNumber);
          node = { position: [rowNumber, columnNumber],
                   guessedValue: '',
                   allGuessedValues: [],
                   values: possibilities,
                   isVisited: false };
          this.missingSolutions.push(node);
          // this.missingSolutions.set([rowNumber, columnNumber], possibilities);

          if (!this.missingSolutionsForRows[rowNumber]) {
            this.missingSolutionsForRows[rowNumber] = [node];
          } else {
            this.missingSolutionsForRows[rowNumber].push(node);
          }

          if (!this.missingSolutionsForColumns[columnNumber]) {
            this.missingSolutionsForColumns[columnNumber] = [node];
          } else {
            this.missingSolutionsForColumns[columnNumber].push(node);
          }

          if (!this.missingSolutionsForSquares[squareNumber]) {
            this.missingSolutionsForSquares[squareNumber] = [node];
          } else {
            this.missingSolutionsForSquares[squareNumber].push(node);
          }
        }
      }
    }
  };

  return Sudoku;
})();

var puzzleFile = [['5', '3', '_', '_', '7', '_', '_', '_', '_'],
                  ['6', '_', '_', '1', '9', '5', '_', '_', '_'],
                  ['_', '9', '8', '_', '_', '_', '_', '6', '_'],
                  ['8', '_', '_', '_', '6', '_', '_', '_', '3'],
                  ['4', '_', '_', '8', '_', '3', '_', '_', '1'],
                  ['7', '_', '_', '_', '2', '_', '_', '_', '6'],
                  ['_', '6', '_', '_', '_', '_', '2', '8', '_'],
                  ['_', '_', '_', '4', '1', '9', '_', '_', '5'],
                  ['_', '_', '_', '_', '8', '_', '_', '7', '9']];

var sudoku = new Sudoku(puzzleFile);

console.log(sudoku)
