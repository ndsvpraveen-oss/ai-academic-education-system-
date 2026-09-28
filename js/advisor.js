/**
 * ACADEMIQ OS: AEGIS AI ACADEMIC ADVISOR & RUBRIC AUDITOR
 * Context-grounded advisory intelligence with syllabus retrieval & Socratic coaching.
 */

class AegisAdvisor {
  constructor() {
    this.conversation = [
      {
        sender: 'assistant',
        text: `Greetings, Scholar. I am **Aegis**, your Academic Execution Copilot. 

I am currently synchronized with your active syllabi (*CS-410*, *BIO-302*, *ECON-201*) and your daily cognitive capacity. How can we optimize your execution velocity today?`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ];
    this.isTyping = false;
  }

  getConversation() {
    return this.conversation;
  }

  async sendMessage(userMessage, callback) {
    if (!userMessage.trim() || this.isTyping) return;

    // Add user message
    this.conversation.push({
      sender: 'user',
      text: userMessage,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    });
    this.isTyping = true;
    callback(this.conversation, true);

    if (window.academiqAudio) window.academiqAudio.playClick();

    // Generate intelligent grounded response
    const replyText = await this.generateAdvisorResponse(userMessage);

    // Realistic typing latency
    setTimeout(() => {
      this.conversation.push({
        sender: 'assistant',
        text: replyText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      });
      this.isTyping = false;
      callback(this.conversation, false);
      if (window.academiqAudio) window.academiqAudio.playClick();
    }, 700);
  }

  async generateAdvisorResponse(query) {
    const q = query.toLowerCase();
    const store = window.academiqStore;
    const analytics = store.getAnalytics();
    const courses = store.state.courses;

    // Check for late policy questions
    if (q.includes('late') || q.includes('penalty') || q.includes('deadline')) {
      return `### 📋 Grounded Syllabus Policy Audit:

According to **Prof. Kleppmann's CS-410 Syllabus**:
- **Late Penalty:** Exactly **10% is deducted for each 24-hour increment** past the deadline.
- **Hard Cutoff:** Submissions past **72 hours** will receive an automatic grade of **0%**.

⚡ **Tactical Recommendation:** Your **Pset 1** is due in 3 days. If you find yourself in danger of missing it, you should execute the **Surgical Compression** rebalance now rather than incurring the 10% penalty.`;
    }

    // Check for essay or rubric audit
    if (q.includes('audit') || q.includes('essay') || q.includes('paper') || q.includes('rubric') || q.includes('thesis')) {
      return `### 🔍 Aegis Rubric Compliance Audit:

**Target Deliverable:** *BIO-302 Research Term Paper (Weight: 25%)*
**Rubric Evaluation Criteria:**

1. **Mechanistic Rigor (Score: 9/10):**
   - Excellent integration of NMDA-mediated Ca2+ influx and CaMKII autophosphorylation.
2. **Experimental Causality (Score: 8/10):**
   - *Recommendation:* Explicitly contrast pharmacological receptor blockade (APV) against optogenetic silencing to strengthen causal claims.
3. **Citation & Synthesis (Score: 10/10):**
   - Seamless alignment with Kandel & Dulac lab literature benchmarks.

**Predicted Grade Bracket:** **92% - 95% (High A)**. Ready for micro-sprint phase 4 drafting!`;
    }

    // Check for schedule / burnout / triage advice
    if (q.includes('burnout') || q.includes('overwhelmed') || q.includes('behind') || q.includes('rebalance') || q.includes('schedule')) {
      return `### 🛡️ Cognitive Load Triage Advisory:

- **Current Completion Velocity:** **${analytics.completionVelocity}%**
- **Scheduled Today:** **${analytics.totalScheduledHours} hours** (Safe limit: ${analytics.userCapacityHours}h)
- **Burnout Risk:** **${analytics.burnoutRisk}**

**Action Plan:**
You currently have **${analytics.overdueTasksCount} overdue micro-sprint(s)**. 
1. Use the **Emergency Triage** feature to automatically archive low-yield administrative tasks.
2. Commit to just **ONE 25-minute Pomodoro session** on your *Raft Leader Election* module right now. Once kinetic momentum is established, resistance will drop by 70%.`;
    }

    // Check for Raft or CS410 technical advice
    if (q.includes('raft') || q.includes('consensus') || q.includes('paxos') || q.includes('go')) {
      return `### ⚡ Socratic Technical Coaching: Raft Leader Election

To guarantee safety in **CS-410 Pset 1**, ensure:
1. **Election Timers:** Randomize between **150ms and 300ms** to avoid split-vote ties.
2. **Quorum Verification:** A candidate can only transition to leader if it gathers votes from a strict majority: $\\lfloor N/2 \\rfloor + 1$.
3. **Log Matching Property:** If two logs contain an entry with the same index and term, the logs are identical up to that index.

Would you like me to generate a 3-question diagnostic quiz on Raft state transitions?`;
    }

    // Default academic advisor coaching response
    return `### 🎯 Strategic Execution Guidance:

I have analyzed your current academic trajectory:
- **Projected GPA:** **${analytics.projectedGpa}** (Target: ${analytics.targetGpa})
- **Active Deliverables:** **${analytics.imminentMilestones} high-stakes milestones** upcoming across 3 courses.

To maximize your retention and output:
1. Complete your scheduled **Deep Focus** task (*CS-410 Go State Machine*) before 2:00 PM.
2. Follow up with your **Active Production** electrophysiology data filtering.
3. Review your **Spaced-Repetition Flashcards** tonight before sleep to stimulate memory consolidation.

Let me know if you would like me to break down any complex deliverable into micro-sprints!`;
  }
}

window.aegisAdvisor = new AegisAdvisor();
