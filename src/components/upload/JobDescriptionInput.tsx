import { useState, FormEvent, ChangeEvent } from 'react'
import { useLanguage } from '../../contexts/LanguageContext'

interface JobDescriptionInputProps {
  onAnalyze: (jobDescription: string, jobTitle?: string, companyName?: string) => void
}

export function JobDescriptionInput({ onAnalyze }: JobDescriptionInputProps) {
  const { t } = useLanguage()
  const [jobDescription, setJobDescription] = useState('')
  const [jobTitle, setJobTitle] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [error, setError] = useState('')

  const MIN_CHARACTERS = 100
  const characterCount = jobDescription.length
  const isValid = characterCount >= MIN_CHARACTERS

  const handleJobDescriptionChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setJobDescription(e.target.value)
    setError('')
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    setError('')

    if (!jobDescription.trim()) {
      setError(t('job_desc_error_empty'))
      return
    }

    if (characterCount < MIN_CHARACTERS) {
      setError(t('job_desc_error_min_chars', { count: MIN_CHARACTERS }))
      return
    }

    onAnalyze(
      jobDescription.trim(),
      jobTitle.trim() || undefined,
      companyName.trim() || undefined
    )
  }

  const handleReset = () => {
    setJobDescription('')
    setJobTitle('')
    setCompanyName('')
    setError('')
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          {t('job_desc_title')}
        </h2>
        <p className="text-gray-600">
          {t('job_desc_subtitle')}
        </p>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 p-4 border border-red-200">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-red-400"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-red-800">{error}</p>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="job-title"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              {t('job_title_label')}
            </label>
            <input
              type="text"
              id="job-title"
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              placeholder={t('job_title_placeholder')}
            />
          </div>

          <div>
            <label
              htmlFor="company-name"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              {t('company_name_label')}
            </label>
            <input
              type="text"
              id="company-name"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              placeholder={t('company_name_placeholder')}
            />
          </div>
        </div>

        <div>
          <div className="flex justify-between items-center mb-1">
            <label
              htmlFor="job-description"
              className="block text-sm font-medium text-gray-700"
            >
              {t('job_description_label')}
            </label>
            <span
              className={`text-sm ${
                isValid
                  ? 'text-green-600'
                  : characterCount > 0
                  ? 'text-orange-600'
                  : 'text-gray-500'
              }`}
            >
              {characterCount} / {MIN_CHARACTERS} {t('characters')}
            </span>
          </div>
          <textarea
            id="job-description"
            value={jobDescription}
            onChange={handleJobDescriptionChange}
            rows={15}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            placeholder={t('job_description_placeholder')}
            required
          />
          <p className="mt-2 text-sm text-gray-500">
            {t('job_desc_min_required', { count: MIN_CHARACTERS })}
          </p>
        </div>

        {characterCount > 0 && !isValid && (
          <div className="rounded-md bg-orange-50 p-4 border border-orange-200">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-orange-400"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-orange-800">
                  {t('job_desc_chars_remaining', { count: MIN_CHARACTERS - characterCount })}
                </p>
              </div>
            </div>
          </div>
        )}

        {isValid && (
          <div className="rounded-md bg-green-50 p-4 border border-green-200">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-green-400"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-green-800">
                  {t('job_desc_ready')}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="flex space-x-3">
          <button
            type="submit"
            disabled={!isValid}
            className="flex-1 inline-flex justify-center items-center px-4 py-3 border border-transparent text-base font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <svg
              className="-ml-1 mr-3 h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
              />
            </svg>
            {t('analyze_match')}
          </button>
          {(jobDescription || jobTitle || companyName) && (
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center px-4 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
            >
              {t('reset')}
            </button>
          )}
        </div>
      </form>
    </div>
  )
}
