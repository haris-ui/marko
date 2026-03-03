import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { getMyMarks } from '../services/api';
import MarksTable from './MarksTable';
import ChangePasswordModal from './ChangePasswordModal';

export default function StudentDashboard() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [marks, setMarks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showChangePwd, setShowChangePwd] = useState(false);

    useEffect(() => {
        getMyMarks()
            .then((res) => setMarks(res.data.marks))
            .catch(() => toast.error('Failed to load marks.'))
            .finally(() => setLoading(false));
    }, []);

    const handleLogout = () => {
        logout();
        toast.success('Logged out successfully.');
        navigate('/login');
    };

    const downloadMarksPDF = () => {
        if (marks.length === 0) {
            toast.error('No marks to download.');
            return;
        }

        const doc = new jsPDF();
        doc.setFontSize(20);
        doc.text('Student Marks Report', 14, 22);

        doc.setFontSize(11);
        doc.setTextColor(100);
        doc.text(`Name: ${user?.name}`, 14, 32);
        doc.text(`Roll Number: ${user?.roll_number}`, 14, 38);
        doc.text(`Report Generated: ${new Date().toLocaleDateString()}`, 14, 44);

        const tableColumn = ["Subject", "Exam Type", "Obtained", "Total", "Percentage"];
        const tableRows = marks.map(m => [
            m.subject,
            m.exam_type,
            m.marks_obtained,
            m.total_marks,
            `${((m.marks_obtained / m.total_marks) * 100).toFixed(1)}%`
        ]);

        doc.autoTable({
            head: [tableColumn],
            body: tableRows,
            startY: 50,
            theme: 'striped',
            headStyles: { fillColor: [79, 70, 229] },
        });

        doc.save(`${user?.roll_number}_marks.pdf`);
        toast.success('Marks report downloaded!');
    };

    // Summary stats
    const totalSubjects = new Set(marks.map((m) => m.subject)).size;
    const totalObtained = marks.reduce((s, m) => s + parseFloat(m.marks_obtained), 0);
    const totalMarks = marks.reduce((s, m) => s + parseFloat(m.total_marks), 0);
    const overallPct = totalMarks > 0 ? ((totalObtained / totalMarks) * 100).toFixed(1) : null;

    return (
        <div className="min-h-screen">
            {/* Header */}
            <header className="glass-dark sticky top-0 z-40 px-6 py-4">
                <div className="max-w-6xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl gradient-brand flex items-center justify-center shadow-lg shadow-indigo-500/30">
                            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                    d="M12 14l9-5-9-5-9 5 9 5zm0 7v-6m0 0l-9-5m9 5l9-5" />
                            </svg>
                        </div>
                        <div>
                            <h1 className="text-base font-bold text-white leading-tight">Student Portal</h1>
                            <p className="text-xs text-slate-500">{user?.roll_number}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <button onClick={downloadMarksPDF} className="btn-secondary text-xs flex items-center gap-1.5">
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                            Download PDF
                        </button>
                        <button onClick={() => setShowChangePwd(true)} className="btn-secondary text-xs">
                            Change Password
                        </button>
                        <button onClick={handleLogout} className="btn-danger text-xs">
                            Logout
                        </button>
                    </div>
                </div>
            </header>

            <main className="max-w-6xl mx-auto px-6 py-8">
                {/* Welcome banner */}
                <div className="card mb-6" style={{
                    background: 'linear-gradient(135deg, rgba(99,102,241,0.15) 0%, rgba(168,85,247,0.15) 100%)',
                    borderColor: 'rgba(99,102,241,0.3)'
                }}>
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl gradient-brand flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-indigo-500/30">
                            {user?.name?.[0]?.toUpperCase() || 'S'}
                        </div>
                        <div>
                            <p className="text-xs text-slate-400 mb-0.5">Welcome back,</p>
                            <h2 className="text-2xl font-bold text-white">{user?.name}</h2>
                            <p className="text-sm text-slate-400">{user?.roll_number}</p>
                        </div>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    {[
                        { label: 'Total Exams', value: marks.length, icon: '📋' },
                        { label: 'Subjects', value: totalSubjects, icon: '📚' },
                        { label: 'Total Obtained', value: totalObtained.toFixed(1), icon: '✅' },
                        { label: 'Overall %', value: overallPct ? `${overallPct}%` : '—', icon: '🎯' },
                    ].map(({ label, value, icon }) => (
                        <div key={label} className="card text-center">
                            <div className="text-2xl mb-1">{icon}</div>
                            <div className="text-2xl font-bold text-white">{value}</div>
                            <div className="text-xs text-slate-500 mt-1">{label}</div>
                        </div>
                    ))}
                </div>

                {/* Marks table grouped by subject */}
                <div className="space-y-6">
                    <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                        <svg className="w-5 h-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                        My Subjects & Assessments
                    </h3>
                    {loading ? (
                        <div className="text-center py-12 card">
                            <svg className="animate-spin w-8 h-8 text-indigo-400 mx-auto" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                            </svg>
                        </div>
                    ) : marks.length === 0 ? (
                        <div className="card text-center py-12 text-slate-500">No marks recorded yet.</div>
                    ) : (
                        Array.from(new Set(marks.map(m => m.subject))).sort().map(subject => {
                            const subjMarks = marks.filter(m => m.subject === subject);
                            return (
                                <div key={subject} className="card">
                                    <h4 className="text-md font-bold text-indigo-300 mb-4 px-2 tracking-wide uppercase">{subject}</h4>
                                    <MarksTable marks={subjMarks} />
                                </div>
                            );
                        })
                    )}
                </div>
            </main>

            {showChangePwd && <ChangePasswordModal onClose={() => setShowChangePwd(false)} />}
        </div>
    );
}
