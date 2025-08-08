import React, { useState, useRef } from 'react';
import { Table, Search, Hash, XCircle, Sigma, Divide, ArrowDownUp, Waves, Fingerprint } from 'lucide-react';
import ExportMenu from './export/ExportMenu';
import { useVirtualizer } from '@tanstack/react-virtual';
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';

/**
 * A single row for the statistics display, containing an icon, label, and value.
 */
const StatRow = ({ icon, label, value }) => (
    <div className="flex items-center justify-between text-sm">
        <div className="flex items-center text-text-muted-light dark:text-text-muted-dark">
            {icon}
            <span className="ml-2">{label}</span>
        </div>
        <span className="font-semibold font-mono text-text-light dark:text-text-dark">{value}</span>
    </div>
);

/**
 * A beautifully styled, theme-aware toast component for displaying column statistics.
 */
const ColumnStatsToast = ({ stats }) => {
    // Determine which set of statistics to display based on the data type
    const numericStats = [
        { key: 'count', label: 'Count', icon: <Hash className="w-4 h-4" /> },
        { key: 'nulls', label: 'Nulls', icon: <XCircle className="w-4 h-4" /> },
        { key: 'sum', label: 'Sum', icon: <Sigma className="w-4 h-4" /> },
        { key: 'mean', label: 'Mean', icon: <Divide className="w-4 h-4" /> },
        { key: 'median', label: 'Median', icon: <Waves className="w-4 h-4" /> },
        { key: 'min', label: 'Min / Max', icon: <ArrowDownUp className="w-4 h-4" />, value: `${stats.min} / ${stats.max}` },
    ];

    const textStats = [
        { key: 'count', label: 'Count', icon: <Hash className="w-4 h-4" /> },
        { key: 'nulls', label: 'Nulls', icon: <XCircle className="w-4 h-4" /> },
        { key: 'unique_values', label: 'Unique', icon: <Fingerprint className="w-4 h-4" /> },
    ];
    
    // Check if stats for numeric columns exist to decide which list to render
    const statsToShow = stats.hasOwnProperty('mean') ? numericStats : textStats;

    return (
        <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="bg-fg-light dark:bg-fg-dark border border-border-light dark:border-border-dark rounded-xl shadow-2xl p-4 w-64"
        >
            <h4 className="font-medium text-base mb-3 text-text-light dark:text-text-dark border-b border-border-light dark:border-border-dark pb-2">
                Stats: <span className="text-blue-500 font-semibold">{stats.column}</span>
            </h4>
            <div className="space-y-2">
                {statsToShow.map(stat => (
                    // Only render the row if the stat exists in the stats object
                    stats.hasOwnProperty(stat.key) && (
                        <StatRow 
                            key={stat.key}
                            icon={stat.icon}
                            label={stat.label}
                            value={stat.value !== undefined ? stat.value : stats[stat.key]}
                        />
                    )
                ))}
            </div>
        </motion.div>
    );
};


const DataTable = ({ table, title = null }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const parentRef = useRef(null);

  const columns = table.data.length > 0 ? Object.keys(table.data[0]) : [];

  const filteredData = table.data.filter(row =>
    columns.some(col =>
      row[col]?.toString().toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  const rowVirtualizer = useVirtualizer({
      count: filteredData.length,
      getScrollElement: () => parentRef.current,
      estimateSize: () => 45,
      overscan: 5,
  });

  const handleColumnHeaderClick = (column) => {
    if (filteredData.length === 0) return;

    const values = filteredData.map(row => row[column]).filter(v => v !== null && v !== undefined);
    const isNumeric = values.length > 0 && typeof values[0] === 'number';

    let stats = { column, count: values.length, nulls: filteredData.length - values.length };

    if (isNumeric && values.length > 0) {
        const sum = values.reduce((a, b) => a + b, 0);
        const mean = sum / values.length;
        const sorted = [...values].sort((a, b) => a - b);
        stats = {
            ...stats,
            sum: sum.toLocaleString(),
            mean: mean.toLocaleString(undefined, { maximumFractionDigits: 2 }),
            min: Math.min(...values).toLocaleString(),
            max: Math.max(...values).toLocaleString(),
            median: sorted[Math.floor(sorted.length / 2)].toLocaleString(),
        };
    } else {
        const unique = new Set(values);
        stats = {
            ...stats,
            unique_values: unique.size.toLocaleString(),
        };
    }

    toast.custom(<ColumnStatsToast stats={stats} />, { duration: 8000 });
  };

  return (
    <div className="bg-fg-light dark:bg-fg-dark rounded-lg border border-border-light dark:border-border-dark flex flex-col flex-1 overflow-hidden">
      <div className="flex items-center justify-between p-3 border-b border-border-light dark:border-border-dark">
        <div className="flex items-center space-x-2">
            <Table className="w-4 h-4 text-blue-500" />
            <h4 className="text-sm font-semibold">
                {title || `Query Results`}
                <span className="text-xs text-text-muted-light dark:text-text-muted-dark ml-2">({table.data.length} rows)</span>
            </h4>
        </div>
        <div className="flex items-center space-x-2">
          <div className="relative">
            <Search className="w-4 h-4 text-text-muted-light dark:text-text-muted-dark absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              placeholder="Search results..." 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-bg-light dark:bg-bg-dark text-sm border border-border-light dark:border-border-dark rounded-md pl-8 pr-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <ExportMenu data={filteredData} columns={columns} />
        </div>
      </div>

      <div className="w-full text-sm flex-1 flex flex-col">
        {columns.length > 0 && (
          <div className="flex sticky top-0 bg-slate-50 dark:bg-slate-900 border-b border-border-light dark:border-border-dark">
            {columns.map((column) => (
              <div key={column} onClick={() => handleColumnHeaderClick(column)} className="flex-1 text-left text-xs uppercase tracking-wider font-semibold py-2 px-4 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                {column}
              </div>
            ))}
          </div>
        )}

        <div ref={parentRef} className="overflow-auto flex-1">
          <div style={{ height: `${rowVirtualizer.getTotalSize()}px`, width: '100%', position: 'relative' }}>
            {rowVirtualizer.getVirtualItems().map(virtualItem => {
                const row = filteredData[virtualItem.index];
                return (
                    <div
                        key={virtualItem.key}
                        className="flex absolute top-0 left-0 w-full border-b border-border-light dark:border-border-dark last:border-b-0 hover:bg-slate-50 dark:hover:bg-slate-800/30"
                        style={{
                            height: `${virtualItem.size}px`,
                            transform: `translateY(${virtualItem.start}px)`,
                        }}
                    >
                        {columns.map((column, cellIdx) => (
                          <div key={cellIdx} className="flex-1 py-2.5 px-4 text-xs truncate">
                            <span className={typeof row[column] === 'number' ? 'font-mono' : ''}>
                              {row[column]?.toString() || '-'}
                            </span>
                          </div>
                        ))}
                    </div>
                );
            })}
          </div>
        </div>
        
        {filteredData.length === 0 && table.data.length > 0 && searchTerm && (
            <div className="text-center py-8 text-text-muted-light dark:text-text-muted-dark text-sm">
                No results found for "{searchTerm}"
            </div>
        )}
      </div>
    </div>
  );
};

export default DataTable;