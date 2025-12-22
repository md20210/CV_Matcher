import { api } from './api'
import { MatchResult } from '../types/index'

interface LLMGenerateRequest {
  prompt: string
  model?: string
  temperature?: number
  max_tokens?: number
}

interface LLMGenerateResponse {
  response: string
  model: string
  tokens_used?: number
}

class LLMService {
  /**
   * Analysiert die Übereinstimmung zwischen CV und Stellenbeschreibung
   */
  async analyzeMatch(cvText: string, jobDescription: string): Promise<MatchResult> {
    try {
      const prompt = this.buildMatchAnalysisPrompt(cvText, jobDescription)

      const response = await api.post<LLMGenerateResponse>('/llm/generate', {
        prompt,
        temperature: 0.7,
        max_tokens: 2000,
      } as LLMGenerateRequest)

      const matchResult = this.parseMatchResult(response.data.response)
      return matchResult
    } catch (error: any) {
      if (error.response?.data?.detail) {
        const detail = error.response.data.detail
        if (typeof detail === 'string') {
          throw new Error(detail)
        }
      }
      throw new Error('Fehler bei der Analyse. Bitte versuchen Sie es erneut.')
    }
  }

  /**
   * Erstellt den Prompt für die Match-Analyse
   */
  private buildMatchAnalysisPrompt(cvText: string, jobDescription: string): string {
    return `Du bist ein Experte für Personalwesen und CV-Analyse. Analysiere die Übereinstimmung zwischen dem folgenden Lebenslauf und der Stellenbeschreibung.

LEBENSLAUF:
${cvText}

STELLENBESCHREIBUNG:
${jobDescription}

Analysiere die Übereinstimmung und gib deine Antwort als JSON-Objekt mit folgender Struktur zurück:

{
  "overallScore": <Zahl zwischen 0 und 100>,
  "strengths": [<Array von Strings mit den Stärken des Kandidaten für diese Position>],
  "gaps": [<Array von Strings mit fehlenden Qualifikationen oder Lücken>],
  "recommendations": [<Array von Strings mit Empfehlungen zur Verbesserung der Bewerbung>],
  "detailedAnalysis": "<Detaillierte Analyse der Übereinstimmung>"
}

Bewertungskriterien:
- Fachliche Qualifikationen und Fähigkeiten
- Relevante Berufserfahrung
- Ausbildung und Zertifikate
- Soft Skills
- Kulturelle Passung

Gib NUR das JSON-Objekt zurück, ohne zusätzlichen Text davor oder danach.`
  }

  /**
   * Parst die LLM-Antwort und extrahiert das MatchResult
   */
  private parseMatchResult(llmResponse: string): MatchResult {
    try {
      // Versuche JSON direkt zu parsen
      const parsed = this.parseJsonResponse(llmResponse)

      // Validiere die erforderlichen Felder
      if (typeof parsed.overallScore !== 'number') {
        throw new Error('overallScore fehlt oder ist ungültig')
      }

      if (!Array.isArray(parsed.strengths)) {
        throw new Error('strengths fehlt oder ist kein Array')
      }

      if (!Array.isArray(parsed.gaps)) {
        throw new Error('gaps fehlt oder ist kein Array')
      }

      if (!Array.isArray(parsed.recommendations)) {
        throw new Error('recommendations fehlt oder ist kein Array')
      }

      if (typeof parsed.detailedAnalysis !== 'string') {
        throw new Error('detailedAnalysis fehlt oder ist kein String')
      }

      // Stelle sicher, dass der Score im gültigen Bereich liegt
      const overallScore = Math.max(0, Math.min(100, parsed.overallScore))

      return {
        overallScore,
        strengths: parsed.strengths,
        gaps: parsed.gaps,
        recommendations: parsed.recommendations,
        detailedAnalysis: parsed.detailedAnalysis,
      }
    } catch (error: any) {
      console.error('Fehler beim Parsen der LLM-Antwort:', error)
      throw new Error('Die Antwort des LLM konnte nicht verarbeitet werden.')
    }
  }

