const App = {
    state: {
        user: null, // Will store { username, role, token }
        currentView: 'dashboard',
        filters: {
            feeYear: '2025',
            feeMonth: 'December'
        }
    },

    init() {
        this.checkSession();
        this.bindEvents();
    },

    // --- Authentication ---

    checkSession() {
        // Check for token in URL
        const urlParams = new URLSearchParams(window.location.search);
        const token = urlParams.get('token');

        if (token) {
            // Attempt token-based authentication
            const result = store.authenticateByToken(token);
            if (result.success) {
                this.state.user = result.user;
                sessionStorage.setItem('dm_user', JSON.stringify(result.user));
                // Clean URL
                window.history.replaceState({}, document.title, window.location.pathname);
                this.showApp();
                return;
            }
        }

        // Check for existing session
        const userJson = sessionStorage.getItem('dm_user');
        if (userJson) {
            this.state.user = JSON.parse(userJson);
            this.showApp();
        } else {
            this.showLogin();
        }
    },

    login(username, password) {
        const result = store.authenticateUser(username, password);
        if (result.success) {
            this.state.user = result.user;
            sessionStorage.setItem('dm_user', JSON.stringify(result.user));
            this.showApp();
        } else {
            alert('Invalid credentials!');
        }
    },

    logout() {
        this.state.user = null;
        sessionStorage.removeItem('dm_user');
        this.showLogin();
    },

    // --- Navigation & Routing ---

    showLogin() {
        document.getElementById('login-view').classList.remove('hidden');
        document.getElementById('app-layout').classList.add('hidden');
    },

    showApp() {
        document.getElementById('login-view').classList.add('hidden');
        document.getElementById('app-layout').classList.remove('hidden');

        // Show/hide Users menu based on role
        const usersNavLink = document.getElementById('users-nav-link');
        if (usersNavLink) {
            if (this.state.user && this.state.user.role === 'Admin') {
                usersNavLink.style.display = 'flex';
            } else {
                usersNavLink.style.display = 'none';
            }
        }

        this.navigateTo('dashboard');
    },

    navigateTo(view) {
        this.state.currentView = view;

        // Update Sidebar
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.toggle('active', link.dataset.view === view);
        });

        // Update Header
        const titles = {
            dashboard: 'Dashboard',
            students: 'Student Management',
            fees: 'Fees & Finance',
            reports: 'Financial Reports',
            users: 'User Management'
        };
        document.getElementById('page-title').innerText = titles[view];

        // Render View
        this.renderView(view);
    },

    renderView(view) {
        const container = document.getElementById('view-container');
        container.innerHTML = ''; // Clear content
        container.classList.remove('fade-in');
        void container.offsetWidth; // Trigger reflow
        container.classList.add('fade-in');

        if (view === 'dashboard') this.renderDashboard(container);
        else if (view === 'students') this.renderStudents(container);
        else if (view === 'fees') this.renderFees(container);
        else if (view === 'reports') this.renderReports(container);
        else if (view === 'users') this.renderUsers(container);

        feather.replace();
    },

    // --- Dashboard View ---

    renderDashboard(container) {
        const metrics = store.getMetrics();

        container.innerHTML = `
            <div class="grid-3" style="margin-bottom: 2rem;">
                <div class="card glassy p-4" style="background: linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(255, 255, 255, 0.6) 100%); border: 1px solid rgba(59, 130, 246, 0.2);">
                    <div class="flex items-center gap-4">
                        <div class="p-3 rounded-full bg-blue-100 text-blue-600" style="background: #dbeafe; color: #2563eb;">
                            <i data-feather="users"></i>
                        </div>
                        <div>
                            <p class="text-muted text-sm" style="color: #1e40af; font-weight: 500;">Total Students</p>
                            <h2 class="text-2xl" style="color: #1e3a8a;">${metrics.totalStudents}</h2>
                        </div>
                    </div>
                </div>

                <div class="card glassy p-4" style="background: linear-gradient(135deg, rgba(239, 68, 68, 0.15) 0%, rgba(255, 255, 255, 0.6) 100%); border: 1px solid rgba(239, 68, 68, 0.2);">
                    <div class="flex items-center gap-4">
                        <div class="p-3 rounded-full" style="background: #fee2e2; color: #dc2626;">
                            <i data-feather="alert-circle"></i>
                        </div>
                        <div>
                            <p class="text-muted text-sm" style="color: #991b1b; font-weight: 500;">Outstanding Amount</p>
                            <h2 class="text-2xl" style="color: #7f1d1d;">$${metrics.totalOutstanding}</h2>
                        </div>
                    </div>
                </div>

                <div class="card glassy p-4" style="background: linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(255, 255, 255, 0.6) 100%); border: 1px solid rgba(16, 185, 129, 0.2);">
                    <div class="flex items-center gap-4">
                        <div class="p-3 rounded-full bg-green-100 text-green-600" style="background: #d1fae5; color: #059669;">
                            <i data-feather="dollar-sign"></i>
                        </div>
                        <div>
                            <p class="text-muted text-sm" style="color: #065f46; font-weight: 500;">Total Revenue</p>
                            <h2 class="text-2xl" style="color: #064e3b;">$${metrics.totalRevenue}</h2>
                        </div>
                    </div>
                </div>
            </div>

            <div class="card glassy p-4">
                <div class="flex justify-between items-center mb-4">
                    <h3>Revenue Overview</h3>
                    <span class="badge badge-neutral">This Year</span>
                </div>
                <canvas id="revenueChart" height="100"></canvas>
            </div>
        `;

        new Chart(document.getElementById('revenueChart'), {
            type: 'line',
            data: {
                labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                datasets: [{
                    label: 'Revenue ($)',
                    data: metrics.revenueByMonth,
                    borderColor: '#0f172a',
                    tension: 0.4,
                    fill: false
                }]
            },
            options: { responsive: true }
        });
    },

    // --- Students View ---

    renderStudents(container) {
        const students = store.getStudents();

        container.innerHTML = `
            <div class="flex justify-between items-center mb-6">
                <input type="text" id="student-search" class="form-input" style="width: 300px;" placeholder="Search students...">
                <button class="btn btn-primary" onclick="App.openStudentModal()">
                    <i data-feather="plus"></i> Add Student
                </button>
            </div>
            
            <div class="card glassy table-container">
                <table id="students-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Name</th>
                            <th>Semester</th>
                            <th>Parent</th>
                            <th>Phone</th>
                            <th>Enrolled</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody id="students-list">
                        ${this.generateStudentRows(students)}
                    </tbody>
                </table>
            </div>
        `;

        document.getElementById('student-search').addEventListener('input', (e) => {
            const query = e.target.value;
            const results = store.searchStudents(query);
            document.getElementById('students-list').innerHTML = this.generateStudentRows(results);
            feather.replace();
        });
    },

    generateStudentRows(students) {
        if (students.length === 0) return '<tr><td colspan="8" class="text-center p-4">No students found</td></tr>';

        return students.map(s => `
            <tr>
                <td>#${s.id}</td>
                <td class="font-medium">${s.fullName}</td>
                <td><span class="badge badge-neutral">${s.semester}</span></td>
                <td>${s.parentName}</td>
                <td>${s.phone || '-'}</td>
                <td>${s.enrollmentMonth} ${s.enrollmentYear}</td>
                <td>
                    <span class="badge ${s.isActive ? 'badge-success' : 'badge-danger'}">
                        ${s.isActive ? 'Active' : 'Inactive'}
                    </span>
                </td>
                <td>
                    <button class="icon-btn" onclick="App.openStudentModal(${s.id})"><i data-feather="edit-2"></i></button>
                </td>
            </tr>
        `).join('');
    },

    // --- Modal & Form Handling ---

    openStudentModal(id = null) {
        const modal = document.getElementById('student-modal');
        const form = document.getElementById('student-form');
        const title = document.getElementById('modal-title');

        // Reset form
        form.reset();
        document.getElementById('student-id').value = '';

        // Populate Year/Month options if not static
        const years = ['2025', '2026', '2027'];
        const months = ['December', 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November'];

        // Inject these fields into modal dynamically if missing used to be simpler, 
        // but let's assume valid HTML exists or we inject it now. 
        // For this step I'll assume we need to inject the select options into the HTML first. 
        // ...Actually, cleaner to just do value assignment assuming HTML is updated.

        if (id) {
            // Edit Mode
            const student = store.getStudent(id);
            if (student) {
                title.innerText = 'Edit Student';
                document.getElementById('student-id').value = student.id;
                document.getElementById('student-name').value = student.fullName;
                document.getElementById('student-semester').value = student.semester;
                document.getElementById('parent-name').value = student.parentName;
                document.getElementById('phone-number').value = student.phone || '';

                // Set Year/Month
                if (document.getElementById('student-year')) document.getElementById('student-year').value = student.enrollmentYear;
                if (document.getElementById('student-month')) document.getElementById('student-month').value = student.enrollmentMonth;
            }
        } else {
            // Add Mode
            title.innerText = 'Add New Student';
            // Defaults
            if (document.getElementById('student-year')) document.getElementById('student-year').value = '2025';
            if (document.getElementById('student-month')) document.getElementById('student-month').value = 'December';
        }

        modal.classList.remove('hidden'); // Ensure it's display:flex if hidden class was used
        // Small timeout to allow transition
        requestAnimationFrame(() => {
            modal.classList.add('open');
        });
    },

    closeModal() {
        const modal = document.getElementById('student-modal');
        modal.classList.remove('open');
        setTimeout(() => {
            // Optional: hide after transition if you want to use display:none
        }, 300);
    },

    handleStudentSubmit(e) {
        e.preventDefault();

        const id = document.getElementById('student-id').value;
        const data = {
            fullName: document.getElementById('student-name').value,
            semester: document.getElementById('student-semester').value,
            parentName: document.getElementById('parent-name').value,
            phone: document.getElementById('phone-number').value,
            enrollmentYear: document.getElementById('student-year').value,
            enrollmentMonth: document.getElementById('student-month').value
        };

        if (id) {
            // Update
            store.updateStudent(id, data);
        } else {
            // Create
            store.addStudent({
                ...data,
                isActive: true
            });
        }

        this.closeModal();
        this.renderView('students');
    },

    // --- Fees View ---

    renderFees(container) {
        const fees = store.getFees();
        const years = ['2025', '2026', '2027'];
        const months = ['December', 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November'];

        // Filter
        const filteredFees = fees.filter(f =>
            f.year === this.state.filters.feeYear &&
            f.month === this.state.filters.feeMonth
        );

        container.innerHTML = `
            <div class="flex items-center gap-4 mb-6 p-4 glassy" style="width: fit-content;">
                <div class="flex items-center gap-2">
                    <label class="text-sm font-semibold text-muted">Year:</label>
                    <select id="fee-year-filter" class="form-input" style="width: 100px; padding: 0.5rem;">
                        ${years.map(y => `<option value="${y}" ${this.state.filters.feeYear === y ? 'selected' : ''}>${y}</option>`).join('')}
                    </select>
                </div>
                <div class="flex items-center gap-2">
                    <label class="text-sm font-semibold text-muted">Month:</label>
                    <select id="fee-month-filter" class="form-input" style="width: 140px; padding: 0.5rem;">
                        ${months.map(m => `<option value="${m}" ${this.state.filters.feeMonth === m ? 'selected' : ''}>${m}</option>`).join('')}
                    </select>
                </div>
            </div>

            <div class="card glassy table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Student</th>
                            <th>Month/Year</th>
                            <th>Amount</th>
                            <th>Status</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${filteredFees.length > 0 ? filteredFees.map(fee => `
                            <tr>
                                <td class="font-medium">${fee.studentName}</td>
                                <td>${fee.month} ${fee.year}</td>
                                <td>$${fee.amountDue}</td>
                                <td>
                                    <span class="badge ${fee.status === 'Paid' ? 'badge-success' : 'badge-danger'}">
                                        ${fee.status}
                                    </span>
                                </td>
                                <td>
                                    <button class="btn ${fee.status === 'Paid' ? 'btn-danger' : 'btn-success'} p-2"
                                            style="font-size: 0.75rem; padding: 0.25rem 0.75rem;"
                                            onclick="App.toggleFee(${fee.id})">
                                        ${fee.status === 'Paid' ? 'Mark Unpaid' : 'Mark Paid'}
                                    </button>
                                </td>
                            </tr>
                        `).join('') : '<tr><td colspan="5" class="text-center p-4 text-muted">No records for this period</td></tr>'}
                    </tbody>
                </table>
            </div>
        `;

        // Bind Filter Events
        document.getElementById('fee-year-filter').addEventListener('change', (e) => {
            this.state.filters.feeYear = e.target.value;
            this.renderView('fees');
        });
        document.getElementById('fee-month-filter').addEventListener('change', (e) => {
            this.state.filters.feeMonth = e.target.value;
            this.renderView('fees');
        });
    },

    toggleFee(id) {
        store.toggleFeeStatus(id);
        this.renderView('fees');
    },

    // --- Reports View ---

    renderReports(container) {
        const year = this.state.filters.feeYear || '2025';
        const report = store.getFinancialReport(year);
        const years = ['2025', '2026', '2027'];

        container.innerHTML = `
            <div class="flex justify-between items-center mb-6 no-print">
                <div class="flex items-center gap-4">
                    <label class="text-sm font-semibold text-muted">Report Year:</label>
                    <select id="report-year" class="form-input" style="width: 120px;">
                        ${years.map(y => `<option value="${y}" ${y === year ? 'selected' : ''}>${y}</option>`).join('')}
                    </select>
                </div>
                <button class="btn btn-primary" onclick="window.print()">
                    <i data-feather="printer"></i> Print Report
                </button>
            </div>

            <div class="print-header hidden">
                <h1>Financial Report - ${year}</h1>
                <p>Generated on ${new Date().toLocaleDateString()}</p>
            </div>

            <div class="grid-3 mb-8">
                <div class="card glassy p-4">
                    <p class="text-muted text-sm">Total Expected</p>
                    <h2 class="text-2xl">$${report.totalExpected}</h2>
                </div>
                <div class="card glassy p-4">
                    <p class="text-muted text-sm">Total Collected</p>
                    <h2 class="text-2xl text-success">$${report.totalCollected}</h2>
                </div>
                <div class="card glassy p-4">
                    <p class="text-muted text-sm">Outstanding</p>
                    <h2 class="text-2xl text-danger">$${report.outstanding}</h2>
                </div>
            </div>

            <div class="card glassy table-container mb-8">
                <h3 class="p-4 border-b">Monthly Breakdown</h3>
                <table>
                    <thead>
                        <tr>
                            <th>Month</th>
                            <th>Expected</th>
                            <th>Collected</th>
                            <th>Pending</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${report.monthlyBreakdown.map(m => `
                            <tr>
                                <td class="font-medium">${m.month}</td>
                                <td>$${m.expected}</td>
                                <td class="text-success">$${m.collected}</td>
                                <td class="text-danger">$${m.pending}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>

            <div class="card glassy table-container">
                <h3 class="p-4 border-b">Defaulters List (Unpaid)</h3>
                 <table>
                    <thead>
                        <tr>
                            <th>Student</th>
                            <th>Month</th>
                            <th>Amount Due</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${report.defaulters.length > 0 ? report.defaulters.map(d => `
                            <tr>
                                <td class="font-medium">${d.studentName}</td>
                                <td>${d.month}</td>
                                <td class="text-danger">$${d.amount}</td>
                            </tr>
                        `).join('') : '<tr><td colspan="3" class="text-center p-4">No outstanding fees for this year.</td></tr>'}
                    </tbody>
                </table>
            </div>
        `;

        document.getElementById('report-year').addEventListener('change', (e) => {
            this.state.filters.feeYear = e.target.value;
            this.renderReports(container);
            feather.replace();
        });
    },

    // --- Users View ---

    renderUsers(container) {
        const users = store.getUsers();

        container.innerHTML = `
            <div class="flex justify-between items-center mb-6">
                <p class="text-muted">Manage user accounts and access</p>
                <button class="btn btn-primary" onclick="App.openUserModal()">
                    <i data-feather="user-plus"></i> Add User
                </button>
            </div>
            
            <div class="card glassy table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Username</th>
                            <th>Role</th>
                            <th>Created</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${users.length > 0 ? users.map(user => `
                            <tr>
                                <td class="font-medium">${user.username}</td>
                                <td>
                                    <span class="badge ${user.role === 'Admin' ? 'badge-success' : 'badge-neutral'}">
                                        ${user.role}
                                    </span>
                                </td>
                                <td>${new Date(user.createdAt).toLocaleDateString()}</td>
                            </tr>
                        `).join('') : '<tr><td colspan="3" class="text-center p-4">No users found</td></tr>'}
                    </tbody>
                </table>
            </div>
        `;
    },

    openUserModal() {
        const modal = document.getElementById('user-modal');
        const form = document.getElementById('user-form');

        // Reset form
        form.reset();

        // Show form, hide success
        document.getElementById('user-form-container').classList.remove('hidden');
        document.getElementById('user-success-container').classList.add('hidden');

        modal.classList.remove('hidden');
        requestAnimationFrame(() => {
            modal.classList.add('open');
        });
    },

    closeUserModal() {
        const modal = document.getElementById('user-modal');
        modal.classList.remove('open');
        setTimeout(() => {
            modal.classList.add('hidden');
        }, 300);

        // Refresh users view if we're on it
        if (this.state.currentView === 'users') {
            this.renderView('users');
        }
    },

    handleUserSubmit(e) {
        e.preventDefault();

        const username = document.getElementById('user-username').value;
        const password = document.getElementById('user-password').value;
        const role = document.getElementById('user-role').value;

        const result = store.addUser(username, password, role);

        if (result.success) {
            // Show success state
            document.getElementById('user-form-container').classList.add('hidden');
            document.getElementById('user-success-container').classList.remove('hidden');
            document.getElementById('user-login-link').value = result.loginLink;
            feather.replace();
        } else {
            alert(result.message);
        }
    },

    copyLoginLink() {
        const linkInput = document.getElementById('user-login-link');
        linkInput.select();
        linkInput.setSelectionRange(0, 99999); // For mobile devices

        navigator.clipboard.writeText(linkInput.value).then(() => {
            // Visual feedback
            const btn = event.target.closest('button');
            const originalHTML = btn.innerHTML;
            btn.innerHTML = '<i data-feather="check"></i> Copied!';
            feather.replace();

            setTimeout(() => {
                btn.innerHTML = originalHTML;
                feather.replace();
            }, 2000);
        }).catch(err => {
            alert('Failed to copy link. Please copy manually.');
        });
    },

    // --- Event Handling ---

    bindEvents() {
        // Login
        document.getElementById('login-form').addEventListener('submit', (e) => {
            e.preventDefault();
            const user = document.getElementById('username').value;
            const pass = document.getElementById('password').value;
            this.login(user, pass);
        });

        // Logout
        document.getElementById('logout-btn').addEventListener('click', () => {
            this.logout();
        });

        // Student Form
        document.getElementById('student-form').addEventListener('submit', (e) => this.handleStudentSubmit(e));

        // User Form
        document.getElementById('user-form').addEventListener('submit', (e) => this.handleUserSubmit(e));

        // Navigation
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const view = e.currentTarget.dataset.view;
                this.navigateTo(view);
            });
        });
    }
};

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});

// Expose App to window for inline onclick handlers
window.App = App;
