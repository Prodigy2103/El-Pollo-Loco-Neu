import { World } from "../models/world.class.js";
import { Keyboard } from "../models/keyboard.class.js";
import { AudioHub } from "../js/audio_hub.class.js";
import { IntervalHub } from "../js/intervalhub.class.js";
import { GameState } from "../models/game-state.class.js";

let world;
let canvas;
let keyboard = new Keyboard();
window.audioActive = false;
let isThemeAllowed = false;
let isToggling = false;

const UI = { start: null, loading: null, end: null, legal: null, audioImg: null, wrapper: null };

/**
 * Initializes and caches references to key DOM elements for the game UI.
 */
function initUIReferences() {
    UI.start = document.getElementById("start-screen");
    UI.loading = document.getElementById("loading-screen");
    UI.end = document.getElementById("end-screen");
    UI.legal = document.getElementById("legal");
    UI.audioImg = document.getElementById("sound-btn-img");
    UI.wrapper = document.getElementById("wrapper");
}

/**
 * Exposes core game functions to the global window object for HTML event access.
 */
Object.assign(window, { startGame, toggleMute, restartGame, backToHome, showLegalNotice, closeLegalNotice, toggleFullscreen, toggleElement });

/**
 * Resets all global game states, stops active intervals, and clears the world instance.
 */
function resetGameLogic() {
    IntervalHub.stopAllIntervals();
    AudioHub.stopAll();
    GameState.coinPercentage = 0;
    GameState.bottlePercentage = 0;
    world = null;
}

/**
 * Sets up the canvas, resets game state, and initializes a new World instance.
 */
function initGame() {
    canvas = document.getElementById('canvas');
    if (!canvas) return;
    resetGameLogic();
    handleBackgroundMusic();
    world = new World(canvas, keyboard, showEndscreen);
}

/**
 * Manages the playback of the main background theme based on audio settings.
 */
function handleBackgroundMusic() {
    if (window.audioActive && AudioHub.GAME_PLAY) {
        AudioHub.GAME_PLAY.sound.loop = true;
        AudioHub.playOne(AudioHub.GAME_PLAY, 0.05);
    }
}

/**
 * Orchestrates the start sequence, including UI transitions and delayed game initialization.
 */
function startGame() {
    AudioHub.playOne(AudioHub.GAME_STARTED, 0.05);
    toggleElement(UI.start, false);
    toggleElement(UI.loading, true, 'flex');
    isThemeAllowed = true;

    setTimeout(() => {
        toggleElement(UI.loading, false);
        loadSettings();
        initGame();
    }, 3500);
}

/**
 * Displays the game over screen with a result-specific image and sound.
 * @param {string} result - The outcome of the game ('win' or 'lose').
 */
function showEndscreen(result) {
    toggleElement(UI.end, true, 'flex');
    const img = document.getElementById("end-screen-img");
    if (img) {
        img.src = result === 'win' ?
            "assets/img/You won, you lost/You win B.png" :
            "assets/img/You won, you lost/You lost b.png";
    }

    AudioHub.stopAll();
    const endSound = result === 'win' ? AudioHub.GAME_WIN : AudioHub.GAME_LOSE;
    AudioHub.playOne(endSound, 0.05);
}

/**
 * Helper function to toggle visibility and display styles of DOM elements.
 * @param {HTMLElement} el - The element to toggle.
 * @param {boolean} show - Whether to show or hide the element.
 * @param {string} [display='block'] - The CSS display value to use when visible.
 */
function toggleElement(el, show, display = 'block') {
    if (!el) return;
    el.classList.toggle('d-none', !show);
    if (show) {
        el.classList.add(display === 'flex' ? 'd-flex' : 'd-block');
    } else {
        el.classList.remove('d-flex', 'd-block');
    }
}

/**
 * Loads audio settings from local storage and applies them.
 */
function loadSettings() {
    const saved = localStorage.getItem("audioRef");
    window.audioActive = saved !== null ? JSON.parse(saved) : false;
    applyAudioSettings();
}

/**
 * Toggles the global audio state and persists the choice in local storage.
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
 * Updates the UI icons and audio playback based on the current audio state.
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
 * Restarts the game from the end screen.
 */
function restartGame() {
    toggleElement(UI.end, false);
    setTimeout(initGame, 100);
}

/**
 * Returns the user to the main menu and resets the game state.
 */
function backToHome() {
    resetGameLogic();
    toggleElement(UI.end, false);
    toggleElement(UI.start, true, 'flex');
    isThemeAllowed = false;
    loadSettings();
}

/** Shows the legal notice overlay. */
function showLegalNotice() { toggleElement(UI.legal, true, 'flex'); }
/** Hides the legal notice overlay. */
function closeLegalNotice() { toggleElement(UI.legal, false); }

/**
 * Toggles the browser's fullscreen mode for the game wrapper.
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
 * Binds click events to the main menu and control buttons.
 */
function bindEvents() {
    document.getElementById('fullscreen-btn')?.addEventListener('click', toggleFullscreen);
    document.getElementById('play-btn')?.addEventListener('click', startGame);
    document.getElementById('sound-btn')?.addEventListener('click', toggleMute);
    setupMobileControls();
}

/**
 * Sets up touch event listeners for mobile navigation and actions.
 */
function setupMobileControls() {
    const controls = [{ id: 'left-btn', key: 'LEFT' }, { id: 'right-btn', key: 'RIGHT' },
    { id: 'jump-btn', key: 'SPACE' }, { id: 'throw-btn', key: 'D' }];
    controls.forEach(control => {
        const btn = document.getElementById(control.id);
        if (btn) {
            ['touchstart', 'touchend'].forEach(type => {
                btn.addEventListener(type, (e) => {
                    e.preventDefault();
                    keyboard[control.key] = (type === 'touchstart');
                });
            });
        }
    });
}

/**
 * Initial entry point after the DOM is fully loaded.
 */
document.addEventListener('DOMContentLoaded', () => {
    initUIReferences();
    bindEvents();
    loadSettings();
});