import React, { useState, useRef, useMemo } from 'react';
import { Table, Search, Hash, XCircle, Sigma, Divide, ArrowDownUp, Waves, Fingerprint, BarChart, ArrowUp, ArrowDown } from 'lucide-react';
import ExportMenu from './export/ExportMenu';
import { useVirtualizer } from '@tanstack/react-virtual';
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const StatRow = ({ icon, label, value }) => (
    <div className="flex items-center justify-between text-sm">
        <div className="flex items-center text-text-muted-light dark:text-text-muted-dark">
            {icon}
            <span className="ml-2">{label}</span>
        </div>
        <span className="font-semibold font-mono text-text-light dark:text-text-dark">{value}</span>
    </div>
);

const ColumnStatsToast = ({ stats }) => {
    const numericStats = [
        { key: 'count', label: 'Count', icon: <Hash className="w-4 h-4 text-slate-500 dark:text-slate-400" /> },
        { key: 'nulls', label: 'Nulls', icon: <XCircle className="w-4 h-4 text-slate-500 dark:text-slate-400" /> },
        { key: 'sum', label: 'Sum', icon: <Sigma className="w-4 h-4 text-slate-500 dark:text-slate-400" /> },
        { key: 'mean', label: 'Mean', icon: <Divide className="w-4 h-4 text-slate-500 dark:text-slate-400" /> },
        { key: 'median', label: 'Median', icon: <Waves className="w-4 h-4 text-slate-500 dark:text-slate-400" /> },
        { key: 'min', label: 'Min / Max', icon: <ArrowDownUp className="w-4 h-4 text-slate-500 dark:text-slate-400" />, value: `${stats.min} / ${stats.max}` },
    ];
    const textStats = [
        { key: 'count', label: 'Count', icon: <Hash className="w-4 h-4 text-slate-500 dark:text-slate-400" /> },
        { key: 'nulls', label: 'Nulls', icon: <XCircle className="w-4 h-4 text-slate-500 dark:text-slate-400" /> },
        { key: 'unique_values', label: 'Unique', icon: <Fingerprint className="w-4 h-4 text-slate-500 dark:text-slate-400" /> },
    ];
    const statsToShow = stats.hasOwnProperty('mean') ? numericStats : textStats;
    return (
        <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="bg-fg-light dark:bg-fg-dark border border-border-light dark:border-border-dark rounded-xl shadow-2xl p-4 w-64">
            <h4 className="font-medium text-base mb-3 text-text-light dark:text-text-dark border-b border-border-light dark:border-border-dark pb-2">Stats: <span className="text-blue-500 font-semibold">{stats.column}</span></h4>
            <div className="space-y-2">
                {statsToShow.map(stat => (stats.hasOwnProperty(stat.key) && <StatRow key={stat.key} icon={stat.icon} label={stat.label} value={stat.value !== undefined ? stat.value : stats[stat.key]}/> ))}
            </div>
        </motion.div>
    );
};

