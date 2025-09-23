import React from 'react';
import { CogIcon, RefreshIcon, SparklesIcon, StatusOnlineIcon, SyncIcon, DownloadIcon } from './Icons';

interface HeaderProps {
    onSetup: () => void;
    onClean: () => void;
    onRerun: () => void;
    onSetDefaultStatus: () => void;
    onSync: () => void;
    onDownloadSource: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onSetup, onClean, onRerun, onSetDefaultStatus, onSync, onDownloadSource }) => {
    // FIX: Replaced unsupported <style jsx> with direct Tailwind classes for buttons.
    const btnHeaderClasses = "flex items-center justify-center gap-2 px-3 py-2 bg-base-300 text-base-content rounded-md text-xs font-semibold hover:bg-brand-primary hover:text-white transition-all duration-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-base-100 focus:ring-brand-accent";

    return (
        <header className="bg-base-200/50 rounded-lg p-4 sm:p-6 shadow-lg border border-base-300">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                        KWE Recruit Machine
                    </h1>
                    <p className="text-sm text-gray-400 mt-1">
                        Your automated real estate recruitment dashboard.
                    </p>
                </div>
                <div className="grid grid-cols-3 sm:flex sm:flex-row gap-2 mt-4 sm:mt-0">
                    <button onClick={onDownloadSource} className={`${btnHeaderClasses} bg-gray-600/80 hover:bg-gray-600 text-white`}>
                        <DownloadIcon />
                        Download Source
                    </button>
                    <button onClick={onSync} className={`${btnHeaderClasses} bg-brand-secondary/80 hover:bg-brand-secondary text-white`}>
                        <SyncIcon />
                        Sync with Sheets
                    </button>
                    <button onClick={onSetup} className={btnHeaderClasses}>
                        <CogIcon />
                        Load Sample Data
                    </button>
                    <button onClick={onClean} className={btnHeaderClasses}>
                        <SparklesIcon />
                        Prepare
                    </button>
                    <button onClick={onRerun} className={btnHeaderClasses}>
                        <RefreshIcon />
                        Refresh All
                    </button>
                    <button onClick={onSetDefaultStatus} className={btnHeaderClasses}>
                        <StatusOnlineIcon />
                        Set Status
                    </button>
                </div>
            </div>
        </header>
    );
};