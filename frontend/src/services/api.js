/**
 * api.js
 * ------
 * Centralised API service layer.
 * All backend communication happens through these functions.
 */

import axios from 'axios'

const BASE_URL = 'http://localhost:8000'

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 60_000, // 60 s – model fitting can take a moment on large files
})

/**
 * Upload a CSV file and run anomaly detection.
 *
 * @param {File} file  - The CSV File object from the file input
 * @returns {Promise<{data: object[], anomaly_count: number, total_rows: number, columns: string[], message: string}>}
 */
export async function analyzeFile(file) {
  const formData = new FormData()
  formData.append('file', file)

  const response = await api.post('/analyze', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })

  return response.data
}

/**
 * Fetch the last 50 analysis history records.
 *
 * @returns {Promise<{history: object[]}>}
 */
export async function fetchHistory() {
  const response = await api.get('/history')
  return response.data
}

export default api
