import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { forgotPassword } from '../services/api';

export default function ForgotPassword() {
    const [rollNumber, setRollNumber] = useState('');
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [done, setDone] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const { data } = await forgotPassword(rollNumber, email);
            toast.success(data.message || 'New credentials sent!');
            setDone(true);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to reset password.');
        } finally {
            setLoading(false);
        }
    };

    if (done) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4 font-sans">
                <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl text-center">
                    <div className="w-16 h-16 bg-green-500/10 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-slate-100 mb-2">Check Your Email</h2>
                    <p className="text-slate-400 mb-8">
                        A new password has been sent to your registered email address.
                    </p>
                    <Link
                        to="/login"
                        className="inline-block w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition-all shadow-lg active:scale-95"
                    >
                        Back to Login
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4 font-sans">
            <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-white tracking-tight">Forgot Password?</h1>
                    <p className="text-slate-400 mt-2">Enter your Roll Number and Email to receive a new password.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Roll Number</label>
                        <input
                            type="text"
                            required
                            value={rollNumber}
                            onChange={(e) => setRollNumber(e.target.value)}
                            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all placeholder-slate-500"
                            placeholder="e.g. STU12345"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Registered Email</label>
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all placeholder-slate-500"
                            placeholder="e.g. yourname@example.com"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading || !rollNumber.trim() || !email.trim()}
                        className="w-full py-4 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all shadow-lg shadow-indigo-500/20 active:scale-95 flex items-center justify-center"
                    >
                        {loading ? (
                            <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                        ) : 'Reset Password'}
                    </button>

                    <div className="text-center">
                        <Link to="/login" className="text-indigo-400 hover:text-indigo-300 text-sm font-medium transition-colors">
                            Wait, I remember it! Login
                        </Link>
                    </div>
                </form>
            </div>
        </div>
    );
}
