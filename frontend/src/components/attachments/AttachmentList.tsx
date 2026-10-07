import React, { useState, useEffect, useRef } from 'react';
import type { Attachment } from '../../types';
import { attachmentService } from '../../services/attachmentService';
import { formatFileSize } from '../../utils/format';
import { formatDateShort } from '../../utils/dateUtils';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import {
  Paperclip,
  Plus,
  Download,
  Trash2,
  FileText,
  Table,
  Presentation,
  Image as ImageIcon,
  Archive,
  File as FileIcon,
  Loader2,
  X,
  UploadCloud,
  Eye,
} from 'lucide-react';

interface AttachmentListProps {
  taskId?: number;
  projectId?: number;
  onAttachmentChange?: () => void;
}

export const AttachmentList: React.FC<AttachmentListProps> = ({
  taskId,
  projectId,
  onAttachmentChange,
}) => {
  const { user, isAdmin } = useAuth();
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [uploading, setUploading] = useState<boolean>(false);
  const [isDragOver, setIsDragOver] = useState<boolean>(false);

  // Delete state
  const [deletingAttachment, setDeletingAttachment] = useState<Attachment | null>(null);
  const [deleteLoading, setDeleteLoading] = useState<boolean>(false);

  // Image Preview Modal state
  const [previewImage, setPreviewImage] = useState<{ url: string; title: string } | null>(null);

  const fetchAttachments = async () => {
    setLoading(true);
    try {
      let list: Attachment[] = [];
      if (taskId) {
        list = await attachmentService.getTaskAttachments(taskId);
      } else if (projectId) {
        list = await attachmentService.getProjectAttachments(projectId);
      }
      setAttachments(list);
    } catch (err: any) {
      console.error('Failed to load attachments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttachments();
  }, [taskId, projectId]);

  // Client-side file validation before uploading
  const validateSelectedFile = (file: File): boolean => {
    const maxBytes = 10 * 1024 * 1024; // 10MB
    if (file.size > maxBytes) {
      showToast('File must be smaller than 10 MB.', 'error');
      return false;
    }
    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    const forbidden = ['exe', 'bat', 'cmd', 'ps1', 'sh', 'dll', 'msi', 'scr', 'com', 'vbs', 'jar', 'app'];
    if (forbidden.includes(ext)) {
      showToast(`Forbidden file extension '.${ext}'. Executables are not allowed.`, 'error');
      return false;
    }
    return true;
  };

  const handleUpload = async (file: File) => {
    if (!validateSelectedFile(file)) return;

    setUploading(true);
    try {
      if (taskId) {
        await attachmentService.uploadTaskAttachment(taskId, file);
      } else if (projectId) {
        await attachmentService.uploadProjectAttachment(projectId, file);
      }
      showToast(`Uploaded '${file.name}' successfully`, 'success');
      fetchAttachments();
      if (onAttachmentChange) onAttachmentChange();
    } catch (err: any) {
      showToast(err.message || 'Upload failed', 'error');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleUpload(files[0]);
    }
  };

  // Drag and Drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleUpload(e.dataTransfer.files[0]);
    }
  };

  // Download Action
  const handleDownload = async (attachment: Attachment) => {
    try {
      await attachmentService.downloadAttachment(attachment.id, attachment.file_name);
      showToast(`Downloaded '${attachment.file_name}'`, 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to download file', 'error');
    }
  };

  // Delete Action
  const handleDeleteConfirm = async () => {
    if (!deletingAttachment) return;
    setDeleteLoading(true);
    try {
      await attachmentService.deleteAttachment(deletingAttachment.id);
      showToast(`Deleted '${deletingAttachment.file_name}'`, 'success');
      setDeletingAttachment(null);
      fetchAttachments();
      if (onAttachmentChange) onAttachmentChange();
    } catch (err: any) {
      showToast(err.message || 'Failed to delete attachment', 'error');
    } finally {
      setDeleteLoading(false);
    }
  };

  // Preview Action for Images
  const handlePreview = async (attachment: Attachment) => {
    const isImg = attachment.mime_type.startsWith('image/') ||
      ['png', 'jpg', 'jpeg', 'webp'].includes(attachment.file_name.split('.').pop()?.toLowerCase() || '');

    if (!isImg) {
      handleDownload(attachment);
      return;
    }

    try {
      const blob = await fetch(`http://localhost:8000/api/attachments/${attachment.id}/download`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('align_token') || ''}`,
        },
      }).then((res) => res.blob());
      const objectUrl = URL.createObjectURL(blob);
      setPreviewImage({ url: objectUrl, title: attachment.file_name });
    } catch (err) {
      handleDownload(attachment);
    }
  };

  // Determine file icon
  const getFileIcon = (file_name: string, mime_type: string) => {
    const ext = file_name.split('.').pop()?.toLowerCase() || '';
    if (ext === 'pdf' || mime_type === 'application/pdf') {
      return <FileText className="w-4 h-4 text-rose-500" />;
    }
    if (['doc', 'docx'].includes(ext)) {
      return <FileText className="w-4 h-4 text-blue-500" />;
    }
    if (['xls', 'xlsx', 'csv'].includes(ext)) {
      return <Table className="w-4 h-4 text-emerald-500" />;
    }
    if (['ppt', 'pptx'].includes(ext)) {
      return <Presentation className="w-4 h-4 text-amber-500" />;
    }
    if (['png', 'jpg', 'jpeg', 'webp'].includes(ext) || mime_type.startsWith('image/')) {
      return <ImageIcon className="w-4 h-4 text-purple-500" />;
    }
    if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) {
      return <Archive className="w-4 h-4 text-amber-600" />;
    }
    return <FileIcon className="w-4 h-4 text-slate-500" />;
  };

  return (
    <div className="space-y-3">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-bold text-theme-main uppercase tracking-wider flex items-center gap-1.5">
          <Paperclip className="w-3.5 h-3.5 text-theme-primary" />
          Attachments ({attachments.length})
        </h4>

        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileChange}
          className="hidden"
          accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.png,.jpg,.jpeg,.webp,.zip"
        />

        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/60 transition cursor-pointer disabled:opacity-50"
        >
          {uploading ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Plus className="w-3.5 h-3.5" />
          )}
          <span>{uploading ? 'Uploading...' : 'Add attachment'}</span>
        </button>
      </div>

      {/* Drag & Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-3 text-center transition cursor-pointer ${
          isDragOver
            ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/30'
            : 'border-theme-border/60 hover:border-blue-400 dark:hover:border-blue-600 bg-theme-bg/50'
        }`}
      >
        <UploadCloud className="w-5 h-5 text-theme-muted mx-auto mb-1 opacity-70" />
        <p className="text-[11px] font-semibold text-theme-main">
          Click or drop files here to upload
        </p>
        <p className="text-[10px] text-theme-muted mt-0.5">
          PDF, Office, images, text, ZIP &bull; Max 10 MB
        </p>
      </div>

      {/* Attachments List */}
      {loading ? (
        <div className="space-y-2 py-1">
          {[1, 2].map((i) => (
            <div key={i} className="h-10 bg-theme-bg animate-pulse rounded-lg" />
          ))}
        </div>
      ) : attachments.length === 0 ? (
        <p className="text-xs text-theme-muted py-2 text-center">No files attached.</p>
      ) : (
        <div className="space-y-2">
          {attachments.map((att) => {
            const isImage = att.mime_type.startsWith('image/') ||
              ['png', 'jpg', 'jpeg', 'webp'].includes(att.file_name.split('.').pop()?.toLowerCase() || '');
            const canDelete = isAdmin || user?.id === att.uploaded_by.id;

            return (
              <div
                key={att.id}
                className="flex items-center justify-between p-2.5 rounded-lg border border-theme-border/60 bg-theme-surface hover:border-theme-border transition group shadow-2xs"
              >
                <div className="flex items-center gap-2.5 min-w-0 pr-2">
                  <div className="p-1.5 rounded-md bg-theme-bg shrink-0">
                    {getFileIcon(att.file_name, att.mime_type)}
                  </div>
                  <div className="min-w-0">
                    <button
                      onClick={() => handlePreview(att)}
                      className="text-xs font-semibold text-theme-main hover:text-blue-600 dark:hover:text-blue-400 transition truncate text-left block"
                      title={att.file_name}
                    >
                      {att.file_name}
                    </button>
                    <p className="text-[10px] text-theme-muted truncate">
                      {formatFileSize(att.file_size)} &bull; Uploaded by {att.uploaded_by.full_name} &bull; {formatDateShort(att.created_at)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  {isImage && (
                    <button
                      onClick={() => handlePreview(att)}
                      className="p-1.5 rounded-md text-theme-muted hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/60 transition"
                      title="Preview Image"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button
                    onClick={() => handleDownload(att)}
                    className="p-1.5 rounded-md text-theme-muted hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/60 transition"
                    title="Download File"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>
                  {canDelete && (
                    <button
                      onClick={() => setDeletingAttachment(att)}
                      className="p-1.5 rounded-md text-theme-muted hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/60 transition"
                      title="Delete Attachment"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={Boolean(deletingAttachment)}
        title="Delete attachment?"
        message={`"${deletingAttachment?.file_name}" will be permanently removed.`}
        confirmLabel="Delete"
        variant="danger"
        loading={deleteLoading}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeletingAttachment(null)}
      />

      {/* Image Preview Modal */}
      {previewImage && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="relative bg-theme-surface border border-theme-border rounded-xl max-w-3xl max-h-[85vh] p-4 flex flex-col items-center overflow-hidden shadow-2xl">
            <div className="w-full flex items-center justify-between pb-2 mb-2 border-b border-theme-border">
              <h3 className="text-xs font-bold text-theme-main truncate">{previewImage.title}</h3>
              <button
                onClick={() => {
                  URL.revokeObjectURL(previewImage.url);
                  setPreviewImage(null);
                }}
                className="p-1 text-theme-muted hover:text-theme-main rounded-md hover:bg-theme-bg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="overflow-auto max-h-[70vh] flex items-center justify-center">
              <img
                src={previewImage.url}
                alt={previewImage.title}
                className="max-w-full max-h-[68vh] object-contain rounded-lg"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
