require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const expect = require('chai');

const fccTestingRoutes = require('./routes/fcctesting.js');
const runner = require('./test-runner.js');

const app = express();

//
const helmet = require("helmet");
app.use(helmet.xssFilter());
app.use(helmet.noSniff());
app.use(helmet.noCache());
app.use(helmet.hidePoweredBy({setTo:"PHP 7.4.3"}));

const cors = require("cors");
app.use(cors({origin: "*"}));
//


//
const dimensions = require("./public/dimensions.js").default;
const Collectible = require("./public/Collectible.mjs");
const http = require("http").createServer(app);
const io = require('socket.io')(http);

let stars = [];
for (let i=0; i < 3; i++) {
  stars.push(
    new Collectible({
      x: dimensions.random_x(),
      y: dimensions.random_y(),
      score: 1,
      id: i
    })
  );
}

let players_arr = [];
io.on("connection", socket => {
  socket.emit("stars", stars);
  socket.emit("enemies", players_arr);
  var player_id;
  socket.on("emit_player", player => {
    socket.broadcast.emit("new_player", player);
    player_id = player.id;
    players_arr.push(player);
  });
  socket.on("move", player => {
    players_arr[players_arr.findIndex(p=>p.id==player_id)] = player;
    socket.broadcast.emit("an_enemy_has_moved", player);
  });
  socket.on("star_pickup", arr => {
    let score = arr[0];
    players_arr[players_arr.findIndex(p=>p.id==player_id)].score = score;
    let star = arr[1];
    stars[stars.findIndex(s=>s.id==star.id)] = star;
    socket.broadcast.emit("an_enemy_has_collected_a_star", [{id:player_id,score:score},star]);
  });
  socket.on("collision", () => {
    players_arr.splice(players_arr.findIndex(p=>p.id==player_id), 1);
    socket.broadcast.emit("an_enemy_has_disconnected", player_id);
  });
  socket.on("disconnect", () => {
    console.log("a player has disconnected");
    players_arr.splice(players_arr.findIndex(p=>p.id==player_id), 1);
    socket.broadcast.emit("an_enemy_has_disconnected", player_id);
  });
});
//

app.use('/public', express.static(process.cwd() + '/public'));
app.use('/assets', express.static(process.cwd() + '/assets'));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Index page (static HTML)
app.route('/')
  .get(function (req, res) {
    res.sendFile(process.cwd() + '/views/index.html');
  }); 

//For FCC testing purposes
fccTestingRoutes(app);
    
// 404 Not Found Middleware
app.use(function(req, res, next) {
  res.status(404)
    .type('text')
    .send('Not Found');
});

const portNum = process.env.PORT || 3000;

// Set up server and tests
const server = http.listen(portNum, () => {
  console.log(`Listening on port ${portNum}`);
  if (process.env.NODE_ENV==='test') {
    console.log('Running Tests...');
    setTimeout(function () {
      try {
        runner.run();
      } catch (error) {
        console.log('Tests are not valid:');
        console.error(error);
      }
    }, 1500);
  }
});

module.exports = app; // For testing