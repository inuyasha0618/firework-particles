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
    acc: Vec2 = new Vec2(0, -0.05);
    v: Vec2;
    pos: Vec2 = new Vec2(0, 0);
    lastPos: Vec2 = new Vec2(0, 0);
    color: Vec4;
    lifespan: number = 1;
    decayRate: number = Math.random() * 0.005 + 0.005;
    
    constructor() {

        const angle: number = Math.PI * 2.0 * Math.random();
        const v_len = Math.random() + 1.0;
        const v_x: number = Math.cos(angle) * v_len;
        const v_y: number = Math.sin(angle) * v_len;
        const velo = new Vec2(v_x, v_y);
        const col_r = Math.floor(Math.random() * 255);
        const col_g = Math.floor(Math.random() * 255);
        const col_b = Math.floor(Math.random() * 255);
        const color = new Vec4(col_r, col_g, col_b, this.lifespan);

        this.v = velo;
        this.color = color;

    }

    isDead(): boolean {
        return this.lifespan <= 0;
    }

    run() {
        this.update();
        this.draw();
    }

    update() {
        this.lifespan -= this.decayRate;
        this.v.add(this.acc);
        this.lastPos = this.pos;
        this.pos = Vec2.add(this.pos, this.v)
    }

    draw() {
        ctx.beginPath();
        ctx.moveTo(this.lastPos.x, this.lastPos.y);
        ctx.lineTo(this.pos.x, this.pos.y);
        ctx.closePath();
        const col: Vec4 = this.color;
        ctx.strokeStyle = `rgba(${col.r}, ${col.g}, ${col.b}, ${this.lifespan})`;
        ctx.stroke();
    }
}

class Firework extends Particle {
    lastThreePos: Array<Vec2> = [new Vec2(0, 0), new Vec2(0, 0), new Vec2(0, 0)];
    explodeHeight: number;

    constructor(_pos: Vec2, _acc: Vec2, _explodeHeight: number) {
        super();
        this.pos = _pos;
        this.v = new Vec2(0, 0);
        this.acc = _acc;
        this.explodeHeight = _explodeHeight;
    }

    isDead(): boolean {
        return this.pos.y >= this.explodeHeight;
    }

    update() {
        this.lastThreePos[2] = this.lastThreePos[1];
        this.lastThreePos[1] = this.lastThreePos[0];
        this.lastThreePos[0] = this.pos;
        this.v.add(this.acc);
        this.pos = Vec2.add(this.pos, this.v);
    }

    draw() {
        const randomIdx: number = Math.floor(Math.random() * 3);
        const start: Vec2 = this.lastThreePos[randomIdx];
        ctx.beginPath();
        ctx.moveTo(start.x, start.y);
        ctx.lineTo(this.pos.x, this.pos.y);
        ctx.closePath();
        ctx.strokeStyle = `rgba(${this.color.r}, ${this.color.g}, ${this.color.b}, 0.9)`;
        ctx.stroke();
    }
}

class ParticleSystem extends Particle {
    particles: Array<Particle> = [];

    isDead(): boolean {
        return this.particles.length === 0;
    }

    run() {
        const len: number = this.particles.length;
        for (let i = len - 1; i >= 0; i--) {
            const particle = this.particles[i];
            particle.run();
            if (particle.isDead()) {
                this.particles.splice(i, 1);
            }
        }
    }
}

class Boom extends ParticleSystem {
    pos: Vec2;
    scale: number = 0.5 + Math.random();
    createParticles() {
        const num = 50 + 50 * Math.random();
        for (let i = 1; i < num; i++) {
            this.particles.push(new Particle);
        }
    }

    constructor(_pos: Vec2) {
        super();
        this.pos = _pos;
        this.createParticles();
    }

    run() {
        ctx.save();
        ctx.transform(this.scale, 0, 0, this.scale, this.pos.x, this.pos.y);
        super.run();
        ctx.restore();
    }
}

class FireworkShow extends ParticleSystem {
    constructor() {
        super();
        setInterval(() => {
            this.addFirework();
        }, 600);
    }

    private addFirework() {
        this.particles.push(new Firework(
            new Vec2(Math.random() * hori, 0),
            new Vec2(0, 0.02),
            (0.3 + Math.random() * 0.3) * verti
        ));
    }

    private createBoom(pos: Vec2) {
        this.particles.push(new Boom(pos));
    }

    run() {
        const len: number = this.particles.length;
        for (let i = len - 1; i >= 0; i--) {
            const particle = this.particles[i];
            particle.run();
            if (particle.isDead()) {
                this.particles.splice(i, 1);
                if (particle instanceof Firework) {
                    this.createBoom(particle.pos);
                }
            }
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
// const fire = new Firework(new Vec2(Math.random() * hori, 0), new Vec2(0, 0.02), (0.3 + Math.random() * 0.3) * verti);
const magicShow = new FireworkShow();

new RenderLooper(() => {
    ctx.globalCompositeOperation = 'destination-out' ;

    ctx.fillStyle = 'rgba(0,0,0,0.15)';
    ctx.fillRect(0, 0, hori, verti);

    ctx.globalCompositeOperation = 'lighter';

    // p.draw();

    magicShow.run();
}).start();
