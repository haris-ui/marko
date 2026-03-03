import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

/**
 * Calculate percentage and badge class.
 */
export function getPercent(obtained, total) {
    if (!total) return 0;
    return ((obtained / total) * 100).toFixed(1);
}

export function getBadge(pct) {
    const p = parseFloat(pct);
    if (p >= 75) return 'badge-success';
    if (p >= 50) return 'badge-warning';
    return 'badge-danger';
}

export function getGrade(pct) {
    const p = parseFloat(pct);
    if (p >= 90) return 'A+';
    if (p >= 80) return 'A';
    if (p >= 70) return 'B';
    if (p >= 60) return 'C';
    if (p >= 50) return 'D';
    return 'F';
}

/**
 * MarksTable — reusable table component.
 * Props: marks (array), showStudent (bool), onEdit (fn), onDelete (fn), studentName
 */
export default function MarksTable({ marks = [], showStudent = false, onEdit, onDelete, studentName }) {
    const totalObtained = marks.reduce((s, m) => s + parseFloat(m.marks_obtained), 0);
    const totalMarks = marks.reduce((s, m) => s + parseFloat(m.total_marks), 0);
    const overall = totalMarks > 0 ? getPercent(totalObtained, totalMarks) : null;

    const handleDownloadPDF = () => {
        const doc = new jsPDF();
        doc.setFontSize(16);
        doc.text('Student Marks Report', 14, 18);
        if (studentName) {
            doc.setFontSize(11);
            doc.text(`Student: ${studentName}`, 14, 27);
        }
        autoTable(doc, {
            startY: studentName ? 33 : 25,
            head: [['Exam Type', 'Obtained', 'Total', 'Percentage', 'Grade']],
            body: marks.map((m) => {
                const pct = getPercent(m.marks_obtained, m.total_marks);
                return [m.exam_type, m.marks_obtained, m.total_marks, `${pct}%`, getGrade(pct)];
            }),
            theme: 'grid',
            headStyles: { fillColor: [99, 102, 241] },
        });
        if (overall !== null) {
            const finalY = doc.lastAutoTable.finalY + 8;
            doc.setFontSize(11);
            doc.text(`Overall: ${totalObtained.toFixed(2)} / ${totalMarks.toFixed(2)} (${overall}%)`, 14, finalY);
        }
        doc.save(`marks_${studentName || 'report'}.pdf`);
    };

    if (marks.length === 0) {
        return (
            <div className="text-center py-12 text-slate-500">
                <svg className="w-12 h-12 mx-auto mb-3 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                No marks records found.
            </div>
        );
    }

    return (
        <div>
            <div className="flex items-center justify-between mb-3">
                {overall !== null && (
                    <div className="flex items-center gap-3">
                        <span className="text-sm text-slate-400">Overall:</span>
                        <span className={getBadge(overall)}>
                            {overall}% — {getGrade(overall)}
                        </span>
                        <span className="text-xs text-slate-500">
                            ({totalObtained.toFixed(1)} / {totalMarks.toFixed(1)})
                        </span>
                    </div>
                )}
                {!onEdit && (
                    <button onClick={handleDownloadPDF} className="btn-secondary flex items-center gap-2 text-xs ml-auto">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        Download PDF
                    </button>
                )}
            </div>
            <div className="overflow-x-auto rounded-xl border border-white/8">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-white/8" style={{ background: 'rgba(255,255,255,0.04)' }}>
                            {showStudent && <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">Student</th>}
                            <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">Exam</th>
                            <th className="text-right px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">Obtained</th>
                            <th className="text-right px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">Total</th>
                            <th className="text-right px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">%</th>
                            <th className="text-center px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">Grade</th>
                            {(onEdit || onDelete) && <th className="px-4 py-3"></th>}
                        </tr>
                    </thead>
                    <tbody>
                        {marks.map((m, i) => {
                            const pct = getPercent(m.marks_obtained, m.total_marks);
                            return (
                                <tr key={m.id}
                                    className="border-b border-white/5 hover:bg-white/3 transition-colors"
                                    style={i % 2 === 0 ? {} : { background: 'rgba(255,255,255,0.02)' }}>
                                    {showStudent && (
                                        <td className="px-4 py-3 text-slate-200">{m.student_name || m.roll_number}</td>
                                    )}
                                    <td className="px-4 py-3">
                                        <span className="text-xs text-slate-400 bg-white/5 px-2 py-0.5 rounded-full">{m.exam_type}</span>
                                    </td>
                                    <td className="px-4 py-3 text-right text-slate-200">{parseFloat(m.marks_obtained).toFixed(1)}</td>
                                    <td className="px-4 py-3 text-right text-slate-400">{parseFloat(m.total_marks).toFixed(1)}</td>
                                    <td className="px-4 py-3 text-right font-semibold text-slate-200">{pct}%</td>
                                    <td className="px-4 py-3 text-center">
                                        <span className={getBadge(pct)}>{getGrade(pct)}</span>
                                    </td>
                                    {(onEdit || onDelete) && (
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-2 justify-end">
                                                {onEdit && (
                                                    <button onClick={() => onEdit(m)} className="btn-edit">Edit</button>
                                                )}
                                                {onDelete && (
                                                    <button onClick={() => onDelete(m.id)} className="btn-danger">Delete</button>
                                                )}
                                            </div>
                                        </td>
                                    )}
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
