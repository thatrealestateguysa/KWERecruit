import type { Recruit } from '../types';
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

        if (char === '\n' && !inQuotes) {
            // If we find a newline and we're NOT inside quotes, it's a real row delimiter.
            rows.push(currentRow.replace(/\r$/, ''));
            currentRow = '';
        } else {
            // Otherwise, just append the character to the current row being built.
            currentRow += char;
        }
    }
    // Add the last line if the text doesn't end with a newline
    if (currentRow) {
        rows.push(currentRow.replace(/\r$/, ''));
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
    const normalizedText = csvText.replace(/\t/g, ',');
    const lines = robustSplitLines(normalizedText);

    if (lines.length === 0) return [];
    
    const headerLine = lines.shift() as string;
    
    const headerContent = headerLine.toLowerCase();
    const commonHeaders = ['name', 'phone', 'contact', 'suburb', 'email', 'agency', 'status', 'ref'];
    const hasValidHeader = commonHeaders.some(h => headerContent.includes(h));
    
    if (!hasValidHeader) {
        throw new Error("Import Failed: The pasted text does not look like a valid CSV from your sheet. The first line should be a header row containing columns like 'Name', 'Phone', etc.");
    }
    
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
        if (line.trim() === '' || line.replace(/,/g, '').trim() === '') {
            continue;
        }

        const values = parseCsvLine(line).map(v => v.trim().replace(/^"|"$/g, ''));
        
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
        
        if (!recruit.name && !recruit.phone) {
            continue;
        }

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
        if (stringField.includes(',') || stringField.includes('"') || stringField.includes('\n')) {
            return `"${stringField.replace(/"/g, '""')}"`;
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
    
    const csvContent = [headers.join(','), ...rows].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        const dateStr = new Date().toISOString().split('T')[0];
        link.setAttribute('download', `kwe_recruits_export_${dateStr}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
};