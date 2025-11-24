import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { BANK_ADDRESS, UNIVERSITY_ADDRESS, STUDENT_ADDRESS } from '../config';
import EligibilityChecker from './EligibilityChecker';

const BankDashboard = ({ contract, account }) => {
  const [studentAddress, setStudentAddress] = useState(STUDENT_ADDRESS);
  const [studentProfile, setStudentProfile] = useState(null);
  const [credentials, setCredentials] = useState([]);
  const [admissionRequest, setAdmissionRequest] = useState(null);
  const [loanRequest, setLoanRequest] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [hasCredentials, setHasCredentials] = useState(false);
  const [profileExists, setProfileExists] = useState(false);
  const [isBankConnected, setIsBankConnected] = useState(false);
  const [actualConnectedAddress, setActualConnectedAddress] = useState('');
  const [credentialCount, setCredentialCount] = useState(0);
  const [isBankAuthorized, setIsBankAuthorized] = useState(false);
  const [contractOwner, setContractOwner] = useState('');
  const [eligibility, setEligibility] = useState(null);
  const [debugInfo, setDebugInfo] = useState('');

  useEffect(() => {
    const checkConnection = async () => {
      if (window.ethereum) {
        try {
          const accounts = await window.ethereum.request({ method: 'eth_accounts' });
          const currentAccount = accounts[0] || '';
          setActualConnectedAddress(currentAccount);
          
          const isBank = currentAccount.toLowerCase() === BANK_ADDRESS.toLowerCase();
          setIsBankConnected(isBank);
          
          if (!isBank && currentAccount) {
            setError(`🚫 BANK ACCESS DENIED: 
            Connected: ${currentAccount}
            Required: ${BANK_ADDRESS}
            Please switch to the bank wallet in MetaMask`);
          } else if (isBank) {
            setError('');
          }
        } catch (error) {
          console.error("Error checking connection:", error);
        }
      }
    };

    checkConnection();

    if (window.ethereum) {
      const handleAccountsChanged = (accounts) => {
        window.location.reload();
      };

      window.ethereum.on('accountsChanged', handleAccountsChanged);
      
      return () => {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
      };
    }
  }, [account, BANK_ADDRESS]);

  const checkAuthorization = async () => {
    if (!contract) return false;
    
    try {
      const isAuthorized = await contract.authorizedBanks(account);
      setIsBankAuthorized(isAuthorized);
      
      const owner = await contract.owner();
      setContractOwner(owner);
      
      return isAuthorized;
    } catch (error) {
      console.error("Error checking authorization:", error);
      setIsBankAuthorized(false);
      return false;
    }
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

  // Debug function to check available functions
  const debugCredentialFunctions = async () => {
    let debugOutput = "🔍 Contract Function Debug:\n\n";
    
    try {
      debugOutput += `Student Address: ${studentAddress}\n`;
      debugOutput += `Contract Address: ${contract.target}\n\n`;
      
      // Test available functions from the contract ABI
      debugOutput += `Testing available functions:\n`;
      
      // Test studentProfiles
      try {
        const profile = await contract.studentProfiles(studentAddress);
        debugOutput += `✅ studentProfiles: ${profile.exists ? 'Exists' : 'Not exists'}\n`;
      } catch (error) {
        debugOutput += `❌ studentProfiles failed: ${error.message}\n`;
      }
      
      // Test studentCredentials mapping directly
      try {
        // Try to access the first credential using the auto-generated getter
        const cred = await contract.studentCredentials(studentAddress, 0);
        debugOutput += `✅ studentCredentials(0): ${cred.issuer !== ethers.ZeroAddress ? 'Exists' : 'Not exists'}\n`;
        if (cred.issuer !== ethers.ZeroAddress) {
          debugOutput += `  Issuer: ${cred.issuer}\n`;
          debugOutput += `  Institution: ${cred.institutionName}\n`;
          debugOutput += `  Type: ${cred.credentialType}\n`;
        }
      } catch (error) {
        debugOutput += `❌ studentCredentials(0) failed: ${error.message}\n`;
      }

    } catch (error) {
      debugOutput += `❌ General debug error: ${error.message}\n`;
    }
    
    console.log(debugOutput);
    setDebugInfo(debugOutput);
    return debugOutput;
  };

  const fetchCredentials = async () => {
    if (!contract || !studentAddress) return [];
    
    const creds = [];
    let count = 0;
    
    try {
      // Try to access credentials using the studentCredentials mapping
      for (let i = 0; i < 10; i++) {
        try {
          const cred = await contract.studentCredentials(studentAddress, i);
          
          // Check if the credential exists (issuer is not zero address)
          if (cred.issuer !== ethers.ZeroAddress) {
            creds.push({
              issuer: cred.issuer,
              institutionName: cred.institutionName,
              credentialType: cred.credentialType,
              startDate: cred.startDate ? new Date(Number(cred.startDate) * 1000).toLocaleDateString() : 'N/A',
              endDate: cred.endDate ? new Date(Number(cred.endDate) * 1000).toLocaleDateString() : 'N/A',
              gradeOrPercentage: cred.gradeOrPercentage,
              ipfsHash: cred.ipfsHash,
              issuedAt: cred.issuedAt ? new Date(Number(cred.issuedAt) * 1000).toLocaleDateString() : 'N/A'
            });
            count++;
          }
        } catch (error) {
          // No more credentials or invalid index
          break;
        }
      }
    } catch (error) {
      console.error("Error fetching credentials:", error);
    }
    
    setCredentialCount(count);
    return creds;
  };

  const fetchStudentData = async () => {
    if (!contract || !studentAddress || !isBankConnected) {
      setError("Please connect with the bank wallet first.");
      return;
    }
    
    setLoading(true);
    setError('');
    setCredentials([]);
    setStudentProfile(null);
    setAdmissionRequest(null);
    setLoanRequest(null);
    setEligibility(null);
    setDebugInfo('');
    
    try {
      const isAuthorized = await checkAuthorization();
      if (!isAuthorized) {
        setError(`Bank wallet is not authorized to view credentials. 
        Please ask the contract owner to authorize this bank address: ${BANK_ADDRESS}
        Contract Owner: ${contractOwner}`);
        setLoading(false);
        return;
      }

      const exists = await checkProfileExists(studentAddress);
      setProfileExists(exists);

      if (!exists) {
        setError(`Student profile does not exist for address: ${studentAddress}
        Please ask the university to create a student profile first.
        University Address: ${UNIVERSITY_ADDRESS}`);
        setLoading(false);
        return;
      }

      // Fetch student profile
      const profile = await contract.studentProfiles(studentAddress);
      setStudentProfile({
        name: profile.name,
        dateOfBirth: new Date(Number(profile.dateOfBirth) * 1000).toLocaleDateString(),
        identificationNumber: profile.identificationNumber,
        gender: profile.gender,
        nationality: profile.nationality,
        contactEmail: profile.contactEmail,
        contactPhone: profile.contactPhone,
        permanentAddress: profile.permanentAddress,
        walletAddress: studentAddress
      });

      // Fetch credentials
      const creds = await fetchCredentials();
      setCredentials(creds);
      setHasCredentials(creds.length > 0);

      // Fetch admission request
      try {
        const admissionExists = await checkAdmissionRequestExists(studentAddress);
        if (admissionExists) {
          const request = await contract.admissionRequests(studentAddress);
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
        console.log("Admission request check failed:", admissionError);
      }

      // Fetch loan request
      try {
        const loanExists = await checkLoanRequestExists(studentAddress);
        if (loanExists) {
          const request = await contract.loanRequests(studentAddress);
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
        console.log("Loan request check failed:", loanError);
      }

      // Fetch eligibility (read-only, don't trigger transaction to avoid nonce issues)
      try {
        const eligibilityData = await contract.getLoanEligibility(studentAddress);
        setEligibility(eligibilityData);
      } catch (eligibilityError) {
        console.log("Eligibility check failed (read-only):", eligibilityError);
      }

    } catch (error) {
      console.error("Error fetching student data:", error);
      setError(`Error loading student data: ${error.message}`);
    }
    setLoading(false);
  };

  const checkAdmissionRequestExists = async (address) => {
    if (!contract || !address) return false;
    
    try {
      const request = await contract.admissionRequests(address);
      return request.exists;
    } catch (error) {
      console.error("Error checking admission request:", error);
      return false;
    }
  };

  const checkLoanRequestExists = async (address) => {
    if (!contract || !address) return false;
    
    try {
      const request = await contract.loanRequests(address);
      return request.exists;
    } catch (error) {
      console.error("Error checking loan request:", error);
      return false;
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (!isBankConnected) {
      setError("Please connect with the bank wallet first.");
      return;
    }
    fetchStudentData();
  };

  const approveLoan = async () => {
    if (!contract || !studentAddress || !isBankConnected) return;
    
    setLoading(true);
    try {
      const transaction = await contract.approveLoanRequest(studentAddress);
      await transaction.wait();
      alert("Loan approved successfully!");
      fetchStudentData();
    } catch (error) {
      console.error("Error approving loan:", error);
      setError(`Failed to approve loan: ${error.reason || error.message}`);
    }
    setLoading(false);
  };

  const resetMetaMask = async () => {
    if (window.ethereum && window.ethereum.request) {
      try {
        await window.ethereum.request({
          method: 'wallet_requestPermissions',
          params: [{ eth_accounts: {} }]
        });
        window.location.reload();
      } catch (error) {
        console.error("Error resetting MetaMask:", error);
      }
    }
  };

  useEffect(() => {
    if (contract && isBankConnected) {
      checkAuthorization();
    }
  }, [contract, isBankConnected]);

  return (
    <div className="card p-4 shadow-sm">
      <h4>🏦 Bank Portal - Student Verification</h4>
      <p className="text-muted">Enter student wallet address to view their profile and verification status for loan assessment.</p>
      
      {!isBankConnected && actualConnectedAddress && (
        <div className="alert alert-danger mb-3">
          <h6>🚫 Bank Access Restricted</h6>
          <p><strong>Connected:</strong> {actualConnectedAddress}</p>
          <p><strong>Required Bank:</strong> {BANK_ADDRESS}</p>
          <button 
            className="btn btn-sm btn-outline-primary mt-2"
            onClick={() => window.location.reload()}
          >
            ↻ Refresh Page After Switching
          </button>
        </div>
      )}

      {isBankConnected && (
        <div className={`alert ${isBankAuthorized ? 'alert-success' : 'alert-danger'} mb-3`}>
          <h6>{isBankAuthorized ? '✅ Bank Wallet Connected' : '❌ Bank Not Authorized'}</h6>
          <p>Connected as: <strong>{actualConnectedAddress}</strong></p>
          <p>Authorization Status: {isBankAuthorized ? '✅ Authorized' : '❌ Not Authorized'}</p>
          {!isBankAuthorized && (
            <div>
              <p className="text-muted">
                To authorize this bank, the contract owner needs to call:
              </p>
              <code>addBank("{BANK_ADDRESS}")</code>
              <br />
              <small>Contract Owner: {contractOwner || 'Loading...'}</small>
            </div>
          )}
        </div>
      )}

      {isBankConnected && (
        <>
          <form onSubmit={handleSearch} className="row g-3 mb-4">
            <div className="col-md-8">
              <input
                type="text"
                className="form-control"
                value={studentAddress}
                onChange={(e) => setStudentAddress(e.target.value)}
                placeholder="Enter student wallet address (0x...)"
                required
              />
              <small className="text-muted">
                Try: {STUDENT_ADDRESS}
              </small>
            </div>
            <div className="col-md-4">
              <button 
                type="submit" 
                className="btn btn-primary w-100" 
                disabled={loading || !isBankAuthorized}
              >
                {loading ? 'Searching...' : '🔍 Search Student'}
              </button>
            </div>
          </form>

          {/* Debug Button */}
          <button 
            onClick={debugCredentialFunctions}
            className="btn btn-warning btn-sm mb-3"
            disabled={loading}
          >
            🐛 Debug Functions
          </button>

          {error && (
            <div className="alert alert-danger">
              <strong>Error:</strong> 
              <div style={{whiteSpace: 'pre-wrap'}}>{error}</div>
            </div>
          )}

          {debugInfo && (
            <div className="alert alert-info">
              <strong>Debug Info:</strong>
              <pre style={{whiteSpace: 'pre-wrap', fontSize: '12px'}}>{debugInfo}</pre>
            </div>
          )}

          {loading && (
            <div className="text-center py-4">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <p>Loading student data...</p>
            </div>
          )}

          {!profileExists && !loading && studentAddress && (
            <div className="alert alert-warning">
              <h6>⚠️ Profile Not Found</h6>
              <p>No student profile found for address: {studentAddress}</p>
            </div>
          )}

          {isBankAuthorized && studentProfile && (
            <div>
              <div className="card p-4 mb-4">
                <h5>👤 Student Profile Information</h5>
                <div className="row">
                  <div className="col-md-6">
                    <p><strong>Name:</strong> {studentProfile.name}</p>
                    <p><strong>ID Number:</strong> {studentProfile.identificationNumber}</p>
                    <p><strong>Date of Birth:</strong> {studentProfile.dateOfBirth}</p>
                    <p><strong>Gender:</strong> {studentProfile.gender || 'Not specified'}</p>
                  </div>
                  <div className="col-md-6">
                    <p><strong>Email:</strong> {studentProfile.contactEmail}</p>
                    <p><strong>Phone:</strong> {studentProfile.contactPhone || 'Not provided'}</p>
                    <p><strong>Nationality:</strong> {studentProfile.nationality || 'Not specified'}</p>
                    <p><strong>Wallet:</strong> <small className="text-muted">{studentProfile.walletAddress}</small></p>
                  </div>
                </div>
                {studentProfile.permanentAddress && (
                  <p><strong>Address:</strong> {studentProfile.permanentAddress}</p>
                )}
              </div>

              <EligibilityChecker 
                contract={contract}
                account={account}
                studentAddress={studentAddress}
                isBank={true}
                eligibility={eligibility}
              />

              <div className="card p-4 mb-4">
                <h5>🎓 Education Verification</h5>
                <div className={`alert ${hasCredentials ? 'alert-success' : 'alert-info'}`}>
                  <strong>Academic Credentials:</strong> {hasCredentials ? 
                    `✅ ${credentials.length} Credential(s) Found` : 
                    '📝 No credentials yet (University needs to issue them)'
                  }
                </div>

                {credentials.length > 0 && (
                  <div>
                    <h6>Academic Credentials</h6>
                    {credentials.map((cred, index) => (
                      <div key={index} className="mb-3 p-3 border rounded">
                        <h6>{cred.credentialType} - {cred.institutionName}</h6>
                        <p><strong>Period:</strong> {cred.startDate} to {cred.endDate}</p>
                        
                        {cred.gradeOrPercentage && (
                          <div className="row mt-2">
                            <div className="col-md-6">
                              <h6>📊 Academic Performance</h6>
                              <div className="row">
                                <div className="col-6">
                                  <strong>Grade:</strong><br />
                                  <span className="text-success">{cred.gradeOrPercentage}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        <hr />

                        <div className="row">
                          <div className="col-md-4">
                            <strong>Start Date:</strong><br />
                            {cred.startDate}
                          </div>
                          <div className="col-md-4">
                            <strong>End Date:</strong><br />
                            {cred.endDate}
                          </div>
                          <div className="col-md-4">
                            <strong>Issued On:</strong><br />
                            {cred.issuedAt}
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
                    ))}
                  </div>
                )}

                {credentials.length === 0 && credentialCount > 0 && (
                  <div className="alert alert-warning">
                    <h6>⚠️ Credentials Not Loaded</h6>
                    <p>Credentials exist but couldn't be loaded. Click the debug button above to troubleshoot.</p>
                    <p>Credential count from contract: {credentialCount}</p>
                  </div>
                )}
              </div>

              {admissionRequest && (
                <div className="card p-4 mb-4">
                  <h5>🎓 Admission Status</h5>
                  <div className={`alert ${admissionRequest.isVerified ? 'alert-success' : 'alert-warning'}`}>
                    <strong>Admission Request:</strong> {admissionRequest.isVerified ? '✅ Verified' : '⏳ Pending Verification'}
                  </div>
                  <p><strong>University:</strong> {admissionRequest.universityName}</p>
                  <p><strong>Course:</strong> {admissionRequest.courseName}</p>
                  <p><strong>Admission ID:</strong> {admissionRequest.admissionId}</p>
                </div>
              )}

              {loanRequest && (
                <div className="card p-4 mb-4">
                  <h5>💰 Loan Request</h5>
                  <div className={`alert ${loanRequest.isApproved ? 'alert-success' : 'alert-info'}`}>
                    <strong>Loan Status:</strong> {loanRequest.isApproved ? '✅ Approved' : '⏳ Pending Approval'}
                  </div>
                  <p><strong>Amount:</strong> {loanRequest.loanAmount} ETH</p>
                  <p><strong>Purpose:</strong> {loanRequest.loanPurpose}</p>
                  <p><strong>Repayment Period:</strong> {loanRequest.repaymentPeriod} months</p>
                  {!loanRequest.isApproved && (
                    <button 
                      onClick={approveLoan}
                      className="btn btn-success mt-2"
                      disabled={loading}
                    >
                      ✅ Approve Loan
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default BankDashboard;