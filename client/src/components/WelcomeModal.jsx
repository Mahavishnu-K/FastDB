import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Database, Edit, Play } from 'lucide-react';

const WelcomeModal = () => {
  const [isOpen, setIsOpen] = useState(() => !localStorage.getItem('hasBeenOnboarded'));

  const handleClose = () => {
    localStorage.setItem('hasBeenOnboarded', 'true');
    setIsOpen(false);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
          onClick={handleClose}
        >
          <motion.div
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 50, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="bg-fg-dark border border-border-dark rounded-lg w-full max-w-2xl text-white relative shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <button onClick={handleClose} className="absolute top-3 right-3 p-2 rounded-full hover:bg-slate-700 transition-colors">
              <X className="w-5 h-5" />
            </button>

            <div className="p-8">
              <h2 className="text-2xl font-bold mb-2">Welcome to FastDB!</h2>
              <p className="text-slate-400 mb-6">Here’s a quick tour of your new database workspace.</p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
                <div className="bg-slate-800 p-4 rounded-lg border border-slate-700">
                  <Database className="w-8 h-8 mx-auto text-blue-400 mb-3" />
                  <h3 className="font-semibold mb-1">Explore Your Schema</h3>
                  <p className="text-xs text-slate-400">Use the sidebar on the left to browse databases, tables, and columns.</p>
                </div>
                <div className="bg-slate-800 p-4 rounded-lg border border-slate-700">
                  <Play className="w-8 h-8 mx-auto text-green-400 mb-3" />
                  <h3 className="font-semibold mb-1">Query with AI</h3>
                  <p className="text-xs text-slate-400">Type natural language commands (like "show all users") in the main input and press Enter.</p>
                </div>
                <div className="bg-slate-800 p-4 rounded-lg border border-slate-700">
                  <Edit className="w-8 h-8 mx-auto text-purple-400 mb-3" />
                  <h3 className="font-semibold mb-1">Manage Visually</h3>
                  <p className="text-xs text-slate-400">Navigate to the Schema tab to visually edit tables or see your database ER Diagram.</p>
                </div>
              </div>

              <div className="text-center mt-8">
                <button
                  onClick={handleClose}
                  className="bg-blue-600 hover:bg-blue-500 font-semibold px-6 py-2 rounded-lg transition-all transform hover:scale-105"
                >
                  Get Started
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default WelcomeModal;
