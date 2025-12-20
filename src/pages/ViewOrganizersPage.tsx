import React, { useEffect, useState } from 'react';
import axios from 'axios';
import API_BASE_URL from '../Config';
import backgroundImage from '../Login_Sign/photo.jpeg';
import Loader from '../components/Loader';

interface Organizer {
  id: number;
  name: string;
  email: string;
  mobile: string;
  password?: string;
}

const ViewOrganizersPage: React.FC = () => {
  const [organizers, setOrganizers] = useState<Organizer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrganizers = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get(`${API_BASE_URL}/organizers`);
      setOrganizers(response.data);
    } catch (err) {
      setError('Failed to fetch organizers. Please try again later.');
      console.error('Error fetching organizers:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrganizers();
  }, []);

  const handleDelete = async (id: number) => {
    const confirmDelete = window.confirm('Are you sure you want to delete this organizer?');
    if (!confirmDelete) {
      return;
    }

    try {
      await axios.delete(`${API_BASE_URL}/organizers/${id}`);
      setOrganizers(organizers.filter(o => o.id !== id));
    } catch (err) {
      setError('Failed to delete organizer. Please try again later.');
      console.error('Error deleting organizer:', err);
    }
  };

  return (
    <div
      className="relative min-h-screen font-sans text-gray-200"
      style={{ fontFamily: "'Poppins', sans-serif" }}
    >
      <div
        className="absolute inset-0 bg-cover bg-center bg-fixed"
        style={{ backgroundImage: `url(${backgroundImage})` }}
      ></div>
      <div className="absolute inset-0 bg-black/70 z-0"></div>
      
      <div className="container mx-auto p-4 pt-20 relative z-10">
        <h2 className="text-3xl font-bold text-white mb-8 text-center">Organizer Credentials</h2>
        {isLoading ? (
          <Loader />
        ) : error ? (
          <p className="text-center text-red-500">{error}</p>
        ) : (
          <div className="bg-gray-800/80 backdrop-blur-md rounded-lg shadow-lg p-6 border border-gray-700">
            <div className="overflow-x-auto">
              <table className="min-w-full text-left">
                <thead className="border-b border-gray-600">
                  <tr>
                    <th className="p-4 text-sm font-semibold text-purple-300">Name</th>
                    <th className="p-4 text-sm font-semibold text-purple-300">Email</th>
                    <th className="p-4 text-sm font-semibold text-purple-300">Mobile</th>
                    <th className="p-4 text-sm font-semibold text-purple-300">Password (Hashed)</th>
                    <th className="p-4 text-sm font-semibold text-purple-300">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {organizers.map((organizer) => (
                    <tr key={organizer.id} className="border-b border-gray-700 hover:bg-gray-700/50">
                      <td className="p-4 whitespace-nowrap">{organizer.name}</td>
                      <td className="p-4 whitespace-nowrap">{organizer.email}</td>
                      <td className="p-4 whitespace-nowrap">{organizer.mobile}</td>
                      <td className="p-4 whitespace-nowrap font-mono text-sm">{organizer.password}</td>
                      <td className="p-4 whitespace-nowrap">
                        <button
                          onClick={() => handleDelete(organizer.id)}
                          className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ViewOrganizersPage;
