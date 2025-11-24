import React, { useState } from 'react';
import { ethers } from 'ethers';
import { BANK_ADDRESS } from '../config';

const LoanRequestForm = ({ contract, account }) => {
  const [formData, setFormData] = useState({
    loanAmount: '',
    loanPurpose: '',
    repaymentPeriod: '12'
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

  const submitLoanRequest = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!contract) {
      setError("Contract not connected.");
      return;
    }

    // Validate inputs
    if (!formData.loanAmount || !formData.loanPurpose || !formData.repaymentPeriod) {
      setError("Please fill in all required fields.");
      return;
    }

    const loanAmount = parseFloat(formData.loanAmount);
    const repaymentPeriod = parseInt(formData.repaymentPeriod);

    if (loanAmount <= 0) {
      setError("Loan amount must be greater than 0.");
      return;
    }

    if (repaymentPeriod <= 0) {
      setError("Repayment period must be greater than 0.");
      return;
    }

    setLoading(true);
    
    try {
      // Convert loan amount to wei (assuming ETH, for real use you might use stablecoins)
      const loanAmountInWei = ethers.parseEther(formData.loanAmount.toString());

      const transaction = await contract.createLoanRequest(
        loanAmountInWei,
        formData.loanPurpose,
        repaymentPeriod
      );

      setTxHash(transaction.hash);
      await transaction.wait();
      
      setSuccess(`Loan request of ${formData.loanAmount} ETH submitted successfully to bank!`);
      
      // Reset form
      setFormData({
        loanAmount: '',
        loanPurpose: '',
        repaymentPeriod: '12'
      });

    } catch (error) {
      console.error("Error creating loan request:", error);
      setError(`Failed: ${error.reason || error.message || "Unknown error"}`);
    }
    setLoading(false);
  };

  return (
    <div className="card p-4 shadow-sm mb-4">
      <h4>💰 Request Education Loan</h4>
      <p>Submit a loan request to the bank for your education expenses.</p>
      
      {error && (
        <div className="alert alert-danger">
          <strong>Error:</strong> {error}
        </div>
      )}
      
      {success && (
        <div className="alert alert-success">
          <strong>Success!</strong> {success}
          <br />
          <small>Bank Address: {BANK_ADDRESS}</small>
        </div>
      )}

      <form onSubmit={submitLoanRequest}>
        <div className="row">
          <div className="col-md-6 mb-3">
            <label className="form-label">Loan Amount (ETH) *</label>
            <input
              type="number"
              className="form-control"
              value={formData.loanAmount}
              onChange={(e) => handleInputChange('loanAmount', e.target.value)}
              placeholder="5.0"
              step="0.1"
              min="0.1"
              required
            />
            <small className="text-muted">Minimum: 0.1 ETH</small>
          </div>
          
          <div className="col-md-6 mb-3">
            <label className="form-label">Repayment Period (Months) *</label>
            <select
              className="form-select"
              value={formData.repaymentPeriod}
              onChange={(e) => handleInputChange('repaymentPeriod', e.target.value)}
              required
            >
              <option value="6">6 Months</option>
              <option value="12">12 Months</option>
              <option value="24">24 Months</option>
              <option value="36">36 Months</option>
              <option value="48">48 Months</option>
              <option value="60">60 Months</option>
            </select>
          </div>
        </div>

        <div className="mb-3">
          <label className="form-label">Loan Purpose *</label>
          <textarea
            className="form-control"
            rows="3"
            value={formData.loanPurpose}
            onChange={(e) => handleInputChange('loanPurpose', e.target.value)}
            placeholder="Please describe what you need the loan for (tuition fees, books, accommodation, etc.)"
            required
          />
        </div>

        <div className="alert alert-info">
          <strong>Bank Information:</strong>
          <br />
          <small>Bank Address: {BANK_ADDRESS}</small>
          <br />
          <small>Your request will be sent to this address for approval.</small>
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
            'Submit Loan Request'
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

export default LoanRequestForm;