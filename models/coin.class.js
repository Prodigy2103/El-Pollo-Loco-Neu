import { MovableObject } from "./movable_object.class.js"; 
import { Picture } from "../js/imghelper.js"; 

export class Coin extends MovableObject {

    static coinPercentage = 0;

    offset = {
        top: 20,
        bottom: 20,
        left: 20,
        right: 20
    };

    constructor(x, y) {
        super();
        this.loadImages(Picture.coin);
        this.playAnimation(Picture.coin);
        this.x = x;
        this.y = y;
        this.width = 150;
        this.height = 150;
        this.animate();
    }

    /**
     * Initializes a recurring interval to cycle through the coin's animation frames.
     * Creates the visual effect of a spinning or shimmering coin.
     */
    animate() {
        setInterval(() => {
            this.playAnimation(Picture.coin);
        }, 300);
    }
}