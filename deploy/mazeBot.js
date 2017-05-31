"use strict";

var algorithm = require('./algorithm');

var _game = {};
var _player = {};
var _maze = {
  initialized: false,
  width: 0,
  height: 0,
  matrix: [],

  WALL: 1,
  GHOST: 2,

  _setValue: function _setValue(x, y, v) {
    //console.log("_setValue:", x, y, v);
    var idx = x + this.width * y;
    this.matrix[idx] = v;
  },
  _isValue: function _isValue(x, y, v) {
    //console.log("_isValue:", x, y, v);
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
  }
};

function _updateGame(game) {
  _game.id = game.id;
}
function _updatePlayer(player) {
  _player.id = player.id;
  _player.position = {
    x: player.position.x,
    y: player.position.y
  };
  _player.area = {
    xmin: player.area.x1,
    xmax: player.area.x2,
    ymin: player.area.y1,
    ymax: player.area.y2
  };
}
function _updateMaze(maze) {
  console.log("_updateMaze");

  if (!_maze.initialized) {
    _maze.initialized = true;
    _maze.width = maze.size.width;
    _maze.height = maze.size.height;
    _maze.goal = {
      x: maze.goal.x,
      y: maze.goal.y
    };

    _maze.matrix = [];
  }

  // Update walls:
  maze.walls.forEach(function (wall) {
    _maze.setWall(wall.x, wall.y);
  });
}
function _updateGhosts(ghosts) {
  _maze.removeGhosts();

  if (Array.isArray(ghosts)) {
    ghosts.forEach(function (ghost) {
      _maze.setGhost(ghost.x, ghost.y);
    });
  }
}

function _calcNextMovement() {}

function _processNextMovement(curStatus) {

  _updateGame(curStatus.game);
  _updatePlayer(curStatus.player);
  _updateMaze(curStatus.maze);
  _updateGhosts(curStatus.ghosts);

  _maze.print();

  var nextMovement = algorithm.calcNextMovement(_maze, _player.position);
  return nextMovement;
}

exports.processNextMovement = _processNextMovement;