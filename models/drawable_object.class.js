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
    }

    rX;
    rY;
    rWidth;
    rHeight;

    /**
     * Loads a single image from a given path.
     * @param {string} path - The URL or local path to the image source.
     */
    loadImage(path) {
        this.img = new Image();
        this.img.src = path;
    }

    /**
     * Renders the current image onto the provided canvas context.
     * Updates the collision frame coordinates before drawing.
     * @param {CanvasRenderingContext2D} ctx - The 2D rendering context of the canvas.
     */
    draw(ctx) {
        this.getRealFrame();
        ctx.drawImage(this.img, this.x, this.y, this.width, this.height);
    }

    /**
     * Preloads an array of images into the imageCache.
     * @param {string[]} arr - Array of image paths to be cached.
     */
    loadImages(arr) {
        arr.forEach((path) => {
            let img = new Image();
            img.src = path;
            this.imageCache[path] = img;
        });
    }

    /**
     * Checks if this object is overlapping with another drawable object.
     * Uses the "Real Frame" (rX, rY, rWidth, rHeight) for precise AABB collision detection.
     * @param {DrawableObject} mo - The other object to check collision against.
     * @returns {boolean} True if objects are colliding.
     */
    isColliding(mo) {
        return this.rX + this.rWidth > mo.rX &&
            this.rY + this.rHeight > mo.rY &&
            this.rX < mo.rX + mo.rWidth &&
            this.rY < mo.rY + mo.rHeight;
    }

    /**
     * Calculates the "Real Frame" coordinates and dimensions.
     * Subtracts the offsets from the visual image dimensions to create an accurate collision box.
     */
    getRealFrame = () => {
        this.rX = this.x + this.offset.left;
        this.rY = this.y + this.offset.top;
        this.rWidth = this.width - this.offset.left - this.offset.right;
        this.rHeight = this.height - this.offset.top - this.offset.bottom;
    }
}