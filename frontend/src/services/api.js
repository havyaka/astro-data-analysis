/**
 * api.js
 * ------
 * Centralised API service layer.
 * All backend communication happens through these functions.
 */

import axios from 'axios'

const BASE_URL = 'http://127.0.0.1:8001'

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 300_000, // 5 minutes - TF models training can take some time
})

/**
 * Upload a CSV file and ingest it permanently.
 * @param {File} file
 */
export async function uploadDataset(file) {
  const formData = new FormData()
  formData.append('file', file)
  const response = await api.post('/datasets/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return response.data
}

/**
 * Fetch all permanently registered datasets.
 */
export async function fetchDatasets() {
  const response = await api.get('/datasets')
  return response.data
}

/**
 * Fetch specific dataset details, including data previews.
 */
export async function getDatasetDetails(datasetId) {
  const response = await api.get(`/datasets/${datasetId}`)
  return response.data
}

/**
 * Delete a dataset from the archives.
 */
export async function deleteDataset(datasetId) {
  const response = await api.delete(`/datasets/${datasetId}`)
  return response.data
}

/**
 * Train a selected model locally on a dataset.
 */
export async function trainModel(datasetId, modelName, params = {}) {
  const queryParams = new URLSearchParams()
  queryParams.append('model_name', modelName)
  if (params.epochs) queryParams.append('epochs', params.epochs)
  if (params.batchSize) queryParams.append('batch_size', params.batchSize)
  if (params.sequenceLength) queryParams.append('sequence_length', params.sequenceLength)
  if (params.contamination) queryParams.append('contamination', params.contamination)

  const response = await api.post(`/datasets/${datasetId}/train?${queryParams.toString()}`)
  return response.data
}

/**
 * Run hybrid ensembled anomaly detection on a dataset.
 */
export async function analyzeDataset(datasetId) {
  const response = await api.post(`/datasets/${datasetId}/analyze`)
  return response.data
}

/**
 * Fetch historical prediction runs.
 */
export async function fetchHistory() {
  const response = await api.get('/history')
  return response.data
}

/**
 * Fetch specific prediction run results.
 */
export async function getPredictionRunDetails(predictionId) {
  const response = await api.get(`/history/${predictionId}`)
  return response.data
}

/**
 * Fetch dynamic telemetry statistics for Mission Control.
 */
export async function fetchDashboardStats() {
  const response = await api.get('/dashboard/stats')
  return response.data
}

/**
 * Fetch alerts log.
 */
export async function fetchAlerts() {
  const response = await api.get('/alerts')
  return response.data
}

/**
 * Fetch live feed ticker.
 */
export async function fetchLiveFeed() {
  const response = await api.get('/live-feed')
  return response.data
}

/**
 * Fetch local models training status list.
 */
export async function fetchModelsStatus() {
  const response = await api.get('/models/status')
  return response.data
}

// Backward compatibility: support old analyzeFile endpoint
export async function analyzeFile(file) {
  const formData = new FormData()
  formData.append('file', file)
  const response = await api.post('/analyze', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return response.data
}

export default api
