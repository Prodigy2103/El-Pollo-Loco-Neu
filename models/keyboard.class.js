export class Keyboard {

    RIGHT = false;
    LEFT = false;
    SPACE = false;
    D = false;

    constructor() {
        this.bindEvents();
        this.bindTouchEvents();
    }

    /**
     * Binds desktop keyboard listeners to the window.
     * Maps Arrow keys, Space, and 'D' to the internal movement flags.
     */
    bindEvents() {
        window.addEventListener("keydown", (e) => {
            if (e.key === "ArrowRight") this.RIGHT = true;
            if (e.key === "ArrowLeft") this.LEFT = true;
            if (e.key === " ") { 
            e.preventDefault();
            this.SPACE = true;
        }
            if (e.key.toLowerCase() === "d") this.D = true;
        });

        window.addEventListener("keyup", (e) => {
            if (e.key === "ArrowRight") this.RIGHT = false;
            if (e.key === "ArrowLeft") this.LEFT = false;
            if (e.key === " ") this.SPACE = false;
            if (e.key.toLowerCase() === "d") this.D = false;
        });
    }

    /**
     * Binds touch listeners to HTML button elements for mobile gameplay.
     * Uses preventDefault to avoid ghost clicks and browser zooming.
     */
    bindTouchEvents() {
        const leftBtn = document.getElementById('left-btn');
        const rightBtn = document.getElementById('right-btn');
        const jumpBtn = document.getElementById('jump-btn');
        const throwBtn = document.getElementById('throw-btn');

        /** Logic for the Left Movement Button */
        leftBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.LEFT = true;
        });
        leftBtn.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.LEFT = false;
        });

        /** Logic for the Right Movement Button */
        rightBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.RIGHT = true;
        });
        rightBtn.addEventListener('touchend', (e) => {
            e.preventDefault(); 
            this.RIGHT = false;
        });

        /** Logic for the Jump Action Button */
        jumpBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.SPACE = true;
        });
        jumpBtn.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.SPACE = false;
        });

        /** Logic for the Throw Action Button */
        throwBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.D = true;
        });
        throwBtn.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.D = false;
        });
    }
}