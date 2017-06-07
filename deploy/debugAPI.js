'use strict';

var mazeBot = require('./mazeBot');
var algorithm = require('./algorithm');

function _onGetGames(req, res, next) {
  res.status(200);
  res.contentType = 'json';

  var response = {
    games: mazeBot.getGames()
  };
  res.send(response);
}

function _onGetGame(req, res, next) {
  res.status(200);
  res.contentType = 'json';

  var playerId = req.params.gameId;
  res.send({
    game: mazeBot.getGame(playerId),
    context: algorithm.flushDebugInfo(playerId)
  });
}

exports.onGetGame = _onGetGame;
exports.onGetGames = _onGetGames;