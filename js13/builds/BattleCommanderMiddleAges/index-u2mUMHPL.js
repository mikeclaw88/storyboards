/**
 *
 * @param pt Interactive to canvas
 * @returns
 */
var i2c = (pt, size) => {
    var cartPt = new Vector(0, 0);
    cartPt.x = pt.x * size.x;
    cartPt.y = pt.y * size.y;
    return cartPt;
};
function randInt(min = 0, max = 0) {
    return Math.floor(Math.random() * (max - min) + min);
}
var rand = (min = 1, max = 0) => {
    return Math.random() * (max - min) + min;
};
const PI = Math.PI;
const clamp = (v, max = 1, min = 0) => (v < min ? min : v > max ? max : v);
const percent = (v, max = 1, min = 0) => max - min ? clamp((v - min) / (max - min)) : 0;
class Timer {
    constructor(timeLeft) {
        this.time = timeLeft == undefined ? undefined : time + timeLeft;
        this.setTime = timeLeft;
    }
    set(timeLeft = 0) {
        this.time = time + timeLeft;
        this.setTime = timeLeft;
    }
    unset() {
        this.time = undefined;
    }
    isSet() {
        return this.time != undefined;
    }
    active() {
        if (this.time == undefined)
            return false;
        return time <= this.time;
    } // is set and has no time left
    elapsed() {
        if (this.time == undefined)
            return false;
        return time > this.time;
    } // is set and has time left
    get() {
        if (this.time == undefined)
            return 0;
        return this.isSet() ? time - this.time : 0;
    }
    p100() {
        if (this.time == undefined)
            return 0;
        return this.isSet() ? percent(this.time - time, 0, this.setTime) : 0;
    }
}

class Vector {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
    get key() {
        return this.x.toFixed(2) + ',' + this.y.toFixed(2);
    }
    /**
     * Add the provided vector to this one
     */
    add(vec) {
        this.x += vec.x;
        this.y += vec.y;
        return this;
    }
    /**
     * Subtract the provided vector from this one
     */
    subtract(vec) {
        this.x -= vec.x;
        this.y -= vec.y;
        return this;
    }
    /**
     * Check if the provided vector equal to this one
     */
    equals(vec) {
        return vec.x === this.x && vec.y === this.y;
    }
    /**
     * Multiply this vector by the provided vector
     */
    multiplyByVector(vec) {
        this.x *= vec.x;
        this.y *= vec.y;
        return this;
    }
    /**
     * Multiply this vector by the provided vector
     */
    mulV(vec) {
        return this.multiplyByVector(vec);
    }
    /**
     * Divide this vector by the provided vector
     */
    divideByVector(vec) {
        this.x /= vec.x;
        this.y /= vec.y;
        return this;
    }
    /**
     * Divide this vector by the provided vector
     */
    divV(v) {
        return this.divideByVector(v);
    }
    /**
     * Multiply this vector by the provided number
     */
    multiplyByScalar(n) {
        this.x *= n;
        this.y *= n;
        return this;
    }
    /**
 * Multiply this vector by the provided number
 */
    scale(n) {
        return this.multiplyByScalar(n);
    }
    /**
     * Multiply this vector by the provided number
     */
    mulS(n) {
        return this.multiplyByScalar(n);
    }
    /**
     * Divive this vector by the provided number
     */
    divideByScalar(n) {
        this.x /= n;
        this.y /= n;
        return this;
    }
    /**
     * Divive this vector by the provided number
     */
    divS(n) {
        return this.divideByScalar(n);
    }
    /**
     * Normalise this vector
     */
    normalise() {
        return this.divideByScalar(this.magnitude());
    }
    /**
     * For American spelling. Same as unit/normalise function
     */
    normalize() {
        return this.normalise();
    }
    /**
     * The same as normalise and normalize
     */
    unit() {
        return this.normalise();
    }
    /**
     * Returns the magnitude (length) of this vector
     */
    magnitude() {
        const x = this.x;
        const y = this.y;
        return Math.sqrt(x * x + y * y);
    }
    /**
     * Returns the magnitude (length) of this vector
     */
    length() {
        return this.magnitude();
    }
    /**
     * Returns the squred length of this vector
     */
    lengthSq() {
        const x = this.x;
        const y = this.y;
        return x * x + y * y;
    }
    /**
     * Returns the dot product of this vector by another
     */
    dot(vec) {
        return vec.x * this.x + vec.y * this.y;
    }
    /**
     * Returns the cross product of this vector by another.
     */
    cross(vec) {
        return this.x * vec.y - this.y * vec.x;
    }
    /**
     * Reverses this vector i.e multiplies it by -1
     */
    reverse() {
        this.x = -this.x;
        this.y = -this.y;
        return this;
    }
    /**
     * Set the vector axes values to absolute values
     */
    abs() {
        this.x = Math.abs(this.x);
        this.y = Math.abs(this.y);
        return this;
    }
    /**
     * Zeroes the vector i.e sets all axes to 0
     */
    zero() {
        this.x = this.y = 0;
        return this;
    }
    /**
     * Returns the distance between this vector and another
     */
    distance(v) {
        var x = this.x - v.x;
        var y = this.y - v.y;
        return Math.sqrt(x * x + y * y);
    }
    /**
     * Rotates the vetor by provided radians
     */
    rotate(rads) {
        const cos = Math.cos(rads);
        const sin = Math.sin(rads);
        const ox = this.x;
        const oy = this.y;
        this.x = ox * cos - oy * sin;
        this.y = ox * sin + oy * cos;
        return this;
    }
    // /**
    //  * Rounds this vector to n decimal places
    //  */
    // round(n = 2) {
    //     var p = precision[n]
    //     // This performs waaay better than toFixed and give Float32 the edge again.
    //     // http://www.dynamicguru.com/javascript/round-numbers-with-precision/
    //     this.x = ((0.5 + this.x * p) << 0) / p
    //     this.y = ((0.5 + this.y * p) << 0) / p
    //     return this
    // }
    /**
     * Returns a copy of this vector with this values
     */
    clone() {
        return new Vector(this.x, this.y);
    }
    static fromAngle(r, length) {
        if (typeof length === 'undefined') {
            length = 1;
        }
        return new Vector(length * Math.cos(r), length * Math.sin(r));
    }
    static subtract(a, b) {
        return new Vector(a.x - b.x, a.y - b.y);
    }
    heading() {
        const h = Math.atan2(this.y, this.x);
        return h;
    }
    ;
    //   static distance(a: Vector, b: Vector) {
    //     return Math.sqrt(Math.pow(b.x - a.x, 2) + Math.pow(b.y - a.y, 2));
    //   }
    static distance(a, b) {
        return Math.sqrt(squaredDistance(a, b));
    }
    static rand() {
        return new Vector(rand(-1, 1), rand(-1, 1));
    }
}
function squaredDistance(a, b) {
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    return dx * dx + dy * dy;
}
// /**
//  * These values are used by the `Vector.round` method to increase
//  * performance vs. using  Number.toFixed.
//  */
// const precision = [
//     1,
//     10,
//     100,
//     1000,
//     10000,
//     100000,
//     1000000,
//     10000000,
//     100000000,
//     1000000000,
//     10000000000
// ]

class DrawEngine {
    constructor() {
        this.fogMemory = [];
        this.context = c2d.getContext('2d');
        // this.contextDeath = c2d.cloneNode().getContext('2d');
        // this.contextBlood = c2d.cloneNode().getContext('2d');
        this.contextFogOfWar = c2d.getContext('2d');
    }
    get canvasWidth() {
        return this.context.canvas.width;
    }
    get canvasHeight() {
        return this.context.canvas.height;
    }
    init() {
        this.contextDeath = c2d.cloneNode().getContext('2d');
        this.contextBlood = c2d.cloneNode().getContext('2d');
    }
    drawItems(items, ctx = drawEngine.context) {
        items
            .sort((a, b) => { return -((b.Position.y + b._z) * 10000 + b.Position.x) + ((a.Position.y + a._z) * 10000 + a.Position.x); })
            .forEach((item) => {
            item.draw(ctx);
        });
    }
    drawText(text, fontSize, x, y, color = 'white', textAlign = 'center') {
        const context = this.context;
        context.font = `${fontSize}px Impact, sans-serif-black`;
        context.textAlign = textAlign;
        context.strokeStyle = 'black';
        context.lineWidth = 7;
        context.miterLimit = 2;
        context.strokeText(text, x, y);
        context.fillStyle = color;
        context.fillText(text, x, y);
    }
    drawImage(image, x, y) {
        const context = this.context;
        context.imageSmoothingEnabled = false;
        context.drawImage(image, x, y - 8, 64, 64);
    }
    drawRectangle(position, size, options = { stroke: '', fill: '' }) {
        const ctx = this.context;
        ctx.beginPath();
        ctx.strokeStyle = options.stroke;
        ctx.lineWidth = 3;
        ctx.rect(position.x, position.y, size.x, size.y);
        ctx.stroke();
        if (options.fill != '') {
            ctx.fillStyle = options.fill;
            ctx.rect(position.x, position.y, size.x, size.y);
            ctx.fill();
        }
    }
    drawCircle(position, size = 10, options = { stroke: '', fill: '', lineWidth: 3 }) {
        const ctx = this.context;
        ctx.beginPath();
        ctx.strokeStyle = options.stroke;
        ctx.lineWidth = options.lineWidth;
        ctx.arc(position.x, position.y, size / 2, 0, 2 * Math.PI);
        ctx.stroke();
        if (options.fill != '') {
            ctx.fillStyle = options.fill;
            ctx.arc(position.x, position.y, size / 2, 0, 2 * Math.PI);
            ctx.fill();
        }
    }
    drawLine(position, destination, options = { stroke: `rgba(127,255,212,0.85)`, fill: '' }) {
        const ctx = this.context;
        ctx.beginPath();
        ctx.strokeStyle = options.stroke; //`rgba(127,255,212,0.85)`;
        ctx.lineWidth = 3;
        ctx.moveTo(position.x, position.y);
        ctx.lineTo(destination.x, destination.y);
        ctx.stroke();
    }
    drawBar(x, y, valueToShow, valueMax, Size = 400, color = '#ff0', background = '#ff0', lineWidth = 8, flip = true) {
        const ctx = this.context;
        let value = (valueMax - valueToShow) / valueMax;
        ctx.save();
        ctx.translate(x, y);
        // ctx.scale((flip ? -1 : 1), 0)
        x = 0, y = 0;
        ctx.beginPath();
        ctx.strokeStyle = background;
        ctx.lineWidth = lineWidth;
        ctx.moveTo(x - Size / 2, y);
        ctx.lineTo(x + Size / 2, y);
        ctx.stroke();
        ctx.beginPath();
        ctx.strokeStyle = color;
        ctx.lineWidth = lineWidth;
        if (flip) {
            ctx.moveTo(x + Size / 2, y);
            ctx.lineTo(x + Size / 2 - Size * value, y);
        }
        else {
            ctx.moveTo(x - Size / 2, y);
            ctx.lineTo(x - Size / 2 + Size * value, y);
        }
        ctx.stroke();
        ctx.restore();
    }
    drawQuadtree(node, ctx) {
        //no subnodes? draw the current node
        if (node.nodes.length === 0) {
            ctx.strokeStyle = `rgba(127,255,212,0.25)`;
            ctx.strokeRect(node.bounds.x, node.bounds.y, node.bounds.width, node.bounds.height);
            //has subnodes? drawQuadtree them!
        }
        else {
            for (let i = 0; i < node.nodes.length; i = i + 1) {
                this.drawQuadtree(node.nodes[i], ctx);
            }
        }
    }
    /**
     *
     * @param points
     */
    drawDynamicFogOfWar(points) {
        // fog hole radius
        let size = 800;
        // reduce points to matrix width 100
        points = points.map(m => { return new Vector(100 * Math.floor(m.x / 100), 100 * Math.floor(m.y / 100)); });
        // get unique points
        const uniquePoints = [...new Map(points.map(item => [item['key'], item])).values()];
        // store unique points of frame in memory
        this.fogMemory.push(uniquePoints);
        if (this.fogMemory.length > 100)
            this.fogMemory = this.fogMemory.slice(-1);
        // get All points from memory
        const lastFramesPoints = this.fogMemory.flat();
        // get unique memory points
        const memoryUniquePoints = [...new Map(lastFramesPoints.map(item => [item['key'], item])).values()];
        let ctx = c2d.cloneNode().getContext('2d');
        this.contextFogOfWar = ctx;
        ctx.fillStyle = 'rgb(0,0,0,.95)';
        memoryUniquePoints
            .forEach(point => {
            ctx.beginPath();
            ctx.arc(point.x, point.y, size / 2, 0, 2 * Math.PI);
            ctx.fill();
        });
        ctx.filter = "blur(10px)";
        this.context.globalCompositeOperation = 'destination-in';
        this.context.drawImage(ctx.canvas, 0, 0);
        this.context.globalCompositeOperation = 'source-over';
    }
}
const drawEngine = new DrawEngine();

class StateMachine {
    constructor(initialState, ...enterArgs) {
        this.currentState = initialState;
        this.currentState.onEnter?.(...enterArgs);
        setTimeout(() => {
            this.currentState.Active = true;
        }, 200);
    }
    setState(newState, ...enterArgs) {
        this.currentState.Active = false;
        this.currentState.onLeave?.();
        this.currentState = newState;
        this.currentState.onEnter?.(...enterArgs);
        setTimeout(() => {
            this.currentState.Active = true;
        }, 200);
    }
    getState() {
        return this.currentState;
    }
}

let gameStateMachine;
function createGameStateMachine(initialState, ...initialArguments) {
    gameStateMachine = new StateMachine(initialState, ...initialArguments);
}

// const enum XboxControllerButton {
//   A,
//   B,
//   X,
//   Y,
//   LeftBumper,
//   RightBumper,
//   LeftTrigger,
//   RightTrigger,
//   Select,
//   Start,
//   L3,
//   R3,
//   DpadUp,
//   DpadDown,
//   DpadLeft,
//   DpadRight,
// }
class InputKeyboard {
    constructor() {
        // isUp = false;
        // isDown = false;
        // isLeft = false;
        // isRight = false;
        // isConfirm = false;
        this.isEscape = false;
        // inputDirection: DOMPoint;
        this.keyMap = new Map();
        this.previousState = { isEscape: this.isEscape }; //isUp: this.isUp, isDown: this.isDown, isConfirm: this.isConfirm, 
        document.addEventListener('keydown', event => this.toggleKey(event, true));
        document.addEventListener('keyup', event => this.toggleKey(event, false));
        // this.inputDirection = new DOMPoint();
    }
    queryController() {
        // this.previousState.isUp = this.isUp;
        // this.previousState.isDown = this.isDown;
        // this.previousState.isConfirm = this.isConfirm;
        this.previousState.isEscape = this.isEscape;
        // const gamepad = navigator.getGamepads()[0];
        // const isButtonPressed = (button: XboxControllerButton) => gamepad?.buttons[button].pressed;
        // const leftVal = (this.keyMap.get('KeyA') || this.keyMap.get('ArrowLeft') || isButtonPressed(XboxControllerButton.DpadLeft)) ? -1 : 0;
        // const rightVal = (this.keyMap.get('KeyD') || this.keyMap.get('ArrowRight') || isButtonPressed(XboxControllerButton.DpadRight)) ? 1 : 0;
        // const upVal = (this.keyMap.get('KeyW') || this.keyMap.get('ArrowUp') || isButtonPressed(XboxControllerButton.DpadUp)) ? -1 : 0;
        // const downVal = (this.keyMap.get('KeyS') || this.keyMap.get('ArrowDown') || isButtonPressed(XboxControllerButton.DpadDown)) ? 1 : 0;
        // this.inputDirection.x = (leftVal + rightVal) || gamepad?.axes[0] || 0;
        // this.inputDirection.y = (upVal + downVal) || gamepad?.axes[1] || 0;
        // const deadzone = 0.1;
        // if (Math.hypot(this.inputDirection.x, this.inputDirection.y) < deadzone) {
        //   this.inputDirection.x = 0;
        //   this.inputDirection.y = 0;
        // }
        // this.isUp = this.inputDirection.y < 0;
        // this.isDown = this.inputDirection.y > 0;
        // this.isLeft = this.inputDirection.x < 0;
        // this.isRight = this.inputDirection.x > 0;
        // this.isConfirm = Boolean(this.keyMap.get('Enter') || isButtonPressed(XboxControllerButton.A) || isButtonPressed(XboxControllerButton.Start));
        this.isEscape = Boolean(this.keyMap.get('Escape')); // || isButtonPressed(XboxControllerButton.Select)
    }
    toggleKey(event, isPressed) {
        this.keyMap.set(event.code, isPressed);
    }
}
const inputKeyboard = new InputKeyboard();

function goToPosition(unit, position = new Vector(0, 0)) {
    let rotate = 0;
    let move = 0;
    let distanceToPoint = Vector.subtract(position, unit.Position);
    const dist = distanceToPoint.magnitude();
    if (dist > 1) {
        rotate = distanceToPoint.heading() - unit.Heading;
        move = unit.Radius; // - Math.min(unit.Radius*2, 1/dist)
    }
    return {
        m: move,
        r: rotate,
        d: dist
    };
}

/**
 * Class representing a Circle.
 * @typeParam CustomDataType - Type of the custom data property (optional, inferred automatically).
 *
 * @example Without custom data (JS/TS):
 * ```typescript
 * const circle = new Circle({
 *   x: 100,
 *   y: 100,
 *   r: 32,
 * });
 * ```
 *
 * @example With custom data (JS/TS):
 * ```javascript
 * const circle = new Circle({
 *   x: 100,
 *   y: 100,
 *   r: 32,
 *   data: {
 *     name: 'Jane',
 *     health: 100,
 *   },
 * });
 * ```
 *
 * @example With custom data (TS):
 * ```typescript
 * interface ObjectData {
 *   name: string
 *   health: number
 * }
 * const entity: ObjectData = {
 *   name: 'Jane',
 *   health: 100,
 * };
 *
 * // Typescript will infer the type of the data property
 * const circle1 = new Circle({
 *   x: 100,
 *   y: 100,
 *   r: 32,
 *   data: entity,
 * });
 *
 * // You can also pass in a generic type for the data property
 * const circle2 = new Circle<ObjectData>({
 *   x: 100,
 *   y: 100,
 *   r: 32,
 * });
 * circle2.data = entity;
 * ```
 *
 * @example With custom class extending Circle (implements {@link CircleGeometry} (x, y, r)):
 * ```javascript
 * // extending inherits the qtIndex method
 * class Bomb extends Circle {
 *
 *   constructor(props) {
 *     // call super to set x, y, r (and data, if given)
 *     super(props);
 *     this.countdown = props.countdown;
 *   }
 * }
 *
 * const bomb = new Bomb({
 *   countdown: 5,
 *   x: 10,
 *   y: 20,
 *   r: 30,
 * });
 * ```
 *
 * @example With custom class and mapping {@link CircleGeometry}:
 * ```javascript
 * // no need to extend if you don't implement CircleGeometry
 * class Bomb {
 *
 *   constructor(countdown) {
 *     this.countdown = countdown;
 *     this.position = [10, 20];
 *     this.radius = 30;
 *   }
 *
 *   // add a qtIndex method to your class
 *   qtIndex(node) {
 *     // map your properties to CircleGeometry
 *     return Circle.prototype.qtIndex.call({
 *       x: this.position[0],
 *       y: this.position[1],
 *       r: this.radius,
 *     }, node);
 *   }
 * }
 *
 * const bomb = new Bomb(5);
 * ```
 *
 * @example With custom object that implements {@link CircleGeometry}:
 * ```javascript
 * const player = {
 *   name: 'Jane',
 *   health: 100,
 *   x: 10,
 *   y: 20,
 *   r: 30,
 *   qtIndex: Circle.prototype.qtIndex,
 * });
 * ```
 *
 * @example With custom object and mapping {@link CircleGeometry}:
 * ```javascript
 * // Note: this is not recommended but possible.
 * // Using this technique, each object would have it's own qtIndex method.
 * // Rather add qtIndex to your prototype, e.g. by using classes like shown above.
 * const player = {
 *   name: 'Jane',
 *   health: 100,
 *   position: [10, 20],
 *   radius: 30,
 *   qtIndex: function(node) {
 *     return Circle.prototype.qtIndex.call({
 *       x: this.position[0],
 *       y: this.position[1],
 *       r: this.radius,
 *     }, node);
 *   },
 * });
 * ```
 */
