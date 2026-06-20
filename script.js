// Game Configuration
//const WORD_LIST = ["APPLE", "BEACH", "CHIEF", "DRIVE", "EAGLE", "FLAME", "GUIDE", "HOUSE", "INDEX", "SMILE"];
let targetWord = "";
let currentGuess = "";
let attempts = 0;
let maxAttempts = 6;
let isGameOver = false;
let username = "";
let timerInterval = null;
let timeLeft = 90; // 1 minute 30 seconds

// DOM Elements
const homeScreen = document.getElementById('home-screen');
const gameScreen = document.getElementById('game-screen');
const usernameInput = document.getElementById('username');
const playBtn = document.getElementById('play-btn');
const grid = document.getElementById('wordle-grid');
const keyboard = document.getElementById('keyboard');
const statusText = document.getElementById('status-text');
const resultBox = document.getElementById('result-box');
const resultText = document.getElementById('result-text');
const resetBtn = document.getElementById('reset-btn');
const logoutBtn = document.getElementById('logout-btn');
const helpBtn = document.getElementById('help-btn');
const helpModal = document.getElementById('help-modal');
const closeModal = document.querySelector('.close-modal');

// Keyboard Layout
const keyboardLayout = [
    ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"],
    ["A", "S", "D", "F", "G", "H", "J", "K", "L"],
    ["Enter", "Z", "X", "C", "V", "B", "N", "M", "⌫"]
];

// Core Init
// Core Init - Fetches an unlimited unique 5-letter word dynamically
async function initGame() {
    currentGuess = "";
    attempts = 0;
    isGameOver = false;
    
    if (statusText) {
        statusText.style.display = "block";
        statusText.innerText = "Loading word..."; // Inform the user
    }
    if (resultBox) {
        resultBox.style.display = "none";
    }

    // Fetch a random 5-letter word from the API
    try {
        const response = await fetch('https://random-word-api.herokuapp.com/word?length=5');
        const data = await response.json();
        
        // The API returns an array containing one word, e.g., ["ghost"]
        targetWord = data[0].toUpperCase(); 
        console.log("Target Word (Cheat Sheet):", targetWord); // Check your dev console if needed
        
        if (statusText) {
            statusText.innerText = "Make your first guess!";
        }
        
        // Start game components only after the word arrives successfully
        startTimer();
        buildGrid();
        buildKeyboard();

    } catch (error) {
        console.error("Failed to fetch word, using fallback:", error);
        // Fallback array if user loses internet connection mid-game
        const fallbacks = ["APPLE", "BEACH", "CHIEF", "DRIVE", "EAGLE"];
        targetWord = fallbacks[Math.floor(Math.random() * fallbacks.length)];
        
        if (statusText) statusText.innerText = "Make your first guess!";
        startTimer();
        buildGrid();
        buildKeyboard();
    }
}

// ==========================================
// BULLETPROOF TIMER OPERATIONS
// ==========================================
function startTimer() {
    // 1. Force clear any lingering loops or memory intervals first
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
    
    // 2. Set fresh duration parameters
    timeLeft = 90; 
    
    // 3. Force an immediate visual print before the loop sets in
    updateTimerDisplay();

    // 4. Fire the absolute interval engine loop
    timerInterval = setInterval(function() {
        // Stop the loop completely if the game flag switches off
        if (isGameOver || (gameScreen && gameScreen.style.display !== "block")) {
            clearInterval(timerInterval);
            return;
        }

        timeLeft--;
        updateTimerDisplay();

        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            handleTimeoutLoss();
        }
    }, 1000);
}

function updateTimerDisplay() {
    // Directly seek out the node from the active DOM tree pool
    const liveTimerBox = document.getElementById('timer-display');
    if (!liveTimerBox) return; 

    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    
    // Smooth padding formatting logic (transforms 9 seconds to '09')
    const paddedSeconds = seconds < 10 ? '0' + seconds : seconds;
    
    // Directly override the element contents
    liveTimerBox.innerText = `Time left: 0${minutes}:${paddedSeconds}`;
}

function handleTimeoutLoss() {
    isGameOver = true;
    clearInterval(timerInterval); // Extra defensive stop
    
    if (statusText) statusText.style.display = "none";
    if (resultBox) resultBox.style.display = "block";
    if (resultText) {
        resultText.innerHTML = `<span style="color:#e74c3c;">${username}</span> ran out of time! ⏱️ The word was <strong>${targetWord}</strong>.`;
    }
}

function buildGrid() {
    if (!grid) return;
    grid.innerHTML = "";
    for (let i = 0; i < maxAttempts; i++) {
        const row = document.createElement('div');
        row.className = 'grid-row';
        for (let j = 0; j < 5; j++) {
            const tile = document.createElement('div');
            tile.className = 'tile';
            row.appendChild(tile);
        }
        grid.appendChild(row);
    }
}

function buildKeyboard() {
    if (!keyboard) return;
    keyboard.innerHTML = "";
    keyboardLayout.forEach(row => {
        const rowDiv = document.createElement('div');
        rowDiv.className = 'keyboard-row';
        row.forEach(key => {
            const button = document.createElement('button');
            button.className = 'key';
            button.innerText = key;
            button.setAttribute('data-key', key);
            if (key === 'Enter' || key === '⌫') {
                button.classList.add('wide');
            }
            button.addEventListener('click', () => handleKeyPress(key));
            rowDiv.appendChild(button);
        });
        keyboard.appendChild(rowDiv);
    });
}

