// JavaScript source code

window.onload = function () {
    var canvas = document.getElementById('game');
    var scoreElement = document.getElementById('gameScore');
    var game = new Game(canvas, 16, 16, scoreElement);

    game.main();
}

class Game {
    constructor(canvas, width, height, scoreElement) {
        this.canvas = canvas;
        this.context = canvas.getContext('2d');

        this.width = width;
        this.height = height;

        canvas.width = width * 16;
        canvas.height = height * 16;

        this.imageName = ['void', 'player', 'fairy', 'sukuna', 'gameover', 'retry', 'enter'];
        this.image = {};
        for (let n in this.imageName) {
            var char = this.imageName[n];
            this.image[char] = new Image();
            this.image[char].src = char + '.png';
        }

        this.arrow = { up: false, down: false, right: false, left: false };
        this.interval = null;

        this.count = 0;
        this.phase = 0;
        this.scoreElement = scoreElement;

        this.enemy = [];
        //enemy=[{x:0,y:0...}]

        this.player = { x: width * 8 - 16, y: height * 12 - 16, vx: 0, vy: 0 };
    }

    //初期設定
    main() {
        var game = this;
        var keydown = function (event) {
            if (event.keyCode == 38) { game.arrow.up = true; }
            if (event.keyCode == 40) { game.arrow.down = true; }
            if (event.keyCode == 39) { game.arrow.right = true; }
            if (event.keyCode == 37) { game.arrow.left = true; }
        }

        var keyup = function (event) {
            if (event.keyCode == 38) { game.arrow.up = false; }
            if (event.keyCode == 40) { game.arrow.down = false; }
            if (event.keyCode == 39) { game.arrow.right = false; }
            if (event.keyCode == 37) { game.arrow.left = false; }
        };

        window.addEventListener("keydown", keydown);
        window.addEventListener("keyup", keyup);

        game.interval = setInterval(() => game.game(), 30);
    }

    clear() {
        var game = this;

        game.interval = null;
        game.count = 0;
        game.phase = 0;
        game.enemy = [];
        game.player = { x: game.width * 8 - 16, y: game.height * 12 - 16, vx: 0, vy: 0 };
    }

    //GAME
    game() {
        var game = this;
        var w = game.width * 16;
        var h = game.height * 16;
        var count = game.count;
        var phase = game.phase;
        var px = game.player.x;
        var py = game.player.y;
        var pvx = game.player.vx;
        var pvy = game.player.vy;

        if (game.arrow.left) {
            pvx -= 1;
        }
        if (game.arrow.right) {
            pvx += 1;
        }
        if (game.arrow.up) {
            pvy -= 1;
        }
        if (game.arrow.down) {
            pvy += 1;
        }

        pvy += 0.7;

        var enemy = game.enemy;

        if ((count % 100) == 0) {
            enemy.unshift({name: 'fairy', x: Math.random() * (w - 32) + 16, y: -16, vx: 0, vy: 0 });
        }
        if (phase==5 && (count % 200) == 50) {
            enemy.push({ name: 'sukuna', x: Math.random() * (w - 32) + 16, y: -16, vx: 0, vy: 0 });
            console.log('here');
        }
        for (let n = 0; n <= phase; ++n) {
            if (count >= 200 * n && (count % 100) == (50 + 15 * n) % 100) {
                enemy.unshift({ name: 'fairy', x: Math.random() * (w - 32) + 16, y: -16, vx: 0, vy: 0 });
                if (n == phase) {
                    ++phase;
                    phase = Math.min(phase, 5);
                }
            }
        }

        game.ImageClear(0, 0, w, h);
        
        for (let n in enemy) {
            var name = enemy[n].name;
            var x = enemy[n].x;
            var y = enemy[n].y;
            var vx = enemy[n].vx;
            var vy = enemy[n].vy;

            if (name == 'fairy') {
                vx += Math.sin(count / 10);
            } else if (name == 'sukuna') {
                let a = Math.atan2((py - y), (px - x));
                vx += Math.cos(a) * 2;
                vy += Math.max(Math.sin(a), 0);
            }

            vy += 0.7;

            vx = vx * 0.7;
            vy = vy * 0.7;

            x += vx;
            y += vy;
            x = game.xMaxMin(x);

            if ((Math.pow(px - x, 2) + Math.pow(py - y, 2)) < 28 * 28) {
                let a = Math.atan2((py - y), (px - x));
                pvx += Math.cos(a) * 30;
                pvy += Math.sin(a) * 30;
            }

            game.imagePut(name, false, 0, 0, 4, 4, x - 16, y - 16);

            if (y > h + 16) {
                enemy.splice(n, 1);
            } else {
                enemy[n].x = x;
                enemy[n].y = y;
                enemy[n].vx = vx;
                enemy[n].vy = vy;
            }
        } 
        game.enemy = enemy;

        pvx = pvx * 0.7;
        pvy = pvy * 0.7;

        px += pvx;
        py += pvy;

        px = game.xMaxMin(px);
        py = Math.max(py, 16);

        game.imagePut('player', false, (Math.floor(count / 5) % 4) * 4, 0, 4, 4, px - 16, py - 16);

        game.player.x = px;
        game.player.y = py;
        game.player.vx = pvx;
        game.player.vy = pvy;

        game.count += 1;
        game.phase = phase;
        game.scoreElement.innerText = '逆らって泳いだ距離:' + game.score() + 'm';

        if (py > h + 16) {
            game.over();
        }
    }

