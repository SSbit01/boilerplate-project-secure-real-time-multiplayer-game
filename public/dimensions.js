let obj = {
  avatar: {
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
  collision: {
    width: 40,
    height: 40
  }
}

let x_l = obj.canvas.width-Math.max(obj.avatar.width, obj.star.width);
let y_l = obj.canvas.height-Math.max(obj.avatar.height, obj.star.height);

obj.random_x = () => Math.floor(Math.random()*x_l);
obj.random_y = () => Math.floor(Math.random()*y_l);

export default obj;