'use strict';

var algorithm = require('./algorithm');
var players = require('./players');

// function _newMaze() {

//   // const CELL_VALUES = {
//   //   0: 'unknown',
//   //   1: 'wall',
//   //   2: 'ghost',
//   //   3: 'neutralGhost',
//   //   4: 'goal',
//   //   5: 'start',
//   //   6: 'void',
//   //   7: 'player'
//   // };

//   return {
//     initialized: false,
//     width: 0,
//     height: 0,
//     size: 0,
//     matrix: [],

//     WALL: 1,
//     GHOST: 2,
//     //NEUTRAL_GHOST: 3,
//     GOAL: 4,
//     START: 5,
//     VOID: 6,
//     PLAYER: 7,
//     VISITED: 8,

//     init: function (jsonMaze, playerPos) {
//       this.initialized = true;
//       this.width = jsonMaze.size.width;
//       this.height = jsonMaze.size.height;
//       this.size = this.width * this.height;
//       this.goal = {
//         x: jsonMaze.goal.x,
//         y: jsonMaze.goal.y
//       };
//       this.start = {
//         x: playerPos.x,
//         y: playerPos.y
//       };

//       this.matrix = [];

//       let size = this.width * this.height;
//       while(size--) {
//         this.matrix[size] = 0;
//       }

//       this._setValue(this.goal.x, this.goal.y, this.GOAL);
//       this._setValue(playerPos.x, playerPos.y, this.START);
//     },

//     _setValue: function _setValue(x, y, v) {
//       const idx = x + this.width * y;
//       this.matrix[idx] = v;    
//     },
//     _isValue: function _isValue(x, y, v) {
//       const idx = x + this.width * y;
//       return this.matrix[idx] === v;
//     },
//     getAt: function (x, y) {
//       const idx = x + this.width * y;
//       return this.matrix[idx];
//     },

//     setWall: function setWall(x, y) {
//       this._setValue(x, y, this.WALL);
//     },
//     isWall: function isWall(x, y) {
//       if (x < 0 || x >= this.width || y < 0 || y >= this.height) {
//         return true;
//       }
//       return this._isValue(x, y, this.WALL);
//     },
//     setGhost: function setGhost(x, y) {
//       this._setValue(x, y, this.GHOST);
//     },
//     isGhost: function isGhost(x, y) {
//       if (x < 0 || x >= this.width || y < 0 || y >= this.height) {
//         return false;
//       }
//       return this._isValue(x, y, this.GHOST);
//     },
//     removeGhosts: function removeGhosts() {
//       for (let i = 0, n = this.matrix.length; i < n; i++) {
//         if (this.matrix[i] === this.GHOST) {
//           this.matrix[i] = 0;
//         }
//       }
//     },
//     print: function print() {
//       console.log("MAZE:");
//       for (let y = 0; y < this.height; y ++) {
//         let row = "";
//         for (let x = 0; x < this.width; x++) {
//           row += this.isWall(x, y) ? "1" : (this.isGhost(x, y) ? "2" : "0");
//         }
//         console.log(row);
//       }
//     },
//     cloneMatrix: function () {
//       return this.matrix.slice(0);
//     },
//     evalExplored: function() {
//       let count = 0,
//         i = 0,
//         n = Array.isArray(this.matrix) ? this.matrix.length : 0;

//       for (; i < n; i++) {
//         if (this.matrix[i]) {
//           count++;
//         }
//       }

//       return n ? ((100 * count) / n).toFixed(2) : 0;
//     }
//   };
// }


function _updateMaze(playerId, jsonMaze) {

  var player = players.getPlayer(playerId),
      playerMaze = player.maze;

  if (!playerMaze.initialized) {
    playerMaze.init(jsonMaze, player.position);
  }

  // Update walls:
  jsonMaze.walls.forEach(function (wall) {
    playerMaze.setWall(wall.x, wall.y);
  });

  // Update known area
  for (var col = player.area.xmin; col <= player.area.xmax; col++) {
    for (var row = player.area.ymin; row <= player.area.ymax; row++) {
      var v = playerMaze.getAt(col, row);
      if (v === 0) {
        playerMaze.setVoid(col, row);
      }
    }
  }

  // Update player pos:
  if (player.prevPosition && player.prevPosition !== undefined) {
    playerMaze.setVisited(player.prevPosition.x, player.prevPosition.y);
  }
  playerMaze.setPlayerCell(player.position.x, player.position.y);
}

function _updateGhosts(playerId, ghosts) {
  var player = players.getPlayer(playerId),
      playerMaze = player.maze;

  playerMaze.removeGhosts();

  if (Array.isArray(ghosts)) {
    ghosts.forEach(function (ghost) {
      playerMaze.setGhost(ghost.x, ghost.y);
    });
  }
}

function _processNextMovement(jsonState) {
  var jsonPlayer = jsonState.player,
      playerId = jsonPlayer.id;

  players.updatePlayer(jsonPlayer.id, jsonPlayer);
  _updateMaze(playerId, jsonState.maze);
  _updateGhosts(playerId, jsonState.ghosts);

  var player = players.getPlayer(playerId);

  var nextMovement = algorithm.calcNextMovement(playerId, player.maze, player.position, player.steps);
  player.steps++;

  console.log("MOVE: ", nextMovement);

  return nextMovement;
}

exports.processNextMovement = _processNextMovement;

// ----------- DEBUG API -------------------


exports.getGames = players.getGames;
exports.getGame = players.getGame;