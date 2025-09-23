
import type { Recruit } from '../types';
import { ListingType } from '../types';

export const generateWhatsAppInfo = (recruit: Recruit): { message: string, link: string } => {
    const { name, suburb, listingType, phone } = recruit;

    let message = "";
    const signatureDawie = "\n\nDawie Du Toit,\nKW Explore Fourways\nhttps://thatrealestateguysa.kw.com";
    const signatureLeader = "\n\nDawie\nTeam Leader at KW Explore\nhttps://thatrealestateguysa.kw.com/";

    switch (listingType) {
        case ListingType.OnShow:
            message = `Hi ${name},\nJust out of curiosity, how did your ${suburb} show day go?\n\nIf you’re open-minded, would it be helpful to swap 10-min notes on buyer activity & pricing?\n\nWhen would be a good time for you?` + signatureDawie;
            break;
        case ListingType.NewListing:
            message = `Well done ${name},\n${suburb} is a great area to sell in!\nListings are the lifeblood of our industry. All the best for a smooth sale.\nLet's stay in touch, would love to share in your wins in Real Estate.` + signatureLeader;
            break;
        case ListingType.Other:
            message = `Hi ${name},`;
            break;
        default:
            message = "";
            break;
    }

    let link = "";
    if (phone) {
        const cleanedNumber = phone.replace(/\D/g, '');
        if (cleanedNumber.length >= 9) {
            const internationalNumber = '27' + cleanedNumber.substring(cleanedNumber.length - 9);
            link = `https://wa.me/${internationalNumber}`;
            if (message) {
                link += `?text=${encodeURIComponent(message)}`;
            }
        }
    }
    
    return { message, link };
};
