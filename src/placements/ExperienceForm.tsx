import React, { useState } from 'react';
import ThemedModal from '../components/ThemedModal'; // Import ThemedModal
import API_BASE_URL from './Config'; // adjust path if needed

interface ExperienceFormProps {
  onClose: () => void;
}

const ExperienceForm: React.FC<ExperienceFormProps> = ({ onClose }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [type, setType] = useState<'Placement' | 'Intern' | 'Off-Campus Placement' | 'Off-Campus Intern'>('Placement');
  const [year, setYear] = useState('');
  const [company, setCompany] = useState('');
  const [linkedin, setLinkedin] = useState('');
  const [pdf, setPdf] = useState<File | null>(null);

  // State variables for the modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalMessage, setModalMessage] = useState('');

  const handleCloseModal = () => {
    setIsModalOpen(false);
    // If it was a success message, close the form after the modal
    if (modalTitle === 'Success') {
      onClose();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!pdf) {
      setModalTitle('Error');
      setModalMessage('Please upload a PDF file.');
      setIsModalOpen(true);
      return;
    }

    const formData = new FormData();
    formData.append('name', name);
    formData.append('email', email);
    formData.append('type', type);
    formData.append('year', year);
    formData.append('company', company);
    formData.append('linkedin', linkedin);
    formData.append('pdf', pdf);

    try {
      const response = await fetch(`${API_BASE_URL}/placements/submit-experience`, { // Updated port to 5001
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (response.ok) {
        setModalTitle('Success');
        setModalMessage('Experience submitted successfully! It will be reviewed by the admin.');
        setIsModalOpen(true);
        // onClose() will be called after modal closes in handleCloseModal
      } else {
        setModalTitle('Error');
        setModalMessage(`Error: ${result.message}`);
        setIsModalOpen(true);
      }
    } catch (error) {
      console.error('Error submitting experience:', error);
      setModalTitle('Error');
      setModalMessage('An error occurred while submitting the form.');
      setIsModalOpen(true);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-900/70 backdrop-blur-md border border-purple-500/30 p-8 rounded-lg w-full max-w-lg">
        <h2 className="text-2xl font-bold text-white mb-6">Share Your Experience</h2>
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="mb-4">
              <label htmlFor="name" className="block text-purple-400 mb-2">Name</label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-gray-800/80 border border-purple-500/30 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                required
              />
            </div>
            <div className="mb-4">
              <label htmlFor="email" className="block text-purple-400 mb-2">Email</label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-gray-800/80 border border-purple-500/30 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                required
              />
            </div>
            <div className="mb-4">
              <label htmlFor="type" className="block text-purple-400 mb-2">Type</label>
              <select
                id="type"
                value={type}
                onChange={(e) => setType(e.target.value as 'Placement' | 'Intern' | 'Off-Campus Placement' | 'Off-Campus Intern')}
                className="w-full bg-gray-800/80 border border-purple-500/30 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="Placement">Placement</option>
                <option value="Intern">Intern</option>
                <option value="Off-Campus Placement">Off-Campus Placement</option>
                <option value="Off-Campus Intern">Off-Campus Intern</option>
              </select>
            </div>
            <div className="mb-4">
              <label htmlFor="year" className="block text-purple-400 mb-2">Year of Passing Out</label>
              <input
                type="text"
                id="year"
                value={year}
                onChange={(e) => setYear(e.target.value)}
                className="w-full bg-gray-800/80 border border-purple-500/30 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                required
              />
            </div>
            <div className="mb-4">
              <label htmlFor="company" className="block text-purple-400 mb-2">Company</label>
              <input
                type="text"
                id="company"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                className="w-full bg-gray-800/80 border border-purple-500/30 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                required
              />
            </div>
            <div className="mb-4">
              <label htmlFor="linkedin" className="block text-purple-400 mb-2">LinkedIn URL</label>
              <input
                type="url"
                id="linkedin"
                value={linkedin}
                onChange={(e) => setLinkedin(e.target.value)}
                className="w-full bg-gray-800/80 border border-purple-500/30 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>
          <div className="mb-6">
            <label htmlFor="pdf" className="block text-purple-400 mb-2">Upload PDF</label>
            <input
              type="file"
              id="pdf"
              accept=".pdf"
              onChange={(e) => setPdf(e.target.files ? e.target.files[0] : null)}
              className="w-full text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-purple-600 file:text-white hover:file:bg-purple-700"
            />
          </div>
          <div className="flex justify-end gap-4">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 bg-gray-700 text-white font-semibold rounded-lg hover:bg-gray-600 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 transition-colors glow-button"
            >
              Submit
            </button>
          </div>
        </form>
      </div>
      {/* Render ThemedModal */}
      <ThemedModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={modalTitle}
        message={modalMessage}
        showConfirmButton={false} // No confirm button for simple alerts
      />
    </div>
  );
};

export default ExperienceForm;
