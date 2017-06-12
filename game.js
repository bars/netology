'use strict';

class Vector {
    constructor(x = 0, y = 0) {
        this.x = x;
        this.y = y;
    }
    plus(vector) {
        if (!(vector instanceof Vector)) {
            throw new Error('Передан не вектор');
        }
        return new Vector(this.x + vector.x, this.y + vector.y);
    }
    times(multiple) {
        return new Vector(this.x * multiple, this.y * multiple);
    }
}
class Actor {
    constructor(position = new Vector(0,0), size = new Vector(1,1), speed = new Vector(0,0)) {
        if (!((position instanceof Vector) && (size instanceof Vector) && (speed instanceof Vector))) {
             throw new Error('Передан не вектор');
        }
        this.pos = position;
        this.size = size; 
        this.speed = speed;  
    }
    
    get type() {
        return 'actor';
    }
    get left() {
            return this.pos.x;
        }
        get top() {
            return this.pos.y;
        }
        get right() {
            return this.pos.x + this.size.x;
        }
        get bottom() {
            return this.pos.y + this.size.y;        
        }
    act() {
    }
    isIntersect(actor) {
        if (!(actor instanceof Actor)) {
            throw new Error('Передан не Actor');
        }
        
        let topLeft = new Vector(this.left, this.top),
            topRight = new Vector(this.right, this.top),
            bottomLeft = new Vector(this.left, this.bottom),
            bottomRight = new Vector(this.right, this.bottom),
            angles = [topLeft, topRight, bottomLeft, bottomRight],
            
            actorTopLeft = new Vector(actor.left, actor.top),
            actorTopRight = new Vector(actor.right, actor.top),
            actorBottomLeft = new Vector(actor.left, actor.bottom),
            actorBottomRight = new Vector(actor.right, actor.bottom),
            actorAngles = [actorTopLeft, actorTopRight, actorBottomLeft, actorBottomRight];
        
        function pointIntersect(x, y, actor) {
            if ((x >= actor.left) && (x <= actor.right) && (y >= actor.top) && (y <= actor.bottom)) {
                return true;
            }
            return false;
        }
                
        if (((actor === this) || ((actor.size.x < 0) || (actor.size.y < 0))) || ((this.left == actor.right) || (this.right == actor.left) || (this.top == actor.bottom) || (this.bottom == actor.top))){
            return false;
        }

        return angles.some(angle => {return pointIntersect(angle.x, angle.y, actor)}) ? true : actorAngles.some(angle => {return pointIntersect(angle.x, angle.y, this)});
    }
}
class Level { 
    constructor(level, actors) {
        this.grid = level;
        this.actors = actors;
        this.status = null;
        this.finishDelay = 1;        
    }
    get player() {
        return this.actors.find(actor => {return (actor.type === 'player')});
    }
    get height() {
        if (this.grid !== undefined) {
            return this.grid.length;
        }
        return 0;
    }
    get width() {
        if (this.grid !== undefined) {
            return Math.max(this.grid.reduce(function(current, next) {
                return next.length;
            })); 
        } 
        return 0;
    }
    isFinished() {
        return ((this.status !== null) && (this.finishDelay < 0));
    }
    actorAt(actor) {
        if ((actor === undefined) || (this.actors === undefined)) {
            return undefined;
        }
        return this.actors.find(item => {return item.isIntersect(actor)});
    }

    obstacleAt(movePos, size) {
        if ((movePos.y < 0) || (movePos.x < 0) || ((movePos.x + size.x) > (this.width)))  {
            return 'wall';
        }
        else if ((movePos.y + size.y) > (this.height)) {
           return 'lava';
        }
        let topLeft = new Vector(Math.floor(movePos.x), Math.floor(movePos.y)),
            topRight = new Vector(Math.ceil(movePos.x + size.x - 1), Math.floor(movePos.y)),
            bottomLeft = new Vector(Math.floor(movePos.x), Math.ceil(movePos.y + size.y -1)),
            bottomRight = new Vector(Math.ceil(movePos.x + size.x -1), Math.ceil(movePos.y + size.y -1)),
            points = [],
            horizontalPoints = topRight.x - topLeft.x,
            verticalPoints = bottomLeft.y - topLeft.y;
        
        for (let i = topLeft.y; (i <= verticalPoints + topLeft.y); i++) {
            for (let n = topLeft.x; (n <= horizontalPoints + topLeft.x); n++) {
                points.push(this.grid[i][n]);
            }
        }
        
        if (points.includes('lava')) {
            return 'lava';
        }
        if (points.includes('wall')) {
            return 'wall';
        }
    }
    removeActor(actor) {
        this.actors.splice(this.actors.indexOf(actor), 1);
    }
    noMoreActors(typeActor) {
        if (this.actors === undefined) {
            return true;
        }
        return !this.actors.some(actor => {
            return (actor.type === typeActor);
        });
    }
    playerTouched(typeActor, actor) {
        if (this.status !== null) {
            return;
        }
        if ((typeActor === 'lava') || (typeActor === 'fireball')) {
            this.status = 'lost';
            return;
        }
        if (typeActor === 'coin') {
            this.removeActor(actor);
            if (this.noMoreActors(typeActor)) {
                this.status = 'won';
            }
        }
    }

}


