import { BFF_BASE, fetchWithRetry, UPLOAD_TIMEOUT_MS, MAX_RETRIES } from './_http';

export class DownloadAPI {
  /** Returns a proxy URL — no token in the URL; the BFF adds auth from the cookie. */
  static getDocumentDownloadUrl(documentId: number): string {
    return `${BFF_BASE}/documents/${documentId}/download`;
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
