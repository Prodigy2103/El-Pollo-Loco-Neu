import { Picture } from "../js/imghelper.js";
import { BaseEnemy } from "./base_enemy.class.js";

export class Chicken extends BaseEnemy {

    y = 350;
    width = 70;
    height = 90;

    offset = {
        top: 5,
        left: 15,
        bottom: 8,
        right: 15
    };

    /**
     * Creates a Chicken instance.
     * Randomizes the starting x-position and speed to vary enemy behavior.
     */
    constructor() {
        super();
        this.loadImage(Picture.normalChick.walk[0]);
        this.loadImages(Picture.normalChick.walk);
        this.loadImages(Picture.normalChick.dead);

        this.walkImages = Picture.normalChick.walk;
        this.deadImages = Picture.normalChick.dead;

        this.x = 600 + Math.random() * 1440;
        this.speed = 0.15 + Math.random() * 0.5;
        
        this.animate();
    }
}