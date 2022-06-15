require("dotenv").config();


const express = require("express"),
      http = require("http"),
      cors = require("cors"),
      helmet = require("helmet"),
      {Server} = require("socket.io"),
      //
      fccTestingRoutes = require("./routes/fcctesting.js"),
      runner = require("./test-runner.js"),
      //
      Collectible = require("./public/scripts/Collectible.js").default,
      Player = require("./public/scripts/Player.js").default,
      //
      app = express(),
      server = http.createServer(app);


app.use("/public", express.static(process.cwd() + "/public"));
app.use("/favicon.ico", express.static("favicon.ico"));

app.use(express.json());
app.use(express.urlencoded({extended: true}));

app.use(cors({origin: "*"}));

app.use(helmet.noCache());
app.use(helmet.xssFilter());
app.use(helmet.noSniff());
app.use(helmet.hidePoweredBy({setTo: "PHP 7.4.3"}));


//
const dimensions = {
        player: {
          width: 32,
          height: 32
        },
        star: {
          width: 16,
          height: 16
        },
        canvas: {
          width: 800,
          height: 600
        },
        burst: {
          width: 40,
          height: 40
        },
        randomX() {
          return Math.floor(Math.random() * (this.canvas.width - Math.max(this.player.width, this.star.width)));
        },
        randomY() {
          return Math.floor(Math.random() * (this.canvas.height - Math.max(this.player.height, this.star.height)));
        }
      },
      //
      io = new Server(server),
      //
      stars = [],
      players = [],
      //
      speed = 10;


for (let id = 0; id < 4; id++) {
  stars.push(
    new Collectible({
      x: dimensions.randomX(),
      y: dimensions.randomY(),
      id
    })
  );
}


io.on("connection", socket => {
  const player = new Player({
    x: dimensions.randomX(),
    y: dimensions.randomY(),
    id: socket.id
  });
  
  socket.emit("initial", {
    stars,
    enemies: players,
    player,
    dimensions,
    speed
  });

  socket.broadcast.emit("new_enemy", player);

  players.push(player);
  
  
  socket.on("player_move", dir => {
    player.movePlayer(dir, speed);
    socket.broadcast.emit("enemy_move", {id: player.id, dir});
  });

  socket.on("star_pickup", id => {
    const star = stars.find(star => star.id == id);
    player.score += star.value;
    star.x = dimensions.randomX();
    star.y = dimensions.randomY();
    io.emit("new_star", star);
  });

  socket.on("disconnect", () => {
    players.splice(players.indexOf(player), 1);
    socket.broadcast.emit("enemy_disconnected", player.id);
  });
});
//


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
server.listen(portNum, () => {
  console.log(`Listening on port ${portNum}`);
  if (process.env.NODE_ENV === "test") {
    console.log("Running Tests...");
    setTimeout(function () {
      try {
        runner.run();
      } catch (error) {
        console.log("Tests are not valid:");
        console.error(error);
      }
    }, 1500);
  }
});

module.exports = app; // For testing