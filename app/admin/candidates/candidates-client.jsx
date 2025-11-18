'use client'

import { useState, useTransition } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Navigation from '../../../components/navigation'
import toast from 'react-hot-toast'
import { createCandidate, updateCandidate, deactivateCandidate } from '../../../lib/admin/action.candidates'

export default function CandidatesClient({ initialCandidates }) {
  const { data: session } = useSession()
  const router = useRouter()
  const [candidates, setCandidates] = useState(initialCandidates)
  const [isPending, startTransition] = useTransition()
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ posID: '', voterID: '', candName: '', candMname: '', candLname: '', candPlatform: '', candStat: 'Active' })

  const closeModal = () => {
    setShowModal(false)
    setEditing(null)
    setForm({ posID: '', voterID: '', candName: '', candMname: '', candLname: '', candPlatform: '', candStat: 'Active' })
  }

  const openModal = (cand = null) => {
    setEditing(cand)
    setForm(cand ? { posID: cand.posID.toString(), voterID: cand.voterID?.toString() || '', candName: cand.candName, candMname: cand.candMname || '', candLname: cand.candLname, candPlatform: cand.candPlatform || '', candStat: cand.candStat } : { posID: '', voterID: '', candName: '', candMname: '', candLname: '', candPlatform: '', candStat: 'Active' })
    setShowModal(true)
  }

  const handleSubmit = () => {
    startTransition(async () => {
      const result = editing ? await updateCandidate({ ...form, candID: editing.candID }) : await createCandidate(form)
      if (result.success) {
        toast.success(editing ? 'Updated!' : 'Added!')
        setCandidates(prev => editing ? prev.map(c => c.candID === editing.candID ? { ...c, ...form, posID: +form.posID, voterID: form.voterID ? +form.voterID : null } : c) : [...prev, result.data])
        closeModal()
        router.refresh()
      } else {
        toast.error(result.error || 'Failed')
      }
    })
  }

  const handleDeactivate = (candID) => {
    if (!confirm('Deactivate this candidate?')) return
    startTransition(async () => {
      const prev = [...candidates]
      setCandidates(c => c.map(cand => cand.candID === candID ? { ...cand, candStat: 'Inactive' } : cand))
      const result = await deactivateCandidate(candID)
      result.success ? (toast.success('Deactivated'), router.refresh()) : (toast.error(result.error || 'Failed'), setCandidates(prev))
    })
  }

  return (
    <div className="min-vh-100 bg-light">
      <Navigation session={session} />
      <main className="container py-4">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h1 className="display-5 fw-bold">Candidate Management</h1>
          <button onClick={() => openModal()} className="btn btn-primary" disabled={isPending}>+ Add Candidate</button>
        </div>
        <div className="card shadow-sm">
          <table className="table table-hover mb-0">
            <thead className="table-light">
              <tr>{['ID', 'Full Name', 'Position ID', 'Status', 'Actions'].map(h => <th key={h} className="text-uppercase small fw-semibold">{h}</th>)}</tr>
            </thead>
            <tbody>
              {candidates.length === 0 ? (
                <tr><td colSpan="5" className="text-center text-muted py-5">No candidates found. Add one to get started!</td></tr>
              ) : candidates.map(cand => (
                <tr key={cand.candID} className={isPending ? 'opacity-50' : ''}>
                  <td>{cand.candID}</td>
                  <td className="fw-semibold">{`${cand.candName} ${cand.candMname || ''} ${cand.candLname}`}</td>
                  <td>{cand.posID}</td>
                  <td><span className={`badge ${cand.candStat === 'Active' ? 'bg-success' : 'bg-danger'}`}>{cand.candStat}</span></td>
                  <td>
                    <button onClick={() => openModal(cand)} className="btn btn-sm btn-link text-primary p-0 me-3" disabled={isPending}>Edit</button>
                    {cand.candStat === 'Active' && <button onClick={() => handleDeactivate(cand.candID)} className="btn btn-sm btn-link text-danger p-0" disabled={isPending}>Deactivate</button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
      {showModal && (
        <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">{editing ? 'Edit' : 'Add'} Candidate</h5>
                <button className="btn-close" onClick={closeModal} disabled={isPending}></button>
              </div>
              <div className="modal-body">
                {[
                  { label: 'Position ID', key: 'posID', type: 'number', required: true },
                  { label: 'Voter ID (Optional)', key: 'voterID', type: 'number' },
                  { label: 'First Name', key: 'candName', required: true },
                  { label: 'Middle Name (Optional)', key: 'candMname' },
                  { label: 'Last Name', key: 'candLname', required: true }
                ].map(({ label, key, type = 'text', required }) => (
                  <div key={key} className="mb-3">
                    <label className="form-label">{label}</label>
                    <input type={type} min={type === 'number' ? '1' : undefined} value={form[key]} onChange={(e) => setForm({...form, [key]: e.target.value})} className="form-control" required={required} disabled={isPending} />
                  </div>
                ))}
                <div className="mb-3">
                  <label className="form-label">Platform (Optional)</label>
                  <textarea value={form.candPlatform} onChange={(e) => setForm({...form, candPlatform: e.target.value})} className="form-control" rows="3" disabled={isPending} />
                </div>
                <div className="mb-3">
                  <label className="form-label">Status</label>
                  <select value={form.candStat} onChange={(e) => setForm({...form, candStat: e.target.value})} className="form-select" disabled={isPending}>
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button onClick={closeModal} className="btn btn-secondary" disabled={isPending}>Cancel</button>
                <button onClick={handleSubmit} className="btn btn-primary" disabled={isPending}>{isPending ? 'Saving...' : editing ? 'Update' : 'Add'}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}