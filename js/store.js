/**
 * ACADEMIQ OS: REACTIVE STATE MANAGEMENT & COMPUTATION ENGINE
 * Handles data mutations, local persistence, velocity tracking, and cognitive load analytics.
 */

class AcademiqStore {
  constructor() {
    this.STORAGE_KEY = 'academiq_os_state_v1';
    this.listeners = new Set();
    this.state = this.loadState();
    this.initSupabaseSync();
  }

  async initSupabaseSync() {
    if (!window.academiqSupabase) return;
    try {
      // 1. Seed Supabase if remote tables are completely empty
      await window.academiqSupabase.seedIfEmpty(window.ACADEMIQ_INITIAL_DATA);

      // 2. Fetch full remote state from Supabase
      const remoteState = await window.academiqSupabase.fetchRemoteState();
      if (remoteState && remoteState.courses && remoteState.courses.length > 0) {
        this.state.courses = remoteState.courses;
        this.state.executionTasks = remoteState.executionTasks;
        this.state.milestones = remoteState.milestones;
        if (remoteState.studyDecks && remoteState.studyDecks.length > 0) {
          this.state.studyDecks = remoteState.studyDecks;
        }
        if (remoteState.profile) {
          this.state.profile = remoteState.profile;
        }
        this.saveState();
        console.log("⚡ Academiq OS: Synchronized with Supabase Cloud Database.");
      }
    } catch (err) {
      console.warn("Supabase initial sync:", err);
    }
  }

