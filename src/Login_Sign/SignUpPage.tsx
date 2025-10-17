import { useState } from 'react';
import API_BASE_URL from './Config'; // adjust path if needed

interface SignUpPageProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchToLogin: () => void;
}

export default function SignUpPage({ isOpen, onClose, onSwitchToLogin }: SignUpPageProps) {
  if (!isOpen) return null;

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    dob: '',
    mobile: '',
    college: '',
    department: 'CSE',
    yearOfPassing: new Date().getFullYear(),
    state: 'Tamil Nadu',
    district: ''
  });

  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showOtherCollegeInput, setShowOtherCollegeInput] = useState(false); // New state variable

  const states = [
    "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
    "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka",
    "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya",
    "Mizoram", "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim",
    "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand",
    "West Bengal"
  ];
  const departments = ["CSE", "IT", "ECE", "EEE", "MECH", "CIVIL", "AUTO"];
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 10 }, (_, i) => currentYear + i - 5);

  const handleSwitch = (e: React.MouseEvent) => {
    e.preventDefault();
    onSwitchToLogin();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleCollegeSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    if (value === 'Other') {
      setFormData({ ...formData, college: '' }); // Clear college to allow user to type
      setShowOtherCollegeInput(true);
    } else {
      setFormData({ ...formData, college: value });
      setShowOtherCollegeInput(false);
    }
  };

  const MIT_COLLEGE_NAME = "Madras Institute of Technology";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess('Signed up successfully!');
        setTimeout(() => {
          onSwitchToLogin();
        }, 2000);
      } else {
        setError(data.message || 'Failed to create account.');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    }
    setIsLoading(false);
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl bg-gray-900/80 border border-purple-500/30 rounded-2xl p-8 shadow-2xl shadow-purple-500/20 overflow-y-auto max-h-[90vh] z-10"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-purple-400 transition-colors duration-300 z-10"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="text-center mb-6">
          <h2 className="text-3xl font-bold text-white">Create an Account</h2>
          <p className="text-purple-300">Join the CSMIT Community</p>
        </div>

        {error && <p className="text-red-500 text-center mb-4">{error}</p>}
        {success && <p className="text-green-500 text-center mb-4">{success}</p>}

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Full Name</label>
            <input type="text" name="fullName" value={formData.fullName} onChange={handleChange} placeholder="Your full name" className="w-full px-4 py-2 bg-gray-800/60 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Email Address</label>
            <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="you@mit.edu" className="w-full px-4 py-2 bg-gray-800/60 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500" required />
          </div>
          <div className="relative">
            <label className="block text-sm font-medium text-gray-400 mb-1">Password</label>
            <input type={showPassword ? 'text' : 'password'} name="password" value={formData.password} onChange={handleChange} placeholder="Create a strong password" className="w-full px-4 py-2 bg-gray-800/60 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500" required />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 top-6 pr-3 flex items-center text-gray-400 hover:text-purple-400"
            >
              {showPassword ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                  <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.022 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                  <path d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.022 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" />
                  <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                  <path d="M10 3a7 7 0 00-7 7c0 1.55.49 3 1.32 4.24L2.5 15.5a1 1 0 001.41 1.41L15.5 5.32A7 7 0 0010 3zm-1.9 8.9a2 2 0 01-2.82-2.82L7.18 7.17a4 4 0 005.66 5.66l-1.9-1.9z" />
                </svg>
              )}
            </button>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Date of Birth</label>
              <input type="date" name="dob" value={formData.dob} onChange={handleChange} className="w-full px-4 py-2 bg-gray-800/60 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Mobile Number</label>
              <input type="tel" name="mobile" value={formData.mobile} onChange={handleChange} placeholder="+91..." className="w-full px-4 py-2 bg-gray-800/60 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500" required />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">College Name</label>
            <select
              name="collegeSelect"
              value={formData.college === MIT_COLLEGE_NAME ? MIT_COLLEGE_NAME : (showOtherCollegeInput ? 'Other' : '')}
              onChange={handleCollegeSelectChange}
              className="w-full px-4 py-2 bg-gray-800/60 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              required
            >
              <option value="">Select your college</option>
              <option value={MIT_COLLEGE_NAME}>{MIT_COLLEGE_NAME}</option>
              <option value="Other">Other</option>
            </select>

            {showOtherCollegeInput && (
              <input
                type="text"
                name="college"
                value={formData.college}
                onChange={handleChange}
                placeholder="Enter your college name"
                className="w-full px-4 py-2 mt-2 bg-gray-800/60 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                required
              />
            )}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Department</label>
              <select name="department" value={formData.department} onChange={handleChange} className="w-full px-4 py-2 bg-gray-800/60 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500" required>
                {departments.map(dept => <option key={dept} value={dept}>{dept}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Year of Passing</label>
              <select name="yearOfPassing" value={formData.yearOfPassing} onChange={handleChange} className="w-full px-4 py-2 bg-gray-800/60 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500" required>
                {years.map(year => <option key={year} value={year}>{year}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">State</label>
              <select name="state" value={formData.state} onChange={handleChange} className="w-full px-4 py-2 bg-gray-800/60 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500" required>
                {states.map(state => <option key={state} value={state}>{state}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">District</label>
              <input type="text" name="district" value={formData.district} onChange={handleChange} placeholder="Your district" className="w-full px-4 py-2 bg-gray-800/60 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500" required />
            </div>
          </div>

          <div className="pt-4">
            <button type="submit" className="w-full px-8 py-3 bg-purple-600 text-white font-semibold rounded-lg hover:scale-105 transition-transform duration-300 shadow-lg glow-button flex items-center justify-center" disabled={isLoading}>
              {isLoading ? (
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                'Create Account'
              )}
            </button>
          </div>
        </form>

        <p className="text-center text-sm text-gray-400 mt-8">
          Already have an account? <a href="#" onClick={handleSwitch} className="font-medium text-purple-400 hover:underline">Log In</a>
        </p>
      </div>
    </div>
  );
}
