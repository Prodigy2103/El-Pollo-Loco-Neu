import { MovableObject } from "./movable_object.class.js";

export class BackgroundObjects extends MovableObject {

    width = 720; 
    height = 480;

    constructor(imagePath, x) {
        super();
        this.loadImage(imagePath);
        this.x = x - 100;
        this.y = 480 - this.height;
    }
}