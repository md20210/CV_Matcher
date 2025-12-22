/**
 * Utility-Funktionen zum Parsen von JSON aus LLM-Antworten
 */

/**
 * Extrahiert und parst JSON aus einer LLM-Antwort
 * @param response - Die Antwort vom LLM
 * @returns Das geparste JSON-Objekt
 * @throws Error wenn kein gültiges JSON gefunden wurde
 */
export function parseJsonResponse(response: string): any {
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

  // Finde JSON-Objekt oder Array in der Antwort
  const jsonMatch = cleaned.match(/[\{\[][\s\S]*[\}\]]/)
  if (!jsonMatch) {
    throw new Error('Kein JSON-Objekt oder Array in der Antwort gefunden')
  }

  try {
    return JSON.parse(jsonMatch[0])
  } catch (error) {
    throw new Error('Ungültiges JSON-Format in der Antwort')
  }
}

/**
 * Versucht JSON zu parsen mit mehreren Strategien
 * @param response - Die Antwort vom LLM
 * @returns Das geparste JSON-Objekt oder null
 */
export function tryParseJson(response: string): any | null {
  try {
    return parseJsonResponse(response)
  } catch (error) {
    console.error('JSON-Parsing fehlgeschlagen:', error)
    return null
  }
}

/**
 * Validiert ob ein String gültiges JSON enthält
 * @param str - Der zu validierende String
 * @returns true wenn gültiges JSON enthalten ist
 */
export function containsValidJson(str: string): boolean {
  try {
    parseJsonResponse(str)
    return true
  } catch (error) {
    return false
  }
}

/**
 * Extrahiert alle JSON-Objekte aus einem String
 * @param str - Der String der JSON enthalten könnte
 * @returns Array von geparsten JSON-Objekten
 */
export function extractAllJson(str: string): any[] {
  const results: any[] = []
  const regex = /\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}/g
  const matches = str.match(regex)

  if (matches) {
    for (const match of matches) {
      try {
        const parsed = JSON.parse(match)
        results.push(parsed)
      } catch (error) {
        // Ignoriere ungültige JSON-Objekte
      }
    }
  }

  return results
}
