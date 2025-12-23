import { Picture } from "../js/imghelper.js";
import { MovableObject } from "./movable_object.class.js";
import { IntervalHub } from "../js/intervalhub.class.js";
import { AudioHub } from "../js/audio_hub.class.js";

export class Character extends MovableObject {
    x = 100;
    y = 135;
    width = 150;
    height = 300;
    speed = 6;
    world;

    // Optimierte Offsets für präzisere Sprung-Kills
    offset = {
        top: 150,
        left: 40,
        bottom: 10, // Erhöht, damit Pepe "tiefer" fallen muss für einen Kill
        right: 40
    };

    idleTimer = 0;
    jumpSoundPlayed = false;

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
     * Initializes and starts all recurring intervals for the character.
     * Includes animation frames, physical movement logic, and gravity application.
     */
    startAnimation() {
        IntervalHub.startInterval(this.animate, 1000 / 5);
        IntervalHub.startInterval(this.walkAnimate, 1000 / 60);
        IntervalHub.startInterval(this.applyGravity, 1000 / 60);
    }

    /**
     * Main animation controller that selects the appropriate image sequence 
     * based on the character's current state (dead, hurt, jumping, moving, or idle).
     */
    animate = () => {
        if (this.isDead()) {
            this.handleDeath();
        } else if (this.isHurt()) {
            this.handleHurt();
        } else if (this.isAboveGround()) {
            this.handleJumping();
        } else {
            this.jumpSoundPlayed = false;
            if (this.isMovingOrAction()) {
                this.handleMovement();
            } else {
                this.handleIdleState();
            }
        }
    };

    /**
     * Handles the character's death by playing the death animation, 
     * stopping all game sounds, and playing the specific death audio.
     */
    handleDeath() {
        this.playAnimation(Picture.pepePic.dead);
        AudioHub.stopAll();
        AudioHub.playOne(AudioHub.PEPE_DEAD, 0.25);
    }

    /**
     * Manages the "hurt" state by resetting the idle timer and playing 
     * the damage animation and audio.
     */
    handleHurt() {
        this.resetIdleTimer();
        this.playAnimation(Picture.pepePic.hurt);
        AudioHub.playOne(AudioHub.PEPE_DAMAGE, 0.25);
    }

    /**
     * Manages the jumping state, ensuring the jump animation plays 
     * and the jump sound is triggered exactly once per leap.
     */
    handleJumping() {
        this.resetIdleTimer();
        this.playAnimation(Picture.pepePic.jump);
        if (!this.jumpSoundPlayed) {
            AudioHub.playOne(AudioHub.PEPE_JUMP, 0.20);
            this.jumpSoundPlayed = true;
        }
    }

    /**
     * Handles the basic walking animation and resets the idle timer.
     */
    handleMovement() {
        this.resetIdleTimer();
        this.playAnimation(Picture.pepePic.walk);
    }

    /**
     * Controls the idle behavior. Switches from a standard idle to a 
     * "long idle" (sleeping) state if no action occurs for a specific duration.
     */
    handleIdleState() {
        this.idleTimer += 150;
        if (this.idleTimer > 1000) {
            this.playAnimation(Picture.pepePic.longIdle);
            this.playSnoring();
        } else {
            this.playAnimation(Picture.pepePic.idle);
            this.stopSnoring();
        }
    }

    /**
     * Checks if any movement keys or action buttons are currently pressed.
     * @returns {boolean} True if the character is active.
     */
    isMovingOrAction() {
        return this.world.keyboard.RIGHT || this.world.keyboard.LEFT || this.world.keyboard.D;
    }

    /**
     * Initiates the snoring audio loop if it is not already playing.
     */
    playSnoring() {
        if (AudioHub.PEPE_SNORING.sound.paused) {
            AudioHub.PEPE_SNORING.sound.loop = true;
            AudioHub.playOne(AudioHub.PEPE_SNORING, 0.10);
        }
    }

    /**
     * Pauses the snoring audio loop.
     */
    stopSnoring() {
        AudioHub.PEPE_SNORING.sound.pause();
    }

    /**
     * Resets the idle counter to zero and stops associated idle sounds.
     */
    resetIdleTimer() {
        this.idleTimer = 0;
        this.stopSnoring();
    }

    /**
     * Logic loop for horizontal movement, jumping, and camera tracking.
     * Runs at a high frequency (60 FPS) for smooth control.
     */
    walkAnimate = () => {
        let canMoveRight = this.world.keyboard.RIGHT && this.x < this.world.level.levelEnd_x;
        let canMoveLeft = this.world.keyboard.LEFT && this.x > 0;

        if (canMoveRight) this.executeMove(false);
        if (canMoveLeft) this.executeMove(true);

        this.handleRunSound(canMoveRight || canMoveLeft);

        if (this.world.keyboard.SPACE && !this.isAboveGround()) {
            this.jump();
        }
        this.world.camera_x = -this.x + 150;
    };

    /**
     * Updates the character's facing direction and executes the movement.
     * @param {boolean} isLeft - Direction of movement (true for left, false for right).
     */
    executeMove(isLeft) {
        this.otherDirection = isLeft;
        isLeft ? this.moveLeft() : this.moveRight();
    }

    /**
     * Manages the walking/running sound effect based on movement and ground contact.
     * @param {boolean} isMoving - Whether the character is currently moving horizontally.
     */
    handleRunSound(isMoving) {
        if (isMoving && !this.isAboveGround()) {
            if (AudioHub.PEPE_RUN.sound.paused) {
                AudioHub.playOne(AudioHub.PEPE_RUN, 0.05);
            }
        } else {
            AudioHub.PEPE_RUN.sound.pause();
        }
    }
}