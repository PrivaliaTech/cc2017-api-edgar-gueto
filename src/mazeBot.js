const algorithm = require('./algorithm');

const _players = {};

function _getPlayer(playerId) {
  if (!_players[playerId]) {
     _players[playerId] = _newPlayer(playerId);
  }
  return _players[playerId];
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
    maze: _newMaze()
  };

  return player;
}


function _newMaze() {
  return {
    initialized: false,
    width: 0,
    height: 0,
    matrix: [],

    WALL: 1,
    GHOST: 2,

    _setValue: function _setValue(x, y, v) {
      const idx = x + this.width * y;
      this.matrix[idx] = v;    
    },
    _isValue: function _isValue(x, y, v) {
      const idx = x + this.width * y;
      return this.matrix[idx] === v;
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
    }
  };
}

function _updatePlayer(jsonPlayer) {
  const player = _getPlayer(jsonPlayer.id);

  player.position = {
    x: jsonPlayer.position.x,
    y: jsonPlayer.position.y
  };
  player.area = {
    xmin: jsonPlayer.area.x1,
    xmax: jsonPlayer.area.x2,
    ymin: jsonPlayer.area.y1,
    ymax: jsonPlayer.area.y2
  }
}
function _updateMaze(playerId, maze) {

  const player = _getPlayer(playerId),
    playerMaze = player.maze;

  if (!playerMaze.initialized) {
    playerMaze.initialized = true;
    playerMaze.width = maze.size.width;
    playerMaze.height = maze.size.height;
    playerMaze.goal = {
      x: maze.goal.x,
      y: maze.goal.y
    };

    playerMaze.matrix = []
  }

  // Update walls:
  maze.walls.forEach(function (wall) {
    playerMaze.setWall(wall.x, wall.y);
  });
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
  //player.maze.print();

  let nextMovement = algorithm.calcNextMovement(playerId, player.maze, player.position);
  return nextMovement;
}

exports.processNextMovement = _processNextMovement;