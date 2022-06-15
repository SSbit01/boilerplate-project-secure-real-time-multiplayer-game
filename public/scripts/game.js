import Player from "./Player.js";

const socket = io(),
      //
      scoreEl = document.getElementById("score"),
      rankEl = document.getElementById("rank"),
      // SOUNDS
      starSound = new Audio("public/assets/sounds/Star.mp3"),
      connectedSound = new Audio("public/assets/sounds/Connected.mp3"),
      //
      canvas = document.getElementById("game-window"),
      ctx = canvas.getContext('2d'),
      // SPRITES
      playerSprite = new Image(),
      enemySprite = new Image(),
      starSprite = new Image();

playerSprite.src = "public/assets/sprites/Player.png";
enemySprite.src = "public/assets/sprites/Enemy.png";
starSprite.src = "public/assets/sprites/Star.png";

let player, stars, enemies, dimensions, speed;


function displayScore() {
  scoreEl.innerText = player.score;
  rankEl.innerText = player.calculateRank([player, ...enemies]);
}


function checkStarCollision(star) {
  if (player.collision(star)) {
    stars.splice(stars.findIndex(({id}) => star.id == id), 1);
    
    displayScore();
    
    starSound.currentTime = 0;
    starSound.play();
    
    socket.emit("star_pickup", star.id);

    return true;
  }
  
  return false;
}


function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.beginPath();

  ctx.drawImage(playerSprite, player.x - dimensions.player.width / 2, player.y - dimensions.player.height / 2, dimensions.player.width, dimensions.player.height);

  for (const enemy of enemies) {
    for (let i = stars.length - 1; i >= 0; i--) {
      const star = stars[i];
      if (enemy.collision(star)) {
        stars.splice(stars.findIndex(({id}) => star.id == id), 1);
        displayScore();
      }
    }
    ctx.drawImage(enemySprite, enemy.x - dimensions.player.width / 2, enemy.y - dimensions.player.height / 2, dimensions.player.width, dimensions.player.height);
  }
  
  for (let i = stars.length - 1; i >= 0; i--) {
    const star = stars[i];
    if (!checkStarCollision(star)) {
      ctx.drawImage(starSprite, star.x - dimensions.star.width / 2, star.y - dimensions.star.width / 2, dimensions.star.width, dimensions.star.height);
    }
  }
}



socket.on("initial", data => {
  connectedSound.play();
  
  player = new Player(data.player);
  stars = data.stars;
  enemies = data.enemies.map(enemy => new Player(enemy));
  dimensions = data.dimensions;
  speed = data.speed;

  canvas.width = dimensions.canvas.width;
  canvas.height = dimensions.canvas.height;

  displayScore();

  draw();

  document.addEventListener("keydown", ({code}) => {
    let dir;
    if (["ArrowUp", "KeyW"].includes(code) && player.y > speed) {
      dir = "up";
    } else if (["ArrowRight", "KeyD"].includes(code) && dimensions.canvas.width - player.x - dimensions.player.width > speed) {
      dir = "right";
    } else if (["ArrowDown", "KeyS"].includes(code) && dimensions.canvas.height - player.y - dimensions.player.height > speed) {
      dir = "down";
    } else if (["ArrowLeft", "KeyA"].includes(code) && player.x > speed) {
      dir = "left";
    }
    if (dir) {
      player.movePlayer(dir, speed);
      draw();
      socket.emit("player_move", dir);
    }
  });
});


socket.on("enemy_move", ({id, dir}) => {
  enemies.find(enemy => enemy.id == id).movePlayer(dir, speed);
  draw();
});


socket.on("new_star", star => {
  stars.push(star);
  
  if (!checkStarCollision(star)) {
    draw();
  }
});


socket.on("new_enemy", enemy => {
  enemies.push(new Player(enemy));
  rankEl.innerText = player.calculateRank([player, ...enemies]);
  draw();
});


socket.on("enemy_disconnected", id => {
  const enemy = enemies.find(enemy => enemy.id == id);
  enemies.splice(enemies.indexOf(enemy), 1);
  rankEl.innerText = player.calculateRank([player, ...enemies]);
  draw();
});