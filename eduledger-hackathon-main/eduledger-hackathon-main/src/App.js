import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';

import EduLedgerABI from './EduLedgerABI.json';
import StudentDashboard from './components/StudentDashboard';
import IssuerDashboard from './components/IssuerDashboard';
import BankDashboard from './components/BankDashboard';
import AdminDashboard from './components/AdminDashboard';
import AdmissionRequest from './components/AdmissionRequest';
import LoanRequestForm from './components/LoanRequestForm';
import ScoringGuide from './components/ScoringGuide';
import Welcome from './components/Welcome';
import { CONTRACT_ADDRESS, BANK_ADDRESS, UNIVERSITY_ADDRESS, STUDENT_ADDRESS, ADMIN_ADDRESS } from './config';

function App() {
  const [account, setAccount] = useState('');
  const [contract, setContract] = useState(null);
  const [userType, setUserType] = useState('');
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [contractOwner, setContractOwner] = useState('');
  const [loading, setLoading] = useState(false);
  const [authCheckComplete, setAuthCheckComplete] = useState(false);
  const [showScoringGuide, setShowScoringGuide] = useState(false);
  const [debugInfo, setDebugInfo] = useState('');

  // Debug authorization function
  const debugAuthorization = async (contractInstance, currentAccount) => {
    let debugOutput = "🔍 Authorization Debug Info:\n\n";
    
    try {
      debugOutput += `Connected Account: ${currentAccount}\n`;
      debugOutput += `Expected Admin: ${ADMIN_ADDRESS}\n`;
      debugOutput += `Match: ${currentAccount.toLowerCase() === ADMIN_ADDRESS.toLowerCase()}\n\n`;
      
      // Check admin status
      try {
        const adminStatus = await contractInstance.isAdmin(currentAccount);
        debugOutput += `✅ isAdmin: ${adminStatus}\n`;
      } catch (error) {
        debugOutput += `❌ isAdmin Error: ${error.message}\n`;
      }

      // Check bank status
      try {
        const isBank = await contractInstance.authorizedBanks(currentAccount);
        debugOutput += `✅ isBank: ${isBank}\n`;
      } catch (error) {
        debugOutput += `❌ isBank Error: ${error.message}\n`;
      }

      // Check university status
      try {
        const isUniversity = await contractInstance.authorizedUniversities(currentAccount);
        debugOutput += `✅ isUniversity: ${isUniversity}\n`;
      } catch (error) {
        debugOutput += `❌ isUniversity Error: ${error.message}\n`;
      }

      // Check student profile
      try {
        const hasProfile = await contractInstance.studentProfiles(currentAccount);
        debugOutput += `✅ hasStudentProfile: ${hasProfile.exists}\n`;
      } catch (error) {
        debugOutput += `❌ hasStudentProfile Error: ${error.message}\n`;
      }

      // Check contract owner
      try {
        const owner = await contractInstance.owner();
        debugOutput += `✅ Contract Owner: ${owner}\n`;
        debugOutput += `✅ Is Owner: ${currentAccount.toLowerCase() === owner.toLowerCase()}\n`;
      } catch (error) {
        debugOutput += `❌ Owner Check Error: ${error.message}\n`;
      }

    } catch (error) {
      debugOutput += `❌ General Debug Error: ${error.message}\n`;
    }

    console.log(debugOutput);
    setDebugInfo(debugOutput);
    return debugOutput;
  };

  const determineUserType = async (currentAccount, contractInstance) => {
    const accountLower = currentAccount.toLowerCase();
    const adminLower = ADMIN_ADDRESS.toLowerCase();
    
    console.log("🔄 Determining user type for:", accountLower);
    console.log("Expected admin address:", adminLower);

    // First check if it matches the configured admin address
    if (accountLower === adminLower) {
      console.log("✅ Address matches configured ADMIN address");
      try {
        const adminStatus = await contractInstance.isAdmin(currentAccount);
        console.log("🔍 Contract admin status:", adminStatus);
        if (adminStatus) {
          console.log("✅ User is ADMIN (both address and contract confirm)");
          return 'admin';
        } else {
          console.log("⚠️ Address matches but not admin in contract");
        }
      } catch (error) {
        console.error("Error checking admin status:", error);
      }
    }

    // Check if admin (contract level)
    try {
      const adminStatus = await contractInstance.isAdmin(currentAccount);
      console.log("🔍 Contract admin check result:", adminStatus);
      if (adminStatus) {
        console.log("✅ User is ADMIN (contract level)");
        return 'admin';
      }
    } catch (error) {
      console.error("Error checking admin status:", error);
    }
    
    // Check if bank
    try {
      const isBank = await contractInstance.authorizedBanks(currentAccount);
      console.log("🔍 Bank check result:", isBank);
      if (isBank) {
        console.log("✅ User is BANK");
        return 'bank';
      }
    } catch (error) {
      console.error("Error checking bank status:", error);
    }
    
    // Check if university
    try {
      const isUniversity = await contractInstance.authorizedUniversities(currentAccount);
      console.log("🔍 University check result:", isUniversity);
      if (isUniversity) {
        console.log("✅ User is UNIVERSITY");
        return 'issuer';
      }
    } catch (error) {
      console.error("Error checking university status:", error);
    }
    
    // Check if student (by profile existence)
    try {
      const hasProfile = await contractInstance.studentProfiles(currentAccount);
      console.log("🔍 Student profile check result:", hasProfile.exists);
      if (hasProfile.exists) {
        console.log("✅ User is STUDENT");
        return 'student';
      }
    } catch (error) {
      console.error("Error checking student profile:", error);
    }
    
    console.log("❌ User is UNAUTHORIZED");
    return 'unauthorized';
  };

  const checkEnhancedAuthorization = async (contractInstance, currentAccount) => {
    try {
      console.log("🔐 Starting authorization check...");
      
      const userType = await determineUserType(currentAccount, contractInstance);
      console.log("📋 Determined user type:", userType);
      setUserType(userType);

      if (userType === 'admin') {
        setIsAuthorized(true);
        setIsAdmin(true);
        console.log("🎯 User authorized as ADMIN");
      } else if (userType === 'bank' || userType === 'issuer' || userType === 'student') {
        setIsAuthorized(true);
        console.log("🎯 User authorized as", userType.toUpperCase());
      } else {
        setIsAuthorized(false);
        console.log("🚫 User NOT authorized");
      }
      
      // Get contract owner
      try {
        const ownerAddress = await contractInstance.owner();
        setContractOwner(ownerAddress);
        const isUserOwner = currentAccount.toLowerCase() === ownerAddress.toLowerCase();
        setIsOwner(isUserOwner);
        console.log("👑 Contract Owner:", ownerAddress);
        console.log("🤔 Is connected user owner?", isUserOwner);
      } catch (error) {
        console.error("Error getting contract owner:", error);
      }
      
      // Run debug info
      await debugAuthorization(contractInstance, currentAccount);
      
    } catch (error) {
      console.error("Error checking authorization:", error);
      setIsAuthorized(false);
      setIsOwner(false);
      setUserType('unauthorized');
    } finally {
      setAuthCheckComplete(true);
      console.log("✅ Authorization check complete");
    }
  };

  const connectWallet = async () => {
    if (window.ethereum) {
      try {
        setLoading(true);
        setAuthCheckComplete(false);
        setDebugInfo('');
        
        console.log("🔗 Connecting wallet...");
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        const currentAccount = accounts[0];
        console.log("✅ Connected account:", currentAccount);
        setAccount(currentAccount);

        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        const contractInstance = new ethers.Contract(CONTRACT_ADDRESS, EduLedgerABI, signer);
        setContract(contractInstance);
        console.log("✅ Contract instance created");

        await checkEnhancedAuthorization(contractInstance, currentAccount);

      } catch (error) {
        console.error("Connection error:", error);
        setDebugInfo(`❌ Connection failed: ${error.message}`);
        alert(`Connection failed: ${error.message}`);
      } finally {
        setLoading(false);
      }
    } else {
      alert('Please install MetaMask!');
    }
  };

  const refreshAuthorization = async () => {
    if (contract && account) {
      setAuthCheckComplete(false);
      setDebugInfo('');
      console.log("🔄 Refreshing authorization...");
      await checkEnhancedAuthorization(contract, account);
    }
  };

  const disconnectWallet = () => {
    console.log("🔌 Disconnecting wallet");
    setAccount('');
    setContract(null);
    setIsAuthorized(false);
    setIsAdmin(false);
    setIsOwner(false);
    setUserType('unauthorized');
    setAuthCheckComplete(false);
    setDebugInfo('');
  };

  const switchToAdminWallet = async () => {
    try {
      // Request account switch
      await window.ethereum.request({
        method: 'wallet_requestPermissions',
        params: [{ eth_accounts: {} }]
      });
      
      // Refresh the connection
      await connectWallet();
    } catch (error) {
      console.error('Error switching wallet:', error);
      alert('Error switching wallets. Please manually switch in MetaMask.');
    }
  };

  useEffect(() => {
    const initWalletConnection = async () => {
      if (window.ethereum && window.ethereum.selectedAddress) {
        try {
          setLoading(true);
          console.log("⚡ Initializing wallet connection...");
          const accounts = await window.ethereum.request({ method: 'eth_accounts' });
          if (accounts.length > 0) {
            const currentAccount = accounts[0];
            console.log("✅ Found existing connection:", currentAccount);
            setAccount(currentAccount);

            const provider = new ethers.BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();
            const contractInstance = new ethers.Contract(CONTRACT_ADDRESS, EduLedgerABI, signer);
            setContract(contractInstance);

            await checkEnhancedAuthorization(contractInstance, currentAccount);
          } else {
            console.log("ℹ️ No existing wallet connection");
          }
        } catch (error) {
          console.error("Error initializing wallet:", error);
        } finally {
          setLoading(false);
        }
      }
    };

    initWalletConnection();

    if (window.ethereum) {
      const handleAccountsChanged = async (accounts) => {
        console.log("🔄 Accounts changed:", accounts);
        if (accounts.length > 0) {
          const newAccount = accounts[0];
          setAccount(newAccount);
          
          const provider = new ethers.BrowserProvider(window.ethereum);
          const signer = await provider.getSigner();
          const contractInstance = new ethers.Contract(CONTRACT_ADDRESS, EduLedgerABI, signer);
          setContract(contractInstance);
          
          setAuthCheckComplete(false);
          setDebugInfo('');
          await checkEnhancedAuthorization(contractInstance, newAccount);
        } else {
          disconnectWallet();
        }
      };

      window.ethereum.on('accountsChanged', handleAccountsChanged);

      return () => {
        if (window.ethereum) {
          window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        }
      };
    }
  }, []);

  const renderDashboard = () => {
    if (!authCheckComplete || loading) {
      return (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p>Checking authorization...</p>
        </div>
      );
    }

    switch (userType) {
      case 'admin':
        return <AdminDashboard contract={contract} account={account} />;
      
      case 'bank':
        return <BankDashboard contract={contract} account={account} />;
      
      case 'issuer':
        return isAuthorized ? (
          <IssuerDashboard contract={contract} account={account} isAuthorized={isAuthorized} />
        ) : (
          <div className="text-center py-4">
            <div className="card">
              <div className="card-body">
                <h5>🚫 Access Restricted</h5>
                <p>Your university wallet needs to be authorized by the admin.</p>
                <p className="text-muted">
                  Connected: {account.substring(0, 10)}...
                </p>
                <p>Contact the admin at: {ADMIN_ADDRESS.substring(0, 10)}...</p>
              </div>
            </div>
          </div>
        );
      
      case 'student':
        return (
          <div>
            <StudentDashboard contract={contract} account={account} />
            <div className="mt-4">
              <AdmissionRequest contract={contract} account={account} />
              <LoanRequestForm contract={contract} account={account} /> 
            </div>
          </div>
        );
      
      case 'unauthorized':
      default:
        return (
          <div className="text-center py-5">
            <div className="card">
              <div className="card-body">
                <h5>🚫 Unauthorized Access</h5>
                
                <div className="alert alert-danger mb-3">
                  <strong>Connected Wallet:</strong><br/>
                  <code>{account}</code>
                </div>
                
                <div className="alert alert-info mb-3">
                  <strong>Expected Admin Wallet:</strong><br/>
                  <code>{ADMIN_ADDRESS}</code>
                </div>

                <p className="text-muted mb-3">
                  Please connect with the admin wallet or contact the system administrator.
                </p>

                <div className="d-flex justify-content-center gap-2 mb-3">
                  <button 
                    onClick={switchToAdminWallet} 
                    className="btn btn-warning"
                  >
                    🔄 Switch to Admin Wallet
                  </button>
                  
                  <button 
                    onClick={() => alert(debugInfo)} 
                    className="btn btn-info"
                  >
                    🐛 Show Debug Info
                  </button>
                </div>

                <div className="mt-3">
                  <h6>Authorized Wallets:</h6>
                  <div className="text-start small">
                    <p>👑 <strong>Admin:</strong> <code>{ADMIN_ADDRESS}</code></p>
                    <p>🏦 <strong>Bank:</strong> <code>{BANK_ADDRESS}</code></p>
                    <p>🎓 <strong>Student:</strong> <code>{STUDENT_ADDRESS}</code></p>
                    <p>🏫 <strong>University:</strong> <code>{UNIVERSITY_ADDRESS}</code></p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="App">
      <nav className="navbar navbar-dark bg-dark">
        <div className="container-fluid">
          <a className="navbar-brand" href="#">
            <strong>EduLedger</strong> - Blockchain Education Platform
          </a>
          <div>
            <span className="navbar-text me-3">
              {authCheckComplete ? (
                userType === 'admin' ? '👑 Admin' :
                userType === 'bank' ? '🏦 Bank' :
                userType === 'issuer' ? (isAuthorized ? '✅ Authorized University' : '⚠️ Unauthorized University') :
                userType === 'student' ? '🎓 Student' :
                '❌ Unauthorized'
              ) : (
                '⏳ Checking...'
              )}
              {isOwner && ' 👑 Owner'}
            </span>
            
            {account ? (
              <div className="d-flex align-items-center">
                <span className="navbar-text me-2">
                  {account.substring(0, 6)}...{account.substring(38)}
                </span>
                
                <button 
                  onClick={() => alert(debugInfo)} 
                  className="btn btn-outline-warning btn-sm me-2"
                  title="Show debug information"
                >
                  🐛 Debug
                </button>
                
                <button 
                  onClick={() => setShowScoringGuide(true)} 
                  className="btn btn-outline-info btn-sm me-2"
                >
                  📊 Scoring Guide
                </button>
                <button 
                  onClick={disconnectWallet} 
                  className="btn btn-outline-light btn-sm me-2"
                >
                  Disconnect
                </button>
                <button 
                  onClick={refreshAuthorization} 
                  className="btn btn-outline-info btn-sm"
                  disabled={loading}
                >
                  ↻ Refresh
                </button>
              </div>
            ) : (
              <button 
                onClick={connectWallet} 
                className="btn btn-outline-light"
                disabled={loading}
              >
                {loading ? 'Connecting...' : 'Connect Wallet'}
              </button>
            )}
          </div>
        </div>
      </nav>

      <ScoringGuide 
        userType={userType} 
        show={showScoringGuide} 
        onClose={() => setShowScoringGuide(false)} 
      />

      <div className="container mt-4">
        {!account ? (
          <Welcome onConnectWallet={connectWallet} />
        ) : (
          renderDashboard()
        )}
      </div>
    </div>
  );
}

export default App;