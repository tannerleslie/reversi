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

/* Set up the web socket server */

var players = [];

var io = require('socket.io').listen(app);

io.sockets.on('connection', function (socket){
  log('Client connection by '+socket.id);

  function log(){
    var array = ['*** Server Log Message: '];
    for(var i = 0; i < arguments.length; i++){
      array.push(arguments[i]);
      console.log(arguments[i]);
    }
    socket.emit('log',array);
    socket.broadcast.emit('log',array);
  }


  /*join_room command*/
  /*payload:
  {
    'room': room to join,
    'username': username of person joining
  }
  join_room_response:
  {
    'result': 'success',
    'room': room joined,
    'username': username that joined,
    'socket_id': the socket id of the person that joined,
    'membership': number of people in the room
  }
  or
  {
    'result': 'fail',
    'message': failure message
  }
  */
  socket.on('join_room',function(payload){
    log("'join_room' command"+JSON.stringify(payload));
    if(('undefined' === typeof payload) || !payload){
      var error_message = 'join_room had no payload, command aborted';
      log(error_message);
      socket.emit('join_room_response',{
        result: 'fail',
        message: error_message
      });
      return;
    }
    var room = payload.room;
    if(('undefined' === typeof room) || !room){
      var error_message = 'join_room did not specify a room, command aborted';
      log(error_message);
      socket.emit('join_room_response',{
        result: 'fail',
        message: error_message
      });
      return;
    }
    var username = payload.username;
    if(('undefined' === typeof username) || !username){
      var error_message = 'join_room did not specify a username, command aborted';
      log(error_message);
      socket.emit('join_room_response',{
        result: 'fail',
        message: error_message
      });
      return;
    }

    players[socket.id] = {};
    players[socket.id].username = username;
    players[socket.id].room = room;

    socket.join(room);

    var roomObject = io.sockets.adapter.rooms[room];

    var numClients = roomObject.length;
    var success_data = {
      result: 'success',
      room: room,
      username: username,
      socket_id: socket.id,
      membership: numClients
    } ;
    io.in(room).emit('join_room_response',success_data);

    for(var socket_in_room in roomObject.sockets){
      var success_data = {
        result: 'success',
        room: room,
        username: players[socket_in_room].username,
        socket_id: socket_in_room,
        membership: numClients
      };
      socket.emit('join_room_response',success_data);
    }

    log('join_room success');
  });

  socket.on('disconnect',function(socket){
    log('Client disconnected '+JSON.stringify(players[socket.id]));

    if('undefined' !== typeof players[socket.id] && players[socket.id]){
      var username = players[socket.id].username;
      var room = players[socket.id].room;
      var payload = {
        username: username,
        socket_id: socket.id
      };
      delete players[socket.id];
      io.in(room).emit('player_disconnected',payload);
    }
  });

/*send_message command*/
/*payload:
{
  'room': room to join,
  'username': username of person joining
  'message' : the message to send
}
send_message_response:
{
  'result': 'success',
  'username': username the person sending the message,
  'message': the message sent
}
or
{
  'result': 'fail',
  'message': failure message
}
*/

socket.on('send_message',function(payload){
  log('server reveived a command','send_message',payload);
  if(('undefined' === typeof payload) || !payload){
    var error_message = 'send_message had no payload, command aborted';
    log(error_message);
    socket.emit('send_message_response',{
      result: 'fail',
      message: error_message
    });
    return;
  }
  var room = payload.room;
  if(('undefined' === typeof room) || !room){
    var error_message = 'send_message did not specify a room, command aborted';
    log(error_message);
    socket.emit('send_message_response',{
      result: 'fail',
      message: error_message
    });
    return;
  }
  var username = payload.username;
  if(('undefined' === typeof username) || !username){
    var error_message = 'send_message did not specify a username, command aborted';
    log(error_message);
    socket.emit('send_message_response',{
      result: 'fail',
      message: error_message
    });
    return;
  }
  var message = payload.message;
  if(('undefined' === typeof message) || !message){
    var error_message = 'send_message did not specify a message, command aborted';
    log(error_message);
    socket.emit('send_message_response',{
      result: 'fail',
      message: error_message
    });
    return;
  }

  var success_data = {
    result: 'success',
    room: room,
    username: username,
    message: message
  };
  io.sockets.in(room).emit('send_message_response',success_data);
  log('Message sent to room '+room+' by '+username);
});

});
