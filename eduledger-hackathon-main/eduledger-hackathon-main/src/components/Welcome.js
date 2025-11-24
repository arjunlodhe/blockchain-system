import React from 'react';
import { ADMIN_ADDRESS, BANK_ADDRESS, UNIVERSITY_ADDRESS, STUDENT_ADDRESS } from '../config';

const Welcome = ({ onConnectWallet }) => {
  return (
    <div className="text-center py-5">
      <div className="row">
        <div className="col-md-8 mx-auto">
          <h2>Welcome to EduLedger</h2>
          <p className="lead">Blockchain-based Educational Credential System</p>
          
          <div className="row mt-5">
            <div className="col-md-3">
              <div className="card">
                <div className="card-body">
                  <h5>👑 Admin</h5>
                  <p>Manage universities and banks</p>
                  <small className="text-muted">{ADMIN_ADDRESS.substring(0, 10)}...</small>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card">
                <div className="card-body">
                  <h5>🏫 University</h5>
                  <p>Create profiles and issue credentials</p>
                  <small className="text-muted">{UNIVERSITY_ADDRESS.substring(0, 10)}...</small>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card">
                <div className="card-body">
                  <h5>🏦 Bank</h5>
                  <p>Verify students and approve loans</p>
                  <small className="text-muted">{BANK_ADDRESS.substring(0, 10)}...</small>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card">
                <div className="card-body">
                  <h5>🎓 Student</h5>
                  <p>View credentials and request loans</p>
                  <small className="text-muted">{STUDENT_ADDRESS.substring(0, 10)}...</small>
                </div>
              </div>
            </div>
          </div>

          <button onClick={onConnectWallet} className="btn btn-primary btn-lg mt-4">
            Connect MetaMask
          </button>

          <div className="mt-4">
            <div className="card">
              <div className="card-body">
                <h6>How it works:</h6>
                <ol className="text-start">
                  <li>Admin authorizes universities and banks</li>
                  <li>Universities create student profiles and issue credentials</li>
                  <li>Students submit admission requests for verification</li>
                  <li>Banks check student eligibility and approve loans</li>
                </ol>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Welcome;