const DataTable = ({ table, title = null }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'ascending' });
  const parentRef = useRef(null);
  const navigate = useNavigate();

  const columns = table.data.length > 0 ? Object.keys(table.data[0]) : [];

  const filteredData = useMemo(() => {
    if (!searchTerm) return table.data;
    return table.data.filter(row => columns.some(col => row[col]?.toString().toLowerCase().includes(searchTerm.toLowerCase())));
  }, [table.data, searchTerm, columns]);
  
  const sortedData = useMemo(() => {
    let sortableItems = [...filteredData];
    if (sortConfig.key !== null) {
      sortableItems.sort((a, b) => {
        const valA = a[sortConfig.key];
        const valB = b[sortConfig.key];
        if (valA < valB) return sortConfig.direction === 'ascending' ? -1 : 1;
        if (valA > valB) return sortConfig.direction === 'ascending' ? 1 : -1;
        return 0;
      });
    }
    return sortableItems;
  }, [filteredData, sortConfig]);

  const requestSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };
  
  const rowVirtualizer = useVirtualizer({ count: sortedData.length, getScrollElement: () => parentRef.current, estimateSize: () => 45, overscan: 5 });

  const handleColumnHeaderClick = (column) => {
    if (sortedData.length === 0) return;
    const values = sortedData.map(row => row[column]).filter(v => v !== null && v !== undefined);
    const isNumeric = values.length > 0 && typeof values[0] === 'number';
    let stats = { column, count: values.length, nulls: sortedData.length - values.length };
    if (isNumeric && values.length > 0) {
        const sum = values.reduce((a, b) => a + b, 0);
        stats = { ...stats, sum: sum.toLocaleString(), mean: (sum / values.length).toLocaleString(undefined, { maximumFractionDigits: 2 }), min: Math.min(...values).toLocaleString(), max: Math.max(...values).toLocaleString(), median: [...values].sort((a, b) => a - b)[Math.floor(sortedData.length / 2)].toLocaleString() };
    } else {
        stats = { ...stats, unique_values: new Set(values).size.toLocaleString() };
    }
    toast.custom(<ColumnStatsToast stats={stats} />, { duration: 8000 });
  };

  const handleVisualize = () => {
    navigate('/visualize', { state: { data: sortedData, columns }});
  }

  return (
    <div className="bg-fg-light dark:bg-fg-dark rounded-lg border border-border-light dark:border-border-dark flex flex-col flex-1 overflow-hidden">
      <div className="flex items-center justify-between p-3 border-b border-border-light dark:border-border-dark">
        <div className="flex items-center space-x-2"><Table className="w-4 h-4 text-blue-500" /><h4 className="text-sm font-semibold">{title || `Query Results`}<span className="text-xs text-text-muted-light dark:text-text-muted-dark ml-2">({sortedData.length} rows)</span></h4></div>
        <div className="flex items-center space-x-2">
          <div className="relative"><Search className="w-4 h-4 text-text-muted-light dark:text-text-muted-dark absolute left-2.5 top-1/2 -translate-y-1/2" /><input type="text" placeholder="Search results..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="bg-bg-light dark:bg-bg-dark text-sm border border-border-light dark:border-border-dark rounded-md pl-8 pr-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500"/></div>
          <button onClick={handleVisualize} title="Visualize Results" className="p-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-text-muted-light dark:text-text-muted-dark"><BarChart className="w-4 h-4" /></button>
          <ExportMenu data={sortedData} columns={columns} />
        </div>
      </div>

      <div className="w-full text-sm flex-1 flex flex-col">
        {columns.length > 0 && (
          <div className="flex sticky top-0 bg-slate-50 dark:bg-slate-900 border-b border-border-light dark:border-border-dark z-10">
            {columns.map((column) => (
              <div key={column} className="flex-1 text-left text-xs uppercase tracking-wider font-semibold py-2 px-4 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors group flex items-center space-x-2">
                <span onDoubleClick={() => requestSort(column)} onClick={() => handleColumnHeaderClick(column)} className="flex-1 truncate">{column}</span>
                {sortConfig.key === column && (sortConfig.direction === 'ascending' ? <ArrowUp className="w-3.5 h-3.5"/> : <ArrowDown className="w-3.5 h-3.5"/>)}
              </div>
            ))}
          </div>
        )}

        <div ref={parentRef} className="overflow-auto flex-1"><div style={{ height: `${rowVirtualizer.getTotalSize()}px`, width: '100%', position: 'relative' }}>
            {rowVirtualizer.getVirtualItems().map(virtualItem => {
                const row = sortedData[virtualItem.index];
                return (<div key={virtualItem.key} className="flex absolute top-0 left-0 w-full border-b border-border-light dark:border-border-dark last:border-b-0 hover:bg-slate-50 dark:hover:bg-slate-800/30" style={{ height: `${virtualItem.size}px`, transform: `translateY(${virtualItem.start}px)` }}>
                  {columns.map((column, cellIdx) => (<div key={cellIdx} className="flex-1 py-2.5 px-4 text-xs truncate"><span className={typeof row[column] === 'number' ? 'font-mono' : ''}>{row[column]?.toString() || '-'}</span></div>))}
                </div>);
            })}
        </div></div>
        
        {sortedData.length === 0 && table.data.length > 0 && searchTerm && (<div className="text-center py-8 text-text-muted-light dark:text-text-muted-dark text-sm">No results found for "{searchTerm}"</div>)}
      </div>
    </div>
  );
};

export default DataTable;