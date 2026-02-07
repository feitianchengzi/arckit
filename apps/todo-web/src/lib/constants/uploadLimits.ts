export const KB = 1024
export const MB = 1024 * 1024

export const UPLOAD_LIMITS = {
  avatar: {
    targetBytes: 2 * MB,
    maxBytes: 5 * MB,
    maxDimension: 512,
    initialQuality: 0.85,
    minQuality: 0.6,
    qualityStep: 0.05,
  },
  image: {
    maxBytes: 12 * MB,
    maxDimension: 2560,
    initialQuality: 0.9,
    minQuality: 0.7,
    qualityStep: 0.05,
  },
  file: {
    maxBytes: 500 * MB,
  },
}
