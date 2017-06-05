const restify = require('restify');
const mazeBot = require('./mazeBot');

const server = restify.createServer();
server.use(restify.bodyParser());


function _onName(req, res, next) {
  res.status(200);
  res.contentType = 'json';

  const name = "egueto-ext";// + (new Date()).getTime();
  const response = {
    name: name,
    email: "edgar.gueto@ext.privalia.com"
  };
  res.send(response);
}


function _onMove(req, res, next) {
  res.status(200);
  res.contentType = 'json';

  let moveResult = "right";
  try {
    const params = req.body || {};

    params.game = params.game || {};
    params.player = params.player || {};
    params.maze = params.maze || {};
    params.ghosts = params.ghosts || {};

    moveResult = mazeBot.processNextMovement(params);
  } catch(e) {
    console.error("EXCEPTION", e);
  }
  const response = {
    move: moveResult
  };
  res.send(response);
}

function _onHome(req, res, next) {
  res.status(200);
  res.contentType = 'json';

  const response = {
    hello: "This is an API for Privalia Code Challenge 2017 - egueto"
  };
  res.send(response); 
}

// Enable CORS
server.use(
  function crossOrigin(req,res,next){
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "X-Requested-With");
    return next();
  }
);

// Discovery API
server.get('/', _onHome);

// Challenge API
server.get('/name', _onName);
server.post('/name', _onName);
server.post('/move', _onMove);


// Debug API
const debugAPI = require('./debugAPI');
server.get('/games', debugAPI.onGetGames);

//var io = require('socket.io')(http);
const socketio = require('socket.io');
var io = socketio.listen(server);
io.sockets.on('connection', function (socket) {
    socket.emit('news', { hello: 'world' });
    socket.on('my other event', function (data) {
            console.log(data);
    });
});

// Finally, start the server
server.listen(8080, function () {});


