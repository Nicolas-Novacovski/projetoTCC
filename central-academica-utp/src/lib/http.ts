export async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response

  try {
    response = await fetch(path, {
      ...init,
      headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
    })
  } catch {
    throw new Error('Nao foi possivel conectar ao servidor. Verifique se o back-end esta rodando.')
  }

  const rawBody = await response.text()
  const contentType = response.headers.get('content-type') ?? ''

  let data: (T & { message?: string }) | null = null

  if (rawBody.trim()) {
    if (contentType.includes('application/json')) {
      try {
        data = JSON.parse(rawBody) as T & { message?: string }
      } catch {
        throw new Error('O servidor respondeu com um JSON invalido.')
      }
    } else {
      if (rawBody.includes('<!doctype html') || rawBody.includes('<html')) {
        throw new Error(
          'A API respondeu com HTML em vez de JSON. Reinicie o back-end com npm run dev:server e tente novamente.',
        )
      }

      throw new Error('O servidor respondeu em um formato inesperado.')
    }
  }

  if (!response.ok) {
    if (!data && [502, 503, 504].includes(response.status)) {
      throw new Error('O back-end nao respondeu. Verifique se o servidor foi iniciado com npm run dev:server.')
    }

    throw new Error(
      data?.message ||
        `A requisicao falhou com status ${response.status}. Verifique se o back-end esta rodando.`,
    )
  }

  if (!data) {
    throw new Error('O servidor retornou uma resposta vazia.')
  }

  return data
}
