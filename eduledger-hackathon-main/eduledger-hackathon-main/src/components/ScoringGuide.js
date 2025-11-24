import React from 'react';

const ScoringGuide = ({ userType, show, onClose }) => {
  if (!show) return null;

  return (
    <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-lg">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">🎓 Credit Scoring System Guide</h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>
          <div className="modal-body">
            {userType === 'student' ? (
              <StudentScoringGuide />
            ) : (
              <BankScoringGuide />
            )}
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const StudentScoringGuide = () => (
  <div>
    <h6>📊 How Your Credit Score is Calculated</h6>
    <p>Your educational credit score is based on the following factors:</p>
    
    <div className="row mb-4">
      <div className="col-md-6">
        <div className="card mb-3">
          <div className="card-header bg-success text-white">
            <strong>Academic Credentials (40%)</strong>
          </div>
          <div className="card-body">
            <ul className="list-unstyled">
              <li>✅ 2+ credentials: <strong>40 points</strong></li>
              <li>✅ 1 credential: <strong>20 points</strong></li>
              <li>❌ No credentials: <strong>0 points</strong></li>
            </ul>
            <small>Each credential represents a completed course or degree</small>
          </div>
        </div>
      </div>
      
      <div className="col-md-6">
        <div className="card mb-3">
          <div className="card-header bg-info text-white">
            <strong>Admission Status (30%)</strong>
          </div>
          <div className="card-body">
            <ul className="list-unstyled">
              <li>✅ Verified admission: <strong>30 points</strong></li>
              <li>⏳ Pending verification: <strong>0 points</strong></li>
              <li>❌ No admission request: <strong>0 points</strong></li>
            </ul>
            <small>University must verify your admission documents</small>
          </div>
        </div>
      </div>
    </div>

    <div className="row">
      <div className="col-md-6">
        <div className="card mb-3">
          <div className="card-header bg-warning text-dark">
            <strong>Profile Completeness (30%)</strong>
          </div>
          <div className="card-body">
            <ul className="list-unstyled">
              <li>✅ Email + ID provided: <strong>30 points</strong></li>
              <li>⏳ Only email: <strong>15 points</strong></li>
              <li>❌ Incomplete profile: <strong>0 points</strong></li>
            </ul>
            <small>Complete your profile for better scoring</small>
          </div>
        </div>
      </div>
    </div>

    <div className="alert alert-info">
      <h6>🎯 Score Ranges & Loan Eligibility</h6>
      <table className="table table-sm">
        <thead>
          <tr>
            <th>Score Range</th>
            <th>Rating</th>
            <th>Loan Eligibility</th>
            <th>Interest Rate</th>
          </tr>
        </thead>
        <tbody>
          <tr className="table-success">
            <td>750-850</td>
            <td>Excellent</td>
            <td>✅ Full amount</td>
            <td>5%</td>
          </tr>
          <tr className="table-info">
            <td>650-749</td>
            <td>Good</td>
            <td>✅ Reduced amount</td>
            <td>8%</td>
          </tr>
          <tr className="table-warning">
            <td>600-649</td>
            <td>Fair</td>
            <td>✅ Limited amount</td>
            <td>12%</td>
          </tr>
          <tr className="table-danger">
            <td>0-599</td>
            <td>Poor</td>
            <td>❌ Not eligible</td>
            <td>N/A</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div className="alert alert-warning">
      <h6>💡 Tips to Improve Your Score</h6>
      <ul>
        <li>📚 Complete more courses and get credentials issued</li>
        <li>🏫 Submit admission documents for verification</li>
        <li>📋 Ensure your profile information is complete</li>
        <li>⏰ Maintain good academic performance</li>
      </ul>
    </div>
  </div>
);

const BankScoringGuide = () => (
  <div>
    <h6>🏦 Bank Credit Assessment System</h6>
    <p>This guide explains how student credit scores are calculated for loan eligibility:</p>
    
    <div className="row mb-4">
      <div className="col-md-4">
        <div className="card mb-3">
          <div className="card-header bg-success text-white">
            <strong>Academic Credentials (40%)</strong>
          </div>
          <div className="card-body">
            <p><strong>Scoring Criteria:</strong></p>
            <ul>
              <li>2+ credentials: 40 points</li>
              <li>1 credential: 20 points</li>
              <li>No credentials: 0 points</li>
            </ul>
            <small>Verified educational achievements</small>
          </div>
        </div>
      </div>
      
      <div className="col-md-4">
        <div className="card mb-3">
          <div className="card-header bg-info text-white">
            <strong>Admission Status (30%)</strong>
          </div>
          <div className="card-body">
            <p><strong>Scoring Criteria:</strong></p>
            <ul>
              <li>Verified admission: 30 points</li>
              <li>Pending/unverified: 0 points</li>
            </ul>
            <small>University-verified admission status</small>
          </div>
        </div>
      </div>
      
      <div className="col-md-4">
        <div className="card mb-3">
          <div className="card-header bg-warning text-dark">
            <strong>Profile Completeness (30%)</strong>
          </div>
          <div className="card-body">
            <p><strong>Scoring Criteria:</strong></p>
            <ul>
              <li>Complete profile: 30 points</li>
              <li>Partial profile: 15 points</li>
              <li>Incomplete: 0 points</li>
            </ul>
            <small>Contact information and ID verification</small>
          </div>
        </div>
      </div>
    </div>

    <div className="alert alert-primary">
      <h6>📈 Risk Assessment Matrix</h6>
      <div className="table-responsive">
        <table className="table table-bordered">
          <thead>
            <tr>
              <th>Credit Score</th>
              <th>Risk Level</th>
              <th>Max Loan Amount</th>
              <th>Interest Rate</th>
              <th>Approval Recommendation</th>
            </tr>
          </thead>
          <tbody>
            <tr className="table-success">
              <td>750-850</td>
              <td>Low Risk</td>
              <td>2x Base Amount</td>
              <td>5%</td>
              <td>✅ Auto-approve</td>
            </tr>
            <tr className="table-info">
              <td>650-749</td>
              <td>Medium Risk</td>
              <td>1.5x Base Amount</td>
              <td>8%</td>
              <td>✅ Recommend approval</td>
            </tr>
            <tr className="table-warning">
              <td>600-649</td>
              <td>High Risk</td>
              <td>1x Base Amount</td>
              <td>12%</td>
              <td>⚠️ Manual review</td>
            </tr>
            <tr className="table-danger">
              <td>0-599</td>
              <td>Very High Risk</td>
              <td>0 ETH</td>
              <td>N/A</td>
              <td>❌ Reject</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div className="alert alert-secondary">
      <h6>🔍 Verification Checklist</h6>
      <ol>
        <li><strong>Credentials Verification:</strong> Check number and quality of academic credentials</li>
        <li><strong>Admission Status:</strong> Confirm university verification status</li>
        <li><strong>Profile Validation:</strong> Verify contact information completeness</li>
        <li><strong>Score Calculation:</strong> Ensure score matches eligibility criteria</li>
        <li><strong>Final Assessment:</strong> Make loan decision based on risk level</li>
      </ol>
    </div>

    <div className="alert alert-info">
      <h6>⚖️ Compliance Notes</h6>
      <ul>
        <li>All scores are calculated transparently on blockchain</li>
        <li>Students can view their own scoring criteria</li>
        <li>No personal bias in algorithm-based scoring</li>
        <li>Decisions are based solely on verifiable educational data</li>
      </ul>
    </div>
  </div>
);

export default ScoringGuide;