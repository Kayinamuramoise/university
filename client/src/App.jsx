import React, { useState, useEffect, createContext, useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate, Navigate } from 'react-router-dom';
import axios from 'axios';
import { 
  LogOut, 
  BookOpen, 
  Users as UsersIcon, 
  GraduationCap, 
  FileText, 
  Plus, 
  Trash2, 
  CheckCircle,
  LayoutDashboard
} from 'lucide-react';

const API_URL = 'http://localhost:5000/api';
const AuthContext = createContext(null);

// --- COMPONENTS ---

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  return (
    <nav className="navbar">
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <GraduationCap size={32} className="text-primary" style={{ color: 'var(--primary)' }} />
        <h1 style={{ fontSize: '1.25rem', fontWeight: 700 }}>UniReg Huye</h1>
      </div>
      <div className="nav-links">
        {user ? (
          <>
            <Link to="/dashboard" className="nav-link">Dashboard</Link>
            {user.role === 'admin' && (
              <>
                <Link to="/students" className="nav-link">Students</Link>
                <Link to="/courses" className="nav-link">Courses</Link>
                <Link to="/reports" className="nav-link">Reports</Link>
              </>
            )}
            {user.role === 'student' && (
              <>
                <Link to="/enroll" className="nav-link">Enroll</Link>
                <Link to="/my-report" className="nav-link">My Report</Link>
              </>
            )}
            <button onClick={logout} className="btn btn-outline" style={{ padding: '0.5rem 1rem' }}>
              <LogOut size={16} /> Logout
            </button>
          </>
        ) : (
          <Link to="/login" className="nav-link">Login</Link>
        )}
      </div>
    </nav>
  );
};

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await login(username, password);
      navigate('/dashboard');
    } catch (err) {
      alert('Login failed: ' + (err.response?.data?.message || err.message));
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
      <div className="glass-card animate-fade-in" style={{ width: '100%', maxWidth: '400px' }}>
        <h2 style={{ marginBottom: '1.5rem', textAlign: 'center' }}>Welcome Back</h2>
        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label>Username</label>
            <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} required />
          </div>
          <div className="input-group">
            <label>Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
            Sign In
          </button>
        </form>
        <p style={{ marginTop: '1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
          
        </p>
      </div>
    </div>
  );
};

const Dashboard = () => {
  const { user } = useContext(AuthContext);
  return (
    <div className="container animate-fade-in">
      <header style={{ marginBottom: '2rem' }}>
        <h2>Hello, {user?.name || user?.username}!</h2>
        <p style={{ color: 'var(--text-muted)' }}>University Course Registration System - Huye District</p>
      </header>
      
      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))' }}>
        <div className="glass-card">
          <LayoutDashboard size={24} style={{ marginBottom: '1rem', color: 'var(--primary)' }} />
          <h3>Overview</h3>
          <p style={{ marginTop: '0.5rem', color: 'var(--text-muted)' }}>
            {user?.role === 'admin' ? 'Manage students, courses and view university-wide reports.' : 'View your enrolled courses and register for new ones.'}
          </p>
        </div>
        {user?.role === 'admin' ? (
          <>
            <Link to="/students" style={{ textDecoration: 'none', color: 'inherit' }}>
              <div className="glass-card" style={{ cursor: 'pointer' }}>
                <UsersIcon size={24} style={{ marginBottom: '1rem', color: 'var(--success)' }} />
                <h3>Students</h3>
                <p style={{ marginTop: '0.5rem', color: 'var(--text-muted)' }}>Manage student registrations</p>
              </div>
            </Link>
            <Link to="/courses" style={{ textDecoration: 'none', color: 'inherit' }}>
              <div className="glass-card" style={{ cursor: 'pointer' }}>
                <BookOpen size={24} style={{ marginBottom: '1rem', color: 'var(--primary)' }} />
                <h3>Courses</h3>
                <p style={{ marginTop: '0.5rem', color: 'var(--text-muted)' }}>Update course curriculum</p>
              </div>
            </Link>
          </>
        ) : (
          <>
            <Link to="/enroll" style={{ textDecoration: 'none', color: 'inherit' }}>
              <div className="glass-card" style={{ cursor: 'pointer' }}>
                <Plus size={24} style={{ marginBottom: '1rem', color: 'var(--success)' }} />
                <h3>Enroll</h3>
                <p style={{ marginTop: '0.5rem', color: 'var(--text-muted)' }}>Register for new courses</p>
              </div>
            </Link>
            <Link to="/my-report" style={{ textDecoration: 'none', color: 'inherit' }}>
              <div className="glass-card" style={{ cursor: 'pointer' }}>
                <FileText size={24} style={{ marginBottom: '1rem', color: 'var(--primary)' }} />
                <h3>My Report</h3>
                <p style={{ marginTop: '0.5rem', color: 'var(--text-muted)' }}>View academic records</p>
              </div>
            </Link>
          </>
        )}
      </div>
    </div>
  );
};

