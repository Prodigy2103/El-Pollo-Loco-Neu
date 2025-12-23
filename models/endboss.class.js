import { IntervalHub } from "../js/intervalhub.class.js";
import { Picture } from "../js/imghelper.js";
import { MovableObject } from "./movable_object.class.js";

export class Endboss extends MovableObject {

        hurt_sound = new Audio('assets/sounds/endboss/endbossApproach.wav');
        x = 2100;
        y = 50;
        width = 300;
        height = 400;

        offset = {
                top: 100,
                left: 80,
                bottom: 80,
                right: 55
        };

        /**
         * Creates an Endboss instance.
         * Initializes health, preloads animations, and starts logic/movement intervals.
         */
        constructor() {
                super();
                this.loadImage(Picture.bossChick.alert[0]);
                this.energy = 100;
                this.loadBossImages();
                this.bossAnimationInterval = IntervalHub.startInterval(() => this.animate(), 300);
                this.movementInterval = IntervalHub.startInterval(() => this.updateMovement(), 1000 / 60);
        }

        /**
         * Preloads all boss-related animation frame sets into the image cache.
         */
        loadBossImages() {
                this.loadImages(Picture.bossChick.alert);
                this.loadImages(Picture.bossChick.walk);
                this.loadImages(Picture.bossChick.attack);
                this.loadImages(Picture.bossChick.hurt);
                this.loadImages(Picture.bossChick.dead);
        }

        /**
         * Main animation controller. Switches between states based on health and proximity.
         */
        animate() {
                this.updateAudioVolume();
                if (this.isDead()) {
                        this.handleDeathState();
                } else if (this.isHurt()) {
                        this.handleHurtState();
                } else {
                        this.handleNormalState();
                }
        }

        /**
         * Handles logic when the boss is healthy, including movement speed and attack triggers.
         */
        handleNormalState() {
                let attacking = this.isCloseToPlayer();
                this.updateBossSpeed(attacking);
                this.playAppropriateAnimation(attacking);
        }

        /**
         * Increases speed if the boss is in attack range.
         * @param {boolean} attacking - Whether the player is close enough to trigger an attack.
         */
        updateBossSpeed(attacking) {
                this.speed = attacking ? 4 : 1;
        }

        /**
         * Selects the animation set to play based on speed and attack status.
         * @param {boolean} attacking - Whether the boss is currently attacking.
         */
        playAppropriateAnimation(attacking) {
                if (attacking) {
                        this.playAnimation(Picture.bossChick.attack);
                } else if (this.speed > 0) {
                        this.playAnimation(Picture.bossChick.walk);
                } else {
                        this.playAnimation(Picture.bossChick.alert);
                }
        }

        /**
         * Calculates the distance between the boss and the player.
         * @returns {boolean} True if the character is within 250 pixels.
         */
        isCloseToPlayer() {
                if (!this.world || !this.world.character) return false;
                let distance = Math.abs(this.x - this.world.character.x);
                return distance < 250;
        }

        /**
         * Handles the death sequence: stops audio, plays animation, and removes the boss from the level.
         */
        handleDeathState() {
                if (!this.hurt_sound.paused) this.hurt_sound.pause();
                this.playAnimation(Picture.bossChick.dead);
                if (!this.isRemoving) {
                        this.isRemoving = true;

                        setTimeout(() => {
                                let index = this.world.level.enemies.indexOf(this);
                                if (index > -1) {
                                        this.world.level.enemies.splice(index, 1);
                                }
                                IntervalHub.stopInterval(this.bossAnimationInterval);
                                IntervalHub.stopInterval(this.movementInterval);
                        }, 500);
                }
        }

        /**
         * Triggers the hurt animation and plays the associated sound.
         */
        handleHurtState() {
                this.playAnimation(Picture.bossChick.hurt);
                this.playBossHurtSound();
        }

        /**
         * Syncs the internal boss audio volume with the global game audio setting.
         */
        updateAudioVolume() {
                this.hurt_sound.volume = window.audioActive ? 0.5 : 0;
        }

        /**
         * Manages playback of the hurt sound effect, respecting the global audio state.
         */
        playBossHurtSound() {
                if (window.audioActive && this.hurt_sound.paused) {
                        this.hurt_sound.volume = 0.25;
                        this.hurt_sound.play().catch(() => { });
                } else if (!window.audioActive && !this.hurt_sound.paused) {
                        this.hurt_sound.pause();
                }
        }

        /**
         * Orchestrates movement logic including direction checks and position updates.
         */
        updateMovement() {
                if (this.isDead()) return;
                this.updateDirection();
                this.applyMovement();
        }

        /**
         * Patrol logic: Flips the movement direction if the boss hits specified horizontal boundaries.
         */
        updateDirection() {
                let leftBound = 2200;
                let rightBound = 2600;

                if (this.x >= rightBound) {
                        this.otherDirection = false;
                } else if (this.x <= leftBound) {
                        this.otherDirection = true;
                }
        }

        /**
         * Applies the speed value to the x-coordinate based on the current direction.
         */
        applyMovement() {
                if (this.otherDirection) {
                        this.x += this.speed;
                } else {
                        this.x -= this.speed;
                }
        }

        /**
         * Checks if the boss is currently in the air.
         * @returns {boolean} True if the boss is above the ground level.
         */
        isAboveGround() {
                return this.y < 55;
        }
}