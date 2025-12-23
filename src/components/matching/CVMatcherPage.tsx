import React, { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { CVUpload } from '../upload/CVUpload'
import { JobDescriptionInput } from '../upload/JobDescriptionInput'
import MatchResults from './MatchResults'
import { useAuth } from '../../hooks/useAuth'
import { projectsService } from '../../services/projects'
import { documentsService } from '../../services/documents'
import { llmService } from '../../services/llm'
import { MatchResult } from '../../types/index'
import { Document } from '../../types/index'
import { Project } from '../../types/index'
import { SkeletonMatchResult } from '../common/SkeletonCard'

interface CVData {
  name: string
  email?: string
  phone?: string
  skills: string[]
  experience: any[]
  education: any[]
  rawText: string
}

const CVMatcherPage: React.FC = () => {
  const [step, setStep] = useState(1)
  const [cvData, setCvData] = useState<CVData | null>(null)
  const [jobDescription, setJobDescription] = useState('')
  const [_jobTitle, _setJobTitle] = useState('')
  const [_companyName, _setCompanyName] = useState('')
  const [matchResult, setMatchResult] = useState<MatchResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [projects, setProjects] = useState<Project[]>([])
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { user } = useAuth()

  // Hole Projekt-ID aus Query-Parametern
  const projectId = searchParams.get('project_id')

  // Lade Projekte wenn Benutzer eingeloggt ist
  useEffect(() => {
    const loadProjects = async () => {
      if (user) {
        try {
          const projectList = await projectsService.listProjects()
          setProjects(projectList)
          
          // Wenn Projekt-ID in URL, setze als ausgewählt
          if (projectId) {
            const project = projectList.find(p => p.id === projectId)
            if (project) {
              setSelectedProject(project)
            }
          }
        } catch (err) {
          setError('Fehler beim Laden der Projekte')
          console.error(err)
        }
      }
    }

    loadProjects()
  }, [user, projectId])

  // Wenn Projekt ausgewählt und wir auf Schritt 3 sind, führe Analyse durch
  useEffect(() => {
    const analyzeMatch = async () => {
      if (step === 3 && cvData && jobDescription) {
        setLoading(true)
        setError(null)
        
        try {
          const result = await llmService.analyzeMatch(cvData.rawText, jobDescription)
          setMatchResult(result)
        } catch (err) {
          setError('Fehler bei der Analyse: ' + (err as Error).message)
          console.error(err)
        } finally {
          setLoading(false)
        }
      }
    }

    analyzeMatch()
  }, [step, cvData, jobDescription])

  const handleCVParsed = (text: string, filename: string) => {
    // Simuliere CV-Daten aus dem Text
    const cvData: CVData = {
      name: filename.replace('.pdf', ''),
      email: '',
      phone: '',
      skills: ['JavaScript', 'React', 'TypeScript'],
      experience: [
        {
          title: 'Frontend Entwickler',
          company: 'Tech Solutions GmbH',
          duration: '2020 - 2023',
          description: 'Entwicklung von Webanwendungen mit React und TypeScript'
        }
      ],
      education: [
        {
          degree: 'B.Sc. Informatik',
          institution: 'Universität XYZ',
          year: '2016 - 2020'
        }
      ],
      rawText: text
    }
    
    setCvData(cvData)
    setStep(2)
  }

  const handleJobDescriptionSubmit = (description: string, title?: string, company?: string) => {
    setJobDescription(description)
    _setJobTitle(title || '')
    _setCompanyName(company || '')
    setStep(3)
  }

  const handleSaveToProject = async (_document: Document) => {
    if (!selectedProject) {
      setError('Bitte wählen Sie ein Projekt aus')
      return
    }

    try {
      // Erstelle ein Textdokument mit den Analyseergebnissen
      await documentsService.createTextDocument(
        selectedProject.id,
        `Match Analyse - ${new Date().toLocaleDateString()}`,
        JSON.stringify(matchResult, null, 2)
      )

      alert('Analyse erfolgreich gespeichert!')
    } catch (err) {
      setError('Fehler beim Speichern: ' + (err as Error).message)
      console.error(err)
    }
  }

  const handleNewAnalysis = () => {
    setStep(1)
    setCvData(null)
    setJobDescription('')
    setMatchResult(null)
    setError(null)
  }

  const handleProjectSelect = (project: Project) => {
    setSelectedProject(project)
  }

  // TODO: Implement project creation feature
  // const handleCreateProject = async (name: string, type: string, description?: string) => {
  //   try {
  //     const newProject = await projectsService.createProject(name, type, description)
  //     setSelectedProject(newProject)
  //     setProjects([...projects, newProject])
  //     setStep(2)
  //   } catch (err) {
  //     setError('Fehler beim Erstellen des Projekts: ' + (err as Error).message)
  //     console.error(err)
  //   }
  // }

  // Wenn keine Projekte vorhanden sind, aber ein Projekt benötigt wird
  if (projectId && projects.length === 0 && !selectedProject) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white rounded-xl shadow-lg p-8 text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Keine Projekte gefunden</h2>
          <p className="text-gray-600 mb-6">
            Sie müssen ein Projekt erstellen, um die Analyseergebnisse zu speichern.
          </p>
          <div className="flex justify-center space-x-4">
            <button
              onClick={() => navigate('/dashboard')}
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg transition-colors duration-200"
            >
              Zurück zum Dashboard
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Wenn kein Projekt ausgewählt ist, aber ein Projekt benötigt wird
  if (projectId && !selectedProject) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Projekt auswählen</h2>
          
          {projects.length > 0 ? (
            <div className="mb-6">
              <p className="text-gray-600 mb-4">Wählen Sie ein bestehendes Projekt aus:</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {projects.map((project) => {
                  // Type assertion needed due to TypeScript control flow narrowing issue
                  const proj: Project = project as any
                  return (
                    <div
                      key={proj.id}
                      className="border rounded-lg p-4 cursor-pointer transition-colors duration-200 border-gray-200 hover:bg-gray-50"
                      onClick={() => handleProjectSelect(proj)}
                    >
                      <h3 className="font-semibold text-gray-800">{proj.name}</h3>
                      <p className="text-sm text-gray-600">{proj.type}</p>
                    </div>
                  )
                })}
              </div>
            </div>
          ) : (
            <div className="mb-6">
              <p className="text-gray-600 mb-4">Sie haben noch keine Projekte. Erstellen Sie eines:</p>
            </div>
          )}
          
          <div className="flex justify-between">
            <button
              onClick={() => navigate('/dashboard')}
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg transition-colors duration-200"
            >
              Zurück
            </button>
            
            {projects.length > 0 && (
              <button
                onClick={() => setStep(2)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200"
              >
                Weiter
              </button>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Schritt-Anzeige */}
      <div className="mb-8">
        <div className="flex justify-between relative">
          {/* Linie zwischen den Schritten */}
          <div className="absolute top-4 left-0 right-0 h-1 bg-gray-200 -z-10">
            <div 
              className="h-full bg-blue-600 transition-all duration-500 ease-in-out"
              style={{ width: step === 1 ? '0%' : step === 2 ? '50%' : '100%' }}
            ></div>
          </div>
          
          {[1, 2, 3].map((num) => (
            <div key={num} className="flex flex-col items-center">
              <div 
                className={`w-8 h-8 rounded-full flex items-center justify-center mb-2 transition-colors duration-200 ${
                  step >= num 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 text-gray-500'
                }`}
              >
                {num}
              </div>
              <span className="text-sm font-medium text-gray-700">
                {num === 1 ? 'CV hochladen' : num === 2 ? 'Stellenbeschreibung' : 'Ergebnisse'}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Inhalt je nach Schritt */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        {loading && step === 3 && <SkeletonMatchResult />}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {!loading && step === 1 && (
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Lebenslauf hochladen</h2>
            <CVUpload onCVParsed={handleCVParsed} />
          </div>
        )}

        {!loading && step === 2 && (
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Stellenbeschreibung eingeben</h2>
            <JobDescriptionInput onAnalyze={handleJobDescriptionSubmit} />
          </div>
        )}

        {!loading && step === 3 && matchResult && (
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Analyseergebnisse</h2>
            <MatchResults 
              matchResult={matchResult} 
              onNewAnalysis={handleNewAnalysis}
              onSaveToProject={handleSaveToProject}
            />
          </div>
        )}

        {/* Navigation Buttons */}
        {!loading && step !== 3 && (
          <div className="flex justify-between mt-8">
            <button
              onClick={() => setStep(prev => Math.max(1, prev - 1))}
              disabled={step === 1}
              className={`px-4 py-2 rounded-lg transition-colors duration-200 ${
                step === 1 
                  ? 'bg-gray-200 text-gray-500 cursor-not-allowed' 
                  : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
              }`}
            >
              Zurück
            </button>
            
            {step === 1 ? (
              <button
                onClick={() => setStep(2)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200"
              >
                Weiter
              </button>
            ) : (
              <button
                onClick={() => setStep(3)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200"
              >
                Ergebnisse anzeigen
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default CVMatcherPage
