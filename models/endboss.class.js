import { IntervalHub } from "../js/intervalhub.class.js";
import { Picture } from "../js/imghelper.js";
import { MovableObject } from "./movable_object.class.js";

/**
 * Represents the final boss enemy (Boss Chick) with advanced AI.
 * Features proximity-based activation, persistent pursuit logic, 
 * knockback physics when hit, and a specialized charging attack.
 * @extends MovableObject
 */
export class Endboss extends MovableObject {
        hurt_sound = new Audio('assets/sounds/endboss/endbossApproach.wav');
        x = 2500;
        y = 50;
        width = 300;
        height = 400;
        offset = { top: 100, left: 90, bottom: 80, right: 55 };
        hadContact = false;
        isCharging = false;
        chargeCooldown = false;
        chargeSpeed = 25;

        /**
         * Creates an Endboss instance.
         * Initializes health, preloads animations, and starts logic/movement intervals.
         */
        constructor() {
                super();
                this.loadImage(Picture.bossChick.alert[0]);
                this.energy = 100;
                this.loadBossImages();
                this.knockbackActive = 0;
                this.initialX = this.x;
                this.isJumping = false;
                this.jumpCooldown = 0;
                this.bossAnimationInterval = IntervalHub.startInterval(() => this.animate(), 150);
                this.movementInterval = IntervalHub.startInterval(() => this.updateMovement(), 1000 / 60);
        }

        /**
         * Loads all animation sequences for the boss into the image cache.
         */
        loadBossImages() {
                this.loadImages(Picture.bossChick.alert);
                this.loadImages(Picture.bossChick.walk);
                this.loadImages(Picture.bossChick.attack);
                this.loadImages(Picture.bossChick.hurt);
                this.loadImages(Picture.bossChick.dead);
        }

        /**
         * Main animation controller. 
         * Prioritizes states: Death > Hurt > Normal (Attack/Walk/Alert).
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
         * Handles behavior when the boss is healthy.
         * Manages activation range and switches between walking, attacking, and charging based on distance.
         */
        handleNormalState() {
                let distance = this.getDistanceToPlayer();
                if (distance < 500) this.hadContact = true;

                this.maybeStartCharge(distance);

                if (this.isCharging) {
                        this.playAnimation(Picture.bossChick.attack);
                } else if (distance < 70) {
                        this.playAnimation(Picture.bossChick.attack);
                        this.speed = 3.5;
                } else if (this.hadContact) {
                        this.playAnimation(Picture.bossChick.walk);
                        this.speed = 2.5;
                } else {
                        this.playAnimation(Picture.bossChick.alert);
                        this.speed = 0;
                }
        }

        /**
         * Randomly decides whether to trigger a charge attack based on distance and cooldown.
         * @param {number} distance - The current distance to the player.
         */
        maybeStartCharge(distance) {
                if (this.hadContact && distance < 500 && distance > 100 && !this.chargeCooldown && !this.isCharging) {
                        if (Math.random() < 0.05) {
                                this.startCharge();
                        }
                }
        }

        /**
         * Initiates the charging state and sets timers for duration and cooldown.
         */
        startCharge() {
                this.isCharging = true;
                this.chargeCooldown = true;
                setTimeout(() => {
                        this.isCharging = false;
                }, 600);
                setTimeout(() => {
                        this.chargeCooldown = false;
                }, 2000);
        }

        /**
         * Calculates the horizontal distance between the boss's hitbox and the player's hitbox.
         * @returns {number} Distance in pixels.
         */
        getDistanceToPlayer() {
                if (!this.world || !this.world.character) return 1000;
                return this.rX - (this.world.character.rX + this.world.character.rWidth);
        }

        /**
         * Handles horizontal movement, including pursuing the player 
         * and reactive knockback when injured or charging.
         */
        updateMovement() {
                if (this.isDead() || !this.hadContact) return;
                let maxBackX = 2500;
                if (this.isHurt()) {
                        if (this.x < maxBackX) this.x += 4;
                } else {
                        let distance = this.getDistanceToPlayer();
                        let currentSpeed = this.isCharging ? this.chargeSpeed : this.speed;
                        if (distance > -20) {
                                this.x -= currentSpeed;
                        }
                }
                this.getRealFrame();
        }

        /**
         * Sequence for boss death.
         * Stops audio, plays final animation, and halts movement/logic intervals.
         */
        handleDeathState() {
                if (!this.hurt_sound.paused) this.hurt_sound.pause();
                this.playAnimation(Picture.bossChick.dead);
                if (!this.isRemoving) {
                        this.isRemoving = true;
                        setTimeout(() => {
                                IntervalHub.stopInterval(this.bossAnimationInterval);
                                IntervalHub.stopInterval(this.movementInterval);
                        }, 1000);
                }
        }

        /**
         * Sequence for boss taking damage.
         * Forces activation and prepares a quick counter-animation.
         */
        handleHurtState() {
                this.hadContact = true;
                this.playAnimation(Picture.bossChick.hurt);
                this.playBossHurtSound();
                this.getRealFrame();
                setTimeout(() => {
                        if (!this.isDead()) this.playAnimation(Picture.bossChick.attack);
                }, 150);
        }

        /**
         * Updates the local sound volume based on global audio settings.
         */
        updateAudioVolume() {
                this.hurt_sound.volume = window.audioActive ? 0.5 : 0;
        }

        /**
         * Plays the boss-specific hurt/alert sound if audio is enabled.
         */
        playBossHurtSound() {
                if (window.audioActive && this.hurt_sound.paused) {
                        this.hurt_sound.volume = 0.25;
                        this.hurt_sound.play().catch(() => { });
                }
        }
}