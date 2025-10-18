import React, { useState, useEffect } from 'react';
import ExperienceForm from './ExperienceForm';
import backgroundImage from '../Login_Sign/photo.jpeg';
import Header from '../ui/Header';
import LoginPage from '../Login_Sign/LoginPage';
import SignUpPage from '../Login_Sign/SignUpPage';
import ForgotPassword from '../Login_Sign/Forgot_Pass';
import Loader from '../components/Loader'; // Import Loader component
import API_BASE_URL from '../Config'; // adjust path if needed

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

const PlacementsPage: React.FC = () => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [approvedExperiences, setApprovedExperiences] = useState<Experience[]>([]);
  const [expandedCompany, setExpandedCompany] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isSignUpModalOpen, setIsSignUpModalOpen] = useState(false);
  const [isForgotPasswordModalOpen, setIsForgotPasswordModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true); // Loading state

  const fetchExperiences = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/placements/experiences`);
      const data = await response.json();
      const approved = data.filter((exp: Experience) => exp.status === 'approved');
      setApprovedExperiences(approved);
    } catch (err) {
      console.error('Error fetching approved experiences:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchExperiences();
  }, []);

  const groupedExperiences = approvedExperiences.reduce((acc, exp) => {
    if (!acc[exp.company]) {
      acc[exp.company] = [];
    }
    acc[exp.company].push(exp);
    return acc;
  }, {} as Record<string, Experience[]>);

  const sortedCompanyNames = Object.keys(groupedExperiences).sort((a, b) => a.localeCompare(b));

  const filteredCompanyNames = sortedCompanyNames.filter(company =>
    company.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCompanyClick = (companyName: string) => {
    setExpandedCompany(expandedCompany === companyName ? null : companyName);
  };

  const handleSwitchToSignUp = () => {
    setIsLoginModalOpen(false);
    setIsSignUpModalOpen(true);
  };

  const handleSwitchToLogin = () => {
    setIsSignUpModalOpen(false);
    setIsForgotPasswordModalOpen(false);
    setIsLoginModalOpen(true);
  };

  const handleSwitchToForgotPassword = () => {
    setIsLoginModalOpen(false);
    setIsForgotPasswordModalOpen(true);
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;600;700&display=swap');
        
        .glow-button:hover { box-shadow: 0 0 15px 2px rgba(167, 139, 250, 0.6); }

        @keyframes marquee {
          0% { transform: translateX(0%); }
          100% { transform: translateX(-100%); }
        }
        .animate-marquee {
          animation: marquee 30s linear infinite;
        }
      `}</style>
      <div
        className="relative min-h-screen font-sans text-gray-200 overflow-x-hidden bg-cover bg-center bg-fixed"
        style={{
          fontFamily: "'Poppins', sans-serif",
          backgroundImage: `url(${backgroundImage})`
        }}
      >
        {isLoading ? (
          <Loader />
        ) : (
          <>
            <div className="absolute inset-0 bg-black/70 z-0"></div>
            <Header setIsLoginModalOpen={setIsLoginModalOpen} setIsSignUpModalOpen={setIsSignUpModalOpen}/>

            <div className="relative z-10 container mx-auto px-4 py-8 mt-24">
              <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold text-white">Placement Details</h1>
                <button
                  onClick={() => setIsFormOpen(true)}
                  className="px-6 py-3 bg-purple-600 text-white font-semibold rounded-lg hover:scale-105 transition-transform duration-300 shadow-lg glow-button"
                >
                  Post Experiences here
                </button>
              </div>

              {/* Search Bar */}
              <div className="mb-8 flex justify-center">
                <div className="relative w-full max-w-md">
                  <input
                    type="text"
                    placeholder="Search companies..."
                    className="w-full pl-10 pr-10 py-3 bg-gray-800/60 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-300"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm('')}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-white focus:outline-none"
                    >
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>

              <div className="flex flex-col md:flex-row gap-8">
                {/* Left Sidebar: Company List */}
                <div className="md:w-1/3 lg:w-1/4 bg-gray-900/70 backdrop-blur-md border border-purple-500/30 rounded-lg p-4 max-h-[calc(100vh-200px)] overflow-y-auto">
                  <h2 className="text-xl font-bold text-white mb-4">Companies</h2>
                  {filteredCompanyNames.length > 0 ? (
                    <div className="space-y-3">
                      {filteredCompanyNames.map(company => (
                        <button
                          key={company}
                          onClick={() => handleCompanyClick(company)}
                          className={`w-full text-left px-4 py-3 rounded-lg transition-all duration-200 
                            ${expandedCompany === company ? 'bg-purple-700/50 text-white shadow-lg' : 'bg-gray-800/50 text-purple-300 hover:bg-gray-700/50'}
                          `}
                        >
                          <span className="font-semibold">{company}</span>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-400">No companies found.</p>
                  )}
                </div>

                {/* Right Content: Student Experiences */}
                <div className="md:w-2/3 lg:w-3/4 bg-gray-900/70 backdrop-blur-md border border-purple-500/30 rounded-lg p-6">
                  {expandedCompany ? (
                    <>
                      <h2 className="text-2xl font-bold text-purple-400 mb-6">{expandedCompany} Experiences</h2>
                      <div className="space-y-4">
                        {groupedExperiences[expandedCompany]?.map(exp => (
                          <div key={exp.id} className="p-4 bg-gray-800/70 rounded-lg shadow-md">
                            <p className="font-bold text-white text-lg">{exp.name} ({exp.year_of_passing})</p>
                            <p className="text-sm text-gray-300 mb-2">{exp.type}</p>
                            <a href={`${API_BASE_URL}/placements/experiences/${exp.id}/pdf`} target="_blank" rel="noopener noreferrer" className="text-sm text-purple-400 hover:underline inline-block">View Experience (PDF)</a>
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <div className="h-full flex items-center justify-center">
                      <p className="text-lg text-gray-300">Select a company from the left to view experiences.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        )}

        {isFormOpen && <ExperienceForm onClose={() => setIsFormOpen(false)} />}
        <LoginPage 
            isOpen={isLoginModalOpen} 
            onClose={() => setIsLoginModalOpen(false)} 
            onSwitchToSignUp={handleSwitchToSignUp} 
            onSwitchToForgotPassword={handleSwitchToForgotPassword} 
        />
        <SignUpPage 
            isOpen={isSignUpModalOpen} 
            onClose={() => setIsSignUpModalOpen(false)} 
            onSwitchToLogin={handleSwitchToLogin} 
        />
        <ForgotPassword 
            isOpen={isForgotPasswordModalOpen} 
            onClose={() => setIsForgotPasswordModalOpen(false)} 
            onSwitchToLogin={handleSwitchToLogin} 
        />
      </div>
    </>
  );
};

export default PlacementsPage;