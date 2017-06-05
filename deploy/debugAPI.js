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

exports.onGetGames = _onGetGames;