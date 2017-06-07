const algorithm = require('./algorithm');

const _players = {};
let _playersCount = 0;

function _getPlayer(playerId) {
  if (!_players[playerId]) {
     _players[playerId] = _newPlayer(playerId);
  }
  return _players[playerId];
}

function _getTime() {
  var d = new Date();
  var datestring = d.getDate()  + "-" + (d.getMonth()+1) + "-" + d.getFullYear() + " " +
  d.getHours() + ":" + d.getMinutes() + ":" + d.getSeconds();

  return {
    date: (d.getDate()  + "-" + (d.getMonth()+1) + "-" + d.getFullYear()),
    hour: (d.getHours() + ":" + d.getMinutes() + ":" + d.getSeconds())
  };
}

function _newPlayer(playerId) {
  const player = {
    id: playerId,
    position: {
      x: 0,
      y: 0
    },
    area: {
      xmin: 0,
      xmax: 0,
      ymin: 0,
      ymax: 0
    },
    maze: _newMaze(),
    index: ++_playersCount,
    time: _getTime(),
    steps: 0
  };


  return player;
}


function _newMaze() {

  // const CELL_VALUES = {
  //   0: 'unknown',
  //   1: 'wall',
  //   2: 'ghost',
  //   3: 'neutralGhost',
  //   4: 'goal',
  //   5: 'start',
  //   6: 'void',
  //   7: 'player'
  // };

  return {
    initialized: false,
    width: 0,
    height: 0,
    matrix: [],

    WALL: 1,
    GHOST: 2,
    //NEUTRAL_GHOST: 3,
    GOAL: 4,
    START: 5,
    VOID: 6,
    PLAYER: 7,
    VISITED: 8,

    init: function (jsonMaze, playerPos) {
      this.initialized = true;
      this.width = jsonMaze.size.width;
      this.height = jsonMaze.size.height;
      this.goal = {
        x: jsonMaze.goal.x,
        y: jsonMaze.goal.y
      };
      this.start = {
        x: playerPos.x,
        y: playerPos.y
      };

      this.matrix = [];

      let size = this.width * this.height;
      while(size--) {
        this.matrix[size] = 0;
      }

      this._setValue(this.goal.x, this.goal.y, this.GOAL);
      this._setValue(playerPos.x, playerPos.y, this.START);
    },

    _setValue: function _setValue(x, y, v) {
      const idx = x + this.width * y;
      this.matrix[idx] = v;    
    },
    _isValue: function _isValue(x, y, v) {
      const idx = x + this.width * y;
      return this.matrix[idx] === v;
    },
    getAt: function (x, y) {
      const idx = x + this.width * y;
      return this.matrix[idx];
    },

    setWall: function setWall(x, y) {
      this._setValue(x, y, this.WALL);
    },
    isWall: function isWall(x, y) {
      if (x < 0 || x >= this.width || y < 0 || y >= this.height) {
        return true;
      }
      return this._isValue(x, y, this.WALL);
    },
    setGhost: function setGhost(x, y) {
      this._setValue(x, y, this.GHOST);
    },
    isGhost: function isGhost(x, y) {
      if (x < 0 || x >= this.width || y < 0 || y >= this.height) {
        return false;
      }
      return this._isValue(x, y, this.GHOST);
    },
    removeGhosts: function removeGhosts() {
      for (let i = 0, n = this.matrix.length; i < n; i++) {
        if (this.matrix[i] === this.GHOST) {
          this.matrix[i] = 0;
        }
      }
    },
    print: function print() {
      console.log("MAZE:");
      for (let y = 0; y < this.height; y ++) {
        let row = "";
        for (let x = 0; x < this.width; x++) {
          row += this.isWall(x, y) ? "1" : (this.isGhost(x, y) ? "2" : "0");
        }
        console.log(row);
      }
    },
    cloneMatrix: function () {
      return this.matrix.slice(0);
    },
    evalExplored: function() {
      let count = 0,
        i = 0,
        n = Array.isArray(this.matrix) ? this.matrix.length : 0;

      for (; i < n; i++) {
        if (this.matrix[i]) {
          count++;
        }
      }

      return n ? ((100 * count) / n).toFixed(2) : 0;
    }
  };
}

