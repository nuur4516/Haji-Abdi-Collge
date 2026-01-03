class Store {
    constructor() {
        this.students = JSON.parse(localStorage.getItem('dm_students')) || [];
        this.fees = JSON.parse(localStorage.getItem('dm_fees')) || [];
        this.users = JSON.parse(localStorage.getItem('dm_users')) || [];

        if (this.students.length === 0) {
            this.initDummyData();
        } else {
            // Data Migration for existing users (adding year/month support)
            this._migrateData();
        }

        // Initialize default admin user if no users exist
        if (this.users.length === 0) {
            this.initDefaultUser();
        }
    }

    _migrateData() {
        let changed = false;

        this.fees = this.fees.map(fee => {
            if (!fee.year) {
                changed = true;
                return { ...fee, year: '2025', month: 'December' };
            }
            return fee;
        });

        this.students = this.students.map(student => {
            if (!student.enrollmentYear) {
                changed = true;
                return { ...student, enrollmentYear: '2025', enrollmentMonth: 'January' };
            }
            return student;
        });

        if (changed) {
            this._save();
            console.log('Data migrated to 2025 schema');
        }
    }

    _save() {
        localStorage.setItem('dm_students', JSON.stringify(this.students));
        localStorage.setItem('dm_fees', JSON.stringify(this.fees));
        localStorage.setItem('dm_users', JSON.stringify(this.users));
    }

    initDummyData() {
        const students = [
            { id: 1, fullName: 'Ahmed Ali', semester: 'Sem 1', parentName: 'Ali Hassan', phone: '252-61-555-0101', enrollmentYear: '2025', enrollmentMonth: 'December', isActive: true },
            { id: 2, fullName: 'Fatima Nur', semester: 'Sem 2', parentName: 'Nur Mohamed', phone: '252-61-555-0102', enrollmentYear: '2025', enrollmentMonth: 'January', isActive: true },
            { id: 3, fullName: 'Hassan Gedi', semester: 'Sem 1', parentName: 'Gedi Farah', phone: '252-61-555-0103', enrollmentYear: '2025', enrollmentMonth: 'December', isActive: false },
            { id: 4, fullName: 'Safia Jibril', semester: 'Sem 3', parentName: 'Jibril Abdi', phone: '252-61-555-0104', enrollmentYear: '2024', enrollmentMonth: 'September', isActive: true },
            { id: 5, fullName: 'Yusuf Adan', semester: 'Sem 1', parentName: 'Adan Omar', phone: '252-61-555-0105', enrollmentYear: '2025', enrollmentMonth: 'December', isActive: true },
        ];

        const fees = [
            { id: 1, studentId: 1, month: 'December', year: '2025', amountDue: 50, amountPaid: 50, status: 'Paid', paymentDate: '2025-12-05' },
            { id: 2, studentId: 1, month: 'January', year: '2026', amountDue: 50, amountPaid: 0, status: 'Unpaid', paymentDate: null },
            { id: 3, studentId: 2, month: 'December', year: '2025', amountDue: 50, amountPaid: 50, status: 'Paid', paymentDate: '2025-12-02' },
            { id: 4, studentId: 2, month: 'January', year: '2026', amountDue: 50, amountPaid: 50, status: 'Paid', paymentDate: '2026-01-01' },
            { id: 5, studentId: 4, month: 'December', year: '2025', amountDue: 50, amountPaid: 0, status: 'Unpaid', paymentDate: null },
            { id: 6, studentId: 5, month: 'December', year: '2025', amountDue: 50, amountPaid: 50, status: 'Paid', paymentDate: '2025-12-10' },
        ];

        this.students = students;
        this.fees = fees;
        this._save();
    }

    // --- Student Methods ---

    getStudents() {
        return this.students;
    }

    getStudent(id) {
        return this.students.find(s => s.id === parseInt(id));
    }

    addStudent(student) {
        student.id = Date.now();
        student.isActive = true;
        this.students.push(student);

        // Auto-generate initial fee record
        const initialFee = {
            id: Date.now() + 1,
            studentId: student.id,
            year: student.enrollmentYear || '2025',
            month: student.enrollmentMonth || 'December',
            amountDue: 50,
            amountPaid: 0,
            status: 'Unpaid',
            paymentDate: null
        };
        this.fees.push(initialFee);

        this._save();
        return student;
    }

    updateStudent(id, data) {
        const index = this.students.findIndex(s => s.id === parseInt(id));
        if (index !== -1) {
            this.students[index] = { ...this.students[index], ...data };
            this._save();
            return this.students[index];
        }
        return null;
    }

    deleteStudent(id) {
        this.students = this.students.filter(s => s.id !== parseInt(id));
        this._save();
    }

    searchStudents(query) {
        query = query.toLowerCase();
        return this.students.filter(s =>
            s.fullName.toLowerCase().includes(query) ||
            s.id.toString().includes(query)
        );
    }

    // --- Fee Methods ---

    getFees() {
        return this.fees.map(fee => {
            const student = this.getStudent(fee.studentId);
            return { ...fee, studentName: student ? student.fullName : 'Unknown' };
        });
    }

    toggleFeeStatus(id) {
        const fee = this.fees.find(f => f.id === parseInt(id));
        if (fee) {
            if (fee.status === 'Unpaid') {
                fee.status = 'Paid';
                fee.amountPaid = fee.amountDue;
                fee.paymentDate = new Date().toISOString().split('T')[0];
            } else {
                fee.status = 'Unpaid';
                fee.amountPaid = 0;
                fee.paymentDate = null;
            }
            this._save();
        }
        return fee;
    }

    // --- Reports ---

    getFinancialReport(year) {
        const yearFees = this.fees.filter(f => f.year === year);
        const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

        const totalExpected = yearFees.reduce((sum, f) => sum + f.amountDue, 0);
        const totalCollected = yearFees.reduce((sum, f) => sum + f.amountPaid, 0);

        const monthlyBreakdown = months.map(month => {
            const monthFees = yearFees.filter(f => f.month === month);
            return {
                month,
                expected: monthFees.reduce((sum, f) => sum + f.amountDue, 0),
                collected: monthFees.reduce((sum, f) => sum + f.amountPaid, 0),
                pending: monthFees.reduce((sum, f) => sum + (f.amountDue - f.amountPaid), 0)
            };
        });

        const defaulters = yearFees
            .filter(f => f.status === 'Unpaid')
            .map(f => {
                const student = this.getStudent(f.studentId);
                return {
                    studentName: student ? student.fullName : 'Unknown',
                    month: f.month,
                    amount: f.amountDue
                };
            });

        return {
            year,
            totalExpected,
            totalCollected,
            outstanding: totalExpected - totalCollected,
            monthlyBreakdown,
            defaulters
        };
    }

    // --- Metrics ---

    getMetrics() {
        const totalStudents = this.students.length;
        const totalRevenue = this.fees
            .filter(f => f.status === 'Paid')
            .reduce((sum, f) => sum + f.amountPaid, 0);

        // Calculate outstanding amount
        const totalOutstanding = this.fees
            .filter(f => f.status === 'Unpaid')
            .reduce((sum, f) => sum + f.amountDue, 0);

        // Mock data for charts as we don't have real time series in this simple model
        const revenueByMonth = [
            this.fees.filter(f => f.month === 'January' && f.status === 'Paid').reduce((sum, f) => sum + f.amountPaid, 0),
            this.fees.filter(f => f.month === 'February' && f.status === 'Paid').reduce((sum, f) => sum + f.amountPaid, 0),
            0, 0, 0, 0 // Placeholder for other months
        ];

        return {
            totalStudents,
            totalRevenue,
            totalOutstanding,
            revenueByMonth
        };
    }

    // --- User Management ---

    initDefaultUser() {
        const defaultAdmin = {
            id: 1,
            username: 'admin',
            password: '123', // In production, this should be hashed
            role: 'Admin',
            token: this._generateToken(),
            createdAt: new Date().toISOString()
        };
        this.users.push(defaultAdmin);
        this._save();
    }

    _generateToken() {
        return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    }

    addUser(username, password, role) {
        // Check if username already exists
        if (this.users.find(u => u.username === username)) {
            return { success: false, message: 'Username already exists' };
        }

        const token = this._generateToken();
        const newUser = {
            id: Date.now(),
            username,
            password, // In production, this should be hashed
            role,
            token,
            createdAt: new Date().toISOString()
        };

        this.users.push(newUser);
        this._save();

        return {
            success: true,
            user: newUser,
            loginLink: this.generateAccessLink(token)
        };
    }

    getUsers() {
        return this.users.map(u => ({
            id: u.id,
            username: u.username,
            role: u.role,
            createdAt: u.createdAt
        }));
    }

    authenticateUser(username, password) {
        const user = this.users.find(u => u.username === username && u.password === password);
        if (user) {
            return {
                success: true,
                user: {
                    id: user.id,
                    username: user.username,
                    role: user.role,
                    token: user.token
                }
            };
        }
        return { success: false, message: 'Invalid credentials' };
    }

    authenticateByToken(token) {
        const user = this.users.find(u => u.token === token);
        if (user) {
            return {
                success: true,
                user: {
                    id: user.id,
                    username: user.username,
                    role: user.role,
                    token: user.token
                }
            };
        }
        return { success: false, message: 'Invalid token' };
    }

    generateAccessLink(token) {
        const baseUrl = window.location.origin + window.location.pathname;
        return `${baseUrl}?token=${token}`;
    }
}

// Global Store Instance
window.store = new Store();
