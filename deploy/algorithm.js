'use strict';

var contextMgr = require('./context');
var config = require('../config.json');

var MOV_VALID = 1;
var MOV_LESS_VALID = 2;
var TO_LEFT = "left";
var TO_RIGHT = "right";
var TO_TOP = "up";
var TO_BOTTOM = "down";

function _calcNextMovement(playerId, maze, playerPos, steps, player) {
  var randMovs = [TO_LEFT, TO_RIGHT, TO_TOP, TO_BOTTOM];

  // Default mov
  var nextMov = randMovs[Math.floor(3.99 * Math.random())];

  var context = contextMgr.getContext(playerId);
  try {

    // Initialize the context
    context.initialize(maze, playerPos);

    // Precalculate next positions, four possible movements
    var movements = _createAllMovements(playerPos);

    // 0. Exit?
    var exitMove = _getExit(movements, context, maze);
    if (exitMove) {
      nextMov = exitMove;
    } else {
      // 1. Avoid silly movements
      _avoidWalls(movements, context, maze);

      // 2. Survive, so avoid ghosts
      _avoidGhostMovs(movements, context, maze);

      _propagateResistance(context.resistanceMatrix, maze);

      // 3. Evaluate the most promising next movement
      _evalRemainingMovs(movements, context, maze, playerPos);

      if (movements.length) {
        nextMov = _getMostPromising(movements, context, steps);
      } else {
        context.addLog({
          nextMov: nextMov,
          how: 'Default, ghost threads in all movs',
          steps: steps
        });
      }
    }
  } catch (e) {
    context.addLog({
      nextMov: nextMov,
      how: 'EXCEPTION: ' + e.message,
      steps: steps
    });
  }

  // Updates
  context.explore(playerPos, _directionToVector(nextMov), nextMov);

  return nextMov;
}

exports.calcNextMovement = _calcNextMovement;

function _flushDebugInfo(playerId) {
  var context = contextMgr.getContext(playerId),
      logs = context.logs.slice(0);

  // reset log
  context.logs = [];

  return {
    logs: logs,
    resistMatrix: context.resistanceMatrix.slice(0)
  };
}
exports.flushDebugInfo = _flushDebugInfo;

/**
 * @desc Prepare next movements
 */
function _createAllMovements(playerPos) {
  return [{
    dir: TO_LEFT,
    valid: true,
    pos: { x: playerPos.x - 1, y: playerPos.y }
  }, {
    dir: TO_RIGHT,
    valid: true,
    pos: { x: playerPos.x + 1, y: playerPos.y }
  }, {
    dir: TO_TOP,
    valid: true,
    pos: { x: playerPos.x, y: playerPos.y - 1 }
  }, {
    dir: TO_BOTTOM,
    valid: true,
    pos: { x: playerPos.x, y: playerPos.y + 1 }
  }];
}

/**
 * @desc Returns a mov if it is the mov to the final exit.
 */
function _getExit(movements, context, maze) {
  var exitMov = undefined;

  movements.map(function (mov) {
    if (maze.isExit(mov.pos.x, mov.pos.y)) {
      exitMov = mov.dir;
    }
    return mov;
  });

  return exitMov;
}

/**
 * @desc Evaluates each possible movement, and if it results in a wall, we invalidate it.
 */
function _avoidWalls(movements, context, maze) {
  movements.map(function (mov) {
    if (maze.isWall(mov.pos.x, mov.pos.y)) {
      mov.valid = false;
    }
    return mov;
  });
}

/**
 * @desc For each direction, calculates if it is possible to move (2), possible but already explored (1) or not possible (0)
 */
function _avoidGhostMovs(movements, context, maze) {
  movements.map(function (mov) {
    if (mov.valid) {
      if (_isGhostThreat(context, maze, mov.pos)) {
        mov.valid = false;
      }
    }
    return mov;
  });
}

/**
 * @description Evaluates if nextPosition is safe from ghosts. That means to be free of ghosts
 *  itself and also its adjacent cells.
 */
function _isGhostThreat(context, maze, nextPosition) {
  var valid = true;

  if (maze.isGhost(nextPosition.x, nextPosition.y)) {
    valid = false;
  } else {

    // Do not move to an adjacent cell of a ghost!
    var ghostPresence = maze.isGhost(nextPosition.x - 1, nextPosition.y) || maze.isGhost(nextPosition.x, nextPosition.y - 1) || maze.isGhost(nextPosition.x + 1, nextPosition.y) || maze.isGhost(nextPosition.x, nextPosition.y + 1);

    if (ghostPresence) {
      valid = false;
    }
  }
  return !valid;
}

/**
 * @desc Uses some heuristic in order to determine which is the most promising movement
 */
function _evalRemainingMovs(movements, context, maze, playerPos) {
  movements.map(function (mov) {
    if (mov.valid) {
      mov.resistance = context.getResistance(mov.pos.x, mov.pos.y);

      // // Try to avoid bouncings...
      // if (context.isOpposite(mov.dir)) {
      //   mov.resistance += config.OPPOSITE_RESISTANCE;
      // }
    }
    return mov;
  });
}

/**********************************************
 * UTILITIES
 *********************************************/

