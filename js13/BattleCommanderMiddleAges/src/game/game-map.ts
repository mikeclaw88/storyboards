import { Vector } from "@/core/vector";
import TileMap from "./tilemap";
import { drawEngine } from "@/core/draw-engine";
import { GameTile } from "./game-tile";
import battlefieldUrl from '../../assets/battlefield.jpg';

const bgImage = new Image();
bgImage.src = battlefieldUrl;

export const themeDef = { forest: 0, dessert: 1, other: 2, snow: 3} //, sea: 2 
export const themeCollection = [themeDef.forest, themeDef.dessert, themeDef.other, themeDef.snow] //, themeDef.sea

export class GameMap {

    tileMap: TileMap;
    imageCache: any;
    theme: number = 0;

    dim: Vector
    size: Vector
    seed: number

    constructor(dim: Vector = new Vector(60, 60), size: Vector = new Vector(5, 5), seed = 81962, theme = themeDef.forest) {

        this.dim = dim
        this.size = size
        this.seed = seed
        this.theme = theme

        this.tileMap = new TileMap(dim, size, seed);
    }

    Init() {
        this.tileMap = new TileMap(this.dim, this.size, this.seed);
        this.imageCache = undefined
    }

    drawTileMap(ctx: CanvasRenderingContext2D, blurValue = 15) {
        if (!bgImage.complete) return;
        var w = drawEngine.canvasWidth, h = drawEngine.canvasHeight;
        ctx.drawImage(bgImage, 0, 0, w, h);
    }


}