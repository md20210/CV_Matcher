import { api } from './api'
import { Project } from '../types/index'

interface CreateProjectRequest {
  name: string
  type: string
  description?: string
}

interface UpdateProjectRequest {
  name?: string
  type?: string
  description?: string
}

class ProjectsService {
  async createProject(
    name: string,
    type: string,
    description?: string
  ): Promise<Project> {
    try {
      const response = await api.post<Project>('/projects', {
        name,
        type,
        description,
      } as CreateProjectRequest)
      return response.data
    } catch (error: any) {
      if (error.response?.data?.detail) {
        const detail = error.response.data.detail
        if (typeof detail === 'string') {
          throw new Error(detail)
        } else if (Array.isArray(detail)) {
          const messages = detail.map((err: any) => err.msg).join(', ')
          throw new Error(messages)
        }
      }
      throw new Error('Projekt konnte nicht erstellt werden.')
    }
  }

  async listProjects(): Promise<Project[]> {
    try {
      const response = await api.get<Project[]>('/projects')
      return response.data
    } catch (error: any) {
      if (error.response?.data?.detail) {
        const detail = error.response.data.detail
        if (typeof detail === 'string') {
          throw new Error(detail)
        }
      }
      throw new Error('Projekte konnten nicht geladen werden.')
    }
  }

  async getProject(id: string): Promise<Project> {
    try {
      const response = await api.get<Project>(`/projects/${id}`)
      return response.data
    } catch (error: any) {
      if (error.response?.status === 404) {
        throw new Error('Projekt nicht gefunden.')
      }
      if (error.response?.data?.detail) {
        const detail = error.response.data.detail
        if (typeof detail === 'string') {
          throw new Error(detail)
        }
      }
      throw new Error('Projekt konnte nicht geladen werden.')
    }
  }

  async updateProject(
    id: string,
    data: { name?: string; type?: string; description?: string }
  ): Promise<Project> {
    try {
      const response = await api.patch<Project>(
        `/projects/${id}`,
        data as UpdateProjectRequest
      )
      return response.data
    } catch (error: any) {
      if (error.response?.status === 404) {
        throw new Error('Projekt nicht gefunden.')
      }
      if (error.response?.data?.detail) {
        const detail = error.response.data.detail
        if (typeof detail === 'string') {
          throw new Error(detail)
        } else if (Array.isArray(detail)) {
          const messages = detail.map((err: any) => err.msg).join(', ')
          throw new Error(messages)
        }
      }
      throw new Error('Projekt konnte nicht aktualisiert werden.')
    }
  }

  async deleteProject(id: string): Promise<void> {
    try {
      await api.delete(`/projects/${id}`)
    } catch (error: any) {
      if (error.response?.status === 404) {
        throw new Error('Projekt nicht gefunden.')
      }
      if (error.response?.data?.detail) {
        const detail = error.response.data.detail
        if (typeof detail === 'string') {
          throw new Error(detail)
        }
      }
      throw new Error('Projekt konnte nicht gelöscht werden.')
    }
  }
}

export const projectsService = new ProjectsService()
