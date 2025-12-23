import { api } from './api'
import { Document } from '../types/index'

export interface CreateTextDocumentRequest {
  project_id?: string
  title: string
  content: string
  metadata?: Record<string, any>
}

export interface DocumentListResponse {
  documents: Document[]
}

class DocumentsService {
  /**
   * Erstellt ein Textdokument
   * @param projectId - Projekt-ID (optional)
   * @param title - Dokumententitel
   * @param content - Dokumenteninhalt
   * @param metadata - Metadaten (optional)
   * @returns Promise mit dem erstellten Dokument
   */
  async createTextDocument(
    projectId: string | undefined,
    title: string,
    content: string,
    metadata?: Record<string, any>
  ): Promise<Document> {
    try {
      const response = await api.post<Document>('/documents/text', {
        project_id: projectId,
        title,
        content,
        metadata,
      } as CreateTextDocumentRequest)
      
      return response.data
    } catch (error) {
      throw new Error(`Fehler beim Erstellen des Dokuments: ${error}`)
    }
  }

  /**
   * Listet alle Dokumente eines Projekts oder alle Dokumente
   * @param projectId - Projekt-ID (optional)
   * @returns Promise mit Liste der Dokumente
   */
  async listDocuments(projectId?: string): Promise<Document[]> {
    try {
      const params = projectId ? { project_id: projectId } : {}
      const response = await api.get<DocumentListResponse>('/documents', { params })
      
      return response.data.documents
    } catch (error) {
      throw new Error(`Fehler beim Abrufen der Dokumente: ${error}`)
    }
  }

  /**
   * Löscht ein Dokument
   * @param id - Dokument-ID
   * @returns Promise<void>
   */
  async deleteDocument(id: string): Promise<void> {
    try {
      await api.delete(`/documents/${id}`)
    } catch (error) {
      throw new Error(`Fehler beim Löschen des Dokuments: ${error}`)
    }
  }
}

export const documentsService = new DocumentsService()
