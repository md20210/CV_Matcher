import { api } from './api'

export interface BackendDocument {
  id: string
  user_id: string
  project_id?: string
  type: 'pdf' | 'docx' | 'text' | 'url'
  filename?: string
  url?: string
  content: string
  doc_metadata?: Record<string, any>
  created_at: string
  updated_at: string
}

class DocumentService {
  /**
   * Upload PDF or DOCX file to backend
   */
  async uploadFile(file: File, projectId?: string): Promise<BackendDocument> {
    const formData = new FormData()
    formData.append('file', file)
    if (projectId) {
      formData.append('project_id', projectId)
    }

    const response = await api.post<BackendDocument>('/documents/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })

    return response.data
  }

  /**
   * Create document from raw text (for Job Descriptions)
   */
  async uploadText(
    content: string,
    title: string,
    projectId?: string,
    metadata?: Record<string, any>
  ): Promise<BackendDocument> {
    const response = await api.post<BackendDocument>('/documents/text', {
      content,
      title,
      project_id: projectId,
      metadata,
    })

    return response.data
  }

  /**
   * Create document from URL (scrapes content and creates embeddings)
   */
  async uploadUrl(
    url: string,
    projectId?: string,
    metadata?: Record<string, any>
  ): Promise<BackendDocument> {
    const response = await api.post<BackendDocument>('/documents/url', {
      url,
      project_id: projectId,
      metadata,
    })

    return response.data
  }

  /**
   * List all user documents
   */
  async listDocuments(projectId?: string): Promise<BackendDocument[]> {
    const params = projectId ? { project_id: projectId } : {}
    const response = await api.get<BackendDocument[]>('/documents', { params })
    return response.data
  }

  /**
   * Search documents using semantic search
   */
  async searchDocuments(
    query: string,
    projectId?: string,
    limit: number = 5
  ): Promise<BackendDocument[]> {
    const params = {
      query,
      ...(projectId && { project_id: projectId }),
      limit,
    }
    const response = await api.get<BackendDocument[]>('/documents/search', { params })
    return response.data
  }

  /**
   * Get single document by ID
   */
  async getDocument(documentId: string): Promise<BackendDocument> {
    const response = await api.get<BackendDocument>(`/documents/${documentId}`)
    return response.data
  }

  /**
   * Delete document
   */
  async deleteDocument(documentId: string): Promise<void> {
    await api.delete(`/documents/${documentId}`)
  }

  /**
   * Get comprehensive summary of all user documents from vector database
   */
  async getDocumentsSummary(projectId?: string): Promise<{
    total_documents: number
    total_words: number
    total_chars: number
    documents_by_type: Record<string, number>
    documents: Array<{
      id: string
      filename: string
      type: string
      word_count: number
      char_count: number
      content: string
      created_at: string | null
    }>
  }> {
    const params = projectId ? { project_id: projectId } : {}
    const response = await api.get('/documents/summary/all', { params })
    return response.data
  }
}

export const documentService = new DocumentService()
