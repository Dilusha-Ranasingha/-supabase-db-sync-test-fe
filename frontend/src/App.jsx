import { useEffect, useMemo, useState } from 'react'
import { usersApi } from './api/users'
import './App.css'

const ERROR_MESSAGES = {
  invalid_email: 'Enter a valid email.',
  email_already_exists: 'Email already exists.',
  invalid_id: 'User not found.',
  not_found: 'User not found.',
  no_fields_to_update: 'No changes to save.',
}

function getErrorMessage(error) {
  const code = error?.data?.error ?? error?.message
  return ERROR_MESSAGES[code] ?? 'Something went wrong. Please try again.'
}

function formatDate(value) {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '-'

  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

function App() {
  const [users, setUsers] = useState([])
  const [listLoading, setListLoading] = useState(true)
  const [createBusy, setCreateBusy] = useState(false)
  const [savingId, setSavingId] = useState(null)
  const [deletingId, setDeletingId] = useState(null)
  const [message, setMessage] = useState('')
  const [actionError, setActionError] = useState('')

  const [createForm, setCreateForm] = useState({ name: '', email: '' })
  const [editingId, setEditingId] = useState(null)
  const [editForm, setEditForm] = useState({ name: '', email: '' })
  const [editOriginal, setEditOriginal] = useState(null)

  async function loadUsers(showLoading = true) {
    if (showLoading) setListLoading(true)

    try {
      const data = await usersApi.list()
      setUsers(Array.isArray(data) ? data : [])
    } catch (error) {
      setActionError(getErrorMessage(error))
    } finally {
      if (showLoading) setListLoading(false)
    }
  }

  useEffect(() => {
    let ignore = false

    usersApi
      .list()
      .then((data) => {
        if (!ignore) {
          setUsers(Array.isArray(data) ? data : [])
        }
      })
      .catch((error) => {
        if (!ignore) {
          setActionError(getErrorMessage(error))
        }
      })
      .finally(() => {
        if (!ignore) {
          setListLoading(false)
        }
      })

    return () => {
      ignore = true
    }
  }, [])

  function startEdit(user) {
    setMessage('')
    setActionError('')
    setEditingId(user.id)
    setEditForm({
      name: user.name ?? '',
      email: user.email ?? '',
    })
    setEditOriginal({
      name: user.name ?? null,
      email: user.email ?? '',
    })
  }

  function cancelEdit() {
    setEditingId(null)
    setEditForm({ name: '', email: '' })
    setEditOriginal(null)
  }

  const editPatch = useMemo(() => {
    if (!editOriginal) return {}

    const patch = {}
    const nextName = editForm.name.trim() ? editForm.name.trim() : null
    const nextEmail = editForm.email.trim()

    if (nextName !== editOriginal.name) patch.name = nextName
    if (nextEmail !== editOriginal.email) patch.email = nextEmail

    return patch
  }, [editForm, editOriginal])

  const hasEditChanges = Object.keys(editPatch).length > 0

  async function onCreateSubmit(event) {
    event.preventDefault()
    setMessage('')
    setActionError('')
    setCreateBusy(true)

    try {
      await usersApi.create({
        name: createForm.name,
        email: createForm.email.trim(),
      })
      setCreateForm({ name: '', email: '' })
      setMessage('User created successfully.')
      await loadUsers(false)
    } catch (error) {
      setActionError(getErrorMessage(error))
    } finally {
      setCreateBusy(false)
    }
  }

  async function onSaveEdit() {
    if (!editingId || !hasEditChanges) return

    setMessage('')
    setActionError('')
    setSavingId(editingId)

    try {
      await usersApi.update(editingId, editPatch)
      cancelEdit()
      setMessage('User updated successfully.')
      await loadUsers(false)
    } catch (error) {
      setActionError(getErrorMessage(error))
    } finally {
      setSavingId(null)
    }
  }

  async function onDelete(userId) {
    if (!window.confirm('Delete this user?')) return

    setMessage('')
    setActionError('')
    setDeletingId(userId)

    try {
      await usersApi.remove(userId)
      if (editingId === userId) cancelEdit()
      setMessage('User deleted successfully.')
      await loadUsers(false)
    } catch (error) {
      setActionError(getErrorMessage(error))
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <main className="page">
      <div className="bg-orb orb-a" aria-hidden="true" />
      <div className="bg-orb orb-b" aria-hidden="true" />
      <div className="grain" aria-hidden="true" />

      <section className="hero panel reveal">
        <div>
          <p className="eyebrow">Realtime Directory</p>
          <h1>Users Workspace</h1>
          <p>Manage your users with a polished UI connected to your deployed backend API.</p>
        </div>
        <button type="button" className="ghost" onClick={() => void loadUsers()}>
          Refresh Data
        </button>
      </section>

      <section className="layout">
        <section className="panel reveal create-panel">
          <h2>Create User</h2>
          <form className="form" onSubmit={onCreateSubmit}>
            <label>
              Name (optional)
              <input
                type="text"
                value={createForm.name}
                onChange={(event) =>
                  setCreateForm((current) => ({
                    ...current,
                    name: event.target.value,
                  }))
                }
                placeholder="Jane Doe"
              />
            </label>

            <label>
              Email (required)
              <input
                type="email"
                required
                value={createForm.email}
                onChange={(event) =>
                  setCreateForm((current) => ({
                    ...current,
                    email: event.target.value,
                  }))
                }
                placeholder="jane@example.com"
              />
            </label>

            <button type="submit" disabled={createBusy}>
              {createBusy ? 'Creating...' : 'Create User'}
            </button>
          </form>
        </section>

        <section className="panel reveal users-panel">
          <div className="panel-head">
            <h2>Users</h2>
            <span className="pill">{users.length} total</span>
          </div>

          {message ? <p className="message success">{message}</p> : null}
          {actionError ? <p className="message error">{actionError}</p> : null}

          {listLoading ? (
            <p className="message">Loading users...</p>
          ) : users.length === 0 ? (
            <p className="message">No users found.</p>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Created</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user, index) => {
                    const isEditing = editingId === user.id
                    const isSaving = savingId === user.id
                    const isDeleting = deletingId === user.id

                    return (
                      <tr key={user.id} className="row-reveal" style={{ '--delay': `${index * 65}ms` }}>
                        <td>
                          {isEditing ? (
                            <input
                              type="text"
                              value={editForm.name}
                              onChange={(event) =>
                                setEditForm((current) => ({
                                  ...current,
                                  name: event.target.value,
                                }))
                              }
                              placeholder="No name"
                            />
                          ) : (
                            user.name || '-'
                          )}
                        </td>
                        <td>
                          {isEditing ? (
                            <input
                              type="email"
                              value={editForm.email}
                              onChange={(event) =>
                                setEditForm((current) => ({
                                  ...current,
                                  email: event.target.value,
                                }))
                              }
                            />
                          ) : (
                            user.email
                          )}
                        </td>
                        <td>{formatDate(user.created_at)}</td>
                        <td>
                          <div className="actions">
                            {isEditing ? (
                              <>
                                <button
                                  type="button"
                                  onClick={() => void onSaveEdit()}
                                  disabled={isSaving || !hasEditChanges}
                                >
                                  {isSaving ? 'Saving...' : 'Save'}
                                </button>
                                <button type="button" className="ghost" onClick={cancelEdit}>
                                  Cancel
                                </button>
                              </>
                            ) : (
                              <>
                                <button type="button" className="ghost" onClick={() => startEdit(user)}>
                                  Edit
                                </button>
                                <button
                                  type="button"
                                  className="danger"
                                  onClick={() => void onDelete(user.id)}
                                  disabled={isDeleting}
                                >
                                  {isDeleting ? 'Deleting...' : 'Delete'}
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </section>
    </main>
  )
}

export default App
