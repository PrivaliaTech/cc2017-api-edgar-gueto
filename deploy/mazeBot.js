"use strict";

var algorithm = require('./algorithm');

var _players = {};
var _playersCount = 0;

function _getPlayer(playerId) {
  if (!_players[playerId]) {
    _players[playerId] = _newPlayer(playerId);
  }
  return _players[playerId];
}

function _getTime() {
  var d = new Date();
  var datestring = d.getDate() + "-" + (d.getMonth() + 1) + "-" + d.getFullYear() + " " + d.getHours() + ":" + d.getMinutes() + ":" + d.getSeconds();

  return {
    date: d.getDate() + "-" + (d.getMonth() + 1) + "-" + d.getFullYear(),
    hour: d.getHours() + ":" + d.getMinutes() + ":" + d.getSeconds()
  };
}

function _newPlayer(playerId) {
  var player = {
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
    time: _getTime()
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
      var idx = x + this.width * y;
      this.matrix[idx] = v;
    },
    _isValue: function _isValue(x, y, v) {
      var idx = x + this.width * y;
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
      for (var i = 0, n = this.matrix.length; i < n; i++) {
        if (this.matrix[i] === this.GHOST) {
          this.matrix[i] = 0;
        }
      }
    },
    print: function print() {
      console.log("MAZE:");
      for (var y = 0; y < this.height; y++) {
        var row = "";
        for (var x = 0; x < this.width; x++) {
          row += this.isWall(x, y) ? "1" : this.isGhost(x, y) ? "2" : "0";
        }
        console.log(row);
      }
    },
    cloneMatrix: function cloneMatrix() {
      return this.matrix.slice(0);
    },
    evalExplored: function evalExplored() {
      var count = 0,
          i = 0,
          n = Array.isArray(this.matrix) ? this.matrix.length : 0;

      for (; i < n; i++) {
        if (this.matrix[i]) {
          count++;
        }
      }

      return n ? (100 * count / n).toFixed(2) : 0;
    }
  };
}

/**
 * @desc Deep copy the maze in order to return in a GET call, to avoid returning a maze
 *  that could be mid-updated by other process.
 */
function _cloneMaze(maze) {
  var copyMaze = {
    initialized: maze.initialized,
    width: maze.width,
    height: maze.height,
    matrix: maze.cloneMatrix()
  };
  return copyMaze;
}

function _updatePlayer(jsonPlayer) {
  var player = _getPlayer(jsonPlayer.id);

  player.position = {
    x: jsonPlayer.position.x,
    y: jsonPlayer.position.y
  };
  player.area = {
    xmin: jsonPlayer.area.x1,
    xmax: jsonPlayer.area.x2,
    ymin: jsonPlayer.area.y1,
    ymax: jsonPlayer.area.y2
  };
}
function _updateMaze(playerId, maze) {

  var player = _getPlayer(playerId),
      playerMaze = player.maze;

  if (!playerMaze.initialized) {
    playerMaze.initialized = true;
    playerMaze.width = maze.size.width;
    playerMaze.height = maze.size.height;
    playerMaze.goal = {
      x: maze.goal.x,
      y: maze.goal.y
    };

    playerMaze.matrix = [];

    var size = playerMaze.width * playerMaze.height;
    while (size--) {
      playerMaze.matrix[size] = 0;
    }
  }

  // Update walls:
  maze.walls.forEach(function (wall) {
    playerMaze.setWall(wall.x, wall.y);
  });
}

function _updateGhosts(playerId, ghosts) {
  var player = _getPlayer(playerId),
      playerMaze = player.maze;

  playerMaze.removeGhosts();

  if (Array.isArray(ghosts)) {
    ghosts.forEach(function (ghost) {
      playerMaze.setGhost(ghost.x, ghost.y);
    });
  }
}

function _processNextMovement(curStatus) {
  var jsonPlayer = curStatus.player,
      playerId = jsonPlayer.id;

  _updatePlayer(jsonPlayer);
  _updateMaze(playerId, curStatus.maze);
  _updateGhosts(playerId, curStatus.ghosts);

  var player = _getPlayer(playerId);
  //player.maze.print();

  var nextMovement = algorithm.calcNextMovement(playerId, player.maze, player.position);
  return nextMovement;
}

exports.processNextMovement = _processNextMovement;

// ----------- DEBUG API -------------------


exports.getGames = function () {
  var games = [];

  for (var playerId in _players) {
    var player = _players[playerId],
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
  var player = _players[playerId],
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
      date: player.time
    };
  }

  return {};
};