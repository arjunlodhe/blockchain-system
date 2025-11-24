import React, { useState, useEffect } from 'react';
import StudentProfileCreator from './StudentProfileCreator';
import CredentialIssuer from './CredentialIssuer';
import UniversityVerification from './UniversityVerification';

const IssuerDashboard = ({ contract, account, isAuthorized }) => {
  const [activeTab, setActiveTab] = useState('create');
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleProfileCreated = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  if (!isAuthorized) {
    return (
      <div className="alert alert-danger text-center">
        <h4>🚫 Access Denied</h4>
        <p>The connected wallet <strong>({account})</strong> is not authorized to issue credentials.</p>
        <p>Please contact the admin to authorize your university wallet.</p>
      </div>
    );
  }

  return (
    <div>
      <h2>👨‍💼 University Dashboard</h2>
      <p className="text-muted">Welcome, authorized university! Manage student profiles, credentials, and admission verification.</p>
      
      <ul className="nav nav-tabs mb-4">
        <li className="nav-item">
          <button 
            className={`nav-link ${activeTab === 'create' ? 'active' : ''}`}
            onClick={() => setActiveTab('create')}
          >
            📝 Create Student Profile
          </button>
        </li>
        <li className="nav-item">
          <button 
            className={`nav-link ${activeTab === 'issue' ? 'active' : ''}`}
            onClick={() => setActiveTab('issue')}
          >
            🎓 Issue Credential
          </button>
        </li>
        <li className="nav-item">
          <button 
            className={`nav-link ${activeTab === 'verification' ? 'active' : ''}`}
            onClick={() => setActiveTab('verification')}
          >
            ✅ Verify Admissions
          </button>
        </li>
      </ul>

      {activeTab === 'create' ? (
        <StudentProfileCreator 
          contract={contract} 
          account={account}
          onProfileCreated={handleProfileCreated}
        />
      ) : activeTab === 'issue' ? (
        <CredentialIssuer 
          contract={contract} 
          account={account}
          key={refreshTrigger}
        />
      ) : (
        <UniversityVerification 
          contract={contract} 
          account={account}
          isAuthorized={isAuthorized}
        />
      )}
    </div>
  );
};

export default IssuerDashboard;