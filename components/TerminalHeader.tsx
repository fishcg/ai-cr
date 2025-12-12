import React, { useEffect, useState } from 'react';
import { Terminal, Cpu, GitBranch } from 'lucide-react';
import { AI_API_TOKEN_URL, AI_API_KEY } from '../constants';

interface TerminalHeaderProps {
    projectName?: string;
    branch?: string;
    refreshTrigger?: number;
}

const TerminalHeader: React.FC<TerminalHeaderProps> = ({
                                                           projectName = "cr",
                                                           branch = "feature/optimize-calc",
                                                           refreshTrigger = 0
                                                       }) => {
    const [tokenCount, setTokenCount] = useState<number | null>(null);

    useEffect(() => {
        const fetchTokenCount = async () => {
            try {
                const response = await fetch(AI_API_TOKEN_URL, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${AI_API_KEY}`,
                    },
                    body: JSON.stringify({ model: 'test' })
                });
                if (response.ok) {
                    const data = await response.json();
                    setTokenCount(data.token);
                }
            } catch (error) {
                console.warn("Failed to fetch token count:", error);
            }
        };

        fetchTokenCount();
    }, [refreshTrigger]);

    return (
        <div className="flex items-center justify-between px-4 py-3 bg-terminal-gray border-b border-terminal-border select-none">
            <div className="flex items-center gap-2">
                <div className="flex gap-1.5 group">
                    <div className="w-3 h-3 rounded-full bg-red-500 hover:bg-red-600 transition-colors cursor-pointer" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500 hover:bg-yellow-600 transition-colors cursor-pointer" />
                    <div className="w-3 h-3 rounded-full bg-green-500 hover:bg-green-600 transition-colors cursor-pointer" />
                </div>
                <div className="ml-4 flex items-center gap-2 text-terminal-dim text-sm font-mono">
                    <Terminal size={14} />
                    <span>{projectName} — -zsh — 80x24</span>
                </div>
            </div>

            <div className="flex items-center gap-4 text-xs font-mono text-terminal-dim">
                <div className="flex items-center gap-1.5">
                    <GitBranch size={14} className="text-terminal-purple" />
                    <span>{branch}</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <Cpu size={14} className="text-terminal-blue" />
                    <span>
                {tokenCount !== null ? `剩余 Token: ${tokenCount}` : 'AI 服务连接中...'}
            </span>
                </div>
            </div>
        </div>
    );
};

export default TerminalHeader;