class Circle {
    /**
     * Circle Constructor
     * @param props - Circle properties
     * @typeParam CustomDataType - Type of the custom data property (optional, inferred automatically).
     */
    constructor(props) {
        this.x = props.x;
        this.y = props.y;
        this.r = props.r;
        this.data = props.data;
    }
    /**
     * Determine which quadrant this circle belongs to.
     * @param node - Quadtree node to be checked
     * @returns Array containing indexes of intersecting subnodes (0-3 = top-right, top-left, bottom-left, bottom-right)
     */
    qtIndex(node) {
        const indexes = [], w2 = node.width / 2, h2 = node.height / 2, x2 = node.x + w2, y2 = node.y + h2;
        //an array of node origins where the array index equals the node index
        const nodes = [
            [x2, node.y],
            [node.x, node.y],
            [node.x, y2],
            [x2, y2],
        ];
        //test all nodes for circle intersections
        for (let i = 0; i < nodes.length; i++) {
            if (Circle.intersectRect(this.x, this.y, this.r, nodes[i][0], nodes[i][1], nodes[i][0] + w2, nodes[i][1] + h2)) {
                indexes.push(i);
            }
        }
        return indexes;
    }
    /**
     * Check if a circle intersects an axis aligned rectangle.
     * @beta
     * @see https://yal.cc/rectangle-circle-intersection-test/
     * @param x - circle center X
     * @param y - circle center Y
     * @param r - circle radius
     * @param minX - rectangle start X
     * @param minY - rectangle start Y
     * @param maxX - rectangle end X
     * @param maxY - rectangle end Y
     * @returns true if circle intersects rectangle
     *
     * @example Check if a circle intersects a rectangle:
     * ```javascript
     * const circ = { x: 10, y: 20, r: 30 };
     * const rect = { x: 40, y: 50, width: 60, height: 70 };
     * const intersect = Circle.intersectRect(
     *   circ.x,
     *   circ.y,
     *   circ.r,
     *   rect.x,
     *   rect.y,
     *   rect.x + rect.width,
     *   rect.y + rect.height,
     * );
     * console.log(circle, rect, 'intersect?', intersect);
     * ```
     */
    static intersectRect(x, y, r, minX, minY, maxX, maxY) {
        const deltaX = x - Math.max(minX, Math.min(x, maxX));
        const deltaY = y - Math.max(minY, Math.min(y, maxY));
        return (deltaX * deltaX + deltaY * deltaY) < (r * r);
    }
}

class GameObject {
    constructor(position, size, team) {
        this.Active = true;
        this._z = 0;
        this._zv = 0; // z velocity
        this._zgrav = 9.8; // gravity
        this._rotation = 0;
        this._lifeSpan = -1;
        this._age = 0;
        this._opacity = 1;
        this.healthPointsMax = 100;
        this.healthPoints = 100;
        this.armorPointsMax = 0;
        this.armorPoints = 0;
        this.attackDamagePoints = 0;
        this.Position = position.clone();
        this.Size = size.clone();
        this.Velocity = new Vector(0, 0);
        this.Acceleration = new Vector(0, 0);
        this.Mass = 1;
        this.Team = team;
    }
    qtIndex(node) {
        return Circle.prototype.qtIndex.call({
            x: this.Position.x,
            y: this.Position.y,
            r: this.Radius,
        }, node);
    }
    get Radius() {
        return this.Size.length();
    }
    set Radius(value) {
        let side = Math.sqrt(value * value);
        this.Size = new Vector(side, side);
    }
    _update(dt) {
        // gravity
        this._zv -= this._zgrav * 1 / dt;
        this._z = Math.max(0, this._z + this._zv); // 
        if (this._z < 1) {
            this._zv = 0;
        }
    }
    draw(ctx) {
        // if (debug.showObjectInfo || debug.showQuadtree) {
        // drawEngine.drawCircle(this.Position, this.Radius, {stroke: ['','#f00','#00f'][this.Team], fill: 'transparent'}); // this.Size.length()
        // }        
    }
    destroy() {
        this.Active = false;
    }
}

class UnitAnimation {
    constructor(tFrames, config, repeats = true) {
        this._currentTime = 0;
        this._currentFrame = 0;
        this._animations = [];
        // duration in frames
        this._totalFrames = tFrames;
        this._repeats = repeats;
        // console.log(JSON.stringify(config));
        ["s"].forEach((key) => {
            // console.log(key)
            // console.log(config[key])
            // component keyframes
            var cKeyFrames = config[key] || [{ f: 0 }, { f: tFrames }];
            for (var i = 1; i < cKeyFrames.length; i++) {
                var prev = cKeyFrames[i - 1];
                var curr = cKeyFrames[i];
                // frame duration
                var fDuration = curr.f - prev.f;
                for (var j = 0; j < fDuration; j++) {
                    // interpolation t-value
                    var t = j / fDuration;
                    var exists = this._animations[prev.f + j];
                    var frameData = exists || {};
                    // component frame data
                    var cFrameData = {};
                    // position
                    if (prev.hasOwnProperty("p")) {
                        // linear interpolate between keyframes
                        var nx = prev.p[0] + (curr.p[0] - prev.p[0]) * t;
                        var ny = prev.p[1] + (curr.p[1] - prev.p[1]) * t;
                        cFrameData._position = new Vector(nx, ny);
                    }
                    else {
                        cFrameData._position = new Vector(0, 0);
                    }
                    // rotation
                    if (prev.hasOwnProperty("r")) {
                        // linear interpolate between keyframes
                        var nv = prev.r + (curr.r - prev.r) * t;
                        cFrameData.r = nv;
                    }
                    else {
                        cFrameData.r = 0;
                    }
                    frameData[key] = cFrameData;
                    if (!exists) {
                        this._animations.push(frameData);
                    }
                }
            }
        });
    }
    get _current() {
        return this._animations[this._currentFrame];
    }
    get _finished() {
        if (this._repeats) {
            return false;
        }
        return this._currentFrame === this._totalFrames - 1;
    }
    _update(dt) {
        this._currentTime += 1; //dt/60; //1 //
        this._currentFrame = Math.floor(this._currentTime);
        if (this._currentFrame > this._totalFrames - 1) {
            this._currentFrame = 0;
            this._currentTime = 0;
        }
    }
}

var configSwordIdle = {
    "s": [{ f: 0, r: -2.094, p: [0, 0] }, { f: 10, r: -2.094 - 0.045, p: [0, 0] }, { f: 20, r: -2.094, p: [0, 0] },],
};
var configSwordAttack = {
    "s": [{ f: 0, r: -PI - .5, p: [0, -20], }, { f: 4, r: -PI + 1.5, p: [0, 0], }, { f: 16, r: -PI + 1.6, p: [0, 0], },],
};
// export var configLanceIdle: configAnim = {
//     "s": [{ f: 0, r: -PI, p: [0, 0] }, { f: 10, r: -PI +.013, p: [0, 0] }, { f: 20, r: -PI, p: [0, 0] },],
// };
// export var configLanceAttack: configAnim = {
//     "s": [{ f: 0, r: PI/2, p: [0, -20], }, { f: 4, r: -PI + 1.5, p: [0, 0], }, { f: 30, r: -PI/2, p: [0, 0], },],
// };

const getTeamColor = (team) => ['', 'red', 'blue'][team];
const unitTypes = [
    0 /* EntityType.Troop */,
    1 /* EntityType.Testudo */,
    2 /* EntityType.Archer */,
    3 /* EntityType.Knight */,
    4 /* EntityType.Artillery */,
    5 /* EntityType.Cavalry */
];
const unitNames = [
    'Troop',
    'Testudo',
    'Archer',
    'Knight',
    'Artillery',
    'Cavalry'
];

const allDataBase = [];
function createUnitsDatabase() {
    const shootDamageArcher = 30;
    const shootDamageArtillery = 1000;
    allDataBase.push({
        type: 0 /* EntityType.Troop */, name: unitNames[0 /* EntityType.Troop */],
        cost: 100, health: 100, armor: 30, speedFactor: 1,
        attackCoolDown: .6, attackDamage: 30, attackRangeFactor: 2,
    });
    allDataBase.push({
        type: 1 /* EntityType.Testudo */, name: unitNames[1 /* EntityType.Testudo */],
        cost: 80, health: 100, armor: 200, speedFactor: .1,
        attackCoolDown: 1, attackDamage: 20, attackRangeFactor: 1,
    });
    allDataBase.push({
        type: 2 /* EntityType.Archer */, name: unitNames[2 /* EntityType.Archer */],
        cost: 120, health: 100, armor: 20, speedFactor: .2,
        attackCoolDown: 0.3, attackDamage: 50, attackRangeFactor: 14,
        shootDamage: shootDamageArcher, shootRangeFactor: 10, shootCoolDown: 0.5,
    });
    allDataBase.push({
        type: 3 /* EntityType.Knight */, name: unitNames[3 /* EntityType.Knight */],
        cost: 250, health: 100, armor: 150, speedFactor: .8,
        attackCoolDown: 1, attackDamage: 80, attackRangeFactor: 3,
        shootRangeFactor: 0,
    });
    allDataBase.push({
        type: 4 /* EntityType.Artillery */, name: unitNames[4 /* EntityType.Artillery */],
        cost: 1500, health: 100, armor: 40, speedFactor: .2,
        attackCoolDown: 1, attackDamage: 20, attackRangeFactor: 15,
        shootDamage: shootDamageArtillery, shootRangeFactor: 20, shootCoolDown: 2.5,
    });
    allDataBase.push({
        type: 5 /* EntityType.Cavalry */, name: unitNames[5 /* EntityType.Cavalry */],
        cost: 1300, health: 100, armor: 180, speedFactor: 1.8,
        attackCoolDown: .5, attackDamage: 200, attackRangeFactor: 15,
    });
    allDataBase.push({
        type: 6 /* EntityType.Arrow */, name: "Arrow",
        cost: 0, health: 100, armor: 0, speedFactor: 0,
        attackCoolDown: 0,
        attackDamage: shootDamageArcher, attackRangeFactor: 0,
    });
    allDataBase.push({
        type: 7 /* EntityType.CannonBall */, name: "CannonBall",
        cost: 0, health: 100, armor: 0, speedFactor: 0,
        attackCoolDown: 0,
        attackDamage: 100,
        attackRangeFactor: 0,
    });
    allDataBase.push({
        type: 8 /* EntityType.Explosion */, name: "Explosion",
        cost: 0, health: 100, armor: 0, speedFactor: 0,
        attackDamage: shootDamageArtillery, attackRangeFactor: 0,
        attackCoolDown: 0,
    });
}
class GameDatabase {
    get unitsData() {
        return allDataBase.filter(f => ![6 /* EntityType.Arrow */, 7 /* EntityType.CannonBall */, 8 /* EntityType.Explosion */].includes(f.type));
    }
    get data() {
        return allDataBase;
    }
    getDataValues(type) {
        const element = allDataBase.find(f => f.type === type);
        return element || {
            type: -1 /* EntityType.None */, name: "", cost: 0, health: 0, armor: 0, attackDamage: 0, speedFactor: 0, shootCoolDown: 0, attackRangeFactor: 0, attackCoolDown: 0
        };
    }
    getUnitSize(type) {
        if (type == 6 /* EntityType.Arrow */)
            return new Vector(4, 4);
        if (type == 7 /* EntityType.CannonBall */)
            return new Vector(8, 8);
        return new Vector(20, 20);
    }
    getButtonStyle() {
        let style = {
            text: '#ccc',
            color: transparent,
            lineWidth: 0,
            lineColor: transparent,
            fontSize: 60
        };
        let styleHover = {
            text: 'white',
            color: 'rgb(150,150,150,.3)',
            lineWidth: 0,
            lineColor: transparent,
            fontSize: 60
        };
        return { style, styleHover };
    }
}
const gameDatabase = new GameDatabase();

class GameTile {
    constructor(isox, isoy, height = 0, tileType, tileSize) {
        this._tileSize = tileSize;
        this._isoPosition = new Vector(isox, isoy);
        this._position = i2c(this._isoPosition, this._tileSize);
        this._tileType = tileType;
        this.height = height;
    }
}

/**
 * https://github.com/spissvinkel/simplex-noise-ts
 * */
/**
 * Initialize a new simplex noise generator using the provided PRNG
 *
 * @param random a PRNG function like `Math.random` or `AleaPRNG.random`
 * @returns an initialized simplex noise generator
 */
const mkSimplexNoise = (random) => {
    const tables = buildPermutationTables(random);
    return {
        noise2D: (x, y) => noise2D(tables, x, y),
    };
};
// 2D simplex noise
/** @internal */
const noise2D = (tables, x, y) => {
    const { perm, permMod12 } = tables;
    // Noise contributions from the three corners
    let n0 = 0.0, n1 = 0.0, n2 = 0.0;
    // Skew the input space to determine which simplex cell we're in
    var s = (x + y) * F2; // Hairy factor for 2D
    var i = Math.floor(x + s);
    var j = Math.floor(y + s);
    var t = (i + j) * G2;
    // Unskew the cell origin back to (x, y) space
    const x00 = i - t;
    const y00 = j - t;
    // The x, y distances from the cell origin
    const x0 = x - x00;
    const y0 = y - y00;
    // For the 2D case, the simplex shape is an equilateral triangle.
    // Determine which simplex we are in.
    // Offsets for second (middle) corner of simplex in (i, j) coords
    // lower triangle, XY order (0, 0) -> (1, 0) -> (1, 1) - or upper triangle, YX order (0, 0) -> (0, 1) -> (1, 1)
    const i1 = x0 > y0 ? 1 : 0;
    const j1 = x0 > y0 ? 0 : 1;
    // A step of (1, 0) in (i, j) means a step of (1-c,  -c) in (x, y), and
    // a step of (0, 1) in (i, j) means a step of ( -c, 1-c) in (x, y), where
    // c = (3 - sqrt(3)) / 6
    // Offsets for middle corner in (x, y) unskewed coords
    const x1 = x0 - i1 + G2;
    const y1 = y0 - j1 + G2;
    // Offsets for last corner in (x, y) unskewed coords
    const x2 = x0 - 1.0 + 2.0 * G2;
    const y2 = y0 - 1.0 + 2.0 * G2;
    // Work out the hashed gradient indices of the three simplex corners
    const ii = i & 255;
    const jj = j & 255;
    // Calculate the contribution from the three corners
    let t0 = 0.5 - x0 * x0 - y0 * y0;
    if (t0 >= 0) {
        const gi0 = permMod12[ii + perm[jj]] * 3;
        t0 *= t0;
        // (x, y) of GRAD3 used for 2D gradient
        n0 = t0 * t0 * (GRAD3[gi0] * x0 + GRAD3[gi0 + 1] * y0);
    }
    let t1 = 0.5 - x1 * x1 - y1 * y1;
    if (t1 >= 0) {
        const gi1 = permMod12[ii + i1 + perm[jj + j1]] * 3;
        t1 *= t1;
        n1 = t1 * t1 * (GRAD3[gi1] * x1 + GRAD3[gi1 + 1] * y1);
    }
    let t2 = 0.5 - x2 * x2 - y2 * y2;
    if (t2 >= 0) {
        const gi2 = permMod12[ii + 1 + perm[jj + 1]] * 3;
        t2 *= t2;
        n2 = t2 * t2 * (GRAD3[gi2] * x2 + GRAD3[gi2 + 1] * y2);
    }
    // Add contributions from each corner to get the final noise value.
    // The result is scaled to return values in the interval [-1, 1].
    return 70.0 * (n0 + n1 + n2);
};
/** @internal */
const buildPermutationTables = (random) => {
    const perm = new Uint8Array(512);
    const permMod12 = new Uint8Array(512);
    const tmp = new Uint8Array(256);
    for (let i = 0; i < 256; i++)
        tmp[i] = i;
    for (let i = 0; i < 255; i++) {
        const r = i + ~~(random() * (256 - i));
        const v = tmp[r];
        tmp[r] = tmp[i];
        perm[i] = perm[i + 256] = v;
        permMod12[i] = permMod12[i + 256] = v % 12;
    }
    const v = tmp[255];
    perm[255] = perm[511] = v;
    permMod12[255] = permMod12[511] = v % 12;
    return { perm, permMod12 };
};
/** @internal */
const F2 = 0.5 * (Math.sqrt(3.0) - 1.0);
/** @internal */
const G2 = (3.0 - Math.sqrt(3.0)) / 6.0;
/** @internal */
const GRAD3 = new Float32Array([
    1, 1, 0,
    -1, 1, 0,
    1, -1, 0,
    -1, -1, 0,
    1, 0, 1,
    -1, 0, 1,
    1, 0, -1,
    -1, 0, -1,
    0, 1, 1,
    0, -1, 1,
    0, 1, -1,
    0, -1, -1
]);

class TileMap {
    constructor(dim = new Vector(60, 60), size = new Vector(5, 5), seed = 81962) {
        this._map = [];
        let a = mkSimplexNoise(() => seed);
        // setMapDim(dim)
        this._mapDim = dim;
        this._tileSize = size;
        const TILE_HEIGHT = 0;
        for (var i = dim.y; i--;) {
            var tileMapRow = [];
            for (var j = dim.x; j--;) {
                var tile;
                // let seed = 81962 //rndRng(0, 99999) //
                var p = a.noise2D(i / 20, j / 20); //perlinOctave(i/20, j/20, seed, .28, 10);
                var tileType = 0;
                if (p < 0) {
                    tileType = 1; // water
                }
                else if (p < 0.35) {
                    tileType = 2; // sand
                }
                else if (p < 0.94) {
                    tileType = 3; // dirt
                }
                else if (p < 1) {
                    tileType = 4; // grass
                }
                tile = new GameTile(j, i, TILE_HEIGHT, tileType, this._tileSize); // height 20
                //TODO this._addChild(tile);
                tileMapRow.push(tile);
            }
            this._map.push(tileMapRow.reverse());
        }
        this._map.reverse();
    }
}

const themeDef = { forest: 0, dessert: 1, other: 2, snow: 3 }; //, sea: 2 
const themeCollection = [themeDef.forest, themeDef.dessert, themeDef.other, themeDef.snow]; //, themeDef.sea
class GameMap {
    constructor(dim = new Vector(60, 60), size = new Vector(5, 5), seed = 81962, theme = themeDef.forest) {
        this.theme = 0;
        this.dim = dim;
        this.size = size;
        this.seed = seed;
        this.theme = theme;
        this.tileMap = new TileMap(dim, size, seed);
    }
    Init() {
        this.tileMap = new TileMap(this.dim, this.size, this.seed);
        this.imageCache = undefined;
    }
    drawTileMap(ctx, blurValue = 15) {
        var w = drawEngine.canvasWidth, h = drawEngine.canvasHeight;
        if (!this.imageCache) {
            var palette = [
                ["#fff", "#28691e", "#38792e", "#48893e", "#564d40"],
                ["#F0E2AE", "#F2CA9D", "#E7A885", "#CE8A7A", "#C37F7C"],
                ["#FE6927", "#FFD85F", "#FEE8AA", "#FCEC9C", "#FFE293"],
                ["#fff", "#ddd", "#bbb", "#999", "#777"], // snow
                // ["#A28654", "#1ba5e1", "#e5d9c2", "#48893e", "#564d40"], // sea
            ];
            var colors = palette[this.theme];
            let ctx = c2d.cloneNode().getContext('2d');
            this.tileMap._map.forEach(row => {
                row.forEach((tile) => {
                    ctx.fillStyle = colors[tile._tileType];
                    ctx.beginPath();
                    ctx.rect(tile._position.x, tile._position.y, tile._tileSize.x, tile._tileSize.y);
                    ctx.fill();
                });
            });
            this.imageCache = ctx;
        }
        else {
            var x = w / 2, y = h / 2;
            // Aplicar efecto de desenfoque
            ctx.filter = 'contrast(120%) brightness(150%) saturated(200%)';
            ctx.filter = 'blur(' + blurValue + 'px)';
            ctx.globalAlpha = .8;
            ctx.drawImage(this.imageCache.canvas, x - w / 2, y - h / 2);
            // Limpiar el efecto de desenfoque
            ctx.filter = 'none';
            ctx.globalAlpha = 1;
        }
    }
}

class Level {
    constructor() {
        this.levelIndex = 0;
        this.playerPosition = new Vector(1, 1);
        this.playerInitCount = 0;
        this.enemyPosition = new Vector(1, 1);
        this.enemyInitCount = 0;
        this.level = [];
        this.fogOfWar = false;
        this.gold = 0;
        this.playerTypes = [];
        this.stars = 0;
        this.finalLevelIndex = 12;
        this.enemyUnitType = unitTypes[0];
        this.levelSizefactor = 1.0;
        this.levelTimer = new Timer(0);
        this.theme = randInt(0, themeCollection.length + 1);
        let dataTable = [
            [10, 0 /* EntityType.Troop */, themeDef.forest, 2, 0],
            [50, 2 /* EntityType.Archer */, themeDef.dessert, 1.5, 0],
            [100, 3 /* EntityType.Knight */, themeDef.forest, 1.5, 0],
            [20, 4 /* EntityType.Artillery */, themeDef.dessert, 1.5, 0],
            [30, 5 /* EntityType.Cavalry */, themeDef.snow, 1.2, 1],
            [100, -1 /* EntityType.None */, themeDef.forest, 1.5, 1],
            [120, -1 /* EntityType.None */, themeDef.forest, 1.3, 1],
            [140, -1 /* EntityType.None */, themeDef.forest, 1.2, 1],
            [180, -1 /* EntityType.None */, themeDef.forest, 1.1, 1],
            [200, -1 /* EntityType.None */, themeDef.forest, 1, 1],
            [240, -1 /* EntityType.None */, themeDef.forest, .9, 1],
            [300, -1 /* EntityType.None */, themeDef.forest, .8, 1],
            [500, -1 /* EntityType.None */, themeDef.dessert, .7, 0], // level 13
        ];
        dataTable.forEach((data, index) => {
            let types = [];
            types.push(0 /* EntityType.Troop */);
            types.push(1 /* EntityType.Testudo */);
            types.push(2 /* EntityType.Archer */);
            if (index > 0)
                types.push(3 /* EntityType.Knight */);
            if (index > 0)
                types.push(4 /* EntityType.Artillery */);
            if (index > 1)
                types.push(5 /* EntityType.Cavalry */);
            let i = 0;
            this.level.push({
                playerTypes: [...types],
                enemyCount: data[i++],
                enemyType: data[i++],
                theme: data[i++],
                sizeFactor: data[i++],
                fogOfWar: data[i++] == 1 ? true : false,
                stars: 0,
                highScore: 0
            });
        });
        this.init(this.levelIndex);
    }
    init(level) {
        this.playerPosition = new Vector(drawEngine.canvasWidth / 2, drawEngine.canvasHeight * 0.8); // Bottom (Player)
        this.enemyPosition = new Vector(drawEngine.canvasWidth / 2, drawEngine.canvasHeight * 0.2); // Top (Enemy)
        this.levelIndex = level;
        const currentLevel = this.level[this.levelIndex];
        this.playerTypes = currentLevel.playerTypes;
        this.theme = currentLevel.theme;
        this.levelSizefactor = currentLevel.sizeFactor;
        this.fogOfWar = currentLevel.fogOfWar;
        this.enemyInitCount = currentLevel.enemyCount;
        this.enemyUnitType = currentLevel.enemyType;
        this.levelTimer = new Timer(60); // On minute safe end
        this.stars = 0;
    }
    next() {
        this.levelIndex = (this.levelIndex + 1) % this.level.length;
    }
}
const gameLevel = new Level();

