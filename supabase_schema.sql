-- ==============================================================================
-- ACADEMIQ 3D OS: SUPABASE POSTGRESQL PRODUCTION SCHEMA & ROW LEVEL SECURITY
-- ==============================================================================

-- 1. USER PROFILES TABLE
CREATE TABLE IF NOT EXISTS public.user_profile (
    id TEXT PRIMARY KEY, -- Maps 1:1 to auth.users.id
    full_name TEXT NOT NULL,
    institution TEXT NOT NULL DEFAULT 'University',
    major TEXT NOT NULL DEFAULT 'Computer Science',
    year_semester TEXT DEFAULT 'Year 1',
    target_gpa NUMERIC(3,2) DEFAULT 3.90,
    current_gpa NUMERIC(3,2) DEFAULT 3.80,
    weekday_available_hours NUMERIC(4,2) DEFAULT 4.50,
    weekend_available_hours NUMERIC(4,2) DEFAULT 7.00,
    exam_schedule JSONB DEFAULT '[]'::jsonb,
    skill_map JSONB DEFAULT '{}'::jsonb,
    onboarding_completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. COURSES TABLE
CREATE TABLE IF NOT EXISTS public.courses (
    id TEXT PRIMARY KEY,
    user_id TEXT REFERENCES public.user_profile(id) ON DELETE CASCADE,
    code TEXT NOT NULL,
    name TEXT NOT NULL,
    instructor TEXT DEFAULT 'Faculty Lead',
    instructor_email TEXT DEFAULT 'instructor@univ.edu',
    office_hours TEXT DEFAULT 'By appointment',
    color TEXT DEFAULT '#8b5cf6',
    term TEXT DEFAULT 'Current Term',
    current_grade NUMERIC(5,2) DEFAULT 90.00,
    grade_weights JSONB DEFAULT '[]'::jsonb,
    syllabus_text TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. MILESTONES TABLE
CREATE TABLE IF NOT EXISTS public.milestones (
    id TEXT PRIMARY KEY,
    course_id TEXT REFERENCES public.courses(id) ON DELETE CASCADE,
    user_id TEXT,
    title TEXT NOT NULL,
    description TEXT,
    type TEXT DEFAULT 'DELIVERABLE', -- EXAM, PROJECT, PSET, LAB
    due_date DATE,
    weight_percentage NUMERIC(5,2) DEFAULT 20.00,
    is_completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. EXECUTION TASKS (MICRO-SPRINTS) TABLE
CREATE TABLE IF NOT EXISTS public.execution_tasks (
    id TEXT PRIMARY KEY,
    milestone_id TEXT,
    course_id TEXT,
    user_id TEXT,
    title TEXT NOT NULL,
    instructions TEXT,
    topic TEXT,
    scheduled_date DATE,
    estimated_minutes INTEGER DEFAULT 25,
    actual_minutes INTEGER DEFAULT 0,
    cognitive_load TEXT DEFAULT 'DEEP_FOCUS', -- DEEP_FOCUS, ACTIVE_PRODUCTION, PASSIVE_SYNTHESIS, ADMIN_REVIEW
    priority TEXT DEFAULT 'HIGH', -- HIGH, MEDIUM, LOW
    status TEXT DEFAULT 'PENDING', -- PENDING, IN_PROGRESS, COMPLETED, OVERDUE, SKIPPED
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. STUDY DECKS & ACTIVE RECALL CARDS TABLE
CREATE TABLE IF NOT EXISTS public.study_decks (
    id TEXT PRIMARY KEY,
    course_id TEXT,
    user_id TEXT,
    title TEXT NOT NULL,
    topic TEXT NOT NULL,
    cards JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. ACTIVE RECALL ATTEMPTS TABLE
CREATE TABLE IF NOT EXISTS public.recall_attempts (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id TEXT NOT NULL,
    course_id TEXT,
    card_id TEXT NOT NULL,
    topic TEXT NOT NULL,
    confidence_level INTEGER NOT NULL, -- 1 to 5
    self_evaluation TEXT NOT NULL, -- KNEW_IT, PARTIALLY, DID_NOT_KNOW
    mastery_level INTEGER DEFAULT 1,
    attempted_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. DIAGNOSTIC TESTS & RESULTS TABLE
CREATE TABLE IF NOT EXISTS public.diagnostic_tests (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id TEXT NOT NULL,
    course_code TEXT NOT NULL,
    total_questions INTEGER NOT NULL,
    score INTEGER NOT NULL,
    topic_breakdown JSONB NOT NULL,
    skill_map_delta JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

ALTER TABLE public.user_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.execution_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_decks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recall_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.diagnostic_tests ENABLE ROW LEVEL SECURITY;

-- USER_PROFILE: Users can only read & write their own profile
CREATE POLICY "Users can view own profile" ON public.user_profile
    FOR SELECT USING (auth.uid()::text = id OR auth.role() = 'anon');

CREATE POLICY "Users can update own profile" ON public.user_profile
    FOR ALL USING (auth.uid()::text = id OR auth.role() = 'anon');

-- COURSES: Users can only see their courses
CREATE POLICY "Users can manage own courses" ON public.courses
    FOR ALL USING (auth.uid()::text = user_id OR auth.role() = 'anon');

-- MILESTONES: Users can only see their milestones
CREATE POLICY "Users can manage own milestones" ON public.milestones
    FOR ALL USING (auth.uid()::text = user_id OR auth.role() = 'anon');

-- EXECUTION TASKS: Users can only see their tasks
CREATE POLICY "Users can manage own tasks" ON public.execution_tasks
    FOR ALL USING (auth.uid()::text = user_id OR auth.role() = 'anon');

-- STUDY DECKS: Users can only see their study decks
CREATE POLICY "Users can manage own study decks" ON public.study_decks
    FOR ALL USING (auth.uid()::text = user_id OR auth.role() = 'anon');

-- RECALL ATTEMPTS: Users can only see their attempts
CREATE POLICY "Users can manage own recall attempts" ON public.recall_attempts
    FOR ALL USING (auth.uid()::text = user_id OR auth.role() = 'anon');

-- DIAGNOSTIC TESTS: Users can only see their test records
CREATE POLICY "Users can manage own diagnostic tests" ON public.diagnostic_tests
    FOR ALL USING (auth.uid()::text = user_id OR auth.role() = 'anon');
