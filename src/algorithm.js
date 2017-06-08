let contextMgr = {};

(function (mgr) {
  const _contexts = {};

  mgr.getContext = function (playerId) {
    if (!_contexts[playerId]) {
      _contexts[playerId] = _generateNewContext(playerId);
    }
    return _contexts[playerId];
  };
})(contextMgr);






function _getPlayerContext(playerId) {
  if (!_contexts[playerId]) {
    _contexts[playerId] = _generateNewContext(playerId);
  }
  return _contexts[playerId];
}



function _generateNewContext(playerId) {
  return {
    initialized: false,
    resistanceMatrix: [],
    matrix: [],
    logs: [],
    width: 0,
    height: 0,
    VISITED: 1,

    visit: function visit(x, y) {
      const idx = x + this.width * y;
      this.matrix[idx] = this.VISITED;

      if (!this.resistanceMatrix[idx]) {
        this.resistanceMatrix[idx] = 1;
      }
    },
    visited: function visited(x, y) {
      if (x < 0 || x >= this.width || y < 0 || y >= this.height) {
        return true;
      }
      const idx = x + this.width * y;
      return this.matrix[idx] === this.VISITED;
    },
    getResistance: function getResistance(x, y) {
      if (x < 0 || x >= this.width || y < 0 || y >= this.height) {
        return 9999999;
      }
      const idx = x + this.width * y;
      return this.resistanceMatrix[idx] === undefined ? 0 : this.resistanceMatrix[idx];
    },
    initialize: function initialize(maze, playerPos) {
      if (!this.initialized) {
        this.width = maze.width;
        this.height = maze.height;
        this.visit(playerPos.x, playerPos.y);
        this.initialized = true;

        let size = this.width * this.height;
        for (let i = 0; i < size; i++) {
          this.resistanceMatrix[i] = 0;
        }
      }
    },
    explore: function explore(playerPos, displacement) {
      this.visit(playerPos.x + displacement.x, playerPos.y + displacement.y);
    },
    print: function print(n) {
      console.log("EXPLORED:" + n);
      for (let y = 0; y < this.height; y ++) {
        let row = "";
        for (let x = 0; x < this.width; x++) {
          row += this.visited(x, y) ? "1" : "0";
        }
        console.log(row);
      }
    },

    _addLog: function (details) {
      this.logs.push(details);
    }
  };
}


const MOV_VALID = 1;
const MOV_LESS_VALID = 2;
const TO_LEFT = "left";
const TO_RIGHT = "right";
const TO_TOP = "up";
const TO_BOTTOM = "down";

function _calcNextMovement(playerId, maze, playerPos, steps) {
  
  // Default mov
  let nextMov = TO_RIGHT;

  let context = _getPlayerContext(playerId);
  try {

    // Initialize the context
    context.initialize(maze, playerPos);

    // Precalculate next positions, four possible movements
    let movements = _createAllMovements(playerPos);

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
      context._addLog({
        nextMov: nextMov,
        how: 'Default, ghost threads in all movs',
        steps: steps
      });
    }
  } catch (e) {
      context._addLog({
        nextMov: nextMov,
        how: 'EXCEPTION: ' + e.message,
        steps: steps
      });
  }

  // Updates
  context.explore(playerPos, _directionToVector(nextMov));

  return nextMov;
}

exports.calcNextMovement = _calcNextMovement;

function _flushDebugInfo(playerId) {
  let context = _getPlayerContext(playerId),
    logs = context.logs.slice(0);

  console.log("_flushDebugInfo::log", context.logs);

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
    pos: {x: playerPos.x - 1, y: playerPos.y}
  }, {
    dir: TO_RIGHT,
    valid: true,
    pos: {x: playerPos.x + 1, y: playerPos.y}
  }, {
    dir: TO_TOP,
    valid: true,
    pos: {x: playerPos.x, y: playerPos.y - 1}
  }, {
    dir: TO_BOTTOM,
    valid: true,
    pos: {x: playerPos.x, y: playerPos.y + 1}
  }];
}

/**
 * @desc Evaluates each possible movement, and if it results in a wall, we invalidate it.
 */