// Module-level source data
let sourceData = null;
let imgWidth = 0;
let imgHeight = 0;
let halfW = 0;
// Detected crop bounds (relative to each half)
let cropX = 0;
let cropY = 0;
let cropW = 0;
let cropH = 0;
const SKIN_TONES = [
    [255, 224, 196], [245, 210, 178], [224, 187, 148], [198, 159, 122],
    [174, 132, 98], [148, 108, 76], [116, 80, 56], [86, 58, 40]
];
const HAIR_COLORS = [
    [60, 40, 20], [140, 100, 40], [30, 20, 10], [200, 170, 100],
    [100, 60, 30], [160, 80, 40], [80, 50, 25], [180, 50, 20]
];
// Unit type palettes indexed by EntityType
const UNIT_PALETTES = {
    [0 /* EntityType.Troop */]: {
        pants: [101, 67, 33],
        alphaShirt: [139, 32, 32],
        bravoShirt: [32, 80, 139]
    },
    [1 /* EntityType.Testudo */]: {
        pants: [68, 51, 34],
        alphaShirt: [107, 48, 48],
        bravoShirt: [48, 80, 107]
    },
    [2 /* EntityType.Archer */]: {
        pants: [59, 47, 47],
        alphaShirt: [91, 64, 32],
        bravoShirt: [32, 75, 91]
    },
    [4 /* EntityType.Artillery */]: {
        pants: [59, 47, 47],
        alphaShirt: [91, 64, 32],
        bravoShirt: [32, 75, 91]
    }
};
/**
 * Preload humanv2.jpg: extract full ImageData and auto-detect character bounds from mask (right half).
 */
function setHumanV2Source(img) {
    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0);
    sourceData = ctx.getImageData(0, 0, img.width, img.height);
    imgWidth = img.width;
    imgHeight = img.height;
    halfW = Math.floor(imgWidth / 2);
    // Auto-detect character bounds by scanning right half mask for non-black pixels
    let minX = halfW, maxX = 0, minY = imgHeight, maxY = 0;
    const threshold = 30;
    const data = sourceData.data;
    for (let y = 0; y < imgHeight; y++) {
        for (let x = halfW; x < imgWidth; x++) {
            const i = (y * imgWidth + x) * 4;
            if (data[i] > threshold || data[i + 1] > threshold || data[i + 2] > threshold) {
                const relX = x - halfW;
                if (relX < minX)
                    minX = relX;
                if (relX > maxX)
                    maxX = relX;
                if (y < minY)
                    minY = y;
                if (y > maxY)
                    maxY = y;
            }
        }
    }
    cropX = minX;
    cropY = minY;
    cropW = maxX - minX + 1;
    cropH = maxY - minY + 1;
}
/**
 * Colorize a 32x32 sprite from humanv2.jpg for a given unit type and team.
 * Returns an HTMLCanvasElement (valid CanvasImageSource).
 */
function colorizeHumanSprite(type, team) {
    const OUTPUT_SIZE = 32;
    const canvas = document.createElement('canvas');
    canvas.width = OUTPUT_SIZE;
    canvas.height = OUTPUT_SIZE;
    const ctx = canvas.getContext('2d');
    if (!sourceData) {
        return canvas;
    }
    const outData = ctx.createImageData(OUTPUT_SIZE, OUTPUT_SIZE);
    const out = outData.data;
    const src = sourceData.data;
    // Get palette for this unit type
    const palette = UNIT_PALETTES[type] || UNIT_PALETTES[0 /* EntityType.Troop */];
    const shirtColor = team === 2 /* Team.Bravo */ ? palette.bravoShirt : palette.alphaShirt;
    const pantsColor = palette.pants;
    // Random skin and hair per unit
    const skinColor = SKIN_TONES[Math.floor(Math.random() * SKIN_TONES.length)];
    const hairColor = HAIR_COLORS[Math.floor(Math.random() * HAIR_COLORS.length)];
    const MASK_THRESHOLD = 30 / 255;
    for (let oy = 0; oy < OUTPUT_SIZE; oy++) {
        for (let ox = 0; ox < OUTPUT_SIZE; ox++) {
            // Map output pixel to source coords within crop bounds
            const srcX = Math.floor(cropX + ox * (cropW / OUTPUT_SIZE));
            const srcY = Math.floor(cropY + oy * (cropH / OUTPUT_SIZE));
            // Read left half (color reference) for luminance
            const leftI = (srcY * imgWidth + srcX) * 4;
            const lr = src[leftI];
            const lg = src[leftI + 1];
            const lb = src[leftI + 2];
            const luminance = (lr * 0.299 + lg * 0.587 + lb * 0.114) / 255;
            const outI = (oy * OUTPUT_SIZE + ox) * 4;
            // If left side is white/near-white, this is background — skip (transparent)
            if (Math.min(lr, lg, lb) > 240) {
                out[outI + 3] = 0;
                continue;
            }
            // Read right half (mask)
            const rightI = (srcY * imgWidth + (srcX + halfW)) * 4;
            const mr = src[rightI] / 255;
            const mg = src[rightI + 1] / 255;
            const mb = src[rightI + 2] / 255;
            // Decompose mask
            const skinMask = Math.min(mr, mg, mb);
            const shirtMask = Math.max(0, mr - skinMask);
            const pantsMask = Math.max(0, mg - skinMask);
            const hairMask = Math.max(0, mb - skinMask);
            const totalMask = skinMask + shirtMask + pantsMask + hairMask;
            if (totalMask < MASK_THRESHOLD) {
                // No mask data — outline (dark) or background, determined by left-side luminance
                if (luminance < 0.3) {
                    // Outline - black
                    out[outI] = 0;
                    out[outI + 1] = 0;
                    out[outI + 2] = 0;
                    out[outI + 3] = 255;
                }
                else {
                    // Transparent background
                    out[outI + 3] = 0;
                }
            }
            else {
                // Colorize: weighted blend * luminance
                const r = (shirtMask * shirtColor[0] + pantsMask * pantsColor[0] + hairMask * hairColor[0] + skinMask * skinColor[0]) * luminance;
                const g = (shirtMask * shirtColor[1] + pantsMask * pantsColor[1] + hairMask * hairColor[1] + skinMask * skinColor[1]) * luminance;
                const b = (shirtMask * shirtColor[2] + pantsMask * pantsColor[2] + hairMask * hairColor[2] + skinMask * skinColor[2]) * luminance;
                out[outI] = Math.min(255, Math.round(r));
                out[outI + 1] = Math.min(255, Math.round(g));
                out[outI + 2] = Math.min(255, Math.round(b));
                out[outI + 3] = 255;
            }
        }
    }
    ctx.putImageData(outData, 0, 0);
    return canvas;
}

class Unit extends GameObject {
    constructor(position, sizeFactor = 1, team, type) {
        let size = gameDatabase.getUnitSize(type).scale(sizeFactor);
        super(position, size, team);
        this.type = -1 /* EntityType.None */;
        this.image = new Image();
        this.imageSize = new Vector(32, 32);
        this.Heading = 0;
        this.maxSpeed = 0;
        this.maxForce = 4;
        this.VisionRange = 0;
        this.LooktoRight = false;
        this.attackAnim = 0;
        this._sizeSword = new Vector(10, 40);
        this._hasWeapon = true;
        this.attackRangeFactor = 0;
        this.shootRangeFactor = 0;
        this.shootRangeMinimun = 0;
        this.attackCoolDownTimer = new Timer(0);
        this.attackCoolDownValue = 0;
        this.isKing = false;
        this.killCount = 0;
        this.friendKillCount = 0;
        this.winner = false;
        this.speedFactor = 1;
        this.shootCoolDownValue = 0;
        this.stuntTime = new Timer(0);
        this.showBars = true;
        this.dataValues = gameDatabase.getDataValues(type);
        this.SizeRef = size;
        this.name = "unit-" + Math.random().toString(36).substr(2, 5);
        this.type = type;
        this.getImage(type, team);
        this.loadProperties();
        this._idleAnim = new UnitAnimation(20, configSwordIdle);
        this._attackAnim = new UnitAnimation(16, configSwordAttack, false);
        // current animation
        this._currentAnim = this._idleAnim;
    }
    get attackRange() {
        return this.Radius * this.attackRangeFactor;
    }
    get shootRange() {
        return this.Radius * this.shootRangeFactor;
    }
    loadProperties() {
        this.healthPoints = this.healthPointsMax = this.dataValues.health;
        this.armorPoints = this.armorPointsMax = this.dataValues.armor;
        this.attackDamagePoints = this.dataValues.attackDamage;
        this.attackRangeFactor = this.dataValues.attackRangeFactor;
        this.attackCoolDownValue = this.dataValues.attackCoolDown;
        this.dataValues.shootRangeFactor && (this.shootRangeFactor = this.dataValues.shootRangeFactor);
        this.shootRangeMinimun = this.shootRangeFactor * .3;
        this.shootCoolDownValue = this.dataValues.shootCoolDown;
        this.speedFactor = this.dataValues.speedFactor;
        this.maxSpeed = this.Radius * this.speedFactor / 200;
        this.VisionRange = 0;
    }
    setActive(range) {
        this.attackCoolDownTimer = new Timer(0);
        this.VisionRange = range;
    }
    drawChilds(ctx, realSize) {
        // drawEngine.drawRectangle(new Vector(-realSize.x / 2, -realSize.y / 2), realSize, { stroke: 'yellow', fill: 'transparent' });
    }
    doJump() {
        if (this._z == 0 && rand() > .5) {
            this._zv += this.Size.y / 8;
            this.jumping();
        }
    }
    jumping() { }
    attack() {
        this._currentAnim = this._attackAnim;
        // if (this._sword) {
        //     // this._sword._size.scale(1.8)
        //     this._sword._length = this._sword._size.y
        // }
    }
    shootTo(position) {
    }
    scoreKill() { }
    deathHandler() { }
    destroy() {
        this.deathHandler();
        super.destroy();
    }
    _update(dt) {
        this.setSizes();
        // Animation
        this._currentAnim._update(dt);
        if (this._currentAnim == this._attackAnim && this._currentAnim._finished) {
            this._currentAnim = this._idleAnim;
            this.Size = this.SizeRef.clone();
        }
        // Jumping
        if (this.winner) {
            this.doJump();
        }
        // navigation control
        if (this.targetPosition) {
            this._control(dt);
        }
        super._update(dt);
        let canAttack = false;
        if (this.targetPosition != undefined) {
            let distance = this.Position.distance(this.targetPosition);
            canAttack = distance < this.attackRange; //&& distance > this.Radius * this.attackRangeMinimun
        }
        if (this.targetPosition
            && canAttack
            && this.attackCoolDownTimer.elapsed()) {
            this._currentAnim = this._attackAnim;
            this.attack();
            this.attackCoolDownTimer.set(this.attackCoolDownValue);
        }
    }
    setSizes() {
        if (this.weapon) {
            this.weapon._size = this.weapon._sizeRef.clone().scale(this.Size.clone().scale(1 / 32).y);
            this.weapon._length = this.weapon._size.y;
        }
    }
    _control(dt) {
        if (this.targetPosition) {
            // let decision = Control.goToPosition(this, this.targetPosition);
            let decision = goToPosition(this, this.targetPosition);
            // apply decision 
            this._rotate(decision.r);
            this._move(decision.m * 1 / dt);
            // target reached
            if (decision.d < 4)
                this.targetPosition = undefined;
        }
    }
    _rotate(angle) {
        this.Heading += angle;
    }
    _move(value) {
        value = Math.min(this.maxSpeed, value);
        this.Acceleration.add(Vector.fromAngle(this.Heading, value));
    }
    getImage(index = 0, team = 1 /* Team.Alpha */) {
        this.image = Unit.prepareImage(index, team);
    }
    static prepareImage(index = 0, team = 1 /* Team.Alpha */) {
        // Knight and Cavalry keep their existing PNG sprites
        if (index === 3 /* EntityType.Knight */) {
            let img = new Image();
            img.src = 'assets/knight.png';
            return img;
        }
        if (index === 5 /* EntityType.Cavalry */) {
            let img = new Image();
            img.src = 'assets/cavalry.png';
            return img;
        }
        // All human-type units use the colorizer (synchronous, humanv2.jpg is preloaded)
        return colorizeHumanSprite(index, team);
    }
    draw(ctx, dir = false) {
        // const circlePosition = this.Position//.clone().add(new Vector(this.Radius, this.Radius).scale(.5));
        // drawEngine.drawText(''+ this.Team, 15, thisPosition.x, thisPosition.y);
        // if (debug.showUnitTextInfo)
        //     drawEngine.drawText('' + this.healthPoints, 15, circlePosition.x, circlePosition.y); // + '/' + this.damagePoints
        // if (debug.showUnitInfo && this.targetPosition) //
        //     drawEngine.drawLine(circlePosition, this.targetPosition);
        if (unitTypes.includes(this.type) && gameLevel.level[gameLevel.levelIndex].sizeFactor >= 1 && this.showBars) {
            // armor bar
            this.drawBar(ctx, +this.Radius * .9, this.armorPoints, this.armorPointsMax, ["", "#666", "#666"][this.Team], this.armorPoints > 0, 8);
            // health bar
            this.drawBar(ctx, +this.Radius * .9, this.healthPoints, this.healthPointsMax, ["", "#f00", "#00f"][this.Team], this.armorPoints == 0 && this.healthPoints > 0); //this.healthPoints > 0 && this.healthPoints < 80
        }
        // if (debug.showUnitInfo) {
        //     drawEngine.drawCircle(this.Position, this.Radius); // this.Size.length()
        //     // drawEngine.drawText('' + this._zv.toFixed(2), 15, circlePosition.x, circlePosition.y-50); // + '/' + this.damagePoints
        //     // drawEngine.drawText('' + this.speedFactor.toFixed(2), 15, circlePosition.x, circlePosition.y-50); // + '/' + this.damagePoints
        //     // drawEngine.drawText('' + this.healthPoints.toFixed(2), 15, circlePosition.x, circlePosition.y-50); // + '/' + this.damagePoints
        //     // drawEngine.drawText('' + this.Acceleration.key, 15, circlePosition.x, circlePosition.y-50); // + '/' + this.damagePoints
        //     this.targetPosition && drawEngine.drawLine(this.Position, this.targetPosition, { stroke: ['', '#f00', '#00f'][this.Team], fill: '' });
        // }
        if (!this.stuntTime.elapsed()) {
            drawEngine.drawCircle(this.Position, this.Radius * .8, { stroke: transparent, fill: ['', 'rgb(255,0,0,.4)', 'rgb(0,0,255,.4)'][this.Team], lineWidth: 3 }); // this.Size.length()
        }
        // drawEngine.drawText('' + this._z, 15, this.Position.x, this.Position.y-50); // + '/' + this.damagePoints
        super.draw(ctx);
    }
    drawBar(ctx, offsetY, valueToShow, valueMax, color, condition, lineWidth = 6) {
        if (condition) {
            let value = valueToShow / valueMax;
            ctx.beginPath();
            ctx.strokeStyle = "#fff";
            ctx.lineWidth = 8;
            ctx.moveTo(this.Position.x - this.Size.x / 2, this.Position.y + offsetY);
            ctx.lineTo(this.Position.x + this.Size.x / 2, this.Position.y + offsetY);
            ctx.stroke();
            ctx.beginPath();
            ctx.strokeStyle = color;
            ctx.lineWidth = lineWidth;
            ctx.moveTo(this.Position.x - this.Size.x / 2, this.Position.y + offsetY);
            ctx.lineTo(this.Position.x - this.Size.x / 2 + this.Size.x * value, this.Position.y + offsetY);
            ctx.stroke();
        }
    }
}

/**
 * Class representing a Quadtree node.
 *
 * @example
 * ```typescript
 * const tree = new Quadtree({
 *   width: 100,
 *   height: 100,
 *   x: 0,           // optional, default:  0
 *   y: 0,           // optional, default:  0
 *   maxObjects: 10, // optional, default: 10
 *   maxLevels: 4,   // optional, default:  4
 * });
 * ```
 *
 * @example Typescript: If you like to be explicit, you optionally can pass in a generic type for objects to be stored in the Quadtree:
 * ```typescript
 * class GameEntity extends Rectangle {
 *   ...
 * }
 * const tree = new Quadtree<GameEntity>({
 *   width: 100,
 *   height: 100,
 * });
 * ```
 */
class Quadtree {
    /**
     * Quadtree Constructor
     * @param props - bounds and properties of the node
     * @param level - depth level (internal use only, required for subnodes)
     */
    constructor(props, level = 0) {
        this.bounds = {
            x: props.x || 0,
            y: props.y || 0,
            width: props.width,
            height: props.height,
        };
        this.maxObjects = (typeof props.maxObjects === 'number') ? props.maxObjects : 10;
        this.maxLevels = (typeof props.maxLevels === 'number') ? props.maxLevels : 4;
        this.level = level;
        this.objects = [];
        this.nodes = [];
    }
    /**
     * Get the quadrant (subnode indexes) an object belongs to.
     *
     * @example Mostly for internal use but you can call it like so:
     * ```typescript
     * const tree = new Quadtree({ width: 100, height: 100 });
     * const rectangle = new Rectangle({ x: 25, y: 25, width: 10, height: 10 });
     * const indexes = tree.getIndex(rectangle);
     * console.log(indexes); // [1]
     * ```
     *
     * @param obj - object to be checked
     * @returns Array containing indexes of intersecting subnodes (0-3 = top-right, top-left, bottom-left, bottom-right).
     */
    getIndex(obj) {
        return obj.qtIndex(this.bounds);
    }
    /**
     * Split the node into 4 subnodes.
     * @internal
     *
     * @example Mostly for internal use! You should only call this yourself if you know what you are doing:
     * ```typescript
     * const tree = new Quadtree({ width: 100, height: 100 });
     * tree.split();
     * console.log(tree); // now tree has four subnodes
     * ```
     */
    split() {
        const level = this.level + 1, width = this.bounds.width / 2, height = this.bounds.height / 2, x = this.bounds.x, y = this.bounds.y;
        const coords = [
            { x: x + width, y: y },
            { x: x, y: y },
            { x: x, y: y + height },
            { x: x + width, y: y + height },
        ];
        for (let i = 0; i < 4; i++) {
            this.nodes[i] = new Quadtree({
                x: coords[i].x,
                y: coords[i].y,
                width,
                height,
                maxObjects: this.maxObjects,
                maxLevels: this.maxLevels,
            }, level);
        }
    }
    /**
     * Insert an object into the node. If the node
     * exceeds the capacity, it will split and add all
     * objects to their corresponding subnodes.
     *
     * @example you can use any shape here (or object with a qtIndex method, see README):
     * ```typescript
     * const tree = new Quadtree({ width: 100, height: 100 });
     * tree.insert(new Rectangle({ x: 25, y: 25, width: 10, height: 10, data: 'data' }));
     * tree.insert(new Circle({ x: 25, y: 25, r: 10, data: 512 }));
     * tree.insert(new Line({ x1: 25, y1: 25, x2: 60, y2: 40, data: { custom: 'property'} }));
     * ```
     *
     * @param obj - Object to be added.
     */
    insert(obj) {
        //if we have subnodes, call insert on matching subnodes
        if (this.nodes.length) {
            const indexes = this.getIndex(obj);
            for (let i = 0; i < indexes.length; i++) {
                this.nodes[indexes[i]].insert(obj);
            }
            return;
        }
        //otherwise, store object here
        this.objects.push(obj);
        //maxObjects reached
        if (this.objects.length > this.maxObjects && this.level < this.maxLevels) {
            //split if we don't already have subnodes
            if (!this.nodes.length) {
                this.split();
            }
            //add all objects to their corresponding subnode
            for (let i = 0; i < this.objects.length; i++) {
                const indexes = this.getIndex(this.objects[i]);
                for (let k = 0; k < indexes.length; k++) {
                    this.nodes[indexes[k]].insert(this.objects[i]);
                }
            }
            //clean up this node
            this.objects = [];
        }
    }
    /**
     * Return all objects that could collide with the given geometry.
     *
     * @example Just like insert, you can use any shape here (or object with a qtIndex method, see README):
     * ```typescript
     * tree.retrieve(new Rectangle({ x: 25, y: 25, width: 10, height: 10, data: 'data' }));
     * tree.retrieve(new Circle({ x: 25, y: 25, r: 10, data: 512 }));
     * tree.retrieve(new Line({ x1: 25, y1: 25, x2: 60, y2: 40, data: { custom: 'property'} }));
     * ```
     *
     * @param obj - geometry to be checked
     * @returns Array containing all detected objects.
     */
    retrieve(obj) {
        const indexes = this.getIndex(obj);
        let returnObjects = this.objects;
        //if we have subnodes, retrieve their objects
        if (this.nodes.length) {
            for (let i = 0; i < indexes.length; i++) {
                returnObjects = returnObjects.concat(this.nodes[indexes[i]].retrieve(obj));
            }
        }
        //remove duplicates
        returnObjects = returnObjects.filter(function (item, index) {
            return returnObjects.indexOf(item) >= index;
        });
        return returnObjects;
    }
    /**
     * Clear the Quadtree.
     *
     * @example
     * ```typescript
     * const tree = new Quadtree({ width: 100, height: 100 });
     * tree.insert(new Circle({ x: 25, y: 25, r: 10 }));
     * tree.clear();
     * console.log(tree); // tree.objects and tree.nodes are empty
     * ```
     */
    clear() {
        this.objects = [];
        for (let i = 0; i < this.nodes.length; i++) {
            if (this.nodes.length) {
                this.nodes[i].clear();
            }
        }
        this.nodes = [];
    }
}

