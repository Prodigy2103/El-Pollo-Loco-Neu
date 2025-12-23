import { DrawableObject } from "./drawable_object.class.js";
import { Picture } from "../js/imghelper.js";

export class Statusbar extends DrawableObject {

    percentage = 100;
    picArray = [];

    /**
     * Creates a Statusbar instance.
     * Sets default dimensions and initializes the visual state to 100% health.
     */
    constructor() {
        super();
        this.loadImages(Picture.statusBar.health);
        this.x = 50;
        this.y = 0;
        this.width = 200;
        this.height = 50;
        
        this.setPercentage(100, Picture.statusBar.health);
    }

    /**
     * Updates the bar's internal percentage and refreshes the displayed image.
     * @param {number} percentage - The new value (0-100).
     * @param {string[]} picArray - The specific set of images to use for the update.
     */
    setPercentage(percentage, picArray) {
        this.percentage = percentage;
        let path = picArray[this.resolveImageIndex()];
        this.img = this.imageCache[path];
    }

    /**
     * Determines the correct index in the image array based on the current percentage.
     * @returns {number} The index (0 to 5) corresponding to the percentage range.
     */
    resolveImageIndex() {
        if (this.percentage === 100) {
            return 5;
        } else if (this.percentage >= 80) {
            return 4;
        } else if (this.percentage >= 60) {
            return 3;
        } else if (this.percentage >= 40) {
            return 2;
        } else if (this.percentage >= 20) {
            return 1;
        } else {
            return 0;
        }
    }
}