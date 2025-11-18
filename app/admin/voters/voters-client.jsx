'use client'

import { useState } from 'react'
import { createVoter, deleteVoter, activateVoter, deactivateVoter, updateVoter } from '../../../lib/admin/action.voters'
import Navigation from '../../../components/navigation'
import { useSession } from 'next-auth/react'

export default function VotersClient({ initialVoters }) {
  const { data: session } = useSession()
  const [voters, setVoters] = useState(initialVoters)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingVoter, setEditingVoter] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [formData, setFormData] = useState({ voterFname: '', voterLname: '', voterMname: '', voterPass: '', voterStat: 'Active', voted: 'N' })

  const resetForm = () => {
    setFormData({ voterFname: '', voterLname: '', voterMname: '', voterPass: '', voterStat: 'Active', voted: 'N' })
    setEditingVoter(null)
    setError(null)
  }

  const openCreateModal = () => {
    resetForm()
    setIsModalOpen(true)
  }

  const openEditModal = (voter) => {
    setFormData({ voterFname: voter.voterFname, voterLname: voter.voterLname, voterMname: voter.voterMname || '', voterPass: '', voterStat: voter.voterStat, voted: voter.voted })
    setEditingVoter(voter)
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    resetForm()
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const updateData = editingVoter ? { ...formData } : formData
      if (editingVoter && !updateData.voterPass) delete updateData.voterPass
      const result = editingVoter ? await updateVoter({ voterID: editingVoter.voterID, ...updateData }) : await createVoter(formData)
      if (result.success) {
        setVoters(editingVoter ? voters.map(v => v.voterID === editingVoter.voterID ? result.data : v) : [...voters, result.data])
        closeModal()
      } else {
        setError(result.error)
      }
    } catch (err) {
      setError(err.message || 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleDeactivate = async (voterID) => {
    if (!confirm('Deactivate this voter?')) return
    setLoading(true)
    const result = await deactivateVoter(voterID)
    result.success ? setVoters(voters.map(v => v.voterID === voterID ? result.data : v)) : alert(result.error)
    setLoading(false)
  }

  const handleActivate = async (voterID) => {
    setLoading(true)
    const result = await activateVoter(voterID)
    result.success ? setVoters(voters.map(v => v.voterID === voterID ? result.data : v)) : alert(result.error)
    setLoading(false)
  }

  const handleDelete = async (voterID) => {
    if (!confirm('Delete this voter? This cannot be undone.')) return
    setLoading(true)
    const result = await deleteVoter(voterID)
    result.success ? setVoters(voters.filter(v => v.voterID !== voterID)) : alert(result.error)
    setLoading(false)
  }

  return (
    <div className="min-vh-100 bg-light">
      <Navigation session={session} />
      <div className="container py-4">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h1 className="display-5 fw-bold">Voters Management</h1>
          <button onClick={openCreateModal} className="btn btn-primary" disabled={loading}>Add New Voter</button>
        </div>
        <div className="card shadow-sm">
          <table className="table table-hover mb-0">
            <thead className="table-light">
              <tr>{['ID', 'Name', 'Status', 'Voted', 'Created', 'Actions'].map(h => <th key={h} className="text-uppercase small fw-semibold">{h}</th>)}</tr>
            </thead>
            <tbody>
              {voters.length === 0 ? (
                <tr><td colSpan="6" className="text-center text-muted py-5">No voters found</td></tr>
              ) : voters.map(voter => (
                <tr key={voter.voterID}>
                  <td>{voter.voterID}</td>
                  <td>{voter.voterFname} {voter.voterMname} {voter.voterLname}</td>
                  <td><span className={`badge ${voter.voterStat === 'Active' ? 'bg-success' : 'bg-danger'}`}>{voter.voterStat}</span></td>
                  <td><span className={`badge ${voter.voted === 'Y' ? 'bg-primary' : 'bg-secondary'}`}>{voter.voted === 'Y' ? 'Yes' : 'No'}</span></td>
                  <td className="small">{new Date(voter.createdAt).toLocaleDateString()}</td>
                  <td>
                    <button onClick={() => openEditModal(voter)} className="btn btn-sm btn-link text-primary p-0 me-2" disabled={loading}>Edit</button>
                    {voter.voterStat === 'Active' ? (
                      <button onClick={() => handleDeactivate(voter.voterID)} className="btn btn-sm btn-link text-warning p-0 me-2" disabled={loading}>Deactivate</button>
                    ) : (
                      <button onClick={() => handleActivate(voter.voterID)} className="btn btn-sm btn-link text-success p-0 me-2" disabled={loading}>Activate</button>
                    )}
                    <button onClick={() => handleDelete(voter.voterID)} className="btn btn-sm btn-link text-danger p-0" disabled={loading}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {isModalOpen && (
          <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">{editingVoter ? 'Edit Voter' : 'Add New Voter'}</h5>
                  <button className="btn-close" onClick={closeModal} disabled={loading}></button>
                </div>
                <div className="modal-body">
                  {error && <div className="alert alert-danger">{error}</div>}
                  {[
                    { label: 'First Name *', name: 'voterFname', required: true },
                    { label: 'Middle Name', name: 'voterMname' },
                    { label: 'Last Name *', name: 'voterLname', required: true },
                    { label: `Password ${editingVoter ? '(leave blank to keep current)' : '*'}`, name: 'voterPass', type: 'password', required: !editingVoter }
                  ].map(({ label, name, type = 'text', required }) => (
                    <div key={name} className="mb-3">
                      <label className="form-label">{label}</label>
                      <input type={type} name={name} value={formData[name]} onChange={(e) => setFormData({ ...formData, [name]: e.target.value })} required={required} className="form-control" disabled={loading} />
                    </div>
                  ))}
                  <div className="mb-3">
                    <label className="form-label">Status</label>
                    <select name="voterStat" value={formData.voterStat} onChange={(e) => setFormData({ ...formData, voterStat: e.target.value })} className="form-select" disabled={loading}>
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Voted</label>
                    <select name="voted" value={formData.voted} onChange={(e) => setFormData({ ...formData, voted: e.target.value })} className="form-select" disabled={loading}>
                      <option value="N">No</option>
                      <option value="Y">Yes</option>
                    </select>
                  </div>
                </div>
                <div className="modal-footer">
                  <button onClick={closeModal} className="btn btn-secondary" disabled={loading}>Cancel</button>
                  <button onClick={handleSubmit} className="btn btn-primary" disabled={loading}>{loading ? 'Saving...' : editingVoter ? 'Update' : 'Create'}</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}