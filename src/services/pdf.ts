/**
 * PDF Report Generation Service
 */
import { api } from './api';
import { ChatMessage } from './chat';

export interface GeneratePDFRequest {
  match_result: any;
  chat_history?: Array<{
    role: string;
    content: string;
    timestamp: string;
  }>;
}

class PDFService {
  /**
   * Generate PDF report for CV match analysis
   * @param matchResult Match analysis result from LLM
   * @param chatMessages Optional chat conversation history
   */
  async generateReport(
    matchResult: any,
    chatMessages?: ChatMessage[]
  ): Promise<Blob> {
    // Convert ChatMessage[] to API format
    const chat_history = chatMessages?.map((msg) => ({
      role: msg.role,
      content: msg.content,
      timestamp: msg.timestamp.toISOString(),
    }));

    const request: GeneratePDFRequest = {
      match_result: matchResult,
      chat_history,
    };

    const response = await api.post('/reports/generate', request, {
      responseType: 'blob', // Important: Tell axios to expect binary data
    });

    return response.data as Blob;
  }

  /**
   * Download PDF report as file
   * @param matchResult Match analysis result
   * @param chatMessages Optional chat messages
   * @param filename Optional custom filename
   */
  async downloadReport(
    matchResult: any,
    chatMessages?: ChatMessage[],
    filename: string = 'cv_match_report.pdf'
  ): Promise<void> {
    try {
      const blob = await this.generateReport(matchResult, chatMessages);

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();

      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error: any) {
      console.error('❌ PDF download failed:', error);
      throw new Error(
        error.response?.data?.detail || 'PDF-Download fehlgeschlagen'
      );
    }
  }
}

export const pdfService = new PDFService();