function _propagateResistance(resistanceMatrix, maze) {

  // 1. Detect corners: cells with at least two non-oposite walls
  var mazeMatrix = maze.matrix;
  mazeMatrix.forEach(function (cellValue, idx) {

    // a) Zero values are the unknown
    // b) Do not initialize a resistance twice
    if (cellValue && !resistanceMatrix[idx]) {

      // Initialize walls with resistance above all initialized resistances
      if (cellValue === maze.WALL) {
        resistanceMatrix[idx] = 4; // as if it was surrounded by 4 walls
      } else if (cellValue === maze.GOAL) {
        // Goal has the less resistance!
        resistanceMatrix[idx] = config.OBJECTIVE_RESISTANCE;
      } else {
        // Ok, set normal resistance
        resistanceMatrix[idx] = _calcNumAdjacentWalls(maze, idx);
      }
    } else if (resistanceMatrix[idx] > 0) {
      resistanceMatrix[idx]++; // Keep increasing resistances!
    }
  });

  // 2. Propagate:
  mazeMatrix.forEach(function (cellValue, idx) {
    if (cellValue && cellValue !== maze.WALL) {
      //if (resistanceMatrix[idx] > 1) {
      _propagateReistanceToAdjacents(resistanceMatrix, maze, idx);
      //}
    }
  });
}

/**
 * @desc
 */
function _calcAdjacentWalls(maze, idx) {
  var matrix = maze.matrix,
      size = maze.size,
      width = maze.width,
      leftIdx = idx - 1,
      rightIdx = idx + 1,
      topIdx = idx - width,
      bottomIdx = idx + width;

  var walls = {},
      count = 0;

  if (0 <= leftIdx && matrix[leftIdx] === maze.WALL) {
    walls.left = 1;
    count++;
  }
  if (rightIdx < size && matrix[rightIdx] === maze.WALL) {
    walls.right = 1;
    count++;
  }
  if (0 <= topIdx && matrix[topIdx] === maze.WALL) {
    walls.top = 1;
    count++;
  }
  if (bottomIdx < size && matrix[bottomIdx] === maze.WALL) {
    walls.bottom = 1;
    count++;
  }

  walls.count = count;

  if (count > 2) {
    walls.isHole = true;
  } else if (count === 2) {
    if (walls.left && walls.right || walls.top && walls.bottom) {
      walls.isFunnel = true;
    } else {
      walls.isCorner = true;
    }
  } else if (count === 1) {
    walls.oneWall = true;
  } else {
    walls.isIsolated = true;
  }

  return walls;
}

/**
 * @desc
 */
function _calcNumAdjacentWalls(maze, idx) {
  var walls = _calcAdjacentWalls(maze, idx);

  // Three or four walls (?) are a must-avoid corner
  if (walls.isHole) {
    return walls.count;
  }
  if (walls.isCorner) {
    return 2;
  }

  // 1 wall surrounding or two opposite are no resistance by theirself
  return 0;
}

function _getAverageResistance(resistanceMatrix, maze, idx) {
  var c = maze.getCoords(idx);

  var idxs = [maze.getIdx(c.x - 1, c.y), maze.getIdx(c.x - 1, c.y - 1), maze.getIdx(c.x, c.y - 1), maze.getIdx(c.x + 1, c.y - 1), maze.getIdx(c.x + 1, c.y), maze.getIdx(c.x + 1, c.y + 1), maze.getIdx(c.x, c.y + 1), maze.getIdx(c.x - 1, c.y + 1)];

  var sum = 0;
  idxs.forEach(function (i) {
    if (i !== undefined) {
      var r = resistanceMatrix[i];
      if (r !== undefined) {
        sum += r;
      }
    }
  });

  return sum / 8;
}

function _propagateReistanceToAdjacents(resistanceMatrix, maze, idx) {
  var walls = _calcAdjacentWalls(maze, idx);

  var matrix = maze.matrix,
      size = maze.size,
      width = maze.width,
      leftIdx = idx - 1,
      rightIdx = idx + 1,
      topIdx = idx - width,
      bottomIdx = idx + width;

  // Leave funnels clear
  if (!walls.isFunnel) {
    if (walls.isCorner) {
      // Increment!
      resistanceMatrix[idx]++;
    } else {
      // Average
      resistanceMatrix[idx] = _getAverageResistance(resistanceMatrix, maze, idx);
    }
  } else {
    // Decrement!
    resistanceMatrix[idx] += config.FUNNEL_RESISTANCE;
  }
}

/**
 * @desc Select best evaluated movement among valid ones
 */
function _getMostPromising(movements, context, steps) {
  var minValue = 9999999,
      dir = undefined,
      secondOptionDir = TO_TOP;

  movements.forEach(function (mov) {
    if (mov.valid) {

      // The less the resistance, the better
      var value = mov.resistance;

      if (context.isOpposite(mov.dir)) {
        secondOptionDir = mov.dir;
      } else {
        if (value <= minValue) {
          minValue = value;
          dir = mov.dir;
        }
      }
    }
  });

  // If no mov found, try with the opposite:
  if (dir === undefined) {
    dir = secondOptionDir;
  }

  context.addLog({
    nextMov: dir,
    how: 'Most promising, value: ' + minValue.toFixed(2),
    steps: steps
  });

  return dir;
}

function _directionToVector(mov) {
  if (mov === TO_LEFT) {
    return { x: -1, y: 0 };
  }
  if (mov === TO_RIGHT) {
    return { x: 1, y: 0 };
  }
  if (mov === TO_TOP) {
    return { x: 0, y: -1 };
  }
  if (mov === TO_BOTTOM) {
    return { x: 0, y: 1 };
  }
  return { x: 0, y: 0 };
}