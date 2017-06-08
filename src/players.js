const mazes = require('./maze');

(function (module) {
  let _playersCount = 0,
    _players = {},
    _games = [];

  function Player(playerId) {
    this.id = playerId;
    this.position = {
      x: 0,
      y: 0
    };
    this.area = {
      xmin: 0,
      xmax: 0,
      ymin: 0,
      ymax: 0
    };
    this.maze = mazes.newMaze();
    this.index = ++_playersCount;
    this.time = _getTime();
    this.steps = 0;
    this._alreadyVisited = 0;
  }

  Player.prototype.addAlreadyVisited = function () {
    this._alreadyVisited++;
  };
  Player.prototype.getAlreadyVisited = function () {
    return this._alreadyVisited;
  };
  Player.prototype.resetAlreadyVisited = function () {
    this._alreadyVisited = 0;
  };


  /**
   * @desc Returns a player from its id
   */
  function _getPlayer(playerId) {
    if (!_players[playerId]) {
       _players[playerId] = new Player(playerId);

       // A game instance
       _games.push({
        id: playerId
       });
       _players[playerId].gameIdx = _games.length - 1;
    }
    return _players[playerId];
  }
  module.getPlayer = _getPlayer;


  /**
   * @desc Updates properties and states of player
   */
  function _updatePlayer(playerId, jsonPlayer) {
    let player = _getPlayer(playerId);

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
    };
  }
  module.updatePlayer = _updatePlayer;



  function _getTime() {
    var d = new Date();
    var datestring = d.getDate()  + "-" + (d.getMonth()+1) + "-" + d.getFullYear() + " " +
    d.getHours() + ":" + d.getMinutes() + ":" + d.getSeconds();

    return {
      date: (d.getDate()  + "-" + (d.getMonth()+1) + "-" + d.getFullYear()),
      hour: (d.getHours() + ":" + d.getMinutes() + ":" + d.getSeconds())
    };
  }

  /* ------------- DEBUG ------------------- */
  module.getGames = function () {
    const games = [];
    
    _games.forEach((game) => {
      const player = _players[game.id],
        gameState = 'running',
        explored = player ? player.maze.evalExplored() : 0;

      games.push({
        id: player.id,
        state: gameState,
        explored: explored,
        index: player.index,
        date: player.time
      });
    });

    return games;
  };

  module.getGame = function (playerId) {
    const player = _players[playerId],
      gameState = 'running',
      explored = player ? player.maze.evalExplored() : 0;

    if (player) {
      return {
        id: player.id,
        steps: player.steps,
        state: gameState,
        index: player.index,
        explored: explored,
        position: player.position,
        date: player.time,
        maze: player.maze.cloneMaze()
      };
    }

    return {};
  };

})(exports);