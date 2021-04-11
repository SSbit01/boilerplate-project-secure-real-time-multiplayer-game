import dimensions from "./dimensions.js";


class Player {
  constructor({x, y, score, id}) {
    this.x = x;
    this.y = y;
    this.score = score;
    this.id = id;
  }

  movePlayer(dir, speed) {
    switch(dir) {
      case "up":
        this.y -= speed;
        if (this.y < 0) {
          this.y += dimensions.canvas.height;
        }
        break;
      case "right":
        this.x += speed;
        if (this.x > dimensions.canvas.width) {
          this.x -= dimensions.canvas.width;
        }
        break;
      case "down":
        this.y += speed;
        if (this.y > dimensions.canvas.height) {
          this.y -= dimensions.canvas.height;
        }
        break;
      case "left":
        this.x -= speed;
        if (this.x < 0) {
          this.x += dimensions.canvas.width;
        }
    }
  }

  collision(item) {
    let p_x = this.x + dimensions.avatar.width/2;
    let p_y = this.y + dimensions.avatar.height/2;
    if (
      Object.keys(item).includes("score") &&
      Math.abs(item.x+dimensions.avatar.width/2-p_x) < dimensions.avatar.width &&
      Math.abs(item.y+dimensions.avatar.height/2-p_y) < dimensions.avatar.height
    ) {
      this.score -= 1;
      return true;
    } else if (
      Math.abs(item.x+dimensions.star.width/2-p_x) < dimensions.star.width &&
      Math.abs(item.y+dimensions.star.height/2-p_y) < dimensions.star.height
    ) {
      this.score += 1;
      return true;
    }
    return false;
  }

  calculateRank(arr) {
    let rank = 1;
    for (let player of arr) {
      if (this.score < player.score && player.id != this.id) {
        rank++;
      }
    }
    return `Rank: ${rank}/${arr.length}`;
  }
}

export default Player;