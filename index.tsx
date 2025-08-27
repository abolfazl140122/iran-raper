/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

// --- Type Definitions ---
interface LevelData {
  level: number;
  question: string;
  options: string[];
  answer: string;
}

interface PlayerProgress {
  unlockedLevel: number;
}

document.addEventListener('DOMContentLoaded', async () => {
  // --- Constants ---
  const LEVEL_TIME = 20; // seconds

  // --- Element Cache ---
  const loadingScreen = document.getElementById('loading-screen');
  const progressBar = document.getElementById('progress-bar');
  const statusText = document.getElementById('status-text');
  const loaderContainer = document.getElementById('loader-container');
  const backgroundAnimation = document.querySelector('.background-animation') as HTMLElement;
  
  const mainContent = document.getElementById('main-content');
  const screens = {
    mainMenu: document.getElementById('main-menu'),
    chapterSelect: document.getElementById('chapter-select-screen'),
    levelSelect: document.getElementById('level-select-screen'),
    game: document.getElementById('game-screen'),
  };

  const startGameBtn = document.getElementById('start-game-btn');
  const settingsBtn = document.getElementById('settings-btn');
  const backToMainBtn = document.getElementById('back-to-main-btn');
  const chapterGrid = document.getElementById('chapter-grid');

  const levelSelectTitle = document.getElementById('level-select-title');
  const levelGrid = document.getElementById('level-grid');
  const backToChaptersBtn = document.getElementById('back-to-chapters-btn');

  const gameScreen = document.getElementById('game-screen');
  const timerBarProgress = document.getElementById('timer-bar-progress');
  const questionTitle = document.getElementById('question-title');
  const questionText = document.getElementById('question-text');
  const answersContainer = document.getElementById('answers-container');
  const backToMapInGameBtn = document.getElementById('back-to-map-ingame-btn');


  const feedbackModal = document.getElementById('feedback-modal');
  const modalTitle = document.getElementById('modal-title');
  const modalMessage = document.getElementById('modal-message');
  const modalNextBtn = document.getElementById('modal-next-btn');
  const modalRetryBtn = document.getElementById('modal-retry-btn');
  const modalMapBtn = document.getElementById('modal-map-btn');


  // --- Type Guard for Elements ---
  if (!loadingScreen || !progressBar || !statusText || !mainContent || !loaderContainer || !backgroundAnimation ||
      !screens.mainMenu || !screens.chapterSelect || !screens.levelSelect || !screens.game || !startGameBtn || 
      !settingsBtn || !backToMainBtn || !chapterGrid || !levelSelectTitle || !levelGrid || !backToChaptersBtn ||
      !gameScreen || !timerBarProgress || !questionTitle || !questionText || !answersContainer || !backToMapInGameBtn ||
      !feedbackModal || !modalTitle || !modalMessage || !modalNextBtn || !modalRetryBtn || !modalMapBtn) {
    console.error('Essential UI elements not found!');
    return;
  }

  // --- Game State ---
  let loadingInterval: ReturnType<typeof setInterval> | null = null;
  let timerInterval: ReturnType<typeof setInterval> | null = null;
  let gameData: LevelData[] = [];
  let playerProgress: PlayerProgress = { unlockedLevel: 1 };
  let currentLevel = 0;

  // --- Game Data & Progress ---
  async function loadGameData() {
    try {
      const response = await fetch('yas.json');
      if (!response.ok) throw new Error('Network response was not ok');
      gameData = await response.json();
    } catch (error) {
      console.error('Failed to load game data:', error);
      statusText.textContent = 'خطا در بارگذاری اطلاعات بازی.';
      statusText.classList.add('error');
    }
  }

  function saveProgress() {
    localStorage.setItem('iranRapProgress', JSON.stringify(playerProgress));
  }

  function loadProgress() {
    const savedProgress = localStorage.getItem('iranRapProgress');
    if (savedProgress) {
      playerProgress = JSON.parse(savedProgress);
    }
  }

  // --- Screen Navigation ---
  function navigateTo(screenName: keyof typeof screens) {
    clearTimer(); // Always clear timer on navigation
    Object.values(screens).forEach(screen => screen?.classList.remove('is-visible'));
    Object.values(screens).forEach(screen => screen?.classList.add('hidden'));
    
    const targetScreen = screens[screenName];
    if (targetScreen) {
      targetScreen.classList.remove('hidden');
      setTimeout(() => targetScreen.classList.add('is-visible'), 10);
    }
  }

  // --- Loading Screen Logic ---
  function startLoading() {
    if (loadingInterval) return;
    statusText.textContent = 'در حال بارگذاری...';
    statusText.classList.remove('error');
    loaderContainer!.style.display = 'block';
    progressBar.style.width = '0%';
    
    let progress = 0;
    loadingInterval = setInterval(() => {
      progress += 1;
      progressBar.style.width = `${progress}%`;
      statusText.textContent = `در حال بارگذاری... ${progress}%`;
      if (progress >= 100) {
        if(loadingInterval) clearInterval(loadingInterval);
        loadingInterval = null;
        setTimeout(finishLoading, 500);
      }
    }, 40);
  }

  function finishLoading() {
    loadingScreen.classList.add('fade-out');
    loadingScreen.addEventListener('transitionend', () => {
      mainContent.classList.remove('hidden');
      navigateTo('mainMenu');
    }, { once: true });
  }
  
  async function initializeApp() {
    await loadGameData();
    startLoading();
  }

  // --- Timer Logic ---
  function clearTimer() {
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }
  }

  function startTimer() {
    clearTimer();
    let timeLeft = LEVEL_TIME;

    // Force reflow to ensure CSS transition applies after the reset in startLevel
    void timerBarProgress.offsetWidth;

    // Set up CSS transition to handle the animation
    timerBarProgress.style.transition = `width ${LEVEL_TIME}s linear, background 0.5s`;
    timerBarProgress.style.width = '0%';
    
    // Interval now only checks for low time and end time
    timerInterval = setInterval(() => {
      timeLeft--;
      if (timeLeft <= 5) {
        timerBarProgress.classList.add('low-time');
      }
      if (timeLeft <= 0) {
        handleTimeUp(); // This will clear the interval
      }
    }, 1000);
  }

  function handleTimeUp() {
    clearTimer();
    answersContainer.querySelectorAll('.answer-button').forEach(btn => btn.classList.add('disabled'));
    showFeedbackModal(false, true); // isCorrect = false, isTimeUp = true
  }

  // --- Game Logic ---
  function populateLevelGrid(chapterTitle: string) {
    levelGrid.innerHTML = '';
    levelSelectTitle.textContent = chapterTitle;

    for (let i = 1; i <= gameData.length; i++) {
        const levelButton = document.createElement('div');
        levelButton.classList.add('level-button');
        levelButton.dataset.level = i.toString();

        if (i < playerProgress.unlockedLevel) {
            levelButton.classList.add('completed');
            levelButton.textContent = `✔`;
        } else if (i === playerProgress.unlockedLevel) {
            levelButton.classList.add('unlocked');
            levelButton.textContent = i.toString();
        } else {
            levelButton.classList.add('locked');
        }
        levelButton.style.animationDelay = `${0.2 + i * 0.025}s`;
        levelGrid.appendChild(levelButton);
    }
  }

  function selectChapter(chapterElement: HTMLElement) {
    if (chapterElement.classList.contains('disabled')) return;
    const chapterNumber = chapterElement.dataset.chapter;
    const chapterTitle = chapterElement.dataset.title || `فصل ${chapterNumber}`;

    if (chapterNumber === '1') {
        populateLevelGrid(chapterTitle);
        navigateTo('levelSelect');
    } else {
        alert(`فصل ${chapterNumber} به زودی عرضه می‌شود!`);
    }
  }

  function startLevel(levelNumber: number) {
    const levelData = gameData.find(l => l.level === levelNumber);
    if (!levelData) {
      console.error(`Level ${levelNumber} data not found!`);
      return;
    }
    
    // Reset timer visual before starting
    timerBarProgress.style.transition = 'none';
    timerBarProgress.style.width = '100%';
    timerBarProgress.classList.remove('low-time');
    
    currentLevel = levelNumber;
    questionTitle.textContent = `مرحله ${levelNumber}`;
    questionText.textContent = levelData.question;
    answersContainer.innerHTML = '';

    levelData.options.forEach(option => {
      const button = document.createElement('button');
      button.classList.add('answer-button');
      button.textContent = option;
      button.onclick = () => handleAnswer(button, option, levelData.answer);
      answersContainer.appendChild(button);
    });
    
    navigateTo('game');
    setTimeout(startTimer, 500); // Start timer after screen transition animation
  }
  
  function handleAnswer(button: HTMLButtonElement, selectedAnswer: string, correctAnswer: string) {
    clearTimer();
    const allButtons = answersContainer.querySelectorAll('.answer-button');
    allButtons.forEach(btn => btn.classList.add('disabled'));

    if (selectedAnswer === correctAnswer) {
      button.classList.add('correct');
      if (currentLevel === playerProgress.unlockedLevel && currentLevel < gameData.length) {
        playerProgress.unlockedLevel++;
        saveProgress();
      }
      showFeedbackModal(true, false);
    } else {
      button.classList.add('incorrect');
      allButtons.forEach(btn => {
        if(btn.textContent === correctAnswer) {
          btn.classList.add('correct');
        }
      });
      showFeedbackModal(false, false);
    }
  }
  
  function showFeedbackModal(isCorrect: boolean, isTimeUp: boolean) {
    if (isTimeUp) {
      modalTitle.textContent = "وقت تموم شد!";
      modalTitle.className = 'incorrect';
      modalMessage.textContent = "سرعت عمل بیشتری لازم داری!";
      modalRetryBtn.classList.remove('hidden');
      modalNextBtn.classList.add('hidden');
    } else if (isCorrect) {
      modalTitle.textContent = "عالی بود!";
      modalTitle.className = 'correct';
      modalMessage.textContent = "به مرحله بعد راه پیدا کردی.";
      modalRetryBtn.classList.add('hidden');
      modalNextBtn.classList.remove('hidden');
      // Hide next button if it's the last level
      if (currentLevel >= gameData.length) {
        modalNextBtn.classList.add('hidden');
        modalMessage.textContent = "تو این فصل رو تموم کردی! آفرین.";
      }
    } else {
      modalTitle.textContent = "اشتباه بود!";
      modalTitle.className = 'incorrect';
      modalMessage.textContent = "دوباره تلاش کن، مطمئنم میتونی.";
      modalRetryBtn.classList.remove('hidden');
      modalNextBtn.classList.add('hidden');
    }
    feedbackModal.classList.remove('hidden');
  }

  function hideFeedbackModal() {
    feedbackModal.classList.add('hidden');
  }

  function handleParallax(event: MouseEvent) {
      const { clientX, clientY } = event;
      const { innerWidth, innerHeight } = window;
      const moveX = (clientX - innerWidth / 2) / 40;
      const moveY = (clientY - innerHeight / 2) / 40;
      backgroundAnimation.style.transform = `translate(${moveX}px, ${moveY}px)`;
  }

  // --- Event Listeners ---
  startGameBtn.addEventListener('click', () => navigateTo('chapterSelect'));
  backToMainBtn.addEventListener('click', () => navigateTo('mainMenu'));
  backToChaptersBtn.addEventListener('click', () => navigateTo('chapterSelect'));
  backToMapInGameBtn.addEventListener('click', () => {
    loadProgress(); // Reload progress to ensure map is up-to-date
    const chapterTitle = levelSelectTitle.textContent || "یاس";
    populateLevelGrid(chapterTitle);
    navigateTo('levelSelect');
  });

  
  settingsBtn.addEventListener('click', () => alert('صفحه تنظیمات در دست ساخت است!'));
  
  chapterGrid.addEventListener('click', (event) => {
    const chapterCard = (event.target as HTMLElement).closest('.chapter-card') as HTMLElement;
    if (chapterCard) selectChapter(chapterCard);
  });

  levelGrid.addEventListener('click', (event) => {
    const levelButton = (event.target as HTMLElement).closest('.level-button') as HTMLElement;
    if (levelButton && !levelButton.classList.contains('locked')) {
        const levelNumber = parseInt(levelButton.dataset.level || '0');
        startLevel(levelNumber);
    }
  });

  modalNextBtn.addEventListener('click', () => {
    hideFeedbackModal();
    startLevel(currentLevel + 1);
  });

  modalRetryBtn.addEventListener('click', () => {
    hideFeedbackModal();
    startLevel(currentLevel);
  });
  
  modalMapBtn.addEventListener('click', () => {
    hideFeedbackModal();
    loadProgress(); // Reload progress to ensure map is up-to-date
    const chapterTitle = levelSelectTitle.textContent || "یاس";
    populateLevelGrid(chapterTitle); // Refresh grid to show new state
    navigateTo('levelSelect');
  });
  
  window.addEventListener('mousemove', handleParallax);

  // --- Initialisation ---
  loadProgress();
  initializeApp();
});