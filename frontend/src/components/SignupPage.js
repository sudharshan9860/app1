import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';


function SignupPage() {
  const [schoolName, setSchoolName] = useState('');
  const [schoolCode, setSchoolCode] = useState('');
  const [file, setFile] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!schoolName || !schoolCode || !file) {
      setError('Please fill out all fields and upload a file.');
      return;
    }

    // You would typically send the data to your backend API here
    // e.g., axios.post('/api/signup', formData)

    // Simulate a successful signup
    setSuccess('Signup successful! Redirecting to login...');

    setTimeout(() => {
      navigate('/');
    }, 2000); // Redirect after 2 seconds
  };
  const handleLoginClick = () => {
    navigate('/');
  };
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0B1120] px-4">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 w-full max-w-md">
        <h2 className="text-2xl font-bold text-[#0B1120] text-center mb-6">Signup</h2>
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
            {error}
          </div>
        )}
        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-4 text-sm">
            {success}
          </div>
        )}
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="formSchoolName">
              School Name
            </label>
            <input
              id="formSchoolName"
              type="text"
              placeholder="Enter school name"
              value={schoolName}
              onChange={(e) => setSchoolName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#00A0E3] focus:border-transparent"
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="formSchoolCode">
              School Code
            </label>
            <input
              id="formSchoolCode"
              type="text"
              placeholder="Enter school code"
              value={schoolCode}
              onChange={(e) => setSchoolCode(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#00A0E3] focus:border-transparent"
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="formFileUpload">
              Upload File (Excel, PDF, or CSV)
            </label>
            <input
              id="formFileUpload"
              type="file"
              onChange={(e) => setFile(e.target.files[0])}
              accept=".csv, .xlsx, .xls, .pdf"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm file:mr-4 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-[#00A0E3] file:text-white hover:file:bg-[#0080B8]"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-[#00A0E3] hover:bg-[#0080B8] text-white rounded-lg py-2.5 font-medium transition-colors"
          >
            Signup
          </button>
        </form>
        <div className="mt-3 text-center">
          <button
            onClick={handleLoginClick}
            className="text-[#00A0E3] hover:text-[#0080B8] text-sm font-medium hover:underline"
          >
            Login ?
          </button>
        </div>
      </div>
    </div>
  );
}

export default SignupPage;