class Pointer {
    constructor() {
        this.Position = new Vector(0, 0);
        this.leftButton = false;
        this.middleButton = false;
        this.rigthButton = false;
    }
}

class InputMouse {
    // public clickAction = (position:Vector) => { }// for binding
    constructor() {
        this.lastX = 0;
        this.lastY = 0;
        // public dragStart: Vector | undefined
        // public camDragged: boolean = false;
        // private zoomValue: number = 2 * 800;
        this.pointer = new Pointer();
        this.eventMouseDown = () => { }; // for binding
        this.eventMouseMove = () => { }; // for binding
        this.eventMouseUp = () => { }; // for binding
        // public eventMouseDrag = (dragged: Vector) => { }    // for binding
        this.eventMouseScroll = () => { }; // for binding
        this.eventContextmenu = () => { }; // for binding
        // setZoomValue(factor: number) {
        //   this.zoomValue /= factor
        // }
        this.getMousePosition = (evt) => {
            var rect = c2d.getBoundingClientRect();
            // Map screen coordinates to internal canvas resolution (540x960)
            // Internal: 540x960
            // Screen (CSS): 100vh height, width varies
            // Scale X: (screenX - rectLeft) / rectWidth * 540
            // Scale Y: (screenY - rectTop) / rectHeight * 960
            this.lastX = (evt.clientX - rect.left) / rect.width * 540;
            this.lastY = (evt.clientY - rect.top) / rect.height * 960;
            this.pointer.Position = new Vector(this.lastX, this.lastY);
        };
        this.handleMouseDown = (evt) => {
            if (!e)
                var e = window.event;
            if (e.which)
                this.pointer.leftButton = (e.which == 1);
            else if (e.button)
                this.pointer.leftButton = (e.button == 0);
            // if (e.which) this.pointer.middleButton = (e.which == 2);
            // else if (e.button) this.pointer.middleButton = (e.button == 1);
            if (e.which)
                this.pointer.rigthButton = (e.which == 3);
            else if (e.button)
                this.pointer.rigthButton = (e.button == 1);
            this.getMousePosition(evt);
            this.pointer.Position = new Vector(this.lastX, this.lastY);
            // if (this.pointer.middleButton) {
            //   this.dragStart = new Vector(this.lastX, this.lastY);
            //   this.camDragged = false;
            // }
            // // https://stackoverflow.com/questions/21842814/mouse-position-to-isometric-tile-including-height
            // if (this.mouseLeftPressed) {
            //     this.playerDragStart = { x: this.lastX, y: this.lastY };
            //     this.playerDragged = false;
            // }
            // this.updateWorldCursorPosition();
            // this.clickAction(this.pointer.Position)
            this.eventMouseDown();
        };
        this.handleMouseMove = (evt) => {
            this.getMousePosition(evt);
            // if (this.pointer.middleButton) {
            //   this.camDragged = true;
            //   if (this.dragStart) {
            //     let start = new Vector(this.dragStart.x, this.dragStart.y)
            //     let last = new Vector(this.lastX, this.lastY)
            //     // this._scene._cam._move((start.x - last.x) * this._scene._cam._distance / (2 * 800), (start.y - last.y) * this._scene._cam._distance / (2 * 800))
            //     this.eventMouseDrag(new Vector((start.x - last.x), (start.y - last.y)));
            //     this.dragStart = new Vector(this.lastX, this.lastY);
            //   }
            // }
            // this.updateWorldCursorPosition();
            this.eventMouseMove();
            return evt.preventDefault() && false;
        };
        this.handleMouseUp = (evt) => {
            this.getMousePosition(evt);
            // if (e.which) this.pointer.middleButton = (e.which == 2);
            // else if (e.button) this.pointer.middleButton = (e.button == 1);
            // if (this.pointer.middleButton) {
            //   this.dragStart = undefined;
            //   this.pointer.middleButton = false;
            // }
            // this.updateWorldCursorPosition();
            this.pointer.leftButton = false;
            // this.pointer.middleButton = false;
            this.pointer.rigthButton = false;
            // this.clickAction(new Vector(this.lastX,this.lastY))
            this.eventMouseUp();
            return evt.preventDefault() && false;
        };
        this.handleContextmenu = (evt) => {
            this.eventContextmenu();
            return evt.preventDefault() && false;
        };
        this.handleScroll = (evt) => {
            var delta = evt.wheelDelta ? evt.wheelDelta / 40 : evt.detail ? -evt.detail : 0;
            if (delta) {
                this.eventMouseScroll();
            }
            return evt.preventDefault() && false;
        };
        const canvas = document.getElementById('c2d');
        if (canvas) {
            canvas.addEventListener('mousedown', this.handleMouseDown, false);
            canvas.addEventListener('mousemove', this.handleMouseMove, false);
            canvas.addEventListener('mouseup', this.handleMouseUp, false);
            canvas.addEventListener('DOMMouseScroll', this.handleScroll, false);
            canvas.addEventListener('mousewheel', this.handleScroll, false); // chrome    
            canvas.addEventListener("contextmenu", this.handleContextmenu, false);
        }
    }
}
const inputMouse = new InputMouse();

const SND_UNIT_PLACE = [.5, 0, 246.9417, .01, .06, .42, , 9.1, 20, , 2, , , , , , , 0, .01];
const SND_BTN_HOVER = [, 0, 65.40639, .02, .08, .03, , 2.5, , 8, , , , , , , .02, 0, .03, .05];
const SND_EXPLOSION = [.1, , 900, , , .5, 2, .1, .2, , , , .08, 10, , .34, .05, .32, .1, .5];
const SND_STAR = [.5, .01, 1696, .01, .08, .14, 1, 1.9, , 2.9, 67, .08, , , , , , .66, .03];
const SND_HIGHSCORE = [.5, , 221, , .05, .07, , 1.1, , .1, 50, , .01, , , , , .9, , .01];
const SND_DEATH = [, 0, 468, .03, .02, .06, , 1.37, -9, 2.6, -100, .02, .01, -0.3, , -0.1, .01, .57, .06, .01];
const SND_ARROW_SHOOT = [.03, .5, 293.6648, .06, .21, .01, , 0, , 1, 1, .2, , 100, -20, , , 0, .02];
const SND_BATTLE_BEGIN = [3, 0, 130.8128, .1, 1, .3, , .9, , -0.4, , , -0.1, , , , .1, .3, .1, .01];
const SND_BTN_CLICK = [1.09, , 150, .02, .06, .04, , 2.41, -5.8, , , , , 1, , .1, , .47, .02];
const SND_UNIT_DAMAGE = [.5, , 1115, .02, .01, .04, 4, 1.13, -0.4, .2, 542, .13, -0.04, .1, 3, .1, , .12, .01, .25];

// ZzFXMicro - Zuper Zmall Zound Zynth - v1.1.7 ~ 900 bytes minified
const zzfxV = .25; // volume
const zzfxX = new AudioContext; // audio context
const zzfx =    // play sound
(p = 1, k = .05, b = 220, e = 0, r = 0, t = .1, q = 0, D = 1, u = 0, y = 0, v = 0, z = 0, l = 0, E = 0, A = 0, F = 0, c = 0, w = 1, m = 0, B = 0) => {
  let
    M = Math, R = 44100, d = 2 * M.PI, G = u *= 500 * d / R / R, C = b *= (1 - k + 2 * k * M.random(k = [])) * d / R, g = 0, H = 0, a = 0, n = 1, I = 0,
    J = 0, f = 0, x, h;e = R * e + 9;m *= R;r *= R;t *= R;c *= R;y *= 500 * d / R ** 3;A *= d / R;v *= d / R;z *= R;l = R * l | 0;for (h = e + m +
r + t + c | 0;a < h;k[a++] = f)++J % (100 * F | 0) || (f = q ? 1 < q ? 2 < q ? 3 < q ? M.sin((g % d) ** 3) : M.max(M.min(M.tan(g), 1)
    , -1) : 1 - (2 * g / d % 2 + 2) % 2 : 1 - 4 * M.abs(M.round(g / d) - g / d) : M.sin(g), f = (l ? 1 - B + B * M.sin(d * a / l) : 1) * (0 < f ? 1 :
    -1) * M.abs(f) ** D * p * zzfxV * (a < e ? a / e : a < e + m ? 1 - (a - e) / m * (1 - w) : a < e + m + r ? w : a < h - c ? (h - a - c) / t * w : 0), f = c ? f /
2 + (c > a ? 0 : (a < h - c ? 1 : (h - a) / c) * k[a - c | 0] / 2) : f), x = (b += u += y) * M.cos(A * H++), g += x - x * E * (1 - 1E9 * (M.sin(a)
+ 1) % 2), n && ++n > z && (b += v, C += v, n = 0), !l || ++I % l || (b = C, u = G, n = n || 1);p = zzfxX.createBuffer(1, h, R);p.
    getChannelData(0).set(k);b = zzfxX.createBufferSource();b.buffer = p;b.connect(zzfxX.destination,
  );b.start();return b
};

const sound = (s) => {
    if (!soundWaitTime.elapsed())
        return;
    zzfx(...s);
    soundWaitTime.set(.05);
};

class Button {
    constructor(x, y, w, h, text = "", title = "", fontSize = 50, colors = {
        'default': {
            text: '#ccc',
            color: transparent,
            lineWidth: 0,
            lineColor: transparent,
            fontSize: fontSize
        },
        'hover': {
            text: '#fff',
            color: 'rgb(150,150,150,.3)',
            lineWidth: 0,
            lineColor: '#ccc',
            fontSize: fontSize
        },
        'active': {
            text: '#fff',
            color: 'rgb(200,200,200,.3)',
            lineWidth: 0,
            lineColor: '#ccc',
            fontSize: fontSize
        },
        'disabled': {
            text: '#fff',
            color: '#ababab',
            lineWidth: 0,
            lineColor: '#ccc',
            fontSize: fontSize
        }
    }) {
        this.visible = true;
        this.enabled = true;
        this.selected = false;
        this.Position = new Vector(x, y);
        this.Size = new Vector(w, h);
        this.name = '';
        this.width = w;
        this.height = h;
        this.text = text;
        this.title = title;
        this.data = '';
        this.clickCB = () => { };
        this.colors = colors;
        this.state = 'default'; // current button state
        this.hoverEvent = () => {
        };
        this.hoverOutEvent = () => {
        };
        this.clickEvent = () => {
        };
    }
    _update(dt) {
        if (!this.visible)
            return;
        if (!inputMouse.pointer)
            return;
        let mousePosition = inputMouse.pointer.Position;
        let localX = this.Position.x - this.width / 2; //
        let localY = this.Position.y - this.height / 2;
        // check for hover
        if (mousePosition.x >= localX && mousePosition.x <= localX + this.width &&
            mousePosition.y >= localY && mousePosition.y <= localY + this.height) { //  - rect.top
            if (this.enabled) {
                if (this.state != 'active' && this.state != 'hover') {
                    this.hoverEvent();
                    this.state = 'hover';
                }
                // check for click
                if (this.state != 'active' && inputMouse.pointer.leftButton) {
                    this.state = 'active';
                }
            }
        }
        else {
            if (this.state != 'active' && this.state == 'hover') {
                this.hoverOutEvent();
            }
            this.state = 'default';
        }
    }
    _draw(ctx) {
        if (!this.visible)
            return;
        var props = this.colors[this.state];
        ctx.save();
        ctx.translate(this.Position.x, this.Position.y);
        ctx.save();
        if (this.enabled && (this.state == 'hover' || this.state == 'active')) {
            ctx.scale(1.05, 1.05);
        }
        if (!this.enabled)
            ctx.globalAlpha = .2;
        ctx.strokeStyle = props.lineColor;
        ctx.lineWidth = props.lineWidth;
        ctx.fillStyle = props.color;
        ctx.beginPath();
        // FIX: roundRect Build error Uncaught TypeError: a.ua is not a function
        // ctx.roundRect(0 - this.width / 2, 0 - this.height / 2, this.width, this.height, 8);
        ctx.rect(0 - this.width / 2, 0 - this.height / 2, this.width, this.height);
        // ctx.stroke();///// BUG!!
        ctx.fill();
        if (this.selected) {
            ctx.lineWidth = 2;
            ctx.strokeStyle = '#ccc';
            ctx.stroke();
        }
        // text inside
        drawEngine.drawText(this.text, props.fontSize, 0, 0 + this.height / 4, props.text);
        if (this.unit)
            this.unit.draw(ctx);
        // text outside
        if (this.enabled)
            drawEngine.drawText(this.data, props.fontSize * .5, 0, 0 + this.height, props.text);
        // if (this.image)
        //   drawEngine.drawImage(this.image, 0 - this.width / 2, 0 - this.height / 2)
        ctx.globalAlpha = 1;
        ctx.restore();
        // Help text
        if (this.state == 'hover') {
            // ctx.textAlign = "left";
            // ctx.lineWidth = props.lineWidth; 
            // var size = ctx.measureText(this.state);
            // ctx.strokeStyle = 'black';
            // const offset = this.height + this.data.length > 0?this.height*1.5:this.height/2
            // ctx.strokeText(this.title, 0 - size.width / 2, offset );
            // ctx.fillStyle = 'white';
            // ctx.fillText(this.title, 0 - size.width / 2, offset  );
            drawEngine.drawText(this.title, props.fontSize * .5, 0, this.data.length > 0 ? this.height * 1.8 : this.height, props.text);
        }
        ctx.restore();
        // if (debug.showButtonBounds) {
        //   ctx.beginPath()
        //   ctx.strokeStyle = 'red'
        //   ctx.rect(this.Position.x - this.width / 2, this.Position.y - this.height / 2, this.width, this.height);
        //   ctx.stroke()
        // }
    }
    mouseUpEvent(mousePosition) {
        if (!this.visible) // || (this.parent && !this.parent.visible)
            return;
        if (!this.enabled)
            return;
        let localX = this.Position.x - this.width / 2;
        let localY = this.Position.y - this.height / 2;
        // check for click
        if (mousePosition.x >= localX && mousePosition.x <= localX + this.width &&
            mousePosition.y >= localY && mousePosition.y <= localY + this.height) { //  - rect.top
            this.clickEvent();
            if (typeof this.clickCB === 'function') {
                this.clickCB(this);
            }
            this.state = 'default';
        }
    }
    static setHover(buttons) {
        let { style, styleHover } = gameDatabase.getButtonStyle();
        buttons.forEach(btn => {
            btn.colors.default = style;
            btn.colors.hover = styleHover;
            btn.hoverEvent = () => {
                sound(SND_BTN_HOVER);
            };
            btn.clickEvent = () => {
                sound(SND_BTN_CLICK);
            };
        });
    }
}

class Label extends GameObject {
    constructor(text, position, size, team, color = '#fff') {
        super(position, size, team);
        this._zv = 4;
        this._zgrav = 0.98;
        this.text = text;
        this.life = 50;
        this.color = color;
    }
    _update(dt) {
        if (this.life == 0) {
            this.destroy();
            return;
        }
        super._update(dt);
        this.life -= 1;
    }
    draw(ctx) {
        drawEngine.drawText(this.text, this.Radius, this.Position.x, this.Position.y - this._z, this.color);
        // drawEngine.drawCircle(this.Position, this.Radius, {stroke: ['','#f00','#00f'][this.Team], fill: 'transparent'}); // this.Size.length()
    }
}

class SummaryState {
    constructor() {
        this.Active = false;
        this.results = ['', 'YOU WIN!', 'YOU LOOSE', 'TIE'];
        this.result = 0;
        this.seed = Math.random(); //.601 // 
        this.newHighScore = false;
        this.labels = [];
        this.buttons = [];
        this.count = 0;
        this.defTileSize = new Vector(40 / 2, 44 / 2);
        this.defMapDim = new Vector(48 * 2, 25 * 2);
        this.gameMap = new GameMap(this.defMapDim, this.defTileSize, this.seed);
    }
    setGameResult(data) {
        this.data = data;
        this.result = data.result;
    }
    get posY() {
        return 700 + this.count++ * 100;
    }
    onEnter() {
        this.newHighScore = false;
        // let score = this.data!.teamBravoCost - this.data!.teamAlphaCost
        //let score = this.data!.teamAlphaBeginCount + this.data!.teamAlphaEndCount
        this.score = this.data.kills.alpha - this.data.kills.bravo;
        this.score = Math.max(0, this.score);
        this.createGameButtons();
        if (this.result == 1 /* GameResult.win */) {
            this.time0 = setTimeout(() => {
                this.getReward();
            }, 1000);
        }
        else if (this.result == 2 /* GameResult.loose */) {
            sound(SND_DEATH);
        }
        inputMouse.eventMouseDown = () => this.mouseDown();
    }
    createGameButtons() {
        this.buttons = [];
        this.count = 0;
        let btn;
        if (gameLevel.levelIndex < gameLevel.finalLevelIndex) {
            if (this.result == 1 /* GameResult.win */) {
                btn = new Button(drawEngine.canvasWidth / 2, this.posY - 50, 500, 80, "Next", "");
                btn.clickCB = () => {
                    this.time0 && clearTimeout(this.time0);
                    this.time1 && clearTimeout(this.time1);
                    this.time2 && clearTimeout(this.time2);
                    this.time3 && clearTimeout(this.time3);
                    gameState.next();
                    gameStateMachine.setState(gameState);
                };
                this.buttons.push(btn);
            }
        }
        else {
            this.btnEnd = new Button(drawEngine.canvasWidth / 2, this.posY - 50, 500, 80, "THE END");
            this.buttons.push(this.btnEnd);
        }
        btn = new Button(drawEngine.canvasWidth / 2, this.posY, 500, 80, "Try again", "");
        btn.clickCB = () => {
            gameStateMachine.setState(gameState);
            gameState.init(gameState.level.levelIndex);
        };
        this.buttons.push(btn);
        btn = new Button(drawEngine.canvasWidth / 2, this.posY, 500, 80, "Back to campaing", "");
        btn.clickCB = () => {
            gameStateMachine.setState(campaingState);
        };
        this.buttons.push(btn);
        Button.setHover(this.buttons);
        if (this.btnEnd) {
            this.btnEnd.clickEvent = () => {
                sound(SND_BATTLE_BEGIN);
            };
        }
    }
    onLeave() {
        this.buttons = [];
        inputMouse.eventMouseDown = () => { };
    }
    onUpdate(dt) {
        this.labels = this.labels.filter((f) => { return f.Active; });
        this.labels.forEach((item) => {
            item._update(dt);
        });
        if (this.result == 1 /* GameResult.win */)
            this.gameMap.drawTileMap(drawEngine.context);
        const xCenter = drawEngine.context.canvas.width / 2;
        drawEngine.drawText('Level ' + (gameLevel.levelIndex + 1), 80, xCenter, 120);
        drawEngine.drawText('HighScore: ' + gameLevel.level[gameLevel.levelIndex].highScore, 40, xCenter, 180);
        // drawEngine.drawText(this.data?.teamAlphaBeginCount + ' vs ' + this.data?.teamBravoBeginCount, 40, xCenter, 220);
        if (this.score != undefined) {
            drawEngine.drawText('Red kills: ' + this.data?.kills.alpha, 50, xCenter - 200, 270, '#d00');
            drawEngine.drawText('Blue kills: ' + this.data?.kills.bravo, 50, xCenter + 200, 270, '#00d');
            drawEngine.drawText('Score: ' + this.score, 60, xCenter, 350);
        }
        if (this.result == 3 /* GameResult.tie */)
            drawEngine.drawText(this.results[this.result], 80, xCenter, 270);
        if (this.result == 1 /* GameResult.win */) {
            drawEngine.drawText('Level cleared! ', 80, xCenter, 450);
            drawEngine.drawText(Array(gameLevel.level[gameLevel.levelIndex].stars).fill('⭐').join(''), 80, xCenter, 530);
        }
        drawEngine.drawItems([...this.labels]);
        // drawEngine.drawText(this.data?.teamAlphaEndCount + ' vs ' + this.data?.teamBravoEndCount, 40, xCenter, 420);
        // if (this.result == GameResult.win) {
        //   drawEngine.drawText("Gold in Bank: "+ gameState. playerBankGold +'$', 30, xCenter, 600);
        // }
        this.buttons.forEach((button) => {
            button._update(dt);
            button._draw(drawEngine.context);
        });
        if (inputKeyboard.isEscape) {
            gameStateMachine.setState(menuState);
        }
    }
    getReward() {
        if (!this.score)
            return;
        if (this.score > 0 && this.score > gameLevel.level[gameLevel.levelIndex].highScore) {
            gameLevel.level[gameLevel.levelIndex].highScore = this.score;
            this.newHighScore = true;
        }
        if (this.score > 0) {
            this.labels.push(new Label('+' + this.score, new Vector(drawEngine.canvasWidth / 2, drawEngine.canvasHeight / 2), new Vector(100, 100), 0));
        }
        else {
            this.labels.push(new Label('No score', new Vector(drawEngine.canvasWidth / 2, drawEngine.canvasHeight / 2), new Vector(100, 100), 0));
        }
        let t = 1000;
        if (this.data.teamAlphaEndCount > this.data.teamAlphaBeginCount / 8) {
            this.time1 = setTimeout(() => {
                sound(SND_STAR);
                this.labels.push(new Label('⭐', new Vector(drawEngine.canvasWidth / 2, drawEngine.canvasHeight / 2), new Vector(100, 100), 0));
                gameLevel.level[gameLevel.levelIndex].stars += 1;
            }, t);
            t += 1000;
        }
        if (this.data.teamAlphaEndCount > this.data.teamAlphaBeginCount / 4) {
            this.time2 = setTimeout(() => {
                sound(SND_STAR);
                this.labels.push(new Label('⭐', new Vector(drawEngine.canvasWidth / 2, drawEngine.canvasHeight / 2), new Vector(100, 100), 0));
                gameLevel.level[gameLevel.levelIndex].stars += 1;
            }, t);
            t += 1000;
        }
        if (this.newHighScore) {
            this.time3 = setTimeout(() => {
                sound(SND_HIGHSCORE);
                this.labels.push(new Label('🏆 new HighScore', new Vector(drawEngine.canvasWidth / 2, drawEngine.canvasHeight / 2), new Vector(40, 40), 0));
            }, t);
        }
    }
    mouseDown() {
        if (inputMouse.pointer.leftButton) {
            this.buttons.forEach(button => button.mouseUpEvent(inputMouse.pointer.Position));
        }
    }
    ;
}
const summaryState = new SummaryState();

