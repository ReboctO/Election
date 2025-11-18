'use client'

import { useState, useTransition } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Navigation from '../../../components/navigation'
import toast from 'react-hot-toast'
import { createPosition, updatePosition, deactivatePosition } from '../../../lib/admin/action.position'

export default function PositionsClient({ initialPositions }) {
  const { data: session } = useSession()
  const router = useRouter()
  const [positions, setPositions] = useState(initialPositions)
  const [isPending, startTransition] = useTransition()
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ posName: '', numofPositions: '', posStatus: 'Open' })

  const closeModal = () => {
    setShowModal(false)
    setEditing(null)
    setForm({ posName: '', numofPositions: '', posStatus: 'Open' })
  }

  const openModal = (pos = null) => {
    setEditing(pos)
    setForm(pos ? { ...pos, numofPositions: pos.numofPositions.toString() } : { posName: '', numofPositions: '', posStatus: 'Open' })
    setShowModal(true)
  }

  const handleSubmit = () => {
    startTransition(async () => {
      const result = editing ? await updatePosition({ ...form, posID: editing.posID }) : await createPosition(form)
      if (result.success) {
        toast.success(editing ? 'Updated!' : 'Added!')
        setPositions(prev => editing ? prev.map(p => p.posID === editing.posID ? { ...p, ...form, numofPositions: +form.numofPositions } : p) : [...prev, result.data])
        closeModal()
        router.refresh()
      } else {
        toast.error(result.error || 'Failed')
      }
    })
  }

  const handleDeactivate = (posID) => {
    if (!confirm('Deactivate this position?')) return
    startTransition(async () => {
      const prev = [...positions]
      setPositions(p => p.map(pos => pos.posID === posID ? { ...pos, posStatus: 'Closed' } : pos))
      const result = await deactivatePosition(posID)
      result.success ? toast.success('Deactivated') && router.refresh() : (toast.error(result.error || 'Failed'), setPositions(prev))
    })
  }

  return (
    <div className="min-vh-100 bg-light">
      <Navigation session={session} />
      <main className="container py-4">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h1 className="display-5 fw-bold">Position Management</h1>
          <button onClick={() => openModal()} className="btn btn-primary" disabled={isPending}>+ Add Position</button>
        </div>
        <div className="card shadow-sm">
          <table className="table table-hover mb-0">
            <thead className="table-light">
              <tr>{['ID', 'Position Name', 'No. of Positions', 'Status', 'Actions'].map(h => <th key={h} className="text-uppercase small fw-semibold">{h}</th>)}</tr>
            </thead>
            <tbody>
              {positions.length === 0 ? (
                <tr><td colSpan="5" className="text-center text-muted py-5">No positions found. Add one to get started!</td></tr>
              ) : positions.map(pos => (
                <tr key={pos.posID} className={isPending ? 'opacity-50' : ''}>
                  <td>{pos.posID}</td>
                  <td className="fw-semibold">{pos.posName}</td>
                  <td>{pos.numofPositions}</td>
                  <td><span className={`badge ${pos.posStatus === 'Open' ? 'bg-success' : 'bg-danger'}`}>{pos.posStatus}</span></td>
                  <td>
                    <button onClick={() => openModal(pos)} className="btn btn-sm btn-link text-primary p-0 me-3" disabled={isPending}>Edit</button>
                    {pos.posStatus === 'Open' && <button onClick={() => handleDeactivate(pos.posID)} className="btn btn-sm btn-link text-danger p-0" disabled={isPending}>Deactivate</button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
      {showModal && (
        <div className="modal d-block">
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">{editing ? 'Edit' : 'Add'} Position</h5>
                <button className="btn-close" onClick={closeModal} disabled={isPending}></button>
              </div>
              <div className="modal-body">
                {[
                  { label: 'Position Name', key: 'posName', type: 'text' },
                  { label: 'Number of Positions', key: 'numofPositions', type: 'number' }
                ].map(({ label, key, type }) => (
                  <div key={key} className="mb-3">
                    <label className="form-label">{label}</label>
                    <input type={type} min={type === 'number' ? '1' : undefined} value={form[key]} onChange={(e) => setForm({...form, [key]: e.target.value})} className="form-control" required disabled={isPending} />
                  </div>
                ))}
                <div className="mb-3">
                  <label className="form-label">Status</label>
                  <select value={form.posStatus} onChange={(e) => setForm({...form, posStatus: e.target.value})} className="form-select" disabled={isPending}>
                    <option value="Open">Open</option>
                    <option value="Closed">Closed</option>
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