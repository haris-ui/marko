import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { addMark, updateMark, getStudentsList } from '../services/api';

const EXAM_TYPES = ['Quiz', 'Assignment', 'Quiz 1', 'Quiz 2', 'Assignment 1', 'Assignment 2', 'Midterm', 'Final', 'Project', 'Other'];
const empty = { roll_number: '', subject: '', marks_obtained: '', total_marks: '', exam_type: '' };

/**
 * MarkModal — works as a full-screen modal (default) or an inline form (inline prop).
 */
export default function MarkModal({ onClose, onSaved, editMark = null, inline = false }) {
    const isEdit = !!editMark;
    const [form, setForm] = useState(
        isEdit
            ? {
                roll_number: editMark.roll_number || '',
                subject: editMark.subject || '',
                marks_obtained: editMark.marks_obtained || '',
                total_marks: editMark.total_marks || '',
                exam_type: editMark.exam_type || '',
            }
            : empty
    );
    const [loading, setLoading] = useState(false);
    const [students, setStudents] = useState([]);

    useEffect(() => {
        if (!isEdit) {
            getStudentsList()
                .then((r) => setStudents(r.data.students))
                .catch(() => { });
        }
    }, [isEdit]);

    const handleChange = (e) =>
        setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

    const resetForm = () => setForm(empty);

    const handleSubmit = async (e) => {
        e.preventDefault();
        const { roll_number, subject, marks_obtained, total_marks, exam_type } = form;
        if (!subject.trim() || !marks_obtained || !total_marks || !exam_type) {
            toast.error('Please fill all required fields.');
            return;
        }
        if (!isEdit && !roll_number.trim()) {
            toast.error('Roll number is required.');
            return;
        }
        if (parseFloat(marks_obtained) > parseFloat(total_marks)) {
            toast.error('Marks obtained cannot exceed total marks.');
            return;
        }
        setLoading(true);
        try {
            if (isEdit) {
                await updateMark(editMark.id, { subject, marks_obtained, total_marks, exam_type });
                toast.success('Mark updated!');
            } else {
                await addMark({ roll_number, subject, marks_obtained, total_marks, exam_type });
                toast.success('Mark added!');
                resetForm();
            }
            onSaved?.();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Operation failed.');
        } finally {
            setLoading(false);
        }
    };

    const formContent = (
        <form onSubmit={handleSubmit} className="space-y-4">
            {!isEdit && (
                <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wide">Roll Number</label>
                    <input
                        list="student-list"
                        className="input-field"
                        name="roll_number"
                        value={form.roll_number}
                        onChange={handleChange}
                        placeholder="Type or select roll number"
                        required
                    />
                    <datalist id="student-list">
                        {students.map((s) => (
                            <option key={s.id} value={s.roll_number}>{s.name}</option>
                        ))}
                    </datalist>
                </div>
            )}
            <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wide">Subject</label>
                <input
                    className="input-field"
                    name="subject"
                    value={form.subject}
                    onChange={handleChange}
                    placeholder="e.g. Mathematics"
                    required
                />
            </div>
            <div className="grid grid-cols-2 gap-3">
                <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wide">Marks Obtained</label>
                    <input
                        className="input-field"
                        name="marks_obtained"
                        type="number"
                        step="0.01"
                        min="0"
                        value={form.marks_obtained}
                        onChange={handleChange}
                        placeholder="e.g. 75"
                        required
                    />
                </div>
                <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wide">Total Marks</label>
                    <input
                        className="input-field"
                        name="total_marks"
                        type="number"
                        step="0.01"
                        min="1"
                        value={form.total_marks}
                        onChange={handleChange}
                        placeholder="e.g. 100"
                        required
                    />
                </div>
            </div>
            <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wide">Exam Type</label>
                <select
                    className="input-field"
                    name="exam_type"
                    value={form.exam_type}
                    onChange={handleChange}
                    required
                >
                    <option value="" disabled>Select exam type</option>
                    {EXAM_TYPES.map((t) => (
                        <option key={t} value={t}>{t}</option>
                    ))}
                </select>
            </div>
            <div className="flex gap-3 pt-2">
                {!inline && (
                    <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
                )}
                <button type="submit" disabled={loading} className={`btn-primary ${inline ? 'w-full' : 'flex-1'}`}>
                    {loading ? 'Saving...' : isEdit ? 'Update Mark' : 'Add Mark'}
                </button>
            </div>
        </form>
    );

    if (inline) return formContent;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)' }}
        >
            <div className="glass rounded-2xl p-6 w-full max-w-lg shadow-2xl">
                <div className="flex items-center justify-between mb-5">
                    <h2 className="text-lg font-bold text-white">{isEdit ? 'Edit Mark' : 'Add Mark'}</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                {formContent}
            </div>
        </div>
    );
}
