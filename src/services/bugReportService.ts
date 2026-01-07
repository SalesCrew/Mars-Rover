import { API_BASE_URL } from '../config/database';

export interface BugReport {
  id: string;
  gebietsleiter_id: string | null;
  gebietsleiter_name: string | null;
  description: string;
  screenshot_url: string | null;
  page_url: string | null;
  user_agent: string | null;
  status: 'new' | 'reviewed' | 'fixed' | 'wont_fix';
  created_at: string;
  updated_at: string;
}

export interface CreateBugReportDTO {
  gebietsleiter_id: string;
  gebietsleiter_name: string;
  description: string;
  screenshot_url?: string;
  page_url?: string;
  user_agent?: string;
}

const baseUrl = `${API_BASE_URL}/bug-reports`;

export const bugReportService = {
  async createReport(data: CreateBugReportDTO): Promise<BugReport> {
    const response = await fetch(baseUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create bug report');
    }

    return response.json();
  },

  async getAllReports(status?: string): Promise<BugReport[]> {
    const url = status ? `${baseUrl}?status=${status}` : baseUrl;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error('Failed to fetch bug reports');
    }

    return response.json();
  },

  async updateStatus(id: string, status: BugReport['status']): Promise<BugReport> {
    const response = await fetch(`${baseUrl}/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });

    if (!response.ok) {
      throw new Error('Failed to update bug report');
    }

    return response.json();
  },
};
