import { Vector } from "@/core/vector"
import { goToPosition } from "@/game/game-motion"
import { GameObject } from "./game-object"
import { drawEngine } from "@/core/draw-engine"
import UnitSword from "./unit.sword"
import { UnitAnimation } from "@/core/Animation"
import { configSwordAttack, configSwordIdle } from "./AnimationConfigs";
import { Timer, rand } from "@/utils"
import { UnitData, gameDatabase } from "@/game-database"
import { gameLevel } from "./game-level"
import { EntityType, Team, unitTypes } from "./EntityType"
import { appSprite, transparent } from "@/index"
import { colorizeHumanSprite, getKnightSprite } from "./sprite-colorizer"

export default class Unit extends GameObject {

    type: number = EntityType.None

    dataValues: UnitData


    name: string

    image: CanvasImageSource = new Image();
    imageSize = new Vector(32, 32);

    targetPosition: Vector | undefined


    Heading: number = 0
    maxSpeed: number = 0

    targetDistance: any
    followPathGroup: any
    followOrder: any
    maxForce: number = 4
    VisionRange: number = 0



    LooktoRight: boolean = false;

    attackAnim: number = 0


    // weapons

    weapon: UnitSword | undefined;
    _sizeSword: Vector = new Vector(10, 40);

    _idleAnim: UnitAnimation;
    _attackAnim: UnitAnimation;
    _currentAnim: UnitAnimation;

    _hasWeapon: boolean = true;

    SizeRef: Vector
    
    attackRangeFactor: number = 0;
    shootRangeFactor: number = 0;
    shootRangeMinimun: number = 0

    attackCoolDownTimer: Timer = new Timer(0);
    attackCoolDownValue: number = 0

    isKing: boolean = false;
    killCount: number = 0;
    friendKillCount: number = 0;

    owner: Unit | undefined


    winner: boolean = false
    speedFactor: number = 1
    shootCoolDownValue: number = 0
    stuntTime: Timer = new Timer(0)
    showBars: boolean = true

    

    constructor(position: Vector, sizeFactor = 1, team: number, type: number) {

        let size = gameDatabase.getUnitSize(type).scale(sizeFactor)

        super(position, size, team)

        this.dataValues = gameDatabase.getDataValues(type)

        this.SizeRef = size

        this.name = "unit-" + Math.random().toString(36).substr(2, 5);

        this.type = type

        this.getImage(type, team)

        this.loadProperties()

        this._idleAnim = new UnitAnimation(20, configSwordIdle);
        this._attackAnim = new UnitAnimation(16, configSwordAttack, false);

        // current animation
        this._currentAnim = this._idleAnim;

    }

    get attackRange() {
        return this.Radius * this.attackRangeFactor
    }
    get shootRange() {
        return this.Radius * this.shootRangeFactor
    }

    loadProperties() {

        this.healthPoints = this.healthPointsMax = this.dataValues.health
        this.armorPoints = this.armorPointsMax = this.dataValues.armor

        this.attackDamagePoints = this.dataValues.attackDamage
        this.attackRangeFactor = this.dataValues.attackRangeFactor
        this.attackCoolDownValue = this.dataValues.attackCoolDown

        this.dataValues.shootRangeFactor && (this.shootRangeFactor = this.dataValues.shootRangeFactor)

        this.shootRangeMinimun = this.shootRangeFactor * .3
        this.shootCoolDownValue = this.dataValues.shootCoolDown!

        this.speedFactor = this.dataValues.speedFactor
        this.maxSpeed = this.Radius * this.speedFactor / 200

        this.VisionRange = 0
    }

    setActive(range:number) {
        this.attackCoolDownTimer = new Timer(0);
        this.VisionRange = range
    }

    drawChilds(ctx: CanvasRenderingContext2D, realSize: Vector) {
        // drawEngine.drawRectangle(new Vector(-realSize.x / 2, -realSize.y / 2), realSize, { stroke: 'yellow', fill: 'transparent' });
    }

    doJump() {
        if (this._z == 0 && rand() > .5){
            this._zv += this.Size.y / 8
            this.jumping()
        }
    }
    jumping() { }

    attack() {
        this._currentAnim = this._attackAnim
        // if (this._sword) {
        //     // this._sword._size.scale(1.8)
        //     this._sword._length = this._sword._size.y
        // }
    }

    shootTo(position: Vector) {
    }

    scoreKill() { }

    deathHandler() { }

    destroy(): void {
        this.deathHandler()
        super.destroy()
    }

    _update(dt: any) {


        this.setSizes()

        // Animation
        this._currentAnim._update(dt);
        if (this._currentAnim == this._attackAnim && this._currentAnim._finished) {
            this._currentAnim = this._idleAnim;
            this.Size = this.SizeRef.clone()
        }

        // Jumping
        if (this.winner) {
            this.doJump()
        }

        // navigation control
        if (this.targetPosition) {
            this._control(dt);
        }

        super._update(dt)

        let canAttack = false

        if (this.targetPosition != undefined) {
            let distance = this.Position.distance(this.targetPosition)
            canAttack = distance < this.attackRange //&& distance > this.Radius * this.attackRangeMinimun
        }

        if (this.targetPosition
            && canAttack
            && this.attackCoolDownTimer.elapsed()) {
            this._currentAnim = this._attackAnim

            this.attack()
            this.attackCoolDownTimer.set(this.attackCoolDownValue);
        }
    }

