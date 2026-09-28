/**
 * ACADEMIQ OS: SUPABASE CLOUD DATABASE ADAPTER
 * Provides real-time Postgres synchronization, optimistic offline caching, and database queries.
 */

(function () {
  const SUPABASE_URL = "https://rdfuhgnhvdkexpcveros.supabase.co";
  const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJkZnVoZ25odmRrZXhwY3Zlcm9zIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA1NzgwMzAsImV4cCI6MjEwNjE1NDAzMH0.a0itDBCHxhbnodZKlK4Tpfby82xnD1P5_rhRjFvz9Mc";

  let client = null;
  if (window.supabase && typeof window.supabase.createClient === 'function') {
    client = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    console.log("⚡ Supabase Client initialized successfully.");
  }

  window.academiqSupabase = {
    client,
    url: SUPABASE_URL,
    anonKey: SUPABASE_ANON_KEY,
    isConnected: !!client,

    // Initial Database Seeder: checks if database is empty, and populates with initial data
    async seedIfEmpty(initialData) {
      if (!this.client && window.supabase) {
        this.client = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
      }
      if (!this.client) return;

      try {
        const { data: existingCourses, error } = await this.client.from('courses').select('id').limit(1);
        if (error) {
          console.warn("Checking courses in Supabase:", error);
          return;
        }

        if (!existingCourses || existingCourses.length === 0) {
          console.log("🌱 Supabase database is empty. Seeding initial academic data...");

          // 1. Seed Profile
          await this.client.from('user_profile').upsert([{
            id: 'default_user',
            full_name: initialData.profile.fullName,
            institution: initialData.profile.institution,
            major: initialData.profile.major,
            target_gpa: initialData.profile.targetGpa,
            current_gpa: initialData.profile.currentGpa,
            weekday_available_hours: initialData.profile.weekdayAvailableHours,
            weekend_available_hours: initialData.profile.weekendAvailableHours
          }]);

          // 2. Seed Courses
          const coursesPayload = initialData.courses.map(c => ({
            id: c.id,
            code: c.code,
            name: c.name,
            instructor: c.instructor,
            instructor_email: c.instructorEmail,
            office_hours: c.officeHours,
            color: c.color,
            term: c.term,
            current_grade: c.currentGrade,
            grade_weights: c.gradeWeights,
            syllabus_text: c.syllabusText
          }));
          await this.client.from('courses').insert(coursesPayload);

          // 3. Seed Milestones
          const milestonesPayload = initialData.milestones.map(m => ({
            id: m.id,
            course_id: m.courseId,
            title: m.title,
            description: m.description,
            type: m.type,
            due_date: m.dueDate,
            weight_percentage: m.weightPercentage,
            is_completed: m.isCompleted
          }));
          await this.client.from('milestones').insert(milestonesPayload);

          // 4. Seed Tasks
          const tasksPayload = initialData.executionTasks.map(t => ({
            id: t.id,
            milestone_id: t.milestoneId,
            course_id: t.courseId,
            title: t.title,
            instructions: t.instructions,
            scheduled_date: t.scheduledDate,
            estimated_minutes: t.estimatedMinutes,
            actual_minutes: t.actualMinutes,
            cognitive_load: t.cognitiveLoad,
            status: t.status,
            completed_at: t.completedAt || null
          }));
          await this.client.from('execution_tasks').insert(tasksPayload);

          // 5. Seed Study Decks
          const decksPayload = initialData.studyDecks.map(d => ({
            id: d.id,
            course_id: d.courseId,
            title: d.title,
            topic: d.topic,
            cards: d.cards
          }));
          await this.client.from('study_decks').insert(decksPayload);

          console.log("✅ Supabase seeding completed successfully!");
        }
      } catch (err) {
        console.error("Supabase seeding error:", err);
      }
    },

    // Pull full remote state
    async fetchRemoteState() {
      if (!this.client && window.supabase) {
        this.client = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
      }
      if (!this.client) return null;

      try {
        const [coursesRes, tasksRes, milestonesRes, decksRes, profileRes] = await Promise.all([
          this.client.from('courses').select('*'),
          this.client.from('execution_tasks').select('*').order('created_at', { ascending: true }),
          this.client.from('milestones').select('*').order('due_date', { ascending: true }),
          this.client.from('study_decks').select('*'),
          this.client.from('user_profile').select('*').limit(1)
        ]);

        if (coursesRes.error || !coursesRes.data || coursesRes.data.length === 0) {
          return null;
        }

        const courses = coursesRes.data.map(c => ({
          id: c.id,
          code: c.code,
          name: c.name,
          instructor: c.instructor,
          instructorEmail: c.instructor_email,
          officeHours: c.office_hours,
          color: c.color,
          term: c.term,
          currentGrade: Number(c.current_grade),
          gradeWeights: c.grade_weights || [],
          syllabusText: c.syllabus_text
        }));

        const executionTasks = (tasksRes.data || []).map(t => ({
          id: t.id,
          milestoneId: t.milestone_id,
          courseId: t.course_id,
          title: t.title,
          instructions: t.instructions,
          scheduledDate: t.scheduled_date,
          estimatedMinutes: t.estimated_minutes,
          actualMinutes: t.actual_minutes,
          cognitiveLoad: t.cognitive_load,
          status: t.status,
          completedAt: t.completed_at
        }));

        const milestones = (milestonesRes.data || []).map(m => ({
          id: m.id,
          courseId: m.course_id,
          title: m.title,
          description: m.description,
          type: m.type,
          dueDate: m.due_date,
          weightPercentage: Number(m.weight_percentage),
          isCompleted: m.is_completed
        }));

        const studyDecks = (decksRes.data || []).map(d => ({
          id: d.id,
          courseId: d.course_id,
          title: d.title,
          topic: d.topic,
          cards: d.cards || []
        }));

        let profile = null;
        if (profileRes.data && profileRes.data.length > 0) {
          const p = profileRes.data[0];
          profile = {
            fullName: p.full_name,
            institution: p.institution,
            major: p.major,
            targetGpa: Number(p.target_gpa),
            currentGpa: Number(p.current_gpa),
            weekdayAvailableHours: Number(p.weekday_available_hours),
            weekendAvailableHours: Number(p.weekend_available_hours)
          };
        }

        return { courses, executionTasks, milestones, studyDecks, profile };
      } catch (e) {
        console.warn("Could not fetch from Supabase:", e);
        return null;
      }
    },

    // Realtime Mutation Sync
    async syncTaskUpdate(task) {
      if (!this.client) return;
      try {
        await this.client.from('execution_tasks').upsert({
          id: task.id,
          status: task.status,
          completed_at: task.completedAt || null,
          actual_minutes: task.actualMinutes || 0
        });
      } catch (e) {
        console.warn("Supabase task sync failed:", e);
      }
    },

    async syncAllTasks(tasks) {
      if (!this.client) return;
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
        await this.client.from('execution_tasks').upsert(payload);
      } catch (e) {
        console.warn("Supabase bulk tasks sync failed:", e);
      }
    },

    async insertCourse(course) {
      if (!this.client) return;
      try {
        await this.client.from('courses').insert({
          id: course.id,
          code: course.code,
          name: course.name,
          instructor: course.instructor,
          instructor_email: course.instructorEmail,
          office_hours: course.officeHours,
          color: course.color,
          term: course.term,
          current_grade: course.currentGrade,
          grade_weights: course.gradeWeights,
          syllabus_text: course.syllabusText
        });
      } catch (e) {
        console.warn("Supabase insert course failed:", e);
      }
    },

    async updateProfile(profile) {
      if (!this.client) return;
      try {
        await this.client.from('user_profile').upsert({
          id: 'default_user',
          target_gpa: profile.targetGpa,
          weekday_available_hours: profile.weekdayAvailableHours,
          weekend_available_hours: profile.weekendAvailableHours,
          updated_at: new Date().toISOString()
        });
      } catch (e) {
        console.warn("Supabase update profile failed:", e);
      }
    }
  };
})();
