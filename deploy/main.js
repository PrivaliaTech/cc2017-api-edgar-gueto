'use strict';

var restify = require('restify');
var mazeBot = require('./mazeBot');

var server = restify.createServer();

server.use(restify.bodyParser());

function _onName(req, res, next) {
  res.status(200);
  res.contentType = 'json';

  var name = "egueto-ext"; // + (new Date()).getTime();
  var response = {
    name: name,
    email: "edgar.gueto@ext.privalia.com"
  };
  res.send(response);
}

function _onMove(req, res, next) {
  res.status(200);
  res.contentType = 'json';

  var moveResult = "right";
  try {
    var params = req.body || {};

    params.game = params.game || {};
    params.player = params.player || {};
    params.maze = params.maze || {};
    params.ghosts = params.ghosts || {};

    moveResult = mazeBot.processNextMovement(params);
  } catch (e) {
    console.error("EXCEPTION", e);
  }
  var response = {
    move: moveResult
  };
  res.send(response);
}

function _onHome(req, res, next) {
  res.status(200);
  res.contentType = 'json';

  var response = {
    hello: "This is an API for Privalia Code Challenge 2017 - egueto"
  };
  res.send(response);
}

// Enable CORS
server.use(function crossOrigin(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "X-Requested-With");
  return next();
});

// Discovery API
server.get('/', _onHome);

// Challenge API
server.get('/name', _onName);
server.post('/name', _onName);
server.post('/move', _onMove);

// Debug API
var debugAPI = require('./debugAPI');
server.get('/games', debugAPI.onGetGames);
server.get('/game/:gameId', debugAPI.onGetGame);
// var server2 = require("net").createServer();
// var io = require("socket.io")(server2);

// var handleClient = function (socket) {
//   console.log("socket::connection");
//     // we've got a client connection
//     socket.emit("tweet", {user: "nodesource", text: "Hello, world!"});
// };

// io.on("connection", handleClient);

// server2.listen(9090);


// Finally, start the server
server.listen(8080, function () {});