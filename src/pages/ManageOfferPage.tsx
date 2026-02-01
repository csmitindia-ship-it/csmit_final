import { useState, useEffect } from 'react';
import axios from 'axios';
import API_BASE_URL from '../Config';
import AdminHeader from '../ui/AdminHeader';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const ManageOfferPage = () => {
    const [content, setContent] = useState('');
    const [offer, setOffer] = useState<{ content: string, active: boolean } | null>(null);

    const fetchOffer = async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/offer`);
            setOffer(response.data.offer);
            if (response.data.offer) {
                setContent(response.data.offer.content);
            }
        } catch (error) {
            console.error('Error fetching offer:', error);
        }
    };

    useEffect(() => {
        fetchOffer();
    }, []);

    const handleUpdate = async () => {
        try {
            await axios.post(`${API_BASE_URL}/offer`, { content });
            toast.success('Offer updated successfully');
            fetchOffer();
        } catch (error) {
            console.error('Error updating offer:', error);
            toast.error('Failed to update offer');
        }
    };

    const handleStop = async () => {
        try {
            await axios.put(`${API_BASE_URL}/offer/stop`);
            toast.success('Offer stopped successfully');
            fetchOffer();
        } catch (error) {
            console.error('Error stopping offer:', error);
            toast.error('Failed to stop offer');
        }
    };

    const handleDelete = async () => {
        try {
            await axios.delete(`${API_BASE_URL}/offer`);
            toast.success('Offer deleted successfully');
            setContent('');
            fetchOffer();
        } catch (error) {
            console.error('Error deleting offer:', error);
            toast.error('Failed to delete offer');
        }
    };

    return (
        <div className="min-h-screen bg-gray-100">
            <ToastContainer />
            <div className="container mx-auto p-4">
                <h1 className="text-2xl font-bold mb-4">Manage Offer</h1>
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <div className="mb-4">
                        <label htmlFor="content" className="block text-sm font-medium text-gray-700">
                            Offer Content
                        </label>
                        <textarea
                            id="content"
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-black"
                            rows={4}
                        />
                    </div>
                    <div className="flex space-x-4">
                        <button
                            onClick={handleUpdate}
                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                        >
                            Update Offer
                        </button>
                        <button
                            onClick={handleStop}
                            className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700"
                            disabled={!offer || !offer.active}
                        >
                            Stop Offer
                        </button>
                        <button
                            onClick={handleDelete}
                            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                            disabled={!offer}
                        >
                            Delete Offer
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ManageOfferPage;
