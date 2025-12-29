export class PlayAudio {

    constructor(src) {
        this.audio = new Audio(src);
        this.audio.preload = 'auto';
        return this.audio;
    }
}

/**
 * Wrapper class for game sounds to track loading state and manage the HTMLAudioElement.
 * @class
 */
class GameAudio {
    /**
     * Creates an instance of GameAudio.
     * @param {string} src - The path to the audio file.
     */
    constructor(src) {
        /** @type {boolean} Indicates if the audio file is fully loaded and ready to play through. */
        this.load = false;
        /** @type {HTMLAudioElement} The actual audio object. */
        this.sound = new Audio(src);
        this.sound.preload = 'auto';

        this.sound.addEventListener('canplaythrough', () => {
            this.load = true;
        }, { once: true });
    }
}

/**
 * Central management hub for all game-related sounds.
 * Provides static methods to control global playback, volume, and state.
 * @class
 */
export class AudioHub {
    /** @type {number} Global volume level (0.0 to 1.0). */
    static VOLUME = 0.1;
    /** @type {boolean} Global flag to block or allow audio. */
    static BLOCK = false;

    // --- Character Sounds ---
    static PEPE_DAMAGE = new GameAudio('assets/sounds/character/characterDamage.mp3');
    static PEPE_DEAD = new GameAudio('assets/sounds/character/characterDead.wav');
    static PEPE_JUMP = new GameAudio('assets/sounds/character/characterJump.wav');
    static PEPE_RUN = new GameAudio('assets/sounds/character/characterRun.mp3');
    static PEPE_SNORING = new GameAudio('assets/sounds/character/characterSnoring.mp3');

    // --- Enemy Sounds ---
    static NORMALCHICK_DEAD = new GameAudio('assets/sounds/chicken/chickenDead.mp3');
    static LITTLECHICK_DEAD = new GameAudio('assets/sounds/chicken/chickenDead2.mp3');
    static BOSSCHICK_APPROACH = new GameAudio('assets/sounds/endboss/endbossApproach.wav');

    // --- Collectibles & Environment ---
    static BOTTLE_COLLECTED = new GameAudio('assets/sounds/collectibles/bottleCollectSound.wav');
    static COIN_COLLECTED = new GameAudio('assets/sounds/collectibles/collectSound.wav');
    static BREAK_BOTTLE = new GameAudio('assets/sounds/throwable/bottleBreak.mp3');

    // --- Game State Sounds ---
    static GAME_STARTED = new GameAudio('assets/sounds/game/gameStart.mp3');
    static GAME_WIN = new GameAudio('assets/sounds/WinLose/preview_PJALaNcT.mp3');
    static GAME_LOSE = new GameAudio('assets/sounds/WinLose/321910__jrc_yt__you-lose.mp3');
    static GAME_PLAY = new GameAudio('assets/sounds/WinLose/high-noon-(spaghetti-western-epic-trailer-music)-made-with-Voicemod.mp3');

    /**
     * Returns an array containing all defined GameAudio instances.
     * @type {GameAudio[]}
     * @readonly
     */
    static get allSounds() {
        return [
            this.PEPE_DAMAGE, this.PEPE_DEAD, this.PEPE_JUMP, this.PEPE_RUN,
            this.PEPE_SNORING, this.NORMALCHICK_DEAD, this.LITTLECHICK_DEAD,
            this.BOSSCHICK_APPROACH, this.BOTTLE_COLLECTED, this.COIN_COLLECTED,
            this.GAME_STARTED, this.BREAK_BOTTLE, this.GAME_WIN, this.GAME_LOSE,
            this.GAME_PLAY
        ];
    }

    /**
     * Initializes the volume for all registered sounds based on the static VOLUME property.
     * @function
     */
    static setInitialVolume() {
        this.allSounds.forEach(gameAudio => {
            if (gameAudio && gameAudio.sound) gameAudio.sound.volume = this.VOLUME;
        });
    }

    /**
    * Plays a specific GameAudio instance if audio is active.
    * Resets the playback position for non-looping sounds.
    * @param {Object} gameAudio - The GameAudio instance to be played.
    */
    static playOne(gameAudio) {
        if (!window.audioActive || !gameAudio || !gameAudio.sound) return;

        const GLOBAL_VOLUME = 0.05;

        gameAudio.sound.volume = GLOBAL_VOLUME;

        if (!gameAudio.sound.loop) {
            gameAudio.sound.currentTime = 0;
        }

        let playPromise = gameAudio.sound.play();
        if (playPromise !== undefined) {
            playPromise.catch(() => { });
        }
    }

    /**
     * Stops all sounds immediately and resets their playback position to the beginning.
     * @function
     */
    static stopAll() {
        this.allSounds.forEach(gameAudio => {
            if (gameAudio && gameAudio.sound) {
                gameAudio.sound.pause();
                gameAudio.sound.currentTime = 0;
            }
        });
    }
}

// Global binding for access in non-module scripts
window.AudioHub = AudioHub;