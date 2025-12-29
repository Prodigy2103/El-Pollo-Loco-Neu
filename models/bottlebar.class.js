import { Statusbar } from "./statusbar.class.js";
import { Picture } from "../js/imghelper.js";

export class BottleBar extends Statusbar {
    percentage = 0;

    constructor() {
        super();
        this.loadImages(Picture.statusBar.bottle);
        this.x = 50;
        this.y = 100;

        this.updateBar();
    }

    /**
     * Refreshes the bar's appearance based on the current percentage.
     * Selects the appropriate image from the bottle status bar image set.
     */
    updateBar() {
        this.setPercentage(this.percentage, Picture.statusBar.bottle);
    }
}