import React, { useState } from 'react';
import Papa from 'papaparse'; // npm install papaparse @types/papaparse
import API_BASE_URL from '../Config';
import AdminHeader from '../ui/AdminHeader';

interface VerificationResult {
  id: string;
  status: 'success' | 'error';
  message: string;
}

const VerifyTransactionPage: React.FC = () => {
  // --- Single Verification State ---
  const [transactionId, setTransactionId] = useState('');
  const [isSingleLoading, setIsSingleLoading] = useState(false);
  const [singleMessage, setSingleMessage] = useState('');

  // --- Bulk Verification State ---
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [isBulkLoading, setIsBulkLoading] = useState(false);
  const [bulkResults, setBulkResults] = useState<VerificationResult[]>([]);
  const [progress, setProgress] = useState({ current: 0, total: 0 });

  // ------------------------------------------
  // Helper: Reusable API Call
  // ------------------------------------------
  const verifyTransactionAPI = async (id: string) => {
    // Ensure ID is a clean string with no scientific notation artifacts
    const cleanId = String(id).trim();

    const response = await fetch(`${API_BASE_URL}/verification/verify-transaction`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ transactionId: cleanId }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Verification failed.');
    }
    return data;
  };

  // ------------------------------------------
  // Single Transaction Logic
  // ------------------------------------------
  const handleVerifySingle = async () => {
    if (!transactionId) {
      setSingleMessage('Please enter a transaction ID.');
      return;
    }

    setIsSingleLoading(true);
    setSingleMessage('');

    try {
      const result = await verifyTransactionAPI(transactionId);
      setSingleMessage(result.message);
    } catch (error: any) {
      setSingleMessage(error.message);
    } finally {
      setIsSingleLoading(false);
    }
  };

  // ------------------------------------------
  // Bulk Transaction Logic
  // ------------------------------------------
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setCsvFile(e.target.files[0]);
      setBulkResults([]);
      setProgress({ current: 0, total: 0 });
    }
  };

  const handleBulkVerify = () => {
    if (!csvFile) return;

    setIsBulkLoading(true);
    setBulkResults([]);

    Papa.parse(csvFile, {
      header: true,
      skipEmptyLines: true,
      
      // CRITICAL FIX: Prevent converting "123456" to Number type
      dynamicTyping: false, 
      
      // CRITICAL FIX: Force every value to be a trimmed string
      transform: (value) => {
        return value.trim(); 
      },

      complete: async (results) => {
        const rows = results.data as any[];
        
        // Grab the first column value, ensure it is treated as a string
        const idsToVerify = rows
          .map((row) => {
            const val = Object.values(row)[0];
            return val ? String(val) : ''; 
          })
          .filter(id => id !== '');

        setProgress({ current: 0, total: idsToVerify.length });

        for (let i = 0; i < idsToVerify.length; i++) {
          const currentId = idsToVerify[i];
          
          // Double check we aren't sending scientific notation like "5.12E+10"
          if (currentId.toLowerCase().includes('e+')) {
             setBulkResults((prev) => [
              ...prev, 
              { id: currentId, status: 'error', message: 'Invalid ID Format (Scientific Notation detected in CSV)' }
            ]);
            setProgress((prev) => ({ ...prev, current: i + 1 }));
            continue;
          }

          try {
            const apiRes = await verifyTransactionAPI(currentId);
            setBulkResults((prev) => [
              ...prev, 
              { id: currentId, status: 'success', message: apiRes.message || 'Verified' }
            ]);
          } catch (error: any) {
            setBulkResults((prev) => [
              ...prev, 
              { id: currentId, status: 'error', message: error.message }
            ]);
          }

          setProgress((prev) => ({ ...prev, current: i + 1 }));
        }

        setIsBulkLoading(false);
      },
      error: (err) => {
        console.error("CSV Parse Error:", err);
        setIsBulkLoading(false);
        alert("Failed to parse CSV file");
      }
    });
  };

  return (
    <div>
      
      <div className="p-4 max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-gray-800">Verify Transactions</h1>

        {/* Single Verification Card */}
        <div className="bg-white p-6 rounded-lg shadow-md mb-8 border border-gray-200">
          <h2 className="text-xl font-semibold mb-4 text-purple-700">Single Verification</h2>
          <div className="max-w-md">
            <div className="mb-4">
              <label htmlFor="transactionId" className="block text-sm font-medium text-gray-700 mb-1">
                Transaction ID
              </label>
              <input
                type="text"
                id="transactionId"
                value={transactionId}
                onChange={(e) => setTransactionId(e.target.value)}
                className="w-full p-2 border rounded focus:ring-2 focus:ring-purple-500 outline-none"
                placeholder="Enter a single ID"
              />
            </div>
            <button
              onClick={handleVerifySingle}
              disabled={isSingleLoading || isBulkLoading}
              className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:bg-gray-400 transition"
            >
              {isSingleLoading ? 'Verifying...' : 'Verify Single ID'}
            </button>
            {singleMessage && (
              <p className={`mt-4 p-2 rounded ${singleMessage.toLowerCase().includes('failed') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
                {singleMessage}
              </p>
            )}
          </div>
        </div>

        {/* Bulk Verification Card */}
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
          <h2 className="text-xl font-semibold mb-4 text-purple-700">Bulk Verification (CSV)</h2>
          
          {/* Warning Tip */}
          <div className="mb-4 p-3 bg-yellow-50 text-yellow-800 text-sm rounded border border-yellow-200">
             <strong>Tip:</strong> If using Excel, ensure your ID column is formatted as <strong>Text</strong> before saving. 
             If you see "E+" in your results, check your CSV file.
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Upload CSV
            </label>
            <div className="flex items-center gap-4">
              <input
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                disabled={isBulkLoading}
                className="block w-full text-sm text-slate-500
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-full file:border-0
                  file:text-sm file:font-semibold
                  file:bg-purple-50 file:text-purple-700
                  hover:file:bg-purple-100"
              />
              <button
                onClick={handleBulkVerify}
                disabled={!csvFile || isBulkLoading}
                className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 transition whitespace-nowrap"
              >
                {isBulkLoading ? 'Processing...' : 'Verify All'}
              </button>
            </div>
          </div>

          {/* Progress Bar */}
          {isBulkLoading && progress.total > 0 && (
            <div className="mb-6">
              <div className="flex justify-between text-sm mb-1">
                <span>Processing...</span>
                <span>{progress.current} / {progress.total}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div 
                  className="bg-blue-600 h-2.5 rounded-full transition-all duration-300" 
                  style={{ width: `${(progress.current / progress.total) * 100}%` }}
                ></div>
              </div>
            </div>
          )}

          {/* Results Table */}
          {bulkResults.length > 0 && (
            <div className="overflow-x-auto max-h-96 overflow-y-auto border rounded">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Message</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {bulkResults.map((res, index) => (
                    <tr key={index} className={res.status === 'success' ? 'bg-green-50' : 'bg-red-50'}>
                      <td className="px-6 py-2 text-sm font-mono text-gray-700">{res.id}</td>
                      <td className="px-6 py-2 text-sm">
                        <span className={`px-2 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          res.status === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {res.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-2 text-sm text-gray-500">{res.message}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VerifyTransactionPage;