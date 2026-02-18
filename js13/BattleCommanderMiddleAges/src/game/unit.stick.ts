import { Vector } from "@/core/vector"
import BodyPart from "./BodyPart"


class UnitStick extends BodyPart {

  public _length: number = 0

  constructor(position: Vector, size: Vector, team: number) {
    super(position, size, team)
    this._length = size.y
  }

  _update(dt: any): void {
    // Block super call
    // super._update(dt) 
  }

  _draw(ctx: CanvasRenderingContext2D, offsets = { _position: new Vector(0, 0), r: 0 }) {

    ctx.save();
    ctx.globalAlpha = this._opacity;

    // Shift right so sword is at the character's side, not centered on body
    ctx.translate(
      this.Position.x + offsets._position.x + this._size.x,
      this.Position.y + offsets._position.y
    );

    ctx.rotate(this._rotation + offsets.r);

    // Uniform 2x scale (1 SVG unit = _size.x/8 screen pixels), flip Y for blade-down
    const s = 3.0;
    ctx.scale(s, -s);
    // Center grip (SVG x=8) at origin, position blade downward
    ctx.translate(-8, -16);

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

export default UnitStick;