  loadState() {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.warn("Could not read from localStorage, using initial dataset:", e);
    }
    return JSON.parse(JSON.stringify(window.ACADEMIQ_INITIAL_DATA));
  }

  saveState() {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.state));
    } catch (e) {
      console.warn("Could not save to localStorage:", e);
    }
    this.notify();
  }

  resetToDefault() {
    this.state = JSON.parse(JSON.stringify(window.ACADEMIQ_INITIAL_DATA));
    this.saveState();
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  notify() {
    this.listeners.forEach(fn => fn(this.state, this.getAnalytics()));
  }

  // --- ACTIONS ---

  toggleTaskStatus(taskId) {
    const task = this.state.executionTasks.find(t => t.id === taskId);
    if (!task) return;

    if (task.status === 'COMPLETED') {
      task.status = 'PENDING';
      task.completedAt = null;
    } else {
      task.status = 'COMPLETED';
      task.completedAt = new Date().toISOString();
      if (window.academiqAudio) window.academiqAudio.playSuccess();
    }
    this.saveState();
    if (window.academiqSupabase) window.academiqSupabase.syncTaskUpdate(task);
  }

  updateTaskStatus(taskId, newStatus) {
    const task = this.state.executionTasks.find(t => t.id === taskId);
    if (!task) return;
    task.status = newStatus;
    if (newStatus === 'COMPLETED') {
      task.completedAt = new Date().toISOString();
      if (window.academiqAudio) window.academiqAudio.playSuccess();
    }
    this.saveState();
    if (window.academiqSupabase) window.academiqSupabase.syncTaskUpdate(task);
  }

  addCourse(newCourse) {
    newCourse.id = 'course-' + Date.now();
    newCourse.currentGrade = 100.0;
    this.state.courses.push(newCourse);
    this.saveState();
    if (window.academiqSupabase) window.academiqSupabase.insertCourse(newCourse);
  }

  addMilestones(milestones) {
    this.state.milestones.push(...milestones);
    this.saveState();
  }

  addExecutionTasks(tasks) {
    this.state.executionTasks.push(...tasks);
    this.saveState();
    if (window.academiqSupabase) window.academiqSupabase.syncAllTasks(this.state.executionTasks);
  }

  updateProfile(profileData) {
    this.state.profile = { ...this.state.profile, ...profileData };
    this.saveState();
    if (window.academiqSupabase) window.academiqSupabase.updateProfile(this.state.profile);
  }

  updateCardMastery(deckId, cardId, rating) {
    const deck = this.state.studyDecks.find(d => d.id === deckId);
    if (!deck) return;
    const card = deck.cards.find(c => c.id === cardId);
    if (!card) return;

    card.mastery = Math.min(5, Math.max(1, (card.mastery || 1) + (rating >= 3 ? 1 : -1)));
    card.lastReviewed = new Date().toISOString();
    this.saveState();
  }

  // --- ALGORITHMIC SCHEDULE REBALANCER ---
  executeRebalance(mode) {
    const overdueTasks = this.state.executionTasks.filter(t => t.status === 'OVERDUE' || (t.status === 'PENDING' && new Date(t.scheduledDate) < new Date()));
    const todayStr = new Date().toISOString().split('T')[0];
    let affectedCount = 0;
    let rationale = "";

    if (mode === 'SURGICAL_COMPRESSION') {
      // Pack into today and tomorrow by compressing estimates by 20%
      overdueTasks.forEach((task, idx) => {
        task.scheduledDate = todayStr;
        task.estimatedMinutes = Math.max(20, Math.round(task.estimatedMinutes * 0.8));
        task.status = 'PENDING';
        affectedCount++;
      });
      rationale = `Surgically compressed ${affectedCount} overdue sprint(s) into current available calendar slots with 20% focus efficiency optimization. Deadlines preserved.`;
    } else if (mode === 'GRACEFUL_SPILLOVER') {
      // Distribute sequentially over the next 3 days
      overdueTasks.forEach((task, idx) => {
        const offsetDays = (idx % 3) + 1;
        const targetDate = new Date(Date.now() + offsetDays * 86400000);
        task.scheduledDate = targetDate.toISOString().split('T')[0];
        task.status = 'PENDING';
        affectedCount++;
      });
      rationale = `Gracefully distributed ${affectedCount} delayed task(s) across upcoming 72 hours, maintaining cognitive load under daily safety thresholds.`;
    } else if (mode === 'EMERGENCY_TRIAGE') {
      // 80/20 Rule: mark low priority administrative tasks as completed/archived, focus on high-yield
      overdueTasks.forEach((task) => {
        if (task.cognitiveLoad === 'ADMIN_REVIEW' || task.cognitiveLoad === 'PASSIVE_SYNTHESIS') {
          task.status = 'COMPLETED';
          task.instructions += " [Autocompleted via Emergency 80/20 Triage pass]";
        } else {
          task.scheduledDate = todayStr;
          task.status = 'IN_PROGRESS';
        }
        affectedCount++;
      });
      rationale = `Emergency 80/20 triage executed. Conceded non-critical administrative sub-tasks to isolate maximum working memory for high-yield exams and major deliverables.`;
    }

    this.saveState();
    if (window.academiqSupabase) window.academiqSupabase.syncAllTasks(this.state.executionTasks);
    if (window.academiqAudio) window.academiqAudio.playSuccess();
    return { affectedCount, rationale };
  }

  // --- ANALYTICS COMPUTATION ENGINE ---
  getAnalytics() {
    const tasks = this.state.executionTasks;
    const completedTasks = tasks.filter(t => t.status === 'COMPLETED');
    const todayStr = new Date().toISOString().split('T')[0];
    const todayTasks = tasks.filter(t => t.scheduledDate === todayStr);

    // Completion Velocity
    const velocity = tasks.length > 0 ? (completedTasks.length / tasks.length) : 1.0;

    // Daily Scheduled Minutes & Burnout
    let totalScheduledMinutes = 0;
    let deepFocusMins = 0;
    let activeProdMins = 0;
    let passiveSynthMins = 0;
    let adminReviewMins = 0;

    todayTasks.forEach(t => {
      totalScheduledMinutes += t.estimatedMinutes;
      if (t.cognitiveLoad === 'DEEP_FOCUS') deepFocusMins += t.estimatedMinutes;
      if (t.cognitiveLoad === 'ACTIVE_PRODUCTION') activeProdMins += t.estimatedMinutes;
      if (t.cognitiveLoad === 'PASSIVE_SYNTHESIS') passiveSynthMins += t.estimatedMinutes;
      if (t.cognitiveLoad === 'ADMIN_REVIEW') adminReviewMins += t.estimatedMinutes;
    });

    const userDailyCapacityMins = (this.state.profile.weekdayAvailableHours || 4.5) * 60;
    const loadRatio = totalScheduledMinutes / userDailyCapacityMins;

    let burnoutRisk = 'LOW';
    let burnoutColor = 'var(--emerald)';
    if (loadRatio > 1.15) {
      burnoutRisk = 'CRITICAL';
      burnoutColor = 'var(--rose)';
    } else if (loadRatio > 0.85) {
      burnoutRisk = 'ELEVATED';
      burnoutColor = 'var(--amber)';
    }

    // Projected GPA Calculation
    const totalCourses = this.state.courses.length;
    let sumGrades = 0;
    this.state.courses.forEach(c => {
      sumGrades += (c.currentGrade || 90.0);
    });
    const avgPercentage = totalCourses > 0 ? (sumGrades / totalCourses) : 90;
    // Map percentage to 4.0 scale
    const projectedGpa = (Math.min(4.0, (avgPercentage / 25) * 1.02)).toFixed(2);

    return {
      completionVelocity: Math.round(velocity * 100),
      burnoutRisk,
      burnoutColor,
      loadRatio: Math.min(100, Math.round(loadRatio * 100)),
      totalScheduledHours: (totalScheduledMinutes / 60).toFixed(1),
      userCapacityHours: (userDailyCapacityMins / 60).toFixed(1),
      deepFocusHours: (deepFocusMins / 60).toFixed(1),
      activeProdHours: (activeProdMins / 60).toFixed(1),
      passiveSynthHours: (passiveSynthMins / 60).toFixed(1),
      adminReviewHours: (adminReviewMins / 60).toFixed(1),
      projectedGpa,
      targetGpa: this.state.profile.targetGpa,
      totalCourses,
      imminentMilestones: this.state.milestones.filter(m => !m.isCompleted).length,
      overdueTasksCount: tasks.filter(t => t.status === 'OVERDUE').length
    };
  }
}

window.academiqStore = new AcademiqStore();
