/**
 * ACADEMIQ OS: AUTHENTICATION & ONBOARDING CONTROLLER
 * Manages Supabase Auth sessions, login, signup, password reset, 8-step onboarding, and route protection.
 */

class AcademiqAuth {
  constructor() {
    this.authContainer = document.getElementById('auth-container');
    this.appRoot = document.getElementById('app-root');
    this.currentUser = null;
    this.currentOnboardingStep = 1;
    this.onboardingData = {
      fullName: '',
      institution: '',
      major: '',
      yearSemester: 'Year 2, Semester 3',
      subjects: ['Operating Systems', 'Computer Networks', 'Database Management Systems'],
      targetGpa: 3.90,
      weekdayHours: 4.5,
      weekendHours: 7.0,
      examDates: ''
    };

    this.init();
  }

  async init() {
    this.bindEvents();

    // Listen to Supabase Auth State changes
    if (window.academiqSupabase) {
      window.academiqSupabase.onAuthStateChange(async (event, session) => {
        if (session && session.user) {
          this.currentUser = session.user;
          await window.academiqStore.setUser(session.user);
          this.evaluateRouting();
        } else {
          this.currentUser = null;
          await window.academiqStore.setUser(null);
          this.showAuthView('login');
        }
      });

      // Initial check
      const { session, user } = await window.academiqSupabase.getSession();
      if (session && user) {
        this.currentUser = user;
        await window.academiqStore.setUser(user);
        this.evaluateRouting();
      } else {
        this.showAuthView('login');
      }
    }
  }

  evaluateRouting() {
    if (!this.currentUser) {
      this.showAuthView('login');
      return;
    }

    const profile = window.academiqStore.state.profile;
    if (!profile || profile.onboardingCompleted === false) {
      this.showAuthView('onboarding');
      this.initOnboardingForm();
    } else {
      this.showApp();
      this.updateSidebarUserUI();
    }
  }

  showAuthView(viewName) {
    if (this.appRoot) this.appRoot.style.display = 'none';
    if (this.authContainer) this.authContainer.style.display = 'flex';

    document.querySelectorAll('.auth-card-view').forEach(v => v.classList.remove('active'));
    const target = document.getElementById(`auth-view-${viewName}`);
    if (target) target.classList.add('active');

    // Reset error banners
    document.querySelectorAll('.auth-error-banner').forEach(b => b.style.display = 'none');
  }

  showApp() {
    if (this.authContainer) this.authContainer.style.display = 'none';
    if (this.appRoot) this.appRoot.style.display = 'block';
    this.updateSidebarUserUI();
  }

  updateSidebarUserUI() {
    const profile = window.academiqStore.state.profile;
    const name = profile.fullName || this.currentUser?.user_metadata?.full_name || 'Scholar';
    const institution = profile.institution || profile.major || 'Undergraduate';

    // Initials
    const initials = name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'SC';

    const avatarEl = document.querySelector('.sidebar-footer .user-avatar');
    const nameEl = document.querySelector('.sidebar-footer .user-name');
    const metaEl = document.querySelector('.sidebar-footer .user-meta span:last-child');

    if (avatarEl) avatarEl.textContent = initials;
    if (nameEl) nameEl.textContent = name;
    if (metaEl) metaEl.textContent = institution;
  }

  showError(viewId, message) {
    const container = document.getElementById(viewId);
    if (!container) return;
    const banner = container.querySelector('.auth-error-banner');
    if (banner) {
      banner.textContent = message;
      banner.style.display = 'block';
    }
  }

