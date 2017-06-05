const mazeBot = require('./mazeBot');

function _onGetGames(req, res, next) {
  res.status(200);
  res.contentType = 'json';

  const response = {
    games: mazeBot.getGames()
  };
  res.send(response); 
}

exports.onGetGames = _onGetGames;

