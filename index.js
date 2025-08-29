
/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

document.addEventListener('DOMContentLoaded', async () => {
  // --- Constants ---
  const LEVEL_TIME = 20; // seconds
  const GENERATIONS = {
    '1': {
        name: 'نسل ۱',
        rappers: {
            'yas': { name: 'یاس', source: 'yas.json' },
            'pishro': { name: 'پیشرو', source: 'pishro.json' },
            'hichkas': { name: 'هیچکس', source: 'hichkas.json' },
            'bahram': { name: 'بهرام', source: 'bahram.json' },
            'hossein': { name: 'حصین', source: 'hossein.json' },
        }
    },
    '2': { name: 'نسل ۲', rappers: {} }, // Will be disabled
    '3': { name: 'نسل ۳', rappers: {} }, // Will be disabled
    '4': { name: 'نسل ۴', rappers: {} }, // Will be disabled
    '5': { name: 'نسل ۵', rappers: {} }, // Will be disabled
  };


  // --- Element Cache ---
  const loadingScreen = document.getElementById('loading-screen');
  const progressBar = document.getElementById('progress-bar');
  const statusText = document.getElementById('status-text');
  const loaderContainer = document.getElementById('loader-container');
  
  const mainContent = document.getElementById('main-content');
  const screens = {
    mainMenu: document.getElementById('main-menu'),
    generationSelect: document.getElementById('generation-select-screen'),
    levelSelect: document.getElementById('level-select-screen'),
    game: document.getElementById('game-screen'),
  };

  const nameEntryContainer = document.getElementById('name-entry-container');
  const playerNameInput = document.getElementById('player-name-input');
  const continueBtn = document.getElementById('continue-btn');
  const welcomeContainer = document.getElementById('welcome-container');
  const welcomeMessage = document.getElementById('welcome-message');
  const mainMenuButtons = document.getElementById('main-menu-buttons');
  const changeNameBtn = document.getElementById('change-name-btn');

  const startGameBtn = document.getElementById('start-game-btn');
  const settingsBtn = document.getElementById('settings-btn');
  const backToMainBtn = document.getElementById('back-to-main-btn');
  const generationGrid = document.getElementById('generation-grid');
  
  const levelSelectTitle = document.getElementById('level-select-title');
  const levelProgressContainer = document.getElementById('level-progress-container');
  const levelProgressText = document.getElementById('level-progress-text');
  const levelProgressBar = document.getElementById('level-progress-bar');
  const levelGrid = document.getElementById('level-grid');
  const backToGenerationsBtn = document.getElementById('back-to-generations-btn');

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


  // --- Element Check ---
  if (!loadingScreen || !progressBar || !statusText || !mainContent || !loaderContainer ||
      !screens.mainMenu || !screens.generationSelect || !screens.levelSelect || !screens.game || 
      !startGameBtn || !settingsBtn || !backToMainBtn || !generationGrid || !levelSelectTitle || !levelGrid || !backToGenerationsBtn ||
      !levelProgressContainer || !levelProgressText || !levelProgressBar ||
      !gameScreen || !timerBarProgress || !questionTitle || !questionText || !answersContainer || !backToMapInGameBtn ||
      !feedbackModal || !modalTitle || !modalMessage || !modalNextBtn || !modalRetryBtn || !modalMapBtn ||
      !nameEntryContainer || !playerNameInput || !continueBtn || !welcomeContainer || !welcomeMessage || !mainMenuButtons || !changeNameBtn
      ) {
    console.error('Essential UI elements not found!');
    return;
  }

  // --- Game State ---
  let loadingInterval = null;
  let timerInterval = null;
  let gameData = [];
  let playerProgress = { generations: {} };
  let currentLevel = 0;
  let currentGenerationId = '';
  let currentGenerationInfo = null;
  let currentQuestion = null;


  // --- Game Data & Progress ---
  function saveProgress() {
    localStorage.setItem('iranRapProgress', JSON.stringify(playerProgress));
  }

  function loadProgress() {
      const savedProgress = localStorage.getItem('iranRapProgress');
      if (savedProgress) {
          let progress = JSON.parse(savedProgress);

          // Migration from old per-rapper progress to new per-generation progress
          if (progress.rappers && !progress.generations) {
              const newProgress = { playerName: progress.playerName, generations: {} };
              
              // Aggregate progress for Generation 1
              const gen1Rappers = Object.keys(GENERATIONS['1'].rappers);
              let completedLevels = 0;
              let completedQuestions = [];

              for (const rapperId of gen1Rappers) {
                  if (progress.rappers[rapperId]) {
                      completedLevels += progress.rappers[rapperId].completedLevels || 0;
                      if (Array.isArray(progress.rappers[rapperId].completedQuestions)) {
                          completedQuestions = completedQuestions.concat(progress.rappers[rapperId].completedQuestions);
                      }
                  }
              }
              
              newProgress.generations['1'] = {
                  completedLevels: completedLevels,
                  completedQuestions: [...new Set(completedQuestions)] // Remove duplicates
              };

              progress = newProgress;
              localStorage.setItem('iranRapProgress', JSON.stringify(progress)); // Save in new format
          }

          playerProgress = progress;
          if (!playerProgress.generations) {
              playerProgress.generations = {};
          }
      } else {
          playerProgress = { generations: {} };
      }
  }

  // --- Main Menu Setup ---
  function setupMainMenu() {
    if (playerProgress.playerName) {
      welcomeMessage.innerHTML = `خوش آمدی، <span>${playerProgress.playerName}</span>!`;
      nameEntryContainer.classList.add('hidden');
      welcomeContainer.classList.remove('hidden');
      mainMenuButtons.classList.remove('hidden');
    } else {
      nameEntryContainer.classList.remove('hidden');
      welcomeContainer.classList.add('hidden');
      mainMenuButtons.classList.add('hidden');
      playerNameInput.focus();
    }
  }

  // --- Screen Navigation ---
  function navigateTo(screenName) {
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
  function showOfflineMessage() {
    if (loadingInterval) {
        clearInterval(loadingInterval);
        loadingInterval = null;
    }
    statusText.textContent = 'اتصال به اینترنت برقرار نیست. لطفا وصل شوید و دوباره تلاش کنید.';
    statusText.classList.add('error');
    loaderContainer.style.display = 'none';
  }

  function startLoading() {
    if (loadingInterval) return;
    statusText.textContent = 'در حال بارگذاری...';
    statusText.classList.remove('error');
    loaderContainer.style.display = 'block';
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
    if (navigator.onLine) {
      startLoading();
    } else {
      showOfflineMessage();
    }
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

    void timerBarProgress.offsetWidth;

    timerBarProgress.style.transition = `width ${LEVEL_TIME}s linear, background 0.5s`;
    timerBarProgress.style.width = '0%';
    
    timerInterval = setInterval(() => {
      timeLeft--;
      if (timeLeft <= 5) {
        timerBarProgress.classList.add('low-time');
      }
      if (timeLeft <= 0) {
        handleTimeUp();
      }
    }, 1000);
  }

  function handleTimeUp() {
    clearTimer();
    answersContainer.querySelectorAll('.answer-button').forEach(btn => btn.classList.add('disabled'));
    showFeedbackModal(false, true); // isCorrect = false, isTimeUp = true
  }

  // --- Game Logic ---
  function updateLevelProgressDisplay(generationId, totalLevels) {
    const generationProgress = playerProgress.generations[generationId] || { completedLevels: 0 };
    const completedLevels = generationProgress.completedLevels;

    if (totalLevels > 0) {
        const percentage = (completedLevels / totalLevels) * 100;
        levelProgressBar.style.width = `${percentage}%`;

        if (completedLevels >= totalLevels) {
             levelProgressText.textContent = `!شما این بخش را تمام کرده‌اید (${totalLevels} / ${totalLevels})`;
        } else {
            const currentLevelForDisplay = completedLevels + 1;
            levelProgressText.textContent = `مرحله ${currentLevelForDisplay} از ${totalLevels}`;
        }
    } else {
        levelProgressText.textContent = `بخشی یافت نشد`;
        levelProgressBar.style.width = `0%`;
    }
  }

  function populateLevelGrid(generationId, totalLevels) {
    levelGrid.innerHTML = '';
    const generationInfo = GENERATIONS[generationId];
    levelSelectTitle.textContent = generationInfo.name;
    updateLevelProgressDisplay(generationId, totalLevels);
    
    const generationProgress = playerProgress.generations[generationId] || { completedLevels: 0 };
    const unlockedLevel = generationProgress.completedLevels + 1;

    for (let i = 1; i <= totalLevels; i++) {
        const levelButton = document.createElement('div');
        levelButton.classList.add('level-button');
        levelButton.dataset.level = i.toString();

        if (i < unlockedLevel) {
            levelButton.classList.add('completed');
            levelButton.textContent = `✔`;
        } else if (i === unlockedLevel) {
            levelButton.classList.add('unlocked');
            levelButton.textContent = i.toString();
        } else {
            levelButton.classList.add('locked');
        }
        levelButton.style.animationDelay = `${0.4 + i * 0.025}s`;
        levelGrid.appendChild(levelButton);
    }
  }

  async function loadGenerationData(generationId) {
    const generationInfo = GENERATIONS[generationId];
    if (!generationInfo || Object.keys(generationInfo.rappers).length === 0) {
      alert('این نسل به زودی اضافه خواهد شد!');
      return;
    }
    
    currentGenerationId = generationId;
    currentGenerationInfo = generationInfo;
    mainContent.classList.add('is-loading-data');

    try {
        const fetchPromises = Object.values(generationInfo.rappers).map(rapper => fetch(rapper.source).then(res => res.json()));
        const allRapperQuestions = await Promise.all(fetchPromises);
        
        // Combine all questions into one array and shuffle it
        gameData = allRapperQuestions.flat().sort(() => Math.random() - 0.5);
        
        if (!playerProgress.generations[generationId]) {
            playerProgress.generations[generationId] = { completedLevels: 0, completedQuestions: [] };
        }

        populateLevelGrid(generationId, gameData.length);
        navigateTo('levelSelect');
    } catch (error) {
        console.error(`Failed to load data for Generation ${generationId}:`, error);
        alert(`خطا در بارگذاری اطلاعات نسل ${generationId}. لطفا اتصال اینترنت خود را بررسی کنید.`);
    } finally {
        mainContent.classList.remove('is-loading-data');
    }
  }

  function getNextQuestion(isRetry) {
      const generationProgress = playerProgress.generations[currentGenerationId];
      let availableQuestions = gameData.filter(q => !generationProgress.completedQuestions.includes(q.question));

      // If all questions have been played once, reset the completed list for replayability
      if (availableQuestions.length === 0 && gameData.length > 0) {
          generationProgress.completedQuestions = [];
          saveProgress();
          availableQuestions = [...gameData];
      }
      
      // If retrying, try to serve a different question than the last one, if possible
      if (isRetry && currentQuestion && availableQuestions.length > 1) {
          const otherQuestions = availableQuestions.filter(q => q.question !== currentQuestion.question);
          if (otherQuestions.length > 0) {
              availableQuestions = otherQuestions;
          }
      }
      
      if (availableQuestions.length === 0) return null;
      
      const randomIndex = Math.floor(Math.random() * availableQuestions.length);
      return availableQuestions[randomIndex];
  }

  function startLevel(levelNumber, isRetry = false) {
    if (!isRetry) {
        currentQuestion = null;
    }

    const levelData = getNextQuestion(isRetry);

    if (!levelData) {
        console.error("Could not find a question to display.");
        alert("مرحله‌ای برای نمایش یافت نشد. لطفا به صفحه قبل بازگردید.");
        navigateTo('generationSelect');
        return;
    }
    
    currentQuestion = levelData;
    currentLevel = levelNumber;

    timerBarProgress.style.transition = 'none';
    timerBarProgress.style.width = '100%';
    timerBarProgress.classList.remove('low-time');
    
    questionTitle.textContent = `مرحله ${levelNumber}`;
    questionText.textContent = levelData.question;
    answersContainer.innerHTML = '';

    const shuffledOptions = [...levelData.options].sort(() => Math.random() - 0.5);

    shuffledOptions.forEach(option => {
      const button = document.createElement('button');
      button.classList.add('answer-button');
      button.textContent = option;
      button.onclick = () => handleAnswer(button, option, levelData.answer);
      answersContainer.appendChild(button);
    });
    
    navigateTo('game');
    setTimeout(startTimer, 500);
  }
  
  function handleAnswer(button, selectedAnswer, correctAnswer) {
    clearTimer();
    const allButtons = answersContainer.querySelectorAll('.answer-button');
    allButtons.forEach(btn => btn.classList.add('disabled'));

    if (selectedAnswer === correctAnswer) {
        button.classList.add('correct');
        
        const generationProgress = playerProgress.generations[currentGenerationId];

        // Add question to completed list to avoid immediate repetition
        if (currentQuestion && !generationProgress.completedQuestions.includes(currentQuestion.question)) {
            generationProgress.completedQuestions.push(currentQuestion.question);
        }
        
        // Only increment completed levels if this is the next level in sequence
        if (currentLevel === generationProgress.completedLevels + 1) {
            generationProgress.completedLevels++;
        }
        
        saveProgress();
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
  
  function showFeedbackModal(isCorrect, isTimeUp) {
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
      
      const generationProgress = playerProgress.generations[currentGenerationId];
      if (generationProgress.completedLevels >= gameData.length) {
        modalNextBtn.classList.add('hidden');
        modalMessage.textContent = `تو بخش ${currentGenerationInfo.name} رو تموم کردی! آفرین.`;
      }
    } else {
      modalTitle.textContent = "اشتباه بود!";
      modalTitle.className = 'incorrect';
      modalMessage.textContent = "دوباره تلاش کن, مطمئنم میتونی.";
      modalRetryBtn.classList.remove('hidden');
      modalNextBtn.classList.add('hidden');
    }
    feedbackModal.classList.remove('hidden');
  }

  function hideFeedbackModal() {
    feedbackModal.classList.add('hidden');
  }

  // --- Event Listeners ---
  continueBtn.addEventListener('click', () => {
    const name = playerNameInput.value.trim();
    if (name) {
      playerProgress.playerName = name;
      saveProgress();
      setupMainMenu();
    } else {
        playerNameInput.classList.add('shake');
        setTimeout(() => playerNameInput.classList.remove('shake'), 500);
    }
  });
  
  playerNameInput.addEventListener('keypress', (event) => {
    if (event.key === 'Enter') {
      continueBtn.click();
    }
  });

  changeNameBtn.addEventListener('click', () => {
    playerProgress.playerName = '';
    saveProgress();
    setupMainMenu();
  });

  startGameBtn.addEventListener('click', () => navigateTo('generationSelect'));
  backToMainBtn.addEventListener('click', () => navigateTo('mainMenu'));
  backToGenerationsBtn.addEventListener('click', () => navigateTo('generationSelect'));
  
  backToMapInGameBtn.addEventListener('click', () => {
    loadProgress();
    populateLevelGrid(currentGenerationId, gameData.length);
    navigateTo('levelSelect');
  });

  
  settingsBtn.addEventListener('click', () => alert('صفحه تنظیمات در دست ساخت است!'));
  
  generationGrid.addEventListener('click', (event) => {
    const card = event.target.closest('.chapter-card');
    if (card && !card.classList.contains('disabled')) {
        const genNumber = card.dataset.generation;
        loadGenerationData(genNumber);
    }
  });

  levelGrid.addEventListener('click', (event) => {
    const levelButton = event.target.closest('.level-button');
    if (levelButton && !levelButton.classList.contains('locked')) {
        const levelNumber = parseInt(levelButton.dataset.level || '0');
        startLevel(levelNumber, false);
    }
  });

  modalNextBtn.addEventListener('click', () => {
    hideFeedbackModal();
    startLevel(currentLevel + 1, false);
  });

  modalRetryBtn.addEventListener('click', () => {
    hideFeedbackModal();
    startLevel(currentLevel, true);
  });
  
  modalMapBtn.addEventListener('click', () => {
    hideFeedbackModal();
    loadProgress();
    populateLevelGrid(currentGenerationId, gameData.length);
    navigateTo('levelSelect');
  });
  
  window.addEventListener('online', () => {
    if (loadingScreen && !loadingScreen.classList.contains('fade-out')) {
        initializeApp();
    }
  });
  window.addEventListener('offline', showOfflineMessage);


  // --- Initialisation ---
  loadProgress();
  setupMainMenu();
  initializeApp();
});
