import { useState } from 'react';
import toast from 'react-hot-toast';
import { changePassword as apiChangePassword } from '../services/api';

export default function ChangePasswordModal({ onClose }) {
    const [form, setForm] = useState({ current_password: '', new_password: '', confirm_password: '' });
    const [loading, setLoading] = useState(false);

    const handleChange = (e) =>
        setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (form.new_password !== form.confirm_password) {
            toast.error('New passwords do not match.');
            return;
        }
        if (form.new_password.length < 6) {
            toast.error('New password must be at least 6 characters.');
            return;
        }
        setLoading(true);
        try {
            await apiChangePassword(form.current_password, form.new_password);
            toast.success('Password changed successfully!');
            onClose();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to change password.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}>
            <div className="glass rounded-2xl p-6 w-full max-w-md shadow-2xl">
                <div className="flex items-center justify-between mb-5">
                    <h2 className="text-lg font-bold text-white">Change Password</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    {[
                        { name: 'current_password', label: 'Current Password' },
                        { name: 'new_password', label: 'New Password' },
                        { name: 'confirm_password', label: 'Confirm New Password' },
                    ].map(({ name, label }) => (
                        <div key={name}>
                            <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wide">
                                {label}
                            </label>
                            <input
                                className="input-field"
                                name={name}
                                type="password"
                                value={form[name]}
                                onChange={handleChange}
                                placeholder="••••••••"
                                required
                            />
                        </div>
                    ))}
                    <div className="flex gap-3 pt-2">
                        <button type="button" onClick={onClose} className="btn-secondary flex-1">
                            Cancel
                        </button>
                        <button type="submit" disabled={loading} className="btn-primary flex-1">
                            {loading ? 'Changing...' : 'Change Password'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
