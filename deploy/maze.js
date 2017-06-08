"use strict";

(function (module) {

  function Maze() {
    this.initialized = false;
    this.width = 0;
    this.height = 0;
    this.size = 0;
    this.matrix = [];

    this.WALL = 1;
    this.GHOST = 2;
    this.GOAL = 4;
    this.START = 5;
    this.VOID = 6;
    this.PLAYER = 7;
    this.VISITED = 8;
  }

  Maze.prototype.init = function init(jsonMaze, playerPos) {
    this.initialized = true;
    this.width = jsonMaze.size.width;
    this.height = jsonMaze.size.height;
    this.size = this.width * this.height;
    this.goal = {
      x: jsonMaze.goal.x,
      y: jsonMaze.goal.y
    };
    this.start = {
      x: playerPos.x,
      y: playerPos.y
    };

    this.matrix = [];

    var size = this.width * this.height;
    while (size--) {
      this.matrix[size] = 0;
    }

    this._setValue(this.goal.x, this.goal.y, this.GOAL);
    this._setValue(playerPos.x, playerPos.y, this.START);
  };

  Maze.prototype._setValue = function _setValue(x, y, v) {
    var idx = x + this.width * y;
    this.matrix[idx] = v;
  };

  Maze.prototype._isValue = function _isValue(x, y, v) {
    var idx = x + this.width * y;
    return this.matrix[idx] === v;
  };

  Maze.prototype.getAt = function (x, y) {
    var idx = x + this.width * y;
    return this.matrix[idx];
  };

  Maze.prototype.setWall = function setWall(x, y) {
    this._setValue(x, y, this.WALL);
  };

  Maze.prototype.isWall = function isWall(x, y) {
    if (x < 0 || x >= this.width || y < 0 || y >= this.height) {
      return true;
    }
    return this._isValue(x, y, this.WALL);
  };

  Maze.prototype.setVoid = function setVoid(x, y) {
    this._setValue(x, y, this.VOID);
  };
  Maze.prototype.setVisited = function setVisited(x, y) {
    this._setValue(x, y, this.VISITED);
  };
  Maze.prototype.setPlayerCell = function setPlayerCell(x, y) {
    this._setValue(x, y, this.PLAYER);
  };

  Maze.prototype.setGhost = function setGhost(x, y) {
    this._setValue(x, y, this.GHOST);
  };

  Maze.prototype.isGhost = function isGhost(x, y) {
    if (x < 0 || x >= this.width || y < 0 || y >= this.height) {
      return false;
    }
    return this._isValue(x, y, this.GHOST);
  };

  Maze.prototype.removeGhosts = function removeGhosts() {
    for (var i = 0, n = this.matrix.length; i < n; i++) {
      if (this.matrix[i] === this.GHOST) {
        this.matrix[i] = 0;
      }
    }
  };

  Maze.prototype.print = function print() {
    console.log("MAZE:");
    for (var y = 0; y < this.height; y++) {
      var row = "";
      for (var x = 0; x < this.width; x++) {
        row += this.isWall(x, y) ? "1" : this.isGhost(x, y) ? "2" : "0";
      }
      console.log(row);
    }
  };

  // Maze.prototype.cloneMatrix = function () {
  //   return this.matrix.slice(0);
  // };

  Maze.prototype.evalExplored = function () {
    var count = 0,
        i = 0,
        n = Array.isArray(this.matrix) ? this.matrix.length : 0;

    for (; i < n; i++) {
      if (this.matrix[i]) {
        count++;
      }
    }

    return n ? (100 * count / n).toFixed(2) : 0;
  };

  /**
   * @desc Deep copy the maze in order to return in a GET call, to avoid returning a maze
   *  that could be mid-updated by other process.
   */
  Maze.prototype.cloneMaze = function cloneMaze() {
    var copyMaze = {
      initialized: this.initialized,
      width: this.width,
      height: this.height,
      matrix: this.matrix.slice(0)
    };
    return copyMaze;
  };

  /**
   * @desc Creates a new maze instance
   */
  module.newMaze = function () {
    return new Maze();
  };
})(exports);