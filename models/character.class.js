import { Picture } from "../js/imghelper.js";
import { MovableObject } from "./movable_object.class.js";
import { IntervalHub } from "../js/intervalhub.class.js";
import { AudioHub } from "../js/audio_hub.class.js";

/**
 * Represents the main playable character (Pepe).
 * Manages character-specific animations, movement logic, sound effects, and state transitions.
 * @extends MovableObject
 */
export class Character extends MovableObject {
    x = 100;
    y = 135;
    width = 150;
    height = 300;
    speed = 6;
    world;
    idleTimer = 0;
    isDeadPlaying = false;

    offset = {
        top: 150,
        left: 50,
        bottom: 15,
        right: 50
    };

    /**
     * Creates a Character instance.
     * Preloads all animation frame sets and sets the initial sprite.
     */
    constructor() {
        super();
        this.loadImage(Picture.pepePic.idle[0]);
        this.loadImages(Picture.pepePic.idle);
        this.loadImages(Picture.pepePic.longIdle);
        this.loadImages(Picture.pepePic.walk);
        this.loadImages(Picture.pepePic.jump);
        this.loadImages(Picture.pepePic.dead);
        this.loadImages(Picture.pepePic.hurt);
    }

    /**
     * Starts the asynchronous interval loops for physics, horizontal movement, and visual animations.
     */
    startAnimation() {
        IntervalHub.startInterval(this.animate, 1000 / 12); // Visual state updates
        IntervalHub.startInterval(this.walkAnimate, 1000 / 60); // Physics & Camera
        IntervalHub.startInterval(this.applyGravity, 1000 / 60); // Gravity calculation
    }

    /**
     * Main animation state machine. 
     * Determines which animation set to play based on current character health and activity.
     */
    animate = () => {
        if (this.isDead()) {
            this.handleDeath();
        } else if (this.isHurt()) {
            this.handleHurt();
        } else if (this.isAboveGround()) {
            this.handleJumping();
        } else if (this.isMovingOrAction()) {
            this.handleMovement();
        } else {
            this.handleIdleState();
        }
    };

    /**
     * Handles the death sequence. 
     * Plays the death animation exactly once and stops all game music to play the death sound.
     */
    handleDeath() {
        let frames = Picture.pepePic.dead;

        if (this.currentImage < frames.length - 1) {
            let path = frames[this.currentImage];
            this.img = this.imageCache[path];
            this.currentImage++;
        } else {
            this.img = this.imageCache[frames[frames.length - 1]];
        }

        if (!this.isDeadPlaying) {
            this.isDeadPlaying = true;
            this.currentImage = 0;
            this.speed = 0;
            AudioHub.stopAll();
            AudioHub.playOne(AudioHub.PEPE_DEAD);
        }
    }

    /**
     * Triggers the hurt state, resetting the idle timer and playing the damage sound.
     */
    handleHurt() {
        this.resetIdleTimer();
        this.playAnimation(Picture.pepePic.hurt);
        AudioHub.PEPE_DAMAGE.sound.volume = 0.25;
        AudioHub.playOne(AudioHub.PEPE_DAMAGE);
    }

    /**
     * Manages visual frames and sound for jumping.
     */
    handleJumping() {
        this.resetIdleTimer();
        this.playAnimation(Picture.pepePic.jump);
        if (!this.isJumpSoundPlayed) {
            AudioHub.PEPE_JUMP.sound.volume = 0.25;
            AudioHub.playOne(AudioHub.PEPE_JUMP);
            this.isJumpSoundPlayed = true;
        }
    }

    /**
     * Standard movement handler for walking.
     */
    handleMovement() {
        this.resetIdleTimer();
        this.playAnimation(Picture.pepePic.walk);
    }

    /**
     * Logic for inactivity. 
     * Switches to "long idle" (snoring) after 8 seconds of inactivity.
     */
    handleIdleState() {
        this.idleTimer += 150;
        if (this.idleTimer > 8000) {
            this.playAnimation(Picture.pepePic.longIdle);
            this.playSnoring();
        } else {
            this.playAnimation(Picture.pepePic.idle);
            this.stopSnoring();
        }
    }

    /**
     * Checks if any movement or action keys are currently pressed.
     * @returns {boolean} True if character is active.
     */
    isMovingOrAction() {
        return this.world.keyboard.RIGHT || this.world.keyboard.LEFT || this.world.keyboard.D;
    }

    /**
     * Starts the snoring sound loop for long idle states.
     */
    playSnoring() {
        if (AudioHub.PEPE_SNORING.sound.paused) {
            AudioHub.PEPE_SNORING.sound.volume = 0.25;
            AudioHub.playOne(AudioHub.PEPE_SNORING);
            AudioHub.PEPE_SNORING.sound.loop = true;
        }
    }

    /**
     * Stops the snoring sound and resets its playback position.
     */
    stopSnoring() {
        AudioHub.PEPE_SNORING.sound.pause();
        AudioHub.PEPE_SNORING.sound.currentTime = 0;
    }

    /**
     * Resets the inactivity tracker to zero and stops idle-specific sounds.
     */
    resetIdleTimer() {
        this.idleTimer = 0;
        this.stopSnoring();
    }

    /**
     * High-frequency logic for horizontal movement, world boundaries, 
     * jumping, and camera tracking.
     */
    walkAnimate = () => {
        if (this.isDead()) return;

        let canMoveRight = this.world.keyboard.RIGHT && this.x < this.world.level.levelEnd_x;
        let canMoveLeft = this.world.keyboard.LEFT && this.x > 0;

        if (canMoveRight) this.executeMove(false);
        if (canMoveLeft) this.executeMove(true);

        this.handleRunSound(canMoveRight || canMoveLeft);
        if (this.world.keyboard.SPACE && !this.isAboveGround()) {
            this.jump();
        }

        if (!this.isAboveGround()) {
            this.isJumpSoundPlayed = false;
        }

        this.world.camera_x = -this.x + 150;
    };

    /**
     * Executes the horizontal move and flips the character sprite if necessary.
     * @param {boolean} isLeft - True if moving left, false if moving right.
     */
    executeMove(isLeft) {
        this.otherDirection = isLeft;
        isLeft ? this.moveLeft() : this.moveRight();
    }

    /**
     * Manages the walking/running sound effect playback.
     * @param {boolean} isMoving - Whether the character is currently walking on ground.
     */
    handleRunSound(isMoving) {
        if (isMoving && !this.isAboveGround()) {
            if (AudioHub.PEPE_RUN.sound.paused) {
                AudioHub.PEPE_RUN.sound.volume = 0.25;
                AudioHub.playOne(AudioHub.PEPE_RUN);
            }
        } else {
            AudioHub.PEPE_RUN.sound.pause();
        }
    }
}