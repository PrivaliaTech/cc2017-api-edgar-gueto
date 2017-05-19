const restify = require('restify');

let count = 0;
function respond(req, res, next) {
  res.send('[' + (count++) + '] hello ' + req.params.name);
}

const server = restify.createServer();
server.get('/hello/:name', respond);

server.listen(8080, function () {
  console.log('%s listening at %s', server.name, server.url);
});
