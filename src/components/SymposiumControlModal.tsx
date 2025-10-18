import React, { useState, useEffect } from 'react';
import API_BASE_URL from '../Config'; // adjust path if needed

interface SymposiumControlModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface SymposiumStatus {
  symposiumName: 'Enigma' | 'Carteblanche';
  isOpen: 0 | 1;
  startDate: string;
}

const SymposiumControlModal: React.FC<SymposiumControlModalProps> = ({ isOpen, onClose }) => {
  const [symposiumStatus, setSymposiumStatus] = useState<SymposiumStatus[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchStatus = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/symposium/status`);
      const data = await response.json();
      if (data.success) {
        setSymposiumStatus(data.data);
      } else {
        setError(data.message || 'Failed to fetch status.');
      }
    } catch (err) {
      setError('An error occurred while fetching status.');
    }
    setIsLoading(false);
  };

  useEffect(() => {
    if (isOpen) {
      fetchStatus();
    }
  }, [isOpen]);

  const handleToggle = async (symposiumName: string, startDate: string, action: 'start' | 'stop') => {
    try {
      const response = await fetch(`${API_BASE_URL}/symposium/${action}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ symposiumName, startDate }),
        }
      );
      const data = await response.json();
      if (data.success) {
        fetchStatus(); // Refresh status
      } else {
        setError(data.message || `Failed to ${action} symposium.`);
      }
    } catch (err) {
      setError(`An error occurred while trying to ${action} the symposium.`);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg bg-gray-900/80 border border-green-500/30 rounded-2xl p-8 shadow-2xl shadow-green-500/20 z-10"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-green-400 transition-colors duration-300 z-10"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <h2 className="text-2xl font-bold text-white text-center mb-6">Symposium Control</h2>
        {isLoading ? (
          <p className="text-center">Loading...</p>
        ) : error ? (
          <p className="text-center text-red-500">{error}</p>
        ) : (
          <div className="space-y-4">
            {symposiumStatus.map(symposium => (
              <div key={symposium.symposiumName} className="flex justify-between items-center p-4 bg-gray-800/50 rounded-lg">
                <div>
                  <p className="font-bold text-lg">{symposium.symposiumName}</p>
                  <p className={`text-sm ${symposium.isOpen ? 'text-green-400' : 'text-red-400'}`}>
                    {symposium.isOpen ? 'Open' : 'Closed'}
                  </p>
                </div>
                <div>
                  <input type="date" defaultValue={symposium.startDate?.split('T')[0]} id={`${symposium.symposiumName}-date`} className="bg-gray-700 text-white rounded-md p-1 text-sm"/>
                  {symposium.isOpen ? (
                    <button onClick={() => handleToggle(symposium.symposiumName, (document.getElementById(`${symposium.symposiumName}-date`) as HTMLInputElement | null)?.value || '', 'stop')} className="ml-4 px-4 py-2 text-sm bg-red-600 text-white rounded-md hover:bg-red-700 transition">
                      Stop
                    </button>
                  ) : (
                    <button onClick={() => handleToggle(symposium.symposiumName, (document.getElementById(`${symposium.symposiumName}-date`) as HTMLInputElement | null)?.value || '', 'start')} className="ml-4 px-4 py-2 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 transition">
                      Start
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SymposiumControlModal;