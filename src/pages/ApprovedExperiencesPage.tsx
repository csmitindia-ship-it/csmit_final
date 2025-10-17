import React, { useState, useEffect } from 'react';
import ThemedModal from '../components/ThemedModal';
import Loader from '../components/Loader';
import API_BASE_URL from './Config'; // adjust path if needed

interface Experience {
  id: number;
  name: string;
  email: string;
  type: 'Placement' | 'Intern';
  year_of_passing: number;
  company: string;
  linkedin_url: string;
  status: 'pending' | 'approved' | 'rejected';
}

const ApprovedExperiencesPage: React.FC = () => {
  const [approvedExperiences, setApprovedExperiences] = useState<Experience[]>([]);
  const [modal, setModal] = useState({ isOpen: false, title: '', message: '' });
  const [isLoading, setIsLoading] = useState(true);

  const showModal = (title: string, message: string) => {
    setModal({ isOpen: true, title, message });
  };

  const fetchExperiences = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/placements/admin/approved-experiences`);
      if (response.ok) {
        const data = await response.json();
        setApprovedExperiences(data);
      } else {
        showModal('Error', 'Error fetching experiences.');
        setApprovedExperiences([]);
      }
    } catch (err) {
      showModal('Error', 'Error fetching experiences.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchExperiences();
  }, []);

  const handleDeleteExperience = (id: number) => {
    setModal({ 
      isOpen: true, 
      title: 'Confirm Deletion', 
      message: 'Are you sure you want to delete this experience?' 
    });
  };

  const confirmDelete = async (id: number) => {
    try {
      const response = await fetch(`${API_BASE_URL}/placements/admin/delete-experience/${id}`, {
        method: 'DELETE',
      });
      const result = await response.json();

      if (response.ok) {
        fetchExperiences();
        showModal('Success', 'Experience deleted successfully!');
      } else {
        showModal('Error', result.message || 'Failed to delete experience.');
      }
    } catch (err) {
      showModal('Error', 'Failed to delete experience.');
    }
    setModal({ isOpen: false, title: '', message: '' });
  };

  return (
    <>
      {isLoading ? (
        <Loader />
      ) : (
        <>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-12 text-center">Manage Approved Experiences</h1>
          
          <div className="space-y-6">
            {approvedExperiences.length > 0 ? (
              approvedExperiences.map(exp => (
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
                    <a href={`${API_BASE_URL}/placements/experiences/${exp.id}/pdf`} target="_blank" rel="noopener noreferrer" className="w-full md:w-auto text-center px-4 py-2 bg-purple-600 text-white text-sm font-semibold rounded-lg hover:bg-purple-700 transition-colors">
                      View Resume
                    </a>
                  </div>
                </div>
              ))
            ) : (
              <div className="bg-gray-900/70 backdrop-blur-md border border-purple-500/30 p-8 rounded-lg text-center">
                <p className="text-lg text-gray-300">No approved experiences to display.</p>
              </div>
            )}
          </div>
        </>
      )}
      <ThemedModal
        isOpen={modal.isOpen}
        onClose={() => setModal({ isOpen: false, title: '', message: '' })}
        title={modal.title}
        message={modal.message}
        onConfirm={modal.title === 'Confirm Deletion' ? () => confirmDelete(approvedExperiences.find(exp => exp.id)!.id) : undefined}
        showConfirmButton={modal.title === 'Confirm Deletion'}
      />
    </>
  );
};

export default ApprovedExperiencesPage;
