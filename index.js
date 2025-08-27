
/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

document.addEventListener('DOMContentLoaded', async () => {
  // --- Constants ---
  const LEVEL_TIME = 20; // seconds

  // --- Element Cache ---
  const loadingScreen = document.getElementById('loading-screen');
  const progressBar = document.getElementById('progress-bar');
  const statusText = document.getElementById('status-text');
  const loaderContainer = document.getElementById('loader-container');
  const backgroundAnimation = document.querySelector('.background-animation');
  
  const mainContent = document.getElementById('main-content');
  const screens = {
    mainMenu: document.getElementById('main-menu'),
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
  const backToMainBtn = document.getElementById('back-to-main-btn');
  const chapterGrid = document.getElementById('chapter-grid');

  const levelSelectTitle = document.getElementById('level-select-title');
  const levelProgressContainer = document.getElementById('level-progress-container');
  const levelProgressText = document.getElementById('level-progress-text');
  const levelProgressBar = document.getElementById('level-progress-bar');
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


  // --- Element Check ---
  if (!loadingScreen || !progressBar || !statusText || !mainContent || !loaderContainer || !backgroundAnimation ||
      !screens.mainMenu || !screens.chapterSelect || !screens.levelSelect || !screens.game || !startGameBtn || 
      !settingsBtn || !backToMainBtn || !chapterGrid || !levelSelectTitle || !levelGrid || !backToChaptersBtn ||
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
  let playerProgress = { chapters: {} };
  let currentLevel = 0;
  let currentChapterId = '';
  let currentQuestion = null;


  // --- Game Data & Progress ---
  function saveProgress() {
    localStorage.setItem('iranRapProgress', JSON.stringify(playerProgress));
  }

  function loadProgress() {
      const savedProgress = localStorage.getItem('iranRapProgress');
      if (savedProgress) {
          const progress = JSON.parse(savedProgress);
          // Backward compatibility: Convert old progress format
          if (progress.unlockedLevel && !progress.chapters) {
              playerProgress = {
                  playerName: progress.playerName,
                  chapters: {
                      'yas': { completedLevels: progress.unlockedLevel - 1, completedQuestions: [] }
                  }
              };
              saveProgress(); // Save in new format
          } else {
              playerProgress = progress;
          }
          // Ensure chapters object exists for robustness
          if (!playerProgress.chapters) {
              playerProgress.chapters = {};
          }
      } else {
          // Default for new players
          playerProgress = { chapters: {} };
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

  function updateChapterSelectScreen() {
      const isSpecialUser = playerProgress.playerName === 'abolfazl1401';
  
      // --- Chapter 2 Logic ---
      const yasProgress = playerProgress.chapters['yas'] || { completedLevels: 0 };
      const yasChapterCard = document.querySelector('.chapter-card[data-source="yas.json"]');
      const pishroChapterCard = document.querySelector('.chapter-card[data-source="pishro.json"]');
      const pishroSoonText = pishroChapterCard.querySelector('.soon-text');
  
      if (!yasChapterCard || !pishroChapterCard || !pishroSoonText) return;
  
      const totalYasLevels = parseInt(yasChapterCard.dataset.totalLevels || '200');
      const isChapter1Completed = yasProgress.completedLevels >= totalYasLevels;
  
      if (isChapter1Completed || isSpecialUser) {
          pishroChapterCard.classList.remove('disabled');
          pishroSoonText.classList.add('hidden');
      } else {
          pishroChapterCard.classList.add('disabled');
          pishroSoonText.textContent = `ابتدا فصل ۱ را کامل کنید`;
          pishroSoonText.classList.remove('hidden');
      }
  
      // --- Chapter 3 Logic ---
      const pishroProgress = playerProgress.chapters['pishro'] || { completedLevels: 0 };
      const moeinChapterCard = document.querySelector('.chapter-card[data-source="moein.json"]');
      const moeinSoonText = moeinChapterCard.querySelector('.soon-text');
      
      if (!moeinChapterCard || !moeinSoonText) return;
  
      const totalPishroLevels = parseInt(pishroChapterCard.dataset.totalLevels || '300');
      const isChapter2Completed = pishroProgress.completedLevels >= totalPishroLevels;
  
      if (isChapter2Completed || isSpecialUser) {
          moeinChapterCard.classList.remove('disabled');
          moeinSoonText.classList.add('hidden');
      } else {
          moeinChapterCard.classList.add('disabled');
          moeinSoonText.textContent = `ابتدا فصل ۲ را کامل کنید`;
          moeinSoonText.classList.remove('hidden');
      }
  }

  // --- Screen Navigation ---
  function navigateTo(screenName) {
    clearTimer(); // Always clear timer on navigation
    Object.values(screens).forEach(screen => screen?.classList.remove('is-visible'));
    Object.values(screens).forEach(screen => screen?.classList.add('hidden'));
    
    if (screenName === 'chapterSelect') {
        updateChapterSelectScreen();
    }

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
  function updateLevelProgressDisplay(chapterId) {
    const totalLevels = gameData.length;
    const chapterProgress = playerProgress.chapters[chapterId] || { completedLevels: 0 };
    const completedLevels = chapterProgress.completedLevels;

    if (totalLevels > 0) {
        const percentage = (completedLevels / totalLevels) * 100;
        levelProgressBar.style.width = `${percentage}%`;

        if (completedLevels >= totalLevels) {
             levelProgressText.textContent = `!شما این فصل را تمام کرده‌اید (${totalLevels} / ${totalLevels})`;
        } else {
            const currentLevelForDisplay = completedLevels + 1;
            levelProgressText.textContent = `مرحله ${currentLevelForDisplay} از ${totalLevels}`;
        }
    } else {
        levelProgressText.textContent = `فصل خالی است`;
        levelProgressBar.style.width = `0%`;
    }
  }

  function populateLevelGrid(chapterTitle, chapterId) {
    levelGrid.innerHTML = '';
    levelSelectTitle.textContent = chapterTitle;
    updateLevelProgressDisplay(chapterId);
    const chapterProgress = playerProgress.chapters[chapterId] || { completedLevels: 0 };
    const unlockedLevel = chapterProgress.completedLevels + 1;

    for (let i = 1; i <= gameData.length; i++) {
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

  async function selectChapter(chapterElement) {
    if (chapterElement.classList.contains('disabled')) return;
    const chapterNumber = chapterElement.dataset.chapter;
    const chapterTitle = chapterElement.dataset.title || `فصل ${chapterNumber}`;
    const dataSource = chapterElement.dataset.source;

    if (!dataSource) {
      alert(`فصل ${chapterNumber} به زودی عرضه می‌شود!`);
      return;
    }
    const chapterId = dataSource.replace('.json', '');
    currentChapterId = chapterId;

    mainContent.classList.add('is-loading-chapter');
    
    try {
      const response = await fetch(dataSource);
      if (!response.ok) throw new Error(`Network response was not ok for ${dataSource}`);
      gameData = await response.json();
      
      populateLevelGrid(chapterTitle, chapterId);
      navigateTo('levelSelect');
    } catch (error) {
      console.error(`Failed to load chapter data from ${dataSource}:`, error);
      alert(`خطا در بارگذاری اطلاعات فصل ${chapterNumber}. لطفا اتصال اینترنت خود را بررسی کنید.`);
    } finally {
      mainContent.classList.remove('is-loading-chapter');
    }
  }

  function getNextQuestion(isRetry) {
      const chapterProgress = playerProgress.chapters[currentChapterId];

      // Start with a pool of questions that have not been correctly answered yet.
      let availableQuestions = gameData.filter(q => !chapterProgress.completedQuestions.includes(q.question));

      // If all questions are answered, reset the pool to allow replaying.
      if (availableQuestions.length === 0 && gameData.length > 0) {
          chapterProgress.completedQuestions = []; // Reset for replayability
          saveProgress();
          availableQuestions = [...gameData];
      }

      // On retry, if possible, pick a question different from the last one.
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
    // Ensure progress object exists for the current chapter
    if (!playerProgress.chapters[currentChapterId]) {
        playerProgress.chapters[currentChapterId] = { completedLevels: 0, completedQuestions: [] };
    }
    
    if (!isRetry) {
        currentQuestion = null;
    }

    const levelData = getNextQuestion(isRetry);

    if (!levelData) {
        console.error("Could not find a question to display.");
        alert("مرحله‌ای برای نمایش یافت نشد. لطفا به صفحه فصل‌ها بازگردید.");
        navigateTo('chapterSelect');
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

    // Shuffle options to randomize their display order
    const shuffledOptions = [...levelData.options];
    for (let i = shuffledOptions.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffledOptions[i], shuffledOptions[j]] = [shuffledOptions[j], shuffledOptions[i]];
    }

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
        
        const chapterId = currentChapterId;
        const chapterProgress = playerProgress.chapters[chapterId];

        // Add question to completed list if it's not already there
        if (currentQuestion && !chapterProgress.completedQuestions.includes(currentQuestion.question)) {
            chapterProgress.completedQuestions.push(currentQuestion.question);
        }
        
        // If it was the latest unlocked level, increment progress
        if (currentLevel === chapterProgress.completedLevels + 1) {
            chapterProgress.completedLevels++;
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
      
      const chapterProgress = playerProgress.chapters[currentChapterId];
      if (currentLevel >= gameData.length || chapterProgress.completedLevels >= gameData.length) {
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

  function handleParallax(event) {
      const { clientX, clientY } = event;
      const { innerWidth, innerHeight } = window;
      const moveX = (clientX - innerWidth / 2) / 40;
      const moveY = (clientY - innerHeight / 2) / 40;
      backgroundAnimation.style.transform = `translate(${moveX}px, ${moveY}px)`;
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

  startGameBtn.addEventListener('click', () => navigateTo('chapterSelect'));
  backToMainBtn.addEventListener('click', () => navigateTo('mainMenu'));
  backToChaptersBtn.addEventListener('click', () => navigateTo('chapterSelect'));
  
  backToMapInGameBtn.addEventListener('click', () => {
    loadProgress();
    const chapterTitle = levelSelectTitle.textContent || "انتخاب مرحله";
    populateLevelGrid(chapterTitle, currentChapterId);
    navigateTo('levelSelect');
  });

  
  settingsBtn.addEventListener('click', () => alert('صفحه تنظیمات در دست ساخت است!'));
  
  chapterGrid.addEventListener('click', (event) => {
    const chapterCard = event.target.closest('.chapter-card');
    if (chapterCard) selectChapter(chapterCard);
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
    const chapterTitle = levelSelectTitle.textContent || "انتخاب مرحله";
    populateLevelGrid(chapterTitle, currentChapterId);
    navigateTo('levelSelect');
  });
  
  window.addEventListener('mousemove', handleParallax);
  window.addEventListener('online', () => {
    // If loading screen is visible and not already fading out, try to initialize again
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
