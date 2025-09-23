
import type { Recruit } from './types';
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
];
