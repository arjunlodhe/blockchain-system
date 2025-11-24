import React, { useState } from 'react';

const AdmissionRequest = ({ contract, account }) => {
  const [formData, setFormData] = useState({
    universityName: '',
    courseName: '',
    admissionId: '',
    ipfsHash: ''
  });
  const [loading, setLoading] = useState(false);
  const [txHash, setTxHash] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError('');
    setSuccess('');
  };

  const createRequest = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!contract) {
      setError("Contract not connected.");
      return;
    }

    // Validate required fields
    if (!formData.universityName || !formData.courseName || !formData.admissionId) {
      setError("Please fill in all required fields.");
      return;
    }

    setLoading(true);
    
    try {
      // UPDATED FUNCTION CALL - matches the optimized contract
      // Removed academicYear parameter
      const transaction = await contract.createAdmissionRequest(
        formData.universityName,
        formData.courseName,
        formData.admissionId,
        formData.ipfsHash
      );

      setTxHash(transaction.hash);
      await transaction.wait();
      
      setSuccess("Admission request submitted successfully! Waiting for university verification.");
      
      // Reset form
      setFormData({
        universityName: '',
        courseName: '',
        admissionId: '',
        ipfsHash: ''
      });

    } catch (error) {
      console.error("Error creating admission request:", error);
      setError(`Failed: ${error.reason || error.message || "Unknown error"}`);
    }
    setLoading(false);
  };

  return (
    <div className="card p-4 shadow-sm mb-4">
      <h4>📨 Request Admission Verification</h4>
      <p>Submit your admission letter for university verification on blockchain.</p>
      
      {error && (
        <div className="alert alert-danger">
          <strong>Error:</strong> {error}
        </div>
      )}
      
      {success && (
        <div className="alert alert-success">
          <strong>Success!</strong> {success}
        </div>
      )}

      <form onSubmit={createRequest}>
        <div className="row">
          <div className="col-md-6 mb-3">
            <label className="form-label">University Name *</label>
            <input
              type="text"
              className="form-control"
              value={formData.universityName}
              onChange={(e) => handleInputChange('universityName', e.target.value)}
              placeholder="Stanford University, IIT Bombay, etc."
              required
            />
          </div>
          
          <div className="col-md-6 mb-3">
            <label className="form-label">Course Name *</label>
            <input
              type="text"
              className="form-control"
              value={formData.courseName}
              onChange={(e) => handleInputChange('courseName', e.target.value)}
              placeholder="B.Tech Computer Science, MBA, etc."
              required
            />
          </div>
        </div>

        <div className="row">
          <div className="col-md-6 mb-3">
            <label className="form-label">Admission ID *</label>
            <input
              type="text"
              className="form-control"
              value={formData.admissionId}
              onChange={(e) => handleInputChange('admissionId', e.target.value)}
              placeholder="ADM2024XYZ123"
              required
            />
          </div>
        </div>

        <div className="mb-3">
          <label className="form-label">IPFS Hash of Admission Letter</label>
          <input
            type="text"
            className="form-control"
            value={formData.ipfsHash}
            onChange={(e) => handleInputChange('ipfsHash', e.target.value)}
            placeholder="QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco"
          />
          <small className="text-muted">
            Upload your admission letter to IPFS and paste the hash here (optional for demo)
          </small>
        </div>

        <button 
          type="submit" 
          className="btn btn-primary" 
          disabled={loading}
        >
          {loading ? (
            <>
              <span className="spinner-border spinner-border-sm me-2"></span>
              Submitting...
            </>
          ) : (
            'Submit for Verification'
          )}
        </button>

        {txHash && (
          <div className="mt-3">
            <small>Transaction Hash: {txHash}</small>
          </div>
        )}
      </form>
    </div>
  );
};

export default AdmissionRequest;