/**
 * @desc Deep copy the maze in order to return in a GET call, to avoid returning a maze
 *  that could be mid-updated by other process.
 */
function _cloneMaze(maze) {
  const copyMaze = {
    initialized: maze.initialized,
    width: maze.width,
    height: maze.height,
    matrix: maze.cloneMatrix()
  };
  return copyMaze;
}

function _updatePlayer(jsonPlayer) {
  const player = _getPlayer(jsonPlayer.id);

  player.position = {
    x: jsonPlayer.position.x,
    y: jsonPlayer.position.y
  };
  player.prevPosition = {
    x: jsonPlayer.previous.x,
    y: jsonPlayer.previous.y
  };
  player.area = {
    xmin: jsonPlayer.area.x1,
    xmax: jsonPlayer.area.x2,
    ymin: jsonPlayer.area.y1,
    ymax: jsonPlayer.area.y2
  }
}
function _updateMaze(playerId, jsonMaze) {

  const player = _getPlayer(playerId),
    playerMaze = player.maze;

  if (!playerMaze.initialized) {
    playerMaze.init(jsonMaze, player.position);
  }

  // Update walls:
  jsonMaze.walls.forEach(function (wall) {
    playerMaze.setWall(wall.x, wall.y);
  });

  // Update known area
  for (let col = player.area.xmin; col <= player.area.xmax; col++) {
    for (let row = player.area.ymin; row <= player.area.ymax; row++) {
      let v = playerMaze.getAt(col, row);
      if (v === 0) {
        playerMaze._setValue(col, row, playerMaze.VOID);
      }
    }
  }

  // Update player pos:
  if (player.prevPosition && player.prevPosition !== undefined) {
    playerMaze._setValue(player.prevPosition.x, player.prevPosition.y, playerMaze.VISITED);
  }
  playerMaze._setValue(player.position.x, player.position.y, playerMaze.PLAYER);
}

function _updateGhosts(playerId, ghosts) {
  const player = _getPlayer(playerId),
    playerMaze = player.maze;

  playerMaze.removeGhosts();

  if (Array.isArray(ghosts)) {
    ghosts.forEach(function (ghost) {
      playerMaze.setGhost(ghost.x, ghost.y);
    });
  }
}

function _processNextMovement(curStatus) {
  const jsonPlayer = curStatus.player,
    playerId = jsonPlayer.id;
  
  _updatePlayer(jsonPlayer);
  _updateMaze(playerId, curStatus.maze);
  _updateGhosts(playerId, curStatus.ghosts);

  const player = _getPlayer(playerId);

  let nextMovement = algorithm.calcNextMovement(playerId, player.maze, player.position);
  player.steps++;


console.log("MOVE: ", nextMovement);

  return nextMovement;
}

exports.processNextMovement = _processNextMovement;

// ----------- DEBUG API -------------------


exports.getGames = function () {
  const games = [];
  
  for (let playerId in _players) {
    const player = _players[playerId],
      gameState = 'running',
      explored = player ? player.maze.evalExplored() : 0;

    games.push({
      id: player.id,
      state: gameState,
      explored: explored,
      index: player.index,
      date: player.time
    });
  }

  return games;
};

exports.getGame = function (playerId) {
  const player = _players[playerId],
    gameState = 'running',
    explored = player ? player.maze.evalExplored() : 0;

  if (player) {
    return {
      id: player.id,
      state: gameState,
      explored: explored,
      position: player.position,
      maze: _cloneMaze(player.maze),
      index: player.index,
      date: player.time,
      steps: player.steps
    };
  }

  return {};
};