// Handle Inputs
function handleKeyPress(key) {
    if (isGameOver) return;

    if (key === 'Backspace' || key === '⌫') {
        if (currentGuess.length > 0) {
            currentGuess = currentGuess.slice(0, -1);
            updateGridDOM();
        }
    } else if (key === 'Enter') {
        if (currentGuess.length === 5) {
            submitGuess();
        } else {
            if (statusText) statusText.innerText = "Word must be 5 letters!";
        }
    } else if (/^[A-Z]$/i.test(key)) {
        if (currentGuess.length < 5) {
            currentGuess += key.toUpperCase();
            updateGridDOM();
        }
    }
}

function updateGridDOM() {
    if (!grid) return;
    const rows = grid.querySelectorAll('.grid-row');
    if (!rows || attempts >= rows.length || !rows[attempts]) return;
    
    const currentRow = rows[attempts];
    const tiles = currentRow.querySelectorAll('.tile');
    
    for (let i = 0; i < 5; i++) {
        if (tiles[i]) {
            tiles[i].innerText = currentGuess[i] || "";
        }
    }
}

// Validates if the guess is a real word before evaluating rules
// Validates if the guess is a real word before evaluating rules
async function submitGuess() {
    if (!grid) return;
    const rows = grid.querySelectorAll('.grid-row');
    if (!rows || !rows[attempts]) return;

    const tiles = rows[attempts].querySelectorAll('.tile');
    const guess = currentGuess;
    
    // 1. Temporarily change status text to show it's validating
    if (statusText) statusText.innerText = "Checking dictionary...";

    try {
        // Fetch validation from the free Free Dictionary API
        const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${guess.toLowerCase()}`);
        
        // If the API returns a 404 status code, it means the word is not in the dictionary
        if (!response.ok) {
            if (statusText) statusText.innerText = "Not a valid English word! ❌";
            return; // STOP execution here so the user doesn't lose a turn
        }
    } catch (error) {
        console.error("Dictionary API error, bypassing check for safety:", error);
        // If the dictionary API goes down, we gracefully let the guess pass through
    }

    // 2. Clear out status since the word is verified valid
    if (statusText) statusText.innerText = "";

    let targetCheck = targetWord;
    let rowMatches = Array(5).fill('absent');

    // Pass 1: Find Greens (Correct spot)
    for (let i = 0; i < 5; i++) {
        if (guess[i] === targetWord[i]) {
            rowMatches[i] = 'correct';
            targetCheck = targetCheck.replace(guess[i], '_');
        }
    }

    // Pass 2: Find Yellows (Wrong spot)
    for (let i = 0; i < 5; i++) {
        if (rowMatches[i] !== 'correct' && targetCheck.includes(guess[i])) {
            rowMatches[i] = 'present';
            targetCheck = targetCheck.replace(guess[i], '_');
        }
    }

    // Apply styling updates to Grid & Keyboards
    for (let i = 0; i < 5; i++) {
        if (tiles[i]) tiles[i].classList.add(rowMatches[i]);
        updateKeyboardKey(guess[i], rowMatches[i]);
    }

    // Check Win condition
    if (guess === targetWord) {
        endGame(true);
        return;
    }

    attempts++;
    currentGuess = "";

    if (attempts >= maxAttempts) {
        endGame(false);
    } else {
        if (statusText) statusText.innerText = `Guess count: ${attempts}/6`;
    }
}

function updateKeyboardKey(letter, status) {
    if (!keyboard) return;
    const keyBtn = keyboard.querySelector(`[data-key="${letter}"]`);
    if (!keyBtn) return;

    if (status === 'correct') {
        keyBtn.className = 'key correct';
    } else if (status === 'present' && !keyBtn.classList.contains('correct')) {
        keyBtn.className = 'key present';
    } else if (status === 'absent' && !keyBtn.classList.contains('correct') && !keyBtn.classList.contains('present')) {
        keyBtn.className = 'key absent';
    }
}

function endGame(won) {
    clearInterval(timerInterval);
    isGameOver = true;
    if (statusText) statusText.style.display = "none";
    if (resultBox) resultBox.style.display = "block";

    if (resultText) {
        if (won) {
            resultText.innerHTML = `<span style="color:#2ecc71;">${username}</span> found the right word! 🎉`;
        } else {
            resultText.innerHTML = `<span style="color:#e74c3c;">${username}</span> lost! The word was <strong>${targetWord}</strong>.`;
        }
    }
}

// Navigation Flows
if (playBtn) {
    playBtn.addEventListener('click', () => {
        const enteredName = usernameInput ? usernameInput.value.trim() : "";
        if (!enteredName) {
            alert("Please enter a username to proceed!");
            return;
        }
        username = enteredName;
        if (homeScreen) homeScreen.style.display = "none";
        if (gameScreen) gameScreen.style.display = "block";
        initGame(); // Triggers the async API request pipeline
    });
}

if (resetBtn) { 
    resetBtn.addEventListener('click', () => initGame()); 
}

if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
        clearInterval(timerInterval);
        if (usernameInput) usernameInput.value = "";
        if (gameScreen) gameScreen.style.display = "none";
        if (homeScreen) homeScreen.style.display = "flex";
    });
}

// Global Event Keyboard Listeners
window.addEventListener('keydown', (e) => {
    if (gameScreen && gameScreen.style.display === "block") {
        handleKeyPress(e.key);
    }
});

// Help Modal Controls
if (helpBtn && helpModal) { helpBtn.addEventListener('click', () => helpModal.style.display = 'flex'); }
if (closeModal && helpModal) { closeModal.addEventListener('click', () => helpModal.style.display = 'none'); }
window.addEventListener('click', (e) => { if (helpModal && e.target === helpModal) helpModal.style.display = 'none'; });