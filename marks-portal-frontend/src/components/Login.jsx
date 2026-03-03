import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

export default function Login() {
    const { login } = useAuth();
    const navigate = useNavigate();
    const [form, setForm] = useState({ roll_number: '', password: '' });
    const [loading, setLoading] = useState(false);

    const handleChange = (e) =>
        setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.roll_number.trim() || !form.password.trim()) {
            toast.error('Please fill in all fields.');
            return;
        }
        setLoading(true);
        try {
            const user = await login(form.roll_number.trim(), form.password);
            toast.success(`Welcome back, ${user.name}!`);
            navigate(user.role === 'admin' ? '/admin' : '/dashboard');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Login failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
            {/* Background blobs */}
            <div className="absolute top-[-10%] left-[-5%] w-96 h-96 rounded-full opacity-20"
                style={{ background: 'radial-gradient(circle, #6366f1, transparent 70%)' }} />
            <div className="absolute bottom-[-10%] right-[-5%] w-96 h-96 rounded-full opacity-20"
                style={{ background: 'radial-gradient(circle, #a855f7, transparent 70%)' }} />

            <div className="w-full max-w-md relative z-10">
                {/* Institution branding */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4 gradient-brand shadow-lg shadow-indigo-500/30">
                        <svg className="w-9 h-9 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                d="M12 14l9-5-9-5-9 5 9 5zm0 7v-6m0 0l-9-5m9 5l9-5" />
                        </svg>
                    </div>
                    <h1 className="text-3xl font-bold gradient-text mb-1">Student Portal</h1>
                    <p className="text-slate-400 text-sm">Academic Excellence Platform</p>
                </div>

                {/* Login card */}
                <div className="glass rounded-2xl p-8 shadow-2xl">
                    <h2 className="text-xl font-semibold text-white mb-6">Sign In</h2>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wide">
                                Roll Number
                            </label>
                            <input
                                className="input-field"
                                name="roll_number"
                                value={form.roll_number}
                                onChange={handleChange}
                                placeholder="e.g. CS2024001"
                                autoComplete="username"
                                autoFocus
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wide">
                                Password
                            </label>
                            <input
                                className="input-field"
                                name="password"
                                type="password"
                                value={form.password}
                                onChange={handleChange}
                                placeholder="Enter your password"
                                autoComplete="current-password"
                            />
                            <div className="flex justify-end mt-1">
                                <a href="/forgot-password" size="sm" className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors">
                                    Forgot password?
                                </a>
                            </div>
                        </div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="btn-primary w-full mt-2 py-3 text-base"
                        >
                            {loading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                                    </svg>
                                    Signing in...
                                </span>
                            ) : 'Sign In'}
                        </button>
                    </form>
                    <p className="text-center text-xs text-slate-500 mt-6">
                        Admins use their designated admin roll number.
                    </p>
                </div>

                <p className="text-center text-xs text-slate-600 mt-4">
                    © {new Date().getFullYear()} Academic Portal. All rights reserved.
                </p>
            </div>
        </div>
    );
}
