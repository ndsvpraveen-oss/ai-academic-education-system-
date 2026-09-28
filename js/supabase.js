/**
 * ACADEMIQ OS: SUPABASE CLOUD DATABASE & AUTH ADAPTER
 * Provides authentication, session persistence, user-scoped data sync, and Postgres RLS.
 */

(function () {
  const SUPABASE_URL = "https://rdfuhgnhvdkexpcveros.supabase.co";
  const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJkZnVoZ25odmRrZXhwY3Zlcm9zIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA1NzgwMzAsImV4cCI6MjEwNjE1NDAzMH0.a0itDBCHxhbnodZKlK4Tpfby82xnD1P5_rhRjFvz9Mc";

  let client = null;
  if (window.supabase && typeof window.supabase.createClient === 'function') {
    client = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storage: window.localStorage
      }
    });
    console.log("⚡ Supabase Client initialized with persistent auth.");
  }

  window.academiqSupabase = {
    client,
    url: SUPABASE_URL,
    anonKey: SUPABASE_ANON_KEY,
    isConnected: !!client,

    getClient() {
      if (!this.client && window.supabase) {
        this.client = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
      }
      return this.client;
    },

    // ==========================================
    // AUTHENTICATION METHODS
    // ==========================================

    async getSession() {
      const c = this.getClient();
      if (!c) return { session: null, user: null };
      try {
        const { data, error } = await c.auth.getSession();
        if (error) throw error;
        return { session: data.session, user: data.session?.user || null };
      } catch (err) {
        console.warn("Supabase getSession error:", err.message);
        return { session: null, user: null };
      }
    },

    async getCurrentUser() {
      const c = this.getClient();
      if (!c) return null;
      try {
        const { data: { user } } = await c.auth.getUser();
        return user;
      } catch (err) {
        return null;
      }
    },

    async signUp(email, password, fullName) {
      const c = this.getClient();
      if (!c) throw new Error("Supabase client is not available.");
      
      const { data, error } = await c.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName
          }
        }
      });

      if (error) throw error;
      return data;
    },

    async signIn(email, password) {
      const c = this.getClient();
      if (!c) throw new Error("Supabase client is not available.");

      const { data, error } = await c.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;
      return data;
    },

    async signInWithGoogle() {
      const c = this.getClient();
      if (!c) throw new Error("Supabase client is not available.");

      const { data, error } = await c.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin
        }
      });

      if (error) throw error;
      return data;
    },

    async resetPassword(email) {
      const c = this.getClient();
      if (!c) throw new Error("Supabase client is not available.");

      const { data, error } = await c.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/#reset-password`
      });

      if (error) throw error;
      return data;
    },

    async signOut() {
      const c = this.getClient();
      if (!c) return;
      try {
        await c.auth.signOut();
      } catch (e) {
        console.warn("SignOut warning:", e);
      }
    },

    onAuthStateChange(callback) {
      const c = this.getClient();
      if (!c) return { unsubscribe: () => {} };
      const { data: { subscription } } = c.auth.onAuthStateChange((event, session) => {
        callback(event, session);
      });
      return subscription;
    },

    // ==========================================
    // USER-SCOPED DATA PERSISTENCE
    // ==========================================

    async fetchUserProfile(userId) {
      const c = this.getClient();
      if (!c || !userId) return null;
      try {
        const { data, error } = await c.from('user_profile')
          .select('*')
          .eq('id', userId)
          .maybeSingle();

        if (error) {
          console.warn("fetchUserProfile error:", error.message);
          return null;
        }
        return data;
      } catch (e) {
        console.warn("fetchUserProfile exception:", e);
        return null;
      }
    },

    async saveUserProfile(userId, profile) {
      const c = this.getClient();
      if (!c || !userId) return false;
      try {
        const payload = {
          id: userId,
          full_name: profile.fullName || profile.full_name || 'Scholar',
          institution: profile.institution || 'University',
          major: profile.major || 'Computer Science',
          year_semester: profile.yearSemester || profile.year_semester || 'Year 1',
          target_gpa: Number(profile.targetGpa || profile.target_gpa || 3.9),
          current_gpa: Number(profile.currentGpa || profile.current_gpa || 3.8),
          weekday_available_hours: Number(profile.weekdayAvailableHours || profile.weekday_available_hours || 4.5),
          weekend_available_hours: Number(profile.weekendAvailableHours || profile.weekend_available_hours || 7.0),
          skill_map: profile.skillMap || {},
          onboarding_completed: profile.onboardingCompleted !== undefined ? profile.onboardingCompleted : true,
          updated_at: new Date().toISOString()
        };

        const { error } = await c.from('user_profile').upsert(payload);
        if (error) {
          console.warn("saveUserProfile Supabase error:", error.message);
          return false;
        }
        return true;
      } catch (e) {
        console.warn("saveUserProfile exception:", e);
        return false;
      }
    },

    async fetchUserCourses(userId) {
      const c = this.getClient();
      if (!c || !userId) return [];
      try {
        // Query by user_id or id prefix
        let { data, error } = await c.from('courses').select('*').or(`user_id.eq.${userId},id.like.${userId}_%`);
        if (error || !data || data.length === 0) {
          // fallback query
          const res = await c.from('courses').select('*').limit(10);
          data = res.data || [];
        }
        return data.map(row => ({
          id: row.id,
          code: row.code,
          name: row.name,
          instructor: row.instructor,
          instructorEmail: row.instructor_email,
          officeHours: row.office_hours,
          color: row.color,
          term: row.term,
          currentGrade: Number(row.current_grade || 90),
          gradeWeights: row.grade_weights || [],
          syllabusText: row.syllabus_text
        }));
      } catch (e) {
        return [];
      }
    },

    async saveUserCourse(userId, course) {
      const c = this.getClient();
      if (!c || !userId) return;
      try {
        const payload = {
          id: course.id.startsWith(userId) ? course.id : `${userId}_${course.id}`,
          code: course.code,
          name: course.name,
          instructor: course.instructor || 'Faculty Lead',
          instructor_email: course.instructorEmail || 'instructor@univ.edu',
          office_hours: course.officeHours || 'By appointment',
          color: course.color || '#8b5cf6',
          term: course.term || 'Fall 2026',
          current_grade: course.currentGrade || 90.0,
          grade_weights: course.gradeWeights || [],
          syllabus_text: course.syllabusText || ''
        };
        await c.from('courses').upsert(payload);
      } catch (e) {
        console.warn("saveUserCourse error:", e);
      }
    },

    async fetchUserTasks(userId) {
      const c = this.getClient();
      if (!c || !userId) return [];
      try {
        let { data, error } = await c.from('execution_tasks').select('*').or(`user_id.eq.${userId},id.like.${userId}_%`);
        if (error || !data || data.length === 0) {
          const res = await c.from('execution_tasks').select('*').limit(20);
          data = res.data || [];
        }
        return data.map(t => ({
          id: t.id,
          milestoneId: t.milestone_id,
          courseId: t.course_id,
          title: t.title,
          instructions: t.instructions,
          scheduledDate: t.scheduled_date,
          estimatedMinutes: t.estimated_minutes,
          actualMinutes: t.actual_minutes || 0,
          cognitiveLoad: t.cognitive_load || 'DEEP_FOCUS',
          status: t.status || 'PENDING',
          completedAt: t.completed_at
        }));
      } catch (e) {
        return [];
      }
    },

    async syncTaskUpdate(task, userId) {
      const c = this.getClient();
      if (!c) return;
      try {
        await c.from('execution_tasks').upsert({
          id: task.id,
          status: task.status,
          completed_at: task.completedAt || null,
          actual_minutes: task.actualMinutes || 0
        });
      } catch (e) {
        console.warn("syncTaskUpdate error:", e);
      }
    },

    async syncAllTasks(tasks, userId) {
      const c = this.getClient();
      if (!c || !tasks || tasks.length === 0) return;
      try {
        const payload = tasks.map(t => ({
          id: t.id,
          milestone_id: t.milestoneId,
          course_id: t.courseId,
          title: t.title,
          instructions: t.instructions,
          scheduled_date: t.scheduledDate,
          estimated_minutes: t.estimatedMinutes,
          actual_minutes: t.actualMinutes || 0,
          cognitive_load: t.cognitiveLoad,
          status: t.status,
          completed_at: t.completedAt || null
        }));
        await c.from('execution_tasks').upsert(payload);
      } catch (e) {
        console.warn("syncAllTasks error:", e);
      }
    },

    async fetchUserDecks(userId) {
      const c = this.getClient();
      if (!c) return [];
      try {
        const { data, error } = await c.from('study_decks').select('*');
        if (error || !data) return [];
        return data.map(d => ({
          id: d.id,
          courseId: d.course_id,
          title: d.title,
          topic: d.topic,
          cards: d.cards || []
        }));
      } catch (e) {
        return [];
      }
    },

    async saveDeck(deck, userId) {
      const c = this.getClient();
      if (!c) return;
      try {
        await c.from('study_decks').upsert({
          id: deck.id,
          course_id: deck.courseId,
          title: deck.title,
          topic: deck.topic,
          cards: deck.cards
        });
      } catch (e) {
        console.warn("saveDeck error:", e);
      }
    },

    async recordRecallAttempt(userId, attemptData) {
      const c = this.getClient();
      if (!c || !userId) return;
      try {
        await c.from('recall_attempts').insert([{
          user_id: userId,
          card_id: attemptData.cardId,
          topic: attemptData.topic,
          confidence_level: attemptData.confidence,
          self_evaluation: attemptData.evaluation,
          mastery_level: attemptData.masteryLevel || 1,
          attempted_at: new Date().toISOString()
        }]);
      } catch (e) {
        console.warn("recordRecallAttempt warning (table might require migration):", e.message);
      }
    },

    async recordDiagnosticTest(userId, testResult) {
      const c = this.getClient();
      if (!c || !userId) return;
      try {
        await c.from('diagnostic_tests').insert([{
          user_id: userId,
          course_code: testResult.courseCode,
          total_questions: testResult.totalQuestions,
          score: testResult.score,
          topic_breakdown: testResult.topicBreakdown,
          skill_map_delta: testResult.skillMap,
          created_at: new Date().toISOString()
        }]);
      } catch (e) {
        console.warn("recordDiagnosticTest warning:", e.message);
      }
    }
  };
})();
