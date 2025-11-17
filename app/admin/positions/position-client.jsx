'use client'

import { useState, useTransition } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Navigation from '../../../components/navigation'
import toast from 'react-hot-toast'
import { createPosition, updatePosition, deactivatePosition } from '../../../lib/admin/action.position'

const INITIAL_FORM = { posName: '', numofPositions: '', posStatus: 'Open' }

function usePositionForm(initialPositions) {
  const router = useRouter()
  const [positions, setPositions] = useState(initialPositions)
  const [isPending, startTransition] = useTransition()
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(INITIAL_FORM)

  const closeModal = () => {
    setShowModal(false)
    setEditing(null)
    setForm(INITIAL_FORM)
  }

  const openModal = (pos = null) => {
    setEditing(pos)
    setForm(pos ? { ...pos, numofPositions: pos.numofPositions.toString() } : INITIAL_FORM)
    setShowModal(true)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    startTransition(async () => {
      const result = editing 
        ? await updatePosition({ ...form, posID: editing.posID })
        : await createPosition(form)

      if (result.success) {
        toast.success(editing ? 'Updated!' : 'Added!')
        setPositions(prev => editing
          ? prev.map(p => p.posID === editing.posID ? { ...p, ...form, numofPositions: +form.numofPositions } : p)
          : [...prev, result.data]
        )
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
      if (result.success) {
        toast.success('Deactivated')
        router.refresh()
      } else {
        toast.error(result.error || 'Failed')
        setPositions(prev)
      }
    })
  }

  return { positions, isPending, showModal, editing, form, setForm, openModal, closeModal, handleSubmit, handleDeactivate }
}

export default function PositionsClient({ initialPositions }) {
  const { data: session } = useSession()
  const { positions, isPending, showModal, editing, form, setForm, openModal, closeModal, handleSubmit, handleDeactivate } = usePositionForm(initialPositions)

  return (
    <div className="min-h-screen bg-gray-100">
      <Navigation session={session} />
      
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Position Management</h1>
          <button
            onClick={() => openModal()}
            className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
            disabled={isPending}
          >
            + Add Position
          </button>
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {['ID', 'Position Name', 'No. of Positions', 'Status', 'Actions'].map(h => (
                  <th key={h} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {positions.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                    No positions found. Add one to get started!
                  </td>
                </tr>
              ) : (
                positions.map(pos => (
                  <tr key={pos.posID} className={isPending ? 'opacity-60' : ''}>
                    <td className="px-6 py-4 whitespace-nowrap">{pos.posID}</td>
                    <td className="px-6 py-4 whitespace-nowrap font-medium">{pos.posName}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{pos.numofPositions}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        pos.posStatus === 'Open' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {pos.posStatus}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                      <button
                        onClick={() => openModal(pos)}
                        className="text-blue-600 hover:text-blue-900 disabled:opacity-50"
                        disabled={isPending}
                      >
                        Edit
                      </button>
                      {pos.posStatus === 'Open' && (
                        <button
                          onClick={() => handleDeactivate(pos.posID)}
                          className="text-red-600 hover:text-red-900 disabled:opacity-50"
                          disabled={isPending}
                        >
                          Deactivate
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </main>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full">
            <h2 className="text-2xl font-bold mb-4">{editing ? 'Edit' : 'Add'} Position</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              {[
                { label: 'Position Name', key: 'posName', type: 'text' },
                { label: 'Number of Positions', key: 'numofPositions', type: 'number', min: 1 }
              ].map(({ label, key, type, min }) => (
                <div key={key}>
                  <label className="block text-sm font-medium mb-2">{label}</label>
                  <input
                    type={type}
                    min={min}
                    value={form[key]}
                    onChange={(e) => setForm({...form, [key]: e.target.value})}
                    className="w-full px-3 py-2 border rounded-md"
                    required
                    disabled={isPending}
                  />
                </div>
              ))}
              <div>
                <label className="block text-sm font-medium mb-2">Status</label>
                <select
                  value={form.posStatus}
                  onChange={(e) => setForm({...form, posStatus: e.target.value})}
                  className="w-full px-3 py-2 border rounded-md"
                  disabled={isPending}
                >
                  <option value="Open">Open</option>
                  <option value="Closed">Closed</option>
                </select>
              </div>
              <div className="flex space-x-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
                  disabled={isPending}
                >
                  {isPending ? 'Saving...' : editing ? 'Update' : 'Add'}
                </button>
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-md hover:bg-gray-400 disabled:opacity-50"
                  disabled={isPending}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}