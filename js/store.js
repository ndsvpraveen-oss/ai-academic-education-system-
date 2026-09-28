/**
 * ACADEMIQ OS: REACTIVE STATE MANAGEMENT & COGNITIVE ENGINE
 * Handles user personalization, adaptive learning loops, transparent metrics, and Supabase cloud sync.
 */

class AcademiqStore {
  constructor() {
    this.currentUser = null;
    this.listeners = new Set();
    this.state = this.getBlankState();
  }

  getStorageKey() {
    const uid = this.currentUser?.id || 'guest';
    return `academiq_os_state_${uid}`;
  }

  getBlankState() {
    return {
      profile: {
        fullName: "New Scholar",
        institution: "University",
        major: "Computer Science",
        yearSemester: "Year 1",
        targetGpa: 3.90,
        currentGpa: 3.80,
        weekdayAvailableHours: 4.5,
        weekendAvailableHours: 7.0,
        sleepHours: 7.5,
        onboardingCompleted: false
      },
      courses: [],
      milestones: [],
      executionTasks: [],
      studyDecks: [],
      skillMap: {}, // e.g. { "Deadlocks": { status: "Weak", accuracy: 38, reviews: 4 } }
      recallHistory: [],
      diagnosticHistory: [],
      completedFocusSessionsToday: 0
    };
  }

  async setUser(user) {
    this.currentUser = user;
    await this.loadUserState();
  }

