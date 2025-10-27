// FreelanceMusic App
class FreelanceMusicApp {
    constructor() {
        this.apiUrl = 'http://localhost:5037/api'; // Backend API URL
        this.currentUser = null; // Store current user info
        this.init();
    }

    // Helper method to decode JWT token
    decodeToken(token) {
        try {
            // jwt-decode CDN exposes jwt_decode as a global
            if (typeof jwt_decode !== 'undefined') {
                return jwt_decode(token);
            } else {
                console.error('jwt_decode library not loaded');
                return null;
            }
        } catch (error) {
            console.error('Error decoding token:', error);
            return null;
        }
    }

    // Helper method to get current user from token
    getCurrentUser() {
        const token = localStorage.getItem('authToken') || localStorage.getItem('token') || sessionStorage.getItem('authToken') || sessionStorage.getItem('token');
        if (!token) return null;

        const decoded = this.decodeToken(token);
        if (!decoded || !decoded.userId) return null;

        return {
            userId: decoded.userId,
            email: decoded.email,
            role: decoded.role
        };
    }

    // Helper method to check if user is authenticated
    isAuthenticated() {
        const token = localStorage.getItem('authToken') || localStorage.getItem('token') || sessionStorage.getItem('authToken') || sessionStorage.getItem('token');
        if (!token) return false;

        const decoded = this.decodeToken(token);
        if (!decoded) return false;

        // Check if token is expired
        if (decoded.exp && decoded.exp * 1000 < Date.now()) {
            this.logout();
            return false;
        }

        return true;
    }

    // Helper method to check if user has required role
    hasRole(requiredRole) {
        const user = this.getCurrentUser();
        if (!user) return false;
        
        // Admin users can access all portals
        if (user.role === 'admin') {
            return true;
        }
        
        // For non-admin users, check exact role match
        return user.role === requiredRole;
    }

    // Helper method for protected routes
    requireAuth(requiredRole = null) {
        if (!this.isAuthenticated()) {
            this.showBootstrapAlert('warning', 'Please login to access this page');
            this.showLoginPage();
            return false;
        }

        const user = this.getCurrentUser();
        if (!user) {
            this.showBootstrapAlert('danger', 'Invalid session. Please login again');
            this.logout();
            return false;
        }

        // Check role if required
        if (requiredRole && !this.hasRole(requiredRole)) {
            this.showBootstrapAlert('danger', `Access denied. This page is only for ${requiredRole}s`);
            
            // Redirect to appropriate portal based on role
            this.redirectToPortal(user.role);
            return false;
        }

        this.currentUser = user;
        return true;
    }

    // Helper method to update navbar based on role
    updateNavbarForRole() {
        const user = this.getCurrentUser();
        if (!user) {
            this.updateNavbarForLoggedOut();
            return;
        }

        this.updateNavbarForLoggedIn();

        // Show/hide portal links based on role
        const adminNav = document.getElementById('nav-admin');
        const teacherNav = document.getElementById('nav-teacher');
        const studentNav = document.getElementById('nav-student');

        if (adminNav) {
            if (user.role === 'admin') {
                adminNav.style.display = 'block';
            } else {
                adminNav.style.display = 'none';
            }
        }

        if (teacherNav) {
            if (user.role === 'admin' || user.role === 'teacher') {
                teacherNav.style.display = 'block';
            } else {
                teacherNav.style.display = 'none';
            }
        }

        if (studentNav) {
            if (user.role === 'admin' || user.role === 'student') {
                studentNav.style.display = 'block';
            } else {
                studentNav.style.display = 'none';
            }
        }
    }

    async init() {
        // Check if user is logged in
        if (this.isAuthenticated()) {
            // User is logged in, show landing page
            this.showLandingPage();
            this.updateNavbarForRole();
        } else {
            // User is not logged in, show login page
            this.showLoginPage();
            this.updateNavbarForLoggedOut();
        }
    }

    updateNavbarForLoggedIn() {
        const loginNav = document.getElementById('nav-login');
        const logoutNav = document.getElementById('nav-logout');
        if (loginNav) loginNav.style.display = 'none';
        if (logoutNav) logoutNav.style.display = 'block';
    }

    updateNavbarForLoggedOut() {
        const loginNav = document.getElementById('nav-login');
        const logoutNav = document.getElementById('nav-logout');
        if (loginNav) loginNav.style.display = 'block';
        if (logoutNav) logoutNav.style.display = 'none';
    }