    //GAME OVER
    over() {
        var game = this;
        clearInterval(game.interval);

        var score = game.score();
        var tweetText= '逆らって泳いだ距離:' + score + 'mを記録しました！';
        
        if (score >= 1000) {
            tweetText += '1km越えはヤバいな…';
        } else if (score >= 200) {
            tweetText += '競泳200m自由形泳ぎ切れる程度の体力。';
        } else if (score >= 100) {
            tweetText += 'まさに鬼…！';
        } else if (score >= 50) {
            tweetText += 'Congratulation...!';
        } else if (score >= 30) {
            tweetText += 'やるやん。今度俺にリベンジさせて。';
        } else if (score >= 20) {
            tweetText += 'まだいける…頑張れ！'
        } else {
            tweetText += '流れに逆わず何が天邪鬼だ…';
        }

        setTweetButton(tweetText);

        game.imagePut('gameover', false, 0, 0, 22, 14, 40, 32);
        game.imagePut('retry', false, 0, 0, 14, 8, 8, 160);
        game.imagePut('enter', false, 0, 0, 14, 8, 136, 160);

        game.canvas.onclick = function () {
            var xy = touchHandler(game.canvas, event);
            var x = xy.x;
            var y = xy.y;

            if (rectOK(x, y, 8, 160, 112, 64)) {
                game.canvas.onclick = null;
                game.clear();
                game.interval = setInterval(() => game.game(), 30);
            } else if (rectOK(x, y, 136, 160, 112, 64)){
                game.clear();
            }
        };
    }

    button(event) {
        var game = this;
        
    };
    
    imagePut(char, clear, sx, sy, w, h, dx, dy) {
        var game = this;

        dx = Math.floor(dx);
        dy = Math.floor(dy);

        if (clear) {
            game.context.clearRect(dx, dy, w * 8, h * 8);
        }
        game.context.drawImage(game.image[char], sx * 8, sy * 8, w * 8, h * 8, dx, dy, w * 8, h * 8);
    }

    ImageClear(x, y, w, h) {
        this.context.clearRect(x, y, w * 8, h * 8);
    }

    xMaxMin(x) {
        return Math.min(Math.max(x, 16), this.width * 16 - 16);
    }

    score() {
        return Math.floor((this.count + this.height - this.player.y) / 30) + 7;
    }
}

function touchHandler(element, event) {
    var x = 0, y = 0;
    var clientRect = element.getBoundingClientRect();

    if (event.touches && event.touches[0]) {
        x = event.touches[0].pageX;
        y = event.touches[0].pageY;
    } else if (event.originalEvent && event.originalEvent.changedTouches[0]) {
        x = event.originalEvent.changedTouches[0].pageX;
        y = event.originalEvent.changedTouches[0].pageY;
    } else {
        if (event.pageX) {
            x = event.pageX;
        }
        if (event.pageY) {
            y = event.pageY;
        }
    }

    x = x - window.pageXOffset - clientRect.left;
    y = y - window.pageYOffset - clientRect.top;

    if (x >= 0 && x < clientRect.width) {
        x = x / clientRect.width * element.width;
    } else {
        x = null;
    }
    if (y >= 0 && y < clientRect.height) {
        y = y / clientRect.height * element.height;
    } else {
        y = null;
    }

    return { x: x, y: y };
}

function rectOK(px, py, rx, ry, w, h) {
    if (px >= rx && px <= rx + w && py >= ry && py <= ry + h) {
        return true;
    }
    return false;
}

function setTweetButton(text) {
    $('#tweet-area').empty(); //既存のボタン消す
    // htmlでスクリプトを読んでるからtwttがエラーなく呼べる
    // オプションは公式よんで。
    twttr.widgets.createShareButton(
        "",
        document.getElementById("tweet-area"),
        {
            size: "large", //ボタンはでかく
            text: text, // 狙ったテキスト
            hashtags: "正邪のプール流れ", // ハッシュタグ
            url: "https://soybeanman504.github.io/TGJ2020/" // URL
        }
    );
}