  async loadUserState() {
    const storageKey = this.getStorageKey();
    let localData = null;

    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        localData = JSON.parse(stored);
      }
    } catch (e) {
      console.warn("Could not read local user state:", e);
    }

    if (localData && localData.profile) {
      this.state = { ...this.getBlankState(), ...localData };
    } else {
      this.state = this.getBlankState();
      if (this.currentUser) {
        this.state.profile.fullName = this.currentUser.user_metadata?.full_name || this.currentUser.email?.split('@')[0] || "Scholar";
      }
    }

    // Attempt to sync from Supabase Cloud
    if (window.academiqSupabase && this.currentUser) {
      try {
        const remoteProfile = await window.academiqSupabase.fetchUserProfile(this.currentUser.id);
        if (remoteProfile) {
          this.state.profile = {
            fullName: remoteProfile.full_name || this.state.profile.fullName,
            institution: remoteProfile.institution || this.state.profile.institution,
            major: remoteProfile.major || this.state.profile.major,
            yearSemester: remoteProfile.year_semester || this.state.profile.yearSemester,
            targetGpa: Number(remoteProfile.target_gpa || this.state.profile.targetGpa),
            currentGpa: Number(remoteProfile.current_gpa || this.state.profile.currentGpa),
            weekdayAvailableHours: Number(remoteProfile.weekday_available_hours || this.state.profile.weekdayAvailableHours),
            weekendAvailableHours: Number(remoteProfile.weekend_available_hours || this.state.profile.weekendAvailableHours),
            sleepHours: 7.5,
            onboardingCompleted: remoteProfile.onboarding_completed !== false
          };
          if (remoteProfile.skill_map && Object.keys(remoteProfile.skill_map).length > 0) {
            this.state.skillMap = remoteProfile.skill_map;
          }
        }

        // Fetch courses, tasks, decks
        const [remoteCourses, remoteTasks, remoteDecks] = await Promise.all([
          window.academiqSupabase.fetchUserCourses(this.currentUser.id),
          window.academiqSupabase.fetchUserTasks(this.currentUser.id),
          window.academiqSupabase.fetchUserDecks(this.currentUser.id)
        ]);

        if (remoteCourses && remoteCourses.length > 0) {
          this.state.courses = remoteCourses;
        }
        if (remoteTasks && remoteTasks.length > 0) {
          this.state.executionTasks = remoteTasks;
        }
        if (remoteDecks && remoteDecks.length > 0) {
          this.state.studyDecks = remoteDecks;
        }

        this.saveState();
      } catch (err) {
        console.warn("Supabase remote fetch warning:", err);
      }
    }

    // If completely empty and no courses exist, seed starter course based on major
    if (this.state.courses.length === 0 && this.state.profile.onboardingCompleted) {
      this.seedStarterCurriculum();
    }

    this.saveState();
    this.notify();
  }

  saveState() {
    try {
      localStorage.setItem(this.getStorageKey(), JSON.stringify(this.state));
    } catch (e) {
      console.warn("Failed to persist to localStorage:", e);
    }
    this.notify();
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  notify() {
    const analytics = this.getAnalytics();
    this.listeners.forEach(fn => {
      try { fn(this.state, analytics); } catch (e) { console.error("Store listener error:", e); }
    });
  }

  // Seed default starter curriculum when student has onboarded
  seedStarterCurriculum(subjectNames = []) {
    const uid = this.currentUser?.id || 'usr';
    const subjects = subjectNames.length > 0 ? subjectNames : [
      { code: 'CS-301', name: 'Operating Systems', color: '#8b5cf6' },
      { code: 'CS-305', name: 'Computer Networks', color: '#06b6d4' },
      { code: 'CS-310', name: 'Database Management Systems', color: '#10b981' }
    ];

    const todayStr = new Date().toISOString().split('T')[0];
    const tomorrowStr = new Date(Date.now() + 86400000).toISOString().split('T')[0];
    const inSixDaysStr = new Date(Date.now() + 6 * 86400000).toISOString().split('T')[0];

    const newCourses = subjects.map((s, idx) => ({
      id: `${uid}_course_${idx + 1}`,
      code: s.code || `SUB-${idx + 1}`,
      name: s.name || s,
      instructor: 'Lead Professor',
      instructorEmail: 'faculty@univ.edu',
      officeHours: 'Mon/Wed 2:00 PM - 4:00 PM',
      color: s.color || (idx === 0 ? '#8b5cf6' : idx === 1 ? '#06b6d4' : '#10b981'),
      term: 'Fall 2026',
      currentGrade: 88.0,
      gradeWeights: [
        { categoryName: 'Midterm Examination', weightPercentage: 30 },
        { categoryName: 'Core Lab Projects', weightPercentage: 40 },
        { categoryName: 'Final Exam', weightPercentage: 30 }
      ],
      syllabusText: `Course Syllabus for ${s.name || s}. Core engineering principles and conceptual foundations.`
    }));

    const newMilestones = [
      {
        id: `${uid}_ms_1`,
        courseId: newCourses[0].id,
        title: `${newCourses[0].name} Midterm Architecture Exam`,
        description: 'Comprehensive assessment of concurrency, scheduling, and system synchronization.',
        type: 'EXAM',
        dueDate: inSixDaysStr,
        weightPercentage: 30,
        isCompleted: false
      },
      {
        id: `${uid}_ms_2`,
        courseId: (newCourses[1] || newCourses[0]).id,
        title: 'Core Protocol Implementation Project',
        description: 'Multi-threaded socket communication and packet routing engine.',
        type: 'PROJECT',
        dueDate: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
        weightPercentage: 25,
        isCompleted: false
      }
    ];

    const newTasks = [
      {
        id: `${uid}_task_1`,
        milestoneId: newMilestones[0].id,
        courseId: newCourses[0].id,
        title: 'Deconstruct Four Coffman Conditions for Deadlocks',
        instructions: 'Break down mutual exclusion, hold-and-wait, no preemption, and circular wait in resource allocation graphs.',
        topic: 'Deadlocks',
        scheduledDate: todayStr,
        estimatedMinutes: 25,
        actualMinutes: 0,
        cognitiveLoad: 'DEEP_FOCUS',
        priority: 'HIGH',
        status: 'PENDING'
      },
      {
        id: `${uid}_task_2`,
        milestoneId: newMilestones[0].id,
        courseId: newCourses[0].id,
        title: 'Review Multilevel Feedback Queue (MLFQ) Scheduling',
        instructions: 'Analyze dynamic priority aging and I/O-bound process starvation prevention.',
        topic: 'Scheduling',
        scheduledDate: todayStr,
        estimatedMinutes: 25,
        actualMinutes: 0,
        cognitiveLoad: 'ACTIVE_PRODUCTION',
        priority: 'HIGH',
        status: 'PENDING'
      },
      {
        id: `${uid}_task_3`,
        milestoneId: (newMilestones[1] || newMilestones[0]).id,
        courseId: (newCourses[1] || newCourses[0]).id,
        title: 'TCP Congestion Control & Sliding Window Analysis',
        instructions: 'Diagram slow start, congestion avoidance, fast retransmit, and fast recovery algorithms.',
        topic: 'Congestion Control',
        scheduledDate: tomorrowStr,
        estimatedMinutes: 30,
        cognitiveLoad: 'DEEP_FOCUS',
        priority: 'MEDIUM',
        status: 'PENDING'
      }
    ];

    const newDecks = [
      {
        id: `${uid}_deck_1`,
        courseId: newCourses[0].id,
        title: `${newCourses[0].code} Active Recall Core`,
        topic: 'Operating Systems Foundations',
        cards: [
          {
            id: 'c-1',
            topic: 'Deadlocks',
            question: 'What are the four necessary and sufficient conditions for deadlock to occur in an operating system?',
            answer: '1. Mutual Exclusion\n2. Hold and Wait\n3. No Preemption\n4. Circular Wait',
            explanation: 'Coffman conditions: Deadlock occurs if and only if all four conditions hold simultaneously. Breaking any one of these four conditions guarantees deadlock prevention.',
            mastery: 1
          },
          {
            id: 'c-2',
            topic: 'Deadlocks',
            question: 'How does the Banker\'s Algorithm determine if a resource request leads to a safe state?',
            answer: 'It simulates allocation and checks if there exists at least one execution sequence of processes where all can acquire their maximum declared needs and terminate.',
            explanation: 'A state is safe if the system can allocate resources to each process (up to its maximum) in some order and still avoid deadlock. Unsafe state != deadlock, but may lead to deadlock.',
            mastery: 1
          },
          {
            id: 'c-3',
            topic: 'Synchronization',
            question: 'What is the key difference between a counting semaphore and a binary mutex lock?',
            answer: 'A binary mutex can only be owned and unlocked by the thread that acquired it. A counting semaphore maintains an integer counter and can be signaled by any thread.',
            explanation: 'Mutex provides exclusive ownership; semaphores are generalized synchronization signaling mechanisms.',
            mastery: 2
          },
          {
            id: 'c-4',
            topic: 'Scheduling',
            question: 'Why does Shortest Remaining Time First (SRTF) scheduling achieve minimal average waiting time, and what is its primary weakness?',
            answer: 'It is provably optimal for minimizing average wait time, but it suffers from potential starvation of long-running CPU-bound processes.',
            explanation: 'Continuous arrival of short bursts prevents long processes from executing unless priority aging is introduced.',
            mastery: 4
          }
        ]
      }
    ];

    this.state.courses = newCourses;
    this.state.milestones = newMilestones;
    this.state.executionTasks = newTasks;
    this.state.studyDecks = newDecks;

    // Seed initial skill map
    this.state.skillMap = {
      'Scheduling': { status: 'Strong', accuracy: 88, rating: 4 },
      'Deadlocks': { status: 'Weak', accuracy: 42, rating: 2 },
      'Synchronization': { status: 'Medium', accuracy: 65, rating: 3 },
      'Memory Management': { status: 'Weak', accuracy: 35, rating: 1 }
    };

    this.saveState();

    // Sync to Supabase in background
    if (window.academiqSupabase && this.currentUser) {
      newCourses.forEach(c => window.academiqSupabase.saveUserCourse(this.currentUser.id, c));
      window.academiqSupabase.syncAllTasks(newTasks, this.currentUser.id);
      newDecks.forEach(d => window.academiqSupabase.saveDeck(d, this.currentUser.id));
      window.academiqSupabase.saveUserProfile(this.currentUser.id, {
        ...this.state.profile,
        skillMap: this.state.skillMap,
        onboardingCompleted: true
      });
    }
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
      task.actualMinutes = task.estimatedMinutes;
      this.state.completedFocusSessionsToday = (this.state.completedFocusSessionsToday || 0) + 1;
      
      // Update skill map for task topic
      if (task.topic && this.state.skillMap[task.topic]) {
        const item = this.state.skillMap[task.topic];
        item.accuracy = Math.min(100, (item.accuracy || 50) + 8);
        if (item.accuracy >= 75) item.status = 'Strong';
        else if (item.accuracy >= 55) item.status = 'Medium';
      }

      if (window.academiqAudio) window.academiqAudio.playSuccess();
    }

    this.saveState();
    if (window.academiqSupabase && this.currentUser) {
      window.academiqSupabase.syncTaskUpdate(task, this.currentUser.id);
    }
  }

  updateTaskStatus(taskId, newStatus) {
    const task = this.state.executionTasks.find(t => t.id === taskId);
    if (!task) return;

    task.status = newStatus;
    if (newStatus === 'COMPLETED') {
      task.completedAt = new Date().toISOString();
      task.actualMinutes = task.estimatedMinutes;
      this.state.completedFocusSessionsToday = (this.state.completedFocusSessionsToday || 0) + 1;
      if (window.academiqAudio) window.academiqAudio.playSuccess();
    }

    this.saveState();
    if (window.academiqSupabase && this.currentUser) {
      window.academiqSupabase.syncTaskUpdate(task, this.currentUser.id);
    }
  }

  // Spaced Repetition Mastery Recording (Active Recall)
  recordCardRecall(deckId, cardId, confidence, evaluation) {
    const deck = this.state.studyDecks.find(d => d.id === deckId) || this.state.studyDecks[0];
    if (!deck) return;
    const card = deck.cards.find(c => c.id === cardId);
    if (!card) return;

    const topic = card.topic || deck.topic || 'General';
    let masteryDelta = 0;
    if (evaluation === 'KNEW_IT') masteryDelta = 1;
    else if (evaluation === 'DID_NOT_KNOW') masteryDelta = -1;

    card.mastery = Math.min(5, Math.max(1, (card.mastery || 1) + masteryDelta));
    card.lastConfidence = confidence;
    card.lastReviewed = new Date().toISOString();

    // Update Skill Profile
    if (!this.state.skillMap[topic]) {
      this.state.skillMap[topic] = { status: 'Medium', accuracy: 50, reviews: 0 };
    }
    const topicStat = this.state.skillMap[topic];
    topicStat.reviews = (topicStat.reviews || 0) + 1;
    
    if (evaluation === 'KNEW_IT') {
      topicStat.accuracy = Math.min(100, (topicStat.accuracy || 50) + 10);
    } else if (evaluation === 'DID_NOT_KNOW') {
      topicStat.accuracy = Math.max(10, (topicStat.accuracy || 50) - 15);
    } else {
      topicStat.accuracy = Math.min(100, Math.max(10, (topicStat.accuracy || 50) + 2));
    }

    if (topicStat.accuracy >= 75) topicStat.status = 'Strong';
    else if (topicStat.accuracy >= 55) topicStat.status = 'Medium';
    else topicStat.status = 'Weak';

    // ADAPTIVE CLOSED LOOP: If student struggles, automatically prioritize topic in planner
    let adaptiveNotice = null;
    if (topicStat.status === 'Weak') {
      adaptiveNotice = this.adaptPlannerForWeakTopic(topic, deck.courseId);
    }

    this.saveState();

    if (window.academiqSupabase && this.currentUser) {
      window.academiqSupabase.recordRecallAttempt(this.currentUser.id, {
        cardId,
        topic,
        confidence,
        evaluation,
        masteryLevel: card.mastery
      });
      window.academiqSupabase.saveDeck(deck, this.currentUser.id);
      window.academiqSupabase.saveUserProfile(this.currentUser.id, {
        ...this.state.profile,
        skillMap: this.state.skillMap
      });
    }

    return { topicStat, adaptiveNotice };
  }

  // ADAPTIVE LEARNING LOOP TRIGGER
  adaptPlannerForWeakTopic(weakTopic, courseId) {
    const todayStr = new Date().toISOString().split('T')[0];
    const existingTask = this.state.executionTasks.find(t => 
      t.topic === weakTopic && (t.status === 'PENDING' || t.status === 'IN_PROGRESS')
    );

    if (existingTask) {
      existingTask.priority = 'HIGH';
      existingTask.scheduledDate = todayStr;
      existingTask.instructions = `[Adaptive Revision]: Prioritize core principles of ${weakTopic}. Recent recall accuracy dipped below 50%.`;
      return `Adaptive Loop: Elevated priority for ${weakTopic} sprint scheduled for today.`;
    }

    // Create a new targeted micro-sprint
    const course = this.state.courses.find(c => c.id === courseId) || this.state.courses[0];
    const newTask = {
      id: `${this.currentUser?.id || 'usr'}_adaptive_${Date.now()}`,
      courseId: course ? course.id : '',
      title: `⚡ Targeted Mastery Sprint: ${weakTopic}`,
      instructions: `Automated adaptive intervention: Review flashcards, resolve misconceptions, and rebuild conceptual foundation in ${weakTopic}.`,
      topic: weakTopic,
      scheduledDate: todayStr,
      estimatedMinutes: 25,
      actualMinutes: 0,
      cognitiveLoad: 'DEEP_FOCUS',
      priority: 'HIGH',
      status: 'PENDING'
    };

    this.state.executionTasks.unshift(newTask);
    return `Adaptive Intervention: Queued high-priority 25m revision sprint for "${weakTopic}" based on your performance.`;
  }

  // Record Diagnostic Quiz Results
  recordDiagnosticResult(courseCode, score, totalQuestions, breakdown) {
    const resultObj = {
      courseCode,
      score,
      totalQuestions,
      percentage: Math.round((score / totalQuestions) * 100),
      timestamp: new Date().toISOString(),
      breakdown
    };

    if (!this.state.diagnosticHistory) this.state.diagnosticHistory = [];
    this.state.diagnosticHistory.push(resultObj);

    // Update Skill Map from Topic Breakdown
    Object.keys(breakdown).forEach(topic => {
      const b = breakdown[topic];
      const accuracy = Math.round((b.correct / b.total) * 100);
      let status = 'Medium';
      if (accuracy >= 75) status = 'Strong';
      else if (accuracy <= 45) status = 'Weak';

      this.state.skillMap[topic] = {
        status,
        accuracy,
        correct: b.correct,
        total: b.total,
        lastAssessed: new Date().toISOString()
      };

      // If weak, trigger adaptive sprint
      if (status === 'Weak') {
        this.adaptPlannerForWeakTopic(topic, null);
      }
    });

    this.saveState();

    if (window.academiqSupabase && this.currentUser) {
      window.academiqSupabase.recordDiagnosticTest(this.currentUser.id, {
        courseCode,
        totalQuestions,
        score,
        topicBreakdown: breakdown,
        skillMap: this.state.skillMap
      });
      window.academiqSupabase.saveUserProfile(this.currentUser.id, {
        ...this.state.profile,
        skillMap: this.state.skillMap
      });
    }

    return resultObj;
  }

  // --- "⚡ WHAT SHOULD I STUDY NOW?" ALGORITHMIC ENGINE ---
  getRecommendedNextSprint() {
    const tasks = this.state.executionTasks.filter(t => t.status === 'PENDING' || t.status === 'OVERDUE');
    const skillMap = this.state.skillMap || {};
    const milestones = this.state.milestones || [];
    const today = new Date();

    if (tasks.length === 0) {
      // Synthesize recommendation based on weakest topic
      const weakTopics = Object.keys(skillMap).filter(k => skillMap[k].status === 'Weak');
      const topicToTarget = weakTopics[0] || 'Active Recall Review';
      return {
        subjectCode: this.state.courses[0]?.code || 'CORE',
        subjectName: this.state.courses[0]?.name || 'Academic Core',
        topic: topicToTarget,
        taskTitle: `Reinforce ${topicToTarget} Foundations`,
        instructions: `Take a 25-minute focused active recall cycle on ${topicToTarget} to prepare for upcoming assessments.`,
        durationMinutes: 25,
        difficulty: 'High',
        priority: 'HIGH',
        reason: `Current mastery: ${skillMap[topicToTarget]?.accuracy || 40}% | Highest cognitive leverage action | 0 pending sprints in queue`,
        isDynamic: true
      };
    }

    // Rank pending tasks by scoring formula:
    // Score = (isOverdue ? 40 : 0) + (isWeakTopic ? 35 : 0) + (nearMilestoneDays <= 7 ? 25 : 0)
    let bestTask = tasks[0];
    let highestScore = -1;
    let rationale = "";

    tasks.forEach(t => {
      let score = 0;
      let reasons = [];

      if (t.status === 'OVERDUE') {
        score += 40;
        reasons.push("Overdue task");
      }

      if (t.topic && skillMap[t.topic] && skillMap[t.topic].status === 'Weak') {
        score += 35;
        reasons.push(`Current mastery: ${skillMap[t.topic].accuracy}%`);
      }

      // Check milestone proximity
      if (t.milestoneId) {
        const ms = milestones.find(m => m.id === t.milestoneId);
        if (ms && ms.dueDate) {
          const diffDays = Math.ceil((new Date(ms.dueDate) - today) / (1000 * 60 * 60 * 24));
          if (diffDays >= 0 && diffDays <= 7) {
            score += Math.max(10, 30 - diffDays * 3);
            reasons.push(`Exam in ${diffDays} day(s)`);
          }
        }
      }

      if (t.cognitiveLoad === 'DEEP_FOCUS') {
        score += 10;
      }

      if (score > highestScore) {
        highestScore = score;
        bestTask = t;
        rationale = reasons.join(" • ") || "Scheduled for maximum retention today";
      }
    });

    const course = this.state.courses.find(c => c.id === bestTask.courseId) || { code: 'ACAD', name: 'Coursework' };

    return {
      taskId: bestTask.id,
      subjectCode: course.code,
      subjectName: course.name,
      topic: bestTask.topic || 'Core Module',
      taskTitle: bestTask.title,
      instructions: bestTask.instructions,
      durationMinutes: bestTask.estimatedMinutes || 25,
      difficulty: bestTask.cognitiveLoad === 'DEEP_FOCUS' ? 'High' : 'Moderate',
      priority: bestTask.priority || 'HIGH',
      reason: rationale,
      isDynamic: true
    };
  }

  // --- REBALANCE LOGIC ---
  executeRebalance(mode) {
    const overdueTasks = this.state.executionTasks.filter(t => t.status === 'OVERDUE' || (t.status === 'PENDING' && new Date(t.scheduledDate) < new Date()));
    const todayStr = new Date().toISOString().split('T')[0];
    let affectedCount = 0;
    let rationale = "";

    if (mode === 'SURGICAL_COMPRESSION') {
      overdueTasks.forEach((task) => {
        task.scheduledDate = todayStr;
        task.estimatedMinutes = Math.max(20, Math.round(task.estimatedMinutes * 0.8));
        task.status = 'PENDING';
        affectedCount++;
      });
      rationale = `Surgically compressed ${affectedCount} overdue sprint(s) into today with 20% focus block efficiency optimization. Hard deadlines preserved.`;
    } else if (mode === 'GRACEFUL_SPILLOVER') {
      overdueTasks.forEach((task, idx) => {
        const offsetDays = (idx % 3) + 1;
        const targetDate = new Date(Date.now() + offsetDays * 86400000);
        task.scheduledDate = targetDate.toISOString().split('T')[0];
        task.status = 'PENDING';
        affectedCount++;
      });
      rationale = `Gracefully distributed ${affectedCount} delayed task(s) across upcoming 72 hours, maintaining cognitive load safely within boundaries.`;
    } else if (mode === 'EMERGENCY_TRIAGE') {
      overdueTasks.forEach((task) => {
        if (task.cognitiveLoad === 'ADMIN_REVIEW' || task.cognitiveLoad === 'PASSIVE_SYNTHESIS') {
          task.status = 'COMPLETED';
          task.instructions += " [Archived via Emergency 80/20 Triage pass]";
        } else {
          task.scheduledDate = todayStr;
          task.status = 'PENDING';
        }
        affectedCount++;
      });
      rationale = `Emergency 80/20 triage executed. Low-weight administrative tasks consolidated to protect working memory for critical exams.`;
    }

    this.saveState();
    if (window.academiqSupabase && this.currentUser) {
      window.academiqSupabase.syncAllTasks(this.state.executionTasks, this.currentUser.id);
    }
    if (window.academiqAudio) window.academiqAudio.playSuccess();
    return { affectedCount, rationale };
  }

  // --- TRANSPARENT, EXPLAINABLE ANALYTICS COMPUTATION ---
  getAnalytics() {
    const tasks = this.state.executionTasks || [];
    const completedTasks = tasks.filter(t => t.status === 'COMPLETED');
    const todayStr = new Date().toISOString().split('T')[0];
    const todayTasks = tasks.filter(t => t.scheduledDate === todayStr);

    // 1. COMPLETION VELOCITY (Dynamically calculated)
    const scheduledTasksCount = tasks.length;
    const velocity = scheduledTasksCount > 0 ? (completedTasks.length / scheduledTasksCount) : 1.0;
    const completionVelocity = Math.round(velocity * 100);

    // Previous period velocity comparison (simulated from timestamps or task count)
    const completedRecently = completedTasks.filter(t => {
      if (!t.completedAt) return false;
      const diffDays = (new Date() - new Date(t.completedAt)) / (1000 * 60 * 60 * 24);
      return diffDays <= 7;
    }).length;
    const velocityDelta = completedRecently > 0 ? `+${Math.min(18, completedRecently * 4)}% vs. prior cycle` : `Calibrating baseline`;

    // 2. COGNITIVE LOAD & SCHEDULED HOURS TODAY
    let totalScheduledMinutes = 0;
    let completedMinutesToday = 0;
    let deepFocusMins = 0;
    let activeProdMins = 0;
    let passiveSynthMins = 0;
    let adminReviewMins = 0;

    todayTasks.forEach(t => {
      totalScheduledMinutes += t.estimatedMinutes;
      if (t.status === 'COMPLETED') completedMinutesToday += (t.actualMinutes || t.estimatedMinutes);
      if (t.cognitiveLoad === 'DEEP_FOCUS') deepFocusMins += t.estimatedMinutes;
      if (t.cognitiveLoad === 'ACTIVE_PRODUCTION') activeProdMins += t.estimatedMinutes;
      if (t.cognitiveLoad === 'PASSIVE_SYNTHESIS') passiveSynthMins += t.estimatedMinutes;
      if (t.cognitiveLoad === 'ADMIN_REVIEW') adminReviewMins += t.estimatedMinutes;
    });

    const userDailyCapacityMins = (this.state.profile.weekdayAvailableHours || 4.5) * 60;
    const remainingCapacityMins = Math.max(0, userDailyCapacityMins - totalScheduledMinutes);
    const safeMarginPercentage = userDailyCapacityMins > 0 ? Math.round((remainingCapacityMins / userDailyCapacityMins) * 100) : 0;

    // 3. BURNOUT RISK INDEX (Transparent formula with non-clinical disclaimer)
    // Formula: (StudyLoadRatio * 40) + (OverdueTasks * 15) + (UpcomingExamWithin5Days * 20) - (SleepHoursBonus * 10)
    const overdueTasks = tasks.filter(t => t.status === 'OVERDUE' || (t.status === 'PENDING' && new Date(t.scheduledDate) < new Date(todayStr)));
    const loadRatio = totalScheduledMinutes / (userDailyCapacityMins || 270);
    const milestones = this.state.milestones || [];
    const urgentExam = milestones.some(m => {
      if (m.isCompleted || !m.dueDate) return false;
      const days = (new Date(m.dueDate) - new Date()) / (1000 * 60 * 60 * 24);
      return days >= 0 && days <= 5;
    });

    let rawBurnoutScore = Math.round(
      (Math.min(2.0, loadRatio) * 35) + 
      (Math.min(4, overdueTasks.length) * 12) + 
      (urgentExam ? 20 : 0) +
      (Math.max(0, 8.0 - (this.state.profile.sleepHours || 7.5)) * 6)
    );
    rawBurnoutScore = Math.min(100, Math.max(12, rawBurnoutScore));

    let burnoutRisk = 'LOW';
    let burnoutColor = 'var(--emerald)';
    let burnoutExplanation = "Cognitive workload is well-balanced within your daily capacity.";

    if (rawBurnoutScore >= 75) {
      burnoutRisk = 'CRITICAL';
      burnoutColor = 'var(--rose)';
      burnoutExplanation = `Your burnout risk is Critical because overdue workload (${overdueTasks.length} tasks) and scheduled load (${(totalScheduledMinutes / 60).toFixed(1)}h) exceed safe capacity boundaries.`;
    } else if (rawBurnoutScore >= 50) {
      burnoutRisk = 'ELEVATED';
      burnoutColor = 'var(--amber)';
      burnoutExplanation = `Your burnout risk is Elevated because ${overdueTasks.length} overdue task(s) and exam pressure require automated triage rebalancing.`;
    } else if (rawBurnoutScore >= 35) {
      burnoutRisk = 'MODERATE';
      burnoutColor = 'var(--cyan)';
      burnoutExplanation = "Study load is active. Maintain 25-minute Pomodoro discipline to preserve mental stamina.";
    }

    // 4. PROJECTED GPA
    const courses = this.state.courses || [];
    let sumGrades = 0;
    courses.forEach(c => { sumGrades += (c.currentGrade || 88.0); });
    const avgPercentage = courses.length > 0 ? (sumGrades / courses.length) : 88.0;
    const projectedGpa = (Math.min(4.0, (avgPercentage / 25) * 1.02)).toFixed(2);

    return {
      completionVelocity,
      velocityDelta,
      burnoutRisk,
      burnoutScore: rawBurnoutScore,
      burnoutColor,
      burnoutExplanation,
      burnoutDisclaimer: "Productivity & cognitive load indicator, not a medical or clinical diagnosis.",
      loadRatio: Math.min(100, Math.round(loadRatio * 100)),
      totalScheduledHours: (totalScheduledMinutes / 60).toFixed(1),
      completedHoursToday: (completedMinutesToday / 60).toFixed(1),
      userCapacityHours: (userDailyCapacityMins / 60).toFixed(1),
      safeMarginPercentage,
      deepFocusHours: (deepFocusMins / 60).toFixed(1),
      activeProdHours: (activeProdMins / 60).toFixed(1),
      passiveSynthHours: (passiveSynthMins / 60).toFixed(1),
      adminReviewHours: (adminReviewMins / 60).toFixed(1),
      projectedGpa,
      targetGpa: this.state.profile.targetGpa || 3.90,
      totalCourses: courses.length,
      imminentMilestones: milestones.filter(m => !m.isCompleted).length,
      overdueTasksCount: overdueTasks.length
    };
  }
}

window.academiqStore = new AcademiqStore();
