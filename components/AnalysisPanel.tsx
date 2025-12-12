import React, { useState } from 'react';
import { ReviewResult, Issue } from '../types';
import { ShieldAlert, CheckCircle, Zap, Code, Copy, MousePointerClick } from 'lucide-react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface AnalysisPanelProps {
    result: ReviewResult;
    onApply: (code: string) => void;
    onIssueSelect: (line: number) => void;
}

const AnalysisPanel: React.FC<AnalysisPanelProps> = ({ result, onApply, onIssueSelect }) => {
    const [activeTab, setActiveTab] = useState<'issues' | 'refactor'>('issues');
    const [copied, setCopied] = useState(false);

    const getSeverityColor = (severity: Issue['severity']) => {
        switch (severity) {
            case 'critical': return 'text-red-500 border-red-500';
            case 'high': return 'text-orange-500 border-orange-500';
            case 'medium': return 'text-yellow-500 border-yellow-500';
            case 'low': return 'text-blue-500 border-blue-500';
            default: return 'text-gray-500 border-gray-500';
        }
    };

    // Clean the code string (remove markdown code blocks if AI included them)
    const getCleanCode = (code: string) => {
        if (!code) return '';
        return code.replace(/^```(\w+)?\n/, '').replace(/```$/, '');
    };

    const handleCopy = (code: string) => {
        navigator.clipboard.writeText(code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const cleanCode = result.refactoredCode ? getCleanCode(result.refactoredCode) : '';

    return (
        <div className="flex flex-col h-full bg-terminal-dark">
            {/* Header Summary */}
            <div className="p-6 border-b border-terminal-border bg-terminal-gray/30">
                <div className="flex items-start justify-between mb-4">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <h2 className="text-xl font-bold text-white">代码审查报告</h2>
                            <span className="text-[10px] bg-terminal-border px-1.5 py-0.5 rounded text-terminal-dim font-mono border border-terminal-border/50">
                    {result.modelUsed || 'AI Model'}
                </span>
                        </div>
                        <p className="text-terminal-dim text-sm leading-relaxed line-clamp-2">{result.summary}</p>
                    </div>
                    <div className="flex flex-col items-center justify-center min-w-[64px] h-16 rounded-full border-4 border-terminal-green/20 bg-terminal-black ml-4">
            <span className={`text-xl font-bold ${result.score > 80 ? 'text-green-400' : result.score > 50 ? 'text-yellow-400' : 'text-red-400'}`}>
              {result.score}
            </span>
                        <span className="text-[10px] uppercase text-terminal-dim">质量评分</span>
                    </div>
                </div>

                <div className="flex gap-4 mt-2">
                    <button
                        onClick={() => setActiveTab('issues')}
                        className={`text-xs font-mono pb-1 border-b-2 transition-colors ${activeTab === 'issues' ? 'border-terminal-green text-white' : 'border-transparent text-terminal-dim hover:text-terminal-text'}`}
                    >
                        问题列表 ({result.issues.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('refactor')}
                        className={`text-xs font-mono pb-1 border-b-2 transition-colors ${activeTab === 'refactor' ? 'border-terminal-blue text-white' : 'border-transparent text-terminal-dim hover:text-terminal-text'}`}
                    >
                        优化参考
                    </button>
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-auto p-6">
                {activeTab === 'issues' ? (
                    <div className="space-y-4">
                        {result.issues.length === 0 && (
                            <div className="text-center text-terminal-dim py-10">
                                <CheckCircle className="mx-auto mb-3 opacity-50" size={32} />
                                <p>没有发现明显问题。代码看起来很棒！</p>
                            </div>
                        )}
                        {result.issues.map((issue, idx) => (
                            <div
                                key={idx}
                                onClick={() => issue.line && onIssueSelect(issue.line)}
                                className={`border p-4 rounded bg-terminal-black/30 ${getSeverityColor(issue.severity)} bg-opacity-5 relative group transition-all duration-200 ${issue.line ? 'cursor-pointer hover:bg-terminal-blue/5 hover:ring-1 hover:ring-current' : ''}`}
                            >
                                {issue.line && (
                                    <div className="absolute right-4 top-4 opacity-0 group-hover:opacity-100 transition-opacity text-terminal-blue">
                                        <MousePointerClick size={16} />
                                    </div>
                                )}
                                <div className="flex items-start gap-3">
                                    <ShieldAlert size={18} className={`mt-0.5 shrink-0 ${getSeverityColor(issue.severity).split(' ')[0]}`} />
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                <span className={`text-xs font-bold uppercase border px-1.5 rounded ${getSeverityColor(issue.severity)}`}>
                                    {issue.severity}
                                </span>
                                            {issue.line && (
                                                <span className="text-xs text-terminal-dim font-mono group-hover:text-terminal-blue transition-colors">
                                        Line {issue.line}
                                    </span>
                                            )}
                                        </div>
                                        <p className="text-sm text-terminal-text mb-2">{issue.description}</p>
                                        <div className="text-xs bg-terminal-black/50 p-2 rounded border border-terminal-border/30 text-terminal-dim font-mono">
                                            <span className="text-terminal-blue">Suggestion:</span> {issue.suggestion}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="h-full flex flex-col">
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2 text-terminal-text text-sm">
                                <Code size={16} />
                                <span>Recommended Changes</span>
                            </div>
                            <button
                                onClick={() => handleCopy(cleanCode)}
                                className="flex items-center gap-1.5 text-xs text-terminal-dim hover:text-white transition-colors"
                            >
                                {copied ? <CheckCircle size={12} /> : <Copy size={12} />}
                                {copied ? 'Copied!' : 'Copy Code'}
                            </button>
                        </div>

                        <div className="flex-1 border border-terminal-border rounded overflow-hidden relative group">
                            <div className="absolute top-0 left-0 right-0 h-6 bg-[#1e1e1e] flex items-center px-2 gap-1.5 border-b border-[#333] z-10">
                                <div className="w-2.5 h-2.5 rounded-full bg-[#ff5f56]"></div>
                                <div className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e]"></div>
                                <div className="w-2.5 h-2.5 rounded-full bg-[#27c93f]"></div>
                            </div>
                            <SyntaxHighlighter
                                language="javascript"
                                style={vscDarkPlus}
                                customStyle={{ margin: 0, height: '100%', fontSize: '13px', backgroundColor: '#0d0d0d', paddingTop: '32px' }}
                                showLineNumbers={true}
                            >
                                {cleanCode || '// No refactoring suggestions provided.'}
                            </SyntaxHighlighter>
                        </div>

                        <div className="mt-4 flex justify-end">
                            <button
                                onClick={() => onApply(cleanCode)}
                                disabled={!cleanCode}
                                className="bg-terminal-blue/10 text-terminal-blue border border-terminal-blue/50 px-4 py-2 rounded text-xs font-bold hover:bg-terminal-blue/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                <Zap size={14} />
                                Apply Changes
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AnalysisPanel;