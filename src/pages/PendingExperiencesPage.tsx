import React, { useState, useEffect } from 'react';
import Loader from '../components/Loader'; // Import Loader component
import ThemedModal from '../components/ThemedModal'; // Adjust path as needed

interface Experience {
  id: number;
  name: string;
  email: string;
  type: 'Placement' | 'Intern';
  year_of_passing: number;
  company: string;
  linkedin_url: string;
  pdf_path: string;
  status: 'pending' | 'approved' | 'rejected';
}

const PendingExperiencesPage: React.FC = () => {
  const [pendingExperiences, setPendingExperiences] = useState<Experience[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalMessage, setModalMessage] = useState('');
  const [modalOnConfirm, setModalOnConfirm] = useState<(() => void) | undefined>(undefined);
  const [showConfirmButton, setShowConfirmButton] = useState(false);
  const [isLoading, setIsLoading] = useState(true); // Loading state

  const fetchExperiences = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/placements/admin/pending-experiences');
      if (response.ok) {
        const data = await response.json();
        setPendingExperiences(data);
      } else {
        console.error('Error fetching experiences:', response.statusText);
        setPendingExperiences([]);
      }
    } catch (err) {
      console.error('Error fetching experiences:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchExperiences();
  }, []);

  const handleStatusUpdate = (id: number, status: 'approved' | 'rejected') => {
    fetch('/api/placements/admin/update-experience-status', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ id, status }),
    })
      .then(res => res.json())
      .then(result => {
        fetchExperiences(); // Re-fetch to update list
        setModalTitle('Success');
        setModalMessage(result.message || 'Status updated successfully');
        setShowConfirmButton(false);
        setIsModalOpen(true);
      })
      .catch(err => {
        console.error('Error updating experience status:', err);
        setModalTitle('Error');
        setModalMessage('Failed to update experience status.');
        setShowConfirmButton(false);
        setIsModalOpen(true);
      });
  };

  const handleDeleteExperience = (id: number) => {
    setModalTitle('Confirm Deletion');
    setModalMessage('Are you sure you want to delete this experience?');
    setModalOnConfirm(() => async () => {
      try {
        const response = await fetch(`/api/placements/admin/delete-experience/${id}`, {
          method: 'DELETE',
        });
        const result = await response.json();

        if (response.ok) {
          fetchExperiences(); // Re-fetch to update list
          setModalTitle('Success');
          setModalMessage('Experience deleted successfully!');
          setShowConfirmButton(false);
          setIsModalOpen(true);
        } else {
          setModalTitle('Error');
          setModalMessage(result.message || 'Failed to delete experience.');
          setShowConfirmButton(false);
          setIsModalOpen(true);
        }
      } catch (err) {
        console.error('Error deleting experience:', err);
        setModalTitle('Error');
        setModalMessage('Failed to delete experience.');
        setShowConfirmButton(false);
        setIsModalOpen(true);
      }
    });
    setShowConfirmButton(true);
    setIsModalOpen(true);
  };

  return (
    <>
      {isLoading ? (
        <Loader />
      ) : (
        <>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-12 text-center">Review Pending Experiences</h1>
          
          <div className="space-y-6">
            {pendingExperiences.length > 0 ? (
              pendingExperiences.map(exp => (
                <div key={exp.id} className="bg-gray-900/70 backdrop-blur-md border border-purple-500/30 p-6 rounded-lg transform transition-transform hover:-translate-y-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <button
                        onClick={() => handleDeleteExperience(exp.id)}
                        className="px-4 py-2 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-colors"
                      >
                        Delete
                      </button>
                      <div>
                        <p><strong className="font-semibold text-purple-400">Name:</strong> {exp.name}</p>
                        <p><strong className="font-semibold text-purple-400">Company:</strong> {exp.company}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleStatusUpdate(exp.id, 'approved')}
                        className="px-4 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleStatusUpdate(exp.id, 'rejected')}
                        className="px-4 py-2 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-colors"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="bg-gray-900/70 backdrop-blur-md border border-purple-500/30 p-8 rounded-lg text-center">
                <p className="text-lg text-gray-300">No pending experiences to review.</p>
              </div>
            )}
          </div>
        </>
      )}
      <ThemedModal // Render the modal component
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={modalTitle}
        message={modalMessage}
        onConfirm={modalOnConfirm}
        showConfirmButton={showConfirmButton}
      />
    </>
  );
};

export default PendingExperiencesPage;