export default class {
  constructor({x, y, score = 0, id}) {
    this.x = x;
    this.y = y;
    this.score = score;
    this.id = id;
  }

  movePlayer(dir, speed) {
    switch(dir) {
      case "up":
        this.y -= speed;
        break;
      case "right":
        this.x += speed;
        break;
      case "down":
        this.y += speed;
        break;
      case "left":
        this.x -= speed;
    }
  }

  collision(item) {
    if (Math.abs(item.x - this.x) <= 16 && Math.abs(item.y - this.y) <= 16) {
      this.score += item.value;
      return true;
    }
    return false;
  }

  calculateRank(players) {
    let rank = 1;
    for (const player of players) {
      if (this.score < player.score && player.id != this.id) {
        rank++;
      }
    }
    return `Rank: ${rank}/${players.length}`;
  }
}