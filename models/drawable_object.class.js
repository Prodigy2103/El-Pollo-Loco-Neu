/**
 * Base class for all objects that can be rendered on the canvas.
 */
export class DrawableObject {
    x = 30;
    y = 135;
    width = 100;
    height = 150;
    img;
    imageCache = {};
    currentImage = 0;
    otherDirection = false;

    offset = {
        top: 0,
        left: 0,
        bottom: 0,
        right: 0
    };

    /** @type {number} Attribute für die Hitbox */
    rX;
    rY;
    rWidth;
    rHeight;

    loadImage(path) {
        this.img = new Image();
        this.img.src = path;
    }

    /**
     * Updates collision attributes and draws the image.
     */
    draw(ctx) {
        this.getRealFrame(); // Berechnet rX, rY, rWidth, rHeight neu
        ctx.drawImage(this.img, this.x, this.y, this.width, this.height);
    }

    loadImages(arr) {
        arr.forEach((path) => {
            let img = new Image();
            img.src = path;
            this.imageCache[path] = img;
        });
    }

    /**
     * Precise AABB collision detection using attributes.
     */
    isColliding(mo) {
        return this.rX + this.rWidth > mo.rX &&
            this.rY + this.rHeight > mo.rY &&
            this.rX < mo.rX + mo.rWidth &&
            this.rY < mo.rY + mo.rHeight;
    }

    /**
     * Updates the "Real Frame" attributes based on current x, y and offsets.
     */
    getRealFrame = () => {
        this.rX = this.x + this.offset.left;
        this.rY = this.y + this.offset.top;
        this.rWidth = this.width - this.offset.left - this.offset.right;
        this.rHeight = this.height - this.offset.top - this.offset.bottom;
    }
}