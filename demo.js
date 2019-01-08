class RenderLoop {
    constructor(cb, fps = 0) {
      this.currentFps = 0;
      this.isActive = false;
      this.msLastFrame = performance.now();
      this.cb = cb;
      this.totalTime = 0;
  
      if (fps && typeof fps === 'number' && !Number.isNaN(fps)) {
        this.msFpsLimit = 1000 / fps;
        this.run = () => {
          const currentTime = performance.now();
          const msDt = currentTime - this.msLastFrame;
          this.totalTime += msDt;
          const dt = msDt / 1000;
          
          if (msDt >= this.msFpsLimit) {
            this.cb(dt, this.totalTime);
            this.currentFps = Math.floor(1.0 / dt);
            this.msLastFrame = currentTime;
          }
  
          if (this.isActive) window.requestAnimationFrame(this.run);
        };
      } else {
        this.run = () => {
          const currentTime = performance.now();
          const dt = (currentTime - this.msLastFrame) / 1000;
          this.totalTime += (currentTime - this.msLastFrame);
          this.cb(dt, this.totalTime);
          this.currentFps = Math.floor(1.0 / dt);
          this.msLastFrame = currentTime;
          if (this.isActive) window.requestAnimationFrame(this.run);
        };
      }
    }
  
    changeCb(cb) {
      this.cb = cb;
    }
  
    start() {
      this.msLastFrame = performance.now();
      this.isActive = true;
      window.requestAnimationFrame(this.run);
      return this;
    }
  
    stop() {
      this.isActive = false;
      return this;
    }
}



const particles = [];
const fireworks = [];

class Particle {
    constructor(x, y, colorObj, bornTime) {
        this.x = x;
		this.y = y;
		this.startX = x;
		this.startY = y;
		this.speed = Math.random()/2;
		this.angle = Math.random() * 2 * Math.PI;            //
		this.color = colorObj;
		this.gravity = 1/1000;
		this.speedX0 = this.speed * Math.cos(this.angle);
		this.speedY0 = this.speed * Math.sin(this.angle);
		this.lastX = this.x;
		this.lastY = this.y;
		this.alpha = 0.6 + 0.4 * Math.random();
		this.decay = (10 + 40 * Math.random())/800;
		this.bornTime = bornTime; 
    }

    update(index, tNow) {
        this.lastX = this.x;
        this.lastY = this.y;
        var timeSpan = tNow - this.bornTime;
        this.x = this.startX + this.speedX0 * timeSpan;
        this.y = this.startY + this.speedY0 * timeSpan + 0.5 * this.gravity * timeSpan * timeSpan;
        this.alpha -= this.decay;
        if(this.alpha < 0.05 || outRange(this.x,this.y,cvsWidth,cvsHeight)){
         particles.splice(index,1);
        }
    }

    draw() {
        ctx.beginPath();
        ctx.moveTo(this.lastX,this.lastY);
        ctx.lineTo(this.x,this.y);
        ctx.closePath();
        ctx.strokeStyle = 'rgba(' + this.color.red + ',' + this.color.green + ',' +this.color.blue + ',' + this.alpha + ')';
        ctx.stroke();
    }
}

class Firework {
    constructor(startX, startY, colorObj, bornTime) {
        this.x = startX;
        this.y = startY;
        this.speed = -Math.random() * 0.1;
        this.endX = startX;
        this.endY = 100 + 200* Math.random();
        this.color = colorObj;
        this.alpha = 0.6 + 0.4 * Math.random();
        this.bornTime = bornTime;
        this.coordLast = [
         {x: this.x,y: this.y},
         {x: this.x,y: this.y},
         {x: this.x,y: this.y}
        ];
        this.tLast = bornTime;
        this.accerlation = - (0.002 + 0.003 * Math.random());
    }

    update(index, tNow) {
       this.coordLast[2].y = this.coordLast[1].y;
       this.coordLast[1].y = this.coordLast[0].y;
       this.coordLast[0].y = this.y;
       this.y += this.speed * (tNow - this.tLast);
       this.tLast = tNow;
       this.speed += this.accerlation;
       if(this.y <= this.endY){
        fireworks.splice(index,1);
        createParticles(this.endX,this.endY,200 + 500 *Math.random(), tNow);
       }
    }
    
    draw() {
      ctx.beginPath();
      let rand = Math.round(Math.random() * 2);
      ctx.moveTo(this.x,this.coordLast[rand].y);
      ctx.lineTo(this.x,this.y);
      ctx.closePath();
      ctx.strokeStyle = 'rgba(' + this.color.red + ',' + this.color.green + ',' +this.color.blue + ',' + this.alpha + ')';
      ctx.stroke();
    }
}

const outRange = function(x,y,w,h){
    return x < 0 || x > w || y < 0 || y > h;
}

const createParticles = function(x,y,counts, bornTime){
    for(var i = 0;i < counts;i++){
        particles.push(new Particle(x,y,getRandomColor(),bornTime));
    }
}


const getRandomColor = function(){
    var red =Math.round(255 * Math.random());
    var green =Math.round(255 * Math.random());
    var blue =Math.round(255 * Math.random());
    return {
        red: red,
        green: green,
        blue: blue
    };
}

const updateParticles = function(t){
    for(let i = particles.length - 1;i >= 0; i--){
        particles[i].update(i,t);
    }
}

const drawParticles = function(){
    for(let i = particles.length - 1;i >= 0; i--){
        particles[i].draw();
    }
}

const createFirework = function(bornTime){
    // let bornTime = +new Date();
    fireworks.push(new Firework((0.1 + 0.8 * Math.random()) * cvsWidth,cvsHeight ,getRandomColor(),bornTime));

}

const updateFireworks = function(t){
    for(let i = fireworks.length - 1;i >= 0;i--){
        fireworks[i].update(i,t);
    }
}

const drawFireworks = function(){
    for(let i = fireworks.length - 1;i >= 0;i--){
        fireworks[i].draw();
    }
}

const canvas = document.getElementById('cvs');
const ctx = canvas.getContext('2d');

const { width: cvsWidth, height: cvsHeight } = canvas.getBoundingClientRect();

let tNow = 0;
let timeStart = performance.now();
let createFireworAccu = 0;
new RenderLoop((dt, totalTime) => {
    totalTime *= 0.66;
    ctx.globalCompositeOperation = 'destination-out';
    ctx.fillStyle = 'rgba(0,0,0,0.15)';
    ctx.fillRect(0,0,cvsWidth,cvsHeight);
    updateParticles(totalTime);
    updateFireworks(totalTime);
    ctx.globalCompositeOperation = 'lighter';
    drawParticles();
    drawFireworks();
    createFireworAccu += dt * 1000;
    if (createFireworAccu >= 500) {
      createFirework(totalTime);
      createFireworAccu = 0;
    }
}).start();
