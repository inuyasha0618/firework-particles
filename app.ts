class RenderLooper {
    currentFps: number;
    isActive: boolean;
    msLastFrame: number;
    cb: Function;
    totalTime: number;
    msFpsLimit: number;
    run: Function;
    myReq: any;

    constructor(cb: Function, fps: number = 0) {
        this.currentFps = 0;
        this.isActive = false;
        this.msLastFrame = performance.now();
        this.cb = cb;
        this.totalTime = 0;
  
        if (fps) {
            this.msFpsLimit = 1000 / fps;
            this.run = () => {
                const currentTime: number = performance.now();
                const msDt: number = currentTime - this.msLastFrame;
                this.totalTime += msDt;
                
                if (msDt >= this.msFpsLimit) {
                this.cb(msDt, this.totalTime);
                this.currentFps = Math.floor(1000.0 / msDt);
                this.msLastFrame = currentTime;
                }
                if (this.isActive) {
                this.myReq = window.requestAnimationFrame(<FrameRequestCallback>this.run);
                }
            };
        } else {
            this.run = () => {
                const currentTime = performance.now();
                const msDt = (currentTime - this.msLastFrame);
                this.totalTime += msDt;
                this.cb(msDt, this.totalTime);
                this.currentFps = Math.floor(1000.0 / msDt);
                this.msLastFrame = currentTime;
                if (this.isActive) {
                    this.myReq = window.requestAnimationFrame(<FrameRequestCallback>this.run);
                }
            };
        }
    }
  
    changeCb(cb) {
        this.cb = cb;
    }
  
    start() {
        if (!this.isActive) {
            this.msLastFrame = performance.now();
            this.isActive = true;
            this.myReq = window.requestAnimationFrame(<FrameRequestCallback>this.run);
        }
        return this;
    }
  
    stop() {
        if (this.isActive) {
            window.cancelAnimationFrame(this.myReq);
            this.isActive = false;
            this.currentFps = 0;
        }  
        return this;
    }

    clearTotalTime() {
        this.totalTime = 0;
    }

    getFps(): number {
        return this.currentFps;
    }
}

class Vec2 {
    x: number;
    y: number;

    constructor(_x: number, _y: number) {
        this.x = _x;
        this.y = _y;
    }

    add(v) {
        this.x += v.x;
        this.y += v.y;
    }

    clone() {
        return new Vec2(this.x, this.y);
    }

    static add(v1: Vec2, v2: Vec2) {
        return new Vec2(v1.x + v2.x, v1.y + v2.y);
    }
}

class Vec4 {
    x: number;
    y: number;
    z: number;
    w: number;

    r: number;
    g: number;
    b: number;
    a: number;

    constructor(_x: number, _y: number, _z: number, _w: number) {
        this.x = this.r = _x;
        this.y = this.g = _y;
        this.z = this.b = _z;
        this.w = this.a = _w;
    }
}

class Particle {
    g: Vec2 = new Vec2(0, -0.08);
    v: Vec2;
    pos: Vec2 = new Vec2(0, 0);
    lastPos: Vec2 = new Vec2(0, 0);
    color: Vec4;
    lifespan: number = 1;
    
    constructor(parent: Firework) {

        const angle: number = Math.PI * 2.0 * Math.random();
        const v_len = Math.random() + 1.0;
        const v_x: number = Math.cos(angle) * v_len;
        const v_y: number = Math.sin(angle) * v_len;
        const velo = new Vec2(v_x, v_y);
        const col = Math.floor(Math.random() * 255);
        const color = new Vec4(col, col, col, this.lifespan);

        this.v = velo;
        this.color = color;

    }

    isDead(): boolean {
        return this.lifespan <= 0;
    }

    update() {
        this.lifespan -= 0.01;
        // if (this.lifespan <= 0) {
        //     this.parent.
        // }
        this.v.add(this.g);
        this.lastPos = this.pos;
        this.pos = Vec2.add(this.pos, this.v)
    }

