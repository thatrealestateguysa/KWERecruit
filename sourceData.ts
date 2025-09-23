// This file contains the source code of the application as strings.
// It is used by the "Download Source" feature to create a zip file.

export const sourceFiles = {
  indexHtml: `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>KWE Recruit Machine</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script>
      tailwind.config = {
        theme: {
          extend: {
            colors: {
              'brand-primary': '#991b1b',
              'brand-secondary': '#b91c1c',
              'brand-accent': '#dc2626',
              'base-100': '#111827',
              'base-200': '#1f2937',
              'base-300': '#374151',
              'base-content': '#d1d5db',
              'success': '#10b981',
              'warning': '#f59e0b',
              'error': '#ef4444',
            }
          }
        }
      }
    </script>
    <style>
      .select-with-arrow {
        background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%239ca3af' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e");
        background-position: right 0.5rem center;
        background-repeat: no-repeat;
        background-size: 1.5em 1.5em;
      }
    </style>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js"></script>
  <script type="importmap">
{
  "imports": {
    "react/": "https://aistudiocdn.com/react@^19.1.1/",
    "react": "https://aistudiocdn.com/react@^19.1.1",
    "react-dom/": "https://aistudiocdn.com/react-dom@^19.1.1/"
  }
}
</script>
</head>
  <body class="bg-base-100 text-base-content">
    <div id="root"></div>
    <script type="module" src="/index.tsx"></script>
  </body>
</html>`,

  indexTsx: `import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);`,

  metadataJson: `{
  "name": "KWE Recruit Machine",
  "description": "A powerful CRM-like tool to manage and automate recruitment outreach for real estate agents, inspired by a Google Apps Script. It helps in tracking potential recruits, generating customized WhatsApp messages, and managing contact statuses efficiently.",
  "requestFramePermissions": []
}`,
  
  appTsx: `import React, { useState, useCallback, useMemo } from 'react';
import type { Recruit } from './types';
import { ListingType, Status } from './types';
import { generateWhatsAppInfo } from './services/automationService';
import { parseSheetCSV, exportRecruitsToCSV } from './services/sheetService';
import RecruitTable from './components/RecruitTable';
import { Header } from './components/Header';
import SyncModal from './components/SyncModal';
import { initialRecruits } from './constants';
import { sourceFiles } from './sourceData';

const App: React.FC = () => {
    const [recruits, setRecruits] = useState<Recruit[]>([]);
    const [lastRecruitId, setLastRecruitId] = useState(0);
    const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);

    const updateRecruit = useCallback((index: number, updatedRecruit: Recruit) => {
        const now = new Date();
        const oldRecruit = recruits[index];

        // Automations
        const keyFieldsChanged = oldRecruit.listingType !== updatedRecruit.listingType ||
                                 oldRecruit.phone !== updatedRecruit.phone ||
                                 oldRecruit.name !== updatedRecruit.name ||
                                 oldRecruit.suburb !== updatedRecruit.suburb;

        if(keyFieldsChanged) {
            const { message, link } = generateWhatsAppInfo(updatedRecruit);
            updatedRecruit.whatsAppMessage = message;
            updatedRecruit.whatsAppLink = link;
        }

        if (updatedRecruit.name && !updatedRecruit.status) {
            updatedRecruit.status = Status.ToContact;
        }
        
        if(oldRecruit.status !== updatedRecruit.status && updatedRecruit.status !== Status.None) {
            updatedRecruit.lastContactDate = now;
        }

        updatedRecruit.lastModified = now;

        setRecruits(prev => prev.map((r, i) => i === index ? updatedRecruit : r));
    }, [recruits]);
    
    const addNewRecruit = useCallback(() => {
        const newId = lastRecruitId + 1;
        const newRecruit: Recruit = {
            id: newId,
            listingType: ListingType.None,
            listingRef: '',
            name: '',
            surname: '',
            phone: '',
            email: '',
            suburb: '',
            agency: '',
            status: Status.None,
            lastContactDate: null,
            notes: '',
            whatsAppLink: '',
            whatsAppMessage: '',
            contactId: '',
            lastModified: new Date(),
        };
        setRecruits(prev => [...prev, newRecruit]);
        setLastRecruitId(newId);
    }, [lastRecruitId]);

    const deleteRecruit = useCallback((index: number) => {
        setRecruits(prev => prev.filter((_, i) => i !== index));
    }, []);

    const setupSheet = useCallback(() => {
        if(window.confirm("This will clear ALL data and set up a sample sheet. Are you sure?")) {
            setRecruits(initialRecruits);
            setLastRecruitId(initialRecruits.length);
        }
    }, []);

    const cleanOutputColumns = useCallback(() => {
        if(window.confirm("This will clear automation output columns (WhatsApp Link, Message, Last Contact). Continue?")) {
            setRecruits(prev => prev.map(r => ({
                ...r,
                whatsAppLink: '',
                whatsAppMessage: '',
                lastContactDate: null,
            })));
        }
    }, []);

    const rerunAutomations = useCallback(() => {
        let updatedCount = 0;
        setRecruits(prev => prev.map(r => {
            const { message, link } = generateWhatsAppInfo(r);
            if(r.whatsAppLink !== link || r.whatsAppMessage !== message) {
                updatedCount++;
            }
            return {
                ...r,
                whatsAppLink: link,
                whatsAppMessage: message,
            }
        }));
        alert(\`✅ Refresh Complete! \${updatedCount} rows were processed.\`);
    }, []);

    const setDefaultStatus = useCallback(() => {
        let updatedCount = 0;
        setRecruits(prev => prev.map(r => {
            if(r.name && !r.status) {
                updatedCount++;
                return { ...r, status: Status.ToContact, lastModified: new Date() };
            }
            return r;
        }));
        alert(\`✅ Done! \${updatedCount} rows were updated to "To Contact".\`);
    }, []);

    const processImportedData = useCallback((data: Recruit[]): Recruit[] => {
        return data.map(recruit => {
            const processedRecruit = { ...recruit };
    
            // 1. Run WhatsApp automations to generate links and messages
            const { message, link } = generateWhatsAppInfo(processedRecruit);
            processedRecruit.whatsAppLink = link;
            processedRecruit.whatsAppMessage = message;
            
            // 2. Auto-sync contacts (Simulated) if name exists and not already synced
            if (processedRecruit.name && !processedRecruit.contactId) {
                processedRecruit.contactId = \`mock-id-\${Date.now()}-\${recruit.id}\`;
            }
            
            // 3. Set default status if a name exists but status is empty
            if (processedRecruit.name && !processedRecruit.status) {
                processedRecruit.status = Status.ToContact;
            }
    
            processedRecruit.lastModified = new Date();
    
            return processedRecruit;
        });
    }, []);

    const handleExport = useCallback(() => {
        exportRecruitsToCSV(recruits);
    }, [recruits]);

    const handleImport = useCallback((csvText: string) => {
        // This function will now throw an error if the CSV is invalid,
        // which will be caught by the SyncModal component and displayed to the user.
        const parsedRecruits = parseSheetCSV(csvText);
        
        if (parsedRecruits.length === 0) {
            alert("Warning: No active recruits found in the pasted data. Please make sure there are rows with at least a Name or Contact Number.");
            return;
        }

        if (window.confirm(\`Found \${parsedRecruits.length} rows. This will replace all current data. Continue?\`)) {
            const processedData = processImportedData(parsedRecruits);
            setRecruits(processedData);
            setLastRecruitId(processedData.length > 0 ? Math.max(...processedData.map(r => r.id)) : 0);
            alert(\`✅ Import successful! \${processedData.length} recruits have been imported and processed.\`);
            setIsSyncModalOpen(false); // Only close on successful import
        }
    }, [processImportedData]);

    const handleDownloadSource = async () => {
        const JSZip = (window as any).JSZip;
        if (!JSZip) {
            alert("Error: Zipping library not found. Please refresh the page and try again.");
            return;
        }

        try {
            const zip = new JSZip();

            // Add root files
            zip.file("index.html", sourceFiles.indexHtml);
            zip.file("index.tsx", sourceFiles.indexTsx);
            zip.file("metadata.json", sourceFiles.metadataJson);
            zip.file("App.tsx", sourceFiles.appTsx);
            zip.file("types.ts", sourceFiles.typesTs);
            zip.file("constants.ts", sourceFiles.constantsTs);
            
            // Add components
            const components = zip.folder("components");
            components!.file("Header.tsx", sourceFiles.headerTsx);
            components!.file("Icons.tsx", sourceFiles.iconsTsx);
            components!.file("RecruitRow.tsx", sourceFiles.recruitRowTsx);
            components!.file("RecruitTable.tsx", sourceFiles.recruitTableTsx);
            components!.file("SyncModal.tsx", sourceFiles.syncModalTsx);
            
            // Add services
            const services = zip.folder("services");
            services!.file("automationService.ts", sourceFiles.automationServiceTs);
            services!.file("sheetService.ts", sourceFiles.sheetServiceTs);

            const content = await zip.generateAsync({ type: "blob" });
            
            const link = document.createElement("a");
            link.href = URL.createObjectURL(content);
            link.download = "kwe-recruit-machine-source.zip";
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

        } catch (error) {
            console.error("Failed to create zip file:", error);
            alert("An error occurred while creating the source code zip file. Please check the console for details.");
        }
    };


    const memoizedRecruits = useMemo(() => recruits, [recruits]);

    return (
        <div className="min-h-screen bg-base-100 text-base-content font-sans p-4 sm:p-6 lg:p-8">
            <div className="max-w-full mx-auto">
                <Header 
                    onSetup={setupSheet}
                    onClean={cleanOutputColumns}
                    onRerun={rerunAutomations}
                    onSetDefaultStatus={setDefaultStatus}
                    onSync={() => setIsSyncModalOpen(true)}
                    onDownloadSource={handleDownloadSource}
                />
                <main className="mt-6">
                    <RecruitTable 
                        recruits={memoizedRecruits}
                        onUpdateRecruit={updateRecruit}
                        onAddRecruit={addNewRecruit}
                        onDeleteRecruit={deleteRecruit}
                    />
                </main>
            </div>
            <SyncModal
                isOpen={isSyncModalOpen}
                onClose={() => setIsSyncModalOpen(false)}
                onImport={handleImport}
                onExport={handleExport}
            />
        </div>
    );
};

export default App;`,
  
  typesTs: `export enum ListingType {
    None = "",
    OnShow = "On Show",
    NewListing = "New Listing",
    Other = "Other"
}

export enum Status {
    None = "",
    ToContact = "To Contact",
    WhatsappSent = "Whatsapp Sent",
    Replied = "Replied",
    NotInterested = "Not Interested in KW",
    Networking = "Invite to Events/ Networking",
    Appointment = "Appointment",
    ReadyToJoin = "Ready to join KW",
    NoWhatsapp = "No Whatsapp"
}

export interface Recruit {
    id: number;
    listingType: ListingType;
    listingRef: string;
    name: string;
    surname: string;
    phone: string;
    email: string;
    suburb: string;
    agency: string;
    status: Status;
    lastContactDate: Date | null;
    notes: string;
    whatsAppLink: string;
    whatsAppMessage: string;
    contactId: string;
    lastModified: Date | null;
}`,

  constantsTs: `import type { Recruit } from './types';
import { ListingType, Status } from './types';

export const initialRecruits: Recruit[] = [
    {
        id: 1,
        listingType: ListingType.OnShow,
        listingRef: 'P24-12345',
        name: 'John',
        surname: 'Doe',
        phone: '0821234567',
        email: 'john.doe@example.com',
        suburb: 'Sandton',
        agency: 'Rival Realty',
        status: Status.ToContact,
        lastContactDate: null,
        notes: 'Met at a show day. Seemed interested.',
        whatsAppLink: '',
        whatsAppMessage: '',
        contactId: '',
        lastModified: new Date(),
    },
    {
        id: 2,
        listingType: ListingType.NewListing,
        listingRef: 'P24-67890',
        name: 'Jane',
        surname: 'Smith',
        phone: '0739876543',
        email: 'jane.smith@example.com',
        suburb: 'Fourways',
        agency: 'Competitor Estates',
        status: Status.WhatsappSent,
        lastContactDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
        notes: 'Top performer in her area.',
        whatsAppLink: '',
        whatsAppMessage: '',
        contactId: '',
        lastModified: new Date(),
    }
];`,

  headerTsx: `import React from 'react';
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
                    <button onClick={onDownloadSource} className={\`\${btnHeaderClasses} bg-gray-600/80 hover:bg-gray-600 text-white\`}>
                        <DownloadIcon />
                        Download Source
                    </button>
                    <button onClick={onSync} className={\`\${btnHeaderClasses} bg-brand-secondary/80 hover:bg-brand-secondary text-white\`}>
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
};`,

  iconsTsx: `import React from 'react';

export const CogIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
);

export const RefreshIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h5M20 20v-5h-5M20 4s-1-1-2.5-1-4 .5-5.5 2-4.413 5.413-4 8 .5 4 2 5.5S15 20 16 20" />
    </svg>
);

export const SparklesIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M19 3v4M17 5h4M14 11l-1-1-1 1M10 17l-1-1-1 1M12 21v-4M21 12h-4M7 12H3" />
    </svg>
);

export const StatusOnlineIcon = () => (
     <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.657 7.343A8 8 0 0118.657 17.657c-1.574 1.574-3.343 2.343-5.657 2.343C11 20 9 18 9 18c2 1 4 1 6.657-.343z" />
    </svg>
);

export const PlusIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
    </svg>
);

export const WhatsAppIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.894 11.892-1.99-.001-3.956-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.888-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.5-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.626.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
    </svg>
);

export const UserSyncIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7.5" r="4"/><polyline points="17 11 19 13 23 9"/>
    </svg>
);

export const TrashIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
);

export const SyncIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6h.1a5 5 0 011 9.9M12 13V21m0 0l-3-3m3 3l3-3" />
    </svg>
);

export const XIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
);

export const CloudUploadIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6h.1a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
    </svg>
);

export const CloudDownloadIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6h.1a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
    </svg>
);

export const LoadingSpinnerIcon = () => (
    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);

export const WarningIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
);

export const DownloadIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
    </svg>
);`,

  recruitRowTsx: `import React, { memo } from 'react';
import type { Recruit } from '../types';
import { ListingType, Status } from '../types';
import { WhatsAppIcon, UserSyncIcon, TrashIcon, WarningIcon } from './Icons';

interface RecruitRowProps {
    recruit: Recruit;
    index: number;
    onUpdate: (index: number, updatedRecruit: Recruit) => void;
    onDelete: (index: number) => void;
}

const getStatusColor = (status: Status) => {
    switch (status) {
        case Status.ToContact: return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
        case Status.WhatsappSent: return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
        case Status.Replied: return 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30';
        case Status.Appointment: return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
        case Status.ReadyToJoin: return 'bg-green-500/20 text-green-400 border-green-500/30';
        case Status.NotInterested: return 'bg-red-500/20 text-red-400 border-red-500/30';
        case Status.NoWhatsapp: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
        case Status.Networking: return 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30';
        default: return 'bg-base-300 text-base-content/70 border-base-300';
    }
};

const MemoizedRecruitRow: React.FC<RecruitRowProps> = ({ recruit, index, onUpdate, onDelete }) => {
    
    const baseInputClasses = "w-full bg-transparent border border-base-300 rounded-md py-2 px-3 text-sm text-base-content placeholder-gray-500 transition duration-200 focus:outline-none focus:border-brand-accent focus:ring-2 focus:ring-brand-accent/50";
    const selectClasses = \`\${baseInputClasses} select-with-arrow appearance-none pr-10\`;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        onUpdate(index, { ...recruit, [name]: value });
    };
    
    const handleSyncContact = () => {
        if (!recruit.name) {
            alert("Cannot sync: 'Name' field is empty.");
            return;
        }
        // This is a simulation of the Google Contacts sync
        const action = recruit.contactId ? 'Updated' : 'Created';
        alert(\`✅ [SIMULATED] Contact \${action}: \${recruit.name} \${recruit.surname}\`);
        if (!recruit.contactId) {
            onUpdate(index, { ...recruit, contactId: \`mock-id-\${Date.now()}\` });
        }
    };

    const handleDelete = () => {
        if(window.confirm(\`Are you sure you want to delete \${recruit.name || 'this row'}?\`)){
            onDelete(index);
        }
    }

    const formatDate = (date: Date | null) => {
        if (!date) return '—';
        return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(date));
    };
    
    const formatRelativeTime = (date: Date | null) => {
        if (!date) return '—';
        const now = new Date();
        const seconds = Math.floor((now.getTime() - new Date(date).getTime()) / 1000);
        let interval = seconds / 31536000;
        if (interval > 1) return Math.floor(interval) + "y ago";
        interval = seconds / 2592000;
        if (interval > 1) return Math.floor(interval) + "mo ago";
        interval = seconds / 86400;
        if (interval > 1) return Math.floor(interval) + "d ago";
        interval = seconds / 3600;
        if (interval > 1) return Math.floor(interval) + "h ago";
        interval = seconds / 60;
        if (interval > 1) return Math.floor(interval) + "m ago";
        return Math.floor(seconds) + "s ago";
    };

    return (
        <tr className="hover:bg-base-100/50 transition-colors duration-150">
            <td className="px-3 py-2 whitespace-nowrap"><select name="listingType" value={recruit.listingType} onChange={handleChange} className={selectClasses}><option value="">Select...</option>{Object.values(ListingType).filter(v => v !== "").map(v => <option key={v} value={v}>{v}</option>)}</select></td>
            <td className="px-3 py-2 whitespace-nowrap"><input type="text" name="listingRef" value={recruit.listingRef} onChange={handleChange} className={baseInputClasses} placeholder="Ref"/></td>
            <td className="px-3 py-2 whitespace-nowrap"><input type="text" name="name" value={recruit.name} onChange={handleChange} className={baseInputClasses} placeholder="First Name"/></td>
            <td className="px-3 py-2 whitespace-nowrap"><input type="text" name="surname" value={recruit.surname} onChange={handleChange} className={baseInputClasses} placeholder="Last Name"/></td>
            <td className="px-3 py-2 whitespace-nowrap"><input type="tel" name="phone" value={recruit.phone} onChange={handleChange} className={baseInputClasses} placeholder="082..."/></td>
            <td className="px-3 py-2 whitespace-nowrap"><input type="email" name="email" value={recruit.email} onChange={handleChange} className={baseInputClasses} placeholder="Email"/></td>
            <td className="px-3 py-2 whitespace-nowrap"><input type="text" name="suburb" value={recruit.suburb} onChange={handleChange} className={baseInputClasses} placeholder="Suburb"/></td>
            <td className="px-3 py-2 whitespace-nowrap"><input type="text" name="agency" value={recruit.agency} onChange={handleChange} className={baseInputClasses} placeholder="Agency"/></td>
            <td className="px-3 py-2 whitespace-nowrap">
                 <select name="status" value={recruit.status} onChange={handleChange} className={\`\${selectClasses} font-semibold border-l-4 \${getStatusColor(recruit.status)}\`}>
                    <option value="">Select...</option>
                    {Object.values(Status).filter(v => v !== "").map(v => <option key={v} value={v}>{v}</option>)}
                </select>
            </td>
            <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-400" title={recruit.lastContactDate ? new Date(recruit.lastContactDate).toLocaleString() : ''}>{formatDate(recruit.lastContactDate)}</td>
            <td className="px-3 py-2 whitespace-nowrap"><textarea name="notes" value={recruit.notes} onChange={handleChange} className={\`\${baseInputClasses} min-w-[200px]\`} placeholder="Notes..."/></td>
            <td className="px-3 py-2 text-center">
                {(() => {
                    if (recruit.whatsAppLink) {
                        return (
                            <a href={recruit.whatsAppLink} target="_blank" rel="noopener noreferrer" className="inline-block p-2 rounded-full hover:bg-green-500/20 text-green-400" title="Open WhatsApp Chat">
                                <WhatsAppIcon />
                            </a>
                        );
                    }
                    // If a phone number is entered but is invalid, it won't generate a link. Show a warning.
                    if (recruit.phone) {
                        return (
                            <span className="p-2 rounded-full text-yellow-500 cursor-help" title="Invalid phone number. A valid number (min 9 digits) is required to generate a link.">
                                <WarningIcon />
                            </span>
                        );
                    }
                    // Default disabled state if no phone number is present.
                    return (
                        <span className="p-2 text-base-300" title="Enter a phone number to generate a WhatsApp link.">
                            <WhatsAppIcon />
                        </span>
                    );
                })()}
            </td>
             <td className="px-3 py-2 text-center">
                <button onClick={handleSyncContact} className={\`p-2 rounded-full transition-colors \${recruit.contactId ? 'text-blue-400 hover:bg-blue-500/20' : 'text-gray-500 hover:bg-gray-500/20'}\`} title="Sync with Google Contacts (Simulated)">
                    <UserSyncIcon />
                </button>
            </td>
            <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-500" title={recruit.lastModified ? new Date(recruit.lastModified).toLocaleString() : ''}>{formatRelativeTime(recruit.lastModified)}</td>
            <td className="px-3 py-2 text-center">
                <button onClick={handleDelete} className="p-2 rounded-full text-gray-500 hover:bg-red-500/20 hover:text-red-400 transition-colors" title="Delete Row">
                    <TrashIcon />
                </button>
            </td>
        </tr>
    );
};
const RecruitRow = memo(MemoizedRecruitRow);
export default RecruitRow;`,

  recruitTableTsx: `import React from 'react';
import type { Recruit } from '../types';
import RecruitRow from './RecruitRow';
import { PlusIcon } from './Icons';

interface RecruitTableProps {
    recruits: Recruit[];
    onUpdateRecruit: (index: number, updatedRecruit: Recruit) => void;
    onAddRecruit: () => void;
    onDeleteRecruit: (index: number) => void;
}

const RecruitTable: React.FC<RecruitTableProps> = ({ recruits, onUpdateRecruit, onAddRecruit, onDeleteRecruit }) => {
    
    const headers = [
        "Listing Type", "Ref", "Name", "Surname", "Contact Number", "Email", "Suburb",
        "Agency", "Status", "Last Contact", "Notes", "WhatsApp", "Contact Sync", "Modified", "Actions"
    ];

    return (
        <div className="bg-base-200/50 rounded-lg shadow-lg border border-base-300 overflow-x-auto">
            <table className="min-w-full divide-y divide-base-300">
                <thead className="bg-base-300/70">
                    <tr>
                        {headers.map(header => (
                            <th key={header} scope="col" className="px-3 py-3.5 text-left text-xs font-semibold text-base-content/80 uppercase tracking-wider">
                                {header}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody className="divide-y divide-base-300 bg-base-200">
                    {recruits.map((recruit, index) => (
                        <RecruitRow
                            key={recruit.id}
                            recruit={recruit}
                            index={index}
                            onUpdate={onUpdateRecruit}
                            onDelete={onDeleteRecruit}
                        />
                    ))}
                </tbody>
            </table>
            <div className="p-4 bg-base-200/50 border-t border-base-300">
                <button 
                    onClick={onAddRecruit} 
                    className="flex items-center gap-2 px-4 py-2 bg-brand-secondary text-white rounded-md text-sm font-semibold hover:bg-brand-primary transition-colors duration-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-base-100 focus:ring-brand-accent"
                >
                    <PlusIcon />
                    Add New Recruit
                </button>
            </div>
        </div>
    );
};

export default RecruitTable;`,
  
  syncModalTsx: `import React, { useState } from 'react';
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
            className={\`flex-1 p-3 text-sm font-semibold flex items-center justify-center gap-2 border-b-2 transition-all duration-200 \${
                activeTab === tab 
                ? 'text-brand-accent border-brand-accent' 
                : 'text-gray-400 border-transparent hover:bg-base-300/50'
            }\`}
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
                                    <li className="font-bold text-yellow-300">The page should look like a simple text file, starting with your column headers (e.g. \`name,surname,phone...\`).</li>
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
             <style>{\`
                @keyframes fadeInScale {
                    from { transform: scale(0.95); opacity: 0; }
                    to { transform: scale(1); opacity: 1; }
                }
                .animate-fade-in-scale {
                    animation: fadeInScale 0.2s ease-out forwards;
                }
            \`}</style>
        </div>
    );
};

export default SyncModal;`,

  automationServiceTs: `import type { Recruit } from '../types';
import { ListingType } from '../types';

export const generateWhatsAppInfo = (recruit: Recruit): { message: string, link: string } => {
    const { name, suburb, listingType, phone } = recruit;

    let message = "";
    const signatureDawie = "\\n\\nDawie Du Toit,\\nKW Explore Fourways\\nhttps://thatrealestateguysa.kw.com";
    const signatureLeader = "\\n\\nDawie\\nTeam Leader at KW Explore\\nhttps://thatrealestateguysa.kw.com/";

    switch (listingType) {
        case ListingType.OnShow:
            message = \`Hi \${name},\\nJust out of curiosity, how did your \${suburb} show day go?\\n\\nIf you’re open-minded, would it be helpful to swap 10-min notes on buyer activity & pricing?\\n\\nWhen would be a good time for you?\` + signatureDawie;
            break;
        case ListingType.NewListing:
            message = \`Well done \${name},\\n\${suburb} is a great area to sell in!\\nListings are the lifeblood of our industry. All the best for a smooth sale.\\nLet's stay in touch, would love to share in your wins in Real Estate.\` + signatureLeader;
            break;
        case ListingType.Other:
            message = \`Hi \${name},\`;
            break;
        default:
            message = "";
            break;
    }

    let link = "";
    if (phone) {
        const cleanedNumber = phone.replace(/\\D/g, '');
        if (cleanedNumber.length >= 9) {
            const internationalNumber = '27' + cleanedNumber.substring(cleanedNumber.length - 9);
            link = \`https://wa.me/\${internationalNumber}\`;
            if (message) {
                link += \`?text=\${encodeURIComponent(message)}\`;
            }
        }
    }
    
    return { message, link };
};`,

  sheetServiceTs: `import type { Recruit } from '../types';
import { ListingType, Status } from '../types';

// Naive CSV line parser, handles quoted fields with commas.
// Does not handle escaped quotes within quoted fields.
const parseCsvLine = (line: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
             // Handle "" as an escaped quote inside a quoted field
             if(inQuotes && i < line.length - 1 && line[i+1] === '"') {
                 current += '"';
                 i++; // Skip the next quote
             } else {
                inQuotes = !inQuotes;
             }
        } else if (char === ',' && !inQuotes) {
            result.push(current.trim());
            current = '';
        } else {
            current += char;
        }
    }
    result.push(current.trim());
    return result;
};

// ** THE FIX **: A robust line splitter that correctly handles newlines within quoted fields.
const robustSplitLines = (text: string): string[] => {
    const rows: string[] = [];
    let currentRow = '';
    let inQuotes = false;
    for (let i = 0; i < text.length; i++) {
        const char = text[i];
        
        if (char === '"') {
            // Toggle inQuotes state. This simple toggle works because we're only splitting lines,
            // not parsing fields here. The more complex field parser will handle escaped quotes.
            inQuotes = !inQuotes;
        }

        if (char === '\\n' && !inQuotes) {
            // If we find a newline and we're NOT inside quotes, it's a real row delimiter.
            rows.push(currentRow.replace(/\\r$/, ''));
            currentRow = '';
        } else {
            // Otherwise, just append the character to the current row being built.
            currentRow += char;
        }
    }
    // Add the last line if the text doesn't end with a newline
    if (currentRow) {
        rows.push(currentRow.replace(/\\r$/, ''));
    }
    
    return rows.filter(row => row.trim() !== '');
};


// Flexible mapping to accommodate different column names from user sheets.
const headerMapping: { key: keyof Recruit; possibleNames: string[] }[] = [
    { key: 'listingType', possibleNames: ['listing type'] },
    { key: 'listingRef', possibleNames: ['ref', 'reference', 'listing ref'] },
    { key: 'name', possibleNames: ['name', 'first name', 'firstname'] },
    { key: 'surname', possibleNames: ['surname', 'last name', 'lastname'] },
    { key: 'phone', possibleNames: ['contact number', 'phone', 'cell', 'mobile', 'phone number'] },
    { key: 'email', possibleNames: ['email', 'email address'] },
    { key: 'suburb', possibleNames: ['suburb', 'area'] },
    { key: 'agency', possibleNames: ['agency', 'company'] },
    { key: 'status', possibleNames: ['status'] },
    { key: 'lastContactDate', possibleNames: ['last contact', 'last contact date'] },
    { key: 'notes', possibleNames: ['notes', 'comments'] },
    { key: 'whatsAppLink', possibleNames: ['whatsapp link'] },
    { key: 'whatsAppMessage', possibleNames: ['whatsapp message'] },
    { key: 'contactId', possibleNames: ['contact id', 'contact sync id'] },
    { key: 'lastModified', possibleNames: ['last modified', 'modified date'] },
];

export const parseSheetCSV = (csvText: string): Recruit[] => {
    // ** THE FIX **: Normalize input to handle both Tab-Separated and Comma-Separated data.
    const normalizedText = csvText.replace(/\\t/g, ',');
    const lines = robustSplitLines(normalizedText);

    if (lines.length === 0) return [];
    
    const headerLine = lines.shift() as string;
    
    // Header Sanity Check: If the first line doesn't contain at least one common header, it's not the right data.
    const headerContent = headerLine.toLowerCase();
    const commonHeaders = ['name', 'phone', 'contact', 'suburb', 'email', 'agency', 'status', 'ref'];
    const hasValidHeader = commonHeaders.some(h => headerContent.includes(h));
    
    if (!hasValidHeader) {
        throw new Error("Import Failed: The pasted text does not look like a valid CSV from your sheet. The first line should be a header row containing columns like 'Name', 'Phone', etc.");
    }
    
    // Normalize headers to be lowercase for case-insensitive matching
    const headers = parseCsvLine(headerLine).map(h => h.trim().replace(/^"|"$/g, '').toLowerCase());
    
    const mappedIndices: { [key in keyof Recruit]?: number } = {};
    headers.forEach((header, index) => {
        const mapping = headerMapping.find(m => m.possibleNames.includes(header));
        if (mapping && mappedIndices[mapping.key] === undefined) {
            mappedIndices[mapping.key] = index;
        }
    });
    
    const finalRecruits: Omit<Recruit, 'id'>[] = [];

    for (const line of lines) {
        // Stage 1: Skip structurally empty lines immediately.
        if (line.trim() === '' || line.replace(/,/g, '').trim() === '') {
            continue;
        }

        const values = parseCsvLine(line).map(v => v.trim().replace(/^"|"$/g, ''));
        
        // Stage 2: Check for substance. If all parsed cells are empty, it's a "ghost" row.
        const hasSubstantiveData = values.some(v => v !== '');
        if (!hasSubstantiveData) {
            continue;
        }
        
        const recruit: Partial<Recruit> = {};
        
        for (const key in mappedIndices) {
            const recruitKey = key as keyof Recruit;
            const valueIndex = mappedIndices[recruitKey];
            if (valueIndex !== undefined && valueIndex < values.length) {
                let value: any = values[valueIndex] || '';

                if (recruitKey === 'lastContactDate' || recruitKey === 'lastModified') {
                    value = value ? new Date(value) : null;
                } else if (recruitKey === 'listingType') {
                    const enumKey = Object.keys(ListingType).find(k => ListingType[k as keyof typeof ListingType].toLowerCase() === value.toLowerCase());
                    value = enumKey ? ListingType[enumKey as keyof typeof ListingType] : ListingType.None;
                } else if (recruitKey === 'status') {
                    const enumKey = Object.keys(Status).find(k => Status[k as keyof typeof Status].toLowerCase() === value.toLowerCase());
                    value = enumKey ? Status[enumKey as keyof typeof Status] : Status.None;
                }
                
                (recruit as any)[recruitKey] = value;
            }
        }
        
        // Stage 3: Final check for actionability. Must have a name or phone.
        if (!recruit.name && !recruit.phone) {
            continue;
        }

        // If all checks pass, add it to our list of valid recruits.
        finalRecruits.push({
            listingType: ListingType.None,
            listingRef: '',
            name: '',
            surname: '',
            phone: '',
            email: '',
            suburb: '',
            agency: '',
            status: Status.None,
            lastContactDate: null,
            notes: '',
            whatsAppLink: '',
            whatsAppMessage: '',
            contactId: '',
            lastModified: new Date(),
            ...recruit,
        });
    }

    // Assign sequential IDs at the very end to the clean list.
    return finalRecruits.map((recruit, index) => ({
        ...recruit,
        id: index + 1,
    }));
};

export const exportRecruitsToCSV = (recruits: Recruit[]) => {
    const headers = [
        "Listing Type", "Ref", "Name", "Surname", "Contact Number", "Email", "Suburb",
        "Agency", "Status", "Last Contact", "Notes", "WhatsApp Link", "WhatsApp Message", "Contact ID", "Last Modified"
    ];
    
    const escapeCsvField = (field: string | null | undefined) => {
        if (field === null || field === undefined) return '';
        const stringField = String(field);
        if (stringField.includes(',') || stringField.includes('"') || stringField.includes('\\n')) {
            return \`"\${stringField.replace(/"/g, '""')}"\`;
        }
        return stringField;
    };

    const rows = recruits.map(r => [
        escapeCsvField(r.listingType),
        escapeCsvField(r.listingRef),
        escapeCsvField(r.name),
        escapeCsvField(r.surname),
        escapeCsvField(r.phone),
        escapeCsvField(r.email),
        escapeCsvField(r.suburb),
        escapeCsvField(r.agency),
        escapeCsvField(r.status),
        r.lastContactDate ? r.lastContactDate.toISOString() : '',
        escapeCsvField(r.notes),
        escapeCsvField(r.whatsAppLink),
        escapeCsvField(r.whatsAppMessage),
        escapeCsvField(r.contactId),
        r.lastModified ? r.lastModified.toISOString() : ''
    ].join(','));
    
    const csvContent = [headers.join(','), ...rows].join('\\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        const dateStr = new Date().toISOString().split('T')[0];
        link.setAttribute('download', \`kwe_recruits_export_\${dateStr}.csv\`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
};`,
};