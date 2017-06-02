const _contexts = {};

function _getPlayerContext(playerId) {
  if (!_contexts[playerId]) {
    _contexts[playerId] = _generateNewContext(playerId);
  }
  return _contexts[playerId];
}

function _generateNewContext(playerId) {
  return {
    matrix: [],
    initialized: false,
    width: 0,
    height: 0,
    VISITED: 1,

    visit: function visit(x, y) {
      const idx = x + this.width * y;
      this.matrix[idx] = this.VISITED;    
    },
    visited: function visited(x, y) {
      if (x < 0 || x >= this.width || y < 0 || y >= this.height) {
        return true;
      }
      const idx = x + this.width * y;
      return this.matrix[idx] === this.VISITED;
    },
    initialize: function initialize(maze, playerPos) {
      if (!_explored.initialized) {
        this.width = maze.width;
        this.height = maze.height;
        this.visit(playerPos.x, playerPos.y);
        this.initialized = true;
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
    }

  };
}




const MOV_VALID = 1;
const MOV_LESS_VALID = 2;
const TO_LEFT = "left";
const TO_RIGHT = "right";
const TO_TOP = "up";
const TO_BOTTOM = "down";

function _calcNextMovement(playerId, maze, playerPos) {

  const context = _getPlayerContext(playerId);

  context.initialize(maze, playerPos);
  //context.print('before');
  
  // Default mov
  let nextMov = TO_RIGHT;

  // Basic inspection (try to survive!)
  const basicInspect = _basicInspect(context, maze, playerPos);

  if (basicInspect.valid.length) {
    nextMov = _getRandomValue(basicInspect.valid);
  } else if (basicInspect.lessValid.length) {
    nextMov = _getRandomValue(basicInspect.lessValid);
  }


  // Historic
  context.explore(playerPos, _movVerbToVector(nextMov));
  //context.print('after');

  return nextMov;
}

exports.calcNextMovement = _calcNextMovement;

/**
 * @desc For each direction, calculates if it is possible to move (2), possible but already explored (1) or not possible (0)
 */
function _basicInspect(context, maze, playerPos) {
  const atLeft = _basicPositionEval(context, maze, {x: playerPos.x - 1, y: playerPos.y});
  const atRight = _basicPositionEval(context, maze, {x: playerPos.x + 1, y: playerPos.y});
  const atTop = _basicPositionEval(context, maze, {x: playerPos.x, y: playerPos.y - 1});
  const atBottom = _basicPositionEval(context, maze, {x: playerPos.x, y: playerPos.y + 1});

  const valid = [],
    lessValid = [];

  _classifyMovOption(valid, lessValid, atLeft, TO_LEFT);
  _classifyMovOption(valid, lessValid, atRight, TO_RIGHT);
  _classifyMovOption(valid, lessValid, atTop, TO_TOP);
  _classifyMovOption(valid, lessValid, atBottom, TO_BOTTOM);

  return {
    valid: valid,
    lessValid: lessValid
  };
}

function _basicPositionEval(context, maze, position) {
  return {
    wall: maze.isWall(position.x, position.y),
    ghost: maze.isGhost(position.x, position.y),
    explored: context.visited(position.x, position.y)
  };
}

function _classifyMovOption(valid, lessValid, positionEvaluation, dir) {
  if (!positionEvaluation.wall && !positionEvaluation.ghost) {
    if (positionEvaluation.explored) {
      lessValid.push(dir);
    } else {
      valid.push(dir);
    }
  } 
}

function _getRandomValue(list) {
  const idx = Math.floor(Math.random() * (list.length - 0.5));
  return list.length ? list[idx] : undefined;
}

function _movVerbToVector(mov) {
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