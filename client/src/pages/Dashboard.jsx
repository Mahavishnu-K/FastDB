import { useQuery } from '@tanstack/react-query';
import { BarChart, BookMarked, Columns, Database, FilePlus, HardDrive, History, List, ShieldAlert, Zap } from 'lucide-react';
import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { getQueryHistory, getSavedQueries } from '../services/apiServices';
import { useAppStore } from '../store/useAppStore';

const StatCard = ({ icon, title, value, subtitle, color }) => (
    <div className="bg-fg-light dark:bg-fg-dark border border-border-light dark:border-border-dark rounded-lg p-4 flex items-start space-x-4">
        <div>
            <p className="text-sm text-text-muted-light dark:text-text-muted-dark">{title}</p>
            <p className="text-2xl font-medium text-text-light dark:text-text-dark">{value}</p>
            <p className="text-xs text-text-muted-light dark:text-text-muted-dark">{subtitle}</p>
        </div>
    </div>
);

const BarChartWidget = ({ title, data }) => {
    const maxValue = Math.max(...data.map(d => d.value), 1);
    
    return (
        <div className="bg-fg-light dark:bg-fg-dark border border-border-light dark:border-border-dark rounded-lg p-4 h-full flex flex-col">
            <h3 className="font-semibold text-sm mb-4 text-text-light dark:text-text-dark">{title}</h3>
            <div className="space-y-3 flex-1">
                {data.length > 0 ? data.map(item => (
                    <div key={item.label} className="flex items-center space-x-2 text-xs group">
                        <span className="w-24 truncate text-text-muted-light dark:text-text-muted-dark" title={item.label}>{item.label} (<span className="text-2xs font-medium">{item.value.toLocaleString()}</span>)</span>
                        <div className="flex-1 bg-slate-100 dark:bg-slate-800 rounded-full h-2">
                            <div
                                style={{ width: `${(item.value / maxValue) * 100}%` }}
                                className="bg-blue-500 group-hover:bg-blue-400 transition-colors h-2 rounded-full flex items-center justify-end px-2 text-white"
                            >
                               
                            </div>
                        </div>
                    </div>
                )) : (
                     <div className="text-center text-text-muted-light dark:text-text-muted-dark flex flex-col items-center justify-center h-full">
                        <BarChart className="w-10 h-10 mb-2" />
                        <p className="text-sm">No table data to display.</p>
                        <p className="text-xs">Connect to a database with tables.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

const ListWidget = ({ title, icon, items, emptyIcon, emptyText, onSelect }) => (
    <div className="bg-fg-light dark:bg-fg-dark border border-border-light dark:border-border-dark rounded-lg p-4 flex flex-col max-h-64 overflow-y-auto">
        <h3 className="text-sm font-semibold flex items-center gap-2 mb-3 text-text-light dark:text-text-dark">{icon}{title}</h3>
        <div className="space-y-1.5 flex-1 overflow-y-auto pr-1">
            {items?.length > 0 ? items.slice(0, 10).map(item => (
                <div key={item.id} onClick={() => onSelect(item)} className="bg-bg-light dark:bg-bg-dark rounded p-2 border border-border-light dark:border-border-dark hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer">
                    <p className="font-mono text-xs text-text-light dark:text-text-dark truncate">{item.primaryText}</p>
                    {item.secondaryText && <p className="text-2xs text-text-muted-light dark:text-text-muted-dark">{item.secondaryText}</p>}
                </div>
            )) : (
                <div className="text-center text-text-muted-light dark:text-text-muted-dark flex flex-col items-center justify-center h-full">
                    {emptyIcon}
                    <p className="text-sm mt-2">{emptyText}</p>
                </div>
            )}
        </div>
    </div>
);

const SchemaInsightsWidget = () => {
    const { schema } = useAppStore();
    const navigate = useNavigate();

    const insights = useMemo(() => {
        const result = [];
        if (!schema || !schema.tables) return [];

        schema.tables.forEach(table => {
             if (!table.columns.some(col => col.is_primary_key)) {
                result.push({ id: `no-pk-${table.name}`, icon: <ShieldAlert className="w-4 h-4 text-blue-500"/>, text: 'No primary key defined', table: table.name });
            }
            if (table.columns.length > 20) {
                result.push({ id: `many-cols-${table.name}`, icon: <Columns className="w-4 h-4 text-purple-500"/>, text: `Has ${table.columns.length} columns`, table: table.name });
            }
        });
        return result;
    }, [schema]);

    return (
        <div className="bg-fg-light dark:bg-fg-dark border border-border-light dark:border-border-dark rounded-lg p-4 flex flex-col max-h-56 overflow-y-auto">
            <h3 className="text-sm font-semibold flex items-center gap-2 mb-3 text-text-light dark:text-text-dark"><Zap className="w-4 h-4 text-blue-500"/>Schema Insights</h3>
            <div className="space-y-2 flex-1 overflow-y-auto pr-1">
                {insights.length > 0 ? insights.map(insight => (
                     <div key={insight.id} onClick={() => navigate('/schema')} className="flex items-center space-x-3 p-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer">
                        {insight.icon}
                        <div>
                            <p className="text-xs font-medium">{insight.table}</p>
                            <p className="text-xs text-text-muted-light dark:text-text-muted-dark">{insight.text}</p>
                        </div>
                    </div>
                )) : (
                    <div className="text-center text-text-muted-light dark:text-text-muted-dark flex flex-col items-center justify-center h-full">
                        <Zap className="w-10 h-10 mb-2" />
                        <p className="text-sm mt-2">No specific insights found.</p>
                        <p className="text-xs">Your schema looks good!</p>
                    </div>
                )}
            </div>
        </div>
    );
};

const Dashboard = () => {
    const { databases, selectedDb, schema, fetchSchemaAndDiagram } = useAppStore();
    const navigate = useNavigate();

    const { data: history } = useQuery({ queryKey: ['history'], queryFn: getQueryHistory, placeholderData: [] });
    const { data: savedQueries } = useQuery({ queryKey: ['savedQueries'], queryFn: getSavedQueries, placeholderData: [] });

    const tableRowData = schema.tables.map(t => ({ label: t.name, value: t.rowCount }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 5);

    const historyItems = history.map(q => ({ 
        id: q.id, 
        primaryText: q.generated_sql, 
        secondaryText: new Date(q.executed_at).toLocaleString(),
        sql: q.generated_sql
    }));
    
    const savedItems = savedQueries.map(q => ({ 
        id: q.id, 
        primaryText: q.name, 
        secondaryText: q.query,
        sql: q.query
    }));

    const loadQuery = (item) => {
        if (item.sql) {
            navigate('/query', { state: { autoQuery: item.sql, replaceEditor: true } });
        }
    };

    const quickActions = [
        { label: "New Query", icon: <FilePlus className="w-4 h-4 text-blue-500"/>, onClick: () => navigate('/query') },
        { label: "New Table", icon: <Database className="w-4 h-4 text-blue-500"/>, onClick: () => navigate('/table/new') },
        { label: "Refresh Schema", icon: <History className="w-4 h-4 text-blue-500"/>, onClick: () => fetchSchemaAndDiagram(selectedDb) },
    ];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-xl font-medium">Dashboard</h1>
                    <p className="text-sm text-text-muted-light dark:text-text-muted-dark">
                        An overview of your connected database environment.
                    </p>
                </div>
                <div className="flex flex-wrap gap-2">
                    {quickActions.map(action => (
                        <button
                            key={action.label}
                            onClick={action.onClick}
                            className="flex items-center px-2 py-1 bg-fg-light dark:bg-fg-dark border border-border-light dark:border-border-dark 
                                        rounded-md hover:bg-slate-100 dark:hover:bg-slate-800"
                        >
                            {action.icon}
                            <span className="ml-2 text-sm font-sm">{action.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard icon={<HardDrive />} title="Databases" value={databases.length} subtitle="Total connected" color="blue" />
                <StatCard icon={<Database />} title="Tables" value={schema.tables.length} subtitle={`in ${selectedDb || 'N/A'}`} color="purple" />
                <StatCard icon={<List />} title="Total Rows" value={schema.tables.reduce((acc, t) => acc + t.rowCount, 0).toLocaleString()} subtitle="Across all tables" color="blue" />
                <StatCard icon={<Zap />} title="Views / Indexes" value={`${schema.views.length} / ${schema.indexes.length}`} subtitle="in current schema" color="blue" />
            </div>

            {/* Chart + Schema Insights */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="lg:col-span-2"><BarChartWidget title="Top 5 Tables by Row Count" data={tableRowData} /></div>
                <div><SchemaInsightsWidget/></div>
            </div>

            {/* Saved Queries + Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 ">
                <ListWidget title="Saved Queries" icon={<BookMarked className="w-4 h-4 text-blue-500"/>} items={savedItems} emptyIcon={<BookMarked className="w-10 h-10"/>} emptyText="No saved queries yet." onSelect={loadQuery} />
                <ListWidget title="Recent Activity" icon={<History className="w-4 h-4 text-blue-500"/>} items={historyItems} emptyIcon={<History className="w-10 h-10"/>} emptyText="No recent queries found." onSelect={loadQuery} />
            </div>
        </div>
    );
};

export default Dashboard;