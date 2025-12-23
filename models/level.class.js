import { Chicken } from "../models/chicken.class.js";
import { Cloud } from "../models/cloud.class.js";
import { BackgroundObjects } from "../models/background.class.js";
import { Endboss } from "./endboss.class.js";
import { Smallchicken } from "./smallChick.class.js";
import { Coin } from "./coin.class.js";
import { Bottle } from "./bottlemain.js";

export class Level {

    enemies;
    clouds;
    backgroundObjects;
    levelEnd_x = 3000;
    collectibles;

    /**
     * Initializes a new level by generating enemies, collectibles, and backgrounds.
     */
    constructor() {
        this.enemies = [
            ...this.createEnemies(Chicken, 4),
            ...this.createEnemies(Smallchicken, 6),
            new Endboss()
        ];

        this.collectibles = {
            coins: this.createRandomCoins(15),
            bottles: this.createRandomBottles(8) 
        };

        this.clouds = [new Cloud()];
        this.backgroundObjects = this.createBackgrounds();
    }
    
    /**
     * Creates a repeating set of background layers to cover the entire level length.
     * Alternates between two suffixes to create visual variety in the terrain.
     * @returns {BackgroundObjects[]} An array of initialized background layers.
     */
    createBackgrounds() {
        const backgrounds = [];
        const layerCount = 6;

        for (let i = 0; i < layerCount; i++) {
            const x = i * 719; // 719 ensures seamless tiling without gaps
            const imgSuffix = (i % 2 === 0) ? '1' : '2';

            backgrounds.push(
                new BackgroundObjects("./assets/img/5_background/layers/air.png", x),
                new BackgroundObjects(`./assets/img/5_background/layers/3_third_layer/${imgSuffix}.png`, x),
                new BackgroundObjects(`./assets/img/5_background/layers/2_second_layer/${imgSuffix}.png`, x),
                new BackgroundObjects(`./assets/img/5_background/layers/1_first_layer/${imgSuffix}.png`, x)
            );
        }
        return backgrounds;
    }

    /**
     * Instantiates a specific number of enemies of a given class.
     * @param {typeof MovableObject} EnemyClass - The class to instantiate (e.g., Chicken).
     * @param {number} count - How many enemies to create.
     * @returns {MovableObject[]} Array of instantiated enemies.
     */
    createEnemies(EnemyClass, count) {
        let enemyArray = [];
        for (let i = 0; i < count; i++) {
            enemyArray.push(new EnemyClass());
        }
        return enemyArray;
    }

    /**
     * Utility function to generate a random float between two values.
     * @param {number} min - Minimum value.
     * @param {number} max - Maximum value.
     * @returns {number} The random result.
     */
    getRandomNumber(min, max) {
        return Math.random() * (max - min) + min;
    }

    /**
     * Populates the level with coins at randomized positions within the sky/mid-air bounds.
     * @param {number} count - Number of coins to generate.
     * @returns {Coin[]} Array of Coin instances.
     */
    createRandomCoins(count) {
        let coins = [];
        const minX = 200;
        const maxX = this.levelEnd_x - 400;
        const minY = 150;
        const maxY = 320;

        for (let i = 0; i < count; i++) {
            const randomX = this.getRandomNumber(minX, maxX);
            const randomY = this.getRandomNumber(minY, maxY);
            coins.push(new Coin(randomX, randomY));
        }
        return coins;
    }

    /**
     * Populates the level with salsa bottles placed randomly along the ground.
     * @param {number} count - Number of bottles to generate.
     * @returns {Bottle[]} Array of Bottle instances.
     */
    createRandomBottles(count) {
        let bottles = [];
        const minX = 200;
        const maxX = this.levelEnd_x - 400;
        const fixedY = 360;

        for (let i = 0; i < count; i++) {
            const randomX = this.getRandomNumber(minX, maxX);
            bottles.push(new Bottle(randomX, fixedY));
        }
        return bottles;
    }
}