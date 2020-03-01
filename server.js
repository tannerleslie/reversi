/* Include the static file webserver library */
const static = require('node-static');

/* Include the http server library */
const http = require('http');

/* Assume we are running on Heroku */
let port = process.env.PORT;
let directory = __dirname + '/public';

/* If we aren't on Heroku */
if(typeof port == 'undefined' || !port){
  directory = './public';
  port = 8080;
}

/* Set up static webserver */
const file = new static.Server(directory);

/* Construct http server */
const app = http.createServer(
  function(request,response){
    request.addListener('end',
      function(){
        file.serve(request,response);
      }).resume();
    }
  ).listen(port);

  console.log('The server is running');
