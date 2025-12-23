import { Statusbar } from "./statusbar.class.js";
import { Picture } from "../js/imghelper.js";

export class Coinbar extends Statusbar {

    static coinPercentage = 0; 

    /**
     * Creates a Coinbar instance and initializes its position and visual state.
     */
    constructor() {
        super();
        this.loadImages(Picture.statusBar.coin);
        this.x = 50;
        this.y = 50;
        this.setPercentage(Coinbar.coinPercentage, Picture.statusBar.coin); 
    }
}