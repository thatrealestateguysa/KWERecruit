import React, { useState, useCallback, useMemo } from 'react';
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
        alert(`✅ Refresh Complete! ${updatedCount} rows were processed.`);
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
        alert(`✅ Done! ${updatedCount} rows were updated to "To Contact".`);
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
                processedRecruit.contactId = `mock-id-${Date.now()}-${recruit.id}`;
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

        if (window.confirm(`Found ${parsedRecruits.length} rows. This will replace all current data. Continue?`)) {
            const processedData = processImportedData(parsedRecruits);
            setRecruits(processedData);
            setLastRecruitId(processedData.length > 0 ? Math.max(...processedData.map(r => r.id)) : 0);
            alert(`✅ Import successful! ${processedData.length} recruits have been imported and processed.`);
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

export default App;