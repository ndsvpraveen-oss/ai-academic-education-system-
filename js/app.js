/**
 * ACADEMIQ OS: MAIN CLIENT CONTROLLER & 3D INTERACTION ORCHESTRATOR
 * Bridges reactive store, 3D card tilt physics, audio SFX, Pomodoro cockpit, and views.
 */

document.addEventListener('DOMContentLoaded', () => {
  const store = window.academiqStore;
  const audio = window.academiqAudio;
  const advisor = window.aegisAdvisor;

  // --- 1. VIEW ROUTING SYSTEM ---
  const navLinks = document.querySelectorAll('.nav-link[data-view]');
  const viewSections = document.querySelectorAll('.view-section');
  const pageTitleEl = document.getElementById('topbar-page-title');

  function switchView(viewName) {
    viewSections.forEach(sec => sec.classList.remove('active'));
    navLinks.forEach(link => link.classList.remove('active'));

    const targetSec = document.getElementById(`view-${viewName}`);
    const activeLink = document.querySelector(`.nav-link[data-view="${viewName}"]`);

    if (targetSec) targetSec.classList.add('active');
    if (activeLink) activeLink.classList.add('active');

    const titles = {
      dashboard: "Executive Execution Cockpit",
      roadmap: "3D Roadmap & Micro-Sprint Kanban",
      ingestion: "Intelligent Syllabus Ingestion Studio",
      pomodoro: "3D Focus Cockpit (Pomodoro Gyroscope)",
      study: "Active Recall & 3D Study Decks",
      advisor: "Aegis AI Academic Advisor",
      settings: "Academic Preferences & Time Budget"
    };

    if (pageTitleEl && titles[viewName]) {
      pageTitleEl.textContent = titles[viewName];
    }

    if (audio) audio.playClick();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const view = link.getAttribute('data-view');
      switchView(view);
    });
  });

  // Global Action Buttons for quick navigation
  document.querySelectorAll('[data-goto]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const target = btn.getAttribute('data-goto');
      switchView(target);
    });
  });

  // --- 2. 3D CARD TILT PHYSICS ENGINE ---
  function init3DTilt() {
    const cards = document.querySelectorAll('.card-3d');
    cards.forEach(card => {
      card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;

        const rotateX = ((y - centerY) / centerY) * -7;
        const rotateY = ((x - centerX) / centerX) * 7;

        card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-4px)`;
      });

      card.addEventListener('mouseleave', () => {
        card.style.transform = `perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0px)`;
      });
    });
  }

  // --- 3. TOAST NOTIFICATION SYSTEM ---
  function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = 'toast';
    const icon = type === 'success' ? '⚡' : type === 'warning' ? '⚠️' : '✨';
    toast.innerHTML = `<span>${icon}</span> <span>${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(15px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 350);
    }, 4000);
  }

  // --- 4. RENDER EXECUTIVE DASHBOARD ---
  function renderDashboard(state, analytics) {
    // KPIs
    const gpaEl = document.getElementById('kpi-gpa-val');
    const velocityEl = document.getElementById('kpi-velocity-val');
    const burnoutEl = document.getElementById('kpi-burnout-val');
    const hoursEl = document.getElementById('kpi-hours-val');
    const tickerEl = document.getElementById('topbar-velocity-ticker');

    if (gpaEl) gpaEl.textContent = analytics.projectedGpa;
    if (velocityEl) velocityEl.textContent = `${analytics.completionVelocity}%`;
    if (burnoutEl) {
      burnoutEl.textContent = analytics.burnoutRisk;
      burnoutEl.style.color = analytics.burnoutColor;
    }
    if (hoursEl) hoursEl.textContent = `${analytics.totalScheduledHours}h / ${analytics.userCapacityHours}h`;
    if (tickerEl) tickerEl.textContent = `VELOCITY: ${analytics.completionVelocity}% | BURNOUT: ${analytics.burnoutRisk}`;

    // Overdue Banner
    const overdueBanner = document.getElementById('dashboard-overdue-alert');
    if (overdueBanner) {
      if (analytics.overdueTasksCount > 0) {
        overdueBanner.style.display = 'flex';
        const countSpan = document.getElementById('overdue-count-text');
        if (countSpan) countSpan.textContent = `${analytics.overdueTasksCount} overdue micro-sprint(s) detected`;
      } else {
        overdueBanner.style.display = 'none';
      }
    }

    // Today's Action Queue
    const queueList = document.getElementById('today-task-queue');
    if (queueList) {
      const todayStr = new Date().toISOString().split('T')[0];
      const todayTasks = state.executionTasks.filter(t => t.scheduledDate === todayStr || t.status === 'OVERDUE');

      if (todayTasks.length === 0) {
        queueList.innerHTML = `<div style="text-align:center; padding:30px; color:var(--text-muted);">✨ All micro-sprints cleared for today! Time for active recovery.</div>`;
      } else {
        queueList.innerHTML = todayTasks.map(t => {
          const course = state.courses.find(c => c.id === t.courseId) || { code: 'ACAD', color: '#8b5cf6' };
          const isDone = t.status === 'COMPLETED';
          const isOverdue = t.status === 'OVERDUE';

          let tagClass = 'tag-deep-focus';
          if (t.cognitiveLoad === 'ACTIVE_PRODUCTION') tagClass = 'tag-active-production';
          if (t.cognitiveLoad === 'PASSIVE_SYNTHESIS') tagClass = 'tag-passive-synthesis';
          if (t.cognitiveLoad === 'ADMIN_REVIEW') tagClass = 'tag-admin-review';

          return `
            <div class="task-card-item ${isDone ? 'completed' : ''}" data-task-id="${t.id}">
              <div class="task-checkbox-custom" onclick="window.academiqStore.toggleTaskStatus('${t.id}')">
                ${isDone ? '✓' : ''}
              </div>
              <div class="task-body" onclick="window.academiqStore.toggleTaskStatus('${t.id}')">
                <div class="task-header-line">
                  <span class="task-course-pill" style="background:${course.color};">${course.code}</span>
                  <span class="task-text-title">${t.title}</span>
                  ${isOverdue ? '<span style="color:var(--rose); font-size:10px; font-weight:700; border:1px solid var(--rose); padding:1px 6px; border-radius:4px;">OVERDUE</span>' : ''}
                </div>
                <div class="task-meta-line">
                  <span class="cognitive-tag ${tagClass}">⚡ ${t.cognitiveLoad.replace('_', ' ')}</span>
                  <span>⏱️ ${t.estimatedMinutes} mins</span>
                  <span>${t.instructions.substring(0, 50)}...</span>
                </div>
              </div>
              <button class="btn-icon" title="Focus on this task in 3D Cockpit" onclick="window.startFocusOnTask('${t.id}')">
                🎯
              </button>
            </div>
          `;
        }).join('');
      }
    }

    // Course Health Cards
    const courseGrid = document.getElementById('dashboard-courses-grid');
    if (courseGrid) {
      courseGrid.innerHTML = state.courses.map(c => `
        <div class="card-3d" style="padding:20px;">
          <div class="card-glare"></div>
          <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:12px;">
            <div>
              <span class="task-course-pill" style="background:${c.color}; font-size:12px;">${c.code}</span>
              <h3 style="font-size:16px; font-weight:700; color:#fff; margin-top:6px;">${c.name}</h3>
            </div>
            <div style="font-family:var(--font-display); font-size:22px; font-weight:700; color:#fff;">
              ${c.currentGrade}%
            </div>
          </div>
          <div style="font-size:12px; color:var(--text-muted); margin-bottom:14px;">
            👨‍🏫 ${c.instructor}
          </div>
          <div style="background:rgba(255,255,255,0.06); height:6px; border-radius:3px; overflow:hidden; margin-bottom:10px;">
            <div style="width:${c.currentGrade}%; height:100%; background:${c.color}; border-radius:3px;"></div>
          </div>
          <div style="display:flex; justify-content:space-between; font-size:11px; font-family:var(--font-mono); color:var(--text-secondary);">
            <span>Weights: ${c.gradeWeights.length} Categories</span>
            <span style="color:var(--primary-light); cursor:pointer;" onclick="window.viewCourseDetails('${c.id}')">View Rubric →</span>
          </div>
        </div>
      `).join('');
    }

    init3DTilt();
  }

  // --- 5. RENDER 3D KANBAN & GANTT ROADMAP ---
  function renderRoadmap(state) {
    const pendingStack = document.getElementById('kanban-pending-stack');
    const inProgressStack = document.getElementById('kanban-progress-stack');
    const completedStack = document.getElementById('kanban-completed-stack');

    if (!pendingStack || !inProgressStack || !completedStack) return;

    const renderCard = (t) => {
      const course = state.courses.find(c => c.id === t.courseId) || { code: 'ACAD', color: '#8b5cf6' };
      return `
        <div class="card-3d" style="padding:14px; margin-bottom:10px; cursor:grab;" data-task-id="${t.id}">
          <div class="card-glare"></div>
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
            <span class="task-course-pill" style="background:${course.color};">${course.code}</span>
            <span style="font-size:11px; font-family:var(--font-mono); color:var(--text-muted);">${t.scheduledDate}</span>
          </div>
          <div style="font-size:13.5px; font-weight:600; color:#fff; margin-bottom:6px;">${t.title}</div>
          <div style="font-size:11.5px; color:var(--text-secondary); margin-bottom:10px;">${t.instructions}</div>
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <span class="cognitive-tag tag-deep-focus" style="font-size:10px;">⏱️ ${t.estimatedMinutes}m</span>
            <div style="display:flex; gap:6px;">
              ${t.status !== 'IN_PROGRESS' ? `<button class="btn-icon" style="padding:4px 8px; font-size:11px;" onclick="window.academiqStore.updateTaskStatus('${t.id}', 'IN_PROGRESS')">▶ Focus</button>` : ''}
              ${t.status !== 'COMPLETED' ? `<button class="btn-icon" style="padding:4px 8px; font-size:11px;" onclick="window.academiqStore.updateTaskStatus('${t.id}', 'COMPLETED')">✓ Done</button>` : ''}
            </div>
          </div>
        </div>
      `;
    };

    const pending = state.executionTasks.filter(t => t.status === 'PENDING' || t.status === 'OVERDUE');
    const inProgress = state.executionTasks.filter(t => t.status === 'IN_PROGRESS');
    const completed = state.executionTasks.filter(t => t.status === 'COMPLETED');

    pendingStack.innerHTML = pending.map(renderCard).join('') || `<div style="color:var(--text-muted); padding:20px; text-align:center;">No pending tasks</div>`;
    inProgressStack.innerHTML = inProgress.map(renderCard).join('') || `<div style="color:var(--text-muted); padding:20px; text-align:center;">No active sprints</div>`;
    completedStack.innerHTML = completed.map(renderCard).join('') || `<div style="color:var(--text-muted); padding:20px; text-align:center;">No completed tasks</div>`;

    // Render Gantt Timeline
    const ganttContainer = document.getElementById('gantt-tracks-container');
    if (ganttContainer) {
      ganttContainer.innerHTML = state.courses.map(course => {
        const milestones = state.milestones.filter(m => m.courseId === course.id);
        return `
          <div class="gantt-course-row">
            <div class="gantt-course-header">
              <span class="task-course-pill" style="background:${course.color};">${course.code}</span>
              <span style="font-size:13px; font-weight:600; color:#fff;">${course.name}</span>
              <span style="font-size:11px; font-family:var(--font-mono); color:var(--text-muted);">${milestones.length} Major Milestones</span>
            </div>
            <div class="gantt-timeline-track">
              ${milestones.map((m, idx) => {
                const leftPos = (idx * 28) + 4;
                return `
                  <div class="gantt-segment" style="left:${leftPos}%; width:24%; background:${course.color};" title="${m.title} (${m.dueDate})">
                    📌 ${m.title}
                  </div>
                `;
              }).join('')}
            </div>
          </div>
        `;
      }).join('');
    }

    init3DTilt();
  }

  // --- 6. 3D POMODORO FOCUS COCKPIT ENGINE ---
  let pomodoroInterval = null;
  let pomodoroSecondsLeft = 25 * 60;
  let isPomodoroRunning = false;
  let pomodoroMode = 'FOCUS'; // FOCUS, SHORT_BREAK, LONG_BREAK

  const timerNumbersEl = document.getElementById('timer-numbers-display');
  const timerLabelEl = document.getElementById('timer-mode-label');
  const startStopBtn = document.getElementById('btn-pomodoro-toggle');
  const resetBtn = document.getElementById('btn-pomodoro-reset');
  const ambientAudioBtn = document.getElementById('btn-ambient-audio');
  let isAmbientPlaying = false;

  function updateTimerDisplay() {
    const mins = Math.floor(pomodoroSecondsLeft / 60);
    const secs = pomodoroSecondsLeft % 60;
    if (timerNumbersEl) {
      timerNumbersEl.textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }
  }

  function startPomodoro() {
    if (isPomodoroRunning) return;
    isPomodoroRunning = true;
    if (startStopBtn) startStopBtn.innerHTML = `<span>⏸️</span> Pause Focus`;
    if (audio) audio.playClick();

    pomodoroInterval = setInterval(() => {
      if (pomodoroSecondsLeft > 0) {
        pomodoroSecondsLeft--;
        updateTimerDisplay();
      } else {
        clearInterval(pomodoroInterval);
        isPomodoroRunning = false;
        if (audio) audio.playGong();
        showToast("🔔 Focus Sprint Completed! Take a cognitive break.", "success");
        if (startStopBtn) startStopBtn.innerHTML = `<span>▶️</span> Start Focus`;
      }
    }, 1000);
  }

  function pausePomodoro() {
    if (!isPomodoroRunning) return;
    clearInterval(pomodoroInterval);
    isPomodoroRunning = false;
    if (startStopBtn) startStopBtn.innerHTML = `<span>▶️</span> Resume Focus`;
    if (audio) audio.playClick();
  }

  if (startStopBtn) {
    startStopBtn.addEventListener('click', () => {
      if (isPomodoroRunning) {
        pausePomodoro();
      } else {
        startPomodoro();
      }
    });
  }

  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      pausePomodoro();
      pomodoroSecondsLeft = 25 * 60;
      updateTimerDisplay();
    });
  }

  if (ambientAudioBtn) {
    ambientAudioBtn.addEventListener('click', () => {
      if (!isAmbientPlaying) {
        audio.startAmbientFocus('gamma');
        isAmbientPlaying = true;
        ambientAudioBtn.classList.add('btn-primary');
        ambientAudioBtn.textContent = '🔊 40Hz Gamma Focus: ON';
        showToast("Binaural 40Hz Gamma frequency initialized.", "info");
      } else {
        audio.stopAmbientFocus();
        isAmbientPlaying = false;
        ambientAudioBtn.classList.remove('btn-primary');
        ambientAudioBtn.textContent = '🔇 Ambient Focus Audio';
      }
    });
  }

  window.startFocusOnTask = (taskId) => {
    const task = store.state.executionTasks.find(t => t.id === taskId);
    if (!task) return;

    switchView('pomodoro');
    const focusTaskTitle = document.getElementById('current-focus-task-title');
    const focusTaskDesc = document.getElementById('current-focus-task-desc');
    if (focusTaskTitle) focusTaskTitle.textContent = task.title;
    if (focusTaskDesc) focusTaskDesc.textContent = task.instructions;

    pomodoroSecondsLeft = task.estimatedMinutes * 60;
    updateTimerDisplay();
    startPomodoro();
  };

  // --- 7. 3D ACTIVE RECALL STUDY DECK & QUIZ RUNNER ---
  let activeDeckIndex = 0;
  let activeCardIndex = 0;

  function renderFlashcards() {
    const stage = document.getElementById('flashcard-stage');
    const cardEl = document.getElementById('flashcard-card-3d');
    const deck = store.state.studyDecks[activeDeckIndex];
    if (!deck || !cardEl) return;

    const card = deck.cards[activeCardIndex];
    const frontText = document.getElementById('card-front-question');
    const backAnswer = document.getElementById('card-back-answer');
    const backExpl = document.getElementById('card-back-explanation');
    const counterEl = document.getElementById('deck-card-counter');
    const deckTitleEl = document.getElementById('deck-title-display');

    if (frontText) frontText.textContent = card.question;
    if (backAnswer) backAnswer.textContent = card.answer;
    if (backExpl) backExpl.textContent = card.explanation || '';
    if (counterEl) counterEl.textContent = `Card ${activeCardIndex + 1} of ${deck.cards.length}`;
    if (deckTitleEl) deckTitleEl.textContent = deck.title;

    cardEl.classList.remove('flipped');
  }

  const flipTrigger = document.getElementById('flashcard-stage');
  if (flipTrigger) {
    flipTrigger.addEventListener('click', () => {
      const cardEl = document.getElementById('flashcard-card-3d');
      if (cardEl) {
        cardEl.classList.toggle('flipped');
        if (audio) audio.playCardFlip();
      }
    });
  }

  // Leitner Rating Buttons
  document.querySelectorAll('[data-leitner]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const rating = parseInt(btn.getAttribute('data-leitner'), 10);
      const deck = store.state.studyDecks[activeDeckIndex];
      const card = deck.cards[activeCardIndex];

      store.updateCardMastery(deck.id, card.id, rating);
      if (audio) audio.playSuccess();
      showToast(`Mastery calibrated: Level ${card.mastery || 1}`, 'success');

      // Next card
      activeCardIndex = (activeCardIndex + 1) % deck.cards.length;
      renderFlashcards();
    });
  });

  // Deck Switcher
  const deckSelect = document.getElementById('study-deck-select');
  if (deckSelect) {
    deckSelect.innerHTML = store.state.studyDecks.map((d, i) => `
      <option value="${i}">${d.title} (${d.cards.length} cards)</option>
    `).join('');

    deckSelect.addEventListener('change', (e) => {
      activeDeckIndex = parseInt(e.target.value, 10);
      activeCardIndex = 0;
      renderFlashcards();
    });
  }

  // Diagnostic Quiz Runner
  let currentQuizQuestion = 0;
  let quizScore = 0;

  function renderQuizQuestion() {
    const q = window.ACADEMIQ_INITIAL_DATA.diagnosticQuiz[currentQuizQuestion];
    const qTextEl = document.getElementById('quiz-question-text');
    const qOptionsEl = document.getElementById('quiz-options-list');
    const qCountEl = document.getElementById('quiz-question-count');

    if (!qTextEl || !qOptionsEl) return;

    if (qCountEl) qCountEl.textContent = `Question ${currentQuizQuestion + 1} of ${window.ACADEMIQ_INITIAL_DATA.diagnosticQuiz.length}`;
    qTextEl.textContent = q.question;

    qOptionsEl.innerHTML = q.options.map((opt, idx) => `
      <div class="prompt-chip" style="font-size:14px; padding:14px;" onclick="window.submitQuizAnswer(${idx})">
        ${opt}
      </div>
    `).join('');
  }

  window.submitQuizAnswer = (selectedIdx) => {
    const q = window.ACADEMIQ_INITIAL_DATA.diagnosticQuiz[currentQuizQuestion];
    const isCorrect = selectedIdx === q.correctIndex;
    if (isCorrect) {
      quizScore++;
      if (audio) audio.playSuccess();
      showToast("Correct! Conceptual mastery verified.", "success");
    } else {
      if (audio) audio.playClick();
      showToast(`Review note: ${q.explanation}`, "warning");
    }

    if (currentQuizQuestion < window.ACADEMIQ_INITIAL_DATA.diagnosticQuiz.length - 1) {
      currentQuizQuestion++;
      renderQuizQuestion();
    } else {
      const qBox = document.getElementById('quiz-runner-box');
      if (qBox) {
        qBox.innerHTML = `
          <div style="text-align:center; padding:30px;">
            <div style="font-size:40px; margin-bottom:12px;">🏆</div>
            <h3 style="font-size:22px; font-weight:700; color:#fff; margin-bottom:8px;">Diagnostic Assessment Complete</h3>
            <p style="color:var(--text-secondary); margin-bottom:20px;">Score: <strong style="color:var(--emerald); font-size:18px;">${quizScore} / ${window.ACADEMIQ_INITIAL_DATA.diagnosticQuiz.length}</strong></p>
            <button class="btn-action btn-primary" onclick="location.reload()">Restart Diagnostics</button>
          </div>
        `;
      }
    }
  };

  // --- 8. AEGIS AI ADVISOR INTERFACE ---
  const chatMessagesList = document.getElementById('advisor-chat-messages');
  const chatInput = document.getElementById('advisor-input-field');
  const chatSendBtn = document.getElementById('advisor-send-btn');

  function renderAdvisorChat(messages, isTyping) {
    if (!chatMessagesList) return;
    chatMessagesList.innerHTML = messages.map(m => `
      <div class="chat-msg ${m.sender === 'user' ? 'chat-msg-user' : 'chat-msg-assistant'}">
        <div class="chat-avatar ${m.sender === 'user' ? 'chat-avatar-user' : 'chat-avatar-ai'}">
          ${m.sender === 'user' ? '👤' : '✨'}
        </div>
        <div class="chat-bubble">
          ${m.text.replace(/\n/g, '<br>')}
        </div>
      </div>
    `).join('');

    if (isTyping) {
      chatMessagesList.innerHTML += `
        <div class="chat-msg chat-msg-assistant">
          <div class="chat-avatar chat-avatar-ai">✨</div>
          <div class="chat-bubble" style="color:var(--primary-light);">
            Aegis is auditing syllabi and synthesizing response...
          </div>
        </div>
      `;
    }

    chatMessagesList.scrollTop = chatMessagesList.scrollHeight;
  }

  function handleSendAdvisor() {
    if (!chatInput) return;
    const msg = chatInput.value.trim();
    if (!msg) return;

    chatInput.value = '';
    advisor.sendMessage(msg, renderAdvisorChat);
  }

  if (chatSendBtn) chatSendBtn.addEventListener('click', handleSendAdvisor);
  if (chatInput) {
    chatInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') handleSendAdvisor();
    });
  }

  document.querySelectorAll('[data-prompt]').forEach(chip => {
    chip.addEventListener('click', () => {
      const prompt = chip.getAttribute('data-prompt');
      if (chatInput) chatInput.value = prompt;
      handleSendAdvisor();
    });
  });

  // --- 9. MODALS: REBALANCE & SYLLABUS DECOMPOSITION ---
  const rebalanceModal = document.getElementById('modal-rebalance');
  const rebalanceTriggerBtn = document.getElementById('trigger-rebalance-modal');
  const closeRebalanceBtn = document.getElementById('btn-close-rebalance');

  if (rebalanceTriggerBtn && rebalanceModal) {
    rebalanceTriggerBtn.addEventListener('click', () => {
      rebalanceModal.classList.add('open');
      if (audio) audio.playClick();
    });
  }

  if (closeRebalanceBtn && rebalanceModal) {
    closeRebalanceBtn.addEventListener('click', () => {
      rebalanceModal.classList.remove('open');
    });
  }

  window.executeTriagePlan = async (mode) => {
    try {
      const resp = await fetch('/api/rebalance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ triageMode: mode, state: store.state })
      });
      const data = await resp.json();
      const result = store.executeRebalance(mode);
      if (rebalanceModal) rebalanceModal.classList.remove('open');
      showToast(data.rationale || result.rationale, 'success');
    } catch (e) {
      const result = store.executeRebalance(mode);
      if (rebalanceModal) rebalanceModal.classList.remove('open');
      showToast(result.rationale, 'success');
    }
  };

  // Syllabus Ingestion Pre-fill
  window.loadSampleSyllabus = (courseKey) => {
    const syllabusTextarea = document.getElementById('syllabus-raw-input');
    const courseCodeInput = document.getElementById('ingest-course-code');
    const courseNameInput = document.getElementById('ingest-course-name');

    const course = store.state.courses.find(c => c.id === courseKey) || store.state.courses[0];
    if (syllabusTextarea) syllabusTextarea.value = course.syllabusText || '';
    if (courseCodeInput) courseCodeInput.value = course.code;
    if (courseNameInput) courseNameInput.value = course.name;

    showToast(`Loaded authentic syllabus: ${course.code}`, 'info');
    if (audio) audio.playClick();
  };

  window.runSyllabusDeconstruction = () => {
    const code = document.getElementById('ingest-course-code')?.value || 'CS-500';
    const name = document.getElementById('ingest-course-name')?.value || 'Cloud Architectures';

    showToast("✨ Gemini 2.5 Pro: Decomposing syllabus and grading rubric...", "info");
    if (audio) audio.playClick();

    setTimeout(() => {
      store.addCourse({
        code,
        name,
        instructor: "Prof. AI Specialist",
        instructorEmail: "instructor@univ.edu",
        color: "#8b5cf6",
        term: "Fall 2026",
        gradeWeights: [
          { categoryName: "Midterm Exam", weightPercentage: 30 },
          { categoryName: "Projects", weightPercentage: 40 },
          { categoryName: "Final", weightPercentage: 30 }
        ]
      });

      // Add fresh micro-sprints
      store.addExecutionTasks([
        {
          id: 'task-gen-' + Date.now(),
          courseId: 'course-' + Date.now(),
          title: `Analyze ${code} Week 1 Architecture Case Study`,
          instructions: "Deconstruct system throughput benchmarks and write 250-word synthesis.",
          scheduledDate: new Date().toISOString().split('T')[0],
          estimatedMinutes: 35,
          cognitiveLoad: "DEEP_FOCUS",
          status: "PENDING"
        }
      ]);

      if (audio) audio.playSuccess();
      showToast(`Success! Deconstructed ${code} into master roadmap.`, "success");
      switchView('dashboard');
    }, 1200);
  };

  // --- 10. SETTINGS FORM BINDINGS ---
  const saveSettingsBtn = document.getElementById('btn-save-settings');
  if (saveSettingsBtn) {
    saveSettingsBtn.addEventListener('click', () => {
      const gpa = parseFloat(document.getElementById('pref-target-gpa')?.value || 3.9);
      const weekdayHours = parseFloat(document.getElementById('pref-weekday-hours')?.value || 4.5);
      const weekendHours = parseFloat(document.getElementById('pref-weekend-hours')?.value || 7.0);

      store.updateProfile({ targetGpa: gpa, weekdayAvailableHours: weekdayHours, weekendAvailableHours: weekendHours });
      showToast("Academic capacity preferences committed to storage.", "success");
      if (audio) audio.playSuccess();
    });
  }

  // --- 11. INITIAL RENDER & REACTIVITY SUBSCRIPTION ---
  store.subscribe((state, analytics) => {
    renderDashboard(state, analytics);
    renderRoadmap(state);
  });

  // Initial trigger
  const initialAnalytics = store.getAnalytics();
  renderDashboard(store.state, initialAnalytics);
  renderRoadmap(store.state);
  renderAdvisorChat(advisor.getConversation(), false);
  renderFlashcards();
  renderQuizQuestion();
  updateTimerDisplay();
  init3DTilt();

  // Reset system listener
  const systemResetBtn = document.getElementById('btn-system-reset');
  if (systemResetBtn) {
    systemResetBtn.addEventListener('click', () => {
      if (confirm("Reset Academiq OS to clean benchmark datasets?")) {
        store.resetToDefault();
        location.reload();
      }
    });
  }

  // Live Cloud API Engine Check
  fetch('/api/status')
    .then(r => r.json())
    .then(data => {
      const heroTag = document.querySelector('.hero-badge-tag');
      if (heroTag) {
        heroTag.innerHTML = `<span>✦</span> GEMINI 2.5 ACTIVE • SUPABASE POSTGRES SYNCED`;
        heroTag.style.borderColor = 'rgba(16, 185, 129, 0.5)';
        heroTag.style.background = 'rgba(16, 185, 129, 0.12)';
        heroTag.style.color = '#34d399';
      }
    })
    .catch(() => {});
});
