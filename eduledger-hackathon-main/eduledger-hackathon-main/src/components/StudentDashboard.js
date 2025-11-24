import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { BANK_ADDRESS } from '../config';
import EligibilityChecker from './EligibilityChecker';

const StudentDashboard = ({ contract, account }) => {
  const [studentProfile, setStudentProfile] = useState(null);
  const [credentials, setCredentials] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [admissionRequest, setAdmissionRequest] = useState(null);
  const [loanRequest, setLoanRequest] = useState(null);
  const [profileExists, setProfileExists] = useState(false);
  const [hasAdmissionRequest, setHasAdmissionRequest] = useState(false);
  const [hasLoanRequest, setHasLoanRequest] = useState(false);
  const [credentialCount, setCredentialCount] = useState(0);
  const [debugInfo, setDebugInfo] = useState('');

  const checkProfileExists = async () => {
    if (!contract || !account) return false;
    
    try {
      const profile = await contract.studentProfiles(account);
      return profile.exists;
    } catch (error) {
      console.error("Error checking profile existence:", error);
      return false;
    }
  };

  const checkAdmissionRequestExists = async () => {
    if (!contract || !account) return false;
    
    try {
      const request = await contract.admissionRequests(account);
      return request.exists;
    } catch (error) {
      console.error("Error checking admission request:", error);
      return false;
    }
  };

  const checkLoanRequestExists = async () => {
    if (!contract || !account) return false;
    
    try {
      const request = await contract.loanRequests(account);
      return request.exists;
    } catch (error) {
      console.error("Error checking loan request:", error);
      return false;
    }
  };

  const getProfileData = async () => {
    if (!contract || !account) return null;
    
    try {
      const profile = await contract.studentProfiles(account);
      if (profile.exists) {
        return {
          name: profile.name,
          dateOfBirth: new Date(Number(profile.dateOfBirth) * 1000).toLocaleDateString(),
          identificationNumber: profile.identificationNumber,
          gender: profile.gender,
          nationality: profile.nationality,
          contactEmail: profile.contactEmail,
          contactPhone: profile.contactPhone,
          permanentAddress: profile.permanentAddress,
          walletAddress: account
        };
      }
      return null;
    } catch (error) {
      console.error("Error fetching profile:", error);
      return null;
    }
  };

  const debugCredentialData = async () => {
    let debugOutput = "🔍 Credential Data Debug:\n\n";
    
    try {
      // Test getMyCredentialCount
      try {
        const count = await contract.getMyCredentialCount();
        debugOutput += `✅ getMyCredentialCount: ${count.toString()}\n`;
      } catch (error) {
        debugOutput += `❌ getMyCredentialCount failed: ${error.message}\n`;
      }

      // Test getMyCredential for first credential
      try {
        const cred = await contract.getMyCredential(0);
        debugOutput += `✅ getMyCredential(0) result:\n`;
        debugOutput += `  - Type: ${typeof cred}\n`;
        if (Array.isArray(cred)) {
          debugOutput += `  - Array length: ${cred.length}\n`;
          cred.forEach((item, index) => {
            debugOutput += `  - [${index}]: ${item} (${typeof item})\n`;
          });
        } else if (cred && typeof cred === 'object') {
          debugOutput += `  - Object keys: ${Object.keys(cred).join(', ')}\n`;
          Object.entries(cred).forEach(([key, value]) => {
            debugOutput += `  - ${key}: ${value} (${typeof value})\n`;
          });
        }
      } catch (error) {
        debugOutput += `❌ getMyCredential(0) failed: ${error.message}\n`;
      }

    } catch (error) {
      debugOutput += `❌ General debug error: ${error.message}\n`;
    }
    
    console.log(debugOutput);
    setDebugInfo(debugOutput);
    return debugOutput;
  };

  const fetchCredentials = async () => {
    if (!contract || !account) return [];
    
    const creds = [];
    let count = 0;
    
    try {
      // Method 1: Try using getMyCredentialCount and getMyCredential
      try {
        const credentialCount = await contract.getMyCredentialCount();
        count = Number(credentialCount);
        console.log(`Found ${count} credentials using getMyCredentialCount`);
        
        for (let i = 0; i < count; i++) {
          try {
            const cred = await contract.getMyCredential(i);
            console.log(`Credential ${i}:`, cred);
            
            // Handle array structure: [issuer, institutionName, credentialType, startDate, endDate, gradeOrPercentage, ipfsHash, issuedAt]
            if (Array.isArray(cred) && cred.length >= 8) {
              creds.push({
                issuer: cred[0],
                institutionName: cred[1],
                credentialType: cred[2],
                startDate: cred[3] ? new Date(Number(cred[3]) * 1000).toLocaleDateString() : 'N/A',
                endDate: cred[4] ? new Date(Number(cred[4]) * 1000).toLocaleDateString() : 'N/A',
                gradeOrPercentage: cred[5],
                ipfsHash: cred[6],
                issuedAt: cred[7] ? new Date(Number(cred[7]) * 1000).toLocaleDateString() : 'N/A'
              });
            } else if (cred && typeof cred === 'object') {
              // Fallback for object structure
              creds.push({
                issuer: cred.issuer || cred[0],
                institutionName: cred.institutionName || cred[1],
                credentialType: cred.credentialType || cred[2],
                startDate: cred.startDate ? new Date(Number(cred.startDate) * 1000).toLocaleDateString() : 'N/A',
                endDate: cred.endDate ? new Date(Number(cred.endDate) * 1000).toLocaleDateString() : 'N/A',
                gradeOrPercentage: cred.gradeOrPercentage || cred[5],
                ipfsHash: cred.ipfsHash || cred[6],
                issuedAt: cred.issuedAt ? new Date(Number(cred.issuedAt) * 1000).toLocaleDateString() : 'N/A'
              });
            }
          } catch (error) {
            console.error(`Error fetching credential ${i}:`, error);
          }
        }
      } catch (error) {
        console.log("Method 1 failed, trying alternative:", error);
        
        // Method 2: Try sequential access with getCredential
        for (let i = 0; i < 10; i++) {
          try {
            const cred = await contract.getCredential(account, i);
            console.log(`Credential ${i} (alt method):`, cred);
            
            if (cred && (Array.isArray(cred) ? cred[0] !== ethers.ZeroAddress : cred.issuer !== ethers.ZeroAddress)) {
              if (Array.isArray(cred) && cred.length >= 8) {
                creds.push({
                  issuer: cred[0],
                  institutionName: cred[1],
                  credentialType: cred[2],
                  startDate: cred[3] ? new Date(Number(cred[3]) * 1000).toLocaleDateString() : 'N/A',
                  endDate: cred[4] ? new Date(Number(cred[4]) * 1000).toLocaleDateString() : 'N/A',
                  gradeOrPercentage: cred[5],
                  ipfsHash: cred[6],
                  issuedAt: cred[7] ? new Date(Number(cred[7]) * 1000).toLocaleDateString() : 'N/A'
                });
                count++;
              } else if (cred && typeof cred === 'object') {
                creds.push({
                  issuer: cred.issuer || cred[0],
                  institutionName: cred.institutionName || cred[1],
                  credentialType: cred.credentialType || cred[2],
                  startDate: cred.startDate ? new Date(Number(cred.startDate) * 1000).toLocaleDateString() : 'N/A',
                  endDate: cred.endDate ? new Date(Number(cred.endDate) * 1000).toLocaleDateString() : 'N/A',
                  gradeOrPercentage: cred.gradeOrPercentage || cred[5],
                  ipfsHash: cred.ipfsHash || cred[6],
                  issuedAt: cred.issuedAt ? new Date(Number(cred.issuedAt) * 1000).toLocaleDateString() : 'N/A'
                });
                count++;
              }
            }
          } catch (error) {
            // No more credentials or invalid index
            break;
          }
        }
      }
    } catch (error) {
      console.error("Error fetching credentials:", error);
    }
    
    setCredentialCount(count);
    return creds;
  };

  const fetchStudentData = async () => {
    if (!contract || !account) return;
    
    setLoading(true);
    setError('');
    try {
      const profileExists = await checkProfileExists();
      setProfileExists(profileExists);

      if (!profileExists) {
        setError("Student profile does not exist. Please ask your university to create your profile first.");
        setLoading(false);
        return;
      }

      const profile = await getProfileData();
      
      if (profile) {
        setStudentProfile(profile);
      } else {
        setError("Error loading student profile. The profile exists but could not be loaded.");
        setLoading(false);
        return;
      }

      // Fetch credentials
      const creds = await fetchCredentials();
      setCredentials(creds);
      console.log("Fetched credentials:", creds);

      // Fetch admission request
      try {
        const admissionExists = await checkAdmissionRequestExists();
        setHasAdmissionRequest(admissionExists);
        
        if (admissionExists) {
          const request = await contract.admissionRequests(account);
          setAdmissionRequest({
            universityName: request.universityName,
            courseName: request.courseName,
            admissionId: request.admissionId,
            ipfsHash: request.ipfsHash,
            isVerified: request.isVerified,
            exists: request.exists
          });
        }
      } catch (admissionError) {
        console.error("Error fetching admission request:", admissionError);
      }

      // Fetch loan request
      try {
        const loanExists = await checkLoanRequestExists();
        setHasLoanRequest(loanExists);
        
        if (loanExists) {
          const request = await contract.loanRequests(account);
          setLoanRequest({
            loanAmount: ethers.formatEther(request.loanAmount),
            loanPurpose: request.loanPurpose,
            repaymentPeriod: request.repaymentPeriod.toString(),
            isApproved: request.isApproved,
            exists: request.exists,
            requestedAt: new Date(Number(request.requestedAt) * 1000).toLocaleDateString()
          });
        }
      } catch (loanError) {
        console.error("Error fetching loan request:", loanError);
      }

    } catch (error) {
      console.error("Error fetching student data:", error);
      setError("Error loading student data. Please try again.");
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchStudentData();
  }, [contract, account]);

  return (
    <div>
      <h2>🎓 Student Dashboard</h2>
      
      {loading && (
        <div className="text-center py-4">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p>Loading your educational profile...</p>
        </div>
      )}
      
      {error && (
        <div className="alert alert-warning">
          <strong>Error:</strong> {error}
          <br />
          <small>Account: {account}</small>
          <br />
          <button onClick={fetchStudentData} className="btn btn-sm btn-outline-primary mt-2">
            Try Again
          </button>
        </div>
      )}

      {/* Debug Button */}
      <button 
        onClick={debugCredentialData}
        className="btn btn-warning btn-sm mb-3"
      >
        🐛 Debug Credential Data
      </button>

      {debugInfo && (
        <div className="alert alert-info">
          <strong>Debug Info:</strong>
          <pre style={{whiteSpace: 'pre-wrap', fontSize: '12px'}}>{debugInfo}</pre>
        </div>
      )}

      {studentProfile && (
        <div className="card p-4 mb-4 shadow-sm">
          <h4 className="card-title">👤 Student Profile</h4>
          <div className="row">
            <div className="col-md-6">
              <p><strong>Name:</strong> {studentProfile.name}</p>
              <p><strong>Date of Birth:</strong> {studentProfile.dateOfBirth}</p>
              <p><strong>Gender:</strong> {studentProfile.gender || 'Not specified'}</p>
              <p><strong>Nationality:</strong> {studentProfile.nationality || 'Not specified'}</p>
            </div>
            <div className="col-md-6">
              <p><strong>ID Number:</strong> {studentProfile.identificationNumber}</p>
              <p><strong>Email:</strong> {studentProfile.contactEmail}</p>
              <p><strong>Phone:</strong> {studentProfile.contactPhone || 'Not specified'}</p>
              <p><strong>Wallet Address:</strong> <small className="text-muted">{studentProfile.walletAddress}</small></p>
            </div>
          </div>
          {studentProfile.permanentAddress && (
            <div className="row mt-3">
              <div className="col-12">
                <p><strong>Permanent Address:</strong></p>
                <p className="text-muted">{studentProfile.permanentAddress}</p>
              </div>
            </div>
          )}
        </div>
      )}

      {studentProfile && (
        <EligibilityChecker 
          contract={contract}
          account={account}
          studentAddress={account}
          isBank={false}
        />
      )}

      {hasAdmissionRequest && admissionRequest && (
        <div className="card p-4 mb-4 shadow-sm">
          <h5>🎓 Admission Verification Status</h5>
          <div className="row">
            <div className="col-md-6">
              <p><strong>University:</strong> {admissionRequest.universityName}</p>
              <p><strong>Course:</strong> {admissionRequest.courseName}</p>
              <p><strong>Admission ID:</strong> {admissionRequest.admissionId}</p>
            </div>
            <div className="col-md-6">
              <p><strong>Status:</strong> 
                {admissionRequest.isVerified ? (
                  <span className="badge bg-success ms-2">✅ Verified</span>
                ) : (
                  <span className="badge bg-warning ms-2">⏳ Pending Verification</span>
                )}
              </p>
              {admissionRequest.ipfsHash && admissionRequest.ipfsHash !== '' && (
                <p><strong>Document:</strong> 
                  <a href={`https://ipfs.io/ipfs/${admissionRequest.ipfsHash}`} target="_blank" rel="noopener noreferrer" className="ms-2">
                    📄 View Admission Letter
                  </a>
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {!hasAdmissionRequest && studentProfile && (
        <div className="alert alert-info mb-4">
          <h6>📝 No Admission Request Submitted</h6>
          <p>You haven't submitted any admission request yet.</p>
          <p className="text-muted">Use the admission request form below to submit your admission for verification.</p>
        </div>
      )}

      {hasLoanRequest && loanRequest && (
        <div className="card p-4 mb-4 shadow-sm">
          <h5>💰 Loan Request Status</h5>
          <div className="row">
            <div className="col-md-6">
              <p><strong>Amount:</strong> {loanRequest.loanAmount} ETH</p>
              <p><strong>Purpose:</strong> {loanRequest.loanPurpose}</p>
              <p><strong>Repayment Period:</strong> {loanRequest.repaymentPeriod} months</p>
            </div>
            <div className="col-md-6">
              <p><strong>Status:</strong> 
                {loanRequest.isApproved ? (
                  <span className="badge bg-success ms-2">✅ Approved</span>
                ) : (
                  <span className="badge bg-warning ms-2">⏳ Pending Approval</span>
                )}
              </p>
              <p><strong>Requested On:</strong> {loanRequest.requestedAt}</p>
              <p><strong>Bank Address:</strong> 
                <br />
                <small className="text-muted">{BANK_ADDRESS}</small>
              </p>
            </div>
          </div>
        </div>
      )}

      {!hasLoanRequest && studentProfile && (
        <div className="alert alert-info mb-4">
          <h6>💰 No Loan Request Submitted</h6>
          <p>You haven't submitted any loan request yet.</p>
          <p className="text-muted">Use the loan request form below to apply for an education loan.</p>
        </div>
      )}

      <button onClick={fetchStudentData} className="btn btn-primary mb-4" disabled={loading}>
        {loading ? 'Refreshing...' : '🔄 Refresh Data'}
      </button>

      {credentials.length > 0 && (
        <div className="credentials-section">
          <h4 className="mb-3">📜 Academic Credentials ({credentials.length})</h4>
          
          {credentials.map((cred, index) => (
            <div key={index} className="card mb-3 shadow-sm">
              <div className="card-header bg-light">
                <h5 className="card-title mb-0">{cred.credentialType || 'Unknown Credential Type'}</h5>
                <small className="text-muted">{cred.institutionName || 'Unknown Institution'}</small>
              </div>
              
              <div className="card-body">
                <div className="row">
                  {cred.gradeOrPercentage && (
                    <div className="col-md-6">
                      <h6>📊 Academic Performance</h6>
                      <div className="row">
                        <div className="col-6">
                          <strong>Grade:</strong><br />
                          <span className="text-success">{cred.gradeOrPercentage}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="col-md-6">
                    <h6>📚 Course Details</h6>
                    <p><strong>Institution:</strong> {cred.institutionName || 'Not specified'}</p>
                    <p><strong>Type:</strong> {cred.credentialType || 'Not specified'}</p>
                    <p><strong>Issued by:</strong> <small className="text-muted">{cred.issuer?.substring(0, 10)}...</small></p>
                  </div>
                </div>

                <hr />

                <div className="row">
                  <div className="col-md-4">
                    <strong>Start Date:</strong><br />
                    {cred.startDate || 'Not specified'}
                  </div>
                  <div className="col-md-4">
                    <strong>End Date:</strong><br />
                    {cred.endDate || 'Not specified'}
                  </div>
                  <div className="col-md-4">
                    <strong>Issued On:</strong><br />
                    {cred.issuedAt || 'Not specified'}
                  </div>
                </div>

                {cred.ipfsHash && cred.ipfsHash !== 'QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco' && (
                  <div className="mt-3">
                    <strong>Document:</strong>{' '}
                    <a 
                      href={`https://ipfs.io/ipfs/${cred.ipfsHash}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-decoration-none"
                    >
                      📄 View on IPFS
                    </a>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {credentials.length === 0 && !loading && studentProfile && (
        <div className="alert alert-info text-center">
          <h5>📭 No Credentials Found</h5>
          <p>You don't have any academic credentials yet.</p>
          <p className="text-muted">Your university will issue credentials to your wallet address.</p>
          <button onClick={fetchStudentData} className="btn btn-sm btn-outline-primary mt-2">
            Check Again
          </button>
        </div>
      )}

      {!studentProfile && !loading && !error && (
        <div className="alert alert-info text-center">
          <h5>📋 Profile Status</h5>
          <p>Checking your student profile...</p>
          <button onClick={fetchStudentData} className="btn btn-sm btn-outline-primary">
            Check Again
          </button>
        </div>
      )}
    </div>
  );
};

export default StudentDashboard;