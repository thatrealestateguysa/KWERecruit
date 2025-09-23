
import React from 'react';
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

export default RecruitTable;
