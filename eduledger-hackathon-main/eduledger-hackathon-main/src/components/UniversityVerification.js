import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';

const UniversityVerification = ({ contract, account, isAuthorized }) => {
  const [studentAddress, setStudentAddress] = useState('');
  const [searchedRequest, setSearchedRequest] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [timeoutId, setTimeoutId] = useState(null);

  // Function to fetch a specific admission request by student address
  const fetchAdmissionRequest = async (address) => {
    if (!contract || !isAuthorized) return;
    
    // Clear any existing timeout
    if (timeoutId) {
      clearTimeout(timeoutId);
      setTimeoutId(null);
    }
    
    setLoading(true);
    setMessage('');
    setSearchedRequest(null);
    
    try {
      // Set a timeout for the request
      const newTimeoutId = setTimeout(() => {
        setMessage("Request is taking longer than expected. Please check your connection and try again.");
        setLoading(false);
      }, 10000); // 10 second timeout
      
      setTimeoutId(newTimeoutId);
      
      const request = await contract.admissionRequests(address);
      
      // Clear the timeout if request completes
      clearTimeout(newTimeoutId);
      setTimeoutId(null);
      
      if (request.exists) {
        setSearchedRequest({
          studentAddress: address,
          universityName: request.universityName,
          courseName: request.courseName,
          admissionId: request.admissionId,
          ipfsHash: request.ipfsHash,
          isVerified: request.isVerified,
          exists: request.exists
        });
        
        if (!request.isVerified) {
          setMessage('Found pending admission request for this student.');
        } else {
          setMessage('This admission request has already been verified.');
        }
      } else {
        setMessage('No admission request found for this student address.');
      }
      
    } catch (error) {
      console.error("Error fetching admission request:", error);
      
      // Clear timeout on error
      if (timeoutId) {
        clearTimeout(timeoutId);
        setTimeoutId(null);
      }
      
      if (error.message.includes('revert')) {
        setMessage("No admission request found for this address.");
      } else if (error.message.includes('network')) {
        setMessage("Network error. Please check your connection and try again.");
      } else {
        setMessage(`Error: ${error.reason || error.message || "Unknown error"}`);
      }
    }
    setLoading(false);
  };

  // Function to verify an admission request
  const verifyRequest = async (address) => {
    if (!contract) return;
    
    setLoading(true);
    try {
      const transaction = await contract.verifyAdmissionRequest(address);
      await transaction.wait();
      
      setMessage("Admission verified successfully!");
      // Refresh the request after verification
      fetchAdmissionRequest(address);
      
    } catch (error) {
      console.error("Error verifying admission:", error);
      setMessage(`Error: ${error.reason || error.message || "Unknown error"}`);
      setLoading(false);
    }
  };

  const viewDocument = (ipfsHash) => {
    if (ipfsHash && ipfsHash !== '') {
      window.open(`https://ipfs.io/ipfs/${ipfsHash}`, '_blank');
    } else {
      alert('No document hash available for this request.');
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (!studentAddress) {
      setMessage("Please enter a student address.");
      return;
    }
    
    // Validate Ethereum address format
    if (!/^0x[a-fA-F0-9]{40}$/.test(studentAddress)) {
      setMessage("Invalid Ethereum address format. Please enter a valid address starting with 0x.");
      return;
    }
    
    fetchAdmissionRequest(studentAddress);
  };

  // Clean up timeouts on component unmount
  useEffect(() => {
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [timeoutId]);

  if (!isAuthorized) {
    return (
      <div className="alert alert-warning">
        <h5>⚠️ Authorization Required</h5>
        <p>Only authorized university staff can verify admission requests.</p>
      </div>
    );
  }

  return (
    <div className="card p-4 shadow-sm">
      <h4>🏫 University Verification Portal</h4>
      <p>Verify student admission requests by entering the student's wallet address.</p>
      
      <form onSubmit={handleSearch} className="row g-3 mb-3">
        <div className="col-md-8">
          <input
            type="text"
            className="form-control"
            value={studentAddress}
            onChange={(e) => setStudentAddress(e.target.value)}
            placeholder="Enter student wallet address (0x...)"
            disabled={loading}
          />
          <small className="text-muted">
            Try the student address: 0xF6b90589c42FF5Bf7a61F67174DE09C45FC32338
          </small>
        </div>
        <div className="col-md-4">
          <button 
            type="submit" 
            className="btn btn-primary w-100"
            disabled={loading}
          >
            {loading ? 'Searching...' : '🔍 Search Request'}
          </button>
        </div>
      </form>

      {message && (
        <div className={`alert ${message.includes('Error') || message.includes('No admission') ? 'alert-danger' : message.includes('verified') ? 'alert-success' : 'alert-info'}`}>
          {message}
        </div>
      )}

      {loading && (
        <div className="text-center py-4">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-2">Loading admission request...</p>
          <p className="text-muted small">This may take a few moments</p>
        </div>
      )}

      {searchedRequest && (
        <div className="card mb-3">
          <div className="card-header bg-light d-flex justify-content-between align-items-center">
            <div>
              <strong>Student: {searchedRequest.studentAddress.substring(0, 8)}...{searchedRequest.studentAddress.substring(38)}</strong>
              <span className={`badge ${searchedRequest.isVerified ? 'bg-success' : 'bg-warning'} ms-2`}>
                {searchedRequest.isVerified ? 'Verified' : 'Pending Verification'}
              </span>
            </div>
            <small className="text-muted">Admission ID: {searchedRequest.admissionId}</small>
          </div>
          
          <div className="card-body">
            <div className="row">
              <div className="col-md-6">
                <p><strong>University:</strong> {searchedRequest.universityName}</p>
                <p><strong>Course:</strong> {searchedRequest.courseName}</p>
                <p><strong>Admission ID:</strong> {searchedRequest.admissionId}</p>
              </div>
              <div className="col-md-6">
                <p><strong>Student Address:</strong> 
                  <br />
                  <small className="text-muted">{searchedRequest.studentAddress}</small>
                </p>
                <p><strong>Status:</strong> 
                  {searchedRequest.isVerified ? ' ✅ Verified' : ' ⏳ Pending'}
                </p>
              </div>
            </div>
            
            <div className="d-flex gap-2 mt-3">
              {!searchedRequest.isVerified && (
                <button 
                  className="btn btn-success btn-sm"
                  onClick={() => verifyRequest(searchedRequest.studentAddress)}
                  disabled={loading}
                >
                  ✅ Verify Admission
                </button>
              )}
              
              {searchedRequest.ipfsHash && searchedRequest.ipfsHash !== '' && (
                <button 
                  className="btn btn-outline-info btn-sm"
                  onClick={() => viewDocument(searchedRequest.ipfsHash)}
                >
                  📄 View Admission Letter
                </button>
              )}
              
              {!searchedRequest.isVerified && (
                <button className="btn btn-outline-danger btn-sm" disabled>
                  ❌ Reject (Coming Soon)
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {!searchedRequest && !loading && !message && (
        <div className="text-center py-4">
          <div className="alert alert-info">
            <h5>📭 Search for Admission Requests</h5>
            <p>Enter a student's wallet address to view and verify their admission request.</p>
            <p className="text-muted">
              Students can submit requests through their dashboard.
            </p>
            <div className="mt-3">
              <h6>Example Student Address:</h6>
              <code className="bg-light p-2 rounded">
                0xF6b90589c42FF5Bf7a61F67174DE09C45FC32338
              </code>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UniversityVerification;