    draw() {
        this.update();
        ctx.beginPath();
        ctx.moveTo(this.lastPos.x, this.lastPos.y);
        ctx.lineTo(this.pos.x, this.pos.y);
        ctx.closePath();
        const col: Vec4 = this.color;
        ctx.strokeStyle = `rgba(${col.r}, ${col.g}, ${col.b}, ${col.a})`;
        ctx.stroke();
    }
}

class Firework {
    acc: Vec2;
    v: Vec2 = new Vec2(0, 0);
    pos: Vec2;
    scale: number;
    transform: Array<number> = [];
    lastThreePos: Array<Vec2> = [];
    explodeHeight: number;
    hasExploded: boolean = false;
    particles: Array<Particle> = [];

    constructor(_pos: Vec2, _acc: Vec2, _explodeHeight: number) {
        // this.acc = new Vec2(0, 0.5 + Math.random());
        this.acc = _acc;
        this.explodeHeight = _explodeHeight;
        this.scale = 0.5 + Math.random();
        this.pos = _pos;

        this.lastThreePos.push(this.pos.clone());
        this.lastThreePos.push(this.pos.clone());
        this.lastThreePos.push(this.pos.clone());
    }

    createParticles() {
        const num = 166;
        for (let i = 0; i < num; i++) {
            this.particles.push(new Particle(this));
        }
    }

    removeParticle(idx) {
        this.particles.splice(idx, 1);
    }

    isDead(): boolean {
        return !this.particles.length;
    }

    update() {
        if (this.hasExploded) return;

        if (this.pos.y < this.explodeHeight) {
            this.lastThreePos[2] = this.lastThreePos[1];
            this.lastThreePos[1] = this.lastThreePos[0];
            this.lastThreePos[0] = this.pos;
            this.v.add(this.acc);
            this.pos = Vec2.add(this.pos, this.v);
        } else {
            this.hasExploded = true;
            this.createParticles();
            this.scale = 0.1;
            this.transform = [this.scale, 0, 0, this.scale, this.pos.x, this.pos.y];
        }
    }

    draw() {
        this.update();
        if (!this.hasExploded) {
            const randomIdx: number = Math.floor(Math.random() * 3);
            const start: Vec2 = this.lastThreePos[randomIdx];
            ctx.beginPath();
            ctx.moveTo(start.x, start.y);
            ctx.lineTo(this.pos.x, this.pos.y);
            ctx.closePath();
            ctx.strokeStyle = `rgba(255, 255, 255, 0.9)`;
            ctx.stroke();
        } else {
            const len = this.particles.length;
            ctx.save();
            const transform = this.transform;
            ctx.transform(transform[0], transform[1], transform[2], transform[3], transform[4], transform[5]);
            for (let i = 0; i < len; i++) {
                this.particles[i].draw();
            }
            ctx.restore();
        }
    }
}


const canvas: HTMLCanvasElement = document.querySelector('#cvs');
const ctx = canvas.getContext('2d');
const { width: cvsWidth, height: cvsHeight } = canvas.getBoundingClientRect();

const w_h: number = cvsWidth / cvsHeight;
// 不论是什么样的分辨率，画布的垂直方向的长度都解析成100， 宽度为 cvsWidth / cvsHeight * 100
const verti = 100;
const hori = w_h * verti;
const inv_vert = 1 / verti;

// ctx.transform(cvsHeight * inv_vert, 0, 0, -cvsHeight * inv_vert, cvsWidth * 0.5, cvsHeight * 0.5);
ctx.transform(cvsHeight * inv_vert, 0, 0, -cvsHeight * inv_vert, 0, cvsHeight);

// const p = new Particle(new Vec2(-2, 0), new Vec4(255, 255, 255, 1));
const fire = new Firework(new Vec2(Math.random() * hori, 0), new Vec2(0, 0.02), (0.3 + Math.random() * 0.3) * verti);

new RenderLooper(() => {
    ctx.globalCompositeOperation = 'destination-out' ;

    ctx.fillStyle = 'rgba(0,0,0,0.15)';
    ctx.fillRect(0, 0, hori, verti);

    ctx.globalCompositeOperation = 'lighter';

    // p.draw();

    fire.draw();
}).start();
