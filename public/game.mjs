import Player from './Player.mjs';
//import Collectible from './Collectible.mjs';
import dimensions from "./dimensions.js";

const socket = io();
//
const canvas = document.getElementById('game-window');
canvas.width = dimensions.canvas.width;
canvas.height = dimensions.canvas.height;
const context = canvas.getContext('2d');
//
const p_avatar = document.getElementById("p_avatar");
const enemy_avatar = document.getElementById("enemy_avatar");
const star_png = document.getElementById("star_png");
const explosion_png = document.getElementById("explosion");
//
const speed = 10;
const respawn_time = 2500; 
//
const score = document.getElementById("score");
const rank = document.getElementById("rank");
// SOUNDS
const star_pickup = document.getElementById("star_pickup");
const collision = document.getElementById("collision_audio");
const connected = document.getElementById("connected");
//

document.getElementsByTagName("BODY")[0].style.minWidth = `${document.getElementById("game-container").offsetWidth}px`;

//
var id = Date.now();
var you = new Player({
  x: dimensions.random_x(),
  y: dimensions.random_y(),
  score: 0,
  id: id
});
score.innerHTML = you.score;
socket.emit("emit_player", you);
//

//
var stars;
var enemies;
var explosions = [];
//

//
function draw_player() {
  if (you.collision.toString() == "() => false") {
    context.drawImage(
      explosion_png,
      you.x,
      you.y
    );
  } else {
    context.drawImage(
      p_avatar,
      you.x,
      you.y
    );
  }
}
function check_star_pickup(star) {
  if (you.collision(star)) {
    star_pickup.currentTime = 0;
    star_pickup.play();
    score.innerHTML = you.score;
    display_rank();
    star.x = dimensions.random_x();
    star.y = dimensions.random_y();
    socket.emit("star_pickup", [you.score, star]);
  }
  return star;
}
function draw_stars(check) {
  if (check) {
    for (let star of stars) {
      let f_star = check_star_pickup(star);
      context.drawImage(
        star_png,
        f_star.x,
        f_star.y
      );
    }
  } else {
    for (let star of stars) {
      context.drawImage(
        star_png,
        star.x,
        star.y
      );
    }
  }
}
function collision_with_an_enemy() {
  collision.currentTime = 0;
  collision.play();
  let score_val = you.score;
  score.innerHTML = score_val;
  display_rank();
  socket.emit("collision");
  you.collision = () => false;
  document.removeEventListener("keydown", move);
  setTimeout(() => {
    you = new Player({
      x: dimensions.random_x(),
      y: dimensions.random_y(),
      score: score_val,
      id: id
    });
    socket.emit("emit_player", you);
    redraw(true, true);
    document.addEventListener("keydown", move);
    connected.play();
  }, respawn_time);
}
function draw_enemies(check) {
  if (check) {
    for (let enemy of enemies) {
      if (you.collision(enemy)) {
        collision_with_an_enemy();
      } else {
        context.drawImage(
          enemy_avatar,
          enemy.x,
          enemy.y
        );
      }
    }
  } else {
    for (let enemy of enemies) {
      context.drawImage(
        enemy_avatar,
        enemy.x,
        enemy.y
      );
    }
  }
}
function draw_explosions() {
  for (let explosion of explosions) {
    context.drawImage(
      explosion_png,
      explosion.x,
      explosion.y
    )
  }
}
function redraw(check_enemies, check_stars) {
  context.clearRect(0, 0, canvas.width, canvas.height);
  draw_enemies(check_enemies);
  draw_player();
  draw_stars(check_stars);
  draw_explosions();
}
function display_rank() {
  let players = [...enemies];
  players.push(you);
  rank.innerHTML = you.calculateRank(players);
}
//

//
socket.on("stars", arr => {
  stars = arr;
  draw_stars(true);
});
socket.on("enemies", arr => {
  connected.play();
  enemies = arr;
  console.log(you.id);
  draw_enemies(true);
  draw_player();
  display_rank();
});
//

//
function move(e) {
  let dir = "";
  let kc = e.keyCode;
  if ([87, 38].includes(kc)) {
    dir = "up";
  } else if ([68, 39].includes(kc)) {
    dir = "right";
  } else if ([83, 40].includes(kc)) {
    dir = "down";
  } else if ([65, 37].includes(kc)) {
    dir = "left";
  } else {
    return;
  }
  you.movePlayer(dir, speed);
  socket.emit("move", you);
  redraw(true, true);
};
document.addEventListener("keydown", move);
//

//
socket.on("new_player", enemy => {
  enemies.push(enemy);
  if (you.collision(enemy)) {
    collision_with_an_enemy();
  } else {
    context.drawImage(
      enemy_avatar,
      enemy.x,
      enemy.y
    );
    display_rank();
  }
});
socket.on("an_enemy_has_moved", enemy => {
  enemies[enemies.findIndex(p=>p.id==enemy.id)] = enemy;
  if (you.collision(enemy)) {
    collision_with_an_enemy();
  } else {
    redraw(false, false);
  }
});
socket.on("an_enemy_has_collected_a_star", arr => {
  let enemy = arr[0];
  enemies[enemies.findIndex(p=>p.id==enemy.id)].score = enemy.score;
  let star = arr[1];
  stars[stars.findIndex(s=>s.id==star.id)] = check_star_pickup(star);
  display_rank();
  redraw(false, false);
});
socket.on("an_enemy_has_disconnected", enemy_id => {
  let enemy = enemies.find(p=>p.id==enemy_id);
  enemies.splice(enemies.indexOf(enemy),1);
  display_rank();
  let explosion_id = Date.now();
  explosions.push({
    x: enemy.x,
    y: enemy.y,
    id: explosion_id
  });
  redraw(false, false);
  setTimeout(() => {
    explosions.splice(explosions.findIndex(e=>e.id==explosion_id),1);
    redraw(false, false);
  }, respawn_time);
});
//