class Particle extends GameObject {
    constructor(position, size = new Vector(4, 4), team) {
        super(position, size, team);
        this.ttl = 100;
    }
    _update(dt) {
        this.ttl -= 1;
    }
    draw(ctx) {
        ctx.fillStyle = ['#333', 'rgb(255,0,0,.5)', 'rgb(0,0,255,.5)'][this.Team];
        ctx.beginPath();
        ctx.arc(this.Position.x, this.Position.y, Math.max(0, (100 - this.ttl)) / 100 * this.Radius, 0, 2 * Math.PI);
        ctx.fill();
    }
}

class GamePresenter {
    constructor() {
    }
    // Draw calls
    drawTroop(context, unit, dir) {
        this.drawBase(context, unit, dir);
        this.drawDeath(drawEngine.contextDeath, unit, dir);
    }
    drawEntity(context, unit, dir) {
        this.drawBase(context, unit, dir);
        this.drawDeath(drawEngine.contextDeath, unit, dir);
    }
    drawBase(context, unit, dir, anim = 1) {
        // Shadow
        context.fillStyle = "rgba(0,0,0,.5)";
        context.beginPath();
        if (unit._z > 0)
            context.ellipse(unit.Position.x, unit.Position.y + unit.Radius * 2 / 3, (unit.Size.x / 2) / Math.max(1, unit._z / 10), (unit.Size.x / 4) / Math.max(1, unit._z / 10), 0, 0, Math.PI * 2);
        else
            context.ellipse(unit.Position.x, unit.Position.y + unit.Radius * 2 / 3, (unit.Size.x / 2), (unit.Size.x / 4), 0, 0, Math.PI * 2);
        context.fill();
        let renderSize = unit.Size.clone().scale(2);
        const circlePosition = unit.Position.clone().add(new Vector(0, -unit._z));
        const rectPosition = circlePosition.add(renderSize.clone().scale(-0.5)); //+ Math.abs(Math.sin(time*10)*10)
        let realSize = unit.imageSize.clone().scale(renderSize.x / 32); //.scale(10);
        context.save();
        context.translate(rectPosition.x + realSize.x / 2, rectPosition.y + realSize.y / 2);
        dir && context.scale(-1, 1);
        //  drawEngine.drawRectangle(new Vector(-realSize.x / 2, -realSize.y / 2), renderSize, { stroke: color, fill: 'blue' });
        context.imageSmoothingEnabled = false;
        context.drawImage(unit.image, 0, 0, unit.imageSize.x, unit.imageSize.y, -realSize.x / 2, -realSize.y / 2, realSize.y, realSize.y);
        unit.drawChilds(context, realSize);
        context.restore();
        // attackRange
        // context.lineWidth = 1
        // context.strokeStyle = "rgba(255,255,255,.3)"
        // context.beginPath()
        // context.ellipse(unit.Position.x, unit.Position.y , unit.Radius * unit.attackRange, unit.Radius * unit.attackRange, 0, 0, Math.PI*2)
        // context.stroke()
        // // attackRangeMinimun
        // context.lineWidth = 1
        // context.strokeStyle = "rgba(255,255,255,.3)"
        // context.beginPath()
        // context.ellipse(unit.Position.x, unit.Position.y , unit.attackRangeMinimun, unit.attackRangeMinimun, 0, 0, Math.PI*2)
        // context.stroke()
    }
    drawDeath(context, unit, dir) {
        if (unit.healthPoints < 1) {
            let renderSize = unit.Size.clone().scale(2);
            const rectPosition = unit.Position.clone().add(new Vector(0, -unit._z)).add(renderSize.clone().scale(-0.5));
            let realSize = unit.imageSize.clone().scale(renderSize.x / 32);
            context.save();
            context.translate(rectPosition.x + realSize.x / 2, rectPosition.y + realSize.y / 2);
            dir && context.scale(-1, 1);
            context.rotate(Math.PI / 2);
            context.font = `${unit.Radius * .8}px Impact, sans-serif-black`;
            context.textBaseline = 'middle';
            context.textAlign = 'center';
            context.strokeText("💀", 0, 0);
            context.restore();
        }
    }
}
const gamePresenter = new GamePresenter();

class Archer extends Unit {
    constructor(position, sizeFactor, team, type = 2 /* EntityType.Archer */) {
        super(position, sizeFactor, team, type);
        this.bulletSpeed = 14;
        this.shootRangeMinimun = 0;
        this.shootCoolDownTimer = new Timer(0);
        this.slowWhileInRange = true;
        this.loadProperties();
    }
    setActive(range) {
        super.setActive(range);
        this.shootCoolDownTimer = new Timer(1); // shootFirstWait
    }
    shootHandler(targetPosition, velocity, zv) { }
    _shoot(targetPosition, velocity) {
        if (this.shootCoolDownTimer.elapsed()) {
            this.shootHandler(targetPosition, velocity, 0);
            this.shootCoolDownTimer.set(this.shootCoolDownValue);
        }
    }
    shootTo(position, zv = 10) {
        super.shootTo(position);
        const data = this.calculateShoot(position); //.rotate(rand(this.bulletSpread, -this.bulletSpread))
        this._shoot(position, data.velocity);
    }
    draw(ctx, dir = false) {
        gamePresenter.drawTroop(ctx, this, this.LooktoRight || dir);
        super.draw(ctx);
    }
    drawChilds(ctx, realSize) {
        ctx.translate(this.Size.x * -0.2, 0 + realSize.y * .2);
        ctx.rotate(-0.1); // +  Math.sin(time*8)*.05
        // ctx.lineWidth = 2;
        // ctx.fillStyle = "#a33";
        // ctx.fillRect(0, 0, this.Size.x *.1, -this.Size.y);
        // ctx.fillStyle = "#a80";
        // ctx.fillRect(this.Size.x*.1, 0, this.Size.x*.05, -this.Size.y);
        ctx.beginPath();
        ctx.lineWidth = 5;
        ctx.moveTo(this.Size.x, 0);
        ctx.lineTo(0, 0);
        ctx.moveTo(this.Size.x, 0);
        ctx.lineTo(this.Size.x * .6, this.Size.y * .2);
        ctx.moveTo(this.Size.x, 0);
        ctx.lineTo(this.Size.x * .7, this.Size.y * -0.2);
        ctx.strokeStyle = "#a33";
        ctx.stroke();
    }
    _update(dt) {
        let canShoot = false;
        if (this.targetPosition != undefined) {
            let distance = this.Position.distance(this.targetPosition);
            canShoot = distance < this.shootRange && distance > this.shootRangeMinimun;
        }
        // FEATURE slow movement while target
        if (this.slowWhileInRange && canShoot) { // && this.attackCoolDownTimer.p100() < 100
            this.Velocity.scale(.5);
            this.Acceleration.scale(.5);
            this.maxSpeed = this.Radius * this.speedFactor / 1000;
        }
        else
            this.maxSpeed = this.Radius * this.speedFactor / 100;
        super._update(dt);
        if (this.targetPosition && canShoot) {
            this.shootTo(this.targetPosition);
        }
    }
    calculateShoot(targetPosition) {
        const direction = -Math.atan2(this.Position.x - targetPosition.x, this.Position.y - targetPosition.y) - Math.PI / 2;
        const velocity = new Vector(1, 0).rotate(direction).scale(this.bulletSpeed);
        return { velocity };
    }
}

class BodyPart extends GameObject {
    constructor(position, size, team) {
        super(position, size, team);
        this._shouldRenderShadow = false;
        this._size = this._sizeRef = size;
    }
}

class UnitStick extends BodyPart {
    constructor(position, size, team) {
        super(position, size, team);
        this._length = 0;
        this._length = size.y;
    }
    _update(dt) {
        // Block super call
        // super._update(dt) 
    }
    _draw(ctx, offsets = { _position: new Vector(0, 0), r: 0 }) {
        ctx.save();
        ctx.globalAlpha = this._opacity;
        ctx.translate(this.Position.x + offsets._position.x, this.Position.y + offsets._position.y);
        ctx.rotate(this._rotation + offsets.r);
        const w = this._size.x * 2;
        const h = (this._length + 5) * 2;
        // Shift right so sword is at the character's side, not centered
        ctx.translate(w * 0.3, 0);
        // Scale from SVG 16x16 viewBox to weapon space, flip Y so blade points down
        ctx.scale(w / 16, -h / 16);
        ctx.translate(0, -16);
        // Pixel-art sword drawn in SVG coordinates (blade-up, 16x16 grid)
        // Blade outline
        ctx.fillStyle = "#333";
        ctx.fillRect(7, 1, 2, 10);
        ctx.fillRect(6, 2, 4, 8);
        // Blade fill
        ctx.fillStyle = "#E6E6E6";
        ctx.fillRect(7, 2, 2, 8);
        ctx.fillStyle = "#FFF";
        ctx.fillRect(7, 2, 1, 8);
        ctx.fillStyle = "#B3B3B3";
        ctx.fillRect(8, 3, 1, 7);
        // Crossguard
        ctx.fillStyle = "#333";
        ctx.fillRect(5, 10, 6, 2);
        ctx.fillStyle = "#FFD700";
        ctx.fillRect(5, 10, 6, 1);
        ctx.fillStyle = "#C5A000";
        ctx.fillRect(5, 11, 6, 1);
        // Handle
        ctx.fillStyle = "#333";
        ctx.fillRect(7, 12, 2, 3);
        ctx.fillStyle = "#8B4513";
        ctx.fillRect(7, 12, 2, 2);
        ctx.fillStyle = "#FFD700";
        ctx.fillRect(7, 14, 2, 1);
        ctx.restore();
    }
}

class Troop extends Unit {
    constructor(position, sizeFactor, team, type = 0 /* EntityType.Troop */) {
        super(position, sizeFactor, team, type);
        this.weapon = new UnitStick(new Vector(0, 0), new Vector(6, 30), this.Team);
        this.loadProperties();
        this.setSizes();
    }
    draw(ctx, dir) {
        gamePresenter.drawTroop(ctx, this, this.LooktoRight || dir);
        super.draw(ctx);
    }
    drawChilds(ctx, realSize) {
        ctx.translate(0 * .1, 0 + realSize.y * .3);
        // sword
        var anim = this._currentAnim._current;
        if (this.weapon && this._hasWeapon)
            this.weapon._draw(ctx, anim['s']);
    }
}

class UnitSword extends BodyPart {
    constructor(position, size, team) {
        super(position, size, team);
        this._length = 0;
        this._length = size.y;
    }
    _update(dt) {
        // Block super call
        // super._update(dt)
    }
    _draw(ctx, offsets = { _position: new Vector(0, 0), r: 0 }) {
        ctx.save();
        ctx.globalAlpha = this._opacity;
        ctx.translate(this.Position.x + offsets._position.x, this.Position.y + offsets._position.y);
        ctx.rotate(this._rotation + offsets.r);
        const w = this._size.x * 2;
        const h = (this._length + 5) * 2;
        // Shift right so sword is at the character's side, not centered
        ctx.translate(w * 0.3, 0);
        // Scale from SVG 16x16 viewBox to weapon space, flip Y so blade points down
        ctx.scale(w / 16, -h / 16);
        ctx.translate(0, -16);
        // Pixel-art sword drawn in SVG coordinates (blade-up, 16x16 grid)
        // Blade outline
        ctx.fillStyle = "#333";
        ctx.fillRect(7, 1, 2, 10);
        ctx.fillRect(6, 2, 4, 8);
        // Blade fill
        ctx.fillStyle = "#E6E6E6";
        ctx.fillRect(7, 2, 2, 8);
        ctx.fillStyle = "#FFF";
        ctx.fillRect(7, 2, 1, 8);
        ctx.fillStyle = "#B3B3B3";
        ctx.fillRect(8, 3, 1, 7);
        // Crossguard
        ctx.fillStyle = "#333";
        ctx.fillRect(5, 10, 6, 2);
        ctx.fillStyle = "#FFD700";
        ctx.fillRect(5, 10, 6, 1);
        ctx.fillStyle = "#C5A000";
        ctx.fillRect(5, 11, 6, 1);
        // Handle
        ctx.fillStyle = "#333";
        ctx.fillRect(7, 12, 2, 3);
        ctx.fillStyle = "#8B4513";
        ctx.fillRect(7, 12, 2, 2);
        ctx.fillStyle = "#FFD700";
        ctx.fillRect(7, 14, 2, 1);
        ctx.restore();
    }
}

class Knight extends Troop {
    constructor(position, sizeFactor, team) {
        super(position, sizeFactor, team, 3 /* EntityType.Knight */);
        this.loadProperties();
        this.weapon = new UnitSword(new Vector(0, 0), new Vector(10, 30), this.Team);
    }
    draw(ctx, dir = false) {
        super.draw(ctx, this.LooktoRight || dir);
        gamePresenter.drawEntity(ctx, this, this.LooktoRight || dir);
    }
}

class Artillery extends Archer {
    constructor(position, sizeFactor, team) {
        super(position, sizeFactor, team, 4 /* EntityType.Artillery */);
        this.shootCoolDown = () => { return this.shootCoolDownValue; }; // rand(6, 8);
        // force image
        this.getImage(4 /* EntityType.Artillery */, team);
        this.loadProperties();
        this.bulletSpeed = 10;
    }
    // // Artillery targets the farest enemy in range
    // targetCriteria = (a: { distance: number; },b: { distance: number; }) => b.distance - a.distance;
    draw(ctx, dir) {
        super.draw(ctx, dir);
        gamePresenter.drawEntity(ctx, this, this.LooktoRight || dir);
        // this.targetPosition && drawEngine.drawLine(this.Position, this.targetPosition);
        // if (this.Team == Team.Alpha)
        // drawEngine.drawCircle(this.Position, this.shootRange, {stroke: ['','#f00','#00f'][this.Team], fill: 'transparent', lineWidth: 3}); // this.Size.length()
        let value = this.shootCoolDownTimer.p100();
        if (this.showBars && value < 1)
            this.drawBar(ctx, +this.Radius * 1, value * 100, 100, "#0f0", true);
    }
    drawChilds(ctx, realSize) {
        ctx.translate(this.Size.x * .2, 0 + realSize.y * .4);
        ctx.rotate(.4);
        ctx.lineWidth = 2;
        ctx.fillStyle = "#aaa";
        ctx.fillRect(0, 0, this.Size.x * .2, -this.Size.y * 1.1);
        ctx.fillStyle = "#888";
        ctx.fillRect(this.Size.x * .2, 0, this.Size.x * .1, -this.Size.y * 1.1);
    }
}

class Arrow extends Unit {
    constructor(position, sizeFactor, team, range, owner, targetPosition, type = 6 /* EntityType.Arrow */) {
        super(position, sizeFactor, team, type);
        this.height = 50;
        this.owner = owner;
        this.startPosition = position.clone();
        this.targetPosition = targetPosition;
        this.distance = Vector.distance(this.targetPosition, this.startPosition);
    }
    _update(dt) {
        let currentDistance = Vector.distance(this.Position, this.startPosition);
        // easy simulate parabolic
        this._z = Math.cos(-PI / 2 + PI * (currentDistance / this.distance)) * this.height;
        if (this._z <= 0) {
            this.destroy();
            return;
        }
    }
    // _update(dt: number) {
    //     if (this._z <= 0) {
    //         this.destroy()
    //         return
    //     }
    //     super._update(dt)
    // }
    draw(ctx) {
        let color = getTeamColor(this.Team);
        const thisPosition = this.Position.clone().add(new Vector(this.Radius, this.Radius).scale(.5));
        drawEngine.drawCircle(thisPosition.clone().add(new Vector(2, 2)), this.Radius, { stroke: '#222', fill: '#222', lineWidth: 3 });
        drawEngine.drawCircle(thisPosition.add(new Vector(0, -this._z)), this.Radius, { stroke: color, fill: color, lineWidth: 3 });
        super.draw(ctx);
    }
}

class CannonBall extends Arrow {
    constructor(position, sizeFactor, team, owner, targetPosition, height = 100) {
        super(position, sizeFactor, team, 7 /* EntityType.CannonBall */, owner, targetPosition, 7 /* EntityType.CannonBall */);
        this.height = height;
    }
    explodeHandler(explosion) { }
    ;
    explode(position) { }
    destroy() {
        this.explode(this.Position);
        super.destroy();
    }
    draw(ctx) {
        super.draw(ctx);
        this.targetPosition && drawEngine.drawText('🎯', 30, this.targetPosition.x, this.targetPosition.y);
    }
}

class Explosion extends Unit {
    constructor(position, sizeFactor, team, range, owner) {
        super(position, sizeFactor, team, 8 /* EntityType.Explosion */);
        this.owner = owner;
        this.lastPos = position.clone();
        this.range = range;
    }
    _update(dt) {
        this.Size.scale(1.1);
        if (this.Size.length() > this.range)
            this.destroy();
        super._update(dt);
    }
    draw(ctx) {
        const thisPosition = this.Position.clone(); //.add(new Vector(this.Radius, this.Radius).scale(.5));
        let color = 'white';
        drawEngine.context.globalAlpha = .2;
        drawEngine.drawCircle(thisPosition.add(new Vector(0, -this._z)), this.Radius, { stroke: color, fill: color, lineWidth: 10 });
        drawEngine.context.globalAlpha = 1;
        // drawEngine.drawText('' + this.healthPoints, 15, thisPosition.x, thisPosition.y); // + '/' + this.damagePoints
        super.draw(ctx);
    }
}

function createArrow(archer, velocity, targetPosition, sizeFactor = 1) {
    let arrow = new Arrow(archer.Position.clone().add(new Vector(1, 0).rotate(velocity.heading()).scale(archer.Radius / 2)), sizeFactor, archer.Team, archer.attackRange, archer, targetPosition);
    arrow.Acceleration = velocity;
    arrow._z = 1;
    arrow._zv = 4;
    return arrow;
}
function createCannonBall(artillery, velocity, targetPosition, heigth, sizeFactor = 1) {
    let cannonBall = new CannonBall(artillery.Position.clone().add(new Vector(1, 0).rotate(velocity.heading()).scale(artillery.Radius / 2)), sizeFactor, artillery.Team, artillery, targetPosition, heigth);
    cannonBall.Acceleration = velocity;
    cannonBall._z = 1;
    cannonBall._zv = 0;
    cannonBall.explode = (position) => {
        let explosion = new Explosion(position, sizeFactor, artillery.Team, 50 * 1 / sizeFactor, artillery);
        explosion.Mass = 1000;
        cannonBall.explodeHandler(explosion);
    };
    return cannonBall;
}