// --- ADMIN PAGES ---

const ManageStudents = () => {
  const [students, setStudents] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ username: '', password: '', name: '', program: '' });

  const fetchStudents = async () => {
    const res = await axios.get(`${API_URL}/students`);
    setStudents(res.data);
  };

  useEffect(() => { fetchStudents(); }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await axios.put(`${API_URL}/students/${editingId}`, { name: formData.name, program: formData.program });
        setEditingId(null);
      } else {
        await axios.post(`${API_URL}/register-student`, formData);
      }
      setShowAdd(false);
      setFormData({ username: '', password: '', name: '', program: '' });
      fetchStudents();
    } catch (err) { alert(err.response?.data?.message || 'Error saving student'); }
  };

  const handleEdit = (s) => {
    setFormData({ name: s.name, program: s.program, username: s.username, password: '' });
    setEditingId(s.student_id);
    setShowAdd(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this student?')) {
      await axios.delete(`${API_URL}/students/${id}`);
      fetchStudents();
    }
  };

  return (
    <div className="container animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2>Manage Students</h2>
        <button className="btn btn-primary" onClick={() => { setShowAdd(!showAdd); if(showAdd) setEditingId(null); }}>
          <Plus size={18} /> {showAdd ? 'Cancel' : 'Register Student'}
        </button>
      </div>

      {showAdd && (
        <div className="glass-card" style={{ marginBottom: '2rem' }}>
          <h3>{editingId ? 'Edit Student' : 'New Student Registration'}</h3>
          <form onSubmit={handleAdd} className="grid" style={{ gridTemplateColumns: '1fr 1fr', marginTop: '1rem' }}>
            <div className="input-group">
              <label>Full Name</label>
              <input type="text" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
            </div>
            <div className="input-group">
              <label>Program / Faculty</label>
              <input type="text" required value={formData.program} onChange={e => setFormData({...formData, program: e.target.value})} />
            </div>
            {!editingId && (
              <>
                <div className="input-group">
                  <label>Username</label>
                  <input type="text" required value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})} />
                </div>
                <div className="input-group">
                  <label>Password</label>
                  <input type="password" required value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
                </div>
              </>
            )}
            <button type="submit" className="btn btn-primary" style={{ gridColumn: 'span 2' }}>
              {editingId ? 'Update Student Details' : 'Create Student Account'}
            </button>
          </form>
        </div>
      )}

      <div className="glass-card table-container">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Program</th>
              <th>Username</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {students.map(s => (
              <tr key={s.student_id}>
                <td>{s.student_id}</td>
                <td>{s.name}</td>
                <td>{s.program}</td>
                <td>{s.username}</td>
                <td>
                  <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button onClick={() => handleEdit(s)} style={{ color: 'var(--primary)', background: 'none', border: 'none', cursor: 'pointer' }}>
                      Edit
                    </button>
                    <button onClick={() => handleDelete(s.student_id)} style={{ color: 'var(--danger)', background: 'none', border: 'none', cursor: 'pointer' }}>
                      <Trash2 size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const ManageCourses = () => {
  const [courses, setCourses] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ course_name: '', credits: '' });

  const fetchCourses = async () => {
    const res = await axios.get(`${API_URL}/courses`);
    setCourses(res.data);
  };

  useEffect(() => { fetchCourses(); }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (editingId) {
      await axios.put(`${API_URL}/courses/${editingId}`, formData);
      setEditingId(null);
    } else {
      await axios.post(`${API_URL}/courses`, formData);
    }
    setShowAdd(false);
    setFormData({ course_name: '', credits: '' });
    fetchCourses();
  };

  const handleEdit = (c) => {
    setFormData({ course_name: c.course_name, credits: c.credits });
    setEditingId(c.course_id);
    setShowAdd(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this course?')) {
      await axios.delete(`${API_URL}/courses/${id}`);
      fetchCourses();
    }
  };

  return (
    <div className="container animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2>Manage Courses</h2>
        <button className="btn btn-primary" onClick={() => { setShowAdd(!showAdd); if(showAdd) setEditingId(null); }}>
          <Plus size={18} /> {showAdd ? 'Cancel' : 'Add Course'}
        </button>
      </div>

      {showAdd && (
        <div className="glass-card" style={{ marginBottom: '2rem' }}>
          <h3>{editingId ? 'Edit Course' : 'Add New Course'}</h3>
          <form onSubmit={handleAdd} className="grid" style={{ gridTemplateColumns: '1fr 1fr', marginTop: '1rem' }}>
            <div className="input-group">
              <label>Course Name</label>
              <input type="text" required value={formData.course_name} onChange={e => setFormData({...formData, course_name: e.target.value})} />
            </div>
            <div className="input-group">
              <label>Credits</label>
              <input type="number" required value={formData.credits} onChange={e => setFormData({...formData, credits: e.target.value})} />
            </div>
            <button type="submit" className="btn btn-primary" style={{ gridColumn: 'span 2' }}>
              {editingId ? 'Update Course' : 'Add Course'}
            </button>
          </form>
        </div>
      )}

      <div className="glass-card table-container">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Course Name</th>
              <th>Credits</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {courses.map(c => (
              <tr key={c.course_id}>
                <td>{c.course_id}</td>
                <td>{c.course_name}</td>
                <td><span className="badge badge-info">{c.credits} Credits</span></td>
                <td>
                  <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button onClick={() => handleEdit(c)} style={{ color: 'var(--primary)', background: 'none', border: 'none', cursor: 'pointer' }}>
                      Edit
                    </button>
                    <button onClick={() => handleDelete(c.course_id)} style={{ color: 'var(--danger)', background: 'none', border: 'none', cursor: 'pointer' }}>
                      <Trash2 size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// --- STUDENT PAGES ---

const CourseEnrollment = () => {
  const { user } = useContext(AuthContext);
  const [courses, setCourses] = useState([]);
  const [enrolled, setEnrolled] = useState([]);

  const fetchData = async () => {
    const [cRes, eRes] = await Promise.all([
      axios.get(`${API_URL}/courses`),
      axios.get(`${API_URL}/reports/student/${user.student_id}`)
    ]);
    setCourses(cRes.data);
    setEnrolled(eRes.data.map(r => r.course_id));
  };

  useEffect(() => { if (user?.student_id) fetchData(); }, [user]);

  const handleEnroll = async (courseId) => {
    try {
      await axios.post(`${API_URL}/enroll`, { student_id: user.student_id, course_id: courseId });
      fetchData();
    } catch (err) { alert(err.response?.data?.message || 'Enrollment failed'); }
  };

  const handleDrop = async (courseId) => {
    await axios.delete(`${API_URL}/enroll/${user.student_id}/${courseId}`);
    fetchData();
  };

  return (
    <div className="container animate-fade-in">
      <h2>Available Courses</h2>
      <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>Select courses to add to your semester load</p>
      
      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
        {courses.map(c => {
          const isEnrolled = enrolled.includes(c.course_id);
          return (
            <div key={c.course_id} className="glass-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h4 style={{ fontSize: '1.1rem' }}>{c.course_name}</h4>
                <span className="badge badge-info" style={{ marginTop: '0.5rem', display: 'inline-block' }}>{c.credits} Credits</span>
              </div>
              {isEnrolled ? (
                <button className="btn btn-outline" style={{ color: 'var(--danger)' }} onClick={() => handleDrop(c.course_id)}>Drop</button>
              ) : (
                <button className="btn btn-primary" onClick={() => handleEnroll(c.course_id)}><Plus size={16}/> Enroll</button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

const StudentReport = () => {
  const { user } = useContext(AuthContext);
  const [report, setReport] = useState([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetch = async () => {
      const id = user.role === 'admin' ? '' : user.student_id;
      const url = user.role === 'admin' ? `${API_URL}/reports/all` : `${API_URL}/reports/student/${id}`;
      const res = await axios.get(url);
      setReport(res.data);
    };
    if (user) fetch();
  }, [user]);

  const filteredReport = report.filter(r => {
    const term = search.toLowerCase();
    return (
      r.course_name.toLowerCase().includes(term) ||
      (r.student_name && r.student_name.toLowerCase().includes(term)) ||
      (r.program && r.program.toLowerCase().includes(term))
    );
  });

  const totalCredits = filteredReport.reduce((acc, curr) => acc + curr.credits, 0);

  return (
    <div className="container animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2rem' }}>
        <div>
          <h2>{user.role === 'admin' ? 'University Enrollment Report' : 'My Course Report'}</h2>
          <p style={{ color: 'var(--text-muted)' }}>{user.name || user.username} - {user.program || 'Administration'}</p>
        </div>
        <div className="glass-card" style={{ padding: '1rem 1.5rem', textAlign: 'center' }}>
          <h1 style={{ color: 'var(--primary)' }}>{totalCredits}</h1>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>TOTAL CREDITS</p>
        </div>
      </div>

      <div className="glass-card" style={{ marginBottom: '1.5rem', padding: '1rem' }}>
        <div className="input-group" style={{ margin: 0 }}>
          <input 
            type="text" 
            placeholder="Search by course, student or program..." 
            value={search} 
            onChange={(e) => setSearch(e.target.value)} 
          />
        </div>
      </div>

      <div className="glass-card table-container">
        <table>
          <thead>
            <tr>
              {user.role === 'admin' && <th>Student</th>}
              <th>Course Name</th>
              <th>Credits</th>
              <th>Registration Date</th>
            </tr>
          </thead>
          <tbody>
            {filteredReport.map((r, i) => (
              <tr key={i}>
                {user.role === 'admin' && (
                    <td>
                        <div style={{fontWeight: 600}}>{r.student_name}</div>
                        <div style={{fontSize: '0.8rem', color: 'var(--text-muted)'}}>{r.program}</div>
                    </td>
                )}
                <td>{r.course_name}</td>
                <td><span className="badge badge-info">{r.credits}</span></td>
                <td>{new Date(r.registration_date).toLocaleDateString()}</td>
              </tr>
            ))}
            {filteredReport.length === 0 && (
              <tr>
                <td colSpan={user.role === 'admin' ? 4 : 3} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                  No matching records found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
        <button onClick={() => window.print()} className="btn btn-primary">
          <FileText size={18} /> Print Report
        </button>
        <button onClick={() => setSearch('')} className="btn btn-outline">
          Clear Filter
        </button>
      </div>
    </div>
  );
};

// --- AUTH PROVIDER ---

const App = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem('user');
    if (saved) {
      const userData = JSON.parse(saved);
      setUser(userData);
      axios.defaults.headers.common['Authorization'] = `Bearer ${userData.token}`;
    }
    setLoading(false);
  }, []);

  const login = async (username, password) => {
    const res = await axios.post(`${API_URL}/login`, { username, password });
    setUser(res.data);
    localStorage.setItem('user', JSON.stringify(res.data));
    axios.defaults.headers.common['Authorization'] = `Bearer ${res.data.token}`;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
    delete axios.defaults.headers.common['Authorization'];
  };

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>Loading...</div>;

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      <Router>
        <Navbar />
        <Routes>
          <Route path="/login" element={!user ? <Login /> : <Navigate to="/dashboard" />} />
          <Route path="/dashboard" element={user ? <Dashboard /> : <Navigate to="/login" />} />
          
          {/* Admin Routes */}
          <Route path="/students" element={user?.role === 'admin' ? <ManageStudents /> : <Navigate to="/dashboard" />} />
          <Route path="/courses" element={user?.role === 'admin' ? <ManageCourses /> : <Navigate to="/dashboard" />} />
          <Route path="/reports" element={user?.role === 'admin' ? <StudentReport /> : <Navigate to="/dashboard" />} />

          {/* Student Routes */}
          <Route path="/enroll" element={user?.role === 'student' ? <CourseEnrollment /> : <Navigate to="/dashboard" />} />
          <Route path="/my-report" element={user?.role === 'student' ? <StudentReport /> : <Navigate to="/dashboard" />} />

          <Route path="/" element={<Navigate to={user ? "/dashboard" : "/login"} />} />
        </Routes>
      </Router>
    </AuthContext.Provider>
  );
};

export default App;