    // Show Login Page
    showLoginPage() {
        this.updateActiveNav('');
        const app = document.getElementById('app');
        app.innerHTML = `
            <div class="row justify-content-center mt-5">
                <div class="col-md-5 col-lg-4">
                    <div class="card shadow">
                        <div class="card-header bg-primary text-white text-center">
                            <h3 class="mb-0">🎵 FreelanceMusic</h3>
                            <p class="mb-0">Login to continue</p>
                        </div>
                        <div class="card-body p-4">
                            <form id="loginForm">
                                <div class="mb-3">
                                    <label for="loginEmail" class="form-label">Email</label>
                                    <input type="email" class="form-control" id="loginEmail" required placeholder="your@email.com">
                                    <small class="form-text text-muted">Enter your registered email</small>
                                </div>
                                <div class="mb-3">
                                    <label for="loginRole" class="form-label">Account Type</label>
                                    <select class="form-select" id="loginRole" required>
                                        <option value="">Select account type...</option>
                                        <option value="admin">Admin</option>
                                        <option value="teacher">Teacher</option>
                                        <option value="student">Student</option>
                                    </select>
                                </div>
                                <div class="mb-3">
                                    <label for="loginPassword" class="form-label">Password</label>
                                    <div class="input-group">
                                        <input type="password" class="form-control" id="loginPassword" required placeholder="Enter password">
                                        <button class="btn btn-outline-secondary" type="button" id="togglePassword">
                                            👁️
                                        </button>
                                    </div>
                                </div>
                                <div class="mb-3" id="adminPinField" style="display: none;">
                                    <label for="loginPin" class="form-label">Admin PIN</label>
                                    <input type="password" class="form-control" id="loginPin" placeholder="Enter admin PIN">
                                    <small class="form-text text-muted">Required for admin accounts</small>
                                </div>
                                <div class="mb-3 form-check">
                                    <input type="checkbox" class="form-check-input" id="rememberMe">
                                    <label class="form-check-label" for="rememberMe">Remember me</label>
                                </div>
                                <button type="submit" class="btn btn-primary w-100" id="loginSubmitBtn">
                                    Sign In
                                </button>
                            </form>
                            <div class="mt-3 text-center">
                                <small class="text-muted">Don't have an account? <a href="#" onclick="app.showSignupPage()">Sign up</a></small>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Add event listeners
        setTimeout(() => {
            // Show/hide PIN field based on role selection
            document.getElementById('loginRole').addEventListener('change', () => {
                const role = document.getElementById('loginRole').value;
                const pinField = document.getElementById('adminPinField');
                const pinInput = document.getElementById('loginPin');
                
                if (role === 'admin') {
                    pinField.style.display = 'block';
                    pinInput.required = true;
                } else {
                    pinField.style.display = 'none';
                    pinInput.required = false;
                    pinInput.value = '';
                }
            });

            // Toggle password visibility
            document.getElementById('togglePassword').addEventListener('click', () => {
                const passwordInput = document.getElementById('loginPassword');
                const button = document.getElementById('togglePassword');
                if (passwordInput.type === 'password') {
                    passwordInput.type = 'text';
                    button.textContent = '🙈';
                } else {
                    passwordInput.type = 'password';
                    button.textContent = '👁️';
                }
            });

            // Form submission
            document.getElementById('loginForm').addEventListener('submit', async (e) => {
                e.preventDefault();
                await this.handleLogin();
            });
        }, 100);
    }

    async handleLogin() {
        const email = document.getElementById('loginEmail').value.trim();
        const password = document.getElementById('loginPassword').value;
        const role = document.getElementById('loginRole').value;
        const pin = document.getElementById('loginPin').value;
        const rememberMe = document.getElementById('rememberMe').checked;
        const submitBtn = document.getElementById('loginSubmitBtn');

        // Client-side validation
        if (!email || !email.includes('@')) {
            this.showBootstrapAlert('warning', 'Please enter a valid email address');
            return;
        }

        if (!password) {
            this.showBootstrapAlert('warning', 'Please enter your password');
            return;
        }

        if (!role) {
            this.showBootstrapAlert('warning', 'Please select your account type');
            return;
        }

        if (role === 'admin' && !pin) {
            this.showBootstrapAlert('warning', 'Please enter your admin PIN');
            return;
        }

        // Disable button and show loading
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Signing in...';
        this.showLoadingOverlay();

        try {
            const response = await fetch(`${this.apiUrl}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password, role, pin })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Login failed');
            }

            // Store token
            if (rememberMe) {
                localStorage.setItem('authToken', data.token);
                localStorage.setItem('token', data.token); // Backward compatibility
                localStorage.setItem('user', JSON.stringify(data.user));
            } else {
                sessionStorage.setItem('authToken', data.token);
                sessionStorage.setItem('token', data.token); // Backward compatibility
                sessionStorage.setItem('user', JSON.stringify(data.user));
            }

            this.hideLoadingOverlay();
            this.showBootstrapAlert('success', 'Login successful! Redirecting...');
            this.updateNavbarForRole();

            // Redirect based on role
            setTimeout(() => {
                this.redirectToPortal(data.user.role);
            }, 1000);
        } catch (error) {
            this.hideLoadingOverlay();
            this.showBootstrapAlert('danger', `Login failed: ${error.message}`);
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = 'Sign In';
        }
    }

    redirectToPortal(role) {
        switch (role.toLowerCase()) {
            case 'admin':
                this.showAdminPortal();
                break;
            case 'teacher':
                this.showTeacherPortal();
                break;
            case 'student':
                this.showStudentPortal();
                break;
            default:
                this.showLandingPage();
        }
    }

    // Show Signup Page
    showSignupPage() {
        this.updateActiveNav('');
        const app = document.getElementById('app');
        app.innerHTML = `
            <div class="row justify-content-center mt-5">
                <div class="col-md-6 col-lg-5">
                    <div class="card shadow">
                        <div class="card-header bg-success text-white text-center">
                            <h3 class="mb-0">🎵 FreelanceMusic</h3>
                            <p class="mb-0">Create your account</p>
                        </div>
                        <div class="card-body p-4">
                            <form id="signupForm">
                                <div class="mb-3">
                                    <label for="signupEmail" class="form-label">Email</label>
                                    <input type="email" class="form-control" id="signupEmail" required placeholder="your@email.com">
                                    <small class="form-text text-muted">We'll never share your email</small>
                                </div>
                                <div class="mb-3">
                                    <label for="signupPassword" class="form-label">Password</label>
                                    <div class="input-group">
                                        <input type="password" class="form-control" id="signupPassword" required placeholder="Minimum 6 characters">
                                        <button class="btn btn-outline-secondary" type="button" id="toggleSignupPassword">
                                            👁️
                                        </button>
                                    </div>
                                    <small class="form-text text-muted">Must be at least 6 characters long</small>
                                </div>
                                <div class="mb-3">
                                    <label for="signupRole" class="form-label">I am a</label>
                                    <select class="form-select" id="signupRole" required>
                                        <option value="">Select role...</option>
                                        <option value="admin">Admin</option>
                                        <option value="teacher">Teacher</option>
                                        <option value="student">Student</option>
                                    </select>
                                </div>
                                <div class="mb-3" id="signupAdminPinField" style="display: none;">
                                    <label for="signupPin" class="form-label">Admin PIN</label>
                                    <input type="password" class="form-control" id="signupPin" placeholder="Enter admin PIN">
                                    <small class="form-text text-muted">Required for admin accounts</small>
                                </div>
                                <div class="mb-3">
                                    <label for="signupOutreachSource" class="form-label">How did you hear about FreelanceMusic?</label>
                                    <select class="form-select" id="signupOutreachSource" required>
                                        <option value="">Select an option...</option>
                                        <option value="Social Media">Social Media</option>
                                        <option value="Word of Mouth">Word of Mouth</option>
                                        <option value="Online Ads">Online Ads</option>
                                        <option value="Event/Workshop">Event/Workshop</option>
                                        <option value="Not Specified">Not Specified</option>
                                    </select>
                                    <small class="form-text text-muted">Help us understand how users discover our platform</small>
                                </div>
                                <button type="submit" class="btn btn-success w-100" id="signupSubmitBtn">
                                    Sign Up
                                </button>
                            </form>
                            <div class="mt-3 text-center">
                                <small class="text-muted">Already have an account? <a href="#" onclick="app.showLoginPage()">Sign in</a></small>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Add event listeners
        setTimeout(() => {
            // Show/hide PIN field based on role selection
            document.getElementById('signupRole').addEventListener('change', () => {
                const role = document.getElementById('signupRole').value;
                const pinField = document.getElementById('signupAdminPinField');
                const pinInput = document.getElementById('signupPin');
                
                if (role === 'admin') {
                    pinField.style.display = 'block';
                    pinInput.required = true;
                } else {
                    pinField.style.display = 'none';
                    pinInput.required = false;
                    pinInput.value = '';
                }
            });

            // Toggle password visibility
            document.getElementById('toggleSignupPassword').addEventListener('click', () => {
                const passwordInput = document.getElementById('signupPassword');
                const button = document.getElementById('toggleSignupPassword');
                if (passwordInput.type === 'password') {
                    passwordInput.type = 'text';
                    button.textContent = '🙈';
                } else {
                    passwordInput.type = 'password';
                    button.textContent = '👁️';
                }
            });

            // Form submission
            document.getElementById('signupForm').addEventListener('submit', async (e) => {
                e.preventDefault();
                await this.handleSignup();
            });
        }, 100);
    }

    async handleSignup() {
        const email = document.getElementById('signupEmail').value.trim();
        const password = document.getElementById('signupPassword').value;
        const role = document.getElementById('signupRole').value;
        const pin = document.getElementById('signupPin').value;
        const outreachSource = document.getElementById('signupOutreachSource').value;
        const submitBtn = document.getElementById('signupSubmitBtn');

        // Client-side validation
        if (!email || !email.includes('@')) {
            this.showBootstrapAlert('warning', 'Please enter a valid email address');
            return;
        }

        if (!password || password.length < 6) {
            this.showBootstrapAlert('warning', 'Password must be at least 6 characters long');
            return;
        }

        if (!role) {
            this.showBootstrapAlert('warning', 'Please select your role');
            return;
        }

        if (role === 'admin' && !pin) {
            this.showBootstrapAlert('warning', 'Please enter your admin PIN');
            return;
        }

        if (!outreachSource) {
            this.showBootstrapAlert('warning', 'Please select how you heard about FreelanceMusic');
            return;
        }

        // Disable button and show loading
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Creating account...';
        this.showLoadingOverlay();

        try {
            const response = await fetch(`${this.apiUrl}/auth/signup`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password, role, pin, outreachSource })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Signup failed');
            }

            this.hideLoadingOverlay();
            this.showBootstrapAlert('success', 'Account created successfully! Redirecting to login...');

            // Redirect to login page after 2 seconds
            setTimeout(() => {
                this.showLoginPage();
            }, 2000);
        } catch (error) {
            this.hideLoadingOverlay();
            this.showBootstrapAlert('danger', `Signup failed: ${error.message}`);
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = 'Sign Up';
        }
    }

    // Logout functionality
    logout() {
        localStorage.removeItem('authToken');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        sessionStorage.removeItem('authToken');
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('user');
        this.currentUser = null;
        this.updateNavbarForLoggedOut();
        this.showLoginPage();
        this.showBootstrapAlert('info', 'You have been logged out');
    }

    // Helper method to update active nav link
    updateActiveNav(activeId) {
        const navLinks = document.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            // Don't update active state for login/logout buttons
            if (link.id !== 'nav-login' && link.id !== 'nav-logout') {
                link.classList.remove('active');
            }
        });
        const activeLink = document.getElementById(activeId);
        if (activeLink) {
            activeLink.classList.add('active');
        }
    }

    // Helper method to show loading overlay
    showLoadingOverlay() {
        const overlay = document.createElement('div');
        overlay.className = 'loading-overlay';
        overlay.id = 'loadingOverlay';
        overlay.innerHTML = `
            <div class="loading-spinner">
                <div class="spinner-border text-primary" role="status" style="width: 3rem; height: 3rem;">
                    <span class="visually-hidden">Loading...</span>
                </div>
                <p class="mt-2 mb-0">Loading...</p>
            </div>
        `;
        document.body.appendChild(overlay);
    }

    // Helper method to hide loading overlay
    hideLoadingOverlay() {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) {
            overlay.remove();
        }
    }

    // Show Landing Page
    showLandingPage() {
        // Check authentication
        if (!this.requireAuth()) return;

        const user = this.getCurrentUser();
        this.updateActiveNav('');
        const app = document.getElementById('app');
        
        let portalOptions = '';
        
        if (user.role === 'admin') {
            // Admin users can access all portals
            portalOptions = `
                            <div class="row g-3">
                                <div class="col-md-4">
                                    <div class="card h-100">
                                        <div class="card-body text-center">
                                            <h5 class="card-title">👨‍💼 Admin Portal</h5>
                                            <p class="card-text">Manage users and system settings</p>
                                            <button class="btn btn-primary" onclick="app.showAdminPortal()">Enter</button>
                                        </div>
                                    </div>
                                </div>
                                <div class="col-md-4">
                                    <div class="card h-100">
                                        <div class="card-body text-center">
                                            <h5 class="card-title">👨‍🏫 Teacher Portal</h5>
                                            <p class="card-text">Manage lessons and students</p>
                                            <button class="btn btn-success" onclick="app.showTeacherPortal()">Enter</button>
                                        </div>
                                    </div>
                                </div>
                                <div class="col-md-4">
                                    <div class="card h-100">
                                        <div class="card-body text-center">
                                            <h5 class="card-title">🎓 Student Portal</h5>
                                            <p class="card-text">Book lessons and track progress</p>
                                            <button class="btn btn-info" onclick="app.showStudentPortal()">Enter</button>
                                        </div>
                                    </div>
                                </div>
                            </div>
            `;
        } else if (user.role === 'teacher') {
            // Teachers can only access teacher portal
            portalOptions = `
                <div class="row justify-content-center">
                    <div class="col-md-6">
                        <div class="card h-100">
                            <div class="card-body text-center">
                                <h5 class="card-title">👨‍🏫 Teacher Portal</h5>
                                <p class="card-text">Manage lessons and students</p>
                                <button class="btn btn-success btn-lg" onclick="app.showTeacherPortal()">Enter Teacher Portal</button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        } else if (user.role === 'student') {
            // Students can only access student portal
            portalOptions = `
                <div class="row justify-content-center">
                    <div class="col-md-6">
                        <div class="card h-100">
                            <div class="card-body text-center">
                                <h5 class="card-title">🎓 Student Portal</h5>
                                <p class="card-text">Book lessons and track progress</p>
                                <button class="btn btn-info btn-lg" onclick="app.showStudentPortal()">Enter Student Portal</button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }
        
        app.innerHTML = `
            <div class="row justify-content-center">
                <div class="col-md-8">
                    <div class="card shadow">
                        <div class="card-body text-center p-5">
                            <h1 class="display-4 mb-4">🎵 Welcome to FreelanceMusic</h1>
                            <p class="lead mb-4">Your music learning platform</p>
                            ${portalOptions}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    // ==================== Unified Profile System ====================

    async showUnifiedProfile(role) {
        // Check authentication and role
        if (!this.requireAuth(role)) return;

        this.updateActiveNav(`nav-${role}`);
        const app = document.getElementById('app');
        if (!app) {
            console.error('App element not found');
            return;
        }
        
        // Show loading state
        app.innerHTML = `
            <div class="card shadow">
                <div class="card-header bg-${role === 'admin' ? 'danger' : role === 'teacher' ? 'success' : 'info'} text-white">
                    <h3 class="mb-0">${role === 'admin' ? '👑' : role === 'teacher' ? '🎓' : '🎵'} ${role.charAt(0).toUpperCase() + role.slice(1)} Profile</h3>
                </div>
                <div class="card-body text-center">
                    <div class="spinner-border text-${role === 'admin' ? 'danger' : role === 'teacher' ? 'success' : 'info'}" role="status">
                        <span class="visually-hidden">Loading...</span>
                    </div>
                    <p class="mt-3">Loading your profile...</p>
                </div>
            </div>
        `;

        try {
            // Get current user's email from JWT
            const user = this.getCurrentUser();
            if (!user || !user.email) {
                throw new Error('Unable to get user information');
            }

            // Try to fetch existing profile using JWT-based endpoint with aggressive cache busting
            const response = await this.fetchWithAuth(`/${role}/profile?t=${Date.now()}&v=${Math.random()}`);
            
            if (response.success && response.data) {
                // Profile exists - show profile info
                this.showProfileView(response.data, role);
            } else {
                // No profile found - show create profile form
                this.showCreateProfileForm(role);
            }
        } catch (error) {
            console.error('Error loading profile:', error);
            // If there's an error, show the create form
            this.showCreateProfileForm(role);
        }
    }

    showProfileView(profile, role) {
        console.log('Profile data received:', profile, 'Role:', role);
        const app = document.getElementById('app');
        if (!app) {
            console.error('App element not found');
            return;
        }
        
        const roleColor = role === 'admin' ? 'danger' : role === 'teacher' ? 'success' : 'info';
        const roleIcon = role === 'admin' ? '👑' : role === 'teacher' ? '🎓' : '🎵';
        
        let profileFields = '';
        let quickActions = '';
        
        switch (role) {
            case 'student':
                profileFields = `
                    <div class="row">
                        <div class="col-md-6">
                            <p><strong>Name:</strong> ${profile.Name || 'Not provided'}</p>
                            <p><strong>Email:</strong> ${profile.Email}</p>
                            <p><strong>Instrument:</strong> ${profile.Instrument || 'Not provided'}</p>
                        </div>
                        <div class="col-md-6">
                            <p><strong>Card Number:</strong> ${profile.CardNumber ? '****-****-****-' + profile.CardNumber.slice(-4) : 'Not provided'}</p>
                            <p><strong>Expiry Date:</strong> ${profile.ExpiryDate || 'Not provided'}</p>
                            <p><strong>PIN:</strong> ${profile.Pin ? '****' : 'Not provided'}</p>
                        </div>
                    </div>
                `;
                quickActions = `
                    <button class="btn btn-primary w-100 mb-2" onclick="app.showEditProfile('${role}')">
                        ✏️ Edit Profile
                    </button>
                    <button class="btn btn-success w-100 mb-2" onclick="app.showLessonBooking()">
                        📚 Browse & Book Lessons
                    </button>
                    <button class="btn btn-info w-100 mb-2" onclick="app.showMyBookings()">
                        📅 My Bookings
                    </button>
                    <button class="btn btn-danger w-100" onclick="app.showDeleteProfileModal('${role}')">
                        🗑️ Delete Profile
                    </button>
                `;
                break;
            case 'teacher':
                profileFields = `
                    <div class="row">
                        <div class="col-md-6">
                            <p><strong>Name:</strong> ${profile.Name || 'Not provided'}</p>
                            <p><strong>Email:</strong> ${profile.Email}</p>
                            <p><strong>Instrument:</strong> ${profile.Instrument || 'Not provided'}</p>
                        </div>
                        <div class="col-md-6">
                            <p><strong>Hourly Rate:</strong> $${profile.HourlyRate || 'Not set'}</p>
                            <p><strong>Availability:</strong> ${profile.Availability || 'Not set'}</p>
                        </div>
                    </div>
                `;
                quickActions = `
                    <button class="btn btn-primary w-100 mb-2" onclick="app.showEditProfile('${role}')">
                        ✏️ Edit Profile
                    </button>
                    <button class="btn btn-info w-100 mb-2" onclick="app.showScheduleLessonForm()">
                        📝 Schedule Lesson
                    </button>
                    <button class="btn btn-success w-100 mb-2" onclick="app.showUpcomingLessons()">
                        📅 Upcoming Lessons
                    </button>
                    <button class="btn btn-danger w-100" onclick="app.showDeleteProfileModal('${role}')">
                        🗑️ Delete Profile
                    </button>
                `;
                break;
            case 'admin':
                profileFields = `
                    <div class="row">
                        <div class="col-md-6">
                            <p><strong>Name:</strong> ${profile.Name || 'Not provided'}</p>
                            <p><strong>Email:</strong> ${profile.Email}</p>
                            <p><strong>Role:</strong> ${profile.Role}</p>
                        </div>
                    </div>
                `;
                quickActions = `
                    <button class="btn btn-primary w-100 mb-2" onclick="app.showEditProfile('${role}')">
                        ✏️ Edit Profile
                    </button>
                    <button class="btn btn-info w-100 mb-2" onclick="app.showAdminDashboard()">
                        📊 Admin Dashboard
                    </button>
                    <button class="btn btn-danger w-100" onclick="app.showDeleteProfileModal('${role}')">
                        🗑️ Delete Profile
                    </button>
                `;
                break;
        }
        
        app.innerHTML = `
            <div class="card shadow">
                <div class="card-header bg-${roleColor} text-white">
                    <h3 class="mb-0">${roleIcon} ${role.charAt(0).toUpperCase() + role.slice(1)} Profile</h3>
                </div>
                <div class="card-body">
                    <div class="row">
                        <div class="col-md-8">
                            <div class="card">
                                <div class="card-header bg-${roleColor} text-white">
                                    <h5 class="mb-0">📋 Your Profile</h5>
                                </div>
                                <div class="card-body">
                                    ${profileFields}
                                </div>
                            </div>
                        </div>
                        <div class="col-md-4">
                            <div class="card">
                                <div class="card-header bg-primary text-white">
                                    <h5 class="mb-0">🎯 Quick Actions</h5>
                                </div>
                                <div class="card-body">
                                    ${quickActions}
                                </div>
                            </div>
                        </div>
                    </div>
                    <div id="profileContent"></div>
                </div>
            </div>
        `;
        
        this.showBootstrapAlert('success', 'Profile loaded successfully!');
    }

    showCreateProfileForm(role) {
        const app = document.getElementById('app');
        const roleColor = role === 'admin' ? 'danger' : role === 'teacher' ? 'success' : 'info';
        const roleIcon = role === 'admin' ? '👑' : role === 'teacher' ? '🎓' : '🎵';
        
        app.innerHTML = `
            <div class="card shadow">
                <div class="card-header bg-${roleColor} text-white">
                    <h3 class="mb-0">${roleIcon} ${role.charAt(0).toUpperCase() + role.slice(1)} Profile</h3>
                </div>
                <div class="card-body">
                    <div class="alert alert-info">
                        <h5>👋 Welcome!</h5>
                        <p class="mb-0">No profile found for your account. Please create your ${role} profile to get started.</p>
                    </div>
                    <div id="profileContent">
                        ${this.getCreateProfileFormHTML(role)}
                    </div>
                </div>
            </div>
        `;
        
        this.showBootstrapAlert('info', `Please create your ${role} profile to get started.`);
        
        // Attach form submission handlers
        setTimeout(() => {
            this.attachCreateProfileFormListeners(role);
            this.populateEmailFields(role);
        }, 100);
    }

    attachCreateProfileFormListeners(role) {
        switch (role) {
            case 'student':
                const createStudentForm = document.getElementById('createStudentForm');
                if (createStudentForm) {
                    createStudentForm.addEventListener('submit', async (e) => {
                        e.preventDefault();
                        await this.handleCreateStudentForm();
                    });
                    
                    // Add input formatting
                    const cardNumberInput = document.getElementById('studentCardNumber');
                    if (cardNumberInput) {
                        cardNumberInput.addEventListener('input', (e) => {
                            e.target.value = e.target.value.replace(/\D/g, '').substring(0, 14);
                        });
                    }
                    
                    const expiryInput = document.getElementById('studentExpiryDate');
                    if (expiryInput) {
                        expiryInput.addEventListener('input', (e) => {
                            let value = e.target.value.replace(/\D/g, '');
                            if (value.length >= 2) {
                                value = value.substring(0, 2) + '/' + value.substring(2, 4);
                            }
                            e.target.value = value;
                        });
                    }
                    
                    const pinInput = document.getElementById('studentPin');
                    if (pinInput) {
                        pinInput.addEventListener('input', (e) => {
                            e.target.value = e.target.value.replace(/\D/g, '').substring(0, 4);
                        });
                    }
                }
                break;
            case 'teacher':
                const createTeacherForm = document.getElementById('createTeacherForm');
                if (createTeacherForm) {
                    createTeacherForm.addEventListener('submit', async (e) => {
                        e.preventDefault();
                        await this.handleCreateTeacherForm();
                    });
                }
                break;
        }
    }

    populateEmailFields(role) {
        const user = this.getCurrentUser();
        if (!user || !user.email) {
            console.error('Unable to get user email for form population');
            return;
        }

        switch (role) {
            case 'student':
                const studentEmailField = document.getElementById('studentEmail');
                if (studentEmailField) {
                    studentEmailField.value = user.email;
                }
                break;
            case 'teacher':
                const teacherEmailField = document.getElementById('teacherEmail');
                if (teacherEmailField) {
                    teacherEmailField.value = user.email;
                }
                break;
        }
    }

    async handleCreateStudentForm() {
        const submitBtn = document.getElementById('createStudentBtn');
        const originalBtnText = submitBtn.innerHTML;
        
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Creating...';
        this.showLoadingOverlay();

        try {
            // Get current user's email from JWT
            const user = this.getCurrentUser();
            if (!user || !user.email) {
                throw new Error('Unable to get user information');
            }

            // Client-side validation
            const name = document.getElementById('studentName').value.trim();
            const email = user.email; // Use JWT email
            const instrument = document.getElementById('studentInstrument').value.trim();
            const cardNumber = document.getElementById('studentCardNumber').value.replace(/\s/g, '');
            const expiryDate = document.getElementById('studentExpiryDate').value;
            
            // Validation checks
            if (!name || name.length < 2) {
                throw new Error('Please enter a valid name (at least 2 characters)');
            }
            
            if (!instrument || instrument.length < 2) {
                throw new Error('Please enter the instrument(s) you play');
            }
            
            // If card number is provided, validate it (16 digits only)
            if (cardNumber) {
                if (cardNumber.length !== 16 || !/^\d+$/.test(cardNumber)) {
                    throw new Error('Card number must be exactly 16 digits');
                }
            }
            
            // If expiry date is provided, validate it
            if (expiryDate) {
                if (!/^\d{2}\/\d{2}$/.test(expiryDate)) {
                    throw new Error('Expiry date must be in MM/YY format');
                }
            }
            
            const data = {
                Name: name,
                Instrument: instrument,
                CardNumber: cardNumber || null,
                ExpiryDate: expiryDate || null
            };
            
            const result = await this.createStudent(data);
            this.hideLoadingOverlay();
            this.showBootstrapAlert('success', 'Student profile created successfully!');
            
            // Refresh the profile view
            await this.showUnifiedProfile('student');
        } catch (error) {
            this.hideLoadingOverlay();
            this.showBootstrapAlert('danger', `Error: ${error.message}`);
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalBtnText;
        }
    }

    async handleCreateTeacherForm() {
        const submitBtn = document.getElementById('createTeacherBtn');
        const originalBtnText = submitBtn.innerHTML;
        
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Creating...';
        this.showLoadingOverlay();

        try {
            // Get current user's email from JWT
            const user = this.getCurrentUser();
            if (!user || !user.email) {
                throw new Error('Unable to get user information');
            }

            // Client-side validation
            const name = document.getElementById('teacherName').value.trim();
            const email = user.email; // Use JWT email
            const instrument = document.getElementById('teacherInstrument').value.trim();
            const hourlyRate = parseFloat(document.getElementById('teacherHourlyRate').value);
            const availability = document.getElementById('teacherAvailability').value.trim();
            
            // Validation checks
            if (!name || name.length < 2) {
                throw new Error('Please enter a valid name (at least 2 characters)');
            }
            
            if (!instrument || instrument.length < 2) {
                throw new Error('Please enter a valid instrument');
            }
            
            if (!hourlyRate || hourlyRate < 20 || hourlyRate > 200) {
                throw new Error('Hourly rate must be between $20 and $200');
            }
            
            const data = {
                Name: name,
                Instrument: instrument,
                HourlyRate: hourlyRate,
                Availability: availability || null
            };
            
            const result = await this.createTeacher(data);
            this.hideLoadingOverlay();
            this.showBootstrapAlert('success', 'Teacher profile created successfully!');
            
            // Refresh the profile view
            await this.showUnifiedProfile('teacher');
        } catch (error) {
            this.hideLoadingOverlay();
            this.showBootstrapAlert('danger', `Error: ${error.message}`);
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalBtnText;
        }
    }

    getCreateProfileFormHTML(role) {
        switch (role) {
            case 'student':
                return `
                    <div class="card">
                        <div class="card-header bg-info text-white">
                            <h5 class="mb-0">Create Student Profile</h5>
                        </div>
                        <div class="card-body">
                            <form id="createStudentForm">
                                <div class="mb-3">
                                    <label class="form-label">Name *</label>
                                    <input type="text" class="form-control" id="studentName" required placeholder="e.g., Alice Johnson">
                                    <small class="form-text text-muted">Full name of the student</small>
                                </div>
                                <div class="mb-3">
                                    <label class="form-label">Email *</label>
                                    <input type="email" class="form-control" id="studentEmail" required readonly>
                                    <small class="form-text text-muted">Email from your account (cannot be changed)</small>
                                </div>
                                <div class="mb-3">
                                    <label class="form-label">Instrument(s) I play *</label>
                                    <input type="text" class="form-control" id="studentInstrument" required placeholder="e.g., Piano, Guitar, Violin">
                                    <small class="form-text text-muted">What instrument(s) do you play?</small>
                                </div>
                                <div class="mb-3">
                                    <label class="form-label">Card Number</label>
                                    <input type="text" class="form-control" id="studentCardNumber" maxlength="16" placeholder="1234567890123456">
                                    <small class="form-text text-muted">16-digit card number (optional)</small>
                                </div>
                                <div class="mb-3">
                                    <label class="form-label">Expiry Date</label>
                                    <input type="text" class="form-control" id="studentExpiryDate" maxlength="5" placeholder="MM/YY">
                                    <small class="form-text text-muted">Format: MM/YY (e.g., 12/25)</small>
                                </div>
                                <button type="submit" class="btn btn-info w-100" id="createStudentBtn">Create Profile</button>
                            </form>
                        </div>
                    </div>
                `;
            case 'teacher':
                return `
                    <div class="card">
                        <div class="card-header bg-success text-white">
                            <h5 class="mb-0">Create Teacher Profile</h5>
                        </div>
                        <div class="card-body">
                            <form id="createTeacherForm">
                                <div class="mb-3">
                                    <label class="form-label">Name *</label>
                                    <input type="text" class="form-control" id="teacherName" required placeholder="e.g., John Smith">
                                    <small class="form-text text-muted">Full name of the teacher</small>
                                </div>
                                <div class="mb-3">
                                    <label class="form-label">Email *</label>
                                    <input type="email" class="form-control" id="teacherEmail" required readonly>
                                    <small class="form-text text-muted">Email from your account (cannot be changed)</small>
                                </div>
                                <div class="mb-3">
                                    <label class="form-label">Instrument *</label>
                                    <input type="text" class="form-control" id="teacherInstrument" required placeholder="e.g., Piano, Guitar, Violin">
                                    <small class="form-text text-muted">Primary instrument you teach</small>
                                </div>
                                <div class="mb-3">
                                    <label class="form-label">Hourly Rate *</label>
                                    <input type="number" class="form-control" id="teacherHourlyRate" required min="20" max="200" step="0.01" placeholder="50.00">
                                    <small class="form-text text-muted">Rate per hour ($20-$200)</small>
                                </div>
                                <div class="mb-3">
                                    <label class="form-label">Availability</label>
                                    <textarea class="form-control" id="teacherAvailability" rows="3" placeholder="e.g., Mon-Fri 9-5, Weekends 10-6"></textarea>
                                    <small class="form-text text-muted">Your general availability</small>
                                </div>
                                <button type="submit" class="btn btn-success w-100" id="createTeacherBtn">Create Profile</button>
                            </form>
                        </div>
                    </div>
                `;
            case 'admin':
                return `
                    <div class="card">
                        <div class="card-header bg-danger text-white">
                            <h5 class="mb-0">Admin Profile</h5>
                        </div>
                        <div class="card-body">
                            <div class="alert alert-info">
                                <h5>👑 Admin Account</h5>
                                <p class="mb-0">Your admin profile is automatically created when you sign up. You can access all admin features.</p>
                            </div>
                            <button class="btn btn-primary w-100" onclick="app.showAdminPortal()">
                                📊 Go to Admin Dashboard
                            </button>
                        </div>
                    </div>
                `;
            default:
                return '<div class="alert alert-danger">Invalid role</div>';
        }
    }

    // Show Admin Portal
    async showAdminPortal() {
        await this.showUnifiedProfile('admin');
    }

    // Show Edit Profile for any role
    async showEditProfile(role) {
        const contentDiv = document.getElementById('profileContent');
        
        // Show loading state
        contentDiv.innerHTML = `
            <div class="card shadow">
                <div class="card-header bg-${role === 'admin' ? 'danger' : role === 'teacher' ? 'success' : 'info'} text-white">
                    <h5 class="mb-0">Edit ${role.charAt(0).toUpperCase() + role.slice(1)} Profile</h5>
                </div>
                <div class="card-body text-center">
                    <div class="spinner-border text-${role === 'admin' ? 'danger' : role === 'teacher' ? 'success' : 'info'}" role="status">
                        <span class="visually-hidden">Loading...</span>
                    </div>
                    <p class="mt-3">Loading your profile...</p>
                </div>
            </div>
        `;

        try {
            // Get current user's email from JWT
            const user = this.getCurrentUser();
            if (!user || !user.email) {
                throw new Error('Unable to get user information');
            }

            // Fetch current profile using JWT-based endpoint
            const response = await this.fetchWithAuth(`/${role}/profile`);
            
            if (!response.success || !response.data) {
                throw new Error('No profile found for your account');
            }

            const profile = response.data;
            
            // Show edit form with pre-filled data
            contentDiv.innerHTML = this.getEditProfileFormHTML(profile, role);
            this.attachEditProfileListeners(profile, role);
        } catch (error) {
            this.hideLoadingOverlay();
            this.showBootstrapAlert('danger', `Error: ${error.message}`);
            contentDiv.innerHTML = `
                <div class="alert alert-danger">
                    <h5>❌ Error Loading Profile</h5>
                    <p>${error.message}</p>
                    <button class="btn btn-primary" onclick="app.showUnifiedProfile('${role}')">Back to Profile</button>
                </div>
            `;
        }
    }

    getEditProfileFormHTML(profile, role) {
        const roleColor = role === 'admin' ? 'danger' : role === 'teacher' ? 'success' : 'info';
        
        switch (role) {
            case 'student':
                return `
                    <div class="card">
                        <div class="card-header bg-info text-white">
                            <h5 class="mb-0">Edit Student Profile</h5>
                        </div>
                        <div class="card-body">
                            <form id="editStudentForm">
                                <div class="mb-3">
                                    <label class="form-label">Name *</label>
                                    <input type="text" class="form-control" id="editStudentName" required value="${profile.Name || ''}">
                                    <small class="form-text text-muted">Full name of the student</small>
                                </div>
                                <div class="mb-3">
                                    <label class="form-label">Email *</label>
                                    <input type="email" class="form-control" id="editStudentEmail" required value="${profile.Email || ''}" readonly>
                                    <small class="form-text text-muted">Email cannot be changed</small>
                                </div>
                                <div class="mb-3">
                                    <label class="form-label">Instrument(s) I play *</label>
                                    <input type="text" class="form-control" id="editStudentInstrument" required value="${profile.Instrument || ''}" placeholder="e.g., Piano, Guitar, Violin">
                                    <small class="form-text text-muted">What instrument(s) do you play?</small>
                                </div>
                                <div class="mb-3">
                                    <label class="form-label">Card Number</label>
                                    <input type="text" class="form-control" id="editStudentCardNumber" maxlength="14" value="${profile.CardNumber || ''}" placeholder="12345678901234">
                                    <small class="form-text text-muted">14-digit card number (optional)</small>
                                </div>
                                <div class="mb-3">
                                    <label class="form-label">Expiry Date</label>
                                    <input type="text" class="form-control" id="editStudentExpiryDate" maxlength="5" value="${profile.ExpiryDate || ''}" placeholder="MM/YY">
                                    <small class="form-text text-muted">Format: MM/YY (e.g., 12/25)</small>
                                </div>
                                <div class="mb-3">
                                    <label class="form-label">PIN</label>
                                    <input type="password" class="form-control" id="editStudentPin" maxlength="4" value="${profile.Pin || ''}" placeholder="1234">
                                    <small class="form-text text-muted">3 or 4 digit PIN (optional)</small>
                                </div>
                                <button type="submit" class="btn btn-info w-100" id="updateStudentBtn">Update Profile</button>
                            </form>
                        </div>
                    </div>
                `;
            case 'teacher':
                return `
                    <div class="card">
                        <div class="card-header bg-success text-white">
                            <h5 class="mb-0">Edit Teacher Profile</h5>
                        </div>
                        <div class="card-body">
                            <form id="editTeacherForm">
                                <div class="mb-3">
                                    <label class="form-label">Name *</label>
                                    <input type="text" class="form-control" id="editTeacherName" required value="${profile.Name || ''}">
                                    <small class="form-text text-muted">Full name of the teacher</small>
                                </div>
                                <div class="mb-3">
                                    <label class="form-label">Email *</label>
                                    <input type="email" class="form-control" id="editTeacherEmail" required value="${profile.Email || ''}" readonly>
                                    <small class="form-text text-muted">Email cannot be changed</small>
                                </div>
                                <div class="mb-3">
                                    <label class="form-label">Instrument *</label>
                                    <input type="text" class="form-control" id="editTeacherInstrument" required value="${profile.Instrument || ''}" placeholder="e.g., Piano, Guitar, Violin">
                                    <small class="form-text text-muted">Primary instrument you teach</small>
                                </div>
                                <div class="mb-3">
                                    <label class="form-label">Hourly Rate *</label>
                                    <input type="number" class="form-control" id="editTeacherHourlyRate" required min="20" max="200" step="0.01" value="${profile.HourlyRate || ''}">
                                    <small class="form-text text-muted">Rate per hour ($20-$200)</small>
                                </div>
                                <div class="mb-3">
                                    <label class="form-label">Availability</label>
                                    <textarea class="form-control" id="editTeacherAvailability" rows="3" placeholder="e.g., Mon-Fri 9-5, Weekends 10-6">${profile.Availability || ''}</textarea>
                                    <small class="form-text text-muted">Your general availability</small>
                                </div>
                                <button type="submit" class="btn btn-success w-100" id="updateTeacherBtn">Update Profile</button>
                            </form>
                        </div>
                    </div>
                `;
            case 'admin':
                return `
                    <div class="card">
                        <div class="card-header bg-danger text-white">
                            <h5 class="mb-0">Edit Admin Profile</h5>
                        </div>
                        <div class="card-body">
                            <form id="editAdminForm">
                                <div class="mb-3">
                                    <label class="form-label">Name *</label>
                                    <input type="text" class="form-control" id="editAdminName" required value="${profile.Name || ''}">
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Email</label>
                                <input type="email" class="form-control" value="${profile.Email}" readonly>
                                    <small class="form-text text-muted">Email cannot be changed</small>
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Role</label>
                                <input type="text" class="form-control" value="${profile.Role}" readonly>
                                    <small class="form-text text-muted">Role cannot be changed</small>
                            </div>
                                <div class="d-grid gap-2">
                                    <button type="submit" class="btn btn-danger">Update Profile</button>
                                    <button type="button" class="btn btn-secondary" onclick="app.showUnifiedProfile('admin')">Cancel</button>
                                </div>
                            </form>
                        </div>
                    </div>
                `;
            default:
                return '<div class="alert alert-danger">Invalid role</div>';
        }
    }

    // Show Delete Profile Confirmation Modal
    showDeleteProfileModal(role) {
        const roleColor = role === 'admin' ? 'danger' : role === 'teacher' ? 'success' : 'info';
        const roleIcon = role === 'admin' ? '👑' : role === 'teacher' ? '🎓' : '🎵';
        
        const modalHTML = `
            <div class="modal fade" id="deleteProfileModal" tabindex="-1" aria-labelledby="deleteProfileModalLabel" aria-hidden="true">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header bg-${roleColor} text-white">
                            <h5 class="modal-title" id="deleteProfileModalLabel">${roleIcon} Delete ${role.charAt(0).toUpperCase() + role.slice(1)} Profile</h5>
                            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div class="modal-body">
                            <div class="alert alert-danger">
                                <h5>⚠️ Warning!</h5>
                                <p class="mb-0">This action cannot be undone. Deleting your profile will:</p>
                                <ul class="mb-0 mt-2">
                                    <li>Remove all your profile information</li>
                                    ${role === 'student' ? '<li>Cancel any booked lessons</li>' : ''}
                                    ${role === 'teacher' ? '<li>Remove all your scheduled lessons</li>' : ''}
                                    <li>Require you to create a new profile to continue using the system</li>
                                </ul>
                            </div>
                            <p>Are you sure you want to delete your ${role} profile?</p>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                            <button type="button" class="btn btn-danger" onclick="app.confirmDeleteProfile('${role}')">Yes, Delete Profile</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Remove existing modal if any
        const existingModal = document.getElementById('deleteProfileModal');
        if (existingModal) {
            existingModal.remove();
        }
        
        // Add modal to body
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        // Show modal
        const modal = new bootstrap.Modal(document.getElementById('deleteProfileModal'));
        modal.show();
    }

    // Confirm Delete Profile
    async confirmDeleteProfile(role) {
        try {
            // Get current user's email from JWT
            const user = this.getCurrentUser();
            if (!user || !user.email) {
                throw new Error('Unable to get user information');
            }

            this.showLoadingOverlay();

            // Delete profile using JWT-based endpoint
            const response = await this.deleteDataWithAuth(`/${role}/profile`);

            this.hideLoadingOverlay();

            if (response.success) {
                this.showBootstrapAlert('success', 'Profile deleted successfully!');
                
                // Hide modal and remove focus to fix ARIA warning
                const modal = bootstrap.Modal.getInstance(document.getElementById('deleteProfileModal'));
                const modalElement = document.getElementById('deleteProfileModal');
                
                // Remove focus from any focused element within the modal
                if (document.activeElement && modalElement.contains(document.activeElement)) {
                    document.activeElement.blur();
                }
                
                modal.hide();
                
                // Clean up modal after it's hidden
                setTimeout(() => {
                    modalElement.remove();
                }, 300);
                
                // Show create profile form
                this.showCreateProfileForm(role);
            } else {
                throw new Error(response.error || 'Failed to delete profile');
            }
        } catch (error) {
            this.hideLoadingOverlay();
            this.showBootstrapAlert('danger', `Error: ${error.message}`);
        }
    }

    // Attach Edit Profile Form Listeners
    attachEditProfileListeners(profile, role) {
        setTimeout(() => {
            switch (role) {
                case 'student':
                    this.attachStudentEditFormListeners(profile.Id);
                    break;
                case 'teacher':
                    this.attachTeacherEditFormListeners(profile.Id);
                    break;
                case 'admin':
                    this.attachAdminEditFormListeners();
                    break;
            }
        }, 100);
    }

    attachAdminEditFormListeners() {
        const editAdminForm = document.getElementById('editAdminForm');
        console.log('Admin form found:', editAdminForm);
        if (editAdminForm) {
            editAdminForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                console.log('Admin form submitted');
                
                const name = document.getElementById('editAdminName').value.trim();
                console.log('Name from form:', name);
                
                // Validation
                if (!name || name.length < 2) {
                    this.showBootstrapAlert('warning', 'Please enter a valid name (at least 2 characters)');
                    return;
                }
                
                try {
                    this.showLoadingOverlay();
                    
                    console.log('Updating admin profile with name:', name);
                    const response = await this.putDataWithAuth('/admin/profile', {
                        Name: name
                    });
                    
                    console.log('Update response:', response);
                    this.hideLoadingOverlay();
                    
                    if (response.success) {
                        this.showBootstrapAlert('success', 'Admin profile updated successfully!');
                        // Force reload the profile from server
                        await this.showUnifiedProfile('admin');
                    } else {
                        this.showBootstrapAlert('danger', response.error || 'Failed to update admin profile');
                    }
                } catch (error) {
                    this.hideLoadingOverlay();
                    this.showBootstrapAlert('danger', `Error: ${error.message}`);
                }
            });
        }
    }

    // Show Admin Dashboard (separate from profile)
    async showAdminDashboard() {
        // Check authentication and admin role
        if (!this.requireAuth('admin')) return;

        this.updateActiveNav('nav-admin');
        const app = document.getElementById('app');
        app.innerHTML = `
            <div class="card shadow">
                <div class="card-header bg-primary text-white">
                    <h3 class="mb-0">👨‍💼 Admin Portal - Dashboard</h3>
                </div>
                <div class="card-body">
                    <div class="row mb-4">
                        <div class="col-md-2 col-6 mb-3">
                            <div class="card border-primary h-100">
                                <div class="card-body text-center">
                                    <h6 class="card-title text-primary">📊 Revenue Report</h6>
                                    <button class="btn btn-primary btn-sm w-100" onclick="app.showRevenueReport()">View</button>
                                </div>
                            </div>
                        </div>
                        <div class="col-md-2 col-6 mb-3">
                            <div class="card border-success h-100">
                                <div class="card-body text-center">
                                    <h6 class="card-title text-success">🎵 Instrument Popularity</h6>
                                    <button class="btn btn-success btn-sm w-100" onclick="app.showInstrumentPopularity()">View</button>
                                </div>
                            </div>
                        </div>
                        <div class="col-md-2 col-6 mb-3">
                            <div class="card border-info h-100">
                                <div class="card-body text-center">
                                    <h6 class="card-title text-info">📅 Lesson Schedule</h6>
                                    <button class="btn btn-info btn-sm w-100" onclick="app.showLessonSchedule()">View</button>
                                </div>
                            </div>
                        </div>
                        <div class="col-md-2 col-6 mb-3">
                            <div class="card border-warning h-100">
                                <div class="card-body text-center">
                                    <h6 class="card-title text-warning">👥 User Stats</h6>
                                    <button class="btn btn-warning btn-sm w-100" onclick="app.showUserStats()">View</button>
                                </div>
                            </div>
                        </div>
                        <div class="col-md-2 col-6 mb-3">
                            <div class="card border-danger h-100">
                                <div class="card-body text-center">
                                    <h6 class="card-title text-danger">📢 Outreach Sources</h6>
                                    <button class="btn btn-danger btn-sm w-100" onclick="app.showOutreachSources()">View</button>
                                </div>
                            </div>
                        </div>
                        <div class="col-md-2 col-6 mb-3">
                            <div class="card border-secondary h-100">
                                <div class="card-body text-center">
                                    <h6 class="card-title text-secondary">✏️ Edit User</h6>
                                    <button class="btn btn-secondary btn-sm w-100" onclick="app.showEditUserForm()">Edit</button>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div id="adminContent">
                        <div class="alert alert-info text-center">
                            <h5>Welcome to Admin Dashboard</h5>
                            <p>Select a report from above to view detailed information</p>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    // Show Teacher Portal
    async showTeacherPortal() {
        await this.showUnifiedProfile('teacher');
    }

    // Show Student Portal
    async showStudentPortal() {
        await this.showUnifiedProfile('student');
    }

    showStudentProfile(student) {
        const app = document.getElementById('app');
        app.innerHTML = `
            <div class="card shadow">
                <div class="card-header bg-info text-white">
                    <h3 class="mb-0">🎓 Student Portal</h3>
                </div>
                <div class="card-body">
                    <div class="row">
                        <div class="col-md-8">
                            <div class="card">
                                <div class="card-header bg-success text-white">
                                    <h5 class="mb-0">📋 Your Profile</h5>
                                </div>
                                <div class="card-body">
                                    <div class="row">
                                        <div class="col-md-6">
                                            <p><strong>Name:</strong> ${student.Name || 'Not provided'}</p>
                                            <p><strong>Email:</strong> ${student.Email}</p>
                                            <p><strong>Instrument:</strong> ${student.Instrument || 'Not provided'}</p>
                                        </div>
                                        <div class="col-md-6">
                                            <p><strong>Card Number:</strong> ${student.CardNumber ? '****-****-****-' + student.CardNumber.slice(-4) : 'Not provided'}</p>
                                            <p><strong>Expiry Date:</strong> ${student.ExpiryDate || 'Not provided'}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="col-md-4">
                            <div class="card">
                                <div class="card-header bg-primary text-white">
                                    <h5 class="mb-0">🎯 Quick Actions</h5>
                                </div>
                                <div class="card-body">
                                    <button class="btn btn-primary w-100 mb-2" onclick="app.showEditStudentProfile()">
                                        ✏️ Edit Profile
                                    </button>
                                    <button class="btn btn-success w-100 mb-2" onclick="app.showLessonBooking()">
                                        📚 Browse & Book Lessons
                                    </button>
                                    <button class="btn btn-info w-100 mb-2" onclick="app.showMyBookings()">
                                        📅 My Bookings
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div id="studentContent"></div>
                </div>
            </div>
        `;
        
        this.showBootstrapAlert('success', 'Profile loaded successfully!');
    }

    showStudentPortalWithCreateForm() {
        const app = document.getElementById('app');
        app.innerHTML = `
            <div class="card shadow">
                <div class="card-header bg-info text-white">
                    <h3 class="mb-0">🎓 Student Portal</h3>
                </div>
                <div class="card-body">
                    <div class="alert alert-info">
                        <h5>👋 Welcome!</h5>
                        <p class="mb-0">No profile found for your account. Please create your student profile to get started.</p>
                    </div>
                    <div class="row">
                        <div class="col-md-3 col-6 mb-3">
                            <div class="card h-100">
                                <div class="card-body text-center">
                                    <h6 class="card-title">Create Profile</h6>
                                    <button class="btn btn-info btn-sm w-100" onclick="app.showCreateStudentForm()">Create</button>
                                </div>
                            </div>
                        </div>
                        <div class="col-md-3 col-6 mb-3">
                            <div class="card h-100">
                                <div class="card-body text-center">
                                    <h6 class="card-title">Browse Lessons</h6>
                                    <button class="btn btn-success btn-sm w-100" onclick="app.loadAvailableLessons()">Browse</button>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div id="studentContent"></div>
                </div>
            </div>
        `;
        
        this.showBootstrapAlert('info', 'Please create your student profile to get started.');
    }

    // ==================== API Functions ====================

    async getRevenueReport() {
        const response = await this.fetchWithAuth('/admin/analytics/revenue-quarterly');
        return response.data || [];
    }

    async getInstrumentPopularity() {
        const response = await this.fetchWithAuth('/admin/analytics/popular-instruments');
        return response.data || [];
    }

    async getLessonSchedule() {
        const response = await this.fetchWithAuth('/admin/analytics/booked-lessons');
        return response.data || [];
    }

    async getUserStats() {
        const response = await this.fetchWithAuth('/admin/user-stats');
        return response.data || {};
    }

    async getOutreachSources() {
        const response = await this.fetchWithAuth('/admin/outreach-sources');
        return response.data || [];
    }

    async getSecondLessonTracking() {
        const response = await this.fetchWithAuth('/admin/analytics/second-lesson-tracking');
        return response.data || {};
    }

    async createTeacher(data) {
        const response = await this.postDataWithAuth('/teacher/profile', data);
        return response;
    }

    async scheduleLesson(data) {
        const response = await this.postData('/teacher/schedule', data);
        return response;
    }

    async getTeacherBookings(teacherId) {
        const response = await this.fetchData(`/teacher/bookings?teacherId=${teacherId}`);
        return response.data || [];
    }

    async getTeacherLessons(teacherId) {
        const response = await this.fetchWithAuth('/teacher/lessons');
        return response.data || [];
    }

    async createStudent(data) {
        const response = await this.postDataWithAuth('/student/profile', data);
        return response;
    }

    async getAvailability() {
        const response = await this.fetchData('/student/availability');
        return response.data || [];
    }

    async bookLesson(data) {
        const response = await this.postData('/student/book', data);
        return response;
    }

    async verifyCard(data) {
        const response = await this.postData('/student/verify-card', data);
        return response;
    }

    async updateStudentProfile(data) {
        const response = await this.putDataWithAuth('/student/profile', data);
        return response;
    }

    async getStudentByEmail(email) {
        const response = await this.fetchData(`/student/by-email/${encodeURIComponent(email)}`);
        return response;
    }

    async deleteStudentByEmail(email) {
        const response = await this.deleteData(`/student/by-email/${encodeURIComponent(email)}`);
        return response;
    }

    async getTeacherByEmail(email) {
        const response = await this.fetchData(`/teacher/by-email/${encodeURIComponent(email)}`);
        return response;
    }

    async deleteTeacherByEmail(email) {
        const response = await this.deleteData(`/teacher/by-email/${encodeURIComponent(email)}`);
        return response;
    }

    async getAdminByEmail(email) {
        const response = await this.fetchData(`/admin/by-email/${encodeURIComponent(email)}`);
        return response;
    }

    async deleteAdminByEmail(email) {
        const response = await this.deleteData(`/admin/by-email/${encodeURIComponent(email)}`);
        return response;
    }

    async updateTeacherProfile(data) {
        const response = await this.putDataWithAuth('/teacher/profile', data);
        return response;
    }

    async updateUserProfile(data) {
        const response = await this.putData('/admin/update-user', data);
        return response;
    }

    // ==================== Notification System ====================

    showNotification(message, type = 'info', duration = 5000) {
        // Create notification container if it doesn't exist
        let notificationContainer = document.getElementById('notificationContainer');
        if (!notificationContainer) {
            notificationContainer = document.createElement('div');
            notificationContainer.id = 'notificationContainer';
            notificationContainer.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 9999;
                max-width: 400px;
            `;
            document.body.appendChild(notificationContainer);
        }

        // Create notification element
        const notification = document.createElement('div');
        notification.className = `alert alert-${type} alert-dismissible fade show`;
        notification.style.cssText = `
            margin-bottom: 10px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        `;
        
        notification.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        `;

        // Add to container
        notificationContainer.appendChild(notification);

        // Auto-remove after duration
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, duration);

        return notification;
    }

    showCancellationNotification(studentName, lessonTime, instrument) {
        const message = `
            <strong>Lesson Cancelled</strong><br>
            <small>${studentName} cancelled their ${instrument} lesson scheduled for ${lessonTime}</small>
        `;
        this.showNotification(message, 'warning', 8000);
    }

    // ==================== Teacher Upcoming Lessons ====================

    async showUpcomingLessons() {
        try {
            const app = document.getElementById('app');
            if (!app) {
                console.error('App element not found');
                return;
            }

            // Show loading state
            app.innerHTML = `
                <div class="card shadow">
                    <div class="card-header bg-success text-white d-flex justify-content-between align-items-center">
                        <h3 class="mb-0">📅 Upcoming Lessons</h3>
                        <div class="d-flex gap-2">
                            <button class="btn btn-outline-light btn-sm" onclick="app.showUnifiedProfile('teacher')">
                                <i class="fas fa-arrow-left"></i> Back to Profile
                            </button>
                        </div>
                    </div>
                    <div class="card-body text-center">
                        <div class="spinner-border text-success" role="status">
                            <span class="visually-hidden">Loading...</span>
                        </div>
                        <p class="mt-3">Loading upcoming lessons...</p>
                    </div>
                </div>
            `;

            // Get current user info
            const user = this.getCurrentUser();
            if (!user) {
                throw new Error('Please log in to view lessons');
            }

            // Fetch teacher's lessons
            const response = await this.fetchWithAuth('/teacher/lessons');
            
            if (!response.success || !response.data) {
                throw new Error('Failed to load lessons');
            }

            const lessons = response.data;
            
            // Filter for upcoming lessons (booked by students)
            const upcomingLessons = lessons.filter(lesson => 
                lesson.StudentId && 
                lesson.Status === 'Booked' &&
                new Date(lesson.TimeSlot.split(' - ')[0]) > new Date()
            );

            if (upcomingLessons.length === 0) {
                app.innerHTML = `
                    <div class="card shadow">
                        <div class="card-header bg-success text-white d-flex justify-content-between align-items-center">
                            <h3 class="mb-0">📅 Upcoming Lessons</h3>
                            <div class="d-flex gap-2">
                                <button class="btn btn-outline-light btn-sm" onclick="app.showUnifiedProfile('teacher')">
                                    <i class="fas fa-arrow-left"></i> Back to Profile
                                </button>
                            </div>
                        </div>
                        <div class="card-body text-center">
                            <div class="alert alert-info">
                                <h5>No Upcoming Lessons</h5>
                                <p>You don't have any upcoming lessons scheduled. Students can book your available lessons!</p>
                                <button class="btn btn-primary" onclick="app.showScheduleLessonForm()">Schedule New Lesson</button>
                            </div>
                        </div>
                    </div>
                `;
                return;
            }

            // Display upcoming lessons in calendar view
            let html = `
                <div class="card shadow">
                    <div class="card-header bg-success text-white d-flex justify-content-between align-items-center">
                        <h3 class="mb-0">📅 Upcoming Lessons</h3>
                        <div class="d-flex gap-2">
                            <button class="btn btn-outline-light btn-sm" onclick="app.showPastLessons()">
                                <i class="fas fa-history"></i> View Past Lessons
                            </button>
                            <button class="btn btn-outline-light btn-sm" onclick="app.showUnifiedProfile('teacher')">
                                <i class="fas fa-arrow-left"></i> Back to Profile
                            </button>
                        </div>
                    </div>
                    <div class="card-body">
                        <div class="row">
            `;

            // Group lessons by date
            const lessonsByDate = {};
            upcomingLessons.forEach(lesson => {
                const startTime = new Date(lesson.TimeSlot.split(' - ')[0]);
                const dateKey = startTime.toDateString();
                
                if (!lessonsByDate[dateKey]) {
                    lessonsByDate[dateKey] = [];
                }
                lessonsByDate[dateKey].push(lesson);
            });

            // Sort dates
            const sortedDates = Object.keys(lessonsByDate).sort((a, b) => new Date(a) - new Date(b));

            // Display calendar
            sortedDates.forEach(dateKey => {
                const date = new Date(dateKey);
                const dayLessons = lessonsByDate[dateKey];
                
                html += `
                    <div class="col-md-6 col-lg-4 mb-4">
                        <div class="card border-primary">
                            <div class="card-header bg-primary text-white">
                                <h6 class="mb-0">${date.toLocaleDateString('en-US', { 
                                    weekday: 'long', 
                                    year: 'numeric', 
                                    month: 'long', 
                                    day: 'numeric' 
                                })}</h6>
                            </div>
                            <div class="card-body p-2">
                `;

                dayLessons.forEach(lesson => {
                    const startTime = new Date(lesson.TimeSlot.split(' - ')[0]);
                    const endTime = new Date(lesson.TimeSlot.split(' - ')[1]);
                    
                    // Calculate duration
                    const duration = endTime - startTime;
                    const durationText = duration.TotalHours >= 1 
                        ? `${Math.floor(duration.TotalHours)}h ${duration.Minutes}m`
                        : `${duration.Minutes}m`;

                    // Lesson type badge
                    let lessonTypeBadge = 'bg-success';
                    let displayLessonType = 'In-Person';
                    
                    if (lesson.DisplayLessonType) {
                        displayLessonType = lesson.DisplayLessonType;
                    } else if (lesson.StudentLessonType) {
                        displayLessonType = lesson.StudentLessonType;
                    } else if (lesson.LessonTypeNew) {
                        displayLessonType = lesson.LessonTypeNew;
                    } else if (lesson.LessonType) {
                        displayLessonType = lesson.LessonType === 'virtual' ? 'Virtual' : 'In-Person';
                    }
                    
                    if (displayLessonType === 'Virtual') {
                        lessonTypeBadge = 'bg-info';
                    } else if (displayLessonType === 'Student Preference') {
                        lessonTypeBadge = 'bg-warning';
                    }

                    html += `
                        <div class="lesson-card mb-2 p-2 border rounded">
                            <div class="d-flex justify-content-between align-items-start">
                                <div>
                                    <strong>${lesson.StudentName || 'Unknown Student'}</strong>
                                    <br>
                                    <small class="text-muted">${lesson.Instrument}</small>
                                </div>
                                <span class="badge ${lessonTypeBadge}">${displayLessonType}</span>
                            </div>
                            <div class="mt-1">
                                <small class="text-primary">
                                    <i class="fas fa-clock"></i> 
                                    ${startTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - 
                                    ${endTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                </small>
                                <br>
                                <small class="text-success">
                                    <i class="fas fa-dollar-sign"></i> $${lesson.Price ? lesson.Price.toFixed(2) : '0.00'}
                                </small>
                            </div>
                            <div class="mt-2">
                                <button class="btn btn-outline-primary btn-sm w-100" onclick="app.showLessonDetails(${lesson.Id})">
                                    <i class="fas fa-info-circle"></i> Lesson Details
                                </button>
                            </div>
                        </div>
                    `;
                });

                html += `
                            </div>
                        </div>
                    </div>
                `;
            });

            html += `
                        </div>
                    </div>
                </div>
            `;

            app.innerHTML = html;

        } catch (error) {
            const app = document.getElementById('app');
            if (app) {
                app.innerHTML = `
                    <div class="card shadow">
                        <div class="card-header bg-danger text-white">
                            <h3 class="mb-0">❌ Error</h3>
                        </div>
                        <div class="card-body">
                            <div class="alert alert-danger">
                                <h5>Unable to Load Lessons</h5>
                                <p>${error.message}</p>
                                <button class="btn btn-primary" onclick="app.showUnifiedProfile('teacher')">Back to Profile</button>
                            </div>
                        </div>
                    </div>
                `;
            }
        }
    }

    async showPastLessons() {
        try {
            const app = document.getElementById('app');
            if (!app) {
                console.error('App element not found');
                return;
            }

            // Show loading state
            app.innerHTML = `
                <div class="card shadow">
                    <div class="card-header bg-secondary text-white d-flex justify-content-between align-items-center">
                        <h3 class="mb-0">📚 Past Lessons</h3>
                        <div class="d-flex gap-2">
                            <button class="btn btn-outline-light btn-sm" onclick="app.showUpcomingLessons()">
                                <i class="fas fa-calendar"></i> Upcoming Lessons
                            </button>
                            <button class="btn btn-outline-light btn-sm" onclick="app.showUnifiedProfile('teacher')">
                                <i class="fas fa-arrow-left"></i> Back to Profile
                            </button>
                        </div>
                    </div>
                    <div class="card-body text-center">
                        <div class="spinner-border text-secondary" role="status">
                            <span class="visually-hidden">Loading...</span>
                        </div>
                        <p class="mt-3">Loading past lessons...</p>
                    </div>
                </div>
            `;

            // Get current user info
            const user = this.getCurrentUser();
            if (!user) {
                throw new Error('Please log in to view lessons');
            }

            // Fetch teacher's lessons
            const response = await this.fetchWithAuth('/teacher/lessons');
            
            if (!response.success || !response.data) {
                throw new Error('Failed to load lessons');
            }

            const lessons = response.data;
            
            // Filter for past lessons (completed or cancelled)
            const pastLessons = lessons.filter(lesson => 
                lesson.StudentId && 
                new Date(lesson.TimeSlot.split(' - ')[0]) < new Date()
            );

            if (pastLessons.length === 0) {
                app.innerHTML = `
                    <div class="card shadow">
                        <div class="card-header bg-secondary text-white d-flex justify-content-between align-items-center">
                            <h3 class="mb-0">📚 Past Lessons</h3>
                            <div class="d-flex gap-2">
                                <button class="btn btn-outline-light btn-sm" onclick="app.showUpcomingLessons()">
                                    <i class="fas fa-calendar"></i> Upcoming Lessons
                                </button>
                                <button class="btn btn-outline-light btn-sm" onclick="app.showUnifiedProfile('teacher')">
                                    <i class="fas fa-arrow-left"></i> Back to Profile
                                </button>
                            </div>
                        </div>
                        <div class="card-body text-center">
                            <div class="alert alert-info">
                                <h5>No Past Lessons</h5>
                                <p>You don't have any completed lessons yet.</p>
                            </div>
                        </div>
                    </div>
                `;
                return;
            }

            // Display past lessons in table format
            let html = `
                <div class="card shadow">
                    <div class="card-header bg-secondary text-white d-flex justify-content-between align-items-center">
                        <h3 class="mb-0">📚 Past Lessons</h3>
                        <div class="d-flex gap-2">
                            <button class="btn btn-outline-light btn-sm" onclick="app.showUpcomingLessons()">
                                <i class="fas fa-calendar"></i> Upcoming Lessons
                            </button>
                            <button class="btn btn-outline-light btn-sm" onclick="app.showUnifiedProfile('teacher')">
                                <i class="fas fa-arrow-left"></i> Back to Profile
                            </button>
                        </div>
                    </div>
                    <div class="card-body">
                        <div class="table-responsive">
                            <table class="table table-striped table-hover">
                                <thead class="table-dark">
                                    <tr>
                                        <th>Student Name</th>
                                        <th>Instrument</th>
                                        <th>Lesson Type</th>
                                        <th>Date</th>
                                        <th>Start Time</th>
                                        <th>End Time</th>
                                        <th>Status</th>
                                        <th>Notes</th>
                                    </tr>
                                </thead>
                                <tbody>
            `;

            pastLessons.forEach(lesson => {
                const startTime = new Date(lesson.TimeSlot.split(' - ')[0]);
                const endTime = new Date(lesson.TimeSlot.split(' - ')[1]);
                
                // Lesson type badge
                let lessonTypeBadge = 'bg-success';
                let displayLessonType = 'In-Person';
                
                if (lesson.DisplayLessonType) {
                    displayLessonType = lesson.DisplayLessonType;
                } else if (lesson.StudentLessonType) {
                    displayLessonType = lesson.StudentLessonType;
                } else if (lesson.LessonTypeNew) {
                    displayLessonType = lesson.LessonTypeNew;
                } else if (lesson.LessonType) {
                    displayLessonType = lesson.LessonType === 'virtual' ? 'Virtual' : 'In-Person';
                }
                
                if (displayLessonType === 'Virtual') {
                    lessonTypeBadge = 'bg-info';
                } else if (displayLessonType === 'Student Preference') {
                    lessonTypeBadge = 'bg-warning';
                }

                html += `
                    <tr>
                        <td><strong>${lesson.StudentName || 'Unknown Student'}</strong></td>
                        <td><span class="badge bg-secondary">${lesson.Instrument}</span></td>
                        <td><span class="badge ${lessonTypeBadge}">${displayLessonType}</span></td>
                        <td><small>${startTime.toLocaleDateString()}</small></td>
                        <td><small>${startTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</small></td>
                        <td><small>${endTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</small></td>
                        <td><span class="badge bg-secondary">Completed</span></td>
                        <td><small class="text-muted">${lesson.Notes || '-'}</small></td>
                    </tr>
                `;
            });

            html += `
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            `;

            app.innerHTML = html;

        } catch (error) {
            const app = document.getElementById('app');
            if (app) {
                app.innerHTML = `
                    <div class="card shadow">
                        <div class="card-header bg-danger text-white">
                            <h3 class="mb-0">❌ Error</h3>
                        </div>
                        <div class="card-body">
                            <div class="alert alert-danger">
                                <h5>Unable to Load Past Lessons</h5>
                                <p>${error.message}</p>
                                <button class="btn btn-primary" onclick="app.showUnifiedProfile('teacher')">Back to Profile</button>
                            </div>
                        </div>
                    </div>
                `;
            }
        }
    }

    showLessonDetails(lessonId) {
        // This would open a modal with full lesson details
        // For now, just show an alert
        this.showBootstrapAlert('info', `Lesson details for ID: ${lessonId}`);
    }

    // ==================== Admin Views ====================

    async showRevenueReport() {
        try {
            const contentDiv = document.getElementById('adminContent');
            contentDiv.innerHTML = '<div class="text-center"><div class="spinner-border" role="status"><span class="visually-hidden">Loading...</span></div></div>';
            
            const reports = await this.getRevenueReport();
            
            if (reports.length === 0) {
                contentDiv.innerHTML = '<div class="alert alert-info">No revenue data available</div>';
                return;
            }

            let totalRevenue = 0;
            reports.forEach(r => {
                if (r && typeof r.Revenue === 'number') {
                totalRevenue += r.Revenue;
                }
            });

            const maxRevenue = Math.max(...reports.map(r => r && typeof r.Revenue === 'number' ? r.Revenue : 0));
            const sortedQuarters = reports.filter(r => r && r.Quarter).sort((a, b) => {
                const quarterA = a.Quarter || 'Unknown';
                const quarterB = b.Quarter || 'Unknown';
                return quarterA.localeCompare(quarterB);
            });

            // Build enhanced bar chart HTML
            let chartHtml = `
                <div class="card mb-4 border-primary">
                    <div class="card-header bg-primary text-white">
                        <h5 class="mb-0">📊 Quarterly Revenue Overview</h5>
                    </div>
                    <div class="card-body">
                        <div class="row mb-3">
                            <div class="col-12 text-center">
                                <h3 class="text-primary">Total Revenue: $${totalRevenue.toFixed(2)}</h3>
                            </div>
                        </div>
                        <div class="chart-container" style="padding: 20px;">
            `;

            sortedQuarters.forEach((report, index) => {
                if (!report || typeof report.Revenue !== 'number') return;
                
                const percentage = ((report.Revenue / totalRevenue) * 100).toFixed(1);
                const colors = ['bg-primary', 'bg-success', 'bg-info', 'bg-warning', 'bg-danger'];
                const color = colors[index % colors.length];
                
                chartHtml += `
                    <div class="mb-4">
                        <div class="d-flex justify-content-between align-items-center mb-2">
                            <div>
                                <strong class="text-dark fs-5">📅 ${report.Quarter || 'Unknown'}</strong>
                            </div>
                            <div>
                                <span class="badge ${color} fs-6 px-3 py-2">$${report.Revenue.toFixed(2)}</span>
                            </div>
                        </div>
                        <div class="position-relative" style="height: 50px; background-color: #e9ecef; border-radius: 8px; overflow: hidden; box-shadow: inset 0 2px 4px rgba(0,0,0,0.1);">
                            <div class="${color} h-100 d-flex align-items-center justify-content-end shadow-sm" 
                                 style="width: ${percentage}%; border-radius: 8px; transition: width 0.8s ease-in-out; min-width: 100px;">
                                <span class="text-white fw-bold px-3" style="font-size: 16px;">${percentage}%</span>
                            </div>
                        </div>
                        <small class="text-muted">${percentage}% of total revenue</small>
                    </div>
                `;
            });

            chartHtml += `
                        </div>
                    </div>
                </div>
            `;

            // Build summary table HTML
            let tableHtml = `
                <div class="card border-success">
                    <div class="card-header bg-success text-white">
                        <h5 class="mb-0">📋 Detailed Revenue Breakdown</h5>
                    </div>
                    <div class="card-body">
                        <div class="table-responsive">
                            <table class="table table-striped table-hover">
                                <thead class="table-dark">
                                    <tr>
                                        <th>Quarter</th>
                                        <th>Revenue</th>
                                        <th>Percentage</th>
                                    </tr>
                                </thead>
                                <tbody>
            `;
            
            sortedQuarters.forEach(r => {
                const percentage = ((r.Revenue / totalRevenue) * 100).toFixed(2);
                tableHtml += `
                    <tr>
                        <td><strong>${r.Quarter}</strong></td>
                        <td><span class="text-success fw-bold">$${r.Revenue.toFixed(2)}</span></td>
                        <td><span class="badge bg-info">${percentage}%</span></td>
                    </tr>
                `;
            });
            
            tableHtml += `
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            `;

            contentDiv.innerHTML = chartHtml + tableHtml;
        } catch (error) {
            document.getElementById('adminContent').innerHTML = `<div class="alert alert-danger">Error: ${error.message}</div>`;
        }
    }

    async showInstrumentPopularity() {
        try {
            const contentDiv = document.getElementById('adminContent');
            contentDiv.innerHTML = '<div class="text-center"><div class="spinner-border" role="status"><span class="visually-hidden">Loading...</span></div></div>';
            
            const data = await this.getInstrumentPopularity();
            
            if (data.length === 0) {
                contentDiv.innerHTML = '<div class="alert alert-info">No instrument data available</div>';
                return;
            }

            // Sort by booked lessons descending
            const sortedData = data.sort((a, b) => b.BookedLessons - a.BookedLessons);
            const totalCount = sortedData.reduce((sum, item) => sum + item.BookedLessons, 0);
            const maxCount = sortedData[0].BookedLessons;
            const totalRevenue = sortedData.reduce((sum, item) => sum + item.Revenue, 0);

            // Build instrument popularity table with outreach sources
            let tableHtml = `
                <div class="card mb-4 border-success">
                    <div class="card-header bg-success text-white">
                        <h5 class="mb-0">🎵 Instrument Popularity Dashboard</h5>
                    </div>
                    <div class="card-body">
                        <div class="row mb-3">
                            <div class="col-12 text-center">
                                <h4 class="text-success">Total Booked Lessons: ${totalCount}</h4>
                                <h5 class="text-primary">Total Revenue: $${totalRevenue.toFixed(2)}</h5>
                            </div>
                        </div>
                        <div class="table-responsive">
                            <table class="table table-striped table-hover">
                                <thead class="table-dark">
                                    <tr>
                                        <th>Instrument</th>
                                        <th>Booked Lessons</th>
                                        <th>Revenue</th>
                                        <th>Popularity %</th>
                                        <th>Visual</th>
                                    </tr>
                                </thead>
                                <tbody>
            `;
            
            sortedData.forEach((item, index) => {
                const percentage = ((item.BookedLessons / totalCount) * 100).toFixed(1);
                const barWidth = ((item.BookedLessons / maxCount) * 100).toFixed(1);
                const colors = ['bg-primary', 'bg-success', 'bg-info', 'bg-warning', 'bg-danger'];
                const color = colors[index % colors.length];
                
                tableHtml += `
                    <tr>
                        <td><strong>${item.Instrument}</strong></td>
                        <td><span class="badge ${color} fs-6">${item.BookedLessons}</span></td>
                        <td><span class="badge bg-success">$${item.Revenue.toFixed(2)}</span></td>
                        <td><span class="badge bg-secondary">${percentage}%</span></td>
                        <td>
                            <div class="progress" style="height: 25px;">
                                <div class="progress-bar ${color}" role="progressbar" 
                                     style="width: ${barWidth}%" 
                                     aria-valuenow="${item.BookedLessons}" 
                                     aria-valuemin="0" 
                                     aria-valuemax="${maxCount}">
                                    ${item.BookedLessons}
                                </div>
                            </div>
                        </td>
                    </tr>
                `;
            });
            
            tableHtml += `
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            `;

            contentDiv.innerHTML = tableHtml;
        } catch (error) {
            document.getElementById('adminContent').innerHTML = `<div class="alert alert-danger">Error: ${error.message}</div>`;
        }
    }

    async showLessonSchedule() {
        try {
            const contentDiv = document.getElementById('adminContent');
            contentDiv.innerHTML = '<div class="text-center"><div class="spinner-border" role="status"><span class="visually-hidden">Loading...</span></div></div>';
            
            const lessons = await this.getLessonSchedule();
            
            if (lessons.length === 0) {
                contentDiv.innerHTML = '<div class="alert alert-info">No lessons scheduled</div>';
                return;
            }

            let tableHtml = `
                <div class="card border-info">
                    <div class="card-header bg-info text-white d-flex justify-content-between align-items-center">
                        <h5 class="mb-0">📅 Booked Lessons Schedule</h5>
                        <button class="btn btn-outline-light btn-sm" onclick="app.showLessonCalendar()">
                            <i class="fas fa-calendar"></i> Calendar View
                        </button>
                    </div>
                    <div class="card-body">
                        <div class="table-responsive">
                            <table class="table table-striped table-hover">
                                <thead class="table-dark">
                                    <tr>
                                        <th>Date/Time</th>
                                        <th>Teacher</th>
                                        <th>Student</th>
                                        <th>Instrument</th>
                                        <th>Type</th>
                                        <th>Price</th>
                                    </tr>
                                </thead>
                                <tbody>
            `;
            
            lessons.forEach(lesson => {
                // Determine lesson type display
                let lessonTypeDisplay = 'In-Person';
                let lessonTypeBadge = '<span class="badge bg-success">In-Person</span>';
                
                if (lesson.StudentLessonType) {
                    lessonTypeDisplay = lesson.StudentLessonType;
                    lessonTypeBadge = lesson.StudentLessonType === 'Virtual' 
                        ? '<span class="badge bg-info">Virtual</span>' 
                        : '<span class="badge bg-success">In-Person</span>';
                } else if (lesson.LessonType) {
                    lessonTypeDisplay = lesson.LessonType;
                    lessonTypeBadge = lesson.LessonType === 'Virtual' 
                        ? '<span class="badge bg-info">Virtual</span>' 
                        : lesson.LessonType === 'Student Preference'
                        ? '<span class="badge bg-warning">Student Preference</span>'
                        : '<span class="badge bg-success">In-Person</span>';
                }
                
                // Parse time slot safely
                let dateTime = 'Not provided';
                try {
                    if (lesson.TimeSlot && lesson.TimeSlot.includes(' - ')) {
                        const [start, end] = lesson.TimeSlot.split(' - ');
                        const startDate = new Date(start);
                        const endDate = new Date(end);
                        dateTime = `${startDate.toLocaleString()} - ${endDate.toLocaleTimeString()}`;
                    } else if (lesson.TimeSlot) {
                        const startDate = new Date(lesson.TimeSlot);
                        dateTime = startDate.toLocaleString();
                    }
                } catch (error) {
                    console.warn('Error parsing lesson time slot:', error);
                }
                
                tableHtml += `
                    <tr>
                        <td><small>${dateTime}</small></td>
                        <td>${lesson.TeacherName || 'Unknown Teacher'}</td>
                        <td>${lesson.StudentName || 'Unknown Student'}</td>
                        <td><span class="badge bg-secondary">${lesson.Instrument}</span></td>
                        <td>${lessonTypeBadge}</td>
                        <td><strong>$${lesson.Price ? lesson.Price.toFixed(2) : '0.00'}</strong></td>
                    </tr>
                `;
            });
            
            tableHtml += `
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            `;

            contentDiv.innerHTML = tableHtml;
        } catch (error) {
            document.getElementById('adminContent').innerHTML = `<div class="alert alert-danger">Error: ${error.message}</div>`;
        }
    }

    async showUserStats() {
        try {
            const contentDiv = document.getElementById('adminContent');
            contentDiv.innerHTML = '<div class="text-center"><div class="spinner-border" role="status"><span class="visually-hidden">Loading...</span></div></div>';
            
            const stats = await this.getUserStats();
            
            // Get second lesson tracking data
            const secondLessonData = await this.getSecondLessonTracking();
            
            const totalUsers = stats.StudentCount + stats.TeacherCount + stats.AdminCount;
            
            contentDiv.innerHTML = `
                <div class="card mb-4 border-warning">
                    <div class="card-header bg-warning text-dark">
                        <h5 class="mb-0">👥 User Statistics Summary</h5>
                    </div>
                    <div class="card-body">
                        <div class="row">
                            <div class="col-md-3 mb-3">
                                <div class="card text-center border-primary h-100">
                                    <div class="card-body">
                                        <div class="display-4 text-primary mb-2">${totalUsers}</div>
                                        <h5 class="text-primary">👥 Total Users</h5>
                                        <p class="text-muted mb-0">All registered members</p>
                                    </div>
                                </div>
                            </div>
                            <div class="col-md-3 mb-3">
                                <div class="card text-center border-success h-100">
                                    <div class="card-body">
                                        <div class="display-4 text-success mb-2">${stats.TeacherCount}</div>
                                        <h5 class="text-success">👨‍🏫 Teachers</h5>
                                        <p class="text-muted mb-0">Active instructors</p>
                                    </div>
                                </div>
                            </div>
                            <div class="col-md-3 mb-3">
                                <div class="card text-center border-info h-100">
                                    <div class="card-body">
                                        <div class="display-4 text-info mb-2">${stats.StudentCount}</div>
                                        <h5 class="text-info">🎓 Students</h5>
                                        <p class="text-muted mb-0">Active learners</p>
                                    </div>
                                </div>
                            </div>
                            <div class="col-md-3 mb-3">
                                <div class="card text-center border-warning h-100">
                                    <div class="card-body">
                                        <div class="display-4 text-warning mb-2">${stats.AdminCount}</div>
                                        <h5 class="text-warning">👨‍💼 Admins</h5>
                                        <p class="text-muted mb-0">System administrators</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="card border-info">
                    <div class="card-header bg-info text-white">
                        <h5 class="mb-0">📈 Second Lesson Tracking</h5>
                    </div>
                    <div class="card-body">
                        <div class="row">
                            <div class="col-md-6">
                                <div class="mb-3">
                                    <h6>Students with Completed First Lesson</h6>
                                    <div class="display-6 text-primary">${secondLessonData.StudentsWithCompletedFirstLesson}</div>
                                    <small class="text-muted">Students who have completed at least one lesson</small>
                                </div>
                            </div>
                            <div class="col-md-6">
                                <div class="mb-3">
                                    <h6>Students with Second Lesson</h6>
                                    <div class="display-6 text-success">${secondLessonData.StudentsWithSecondLesson}</div>
                                    <small class="text-muted">Students who booked a second lesson</small>
                                </div>
                            </div>
                        </div>
                        <div class="row">
                            <div class="col-12">
                                <div class="mb-3">
                                    <h6>Second Lesson Conversion Rate</h6>
                                    <div class="progress" style="height: 40px;">
                                        <div class="progress-bar bg-success progress-bar-striped progress-bar-animated" 
                                             role="progressbar" 
                                             style="width: ${secondLessonData.Percentage}%" 
                                             aria-valuenow="${secondLessonData.Percentage}" 
                                             aria-valuemin="0" 
                                             aria-valuemax="100">
                                            ${secondLessonData.Percentage}%
                                        </div>
                                    </div>
                                    <small class="text-muted">Percentage of students who booked a second lesson after completing their first</small>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        } catch (error) {
            document.getElementById('adminContent').innerHTML = `<div class="alert alert-danger">Error: ${error.message}</div>`;
        }
    }

    async showLessonCalendar() {
        try {
            const contentDiv = document.getElementById('adminContent');
            contentDiv.innerHTML = '<div class="text-center"><div class="spinner-border" role="status"><span class="visually-hidden">Loading...</span></div></div>';
            
            const lessons = await this.getLessonSchedule();
            
            if (lessons.length === 0) {
                contentDiv.innerHTML = '<div class="alert alert-info">No lessons scheduled</div>';
                return;
            }

            // Group lessons by date
            const lessonsByDate = {};
            lessons.forEach(lesson => {
                try {
                    let lessonDate;
                    if (lesson.TimeSlot && lesson.TimeSlot.includes(' - ')) {
                        const [start] = lesson.TimeSlot.split(' - ');
                        lessonDate = new Date(start);
                    } else if (lesson.TimeSlot) {
                        lessonDate = new Date(lesson.TimeSlot);
                    } else {
                        return; // Skip lessons without valid time slot
                    }
                    
                    if (isNaN(lessonDate.getTime())) return;
                    
                    const dateKey = lessonDate.toDateString();
                    if (!lessonsByDate[dateKey]) {
                        lessonsByDate[dateKey] = [];
                    }
                    lessonsByDate[dateKey].push({
                        ...lesson,
                        parsedDate: lessonDate
                    });
                } catch (error) {
                    console.warn('Error parsing lesson date:', error);
                }
            });

            // Sort dates
            const sortedDates = Object.keys(lessonsByDate).sort((a, b) => new Date(a) - new Date(b));

            let calendarHtml = `
                <div class="card border-info">
                    <div class="card-header bg-info text-white d-flex justify-content-between align-items-center">
                        <h5 class="mb-0">📅 Booked Lessons Calendar View</h5>
                        <button class="btn btn-outline-light btn-sm" onclick="app.showLessonSchedule()">
                            <i class="fas fa-table"></i> Table View
                        </button>
                    </div>
                    <div class="card-body">
                        <div class="row">
            `;

            sortedDates.forEach(dateKey => {
                const dateLessons = lessonsByDate[dateKey];
                const date = new Date(dateKey);
                const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
                const monthDay = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                const year = date.getFullYear();

                calendarHtml += `
                    <div class="col-md-6 col-lg-4 mb-4">
                        <div class="card border-primary h-100">
                            <div class="card-header bg-primary text-white">
                                <h6 class="mb-0">${dayName}, ${monthDay} ${year}</h6>
                                <small>${dateLessons.length} lesson${dateLessons.length !== 1 ? 's' : ''}</small>
                            </div>
                            <div class="card-body p-2">
                `;

                // Sort lessons by time
                dateLessons.sort((a, b) => a.parsedDate - b.parsedDate);

                dateLessons.forEach(lesson => {
                    let timeDisplay = 'Time TBD';
                    try {
                        if (lesson.TimeSlot && lesson.TimeSlot.includes(' - ')) {
                            const [start, end] = lesson.TimeSlot.split(' - ');
                            const startTime = new Date(start);
                            const endTime = new Date(end);
                            timeDisplay = `${startTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })} - ${endTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
                        } else if (lesson.TimeSlot) {
                            const startTime = new Date(lesson.TimeSlot);
                            timeDisplay = startTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
                        }
                    } catch (error) {
                        console.warn('Error parsing lesson time:', error);
                    }

                    // Determine lesson type badge
                    let lessonTypeBadge = '<span class="badge bg-success">In-Person</span>';
                    if (lesson.StudentLessonType) {
                        lessonTypeBadge = lesson.StudentLessonType === 'Virtual' 
                            ? '<span class="badge bg-info">Virtual</span>' 
                            : '<span class="badge bg-success">In-Person</span>';
                    } else if (lesson.LessonType) {
                        lessonTypeBadge = lesson.LessonType === 'Virtual' 
                            ? '<span class="badge bg-info">Virtual</span>' 
                            : lesson.LessonType === 'Student Preference'
                            ? '<span class="badge bg-warning">Student Preference</span>'
                            : '<span class="badge bg-success">In-Person</span>';
                    }

                    calendarHtml += `
                        <div class="card mb-2 border-light">
                            <div class="card-body p-2">
                                <div class="d-flex justify-content-between align-items-start mb-1">
                                    <small class="text-muted fw-bold">${timeDisplay}</small>
                                    <span class="badge bg-primary">$${lesson.Price ? lesson.Price.toFixed(2) : '0.00'}</span>
                                </div>
                                <div class="mb-1">
                                    <strong>${lesson.TeacherName || 'Unknown Teacher'}</strong> → <strong>${lesson.StudentName || 'Unknown Student'}</strong>
                                </div>
                                <div class="d-flex justify-content-between align-items-center">
                                    <span class="badge bg-secondary">${lesson.Instrument}</span>
                                    ${lessonTypeBadge}
                                </div>
                            </div>
                        </div>
                    `;
                });

                calendarHtml += `
                            </div>
                        </div>
                    </div>
                `;
            });

            calendarHtml += `
                        </div>
                    </div>
                </div>
            `;

            contentDiv.innerHTML = calendarHtml;
        } catch (error) {
            document.getElementById('adminContent').innerHTML = `<div class="alert alert-danger">Error: ${error.message}</div>`;
        }
    }

    async showOutreachSources() {
        try {
            const contentDiv = document.getElementById('adminContent');
            contentDiv.innerHTML = '<div class="text-center"><div class="spinner-border" role="status"><span class="visually-hidden">Loading...</span></div></div>';
            
            const data = await this.getOutreachSources();
            
            if (data.length === 0) {
                contentDiv.innerHTML = '<div class="alert alert-info">No outreach data available</div>';
                return;
            }

            // Group data by source and aggregate counts by role
            const groupedData = {};
            data.forEach(item => {
                if (!groupedData[item.Source]) {
                    groupedData[item.Source] = {
                        Source: item.Source,
                        TotalCount: 0,
                        Roles: {
                            student: 0,
                            teacher: 0,
                            admin: 0
                        }
                    };
                }
                groupedData[item.Source].TotalCount += item.Count;
                groupedData[item.Source].Roles[item.Role] = item.Count;
            });

            // Convert to array and sort by total count
            const sortedData = Object.values(groupedData).sort((a, b) => b.TotalCount - a.TotalCount);
            const totalCount = sortedData.reduce((sum, item) => sum + item.TotalCount, 0);
            const maxCount = sortedData[0].TotalCount;

            // Build outreach sources table
            let tableHtml = `
                <div class="card mb-4 border-danger">
                    <div class="card-header bg-danger text-white">
                        <h5 class="mb-0">📢 User Outreach Sources Breakdown</h5>
                    </div>
                    <div class="card-body">
                        <div class="row mb-3">
                            <div class="col-12 text-center">
                                <h4 class="text-danger">Total Users: ${totalCount}</h4>
                            </div>
                        </div>
                        <div class="table-responsive">
                            <table class="table table-striped table-hover">
                                <thead class="table-dark">
                                    <tr>
                                        <th>Outreach Source</th>
                                        <th>Total Users</th>
                                        <th>Percentage</th>
                                        <th>Visual</th>
                                    </tr>
                                </thead>
                                <tbody>
            `;
            
            const colors = ['bg-danger', 'bg-warning', 'bg-info', 'bg-success', 'bg-primary', 'bg-secondary'];
            
            sortedData.forEach((item, index) => {
                const percentage = ((item.TotalCount / totalCount) * 100).toFixed(1);
                const barWidth = ((item.TotalCount / maxCount) * 100).toFixed(1);
                const color = colors[index % colors.length];
                
                tableHtml += `
                    <tr>
                        <td><strong>${item.Source}</strong></td>
                        <td><span class="badge ${color} fs-6">${item.TotalCount}</span></td>
                        <td><span class="badge bg-secondary">${percentage}%</span></td>
                        <td>
                            <div class="progress" style="height: 25px;">
                                <div class="progress-bar ${color}" role="progressbar" 
                                     style="width: ${barWidth}%" 
                                     aria-valuenow="${item.TotalCount}" 
                                     aria-valuemin="0" 
                                     aria-valuemax="${maxCount}">
                                    ${item.TotalCount}
                                </div>
                            </div>
                        </td>
                    </tr>
                `;
            });
            
            tableHtml += `
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            `;

            // Add insights section
            let insightsHtml = `
                <div class="card border-info">
                    <div class="card-header bg-info text-white">
                        <h5 class="mb-0">💡 Outreach Insights & Recommendations</h5>
                    </div>
                    <div class="card-body">
            `;
            
            const topSource = sortedData[0];
            const topPercentage = ((topSource.TotalCount / totalCount) * 100).toFixed(1);
            
            insightsHtml += `
                        <div class="alert alert-success">
                            <h6>🎯 Top Performing Channel</h6>
                            <p class="mb-0"><strong>${topSource.Source}</strong> accounts for <strong>${topPercentage}%</strong> of all user registrations. Consider increasing investment in this channel.</p>
                        </div>
            `;
            
            if (sortedData.length > 1) {
                insightsHtml += `
                        <div class="alert alert-warning">
                            <h6>⚡ Growth Opportunities</h6>
                            <p class="mb-0">Consider expanding reach through multiple channels to diversify user acquisition sources.</p>
                        </div>
                `;
            }
            
            insightsHtml += `
                    </div>
                </div>
            `;

            contentDiv.innerHTML = tableHtml + insightsHtml;
        } catch (error) {
            document.getElementById('adminContent').innerHTML = `<div class="alert alert-danger">Error: ${error.message}</div>`;
        }
    }

    showEditUserForm() {
        const contentDiv = document.getElementById('adminContent');
        contentDiv.innerHTML = `
            <div class="card shadow">
                <div class="card-header bg-secondary text-white">
                    <h5 class="mb-0">Edit User Profile</h5>
                </div>
                <div class="card-body">
                    <form id="editUserForm">
                        <div class="mb-3">
                            <label class="form-label">User Role *</label>
                            <select class="form-control" id="editUserRole" required>
                                <option value="">Select role...</option>
                                <option value="student">Student</option>
                                <option value="teacher">Teacher</option>
                                <option value="user">User/Admin</option>
                            </select>
                            <small class="form-text text-muted">Select the user type to edit</small>
                        </div>
                        <div class="mb-3">
                            <label class="form-label">User ID *</label>
                            <input type="number" class="form-control" id="editUserId" required min="1" placeholder="Enter User ID">
                            <small class="form-text text-muted">ID of the user to update</small>
                        </div>
                        <div class="mb-3">
                            <label class="form-label">Name</label>
                            <input type="text" class="form-control" id="editUserName" placeholder="e.g., John Smith">
                            <small class="form-text text-muted">Full name (for student/teacher)</small>
                        </div>
                        <div class="mb-3">
                            <label class="form-label">Email *</label>
                            <input type="email" class="form-control" id="editUserEmail" required placeholder="user@example.com">
                            <small class="form-text text-muted">Valid email address</small>
                        </div>
                        <div class="mb-3" id="editUserRoleField" style="display: none;">
                            <label class="form-label">New Role *</label>
                            <select class="form-control" id="editUserNewRole">
                                <option value="">Select role...</option>
                                <option value="admin">Admin</option>
                                <option value="teacher">Teacher</option>
                                <option value="student">Student</option>
                            </select>
                            <small class="form-text text-muted">Update user role (for admin/user only)</small>
                        </div>
                        <button type="submit" class="btn btn-secondary w-100" id="updateUserBtn">Update User</button>
                    </form>
                </div>
            </div>
        `;

        // Show/hide role field based on selected role
        document.getElementById('editUserRole').addEventListener('change', function() {
            const roleField = document.getElementById('editUserRoleField');
            if (this.value === 'user' || this.value === 'admin') {
                roleField.style.display = 'block';
                document.getElementById('editUserNewRole').setAttribute('required', 'required');
                document.getElementById('editUserName').removeAttribute('required');
            } else {
                roleField.style.display = 'none';
                document.getElementById('editUserNewRole').removeAttribute('required');
                document.getElementById('editUserName').setAttribute('required', 'required');
            }
        });

        document.getElementById('editUserForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const role = document.getElementById('editUserRole').value;
            const userId = parseInt(document.getElementById('editUserId').value);
            const name = document.getElementById('editUserName').value.trim();
            const email = document.getElementById('editUserEmail').value.trim();
            const newRole = document.getElementById('editUserNewRole').value;
            
            // Validation
            if (!email || !email.includes('@')) {
                this.showBootstrapAlert('warning', 'Please enter a valid email address');
                return;
            }
            
            if ((role === 'student' || role === 'teacher') && (!name || name.length < 2)) {
                this.showBootstrapAlert('warning', 'Please enter a valid name (at least 2 characters)');
                return;
            }
            
            if ((role === 'user' || role === 'admin') && !newRole) {
                this.showBootstrapAlert('warning', 'Please select a new role');
                return;
            }
            
            const submitBtn = document.getElementById('updateUserBtn');
            const originalBtnText = submitBtn.innerHTML;
            
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Updating...';
            this.showLoadingOverlay();
            
            const data = {
                Role: role,
                StudentId: role === 'student' ? userId : 0,
                TeacherId: role === 'teacher' ? userId : 0,
                UserId: (role === 'user' || role === 'admin') ? userId : 0,
                Name: name,
                Email: email,
                NewRole: newRole
            };
            
            try {
                const result = await this.updateUserProfile(data);
                this.hideLoadingOverlay();
                this.showBootstrapAlert('success', 'User profile updated successfully!');
                
                // Show updated info
                setTimeout(() => {
                    contentDiv.innerHTML = `
                        <div class="alert alert-success">
                            <h5>✓ Profile Updated</h5>
                            <p class="mb-0">Role: ${role}<br>ID: ${userId}<br>Name: ${name || 'N/A'}<br>Email: ${email}${newRole ? '<br>New Role: ' + newRole : ''}</p>
                        </div>
                    `;
                }, 1000);
            } catch (error) {
                this.hideLoadingOverlay();
                this.showBootstrapAlert('danger', `Error: ${error.message}`);
            } finally {
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalBtnText;
            }
        });
    }

    // ==================== Teacher Views ====================

    showCreateTeacherForm() {
        const contentDiv = document.getElementById('teacherContent');
        
        // Generate 30-minute time slots for the next 7 days
        const generateTimeSlots = () => {
            const slots = [];
            const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
            const startHour = 9;
            const endHour = 17;
            
            for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
                const date = new Date();
                date.setDate(date.getDate() + dayOffset);
                const dayName = days[date.getDay()];
                
                for (let hour = startHour; hour < endHour; hour++) {
                    const timeSlot30 = `${date.toISOString().split('T')[0]} ${String(hour).padStart(2, '0')}:00`;
                    const timeSlot60 = `${date.toISOString().split('T')[0]} ${String(hour + 1).padStart(2, '0')}:00`;
                    slots.push({
                        date: timeSlot30.split(' ')[0],
                        time: `${String(hour).padStart(2, '0')}:00`,
                        datetime: timeSlot30,
                        label: `${dayName} ${String(hour).padStart(2, '0')}:00`
                    });
                }
            }
            return slots;
        };
        
        const timeSlots = generateTimeSlots();
        
        contentDiv.innerHTML = `
            <div class="row">
                <div class="col-md-5">
                    <div class="card shadow mb-3">
                        <div class="card-header bg-success text-white">
                            <h5 class="mb-0">Create Teacher Profile</h5>
                        </div>
                        <div class="card-body">
                            <form id="createTeacherForm">
                                <div class="mb-3">
                                    <label class="form-label">Name *</label>
                                    <input type="text" class="form-control" id="teacherName" required placeholder="e.g., John Smith">
                                    <small class="form-text text-muted">Full name of the teacher</small>
                                </div>
                                <div class="mb-3">
                                    <label class="form-label">Email *</label>
                                    <input type="email" class="form-control" id="teacherEmail" required placeholder="teacher@example.com">
                                    <small class="form-text text-muted">Valid email address</small>
                                </div>
                                <div class="mb-3">
                                    <label class="form-label">Instrument *</label>
                                    <select class="form-control" id="teacherInstrument" required>
                                        <option value="">Select instrument...</option>
                                        <option value="Guitar">Guitar</option>
                                        <option value="Piano">Piano</option>
                                        <option value="Violin">Violin</option>
                                        <option value="Drums">Drums</option>
                                        <option value="Saxophone">Saxophone</option>
                                        <option value="Trumpet">Trumpet</option>
                                    </select>
                                    <small class="form-text text-muted">Primary instrument taught</small>
                                </div>
                                <div class="mb-3">
                                    <label class="form-label">Hourly Rate ($) *</label>
                                    <input type="number" class="form-control" id="teacherHourlyRate" required min="20" max="200" step="0.01" placeholder="50.00">
                                    <small class="form-text text-muted">Rate between $20-$200 per hour</small>
                                </div>
                                <button type="submit" class="btn btn-success w-100">Create Teacher</button>
                            </form>
                        </div>
                    </div>
                    <div id="availabilitySection" class="card shadow" style="display: none;">
                        <div class="card-header bg-info text-white">
                            <h5 class="mb-0">Set Your Availability</h5>
                        </div>
                        <div class="card-body">
                            <div class="mb-3">
                                <label class="form-label">Selected Time Slots:</label>
                                <div id="selectedSlots" class="border p-2 rounded" style="min-height: 100px; max-height: 200px; overflow-y: auto;">
                                    <p class="text-muted mb-0">No slots selected</p>
                                </div>
                            </div>
                            <button type="button" class="btn btn-info w-100" id="saveAvailabilityBtn">Save Availability</button>
                        </div>
                    </div>
                </div>
                <div class="col-md-7">
                    <div class="card shadow">
                        <div class="card-header bg-primary text-white">
                            <h5 class="mb-0">Select Available Time Slots (30-min intervals)</h5>
                        </div>
                        <div class="card-body" style="max-height: 600px; overflow-y: auto;">
                            <div id="timeSlotGrid" class="row g-2">
                                ${timeSlots.map(slot => `
                                    <div class="col-6 col-md-3">
                                        <div class="form-check border rounded p-2 time-slot-item" data-slot="${slot.datetime}">
                                            <input class="form-check-input" type="checkbox" id="slot-${slot.datetime.replace(/[\s:]/g, '-')}" data-slot="${slot.datetime}">
                                            <label class="form-check-label small" for="slot-${slot.datetime.replace(/[\s:]/g, '-')}">
                                                ${slot.label}
                                            </label>
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Store selected slots
        let selectedSlots = [];
        let teacherId = null;
        
        // Helper function to update selected slots display
        const updateSelectedSlots = () => {
            const selectedDiv = document.getElementById('selectedSlots');
            if (selectedSlots.length === 0) {
                selectedDiv.innerHTML = '<p class="text-muted mb-0">No slots selected</p>';
            } else {
                selectedDiv.innerHTML = selectedSlots.map((slot, idx) => 
                    `<span class="badge bg-info me-1 mb-1">${slot.label}</span>`
                ).join('');
            }
        };

        // Handle checkbox changes for time slots
        setTimeout(() => {
            document.querySelectorAll('.time-slot-item input[type="checkbox"]').forEach(checkbox => {
                checkbox.addEventListener('change', function() {
                    const slot = this.dataset.slot;
                    const label = this.closest('.time-slot-item').querySelector('label').textContent;
                    
                    if (this.checked) {
                        selectedSlots.push({ slot, label });
                    } else {
                        selectedSlots = selectedSlots.filter(s => s.slot !== slot);
                    }
                    updateSelectedSlots();
                });
            });
        }, 100);

        // Handle save availability button
        setTimeout(() => {
            document.getElementById('saveAvailabilityBtn').addEventListener('click', async function() {
                if (!teacherId) {
                    app.showBootstrapAlert('warning', 'Please create a teacher profile first');
                    return;
                }
                
                if (selectedSlots.length === 0) {
                    app.showBootstrapAlert('warning', 'Please select at least one time slot');
                    return;
                }

                const btn = this;
                const originalText = btn.innerHTML;
                btn.disabled = true;
                btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Saving...';
                app.showLoadingOverlay();

                try {
                    const instrument = document.getElementById('teacherInstrument').value;
                    const hourlyRate = parseFloat(document.getElementById('teacherHourlyRate').value);
                    
                    const data = {
                        TeacherId: teacherId,
                        Instrument: instrument,
                        TimeSlots: selectedSlots.map(s => s.slot),
                        Price: hourlyRate
                    };
                    
                    const result = await app.setAvailability(data);
                    app.hideLoadingOverlay();
                    
                    if (result.success) {
                        app.showBootstrapAlert('success', result.message || `${selectedSlots.length} availability slots added successfully`);
                        // Reset form
                        selectedSlots = [];
                        updateSelectedSlots();
                        // Uncheck all checkboxes
                        document.querySelectorAll('.time-slot-item input[type="checkbox"]').forEach(cb => cb.checked = false);
                    } else {
                        app.showBootstrapAlert('danger', result.error || 'Failed to save availability');
                    }
                } catch (error) {
                    app.hideLoadingOverlay();
                    app.showBootstrapAlert('danger', `Error: ${error.message}`);
                } finally {
                    btn.disabled = false;
                    btn.innerHTML = originalText;
                }
            });
        }, 100);
        
        document.getElementById('createTeacherForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            // Client-side validation
            const name = document.getElementById('teacherName').value.trim();
            const email = document.getElementById('teacherEmail').value.trim();
            const instrument = document.getElementById('teacherInstrument').value;
            const hourlyRate = parseFloat(document.getElementById('teacherHourlyRate').value);
            
            // Validation checks
            if (!name || name.length < 2) {
                this.showBootstrapAlert('warning', 'Please enter a valid name (at least 2 characters)');
                return;
            }
            
            if (!email || !email.includes('@')) {
                this.showBootstrapAlert('warning', 'Please enter a valid email address');
                return;
            }
            
            if (!instrument) {
                this.showBootstrapAlert('warning', 'Please select an instrument');
                return;
            }
            
            if (!hourlyRate || hourlyRate < 20 || hourlyRate > 200) {
                this.showBootstrapAlert('warning', 'Hourly rate must be between $20 and $200');
                return;
            }
            
            const submitBtn = e.target.querySelector('button[type="submit"]');
            const originalBtnText = submitBtn.innerHTML;
            
            // Disable button and show loading
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Creating...';
            this.showLoadingOverlay();
            
            const data = {
                Name: name,
                Email: email,
                Instrument: instrument,
                HourlyRate: hourlyRate,
                Availability: "Flexible"
            };
            
            try {
                const result = await this.createTeacher(data);
                
                // Extract teacher ID from the result (we need to fetch it)
                // For now, we'll use a workaround - fetch the last created teacher
                const teachersResponse = await fetch('http://localhost:5000/api/admin/user-stats');
                const stats = await teachersResponse.json();
                
                // This is a workaround - in production, the API should return the created ID
                teacherId = stats.data.totalTeachers; // Approximation
                
                this.hideLoadingOverlay();
                this.showBootstrapAlert('success', 'Teacher profile created! Now select your availability.');
                
                // Show availability section
                document.getElementById('availabilitySection').style.display = 'block';
                e.target.querySelector('button[type="submit"]').disabled = true;
            } catch (error) {
                this.hideLoadingOverlay();
                this.showBootstrapAlert('danger', `Error: ${error.message}`);
            } finally {
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalBtnText;
            }
        });
    }

    async showEditTeacherProfile() {
        const contentDiv = document.getElementById('teacherContent');
        
        // Show initial ID input form
        contentDiv.innerHTML = `
            <div class="card shadow">
                <div class="card-header bg-success text-white">
                    <h5 class="mb-0">Edit Teacher Profile</h5>
                </div>
                <div class="card-body">
                    <form id="loadTeacherForm">
                        <div class="alert alert-info">
                            <i class="bi bi-info-circle"></i> Enter your Teacher ID to load and edit your profile information.
                        </div>
                        <div class="mb-3">
                            <label class="form-label">Teacher ID *</label>
                            <input type="number" class="form-control" id="loadTeacherId" required min="1" placeholder="Enter your Teacher ID">
                            <small class="form-text text-muted">Your teacher identification number</small>
                        </div>
                        <button type="submit" class="btn btn-success w-100">Load Profile</button>
                    </form>
                </div>
            </div>
        `;

        document.getElementById('loadTeacherForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const teacherId = parseInt(document.getElementById('loadTeacherId').value);
            
            try {
                this.showLoadingOverlay();
                
                // Fetch teacher data
                const response = await fetch(`http://localhost:5000/api/teacher/${teacherId}`);
                const result = await response.json();
                
                this.hideLoadingOverlay();
                
                if (!result.success) {
                    this.showBootstrapAlert('danger', result.error || 'Failed to load teacher profile');
                    return;
                }
                
                const teacher = result.data;
                
                // Show edit form with pre-filled data
                contentDiv.innerHTML = `
                    <div class="card shadow">
                        <div class="card-header bg-success text-white">
                            <h5 class="mb-0">Edit Teacher Profile</h5>
                        </div>
                        <div class="card-body">
                            <form id="editTeacherForm">
                                <input type="hidden" id="editTeacherId" value="${teacher.Id}">
                                <div class="mb-3">
                                    <label class="form-label">Name *</label>
                                    <input type="text" class="form-control" id="editTeacherName" required value="${teacher.Name}">
                                    <small class="form-text text-muted">Full name of the teacher</small>
                                </div>
                                <div class="mb-3">
                                    <label class="form-label">Email *</label>
                                    <input type="email" class="form-control" id="editTeacherEmail" required value="${teacher.Email}">
                                    <small class="form-text text-muted">Valid email address</small>
                                </div>
                                <div class="mb-3">
                                    <label class="form-label">Instrument *</label>
                                    <select class="form-control" id="editTeacherInstrument" required>
                                        <option value="">Select instrument...</option>
                                        <option value="Guitar" ${teacher.Instrument === 'Guitar' ? 'selected' : ''}>Guitar</option>
                                        <option value="Piano" ${teacher.Instrument === 'Piano' ? 'selected' : ''}>Piano</option>
                                        <option value="Violin" ${teacher.Instrument === 'Violin' ? 'selected' : ''}>Violin</option>
                                        <option value="Drums" ${teacher.Instrument === 'Drums' ? 'selected' : ''}>Drums</option>
                                        <option value="Saxophone" ${teacher.Instrument === 'Saxophone' ? 'selected' : ''}>Saxophone</option>
                                        <option value="Trumpet" ${teacher.Instrument === 'Trumpet' ? 'selected' : ''}>Trumpet</option>
                                    </select>
                                    <small class="form-text text-muted">Primary instrument taught</small>
                                </div>
                                <div class="mb-3">
                                    <label class="form-label">Hourly Rate ($) *</label>
                                    <input type="number" class="form-control" id="editTeacherHourlyRate" required min="20" max="200" step="0.01" value="${teacher.HourlyRate}">
                                    <small class="form-text text-muted">Rate between $20-$200 per hour</small>
                                </div>
                                <div class="mb-3">
                                    <label class="form-label">Availability</label>
                                    <textarea class="form-control" id="editTeacherAvailability" rows="3">${teacher.Availability || ''}</textarea>
                                    <small class="form-text text-muted">General availability description (optional)</small>
                                </div>
                                <button type="submit" class="btn btn-success w-100" id="updateTeacherBtn">Update Profile</button>
                            </form>
                        </div>
                    </div>
                `;
                
                this.attachTeacherEditFormListeners(teacher.Id);
            } catch (error) {
                this.hideLoadingOverlay();
                this.showBootstrapAlert('danger', `Error: ${error.message}`);
            }
        });
    }
    
    attachTeacherEditFormListeners(teacherId) {
        const contentDiv = document.getElementById('teacherContent');

        document.getElementById('editTeacherForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const name = document.getElementById('editTeacherName').value.trim();
            const email = document.getElementById('editTeacherEmail').value.trim();
            const instrument = document.getElementById('editTeacherInstrument').value;
            const hourlyRate = parseFloat(document.getElementById('editTeacherHourlyRate').value);
            const availability = document.getElementById('editTeacherAvailability').value.trim();
            
            // Validation
            if (!name || name.length < 2) {
                this.showBootstrapAlert('warning', 'Please enter a valid name (at least 2 characters)');
                return;
            }
            
            if (!email || !email.includes('@')) {
                this.showBootstrapAlert('warning', 'Please enter a valid email address');
                return;
            }
            
            if (!instrument) {
                this.showBootstrapAlert('warning', 'Please select an instrument');
                return;
            }
            
            if (!hourlyRate || hourlyRate < 20 || hourlyRate > 200) {
                this.showBootstrapAlert('warning', 'Hourly rate must be between $20 and $200');
                return;
            }
            
            const submitBtn = document.getElementById('updateTeacherBtn');
            const originalBtnText = submitBtn.innerHTML;
            
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Updating...';
            this.showLoadingOverlay();
            
            const data = {
                TeacherId: teacherId,
                Name: name,
                Email: email,
                Instrument: instrument,
                HourlyRate: hourlyRate,
                Availability: availability || ""
            };
            
            try {
                const result = await this.updateTeacherProfile(data);
                this.hideLoadingOverlay();
                this.showBootstrapAlert('success', 'Teacher profile updated successfully!');
                
                // Re-render the profile view with updated data
                setTimeout(() => {
                    this.showUnifiedProfile('teacher');
                }, 1000);
            } catch (error) {
                this.hideLoadingOverlay();
                this.showBootstrapAlert('danger', `Error: ${error.message}`);
            } finally {
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalBtnText;
            }
        });
    }
    
    // Keep old implementation for backward compatibility
    showEditTeacherProfileOld() {
        const contentDiv = document.getElementById('teacherContent');
        contentDiv.innerHTML = `
            <div class="card shadow">
                <div class="card-header bg-success text-white">
                    <h5 class="mb-0">Edit Teacher Profile</h5>
                </div>
                <div class="card-body">
                    <form id="editTeacherFormOld">
                        <div class="mb-3">
                            <label class="form-label">Teacher ID *</label>
                            <input type="number" class="form-control" id="editTeacherIdOld" required min="1" placeholder="Enter your Teacher ID">
                            <small class="form-text text-muted">Your teacher identification number</small>
                        </div>
                        <div class="mb-3">
                            <label class="form-label">Name *</label>
                            <input type="text" class="form-control" id="editTeacherNameOld" required placeholder="e.g., John Smith">
                            <small class="form-text text-muted">Full name of the teacher</small>
                        </div>
                        <div class="mb-3">
                            <label class="form-label">Email *</label>
                            <input type="email" class="form-control" id="editTeacherEmailOld" required placeholder="teacher@example.com">
                            <small class="form-text text-muted">Valid email address</small>
                        </div>
                        <div class="mb-3">
                            <label class="form-label">Instrument *</label>
                            <select class="form-control" id="editTeacherInstrumentOld" required>
                                <option value="">Select instrument...</option>
                                <option value="Guitar">Guitar</option>
                                <option value="Piano">Piano</option>
                                <option value="Violin">Violin</option>
                                <option value="Drums">Drums</option>
                                <option value="Saxophone">Saxophone</option>
                                <option value="Trumpet">Trumpet</option>
                            </select>
                            <small class="form-text text-muted">Primary instrument taught</small>
                        </div>
                        <div class="mb-3">
                            <label class="form-label">Hourly Rate ($) *</label>
                            <input type="number" class="form-control" id="editTeacherHourlyRateOld" required min="20" max="200" step="0.01" placeholder="50.00">
                            <small class="form-text text-muted">Rate between $20-$200 per hour</small>
                        </div>
                        <div class="mb-3">
                            <label class="form-label">Availability</label>
                            <textarea class="form-control" id="editTeacherAvailabilityOld" rows="3" placeholder="e.g., Mon-Fri 9am-5pm"></textarea>
                            <small class="form-text text-muted">General availability description (optional)</small>
                        </div>
                        <button type="submit" class="btn btn-success w-100" id="updateTeacherBtnOld">Update Profile</button>
                    </form>
                </div>
            </div>
        `;

        document.getElementById('editTeacherForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const teacherId = parseInt(document.getElementById('editTeacherId').value);
            const name = document.getElementById('editTeacherName').value.trim();
            const email = document.getElementById('editTeacherEmail').value.trim();
            const instrument = document.getElementById('editTeacherInstrument').value;
            const hourlyRate = parseFloat(document.getElementById('editTeacherHourlyRate').value);
            const availability = document.getElementById('editTeacherAvailability').value.trim();
            
            // Validation
            if (!name || name.length < 2) {
                this.showBootstrapAlert('warning', 'Please enter a valid name (at least 2 characters)');
                return;
            }
            
            if (!email || !email.includes('@')) {
                this.showBootstrapAlert('warning', 'Please enter a valid email address');
                return;
            }
            
            if (!instrument) {
                this.showBootstrapAlert('warning', 'Please select an instrument');
                return;
            }
            
            if (!hourlyRate || hourlyRate < 20 || hourlyRate > 200) {
                this.showBootstrapAlert('warning', 'Hourly rate must be between $20 and $200');
                return;
            }
            
            const submitBtn = document.getElementById('updateTeacherBtn');
            const originalBtnText = submitBtn.innerHTML;
            
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Updating...';
            this.showLoadingOverlay();
            
            const data = {
                TeacherId: teacherId,
                Name: name,
                Email: email,
                Instrument: instrument,
                HourlyRate: hourlyRate,
                Availability: availability || ""
            };
            
            try {
                const result = await this.updateTeacherProfile(data);
                this.hideLoadingOverlay();
                this.showBootstrapAlert('success', 'Teacher profile updated successfully!');
                
                // Show updated info
                setTimeout(() => {
                    contentDiv.innerHTML = `
                        <div class="alert alert-success">
                            <h5>✓ Profile Updated</h5>
                            <p class="mb-0">Name: ${name}<br>Email: ${email}<br>Instrument: ${instrument}<br>Hourly Rate: $${hourlyRate.toFixed(2)}</p>
                        </div>
                    `;
                }, 1000);
            } catch (error) {
                this.hideLoadingOverlay();
                this.showBootstrapAlert('danger', `Error: ${error.message}`);
            } finally {
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalBtnText;
            }
        });
    }

    async showScheduleLessonForm() {
        // Check if we're in the unified profile system
        const app = document.getElementById('app');
        if (!app) {
            console.error('App element not found');
            this.showBootstrapAlert('danger', 'Unable to access the application. Please refresh the page.');
            return;
        }

        // Get current user info
        const user = this.getCurrentUser();
        if (!user || user.role !== 'teacher') {
            this.showBootstrapAlert('danger', 'Access denied. This feature is only for teachers.');
            return;
        }

        // Show loading state
        app.innerHTML = `
            <div class="card shadow">
                <div class="card-header bg-success text-white">
                    <h3 class="mb-0">📝 Schedule Lesson</h3>
                </div>
                <div class="card-body text-center">
                    <div class="spinner-border text-success" role="status">
                        <span class="visually-hidden">Loading...</span>
                    </div>
                    <p class="mt-3">Loading lesson scheduling form...</p>
                </div>
            </div>
        `;

        try {
            // Get teacher profile to pre-fill teacher ID
            const teacherProfile = await this.fetchWithAuth('/teacher/profile');
            if (!teacherProfile.success || !teacherProfile.data) {
                throw new Error('Unable to load teacher profile');
            }

            const teacherId = teacherProfile.data.Id;
            
            // Get available lessons for scheduling (teacher's own lessons)
        let availableLessons = [];
        try {
                availableLessons = await this.getTeacherLessons();
        } catch (error) {
                console.error('Error fetching teacher lessons:', error);
        }
        
            app.innerHTML = `
            <div class="row">
                <div class="col-md-5">
                    <div class="card shadow mb-3">
                        <div class="card-header bg-success text-white">
                                <h5 class="mb-0">📝 Schedule New Lesson</h5>
                        </div>
                        <div class="card-body">
                            <form id="scheduleLessonForm">
                                <div class="mb-3">
                                    <label class="form-label">Teacher ID *</label>
                                        <input type="number" class="form-control" id="scheduleTeacherId" required min="1" value="${teacherId}" readonly>
                                    <small class="form-text text-muted">Your teacher identification number</small>
                                </div>
                                    
                                    <div class="row">
                                        <div class="col-md-6">
                                <div class="mb-3">
                                                <label class="form-label">Start Time *</label>
                                                <input type="datetime-local" class="form-control" id="scheduleStartTime" required>
                                                <small class="form-text text-muted">When the lesson begins</small>
                                </div>
                                        </div>
                                        <div class="col-md-6">
                                            <div class="mb-3">
                                                <label class="form-label">End Time *</label>
                                                <input type="datetime-local" class="form-control" id="scheduleEndTime" required>
                                                <small class="form-text text-muted">When the lesson ends</small>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div class="mb-3">
                                        <div class="alert alert-info py-2" id="durationDisplay">
                                            <small><strong>Duration:</strong> <span id="calculatedDuration">Select start and end times</span></small>
                                        </div>
                                    </div>
                                    
                                    <div class="row">
                                        <div class="col-md-6">
                                <div class="mb-3">
                                    <label class="form-label">Instrument *</label>
                                    <select class="form-control" id="scheduleInstrument" required>
                                        <option value="">Select instrument...</option>
                                        <option value="Guitar">Guitar</option>
                                        <option value="Piano">Piano</option>
                                        <option value="Violin">Violin</option>
                                        <option value="Drums">Drums</option>
                                        <option value="Saxophone">Saxophone</option>
                                        <option value="Trumpet">Trumpet</option>
                                    </select>
                                </div>
                                        </div>
                                        <div class="col-md-6">
                                <div class="mb-3">
                                    <label class="form-label">Lesson Type *</label>
                                    <select class="form-control" id="scheduleLessonType" required>
                                        <option value="">Select Option</option>
                                        <option value="In-Person">In-Person</option>
                                        <option value="Virtual">Virtual</option>
                                        <option value="Student Preference">Student Preference</option>
                                    </select>
                                </div>
                                        </div>
                                    </div>
                                    
                                <div class="mb-3">
                                        <label class="form-label">Student</label>
                                        <select class="form-control" id="scheduleStudent">
                                            <option value="">Select student (optional)...</option>
                                        </select>
                                        <small class="form-text text-muted">Leave empty for open lesson slot</small>
                                    </div>
                                    
                                    <div class="mb-3">
                                        <label class="form-label">Hourly Rate ($) *</label>
                                        <div class="input-group">
                                            <span class="input-group-text">$</span>
                                    <input type="number" class="form-control" id="schedulePrice" required min="10" max="500" step="0.01" placeholder="50.00">
                                </div>
                                        <small class="form-text text-muted">Rate between $10-$500 per hour</small>
                                    </div>
                                    
                                    <div class="mb-3">
                                        <label class="form-label">Notes</label>
                                        <textarea class="form-control" id="scheduleNotes" rows="2" placeholder="Any additional notes or special instructions..."></textarea>
                                    </div>
                                    
                                    <div class="d-grid gap-2">
                                        <button type="submit" class="btn btn-success">
                                            <i class="fas fa-plus"></i> Schedule Lesson
                                        </button>
                                        <button type="button" class="btn btn-outline-secondary" onclick="app.clearLessonForm()">
                                            <i class="fas fa-eraser"></i> Clear Form
                                        </button>
                                    </div>
                            </form>
                        </div>
                    </div>
                </div>
                <div class="col-md-7">
                    <div class="card shadow">
                            <div class="card-header bg-info text-white d-flex justify-content-between align-items-center">
                                <h5 class="mb-0">📅 Scheduled Lessons</h5>
                                <div>
                                    <button type="button" class="btn btn-outline-light btn-sm me-2" onclick="app.refreshLessonsList()">
                                        <i class="fas fa-sync"></i> Refresh
                                    </button>
                                </div>
                        </div>
                        <div class="card-body" style="max-height: 600px; overflow-y: auto;">
                            <div id="scheduledLessonsList">
                                <div class="text-center text-muted">
                                        <div class="spinner-border spinner-border-sm me-2" role="status"></div>
                                        Loading lessons...
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

            // Load students for dropdown
            this.loadStudentsForDropdown();

        // Load initial scheduled lessons
        this.loadScheduledLessonsList();
        
            // Add event listeners for duration calculation
            this.attachDurationCalculationListeners();
        
        // Event listener for form submission
        document.getElementById('scheduleLessonForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            // Client-side validation
            const teacherId = parseInt(document.getElementById('scheduleTeacherId').value);
                const startTime = document.getElementById('scheduleStartTime').value;
                const endTime = document.getElementById('scheduleEndTime').value;
            const instrument = document.getElementById('scheduleInstrument').value;
                const studentId = document.getElementById('scheduleStudent').value;
            const lessonType = document.getElementById('scheduleLessonType').value;
            const price = parseFloat(document.getElementById('schedulePrice').value);
                const notes = document.getElementById('scheduleNotes').value;
            
            // Validation checks
            if (!teacherId || teacherId < 1) {
                this.showBootstrapAlert('warning', 'Please enter a valid teacher ID');
                return;
            }
            
                if (!startTime || !endTime) {
                    this.showBootstrapAlert('warning', 'Both start time and end time are required');
                    return;
                }
                
                const startDateTime = new Date(startTime);
                const endDateTime = new Date(endTime);
            const now = new Date();
                
                if (startDateTime <= now) {
                    this.showBootstrapAlert('warning', 'Start time must be in the future');
                    return;
                }
                
                if (startDateTime >= endDateTime) {
                    this.showBootstrapAlert('warning', 'Start time must be before end time');
                return;
            }
            
            if (!instrument) {
                this.showBootstrapAlert('warning', 'Please select an instrument');
                return;
            }
            
            if (!lessonType) {
                this.showBootstrapAlert('warning', 'Please select a lesson type');
                return;
            }
            
            if (!price || price < 10 || price > 500) {
                this.showBootstrapAlert('warning', 'Price must be between $10 and $500');
                return;
            }
            
            const submitBtn = e.target.querySelector('button[type="submit"]');
            const originalBtnText = submitBtn.innerHTML;
            
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Scheduling...';
            this.showLoadingOverlay();
            
                try {
                    const lessonData = {
                TeacherId: teacherId,
                        StartTime: startTime,
                        EndTime: endTime,
                Instrument: instrument,
                        StudentId: studentId ? parseInt(studentId) : null,
                LessonType: lessonType === 'Virtual' ? 'virtual' : 'in-person', // Keep old field for compatibility
                LessonTypeNew: lessonType, // New field for the flexible system
                        Price: price,
                        Notes: notes
                    };
                    
                    // Check if this is an update or create operation
                    const lessonId = submitBtn.dataset.lessonId;
                    let result;
                    
                    if (lessonId) {
                        // Update existing lesson
                        result = await this.updateLesson(lessonId, lessonData);
                this.hideLoadingOverlay();
                        this.showBootstrapAlert('success', '✅ Lesson updated successfully!');
                        
                        // Reset form to create mode
                        this.resetFormToCreateMode();
                    } else {
                        // Create new lesson
                        result = await this.scheduleLesson(lessonData);
                        this.hideLoadingOverlay();
                        
                        // Show enhanced success message
                        const createdLesson = result.data;
                        if (createdLesson) {
                            this.showBootstrapAlert('success', `✅ Lesson scheduled successfully! ${createdLesson.Instrument} lesson on ${new Date(createdLesson.TimeSlot.split(' - ')[0]).toLocaleDateString()} at ${new Date(createdLesson.TimeSlot.split(' - ')[0]).toLocaleTimeString()}`);
                        } else {
                            this.showBootstrapAlert('success', '✅ Lesson scheduled successfully!');
                        }
                
                // Clear form
                        this.clearLessonForm();
                    }
                    
                    // Reload scheduled lessons with a small delay to show success message
                    setTimeout(() => {
                        this.loadScheduledLessonsList();
                    }, 1000);
                    
            } catch (error) {
                this.hideLoadingOverlay();
                this.showBootstrapAlert('danger', `Error: ${error.message}`);
            } finally {
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalBtnText;
            }
        });
            
        } catch (error) {
            app.innerHTML = `
                <div class="card shadow">
                    <div class="card-header bg-danger text-white">
                        <h3 class="mb-0">❌ Error</h3>
                    </div>
                    <div class="card-body">
                        <div class="alert alert-danger">
                            <h5>Unable to Load Schedule Lesson Form</h5>
                            <p>${error.message}</p>
                            <button class="btn btn-primary" onclick="app.showUnifiedProfile('teacher')">Back to Profile</button>
                        </div>
                    </div>
                </div>
            `;
        }
    }
    
    async loadStudentsForDropdown() {
        try {
            const response = await this.fetchWithAuth('/teacher/students');
            if (response.success && response.data) {
                const studentSelect = document.getElementById('scheduleStudent');
                if (studentSelect) {
                    // Clear existing options except the first one
                    studentSelect.innerHTML = '<option value="">Select student (optional)...</option>';
                    
                    // Add students to dropdown
                    response.data.forEach(student => {
                        const option = document.createElement('option');
                        option.value = student.Id;
                        option.textContent = `${student.Name} (${student.Email})`;
                        studentSelect.appendChild(option);
                    });
                }
            }
        } catch (error) {
            console.error('Error loading students:', error);
        }
    }

    // Duration calculation and default settings methods
    attachDurationCalculationListeners() {
        const startTimeInput = document.getElementById('scheduleStartTime');
        const endTimeInput = document.getElementById('scheduleEndTime');
        
        if (startTimeInput && endTimeInput) {
            startTimeInput.addEventListener('change', () => this.calculateDuration());
            endTimeInput.addEventListener('change', () => this.calculateDuration());
        }
    }

    calculateDuration() {
        const startTime = document.getElementById('scheduleStartTime').value;
        const endTime = document.getElementById('scheduleEndTime').value;
        const durationSpan = document.getElementById('calculatedDuration');
        
        if (!startTime || !endTime) {
            durationSpan.textContent = 'Select start and end times';
            return;
        }
        
        const start = new Date(startTime);
        const end = new Date(endTime);
        
        if (start >= end) {
            durationSpan.textContent = 'End time must be after start time';
            durationSpan.style.color = 'red';
            return;
        }
        
        const diffMs = end - start;
        const diffMinutes = Math.floor(diffMs / (1000 * 60));
        const hours = Math.floor(diffMinutes / 60);
        const minutes = diffMinutes % 60;
        
        let durationText = '';
        if (hours > 0) {
            durationText = `${hours}h ${minutes}m`;
        } else {
            durationText = `${minutes}m`;
        }
        
        durationSpan.textContent = durationText;
        durationSpan.style.color = 'inherit';
        
        // Validate duration (15 minutes to 4 hours)
        if (diffMinutes < 15) {
            durationSpan.textContent += ' (Too short - minimum 15 minutes)';
            durationSpan.style.color = 'red';
        } else if (diffMinutes > 240) {
            durationSpan.textContent += ' (Too long - maximum 4 hours)';
            durationSpan.style.color = 'red';
        }
    }

    clearLessonForm() {
        document.getElementById('scheduleStartTime').value = '';
        document.getElementById('scheduleEndTime').value = '';
        document.getElementById('scheduleInstrument').value = '';
        document.getElementById('scheduleStudent').value = '';
        document.getElementById('scheduleLessonType').value = '';
        document.getElementById('schedulePrice').value = '';
        document.getElementById('scheduleNotes').value = '';
        document.getElementById('calculatedDuration').textContent = 'Select start and end times';
        document.getElementById('calculatedDuration').style.color = 'inherit';
    }

    resetFormToCreateMode() {
        this.clearLessonForm();
        
        // Reset submit button to create mode
        const submitBtn = document.querySelector('#scheduleLessonForm button[type="submit"]');
        submitBtn.innerHTML = '<i class="fas fa-plus"></i> Schedule Lesson';
        submitBtn.classList.remove('btn-warning');
        submitBtn.classList.add('btn-success');
        delete submitBtn.dataset.lessonId;
    }

    async updateLesson(lessonId, lessonData) {
        const response = await this.putDataWithAuth(`/teacher/lessons/${lessonId}`, lessonData);
        return response;
    }

    refreshLessonsList() {
        this.loadScheduledLessonsList();
    }

    async editLesson(lessonId) {
        try {
            // Get current user info to get teacher ID
            const user = this.getCurrentUser();
            if (!user || user.role !== 'teacher') {
                throw new Error('Access denied. This feature is only for teachers.');
            }

            // Get teacher profile to get teacher ID
            const teacherProfile = await this.fetchWithAuth('/teacher/profile');
            if (!teacherProfile.success || !teacherProfile.data) {
                throw new Error('Unable to load teacher profile');
            }

            const teacherId = teacherProfile.data.Id;
            
            // Get lesson details
            const response = await this.fetchWithAuth(`/teacher/lessons`);
            if (!response.success || !response.data) {
                throw new Error('Failed to load lesson details');
            }
            
            const lesson = response.data.find(l => l.Id === lessonId);
            if (!lesson) {
                throw new Error('Lesson not found');
            }
            
            // Parse time slot
            let startTime = '';
            let endTime = '';
            if (lesson.TimeSlot && lesson.TimeSlot.includes(' - ')) {
                const [start, end] = lesson.TimeSlot.split(' - ');
                startTime = start;
                endTime = end;
            }
            
            // Pre-fill form with lesson data
            document.getElementById('scheduleTeacherId').value = teacherId;
            document.getElementById('scheduleStartTime').value = startTime;
            document.getElementById('scheduleEndTime').value = endTime;
            document.getElementById('scheduleInstrument').value = lesson.Instrument || '';
            document.getElementById('scheduleStudent').value = lesson.StudentId || '';
            document.getElementById('scheduleLessonType').value = lesson.DisplayLessonType || lesson.LessonTypeNew || lesson.LessonType || 'Virtual';
            document.getElementById('schedulePrice').value = lesson.Price || '';
            document.getElementById('scheduleNotes').value = lesson.Notes || '';
            
            // Calculate duration
            this.calculateDuration();
            
            // Load students for dropdown
            await this.loadStudentsForDropdown();
            
            // Scroll to form
            document.getElementById('scheduleLessonForm').scrollIntoView({ behavior: 'smooth' });
            
            // Show edit mode
            const submitBtn = document.querySelector('#scheduleLessonForm button[type="submit"]');
            submitBtn.innerHTML = '<i class="fas fa-save"></i> Update Lesson';
            submitBtn.classList.remove('btn-success');
            submitBtn.classList.add('btn-warning');
            
            // Store lesson ID for update
            submitBtn.dataset.lessonId = lessonId;
            
            this.showBootstrapAlert('info', 'Lesson loaded for editing. Make your changes and click "Update Lesson".');
            
        } catch (error) {
            this.showBootstrapAlert('danger', `Error loading lesson: ${error.message}`);
        }
    }

    async deleteLesson(lessonId) {
        try {
            // Show confirmation modal
            const confirmed = confirm('Are you sure you want to delete this lesson? This action cannot be undone.');
            if (!confirmed) return;
            
            // Delete lesson
            const response = await this.deleteDataWithAuth(`/teacher/lessons/${lessonId}`);
            
            if (response.success) {
                this.showBootstrapAlert('success', 'Lesson deleted successfully!');
                this.loadScheduledLessonsList(); // Refresh list
            } else {
                throw new Error(response.error || 'Failed to delete lesson');
            }
            
        } catch (error) {
            this.showBootstrapAlert('danger', `Error deleting lesson: ${error.message}`);
        }
    }

    async loadAvailableLessons() {
        try {
            // Check if we're in the student profile context
            const studentContent = document.getElementById('studentContent');
            const app = document.getElementById('app');
            
            let targetElement;
            if (studentContent) {
                // We're in the student profile view, use studentContent
                targetElement = studentContent;
            } else if (app) {
                // We're in a full-page view, use app
                targetElement = app;
            } else {
                console.error('No target element found for lessons display');
                return;
            }

            // Show loading state
            targetElement.innerHTML = `
                <div class="card shadow">
                    <div class="card-header bg-info text-white d-flex justify-content-between align-items-center">
                        <h3 class="mb-0">📚 Available Lessons</h3>
                        ${studentContent ? '<button class="btn btn-outline-light btn-sm" onclick="app.showUnifiedProfile(\'student\')"><i class="fas fa-arrow-left"></i> Back to Profile</button>' : ''}
                    </div>
                    <div class="card-body text-center">
                        <div class="spinner-border text-info" role="status">
                            <span class="visually-hidden">Loading...</span>
                        </div>
                        <p class="mt-3">Loading available lessons...</p>
                    </div>
                </div>
            `;

            // Fetch available lessons
            const response = await this.fetchWithAuth('/student/available-lessons');
            
            if (!response.success || !response.data) {
                throw new Error('Failed to load available lessons');
            }

            const lessons = response.data;
            
            if (lessons.length === 0) {
                targetElement.innerHTML = `
                    <div class="card shadow">
                        <div class="card-header bg-info text-white d-flex justify-content-between align-items-center">
                            <h3 class="mb-0">📚 Available Lessons</h3>
                            ${studentContent ? '<button class="btn btn-outline-light btn-sm" onclick="app.showUnifiedProfile(\'student\')"><i class="fas fa-arrow-left"></i> Back to Profile</button>' : ''}
                        </div>
                        <div class="card-body text-center">
                            <div class="alert alert-info">
                                <h5>No Available Lessons</h5>
                                <p>There are currently no available lessons. Check back later!</p>
                                ${studentContent ? '<button class="btn btn-primary" onclick="app.showUnifiedProfile(\'student\')">Back to Profile</button>' : ''}
                            </div>
                        </div>
                    </div>
                `;
                return;
            }

            // Display lessons
            let html = `
                <div class="card shadow">
                    <div class="card-header bg-info text-white d-flex justify-content-between align-items-center">
                        <h3 class="mb-0">📚 Available Lessons</h3>
                        ${studentContent ? '<button class="btn btn-outline-light btn-sm" onclick="app.showUnifiedProfile(\'student\')"><i class="fas fa-arrow-left"></i> Back to Profile</button>' : ''}
                    </div>
                    <div class="card-body">
                        <div class="table-responsive">
                            <table class="table table-striped table-hover">
                                <thead class="table-dark">
                                    <tr>
                                        <th>Start Time</th>
                                        <th>End Time</th>
                                        <th>Duration</th>
                                        <th>Instrument</th>
                                        <th>Teacher</th>
                                        <th>Type</th>
                                        <th>Price</th>
                                        <th>Notes</th>
                                        <th>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
            `;

            lessons.forEach(lesson => {
                // Parse time slot
                let startTime = '';
                let endTime = '';
                let duration = '';
                
                if (lesson.TimeSlot && lesson.TimeSlot.includes(' - ')) {
                    const [start, end] = lesson.TimeSlot.split(' - ');
                    const startDate = new Date(start);
                    const endDate = new Date(end);
                    
                    startTime = startDate.toLocaleString();
                    endTime = endDate.toLocaleString();
                    
                    // Calculate duration
                    const diffMs = endDate - startDate;
                    const diffMinutes = Math.floor(diffMs / (1000 * 60));
                    const hours = Math.floor(diffMinutes / 60);
                    const minutes = diffMinutes % 60;
                    
                    if (hours > 0) {
                        duration = `${hours}h ${minutes}m`;
                    } else {
                        duration = `${minutes}m`;
                    }
                } else {
                    startTime = lesson.TimeSlot ? new Date(lesson.TimeSlot).toLocaleString() : '-';
                    endTime = '-';
                    duration = '-';
                }

                // Use the new lesson type system for display
                let displayLessonType = 'In-Person';
                let lessonTypeBadge = 'bg-success';
                
                if (lesson.DisplayLessonType) {
                    displayLessonType = lesson.DisplayLessonType;
                } else if (lesson.LessonTypeNew) {
                    displayLessonType = lesson.LessonTypeNew;
                } else if (lesson.LessonType) {
                    displayLessonType = lesson.LessonType === 'virtual' ? 'Virtual' : 'In-Person';
                }
                
                // Set badge color based on lesson type
                if (displayLessonType === 'Virtual') {
                    lessonTypeBadge = 'bg-info';
                } else if (displayLessonType === 'Student Preference') {
                    lessonTypeBadge = 'bg-warning';
                } else {
                    lessonTypeBadge = 'bg-success';
                }
                
                const notes = lesson.Notes || '-';
                
                // Check if lesson is in the past
                const lessonStart = new Date(lesson.TimeSlot.split(' - ')[0]);
                const now = new Date();
                const isPast = lessonStart < now;

                html += `
                    <tr class="lesson-row ${isPast ? 'table-secondary' : ''}" data-teacher="${lesson.TeacherName.toLowerCase()}" data-instrument="${lesson.Instrument}" data-type="${displayLessonType}">
                        <td><small>${startTime}</small></td>
                        <td><small>${endTime}</small></td>
                        <td><span class="badge bg-light text-dark">${duration}</span></td>
                        <td>${lesson.Instrument}</td>
                        <td>${lesson.TeacherName}</td>
                        <td><span class="badge ${lessonTypeBadge}">${displayLessonType}</span></td>
                        <td><strong>$${lesson.Price ? lesson.Price.toFixed(2) : '0.00'}</strong></td>
                        <td><small class="text-muted">${notes}</small></td>
                        <td>
                            <button type="button" class="btn btn-success btn-sm" onclick="app.bookLesson(${lesson.Id})" ${isPast ? 'disabled' : ''}>
                                <i class="fas fa-book"></i> Book
                            </button>
                        </td>
                    </tr>
                `;
            });

            html += `
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            `;

            targetElement.innerHTML = html;

        } catch (error) {
            const studentContent = document.getElementById('studentContent');
            const app = document.getElementById('app');
            const targetElement = studentContent || app;
            
            if (targetElement) {
                targetElement.innerHTML = `
                    <div class="card shadow">
                        <div class="card-header bg-danger text-white">
                            <h3 class="mb-0">❌ Error</h3>
                        </div>
                        <div class="card-body">
                            <div class="alert alert-danger">
                                <h5>Unable to Load Available Lessons</h5>
                                <p>${error.message}</p>
                                ${studentContent ? '<button class="btn btn-primary" onclick="app.showUnifiedProfile(\'student\')">Back to Profile</button>' : ''}
                            </div>
                        </div>
                    </div>
                `;
            }
        }
    }

    async showLessonBooking() {
        try {
            const app = document.getElementById('app');
            if (!app) {
                console.error('App element not found');
                return;
            }

            // Show loading state
            app.innerHTML = `
                <div class="card shadow">
                    <div class="card-header bg-success text-white">
                        <h3 class="mb-0">📚 Browse & Book Lessons</h3>
                    </div>
                    <div class="card-body text-center">
                        <div class="spinner-border text-success" role="status">
                            <span class="visually-hidden">Loading...</span>
                        </div>
                        <p class="mt-3">Loading available lessons...</p>
                    </div>
                </div>
            `;

            // Fetch available lessons
            const response = await this.fetchWithAuth('/student/available-lessons');
            
            if (!response.success || !response.data) {
                throw new Error('Failed to load available lessons');
            }

            const lessons = response.data;
            
            if (lessons.length === 0) {
                app.innerHTML = `
                    <div class="card shadow">
                        <div class="card-header bg-success text-white d-flex justify-content-between align-items-center">
                            <h3 class="mb-0">📚 Browse & Book Lessons</h3>
                            <button class="btn btn-outline-light btn-sm" onclick="app.showUnifiedProfile('student')">
                                <i class="fas fa-arrow-left"></i> Back to Profile
                            </button>
                        </div>
                        <div class="card-body text-center">
                            <div class="alert alert-info">
                                <h5>No Available Lessons</h5>
                                <p>There are currently no available lessons. Check back later!</p>
                                <button class="btn btn-primary" onclick="app.showUnifiedProfile('student')">Back to Profile</button>
                            </div>
                        </div>
                    </div>
                `;
                return;
            }

            // Display comprehensive lesson booking interface
            let html = `
                <div class="card shadow">
                    <div class="card-header bg-success text-white d-flex justify-content-between align-items-center">
                        <h3 class="mb-0">📚 Browse & Book Lessons</h3>
                        <div class="d-flex gap-2">
                            <button class="btn btn-outline-light btn-sm" onclick="app.toggleView('calendar')">
                                <i class="fas fa-calendar"></i> Calendar View
                            </button>
                            <button class="btn btn-outline-light btn-sm" onclick="app.showUnifiedProfile('student')">
                                <i class="fas fa-arrow-left"></i> Back to Profile
                            </button>
                        </div>
                    </div>
                    <div class="card-body">
                        <!-- Search and Filter Controls -->
                        <div class="row mb-4">
                            <div class="col-md-4">
                                <div class="input-group">
                                    <span class="input-group-text"><i class="fas fa-search"></i></span>
                                    <input type="text" class="form-control" id="lessonSearch" placeholder="Search by teacher name..." onkeyup="app.filterLessons()">
                                </div>
                            </div>
                            <div class="col-md-3">
                                <select class="form-select" id="instrumentFilter" onchange="app.filterLessons()">
                                    <option value="">All Instruments</option>
                                    <option value="Guitar">Guitar</option>
                                    <option value="Piano">Piano</option>
                                    <option value="Violin">Violin</option>
                                    <option value="Drums">Drums</option>
                                    <option value="Saxophone">Saxophone</option>
                                    <option value="Trumpet">Trumpet</option>
                                </select>
                            </div>
                            <div class="col-md-3">
                                <select class="form-select" id="lessonTypeFilter" onchange="app.filterLessons()">
                                    <option value="">All Types</option>
                                    <option value="In-Person">In-Person</option>
                                    <option value="Virtual">Virtual</option>
                                    <option value="Student Preference">Student Preference</option>
                                </select>
                            </div>
                            <div class="col-md-2">
                                <button class="btn btn-outline-secondary w-100" onclick="app.clearFilters()">
                                    <i class="fas fa-times"></i> Clear
                                </button>
                            </div>
                        </div>

                        <!-- Table View -->
                        <div id="tableView">
                            <div class="table-responsive">
                                <table class="table table-striped table-hover" id="lessonsTable">
                                    <thead class="table-dark">
                                        <tr>
                                            <th>Start Time</th>
                                            <th>End Time</th>
                                            <th>Duration</th>
                                            <th>Instrument</th>
                                            <th>Teacher</th>
                                            <th>Type</th>
                                            <th>Price</th>
                                            <th>Notes</th>
                                            <th>Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
            `;

            lessons.forEach(lesson => {
                // Parse time slot
                let startTime = '';
                let endTime = '';
                let duration = '';
                
                if (lesson.TimeSlot && lesson.TimeSlot.includes(' - ')) {
                    const [start, end] = lesson.TimeSlot.split(' - ');
                    const startDate = new Date(start);
                    const endDate = new Date(end);
                    
                    startTime = startDate.toLocaleString();
                    endTime = endDate.toLocaleString();
                    
                    // Calculate duration
                    const diffMs = endDate - startDate;
                    const diffMinutes = Math.floor(diffMs / (1000 * 60));
                    const hours = Math.floor(diffMinutes / 60);
                    const minutes = diffMinutes % 60;
                    
                    if (hours > 0) {
                        duration = `${hours}h ${minutes}m`;
                    } else {
                        duration = `${minutes}m`;
                    }
                } else {
                    startTime = lesson.TimeSlot ? new Date(lesson.TimeSlot).toLocaleString() : '-';
                    endTime = '-';
                    duration = '-';
                }

                // Use the new lesson type system for display
                let displayLessonType = 'In-Person';
                let lessonTypeBadge = 'bg-success';
                
                if (lesson.DisplayLessonType) {
                    displayLessonType = lesson.DisplayLessonType;
                } else if (lesson.LessonTypeNew) {
                    displayLessonType = lesson.LessonTypeNew;
                } else if (lesson.LessonType) {
                    displayLessonType = lesson.LessonType === 'virtual' ? 'Virtual' : 'In-Person';
                }
                
                // Set badge color based on lesson type
                if (displayLessonType === 'Virtual') {
                    lessonTypeBadge = 'bg-info';
                } else if (displayLessonType === 'Student Preference') {
                    lessonTypeBadge = 'bg-warning';
                } else {
                    lessonTypeBadge = 'bg-success';
                }
                
                const notes = lesson.Notes || '-';
                
                // Check if lesson is in the past
                let lessonStart;
                let isPast = false;
                if (lesson.TimeSlot && lesson.TimeSlot.includes(' - ')) {
                    lessonStart = new Date(lesson.TimeSlot.split(' - ')[0]);
                const now = new Date();
                    isPast = lessonStart < now;
                }

                html += `
                    <tr class="lesson-row" data-instrument="${lesson.Instrument}" data-type="${displayLessonType}" data-teacher="${lesson.TeacherName.toLowerCase()}">
                        <td><small>${startTime}</small></td>
                        <td><small>${endTime}</small></td>
                        <td><span class="badge bg-light text-dark">${duration}</span></td>
                        <td><span class="badge bg-secondary">${lesson.Instrument}</span></td>
                        <td>${lesson.TeacherName}</td>
                        <td><span class="badge ${lessonTypeBadge}">${displayLessonType}</span></td>
                        <td><strong>$${lesson.Price ? lesson.Price.toFixed(2) : '0.00'}</strong></td>
                        <td><small class="text-muted">${notes}</small></td>
                        <td>
                            <button type="button" class="btn btn-success btn-sm" onclick="app.showBookingModal(${lesson.Id})" ${isPast ? 'disabled' : ''}>
                                <i class="fas fa-book"></i> Book
                            </button>
                        </td>
                    </tr>
                `;
            });

            html += `
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <!-- Calendar View (Hidden by default) -->
                        <div id="calendarView" style="display: none;">
                            <div class="alert alert-info mb-3">
                                <h5><i class="fas fa-calendar"></i> Calendar View</h5>
                                <p>View lessons by date. Click on a lesson to book it.</p>
                            </div>
                            <div id="calendarContainer">
                                <!-- Calendar will be generated here -->
                            </div>
                            <div class="mt-3">
                                <button class="btn btn-primary" onclick="app.toggleView('table')">
                                    <i class="fas fa-table"></i> Back to Table View
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Booking Modal -->
                <div class="modal fade" id="bookingModal" tabindex="-1" aria-labelledby="bookingModalLabel" aria-hidden="true">
                    <div class="modal-dialog modal-lg">
                        <div class="modal-content">
                            <div class="modal-header bg-success text-white">
                                <h5 class="modal-title" id="bookingModalLabel">Book Lesson</h5>
                                <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
                            </div>
                            <div class="modal-body">
                                <div id="bookingModalContent">
                                    <!-- Content will be loaded dynamically -->
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;

            app.innerHTML = html;

        } catch (error) {
            const app = document.getElementById('app');
            if (app) {
                app.innerHTML = `
                    <div class="card shadow">
                        <div class="card-header bg-danger text-white">
                            <h3 class="mb-0">❌ Error</h3>
                        </div>
                        <div class="card-body">
                            <div class="alert alert-danger">
                                <h5>Failed to Load Lessons</h5>
                                <p>${error.message}</p>
                                <button class="btn btn-primary" onclick="app.showUnifiedProfile('student')">Back to Profile</button>
                            </div>
                        </div>
                    </div>
                `;
            }
        }
    }

    // Filter lessons based on search and filter criteria
    filterLessons() {
        const searchTerm = document.getElementById('lessonSearch')?.value.toLowerCase() || '';
        const instrumentFilter = document.getElementById('instrumentFilter')?.value || '';
        const lessonTypeFilter = document.getElementById('lessonTypeFilter')?.value || '';
        
        const rows = document.querySelectorAll('.lesson-row');
        
        rows.forEach(row => {
            const teacher = row.dataset.teacher || '';
            const instrument = row.dataset.instrument || '';
            const type = row.dataset.type || '';
            
            const matchesSearch = teacher.includes(searchTerm);
            const matchesInstrument = !instrumentFilter || instrument === instrumentFilter;
            const matchesType = !lessonTypeFilter || type === lessonTypeFilter;
            
            if (matchesSearch && matchesInstrument && matchesType) {
                row.style.display = '';
            } else {
                row.style.display = 'none';
            }
        });
        
        // If calendar view is currently visible, regenerate it with filtered data
        const calendarView = document.getElementById('calendarView');
        if (calendarView && calendarView.style.display !== 'none') {
            this.generateCalendar();
        }
    }

    // Clear all filters
    clearFilters() {
        document.getElementById('lessonSearch').value = '';
        document.getElementById('instrumentFilter').value = '';
        document.getElementById('lessonTypeFilter').value = '';
        this.filterLessons();
    }

    // Toggle between table and calendar view
    toggleView(view) {
        const tableView = document.getElementById('tableView');
        const calendarView = document.getElementById('calendarView');
        
        if (view === 'calendar') {
            tableView.style.display = 'none';
            calendarView.style.display = 'block';
            this.generateCalendar();
        } else {
            tableView.style.display = 'block';
            calendarView.style.display = 'none';
        }
    }

    // Generate calendar view
    generateCalendar() {
        const container = document.getElementById('calendarContainer');
        if (!container) return;

        // Get lessons from the original data instead of table rows
        const lessonRows = document.querySelectorAll('.lesson-row');
        const lessons = [];
        
        // We need to get the original lesson data from the API response
        // Since we don't have direct access to it here, we'll reconstruct it from the table data
        lessonRows.forEach(row => {
            if (row.style.display !== 'none') {
                const startTime = row.cells[0].textContent.trim();
                const endTime = row.cells[1].textContent.trim();
                const instrument = row.cells[3].textContent.trim();
                const teacher = row.cells[4].textContent.trim();
                const type = row.cells[5].textContent.trim();
                const price = row.cells[6].textContent.trim();
                const notes = row.cells[7].textContent.trim();
                
                // Extract lesson ID from the button onclick
                const button = row.querySelector('button');
                const lessonId = button ? button.onclick.toString().match(/app\.showBookingModal\((\d+)\)/)?.[1] : null;
                
                if (lessonId && startTime !== '-') {
                    lessons.push({
                        Id: parseInt(lessonId),
                        startTime: startTime,
                        endTime: endTime,
                        Instrument: instrument,
                        TeacherName: teacher,
                        DisplayLessonType: type,
                        Price: parseFloat(price.replace('$', '')) || 0,
                        Notes: notes,
                        startDate: new Date(startTime)
                    });
                }
            }
        });

        // Group lessons by date
        const lessonsByDate = {};
        lessons.forEach(lesson => {
            const dateKey = lesson.startDate.toDateString();
            if (!lessonsByDate[dateKey]) {
                lessonsByDate[dateKey] = [];
            }
            lessonsByDate[dateKey].push(lesson);
        });

        // Generate calendar HTML
        let calendarHtml = '<div class="row">';
        
        const sortedDates = Object.keys(lessonsByDate).sort((a, b) => new Date(a) - new Date(b));
        
        sortedDates.forEach(dateKey => {
            const date = new Date(dateKey);
            const dayLessons = lessonsByDate[dateKey];
            
            calendarHtml += `
                <div class="col-md-6 col-lg-4 mb-4">
                    <div class="card h-100">
                        <div class="card-header bg-primary text-white">
                            <h6 class="mb-0">
                                <i class="fas fa-calendar-day"></i> 
                                ${date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                            </h6>
                        </div>
                        <div class="card-body p-2">
                            <div class="list-group list-group-flush">
            `;
            
            dayLessons.forEach(lesson => {
                let timeStr = 'Time TBD';
                let endTimeStr = 'Time TBD';
                
                // Use the startTime and endTime we extracted from the table
                if (lesson.startTime && lesson.endTime && lesson.startTime !== '-' && lesson.endTime !== '-') {
                    try {
                        const startTime = new Date(lesson.startTime);
                        const endTime = new Date(lesson.endTime);
                        timeStr = startTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
                        endTimeStr = endTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
                    } catch (e) {
                        // If date parsing fails, use the original strings
                        timeStr = lesson.startTime;
                        endTimeStr = lesson.endTime;
                    }
                }
                
                calendarHtml += `
                    <div class="list-group-item p-2 border-0">
                        <div class="d-flex justify-content-between align-items-start">
                            <div class="flex-grow-1">
                                <h6 class="mb-1">${timeStr} - ${endTimeStr}</h6>
                                <p class="mb-1">
                                    <span class="badge bg-secondary me-1">${lesson.Instrument}</span>
                                    <span class="badge ${lesson.DisplayLessonType && lesson.DisplayLessonType.includes('Virtual') ? 'bg-info' : 'bg-success'} me-1">${lesson.DisplayLessonType || 'In-Person'}</span>
                                </p>
                                <small class="text-muted">${lesson.TeacherName} • $${lesson.Price ? lesson.Price.toFixed(2) : '0.00'}</small>
                            </div>
                            <button class="btn btn-success btn-sm" onclick="app.showBookingModal(${lesson.Id})">
                                <i class="fas fa-book"></i>
                            </button>
                        </div>
                    </div>
                `;
            });
            
            calendarHtml += `
                            </div>
                        </div>
                    </div>
                </div>
            `;
        });
        
        calendarHtml += '</div>';
        
        if (sortedDates.length === 0) {
            calendarHtml = `
                <div class="alert alert-warning text-center">
                    <h5><i class="fas fa-calendar-times"></i> No Lessons Found</h5>
                    <p>No lessons match your current filters. Try adjusting your search criteria.</p>
                    <button class="btn btn-primary" onclick="app.clearFilters()">Clear Filters</button>
                </div>
            `;
        }
        
        container.innerHTML = calendarHtml;
    }

    // Show booking modal with lesson details and options
    async showBookingModal(lessonId) {
        try {
            // Get lesson details
            const response = await this.fetchWithAuth('/student/available-lessons');
            if (!response.success || !response.data) {
                throw new Error('Failed to load lesson details');
            }
            
            const lesson = response.data.find(l => l.Id === lessonId);
            if (!lesson) {
                throw new Error('Lesson not found');
            }

            // Get student profile for payment info
            const profileResponse = await this.fetchWithAuth('/student/profile');
            const studentProfile = profileResponse.success ? profileResponse.data : null;

            // Parse time slot
            let startTime = '';
            let endTime = '';
            let duration = '';
            
            if (lesson.TimeSlot && lesson.TimeSlot.includes(' - ')) {
                const [start, end] = lesson.TimeSlot.split(' - ');
                const startDate = new Date(start);
                const endDate = new Date(end);
                
                startTime = startDate.toLocaleString();
                endTime = endDate.toLocaleString();
                
                // Calculate duration
                const diffMs = endDate - startDate;
                const diffMinutes = Math.floor(diffMs / (1000 * 60));
                const hours = Math.floor(diffMinutes / 60);
                const minutes = diffMinutes % 60;
                
                if (hours > 0) {
                    duration = `${hours}h ${minutes}m`;
                } else {
                    duration = `${minutes}m`;
                }
            }

            const modalContent = document.getElementById('bookingModalContent');
            modalContent.innerHTML = `
                <div class="row">
                    <div class="col-md-6">
                        <h6><i class="fas fa-info-circle"></i> Lesson Details</h6>
                        <div class="card bg-light">
                            <div class="card-body">
                                <p><strong>Teacher:</strong> ${lesson.TeacherName}</p>
                                <p><strong>Instrument:</strong> ${lesson.Instrument}</p>
                                <p><strong>Start Time:</strong> ${startTime}</p>
                                <p><strong>End Time:</strong> ${endTime}</p>
                                <p><strong>Duration:</strong> ${duration}</p>
                                <p><strong>Price:</strong> $${lesson.Price ? lesson.Price.toFixed(2) : '0.00'}</p>
                                <p><strong>Type:</strong> <span class="badge ${lesson.DisplayLessonType === 'Virtual' ? 'bg-info' : lesson.DisplayLessonType === 'In-Person' ? 'bg-success' : 'bg-warning'}">${lesson.DisplayLessonType || lesson.LessonTypeNew || 'In-Person'}</span></p>
                                ${lesson.Notes ? `<p><strong>Notes:</strong> ${lesson.Notes}</p>` : ''}
                            </div>
                        </div>
                    </div>
                    <div class="col-md-6">
                        <h6><i class="fas fa-cog"></i> Booking Options</h6>
                        <form id="bookingForm">
                            <div class="mb-3">
                                <label class="form-label">Lesson Type Preference</label>
                                ${lesson.LessonTypeNew === 'Student Preference' ? `
                                    <select class="form-select" id="preferredLessonType" required>
                                        <option value="">Select your preference...</option>
                                        <option value="In-Person">In-Person</option>
                                        <option value="Virtual">Virtual</option>
                                    </select>
                                    <small class="form-text text-muted">Choose your preferred lesson type</small>
                                ` : `
                                    <select class="form-select" id="preferredLessonType" disabled>
                                        <option value="${lesson.DisplayLessonType || lesson.LessonTypeNew}">${lesson.DisplayLessonType || lesson.LessonTypeNew}</option>
                                    </select>
                                    <small class="form-text text-muted">This lesson type is fixed by the teacher</small>
                                `}
                            </div>
                            
                            <div class="mb-3">
                                <label class="form-label">Special Requests</label>
                                <textarea class="form-control" id="specialRequests" rows="3" placeholder="Any special requests or notes for the teacher..."></textarea>
                            </div>
                            
                            <div class="mb-3">
                                <label class="form-label">Sheet Music (Optional)</label>
                                <input type="file" class="form-control" id="sheetMusic" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx">
                                <small class="form-text text-muted">Upload sheet music or materials for this lesson</small>
                            </div>
                            
                            <div class="mb-3">
                                <h6><i class="fas fa-credit-card"></i> Payment Method</h6>
                                <div class="card bg-light">
                                    <div class="card-body">
                                        ${studentProfile && studentProfile.CardNumber ? `
                                            <div class="form-check mb-3">
                                                <input class="form-check-input" type="radio" name="paymentMethod" id="savedCard" value="saved" checked>
                                                <label class="form-check-label" for="savedCard">
                                                    <strong>Use Saved Card</strong><br>
                                                    <small class="text-muted">****-****-****-${studentProfile.CardNumber.slice(-4)} (Expires: ${studentProfile.ExpiryDate || 'N/A'})</small>
                                    </label>
                                </div>
                                            <div class="form-check mb-3">
                                                <input class="form-check-input" type="radio" name="paymentMethod" id="newCard" value="new">
                                                <label class="form-check-label" for="newCard">
                                                    <strong>Use Different Card</strong>
                                                </label>
                            </div>
                                            <div id="newCardFields" style="display: none;">
                                                <div class="row">
                                                    <div class="col-md-8">
                                                        <label class="form-label">Card Number</label>
                                                        <input type="text" class="form-control" id="newCardNumber" maxlength="14" placeholder="12345678901234">
                                                    </div>
                                                    <div class="col-md-4">
                                                        <label class="form-label">Expiry</label>
                                                        <input type="text" class="form-control" id="newExpiryDate" maxlength="5" placeholder="MM/YY">
                                                    </div>
                                                </div>
                                                <div class="row mt-2">
                                                    <div class="col-md-6">
                                                        <label class="form-label">PIN</label>
                                                        <input type="password" class="form-control" id="newPin" maxlength="4" placeholder="1234">
                                                    </div>
                                                </div>
                                            </div>
                                        ` : `
                                            <div class="alert alert-warning">
                                                <i class="fas fa-exclamation-triangle"></i>
                                                <strong>No Payment Method Saved</strong><br>
                                                Please add a payment method to your profile before booking lessons.
                                                <br><br>
                                                <button type="button" class="btn btn-sm btn-primary" onclick="app.showEditProfile('student'); bootstrap.Modal.getInstance(document.getElementById('bookingModal')).hide();">
                                                    <i class="fas fa-plus"></i> Add Payment Method
                                    </button>
                                </div>
                                        `}
                            </div>
                                </div>
                            </div>
                            
                        </form>
                    </div>
                </div>
                
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                    <button type="button" class="btn btn-success" onclick="app.confirmBooking(${lessonId})">
                        <i class="fas fa-check"></i> Confirm Booking
                    </button>
                </div>
            `;

            // Show the modal
            const modal = new bootstrap.Modal(document.getElementById('bookingModal'));
            modal.show();

            // Add event listeners for payment method toggle
            setTimeout(() => {
                const newCardRadio = document.getElementById('newCard');
                const newCardFields = document.getElementById('newCardFields');
                
                if (newCardRadio && newCardFields) {
                    newCardRadio.addEventListener('change', () => {
                        if (newCardRadio.checked) {
                            newCardFields.style.display = 'block';
                        } else {
                            newCardFields.style.display = 'none';
                        }
                    });
                }

                // Add input formatting for new card fields
                const newCardNumberInput = document.getElementById('newCardNumber');
                if (newCardNumberInput) {
                    newCardNumberInput.addEventListener('input', (e) => {
                        e.target.value = e.target.value.replace(/\D/g, '').substring(0, 14);
                    });
                }

                const newExpiryInput = document.getElementById('newExpiryDate');
                if (newExpiryInput) {
                    newExpiryInput.addEventListener('input', (e) => {
                        let value = e.target.value.replace(/\D/g, '');
                        if (value.length >= 2) {
                            value = value.substring(0, 2) + '/' + value.substring(2, 4);
                        }
                        e.target.value = value;
                    });
                }

                const newPinInput = document.getElementById('newPin');
                if (newPinInput) {
                    newPinInput.addEventListener('input', (e) => {
                        e.target.value = e.target.value.replace(/\D/g, '').substring(0, 4);
                    });
                }
            }, 100);

        } catch (error) {
            this.showBootstrapAlert('danger', `Error loading lesson details: ${error.message}`);
        }
    }

    // Confirm booking with all details
    async confirmBooking(lessonId) {
        try {
            const user = this.getCurrentUser();
            if (!user) {
                this.showBootstrapAlert('danger', 'Please log in to book lessons');
                return;
            }

            // Get form data
            const preferredLessonTypeElement = document.getElementById('preferredLessonType');
            const preferredLessonType = preferredLessonTypeElement ? preferredLessonTypeElement.value : '';
            const specialRequests = document.getElementById('specialRequests').value;
            const sheetMusicFile = document.getElementById('sheetMusic').files[0];
            
            // Get payment method data
            const paymentMethod = document.querySelector('input[name="paymentMethod"]:checked');
            if (!paymentMethod) {
                this.showBootstrapAlert('danger', 'Please select a payment method');
                return;
            }

            // Validate payment information
            if (paymentMethod.value === 'new') {
                const newCardNumber = document.getElementById('newCardNumber').value;
                const newExpiryDate = document.getElementById('newExpiryDate').value;
                const newPin = document.getElementById('newPin').value;

                if (!newCardNumber || newCardNumber.length !== 14) {
                    this.showBootstrapAlert('danger', 'Please enter a valid 14-digit card number');
                    return;
                }

                if (!newExpiryDate || !this.validateExpiryDate(newExpiryDate)) {
                    this.showBootstrapAlert('danger', 'Please enter a valid expiry date (MM/YY format)');
                    return;
                }

                if (!newPin || newPin.length < 3 || newPin.length > 4) {
                    this.showBootstrapAlert('danger', 'Please enter a valid PIN (3-4 digits)');
                    return;
                }

                // Verify the new card
                try {
                    const cardResponse = await this.postDataWithAuth('/student/verify-card', {
                        CardNumber: newCardNumber,
                        ExpiryDate: newExpiryDate,
                        Pin: newPin
                    });

                    if (!cardResponse.success) {
                        this.showBootstrapAlert('danger', `Card verification failed: ${cardResponse.error}`);
                        return;
                    }
                } catch (error) {
                    this.showBootstrapAlert('danger', `Card verification failed: ${error.message}`);
                    return;
                }
            } else {
                // Using saved card - get student profile to verify card info exists
                const profileResponse = await this.fetchWithAuth('/student/profile');
                if (!profileResponse.success || !profileResponse.data || !profileResponse.data.CardNumber) {
                    this.showBootstrapAlert('danger', 'No saved payment method found. Please add a payment method to your profile.');
                    return;
                }
            }

            console.log('Form elements found:', {
                preferredLessonTypeElement: !!preferredLessonTypeElement,
                preferredLessonType: preferredLessonType,
                specialRequestsElement: !!document.getElementById('specialRequests'),
                sheetMusicElement: !!document.getElementById('sheetMusic')
            });

            // Get lesson details to check if it's a Student Preference lesson
            const lessonResponse = await this.fetchWithAuth('/student/available-lessons');
            if (!lessonResponse.success || !lessonResponse.data) {
                throw new Error('Failed to load lesson details');
            }
            
            const lesson = lessonResponse.data.find(l => l.Id === lessonId);
            if (!lesson) {
                throw new Error('Lesson not found');
            }

            // Validate Student Preference lesson type selection
            if (lesson.LessonTypeNew === 'Student Preference' && !preferredLessonType) {
                console.log('Validation failed: Student Preference lesson requires lesson type selection');
                console.log('Lesson:', lesson);
                console.log('Preferred lesson type:', preferredLessonType);
                this.showBootstrapAlert('danger', 'Please select your preferred lesson type (In-Person or Virtual) for this lesson.');
                return;
            }

            console.log('Booking lesson:', {
                lessonId: lessonId,
                lessonType: lesson.LessonTypeNew,
                preferredLessonType: preferredLessonType,
                specialRequests: specialRequests,
                sheetMusicFileName: sheetMusicFile ? sheetMusicFile.name : null
            });

            // Show confirmation
            const confirmed = confirm('Are you sure you want to book this lesson?');
            if (!confirmed) return;

            // Upload sheet music file if provided
            let sheetMusicFilePath = null;
            let sheetMusicFileName = null;
            
            if (sheetMusicFile) {
                try {
                    console.log('Starting file upload for:', sheetMusicFile.name);
                    const formData = new FormData();
                    formData.append('file', sheetMusicFile);
                    
                    console.log('Making request to: http://localhost:5036/api/student/upload-sheet-music');
                    const uploadResponse = await fetch('http://localhost:5036/api/student/upload-sheet-music', {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${user.token}`
                        },
                        body: formData
                    });
                    
                    console.log('Upload response status:', uploadResponse.status);
                    const uploadResult = await uploadResponse.json();
                    console.log('Upload result:', uploadResult);
                    
                    if (uploadResult.success) {
                        sheetMusicFilePath = uploadResult.filePath;
                        sheetMusicFileName = uploadResult.fileName;
                        console.log('File uploaded successfully:', uploadResult);
                    } else {
                        throw new Error(uploadResult.error || 'File upload failed');
                    }
                } catch (error) {
                    console.error('File upload error:', error);
                    this.showBootstrapAlert('danger', `File upload failed: ${error.message}`);
                    return;
                }
            }

            // Book the lesson
            const response = await this.postDataWithAuth('/student/book-lesson', {
                LessonId: lessonId,
                StudentLessonType: preferredLessonType || null,
                SpecialRequests: specialRequests || null,
                SheetMusicFileName: sheetMusicFileName,
                SheetMusicFilePath: sheetMusicFilePath
            });

            if (response.success) {
                this.showBootstrapAlert('success', '🎉 Booking Successful!');
                
                // Close modal
                const modal = bootstrap.Modal.getInstance(document.getElementById('bookingModal'));
                modal.hide();
                
                // Refresh the lesson list
                setTimeout(() => {
                    this.showLessonBooking();
                }, 1000);
            } else {
                throw new Error(response.error || 'Failed to book lesson');
            }

        } catch (error) {
            this.showBootstrapAlert('danger', `Error booking lesson: ${error.message}`);
        }
    }

    // Show student's booked lessons
    async showMyBookings() {
        try {
            // Check if we're in the student profile context
            const studentContent = document.getElementById('studentContent');
            const app = document.getElementById('app');
            
            let targetElement;
            if (studentContent) {
                // We're in the student profile view, use studentContent
                targetElement = studentContent;
            } else if (app) {
                // We're in a full-page view, use app
                targetElement = app;
            } else {
                console.error('No target element found for bookings display');
                return;
            }

            // Show loading state
            targetElement.innerHTML = `
                <div class="card shadow">
                    <div class="card-header bg-info text-white d-flex justify-content-between align-items-center">
                        <h3 class="mb-0">📅 My Bookings</h3>
                        ${studentContent ? '<button class="btn btn-outline-light btn-sm" onclick="app.showUnifiedProfile(\'student\')"><i class="fas fa-arrow-left"></i> Back to Profile</button>' : ''}
                    </div>
                    <div class="card-body text-center">
                        <div class="spinner-border text-info" role="status">
                            <span class="visually-hidden">Loading...</span>
                        </div>
                        <p class="mt-3">Loading your bookings...</p>
                    </div>
                </div>
            `;

            // Fetch student's booked lessons using JWT authentication
            const response = await this.fetchWithAuth('/student/bookings');
            
            if (!response.success || !response.data) {
                throw new Error('Failed to load your bookings');
            }

            const bookings = response.data;
            
            if (bookings.length === 0) {
                targetElement.innerHTML = `
                    <div class="card shadow">
                        <div class="card-header bg-info text-white d-flex justify-content-between align-items-center">
                            <h3 class="mb-0">📅 My Bookings</h3>
                            ${studentContent ? '<button class="btn btn-outline-light btn-sm" onclick="app.showUnifiedProfile(\'student\')"><i class="fas fa-arrow-left"></i> Back to Profile</button>' : ''}
                        </div>
                        <div class="card-body text-center">
                            <div class="alert alert-info">
                                <h5>No Bookings Yet</h5>
                                <p>You haven't booked any lessons yet. Browse available lessons to get started!</p>
                                ${studentContent ? '<button class="btn btn-primary" onclick="app.showLessonBooking()">Browse Lessons</button>' : ''}
                            </div>
                        </div>
                    </div>
                `;
                return;
            }

            // Display bookings
            let html = `
                <div class="card shadow">
                    <div class="card-header bg-info text-white d-flex justify-content-between align-items-center">
                        <h3 class="mb-0">📅 My Bookings</h3>
                        <div class="d-flex gap-2">
                            <button class="btn btn-outline-light btn-sm" onclick="app.showLessonBooking()">
                                <i class="fas fa-plus"></i> Book More
                            </button>
                            ${studentContent ? '<button class="btn btn-outline-light btn-sm" onclick="app.showUnifiedProfile(\'student\')"><i class="fas fa-arrow-left"></i> Back to Profile</button>' : ''}
                        </div>
                    </div>
                    <div class="card-body">
                        <div class="table-responsive">
                            <table class="table table-striped table-hover">
                                <thead class="table-dark">
                                    <tr>
                                        <th>Teacher</th>
                                        <th>Instrument</th>
                                        <th>Type</th>
                                        <th>Date</th>
                                        <th>Start Time</th>
                                        <th>End Time</th>
                                        <th>Duration</th>
                                        <th>Status</th>
                                        <th>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
            `;

            bookings.forEach(booking => {
                // Parse dates from backend response
                const startDate = new Date(booking.StartTime);
                const endDate = new Date(booking.EndTime);
                
                const dateStr = startDate.toLocaleDateString();
                const startTimeStr = startDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
                const endTimeStr = endDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
                
                // Status badge styling
                let statusBadgeClass;
                switch (booking.Status) {
                    case 'Completed':
                        statusBadgeClass = 'bg-secondary';
                        break;
                    case 'In Progress':
                        statusBadgeClass = 'bg-warning';
                        break;
                    case 'Upcoming':
                        statusBadgeClass = 'bg-success';
                        break;
                    default:
                        statusBadgeClass = 'bg-secondary';
                }

                // Use the new lesson type system for display
                let displayLessonType = 'In-Person';
                let lessonTypeBadge = 'bg-success';
                
                if (booking.DisplayLessonType) {
                    displayLessonType = booking.DisplayLessonType;
                } else if (booking.StudentLessonType) {
                    displayLessonType = booking.StudentLessonType;
                } else if (booking.LessonTypeNew) {
                    displayLessonType = booking.LessonTypeNew;
                } else if (booking.LessonType) {
                    displayLessonType = booking.LessonType === 'virtual' ? 'Virtual' : 'In-Person';
                }
                
                // Set badge color based on lesson type
                if (displayLessonType === 'Virtual') {
                    lessonTypeBadge = 'bg-info';
                } else if (displayLessonType === 'Student Preference') {
                    lessonTypeBadge = 'bg-warning';
                } else {
                    lessonTypeBadge = 'bg-success';
                }
                
                // Determine if cancellation is allowed
                const canCancel = booking.CanCancel;

                html += `
                    <tr class="${booking.Status === 'Completed' ? 'table-secondary' : ''}">
                        <td><strong>${booking.TeacherName}</strong></td>
                        <td><span class="badge bg-secondary">${booking.Instrument}</span></td>
                        <td><span class="badge ${lessonTypeBadge}">${displayLessonType}</span></td>
                        <td><small>${dateStr}</small></td>
                        <td><small>${startTimeStr}</small></td>
                        <td><small>${endTimeStr}</small></td>
                        <td><span class="badge bg-light text-dark">${booking.Duration}</span></td>
                        <td><span class="badge ${statusBadgeClass}">${booking.Status}</span></td>
                        <td>
                            ${canCancel ? `
                                <button type="button" class="btn btn-outline-danger btn-sm" onclick="app.cancelBooking(${booking.Id})">
                                    <i class="fas fa-times"></i> Cancel
                                </button>
                            ` : `<span class="text-muted">${booking.Status === 'Completed' ? 'Completed' : 'Cannot Cancel'}</span>`}
                        </td>
                    </tr>
                `;
            });

            html += `
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            `;

            targetElement.innerHTML = html;

        } catch (error) {
            const studentContent = document.getElementById('studentContent');
            const app = document.getElementById('app');
            const targetElement = studentContent || app;
            
            if (targetElement) {
                targetElement.innerHTML = `
                    <div class="card shadow">
                        <div class="card-header bg-danger text-white">
                            <h3 class="mb-0">❌ Error</h3>
                        </div>
                        <div class="card-body">
                            <div class="alert alert-danger">
                                <h5>Unable to Load Bookings</h5>
                                <p>${error.message}</p>
                                ${studentContent ? '<button class="btn btn-primary" onclick="app.showUnifiedProfile(\'student\')">Back to Profile</button>' : ''}
                            </div>
                        </div>
                    </div>
                `;
            }
        }
    }

    // Cancel a booking
    async cancelBooking(lessonId) {
        try {
            const user = this.getCurrentUser();
            if (!user) {
                this.showBootstrapAlert('danger', 'Please log in to cancel lessons');
                return;
            }

            // Show confirmation
            const confirmed = confirm('Are you sure you want to cancel this lesson? This action cannot be undone.');
            if (!confirmed) return;

            // Cancel the lesson
            const response = await this.postDataWithAuth('/student/cancel-lesson', {
                LessonId: lessonId
            });

            if (response.success) {
                this.showBootstrapAlert('success', '✅ Lesson cancelled successfully. The teacher has been notified.');
                
                // Show notification for teachers if they're logged in
                const currentUser = this.getCurrentUser();
                if (currentUser && currentUser.role === 'teacher') {
                    // This would ideally get lesson details from the response
                    this.showCancellationNotification(
                        currentUser.name || 'Student', 
                        'the scheduled time', 
                        'lesson'
                    );
                }
                
                // Refresh the bookings list
                setTimeout(() => {
                    this.showMyBookings();
                }, 1000);
            } else {
                throw new Error(response.error || 'Failed to cancel lesson');
            }

        } catch (error) {
            this.showBootstrapAlert('danger', `Error cancelling lesson: ${error.message}`);
        }
    }

    async bookLesson(lessonId) {
        try {
            const user = this.getCurrentUser();
            if (!user) {
                this.showBootstrapAlert('danger', 'Please log in to book lessons');
                return;
            }

            // Show confirmation
            const confirmed = confirm('Are you sure you want to book this lesson?');
            if (!confirmed) return;

            // Book the lesson
            const response = await this.postDataWithAuth('/student/book-lesson', {
                LessonId: lessonId,
                StudentId: user.userId
            });

            if (response.success) {
                this.showBootstrapAlert('success', 'Lesson booked successfully!');
                // Refresh the available lessons list
                this.loadAvailableLessons();
            } else {
                throw new Error(response.error || 'Failed to book lesson');
            }

        } catch (error) {
            this.showBootstrapAlert('danger', `Error booking lesson: ${error.message}`);
        }
    }

    async loadScheduledLessonsList() {
        try {
            const listDiv = document.getElementById('scheduledLessonsList');
            
            if (!listDiv) {
                console.error('Scheduled lessons list container not found');
                return;
            }
            
            // Get all teacher lessons using JWT authentication
            const scheduleData = await this.getTeacherLessons();
            
            if (!scheduleData || scheduleData.length === 0) {
                listDiv.innerHTML = '<div class="text-center text-muted"><p>No lessons scheduled yet</p></div>';
                return;
            }
            
            let html = '<div class="table-responsive"><table class="table table-striped table-hover"><thead class="table-dark"><tr><th>Start Time</th><th>End Time</th><th>Duration</th><th>Instrument</th><th>Teacher</th><th>Rate</th><th>Mode</th><th>Student</th><th>Status</th><th>Actions</th></tr></thead><tbody>';
            
            scheduleData.forEach(lesson => {
                // Safely parse the time slot
                let startTime = 'Not provided';
                let endTime = 'Not provided';
                let duration = 'Not provided';
                let isPast = false;
                
                if (lesson.TimeSlot && lesson.TimeSlot.includes(' - ')) {
                    try {
                        const [start, end] = lesson.TimeSlot.split(' - ');
                        const startDate = new Date(start);
                        const endDate = new Date(end);
                        
                        if (!isNaN(startDate.getTime()) && !isNaN(endDate.getTime())) {
                            startTime = startDate.toLocaleString();
                            endTime = endDate.toLocaleString();
                            
                            // Calculate duration
                            const diffMs = endDate - startDate;
                            const diffMinutes = Math.floor(diffMs / (1000 * 60));
                            const hours = Math.floor(diffMinutes / 60);
                            const minutes = diffMinutes % 60;
                            
                            if (hours > 0) {
                                duration = `${hours}h ${minutes}m`;
                            } else {
                                duration = `${minutes}m`;
                            }
                            
                            // Check if lesson is in the past
                            isPast = startDate < new Date();
                        }
                    } catch (error) {
                        console.warn('Error parsing lesson time slot:', error);
                    }
                } else if (lesson.TimeSlot) {
                    try {
                        const startDate = new Date(lesson.TimeSlot);
                        if (!isNaN(startDate.getTime())) {
                            startTime = startDate.toLocaleString();
                            endTime = 'Not provided';
                            duration = 'Not provided';
                            isPast = startDate < new Date();
                        }
                    } catch (error) {
                        console.warn('Error parsing lesson time slot:', error);
                    }
                }
                
                // Safely get lesson details with fallbacks
                const instrument = lesson.Instrument || 'Not provided';
                const teacherName = lesson.TeacherName || 'Unknown Teacher';
                const rate = lesson.Price ? `$${lesson.Price.toFixed(2)}` : '$0.00';
                
                // Use the new lesson type system
                let displayLessonType = 'In-Person';
                let lessonTypeBadge = 'bg-success';
                
                if (lesson.DisplayLessonType) {
                    displayLessonType = lesson.DisplayLessonType;
                } else if (lesson.StudentLessonType) {
                    displayLessonType = lesson.StudentLessonType;
                } else if (lesson.LessonTypeNew) {
                    displayLessonType = lesson.LessonTypeNew;
                } else if (lesson.LessonType) {
                    displayLessonType = lesson.LessonType === 'virtual' ? 'Virtual' : 'In-Person';
                }
                
                // Set badge color based on lesson type
                if (displayLessonType === 'Virtual') {
                    lessonTypeBadge = 'bg-info';
                } else if (displayLessonType === 'Student Preference') {
                    lessonTypeBadge = 'bg-warning';
                } else {
                    lessonTypeBadge = 'bg-success';
                }
                
                const studentName = lesson.StudentName || (lesson.StudentId ? `Student ID: ${lesson.StudentId}` : 'Available');
                const statusBadge = lesson.StudentId ? 'bg-danger' : 'bg-success';
                const statusText = lesson.StudentId ? 'Booked' : 'Available';
                
                html += `
                    <tr class="${isPast ? 'table-secondary' : ''}">
                        <td><small>${startTime}</small></td>
                        <td><small>${endTime}</small></td>
                        <td><span class="badge bg-light text-dark">${duration}</span></td>
                        <td>${instrument}</td>
                        <td>${teacherName}</td>
                        <td><strong>${rate}</strong></td>
                        <td><span class="badge ${lessonTypeBadge}">${displayLessonType}</span></td>
                        <td>${studentName}</td>
                        <td><span class="badge ${statusBadge}">${statusText}</span></td>
                        <td>
                            <div class="d-flex gap-2">
                                <a href="#" class="text-primary text-decoration-none" onclick="app.editLesson(${lesson.Id}); return false;" ${isPast ? 'style="pointer-events: none; color: #6c757d !important;"' : ''}>
                                    Edit
                                </a>
                                <span class="text-muted">|</span>
                                <a href="#" class="text-danger text-decoration-none" onclick="app.deleteLesson(${lesson.Id}); return false;" ${isPast ? 'style="pointer-events: none; color: #6c757d !important;"' : ''}>
                                    Delete
                                </a>
                            </div>
                        </td>
                    </tr>
                `;
            });
            
            html += '</tbody></table></div>';
            listDiv.innerHTML = html;
        } catch (error) {
            console.error('Error loading scheduled lessons:', error);
            const listDiv = document.getElementById('scheduledLessonsList');
            if (listDiv) {
                listDiv.innerHTML = '<div class="alert alert-danger">Error loading scheduled lessons</div>';
            }
        }
    }

    async loadTeacherBookings() {
        try {
            const contentDiv = document.getElementById('teacherContent');
            contentDiv.innerHTML = '<div class="text-center"><div class="spinner-border" role="status"><span class="visually-hidden">Loading...</span></div></div>';
            
            const teacherId = prompt('Enter Teacher ID:');
            if (!teacherId) {
                contentDiv.innerHTML = '<div class="alert alert-warning">Teacher ID required</div>';
                return;
            }

            const bookings = await this.getTeacherBookings(teacherId);
            
            if (bookings.length === 0) {
                contentDiv.innerHTML = '<div class="alert alert-info">No bookings found for this teacher</div>';
                return;
            }

            let tableHtml = `
                <div class="card border-success">
                    <div class="card-header bg-success text-white">
                        <h5 class="mb-0">📅 My Bookings (Teacher ID: ${teacherId})</h5>
                    </div>
                    <div class="card-body">
                        <div class="table-responsive">
                            <table class="table table-striped table-hover">
                                <thead class="table-dark">
                                    <tr>
                                        <th>Booking ID</th>
                                        <th>Student ID</th>
                                        <th>Lesson ID</th>
                                        <th>Date</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
            `;
            bookings.forEach(booking => {
                tableHtml += `<tr><td>${booking.Id || 'N/A'}</td><td>${booking.StudentId || 'N/A'}</td><td>${booking.LessonId || 'N/A'}</td><td>${booking.LessonDate || 'N/A'}</td><td><span class="badge bg-info">${booking.Status || 'N/A'}</span></td></tr>`;
            });
            tableHtml += `
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            `;

            contentDiv.innerHTML = tableHtml;
        } catch (error) {
            document.getElementById('teacherContent').innerHTML = `<div class="alert alert-danger">Error: ${error.message}</div>`;
        }
    }

    // ==================== Student Views ====================

    showCreateStudentForm() {
        const contentDiv = document.getElementById('studentContent');
        contentDiv.innerHTML = `
            <div class="card shadow">
                <div class="card-header bg-info text-white">
                    <h5 class="mb-0">Create Student Profile</h5>
                </div>
                <div class="card-body">
                    <form id="createStudentForm">
                        <div class="mb-3">
                            <label class="form-label">Name *</label>
                            <input type="text" class="form-control" id="studentName" required placeholder="e.g., Alice Johnson">
                            <small class="form-text text-muted">Full name of the student</small>
                        </div>
                        <div class="mb-3">
                            <label class="form-label">Email *</label>
                            <input type="email" class="form-control" id="studentEmail" required placeholder="student@example.com">
                            <small class="form-text text-muted">Valid email address</small>
                        </div>
                        <div class="mb-3">
                            <label class="form-label">Instrument(s) I play *</label>
                            <input type="text" class="form-control" id="studentInstrument" required placeholder="e.g., Piano, Guitar, Violin">
                            <small class="form-text text-muted">What instrument(s) do you play?</small>
                        </div>
                        <div class="mb-3">
                            <label class="form-label">Card Number</label>
                            <input type="text" class="form-control" id="studentCardNumber" maxlength="16" placeholder="1234567890123456">
                            <small class="form-text text-muted">16-digit card number (optional)</small>
                        </div>
                        <div class="mb-3">
                            <label class="form-label">Expiry Date</label>
                            <input type="text" class="form-control" id="studentExpiryDate" maxlength="5" placeholder="MM/YY">
                            <small class="form-text text-muted">Format: MM/YY (e.g., 12/25)</small>
                        </div>
                        <div class="mb-3">
                            <label class="form-label">CVV</label>
                            <input type="text" class="form-control" id="studentCVV" maxlength="4" placeholder="123">
                            <small class="form-text text-muted">3-4 digit security code (optional)</small>
                        </div>
                        <button type="submit" class="btn btn-info w-100">Create Student</button>
                    </form>
                </div>
            </div>
        `;

        // Add formatting for card number and expiry date
        document.getElementById('studentCardNumber').addEventListener('input', (e) => {
            e.target.value = e.target.value.replace(/\D/g, '').substring(0, 16);
        });

        document.getElementById('studentExpiryDate').addEventListener('input', (e) => {
            let value = e.target.value.replace(/\D/g, '');
            if (value.length >= 2) {
                value = value.substring(0, 2) + '/' + value.substring(2, 4);
            }
            e.target.value = value;
        });

        document.getElementById('studentCVV').addEventListener('input', (e) => {
            e.target.value = e.target.value.replace(/\D/g, '');
        });

        document.getElementById('createStudentForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            // Client-side validation
            const name = document.getElementById('studentName').value.trim();
            const email = document.getElementById('studentEmail').value.trim();
            const instrument = document.getElementById('studentInstrument').value.trim();
            const cardNumber = document.getElementById('studentCardNumber').value.replace(/\s/g, '');
            const expiryDate = document.getElementById('studentExpiryDate').value;
            const cvv = document.getElementById('studentCVV').value.trim();
            
            // Validation checks
            if (!name || name.length < 2) {
                this.showBootstrapAlert('warning', 'Please enter a valid name (at least 2 characters)');
                return;
            }
            
            if (!email || !email.includes('@')) {
                this.showBootstrapAlert('warning', 'Please enter a valid email address');
                return;
            }
            
            if (!instrument || instrument.length < 2) {
                this.showBootstrapAlert('warning', 'Please enter the instrument(s) you play');
                return;
            }
            
            // If card number is provided, validate it (16 digits only, no Luhn check)
            if (cardNumber) {
                if (cardNumber.length !== 16 || !/^\d+$/.test(cardNumber)) {
                    this.showBootstrapAlert('warning', 'Card number must be exactly 16 digits');
                    return;
                }
            }
            
            // If expiry date is provided, validate it
            if (expiryDate) {
                if (!this.validateExpiryDate(expiryDate)) {
                    this.showBootstrapAlert('warning', 'Invalid expiry date. Format: MM/YY and must be in the future');
                    return;
                }
            }
            
            // If CVV is provided, validate length
            if (cvv && (cvv.length < 3 || cvv.length > 4)) {
                this.showBootstrapAlert('warning', 'CVV must be 3-4 digits');
                return;
            }
            
            const submitBtn = e.target.querySelector('button[type="submit"]');
            const originalBtnText = submitBtn.innerHTML;
            
            // Disable button and show loading
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Creating...';
            this.showLoadingOverlay();
            
            const data = {
                Name: name,
                Email: email,
                Instrument: instrument,
                CardNumber: cardNumber || null,
                ExpiryDate: expiryDate || null,
                Pin: pin || null,
                Pin: pin || null
            };
            
            try {
                const result = await this.createStudent(data);
                this.hideLoadingOverlay();
                this.showBootstrapAlert('success', 'Student created successfully!');
                contentDiv.innerHTML = `
                    <div class="alert alert-success">
                        <h5>✓ Student Profile Created</h5>
                        <p class="mb-0">Name: ${name}<br>Email: ${email}<br>Instrument: ${instrument}</p>
                    </div>
                `;
            } catch (error) {
                this.hideLoadingOverlay();
                this.showBootstrapAlert('danger', `Error: ${error.message}`);
            } finally {
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalBtnText;
            }
        });
    }

    async showEditStudentProfile() {
        const contentDiv = document.getElementById('studentContent');
        
        // Show loading state
        contentDiv.innerHTML = `
            <div class="card shadow">
                <div class="card-header bg-info text-white">
                    <h5 class="mb-0">Edit Student Profile</h5>
                </div>
                <div class="card-body text-center">
                    <div class="spinner-border text-info" role="status">
                        <span class="visually-hidden">Loading...</span>
                    </div>
                    <p class="mt-3">Loading your profile...</p>
                </div>
            </div>
        `;

        try {
            // Get current user's email from JWT
            const user = this.getCurrentUser();
            if (!user || !user.email) {
                throw new Error('Unable to get user information');
            }

            // Fetch current student profile
            const response = await this.getStudentByEmail(user.email);
            
            if (!response.success || !response.data) {
                throw new Error('No profile found for your account');
            }

            const student = response.data;
            
            // Show edit form with pre-filled data
            contentDiv.innerHTML = `
                <div class="card shadow">
                    <div class="card-header bg-info text-white">
                        <h5 class="mb-0">Edit Student Profile</h5>
                    </div>
                    <div class="card-body">
                        <form id="editStudentForm">
                            <div class="mb-3">
                                <label class="form-label">Name *</label>
                                <input type="text" class="form-control" id="editStudentName" required value="${student.Name}">
                                <small class="form-text text-muted">Full name of the student</small>
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Email *</label>
                                <input type="email" class="form-control" id="editStudentEmail" required value="${student.Email}">
                                <small class="form-text text-muted">Valid email address</small>
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Instrument(s) I play *</label>
                                <input type="text" class="form-control" id="editStudentInstrument" required value="${student.Instrument || ''}" placeholder="e.g., Piano, Guitar, Violin">
                                <small class="form-text text-muted">What instrument(s) do you play?</small>
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Card Number</label>
                                <input type="text" class="form-control" id="editStudentCardNumber" maxlength="14" value="${student.CardNumber || ''}" placeholder="12345678901234">
                                <small class="form-text text-muted">14-digit card number (optional)</small>
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Expiry Date</label>
                                <input type="text" class="form-control" id="editStudentExpiryDate" maxlength="5" value="${student.ExpiryDate || ''}" placeholder="MM/YY">
                                <small class="form-text text-muted">Format: MM/YY (e.g., 12/25)</small>
                            </div>
                            <div class="mb-3">
                                <label class="form-label">PIN</label>
                                <input type="password" class="form-control" id="editStudentPin" maxlength="4" value="${student.Pin || ''}" placeholder="1234">
                                <small class="form-text text-muted">3 or 4 digit PIN (optional)</small>
                            </div>
                            <button type="submit" class="btn btn-info w-100" id="updateStudentBtn">Update Profile</button>
                        </form>
                    </div>
                </div>
            `;
            
            this.attachStudentEditFormListeners(student.Id);
        } catch (error) {
            this.hideLoadingOverlay();
            this.showBootstrapAlert('danger', `Error: ${error.message}`);
            contentDiv.innerHTML = `
                <div class="alert alert-danger">
                    <h5>❌ Error Loading Profile</h5>
                    <p>${error.message}</p>
                    <button class="btn btn-primary" onclick="app.showStudentPortal()">Back to Portal</button>
                </div>
            `;
        }
    }
    
    attachStudentEditFormListeners(studentId) {
        const contentDiv = document.getElementById('studentContent');
        
        // Add formatting for card number and expiry date
        document.getElementById('editStudentCardNumber').addEventListener('input', (e) => {
            e.target.value = e.target.value.replace(/\D/g, '').substring(0, 16);
        });

        document.getElementById('editStudentExpiryDate').addEventListener('input', (e) => {
            let value = e.target.value.replace(/\D/g, '');
            if (value.length >= 2) {
                value = value.substring(0, 2) + '/' + value.substring(2, 4);
            }
            e.target.value = value;
        });

        document.getElementById('editStudentForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const name = document.getElementById('editStudentName').value.trim();
            const email = document.getElementById('editStudentEmail').value.trim();
            const instrument = document.getElementById('editStudentInstrument').value.trim();
            const cardNumber = document.getElementById('editStudentCardNumber').value.replace(/\s/g, '');
            const expiryDate = document.getElementById('editStudentExpiryDate').value;
            const pin = document.getElementById('editStudentPin').value;
            
            // Validation
            if (!name || name.length < 2) {
                this.showBootstrapAlert('warning', 'Please enter a valid name (at least 2 characters)');
                return;
            }
            
            if (!email || !email.includes('@')) {
                this.showBootstrapAlert('warning', 'Please enter a valid email address');
                return;
            }
            
            if (!instrument || instrument.length < 2) {
                this.showBootstrapAlert('warning', 'Please enter the instrument(s) you play');
                return;
            }
            
            if (cardNumber && (cardNumber.length !== 14 || !/^\d+$/.test(cardNumber))) {
                this.showBootstrapAlert('warning', 'Card number must be exactly 14 digits');
                return;
            }
            
            if (pin && (pin.length < 3 || pin.length > 4 || !/^\d+$/.test(pin))) {
                this.showBootstrapAlert('warning', 'PIN must be 3 or 4 digits');
                return;
            }
            
            if (expiryDate && !this.validateExpiryDate(expiryDate)) {
                this.showBootstrapAlert('warning', 'Invalid expiry date. Format: MM/YY and must be in the future');
                return;
            }
            
            const submitBtn = document.getElementById('updateStudentBtn');
            const originalBtnText = submitBtn.innerHTML;
            
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Updating...';
            this.showLoadingOverlay();
            
            const data = {
                StudentId: studentId,
                Name: name,
                Email: email,
                Instrument: instrument,
                CardNumber: cardNumber || null,
                ExpiryDate: expiryDate || null,
                Pin: pin || null
            };
            
            try {
                const result = await this.updateStudentProfile(data);
                this.hideLoadingOverlay();
                this.showBootstrapAlert('success', 'Student profile updated successfully!');
                
                // Re-render the profile view with updated data
                setTimeout(() => {
                    this.showUnifiedProfile('student');
                }, 1000);
            } catch (error) {
                this.hideLoadingOverlay();
                this.showBootstrapAlert('danger', `Error: ${error.message}`);
            } finally {
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalBtnText;
            }
        });
    }
    
    // Keep old implementation for backward compatibility but it now just references the new one
    showEditStudentProfileOld() {
        const contentDiv = document.getElementById('studentContent');
        contentDiv.innerHTML = `
            <div class="card shadow">
                <div class="card-header bg-info text-white">
                    <h5 class="mb-0">Edit Student Profile</h5>
                </div>
                <div class="card-body">
                    <form id="editStudentFormOld">
                        <div class="mb-3">
                            <label class="form-label">Student ID *</label>
                            <input type="number" class="form-control" id="editStudentIdOld" required min="1" placeholder="Enter your Student ID">
                            <small class="form-text text-muted">Your student identification number</small>
                        </div>
                        <div class="mb-3">
                            <label class="form-label">Name *</label>
                            <input type="text" class="form-control" id="editStudentNameOld" required placeholder="e.g., Alice Johnson">
                            <small class="form-text text-muted">Full name of the student</small>
                        </div>
                        <div class="mb-3">
                            <label class="form-label">Email *</label>
                            <input type="email" class="form-control" id="editStudentEmailOld" required placeholder="student@example.com">
                            <small class="form-text text-muted">Valid email address</small>
                        </div>
                        <div class="mb-3">
                            <label class="form-label">Instrument(s) I play *</label>
                            <input type="text" class="form-control" id="editStudentInstrumentOld" required placeholder="e.g., Piano, Guitar, Violin">
                            <small class="form-text text-muted">What instrument(s) do you play?</small>
                        </div>
                        <div class="mb-3">
                            <label class="form-label">Card Number</label>
                            <input type="text" class="form-control" id="editStudentCardNumberOld" maxlength="14" placeholder="12345678901234">
                            <small class="form-text text-muted">14-digit card number (optional)</small>
                        </div>
                        <div class="mb-3">
                            <label class="form-label">Expiry Date</label>
                            <input type="text" class="form-control" id="editStudentExpiryDateOld" maxlength="5" placeholder="MM/YY">
                            <small class="form-text text-muted">Format: MM/YY (e.g., 12/25)</small>
                        </div>
                        <div class="mb-3">
                            <label class="form-label">PIN</label>
                            <input type="password" class="form-control" id="editStudentPinOld" maxlength="4" placeholder="1234">
                            <small class="form-text text-muted">3 or 4 digit PIN (optional)</small>
                        </div>
                        <button type="submit" class="btn btn-info w-100" id="updateStudentBtnOld">Update Profile</button>
                    </form>
                </div>
            </div>
        `;

        // Add formatting for card number and expiry date
        document.getElementById('editStudentCardNumber').addEventListener('input', (e) => {
            e.target.value = e.target.value.replace(/\D/g, '').replace(/(.{4})/g, '$1 ').trim();
        });

        document.getElementById('editStudentExpiryDate').addEventListener('input', (e) => {
            let value = e.target.value.replace(/\D/g, '');
            if (value.length >= 2) {
                value = value.substring(0, 2) + '/' + value.substring(2, 4);
            }
            e.target.value = value;
        });

        document.getElementById('editStudentForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const studentId = parseInt(document.getElementById('editStudentId').value);
            const name = document.getElementById('editStudentName').value.trim();
            const email = document.getElementById('editStudentEmail').value.trim();
            const cardNumber = document.getElementById('editStudentCardNumber').value.replace(/\s/g, '');
            const expiryDate = document.getElementById('editStudentExpiryDate').value;
            const pin = document.getElementById('editStudentPin').value;
            
            // Validation
            if (!name || name.length < 2) {
                this.showBootstrapAlert('warning', 'Please enter a valid name (at least 2 characters)');
                return;
            }
            
            if (!email || !email.includes('@')) {
                this.showBootstrapAlert('warning', 'Please enter a valid email address');
                return;
            }
            
            if (cardNumber && !this.validateCardNumber(cardNumber)) {
                this.showBootstrapAlert('warning', 'Invalid card number (Luhn check failed)');
                return;
            }
            
            if (pin && (pin.length < 3 || pin.length > 4 || !/^\d+$/.test(pin))) {
                this.showBootstrapAlert('warning', 'PIN must be 3 or 4 digits');
                return;
            }
            
            if (expiryDate && !this.validateExpiryDate(expiryDate)) {
                this.showBootstrapAlert('warning', 'Invalid expiry date. Format: MM/YY and must be in the future');
                return;
            }
            
            const submitBtn = document.getElementById('updateStudentBtn');
            const originalBtnText = submitBtn.innerHTML;
            
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Updating...';
            this.showLoadingOverlay();
            
            const data = {
                StudentId: studentId,
                Name: name,
                Email: email,
                Instrument: instrument,
                CardNumber: cardNumber || null,
                ExpiryDate: expiryDate || null,
                Pin: pin || null
            };
            
            try {
                const result = await this.updateStudentProfile(data);
                this.hideLoadingOverlay();
                this.showBootstrapAlert('success', 'Student profile updated successfully!');
                
                // Show updated info
                setTimeout(() => {
                    contentDiv.innerHTML = `
                        <div class="alert alert-success">
                            <h5>✓ Profile Updated</h5>
                            <p class="mb-0">Name: ${name}<br>Email: ${email}</p>
                        </div>
                    `;
                }, 1000);
            } catch (error) {
                this.hideLoadingOverlay();
                this.showBootstrapAlert('danger', `Error: ${error.message}`);
            } finally {
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalBtnText;
            }
        });
    }
    
    async handleQuickBooking() {
        const studentId = document.getElementById('quickStudentId').value;
        const lessonId = document.getElementById('quickLessonId').value;
        const confirmBtn = document.getElementById('confirmBookingBtn');
        const spinner = document.getElementById('bookingSpinner');
        
        if (!studentId || studentId < 1) {
            this.showBootstrapAlert('warning', 'Please enter a valid student ID');
            return;
        }
        
        confirmBtn.disabled = true;
        spinner.classList.remove('d-none');
        
        try {
            const data = {
                StudentId: parseInt(studentId),
                LessonId: parseInt(lessonId)
            };
            
            const result = await this.bookLesson(data);
            
            // Close modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('bookingModal'));
            modal.hide();
            
            this.showBootstrapAlert('success', 'Lesson booked successfully!');
            
            // Reload available lessons
            await this.loadAvailableLessons();
        } catch (error) {
            this.showBootstrapAlert('danger', `Error: ${error.message}`);
        } finally {
            confirmBtn.disabled = false;
            spinner.classList.add('d-none');
            document.getElementById('quickStudentId').value = '';
        }
    }

    showBookingForm() {
        const contentDiv = document.getElementById('studentContent');
        contentDiv.innerHTML = `
            <div class="card shadow">
                <div class="card-header bg-info text-white">
                    <h5 class="mb-0">Book a Lesson</h5>
                </div>
                <div class="card-body">
                    <form id="bookingForm">
                        <div class="mb-3">
                            <label class="form-label">Student ID *</label>
                            <input type="number" class="form-control" id="bookingStudentId" required min="1" placeholder="e.g., 1">
                            <small class="form-text text-muted">Your student identification number</small>
                        </div>
                        <div class="mb-3">
                            <label class="form-label">Lesson ID *</label>
                            <input type="number" class="form-control" id="bookingLessonId" required min="1" placeholder="e.g., 3">
                            <small class="form-text text-muted">ID of the lesson you want to book (check available lessons first)</small>
                        </div>
                        <button type="submit" class="btn btn-info w-100">Book Lesson</button>
                    </form>
                </div>
            </div>
        `;

        document.getElementById('bookingForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            // Client-side validation
            const studentId = parseInt(document.getElementById('bookingStudentId').value);
            const lessonId = parseInt(document.getElementById('bookingLessonId').value);
            
            // Validation checks
            if (!studentId || studentId < 1) {
                this.showBootstrapAlert('warning', 'Please enter a valid student ID');
                return;
            }
            
            if (!lessonId || lessonId < 1) {
                this.showBootstrapAlert('warning', 'Please enter a valid lesson ID');
                return;
            }
            
            const submitBtn = e.target.querySelector('button[type="submit"]');
            const originalBtnText = submitBtn.innerHTML;
            
            // Disable button and show loading
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Booking...';
            this.showLoadingOverlay();
            
            const data = {
                StudentId: studentId,
                LessonId: lessonId
            };
            
            try {
                const result = await this.bookLesson(data);
                this.hideLoadingOverlay();
                this.showBootstrapAlert('success', 'Lesson booked successfully!');
                contentDiv.innerHTML = `
                    <div class="alert alert-success">
                        <h5>✓ Lesson Booked Successfully</h5>
                        <p class="mb-0">Student ID: ${studentId}<br>Lesson ID: ${lessonId}</p>
                    </div>
                `;
            } catch (error) {
                this.hideLoadingOverlay();
                this.showBootstrapAlert('danger', `Error: ${error.message}`);
            } finally {
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalBtnText;
            }
        });
    }

    // ==================== Validation Functions ====================

    validateCardNumber(cardNumber) {
        // Remove non-digits
        const cleaned = cardNumber.replace(/\D/g, '');
        
        if (cleaned.length < 13 || cleaned.length > 19) {
            return false;
        }

        // Luhn algorithm
        let sum = 0;
        let isEven = false;

        for (let i = cleaned.length - 1; i >= 0; i--) {
            let digit = parseInt(cleaned[i]);

            if (isEven) {
                digit *= 2;
                if (digit > 9) {
                    digit -= 9;
                }
            }

            sum += digit;
            isEven = !isEven;
        }

        return sum % 10 === 0;
    }

    validateExpiryDate(expiryDate) {
        // Format: MM/YY
        const regex = /^(\d{2})\/(\d{2})$/;
        const match = expiryDate.match(regex);
        
        if (!match) {
            return false;
        }

        const month = parseInt(match[1]);
        const year = 2000 + parseInt(match[2]); // Convert YY to YYYY

        if (month < 1 || month > 12) {
            return false;
        }

        // Check if date is in the future
        const expiry = new Date(year, month, 0); // Last day of the month
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        return expiry >= today;
    }

    // ==================== API Helper Methods ====================

    async fetchData(endpoint) {
        try {
            const response = await fetch(`${this.apiUrl}${endpoint}`);
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: 'Network response was not ok' }));
                throw new Error(errorData.error || 'Network response was not ok');
            }
            
            const result = await response.json();
            
            // Check if API returned an error
            if (result.success === false) {
                throw new Error(result.error || 'Unknown error occurred');
            }
            
            return result;
        } catch (error) {
            console.error('API Error:', error);
            this.showBootstrapAlert('danger', error.message || 'An error occurred while fetching data');
            throw error;
        }
    }

    async postData(endpoint, data) {
        try {
            const response = await fetch(`${this.apiUrl}${endpoint}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            });
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: 'Network response was not ok' }));
                throw new Error(errorData.error || 'Network response was not ok');
            }
            
            const result = await response.json();
            
            // Check if API returned an error
            if (result.success === false) {
                throw new Error(result.error || 'Unknown error occurred');
            }
            
            return result;
        } catch (error) {
            console.error('API Error:', error);
            this.showBootstrapAlert('danger', error.message || 'An error occurred while posting data');
            throw error;
        }
    }

    async putData(endpoint, data) {
        try {
            const response = await fetch(`${this.apiUrl}${endpoint}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            });
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: 'Network response was not ok' }));
                throw new Error(errorData.error || 'Network response was not ok');
            }
            
            const result = await response.json();
            
            // Check if API returned an error
            if (result.success === false) {
                throw new Error(result.error || 'Unknown error occurred');
            }
            
            return result;
        } catch (error) {
            console.error('API Error:', error);
            this.showBootstrapAlert('danger', error.message || 'An error occurred while updating data');
            throw error;
        }
    }

    async deleteData(endpoint) {
        try {
            const response = await fetch(`${this.apiUrl}${endpoint}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                }
            });
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: 'Network response was not ok' }));
                throw new Error(errorData.error || 'Network response was not ok');
            }
            
            const result = await response.json();
            
            // Check if API returned an error
            if (result.success === false) {
                throw new Error(result.error || 'Unknown error occurred');
            }
            
            return result;
        } catch (error) {
            console.error('API Error:', error);
            this.showBootstrapAlert('danger', error.message || 'An error occurred while deleting data');
            throw error;
        }
    }

    // JWT-based API methods
    async fetchWithAuth(endpoint) {
        try {
            const token = localStorage.getItem('authToken') || localStorage.getItem('token') || sessionStorage.getItem('authToken') || sessionStorage.getItem('token');
            if (!token) {
                throw new Error('No authentication token found');
            }

            const response = await fetch(`${this.apiUrl}${endpoint}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });
            
            // Handle 401 Unauthorized responses specifically
            if (response.status === 401) {
                const errorData = await response.json().catch(() => ({ error: 'Invalid or expired token' }));
                throw new Error('Token expired, please log in again');
            }
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: 'Network response was not ok' }));
                throw new Error(errorData.error || 'Network response was not ok');
            }
            
            const result = await response.json();
            
            // Check if API returned an error
            if (result.success === false) {
                throw new Error(result.error || 'Unknown error occurred');
            }
            
            return result;
        } catch (error) {
            console.error('API Error:', error);
            this.showBootstrapAlert('danger', error.message || 'An error occurred while fetching data');
            throw error;
        }
    }

    async postDataWithAuth(endpoint, data) {
        try {
            // Read the current token from localStorage right before the request
            const token = localStorage.getItem('authToken') || localStorage.getItem('token') || sessionStorage.getItem('authToken') || sessionStorage.getItem('token');
            if (!token) {
                throw new Error('No authentication token found');
            }

            const response = await fetch(`${this.apiUrl}${endpoint}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(data)
            });
            
            // Handle 401 Unauthorized responses specifically
            if (response.status === 401) {
                const errorData = await response.json().catch(() => ({ error: 'Invalid or expired token' }));
                throw new Error('Token expired, please log in again');
            }
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: 'Network response was not ok' }));
                throw new Error(errorData.error || 'Network response was not ok');
            }
            
            const result = await response.json();
            
            // Check if API returned an error
            if (result.success === false) {
                throw new Error(result.error || 'Unknown error occurred');
            }
            
            return result;
        } catch (error) {
            console.error('API Error:', error);
            this.showBootstrapAlert('danger', error.message || 'An error occurred while posting data');
            throw error;
        }
    }

    async putDataWithAuth(endpoint, data) {
        try {
            const token = localStorage.getItem('authToken') || localStorage.getItem('token') || sessionStorage.getItem('authToken') || sessionStorage.getItem('token');
            if (!token) {
                throw new Error('No authentication token found');
            }

            const response = await fetch(`${this.apiUrl}${endpoint}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(data)
            });
            
            // Handle 401 Unauthorized responses specifically
            if (response.status === 401) {
                const errorData = await response.json().catch(() => ({ error: 'Invalid or expired token' }));
                throw new Error('Token expired, please log in again');
            }
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: 'Network response was not ok' }));
                throw new Error(errorData.error || 'Network response was not ok');
            }
            
            const result = await response.json();
            
            // Check if API returned an error
            if (result.success === false) {
                throw new Error(result.error || 'Unknown error occurred');
            }
            
            return result;
        } catch (error) {
            console.error('API Error:', error);
            this.showBootstrapAlert('danger', error.message || 'An error occurred while updating data');
            throw error;
        }
    }

    async deleteDataWithAuth(endpoint) {
        try {
            const token = localStorage.getItem('authToken') || localStorage.getItem('token') || sessionStorage.getItem('authToken') || sessionStorage.getItem('token');
            if (!token) {
                throw new Error('No authentication token found');
            }

            const response = await fetch(`${this.apiUrl}${endpoint}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });
            
            // Handle 401 Unauthorized responses specifically
            if (response.status === 401) {
                const errorData = await response.json().catch(() => ({ error: 'Invalid or expired token' }));
                throw new Error('Token expired, please log in again');
            }
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: 'Network response was not ok' }));
                throw new Error(errorData.error || 'Network response was not ok');
            }
            
            const result = await response.json();
            
            // Check if API returned an error
            if (result.success === false) {
                throw new Error(result.error || 'Unknown error occurred');
            }
            
            return result;
        } catch (error) {
            console.error('API Error:', error);
            this.showBootstrapAlert('danger', error.message || 'An error occurred while deleting data');
            throw error;
        }
    }

    // Helper method to show Bootstrap alert
    showBootstrapAlert(type, message) {
        const alertContainer = document.getElementById('alertContainer');
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type} alert-dismissible fade show mt-2 shadow`;
        alertDiv.setAttribute('role', 'alert');
        
        // Different colors for different alert types
        const icons = {
            'success': '✓ ',
            'danger': '✗ ',
            'warning': '⚠ ',
            'info': 'ℹ '
        };
        
        alertDiv.innerHTML = `
            <strong>${icons[type] || ''}</strong>${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        `;
        
        // Insert alert in the alert container
        alertContainer.appendChild(alertDiv);
        
        // Auto-dismiss after 5 seconds
        setTimeout(() => {
            if (alertDiv.parentNode) {
                const bsAlert = new bootstrap.Alert(alertDiv);
                bsAlert.close();
            }
        }, 5000);
    }

    async showLessonDetails(lessonId) {
        try {
            // Get lesson details from teacher lessons
            const response = await this.fetchWithAuth('/teacher/lessons');
            if (!response.success || !response.data) {
                throw new Error('Failed to load lesson details');
            }
            
            const lesson = response.data.find(l => l.Id === lessonId);
            if (!lesson) {
                throw new Error('Lesson not found');
            }

            // Create modal HTML
                const modalHtml = `
                    <div class="modal fade" id="lessonDetailsModal" tabindex="-1" aria-labelledby="lessonDetailsModalLabel">
                        <div class="modal-dialog modal-lg">
                            <div class="modal-content">
                                <div class="modal-header bg-primary text-white">
                                    <h5 class="modal-title" id="lessonDetailsModalLabel">
                                        <i class="fas fa-info-circle"></i> Lesson Details
                                    </h5>
                                    <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
                                </div>
                            <div class="modal-body">
                                <div class="row">
                                    <div class="col-md-6">
                                        <h6 class="text-primary">Student Information</h6>
                                        <p><strong>Student:</strong> ${lesson.StudentName || 'Unknown Student'}</p>
                                        <p><strong>Instrument:</strong> ${lesson.Instrument}</p>
                                        <p><strong>Lesson Type:</strong> ${lesson.DisplayLessonType || lesson.StudentLessonType || lesson.LessonTypeNew || 'In-Person'}</p>
                                    </div>
                                    <div class="col-md-6">
                                        <h6 class="text-primary">Lesson Schedule</h6>
                                        <p><strong>Date & Time:</strong> ${lesson.TimeSlot}</p>
                                        <p><strong>Price:</strong> $${lesson.Price ? lesson.Price.toFixed(2) : '0.00'}</p>
                                        ${lesson.Notes ? `<p><strong>Notes:</strong> ${lesson.Notes}</p>` : ''}
                                    </div>
                                </div>
                                
                                <hr>
                                
                                <div class="row">
                                    <div class="col-12">
                                        <h6 class="text-primary">Special Requests</h6>
                                        ${lesson.SpecialRequests ? 
                                            `<div class="alert alert-info">
                                                <i class="fas fa-comment"></i> ${lesson.SpecialRequests}
                                            </div>` : 
                                            `<div class="alert alert-light">
                                                <i class="fas fa-info"></i> No special requests provided
                                            </div>`
                                        }
                                    </div>
                                </div>
                                
                                <div class="row">
                                    <div class="col-12">
                                        <h6 class="text-primary">Sheet Music</h6>
                                        ${lesson.SheetMusicFileName ? 
                                            `<div class="alert alert-success">
                                                <i class="fas fa-file-music"></i> 
                                                <strong>File:</strong> ${lesson.SheetMusicFileName}
                                                <br>
                                                <a href="${lesson.SheetMusicFilePath}" class="btn btn-outline-success btn-sm mt-2" download="${lesson.SheetMusicFileName}">
                                                    <i class="fas fa-download"></i> Download Sheet Music
                                                </a>
                                            </div>` : 
                                            `<div class="alert alert-light">
                                                <i class="fas fa-info"></i> No sheet music provided
                                            </div>`
                                        }
                                    </div>
                                </div>
                            </div>
                            <div class="modal-footer">
                                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                            </div>
                        </div>
                    </div>
                </div>
            `;

            // Remove existing modal if it exists
            const existingModal = document.getElementById('lessonDetailsModal');
            if (existingModal) {
                existingModal.remove();
            }

            // Add modal to body
            document.body.insertAdjacentHTML('beforeend', modalHtml);

                // Show modal
                const modalElement = document.getElementById('lessonDetailsModal');
                const modal = new bootstrap.Modal(modalElement);
                
                // Fix accessibility issue by removing aria-hidden when modal is shown
                modalElement.addEventListener('shown.bs.modal', function () {
                    modalElement.removeAttribute('aria-hidden');
                });
                
                modalElement.addEventListener('hidden.bs.modal', function () {
                    modalElement.setAttribute('aria-hidden', 'true');
                });
                
                modal.show();

        } catch (error) {
            this.showBootstrapAlert('danger', `Error loading lesson details: ${error.message}`);
        }
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new FreelanceMusicApp();
});
