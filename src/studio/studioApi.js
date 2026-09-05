// Compatibility exports: each Training contract has one implementation.
export { listStudioContent as listStudioCatalog, normalizeTrainingError as normalizeStudioError } from '../training/trainingApi.js'
import { getTrainingFilterOptions } from '../training/trainingApi.js'
export const getStudioFilterOptions = client => getTrainingFilterOptions(client, 'studio')
