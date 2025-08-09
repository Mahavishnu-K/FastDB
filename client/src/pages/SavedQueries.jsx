import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Save, Trash2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { useConfirm } from '../contexts/ConfirmationContext';
import * as api from '../services/apiServices';

const SavedQueries = () => {
    const navigate = useNavigate();
    const confirm = useConfirm();
    const queryClient = useQueryClient();

    const { data: savedQueries, isLoading } = useQuery({
        queryKey: ['savedQueries'],
        queryFn: api.getSavedQueries,
    });

    const deleteMutation = useMutation({
        mutationFn: api.deleteSavedQuery,
        onSuccess: () => {
            toast.success("Query deleted!");
            queryClient.invalidateQueries(['savedQueries']);
        },
        onError: (err) => {
            toast.error(err.message);
        }
    });

    const handleDelete = async (queryId, queryName) => {
        const wasConfirmed = await confirm({
            title: `Delete "${queryName}"?`,
            message: "This action cannot be undone.",
            isDestructive: true,
        });
        if (wasConfirmed) {
            deleteMutation.mutate(queryId);
        }
    };

    const loadQueryInEditor = (sql) => {
        navigate('/query', { state: { autoQuery: sql, replaceEditor: true } });
    };

    if (isLoading) {
        return <div>Loading saved queries...</div>;
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-medium">Saved Queries</h1>
                    <p className="text-text-muted-light dark:text-text-muted-dark">Manage your frequently used SQL queries.</p>
                </div>
                 {/* This button could navigate to a dedicated "new saved query" page in the future */}
                <button onClick={() => navigate('/query')} className="bg-blue-600 text-white font-medium px-4 py-2 rounded-md flex items-center space-x-2">
                    <Plus className="w-4 h-4"/>
                    <span>New Query</span>
                </button>
            </div>

            <div className="bg-fg-light dark:bg-fg-dark border border-border-light dark:border-border-dark rounded-lg">
                <ul className="divide-y divide-border-light dark:divide-border-dark">
                    {savedQueries?.map(query => (
                        <li key={query.id} className="p-4 group">
                            <div className="flex items-center justify-between">
                                <div className="flex-1 min-w-0 cursor-pointer" onClick={() => loadQueryInEditor(query.query)}>
                                    <p className="font-semibold text-blue-500">{query.name}</p>
                                    <p className="text-sm font-mono text-text-muted-light dark:text-text-muted-dark truncate mt-1">
                                        {query.query}
                                    </p>
                                </div>
                                <div className="ml-4 flex-shrink-0 flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => handleDelete(query.id, query.name)} className="p-2 rounded-md hover:bg-red-500/10 text-red-500">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                     <button onClick={() => loadQueryInEditor(query.query)} className="px-3 py-1.5 rounded-md text-sm font-medium bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700">
                                        Load
                                    </button>
                                </div>
                            </div>
                        </li>
                    ))}
                </ul>
                {savedQueries?.length === 0 && (
                     <div className="text-center py-16">
                        <Save className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600" />
                        <h3 className="mt-2 text-lg font-medium">No Saved Queries Yet</h3>
                        <p className="mt-1 text-sm text-text-muted-light dark:text-text-muted-dark">Save queries from the Query page to find them here later.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SavedQueries;