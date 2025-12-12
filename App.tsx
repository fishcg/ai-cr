import React, { useState, useRef, useEffect } from 'react';
import TerminalHeader from './components/TerminalHeader';
import DiffViewer from './components/DiffViewer';
import AnalysisPanel from './components/AnalysisPanel';
import { analyzeDiff, fetchDailyTip } from './services/aiService';
import { AppState, ReviewResult } from './types';
import { DEMO_DIFF, DEFAULT_AI_MODEL } from './constants';
import { Play, Loader2, Command, ArrowRight, GitCommit, Lightbulb } from 'lucide-react';

const App: React.FC = () => {
    const [status, setStatus] = useState<AppState>('IDLE');
    const [diffInput, setDiffInput] = useState<string>('');
    const [reviewResult, setReviewResult] = useState<ReviewResult | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [projectInfo, setProjectInfo] = useState({ name: 'cr-cli', branch: 'main' });
    const [isAutoLoaded, setIsAutoLoaded] = useState(false);
    const [loadingTip, setLoadingTip] = useState<string>('');
    const [highlightLine, setHighlightLine] = useState<number | null>(null);
    const [tokenRefreshTrigger, setTokenRefreshTrigger] = useState(0);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        // 1. 获取项目信息 (Safe Fetch)
        fetch('/api/project-info')
            .then(res => res.text())
            .then(text => {
                try {
                    const data = JSON.parse(text);
                    setProjectInfo(data);
                } catch (e) {
                    console.warn("Failed to parse project info:", e);
                }
            })
            .catch(console.error);

        // 2. 自动获取本地 Git Diff
        fetch('/api/diff')
            .then(res => res.text())
            .then(text => {
                if (text && text.trim().length > 0 && !text.includes("Error fetching")) {
                    setDiffInput(text);
                    setIsAutoLoaded(true);
                }
            })
            .catch(err => console.warn("Dev mode: could not fetch local diff", err));
    }, []);

    const handleAnalyze = async () => {
        if (!diffInput.trim()) return;

        setStatus('ANALYZING');
        setError(null);
        setHighlightLine(null);
        setLoadingTip("正在连接猫耳娘..."); // Default loading text

        // 1. Parallel Task: Fetch a fun tip (Don't await this for the main logic)
        fetchDailyTip()
            .then(tip => setLoadingTip(tip))
            .catch(() => setLoadingTip("编程提示：多喝水，少写 Bug。"));

        // 2. Main Task: Analyze Code
        try {
            const result = await analyzeDiff(diffInput);
            setReviewResult(result);
            setStatus('REVIEW_READY');
            setTokenRefreshTrigger(prev => prev + 1);
        } catch (err: any) {
            console.error(err);
            const msg = err.message || "无法连接到 AI 服务。";
            // Handle missing API key specific error if possible
            if (msg.includes("API key")) {
                setError("未找到 API Key。请确保在运行 cr 之前设置了 API_KEY 环境变量。");
            } else {
                setError(msg);
            }
            setStatus('IDLE');
        }
    };

    const loadDemo = () => {
        setDiffInput(DEMO_DIFF);
        setIsAutoLoaded(false);
        if (textareaRef.current) {
            textareaRef.current.value = DEMO_DIFF;
        }
    };

    const handleApply = (newCode: string) => {
        // In a real CLI, this would write to fs. Here we show a visual confirmation.
        alert("在真实 CLI 环境中，此操作将自动覆盖本地文件并提交变更。");
    };

    return (
        <div className="h-screen w-screen bg-black flex flex-col font-sans text-terminal-text bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-gray-900 via-[#050505] to-black overflow-hidden">

            {/* Main Window Container */}
            <div className="flex-1 w-full bg-terminal-dark flex flex-col relative overflow-hidden">

                <TerminalHeader
                    projectName={projectInfo.name}
                    branch={projectInfo.branch}
                    refreshTrigger={tokenRefreshTrigger}
                />

                {/* Workspace */}
                <div className="flex-1 flex overflow-hidden">

                    {/* Left Pane: Input / Diff (Takes remaining space) */}
                    <div className={`flex flex-col transition-all duration-500 ease-in-out ${status === 'REVIEW_READY' ? 'flex-1 min-w-0' : 'w-full'}`}>

                        {status === 'IDLE' && (
                            <div className="flex-1 flex flex-col p-6 relative">
                                {isAutoLoaded && (
                                    <div className="absolute top-4 right-6 z-10 bg-terminal-green/10 text-terminal-green border border-terminal-green/30 px-3 py-1 rounded text-xs font-mono flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
                                        <GitCommit size={12} />
                                        已自动加载本地变更
                                    </div>
                                )}
                                <textarea
                                    ref={textareaRef}
                                    className="flex-1 bg-transparent border-none resize-none focus:ring-0 text-terminal-text font-mono text-sm placeholder-terminal-border/50 p-4 outline-none"
                                    placeholder="// 正在扫描本地 git diff..."
                                    value={diffInput}
                                    onChange={(e) => {
                                        setDiffInput(e.target.value);
                                        setIsAutoLoaded(false);
                                    }}
                                    spellCheck={false}
                                />

                                <div className="absolute bottom-6 right-6 flex items-center gap-3">
                                    <button
                                        onClick={loadDemo}
                                        className="text-terminal-dim hover:text-white text-xs font-mono px-3 py-2 rounded transition-colors"
                                    >
                                        加载示例 Diff
                                    </button>
                                    <button
                                        onClick={handleAnalyze}
                                        disabled={!diffInput.trim()}
                                        className="bg-terminal-text text-black px-6 py-2 rounded-md font-bold text-sm flex items-center gap-2 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-[0_0_15px_rgba(255,255,255,0.1)]"
                                    >
                                        <Play size={14} fill="currentColor" /> 开始审查
                                    </button>
                                </div>

                                {/* CLI Prompt Decorator */}
                                <div className="absolute top-6 left-6 pointer-events-none opacity-50">
                                    <span className="text-terminal-green">➜</span> <span className="text-terminal-blue">~/{projectInfo.name}</span> <span className="text-terminal-dim">cr --analyze</span>
                                </div>
                            </div>
                        )}

                        {status === 'ANALYZING' && (
                            <div className="flex-1 flex flex-col items-center justify-center space-y-10 relative overflow-hidden">
                                {/* Background Code effect */}
                                <div className="absolute inset-0 opacity-5 pointer-events-none select-none font-mono text-[10px] overflow-hidden whitespace-pre">
                                    {Array(20).fill(diffInput.substring(0, 200)).join('\n')}
                                </div>

                                <div className="relative z-10 text-center space-y-6">
                                    <div className="relative inline-block">
                                        <div className="w-16 h-16 border-4 border-terminal-gray rounded-full"></div>
                                        <div className="w-16 h-16 border-4 border-t-terminal-green border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin absolute top-0 left-0"></div>
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-white mb-2">正在分析代码变更...</h3>
                                        <p className="text-terminal-dim font-mono text-sm animate-pulse">正在连接猫耳娘神经引擎 [{DEFAULT_AI_MODEL}]</p>
                                    </div>
                                </div>

                                {/* Tip Box */}
                                <div className="relative z-10 max-w-lg w-full px-6 animate-in slide-in-from-bottom-4 duration-700 fade-in">
                                    <div className="bg-terminal-black/80 border border-terminal-border/50 rounded-lg p-5 backdrop-blur-sm">
                                        <div className="flex items-center gap-2 text-terminal-purple text-xs font-bold uppercase tracking-widest mb-3 select-none">
                                            <Lightbulb size={12} />
                                            <span>猫耳小贴士</span>
                                        </div>
                                        <div className="text-terminal-text/90 font-mono text-sm italic leading-relaxed border-l-2 border-terminal-purple/50 pl-4 min-h-[3em] flex items-center whitespace-pre-wrap">
                                            {loadingTip}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {status === 'REVIEW_READY' && (
                            <div className="flex-1 flex flex-col h-full">
                                <div className="bg-terminal-black/50 p-2 border-b border-terminal-border flex justify-between items-center px-4 shrink-0">
                                    <span className="text-xs font-mono text-terminal-dim">DIFF 预览</span>
                                    <button onClick={() => setStatus('IDLE')} className="text-xs text-terminal-blue hover:underline">重新审查</button>
                                </div>
                                <div className="flex-1 overflow-hidden bg-terminal-black/20 relative">
                                    <DiffViewer diff={diffInput} highlightLine={highlightLine} />
                                </div>
                            </div>
                        )}

                    </div>

                    {/* Right Pane: Analysis Results (Moved to Right) */}
                    {status === 'REVIEW_READY' && reviewResult && (
                        <div className="w-2/5 flex flex-col border-l border-terminal-border animate-in slide-in-from-right duration-500 fade-in bg-terminal-dark shrink-0 z-10">
                            <AnalysisPanel
                                result={reviewResult}
                                onApply={handleApply}
                                onIssueSelect={setHighlightLine}
                            />
                        </div>
                    )}
                </div>

                {/* Error Toast */}
                {error && (
                    <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 bg-red-900/90 border border-red-500 text-white px-6 py-3 rounded-lg shadow-xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4 z-50">
                        <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                        <span className="font-mono text-sm">{error}</span>
                        <button onClick={() => setError(null)} className="ml-2 hover:text-red-200">✕</button>
                    </div>
                )}

            </div>

            {/* Footer / Instructions */}
            <div className="absolute bottom-4 left-6 text-terminal-dim text-xs font-mono opacity-50 flex gap-6 z-20 pointer-events-none">
                <span className="flex items-center gap-1"><Command size={10}/> + V 粘贴 Diff 内容</span>
                <span className="flex items-center gap-1"><ArrowRight size={10}/> 在开头注释上技术方案名称或 CR 方向效果更好</span>
            </div>

        </div>
    );
};

export default App;