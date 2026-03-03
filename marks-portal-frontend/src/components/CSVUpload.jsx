import { useState, useRef } from 'react';
import toast from 'react-hot-toast';
import { uploadCSV } from '../services/api';

const CSV_TEMPLATE = 'roll_number,marks_obtained,total_marks,exam_type\nCS2024001,85,100,Quiz 1\nCS2024002,72,100,Assignment 1\n';

export default function CSVUpload({ onUploaded }) {
    const [file, setFile] = useState(null);
    const [subject, setSubject] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [dragging, setDragging] = useState(false);
    const inputRef = useRef();

    const handleFile = (f) => {
        if (!f) return;
        if (!f.name.endsWith('.csv')) {
            toast.error('Please select a CSV file.');
            return;
        }
        setFile(f);
        setResult(null);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setDragging(false);
        handleFile(e.dataTransfer.files[0]);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!subject.trim()) { toast.error('Please enter or select a Subject first.'); return; }
        if (!file) { toast.error('Please select a CSV file first.'); return; }
        setLoading(true);
        try {
            const res = await uploadCSV(file, subject.trim());
            setResult(res.data);
            toast.success(res.data.message);
            onUploaded?.();
            setFile(null);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Upload failed.');
        } finally {
            setLoading(false);
        }
    };

    const downloadTemplate = () => {
        const blob = new Blob([CSV_TEMPLATE], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'marks_template.csv';
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="space-y-5">
            <div className="flex items-center justify-between mb-1">
                <div>
                    <h3 className="text-base font-semibold text-white">Bulk Upload Marks</h3>
                    <p className="text-xs text-slate-500 mt-0.5">Upload a CSV file to add or update multiple marks at once.</p>
                </div>
                <button onClick={downloadTemplate} className="btn-secondary flex items-center gap-1.5 text-xs">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Download Template
                </button>
            </div>

            {/* Subject Selection */}
            <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wide">
                    Subject for these marks <span className="text-red-400">*</span>
                </label>
                <input
                    type="text"
                    className="input-field"
                    placeholder="e.g. Mathematics, Physics, Computer Science"
                    value={subject}
                    onChange={(e) => { setSubject(e.target.value); setResult(null); }}
                    required
                />
            </div>

            {/* Drag & Drop Zone */}
            <div
                onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={handleDrop}
                onClick={() => inputRef.current.click()}
                className="border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all"
                style={{
                    borderColor: dragging ? '#6366f1' : 'rgba(255,255,255,0.15)',
                    background: dragging ? 'rgba(99,102,241,0.08)' : 'rgba(255,255,255,0.02)',
                }}
            >
                <input
                    ref={inputRef}
                    type="file"
                    accept=".csv"
                    className="hidden"
                    onChange={(e) => handleFile(e.target.files[0])}
                />
                <svg className="w-10 h-10 mx-auto mb-3 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                {file ? (
                    <div>
                        <p className="text-sm font-medium text-indigo-300">{file.name}</p>
                        <p className="text-xs text-slate-500 mt-1">{(file.size / 1024).toFixed(1)} KB</p>
                    </div>
                ) : (
                    <div>
                        <p className="text-sm text-slate-400">Drag & drop a CSV file here, or <span className="text-indigo-400 underline">browse</span></p>
                        <p className="text-xs text-slate-600 mt-1">Max 5MB · CSV only</p>
                    </div>
                )}
            </div>

            {/* CSV format hint */}
            <div className="rounded-xl p-4 text-xs font-mono" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <p className="text-slate-400 mb-1.5 font-sans font-semibold text-xs uppercase tracking-wide">Required CSV Columns:</p>
                <p className="text-indigo-300">roll_number, marks_obtained, total_marks, exam_type</p>
            </div>

            <button
                onClick={handleSubmit}
                disabled={!file || loading}
                className="btn-primary w-full flex items-center justify-center gap-2"
            >
                {loading ? (
                    <>
                        <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                        </svg>
                        Uploading...
                    </>
                ) : 'Upload CSV'}
            </button>

            {/* Results */}
            {result && (
                <div className="rounded-xl p-4 space-y-2" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <div className="flex items-center gap-4 mb-2">
                        <span className="badge-success">✓ {result.success_count} Succeeded</span>
                        {result.error_count > 0 && <span className="badge-danger">✗ {result.error_count} Failed</span>}
                    </div>
                    {result.errors?.length > 0 && (
                        <div className="space-y-1 max-h-40 overflow-y-auto">
                            {result.errors.map((e, i) => (
                                <p key={i} className="text-xs text-red-400">
                                    Line {e.line}: {e.error}
                                </p>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
