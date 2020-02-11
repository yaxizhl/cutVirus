class virusController {
  constructor(bottom, backgroundColor, zIndex, moveColor) {
    this.bottom = bottom || 0;
    this.backgroundColor = backgroundColor || "rgba(0,0,0,1)";
    this.zIndex = zIndex || 1;
    this.moveColor = moveColor || "#fff";
    // 初始化图片DOM
    this.img = new Image();
    this.imgTop = new Image();
    this.imgBottom = new Image();
    this.coinImg = new Image();
    this.img.src = "/virus.png";
    this.coinImg.src = "/coin.png";
    this.winWidth = document.documentElement.clientWidth;
    this.winHeight = document.documentElement.clientHeight;
    this.canvas = null;
    this.ctx = null;
    // 病毒
    this.virusBox = [];
    // 手指move点
    this.movePoints = [];
    // 病毒裂开点
    this.splitPoints = [];
    // 硬币点
    this.coinPoints = [];
    // 得分
    this.score = 0;
    // 时间
    this.time = 60;
    // 剩余时间
    this.timer = 0;
    this.loop = true;
    this.init();
  }
  // 初始化
  init() {
    this.canvas = document.createElement("canvas");
    this.canvas.id = "red-pack-canvas";
    this.canvas.style.background = this.backgroundColor;
    this.canvas.style.zIndex = this.zIndex;
    this.canvas.style.position = "absolute";
    this.canvas.style.top = 0;
    this.canvas.width = this.winWidth;
    this.canvas.height = this.winHeight - this.bottom;
    this.canvas.left = 0;
    this.canvas.top = 0;
    document.body.appendChild(this.canvas);
    this.ctx = this.canvas.getContext("2d");
    // 添加事件
    this.canvas.addEventListener("touchmove", e => {
      let touch = e.touches[0];
      let obj = {
        x: touch["clientX"],
        y: touch["clientY"],
        count: 20
      };
      if (this.movePoints.length >= 22) {
        this.movePoints.shift();
      }
      this.movePoints.push(obj);
      e.preventDefault();
      e.stopPropagation();
    });
    this.canvas.addEventListener("touchend", e => {
      this.movePoints = [];
      e.preventDefault();
      e.stopPropagation();
    });
  }
  // 入口-开启绘画
  start(callback) {
    // 开始时间
    let startTime = new Date().getTime();
    this.img.addEventListener("load", () => {
      let t = 0;
      setInterval(() => {
        this.gVirus(t++ % 2 !== 0);
      }, 300);
    });
    this.drawFrame(callback);
    // 清除滑动痕迹
    setInterval(() => {
      this.movePoints.shift();
      let t = new Date().getTime();
      this.timer = (t - startTime) / 1000;
      // 结束游戏
      if (this.timer >= this.time) {
        this.loop = false;
      }
    }, 24);
  }
  setScore() {
    this.ctx.fillStyle = "#fff";
    this.ctx.font = "18px bold 黑体";
    this.ctx.fillText("score: " + this.score, 10, 30);
    this.ctx.fillText("time: " + Math.round(this.time - this.timer), 10, 50);
  }
  drawFrame(callback) {
    this.ctx.clearRect(0, 0, this.winWidth, this.winHeight - this.bottom);
    this.setScore();
    if (!this.loop) {
      setTimeout(() => {
        this.score = 0;
        // document.body.removeChild(this.canvas);
        typeof callback === "function" && callback(this.splitPoints.length);
      }, 20);
      return;
    }
    window.requestAnimationFrame(this.drawFrame.bind(this, callback));

    for (let k = 0; k < this.virusBox.length; k++) {
      if (this.virusBox[k].y > this.winHeight) {
        this.virusBox.splice(k, 1);
      } else {
        this.virusBox[k].update(this.ctx, this.img);
      }
    }
    this.paintTrack(this.ctx);
    for (let i = 0; i < this.coinPoints.length; i++) {
      const tar = this.coinPoints[i];
      tar.update(this.ctx, this.coinImg);
      if (tar.x < -tar.r || tar.x > this.winWidth) {
        this.coinPoints.splice(i, 1);
      }
    }
    // 判断是否切中
    this.judgeIntersect();
  }
  // 描绘鼠标轨迹
  paintTrack(ctx) {
    for (let k = 0; k < this.movePoints.length - 2; k++) {
      ctx.lineWidth = 2 + (9 * k) / (this.movePoints.length - 3);
      ctx.beginPath();
      ctx.globalCompositeOperation = "lighter";
      ctx.strokeStyle = this.moveColor;
      ctx.moveTo(this.movePoints[k]["x"], this.movePoints[k]["y"]);
      ctx.lineTo(this.movePoints[k + 1]["x"], this.movePoints[k + 1]["y"]);
      ctx.stroke();
    }
  }
  gVirus() {
    // 病毒大小
    let size = this.random(40, 60);
    let pack = new Virus(this.winWidth, this.winHeight, size);
    this.virusBox.push(pack);
  }
  // 生成随机数
  random(m, n) {
    return parseFloat((Math.random() * (n - m) + m).toFixed(2));
  }
  // 判断鼠标轨迹与卡片是否相交
  judgeIntersect() {
    let hits = [];
    let _V = this.virusBox.slice(0);
    for (let i = 0; i < _V.length; i++) {
      // 超出左边界
      if (_V[i]["x"] + _V[i]["w"] < 0) {
        continue;
      }
      for (let m = 0; m < this.movePoints.length; m++) {
        let inX =
          this.movePoints[m]["x"] >= _V[i]["x"] &&
          this.movePoints[m]["x"] <= _V[i]["x"] + _V[i]["w"];
        let inY =
          this.movePoints[m]["y"] >= _V[i]["y"] &&
          this.movePoints[m]["y"] <= _V[i]["y"] + _V[i]["h"];
        if (inX && inY) {
          hits.push(i);
          this.score++;
          break;
        }
      }
    }
    for (let n = 0; n < hits.length; n++) {
      if (this.virusBox[hits[n]]) {
        // this.gSplit(hits[n]);
        this.gCoin(hits[n]);
      }
      this.virusBox.splice(hits[n], 1);
    }
  }
  // 生成病毒分裂时硬币
  gCoin(k) {
    let origin = this.virusBox[k];
    for (let i = 0; i < 5; i++) {
      const x = origin.x;
      const y = origin.y;
      const r = this.random(10, 18);
      const d = this.random(10, 80);
      this.coinPoints.push(new Coin(x, y, r, d));
    }
  }
}
class Virus {
  constructor(winWidth, winHeight, width) {
    this.winHeight = winHeight;
    this.H = ((Math.random() * 1 + 8) / 10) * winHeight; //最大高度
    this.x = Math.random() * winWidth - width / 2; // x起始位置
    this.y = winHeight; // y轴位置
    this.vx = 1 * (this.x > winWidth / 2 ? -1 : 1); // 横向速度
    this.g = -5; //重力加速度
    this.t = -Math.sqrt(Math.abs(this.H / this.g)); // 初始时间
    this.w = width;
    this.h = parseFloat(width * (0.7).toFixed(2));
  }
  // 病毒位置自更新
  update(ctx, img) {
    this.x += this.vx;
    this.t += 0.1;
    this.y = this.winHeight - Math.pow(this.t, 2) * this.g - this.H;
    ctx.drawImage(img, this.x, this.y, this.w, this.h);
  }
}

// 金币类
class Coin {
  constructor(x, y, r, direction) {
    // 硬币初始速度大小
    let coinSpeed = 10;
    let deg = (direction * Math.PI) / 180;
    this.x = x + r / 2;
    this.y = y;
    this.r = Math.random() * 8 + 10;
    // 水平方向速度
    let d = Math.random() > 0.5 ? 1 : -1;
    this.vx = d * coinSpeed * Math.cos(deg);
    // 垂直方向速度
    this.vy = coinSpeed * Math.sin(deg);
    // 摩擦力加速度
    this.ax = 0.1;
    // 重力加速度
    this.ay = 0.45;
  }
  // 硬币位置自更新
  update(ctx, coinImg) {
    this.vx -= this.ax;
    this.x += this.vx;
    this.vy -= this.ay;
    this.y -= this.vy;
    ctx.drawImage(coinImg, this.x, this.y, this.r, this.r);
  }
}

window.virusController = virusController;
