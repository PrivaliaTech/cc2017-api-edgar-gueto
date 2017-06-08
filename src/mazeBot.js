const algorithm = require('./algorithm');
const players = require('./players');


function _updateMaze(playerId, jsonMaze) {

  const player = players.getPlayer(playerId),
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
        playerMaze.setVoid(col, row);
      }
    }
  }

  // Update player pos:
  if (player.prevPosition && player.prevPosition !== undefined) {
    playerMaze.setVisited(player.prevPosition.x, player.prevPosition.y);
  }

  // Count how many steps in a row are over already visited ones...
  if (playerMaze.getAt(player.position.x, player.position.y) === playerMaze.VISITED) {
    player.addAlreadyVisited();
  } else {
    player.resetAlreadyVisited();
  }

  playerMaze.setPlayerCell(player.position.x, player.position.y);
}

function _updateGhosts(playerId, ghosts) {
  const player = players.getPlayer(playerId),
    playerMaze = player.maze;

  playerMaze.removeGhosts();

  if (Array.isArray(ghosts)) {
    ghosts.forEach(function (ghost) {
      playerMaze.setGhost(ghost.x, ghost.y);
    });
  }
}

function _processNextMovement(jsonState) {
  const jsonPlayer = jsonState.player,
    playerId = jsonPlayer.id;
  
  players.updatePlayer(jsonPlayer.id, jsonPlayer);
  _updateMaze(playerId, jsonState.maze);
  _updateGhosts(playerId, jsonState.ghosts);

  const player = players.getPlayer(playerId);

  let nextMovement = algorithm.calcNextMovement(playerId, player.maze, player.position, player.steps, player);
  player.steps++;


//console.log("MOVE: ", nextMovement);

  return nextMovement;
}

exports.processNextMovement = _processNextMovement;

// ----------- DEBUG API -------------------


exports.getGames = players.getGames;
exports.getGame = players.getGame;