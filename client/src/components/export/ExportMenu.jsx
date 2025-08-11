import React, { useState } from 'react';
import { Download, ChevronDown } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { exportToCsv, exportToJson, copyToMarkdown } from '../../services/exportServices';

const ExportMenu = ({ data, columns }) => {
    const [isOpen, setIsOpen] = useState(false);

    if (data.length === 0) return null;
    
    const handleExport = (format) => {
        const rowCount = data.length;
        switch (format) {
            case 'csv':
                exportToCsv(data, columns, 'query_results.csv');
                toast.success(`Exported ${rowCount} rows as CSV!`);
                break;
            case 'json':
                exportToJson(data, 'query_results.json');
                toast.success(`Exported ${rowCount} rows as JSON!`);
                break;
            case 'md':
                copyToMarkdown(data, columns);
                toast.success('Copied as Markdown to clipboard!');
                break;
        }
        setIsOpen(false);
    };

    return (
        <div className="relative">
            <button onClick={() => setIsOpen(!isOpen)} onBlur={() => setIsOpen(false)} className="p-2 flex items-center space-x-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-text-muted-light dark:text-text-muted-dark">
                <Download className="w-4 h-4" />
                <ChevronDown className="w-4 h-4" />
            </button>
            {isOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-fg-light dark:bg-fg-dark border border-border-light dark:border-border-dark rounded-md z-10 shadow-lg">
                    <ul className="text-sm p-1">
                        <li onMouseDown={() => handleExport('csv')} className="px-3 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md cursor-pointer">Export as CSV</li>
                        <li onMouseDown={() => handleExport('json')} className="px-3 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md cursor-pointer">Export as JSON</li>
                        <li onMouseDown={() => handleExport('md')} className="px-3 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md cursor-pointer">Copy as Markdown</li>
                    </ul>
                </div>
            )}
        </div>
    );
};

export default ExportMenu;