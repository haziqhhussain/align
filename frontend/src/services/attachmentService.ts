import { api } from './api';
import type { Attachment } from '../types';

export interface AttachmentList {
  items: Attachment[];
  total: number;
}

export const attachmentService = {
  async getTaskAttachments(taskId: number): Promise<Attachment[]> {
    const res = await api.get<AttachmentList>(`/tasks/${taskId}/attachments`);
    return res.items || [];
  },

  uploadTaskAttachment(taskId: number, file: File): Promise<Attachment> {
    const formData = new FormData();
    formData.append('file', file);
    return api.uploadForm<Attachment>(`/tasks/${taskId}/attachments`, formData);
  },

  async getProjectAttachments(projectId: number): Promise<Attachment[]> {
    const res = await api.get<AttachmentList>(`/projects/${projectId}/attachments`);
    return res.items || [];
  },

  uploadProjectAttachment(projectId: number, file: File): Promise<Attachment> {
    const formData = new FormData();
    formData.append('file', file);
    return api.uploadForm<Attachment>(`/projects/${projectId}/attachments`, formData);
  },

  async downloadAttachment(id: number, fileName: string): Promise<void> {
    const blob = await api.downloadBlob(`/attachments/${id}/download`);
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  },

  deleteAttachment(id: number): Promise<{ message: string; id: number }> {
    return api.delete<{ message: string; id: number }>(`/attachments/${id}`);
  }
};
