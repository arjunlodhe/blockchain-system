import React, { useState } from 'react';

const CredentialIssuer = ({ contract, account }) => {
  const [formData, setFormData] = useState({
    studentAddress: '',
    institutionName: 'Sunshine Public School',
    credentialType: '',
    startDate: '',
    endDate: '',
    gradeOrPercentage: '',
    ipfsHash: 'QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco'
  });

  const [loading, setLoading] = useState(false);
  const [txHash, setTxHash] = useState('');
  const [error, setError] = useState('');

  // Validate Ethereum address format
  const isValidEthereumAddress = (address) => {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError('');
  };

  const convertDateToUnix = (dateString) => {
    if (!dateString) throw new Error("Date cannot be empty");
    const date = new Date(dateString);
    const timestamp = Math.floor(date.getTime() / 1000);
    if (isNaN(timestamp)) throw new Error("Invalid date format");
    return timestamp;
  };

  const issueCredential = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!contract) {
      setError("Contract not connected.");
      return;
    }

    // Validate Ethereum address
    if (!isValidEthereumAddress(formData.studentAddress)) {
      setError("Invalid Ethereum address. Must start with '0x' and be 42 characters long.");
      return;
    }

    // Validate required fields
    if (!formData.credentialType || !formData.startDate || !formData.endDate) {
      setError("Please fill in all required fields.");
      return;
    }

    setLoading(true);
    try {
      const startDateUnix = convertDateToUnix(formData.startDate);
      const endDateUnix = convertDateToUnix(formData.endDate);

      if (endDateUnix <= startDateUnix) {
        throw new Error("End date must be after start date");
      }

      // UPDATED FUNCTION CALL - matches the optimized contract
      const transaction = await contract.issueCredential(
        formData.studentAddress,
        formData.institutionName,
        formData.credentialType,
        startDateUnix,
        endDateUnix,
        formData.gradeOrPercentage,
        formData.ipfsHash
      );

      setTxHash(transaction.hash);
      await transaction.wait();
      
      alert("Credential issued successfully!");
      
      // Reset form fields (keep institution name and IPFS hash)
      setFormData(prev => ({
        ...prev,
        studentAddress: '',
        credentialType: '',
        startDate: '',
        endDate: '',
        gradeOrPercentage: ''
      }));
      setError('');

    } catch (error) {
      console.error("Error issuing credential:", error);
      setError(`Failed: ${error.reason || error.message || "Unknown error"}`);
    }
    setLoading(false);
  };

  return (
    <div className="card p-3 shadow-sm">
      <h4>🎓 Issue Credential</h4>
      <p>Issue an academic credential to a student.</p>
      
      {error && (
        <div className="alert alert-danger">
          <strong>Error:</strong> {error}
        </div>
      )}
      
      <form onSubmit={issueCredential}>
        {/* Student Information */}
        <div className="row mb-4">
          <div className="col-12">
            <h5>👤 Student Information</h5>
            <hr />
          </div>
          
          <div className="col-md-12 mb-3">
            <label className="form-label">Student's Wallet Address *</label>
            <input
              type="text"
              className="form-control"
              value={formData.studentAddress}
              onChange={(e) => handleInputChange('studentAddress', e.target.value)}
              placeholder="0x..."
              required
              pattern="^0x[a-fA-F0-9]{40}$"
              title="Must be a valid Ethereum address starting with 0x"
            />
            <small className="text-muted">Must be an existing student profile</small>
          </div>
        </div>

        {/* Credential Basic Information */}
        <div className="row mb-4">
          <div className="col-12">
            <h5>📝 Credential Details</h5>
            <hr />
          </div>

          <div className="col-md-6 mb-3">
            <label className="form-label">Institution Name *</label>
            <input
              type="text"
              className="form-control"
              value={formData.institutionName}
              onChange={(e) => handleInputChange('institutionName', e.target.value)}
              required
            />
          </div>

          <div className="col-md-6 mb-3">
            <label className="form-label">Credential Type *</label>
            <input
              type="text"
              className="form-control"
              value={formData.credentialType}
              onChange={(e) => handleInputChange('credentialType', e.target.value)}
              placeholder="High School Diploma, Bachelor's Degree, Certificate"
              required
            />
          </div>

          <div className="col-md-6 mb-3">
            <label className="form-label">Start Date *</label>
            <input
              type="date"
              className="form-control"
              value={formData.startDate}
              onChange={(e) => handleInputChange('startDate', e.target.value)}
              required
            />
          </div>

          <div className="col-md-6 mb-3">
            <label className="form-label">End Date *</label>
            <input
              type="date"
              className="form-control"
              value={formData.endDate}
              onChange={(e) => handleInputChange('endDate', e.target.value)}
              required
            />
          </div>
        </div>

        {/* Academic Performance */}
        <div className="row mb-4">
          <div className="col-12">
            <h5>📊 Academic Performance</h5>
            <hr />
          </div>

          <div className="col-md-6 mb-3">
            <label className="form-label">Grade/Percentage</label>
            <input
              type="text"
              className="form-control"
              value={formData.gradeOrPercentage}
              onChange={(e) => handleInputChange('gradeOrPercentage', e.target.value)}
              placeholder="A+, 95%, 3.8 GPA"
            />
          </div>
        </div>

        {/* Document Reference */}
        <div className="row mb-4">
          <div className="col-12">
            <h5>📎 Document Reference</h5>
            <hr />
          </div>

          <div className="col-12 mb-3">
            <label className="form-label">IPFS Document Hash</label>
            <input
              type="text"
              className="form-control"
              value={formData.ipfsHash}
              onChange={(e) => handleInputChange('ipfsHash', e.target.value)}
              required
            />
            <small className="text-muted">
              Hash of the document stored on IPFS (use a dummy hash for testing)
            </small>
          </div>
        </div>

        <button 
          type="submit" 
          className="btn btn-success" 
          disabled={loading}
        >
          {loading ? (
            <>
              <span className="spinner-border spinner-border-sm me-2" role="status"></span>
              Issuing Credential...
            </>
          ) : (
            'Issue Credential'
          )}
        </button>

        {txHash && (
          <div className="mt-3">
            <div className="alert alert-info">
              <strong>✅ Transaction Successful!</strong>
              <br />
              <small>Transaction Hash: {txHash}</small>
            </div>
          </div>
        )}
      </form>
    </div>
  );
};

export default CredentialIssuer;