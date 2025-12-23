import { Picture } from "../js/imghelper.js";
import { BaseEnemy } from "./base_enemy.class.js";

export class Smallchicken extends BaseEnemy {

    y = 375; 
    width = 50;
    height = 60;

    offset = {
        top: 0,
        left: 5,
        bottom: 5,
        right: 5
    };

    /**
     * Creates a Smallchicken instance.
     * Initializes animations and randomizes starting position and speed for variety.
     */
    constructor() {
        super();
        this.loadImage(Picture.littleChick.walk[0]);
        this.loadImages(Picture.littleChick.walk);
        this.loadImages(Picture.littleChick.dead);

        this.walkImages = Picture.littleChick.walk;
        this.deadImages = Picture.littleChick.dead;

        this.x = 1000 + Math.random() * 1440;
        this.speed = 0.2 + Math.random() * 0.7;

        this.animate();
    }
}