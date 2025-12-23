import { IntervalHub } from "../js/intervalhub.class.js";
import { Picture } from "../js/imghelper.js";
import { MovableObject } from "./movable_object.class.js";

export class Cloud extends MovableObject {

    x = 800;
    y = 20;
    width = 1000;
    height = 400;

    /**
     * Creates a Cloud instance and initializes its movement loop.
     * Sets the cloud's appearance and registers the movement interval.
     */
    constructor() {
        super();
        this.loadImage(Picture.background.clouds);
        this.loadImages(Picture.background.clouds);
        IntervalHub.startInterval(this.startCloud, 1000 / 60);
    }

    /**
     * Moves the cloud steadily to the left.
     * Triggered by the IntervalHub.
     * @type {function}
     */
    startCloud = () => {
        this.moveLeft();
    };
}
