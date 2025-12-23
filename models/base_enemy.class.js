import { MovableObject } from "./movable_object.class.js";
import { IntervalHub } from "../js/intervalhub.class.js";

export class BaseEnemy extends MovableObject {
    moveInterval;
    animationInterval;
    walkImages = [];
    deadImages = [];

    /**
     * Generic animation setup for all enemy types.
     * Automatically handles movement and visual state transitions.
     */
    animate() {
        this.moveInterval = IntervalHub.startInterval(() => {
            if (!this.isDead()) {
                this.moveLeft();
            }
        }, 1000 / 60);

        this.animationInterval = IntervalHub.startInterval(() => {
            if (this.isDead()) {
                this.playAnimation(this.deadImages);
                IntervalHub.stopInterval(this.moveInterval);
            } else {
                this.playAnimation(this.walkImages);
            }
        }, 125);
    }
}