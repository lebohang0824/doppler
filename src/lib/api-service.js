/**
 * API Service for Doppler
 * Centralizes all fetch calls to the backend API
 */

export const ApiService = {
  // Status related calls
  status: {
    async check() {
      const res = await fetch('/api/status');
      if (!res.ok) throw new Error('Failed to check status');
      return await res.json();
    },
  },

  // Issues related calls
  issues: {
    async getAll(projectId, status = null) {
      const url = new URL('/api/issues', window.location.origin);
      if (projectId) url.searchParams.append('project_id', projectId);
      if (status) url.searchParams.append('status', status);

      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to fetch issues');
      return await res.json();
    },

    async getById(id) {
      const res = await fetch(`/api/issues/${id}`);
      if (!res.ok) throw new Error('Failed to fetch issue');
      return await res.json();
    },

    async create(formData) {
      const res = await fetch('/api/issues', {
        method: 'POST',
        body: formData,
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to create issue');
      }
      return null;
    },

    async update(id, data) {
      const res = await fetch(`/api/issues/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to update issue');
      }
      return await res.json();
    },

    async delete(id) {
      const res = await fetch(`/api/issues/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete issue');
      return true;
    },

    async execute(id) {
      const res = await fetch(`/api/issues/${id}/execute`, {
        method: 'POST',
      });
      if (!res.ok) throw new Error('Failed to execute issue');
      return await res.json();
    },

    async cancel(id) {
      const res = await fetch(`/api/issues/${id}/cancel`, {
        method: 'POST',
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to cancel execution');
      }
      return await res.json();
    },

    async approve(id, message) {
      const res = await fetch(`/api/issues/${id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to approve issue');
      }
      return await res.json();
    },

    async reject(id, reason) {
      const res = await fetch(`/api/issues/${id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to reject issue');
      }
      return await res.json();
    },

    async getLogs(id) {
      const res = await fetch(`/api/issues/${id}/logs`);
      if (!res.ok) throw new Error('Failed to fetch issue logs');
      return await res.json();
    },

    async getReports(id) {
      const res = await fetch(`/api/issues/${id}/reports`);
      if (!res.ok) throw new Error('Failed to fetch issue reports');
      return await res.json();
    },
  },

  // Projects related calls
  projects: {
    async getAll() {
      const res = await fetch('/api/projects');
      if (!res.ok) throw new Error('Failed to fetch projects');
      return await res.json();
    },

    async getById(id) {
      const res = await fetch(`/api/projects/${id}`);
      if (!res.ok) throw new Error('Failed to fetch project');
      return await res.json();
    },

    async create(data) {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const result = await res.json();
        throw new Error(result.error || 'Failed to create project');
      }
      return await res.json();
    },

    async update(id, data) {
      const res = await fetch(`/api/projects/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const result = await res.json();
        throw new Error(result.error || 'Failed to update project');
      }
      return await res.json();
    },

    async delete(id) {
      const res = await fetch(`/api/projects/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok && res.status !== 204) {
        const result = await res.json();
        throw new Error(result.error || 'Failed to delete project');
      }
      return true;
    },

    async getLogs(id) {
      const res = await fetch(`/api/projects/${id}/logs`);
      if (!res.ok) throw new Error('Failed to fetch project logs');
      return await res.json();
    },

    async getCounts(id) {
      const res = await fetch(`/api/projects/${id}/counts`);
      if (!res.ok) throw new Error('Failed to fetch project counts');
      return await res.json();
    },
  },

  // Settings related calls
  settings: {
    async getModels() {
      const res = await fetch('/api/settings/models');
      if (!res.ok) throw new Error('Failed to fetch models');
      return await res.json();
    },

    async getSelected() {
      const res = await fetch('/api/settings/selected');
      if (!res.ok) throw new Error('Failed to fetch selected model');
      return await res.json();
    },

    async setSelected(provider, modelId) {
      const res = await fetch('/api/settings/selected', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider, model_id: modelId }),
      });
      if (!res.ok) throw new Error('Failed to select model');
      return await res.json();
    },
  },
};
