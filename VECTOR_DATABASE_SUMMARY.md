# Vector Database Summary Feature

## Overview
This feature provides a comprehensive summary view of all documents stored in the vector database for both employer and applicant document sections.

## Feature Location
- **Component**: `src/components/DocumentSection.tsx`
- **Button**: Located below the document list in each document section (Employer/Applicant)
- **Button Text**: "📊 Zusammenfassung aus Vektordatenbank" (DE) / "📊 Summary from Vector Database" (EN/ES)

## Functionality

### Summary Button
- Only appears when there is at least one document uploaded
- Purple-to-indigo gradient styling for visual distinction
- Database icon (📊) for easy identification

### Summary Modal
When clicked, the button opens a modal displaying:

1. **Statistics Section** (3 cards):
   - Total Documents count
   - Total Words count (formatted with locale separators)
   - Total Characters count (formatted with locale separators)

2. **Document Details Section**:
   - List of all documents with:
     - Document name
     - Word count per document
     - Character count per document

3. **Full Content Section**:
   - Combined content from all documents
   - Scrollable view (max-height: 384px)
   - Monospace font for better readability
   - Pre-wrapped text format

## Implementation Details

### Frontend (React/TypeScript)
```typescript
// State
const [showSummary, setShowSummary] = useState(false);

// Summary generator function
const generateSummary = () => {
  if (docs.length === 0) return '';

  const totalContent = docs.map(d => d.content).join('\n\n');
  const totalWords = totalContent.split(/\s+/).length;
  const totalChars = totalContent.length;

  return {
    totalDocs: docs.length,
    totalWords,
    totalChars,
    fullContent: totalContent,
    documents: docs.map(d => ({
      name: d.name,
      type: d.type,
      wordCount: d.content.split(/\s+/).length,
      charCount: d.content.length
    }))
  };
};
```

### Translation Keys
Added to `backend/services/translation_service.py`:

```python
"doc_summary_button": {
    "de": "📊 Zusammenfassung aus Vektordatenbank",
    "en": "📊 Summary from Vector Database",
    "es": "📊 Resumen de Base de Datos Vectorial"
},
"doc_summary_title": {
    "de": "Zusammenfassung aus Vektordatenbank",
    "en": "Summary from Vector Database",
    "es": "Resumen de Base de Datos Vectorial"
},
"doc_summary_loading": {
    "de": "Generiere Zusammenfassung...",
    "en": "Generating summary...",
    "es": "Generando resumen..."
},
"doc_summary_total_docs": {
    "de": "Dokumente gesamt",
    "en": "Total documents",
    "es": "Documentos totales"
},
"doc_summary_total_content": {
    "de": "Gesamtinhalt",
    "en": "Total content",
    "es": "Contenido total"
},
"doc_summary_words": {
    "de": "Wörter",
    "en": "words",
    "es": "palabras"
}
```

## User Flow

1. User uploads one or more documents to either the Employer or Applicant section
2. Summary button appears below the document list
3. User clicks the "📊 Zusammenfassung aus Vektordatenbank" button
4. Modal opens showing:
   - Quick statistics at the top
   - Detailed document breakdown in the middle
   - Full combined content at the bottom
5. User can review all data that will be used for vector search and matching
6. User closes modal by:
   - Clicking the X button in the header
   - Clicking the "Schließen" (Close) button in the footer
   - Clicking outside the modal

## Benefits

1. **Transparency**: Users can see exactly what data is stored in the vector database
2. **Verification**: Helps verify that document content was correctly extracted and stored
3. **Debugging**: Useful for troubleshooting if matching results seem incorrect
4. **Data Review**: Quick overview of total content volume before running analysis

## Technical Notes

- In-memory implementation (no backend API call required)
- Real-time calculation based on current document state
- Responsive design with max-width and scrolling for large content
- Gradient styling matches the document section color scheme
- Supports all three languages (DE/EN/ES)

## Future Enhancements

Possible improvements:
- Export summary as PDF or text file
- Show embedding metadata (vector dimensions, chunking info)
- Display similarity scores between documents
- Add search/filter functionality within summary
- Show timestamp of when documents were added
