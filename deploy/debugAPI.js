'use strict';

var mazeBot = require('./mazeBot');

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
  res.send(mazeBot.getGame(playerId));
}

exports.onGetGame = _onGetGame;
exports.onGetGames = _onGetGames;