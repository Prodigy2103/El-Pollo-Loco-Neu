import { World } from "../models/world.class.js";
import { Keyboard } from "../models/keyboard.class.js";
import { AudioHub } from "../js/audio_hub.class.js";
import { IntervalHub } from "../js/intervalhub.class.js";
import { GameState } from "../models/game-state.class.js";

let world, canvas;
let keyboard = new Keyboard();
window.audioActive = false;
let isThemeAllowed = false;
let isToggling = false;

/**
 * UI elements used for screen management and interaction.
 * @type {Object<string, HTMLElement|null>}
 */
const UI = {
    start: document.getElementById("start-screen"),
    loading: document.getElementById("loading-screen"),
    end: document.getElementById("end-screen"),
    legal: document.getElementById("legal"),
    audioImg: document.getElementById("sound-btn-img"),
    wrapper: document.getElementById("wrapper")
};

Object.assign(window, { startGame, finalizeStart, toggleMute, restartGame, backToHome, showLegalNotice, closeLegalNotice, toggleFullscreen });

/**
 * Initiates the first step of the game start process.
 * Plays the start sound and transitions from the start screen to the loading screen.
 */
function startGame() {
    AudioHub.GAME_STARTED.sound.volume = 0.25;
    AudioHub.playOne(AudioHub.GAME_STARTED);
    toggleElement(UI.start, false);
    toggleElement(UI.loading, true, 'flex');
}

/**
 * Completes the start process after loading.
 * Initializes the game world, settings, and background music.
 */
function finalizeStart() {
    toggleElement(UI.loading, false);
    isThemeAllowed = true;
    loadSettings(); 
    initGame();
}

/**
 * Initializes the game world and sets up the canvas.
 * Stops existing intervals to ensure a clean start for the new world instance.
 */
function initGame() {
    canvas = document.getElementById('canvas');
    if (!canvas) return;
    IntervalHub.stopAllIntervals();
    handleBackgroundMusic();
    world = new World(canvas, keyboard, showEndscreen);
}

/**
 * Manages the background music loop and volume settings.
 * Only plays if audio is globally active.
 */
function handleBackgroundMusic() {
    if (window.audioActive && AudioHub.GAME_PLAY) {
        AudioHub.GAME_PLAY.sound.loop = true;
        AudioHub.GAME_PLAY.sound.volume = 0.05;
        AudioHub.playOne(AudioHub.GAME_PLAY);
    }
}

/**
 * Displays the end screen with the appropriate win or loss message.
 * Triggered by the World class when the game state reaches an end condition.
 * @param {'win'|'lose'} result - The final outcome of the game.
 */
function showEndscreen(result) {
    toggleElement(UI.end, true, 'flex');

    const img = document.getElementById("end-screen-img");
    if (img) {
        img.src = result === 'win' ?
            "assets/img/You won, you lost/You win B.png" :
            "assets/img/You won, you lost/You lost b.png";
    }

    AudioHub.playOne(result === 'win' ? AudioHub.GAME_WIN : AudioHub.GAME_LOSE);
}

/**
 * Utility function to show or hide DOM elements using CSS classes.
 * @param {HTMLElement} el - The element to toggle.
 * @param {boolean} show - Whether to show (true) or hide (false) the element.
 * @param {'block'|'flex'} [display='block'] - The display property to use when showing.
 */
function toggleElement(el, show, display = 'block') {
    if (!el) return;
    if (show) {
        el.classList.remove('d-none');
        el.classList.add(display === 'flex' ? 'd-flex' : 'd-block');
    } else {
        el.classList.add('d-none');
        el.classList.remove('d-flex', 'd-block');
    }
}

/**
 * Loads audio preferences from local storage and applies them.
 */
function loadSettings() {
    const saved = localStorage.getItem("audioRef");
    window.audioActive = saved !== null ? JSON.parse(saved) : false;
    applyAudioSettings();
}

/**
 * Toggles the global mute state and saves the preference.
 * Includes a small debounce to prevent rapid toggle spamming.
 */
function toggleMute() {
    if (isToggling) return;
    isToggling = true;
    window.audioActive = !window.audioActive;
    localStorage.setItem("audioRef", JSON.stringify(window.audioActive));
    applyAudioSettings();
    setTimeout(() => { isToggling = false; }, 100);
}

/**
 * Updates UI icons and audio playback based on the current global audio state.
 */
function applyAudioSettings() {
    if (UI.audioImg) {
        UI.audioImg.src = `assets/icons/icons8-sound-${window.audioActive ? 'on' : 'off'}-48.png`;
    }
    if (!window.audioActive) {
        AudioHub.stopAll();
    } else if (isThemeAllowed) {
        handleBackgroundMusic();
    }
}

/**
 * Resets the game state and reinits the game world for a new attempt.
 */
function restartGame() {
    toggleElement(UI.end, false);
    IntervalHub.stopAllIntervals();
    GameState.coinPercentage = 0;
    GameState.bottlePercentage = 0;
    world = null;
    setTimeout(() => initGame(), 100);
}

/**
 * Performs a hard reload to return to the landing page.
 */
function backToHome() {
    location.reload();
}

/** Shows the legal notice overlay. */
function showLegalNotice() { toggleElement(UI.legal, true, 'flex'); }

/** Hides the legal notice overlay. */
function closeLegalNotice() { toggleElement(UI.legal, false); }

/**
 * Toggles the wrapper element into browser fullscreen mode.
 */
function toggleFullscreen() {
    let container = UI.wrapper;
    if (!container) return;
    if (!document.fullscreenElement) {
        container.requestFullscreen().catch(err => console.error(err.message));
    } else {
        document.exitFullscreen();
    }
}

/**
 * Attaches event listeners to UI buttons and interaction elements.
 */
function bindEvents() {
    document.getElementById('fullscreen-btn')?.addEventListener('click', toggleFullscreen);
    document.getElementById('play-btn')?.addEventListener('click', startGame);
    document.getElementById('sound-btn')?.addEventListener('click', toggleMute);
    document.getElementById('loading-button')?.addEventListener('click', finalizeStart);
    setupMobileControls();
}

/**
 * Sets up touch events for on-screen mobile controls.
 * Maps touch actions to the virtual keyboard state.
 */
function setupMobileControls() {
    const controls = [
        { id: 'left-btn', key: 'LEFT' },
        { id: 'right-btn', key: 'RIGHT' },
        { id: 'jump-btn', key: 'SPACE' },
        { id: 'throw-btn', key: 'D' }
    ];
    controls.forEach(control => {
        const btn = document.getElementById(control.id);
        if (btn) {
            btn.addEventListener('touchstart', (e) => { e.preventDefault(); keyboard[control.key] = true; });
            btn.addEventListener('touchend', (e) => { e.preventDefault(); keyboard[control.key] = false; });
        }
    });
}

/** Initial entry point */
document.addEventListener('DOMContentLoaded', () => {
    initUI();
    bindEvents();
});