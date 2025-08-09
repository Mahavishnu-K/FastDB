import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, Database, Edit, Play, X } from 'lucide-react';
import { useState } from 'react';

const tourSteps = [
    {
        title: "Welcome to FastDB!",
        content: "Here’s a quick tour of your new database workspace. Use the arrows to navigate.",
        icon: Database,
        iconColor: "text-blue-400"
    },
    {
        title: "Explore Your Schema",
        content: "The sidebar on the left is your Schema Explorer. Use it to browse databases, tables, and columns, and to connect to different databases.",
        icon: Database,
        iconColor: "text-blue-400"
    },
    {
        title: "Query with AI",
        content: "Type natural language commands (like \"show all users\") in the main input and press Enter. The AI will translate it to SQL for you.",
        icon: Play,
        iconColor: "text-green-400"
    },
    {
        title: "Manage Visually",
        content: "Navigate to the Schema tab to visually create, edit, or delete tables and see your database ER Diagram.",
        icon: Edit,
        iconColor: "text-purple-400"
    },
];

const WelcomeModal = () => {
    const [isOpen, setIsOpen] = useState(() => !localStorage.getItem('hasBeenOnboarded'));
    const [step, setStep] = useState(0);

    const handleClose = () => {
        localStorage.setItem('hasBeenOnboarded', 'true');
        setIsOpen(false);
    };

    const nextStep = () => setStep(s => Math.min(s + 1, tourSteps.length - 1));
    const prevStep = () => setStep(s => Math.max(s - 1, 0));

    const currentStep = tourSteps[step];

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
                    <motion.div
                        initial={{ y: -50, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 50, opacity: 0 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                        className="bg-fg-dark border border-border-dark rounded-lg w-full max-w-lg text-white relative shadow-2xl"
                        onClick={e => e.stopPropagation()}
                    >
                        <button onClick={handleClose} className="absolute top-3 right-3 p-2 rounded-full hover:bg-slate-700 transition-colors z-10"><X className="w-5 h-5" /></button>

                        <div className="p-8">
                             <AnimatePresence mode="wait">
                                <motion.div
                                    key={step}
                                    initial={{ opacity: 0, x: 50 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -50 }}
                                    transition={{ duration: 0.3 }}
                                    className="text-center"
                                >
                                    <currentStep.icon className={`w-12 h-12 mx-auto mb-4 ${currentStep.iconColor}`} />
                                    <h2 className="text-2xl font-medium mb-2">{currentStep.title}</h2>
                                    <p className="text-slate-400 mb-6 h-12">{currentStep.content}</p>
                                </motion.div>
                            </AnimatePresence>
                            
                            <div className="flex items-center justify-between mt-6">
                                <button onClick={prevStep} disabled={step === 0} className="px-4 py-2 rounded-md hover:bg-slate-700 disabled:opacity-30 flex items-center space-x-2"><ArrowLeft className="w-4 h-4" /><span>Prev</span></button>
                                <div className="flex space-x-2">
                                    {tourSteps.map((_, i) => <div key={i} className={`w-2 h-2 rounded-full ${i === step ? 'bg-blue-500' : 'bg-slate-600'}`}></div>)}
                                </div>
                                {step < tourSteps.length - 1 ? (
                                    <button onClick={nextStep} className="px-4 py-2 rounded-md hover:bg-slate-700 flex items-center space-x-2"><span>Next</span><ArrowRight className="w-4 h-4" /></button>
                                ) : (
                                    <button onClick={handleClose} className="bg-blue-600 hover:bg-blue-500 font-semibold px-4 py-2 rounded-lg transition-all transform hover:scale-105">Get Started</button>
                                )}
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default WelcomeModal;