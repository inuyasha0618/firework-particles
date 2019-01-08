var RenderLooper = /** @class */ (function () {
    function RenderLooper(cb, fps) {
        if (fps === void 0) { fps = 0; }
        var _this = this;
        this.currentFps = 0;
        this.isActive = false;
        this.msLastFrame = performance.now();
        this.cb = cb;
        this.totalTime = 0;
        if (fps) {
            this.msFpsLimit = 1000 / fps;
            this.run = function () {
                var currentTime = performance.now();
                var msDt = currentTime - _this.msLastFrame;
                _this.totalTime += msDt;
                if (msDt >= _this.msFpsLimit) {
                    _this.cb(msDt, _this.totalTime);
                    _this.currentFps = Math.floor(1000.0 / msDt);
                    _this.msLastFrame = currentTime;
                }
                if (_this.isActive) {
                    _this.myReq = window.requestAnimationFrame(_this.run);
                }
            };
        }
        else {
            this.run = function () {
                var currentTime = performance.now();
                var msDt = (currentTime - _this.msLastFrame);
                _this.totalTime += msDt;
                _this.cb(msDt, _this.totalTime);
                _this.currentFps = Math.floor(1000.0 / msDt);
                _this.msLastFrame = currentTime;
                if (_this.isActive) {
                    _this.myReq = window.requestAnimationFrame(_this.run);
                }
            };
        }
    }
    RenderLooper.prototype.changeCb = function (cb) {
        this.cb = cb;
    };
    RenderLooper.prototype.start = function () {
        if (!this.isActive) {
            this.msLastFrame = performance.now();
            this.isActive = true;
            this.myReq = window.requestAnimationFrame(this.run);
        }
        return this;
    };
    RenderLooper.prototype.stop = function () {
        if (this.isActive) {
            window.cancelAnimationFrame(this.myReq);
            this.isActive = false;
            this.currentFps = 0;
        }
        return this;
    };
    RenderLooper.prototype.clearTotalTime = function () {
        this.totalTime = 0;
    };
    RenderLooper.prototype.getFps = function () {
        return this.currentFps;
    };
    return RenderLooper;
}());
var Vec2 = /** @class */ (function () {
    function Vec2(_x, _y) {
        this.x = _x;
        this.y = _y;
    }
    Vec2.prototype.add = function (v) {
        this.x += v.x;
        this.y += v.y;
    };
    Vec2.prototype.clone = function () {
        return new Vec2(this.x, this.y);
    };
    Vec2.add = function (v1, v2) {
        return new Vec2(v1.x + v2.x, v1.y + v2.y);
    };
    return Vec2;
}());
var Vec4 = /** @class */ (function () {
    function Vec4(_x, _y, _z, _w) {
        this.x = this.r = _x;
        this.y = this.g = _y;
        this.z = this.b = _z;
        this.w = this.a = _w;
    }
    return Vec4;
}());
var Particle = /** @class */ (function () {
    function Particle(_v, _color) {
        this.g = new Vec2(0, -0.08);
        this.v = _v;
        this.pos = new Vec2(0, 0);
        this.lastPos = new Vec2(0, 0);
        this.color = _color;
    }
    Particle.prototype.update = function () {
        this.v.add(this.g);
        this.lastPos = this.pos;
        this.pos = Vec2.add(this.pos, this.v);
    };
    Particle.prototype.draw = function () {
        this.update();
        ctx.beginPath();
        ctx.moveTo(this.lastPos.x, this.lastPos.y);
        ctx.lineTo(this.pos.x, this.pos.y);
        ctx.closePath();
        var col = this.color;
        ctx.strokeStyle = "rgba(" + col.r + ", " + col.g + ", " + col.b + ", " + col.a + ")";
        ctx.stroke();
    };
    return Particle;
}());
var Firework = /** @class */ (function () {
    function Firework(_pos, _acc, _explodeHeight) {
        // this.acc = new Vec2(0, 0.5 + Math.random());
        this.acc = _acc;
        this.explodeHeight = _explodeHeight;
        this.scale = 0.5 + Math.random();
        this.v = new Vec2(0, 0);
        this.pos = _pos;
        this.lastThreePos = [];
        this.lastThreePos.push(this.pos.clone());
        this.lastThreePos.push(this.pos.clone());
        this.lastThreePos.push(this.pos.clone());
        this.hasExploded = false;
        this.particles = [];
    }
    Firework.prototype.createParticles = function () {
        var num = 166;
        for (var i = 0; i < num; i++) {
            var angle = Math.PI * 2.0 * Math.random();
            var v_len = Math.random() + 1.0;
            var v_x = Math.cos(angle) * v_len;
            var v_y = Math.sin(angle) * v_len;
            var velo = new Vec2(v_x, v_y);
            var color = new Vec4(255, 255, 255, 1);
            this.particles.push(new Particle(velo, color));
        }
    };
    Firework.prototype.update = function () {
        if (this.hasExploded)
            return;
        if (this.pos.y < this.explodeHeight) {
            this.lastThreePos[2] = this.lastThreePos[1];
            this.lastThreePos[1] = this.lastThreePos[0];
            this.lastThreePos[0] = this.pos;
            this.v.add(this.acc);
            this.pos = Vec2.add(this.pos, this.v);
        }
        else {
            this.hasExploded = true;
            this.createParticles();
            this.scale = 0.1;
            this.transform = [this.scale, 0, 0, this.scale, this.pos.x, this.pos.y];
        }
    };
    Firework.prototype.draw = function () {
        this.update();
        if (!this.hasExploded) {
            var randomIdx = Math.floor(Math.random() * 3);
            var start = this.lastThreePos[randomIdx];
            ctx.beginPath();
            ctx.moveTo(start.x, start.y);
            ctx.lineTo(this.pos.x, this.pos.y);
            ctx.closePath();
            ctx.strokeStyle = "rgba(255, 255, 255, 0.9)";
            ctx.stroke();
        }
        else {
            var len = this.particles.length;
            ctx.save();
            var transform = this.transform;
            ctx.transform(transform[0], transform[1], transform[2], transform[3], transform[4], transform[5]);
            for (var i = 0; i < len; i++) {
                this.particles[i].draw();
            }
            ctx.restore();
        }
    };
    return Firework;
}());
var canvas = document.querySelector('#cvs');
var ctx = canvas.getContext('2d');
var _a = canvas.getBoundingClientRect(), cvsWidth = _a.width, cvsHeight = _a.height;
var w_h = cvsWidth / cvsHeight;
// 不论是什么样的分辨率，画布的垂直方向的长度都解析成100， 宽度为 cvsWidth / cvsHeight * 100
var verti = 100;
var hori = w_h * verti;
var inv_vert = 1 / verti;
// ctx.transform(cvsHeight * inv_vert, 0, 0, -cvsHeight * inv_vert, cvsWidth * 0.5, cvsHeight * 0.5);
ctx.transform(cvsHeight * inv_vert, 0, 0, -cvsHeight * inv_vert, 0, cvsHeight);
// const p = new Particle(new Vec2(-2, 0), new Vec4(255, 255, 255, 1));
var fire = new Firework(new Vec2(Math.random() * hori, 0), new Vec2(0, 0.02), (0.3 + Math.random() * 0.3) * verti);
new RenderLooper(function () {
    ctx.globalCompositeOperation = 'destination-out';
    ctx.fillStyle = 'rgba(0,0,0,0.15)';
    ctx.fillRect(0, 0, hori, verti);
    ctx.globalCompositeOperation = 'lighter';
    // p.draw();
    fire.draw();
}).start();
