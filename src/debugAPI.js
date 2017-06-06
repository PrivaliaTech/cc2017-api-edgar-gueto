const mazeBot = require('./mazeBot');

function _onGetGames(req, res, next) {
  res.status(200);
  res.contentType = 'json';

  const response = {
    games: mazeBot.getGames()
  };
  res.send(response); 
}

function _onGetGame(req, res, next) {
  res.status(200);
  res.contentType = 'json';

  const playerId = req.params.gameId;
  res.send(mazeBot.getGame(playerId)); 
}

exports.onGetGame = _onGetGame;
exports.onGetGames = _onGetGames;

