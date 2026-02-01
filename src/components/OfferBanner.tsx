import { useState, useEffect } from 'react';
import axios from 'axios';
import API_BASE_URL from '../Config';

const OfferBanner = () => {
    const [offer, setOffer] = useState<{ content: string } | null>(null);

    useEffect(() => {
        const fetchOffer = async () => {
            try {
                const response = await axios.get(`${API_BASE_URL}/offer`);
                setOffer(response.data.offer);
            } catch (error) {
                console.error('Error fetching offer:', error);
            }
        };
        fetchOffer();
    }, []);

    if (!offer) {
        return null;
    }

    return (
        <div className="bg-yellow-400 text-center py-2 overflow-hidden">
            <div className="animate-marquee whitespace-nowrap inline-block">
                <span className="text-lg font-bold text-gray-800">{offer.content}</span>
            </div>
        </div>
    );
};

export default OfferBanner;
