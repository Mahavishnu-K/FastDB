import { BrainCircuit, Check, Code, Copy, Play, Loader, Save } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import * as api from '../services/apiServices';

const SQLDisplay = ({ sql, setSql, onExecuteSql, selectedDb, onSaveQuery, isExecuting }) => {
  const [copied, setCopied] = useState(false);
  const [explainResult, setExplainResult] = useState(null);
  const [isExplaining, setIsExplaining] = useState(false);

  useEffect(() => {
    setExplainResult(null);
  }, [sql]);

  const handleCopy = () => {
    navigator.clipboard.writeText(sql);
    setCopied(true);
    toast.success('SQL copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExplain = async () => {
    setIsExplaining(true);
    setExplainResult(null);
    try {
      const result = await api.explainQuery(sql, selectedDb);
      setExplainResult(result);
    } catch (err) {
      setExplainResult({ error: err.message });
      toast.error(`Explain failed: ${err.message}`);
    } finally {
      setIsExplaining(false);
    }
  };

  if (!sql) return null;

  return (
    <div className="bg-fg-light dark:bg-fg-dark border border-border-light dark:border-border-dark rounded-lg">
      <div className="flex items-center justify-between p-3 border-b border-border-light dark:border-border-dark">
        <h4 className="text-sm font-semibold flex items-center space-x-2">
          <Code className="w-4 h-4 text-green-500" />
          <span>SQL Query</span>
        </h4>
        <div className="flex items-center space-x-1">
          <button onClick={handleExplain} title="Explain Query Performance" disabled={isExplaining} className="p-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-text-muted-light dark:text-text-muted-dark disabled:opacity-50">
            <BrainCircuit className={`w-4 h-4 ${isExplaining ? 'animate-pulse' : ''}`} />
          </button>
          <button onClick={handleCopy} title="Copy SQL" className="p-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-text-muted-light dark:text-text-muted-dark">
            {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
          </button>
          
          <button onClick={() => onSaveQuery(sql)} title="Save Query" className="p-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-text-muted-light dark:text-text-muted-dark">
            <Save className="w-4 h-4" />
          </button>

          <button onClick={() => onExecuteSql(sql)} disabled={isExecuting} title="Run SQL Query" className="p-2 rounded-md bg-blue-600 text-white hover:bg-blue-500 transition-transform transform hover:scale-105">
            {isExecuting ? <Loader className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
          </button>
        </div>
      </div>
      
      <div className="p-4">
        <textarea
          value={sql}
          onChange={(e) => setSql(e.target.value)}
          className="w-full bg-bg-light dark:bg-bg-dark text-text-light dark:text-text-dark p-3 rounded-md border border-border-light dark:border-border-dark overflow-x-auto text-xs font-mono resize-y min-h-[100px] focus:ring-1 focus:ring-blue-500 focus:outline-none"
          spellCheck="false"
        />
      </div>

      {explainResult && (
        <div className="p-4 border-t border-border-light dark:border-border-dark">
          <h5 className="text-xs font-semibold mb-2">Query Performance Analysis</h5>
          {explainResult.error ? (
            <p className="text-xs text-red-400">{explainResult.error}</p>
          ) : (
            <div className="text-xs space-y-1 p-3 bg-bg-light dark:bg-bg-dark rounded-md border border-border-light dark:border-border-dark">
              <p><strong>Execution Time:</strong> {explainResult.execution_time?.toFixed(4)} ms</p>
              <p><strong>Planning Time:</strong> {explainResult.planning_time?.toFixed(4)} ms</p>
              <p><strong>Total Cost:</strong> {explainResult.total_cost?.toFixed(2)}</p>
              {explainResult.has_seq_scan && <p className="text-yellow-400 font-medium">Warning: Query contains a Sequential Scan, which may be inefficient on large tables.</p>}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SQLDisplay;