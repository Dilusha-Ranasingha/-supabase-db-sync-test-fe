import { request } from './request'

export const usersApi = {
  list: () => request('/users'),

  get: (id) => request(`/users/${id}`),

  create: ({ name, email }) =>
    request('/users', {
      method: 'POST',
      body: JSON.stringify({
        name: name?.trim() ? name.trim() : undefined,
        email,
      }),
    }),

  update: (id, patch) =>
    request(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(patch),
    }),

  remove: (id) =>
    request(`/users/${id}`, {
      method: 'DELETE',
    }),
}