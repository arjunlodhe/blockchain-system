import React, { useState } from 'react';
import { ethers } from 'ethers';

const StudentProfileCreator = ({ contract, account, onProfileCreated }) => {
  const [formData, setFormData] = useState({
    studentAddress: '',
    name: '',
    dateOfBirth: '',
    identificationNumber: '',
    gender: '',
    nationality: '',
    contactEmail: '',
    contactPhone: '',
    permanentAddress: ''
  });

  const [loading, setLoading] = useState(false);
  const [txHash, setTxHash] = useState('');
  const [error, setError] = useState('');
  const [profileStatus, setProfileStatus] = useState('');

  const isValidEthereumAddress = (address) => {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  };

  const isValidEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const checkProfileExists = async (address) => {
    try {
      const profile = await contract.studentProfiles(address);
      return profile.exists;
    } catch (error) {
      console.error("Error checking profile existence:", error);
      return false;
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError('');
    setProfileStatus('');
  };

  const convertDateToUnix = (dateString) => {
    if (!dateString) throw new Error("Date cannot be empty");
    const date = new Date(dateString);
    const timestamp = Math.floor(date.getTime() / 1000);
    if (isNaN(timestamp)) throw new Error("Invalid date format");
    return timestamp;
  };

  const checkProfile = async () => {
    if (!contract || !formData.studentAddress) return;
    
    setError('');
    setProfileStatus('');
    
    if (!isValidEthereumAddress(formData.studentAddress)) {
      setError("Invalid Ethereum address. Must start with '0x' and be 42 characters long.");
      return;
    }

    try {
      const exists = await checkProfileExists(formData.studentAddress);
      if (exists) {
        setProfileStatus('ℹ️ A profile already exists for this student address.');
      } else {
        setProfileStatus('✅ No profile found for this address. You can create one.');
      }
    } catch (error) {
      console.error("Error checking profile:", error);
      setError("Error checking profile existence. Please try again.");
    }
  };

  const createProfile = async (e) => {
    e.preventDefault();
    setError('');
    setProfileStatus('');
    
    if (!contract) {
      setError("Contract not connected.");
      return;
    }

    // Validate all required fields
    if (!isValidEthereumAddress(formData.studentAddress)) {
      setError("Invalid Ethereum address. Must start with '0x' and be 42 characters long.");
      return;
    }

    if (!isValidEmail(formData.contactEmail)) {
      setError("Please enter a valid email address.");
      return;
    }

    if (!formData.name || !formData.dateOfBirth || !formData.identificationNumber) {
      setError("Please fill in all required fields.");
      return;
    }

    // Check if profile already exists
    const exists = await checkProfileExists(formData.studentAddress);
    if (exists) {
      setError("Student profile already exists. Cannot create duplicate.");
      return;
    }

    setLoading(true);
    
    try {
      const dobUnix = convertDateToUnix(formData.dateOfBirth);

      const transaction = await contract.createStudentProfile(
        formData.studentAddress,
        formData.name,
        dobUnix,
        formData.identificationNumber,
        formData.gender,
        formData.nationality,
        formData.contactEmail,
        formData.contactPhone,
        formData.permanentAddress
      );

      setTxHash(transaction.hash);
      await transaction.wait();
      
      setProfileStatus("✅ Student profile created successfully!");
      
      // Reset form
      setFormData({
        studentAddress: '',
        name: '',
        dateOfBirth: '',
        identificationNumber: '',
        gender: '',
        nationality: '',
        contactEmail: '',
        contactPhone: '',
        permanentAddress: ''
      });
      
      if (onProfileCreated) onProfileCreated();
      
    } catch (error) {
      console.error("Error creating profile:", error);
      setError(`Failed: ${error.reason || error.message || "Unknown error"}`);
    }
    setLoading(false);
  };

  return (
    <div className="card p-3 shadow-sm mb-4">
      <h4>📝 Create Detailed Student Profile</h4>
      <p>Create a comprehensive student profile with personal and contact information.</p>
      
      {error && (
        <div className="alert alert-danger">
          <strong>Error:</strong> {error}
        </div>
      )}
      
      {profileStatus && (
        <div className="alert alert-info">
          {profileStatus}
        </div>
      )}
      
      <form onSubmit={createProfile}>
        {/* Personal Information Section */}
        <div className="row mb-4">
          <div className="col-12">
            <h5>👤 Personal Information</h5>
            <hr />
          </div>
          
          <div className="col-md-8 mb-3">
            <label className="form-label">Student's Wallet Address *</label>
            <input
              type="text"
              className="form-control"
              value={formData.studentAddress}
              onChange={(e) => handleInputChange('studentAddress', e.target.value)}
              placeholder="0x..."
              required
              pattern="^0x[a-fA-F0-9]{40}$"
            />
          </div>
          <div className="col-md-4 mb-3">
            <label className="form-label">&nbsp;</label>
            <button 
              type="button" 
              className="btn btn-outline-secondary w-100"
              onClick={checkProfile}
              disabled={!formData.studentAddress || loading}
            >
              Check Profile
            </button>
          </div>

          <div className="col-md-6 mb-3">
            <label className="form-label">Full Name *</label>
            <input
              type="text"
              className="form-control"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="John Doe"
              required
            />
          </div>

          <div className="col-md-6 mb-3">
            <label className="form-label">Date of Birth *</label>
            <input
              type="date"
              className="form-control"
              value={formData.dateOfBirth}
              onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
              required
            />
          </div>

          <div className="col-md-4 mb-3">
            <label className="form-label">Gender</label>
            <select
              className="form-select"
              value={formData.gender}
              onChange={(e) => handleInputChange('gender', e.target.value)}
            >
              <option value="">Select Gender</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
              <option value="Prefer not to say">Prefer not to say</option>
            </select>
          </div>

          <div className="col-md-4 mb-3">
            <label className="form-label">Nationality</label>
            <input
              type="text"
              className="form-control"
              value={formData.nationality}
              onChange={(e) => handleInputChange('nationality', e.target.value)}
              placeholder="Indian, American, etc."
            />
          </div>

          <div className="col-md-4 mb-3">
            <label className="form-label">ID Number *</label>
            <input
              type="text"
              className="form-control"
              value={formData.identificationNumber}
              onChange={(e) => handleInputChange('identificationNumber', e.target.value)}
              placeholder="Aadhaar, SSN, Passport Number"
              required
            />
          </div>
        </div>

        {/* Contact Information Section */}
        <div className="row mb-4">
          <div className="col-12">
            <h5>📞 Contact Information</h5>
            <hr />
          </div>

          <div className="col-md-6 mb-3">
            <label className="form-label">Email Address *</label>
            <input
              type="email"
              className="form-control"
              value={formData.contactEmail}
              onChange={(e) => handleInputChange('contactEmail', e.target.value)}
              placeholder="student@example.com"
              required
            />
          </div>

          <div className="col-md-6 mb-3">
            <label className="form-label">Phone Number</label>
            <input
              type="tel"
              className="form-control"
              value={formData.contactPhone}
              onChange={(e) => handleInputChange('contactPhone', e.target.value)}
              placeholder="+91 1234567890"
            />
          </div>

          <div className="col-12 mb-3">
            <label className="form-label">Permanent Address</label>
            <textarea
              className="form-control"
              rows="3"
              value={formData.permanentAddress}
              onChange={(e) => handleInputChange('permanentAddress', e.target.value)}
              placeholder="Full permanent address..."
            />
          </div>
        </div>

        <button 
          type="submit" 
          className="btn btn-primary" 
          disabled={loading || profileStatus?.includes('already exists')}
        >
          {loading ? 'Creating Profile...' : 'Create Student Profile'}
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

export default StudentProfileCreator;