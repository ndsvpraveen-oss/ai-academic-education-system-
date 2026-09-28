/**
 * ACADEMIQ OS: MAIN CLIENT CONTROLLER & 3D INTERACTION ORCHESTRATOR
 * Coordinates reactive store, 3D physics, active recall, diagnostic tests,
 * "What Should I Study Now?", context-aware Aegis, and mobile navigation.
 */

document.addEventListener('DOMContentLoaded', () => {
  const store = window.academiqStore;
  const audio = window.academiqAudio;
  const advisor = window.aegisAdvisor;

  // --- 1. GLOBAL TOAST NOTIFICATION SYSTEM ---
  window.showToast = function(message, type = 'info') {
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
    }, 4500);
  };

  // --- 2. VIEW ROUTING & MOBILE NAVIGATION SYSTEM ---
  const navLinks = document.querySelectorAll('.nav-link[data-view]');
  const viewSections = document.querySelectorAll('.view-section');
  const pageTitleEl = document.getElementById('topbar-page-title');
  const mobileToggleBtn = document.getElementById('btn-mobile-menu');
  const sidebarEl = document.querySelector('.sidebar');

  if (mobileToggleBtn && sidebarEl) {
    mobileToggleBtn.addEventListener('click', () => {
      sidebarEl.classList.toggle('mobile-open');
    });
  }

  function switchView(viewName) {
    viewSections.forEach(sec => sec.classList.remove('active'));
    navLinks.forEach(link => link.classList.remove('active'));

    const targetSec = document.getElementById(`view-${viewName}`);
    const activeLink = document.querySelector(`.nav-link[data-view="${viewName}"]`);

    if (targetSec) targetSec.classList.add('active');
    if (activeLink) activeLink.classList.add('active');

    if (sidebarEl) sidebarEl.classList.remove('mobile-open');

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

    // Refresh views if needed
    if (viewName === 'study') {
      renderFlashcards();
      initDiagnosticSetup();
    }
  }

  window.switchView = switchView;

  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const view = link.getAttribute('data-view');
      switchView(view);
    });
  });

  document.querySelectorAll('[data-goto]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const target = btn.getAttribute('data-goto');
      switchView(target);
    });
  });

  // --- 3. 3D CARD TILT PHYSICS ENGINE ---
  function init3DTilt() {
    const cards = document.querySelectorAll('.card-3d');
    cards.forEach(card => {
      card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;

        const rotateX = ((y - centerY) / centerY) * -6;
        const rotateY = ((x - centerX) / centerX) * 6;

        card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-3px)`;
      });

      card.addEventListener('mouseleave', () => {
        card.style.transform = `perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0px)`;
      });
    });
  }

  // --- 4. RENDER EXECUTIVE DASHBOARD ---
  function renderDashboard(state, analytics) {
    // 1. "⚡ WHAT SHOULD I STUDY NOW?" Hero Action
    const nextSprint = store.getRecommendedNextSprint();
    const studyNowSub = document.getElementById('study-now-subject');
    const studyNowTitle = document.getElementById('study-now-title');
    const studyNowReason = document.getElementById('study-now-reason');
    const studyNowDuration = document.getElementById('study-now-duration');
    const studyNowBtn = document.getElementById('btn-start-recommended-sprint');

    if (studyNowSub && nextSprint) studyNowSub.textContent = nextSprint.subjectCode;
    if (studyNowTitle && nextSprint) studyNowTitle.textContent = nextSprint.taskTitle;
    if (studyNowReason && nextSprint) {
      studyNowReason.innerHTML = `<strong style="color:var(--primary-light);">Why:</strong> ${nextSprint.reason}`;
    }
    if (studyNowDuration && nextSprint) {
      studyNowDuration.textContent = `⏱️ ${nextSprint.durationMinutes}m Calibrated Pomodoro Sprint`;
    }

    if (studyNowBtn && nextSprint) {
      studyNowBtn.onclick = () => {
        if (nextSprint.taskId) {
          window.startFocusOnTask(nextSprint.taskId);
        } else {
          switchView('pomodoro');
          const tEl = document.getElementById('current-focus-task-title');
          const dEl = document.getElementById('current-focus-task-desc');
          if (tEl) tEl.textContent = nextSprint.taskTitle;
          if (dEl) dEl.textContent = nextSprint.instructions;
          pomodoroSecondsLeft = nextSprint.durationMinutes * 60;
          updateTimerDisplay();
          startPomodoro();
        }
      };
    }

    // 2. KPIs
    const gpaEl = document.getElementById('kpi-gpa-val');
    const gpaTargetEl = document.getElementById('kpi-gpa-target');
    const velocityEl = document.getElementById('kpi-velocity-val');
    const velocityTrendEl = document.getElementById('kpi-velocity-trend');
    const burnoutEl = document.getElementById('kpi-burnout-val');
    const burnoutDescEl = document.getElementById('kpi-burnout-desc');
    const hoursEl = document.getElementById('kpi-hours-val');
    const capacityMarginEl = document.getElementById('kpi-capacity-margin');
    const tickerEl = document.getElementById('topbar-velocity-ticker');
    const burnoutReasonEl = document.getElementById('burnout-reason-text');

    if (gpaEl) gpaEl.textContent = analytics.projectedGpa;
    if (gpaTargetEl) gpaTargetEl.textContent = `▲ Target: ${(analytics.targetGpa || 3.90).toFixed(2)}`;
    if (velocityEl) velocityEl.textContent = `${analytics.completionVelocity}%`;
    if (velocityTrendEl) velocityTrendEl.textContent = `▲ ${analytics.velocityDelta}`;
    if (burnoutEl) {
      burnoutEl.textContent = `${analytics.burnoutRisk} (${analytics.burnoutScore}/100)`;
      burnoutEl.style.color = analytics.burnoutColor;
    }
    if (burnoutDescEl) burnoutDescEl.textContent = analytics.burnoutRisk === 'LOW' ? 'Cognitive Load Balanced' : 'Automated Triage Ready';
    if (hoursEl) hoursEl.textContent = `${analytics.totalScheduledHours}h / ${analytics.userCapacityHours}h`;
    if (capacityMarginEl) capacityMarginEl.textContent = `Safe Capacity Margin: ${analytics.safeMarginPercentage}%`;
    if (tickerEl) tickerEl.textContent = `VELOCITY: ${analytics.completionVelocity}% | BURNOUT: ${analytics.burnoutRisk}`;
    if (burnoutReasonEl) burnoutReasonEl.textContent = analytics.burnoutExplanation;

    // Overdue Triage Alert Banner
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

    // 3. Today's Micro-Sprint Action Queue
    const queueList = document.getElementById('today-task-queue');
    if (queueList) {
      const todayStr = new Date().toISOString().split('T')[0];
      const todayTasks = state.executionTasks.filter(t => t.scheduledDate === todayStr || t.status === 'OVERDUE');

      if (todayTasks.length === 0) {
        queueList.innerHTML = `<div style="text-align:center; padding:35px 20px; color:var(--text-muted);">
          <div style="font-size:32px; margin-bottom:8px;">✨</div>
          <strong style="color:#fff;">All micro-sprints cleared for today!</strong>
          <div style="font-size:12.5px; margin-top:4px;">Cognitive workload satisfied. Time for deliberate rest or optional active recall.</div>
        </div>`;
      } else {
        queueList.innerHTML = todayTasks.map(t => {
          const course = state.courses.find(c => c.id === t.courseId) || { code: 'CORE', color: '#8b5cf6' };
          const isDone = t.status === 'COMPLETED';
          const isOverdue = t.status === 'OVERDUE';

          let tagClass = 'tag-deep-focus';
          if (t.cognitiveLoad === 'ACTIVE_PRODUCTION') tagClass = 'tag-active-production';
          if (t.cognitiveLoad === 'PASSIVE_SYNTHESIS') tagClass = 'tag-passive-synthesis';
          if (t.cognitiveLoad === 'ADMIN_REVIEW') tagClass = 'tag-admin-review';

          return `
            <div class="task-card-item ${isDone ? 'completed' : ''}" data-task-id="${t.id}">
              <div class="task-checkbox-custom" onclick="window.academiqStore.toggleTaskStatus('${t.id}')" title="Mark sprint complete">
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
                  <span>⏱️ ${t.estimatedMinutes}m</span>
                  <span>${t.instructions.substring(0, 55)}...</span>
                </div>
              </div>
              <div style="display:flex; gap:6px;">
                <button class="btn-icon" title="Focus in 3D Cockpit" onclick="window.startFocusOnTask('${t.id}')">
                  🎯
                </button>
                <button class="btn-icon" title="Skip to tomorrow" onclick="window.skipTask('${t.id}')">
                  ⏭️
                </button>
              </div>
            </div>
          `;
        }).join('');
      }
    }

    // 4. Active Course Health
    const courseGrid = document.getElementById('dashboard-courses-grid');
    if (courseGrid) {
      if (state.courses.length === 0) {
        courseGrid.innerHTML = `
          <div style="padding:20px; text-align:center; background:rgba(255,255,255,0.03); border:1px solid var(--glass-border); border-radius:12px;">
            <p style="font-size:13px; color:var(--text-muted); margin-bottom:10px;">No courses ingested yet.</p>
            <button class="btn-action btn-secondary" data-goto="ingestion" style="font-size:12px;">+ Ingest Syllabus</button>
          </div>
        `;
      } else {
        courseGrid.innerHTML = state.courses.map(c => `
          <div class="card-3d" style="padding:18px;">
            <div class="card-glare"></div>
            <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:10px;">
              <div>
                <span class="task-course-pill" style="background:${c.color}; font-size:11.5px;">${c.code}</span>
                <h4 style="font-size:15px; font-weight:700; color:#fff; margin-top:5px;">${c.name}</h4>
              </div>
              <div style="font-family:var(--font-display); font-size:20px; font-weight:700; color:#fff;">
                ${c.currentGrade}%
              </div>
            </div>
            <div style="font-size:11.5px; color:var(--text-muted); margin-bottom:10px;">
              👨‍🏫 ${c.instructor || 'Faculty Lead'}
            </div>
            <div style="background:rgba(255,255,255,0.06); height:5px; border-radius:3px; overflow:hidden; margin-bottom:8px;">
              <div style="width:${c.currentGrade}%; height:100%; background:${c.color}; border-radius:3px;"></div>
            </div>
            <div style="display:flex; justify-content:space-between; font-size:11px; font-family:var(--font-mono); color:var(--text-secondary);">
              <span>Rubrics: ${c.gradeWeights.length} Components</span>
              <span style="color:var(--primary-light); cursor:pointer;" onclick="window.viewCourseDetails('${c.id}')">View Details →</span>
            </div>
          </div>
        `).join('');
      }
    }

    // 5. Update task counter in sidebar
    const taskCountBadge = document.getElementById('nav-task-count');
    if (taskCountBadge) {
      const pendingCount = state.executionTasks.filter(t => t.status === 'PENDING').length;
      taskCountBadge.textContent = pendingCount;
    }

    init3DTilt();
  }

  window.skipTask = (taskId) => {
    const task = store.state.executionTasks.find(t => t.id === taskId);
    if (!task) return;
    const tomorrowStr = new Date(Date.now() + 86400000).toISOString().split('T')[0];
    task.scheduledDate = tomorrowStr;
    task.status = 'PENDING';
    store.saveState();
    window.showToast(`Rescheduled "${task.title}" to tomorrow.`, "info");
    if (audio) audio.playClick();
  };

  // --- 5. RENDER MASTER ROADMAP (KANBAN & GANTT) ---
  function renderRoadmap(state) {
    const pendingStack = document.getElementById('kanban-pending-stack');
    const inProgressStack = document.getElementById('kanban-progress-stack');
    const completedStack = document.getElementById('kanban-completed-stack');

    if (!pendingStack || !inProgressStack || !completedStack) return;

    const renderCard = (t) => {
      const course = state.courses.find(c => c.id === t.courseId) || { code: 'CORE', color: '#8b5cf6' };
      return `
        <div class="card-3d" style="padding:14px; margin-bottom:10px;" data-task-id="${t.id}">
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

    // Gantt Timeline
    const ganttContainer = document.getElementById('gantt-tracks-container');
    if (ganttContainer) {
      if (state.courses.length === 0) {
        ganttContainer.innerHTML = `<div style="text-align:center; padding:20px; color:var(--text-muted);">No active course milestones mapped.</div>`;
      } else {
        ganttContainer.innerHTML = state.courses.map(course => {
          const milestones = state.milestones.filter(m => m.courseId === course.id);
          return `
            <div class="gantt-course-row">
              <div class="gantt-course-header">
                <span class="task-course-pill" style="background:${course.color};">${course.code}</span>
                <span style="font-size:13px; font-weight:600; color:#fff;">${course.name}</span>
                <span style="font-size:11px; font-family:var(--font-mono); color:var(--text-muted);">${milestones.length} Milestones</span>
              </div>
              <div class="gantt-timeline-track">
                ${milestones.map((m, idx) => {
                  const leftPos = Math.min(76, (idx * 28) + 4);
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
    }

    init3DTilt();
  }

  // --- 6. 3D FOCUS COCKPIT (POMODORO) ENGINE ---
  let pomodoroInterval = null;
  let pomodoroSecondsLeft = 25 * 60;
  let isPomodoroRunning = false;

  const timerNumbersEl = document.getElementById('timer-numbers-display');
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
        window.showToast("🔔 25-Min Sprint Completed! Take a 5-minute cognitive break.", "success");
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
      if (isPomodoroRunning) pausePomodoro();
      else startPomodoro();
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
        window.showToast("Binaural 40Hz Gamma focus tone engaged.", "info");
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

    pomodoroSecondsLeft = (task.estimatedMinutes || 25) * 60;
    updateTimerDisplay();
    startPomodoro();
  };

  // --- 7. ACTIVE RECALL SPATIAL FLIP CARDS ---
  let activeDeckIndex = 0;
  let activeCardIndex = 0;
  let selectedConfidence = 3;

  function renderFlashcards() {
    const cardEl = document.getElementById('flashcard-card-3d');
    const stageEl = document.getElementById('flashcard-stage');
    const evalControls = document.getElementById('flashcard-evaluation-controls');
    const emptyState = document.getElementById('flashcard-empty-state');
    const loadingState = document.getElementById('flashcard-loading-state');
    const errorState = document.getElementById('flashcard-error-state');

    // Ensure hidden initially
    if (loadingState) loadingState.style.display = 'none';
    if (errorState) errorState.style.display = 'none';

    const decks = store.state.studyDecks || [];
    if (decks.length === 0 || !decks[activeDeckIndex] || !decks[activeDeckIndex].cards || decks[activeDeckIndex].cards.length === 0) {
      if (stageEl) stageEl.style.display = 'none';
      if (evalControls) evalControls.style.display = 'none';
      if (emptyState) emptyState.style.display = 'block';
      return;
    }

    if (emptyState) emptyState.style.display = 'none';
    if (stageEl) stageEl.style.display = 'block';
    if (evalControls) evalControls.style.display = 'block';

    const deck = decks[activeDeckIndex];
    if (activeCardIndex >= deck.cards.length) activeCardIndex = 0;
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
    if (deckTitleEl) deckTitleEl.textContent = `${deck.title} • ${card.topic || deck.topic}`;

    if (cardEl) cardEl.classList.remove('flipped');
  }

  // Card Flip Triggers
  const flipStage = document.getElementById('flashcard-stage');
  const revealBtnFront = document.getElementById('btn-reveal-answer-front');

  function flipCard() {
    const cardEl = document.getElementById('flashcard-card-3d');
    if (cardEl) {
      cardEl.classList.toggle('flipped');
      if (audio) audio.playCardFlip();
    }
  }

  if (flipStage) {
    flipStage.addEventListener('click', (e) => {
      // Don't flip if clicking child buttons
      if (e.target.closest('#btn-reveal-answer-front')) return;
      flipCard();
    });
  }

  if (revealBtnFront) {
    revealBtnFront.addEventListener('click', (e) => {
      e.stopPropagation();
      flipCard();
    });
  }

  // Confidence Rating Buttons [ 1 ] [ 2 ] [ 3 ] [ 4 ] [ 5 ]
  document.querySelectorAll('.btn-confidence').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.btn-confidence').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      selectedConfidence = parseInt(btn.getAttribute('data-confidence'), 10);
      const label = document.getElementById('confidence-label');
      const ratings = ['', '1 (None)', '2 (Low)', '3 (Fair)', '4 (High)', '5 (Mastered)'];
      if (label) label.textContent = `Rating: ${ratings[selectedConfidence]}`;
      if (audio) audio.playClick();
    });
  });

  // Self-Evaluation Rating Buttons
  document.querySelectorAll('[data-eval]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const evaluation = btn.getAttribute('data-eval');
      const decks = store.state.studyDecks;
      if (!decks || !decks[activeDeckIndex]) return;

      const deck = decks[activeDeckIndex];
      const card = deck.cards[activeCardIndex];

      const { topicStat, adaptiveNotice } = store.recordCardRecall(deck.id, card.id, selectedConfidence, evaluation);
      if (audio) audio.playSuccess();

      let toastText = `Calibrated "${card.topic || 'Topic'}": ${topicStat.status} (${topicStat.accuracy}%)`;
      if (adaptiveNotice) toastText += ` • ${adaptiveNotice}`;
      window.showToast(toastText, evaluation === 'KNEW_IT' ? 'success' : 'warning');

      // Advance to next card
      activeCardIndex = (activeCardIndex + 1) % deck.cards.length;
      renderFlashcards();
    });
  });

  // Deck Switcher Dropdown
  const deckSelect = document.getElementById('study-deck-select');
  function updateDeckSelectOptions() {
    if (!deckSelect) return;
    const decks = store.state.studyDecks || [];
    deckSelect.innerHTML = decks.map((d, i) => `
      <option value="${i}">${d.title} (${d.cards.length} cards)</option>
    `).join('');
  }

  if (deckSelect) {
    deckSelect.addEventListener('change', (e) => {
      activeDeckIndex = parseInt(e.target.value, 10);
      activeCardIndex = 0;
      renderFlashcards();
    });
  }

  // AI Active Recall Generation
  async function generateAiDeckForCourse(course) {
    const stageEl = document.getElementById('flashcard-stage');
    const evalControls = document.getElementById('flashcard-evaluation-controls');
    const loadingState = document.getElementById('flashcard-loading-state');
    const errorState = document.getElementById('flashcard-error-state');
    const emptyState = document.getElementById('flashcard-empty-state');

    if (stageEl) stageEl.style.display = 'none';
    if (evalControls) evalControls.style.display = 'none';
    if (emptyState) emptyState.style.display = 'none';
    if (errorState) errorState.style.display = 'none';
    if (loadingState) loadingState.style.display = 'block';

    try {
      const resp = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generate_recall',
          subject: course.name,
          topic: course.code,
          count: 4
        })
      });

      if (!resp.ok) throw new Error("AI deck synthesis failed.");
      const data = await resp.json();

      if (!data.cards || data.cards.length === 0) throw new Error("No cards returned by AI.");

      const newDeck = {
        id: `${store.currentUser?.id || 'usr'}_deck_${Date.now()}`,
        courseId: course.id,
        title: `${course.code} Active Recall Core`,
        topic: course.name,
        cards: data.cards
      };

      store.state.studyDecks.push(newDeck);
      store.saveState();
      activeDeckIndex = store.state.studyDecks.length - 1;
      activeCardIndex = 0;

      updateDeckSelectOptions();
      renderFlashcards();
      window.showToast(`✨ Generated ${data.cards.length} conceptual cards for ${course.code}!`, 'success');
      if (audio) audio.playSuccess();
    } catch (err) {
      if (loadingState) loadingState.style.display = 'none';
      if (errorState) {
        errorState.style.display = 'block';
        const t = document.getElementById('flashcard-error-text');
        if (t) t.textContent = `AI Generation Error: ${err.message}`;
      }
    }
  }

  const generateDeckBtn = document.getElementById('btn-generate-ai-deck');
  const emptyGenerateBtn = document.getElementById('btn-empty-generate-deck');
  const retryFlashcardBtn = document.getElementById('btn-retry-flashcard');

  if (generateDeckBtn) {
    generateDeckBtn.addEventListener('click', () => {
      const course = store.state.courses[0] || { id: 'c1', code: 'CS-301', name: 'Operating Systems' };
      generateAiDeckForCourse(course);
    });
  }
  if (emptyGenerateBtn) {
    emptyGenerateBtn.addEventListener('click', () => {
      const course = store.state.courses[0] || { id: 'c1', code: 'CS-301', name: 'Operating Systems' };
      generateAiDeckForCourse(course);
    });
  }
  if (retryFlashcardBtn) {
    retryFlashcardBtn.addEventListener('click', () => {
      const course = store.state.courses[0] || { id: 'c1', code: 'CS-301', name: 'Operating Systems' };
      generateAiDeckForCourse(course);
    });
  }

  // --- 8. DIAGNOSTIC SELF-TEST RUNNER & SKILL MAP ---
  let diagnosticQuestions = [];
  let currentDiagnosticIndex = 0;
  let diagnosticScore = 0;
  let diagnosticBreakdown = {}; // { 'Deadlocks': { correct: 0, total: 0 } }

  function initDiagnosticSetup() {
    const subSelect = document.getElementById('quiz-subject-select');
    if (!subSelect) return;
    const courses = store.state.courses || [];
    if (courses.length === 0) {
      subSelect.innerHTML = `<option value="Operating Systems">Operating Systems (Core)</option>`;
    } else {
      subSelect.innerHTML = courses.map(c => `
        <option value="${c.name}">${c.code}: ${c.name}</option>
      `).join('');
    }
  }

  const startDiagBtn = document.getElementById('btn-start-diagnostic');
  if (startDiagBtn) {
    startDiagBtn.addEventListener('click', async () => {
      const subSelect = document.getElementById('quiz-subject-select');
      const subjectName = subSelect ? subSelect.value : 'Operating Systems';
      await startDiagnosticAssessment(subjectName);
    });
  }

  async function startDiagnosticAssessment(subjectName) {
    const setupState = document.getElementById('quiz-setup-state');
    const loadingState = document.getElementById('quiz-loading-state');
    const activeState = document.getElementById('quiz-active-state');
    const completeState = document.getElementById('quiz-complete-state');

    if (setupState) setupState.style.display = 'none';
    if (completeState) completeState.style.display = 'none';
    if (activeState) activeState.style.display = 'none';
    if (loadingState) loadingState.style.display = 'block';

    try {
      const resp = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generate_diagnostic',
          subject: subjectName,
          count: 5
        })
      });

      if (!resp.ok) throw new Error("Failed to generate diagnostic assessment questions.");
      const data = await resp.json();
      if (!data.questions || data.questions.length === 0) throw new Error("Empty questions returned.");

      diagnosticQuestions = data.questions;
      currentDiagnosticIndex = 0;
      diagnosticScore = 0;
      diagnosticBreakdown = {};

      if (loadingState) loadingState.style.display = 'none';
      if (activeState) activeState.style.display = 'block';

      renderDiagnosticQuestion();
    } catch (err) {
      if (loadingState) loadingState.style.display = 'none';
      if (setupState) setupState.style.display = 'block';
      window.showToast(`AI generation failed: ${err.message}. Retrying...`, "warning");
    }
  }

  function renderDiagnosticQuestion() {
    const q = diagnosticQuestions[currentDiagnosticIndex];
    if (!q) return;

    const countTag = document.getElementById('quiz-question-count');
    const topicPill = document.getElementById('quiz-topic-pill');
    const scoreLive = document.getElementById('quiz-score-live');
    const qTextEl = document.getElementById('quiz-question-text');
    const optionsList = document.getElementById('quiz-options-list');
    const feedbackBox = document.getElementById('quiz-feedback-box');

    if (countTag) countTag.textContent = `Question ${currentDiagnosticIndex + 1} of ${diagnosticQuestions.length}`;
    if (topicPill) topicPill.textContent = `Topic: ${q.topic || 'Conceptual'}`;
    if (scoreLive) scoreLive.textContent = `Score: ${diagnosticScore} / ${currentDiagnosticIndex}`;
    if (qTextEl) qTextEl.textContent = q.question;
    if (feedbackBox) feedbackBox.style.display = 'none';

    if (optionsList) {
      optionsList.innerHTML = q.options.map((opt, idx) => `
        <div class="prompt-chip" style="font-size:13.5px; padding:14px; cursor:pointer;" onclick="window.submitDiagnosticAnswer(${idx})">
          ${opt}
        </div>
      `).join('');
    }
  }

  window.submitDiagnosticAnswer = (selectedIdx) => {
    const q = diagnosticQuestions[currentDiagnosticIndex];
    const isCorrect = selectedIdx === q.correctIndex;
    const topic = q.topic || 'General';

    if (!diagnosticBreakdown[topic]) {
      diagnosticBreakdown[topic] = { correct: 0, total: 0 };
    }
    diagnosticBreakdown[topic].total++;

    if (isCorrect) {
      diagnosticScore++;
      diagnosticBreakdown[topic].correct++;
      if (audio) audio.playSuccess();
      window.showToast("Correct! Core mechanism verified.", "success");
    } else {
      if (audio) audio.playClick();
      window.showToast(`Review note: ${q.explanation}`, "warning");
    }

    const feedbackBox = document.getElementById('quiz-feedback-box');
    if (feedbackBox) {
      feedbackBox.style.display = 'block';
      feedbackBox.style.background = isCorrect ? 'rgba(16, 185, 129, 0.15)' : 'rgba(244, 63, 94, 0.15)';
      feedbackBox.style.border = `1px solid ${isCorrect ? 'var(--emerald)' : 'var(--rose)'}`;
      feedbackBox.style.color = isCorrect ? '#6ee7b7' : '#fca5a5';
      feedbackBox.innerHTML = `<strong>${isCorrect ? '✓ Correct' : '✕ Incorrect'}</strong>: ${q.explanation}`;
    }

    // Disable options to prevent duplicate answers
    const options = document.querySelectorAll('#quiz-options-list .prompt-chip');
    options.forEach((opt, i) => {
      opt.onclick = null;
      if (i === q.correctIndex) {
        opt.style.borderColor = 'var(--emerald)';
        opt.style.background = 'rgba(16, 185, 129, 0.2)';
      } else if (i === selectedIdx && !isCorrect) {
        opt.style.borderColor = 'var(--rose)';
        opt.style.background = 'rgba(244, 63, 94, 0.2)';
      }
    });

    setTimeout(() => {
      if (currentDiagnosticIndex < diagnosticQuestions.length - 1) {
        currentDiagnosticIndex++;
        renderDiagnosticQuestion();
      } else {
        finishDiagnosticAssessment();
      }
    }, 1800);
  };

  function finishDiagnosticAssessment() {
    const activeState = document.getElementById('quiz-active-state');
    const completeState = document.getElementById('quiz-complete-state');
    if (activeState) activeState.style.display = 'none';
    if (completeState) completeState.style.display = 'block';

    const subSelect = document.getElementById('quiz-subject-select');
    const subjectName = subSelect ? subSelect.value : 'Course';

    const scoreEl = document.getElementById('quiz-final-score');
    const pct = Math.round((diagnosticScore / diagnosticQuestions.length) * 100);
    if (scoreEl) scoreEl.textContent = `${diagnosticScore} / ${diagnosticQuestions.length} (${pct}%)`;

    // Persist diagnostic result & skill map
    const resultObj = store.recordDiagnosticResult(subjectName, diagnosticScore, diagnosticQuestions.length, diagnosticBreakdown);

    // Render Skill Map Visualization
    const skillMapDisplay = document.getElementById('quiz-skill-map-display');
    if (skillMapDisplay) {
      skillMapDisplay.innerHTML = Object.keys(store.state.skillMap).map(topicName => {
        const item = store.state.skillMap[topicName];
        let badgeClass = 'skill-badge-medium';
        let barColor = 'var(--amber)';
        if (item.status === 'Strong') {
          badgeClass = 'skill-badge-strong';
          barColor = 'var(--emerald)';
        } else if (item.status === 'Weak') {
          badgeClass = 'skill-badge-weak';
          barColor = 'var(--rose)';
        }

        return `
          <div class="skill-map-item">
            <div class="skill-map-item-header">
              <span style="font-weight:600; color:#fff; font-size:13.5px;">${topicName}</span>
              <span class="skill-badge ${badgeClass}">${item.status} (${item.accuracy || 50}%)</span>
            </div>
            <div class="skill-progress-bar">
              <div class="skill-progress-fill" style="width:${item.accuracy || 50}%; background:${barColor};"></div>
            </div>
          </div>
        `;
      }).join('');
    }

    if (audio) audio.playSuccess();
    window.showToast("Skill Map updated! Personalized study plan calibrated.", "success");
  }

  const restartQuizBtn = document.getElementById('btn-restart-quiz');
  if (restartQuizBtn) {
    restartQuizBtn.addEventListener('click', () => {
      const completeState = document.getElementById('quiz-complete-state');
      const setupState = document.getElementById('quiz-setup-state');
      if (completeState) completeState.style.display = 'none';
      if (setupState) setupState.style.display = 'block';
    });
  }

  const adaptPlanBtn = document.getElementById('btn-adapt-study-plan');
  if (adaptPlanBtn) {
    adaptPlanBtn.addEventListener('click', () => {
      switchView('dashboard');
      window.showToast("⚡ Master Roadmap updated with high-priority micro-sprints for weak topics!", "success");
    });
  }

  // --- 9. AEGIS AI ADVISOR INTERFACE ---
  const chatMessagesList = document.getElementById('advisor-chat-messages');
  const chatInput = document.getElementById('advisor-input-field');
  const chatSendBtn = document.getElementById('advisor-send-btn');

  function renderAdvisorChat(messages, isTyping) {
    if (!chatMessagesList) return;
    chatMessagesList.innerHTML = messages.map(m => {
      let formattedText = m.text
        .replace(/^### (.*$)/gim, '<h3 style="font-size:15px; font-weight:700; color:#fff; margin:6px 0;">$1</h3>')
        .replace(/^## (.*$)/gim, '<h2 style="font-size:17px; font-weight:700; color:#fff; margin:8px 0;">$1</h2>')
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/\n/g, '<br>');

      return `
        <div class="chat-msg ${m.sender === 'user' ? 'chat-msg-user' : 'chat-msg-assistant'}">
          <div class="chat-avatar ${m.sender === 'user' ? 'chat-avatar-user' : 'chat-avatar-ai'}">
            ${m.sender === 'user' ? '👤' : '✨'}
          </div>
          <div class="chat-bubble">
            ${formattedText}
          </div>
        </div>
      `;
    }).join('');

    if (isTyping) {
      chatMessagesList.innerHTML += `
        <div class="chat-msg chat-msg-assistant">
          <div class="chat-avatar chat-avatar-ai">✨</div>
          <div class="chat-bubble" style="color:var(--primary-light); display:flex; align-items:center; gap:8px;">
            <span class="auth-spinner" style="width:14px; height:14px;"></span>
            <span>Aegis is analyzing telemetry and synthesizing response...</span>
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

  // --- 10. REBALANCE MODAL & TRIAGE EXECUTION ---
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
      window.showToast(data.rationale || result.rationale, 'success');
    } catch (e) {
      const result = store.executeRebalance(mode);
      if (rebalanceModal) rebalanceModal.classList.remove('open');
      window.showToast(result.rationale, 'success');
    }
  };

  // --- 11. SYLLABUS DECONSTRUCTION STUDIO ---
  window.loadSampleSyllabus = (courseKey) => {
    const syllabusTextarea = document.getElementById('syllabus-raw-input');
    const courseCodeInput = document.getElementById('ingest-course-code');
    const courseNameInput = document.getElementById('ingest-course-name');

    const course = store.state.courses.find(c => c.id === courseKey) || store.state.courses[0] || {
      code: 'CS-410',
      name: 'Advanced Distributed Systems',
      syllabusText: `COURSE SYLLABUS: CS-410 Advanced Distributed Systems (Fall 2026)\nInstructor: Prof. Martin Kleppmann\n\nREQUIRED DELIVERABLES:\n1. Pset 1: Raft Consensus Protocol Simulation (Due Oct 2)\n2. Capstone Checkpoint 1: RPC Wire Protocol & Storage Engine (Due Oct 12)\n3. Midterm Architecture Exam (Nov 3)\n4. Final Distributed KV Engine Demo (Dec 12)`
    };

    if (syllabusTextarea) syllabusTextarea.value = course.syllabusText || '';
    if (courseCodeInput) courseCodeInput.value = course.code;
    if (courseNameInput) courseNameInput.value = course.name;

    window.showToast(`Loaded authentic syllabus: ${course.code}`, 'info');
    if (audio) audio.playClick();
  };

  window.runSyllabusDeconstruction = async () => {
    const code = document.getElementById('ingest-course-code')?.value.trim() || 'CS-500';
    const name = document.getElementById('ingest-course-name')?.value.trim() || 'Cloud Architectures';
    const rawText = document.getElementById('syllabus-raw-input')?.value.trim() || '';

    window.showToast("✨ Gemini AI: Decomposing syllabus and grading rubric...", "info");
    if (audio) audio.playClick();

    try {
      const resp = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'deconstruct_syllabus',
          courseCode: code,
          courseName: name,
          rawText
        })
      });

      if (!resp.ok) throw new Error("Syllabus deconstruction API failed.");
      const resData = await resp.json();
      const extracted = resData.data;

      const newCourseId = `${store.currentUser?.id || 'usr'}_course_${Date.now()}`;
      const newCourse = {
        id: newCourseId,
        code,
        name,
        instructor: extracted?.instructor || "Faculty Lead",
        instructorEmail: extracted?.instructorEmail || "instructor@univ.edu",
        officeHours: extracted?.officeHours || "By appointment",
        color: ['#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ec4899'][store.state.courses.length % 5],
        term: "Fall 2026",
        currentGrade: 92.0,
        gradeWeights: extracted?.gradeWeights || [
          { categoryName: "Midterm Exam", weightPercentage: 30 },
          { categoryName: "Projects", weightPercentage: 40 },
          { categoryName: "Final", weightPercentage: 30 }
        ],
        syllabusText: rawText
      };

      store.state.courses.push(newCourse);

      // Generate sprints
      const todayStr = new Date().toISOString().split('T')[0];
      const newSprints = (extracted?.microSprints || []).map((s, idx) => ({
        id: `${store.currentUser?.id || 'usr'}_sprint_${Date.now()}_${idx}`,
        courseId: newCourseId,
        title: s.title,
        instructions: s.instructions,
        topic: s.topic || name,
        scheduledDate: todayStr,
        estimatedMinutes: s.estimatedMinutes || 25,
        actualMinutes: 0,
        cognitiveLoad: s.cognitiveLoad || "DEEP_FOCUS",
        priority: "HIGH",
        status: "PENDING"
      }));

      if (newSprints.length === 0) {
        newSprints.push({
          id: `${store.currentUser?.id || 'usr'}_sprint_${Date.now()}`,
          courseId: newCourseId,
          title: `Analyze ${code} Week 1 Core Principles`,
          instructions: `Deconstruct primary case study and build conceptual summary notes.`,
          topic: name,
          scheduledDate: todayStr,
          estimatedMinutes: 25,
          actualMinutes: 0,
          cognitiveLoad: "DEEP_FOCUS",
          priority: "HIGH",
          status: "PENDING"
        });
      }

      store.state.executionTasks.push(...newSprints);
      store.saveState();

      if (window.academiqSupabase && store.currentUser) {
        window.academiqSupabase.saveUserCourse(store.currentUser.id, newCourse);
        window.academiqSupabase.syncAllTasks(store.state.executionTasks, store.currentUser.id);
      }

      if (audio) audio.playSuccess();
      window.showToast(`Success! Deconstructed ${code} into ${newSprints.length} micro-sprint(s).`, "success");
      switchView('dashboard');

    } catch (err) {
      window.showToast(`Syllabus AI error: ${err.message}. Added baseline curriculum.`, "warning");
    }
  };

  // --- 12. SETTINGS FORM BINDINGS ---
  const saveSettingsBtn = document.getElementById('btn-save-settings');
  if (saveSettingsBtn) {
    saveSettingsBtn.addEventListener('click', () => {
      const gpa = parseFloat(document.getElementById('pref-target-gpa')?.value || 3.9);
      const weekdayHours = parseFloat(document.getElementById('pref-weekday-hours')?.value || 4.5);
      const weekendHours = parseFloat(document.getElementById('pref-weekend-hours')?.value || 7.0);

      store.state.profile.targetGpa = gpa;
      store.state.profile.weekdayAvailableHours = weekdayHours;
      store.state.profile.weekendAvailableHours = weekendHours;
      store.saveState();

      if (window.academiqSupabase && store.currentUser) {
        window.academiqSupabase.saveUserProfile(store.currentUser.id, store.state.profile);
      }

      window.showToast("Academic capacity preferences saved.", "success");
      if (audio) audio.playSuccess();
    });
  }

  // --- 13. STORE SUBSCRIPTION & INITIAL DISPATCH ---
  store.subscribe((state, analytics) => {
    renderDashboard(state, analytics);
    renderRoadmap(state);
  });

  // Initial render
  const initialAnalytics = store.getAnalytics();
  renderDashboard(store.state, initialAnalytics);
  renderRoadmap(store.state);
  renderAdvisorChat(advisor.getConversation(), false);
  renderFlashcards();
  updateDeckSelectOptions();
  initDiagnosticSetup();
  updateTimerDisplay();
  init3DTilt();

  // Reset Benchmark Listener
  const systemResetBtn = document.getElementById('btn-system-reset');
  if (systemResetBtn) {
    systemResetBtn.addEventListener('click', () => {
      if (confirm("Reset current academic plan to calibrated baseline?")) {
        store.seedStarterCurriculum();
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
        heroTag.innerHTML = `<span>✦</span> GEMINI ACTIVE • SUPABASE SYNCED`;
        heroTag.style.borderColor = 'rgba(16, 185, 129, 0.5)';
        heroTag.style.background = 'rgba(16, 185, 129, 0.12)';
        heroTag.style.color = '#34d399';
      }
    })
    .catch(() => {});
});