  bindEvents() {
    // Switch auth tabs
    document.querySelectorAll('[data-auth-switch]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const targetView = btn.getAttribute('data-auth-switch');
        this.showAuthView(targetView);
      });
    });

    // Login Form Submit
    const loginForm = document.getElementById('form-login');
    if (loginForm) {
      loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('login-email')?.value.trim();
        const password = document.getElementById('login-password')?.value;
        const btn = document.getElementById('btn-submit-login');

        if (!email || !password) {
          this.showError('auth-view-login', 'Please enter your email and password.');
          return;
        }

        try {
          if (btn) {
            btn.disabled = true;
            btn.innerHTML = `<span class="auth-spinner"></span> Authenticating...`;
          }
          await window.academiqSupabase.signIn(email, password);
          // onAuthStateChange handles transition
        } catch (err) {
          this.showError('auth-view-login', err.message || 'Invalid email or password.');
          if (btn) {
            btn.disabled = false;
            btn.innerHTML = `<span>⚡</span> Sign In to 3D Cockpit`;
          }
        }
      });
    }

    // Google Sign In
    const googleBtn = document.getElementById('btn-google-login');
    if (googleBtn) {
      googleBtn.addEventListener('click', async () => {
        try {
          await window.academiqSupabase.signInWithGoogle();
        } catch (err) {
          this.showError('auth-view-login', 'Google OAuth is not enabled in your Supabase dashboard yet. Use email/password.');
        }
      });
    }

    // Signup Form Submit
    const signupForm = document.getElementById('form-signup');
    if (signupForm) {
      signupForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const fullName = document.getElementById('signup-name')?.value.trim();
        const email = document.getElementById('signup-email')?.value.trim();
        const password = document.getElementById('signup-password')?.value;
        const confirmPassword = document.getElementById('signup-confirm-password')?.value;
        const btn = document.getElementById('btn-submit-signup');

        if (!fullName || !email || !password) {
          this.showError('auth-view-signup', 'All fields are required.');
          return;
        }

        if (password.length < 6) {
          this.showError('auth-view-signup', 'Password must be at least 6 characters.');
          return;
        }

        if (password !== confirmPassword) {
          this.showError('auth-view-signup', 'Passwords do not match.');
          return;
        }

        try {
          if (btn) {
            btn.disabled = true;
            btn.innerHTML = `<span class="auth-spinner"></span> Creating Account...`;
          }
          await window.academiqSupabase.signUp(email, password, fullName);
          
          this.onboardingData.fullName = fullName;
          // onAuthStateChange or proceed to onboarding
          this.showAuthView('onboarding');
          this.initOnboardingForm();
        } catch (err) {
          this.showError('auth-view-signup', err.message || 'Signup failed.');
          if (btn) {
            btn.disabled = false;
            btn.innerHTML = `<span>✦</span> Create Student Account`;
          }
        }
      });
    }

    // Forgot Password Form Submit
    const forgotForm = document.getElementById('form-forgot');
    if (forgotForm) {
      forgotForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('forgot-email')?.value.trim();
        const btn = document.getElementById('btn-submit-forgot');

        if (!email) {
          this.showError('auth-view-forgot', 'Please enter your email.');
          return;
        }

        try {
          if (btn) {
            btn.disabled = true;
            btn.textContent = 'Sending Link...';
          }
          await window.academiqSupabase.resetPassword(email);
          const successBanner = document.getElementById('forgot-success-banner');
          if (successBanner) {
            successBanner.style.display = 'block';
            successBanner.textContent = `Password reset instructions sent to ${email}. Check your inbox.`;
          }
          if (btn) btn.style.display = 'none';
        } catch (err) {
          this.showError('auth-view-forgot', err.message || 'Could not send reset email.');
          if (btn) {
            btn.disabled = false;
            btn.textContent = 'Send Reset Instructions';
          }
        }
      });
    }

    // Logout Button in Sidebar
    const logoutBtn = document.getElementById('btn-sidebar-logout');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        if (confirm("Sign out of Academiq 3D OS?")) {
          await window.academiqSupabase.signOut();
          location.reload();
        }
      });
    }

    // Onboarding Wizard Next / Back Buttons
    this.bindOnboardingSteps();
  }

  // --- 8-STEP ONBOARDING WIZARD ---
  initOnboardingForm() {
    const defaultName = this.currentUser?.user_metadata?.full_name || this.onboardingData.fullName || '';
    const nameInput = document.getElementById('onboard-name');
    if (nameInput && defaultName) nameInput.value = defaultName;

    this.currentOnboardingStep = 1;
    this.renderOnboardingStep();
  }

  bindOnboardingSteps() {
    // Next step
    document.querySelectorAll('[data-onboard-next]').forEach(btn => {
      btn.addEventListener('click', () => {
        if (this.validateCurrentStep()) {
          this.currentOnboardingStep++;
          this.renderOnboardingStep();
        }
      });
    });

    // Previous step
    document.querySelectorAll('[data-onboard-prev]').forEach(btn => {
      btn.addEventListener('click', () => {
        if (this.currentOnboardingStep > 1) {
          this.currentOnboardingStep--;
          this.renderOnboardingStep();
        }
      });
    });

    // Add Subject Tag
    const addSubjectBtn = document.getElementById('btn-add-subject-tag');
    const subjectInput = document.getElementById('onboard-custom-subject');
    if (addSubjectBtn && subjectInput) {
      const addSub = () => {
        const val = subjectInput.value.trim();
        if (val && !this.onboardingData.subjects.includes(val)) {
          this.onboardingData.subjects.push(val);
          this.renderSubjectChips();
          subjectInput.value = '';
        }
      };
      addSubjectBtn.addEventListener('click', addSub);
      subjectInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          addSub();
        }
      });
    }

    // "Build My Learning System" Final Action
    const buildBtn = document.getElementById('btn-build-learning-system');
    if (buildBtn) {
      buildBtn.addEventListener('click', async () => {
        await this.finishOnboarding(buildBtn);
      });
    }
  }

  validateCurrentStep() {
    if (this.currentOnboardingStep === 1) {
      const val = document.getElementById('onboard-name')?.value.trim();
      if (!val) { alert("Please enter your name."); return false; }
      this.onboardingData.fullName = val;
    } else if (this.currentOnboardingStep === 2) {
      const val = document.getElementById('onboard-institution')?.value.trim();
      if (!val) { alert("Please enter your university or college."); return false; }
      this.onboardingData.institution = val;
    } else if (this.currentOnboardingStep === 3) {
      const val = document.getElementById('onboard-major')?.value.trim();
      if (!val) { alert("Please enter your degree or course of study."); return false; }
      this.onboardingData.major = val;
    } else if (this.currentOnboardingStep === 4) {
      this.onboardingData.yearSemester = document.getElementById('onboard-semester')?.value || 'Year 2, Semester 3';
    } else if (this.currentOnboardingStep === 5) {
      if (this.onboardingData.subjects.length === 0) {
        alert("Please add at least one subject/course.");
        return false;
      }
    } else if (this.currentOnboardingStep === 6) {
      this.onboardingData.targetGpa = parseFloat(document.getElementById('onboard-target-gpa')?.value || 3.90);
    } else if (this.currentOnboardingStep === 7) {
      this.onboardingData.weekdayHours = parseFloat(document.getElementById('onboard-weekday-hours')?.value || 4.5);
      this.onboardingData.weekendHours = parseFloat(document.getElementById('onboard-weekend-hours')?.value || 7.0);
    } else if (this.currentOnboardingStep === 8) {
      this.onboardingData.examDates = document.getElementById('onboard-exam-dates')?.value.trim() || 'Midterms in 2 weeks';
    }
    return true;
  }

  renderOnboardingStep() {
    document.querySelectorAll('.onboard-step').forEach(s => s.classList.remove('active'));
    const targetStep = document.getElementById(`onboard-step-${this.currentOnboardingStep}`);
    if (targetStep) targetStep.classList.add('active');

    // Progress bar
    const progressEl = document.getElementById('onboard-progress-bar');
    if (progressEl) {
      const pct = (this.currentOnboardingStep / 8) * 100;
      progressEl.style.width = `${pct}%`;
    }

    const stepCounterEl = document.getElementById('onboard-step-indicator');
    if (stepCounterEl) {
      stepCounterEl.textContent = `Step ${this.currentOnboardingStep} of 8`;
    }

    if (this.currentOnboardingStep === 5) {
      this.renderSubjectChips();
    }
  }

  renderSubjectChips() {
    const list = document.getElementById('onboard-subject-chips-list');
    if (!list) return;
    list.innerHTML = this.onboardingData.subjects.map((sub, i) => `
      <span class="subject-chip-pill">
        <span>${sub}</span>
        <button type="button" class="chip-remove-btn" onclick="window.academiqAuth.removeSubject(${i})">✕</button>
      </span>
    `).join('');
  }

  removeSubject(index) {
    this.onboardingData.subjects.splice(index, 1);
    this.renderSubjectChips();
  }

  async finishOnboarding(btn) {
    if (!this.validateCurrentStep()) return;

    btn.disabled = true;
    btn.innerHTML = `<span class="auth-spinner"></span> Generating Personalized 3D Learning OS...`;

    // 1. Update store profile
    const profile = {
      fullName: this.onboardingData.fullName,
      institution: this.onboardingData.institution,
      major: this.onboardingData.major,
      yearSemester: this.onboardingData.yearSemester,
      targetGpa: this.onboardingData.targetGpa,
      currentGpa: (this.onboardingData.targetGpa - 0.1).toFixed(2),
      weekdayAvailableHours: this.onboardingData.weekdayHours,
      weekendAvailableHours: this.onboardingData.weekendHours,
      onboardingCompleted: true
    };

    window.academiqStore.state.profile = profile;

    // 2. Seed curriculum based on student's entered subjects
    const subjectObjects = this.onboardingData.subjects.map((name, idx) => ({
      code: name.split(' ').map(w => w[0]).join('').toUpperCase() + '-10' + (idx + 1),
      name: name,
      color: ['#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ec4899'][idx % 5]
    }));

    window.academiqStore.seedStarterCurriculum(subjectObjects);

    // 3. Save to Supabase
    if (window.academiqSupabase && this.currentUser) {
      await window.academiqSupabase.saveUserProfile(this.currentUser.id, profile);
    }

    window.academiqStore.saveState();

    if (window.academiqAudio) window.academiqAudio.playSuccess();
    
    // 4. Show main application
    this.showApp();
    if (window.showToast) {
      window.showToast(`Welcome ${profile.fullName}! Your personalized learning system is active.`, "success");
    }
  }
}

window.academiqAuth = new AcademiqAuth();
