
export enum ListingType {
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
}
