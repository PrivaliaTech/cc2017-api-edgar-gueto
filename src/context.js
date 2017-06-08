(function (module) {
  const TO_LEFT = "left";
  const TO_RIGHT = "right";
  const TO_TOP = "up";
  const TO_BOTTOM = "down";

  let _contexts = {};


  module.getContext = function (playerId) {
    if (!_contexts[playerId]) {
      _contexts[playerId] = new Context(playerId);
    }
    return _contexts[playerId];
  };


  function Context(playerId) {
    this.playerId = playerId;
    this.initialized = false;
    this.resistanceMatrix = [];
    this.matrix = [];
    this.logs = [];
    this.width = 0;
    this.height = 0;
    this.VISITED = 1;

    this.lastMov = null;
  }

  Context.prototype.visit = function visit(x, y) {
    const idx = x + this.width * y;
    this.matrix[idx] = this.VISITED;

    if (!this.resistanceMatrix[idx]) {
      this.resistanceMatrix[idx] = 1;
    }
  };

  Context.prototype.visited = function visited(x, y) {
    if (x < 0 || x >= this.width || y < 0 || y >= this.height) {
      return true;
    }
    const idx = x + this.width * y;
    return this.matrix[idx] === this.VISITED;
  };

  Context.prototype.getResistance = function getResistance(x, y) {
    if (x < 0 || x >= this.width || y < 0 || y >= this.height) {
      return 9999999;
    }
    const idx = x + this.width * y;
    return this.resistanceMatrix[idx] === undefined ? 0 : this.resistanceMatrix[idx];
  };

  Context.prototype.initialize = function initialize(maze, playerPos) {
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
  };

  Context.prototype.explore = function explore(playerPos, displacement, dir) {
    this.visit(playerPos.x + displacement.x, playerPos.y + displacement.y);

    this.setLastMov(dir);
  };

  Context.prototype.print = function print(n) {
    console.log("EXPLORED:" + n);
    for (let y = 0; y < this.height; y ++) {
      let row = "";
      for (let x = 0; x < this.width; x++) {
        row += this.visited(x, y) ? "1" : "0";
      }
      console.log(row);
    }
  };

  Context.prototype.setLastMov = function setLastMov(mov) {
    this.lastMov = mov;
  };

  /**
   * @desc Checks if the 'mov' is the opposite of the last movement done by the player.
   */
  Context.prototype.isOpposite = function isOpposite(mov) {
    if (!this._opposites) {
      this._opposites = {};

      this._opposites[TO_LEFT] = TO_RIGHT;
      this._opposites[TO_RIGHT] = TO_LEFT;
      this._opposites[TO_TOP] = TO_BOTTOM;
      this._opposites[TO_BOTTOM] = TO_TOP;
    }
    return this._opposites[this.lastMov] === mov;
  }

  Context.prototype.addLog = function (details) {
    this.logs.push(details);
  };
})(exports);