function _avoidWalls(movements, context, maze) {
  movements.map((mov) => {
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
  movements.map((mov) => {
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
  let valid = true;

  if (maze.isGhost(nextPosition.x, nextPosition.y)) {
    valid = false;
  } else {

    // Do not move to an adjacent cell of a ghost!
    const ghostPresence = maze.isGhost(nextPosition.x - 1, nextPosition.y) ||
      maze.isGhost(nextPosition.x, nextPosition.y - 1) ||
      maze.isGhost(nextPosition.x + 1, nextPosition.y) ||
      maze.isGhost(nextPosition.x, nextPosition.y + 1);

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
  movements.map((mov) => {
    if (mov.valid) {
      mov.resistance = context.getResistance(mov.pos.x, mov.pos.y);
    }
    return mov;
  });
}


/**********************************************
 * UTILITIES
 *********************************************/

function _propagateResistance(resistanceMatrix, maze) {

  // 1. Detect corners: cells with at least two non-oposite walls
  const mazeMatrix = maze.matrix;
  mazeMatrix.forEach((cellValue, idx) => {
    
    // a) Zero values are the unknown
    // b) Do not initialize a resistance twice
    if (cellValue && !resistanceMatrix[idx]) {

      // Initialize walls with resistance above all initialized resistances
      if (cellValue === maze.WALL) {
        resistanceMatrix[idx] = 4; // as if it was surrounded by 4 walls
      } else if (cellValue === maze.GOAL) {
        // Goal has the less resistance!
        resistanceMatrix[idx] = -0.5;
      } else {
        // Ok, set normal resistance
        resistanceMatrix[idx] = _calcNumAdjacentWalls(maze, idx);
      }
    } else if (resistanceMatrix[idx] > 0) {
      resistanceMatrix[idx]++;// Keep increasing resistances!
    }
  });

  // 2. Propagate:
  mazeMatrix.forEach((cellValue, idx) => {
    if (cellValue && cellValue !== maze.WALL) {
      if (resistanceMatrix[idx] > 1) {
        _propagateReistanceToAdjacents(resistanceMatrix, maze, idx);
      }
    }
  });


}

/**
 * @desc
 */
function _calcAdjacentWalls(maze, idx) {
  const matrix = maze.matrix,
    size = maze.size,
    width = maze.width,
    leftIdx = idx - 1,
    rightIdx = idx + 1,
    topIdx = idx - width,
    bottomIdx = idx + width;

  let walls = {};

  if (0 <= leftIdx && matrix[leftIdx] === maze.WALL) {
    walls.left = 1;
  }
  if (rightIdx < size && matrix[rightIdx] === maze.WALL) {
    walls.right = 1;
  }
  if (0 <= topIdx && matrix[topIdx] === maze.WALL) {
    walls.top = 1;
  }
  if (bottomIdx < size && matrix[bottomIdx] === maze.WALL) {
    walls.bottom = 1;
  }

  return walls;
}

/**
 * @desc
 */
function _calcNumAdjacentWalls(maze, idx) {
  const walls = _calcAdjacentWalls(maze, idx);
  let numWalls = 0;

  numWalls += walls.left ? 1 : 0;
  numWalls += walls.right ? 1 : 0;
  numWalls += walls.top ? 1 : 0;
  numWalls += walls.bottom ? 1 : 0;

  // Three or four walls (?) are a must-avoid corner
  if (numWalls > 2) {
    return numWalls;
  }

  // Simple corners  
  if ((walls.left || walls.right) && (walls.top || walls.bottom)) {
    return 2;
  }

  // 1 wall surrounding or two opposite are no resistance by theirself
  return 0;
}

function _propagateReistanceToAdjacents(resistanceMatrix, maze, idx) {
  const walls = _calcAdjacentWalls(maze, idx),
    resistance = resistanceMatrix[idx];

  const matrix = maze.matrix,
    size = maze.size,
    width = maze.width,
    leftIdx = idx - 1,
    rightIdx = idx + 1,
    topIdx = idx - width,
    bottomIdx = idx + width;

  if (0 <= leftIdx && matrix[leftIdx] && matrix[leftIdx] !== maze.WALL && resistanceMatrix[leftIdx] >= 0) {
    resistanceMatrix[leftIdx]++;
  }
  if (rightIdx < size && matrix[rightIdx] && matrix[rightIdx] !== maze.WALL && resistanceMatrix[rightIdx] >= 0) {
    resistanceMatrix[rightIdx]++;
  }
  if (0 <= topIdx && matrix[topIdx] && matrix[topIdx] !== maze.WALL && resistanceMatrix[topIdx] >= 0) {
    resistanceMatrix[topIdx]++;
  }
  if (bottomIdx < size && matrix[bottomIdx] && matrix[bottomIdx] !== maze.WALL && resistanceMatrix[bottomIdx] >= 0) {
    resistanceMatrix[bottomIdx]++;
  }

}

/**
 * @desc Select best evaluated movement among valid ones
 */
function _getMostPromising(movements, context, steps) {
  let maxValue = 0,
    dir = TO_LEFT;

  movements.forEach((mov) => {
    if (mov.valid) {

      // The less the resistance, the better
      let value = 1 / (1 + mov.resistance);

      if (value > maxValue) {
        maxValue = value;
        dir = mov.dir;
      }
    }
  });

  context._addLog({
    nextMov: dir,
    how: 'Most promising, value: ' + maxValue.toFixed(2),
    steps: steps
  });

  return dir;
}

// function _toDirections(movements) {
//   let dirs = [];

//   movements.forEach((mov) => {
//     if (mov.valid) {
//       dirs.push(mov.dir);
//     }
//   });

//   return dirs;
// }

// function _getRandomValue(list) {
//   const idx = Math.floor(Math.random() * (list.length - 0.5));
//   return list.length ? list[idx] : undefined;
// }

function _directionToVector(mov) {
  if (mov === TO_LEFT) {
    return {x: -1, y: 0};
  }
  if (mov === TO_RIGHT) {
    return {x: 1, y: 0};
  }
  if (mov === TO_TOP) {
    return {x: 0, y: -1};
  }
  if (mov === TO_BOTTOM) {
    return {x: 0, y: 1};
  }
  return {x: 0, y: 0};
}