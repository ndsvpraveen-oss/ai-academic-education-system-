/**
 * ACADEMIQ OS: AI COGNITIVE EXECUTION GATEWAY
 * Connects to Google Gemini API (models/gemini-flash-latest)
 * Provides: Chat, Syllabus Ingestion, Active Recall Generation, Diagnostic Generator, Next Sprint Optimizer.
 */

const https = require('https');

// Helper to make HTTPS requests to Gemini API
function callGemini(apiKey, systemInstruction, prompt, responseJson = false) {
  const models = ['gemini-flash-lite-latest', 'gemini-flash-latest', 'gemini-3.8-flash'];
  
  return new Promise(async (resolve, reject) => {
    let lastError = null;

    for (const model of models) {
      try {
        const result = await attemptGeminiModel(apiKey, model, systemInstruction, prompt, responseJson);
        return resolve(result);
      } catch (err) {
        lastError = err;
        console.warn(`[AI Engine] Model ${model} failed, trying fallback:`, err.message || err);
      }
    }

    reject(lastError || new Error("All AI models unavailable."));
  });
}

function attemptGeminiModel(apiKey, model, systemInstruction, prompt, responseJson) {
  return new Promise((resolve, reject) => {
    const payload = {
      contents: [
        {
          role: 'user',
          parts: [
            { text: systemInstruction ? `${systemInstruction}\n\nTask:\n${prompt}` : prompt }
          ]
        }
      ],
      generationConfig: {
        temperature: 0.4,
        maxOutputTokens: 2048,
        ...(responseJson ? { responseMimeType: "application/json" } : {})
      }
    };

    const data = JSON.stringify(payload);
    const options = {
      hostname: 'generativelanguage.googleapis.com',
      port: 443,
      path: `/v1beta/models/${model}:generateContent?key=${apiKey}`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
      },
      timeout: 25000
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        if (res.statusCode < 200 || res.statusCode >= 300) {
          return reject(new Error(`Gemini API returned status ${res.statusCode}: ${body.slice(0, 300)}`));
        }

        try {
          const parsed = JSON.parse(body);
          const candidate = parsed.candidates && parsed.candidates[0];
          if (!candidate || !candidate.content || !candidate.content.parts || !candidate.content.parts[0]) {
            return reject(new Error("Empty response parts from Gemini API"));
          }
          const text = candidate.content.parts[0].text;
          resolve(text);
        } catch (e) {
          reject(new Error(`Failed to parse Gemini response: ${e.message}`));
        }
      });
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error(`Gemini API request timed out on model ${model}`));
    });

    req.on('error', (e) => reject(e));
    req.write(data);
    req.end();
  });
}

// Clean markdown code blocks if returning JSON
function cleanJson(str) {
  let cleaned = str.trim();
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.replace(/^```json\s*/, '').replace(/\s*```$/, '');
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```\s*/, '').replace(/\s*```$/, '');
  }
  return cleaned;
}

