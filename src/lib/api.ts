// STYLUXE Laravel REST API Client
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

export const ApiClient = {
  async get<T>(endpoint: string): Promise<T | null> {
    try {
      const res = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      });
      if (!res.ok) return null;
      const json = await res.json();
      return json.data ?? json;
    } catch (err) {
      // Backend not running or offline - fallback safely
      return null;
    }
  },

  async post<T>(endpoint: string, data: any): Promise<T | null> {
    try {
      const res = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(data),
      });
      if (!res.ok) return null;
      const json = await res.json();
      return json.data ?? json;
    } catch (err) {
      return null;
    }
  },

  async put<T>(endpoint: string, data: any): Promise<T | null> {
    try {
      const res = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(data),
      });
      if (!res.ok) return null;
      const json = await res.json();
      return json.data ?? json;
    } catch (err) {
      return null;
    }
  },

  async delete(endpoint: string): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'DELETE',
        headers: {
          'Accept': 'application/json',
        },
      });
      return res.ok;
    } catch (err) {
      return false;
    }
  },
};
