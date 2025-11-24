import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';

const EligibilityChecker = ({ contract, account, studentAddress, isBank, eligibility }) => {
  const [creditScore, setCreditScore] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [scoreBreakdown, setScoreBreakdown] = useState(null);
  const [calculatedEligibility, setCalculatedEligibility] = useState(null);

  const calculateCreditScore = async () => {
    if (!contract || !studentAddress) {
      setError("Contract or student address not available");
      return 0;
    }

    try {
      // Try to get the credit score directly
      try {
        const score = await contract.getCreditScore(studentAddress);
        return Number(score);
      } catch (error) {
        console.log("getCreditScore failed, calculating manually:", error);
        
        // If getCreditScore fails, try to calculate it manually
        let score = 0;
        
        // Check if student profile exists
        try {
          const profile = await contract.studentProfiles(studentAddress);
          if (profile.exists) {
            // Profile completeness (15%)
            if (profile.contactEmail && profile.identificationNumber) {
              score += 150; // 15% of total score (850)
            }
          }
        } catch (error) {
          console.error("Error checking profile:", error);
        }
        
        // Check credentials (40%)
        try {
          let credentialCount = 0;
          for (let i = 0; i < 10; i++) {
            try {
              const cred = await contract.getCredential(studentAddress, i);
              if (cred && cred.issuer !== ethers.ZeroAddress) {
                credentialCount++;
              }
            } catch (error) {
              break;
            }
          }
          
          if (credentialCount >= 3) score += 340; // 40% for 3+ credentials
          else if (credentialCount === 2) score += 225; // ~26% for 2 credentials
          else if (credentialCount === 1) score += 170; // 20% for 1 credential
        } catch (error) {
          console.error("Error checking credentials:", error);
        }
        
        // Check admission status (25%)
        try {
          const admission = await contract.admissionRequests(studentAddress);
          if (admission.exists) {
            if (admission.isVerified) {
              score += 250; // 25% for verified admission
            } else {
              score += 50; // 5% for unverified admission
            }
          }
        } catch (error) {
          console.error("Error checking admission:", error);
        }
        
        // Academic performance (20%)
        try {
          let hasCredentials = false;
          for (let i = 0; i < 5; i++) {
            try {
              const cred = await contract.getCredential(studentAddress, i);
              if (cred && cred.issuer !== ethers.ZeroAddress) {
                hasCredentials = true;
                break;
              }
            } catch (error) {
              break;
            }
          }
          
          if (hasCredentials) score += 200; // 20% for having credentials
        } catch (error) {
          console.error("Error checking academic performance:", error);
        }
        
        return score > 850 ? 850 : score;
      }
    } catch (error) {
      console.error("Error calculating credit score:", error);
      return 0;
    }
  };

  const checkEligibility = async () => {
    if (!contract || !studentAddress) {
      setError("Contract or student address not available");
      return;
    }

    setLoading(true);
    setError('');

    try {
      let score = 0;
      let eligibilityData = null;
      
      if (isBank) {
        // Bank can trigger eligibility calculation
        try {
          const transaction = await contract.checkLoanEligibility(studentAddress);
          await transaction.wait();
          
          // Then get the results
          eligibilityData = await contract.getLoanEligibility(studentAddress);
          score = Number(eligibilityData.creditScore);
        } catch (error) {
          console.error("Error with bank eligibility check:", error);
          // Fallback to manual calculation
          score = await calculateCreditScore();
        }
      } else {
        // Student can only view existing eligibility
        try {
          eligibilityData = await contract.getLoanEligibility(studentAddress);
          score = Number(eligibilityData.creditScore);
        } catch (error) {
          console.error("Error getting eligibility data:", error);
          // Fallback to manual calculation
          score = await calculateCreditScore();
        }
      }
      
      setCreditScore(score);
      setCalculatedEligibility(eligibilityData);
      
      // Calculate score breakdown
      const breakdown = {
        total: score,
        credentials: Math.min(score * 0.4, 340), // 40% max
        admission: Math.min(score * 0.25, 250), // 25% max
        academic: Math.min(score * 0.2, 200), // 20% max
        profile: Math.min(score * 0.15, 150) // 15% max
      };
      
      setScoreBreakdown(breakdown);
      
    } catch (error) {
      console.error("Error checking eligibility:", error);
      setError(`Failed to check eligibility: ${error.reason || error.message}`);
    }
    setLoading(false);
  };

  const getScoreColor = (score) => {
    if (score >= 750) return 'success';
    if (score >= 650) return 'info';
    if (score >= 600) return 'warning';
    return 'danger';
  };

  const getScoreDescription = (score) => {
    if (score >= 750) return 'Excellent';
    if (score >= 650) return 'Good';
    if (score >= 600) return 'Fair';
    return 'Poor';
  };

  const getInterestRateText = (rate) => {
    if (!rate) return 'N/A';
    
    // Convert BigInt to number for comparison
    const rateNumber = Number(rate);
    if (rateNumber === 500) return '5%';
    if (rateNumber === 700) return '7%';
    if (rateNumber === 800) return '8%';
    if (rateNumber === 900) return '9%';
    if (rateNumber === 1200) return '12%';
    return `${rateNumber / 100}%`;
  };

  useEffect(() => {
    if (studentAddress) {
      checkEligibility();
    }
  }, [studentAddress]);

  return (
    <div className="card p-4 shadow-sm mb-4">
      <h5>💰 Loan Eligibility Check</h5>
      
      {error && (
        <div className="alert alert-danger">
          <strong>Error:</strong> {error}
        </div>
      )}

      {loading && (
        <div className="text-center py-3">
          <div className="spinner-border spinner-border-sm" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p>Calculating eligibility score...</p>
        </div>
      )}

      {(creditScore > 0 || calculatedEligibility) && (
        <div>
          {/* Credit Score Display */}
          <div className="row mb-4">
            <div className="col-md-6">
              <div className={`alert alert-${getScoreColor(creditScore)}`}>
                <h6>Credit Score</h6>
                <h2>{creditScore}</h2>
                <p>{getScoreDescription(creditScore)}</p>
                <small>Range: 300-850</small>
              </div>
            </div>
            
            <div className="col-md-6">
              <div className={`alert alert-${(calculatedEligibility?.isEligible || creditScore >= 600) ? 'success' : 'danger'}`}>
                <h6>Loan Eligibility</h6>
                <h4>{(calculatedEligibility?.isEligible || creditScore >= 600) ? '✅ ELIGIBLE' : '❌ NOT ELIGIBLE'}</h4>
                {!(calculatedEligibility?.isEligible || creditScore >= 600) && (
                  <p>Reason: Credit score too low (minimum 600 required)</p>
                )}
              </div>
            </div>
          </div>

          {(calculatedEligibility?.isEligible || creditScore >= 600) && (
            <div className="card p-3 mb-3">
              <h6>Loan Offer Details</h6>
              <div className="row">
                <div className="col-md-4">
                  <strong>Maximum Loan Amount:</strong>
                  <h5 className="text-success">
                    {calculatedEligibility?.maxLoanAmount 
                      ? ethers.formatEther(calculatedEligibility.maxLoanAmount) + " ETH" 
                      : "Calculating..."}
                  </h5>
                </div>
                <div className="col-md-4">
                  <strong>Interest Rate:</strong>
                  <h5 className="text-info">
                    {calculatedEligibility?.interestRate 
                      ? getInterestRateText(calculatedEligibility.interestRate) 
                      : "Calculating..."}
                  </h5>
                </div>
                <div className="col-md-4">
                  <strong>Last Updated:</strong>
                  <p>
                    {calculatedEligibility?.lastUpdated 
                      ? new Date(Number(calculatedEligibility.lastUpdated) * 1000).toLocaleString() 
                      : "Now"}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Score Breakdown */}
          {scoreBreakdown && (
            <div className="card p-3">
              <h6>📊 Score Breakdown</h6>
              <div className="row">
                <div className="col-md-3">
                  <div className="mb-2">
                    <strong>Academic Credentials (40%)</strong>
                    <div className="progress mb-1">
                      <div 
                        className="progress-bar bg-success" 
                        style={{width: `${(scoreBreakdown.credentials / 340) * 100}%`}}
                      ></div>
                    </div>
                    <small>{Math.round(scoreBreakdown.credentials)} points</small>
                  </div>
                </div>
                
                <div className="col-md-3">
                  <div className="mb-2">
                    <strong>Admission Status (25%)</strong>
                    <div className="progress mb-1">
                      <div 
                        className="progress-bar bg-info" 
                        style={{width: `${(scoreBreakdown.admission / 250) * 100}%`}}
                      ></div>
                    </div>
                    <small>{Math.round(scoreBreakdown.admission)} points</small>
                  </div>
                </div>
                
                <div className="col-md-3">
                  <div className="mb-2">
                    <strong>Academic Performance (20%)</strong>
                    <div className="progress mb-1">
                      <div 
                        className="progress-bar bg-warning" 
                        style={{width: `${(scoreBreakdown.academic / 200) * 100}%`}}
                      ></div>
                    </div>
                    <small>{Math.round(scoreBreakdown.academic)} points</small>
                  </div>
                </div>
                
                <div className="col-md-3">
                  <div className="mb-2">
                    <strong>Profile Completeness (15%)</strong>
                    <div className="progress mb-1">
                      <div 
                        className="progress-bar bg-primary" 
                        style={{width: `${(scoreBreakdown.profile / 150) * 100}%`}}
                      ></div>
                    </div>
                    <small>{Math.round(scoreBreakdown.profile)} points</small>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Eligibility Criteria */}
          <div className="alert alert-info mt-3">
            <h6>🎯 Eligibility Criteria</h6>
            <div className="row">
              <div className="col-md-6">
                <strong>Minimum Score:</strong> 600/850
                <br />
                <strong>Excellent (750+):</strong> 5% interest, 2x loan amount
                <br />
                <strong>Good (650-749):</strong> 8% interest, 1.5x loan amount
              </div>
              <div className="col-md-6">
                <strong>Fair (600-649):</strong> 12% interest, 1x loan amount
                <br />
                <strong>Poor (0-599):</strong> Not eligible for loans
                <br />
                <strong>Base Amount:</strong> 1 ETH per 100 credit score points
              </div>
            </div>
          </div>

          {isBank && (calculatedEligibility?.isEligible || creditScore >= 600) && (
            <div className="mt-3">
              <button className="btn btn-success me-2">
                💰 Offer Loan
              </button>
              <button className="btn btn-outline-secondary">
                📋 View Detailed Report
              </button>
            </div>
          )}
        </div>
      )}

      <div className="mt-3">
        <button 
          onClick={checkEligibility} 
          className="btn btn-primary"
          disabled={loading}
        >
          {loading ? 'Calculating...' : '🔄 Check Eligibility'}
        </button>
      </div>

      {!creditScore && !loading && (
        <div className="alert alert-info mt-3">
          <h6>ℹ️ How to Get a Credit Score</h6>
          <ol>
            <li>Create a complete student profile with email and ID</li>
            <li>Get academic credentials issued by your university</li>
            <li>Submit admission documents for verification</li>
            <li>Maintain good academic performance</li>
          </ol>
          <small>Your score will be calculated automatically when all requirements are met.</small>
        </div>
      )}
    </div>
  );
};

export default EligibilityChecker;