// TODO - Special case for Artillery
// Enemy target designation
// Target only cluster enemies and avoid friend fire
const enemyTargetDesignation = (units) => {
    units
        .filter(f => f.attackCoolDownTimer.elapsed())
        .filter(f => f.targetPosition == undefined) // && f.targetNode == undefined
        .sort(() => Math.random() - .5)
        .slice(0, 100)
        .forEach((unit) => {
        let nearBy = units
            .filter((f) => { return f.Team != unit.Team; })
            .filter((h) => { return Vector.distance(unit.Position, h.Position) < unit.VisionRange; }) //
            .map((otherUnit) => ({ unit: otherUnit, distance: Vector.distance(unit.Position, otherUnit.Position) }))
            .sort((a, b) => a.distance - b.distance)
            .map((entry) => entry.unit);
        // Artillery special target designator
        // the farest enemy into shoot range
        if (unit.type == 4 /* EntityType.Artillery */) {
            nearBy = units
                .filter((f) => { return f.Team != unit.Team; })
                .filter((h) => { return Vector.distance(unit.Position, h.Position) < unit.shootRange; }) //
                .map((otherUnit) => ({ unit: otherUnit, distance: Vector.distance(unit.Position, otherUnit.Position) }))
                .sort((a, b) => b.distance - a.distance)
                .map((entry) => entry.unit);
        }
        if (nearBy.length > 0) {
            unit.targetPosition = nearBy[0].Position.clone();
            // forget target after a while
            setTimeout(() => {
                unit.targetPosition = undefined;
            }, rand(500, 800));
        }
        else
            unit.targetPosition = undefined;
    });
};
const manageUnitsCollision = (units, dt, damageGlobalFactor = 1) => {
    units.forEach((unit) => {
        // gravity
        //unit.Acceleration.add(new Vector(0,.5));
        // keep running
        // if (unit.Size < 30)
        // unit.Acceleration.add(unit.Velocity.normalize().scale(1.1));
        var unitNewPos = unit.Position.clone().add(unit.Velocity.clone().scale(1 / dt));
        // Check collisions with other units
        // Retrieve all objects that share nodes with the unit
        const candidates = gameState.collisionTree.retrieve(unit);
        candidates
            //.filter((f: Unit) => { return !f.dirty })
            .forEach((other) => {
            if (other instanceof CannonBall)
                return;
            if (other === unit)
                return;
            const minDist = (unit.Radius + other.Radius) / 2;
            var otherNewPos = other.Position.clone().add(other.Velocity.clone().scale(1 / 60));
            // Paso 1: Detectar colisión
            const dist = unitNewPos.distance(otherNewPos);
            if (dist == 0)
                return;
            if (dist > minDist)
                return;
            // var power = (Math.abs(unit.Velocity.x) + Math.abs(unit.Velocity.y)) +
            //   (Math.abs(other.Velocity.x) + Math.abs(other.Velocity.y));
            // power = power * 0.0482;
            // Paso 2: Calcular el vector de separación
            const separation = new Vector(unitNewPos.x - other.Position.x, unitNewPos.y - other.Position.y);
            const separationLength = separation.length();
            const overlap = unit.Radius + other.Radius - separationLength;
            // Paso 3: Mover los objetos para evitar solapamiento
            const separationCorrection = separation.scale(overlap / (2 * separationLength));
            if (other.type == 1 /* EntityType.Testudo */) {
                unit.Position.add(separationCorrection.scale(.3));
                unit.Velocity.scale(.5);
                unit.Acceleration.scale(0);
            }
            else {
                other.Position.subtract(separationCorrection.scale(.1));
                unit.Velocity.scale(.99);
                unit.Acceleration.scale(.99);
            }
            other.Velocity.scale(.99);
            other.Acceleration.scale(.99);
            // Damage manager
            // Attack unit damage
            if ([0 /* EntityType.Troop */, 1 /* EntityType.Testudo */, 2 /* EntityType.Archer */, 3 /* EntityType.Knight */, 4 /* EntityType.Artillery */, 5 /* EntityType.Cavalry */].includes(other.type) && other.Team != unit.Team) {
                let obj = other;
                // Damage if other is attacking
                if (obj._currentAnim == obj._attackAnim && unit.stuntTime.elapsed()) { // || obj.type == EntityType.Cavalry )    && obj._currentAnim._finished
                    if (unit.armorPoints == 0)
                        unit.healthPoints = Math.max(unit.healthPoints - obj.attackDamagePoints * damageGlobalFactor, 0);
                    unit.armorPoints = Math.max(unit.armorPoints - obj.attackDamagePoints * damageGlobalFactor, 0);
                    if (unit.healthPoints == 0) {
                        obj.killCount++;
                        unit.stuntTime.set(1);
                        // if (units.length < 10)
                        //   sound(SND_UNIT_KILLED);
                    }
                    else {
                        unit.stuntTime.set(.2);
                        if (units.length < 10)
                            sound(SND_UNIT_DAMAGE);
                    }
                }
            }
            // Enemy arrows damage and Explosion kill everyone
            else if ((other instanceof Arrow && other.Team != unit.Team) || other instanceof Explosion) {
                let obj = other;
                // direct massive damage
                if (other instanceof Explosion) {
                    unit.healthPoints = Math.max(unit.healthPoints - obj.attackDamagePoints * damageGlobalFactor, 0);
                }
                else {
                    // armor first then health
                    if (unit.armorPoints == 0)
                        unit.healthPoints = Math.max(unit.healthPoints - obj.attackDamagePoints * damageGlobalFactor, 0);
                    unit.armorPoints = Math.max(unit.armorPoints - obj.attackDamagePoints * damageGlobalFactor, 0);
                    // arrow auto destroy
                    other.healthPoints = 0;
                }
                unit.stuntTime.set(.2);
                if (unit.healthPoints == 0) {
                    // sound(SND_UNIT_KILLED);
                    if (obj.owner != undefined) {
                        if (obj.owner.Team != unit.Team) {
                            obj.scoreKill();
                            obj.owner.killCount++;
                        }
                        else
                            obj.owner.friendKillCount++;
                    }
                    else
                        obj.killCount++;
                }
            }
        });
        unit.Velocity.add(unit.Acceleration);
        // Check collisions with edges of map
        if (unitNewPos.x + unit.Radius > drawEngine.canvasWidth || unitNewPos.x <= 0) {
            unit.Velocity.x *= -0.95;
        }
        if (unitNewPos.y + unit.Radius > drawEngine.canvasHeight || unitNewPos.y <= 0) {
            unit.Velocity.y *= -0.95;
        }
        // Keep inside edges of map
        //right
        if (unit.Position.x + unit.Size.x > drawEngine.canvasWidth) {
            unit.Position.add(new Vector(-unit.Size.x / 2, 0));
            unit.Velocity.scale(0);
        }
        // left
        if (unit.Position.x - unit.Size.x < 0) {
            unit.Position.add(new Vector(unit.Size.x / 2, 0));
            unit.Velocity.scale(0);
        }
        //bottom
        if (unit.Position.y + unit.Size.y > drawEngine.canvasHeight) {
            unit.Position.add(new Vector(0, -unit.Size.y / 2));
            unit.Velocity.scale(0);
        }
        // top (adjust for 0-based top in vertical mode, but respect UI if needed)
        // Actually, in vertical mode we want full height, maybe 0.
        if (unit.Position.y - unit.Size.y < 0) {
            unit.Position.add(new Vector(0, unit.Size.y / 2));
            unit.Velocity.scale(0);
        }
        unit.Position.add(unit.Velocity);
        // Apply Drag
        unit.Velocity.scale(0.95);
        // reset acceleration
        unit.Acceleration.scale(0);
        unit.LooktoRight = unit.Velocity.clone().normalize().x < 0;
    });
};

class Testudo extends Unit {
    constructor(position, sizeFactor, team, type = 1 /* EntityType.Testudo */) {
        super(position, sizeFactor, team, type);
        this.loadProperties();
        this.setSizes();
    }
    draw(ctx, dir) {
        gamePresenter.drawEntity(ctx, this, this.LooktoRight || dir);
        super.draw(ctx);
    }
    drawChilds(ctx, realSize) {
        ctx.translate(this.Size.x * .2, 0 + realSize.y * .45);
        // ctx.rotate(.2)
        ctx.lineWidth = 2;
        ctx.fillStyle = "#aaa";
        ctx.fillRect(0, 0, this.Size.x * .3, -this.Size.y * 1.2);
        ctx.fillStyle = "#888";
        ctx.fillRect(this.Size.x * .3, 0, this.Size.x * .3, -this.Size.y * 1.2);
    }
}

class Cavalry extends Archer {
    constructor(position, sizeFactor, team) {
        super(position, sizeFactor, team, 5 /* EntityType.Cavalry */);
        this.loadProperties();
        this.slowWhileInRange = false;
    }
    drawChilds(ctx, realSize) {
        ctx.translate(this.Size.x * -0.2 + (this._currentAnim == this._attackAnim ? 15 : 0), 0 + this.Size.y * .1);
        ctx.rotate(PI / 2 + (this._currentAnim == this._attackAnim ? .1 : 0));
        ctx.lineWidth = 2;
        ctx.fillStyle = "#aaa";
        ctx.fillRect(0, 0, this.Size.x * .1, -this.Size.y * 1.5);
        ctx.fillStyle = "#888";
        ctx.fillRect(this.Size.x * .1, 0, this.Size.x * .1, -this.Size.y * 1.5);
    }
}

