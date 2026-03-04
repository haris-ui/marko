import { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import { getAllStudents, deleteMark, registerStudent, registerBulkStudents, forgotPassword } from '../services/api';
import MarksTable from './MarksTable';
import MarkModal from './MarkModal';
import CSVUpload from './CSVUpload';
import ChangePasswordModal from './ChangePasswordModal';

const TABS = ['All Students', 'Add / Edit Mark', 'Upload CSV', 'Register Student', 'Bulk Register', 'Reset Password'];

export default function AdminDashboard() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const [tab, setTab] = useState(0);
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expandedId, setExpandedId] = useState(null);
    const [editMark, setEditMark] = useState(null);
    const [showMarkModal, setShowMarkModal] = useState(false);
    const [showChangePwd, setShowChangePwd] = useState(false);
    const [search, setSearch] = useState('');

    // Register student form
    const [regForm, setRegForm] = useState({ roll_number: '', name: '', email: '' });
    const [regLoading, setRegLoading] = useState(false);
    const [generatedCreds, setGeneratedCreds] = useState(null);

    // Bulk register state
    const [bulkText, setBulkText] = useState('');
    const [bulkLoading, setBulkLoading] = useState(false);
    const [bulkResult, setBulkResult] = useState(null);
    const bulkFileRef = useRef();

    // Reset password state
    const [resetRoll, setResetRoll] = useState('');
    const [resetLoading, setResetLoading] = useState(false);
    const [resetCreds, setResetCreds] = useState(null);

    const fetchAll = useCallback(() => {
        setLoading(true);
        getAllStudents()
            .then((res) => setStudents(res.data.students))
            .catch(() => toast.error('Failed to load students.'))
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => { fetchAll(); }, [fetchAll]);

    const handleLogout = () => { logout(); navigate('/login'); };

    const handleDelete = async (markId) => {
        if (!confirm('Delete this mark?')) return;
        try {
            await deleteMark(markId);
            toast.success('Mark deleted.');
            fetchAll();
        } catch { toast.error('Failed to delete mark.'); }
    };

    const handleEdit = (mark) => {
        setEditMark(mark);
        setShowMarkModal(true);
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        if (!regForm.roll_number.trim() || !regForm.name.trim()) {
            toast.error('Roll number and name are required.');
            return;
        }
        setRegLoading(true);
        setGeneratedCreds(null);
        try {
            const res = await registerStudent(regForm);
            setGeneratedCreds(res.data.credentials);
            toast.success('Student registered!');
            setRegForm({ roll_number: '', name: '', email: '' });
            fetchAll();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Registration failed.');
        } finally {
            setRegLoading(false);
        }
    };

    // Summary stats
    const totalStudents = students.length;
    const totalMarks = students.reduce((s, st) => s + st.marks.length, 0);
    const avgPct = (() => {
        const all = students.flatMap((s) => s.marks);
        if (!all.length) return null;
        const pcts = all.map((m) => (m.marks_obtained / m.total_marks) * 100);
        return (pcts.reduce((a, b) => a + b, 0) / pcts.length).toFixed(1);
    })();

    const filtered = students.filter(
        (s) =>
            s.roll_number.toLowerCase().includes(search.toLowerCase()) ||
            s.name.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="min-h-screen">
            {/* Header */}
            <header className="glass-dark sticky top-0 z-40 px-6 py-4">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl gradient-brand flex items-center justify-center shadow-lg shadow-indigo-500/30">
                            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                    d="M12 14l9-5-9-5-9 5 9 5zm0 7v-6m0 0l-9-5m9 5l9-5" />
                            </svg>
                        </div>
                        <div>
                            <h1 className="text-base font-bold text-white leading-tight">Admin Panel</h1>
                            <p className="text-xs text-slate-500">Student Marks Portal</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-xs badge-success mr-1">{user?.name}</span>
                        <button onClick={() => setShowChangePwd(true)} className="btn-secondary text-xs">Change Password</button>
                        <button onClick={handleLogout} className="btn-danger text-xs">Logout</button>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-6 py-8">
                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    {[
                        { label: 'Total Students', value: totalStudents, icon: '👥' },
                        { label: 'Total Marks Records', value: totalMarks, icon: '📋' },
                        { label: 'Average Score', value: avgPct ? `${avgPct}%` : '—', icon: '📊' },
                        { label: 'Admin', value: user?.roll_number, icon: '🛡️' },
                    ].map(({ label, value, icon }) => (
                        <div key={label} className="card text-center">
                            <div className="text-2xl mb-1">{icon}</div>
                            <div className="text-xl font-bold text-white truncate">{value}</div>
                            <div className="text-xs text-slate-500 mt-1">{label}</div>
                        </div>
                    ))}
                </div>

                {/* Tabs */}
                <div className="flex gap-1 mb-6 p-1 rounded-xl overflow-x-auto" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
                    {TABS.map((t, i) => (
                        <button
                            key={t}
                            onClick={() => setTab(i)}
                            className="flex-shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition-all"
                            style={tab === i
                                ? { background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: 'white' }
                                : { color: '#94a3b8' }}
                        >
                            {t}
                        </button>
                    ))}
                </div>

                {/* Tab: All Students */}
                {tab === 0 && (
                    <div className="card">
                        <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
                            <h3 className="text-lg font-semibold text-white">All Students</h3>
                            <input
                                className="input-field max-w-xs text-sm"
                                placeholder="Search by name or roll..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                        {loading ? (
                            <div className="text-center py-12">
                                <svg className="animate-spin w-8 h-8 text-indigo-400 mx-auto" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                                </svg>
                            </div>
                        ) : filtered.length === 0 ? (
                            <p className="text-slate-500 text-sm text-center py-10">No students found.</p>
                        ) : (
                            <div className="space-y-3">
                                {filtered.map((s) => {
                                    const totalObt = s.marks.reduce((a, m) => a + parseFloat(m.marks_obtained), 0);
                                    const totalMrk = s.marks.reduce((a, m) => a + parseFloat(m.total_marks), 0);
                                    const pct = totalMrk > 0 ? ((totalObt / totalMrk) * 100).toFixed(1) : null;
                                    const isOpen = expandedId === s.id;
                                    return (
                                        <div key={s.id} className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.03)' }}>
                                            <button
                                                className="w-full flex items-center justify-between px-5 py-4 text-left transition-colors hover:bg-white/5"
                                                onClick={() => setExpandedId(isOpen ? null : s.id)}
                                            >
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-full gradient-brand flex items-center justify-center text-white font-bold text-sm">
                                                        {s.name[0].toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-semibold text-white">{s.name}</p>
                                                        <p className="text-xs text-slate-500">{s.roll_number}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-4">
                                                    {pct && <span className={`text-sm font-bold ${parseFloat(pct) >= 75 ? 'text-green-400' : parseFloat(pct) >= 50 ? 'text-yellow-400' : 'text-red-400'}`}>{pct}%</span>}
                                                    <span className="text-xs text-slate-500">{s.marks.length} record{s.marks.length !== 1 ? 's' : ''}</span>
                                                    <svg className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                    </svg>
                                                </div>
                                            </button>
                                            {isOpen && (
                                                <div className="px-5 pb-5 border-t border-white/8 pt-4 space-y-6">
                                                    {s.marks.length === 0 ? (
                                                        <p className="text-slate-500 text-sm text-center">No records for this student.</p>
                                                    ) : (
                                                        Array.from(new Set(s.marks.map(m => m.subject))).sort().map(subj => {
                                                            const subjMarks = s.marks.filter(m => m.subject === subj);
                                                            return (
                                                                <div key={subj} className="space-y-2">
                                                                    <h4 className="text-sm font-bold text-indigo-300 px-2 tracking-wide uppercase">{subj}</h4>
                                                                    <MarksTable
                                                                        marks={subjMarks.map((m) => ({ ...m, roll_number: s.roll_number }))}
                                                                        onEdit={handleEdit}
                                                                        onDelete={handleDelete}
                                                                    />
                                                                </div>
                                                            )
                                                        })
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}

                {/* Tab: Add / Edit Mark */}
                {tab === 1 && (
                    <div className="card max-w-2xl">
                        <h3 className="text-lg font-semibold text-white mb-5">Add Single Mark</h3>
                        {/* Open modal inline */}
                        <MarkModal
                            onClose={() => { setShowMarkModal(false); setEditMark(null); }}
                            onSaved={() => { fetchAll(); toast.success('Saved!'); }}
                            inline
                        />
                    </div>
                )}

                {/* Tab: Upload CSV */}
                {tab === 2 && (
                    <div className="card max-w-2xl">
                        <CSVUpload onUploaded={fetchAll} />
                    </div>
                )}

                {/* Tab: Register Student */}
                {tab === 3 && (
                    <div className="card max-w-lg">
                        <h3 className="text-lg font-semibold text-white mb-5">Register New Student</h3>
                        <form onSubmit={handleRegister} className="space-y-4">
                            {[
                                { name: 'roll_number', label: 'Roll Number', placeholder: 'e.g. CS2024001', required: true },
                                { name: 'name', label: 'Full Name', placeholder: 'e.g. John Doe', required: true },
                                { name: 'email', label: 'Email (Optional)', placeholder: 'e.g. john@example.com', required: false },
                            ].map(({ name, label, placeholder, required }) => (
                                <div key={name}>
                                    <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wide">{label}</label>
                                    <input
                                        className="input-field"
                                        name={name}
                                        type={name === 'email' ? 'email' : 'text'}
                                        value={regForm[name]}
                                        onChange={(e) => setRegForm((p) => ({ ...p, [name]: e.target.value }))}
                                        placeholder={placeholder}
                                        required={required}
                                    />
                                </div>
                            ))}
                            <button type="submit" disabled={regLoading} className="btn-primary w-full">
                                {regLoading ? 'Registering...' : 'Register Student'}
                            </button>
                        </form>

                        {generatedCreds && (
                            <div className="mt-5 p-4 rounded-xl" style={{ background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.3)' }}>
                                <p className="text-xs font-semibold text-indigo-300 uppercase tracking-wide mb-3">✓ Student Credentials Generated</p>
                                <p className="text-xs text-slate-400 mb-1">Share these credentials with the student securely.</p>
                                <div className="space-y-2 mt-3">
                                    <div className="flex justify-between">
                                        <span className="text-xs text-slate-500">Name</span>
                                        <span className="text-sm font-medium text-white">{generatedCreds.name}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-xs text-slate-500">Roll Number</span>
                                        <span className="text-sm font-mono text-indigo-300">{generatedCreds.roll_number}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-xs text-slate-500">Password</span>
                                        <span className="text-sm font-mono text-green-300">{generatedCreds.password}</span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Tab: Bulk Register Students */}
                {tab === 4 && (
                    <div className="card max-w-3xl space-y-5">
                        <div>
                            <h3 className="text-lg font-semibold text-white">Bulk Register Students</h3>
                            <p className="text-xs text-slate-500 mt-1">Paste CSV data below or upload a file. Format: <span className="font-mono text-indigo-300">roll_number,name,email(optional)</span></p>
                        </div>
                        <button
                            onClick={() => {
                                const blob = new Blob(['roll_number,name,email\nCS2024001,Ahmed Ali,ahmed@example.com\nCS2024002,Sara Khan,\n'], { type: 'text/csv' });
                                const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'students_template.csv'; a.click();
                            }}
                            className="btn-secondary flex items-center gap-2 text-xs w-fit"
                        >
                            ⬇ Download Template CSV
                        </button>
                        <input ref={bulkFileRef} type="file" accept=".csv" className="hidden" onChange={(e) => {
                            const file = e.target.files[0]; if (!file) return;
                            const reader = new FileReader();
                            reader.onload = (ev) => setBulkText(ev.target.result);
                            reader.readAsText(file); e.target.value = '';
                        }} />
                        <button onClick={() => bulkFileRef.current.click()} className="btn-secondary text-xs">📂 Load from CSV file</button>
                        <textarea
                            className="input-field font-mono text-xs min-h-[160px] resize-y"
                            placeholder={"roll_number,name,email\nCS2024001,Ahmed Ali,ahmed@example.com\nCS2024002,Sara Khan,"}
                            value={bulkText}
                            onChange={(e) => { setBulkText(e.target.value); setBulkResult(null); }}
                        />
                        <button
                            disabled={!bulkText.trim() || bulkLoading}
                            className="btn-primary w-full"
                            onClick={async () => {
                                setBulkLoading(true); setBulkResult(null);
                                try {
                                    const lines = bulkText.trim().split('\n').filter(Boolean);
                                    const dataLines = lines[0].toLowerCase().startsWith('roll_number') ? lines.slice(1) : lines;
                                    const students = dataLines.map(line => {
                                        const [roll_number, name, email] = line.split(',').map(s => s?.trim());
                                        return { roll_number, name, email: email || undefined };
                                    });
                                    const res = await registerBulkStudents(students);
                                    setBulkResult(res.data); toast.success(res.data.message); fetchAll();
                                } catch (err) {
                                    toast.error(err.response?.data?.message || 'Bulk registration failed.');
                                } finally { setBulkLoading(false); }
                            }}
                        >{bulkLoading ? 'Registering...' : 'Register All Students'}</button>

                        {bulkResult && (
                            <div className="space-y-4">
                                <div className="flex gap-3">
                                    <span className="badge-success">✓ {bulkResult.credentials.length} registered</span>
                                    {bulkResult.errors?.length > 0 && <span className="badge-danger">✗ {bulkResult.errors.length} failed</span>}
                                </div>
                                {bulkResult.credentials.length > 0 && (
                                    <div>
                                        <p className="text-xs text-slate-400 mb-2 font-semibold uppercase tracking-wide">Generated Credentials</p>
                                        <div className="overflow-x-auto rounded-xl border border-white/8">
                                            <table className="w-full text-xs">
                                                <thead><tr style={{ background: 'rgba(255,255,255,0.04)' }}>
                                                    {['Roll Number', 'Name', 'Password'].map(h => <th key={h} className="text-left px-4 py-3 text-slate-400 uppercase tracking-wide font-semibold">{h}</th>)}
                                                </tr></thead>
                                                <tbody>{bulkResult.credentials.map((c, i) => (
                                                    <tr key={i} className="border-t border-white/5">
                                                        <td className="px-4 py-2 font-mono text-indigo-300">{c.roll_number}</td>
                                                        <td className="px-4 py-2 text-slate-200">{c.name}</td>
                                                        <td className="px-4 py-2 font-mono text-green-300">{c.password}</td>
                                                    </tr>
                                                ))}</tbody>
                                            </table>
                                        </div>
                                        <button className="btn-secondary text-xs mt-3" onClick={() => {
                                            const csv = 'Roll Number,Name,Password\n' + bulkResult.credentials.map(c => `${c.roll_number},${c.name},${c.password}`).join('\n');
                                            const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
                                            a.download = 'registered_credentials.csv'; a.click();
                                        }}>⬇ Download Credentials CSV</button>
                                    </div>
                                )}
                                {bulkResult.errors?.length > 0 && bulkResult.errors.map((e, i) => (
                                    <p key={i} className="text-xs text-red-400">{e.roll_number}: {e.error}</p>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Tab: Reset Student Password */}
                {tab === 5 && (
                    <div className="card max-w-lg space-y-5">
                        <div>
                            <h3 className="text-lg font-semibold text-white">Reset Student Password</h3>
                            <p className="text-xs text-slate-500 mt-1">Generate a new password for a student and share it directly.</p>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wide">Student Roll Number</label>
                            <input className="input-field" placeholder="e.g. CS2024001" value={resetRoll}
                                onChange={(e) => { setResetRoll(e.target.value); setResetCreds(null); }} />
                        </div>
                        <button disabled={!resetRoll.trim() || resetLoading} className="btn-primary w-full"
                            onClick={async () => {
                                setResetLoading(true); setResetCreds(null);
                                try {
                                    const res = await forgotPassword(resetRoll.trim());
                                    setResetCreds(res.data.credentials); toast.success('Password reset!'); setResetRoll('');
                                } catch (err) {
                                    toast.error(err.response?.data?.message || 'Reset failed.');
                                } finally { setResetLoading(false); }
                            }}
                        >{resetLoading ? 'Resetting...' : 'Reset Password'}</button>

                        {resetCreds && (
                            <div className="p-4 rounded-xl space-y-3" style={{ background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.3)' }}>
                                <p className="text-xs font-semibold text-indigo-300 uppercase tracking-wide">✓ New Credentials — share with student</p>
                                {[['Name', resetCreds.name, 'text-white'], ['Roll Number', resetCreds.roll_number, 'text-indigo-300 font-mono'], ['New Password', resetCreds.password, 'text-green-300 font-mono']].map(([label, val, cls]) => (
                                    <div key={label} className="flex justify-between items-center">
                                        <span className="text-xs text-slate-500">{label}</span>
                                        <span className={`text-sm ${cls}`}>{val}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </main>

            {/* Modals */}
            {showMarkModal && (
                <MarkModal
                    editMark={editMark}
                    onClose={() => { setShowMarkModal(false); setEditMark(null); }}
                    onSaved={() => { setShowMarkModal(false); setEditMark(null); fetchAll(); }}
                />
            )}
            {showChangePwd && <ChangePasswordModal onClose={() => setShowChangePwd(false)} />}
        </div>
    );
}
