import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import * as api from '../services/apiServices';

export const useAppStore = create(
    persist(
        (set, get) => ({
            // --- STATE ---
            databases: [],
            selectedDb: '',
            schema: { tables: [], views: [], indexes: [] },
            mermaidString: '',
            appIsLoading: true,
            error: '',
            isSidebarOpen: true,

            // --- ACTIONS ---
            
            /**
             * Initializes the application by fetching databases and setting the initial active database.
             */
            initialize: async () => {
                try {
                    set({ appIsLoading: true, error: '' });
                    const dbList = await api.listDatabases();
                    const savedDb = get().selectedDb; // Get persisted DB
                    
                    let initialDb = '';
                    if (savedDb && dbList.some(db => db.virtual_name === savedDb)) {
                        initialDb = savedDb;
                    } else if (dbList.length > 0) {
                        initialDb = dbList[0].virtual_name;
                    }
                    
                    set({ databases: dbList, selectedDb: initialDb });
                    
                    if(initialDb) {
                        await get().fetchSchemaAndDiagram(initialDb);
                    }

                } catch (err) {
                    set({ error: 'Failed to fetch databases.' });
                } finally {
                    set({ appIsLoading: false });
                }
            },

            /**
             * Refreshes the database list without full app reinitialization.
             * Useful when databases are created, dropped, or renamed.
            */
            refreshDatabases: async () => {
                try {
                    const dbList = await api.listDatabases();
                    const currentSelectedDb = get().selectedDb;
                    
                    // Check if the currently selected database still exists
                    const selectedDbStillExists = dbList.some(db => db.virtual_name === currentSelectedDb);
                    
                    if (!selectedDbStillExists) {
                        // If current DB was deleted/renamed, select the first available DB or clear selection
                        const newSelectedDb = dbList.length > 0 ? dbList[0].virtual_name : '';
                        set({ databases: dbList, selectedDb: newSelectedDb });
                        
                        if (newSelectedDb) {
                            await get().fetchSchemaAndDiagram(newSelectedDb);
                        } else {
                            set({ schema: { tables: [], views: [], indexes: [] }, mermaidString: '' });
                        }
                    } else {
                        // Just update the database list, keep current selection
                        set({ databases: dbList });
                    }
                } catch (err) {
                    set({ error: 'Failed to refresh databases.' });
                }
            },
            
            /**
             * Changes the currently selected database and fetches its schema.
             * @param {string} dbName - The virtual name of the database to switch to.
             */
            handleDbChange: (dbName) => {
                set({ selectedDb: dbName });
                if (dbName) {
                    get().fetchSchemaAndDiagram(dbName);
                } else {
                    set({ schema: { tables: [], views: [], indexes: [] }, mermaidString: '' });
                }
            },
            
            /**
             * Fetches the full schema and Mermaid diagram for a given database.
             * @param {string} dbName - The virtual name of the database.
             */
            fetchSchemaAndDiagram: async (dbName) => {
                if (!dbName) {
                  set({ schema: { tables: [], views: [], indexes: [] }, mermaidString: '' });
                  return;
                }
                try {
                  set({ appIsLoading: true, error: '' });
                  
                  const [schemaData, mermaidData] = await Promise.all([
                    api.getDatabaseSchema(dbName),
                    api.getMermaidDiagram(dbName)
                  ]);
                  console.log(schemaData);
                  set({
                      schema: {
                          tables: schemaData.tables.map(t => ({...t, id: t.name, rowCount: t.row_count})),
                          views: schemaData.views || [],
                          indexes: schemaData.indexes || [],
                      },
                      mermaidString: mermaidData?.diagram || (typeof mermaidData === 'string' ? mermaidData : ''),
                  });

                } catch (err) {
                  set({ error: `Failed to fetch schema or diagram for ${dbName}: ${err.message}`, mermaidString: '' });
                } finally {
                  set({ appIsLoading: false });
                }
            },

            /**
             * Toggles the visibility of the main sidebar.
             */
            toggleSidebar: () => {
                set(state => ({ isSidebarOpen: !state.isSidebarOpen }));
            },
        }),
        {
            name: 'fastdb-app-storage', // name of the item in storage (must be unique)
            partialize: (state) => ({ 
                // Only persist these fields to avoid storing large objects like 'schema'
                selectedDb: state.selectedDb, 
                isSidebarOpen: state.isSidebarOpen 
            }),
        }
    )
);