module.exports = async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    return res.end();
  }

  if (req.method !== 'POST') {
    res.statusCode = 405;
    return res.end(JSON.stringify({ error: "Method not allowed. Use POST." }));
  }

  // Parse Body
  let rawBody = '';
  req.on('data', chunk => rawBody += chunk);
  req.on('end', async () => {
    let body = {};
    try {
      body = JSON.parse(rawBody || '{}');
    } catch (e) {
      res.statusCode = 400;
      return res.end(JSON.stringify({ error: "Invalid JSON request body" }));
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      res.statusCode = 500;
      return res.end(JSON.stringify({ error: "GEMINI_API_KEY environment variable is not configured." }));
    }

    const { action } = body;
    res.setHeader('Content-Type', 'application/json');

    try {
      // ACTION 1: AEGIS ADVISOR CHAT (Context-Aware)
      if (action === 'chat') {
        const { message, context, conversationHistory } = body;
        if (!message) {
          res.statusCode = 400;
          return res.end(JSON.stringify({ error: "Missing message field" }));
        }

        const studentProfile = context?.profile || {};
        const enrolledCourses = context?.courses || [];
        const skillMap = context?.skillMap || {};
        const recentPerformance = context?.recentPerformance || {};
        const tasks = context?.tasks || [];
        const milestones = context?.milestones || [];
        const analytics = context?.analytics || {};

        const systemPrompt = `You are Aegis, the elite AI Academic Execution Copilot in the Academiq 3D OS platform.
You are grounded in this specific authenticated student's real academic record.
NEVER invent fictitious courses or fictitious statistics. Always directly refer to and analyze the student's actual performance data provided below:

STUDENT PROFILE:
- Name: ${studentProfile.fullName || 'Scholar'}
- Institution: ${studentProfile.institution || 'University'}
- Major / Degree: ${studentProfile.major || 'Undergraduate'}
- Target GPA: ${studentProfile.targetGpa || 3.9} | Current Projected GPA: ${analytics.projectedGpa || '3.80'}
- Enrolled Courses: ${enrolledCourses.map(c => `${c.code}: ${c.name} (Grade: ${c.currentGrade}%)`).join(', ') || 'General Studies'}

DIAGNOSTIC & ACTIVE RECALL SKILL MAP:
${Object.keys(skillMap).length > 0 ? JSON.stringify(skillMap, null, 2) : 'No diagnostic completed yet. Suggest running a diagnostic test to generate skill map.'}

RECENT ACCURACY:
- Active Recall Accuracy: ${recentPerformance.recallAccuracy != null ? `${recentPerformance.recallAccuracy}%` : 'N/A'}
- Diagnostic Score: ${recentPerformance.diagnosticScore != null ? recentPerformance.diagnosticScore : 'N/A'}
- Weak Topics Identified: ${recentPerformance.weakTopics ? recentPerformance.weakTopics.join(', ') : 'None marked weak'}

CURRENT EXECUTION LOAD:
- Completion Velocity: ${analytics.completionVelocity != null ? `${analytics.completionVelocity}%` : '80%'}
- Burnout Risk: ${analytics.burnoutRisk || 'LOW'}
- Overdue Micro-sprints: ${analytics.overdueTasksCount || 0}
- Upcoming Major Deliverables/Exams: ${milestones.slice(0, 4).map(m => `${m.title} (Due: ${m.dueDate})`).join('; ') || 'None scheduled'}

GUIDELINES:
- When the student asks why they are struggling or how to improve, cite their actual weak topics, accuracy percentages, and exam deadlines!
- Formulate practical, concise, tactical Socratic advice (Pomodoro sprints, Leitner active recall, triage rebalancing).
- Keep formatting clean with markdown headings and bullet points.`;

        const reply = await callGemini(apiKey, systemPrompt, message, false);
        res.statusCode = 200;
        return res.end(JSON.stringify({ success: true, reply }));
      }

      // ACTION 2: ACTIVE RECALL GENERATION
      if (action === 'generate_recall') {
        const { subject, topic, count = 4 } = body;
        const systemPrompt = `You are an expert cognitive scientist and university professor specializing in spaced repetition and active recall.
Generate exactly ${count} rigorous, high-yield conceptual flashcards for university students.
Return a STRICT JSON array of objects with the following schema:
[
  {
    "id": "card-1",
    "question": "Clear, precise active recall question that tests deep conceptual understanding, mechanisms, or tradeoffs (not mere trivia)",
    "answer": "Concise, definitive correct answer highlighting core principles",
    "explanation": "Detailed rubric explanation explaining why this mechanism works, common misconceptions, and practical applications",
    "topic": "${topic || 'General'}",
    "mastery": 1
  }
]`;

        const userPrompt = `Subject: ${subject || 'Computer Science'}\nTopic: ${topic || 'Core Concepts'}\nGenerate ${count} active recall cards. Output ONLY valid JSON array.`;
        const rawJson = await callGemini(apiKey, systemPrompt, userPrompt, true);
        const parsedCards = JSON.parse(cleanJson(rawJson));
        
        res.statusCode = 200;
        return res.end(JSON.stringify({ success: true, cards: parsedCards }));
      }

      // ACTION 3: DIAGNOSTIC SELF-TEST GENERATION
      if (action === 'generate_diagnostic') {
        const { subject, topics = [], count = 5 } = body;
        const systemPrompt = `You are a university examination board specialist.
Generate ${count} diagnostic multiple-choice assessment questions for the course/subject: "${subject}".
The questions must test distinct topics (e.g. ${topics.length > 0 ? topics.join(', ') : 'core foundational topics'}).
Return a STRICT JSON array of question objects with this schema:
[
  {
    "id": "diag-q1",
    "topic": "Name of specific sub-topic (e.g. Deadlocks, Scheduling, Memory, Synchronization)",
    "question": "Clear, challenging question testing fundamental principles or tradeoffs",
    "options": [
      "A. Detailed option text",
      "B. Detailed option text",
      "C. Detailed option text",
      "D. Detailed option text"
    ],
    "correctIndex": 0,
    "explanation": "Why the correct option is right and the others are flawed."
  }
]`;

        const userPrompt = `Generate a ${count}-question diagnostic self-test for "${subject}". Include 4 options per question with 0-indexed correctIndex. Output ONLY valid JSON array.`;
        const rawJson = await callGemini(apiKey, systemPrompt, userPrompt, true);
        const questions = JSON.parse(cleanJson(rawJson));

        res.statusCode = 200;
        return res.end(JSON.stringify({ success: true, questions }));
      }

      // ACTION 4: SYLLABUS DECONSTRUCTION
      if (action === 'deconstruct_syllabus') {
        const { courseCode, courseName, rawText } = body;
        const systemPrompt = `You are an elite academic curriculum deconstruction engine.
Analyze the following course syllabus and extract key milestones, grading policies, weighted categories, and a sequence of actionable 25-minute micro-sprints.
Return a STRICT JSON object with this schema:
{
  "instructor": "Extracted instructor name or 'Faculty Lead'",
  "instructorEmail": "Extracted email or 'dept@univ.edu'",
  "officeHours": "Extracted office hours or 'By appointment'",
  "gradeWeights": [
    { "categoryName": "Category (e.g. Midterm)", "weightPercentage": 30 }
  ],
  "deliverables": [
    { "title": "Milestone title", "type": "EXAM | PROJECT | PSET", "dueDate": "YYYY-MM-DD or approx date", "weightPercentage": 25 }
  ],
  "microSprints": [
    {
      "title": "Actionable micro-sprint title (e.g. Implement Raft RPC Wire Protocol)",
      "instructions": "Specific 1-2 sentence focus instructions",
      "estimatedMinutes": 25,
      "cognitiveLoad": "DEEP_FOCUS | ACTIVE_PRODUCTION | PASSIVE_SYNTHESIS | ADMIN_REVIEW",
      "topic": "Core topic name"
    }
  ]
}`;

        const userPrompt = `Course Code: ${courseCode}\nCourse Name: ${courseName}\nSyllabus Content:\n${rawText || 'Standard introductory syllabus'}\n\nDeconstruct now. Output ONLY valid JSON.`;
        const rawJson = await callGemini(apiKey, systemPrompt, userPrompt, true);
        const deconstructed = JSON.parse(cleanJson(rawJson));

        res.statusCode = 200;
        return res.end(JSON.stringify({ success: true, data: deconstructed }));
      }

      // ACTION 5: "⚡ WHAT SHOULD I STUDY NOW?"
      if (action === 'recommend_study_now') {
        const { courses = [], milestones = [], tasks = [], skillMap = {}, availableMinutes = 25 } = body;
        
        const systemPrompt = `You are the Academiq OS Algorithmic Execution Recommender.
Given the student's enrolled courses, upcoming deadlines, skill map with weak topics, and active tasks, select or synthesize the SINGLE BEST 25-minute micro-sprint to execute right now.
Prioritize:
1. Urgent high-weight upcoming milestones (< 7 days)
2. Weak topics identified in diagnostic / recall tests
3. Highest cognitive leverage action
Return a STRICT JSON object:
{
  "subjectCode": "Course code (e.g. CS-410)",
  "subjectName": "Course name",
  "topic": "Specific topic (e.g. Deadlocks)",
  "taskTitle": "Precise sprint task title",
  "instructions": "Tactical guidance for this 25m sprint",
  "durationMinutes": 25,
  "difficulty": "Moderate | High | Critical",
  "priority": "HIGH",
  "reason": "Explainable rationale: Exam in X days | Current mastery Y% | High syllabus weight | Recent weak performance",
  "metrics": {
    "examProximityDays": 6,
    "masteryPercentage": 42,
    "urgencyScore": 88
  }
}`;

        const userPrompt = `Student Data:
Courses: ${JSON.stringify(courses.map(c => ({ code: c.code, name: c.name, grade: c.currentGrade })))}
Milestones: ${JSON.stringify(milestones.slice(0, 5))}
Weak Topics: ${JSON.stringify(skillMap)}
Pending Tasks: ${JSON.stringify(tasks.filter(t => t.status === 'PENDING').slice(0, 5))}
Available Minutes: ${availableMinutes}
Output ONLY valid JSON.`;

        const rawJson = await callGemini(apiKey, systemPrompt, userPrompt, true);
        const recommendation = JSON.parse(cleanJson(rawJson));

        res.statusCode = 200;
        return res.end(JSON.stringify({ success: true, recommendation }));
      }

      res.statusCode = 400;
      return res.end(JSON.stringify({ error: `Unknown action: ${action}` }));

    } catch (err) {
      console.error("[api/ai] Execution error:", err);
      res.statusCode = 500;
      return res.end(JSON.stringify({
        error: "AI generation failed. Please retry.",
        details: err.message
      }));
    }
  });
};
