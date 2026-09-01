export const OSS_IMAGE_DIAG_TAG = '[OSS-IMG-DIAG]'

const truncate = (value: string, maxLength = 120) => {
  if (value.length <= maxLength) return value
  return `${value.slice(0, maxLength)}...`
}

export const describeTimestamp = (timestamp: number | string | null | undefined) => {
  const value = typeof timestamp === 'string' ? new Date(timestamp).getTime() : timestamp
  if (!value || !Number.isFinite(value)) {
    return {
      iso: null,
      local: null,
      remainingMs: null,
      remainingSeconds: null,
    }
  }

  const remainingMs = value - Date.now()
  return {
    iso: new Date(value).toISOString(),
    local: new Date(value).toLocaleString(),
    remainingMs,
    remainingSeconds: Math.round(remainingMs / 1000),
  }
}

export const describeSignedUrl = (value: string | null | undefined) => {
  if (!value) {
    return {
      kind: 'empty',
      value: '',
    }
  }

  if (!/^https?:\/\//i.test(value)) {
    return {
      kind: 'object-key',
      value,
    }
  }

  try {
    const url = new URL(value)
    const keys = Array.from(url.searchParams.keys()).sort()
    const expires = url.searchParams.get('Expires')
    const ossExpires = url.searchParams.get('x-oss-expires')
    const ossDate = url.searchParams.get('x-oss-date')
    const signature = url.searchParams.get('Signature') || url.searchParams.get('x-oss-signature')
    const securityToken = url.searchParams.get('security-token') || url.searchParams.get('x-oss-security-token')

    return {
      kind: 'signed-url',
      host: url.host,
      pathname: decodeURIComponent(url.pathname),
      queryKeys: keys,
      expires,
      expiresAt: expires && /^\d+$/.test(expires) ? describeTimestamp(Number(expires) * 1000) : null,
      ossDate,
      ossExpires,
      securityTokenLength: securityToken?.length ?? 0,
      signatureSuffix: signature ? signature.slice(-8) : null,
      urlLength: value.length,
    }
  } catch {
    return {
      kind: 'unparsed-url',
      value: truncate(value),
      urlLength: value.length,
    }
  }
}

export const describeImageElement = (img: HTMLImageElement) => ({
  dataOssKey: img.getAttribute('data-oss-key'),
  src: describeSignedUrl(img.src),
  currentSrc: describeSignedUrl(img.currentSrc || img.src),
  complete: img.complete,
  naturalWidth: img.naturalWidth,
  naturalHeight: img.naturalHeight,
  loading: img.loading,
  decoding: img.decoding,
  crossOrigin: img.crossOrigin,
  isConnected: img.isConnected,
})

export const logOssImageDiag = (stage: string, details?: Record<string, unknown>) => {
  console.log(OSS_IMAGE_DIAG_TAG, stage, {
    at: new Date().toISOString(),
    ...details,
  })
}

export const warnOssImageDiag = (stage: string, details?: Record<string, unknown>) => {
  console.warn(OSS_IMAGE_DIAG_TAG, stage, {
    at: new Date().toISOString(),
    ...details,
  })
}

export const errorOssImageDiag = (stage: string, details?: Record<string, unknown>) => {
  console.error(OSS_IMAGE_DIAG_TAG, stage, {
    at: new Date().toISOString(),
    ...details,
  })
}
