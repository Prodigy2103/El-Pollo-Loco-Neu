import { Statusbar } from "./statusbar.class.js";
import { Picture } from "../js/imghelper.js";

export class EndbossBar extends Statusbar {
    
    constructor() {
        super();
        this.loadImages(Picture.statusBar.endboss);
        this.x = 450;
        this.y = 10;
        this.width = 200;
        this.height = 50;
        this.setPercentage(100, Picture.statusBar.endboss);
    }
}