class GameState {
    constructor() {
        this.Active = false;
        this._currentUnitType = 0 /* EntityType.Troop */;
        this.gameObjects = [];
        this.units = [];
        this.projectiles = [];
        this.labels = [];
        this.buttons = [];
        this.placeButtons = [];
        this.blood = [];
        this.gameData = {
            result: 0,
            teamAlphaBeginCount: 0,
            teamBravoBeginCount: 0,
            teamAlphaEndCount: 0,
            teamBravoEndCount: 0,
            teamAlphaCost: 0,
            teamBravoCost: 0,
            kills: { alpha: 0, bravo: 0 },
        };
        this.defMapDim = new Vector(1, 1);
        this.defTileSize = new Vector(1, 1); // Tile Size
        this.seed = Math.random(); //.601 // 
        this.removeUnitRadiusAvailable = [1, 2];
        this.removeUnitRadiusIndex = 0;
        this.removeUnitRadius = this.removeUnitRadiusAvailable[this.removeUnitRadiusIndex];
        this.battleStatus = 1 /* BattleStatus.prepare */;
        this.playerBankGold = 0;
        this.playerBattleGold = 0;
        this.kills = { alpha: 0, bravo: 0 };
        this.gameMode = 1 /* GameMode.easy */;
        this.collisionTree = new Quadtree({
            width: drawEngine.canvasWidth,
            height: drawEngine.canvasHeight,
            maxObjects: 3
        });
        this.level = gameLevel;
        this.gameMap = new GameMap(new Vector(8, 8), new Vector(8, 8), this.seed, this.level.theme);
    }
    // Unit Type
    get currentUnitType() {
        return this._currentUnitType;
    }
    set currentUnitType(value) {
        this._currentUnitType = value;
        this._currentUnitSize = undefined;
    }
    // Unit Size
    get currentUnitSize() {
        if (this._currentUnitSize == undefined)
            this._currentUnitSize = gameDatabase.getUnitSize(this.currentUnitType).scale(this.level.levelSizefactor);
        return this._currentUnitSize;
    }
    get teamAlpha() {
        return this.units.filter(f => f.Team == 1 /* Team.Alpha */);
    }
    get teamBravo() {
        return this.units.filter(f => f.Team == 2 /* Team.Bravo */);
    }
    get bulletsAlpha() {
        return this.projectiles.filter(f => f.Team == 1 /* Team.Alpha */);
    }
    resetGame() {
        this.units = [];
        this.level.levelTimer.unset();
        this.battleStatus = 1 /* BattleStatus.prepare */;
        this.gameObjects = [];
        this.units = [];
        this.projectiles = [];
        this.blood = [];
        // Everyone quiet
        this.units.forEach(unit => {
            unit.VisionRange = 0;
        });
        this.currentUnitType = 0 /* EntityType.Troop */;
        this.gameData.teamAlphaCost = 0;
        this.gameData.teamBravoCost = 0;
        this.kills.alpha = this.kills.bravo = 0;
    }
    init(level) {
        this.resetGame();
        this.level.init(level);
        this.gameMap.Init();
        this.defTileSize = new Vector(40, 44);
        this.defMapDim = new Vector(48, 25);
        this.gameMap = new GameMap(this.defMapDim, this.defTileSize, this.seed, this.level.theme);
        drawEngine.init();
        // Butons
        this.createGameButtons();
        // FEATURE:  hide button units not in level
        let levelUnitTypes = this.level.playerTypes;
        unitTypes.forEach(unitType => {
            if (!levelUnitTypes.includes(unitType)) {
                if (unitType == 0 /* EntityType.Troop */)
                    this.btnTroop.enabled = false;
                if (unitType == 1 /* EntityType.Testudo */)
                    this.btnTestudo.enabled = false;
                if (unitType == 2 /* EntityType.Archer */)
                    this.btnArcher.enabled = false;
                if (unitType == 3 /* EntityType.Knight */)
                    this.btnKnight.enabled = false;
                if (unitType == 4 /* EntityType.Artillery */ && this.btnArtillery)
                    this.btnArtillery.enabled = false;
                if (unitType == 5 /* EntityType.Cavalry */ && this.btnCavalry)
                    this.btnCavalry.enabled = false;
            }
        });
        // let bossFactor = 1
        // if (this.level.levelIndex == this.level.finalBossIndex) {
        //   bossFactor = 2
        // }
        if (this.level.enemyUnitType == -1 /* EntityType.None */) {
            // Enemy spawn 
            let count = this.level.enemyInitCount;
            let position = this.level.enemyPosition;
            let type = 2 /* EntityType.Archer */;
            let size = gameDatabase.getUnitSize(type).scale(this.level.levelSizefactor);
            let p = new Vector(0, 0);
            let ref = new Vector(1, 1).scale(size.length() * this.level.levelSizefactor);
            const enemyTypes = [
                0 /* EntityType.Troop */,
                2 /* EntityType.Archer */,
                3 /* EntityType.Knight */
            ];
            for (let index = 0; index < count; index++) {
                type = enemyTypes[randInt(0, enemyTypes.length)];
                let enemy = this.newUnit(position.clone().add(ref).add(p), this.level.levelSizefactor, 2 /* Team.Bravo */, type); // 
                this.units.push(enemy);
                p = Vector.rand().scale(randInt(20, 500) * this.level.levelSizefactor);
            }
        }
        else {
            // Enemy spawn in formation
            this.spawnInFormation(this.level.enemyInitCount, 2 /* Team.Bravo */, this.level.enemyPosition, this.level.levelSizefactor, this.level.enemyUnitType, this.level.levelIndex == 3 ? 2.5 : 1);
        }
        // get enemy cost
        this.gameData.teamBravoCost = 0;
        this.teamBravo.forEach(unit => {
            this.gameData.teamBravoCost += gameDatabase.getDataValues(unit.type).cost;
        });
        this.playerBattleGold = this.gameData.teamBravoCost;
        // game dificulty
        if (this.gameMode == 1 /* GameMode.easy */)
            this.playerBattleGold = Math.floor(this.playerBattleGold * 1.5);
        else if (this.gameMode == 2 /* GameMode.medium */)
            this.playerBattleGold = Math.floor(this.playerBattleGold * 1.25);
        this.calculatePlayerCost();
        // transaction
        // this.playerBattleGold = this.playerBankGold
        // this.playerBankGold = 0
        // if (this.playerBattleGold < this.level.gold)
        // this.playerBattleGold = this.level.gold
        // this.playerBattleGold = 50000
        console.log('added ' + this.playerBattleGold + ' to Battle Gold');
        this.calculateUnitsAvailable();
    }
    fight() {
        // initial game data
        this.gameData.result = 3 /* GameResult.tie */;
        this.gameData.teamAlphaBeginCount = this.teamAlpha.length;
        this.gameData.teamBravoBeginCount = this.teamBravo.length;
        this.level.levelTimer = new Timer(60); // 60*3
        this.units.forEach(unit => {
            // let team = mode == GameMode.attack ? Team.Alpha : Team.Bravo
            // let range = unit.Team == team ? drawEngine.canvasWidth : drawEngine.canvasWidth / 2
            // if (mode == GameMode.allAttack) range = drawEngine.canvasWidth
            unit.setActive(drawEngine.canvasWidth);
        });
    }
    next() {
        this.level.next();
        this.seed = Math.random();
        this.init(this.level.levelIndex);
    }
    changeTheme() {
        this.seed = Math.random();
        this.init(this.level.levelIndex);
    }
    onEnter() {
        // Bind methods with
        // inputMouse.clickAction = () => this.clickAction(inputMouse.pointer.Position)
        inputMouse.eventMouseMove = () => { this.mouseMove(); };
        inputMouse.eventMouseDown = () => { this.mouseDown(); };
        inputMouse.eventMouseUp = () => { this.mouseUp(); };
        inputMouse.eventContextmenu = () => { this.contextmenu(); };
        inputMouse.eventMouseScroll = () => { this.mouseScroll(); };
    }
    onLeave() {
        inputMouse.eventMouseMove = () => { };
    }
    spawnInFormation(count, team, position, sizeFactor, type, spaceFactor = 1) {
        let size = gameDatabase.getUnitSize(type).scale(sizeFactor * spaceFactor);
        let side = Math.sqrt(count);
        // Flip logic for vertical spawn
        new Vector(-side * size.x / 2, [0, -1, -2][team] * side / 2).scale(1);
        let row = 0, col = 0;
        // Center the formation horizontally
        let startX = -(side * size.x) / 2;
        for (let index = 0; index < count; index++) {
            let offset = new Vector(startX + col * size.x, row * size.y);
            let enemy = this.newUnit(position.clone().add(offset), sizeFactor, team, type);
            this.units.push(enemy);
            if (++col >= side) {
                col = 0, row++;
            }
        }
    }
    onUpdate(dt) {
        if (this.level.levelIndex == this.level.finalLevelIndex) {
            if (this.units.length < 1000 && this.playerBattleGold < 100000)
                this.playerBattleGold += 10;
        }
        this.gameObjects = [...this.units, ...this.projectiles]; //
        // destroy unhealth game objects
        this.gameObjects.forEach((item) => {
            if (item.healthPoints < 1)
                item.destroy();
        });
        // Remove death stuff
        this.units = this.units.filter((f) => { return f.Active && f.healthPoints > 0; });
        this.projectiles = this.projectiles.filter((f) => { return f.Active && f.healthPoints > 0; });
        this.labels = this.labels.filter((f) => { return f.Active; });
        this.blood = this.blood.filter((f) => { return f.Active && f.ttl > 0; });
        // Updates
        // Update particles
        this.blood.forEach((item) => {
            item._update(dt);
        });
        // Update buttons
        this.buttons.forEach((button) => {
            button.selected = false;
            if (button.unit && button.unit.type == this.currentUnitType)
                button.selected = true;
            button._update(dt);
        });
        // Enemy target designation
        enemyTargetDesignation(this.units);
        // Keep units quite during prepare status
        this.units.forEach((item) => {
            if (this.battleStatus != 1 /* BattleStatus.prepare */)
                item._update(dt);
            else
                item._currentAnim._update(dt);
        });
        // Update game objects
        this.projectiles.forEach((item) => {
            item._update(dt);
        });
        this.labels.forEach((item) => {
            item._update(dt);
        });
        // Projectile Physics for every frame
        this.projectiles.forEach((projectile) => {
            projectile.Velocity.add(projectile.Acceleration);
            projectile.Position.add(projectile.Velocity);
            // No Drag for projectile
            // Arrow.Velocity.scale(0.99);
            // reset acceleration
            projectile.Acceleration.scale(0);
        });
        // Add Units and projectiles to the quadtree collision
        this.gameObjects = [...this.units, ...this.projectiles]; //
        this.collisionTree.clear();
        this.gameObjects
            .forEach(item => {
            if (this.battleStatus == 1 /* BattleStatus.prepare */ && item instanceof Unit)
                return;
            this.collisionTree.insert(item);
        });
        // Unit Physics for every frame
        manageUnitsCollision(this.units, dt, Math.min(1, 1 / this.level.levelSizefactor));
        // DRAW SCENE
        this.gameMap.drawTileMap(drawEngine.context, 15);
        // Team middle lines
        let y = drawEngine.canvasHeight / 2 - 2;
        drawEngine.drawLine(new Vector(0, y), new Vector(drawEngine.canvasWidth, y), { stroke: 'red', fill: '' });
        y = y + 4;
        drawEngine.drawLine(new Vector(0, y), new Vector(drawEngine.canvasWidth, y), { stroke: 'blue', fill: '' });
        // Blood and death layer
        drawEngine.drawItems(this.blood, drawEngine.contextBlood);
        drawEngine.context.globalAlpha = .2;
        drawEngine.context.drawImage(drawEngine.contextBlood.canvas, 0, 0);
        drawEngine.context.globalAlpha = .4;
        drawEngine.context.drawImage(drawEngine.contextDeath.canvas, 0, 0);
        drawEngine.context.globalAlpha = 1;
        drawEngine.drawItems([...this.units, ...this.projectiles, ...this.labels]);
        // Fog of war
        if (this.level.fogOfWar && (this.battleStatus != 3 /* BattleStatus.ended */ || this.teamAlpha.length == 0 || this.teamBravo.length == 0)) {
            let fogData = [...this.teamAlpha, ...this.bulletsAlpha];
            const points = fogData.map(unit => unit.Position.clone());
            drawEngine.drawDynamicFogOfWar(points);
        }
        this.drawUI();
        this.drawPointer();
        this.battleEnd();
        // if (debug.showQuadtree) {
        //   drawEngine.context.beginPath()
        //   drawEngine.drawQuadtree(this.collisionTree, drawEngine.context);
        // }
        if (inputKeyboard.isEscape) {
            gameStateMachine.setState(menuState);
        }
    }
    endCondition() {
        let result = 0;
        if (!this.drawTimer?.isSet() && (this.teamBravo.length == 0 || this.teamAlpha.length == 0)) {
            this.drawTimer = new Timer(1.5);
            // Jump
            this.units
                .forEach(unit => {
                unit.winner = true;
            });
        }
        if ((this.drawTimer && this.drawTimer.elapsed()) || this.level.levelTimer.elapsed()) {
            this.drawTimer && this.drawTimer.unset();
            if (this.teamBravo.length == 0 && this.teamAlpha.length == 0) {
                result = 3 /* GameResult.tie */;
            }
            else if (this.teamBravo.length == 0 && this.teamAlpha.length > 0) {
                result = 1 /* GameResult.win */;
            }
            else if (this.teamAlpha.length == 0 || this.level.levelTimer.get() > 0) {
                result = 2 /* GameResult.loose */;
            }
        }
        return result;
    }
    battleEnd() {
        if (this.battleStatus == 2 /* BattleStatus.figth */) {
            let result = this.endCondition();
            if (result != 0) {
                this.battleStatus = 3 /* BattleStatus.ended */;
                this.gameData.result = result;
                this.gameData.teamAlphaEndCount = this.teamAlpha.length;
                this.gameData.teamBravoEndCount = this.teamBravo.length;
                this.gameData.kills = this.kills;
                gameLevel.level[gameLevel.levelIndex].stars = this.level.stars;
                campaingState.levelUnlock = (this.level.levelIndex + 1) + 1;
                summaryState.setGameResult(this.gameData);
                setTimeout(() => {
                    gameStateMachine.setState(summaryState);
                }, 2000);
            }
        }
    }
    newBlood(position, size, team) {
        let p = new Particle(position.clone(), size.clone(), team);
        this.blood.push(p);
    }
    drawPointer() {
        // drawEngine.drawCircle(inputMouse.pointer.Position, 32);
        if (this.isPlaceUnitAllowed(inputMouse.pointer.Position)) {
            let size = gameDatabase.getUnitSize(this.currentUnitType).scale(this.level.levelSizefactor);
            // let size: Vector =   this.currentUnitSize.clone()//.scale(1.5)
            // drawEngine.drawRectangle(inputMouse.pointer.Position.clone().add(size.clone().scale(-.5)), size, { stroke: 'transparent', fill: 'rgb(255,0,0,.3)' });
            let { gridPosition } = this.isPlaceFree(inputMouse.pointer.Position, size.length());
            let matrixPosition = this.getMatrix(gridPosition, size, this.removeUnitRadiusIndex);
            matrixPosition.forEach((item, index) => {
                let { freePlace } = this.isPlaceFree(item.point, size.length());
                drawEngine.drawCircle(item.point, Math.floor(size.length()), { stroke: transparent, fill: ['rgb(0,255,0,.3)', 'rgb(255,0,0,.3)'][freePlace ? 0 : 1], lineWidth: 3 });
                // drawEngine.drawText("" + item.point.key, 20, item.point.x, item.point.y)
            });
            // drawEngine.drawCircle(inputMouse.pointer.Position, Math.floor(size.length()), { stroke: 'rgb(255,0,0,.3)', fill: transparent });
        }
    }
    getMatrix(position, size, index) {
        const points = [];
        const addPoints = (delta) => {
            for (let i = 0; i < 4; i++) {
                points.push({ point: position.clone().add(delta.rotate((i * PI) / 2)), size2: 10 }); //.add(new Vector(16,16))
            }
        };
        points.push({ point: position.clone(), size2: 10 }); //.add(new Vector(16,16))
        if (index > 0) {
            const delta1 = new Vector(Math.floor(size.length()), 0);
            addPoints(delta1);
            const delta2 = new Vector(Math.floor(size.length()), Math.floor(size.length()));
            addPoints(delta2);
        }
        return points;
    }
    drawUI() {
        // Draw UI
        const scale = drawEngine.canvasWidth / 540; // Base scale on 540 width
        // Top Bar Background
        drawEngine.drawRectangle(new Vector(0, 0), new Vector(drawEngine.canvasWidth, 80 * scale), { stroke: transparent, fill: 'rgb(0,0,0,.5)' });
        // Team Power Bars (Scaled)
        const barWidth = drawEngine.canvasWidth * 0.4;
        const barHeight = 15 * scale;
        const barY = 40 * scale;
        drawEngine.drawBar(drawEngine.canvasWidth * 0.25, barY, this.teamAlpha.length, this.gameData.teamAlphaBeginCount, barWidth, '#500', '#f00', barHeight, false);
        drawEngine.drawBar(drawEngine.canvasWidth * 0.75, barY, this.teamBravo.length, this.gameData.teamBravoBeginCount, barWidth, '#005', '#00f', barHeight, true);
        // Center Timer / Score
        const xCenter = drawEngine.canvasWidth / 2;
        if (this.battleStatus == 2 /* BattleStatus.figth */) {
            drawEngine.drawText('' + this.formatTimeRemaining((-1 * this.level.levelTimer.get())), 30 * scale, xCenter, 50 * scale);
        }
        else {
            drawEngine.drawText('VS', 30 * scale, xCenter, 50 * scale);
        }
        // Bottom Deck Area Background
        const deckHeight = 140 * scale;
        drawEngine.drawRectangle(new Vector(0, drawEngine.canvasHeight - deckHeight), new Vector(drawEngine.canvasWidth, deckHeight), { stroke: '#333', fill: '#222' });
        // Buttons are drawn by their own _draw method, but we need to ensure their positions are updated if we want them dynamic. 
        // Since createGameButtons sets fixed positions, we rely on that.
        this.buttons.forEach((button) => {
            button._draw(drawEngine.context);
        });
    }
    sendStar() {
        if (this.lastDeathPosition) {
            this.labels.push(new Label("⭐", this.lastDeathPosition.clone(), new Vector(50, 50), 1 /* Team.Alpha */));
            this.lastDeathPosition = undefined;
        }
    }
    formatTimeRemaining(value) {
        var seconds = parseInt('' + value % 60);
        return seconds + 's';
    }
    mouseDown() {
        if (inputMouse.pointer.leftButton) {
            this.placeUnit(inputMouse.pointer.Position);
        }
        if (inputMouse.pointer.rigthButton) {
            this.removeUnit(inputMouse.pointer.Position);
        }
    }
    mouseMove() {
        if (inputMouse.pointer.leftButton) {
            this.placeUnit(inputMouse.pointer.Position);
        }
        if (inputMouse.pointer.rigthButton) {
            this.removeUnit(inputMouse.pointer.Position);
        }
    }
    mouseUp() {
        this.buttons.forEach(button => button.mouseUpEvent(inputMouse.pointer.Position));
    }
    mouseScroll() {
        this.removeUnitRadiusIndex += 1;
        if (this.removeUnitRadiusIndex > this.removeUnitRadiusAvailable.length - 1)
            this.removeUnitRadiusIndex = 0;
        this.removeUnitRadius = this.removeUnitRadiusAvailable[this.removeUnitRadiusIndex];
    }
    contextmenu() {
        if (this.battleStatus == 1 /* BattleStatus.prepare */)
            this.removeUnit(inputMouse.pointer.Position);
    }
    removeUnit(position) {
        if (this.battleStatus != 1 /* BattleStatus.prepare */)
            return;
        let factor = this.level.levelSizefactor;
        let size = gameDatabase.getUnitSize(this.currentUnitType).scale(factor);
        let removeUnits = this.teamAlpha.filter(f => Vector.distance(f.Position, position) < this.removeUnitRadius * size.length());
        removeUnits.forEach(unit => {
            let cost = gameDatabase.getDataValues(unit.type).cost;
            this.playerBattleGold += cost;
            this.gameData.teamAlphaCost -= cost;
        });
        this.units = this.units.filter(f => f.Team != 1 /* Team.Alpha */ || Vector.distance(f.Position, position) > this.removeUnitRadius * size.length());
        this.calculateUnitsAvailable();
    }
    calculatePlayerCost() {
        this.gameData.teamAlphaCost = 0;
        this.teamAlpha.forEach(unit => {
            this.gameData.teamAlphaCost += gameDatabase.getDataValues(unit.type).cost;
        });
    }
    placeUnit(position) {
        if (!this.Active)
            return;
        if (this.battleStatus == 3 /* BattleStatus.ended */)
            return;
        let cost = gameDatabase.getDataValues(this.currentUnitType).cost;
        if (cost > this.playerBattleGold) {
            // sound(SND_UNIT_CANT_PLACE);
            return;
        }
        let size = gameDatabase.getUnitSize(this.currentUnitType).scale(this.level.levelSizefactor);
        // if (!this.checkPlace(position, size, this.level.levelSizefactor)) return
        // check allowed 
        let point = position.clone();
        let { gridPosition } = this.allowedPlace(point, size, this.level.levelSizefactor); //.clone().add(Vector.rand().scale(50))
        if (gridPosition) {
            let matrixPosition = this.getMatrix(gridPosition, size, this.removeUnitRadiusIndex);
            let placed = false;
            matrixPosition.forEach(item => {
                // let { freePlace } = this.isPlaceFree(item.point, size.length());
                let { freePlace } = this.allowedPlace(item.point, size, this.level.levelSizefactor);
                if (freePlace && cost <= this.playerBattleGold) {
                    let u = this.newUnit(item.point, this.level.levelSizefactor, 1 /* Team.Alpha */, this.currentUnitType);
                    if (this.battleStatus != 1 /* BattleStatus.prepare */)
                        u.VisionRange = drawEngine.canvasWidth;
                    this.units.push(u);
                    placed = true;
                }
            });
            placed && sound(SND_UNIT_PLACE);
            this.calculateUnitsAvailable();
        }
    }
    allowedPlace(position, size, factor) {
        let { gridPosition, freePlace } = this.isPlaceFree(position, size.length());
        freePlace = this.isPlaceUnitAllowed(gridPosition) && freePlace;
        return { gridPosition, freePlace };
    }
    /**
     * keep safe distance to place units
     * @param position
     * @returns
     */
    isPlaceFree(position, size = 32) {
        let k = Math.floor(size);
        position = position.clone(); //.add(new Vector(16,16))
        let gridPosition = new Vector(k * Math.floor(position.x / k), k * Math.floor(position.y / k));
        let points = [];
        this.teamAlpha
            .forEach(unit => {
            points.push(unit.Position.clone());
        });
        points = points.map(position => { return new Vector(k * Math.floor(position.x / k), k * Math.floor(position.y / k)); });
        const uniquePoints = [...new Map(points.map(item => [item['key'], item])).values()];
        let freePlace = uniquePoints.filter(f => f.key == gridPosition.key).length === 0;
        return { gridPosition, freePlace };
    }
    /**
     * Only in player side
     * Only below the top bar
     * @param position
     * @returns
     */
    isPlaceUnitAllowed(position) {
        // Only in bottom half, but above the UI bar (canvasHeight - 120)
        return position.y > drawEngine.canvasHeight / 2 && position.y < drawEngine.canvasHeight - 120;
    }
    newUnit(position, sizeFactor, team, type) {
        let unit = new Troop(position, sizeFactor, team);
        if (unit.weapon)
            unit.weapon._length = unit.Size.length() * .6;
        if (type == 1 /* EntityType.Testudo */) {
            let testudo = new Testudo(position, sizeFactor, team);
            unit = testudo;
        }
        else if (type == 2 /* EntityType.Archer */) {
            let archer = new Archer(position, sizeFactor, team);
            archer.shootHandler = (targetPosition, velocity) => {
                let arrow = createArrow(archer, velocity, targetPosition, this.level.levelSizefactor);
                this.projectiles.push(arrow);
                if (this.units.length < 10)
                    sound(SND_ARROW_SHOOT);
            };
            unit = archer;
        }
        else if (type == 4 /* EntityType.Artillery */) {
            let artillery = new Artillery(position, sizeFactor, team);
            artillery.shootHandler = (targetPosition, velocity) => {
                let cannonBall = createCannonBall(artillery, velocity, targetPosition, randInt(50, 300), this.level.levelSizefactor); // TODO cannonball size?
                cannonBall.explodeHandler = (explosion) => {
                    this.projectiles.push(explosion);
                    sound(SND_EXPLOSION);
                };
                this.projectiles.push(cannonBall);
            };
            unit = artillery;
        }
        else if (type == 5 /* EntityType.Cavalry */) {
            let cavalry = new Cavalry(position, sizeFactor, team);
            unit = cavalry;
        }
        else if (type == 3 /* EntityType.Knight */) {
            let knight = new Knight(position, sizeFactor, team);
            unit = knight;
            if (unit.weapon)
                unit.weapon._length = unit.Size.length() * .8; //  TODO clean
        }
        unit.deathHandler = () => {
            gameDatabase.getDataValues(unit.type).cost;
            if (unit.Team == 2 /* Team.Bravo */) {
                this.lastDeathPosition = unit.Position.clone();
                this.labels.push(new Label("+1", unit.Position.clone(), unit.Size.clone().scale(.7), unit.Team, '#ff0'));
            }
            // Surprise!
            if (unit.type == 4 /* EntityType.Artillery */) {
                for (let index = 0; index < rand(2, 4); index++) {
                    let targetPosition = unit.Position.clone().add(Vector.rand().scale(60));
                    let { velocity } = unit.calculateShoot(targetPosition);
                    let cannonBall = createCannonBall(unit, velocity, targetPosition, randInt(50, 300), this.level.levelSizefactor);
                    cannonBall.explodeHandler = (explosion) => {
                        this.projectiles.push(explosion);
                        sound(SND_EXPLOSION);
                    };
                    this.projectiles.push(cannonBall);
                }
            }
            // console.log('blood: ' + unit.Team)
            // blood
            this.newBlood(unit.Position, unit.Size.clone().scale(1.2), unit.Team);
            // sound(SND_BLOOD)
            unit.draw(drawEngine.contextDeath, true);
            if (unit.Team == 1 /* Team.Alpha */)
                this.kills.bravo += 1;
            else {
                this.kills.alpha += 1;
            }
        };
        unit.jumping = () => {
            // sound(SND_JUMP)
        };
        let cost = gameDatabase.getDataValues(unit.type).cost;
        this.playerBattleGold -= cost;
        this.gameData.teamAlphaCost += cost;
        return unit;
    }
    getAlphaCost() {
        let total = 0;
        this.teamAlpha.forEach(unit => {
            total += gameDatabase.getDataValues(unit.type).cost;
        });
        return total;
    }
    // private recalculateCost(team: number, unit: Troop) {
    //   if (team == Team.Alpha)
    //     this.gameData.teamAlphaCost += gameDatabase.getDataValues(unit.type).cost;
    //   if (team == Team.Bravo)
    //     this.gameData.teamBravoCost += gameDatabase.getDataValues(unit.type).cost;
    // }
    calculateUnitsAvailable() {
        if (this.btnTroop && this.btnTestudo && this.btnArcher && this.btnKnight) {
            this.btnTroop.data = '' + this.calculateAvailable(0 /* EntityType.Troop */);
            this.btnTestudo.data = '' + this.calculateAvailable(1 /* EntityType.Testudo */);
            this.btnArcher.data = '' + this.calculateAvailable(2 /* EntityType.Archer */);
            this.btnKnight.data = '' + this.calculateAvailable(3 /* EntityType.Knight */);
            if (this.btnArtillery)
                this.btnArtillery.data = '' + this.calculateAvailable(4 /* EntityType.Artillery */);
            if (this.btnCavalry)
                this.btnCavalry.data = '' + this.calculateAvailable(5 /* EntityType.Cavalry */);
            this.btnGold.data = '' + this.playerBattleGold;
        }
    }
    calculateAvailable(type) {
        // return (this.calculateGold() / gameDatabase.getDataValues(type).cost).toFixed(1) //Math.floor()
        return Math.floor(this.playerBattleGold / gameDatabase.getDataValues(type).cost);
    }
    createGameButtons() {
        this.buttons = [];
        this.placeButtons = [];
        const scale = drawEngine.canvasWidth / 540;
        const size = 60 * scale; // Scale button size
        const posY = drawEngine.canvasHeight - 60 * scale;
        let btnExit = new Button(40, 40, size, size, "↩", "Back", 60);
        btnExit.visible = true;
        btnExit.clickCB = () => {
            // cancel each unit transaction if battle has not begun
            if (this.battleStatus == 1 /* BattleStatus.prepare */) {
                this.teamAlpha.forEach(unit => {
                    let cost = gameDatabase.getDataValues(unit.type).cost;
                    this.playerBattleGold += cost;
                    this.gameData.teamAlphaCost -= cost;
                });
            }
            // Back gold to bank
            this.playerBankGold = this.playerBattleGold;
            this.playerBattleGold = 0;
            gameStateMachine.setState(campaingState);
        };
        this.buttons.push(btnExit);
        // Gold bank
        this.btnGold = new Button(drawEngine.canvasWidth * 0.1, posY, size, size, "💰", "");
        this.btnGold.clickCB = () => {
        };
        this.placeButtons.push(this.btnGold);
        let count = 0;
        // Show only 4 unit types (Troop, Testudo, Archer, Knight)
        const visibleUnits = unitTypes.slice(0, 4);
        const unitButtonCount = visibleUnits.length; // 4 units
        const totalButtonsWidth = (size * 1.2) * unitButtonCount; // size + margin
        // Start X = (Width - TotalWidth) / 2 + (Half Button Size because position is centered)
        let refX = (drawEngine.canvasWidth - totalButtonsWidth) / 2 + size * 0.6;
        for (const unitType of visibleUnits) {
            const cost = gameDatabase.getDataValues(unitType).cost;
            const button = this.createUnitButton(refX + (size * 1.2) * count++, posY, size, unitType, "", `Place ${unitNames[unitType]} for ${cost}$`);
            if (unitType == 0 /* EntityType.Troop */)
                this.btnTroop = button;
            if (unitType == 1 /* EntityType.Testudo */)
                this.btnTestudo = button;
            if (unitType == 2 /* EntityType.Archer */)
                this.btnArcher = button;
            if (unitType == 3 /* EntityType.Knight */)
                this.btnKnight = button;
            this.placeButtons.push(button);
        }
        // Clear
        this.btnClear = new Button(drawEngine.canvasWidth * 0.9, posY, size, size, "🗑", "Clear");
        this.btnClear.visible = true;
        this.btnClear.clickCB = () => {
            // cancel each unit transaction
            this.teamAlpha.forEach(unit => {
                let cost = gameDatabase.getDataValues(unit.type).cost;
                this.playerBattleGold += cost;
                this.gameData.teamAlphaCost -= cost;
            });
            this.units = this.units.filter(f => f.Team != 1 /* Team.Alpha */);
            this.calculateUnitsAvailable();
        };
        this.placeButtons.push(this.btnClear);
        // Figth
        this.btnFigth = new Button(drawEngine.canvasWidth / 2, 100 * scale, 200, 110, "⚔", "Figth!", 100);
        this.btnFigth.visible = true;
        this.btnFigth.clickCB = () => {
            if (this.battleStatus == 1 /* BattleStatus.prepare */) {
                this.battleStatus = 2 /* BattleStatus.figth */;
                this.btnFigth.visible = false;
                this.fight();
            }
        };
        this.buttons.push(this.btnFigth);
        // Button Sounds
        let bbb = [...[btnExit], ...[this.btnClear], ...[this.btnFigth], ...this.placeButtons];
        Button.setHover(bbb);
        // Keep sound of biegin fight
        this.btnFigth.clickEvent = () => {
            sound(SND_BATTLE_BEGIN);
        };
        // // SOUND TEST BUTTONS
        // const soundTest = [
        //   SND_BTN_HOVER,  // 1
        //   SND_BTN_DOWN,   // 2
        //   // SND_DIE,        // 3
        //   SND_JUMP,       // 4
        //   // SND_ATTACK,     // 5
        //   SND_ARROW_SHOOT, // 6
        //   // SND_UNIT_DAMAGE, // 7
        //   // SND_UNIT_KILLED, // 8
        //   // SND_BLOOD,       // 9
        //   SND_EXPLOSION,   // 10
        //   SND_UNIT_PLACE,   // 11
        // ]
        // count = 1
        // soundTest.forEach((item) => {
        //   let btn = new Button(drawEngine.canvasWidth / 2 - size / 2 + size * count++, drawEngine.canvasHeight - size / 2, size, size, '' + (count - 1), "", 40);
        //   btn.clickEvent = () => {
        //     sound(item)
        //   };
        //   btn.hoverOutEvent = () => { };
        //   btn.hoverEvent = () => { };
        //   btn.clickCB = () => { };
        //   this.buttons.push(btn);
        // })
        // let btn = new Button(drawEngine.canvasWidth / 2 + 150, 50, size, size, '🎲', "Cheat", 40);
        // btn.clickEvent = () => {
        //   this.teamBravo.forEach(unit => unit.healthPoints = 0)
        //   // campaingState.levelUnlock = (this.level.levelIndex + 1) + 1
        // };
        // this.buttons.push(btn);
        this.buttons = [...this.buttons, ...this.placeButtons];
    }
    createUnitButton(x, y, size, type, text, title) {
        let btn = new Button(x, y, size, size, text, title);
        btn.visible = true;
        // btn.image = Unit.prepareImage(type)
        let pos = new Vector(0, -4), sizeFactor = 1.8;
        const entityClasses = {
            [0 /* Army.Troop */]: Troop,
            [1 /* Army.Testudo */]: Testudo,
            [2 /* Army.Archer */]: Archer,
            [3 /* Army.Knight */]: Knight,
            [4 /* Army.Artillery */]: Artillery,
            [5 /* Army.Cavalry */]: Cavalry,
        };
        const typeValue = type;
        const EntityClass = entityClasses[typeValue];
        btn.unit = new EntityClass(pos, sizeFactor, 1 /* Team.Alpha */);
        if (btn.unit)
            btn.unit.showBars = false;
        btn.clickCB = (button) => {
            this.currentUnitType = button.unit.type;
        };
        this.placeButtons.push(btn);
        return btn;
    }
}
const gameState = new GameState();

