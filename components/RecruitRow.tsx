import React, { memo } from 'react';
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
    const selectClasses = `${baseInputClasses} select-with-arrow appearance-none pr-10`;

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
        alert(`✅ [SIMULATED] Contact ${action}: ${recruit.name} ${recruit.surname}`);
        if (!recruit.contactId) {
            onUpdate(index, { ...recruit, contactId: `mock-id-${Date.now()}` });
        }
    };

    const handleDelete = () => {
        if(window.confirm(`Are you sure you want to delete ${recruit.name || 'this row'}?`)){
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
                 <select name="status" value={recruit.status} onChange={handleChange} className={`${selectClasses} font-semibold border-l-4 ${getStatusColor(recruit.status)}`}>
                    <option value="">Select...</option>
                    {Object.values(Status).filter(v => v !== "").map(v => <option key={v} value={v}>{v}</option>)}
                </select>
            </td>
            <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-400" title={recruit.lastContactDate ? new Date(recruit.lastContactDate).toLocaleString() : ''}>{formatDate(recruit.lastContactDate)}</td>
            <td className="px-3 py-2 whitespace-nowrap"><textarea name="notes" value={recruit.notes} onChange={handleChange} className={`${baseInputClasses} min-w-[200px]`} placeholder="Notes..."/></td>
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
                <button onClick={handleSyncContact} className={`p-2 rounded-full transition-colors ${recruit.contactId ? 'text-blue-400 hover:bg-blue-500/20' : 'text-gray-500 hover:bg-gray-500/20'}`} title="Sync with Google Contacts (Simulated)">
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
export default RecruitRow;