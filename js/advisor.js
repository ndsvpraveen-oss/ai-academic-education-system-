/**
 * ACADEMIQ OS: AEGIS AI ACADEMIC ADVISOR & SOCRATIC COPILOT
 * Context-grounded advisory intelligence with real Gemini API integration,
 * live telemetry synchronization, and syllabus/performance auditing.
 */

class AegisAdvisor {
  constructor() {
    this.conversation = [
      {
        sender: 'assistant',
        text: `### 🛡️ Aegis Academic Copilot Initialized
Greetings, Scholar. I am synchronized with your active courses, current skill map, and cognitive workload telemetry.

Ask me anything about your syllabi, why you might be struggling with a topic, or how to triage your upcoming sprint schedule.`,
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

    // Call live AI backend
    try {
      const replyText = await this.generateAdvisorResponse(userMessage);
      this.conversation.push({
        sender: 'assistant',
        text: replyText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      });
    } catch (err) {
      console.error("Aegis generation error:", err);
      this.conversation.push({
        sender: 'assistant',
        text: `⚠️ **AI generation failed. Please retry.**\n\n_${err.message || 'Unable to establish secure handshake with Gemini cognitive gateway.'}_\n\n<button class="btn-action btn-secondary" style="font-size:12px; margin-top:8px;" onclick="window.aegisAdvisor.retryLastMessage()">🔄 Retry Query</button>`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      });
    } finally {
      this.isTyping = false;
      callback(this.conversation, false);
      if (window.academiqAudio) window.academiqAudio.playClick();
    }
  }

  retryLastMessage() {
    const lastUserMsg = [...this.conversation].reverse().find(m => m.sender === 'user');
    if (lastUserMsg) {
      const chatInput = document.getElementById('advisor-input-field');
      if (chatInput) chatInput.value = lastUserMsg.text;
      const sendBtn = document.getElementById('advisor-send-btn');
      if (sendBtn) sendBtn.click();
    }
  }

  async generateAdvisorResponse(query) {
    const store = window.academiqStore;
    const state = store.state;
    const analytics = store.getAnalytics();

    // Gather authentic student context
    const weakTopics = Object.keys(state.skillMap || {}).filter(k => state.skillMap[k].status === 'Weak');
    
    // Calculate recent recall accuracy
    let totalRecallAttempts = 0;
    let successfulRecallAttempts = 0;
    (state.studyDecks || []).forEach(d => {
      (d.cards || []).forEach(c => {
        if (c.lastConfidence != null) {
          totalRecallAttempts++;
          if (c.lastConfidence >= 3) successfulRecallAttempts++;
        }
      });
    });
    const recallAccuracy = totalRecallAttempts > 0 ? Math.round((successfulRecallAttempts / totalRecallAttempts) * 100) : 40;

    const contextPayload = {
      profile: state.profile,
      courses: state.courses,
      skillMap: state.skillMap,
      recentPerformance: {
        recallAccuracy,
        weakTopics,
        diagnosticScore: state.diagnosticHistory?.length > 0 ? `${state.diagnosticHistory[state.diagnosticHistory.length - 1].score}/${state.diagnosticHistory[state.diagnosticHistory.length - 1].totalQuestions}` : null
      },
      tasks: state.executionTasks,
      milestones: state.milestones,
      analytics
    };

    const resp = await fetch('/api/ai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'chat',
        message: query,
        context: contextPayload
      })
    });

    if (!resp.ok) {
      const errData = await resp.json().catch(() => ({}));
      throw new Error(errData.error || `Server responded with status ${resp.status}`);
    }

    const data = await resp.json();
    if (!data.reply) {
      throw new Error("Received empty advisory reply from AI engine.");
    }

    return data.reply;
  }
}

window.aegisAdvisor = new AegisAdvisor();