    setSizes() {
        if (this.weapon) {
            this.weapon._size = this.weapon._sizeRef.clone().scale(this.Size.clone().scale(1 / 32).y)
            this.weapon._length = this.weapon._size.y
        }
    }

    _control(dt: any) {


        if (this.targetPosition) {

            // let decision = Control.goToPosition(this, this.targetPosition);
            let decision = goToPosition(this, this.targetPosition);

            // apply decision 
            this._rotate(decision.r);
            this._move(decision.m * 1 / dt);

            // target reached
            if (decision.d < 4)
                this.targetPosition = undefined
        }
    }




    _rotate(angle: number) {
        this.Heading += angle;
    }
    _move(value: number) {
        value = Math.min(this.maxSpeed, value)
        this.Acceleration.add(Vector.fromAngle(this.Heading, value));
    }


    getImage(index: number = 0, team: number = Team.Alpha) {
        this.image = Unit.prepareImage(index, team)
        if (this.image instanceof HTMLCanvasElement) {
            this.imageSize = new Vector(this.image.width, this.image.height);
        }
    }

    static prepareImage(index: number = 0, team: number = Team.Alpha): CanvasImageSource {

        // Knight uses pre-scaled canvas (knight.png is 1024x1024)
        if (index === EntityType.Knight) {
            return getKnightSprite();
        }
        if (index === EntityType.Cavalry) {
            let img = new Image();
            img.src = 'assets/cavalry.png';
            return img;
        }

        // All human-type units use the colorizer (synchronous, humanv2.jpg is preloaded)
        return colorizeHumanSprite(index, team);
    }


    draw(ctx: CanvasRenderingContext2D, dir: boolean = false) {

        // const circlePosition = this.Position//.clone().add(new Vector(this.Radius, this.Radius).scale(.5));

        // drawEngine.drawText(''+ this.Team, 15, thisPosition.x, thisPosition.y);
        // if (debug.showUnitTextInfo)
        //     drawEngine.drawText('' + this.healthPoints, 15, circlePosition.x, circlePosition.y); // + '/' + this.damagePoints

        // if (debug.showUnitInfo && this.targetPosition) //
        //     drawEngine.drawLine(circlePosition, this.targetPosition);




        if (unitTypes.includes(this.type) && gameLevel.level[gameLevel.levelIndex].sizeFactor >= 1 && this.showBars) {
            // armor bar
            this.drawBar(ctx, +this.Radius * .9, this.armorPoints, this.armorPointsMax, ["", "#666", "#666"][this.Team], this.armorPoints > 0, 8)

            // health bar
            this.drawBar(ctx, +this.Radius * .9, this.healthPoints, this.healthPointsMax, ["", "#f00", "#00f"][this.Team], this.armorPoints == 0 && this.healthPoints > 0) //this.healthPoints > 0 && this.healthPoints < 80
        }

        // if (debug.showUnitInfo) {
        //     drawEngine.drawCircle(this.Position, this.Radius); // this.Size.length()
        //     // drawEngine.drawText('' + this._zv.toFixed(2), 15, circlePosition.x, circlePosition.y-50); // + '/' + this.damagePoints
        //     // drawEngine.drawText('' + this.speedFactor.toFixed(2), 15, circlePosition.x, circlePosition.y-50); // + '/' + this.damagePoints
        //     // drawEngine.drawText('' + this.healthPoints.toFixed(2), 15, circlePosition.x, circlePosition.y-50); // + '/' + this.damagePoints
        //     // drawEngine.drawText('' + this.Acceleration.key, 15, circlePosition.x, circlePosition.y-50); // + '/' + this.damagePoints

        //     this.targetPosition && drawEngine.drawLine(this.Position, this.targetPosition, { stroke: ['', '#f00', '#00f'][this.Team], fill: '' });

        // }

        
        
        // drawEngine.drawText('' + this._z, 15, this.Position.x, this.Position.y-50); // + '/' + this.damagePoints

        super.draw(ctx)
    }

    public drawBar(ctx: CanvasRenderingContext2D, offsetY: number, valueToShow: number, valueMax: number, color: string, condition: boolean, lineWidth: number = 6) {

        if (condition) {
            let value = valueToShow / valueMax

            ctx.beginPath()
            ctx.strokeStyle = "#fff"
            ctx.lineWidth = 8
            ctx.moveTo(this.Position.x - this.Size.x / 2, this.Position.y + offsetY)
            ctx.lineTo(this.Position.x + this.Size.x / 2, this.Position.y + offsetY)
            ctx.stroke()

            ctx.beginPath()
            ctx.strokeStyle = color
            ctx.lineWidth = lineWidth
            ctx.moveTo(this.Position.x - this.Size.x / 2, this.Position.y + offsetY)
            ctx.lineTo(this.Position.x - this.Size.x / 2 + this.Size.x * value, this.Position.y + offsetY) 
            ctx.stroke()
        }
    }
}