class Player extends Actor {
    constructor(position = new Vector(0, 0)) {
        super();
        this.pos = position.plus(new Vector(0, -0.5));
        this.size = new Vector(0.8, 1.5);
        this.speed = new Vector(0, 0);
    }
    get type() {
        return 'player';
    }
}

class LevelParser {
    constructor(dict) {
        this.dict = dict;
    }
    actorFromSymbol(sym) {
        return sym ? this.dict[sym] : undefined;        
    }
    obstacleFromSymbol(sym) {
        if (sym === 'x') {
            return 'wall';
        }
        if (sym === '!') {
            return 'lava';
        }
    }
    
    createGrid(grid) {
        grid.forEach((item,i) => {
            grid[i] = Array.from(item);
            grid[i].forEach((sym, n) => {
                grid[i][n] = this.obstacleFromSymbol(sym);
            });
        });
        return grid;
    }
    
    createActors(grid) {
        let result = [];
        if (this.dict === undefined) {
            return result;
        }
         grid.forEach((item, i) => {
            grid[i] = Array.from(item);
            grid[i].forEach((sym, n) => {
                if ((this.dict[sym] !== undefined))  {
                    if ((typeof(this.dict[sym]) === 'function') && (new this.dict[sym](new Vector(n, i)) instanceof Actor)) {
                    result.push(new this.dict[sym](new Vector(n, i)));
                    }
                }
            });
        });
        return result;
    }
    
    parse(grid) {
        let actors = this.createActors(grid);
        let plan = this.createGrid(grid);
        let level = new Level(plan, actors);
        return level;
    }    
}

class Fireball extends Actor {
    constructor(pos = new Vector(0, 0), speed = new Vector(0, 0)) {
        super();
        this.pos = pos;
        this.speed = speed;
        this.size = new Vector(1, 1);
    }
    get type() {
        return 'fireball';
    }
    getNextPosition(time = 1) {
        return this.pos.plus(this.speed.times(time));
    }
    handleObstacle() {        
         this.speed = this.speed.times(-1);
    }
    act(time, level) {
        let nextPosition = this.getNextPosition(time);
        if (!(level.obstacleAt(nextPosition, this.size))) {
            this.pos = nextPosition;
        }
        else this.handleObstacle();
    }
}

class HorizontalFireball extends Fireball {
    constructor(pos) {
        super(pos);
        this.size = new Vector(1,1);
        this.speed = new Vector(2, 0);
    }
}
class VerticalFireball extends Fireball {
    constructor(pos) {
        super(pos);
        this.size = new Vector(1,1);
        this.speed = new Vector(0, 2);
    }
}
class FireRain extends Fireball {
    constructor(pos) {
        super(pos);
        this.size = new Vector(1,1);
        this.speed = new Vector(0, 3);
        this.startPos = pos;
    }
    handleObstacle() {
        this.pos = this.startPos;
    }
}

class Coin extends Actor {
    constructor(pos = new Vector(0, 0)) {
        super();
        this.size = new Vector(0.6, 0.6);
        this.pos = pos.plus(new Vector(0.2, 0.1));
        this.springSpeed = 8;
        this.springDist = 0.07;
        this.spring = Math.random() * (2 * Math.PI);
    }
    get type() {
        return 'coin';
    }
    updateSpring(time = 1) {
        this.spring += this.springSpeed * time;
    }
    getSpringVector() {
        return new Vector(0 , (Math.sin(this.spring) * this.springDist));
    }
    getNextPosition(time = 1) {
        this.updateSpring(time);
        return this.pos.plus(this.getSpringVector());
    }
    act(time) {
        this.pos = this.getNextPosition(time);
    }
}

const schemas = [
  [
    '         ',
    '         ',
    '    =    ',
    '       o ',
    '     !xxx',
    ' @       ',
    'xxx!     ',
    '         '
  ],
  [
    '      v  ',
    '         ',
    '  v      ',
    '        o',
    '        x',
    '@   x    ',
    'x        ',
    '         '
  ]
];
const actorDict = {
  '@': Player,
  'v': FireRain,
  '=': HorizontalFireball,
  '|': VerticalFireball,
  'o': Coin
};
const parser = new LevelParser(actorDict);
runGame(schemas, parser, DOMDisplay)
  .then(() => console.log('Вы выиграли приз!'));
