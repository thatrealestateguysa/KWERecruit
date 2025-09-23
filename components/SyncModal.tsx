import React, { useState } from 'react';
import { CloudUploadIcon, CloudDownloadIcon, XIcon, LoadingSpinnerIcon } from './Icons';

interface SyncModalProps {
    isOpen: boolean;
    onClose: () => void;
    onImport: (csvText: string) => void;
    onExport: () => void;
}

const SyncModal: React.FC<SyncModalProps> = ({ isOpen, onClose, onImport, onExport }) => {
    const [activeTab, setActiveTab] = useState<'import' | 'export'>('import');
    const [csvText, setCsvText] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    if (!isOpen) return null;

    const handleImportClick = () => {
        if (!csvText.trim()) {
            setError('Please paste your CSV data into the text box.');
            return;
        }
        setIsLoading(true);
        setError(null);
        try {
            onImport(csvText);
            // On success, the parent component will close the modal after the alert.
        } catch (e: any) {
            setError(e.message || 'Failed to import data. Please check the CSV format.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleExportClick = () => {
        onExport();
        onClose();
    };
    
    const resetState = () => {
        setCsvText('');
        setError(null);
        setIsLoading(false);
    }
    
    const handleClose = () => {
        resetState();
        onClose();
    }
    
    const TabButton: React.FC<{tab: 'import' | 'export', children: React.ReactNode}> = ({tab, children}) => (
         <button
            onClick={() => setActiveTab(tab)}
            className={`flex-1 p-3 text-sm font-semibold flex items-center justify-center gap-2 border-b-2 transition-all duration-200 ${
                activeTab === tab 
                ? 'text-brand-accent border-brand-accent' 
                : 'text-gray-400 border-transparent hover:bg-base-300/50'
            }`}
        >
            {children}
        </button>
    )

    return (
        <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-center items-center p-4 transition-opacity duration-300"
            onClick={handleClose}
            aria-modal="true"
            role="dialog"
        >
            <div 
                className="bg-base-200 border border-base-300 rounded-lg shadow-xl w-full max-w-lg transform transition-all duration-300 scale-95 opacity-0 animate-fade-in-scale"
                onClick={(e) => e.stopPropagation()}
            >
                <header className="flex justify-between items-center p-4 border-b border-base-300">
                    <h2 className="text-lg font-bold text-white">Sync with Google Sheets</h2>
                    <button onClick={handleClose} className="p-1 rounded-full text-gray-400 hover:bg-base-300 hover:text-white">
                        <XIcon />
                    </button>
                </header>

                <div className="flex border-b border-base-300">
                    <TabButton tab="import"><CloudUploadIcon/> Import from Sheet</TabButton>
                    <TabButton tab="export"><CloudDownloadIcon/> Export to CSV</TabButton>
                </div>

                <div className="p-6">
                    {activeTab === 'import' && (
                        <div className="space-y-4">
                            <div>
                                <h3 className="font-semibold text-white">Import by Direct Paste (Recommended)</h3>
                                <p className="text-sm text-gray-400 mt-1">This method is 100% reliable and avoids network errors. This will replace all current data in the app.</p>
                            </div>
                            
                            <div className="text-xs text-gray-400 space-y-2">
                                <ol className="list-decimal list-inside space-y-2 bg-base-300/50 p-3 rounded-md">
                                    <li>First, get your "Publish to web" CSV link from Google Sheets.</li>
                                    <li>Open that link in a new browser tab. You will see plain text.</li>
                                    <li className="font-semibold text-gray-300">Note: This works with data copied from Sheets or Excel (Tab or Comma separated).</li>
                                    <li className="font-bold text-yellow-300">The page should look like a simple text file, starting with your column headers (e.g. `name,surname,phone...`).</li>
                                    <li>Select all text on that page (<kbd className="px-2 py-1 text-xs font-semibold text-gray-300 bg-base-100 border border-base-300 rounded-md">Ctrl+A</kbd> or <kbd className="px-2 py-1 text-xs font-semibold text-gray-300 bg-base-100 border border-base-300 rounded-md">Cmd+A</kbd>).</li>
                                    <li>Copy the selected text (<kbd className="px-2 py-1 text-xs font-semibold text-gray-300 bg-base-100 border border-base-300 rounded-md">Ctrl+C</kbd> or <kbd className="px-2 py-1 text-xs font-semibold text-gray-300 bg-base-100 border border-base-300 rounded-md">Cmd+C</kbd>).</li>
                                    <li>Paste the text into the box below.</li>
                                </ol>
                            </div>

                            <div>
                                <label htmlFor="csv-data" className="block text-sm font-medium text-gray-300 mb-1">Paste CSV Data Here</label>
                                <textarea
                                    id="csv-data"
                                    value={csvText}
                                    onChange={(e) => {
                                        setCsvText(e.target.value);
                                        setError(null); // Clear error on new input
                                    }}
                                    className="w-full h-32 bg-base-300 border border-base-300 rounded-md p-2 text-base-content font-mono text-xs focus:ring-2 focus:ring-brand-accent focus:outline-none"
                                    placeholder="listing type,ref,name,surname,contact number..."
                                />
                            </div>
                            {error && <p className="text-sm text-error font-semibold">{error}</p>}
                            <div className="flex justify-end gap-3">
                                <button onClick={handleClose} className="px-4 py-2 text-sm font-semibold text-gray-300 bg-base-300 rounded-md hover:bg-base-300/70">Cancel</button>
                                <button 
                                    onClick={handleImportClick} 
                                    disabled={isLoading}
                                    className="px-4 py-2 text-sm font-semibold text-white bg-brand-secondary rounded-md hover:bg-brand-primary disabled:bg-base-300 disabled:cursor-not-allowed flex items-center gap-2"
                                >
                                    {isLoading ? <LoadingSpinnerIcon /> : <CloudUploadIcon/>}
                                    {isLoading ? 'Importing...' : 'Import & Replace'}
                                </button>
                            </div>
                        </div>
                    )}
                    {activeTab === 'export' && (
                        <div className="space-y-4">
                             <div>
                                <h3 className="font-semibold text-white">Export Data</h3>
                                <p className="text-sm text-gray-400 mt-1">Download all current data as a CSV file. You can open this file in Google Sheets or other spreadsheet software.</p>
                            </div>
                            <div className="flex justify-end gap-3 pt-4">
                               <button onClick={handleClose} className="px-4 py-2 text-sm font-semibold text-gray-300 bg-base-300 rounded-md hover:bg-base-300/70">Cancel</button>
                                <button onClick={handleExportClick} className="px-4 py-2 text-sm font-semibold text-white bg-brand-secondary rounded-md hover:bg-brand-primary flex items-center gap-2">
                                    <CloudDownloadIcon />
                                    Download CSV
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
             <style>{`
                @keyframes fadeInScale {
                    from { transform: scale(0.95); opacity: 0; }
                    to { transform: scale(1); opacity: 1; }
                }
                .animate-fade-in-scale {
                    animation: fadeInScale 0.2s ease-out forwards;
                }
            `}</style>
        </div>
    );
};

export default SyncModal;