  /**
   * Extrahiert JSON aus der LLM-Antwort
   */
  private parseJsonResponse(response: string): any {
    // Entferne Markdown-Code-Blöcke falls vorhanden
    let cleaned = response.trim()

    // Entferne ```json und ``` falls vorhanden
    if (cleaned.startsWith('```json')) {
      cleaned = cleaned.substring(7)
    } else if (cleaned.startsWith('```')) {
      cleaned = cleaned.substring(3)
    }

    if (cleaned.endsWith('```')) {
      cleaned = cleaned.substring(0, cleaned.length - 3)
    }

    cleaned = cleaned.trim()

    // Finde JSON-Objekt in der Antwort
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('Kein JSON-Objekt in der Antwort gefunden')
    }

    try {
      return JSON.parse(jsonMatch[0])
    } catch (error) {
      throw new Error('Ungültiges JSON-Format in der Antwort')
    }
  }

  /**
   * Extrahiert strukturierte Informationen aus einem CV
   */
  async extractCVData(cvText: string): Promise<any> {
    try {
      const prompt = `Extrahiere die folgenden Informationen aus diesem Lebenslauf und gib sie als JSON zurück:

LEBENSLAUF:
${cvText}

Gib ein JSON-Objekt mit folgender Struktur zurück:
{
  "name": "<Name der Person>",
  "email": "<E-Mail-Adresse>",
  "phone": "<Telefonnummer>",
  "skills": [<Array von Fähigkeiten>],
  "experience": [
    {
      "title": "<Jobtitel>",
      "company": "<Unternehmen>",
      "duration": "<Zeitraum>",
      "description": "<Beschreibung>"
    }
  ],
  "education": [
    {
      "degree": "<Abschluss>",
      "institution": "<Institution>",
      "year": "<Jahr>"
    }
  ]
}

Gib NUR das JSON-Objekt zurück, ohne zusätzlichen Text.`

      const response = await api.post<LLMGenerateResponse>('/llm/generate', {
        prompt,
        temperature: 0.3,
        max_tokens: 1500,
      } as LLMGenerateRequest)

      return this.parseJsonResponse(response.data.response)
    } catch (error: any) {
      if (error.response?.data?.detail) {
        const detail = error.response.data.detail
        if (typeof detail === 'string') {
          throw new Error(detail)
        }
      }
      throw new Error('Fehler beim Extrahieren der CV-Daten.')
    }
  }

  /**
   * Generiert Verbesserungsvorschläge für einen CV
   */
  async generateCVImprovements(cvText: string, jobDescription?: string): Promise<string[]> {
    try {
      const prompt = jobDescription
        ? `Analysiere diesen Lebenslauf im Kontext der folgenden Stellenbeschreibung und gib konkrete Verbesserungsvorschläge:

LEBENSLAUF:
${cvText}

STELLENBESCHREIBUNG:
${jobDescription}

Gib 5-7 konkrete, umsetzbare Verbesserungsvorschläge als JSON-Array zurück:
["Vorschlag 1", "Vorschlag 2", ...]`
        : `Analysiere diesen Lebenslauf und gib konkrete Verbesserungsvorschläge:

LEBENSLAUF:
${cvText}

Gib 5-7 konkrete, umsetzbare Verbesserungsvorschläge als JSON-Array zurück:
["Vorschlag 1", "Vorschlag 2", ...]`

      const response = await api.post<LLMGenerateResponse>('/llm/generate', {
        prompt,
        temperature: 0.7,
        max_tokens: 1000,
      } as LLMGenerateRequest)

      const parsed = this.parseJsonResponse(response.data.response)
      
      if (!Array.isArray(parsed)) {
        throw new Error('Antwort ist kein Array')
      }

      return parsed
    } catch (error: any) {
      if (error.response?.data?.detail) {
        const detail = error.response.data.detail
        if (typeof detail === 'string') {
          throw new Error(detail)
        }
      }
      throw new Error('Fehler beim Generieren der Verbesserungsvorschläge.')
    }
  }
}

export const llmService = new LLMService()
