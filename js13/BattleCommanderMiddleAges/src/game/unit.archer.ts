import { Vector } from "@/core/vector";
import Unit from "./unit";
import { EntityType } from "./EntityType";
import { gamePresenter } from "./game-presenter";
import { PI, Timer } from "@/utils";
import { time } from "@/index";
import crossbowUrl from '../../assets/humancrossbow.svg';

const crossbowImg = new Image();
crossbowImg.src = crossbowUrl;

export class Archer extends Unit {

    bulletSpeed: number = 14;

    shootRangeMinimun: number = 0
    shootCoolDownTimer: Timer = new Timer(0);
    slowWhileInRange: boolean = true;

    constructor(position: Vector, sizeFactor: number, team: number, type: number = EntityType.Archer) {
        super(position, sizeFactor, team, type)
        this.loadProperties()
    }


    setActive(range: number): void {
        super.setActive(range)
        this.shootCoolDownTimer = new Timer(1); // shootFirstWait
    }

    public shootHandler(targetPosition: Vector, velocity: Vector, zv: number) { }

    private _shoot(targetPosition: Vector, velocity: Vector) {
        if (this.shootCoolDownTimer.elapsed()) {
            this.shootHandler(targetPosition, velocity, 0)
            this.shootCoolDownTimer.set(this.shootCoolDownValue);
        }
    }

    public shootTo(position: Vector, zv: number = 10) {
        super.shootTo(position)
        const data = this.calculateShoot(position); //.rotate(rand(this.bulletSpread, -this.bulletSpread))
        this._shoot(position, data.velocity)
    }



    draw(ctx: CanvasRenderingContext2D, dir: boolean = false) {

        gamePresenter.drawTroop(ctx, this, this.LooktoRight || dir)
        super.draw(ctx)

    }

    drawChilds(ctx: CanvasRenderingContext2D, realSize: Vector): void {
        if (!crossbowImg.complete) return;
        ctx.translate(this.Size.x * -.2, realSize.y * .05);
        ctx.rotate(Math.PI / 2 - .3)
        const s = this.Size.x * 1.2;
        ctx.drawImage(crossbowImg, -s * .1, -s * .8, s, s);
    }

    _update(dt: any): void {

        let canShoot = false

        if (this.targetPosition != undefined) {
            let distance = this.Position.distance(this.targetPosition)
            canShoot = distance < this.shootRange && distance > this.shootRangeMinimun
        }

        // FEATURE slow movement while target
        if (this.slowWhileInRange && canShoot) { // && this.attackCoolDownTimer.p100() < 100
            this.Velocity.scale(.5)
            this.Acceleration.scale(.5)
            this.maxSpeed = this.Radius * this.speedFactor / 1000
        }
        else
            this.maxSpeed = this.Radius * this.speedFactor / 100


        super._update(dt)

        if (this.targetPosition && canShoot) {
            this.shootTo(this.targetPosition)
        }
    }


    calculateShoot(targetPosition: Vector): { velocity: Vector } {

        const direction = -Math.atan2(this.Position.x - targetPosition.x, this.Position.y - targetPosition.y) - Math.PI / 2;
        const velocity = new Vector(1, 0).rotate(direction).scale(this.bulletSpeed);
        return { velocity };
    }

}