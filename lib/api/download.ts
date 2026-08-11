import { BFF_BASE, fetchWithRetry, UPLOAD_TIMEOUT_MS, MAX_RETRIES } from './_http';

export class DownloadAPI {
  /**
   * Raw backend URL — not directly loadable (e.g. as an iframe `src`) since
   * the endpoint requires the Bearer token that only `fetchWithRetry` attaches.
   * Kept for reference/debugging; use `getDocumentPreviewBlobUrl` to preview.
   */
  static getDocumentDownloadUrl(documentId: number): string {
    return `${BFF_BASE}/documents/${documentId}/download`;
  }

  /**
   * Fetches the document with auth and returns a blob object URL suitable for
   * an `<iframe src>` preview. Caller owns the URL and must revoke it
   * (`URL.revokeObjectURL`) once the preview is no longer shown.
   */
  static async getDocumentPreviewBlobUrl(documentId: number): Promise<string> {
    const response = await fetchWithRetry(
      `${BFF_BASE}/documents/${documentId}/download`,
      {},
      MAX_RETRIES,
      UPLOAD_TIMEOUT_MS,
    );

    if (!response.ok) throw new Error('Failed to load document preview');

    const blob = await response.blob();

    // The download endpoint serves application/octet-stream, which the browser
    // offers to save rather than rendering inline. Re-type the blob so the
    // built-in PDF viewer picks it up. Callers only preview PDFs.
    const pdfBlob =
      blob.type === 'application/pdf'
        ? blob
        : new Blob([blob], { type: 'application/pdf' });

    return window.URL.createObjectURL(pdfBlob);
  }

  static async downloadDocument(documentId: number, filename?: string): Promise<void> {
    const response = await fetchWithRetry(
      `${BFF_BASE}/documents/${documentId}/download`,
      {},
      MAX_RETRIES,
      UPLOAD_TIMEOUT_MS,
    );

    if (!response.ok) throw new Error('Failed to download document');

    const blob = await response.blob();
    const url  = window.URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = filename || `document_${documentId}`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  }
}
