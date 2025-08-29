/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

document.addEventListener('DOMContentLoaded', async () => {
  // --- Constants ---
  const LEVEL_TIME = 20; // seconds
  const GAME_DATA = {
    'rap': {
        id: 'rap',
        name: 'رپ فارسی',
        type: 'generations',
        chapters: {
            '1': { 
                id: '1', 
                name: 'نسل ۱', 
                sources: [
                    'yas.json', 
                    'pishro.json', 
                    'hichkas.json', 
                    'bahram.json', 
                    'hossein.json'
                ] 
            },
            '2': { id: '2', name: 'نسل ۲', sources: [], disabled: true },
            '3': { id: '3', name: 'نسل ۳', sources: [], disabled: true },
            '4': { id: '4', name: 'نسل ۴', sources: [], disabled: true },
            '5': { id: '5', name: 'نسل ۵', sources: [], disabled: true },
        }
    },
    'pop': {
        id: 'pop',
        name: 'اسطوره‌های پاپ',
        type: 'artists',
        chapters: {
            'moein': { id: 'moein', name: 'معین', sources: ['moein.json'], disabled: false }
        }
    }
  };

  // --- Element Cache ---
  const loadingScreen = document.getElementById('loading-screen');
  const progressBar = document.getElementById('progress-bar');
  const statusText = document.getElementById('status-text');
  const loaderContainer = document.getElementById('loader-container');
  
  const mainContent = document.getElementById('main-content');
  const screens = {
    mainMenu: document.getElementById('main-menu'),
    categorySelect: document.getElementById('category-select-screen'),
    chapterSelect: document.getElementById('chapter-select-screen'),
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
  
  const categoryGrid = document.getElementById('category-grid');
  const backToMainMenuBtn = document.getElementById('back-to-main-menu-btn');
  
  const chapterSelectTitle = document.getElementById('chapter-select-title');
  const chapterGrid = document.getElementById('chapter-grid');
  const backToCategoryBtn = document.getElementById('back-to-category-btn');
  
  const levelSelectTitle = document.getElementById('level-select-title');
  const levelProgressContainer = document.getElementById('level-progress-container');
  const levelProgressText = document.getElementById('level-progress-text');
  const levelProgressBar = document.getElementById('level-progress-bar');
  const levelGrid = document.getElementById('level-grid');
  const backToChaptersBtn = document.getElementById('back-to-chapters-btn');

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

  // --- Game State ---
  let loadingInterval = null;
  let timerInterval = null;
  let currentChapterData = [];
  let playerProgress = { progress: {} };
  let currentLevel = 0;
  let currentCategoryKey = '';
  let currentChapterKey = '';
  let currentQuestion = null;

  // --- Game Data & Progress ---
  function saveProgress() {
    localStorage.setItem('iranRapProgress', JSON.stringify(playerProgress));
  }

  function loadProgress() {
    const savedProgress = localStorage.getItem('iranRapProgress');
    if (savedProgress) {
        let progress = JSON.parse(savedProgress);
        let needsSave = false;

        // Migration 1: from old per-rapper to per-generation
        if (progress.rappers && !progress.generations) {
            const newProgress = { playerName: progress.playerName, generations: {} };
            const gen1Rappers = Object.keys(GAME_DATA.rap.chapters['1'].sources.map(s => s.replace('.json', '')));
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
            newProgress.generations['1'] = { completedLevels, completedQuestions: [...new Set(completedQuestions)] };
            progress = newProgress;
            needsSave = true;
        }

        // Migration 2: from 'generations' object to new 'progress' object
        if (progress.generations && !progress.progress) {
            progress.progress = {};
            if (progress.generations['1']) {
                progress.progress['rap_1'] = progress.generations['1'];
            }
            delete progress.generations;
            needsSave = true;
        }

        playerProgress = progress;
        if (!playerProgress.progress) playerProgress.progress = {};
        if (needsSave) saveProgress();
    } else {
        playerProgress = { progress: {} };
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
    clearTimer();
    Object.values(screens).forEach(screen => screen?.classList.add('hidden'));
    
    const targetScreen = screens[screenName];
    if (targetScreen) {
      targetScreen.classList.remove('hidden');
      // Use a short timeout to allow the 'display' property to update before adding the visibility class for animations
      setTimeout(() => {
        Object.values(screens).forEach(s => s?.classList.remove('is-visible'));
        targetScreen.classList.add('is-visible');
      }, 10);
    }
  }

  // --- Loading Screen Logic ---
  function showOfflineMessage() {
    if (loadingInterval) { clearInterval(loadingInterval); loadingInterval = null; }
    statusText.textContent = 'اتصال به اینترنت برقرار نیست. لطفا وصل شوید و دوباره تلاش کنید.';
    statusText.classList.add('error');
    loaderContainer.style.display = 'none';
  }

  const loadingMessages = [
    'در حال آماده‌سازی...',
    'بررسی فایل‌های بازی...',
    'بارگذاری محیط بازی...',
    'شروع موتور گرافیکی...',
    'تقریباً آماده است!'
  ];

  function startLoading() {
    if (loadingInterval) return;
    statusText.textContent = loadingMessages[0];
    statusText.classList.remove('error');
    loaderContainer.style.display = 'block';
    progressBar.style.width = '0%';
    
    let progress = 0;
    let messageIndex = 0;

    loadingInterval = setInterval(() => {
        // Non-linear progress for better UX
        progress += Math.random() * 2 + 1.5; 
        if (progress > 100) progress = 100;
        
        progressBar.style.width = `${progress}%`;
        
        // Cycle through messages
        const newMessageIndex = Math.floor(progress / (100 / loadingMessages.length));
        if (newMessageIndex > messageIndex) {
            messageIndex = newMessageIndex;
            if (loadingMessages[messageIndex]) {
                statusText.textContent = loadingMessages[messageIndex];
            }
        }

        if (progress >= 100) {
            if(loadingInterval) clearInterval(loadingInterval);
            loadingInterval = null;
            setTimeout(finishLoading, 500); // Wait half a second on 100%
        }
    }, 80);
  }


  function finishLoading() {
    loadingScreen.classList.add('fade-out');
    mainContent.classList.remove('hidden');
    navigateTo('mainMenu');
  }
  
  async function initializeApp() {
    try {
        loadProgress();
        setupMainMenu();
        // If everything is setup, start the loading animation
        navigator.onLine ? startLoading() : showOfflineMessage();
    } catch (error) {
        console.error("Initialization Error:", error);
        if (loadingInterval) { clearInterval(loadingInterval); loadingInterval = null; }
        statusText.textContent = 'خطایی در اجرای بازی رخ داد. لطفا صفحه را رفرش کنید.';
        statusText.classList.add('error');
        loaderContainer.style.display = 'none';
    }
  }

  // --- UI Population ---
  function showCategorySelect() {
    categoryGrid.innerHTML = '';
    Object.values(GAME_DATA).forEach(category => {
        const card = document.createElement('div');
        card.className = 'category-card';
        card.dataset.category = category.id;
        card.innerHTML = `<span>${category.name}</span>`;
        card.addEventListener('click', () => showChapterSelect(category.id));
        categoryGrid.appendChild(card);
    });
    navigateTo('categorySelect');
  }
  
  function showChapterSelect(categoryKey) {
    currentCategoryKey = categoryKey;
    const category = GAME_DATA[categoryKey];
    chapterGrid.innerHTML = '';
    chapterSelectTitle.textContent = category.name;
    
    Object.values(category.chapters).forEach(chapter => {
        const card = document.createElement('div');
        card.className = 'chapter-card';
        card.dataset.chapter = chapter.id;
        let content = `<span>${chapter.name}</span>`;
        if (chapter.disabled) {
            card.classList.add('disabled');
            content += `<span class="soon-text">به زودی...</span>`;
        }
        card.innerHTML = content;
        if (!chapter.disabled) {
          card.addEventListener('click', () => loadChapterData(chapter));
        }
        chapterGrid.appendChild(card);
    });
    navigateTo('chapterSelect');
  }

  function updateLevelProgressDisplay(progressKey, totalLevels, chapterName) {
    const chapterProgress = playerProgress.progress[progressKey] || { completedLevels: 0 };
    const completedLevels = chapterProgress.completedLevels;
    levelSelectTitle.textContent = chapterName;

    if (totalLevels > 0) {
        const percentage = (completedLevels / totalLevels) * 100;
        levelProgressBar.style.width = `${percentage}%`;
        levelProgressText.textContent = completedLevels >= totalLevels ?
            `!شما این بخش را تمام کرده‌اید (${totalLevels}/${totalLevels})` :
            `مرحله ${completedLevels + 1} از ${totalLevels}`;
    } else {
        levelProgressText.textContent = 'بخشی یافت نشد';
        levelProgressBar.style.width = '0%';
    }
  }

  function populateLevelGrid(progressKey, totalLevels) {
    levelGrid.innerHTML = '';
    const chapterProgress = playerProgress.progress[progressKey] || { completedLevels: 0 };
    const unlockedLevel = chapterProgress.completedLevels + 1;

    for (let i = 1; i <= totalLevels; i++) {
        const levelButton = document.createElement('div');
        levelButton.className = 'level-button';
        levelButton.dataset.level = i;

        if (i < unlockedLevel) {
            levelButton.classList.add('completed');
            levelButton.innerHTML = `&#10004;`; // checkmark
        } else if (i === unlockedLevel) {
            levelButton.classList.add('unlocked');
            levelButton.textContent = i;
        } else {
            levelButton.classList.add('locked');
        }
        levelButton.style.animationDelay = `${0.4 + i * 0.025}s`;
        levelGrid.appendChild(levelButton);
    }
  }

  // --- Timer Logic ---
  function clearTimer() {
    if (timerInterval) { clearInterval(timerInterval); timerInterval = null; }
  }

  function startTimer() {
    clearTimer();
    let timeLeft = LEVEL_TIME;
    void timerBarProgress.offsetWidth; // Force reflow for transition
    timerBarProgress.style.transition = `width ${LEVEL_TIME}s linear, background 0.5s`;
    timerBarProgress.style.width = '0%';
    
    timerInterval = setInterval(() => {
      timeLeft--;
      if (timeLeft <= 5) timerBarProgress.classList.add('low-time');
      if (timeLeft <= 0) handleTimeUp();
    }, 1000);
  }

  function handleTimeUp() {
    clearTimer();
    answersContainer.querySelectorAll('.answer-button').forEach(btn => btn.classList.add('disabled'));
    showFeedbackModal(false, true);
  }

  // --- Game Logic ---
  async function loadChapterData(chapter) {
    if (!chapter || chapter.sources.length === 0) {
      alert('این بخش به زودی اضافه خواهد شد!');
      return;
    }
    
    currentChapterKey = chapter.id;
    mainContent.classList.add('is-loading-data');

    try {
        const fetchPromises = chapter.sources.map(src => fetch(src).then(res => res.json()));
        const allQuestions = await Promise.all(fetchPromises);
        currentChapterData = allQuestions.flat().sort(() => Math.random() - 0.5);
        
        const progressKey = `${currentCategoryKey}_${currentChapterKey}`;
        if (!playerProgress.progress[progressKey]) {
            playerProgress.progress[progressKey] = { completedLevels: 0, completedQuestions: [] };
        }
        
        updateLevelProgressDisplay(progressKey, currentChapterData.length, chapter.name);
        populateLevelGrid(progressKey, currentChapterData.length);
        navigateTo('levelSelect');
    } catch (error) {
        console.error(`Failed to load data for ${chapter.name}:`, error);
        alert(`خطا در بارگذاری اطلاعات. لطفا اتصال اینترنت خود را بررسی کنید.`);
    } finally {
        mainContent.classList.remove('is-loading-data');
    }
  }
  
  function getNextQuestion(isRetry) {
      const progressKey = `${currentCategoryKey}_${currentChapterKey}`;
      const chapterProgress = playerProgress.progress[progressKey];
      let availableQuestions = currentChapterData.filter(q => !chapterProgress.completedQuestions.includes(q.question));

      if (availableQuestions.length === 0 && currentChapterData.length > 0) {
          chapterProgress.completedQuestions = [];
          saveProgress();
          availableQuestions = [...currentChapterData];
      }
      
      if (isRetry && currentQuestion && availableQuestions.length > 1) {
          const otherQuestions = availableQuestions.filter(q => q.question !== currentQuestion.question);
          if (otherQuestions.length > 0) availableQuestions = otherQuestions;
      }
      
      if (availableQuestions.length === 0) return null;
      
      const randomIndex = Math.floor(Math.random() * availableQuestions.length);
      return availableQuestions[randomIndex];
  }

  function startLevel(levelNumber, isRetry = false) {
    if (!isRetry) currentQuestion = null;

    const levelData = getNextQuestion(isRetry);

    if (!levelData) {
        alert("مرحله‌ای برای نمایش یافت نشد. لطفا به صفحه قبل بازگردید.");
        showChapterSelect(currentCategoryKey);
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
      button.className = 'answer-button';
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
        const progressKey = `${currentCategoryKey}_${currentChapterKey}`;
        const chapterProgress = playerProgress.progress[progressKey];

        if (currentQuestion && !chapterProgress.completedQuestions.includes(currentQuestion.question)) {
            chapterProgress.completedQuestions.push(currentQuestion.question);
        }
        if (currentLevel === chapterProgress.completedLevels + 1) {
            chapterProgress.completedLevels++;
        }
        
        saveProgress();
        showFeedbackModal(true, false);
    } else {
      button.classList.add('incorrect');
      allButtons.forEach(btn => { if(btn.textContent === correctAnswer) btn.classList.add('correct'); });
      showFeedbackModal(false, false);
    }
  }
  
  function showFeedbackModal(isCorrect, isTimeUp) {
    modalRetryBtn.classList.add('hidden');
    modalNextBtn.classList.add('hidden');
    
    if (isTimeUp) {
      modalTitle.textContent = "وقت تموم شد!";
      modalTitle.className = 'incorrect';
      modalMessage.textContent = "سرعت عمل بیشتری لازم داری!";
      modalRetryBtn.classList.remove('hidden');
    } else if (isCorrect) {
      modalTitle.textContent = "عالی بود!";
      modalTitle.className = 'correct';
      const progressKey = `${currentCategoryKey}_${currentChapterKey}`;
      const chapterProgress = playerProgress.progress[progressKey];
      if (chapterProgress.completedLevels >= currentChapterData.length) {
        modalMessage.textContent = `تو این بخش رو تموم کردی! آفرین.`;
      } else {
        modalMessage.textContent = "به مرحله بعد راه پیدا کردی.";
        modalNextBtn.classList.remove('hidden');
      }
    } else {
      modalTitle.textContent = "اشتباه بود!";
      modalTitle.className = 'incorrect';
      modalMessage.textContent = "دوباره تلاش کن, مطمئنم میتونی.";
      modalRetryBtn.classList.remove('hidden');
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
  
  playerNameInput.addEventListener('keypress', (event) => { if (event.key === 'Enter') continueBtn.click(); });
  changeNameBtn.addEventListener('click', () => { playerProgress.playerName = ''; saveProgress(); setupMainMenu(); });
  startGameBtn.addEventListener('click', showCategorySelect);
  backToMainMenuBtn.addEventListener('click', () => navigateTo('mainMenu'));
  backToCategoryBtn.addEventListener('click', showCategorySelect);
  backToChaptersBtn.addEventListener('click', () => showChapterSelect(currentCategoryKey));
  
  function returnToLevelMap() {
      const chapter = GAME_DATA[currentCategoryKey].chapters[currentChapterKey];
      loadChapterData(chapter);
  }
  backToMapInGameBtn.addEventListener('click', returnToLevelMap);
  modalMapBtn.addEventListener('click', () => { hideFeedbackModal(); returnToLevelMap(); });

  settingsBtn.addEventListener('click', () => alert('صفحه تنظیمات در دست ساخت است!'));
  
  levelGrid.addEventListener('click', (event) => {
    const levelButton = event.target.closest('.level-button');
    if (levelButton && !levelButton.classList.contains('locked')) {
        startLevel(parseInt(levelButton.dataset.level || '0'), false);
    }
  });

  modalNextBtn.addEventListener('click', () => { hideFeedbackModal(); startLevel(currentLevel + 1, false); });
  modalRetryBtn.addEventListener('click', () => { hideFeedbackModal(); startLevel(currentLevel, true); });
  
  window.addEventListener('online', () => { if (loadingScreen && !loadingScreen.classList.contains('fade-out')) initializeApp(); });
  window.addEventListener('offline', showOfflineMessage);

  // --- Initialisation ---
  initializeApp();
});