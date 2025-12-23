import * as pdfjsLib from 'pdfjs-dist'

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`

/**
 * Extrahiert Text aus einer PDF-Datei
 * @param file - Die PDF-Datei als File-Objekt
 * @returns Promise mit dem extrahierten Text
 * @throws Error wenn die PDF-Datei nicht gelesen werden kann
 */
export async function extractTextFromPDF(file: File): Promise<string> {
  try {
    // Validierung: Prüfe ob es eine PDF-Datei ist
    if (!file.type.includes('pdf') && !file.name.toLowerCase().endsWith('.pdf')) {
      throw new Error('Die Datei ist keine gültige PDF-Datei')
    }

    // Datei in ArrayBuffer konvertieren
    const arrayBuffer = await file.arrayBuffer()

    // PDF-Dokument laden
    let pdfDocument: pdfjsLib.PDFDocumentProxy
    try {
      pdfDocument = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
    } catch (error: any) {
      if (error.name === 'PasswordException') {
        throw new Error('Die PDF-Datei ist passwortgeschützt und kann nicht gelesen werden')
      }
      if (error.name === 'InvalidPDFException') {
        throw new Error('Die PDF-Datei ist beschädigt oder hat ein ungültiges Format')
      }
      throw new Error('Die PDF-Datei konnte nicht geladen werden')
    }

    const numPages = pdfDocument.numPages
    const textPages: string[] = []

    // Text von jeder Seite extrahieren
    for (let pageNum = 1; pageNum <= numPages; pageNum++) {
      try {
        const page = await pdfDocument.getPage(pageNum)
        const textContent = await page.getTextContent()

        // Text-Items zu einem String zusammenfügen
        const pageText = textContent.items
          .map((item: any) => {
            // Prüfe ob das Item ein TextItem ist
            if ('str' in item) {
              return item.str
            }
            return ''
          })
          .join(' ')

        textPages.push(pageText)
      } catch (error) {
        console.error(`Fehler beim Lesen von Seite ${pageNum}:`, error)
        // Fahre mit der nächsten Seite fort
        continue
      }
    }

    // Alle Seiten zu einem Text zusammenfügen
    const fullText = textPages.join('\n\n')

    if (!fullText.trim()) {
      throw new Error('Die PDF-Datei enthält keinen lesbaren Text')
    }

    return fullText.trim()
  } catch (error: any) {
    if (error instanceof Error) {
      throw error
    }
    throw new Error('Ein unerwarteter Fehler ist beim Lesen der PDF-Datei aufgetreten')
  }
}

/**
 * Validiert ob eine Datei eine PDF ist
 * @param file - Die zu validierende Datei
 * @returns true wenn die Datei eine PDF ist
 */
export function isPDFFile(file: File): boolean {
  return file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')
}

/**
 * Extrahiert Metadaten aus einer PDF-Datei
 * @param file - Die PDF-Datei
 * @returns Promise mit den Metadaten
 */
export async function extractPDFMetadata(
  file: File
): Promise<{
  title?: string
  author?: string
  subject?: string
  creator?: string
  producer?: string
  creationDate?: Date
  modificationDate?: Date
  numPages: number
}> {
  try {
    const arrayBuffer = await file.arrayBuffer()
    const pdfDocument = await pdfjsLib.getDocument({ data: arrayBuffer }).promise

    const metadata = await pdfDocument.getMetadata()
    const info = metadata.info as any

    return {
      title: info.Title || undefined,
      author: info.Author || undefined,
      subject: info.Subject || undefined,
      creator: info.Creator || undefined,
      producer: info.Producer || undefined,
      creationDate: info.CreationDate ? new Date(info.CreationDate) : undefined,
      modificationDate: info.ModDate ? new Date(info.ModDate) : undefined,
      numPages: pdfDocument.numPages,
    }
  } catch (error) {
    throw new Error('Metadaten konnten nicht extrahiert werden')
  }
}
