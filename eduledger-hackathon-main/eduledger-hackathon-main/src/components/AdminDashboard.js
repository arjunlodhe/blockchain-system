import React, { useState, useEffect } from 'react';

const AdminDashboard = ({ contract, account }) => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [universities, setUniversities] = useState([]);
  const [banks, setBanks] = useState([]);
  const [newUniversity, setNewUniversity] = useState('');
  const [newBank, setNewBank] = useState('');
  const [newAdmin, setNewAdmin] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    checkAdminStatus();
    loadUniversities();
    loadBanks();
  }, [contract, account]);

  const checkAdminStatus = async () => {
    if (!contract) return;
    try {
      const adminStatus = await contract.isAdmin(account);
      setIsAdmin(adminStatus);
    } catch (error) {
      console.error("Error checking admin status:", error);
    }
  };

  const loadUniversities = async () => {
    if (!contract) return;
    try {
      const universityList = await contract.getAllUniversities();
      setUniversities(universityList);
    } catch (error) {
      console.error("Error loading universities:", error);
    }
  };

  const loadBanks = async () => {
    if (!contract) return;
    try {
      const bankList = await contract.getAllBanks();
      setBanks(bankList);
    } catch (error) {
      console.error("Error loading banks:", error);
    }
  };

  const addUniversity = async (e) => {
    e.preventDefault();
    if (!contract || !newUniversity) return;

    setLoading(true);
    setMessage('');
    try {
      const transaction = await contract.addUniversity(newUniversity);
      await transaction.wait();
      setMessage('University added successfully!');
      setNewUniversity('');
      loadUniversities();
    } catch (error) {
      setMessage(`Error: ${error.reason || error.message}`);
    }
    setLoading(false);
  };

  const removeUniversity = async (address) => {
    if (!contract) return;

    setLoading(true);
    try {
      const transaction = await contract.removeUniversity(address);
      await transaction.wait();
      setMessage('University removed successfully!');
      loadUniversities();
    } catch (error) {
      setMessage(`Error: ${error.reason || error.message}`);
    }
    setLoading(false);
  };

  const addBank = async (e) => {
    e.preventDefault();
    if (!contract || !newBank) return;

    setLoading(true);
    setMessage('');
    try {
      const transaction = await contract.addBank(newBank);
      await transaction.wait();
      setMessage('Bank added successfully!');
      setNewBank('');
      loadBanks();
    } catch (error) {
      setMessage(`Error: ${error.reason || error.message}`);
    }
    setLoading(false);
  };

  const removeBank = async (address) => {
    if (!contract) return;

    setLoading(true);
    try {
      const transaction = await contract.removeBank(address);
      await transaction.wait();
      setMessage('Bank removed successfully!');
      loadBanks();
    } catch (error) {
      setMessage(`Error: ${error.reason || error.message}`);
    }
    setLoading(false);
  };

  const addAdmin = async (e) => {
    e.preventDefault();
    if (!contract || !newAdmin) return;

    setLoading(true);
    try {
      const transaction = await contract.addAdmin(newAdmin);
      await transaction.wait();
      setMessage('Admin added successfully!');
      setNewAdmin('');
    } catch (error) {
      setMessage(`Error: ${error.reason || error.message}`);
    }
    setLoading(false);
  };

  if (!isAdmin) {
    return (
      <div className="alert alert-warning text-center">
        <h4>🚫 Admin Access Required</h4>
        <p>Your wallet does not have admin privileges.</p>
        <p className="text-muted">Connected: {account}</p>
        <p>Required Admin: 0x61b9fbF168e3447BE375Cd24E321bf8eFA42BD68</p>
      </div>
    );
  }

  return (
    <div className="card p-4 shadow-sm">
      <h4>👑 Admin Dashboard</h4>
      <p className="text-muted">Manage universities, banks, and admin roles dynamically.</p>

      {message && (
        <div className={`alert ${message.includes('Error') ? 'alert-danger' : 'alert-success'}`}>
          {message}
        </div>
      )}

      <div className="row">
        {/* University Management */}
        <div className="col-md-6 mb-4">
          <div className="card">
            <div className="card-header">
              <h5>🏫 University Management</h5>
            </div>
            <div className="card-body">
              <form onSubmit={addUniversity}>
                <div className="mb-3">
                  <label className="form-label">Add University Wallet</label>
                  <input
                    type="text"
                    className="form-control"
                    value={newUniversity}
                    onChange={(e) => setNewUniversity(e.target.value)}
                    placeholder="0x..."
                    required
                  />
                </div>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? 'Adding...' : 'Add University'}
                </button>
              </form>

              <hr />
              
              <h6>Authorized Universities ({universities.length})</h6>
              <div className="mt-3">
                {universities.map((uni, index) => (
                  <div key={index} className="d-flex justify-content-between align-items-center mb-2 p-2 border rounded">
                    <small className="text-muted">{uni}</small>
                    <button
                      className="btn btn-sm btn-danger"
                      onClick={() => removeUniversity(uni)}
                      disabled={loading}
                    >
                      Remove
                    </button>
                  </div>
                ))}
                {universities.length === 0 && (
                  <p className="text-muted">No universities added yet.</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Bank Management */}
        <div className="col-md-6 mb-4">
          <div className="card">
            <div className="card-header">
              <h5>🏦 Bank Management</h5>
            </div>
            <div className="card-body">
              <form onSubmit={addBank}>
                <div className="mb-3">
                  <label className="form-label">Add Bank Wallet</label>
                  <input
                    type="text"
                    className="form-control"
                    value={newBank}
                    onChange={(e) => setNewBank(e.target.value)}
                    placeholder="0x..."
                    required
                  />
                </div>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? 'Adding...' : 'Add Bank'}
                </button>
              </form>

              <hr />
              
              <h6>Authorized Banks ({banks.length})</h6>
              <div className="mt-3">
                {banks.map((bank, index) => (
                  <div key={index} className="d-flex justify-content-between align-items-center mb-2 p-2 border rounded">
                    <small className="text-muted">{bank}</small>
                    <button
                      className="btn btn-sm btn-danger"
                      onClick={() => removeBank(bank)}
                      disabled={loading}
                    >
                      Remove
                    </button>
                  </div>
                ))}
                {banks.length === 0 && (
                  <p className="text-muted">No banks added yet.</p>
                )}
              </div>
            </div>
          </div>

          {/* Admin Management */}
          <div className="card mt-3">
            <div className="card-header">
              <h5>👥 Admin Management</h5>
            </div>
            <div className="card-body">
              <form onSubmit={addAdmin}>
                <div className="mb-3">
                  <label className="form-label">Add New Admin</label>
                  <input
                    type="text"
                    className="form-control"
                    value={newAdmin}
                    onChange={(e) => setNewAdmin(e.target.value)}
                    placeholder="0x..."
                    required
                  />
                </div>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? 'Adding...' : 'Add Admin'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;