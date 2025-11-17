'use client'

import { useState } from 'react'
import { createVoter,deleteVoter,activateVoter,deactivateVoter,updateVoter  } from '../../../lib/admin/action.voters'
import Navigation from '../../../components/navigation'
import { useSession } from 'next-auth/react'
export default function VotersClient({ initialVoters }) {
  const { data: session } = useSession()
  const [voters, setVoters] = useState(initialVoters)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingVoter, setEditingVoter] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [formData, setFormData] = useState({
    voterFname: '',
    voterLname: '',
    voterMname: '',
    voterPass: '',
    voterStat: 'Active',
    voted: 'N'
  })

  const resetForm = () => {
    setFormData({
      voterFname: '',
      voterLname: '',
      voterMname: '',
      voterPass: '',
      voterStat: 'Active',
      voted: 'N'
    })
    setEditingVoter(null)
    setError(null)
  }

  const openCreateModal = () => {
    resetForm()
    setIsModalOpen(true)
  }

  const openEditModal = (voter) => {
    setFormData({
      voterFname: voter.voterFname,
      voterLname: voter.voterLname,
      voterMname: voter.voterMname || '',
      voterPass: '', // Don't populate password
      voterStat: voter.voterStat,
      voted: voter.voted
    })
    setEditingVoter(voter)
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    resetForm()
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      let result
      if (editingVoter) {
        // For update, only send password if it's not empty
        const updateData = { ...formData }
        if (!updateData.voterPass) {
          delete updateData.voterPass
        }
        result = await updateVoter({ voterID: editingVoter.voterID, ...updateData })
      } else {
        result = await createVoter(formData)
      }

      if (result.success) {
        if (editingVoter) {
          setVoters(voters.map(v => v.voterID === editingVoter.voterID ? result.data : v))
        } else {
          setVoters([...voters, result.data])
        }
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
    if (!confirm('Are you sure you want to deactivate this voter?')) return

    setLoading(true)
    const result = await deactivateVoter(voterID)
    if (result.success) {
      setVoters(voters.map(v => v.voterID === voterID ? result.data : v))
    } else {
      alert(result.error)
    }
    setLoading(false)
  }

  const handleActivate = async (voterID) => {
    setLoading(true)
    const result = await activateVoter(voterID)
    if (result.success) {
      setVoters(voters.map(v => v.voterID === voterID ? result.data : v))
    } else {
      alert(result.error)
    }
    setLoading(false)
  }

  const handleDelete = async (voterID) => {
    if (!confirm('Are you sure you want to delete this voter? This action cannot be undone.')) return

    setLoading(true)
    const result = await deleteVoter(voterID)
    if (result.success) {
      setVoters(voters.filter(v => v.voterID !== voterID))
    } else {
      alert(result.error)
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gray-100">
          <Navigation session={session} />
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Voters Management</h1>
        <button
          onClick={openCreateModal}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg"
          disabled={loading}
        >
          Add New Voter
        </button>
      </div>

      {/* Voters Table */}
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                ID
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Voted
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Created
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {voters.length === 0 ? (
              <tr>
                <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
                  No voters found
                </td>
              </tr>
            ) : (
              voters.map((voter) => (
                <tr key={voter.voterID} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {voter.voterID}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {voter.voterFname} {voter.voterMname} {voter.voterLname}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      voter.voterStat === 'Active' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {voter.voterStat}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      voter.voted === 'Y' 
                        ? 'bg-blue-100 text-blue-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {voter.voted === 'Y' ? 'Yes' : 'No'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(voter.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <button
                      onClick={() => openEditModal(voter)}
                      className="text-blue-600 hover:text-blue-900"
                      disabled={loading}
                    >
                      Edit
                    </button>
                    {voter.voterStat === 'Active' ? (
                      <button
                        onClick={() => handleDeactivate(voter.voterID)}
                        className="text-orange-600 hover:text-orange-900"
                        disabled={loading}
                      >
                        Deactivate
                      </button>
                    ) : (
                      <button
                        onClick={() => handleActivate(voter.voterID)}
                        className="text-green-600 hover:text-green-900"
                        disabled={loading}
                      >
                        Activate
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(voter.voterID)}
                      className="text-red-600 hover:text-red-900"
                      disabled={loading}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
            <h2 className="text-2xl font-bold mb-4">
              {editingVoter ? 'Edit Voter' : 'Add New Voter'}
            </h2>
            
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  First Name *
                </label>
                <input
                  type="text"
                  name="voterFname"
                  value={formData.voterFname}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Middle Name
                </label>
                <input
                  type="text"
                  name="voterMname"
                  value={formData.voterMname}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Last Name *
                </label>
                <input
                  type="text"
                  name="voterLname"
                  value={formData.voterLname}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password {editingVoter ? '(leave blank to keep current)' : '*'}
                </label>
                <input
                  type="password"
                  name="voterPass"
                  value={formData.voterPass}
                  onChange={handleInputChange}
                  required={!editingVoter}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  name="voterStat"
                  value={formData.voterStat}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Voted
                </label>
                <select
                  name="voted"
                  value={formData.voted}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="N">No</option>
                  <option value="Y">Yes</option>
                </select>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-blue-300"
                  disabled={loading}
                >
                  {loading ? 'Saving...' : editingVoter ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  </div>
  )
}