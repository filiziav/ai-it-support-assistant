// public/js/app.js - Frontend logic for IT Support Assistant (Advanced Version)

document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements - Input & Actions
  const supportForm = document.getElementById('supportForm');
  const problemInput = document.getElementById('problemInput');
  const charCount = document.getElementById('charCount');
  const charHint = document.getElementById('charHint');
  const submitBtn = document.getElementById('submitBtn');
  const clearBtn = document.getElementById('clearBtn');
  const startNewTopBtn = document.getElementById('startNewTopBtn');
  const startNewBottomBtn = document.getElementById('startNewBottomBtn');
  const scrollToTopBtn = document.getElementById('scrollToTopBtn');

  // Example Cards
  const exampleCards = document.querySelectorAll('.example-card');

  // Session History Elements
  const sessionCountBadge = document.getElementById('sessionCountBadge');
  const sessionEmptyState = document.getElementById('sessionEmptyState');
  const sessionHistoryList = document.getElementById('sessionHistoryList');
  const clearSessionBtn = document.getElementById('clearSessionBtn');

  // Loading & Error States
  const loadingState = document.getElementById('loadingState');
  const loadingMessage = document.getElementById('loadingMessage');
  const loadingSubMessage = document.getElementById('loadingSubMessage');
  const errorBanner = document.getElementById('errorBanner');
  const errorMessage = document.getElementById('errorMessage');

  // Diagnosis Results Elements
  const resultsContainer = document.getElementById('resultsContainer');
  const demoNoticeBox = document.getElementById('demoNoticeBox');
  const demoNoticeText = document.getElementById('demoNoticeText');
  const categoryBadge = document.getElementById('categoryBadge');
  const categoryIcon = document.getElementById('categoryIcon');
  const categoryText = document.getElementById('categoryText');
  const severityBadge = document.getElementById('severityBadge');
  const severityText = document.getElementById('severityText');
  const summaryText = document.getElementById('summaryText');
  const possibleCausesList = document.getElementById('possibleCausesList');
  const troubleshootingStepsList = document.getElementById('troubleshootingStepsList');
  const stepProgress = document.getElementById('stepProgress');
  const troubleshootProgressFill = document.getElementById('troubleshootProgressFill');
  const preventionList = document.getElementById('preventionList');
  const followUpList = document.getElementById('followUpList');

  // Feedback & Resolution Elements
  const feedbackSection = document.getElementById('feedbackSection');
  const feedbackPromptView = document.getElementById('feedbackPromptView');
  const feedbackYesBtn = document.getElementById('feedbackYesBtn');
  const feedbackNoBtn = document.getElementById('feedbackNoBtn');
  const feedbackSuccessView = document.getElementById('feedbackSuccessView');
  const successNewProblemBtn = document.getElementById('successNewProblemBtn');
  const feedbackFollowUpView = document.getElementById('feedbackFollowUpView');
  const cancelFollowUpBtn = document.getElementById('cancelFollowUpBtn');
  const followUpForm = document.getElementById('followUpForm');
  const followUpInput = document.getElementById('followUpInput');
  const submitFollowUpBtn = document.getElementById('submitFollowUpBtn');

  // SVG Icons for categories
  const ICONS = {
    Hardware: `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <rect x="2" y="2" width="20" height="8" rx="2" ry="2"></rect>
        <rect x="2" y="14" width="20" height="8" rx="2" ry="2"></rect>
        <line x1="6" y1="6" x2="6.01" y2="6"></line>
        <line x1="6" y1="18" x2="6.01" y2="18"></line>
      </svg>
    `,
    Software: `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="16 18 22 12 16 6"></polyline>
        <polyline points="8 6 2 12 8 18"></polyline>
      </svg>
    `,
    Network: `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M5 12.55a11 11 0 0 1 14.08 0"></path>
        <path d="M1.42 9a16 16 0 0 1 21.16 0"></path>
        <path d="M8.53 16.11a6 6 0 0 1 6.95 0"></path>
        <line x1="12" y1="20" x2="12.01" y2="20"></line>
      </svg>
    `
  };

  const CHECK_ICON = `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
      <polyline points="20 6 9 17 4 12"></polyline>
    </svg>
  `;

  // App State
  let loadingInterval = null;
  let currentDiagnosisData = null;
  let currentOriginalProblem = '';
  let sessionHistory = [];

  const loadingPhrases = [
    { title: 'Analyzing your IT problem...', sub: 'Identifying hardware, software, or network factors...' },
    { title: 'Pinpointing probable causes...', sub: 'Checking against common system issues and failure patterns...' },
    { title: 'Formulating step-by-step guidance...', sub: 'Crafting clear, jargon-free troubleshooting instructions...' },
    { title: 'Finalizing recommendations...', sub: 'Adding prevention advice and diagnostic follow-up notes...' }
  ];

  // ==========================================================================
  // Session History Management (sessionStorage)
  // ==========================================================================

  function loadSessionHistory() {
    try {
      const stored = sessionStorage.getItem('it_assistant_session_history');
      if (stored) {
        sessionHistory = JSON.parse(stored);
      }
    } catch (e) {
      console.warn('Could not read session history from sessionStorage:', e);
      sessionHistory = [];
    }
    renderSessionHistory();
  }

  function saveSessionHistory() {
    try {
      sessionStorage.setItem('it_assistant_session_history', JSON.stringify(sessionHistory));
    } catch (e) {
      console.warn('Could not save session history to sessionStorage:', e);
    }
    renderSessionHistory();
  }

  function addProblemToSession(problem, diagnosis) {
    const item = {
      id: Date.now().toString(),
      problem: problem,
      category: diagnosis.category || 'Software',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      diagnosis: diagnosis
    };

    sessionHistory.unshift(item);
    // Keep max 10 session items
    if (sessionHistory.length > 10) {
      sessionHistory.pop();
    }
    saveSessionHistory();
  }

  function renderSessionHistory() {
    sessionCountBadge.textContent = `${sessionHistory.length} saved`;

    if (sessionHistory.length === 0) {
      sessionEmptyState.classList.remove('hidden');
      sessionHistoryList.classList.add('hidden');
      sessionHistoryList.innerHTML = '';
      return;
    }

    sessionEmptyState.classList.add('hidden');
    sessionHistoryList.classList.remove('hidden');
    sessionHistoryList.innerHTML = '';

    sessionHistory.forEach((item) => {
      const row = document.createElement('div');
      row.className = 'session-history-item';
      row.innerHTML = `
        <div class="session-item-left">
          <span class="session-item-time">${item.time}</span>
          <span class="session-item-tag">${escapeHtml(item.category)}</span>
          <span class="session-item-text" title="${escapeHtml(item.problem)}">${escapeHtml(item.problem)}</span>
        </div>
        <button type="button" class="btn-view-history" data-id="${item.id}">
          View Result
        </button>
      `;

      row.querySelector('.btn-view-history').addEventListener('click', () => {
        restoreDiagnosis(item.problem, item.diagnosis);
      });

      sessionHistoryList.appendChild(row);
    });
  }

  function clearSession() {
    sessionHistory = [];
    sessionStorage.removeItem('it_assistant_session_history');
    renderSessionHistory();
  }

  function restoreDiagnosis(problem, diagnosis) {
    currentOriginalProblem = problem;
    problemInput.value = problem;
    updateCharCount();
    renderDiagnosis(diagnosis);
    resetFeedbackViews();
  }

  // ==========================================================================
  // Helper & UI State Functions
  // ==========================================================================

  function updateCharCount() {
    const count = problemInput.value.length;
    charCount.textContent = `${count} character${count === 1 ? '' : 's'}`;

    if (count === 0) {
      charHint.textContent = 'Tip: Adding error messages or recent changes helps!';
      charHint.style.color = 'var(--text-muted)';
    } else if (count < 15) {
      charHint.textContent = 'Please enter a bit more detail for accurate troubleshooting.';
      charHint.style.color = 'var(--text-muted)';
    } else if (count < 60) {
      charHint.textContent = '✓ Good description. Ready to analyze!';
      charHint.style.color = 'var(--subheading-pink)';
    } else {
      charHint.textContent = '✓ Excellent detail! This provides great context for diagnosis.';
      charHint.style.color = 'var(--primary-pink)';
    }
  }

  function showError(msg) {
    errorMessage.textContent = msg;
    errorBanner.classList.remove('hidden');
    errorBanner.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  function hideError() {
    errorBanner.classList.add('hidden');
    errorMessage.textContent = '';
  }

  function startLoading(message = 'Analyzing your IT problem...') {
    hideError();
    resultsContainer.classList.add('hidden');
    loadingState.classList.remove('hidden');
    submitBtn.disabled = true;
    clearBtn.disabled = true;

    let phraseIndex = 0;
    loadingMessage.textContent = message;
    loadingSubMessage.textContent = loadingPhrases[0].sub;

    loadingInterval = setInterval(() => {
      phraseIndex = (phraseIndex + 1) % loadingPhrases.length;
      loadingMessage.textContent = loadingPhrases[phraseIndex].title;
      loadingSubMessage.textContent = loadingPhrases[phraseIndex].sub;
    }, 2200);

    loadingState.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  function stopLoading() {
    if (loadingInterval) {
      clearInterval(loadingInterval);
      loadingInterval = null;
    }
    loadingState.classList.add('hidden');
    submitBtn.disabled = false;
    clearBtn.disabled = false;
  }

  function resetFeedbackViews() {
    feedbackPromptView.classList.remove('hidden');
    feedbackSuccessView.classList.add('hidden');
    feedbackFollowUpView.classList.add('hidden');
    followUpInput.value = '';
  }

  function resetAll() {
    problemInput.value = '';
    updateCharCount();
    hideError();
    resultsContainer.classList.add('hidden');
    stopLoading();
    resetFeedbackViews();
    problemInput.focus();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // ==========================================================================
  // Render Diagnosis Results
  // ==========================================================================

  function renderDiagnosis(data) {
    currentDiagnosisData = data;

    // 1. Demo notice
    if (data.isDemo && data.demoNotice) {
      demoNoticeText.textContent = data.demoNotice;
      demoNoticeBox.classList.remove('hidden');
    } else {
      demoNoticeBox.classList.add('hidden');
    }

    // 2. Category Badge
    const category = data.category || 'Software';
    categoryText.textContent = category;
    categoryIcon.innerHTML = ICONS[category] || ICONS.Software;

    // 3. Severity Badge
    const severity = (data.severity || 'Medium').toLowerCase();
    severityBadge.className = `badge badge-severity ${severity}`;
    severityText.textContent = `${data.severity || 'Medium'} Severity`;

    // 4. Summary
    summaryText.textContent = data.summary || 'Here are the findings and suggested steps for your problem.';

    // 5. Possible Causes
    possibleCausesList.innerHTML = '';
    if (Array.isArray(data.possibleCauses) && data.possibleCauses.length > 0) {
      data.possibleCauses.forEach(cause => {
        const li = document.createElement('li');
        li.className = 'cause-item';
        li.innerHTML = `<span class="cause-bullet">&bull;</span> <span>${escapeHtml(cause)}</span>`;
        possibleCausesList.appendChild(li);
      });
    }

    // 6. Troubleshooting Steps with Interactive Progress Bar
    troubleshootingStepsList.innerHTML = '';
    const steps = Array.isArray(data.troubleshootingSteps) ? data.troubleshootingSteps : [];
    let completedSteps = 0;

    function updateStepProgressUI() {
      const total = steps.length;
      const percent = total > 0 ? Math.round((completedSteps / total) * 100) : 0;
      stepProgress.textContent = `Step ${completedSteps} of ${total} completed (${percent}%)`;
      troubleshootProgressFill.style.width = `${percent}%`;
    }

    steps.forEach((step, index) => {
      const stepEl = document.createElement('div');
      stepEl.className = 'step-card';
      stepEl.setAttribute('role', 'checkbox');
      stepEl.setAttribute('aria-checked', 'false');
      stepEl.tabIndex = 0;

      stepEl.innerHTML = `
        <div class="step-number-bubble">${step.stepNumber || index + 1}</div>
        <div class="step-info">
          <h4 class="step-title">${escapeHtml(step.title || `Step ${index + 1}`)}</h4>
          <p class="step-desc">${escapeHtml(step.instruction || '')}</p>
        </div>
        <div class="step-check-mark">
          ${CHECK_ICON}
        </div>
      `;

      function toggleStep() {
        const isCompleted = stepEl.classList.toggle('completed');
        stepEl.setAttribute('aria-checked', isCompleted ? 'true' : 'false');
        completedSteps += isCompleted ? 1 : -1;
        updateStepProgressUI();
      }

      stepEl.addEventListener('click', toggleStep);
      stepEl.addEventListener('keydown', (e) => {
        if (e.key === ' ' || e.key === 'Enter') {
          e.preventDefault();
          toggleStep();
        }
      });

      troubleshootingStepsList.appendChild(stepEl);
    });

    updateStepProgressUI();

    // 7. Prevention Tips
    preventionList.innerHTML = '';
    if (Array.isArray(data.preventionTips) && data.preventionTips.length > 0) {
      data.preventionTips.forEach(tip => {
        const li = document.createElement('li');
        li.className = 'tip-item';
        li.innerHTML = `<span class="tip-item-icon">💡</span> <span>${escapeHtml(tip)}</span>`;
        preventionList.appendChild(li);
      });
    }

    // 8. Follow-up Questions
    followUpList.innerHTML = '';
    if (Array.isArray(data.followUpQuestions) && data.followUpQuestions.length > 0) {
      data.followUpQuestions.forEach(q => {
        const li = document.createElement('li');
        li.className = 'followup-item';
        li.innerHTML = `<span class="followup-item-icon">💬</span> <span>${escapeHtml(q)}</span>`;
        followUpList.appendChild(li);
      });
    }

    // Reset feedback section to prompt view
    resetFeedbackViews();

    // Reveal and scroll smoothly
    resultsContainer.classList.remove('hidden');
    resultsContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // ==========================================================================
  // Event Listeners
  // ==========================================================================

  // Live char count
  problemInput.addEventListener('input', updateCharCount);

  // Submit on Ctrl+Enter in problem input
  problemInput.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      supportForm.dispatchEvent(new Event('submit'));
    }
  });

  // Example cards click
  exampleCards.forEach(card => {
    const clickHandler = () => {
      const text = card.getAttribute('data-text');
      if (text) {
        problemInput.value = text;
        updateCharCount();
        problemInput.focus();
        hideError();
        problemInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    };

    card.addEventListener('click', clickHandler);
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        clickHandler();
      }
    });
  });

  // Clear button & New problem buttons
  clearBtn.addEventListener('click', resetAll);
  startNewTopBtn.addEventListener('click', resetAll);
  startNewBottomBtn.addEventListener('click', resetAll);
  successNewProblemBtn.addEventListener('click', resetAll);

  // Scroll to top button
  scrollToTopBtn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  // Clear Session button
  clearSessionBtn.addEventListener('click', () => {
    if (confirm('Clear all recent problems from your current session?')) {
      clearSession();
    }
  });

  // Main Form Submission
  supportForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const problem = problemInput.value.trim();

    if (!problem) {
      showError('Please write a brief description of the technical issue you are experiencing.');
      problemInput.focus();
      return;
    }

    if (problem.length < 5) {
      showError('Please provide a little more detail so we can accurately diagnose the problem.');
      problemInput.focus();
      return;
    }

    currentOriginalProblem = problem;
    startLoading('Analyzing your IT problem...');

    try {
      const response = await fetch('/api/diagnose', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ problem })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `Server responded with status ${response.status}`);
      }

      stopLoading();
      renderDiagnosis(data);
      addProblemToSession(problem, data);
    } catch (err) {
      console.error('Request failed:', err);
      stopLoading();
      showError(err.message || 'Unable to connect to the assistant server. Please verify your connection.');
    }
  });

  // ==========================================================================
  // "Did this solve your problem?" Feedback Flow
  // ==========================================================================

  // Yes button -> Show celebration state
  feedbackYesBtn.addEventListener('click', () => {
    feedbackPromptView.classList.add('hidden');
    feedbackSuccessView.classList.remove('hidden');
    feedbackFollowUpView.classList.add('hidden');
    feedbackSuccessView.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  });

  // No button -> Show follow-up question input
  feedbackNoBtn.addEventListener('click', () => {
    feedbackPromptView.classList.add('hidden');
    feedbackSuccessView.classList.add('hidden');
    feedbackFollowUpView.classList.remove('hidden');
    followUpInput.focus();
    feedbackFollowUpView.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  });

  // Cancel follow-up -> return to prompt view
  cancelFollowUpBtn.addEventListener('click', () => {
    feedbackPromptView.classList.remove('hidden');
    feedbackFollowUpView.classList.add('hidden');
  });

  // Submit on Ctrl+Enter in follow-up input
  followUpInput.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      followUpForm.dispatchEvent(new Event('submit'));
    }
  });

  // Submit Follow-Up Form -> Context-aware request
  followUpForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const followUpText = followUpInput.value.trim();

    if (!followUpText) {
      followUpInput.focus();
      return;
    }

    startLoading('Digging deeper into your problem with previous context...');

    const previousContext = {
      originalProblem: currentOriginalProblem || problemInput.value.trim(),
      category: currentDiagnosisData?.category || 'Software',
      attemptedSteps: Array.isArray(currentDiagnosisData?.troubleshootingSteps)
        ? currentDiagnosisData.troubleshootingSteps.map(s => s.title)
        : []
    };

    try {
      const response = await fetch('/api/diagnose', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          problem: followUpText,
          previousContext: previousContext
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `Server responded with status ${response.status}`);
      }

      stopLoading();
      renderDiagnosis(data);
      addProblemToSession(`Follow-up: ${followUpText}`, data);
    } catch (err) {
      console.error('Follow-up request failed:', err);
      stopLoading();
      showError(err.message || 'Unable to submit follow-up. Please try again.');
    }
  });

  // Initialize
  updateCharCount();
  loadSessionHistory();
});