class CampaignState {
    constructor() {
        this.Active = false;
        this._levelUnlock = 1;
        this.maxCols = 4;
        this.btnWidth = 400;
        this.btnHeight = 110;
        this.buttons = [];
        this.count = 0;
        this.col = 0;
        this.row = 0;
        this.seed = Math.random(); //.601 // 
        this.defTileSize = new Vector(40 / 2, 44 / 2);
        this.defMapDim = new Vector(48 * 2, 25 * 2);
        this.gameMap = new GameMap(this.defMapDim, this.defTileSize, this.seed, themeDef.snow);
        this.campaing = [...gameLevel.level];
    }
    get levelUnlock() {
        return this._levelUnlock;
    }
    set levelUnlock(value) {
        this._levelUnlock = value;
    }
    get posX() {
        if (this.count % this.maxCols == 0) {
            this.row++;
            this.col = 0;
        }
        else
            this.col++;
        return drawEngine.canvasWidth / 2 - (this.btnWidth * .8 * this.maxCols) / 2 + this.col * this.btnWidth * 1.1;
    }
    get posY() {
        return drawEngine.canvasHeight / 2 - (this.btnHeight * 4) / 2 + this.row * 120;
    }
    onEnter() {
        this.buttons = [];
        this.count = 0;
        this.row = 0;
        this.createButonsCampaing();
        this.row++;
        let btn = new Button(drawEngine.canvasWidth / 2, this.posY, 500, 80, "Back", "");
        btn.clickCB = () => {
            gameStateMachine.setState(menuState);
        };
        this.buttons.push(btn);
        Button.setHover([btn]);
        btn = new Button(drawEngine.canvasWidth * .95, drawEngine.canvasHeight * .90, 60, 60, '🎲', "Cheat", 40);
        btn.clickEvent = () => {
            gameLevel.levelIndex += 1;
            campaingState.levelUnlock = (gameState.level.levelIndex) + 1;
            this.onEnter();
        };
        this.buttons.push(btn);
        inputMouse.eventMouseDown = () => this.mouseDown();
    }
    createButonsCampaing() {
        this.count = 0;
        this.buttons = [];
        let { style, styleHover } = gameDatabase.getButtonStyle();
        this.campaing.forEach((item, index) => {
            const btn = new Button(this.posX, this.posY, this.btnWidth, this.btnHeight, (index + 1) + '', "", 10); // ''+ (1+index)
            if ((index + 1) > this.levelUnlock) {
                btn.enabled = false;
                style.color = 'rgb(0,0,150,.8)'; // Team.Bravo
                styleHover.color = 'rgb(0,0,150,.8)'; // Team.Bravo
            }
            else {
                Button.setHover([btn]);
                style.color = 'rgb(150,0,0,.8)'; // Team.Bravo
                styleHover.color = 'rgb(150,0,0,.8)'; // Team.Bravo
            }
            btn.colors.default = JSON.parse(JSON.stringify(style));
            btn.colors.hover = JSON.parse(JSON.stringify(styleHover));
            btn.clickCB = () => {
                gameStateMachine.setState(gameState);
                gameState.init(index);
            };
            if (index == gameLevel.finalLevelIndex) {
                btn.Position.x = drawEngine.canvasWidth / 2;
                // style.color = '#cc0' // Team.Bravo
                // styleHover.color = '#cc0' // Team.Bravo
                // btn.colors.default = JSON.parse(JSON.stringify(style))
                // btn.colors.hover = JSON.parse(JSON.stringify(styleHover))
            }
            this.buttons.push(btn);
            this.count++;
        });
    }
    onLeave() {
        this.buttons = [];
        this.count = 0;
        this.row = 0;
        inputMouse.eventMouseDown = () => { };
    }
    onUpdate(dt) {
        this.gameMap.drawTileMap(drawEngine.context);
        const xCenter = drawEngine.context.canvas.width / 2;
        drawEngine.drawText('Levels', 80, xCenter, 300);
        this.buttons.forEach((button, index) => {
            // if (index == gameLevel.finalBossIndex && button.enabled) button.text = "Final boss"
            button._update(dt);
            button._draw(drawEngine.context);
            if (!button.enabled) {
                drawEngine.drawText('🔒', 70, button.Position.x, button.Position.y + 22);
            }
            else if (gameLevel.level[index]) {
                if (gameLevel.level[index].stars > 0) {
                    drawEngine.drawText(Array(gameLevel.level[index].stars).fill('⭐').join(''), 30, button.Position.x + button.Size.x * .3, button.Position.y + 12);
                }
                if (gameLevel.level[index].highScore > 0) {
                    drawEngine.drawText('Highdcore:', 25, button.Position.x - button.Size.x * .3, button.Position.y - button.Size.y * .25);
                    drawEngine.drawText('' + gameLevel.level[index].highScore, 35, button.Position.x - button.Size.x * .3, button.Position.y + 12);
                }
            }
        });
        if (inputKeyboard.isEscape) {
            gameStateMachine.setState(menuState);
        }
    }
    mouseDown() {
        if (inputMouse.pointer.leftButton) {
            this.buttons.forEach(button => button.mouseUpEvent(inputMouse.pointer.Position));
        }
    }
    ;
}
const campaingState = new CampaignState();

class UnitsState {
    constructor() {
        this.maxCols = 6;
        this.btnWidth = 230;
        this.btnHeight = 60;
        this.buttons = [];
        this.lables = [];
        this.count = 0;
        this.col = 0;
        this.row = 0;
        this.army = [];
        this.gameObjects = [];
        this.Active = false;
        this.targetPress = false;
        this.targetPoint = new Vector(drawEngine.canvasWidth / 2, drawEngine.canvasHeight * .2);
    }
    get posX() {
        if (this.count % this.maxCols == 0) {
            this.row++;
            this.col = 0;
        }
        else
            this.col++;
        return drawEngine.canvasWidth / 2 - this.btnWidth / 2 - (this.btnWidth * this.maxCols) / 2 + this.col * 320;
    }
    get posY() {
        return drawEngine.canvasHeight / 2 - (this.btnHeight * 3) + this.row * 200;
    }
    onEnter() {
        const Position = new Vector(0, 0);
        this.army = [];
        gameDatabase.unitsData.forEach(item => {
            let unit = new Troop(Position, 2, 1 /* Team.Alpha */);
            if (item.name == unitNames[1 /* EntityType.Testudo */]) {
                let testudo = new Testudo(Position, 2, 1 /* Team.Alpha */);
                unit = testudo;
            }
            if (item.name == unitNames[2 /* EntityType.Archer */]) {
                let archer = new Archer(Position, 2, 1 /* Team.Alpha */);
                archer.shootCoolDownValue /= 2;
                archer.shootHandler = (position, velocity) => {
                    let arrow = createArrow(archer, velocity, position);
                    this.gameObjects.push(arrow);
                    sound(SND_ARROW_SHOOT);
                };
                unit = archer;
                this.theArcher = archer;
            }
            if (item.name == unitNames[3 /* EntityType.Knight */])
                unit = new Knight(Position, 2, 1 /* Team.Alpha */);
            if (item.name == unitNames[4 /* EntityType.Artillery */]) {
                let artillery = new Artillery(Position, 2, 1 /* Team.Alpha */);
                artillery.shootCoolDownValue /= 2;
                artillery.shootHandler = (targetPosition, velocity, zv) => {
                    let cannonBall = createCannonBall(artillery, velocity, targetPosition, randInt(50, 300));
                    cannonBall.explodeHandler = (explosion) => {
                        this.gameObjects.push(explosion);
                        sound(SND_EXPLOSION);
                    };
                    this.gameObjects.push(cannonBall);
                };
                unit = artillery;
                this.theArtillery = artillery;
            }
            if (item.name == unitNames[5 /* EntityType.Cavalry */])
                unit = new Cavalry(Position, 2, 1 /* Team.Alpha */);
            this.army.push({ name: item.name, data: item, unit: unit });
        });
        this.lables = [];
        this.count = 0;
        this.row = 0;
        let label;
        gameDatabase.unitsData
            .forEach((item, index) => {
            label = { x: this.posX, y: this.posY, text: item.name };
            this.lables.push(label);
            this.count++;
        });
        this.row++;
        this.row++;
        let btn = new Button(drawEngine.canvasWidth / 2, this.posY, 500, 80, "Back", "");
        btn.clickCB = () => {
            gameStateMachine.setState(menuState);
        };
        this.buttons.push(btn);
        this.lables.forEach((label) => {
            let item = this.army.filter(f => f.name == label.text)[0];
            if (item)
                item.unit.Position = new Vector(label.x, label.y - 120);
        });
        inputMouse.eventMouseDown = () => this.mouseDown();
        inputMouse.eventMouseMove = () => this.mouseMove();
        inputMouse.eventMouseUp = () => this.mouseUp();
    }
    onLeave() {
        this.buttons = [];
        inputMouse.eventMouseDown = () => { };
    }
    onUpdate(dt) {
        // destroy unhealth game objects
        this.gameObjects.forEach((item) => {
            if (item.healthPoints < 1)
                item.destroy();
        });
        this.gameObjects = this.gameObjects.filter((f) => { return f.Active && f.healthPoints > 0; });
        this.gameObjects.forEach((item) => {
            item._update(dt);
        });
        // Projectile Physics for every frame
        this.gameObjects.forEach((projectile) => {
            projectile.Velocity.add(projectile.Acceleration);
            projectile.Position.add(projectile.Velocity);
            // No Drag for projectile
            // projectile.Velocity.scale(0.99);
            // reset acceleration
            projectile.Acceleration.scale(0);
        });
        const xCenter = drawEngine.context.canvas.width / 2;
        drawEngine.drawText('13th Century Army', 80, xCenter, 300);
        // DEBUG Size consistency
        // const size = 50 + Math.sin(time * 4) * 5;
        // this.army.forEach(item => {
        //   item.unit.Size = new Vector(size, size)
        //   if (item.unit._sword) item.unit._sword._length = size
        // })
        const jump = Math.sin(time) > 0;
        const dir = Math.sin(time * 2) > 0;
        const attack = Math.sin(time * 4) > 0;
        this.buttons.forEach((button) => {
            button._update(dt);
            button._draw(drawEngine.context);
        });
        this.lables.forEach((label) => {
            drawEngine.drawText(label.text, 50, label.x, label.y + 20, '#880');
            let item = this.army.find(f => f.name == label.text);
            if (item) {
                if (jump)
                    item.unit.doJump();
                if (attack) {
                    item.unit.attack();
                }
                // continuos shooting
                item.unit.shootTo(this.targetPoint);
                item.unit._update(dt);
                drawEngine.drawCircle(new Vector(label.x, label.y - 120), 150, { stroke: '#800', fill: '#222', lineWidth: 10 });
                item.unit.draw(drawEngine.context, dir);
                let fontSize = 30, row = 1, space = fontSize * 1.3;
                drawEngine.drawText('cost: ' + item.data.cost, fontSize, label.x, label.y + ++row * space);
                drawEngine.drawText('Armor: ' + item.data.armor, fontSize, label.x, label.y + ++row * space);
                drawEngine.drawText('Damage: ' + item.data.attackDamage, fontSize, label.x, label.y + ++row * space);
                drawEngine.drawText('Cooldown: ' + item.data.attackCoolDown, fontSize, label.x, label.y + ++row * space);
                drawEngine.drawText('Speed: ' + Math.floor(item.data.speedFactor * item.unit.Radius), fontSize, label.x, label.y + ++row * space);
                // drawEngine.drawText('Range: ' + Math.floor(item.data.attackRangeFactor * item.unit.Radius), fontSize, label.x, label.y + ++row * space)
                item.data.shootRangeFactor && drawEngine.drawText('Range: ' + Math.floor(item.data.shootRangeFactor * item.unit.Radius), fontSize, label.x, label.y + ++row * space);
                item.data.shootDamage && drawEngine.drawText('Shoot: ' + item.data.shootDamage, fontSize, label.x, label.y + ++row * space);
                item.data.shootCoolDown && drawEngine.drawText('Cooldown: ' + item.data.shootCoolDown, fontSize, label.x, label.y + ++row * space);
                drawEngine.drawText('🎯', fontSize * 3, this.targetPoint.x, this.targetPoint.y + 30);
                // drawEngine.drawCircle(this.targetPoint, 50, {stroke: 'red', fill: 'transparent'}); 
            }
        });
        drawEngine.drawItems(this.gameObjects);
        if (inputKeyboard.isEscape) {
            gameStateMachine.setState(menuState);
        }
    }
    mouseDown() {
        if (!this.Active)
            return;
        if (inputMouse.pointer.leftButton) {
            if (Vector.distance(this.targetPoint, inputMouse.pointer.Position) < 50) {
                this.targetPoint = inputMouse.pointer.Position.clone();
                this.targetPress = true;
            }
        }
    }
    ;
    mouseMove() {
        if (!this.Active)
            return;
        if (inputMouse.pointer.leftButton && this.targetPress) {
            this.targetPoint = inputMouse.pointer.Position.clone();
        }
    }
    ;
    mouseUp() {
        if (!this.Active)
            return;
        this.buttons.forEach(button => button.mouseUpEvent(inputMouse.pointer.Position));
        this.theArcher?.shootTo(this.targetPoint);
        this.theArtillery?.shootTo(this.targetPoint);
        this.targetPress = false;
    }
    ;
}
const unitsState = new UnitsState();

class MenuState {
    constructor() {
        this.Active = false;
        this.buttons = [];
        this.count = 0;
        this.seed = Math.random(); //.601 // 
        this.defTileSize = new Vector(40 / 2, 44 / 2);
        this.defMapDim = new Vector(48 * 2, 25 * 2);
        this.gameMap = new GameMap(this.defMapDim, this.defTileSize, this.seed, themeDef.forest);
    }
    get posY() {
        return 500 + this.count++ * 100;
    }
    onEnter() {
        // setTimeout(() => {
        //   gameState.init(3)
        //   gameStateMachine.setState(gameState);
        // }, 1000)
        this.buttons = [];
        this.count = 0;
        let btn;
        const refX = drawEngine.canvasWidth / 2;
        let options = [0, 1 /* GameMode.easy */, 2 /* GameMode.medium */, 3 /* GameMode.hard */];
        btn = new Button(refX + 450, this.posY, 300, 80, ['', 'Easy', 'Medium', 'Hard'][gameState.gameMode]);
        btn.clickCB = (button) => {
            let next = gameState.gameMode + 1;
            if (next >= options.length)
                next = 1 /* GameMode.easy */;
            gameState.gameMode = next;
            button.text = ['', 'Easy', 'Medium', 'Hard'][next];
        };
        this.buttons.push(btn);
        this.count--;
        btn = new Button(refX, this.posY, 500, 80, "Play");
        btn.clickCB = () => {
            gameStateMachine.setState(gameState);
            gameState.init(campaingState.levelUnlock - 1); // param with index value
        };
        this.buttons.push(btn);
        btn = new Button(refX, this.posY, 500, 80, "Army");
        btn.clickCB = () => {
            gameStateMachine.setState(unitsState);
        };
        this.buttons.push(btn);
        btn = new Button(refX, this.posY, 500, 80, "Campaign");
        btn.clickCB = () => {
            gameStateMachine.setState(campaingState);
        };
        this.buttons.push(btn);
        btn = new Button(refX, this.posY, 500, 80, "Fullscreen");
        btn.clickCB = () => {
            this.toggleFullscreen();
        };
        this.buttons.push(btn);
        Button.setHover(this.buttons);
        inputMouse.eventMouseDown = () => this.mouseDown();
    }
    onLeave() {
        this.buttons = [];
        inputMouse.eventMouseDown = () => { };
    }
    onUpdate(dt) {
        if (time % 5 == 0) {
            let n;
            do {
                n = randInt(0, themeCollection.length);
            } while (n == this.gameMap.theme);
            this.gameMap.theme = n;
            this.gameMap.seed = Math.random();
            this.gameMap.Init();
        }
        this.gameMap.drawTileMap(drawEngine.context);
        const xCenter = drawEngine.context.canvas.width / 2;
        drawEngine.drawText('Battle commander', 150, xCenter, 250);
        drawEngine.drawText('Middle Ages', 60, xCenter, 350);
        // drawEngine.drawText('Score points when your army cost is lower than the enemy', 40, xCenter, 500);
        // drawEngine.drawText('Menu', 80, xCenter, 400);
        this.buttons.forEach((button) => {
            button._update(dt);
            button._draw(drawEngine.context);
        });
        drawEngine.drawText('@santiHerranz', 30, drawEngine.canvasWidth * .9, drawEngine.canvasHeight * .9, '#aaa');
        drawEngine.drawText('for JS13K 2023', 30, drawEngine.canvasWidth * .9, drawEngine.canvasHeight * .93, '#fff');
    }
    toggleFullscreen() {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
        }
        else {
            document.exitFullscreen();
        }
    }
    mouseDown() {
        if (inputMouse.pointer.leftButton) {
            this.buttons.forEach(button => button.mouseUpEvent(inputMouse.pointer.Position));
        }
    }
    ;
}
const menuState = new MenuState();

// export const debug = {
//   showQuadtree: false,
//   showObjectInfo: false,
//   showUnitInfo: false,
//   showUnitTextInfo: false,
//   showCommandPathInfo: true,
//   disableFogofwar: false,
//   showButtonBounds: false
// }
var time = 0;
const FPS = 60;
var frame = 0;
let previousTime = 0;
const interval = 1000 / FPS;
const soundWaitTime = new Timer(0);
const transparent = 'transparent'; //rgba(0,0,0,0)
//const imageData = './sprite.png';
const imageData = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGAAAAAgCAMAAADaHo1mAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAhUExURf8AAO7DmgAAAM3NzUs8GktpL4pvMIGBgTw8PD4+PgAAAHbVe90AAAALdFJOU/////////////8ASk8B8gAAAAlwSFlzAAAOvwAADr8BOAVTJAAAAYBJREFUSEu9kotSwzAMBKkJL///B+OTVrbsPkggZWdaJSd8y6R5qSfyYnADpwm83CBxjgjWf26CcoPI2CmwQ+vZhPV2CI39guuzCdtdOqRityAgWGgLug1ScZrgcimlqFyDVEwHHlWI++sdAjvskCy8dggy9oRcoKFo23xj3w3KDaIZ2hsEmfknuCGgGTyboBsIBxQHirZGG1nAtuFhhuaAtMO5oCXql2EI2BkeZtRaSv+QdjgHSlRfShLcewvgB0F9m4j+sj1VsJX2SQK9X244LqC4Y/1GFgw8zBwTUC4QUBx4mHkgUA3FjhUHRwQJUkFR411wLWx1U+DZBMVAKHqTC/zK8CWCq7dg5WOCUFiTFf5NMCuIRBQ1PoVfCt8joLjj6YBHMyB3aJwF7M4UzLC7KfAs0x4LzQZpQOWC7+I3qPqFgukhGw8F9PkY+HISxLSLlSj+f0HU+bffxk0S2CsQUxcrkdvMfxBdTB/cnC4Y1Ywh+D0hZKY7bZ8p+Kq11m+Xf1ayHeIGzQAAAABJRU5ErkJggg==';
const runApp = async (image) => {
    createUnitsDatabase();
    createGameStateMachine(menuState);
    // createGameStateMachine(unitsState);
    // createGameStateMachine(summaryState);
    (function draw(currentTime) {
        frame += 1;
        time = frame / FPS;
        const delta = currentTime - previousTime;
        if (delta >= interval) {
            previousTime = currentTime - (delta % interval);
            inputKeyboard.queryController();
            drawEngine.context.clearRect(0, 0, drawEngine.canvasWidth, drawEngine.canvasHeight);
            // Although the game is currently set at 60fps, the state machine accepts a time passed to onUpdate
            // If you'd like to unlock the framerate, you can instead use an interval passed to onUpdate to 
            // adjust your physics so they are consistent across all frame rates.
            // If you do not limit your fps or account for the interval your game will be far too fast or far too 
            // slow for anyone with a different refresh rate than you.
            gameStateMachine.getState().onUpdate(delta);
        }
        requestAnimationFrame(draw);
    })(0);
};
const loadImage = async (url) => {
    const image = new Image();
    image.src = url;
    return new Promise((resolve) => {
        image.onload = () => resolve(image);
    });
};
Promise.all([
    loadImage(imageData),
    loadImage('assets/humanv2.png')
]).then(([appImage, humanV2]) => {
    setHumanV2Source(humanV2);
    runApp();
});
