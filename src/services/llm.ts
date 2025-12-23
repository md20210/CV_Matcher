import { api } from './api'
import { MatchResult } from '../types/index'

interface LLMGenerateRequest {
  prompt: string
  provider?: string
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
  async analyzeMatch(cvText: string, jobDescription: string, llmType: 'local' | 'grok' = 'local', language: 'de' | 'en' | 'es' = 'de'): Promise<MatchResult> {
    try {
      const prompt = this.buildMatchAnalysisPrompt(cvText, jobDescription, language)

      const response = await api.post<LLMGenerateResponse>('/llm/generate', {
        prompt,
        provider: llmType === 'grok' ? 'grok' : 'ollama',
        model: llmType === 'grok' ? 'grok-3' : 'qwen2.5:3b',
        temperature: 0.3,
        max_tokens: 3000,
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
   * Erstellt den Prompt für die Match-Analyse in der gewählten Sprache
   */
  private buildMatchAnalysisPrompt(cvText: string, jobDescription: string, language: 'de' | 'en' | 'es'): string {
    const prompts = {
      de: this.buildGermanPrompt(cvText, jobDescription),
      en: this.buildEnglishPrompt(cvText, jobDescription),
      es: this.buildSpanishPrompt(cvText, jobDescription)
    };

    return prompts[language];
  }

  private buildGermanPrompt(cvText: string, jobDescription: string): string {
    return `Du bist ein erfahrener HR-Analyst. Analysiere gründlich die Übereinstimmung zwischen dieser Stellenbeschreibung und dem Bewerber-CV.

STELLENBESCHREIBUNG:
${jobDescription.substring(0, 2000)}

LEBENSLAUF:
${cvText.substring(0, 2000)}

ANALYSIERE FOLGENDE ASPEKTE DETAILLIERT:

1. **Fachliche Qualifikationen**: Vergleiche jede Anforderung mit den Skills/Erfahrungen im CV
2. **Berufserfahrung**: Jahre, Branchen, Verantwortungsbereiche, Führungserfahrung
3. **Technische Skills**: Programmiersprachen, Frameworks, Tools, Zertifizierungen
4. **Soft Skills**: Teamfähigkeit, Kommunikation, Problemlösung (aus Projekten ableitbar)
5. **Kulturelle Passung**: Branchenerfahrung, Unternehmenstypen (Startup vs. Konzern)
6. **Entwicklungspotenzial**: Lernbereitschaft, Weiterbildungen, Karriereprogression

BEWERTUNGS-RICHTLINIEN:
- **overallScore**: 0-100%, basierend auf gewichteter Übereinstimmung aller Anforderungen
- **strengths**: Mindestens 5 konkrete Stärken mit Belegen aus dem CV
- **gaps**: Mindestens 3 identifizierte Lücken oder fehlende Qualifikationen
- **recommendations**: 3-5 konkrete, umsetzbare Empfehlungen (Weiterbildung, Training, Erfahrung sammeln)
- **detailedAnalysis**: 3-5 Absätze mit tiefgehender Analyse (Warum der Score? Welche Faktoren? Zukunftspotenzial?)
- **comparison**: ALLE Hauptanforderungen einzeln bewerten (mindestens 8 Items!)
  - requirement: Exakte Anforderung aus Stellenbeschreibung
  - applicant_match: Konkrete Qualifikation/Erfahrung aus CV
  - details: Detaillierte Begründung der Bewertung (1-2 Sätze!)
  - match_level: "full" (100% erfüllt), "partial" (teilweise), "missing" (nicht vorhanden)
  - confidence: 0-100% wie sicher die Bewertung ist

KRITISCH WICHTIG:
- VERWENDE NUR ECHTE DATEN AUS DEN DOKUMENTEN OBEN!
- ERFINDE KEINE INFORMATIONEN!
- ERSETZE ALLE PLATZHALTER MIT ECHTEN FAKTEN!
- SCHREIBE NIEMALS PLATZHALTER WIE "[...]" IN DIE ANTWORT!
- WENN ETWAS NICHT IM CV STEHT, SCHREIBE "Nicht im CV erwähnt"

BEISPIEL FÜR STRENGTHS (VERWENDE ECHTE DATEN AUS DEM CV!):
RICHTIG: "10+ Jahre Erfahrung in KI/ML bei IBM und Microsoft (2010-2023)"
FALSCH: "[Echte Stärke aus CV mit konkreten Jahren/Projekten]"

GIB NUR DIESES JSON-FORMAT ZURÜCK:
{
  "overallScore": 75,
  "strengths": [
    "Erste echte Stärke mit konkreten Jahren, Unternehmen oder Projekten aus dem CV",
    "Zweite echte Stärke mit messbaren Erfolgen aus dem CV",
    "Dritte echte Stärke - spezifische Technologie-Kenntnisse aus dem CV",
    "Vierte echte Stärke - konkrete Führungserfahrung mit Teamgröße",
    "Fünfte echte Stärke - relevante Zertifikate oder Ausbildungen"
  ],
  "gaps": [
    "Erste fehlende Qualifikation basierend auf Stellenanforderung",
    "Zweite fehlende Qualifikation - was im Job gefordert aber nicht im CV",
    "Dritte fehlende Qualifikation - Skill-Lücke im Vergleich"
  ],
  "recommendations": [
    "Erste konkrete Empfehlung zum Schließen einer Lücke",
    "Zweite Empfehlung - spezifische Weiterbildung oder Training",
    "Dritte Empfehlung - Erfahrung sammeln in fehlendem Bereich"
  ],
  "detailedAnalysis": "Mehrere Absätze mit detaillierter Analyse. VERWENDE ECHTE UNTERNEHMENSNAMEN, ECHTE JAHRE, ECHTE PROJEKTE AUS DEM CV. Mindestens 300 Wörter.",
  "comparison": [
    {
      "requirement": "Exakte Anforderung 1 kopiert aus Stellenbeschreibung",
      "applicant_match": "Was WIRKLICH im CV dazu steht - mit echten Jahren/Unternehmen/Skills",
      "details": "Konkrete Begründung mit echten Daten warum full/partial/missing",
      "match_level": "full",
      "confidence": 95
    },
    {
      "requirement": "Exakte Anforderung 2 kopiert aus Stellenbeschreibung",
      "applicant_match": "Konkrete Erfahrung aus CV oder 'Nicht im CV erwähnt'",
      "details": "Begründung mit echten Fakten aus den Dokumenten",
      "match_level": "partial",
      "confidence": 80
    }
  ]
}

WICHTIG:
- match_level NUR: "full", "partial" oder "missing"
- Mindestens 8 comparison items (ALLE Hauptanforderungen einzeln!)
- detailedAnalysis mindestens 300 Wörter
- Alle Texte auf Deutsch
- NUR JSON zurückgeben, kein zusätzlicher Text

JSON:`
  }

  private buildEnglishPrompt(cvText: string, jobDescription: string): string {
    return `You are an experienced HR analyst. Thoroughly analyze the match between this job description and the candidate's CV.

JOB DESCRIPTION:
${jobDescription.substring(0, 2000)}

RESUME/CV:
${cvText.substring(0, 2000)}

ANALYZE THE FOLLOWING ASPECTS IN DETAIL:

1. **Technical Qualifications**: Compare each requirement with skills/experience in the CV
2. **Work Experience**: Years, industries, areas of responsibility, leadership experience
3. **Technical Skills**: Programming languages, frameworks, tools, certifications
4. **Soft Skills**: Teamwork, communication, problem-solving (derived from projects)
5. **Cultural Fit**: Industry experience, company types (startup vs. corporation)
6. **Development Potential**: Learning willingness, training, career progression

EVALUATION GUIDELINES:
- **overallScore**: 0-100%, based on weighted match of all requirements
- **strengths**: At least 5 concrete strengths with evidence from the CV
- **gaps**: At least 3 identified gaps or missing qualifications
- **recommendations**: 3-5 concrete, actionable recommendations (training, education, gaining experience)
- **detailedAnalysis**: 3-5 paragraphs with in-depth analysis (Why this score? Which factors? Future potential?)
- **comparison**: Evaluate ALL main requirements individually (at least 8 items!)
  - requirement: Exact requirement from job description
  - applicant_match: Concrete qualification/experience from CV
  - details: Detailed justification of the assessment (1-2 sentences!)
  - match_level: "full" (100% met), "partial" (partially), "missing" (not present)
  - confidence: 0-100% how certain the assessment is

CRITICALLY IMPORTANT:
- USE ONLY REAL DATA FROM THE DOCUMENTS ABOVE!
- DO NOT INVENT INFORMATION!
- REPLACE ALL PLACEHOLDERS WITH REAL FACTS!
- NEVER WRITE PLACEHOLDERS LIKE "[...]" IN THE ANSWER!
- IF SOMETHING IS NOT IN THE CV, WRITE "Not mentioned in CV"

RETURN ONLY THIS JSON FORMAT:
{
  "overallScore": 75,
  "strengths": [
    "First real strength with concrete years, companies or projects from the CV",
    "Second real strength with measurable successes from the CV",
    "Third real strength - specific technology knowledge from the CV",
    "Fourth real strength - concrete leadership experience with team size",
    "Fifth real strength - relevant certificates or education"
  ],
  "gaps": [
    "First missing qualification based on job requirement",
    "Second missing qualification - what's required in job but not in CV",
    "Third missing qualification - skill gap in comparison"
  ],
  "recommendations": [
    "First concrete recommendation to close a gap",
    "Second recommendation - specific training or education",
    "Third recommendation - gain experience in missing area"
  ],
  "detailedAnalysis": "Several paragraphs with detailed analysis. USE REAL COMPANY NAMES, REAL YEARS, REAL PROJECTS FROM THE CV. At least 300 words.",
  "comparison": [
    {
      "requirement": "Exact requirement 1 copied from job description",
      "applicant_match": "What's REALLY in the CV about this - with real years/companies/skills",
      "details": "Concrete justification with real data why full/partial/missing",
      "match_level": "full",
      "confidence": 95
    }
  ]
}

IMPORTANT:
- match_level ONLY: "full", "partial" or "missing"
- At least 8 comparison items (ALL main requirements individually!)
- detailedAnalysis at least 300 words
- All texts in English
- ONLY return JSON, no additional text

JSON:`
  }

  private buildSpanishPrompt(cvText: string, jobDescription: string): string {
    return `Eres un analista de recursos humanos experimentado. Analiza detalladamente la coincidencia entre esta descripción del puesto y el CV del candidato.

DESCRIPCIÓN DEL PUESTO:
${jobDescription.substring(0, 2000)}

CURRÍCULUM:
${cvText.substring(0, 2000)}

ANALIZA LOS SIGUIENTES ASPECTOS EN DETALLE:

1. **Cualificaciones Técnicas**: Compara cada requisito con las habilidades/experiencia en el CV
2. **Experiencia Laboral**: Años, industrias, áreas de responsabilidad, experiencia de liderazgo
3. **Habilidades Técnicas**: Lenguajes de programación, frameworks, herramientas, certificaciones
4. **Habilidades Blandas**: Trabajo en equipo, comunicación, resolución de problemas (derivadas de proyectos)
5. **Ajuste Cultural**: Experiencia en la industria, tipos de empresa (startup vs. corporación)
6. **Potencial de Desarrollo**: Disposición para aprender, formación, progresión profesional

DIRECTRICES DE EVALUACIÓN:
- **overallScore**: 0-100%, basado en coincidencia ponderada de todos los requisitos
- **strengths**: Al menos 5 fortalezas concretas con evidencia del CV
- **gaps**: Al menos 3 brechas identificadas o cualificaciones faltantes
- **recommendations**: 3-5 recomendaciones concretas y accionables (formación, educación, ganar experiencia)
- **detailedAnalysis**: 3-5 párrafos con análisis en profundidad (¿Por qué esta puntuación? ¿Qué factores? ¿Potencial futuro?)
- **comparison**: Evalúa TODOS los requisitos principales individualmente (¡al menos 8 elementos!)
  - requirement: Requisito exacto de la descripción del puesto
  - applicant_match: Cualificación/experiencia concreta del CV
  - details: Justificación detallada de la evaluación (¡1-2 frases!)
  - match_level: "full" (100% cumplido), "partial" (parcialmente), "missing" (no presente)
  - confidence: 0-100% qué tan segura es la evaluación

CRÍTICAMENTE IMPORTANTE:
- ¡USA SOLO DATOS REALES DE LOS DOCUMENTOS ARRIBA!
- ¡NO INVENTES INFORMACIÓN!
- ¡REEMPLAZA TODOS LOS MARCADORES CON HECHOS REALES!
- ¡NUNCA ESCRIBAS MARCADORES COMO "[...]" EN LA RESPUESTA!
- SI ALGO NO ESTÁ EN EL CV, ESCRIBE "No mencionado en el CV"

DEVUELVE SOLO ESTE FORMATO JSON:
{
  "overallScore": 75,
  "strengths": [
    "Primera fortaleza real con años concretos, empresas o proyectos del CV",
    "Segunda fortaleza real con éxitos medibles del CV",
    "Tercera fortaleza real - conocimiento tecnológico específico del CV",
    "Cuarta fortaleza real - experiencia de liderazgo concreta con tamaño del equipo",
    "Quinta fortaleza real - certificados o educación relevante"
  ],
  "gaps": [
    "Primera cualificación faltante basada en requisito del puesto",
    "Segunda cualificación faltante - lo que se requiere en el puesto pero no en el CV",
    "Tercera cualificación faltante - brecha de habilidades en comparación"
  ],
  "recommendations": [
    "Primera recomendación concreta para cerrar una brecha",
    "Segunda recomendación - formación o educación específica",
    "Tercera recomendación - ganar experiencia en área faltante"
  ],
  "detailedAnalysis": "Varios párrafos con análisis detallado. USA NOMBRES REALES DE EMPRESAS, AÑOS REALES, PROYECTOS REALES DEL CV. Al menos 300 palabras.",
  "comparison": [
    {
      "requirement": "Requisito exacto 1 copiado de la descripción del puesto",
      "applicant_match": "Lo que REALMENTE está en el CV sobre esto - con años/empresas/habilidades reales",
      "details": "Justificación concreta con datos reales por qué full/partial/missing",
      "match_level": "full",
      "confidence": 95
    }
  ]
}

IMPORTANTE:
- match_level SOLO: "full", "partial" o "missing"
- Al menos 8 elementos de comparación (¡TODOS los requisitos principales individualmente!)
- detailedAnalysis al menos 300 palabras
- Todos los textos en español
- SOLO devuelve JSON, sin texto adicional

JSON:`
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

      // Erweiterte Felder sind optional
      const result: MatchResult = {
        overallScore,
        strengths: parsed.strengths,
        gaps: parsed.gaps,
        recommendations: parsed.recommendations,
        detailedAnalysis: parsed.detailedAnalysis,
      }

      // Füge optionale erweiterte Felder hinzu wenn vorhanden
      if (parsed.comparison && Array.isArray(parsed.comparison) && parsed.comparison.length > 0) {
        result.comparison = parsed.comparison
      }

      if (parsed.riskAssessment && typeof parsed.riskAssessment === 'object') {
        result.riskAssessment = parsed.riskAssessment
      }

      if (parsed.developmentPotential && typeof parsed.developmentPotential === 'object') {
        result.developmentPotential = parsed.developmentPotential
      }

      return result
    } catch (error: any) {
      console.error('Fehler beim Parsen der LLM-Antwort:', error)
      throw new Error('Die Antwort des LLM konnte nicht verarbeitet werden.')
    }
  }

  /**
   * Extrahiert JSON aus der LLM-Antwort mit robuster Fehlerbehandlung
   * Basiert auf bewährter cvmatcher-Implementierung
   */
  private parseJsonResponse(response: string): any {
    console.log('DEBUG parseJsonResponse - Input length:', response.length)
    console.log('DEBUG parseJsonResponse - First 200 chars:', response.substring(0, 200))

    try {
      // Entferne Markdown-Code-Blöcke falls vorhanden
      let cleaned = response.trim()

      if (cleaned.includes('```json')) {
        const start = cleaned.indexOf('```json') + 7
        const end = cleaned.indexOf('```', start)
        cleaned = end > start ? cleaned.substring(start, end) : cleaned.substring(start)
        console.log('DEBUG: Extracted from ```json block')
      } else if (cleaned.includes('```')) {
        const start = cleaned.indexOf('```') + 3
        const end = cleaned.indexOf('```', start)
        cleaned = end > start ? cleaned.substring(start, end) : cleaned.substring(start)
        console.log('DEBUG: Extracted from ``` block')
      }

      cleaned = cleaned.trim()

      // Entferne trailing commas (häufiger LLM-Fehler)
      cleaned = cleaned.replace(/,(\s*[}\]])/g, '$1')

      console.log('DEBUG: Cleaned text length:', cleaned.length)

      // Finde das erste vollständige JSON-Objekt
      let braceCount = 0
      let jsonEnd = -1
      for (let i = 0; i < cleaned.length; i++) {
        if (cleaned[i] === '{') {
          braceCount++
        } else if (cleaned[i] === '}') {
          braceCount--
          if (braceCount === 0) {
            jsonEnd = i + 1
            break
          }
        }
      }

      if (jsonEnd > 0 && jsonEnd < cleaned.length) {
        cleaned = cleaned.substring(0, jsonEnd)
        console.log('DEBUG: Truncated to first complete JSON object')
      }

      // Versuche JSON zu parsen
      const result = JSON.parse(cleaned)
      console.log('DEBUG: JSON parsed successfully')

      // Fixe common LLM mistakes: Convert object arrays to string arrays
      if (result.strengths && Array.isArray(result.strengths)) {
        result.strengths = result.strengths.map((item: any) =>
          typeof item === 'object' && item.name ? item.name : String(item)
        )
      }

      if (result.gaps && Array.isArray(result.gaps)) {
        result.gaps = result.gaps.map((item: any) =>
          typeof item === 'object' && item.name ? item.name : String(item)
        )
      }

      if (result.recommendations && Array.isArray(result.recommendations)) {
        result.recommendations = result.recommendations.map((item: any) =>
          typeof item === 'object' && item.name ? item.name : String(item)
        )
      }

      return result

    } catch (error: any) {
      console.error('ERROR: JSON parsing failed:', error.message)

      // Versuche JSON-Reparatur
      console.log('Attempting to repair JSON...')

      try {
        let repaired = response.trim()

        // Extrahiere aus Code-Blöcken
        if (repaired.includes('```')) {
          const start = repaired.indexOf('{')
          const lastBrace = repaired.lastIndexOf('}')
          if (start >= 0 && lastBrace > start) {
            repaired = repaired.substring(start, lastBrace + 1)
          }
        }

        // Repariere häufige Fehler
        repaired = repaired.replace(/,(\s*[}\]])/g, '$1') // Trailing commas
        repaired = repaired.replace(/"\s*\n\s*"/g, '",\n    "') // Missing commas between strings
        repaired = repaired.replace(/"\s*\n\s*"(\w+)":/g, '",\n    "$1":') // Missing commas before properties
        repaired = repaired.replace(/(\d)\s*\n\s*"/g, '$1,\n    "') // Missing commas after numbers
        repaired = repaired.replace(/\}\s*\n\s*"/g, '},\n    "') // Missing commas after }
        repaired = repaired.replace(/\]\s*\n\s*"/g, '],\n    "') // Missing commas after ]

        const repairedResult = JSON.parse(repaired)
        console.log('JSON repair successful!')

        // Apply object→string array fixes
        if (repairedResult.strengths && Array.isArray(repairedResult.strengths)) {
          repairedResult.strengths = repairedResult.strengths.map((item: any) =>
            typeof item === 'object' && item.name ? item.name : String(item)
          )
        }
        if (repairedResult.gaps && Array.isArray(repairedResult.gaps)) {
          repairedResult.gaps = repairedResult.gaps.map((item: any) =>
            typeof item === 'object' && item.name ? item.name : String(item)
          )
        }
        if (repairedResult.recommendations && Array.isArray(repairedResult.recommendations)) {
          repairedResult.recommendations = repairedResult.recommendations.map((item: any) =>
            typeof item === 'object' && item.name ? item.name : String(item)
          )
        }

        return repairedResult

      } catch (repairError) {
        console.error('ERROR: JSON repair failed. Full text:', response.substring(0, 500))

        // Fallback: Wenn kein JSON gefunden, erstelle ein Default-Objekt
        console.warn('Using fallback object due to parse failure')
        return {
          overallScore: 50,
          strengths: ['Allgemeine Qualifikationen vorhanden'],
          gaps: ['Detaillierte Analyse nicht möglich - JSON Parse Fehler'],
          recommendations: ['Das Modell konnte kein valides JSON erzeugen. Bitte versuchen Sie es erneut.'],
          detailedAnalysis: `Die KI konnte keine detaillierte Analyse durchführen. LLM-Antwort: ${response.substring(0, 300)}...`
        }
      }
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

  /**
   * Generiert Text basierend auf einem Prompt (für CV-Regenerierung)
   */
  async generateText(
    prompt: string,
    llmType: 'local' | 'grok' = 'local',
    options?: { max_tokens?: number; temperature?: number }
  ): Promise<string> {
    try {
      const response = await api.post<LLMGenerateResponse>('/llm/generate', {
        prompt,
        provider: llmType === 'grok' ? 'grok' : 'ollama',
        model: llmType === 'grok' ? 'grok-3' : 'qwen2.5:3b',
        temperature: options?.temperature ?? 0.7,
        max_tokens: options?.max_tokens ?? 2000,
      } as LLMGenerateRequest)

      return response.data.response
    } catch (error: any) {
      if (error.response?.data?.detail) {
        const detail = error.response.data.detail
        if (typeof detail === 'string') {
          throw new Error(detail)
        }
      }
      throw new Error('Fehler beim Generieren des Textes.')
    }
  }
}

export const llmService = new LLMService()
