import { Model, ChatCompletionOptions, ApiError } from '../../types';
import { fallbackModels } from '../../config/models';

/**
 * Normalizes base API URL and ensures endpoint endpoints are clean.
 */
function getNormalizedBaseUrl(apiUrl: string): string {
  let url = apiUrl.trim();
  if (url.endsWith('/')) {
    url = url.slice(0, -1);
  }
  return url;
}

/**
 * Formats model ID into a user-friendly display name.
 */
function getModelDisplayName(id: string): string {
  const parts = id.split('/');
  if (parts.length > 1) {
    const provider = parts[0].toUpperCase();
    const name = parts.slice(1).join('/');
    return `${name} (${provider})`;
  }
  return id;
}

/**
 * Extracts provider tag from model ID (e.g. "gemini/..." -> "gemini")
 */
function getModelProvider(id: string): string {
  const parts = id.split('/');
  return parts.length > 1 ? parts[0] : 'other';
}

export class ApiClient {
  private getHeaders(apiKey?: string): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (apiKey && apiKey.trim().length > 0) {
      headers['Authorization'] = `Bearer ${apiKey.trim()}`;
    }
    return headers;
  }

  /**
   * Helper to format human-friendly error messages from status codes or fetch exceptions.
   */
  private parseError(error: unknown, responseStatus?: number): ApiError {
    if (error instanceof DOMException && error.name === 'AbortError') {
      return { message: 'La requête a été annulée.', code: 'ABORTED' };
    }

    if (responseStatus) {
      switch (responseStatus) {
        case 400:
          return { status: 400, message: 'Requête invalide (400). Vérifiez la structure du message ou du modèle.' };
        case 401:
          return { status: 401, message: 'Non autorisé (401). Clé API manquante ou invalide.' };
        case 403:
          return { status: 403, message: 'Accès interdit (403). Droits insuffisants sur OmniRoute.' };
        case 404:
          return { status: 404, message: 'Endpoint ou modèle introuvable (404).' };
        case 429:
          return { status: 429, message: 'Limite de requêtes atteinte (429). Réessayez dans un moment.' };
        case 500:
          return { status: 500, message: 'Erreur interne du serveur IA (500).' };
        case 502:
        case 503:
        case 504:
          return { status: responseStatus, message: `Service indisponible (${responseStatus}). OmniRoute ou le provider IA est temporairement inaccessible.` };
        default:
          return { status: responseStatus, message: `Erreur serveur (${responseStatus}).` };
      }
    }

    if (error instanceof TypeError && error.message.includes('fetch')) {
      return { message: 'Impossible de contacter le serveur. Vérifiez votre connexion réseau ou les paramètres CORS d\'OmniRoute.' };
    }

    if (error instanceof Error) {
      return { message: error.message };
    }

    return { message: 'Une erreur inconnue est survenue.' };
  }

  /**
   * Fetches the dynamic list of available models from GET /v1/models.
   * Falls back to default models if fetch fails or returns non-200.
   */
  async fetchModels(apiUrl: string, apiKey?: string): Promise<Model[]> {
    try {
      const baseUrl = getNormalizedBaseUrl(apiUrl);
      // Derive /v1/models endpoint from configured endpoint
      // If endpoint is https://api.tracemada.net/v1/chat/completions -> https://api.tracemada.net/v1/models
      let modelsUrl = baseUrl;
      if (modelsUrl.endsWith('/chat/completions')) {
        modelsUrl = modelsUrl.replace(/\/chat\/completions$/, '/models');
      } else if (!modelsUrl.endsWith('/models')) {
        modelsUrl = `${modelsUrl}/models`;
      }

      const response = await fetch(modelsUrl, {
        method: 'GET',
        headers: this.getHeaders(apiKey),
      });

      if (!response.ok) {
        console.warn(`GET /v1/models returned status ${response.status}. Using fallback models.`);
        return fallbackModels;
      }

      const data = await response.json();
      if (data && Array.isArray(data.data)) {
        const fetchedModels: Model[] = data.data.map((m: { id: string; name?: string }) => ({
          id: m.id,
          name: m.name || getModelDisplayName(m.id),
          provider: getModelProvider(m.id),
        }));

        if (fetchedModels.length > 0) {
          return fetchedModels;
        }
      }

      return fallbackModels;
    } catch (err) {
      console.warn('Failed to fetch dynamic models from OmniRoute. Using fallback models.', err);
      return fallbackModels;
    }
  }

  /**
   * Non-streaming chat completion request
   */
  async chat(apiUrl: string, apiKey: string | undefined, options: ChatCompletionOptions): Promise<string> {
    const baseUrl = getNormalizedBaseUrl(apiUrl);
    let endpoint = baseUrl;
    if (!endpoint.endsWith('/chat/completions')) {
      if (endpoint.endsWith('/v1')) {
        endpoint = `${endpoint}/chat/completions`;
      } else if (!endpoint.includes('/chat/completions')) {
        endpoint = `${endpoint}/v1/chat/completions`;
      }
    }

    const body = {
      model: options.model,
      messages: options.messages,
      temperature: options.temperature,
      max_tokens: options.max_tokens,
      stream: false,
    };

    let response: Response;
    try {
      response = await fetch(endpoint, {
        method: 'POST',
        headers: this.getHeaders(apiKey),
        body: JSON.stringify(body),
        signal: options.signal,
      });
    } catch (err) {
      throw this.parseError(err);
    }

    if (!response.ok) {
      throw this.parseError(null, response.status);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';
    return content;
  }

  /**
   * Streaming chat completion request via Server-Sent Events (SSE)
   */
  async streamChat(
    apiUrl: string,
    apiKey: string | undefined,
    options: ChatCompletionOptions,
    onChunk: (chunk: string) => void
  ): Promise<void> {
    const baseUrl = getNormalizedBaseUrl(apiUrl);
    let endpoint = baseUrl;
    if (!endpoint.endsWith('/chat/completions')) {
      if (endpoint.endsWith('/v1')) {
        endpoint = `${endpoint}/chat/completions`;
      } else if (!endpoint.includes('/chat/completions')) {
        endpoint = `${endpoint}/v1/chat/completions`;
      }
    }

    const body = {
      model: options.model,
      messages: options.messages,
      temperature: options.temperature,
      max_tokens: options.max_tokens,
      stream: true,
    };

    let response: Response;
    try {
      response = await fetch(endpoint, {
        method: 'POST',
        headers: this.getHeaders(apiKey),
        body: JSON.stringify(body),
        signal: options.signal,
      });
    } catch (err) {
      throw this.parseError(err);
    }

    if (!response.ok) {
      throw this.parseError(null, response.status);
    }

    if (!response.body) {
      throw new Error('Le corps de la réponse est vide.');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        // Keep the last line in the buffer as it might be incomplete
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || trimmed.startsWith(':')) {
            // Empty line or comment
            continue;
          }

          if (trimmed.startsWith('data: ')) {
            const dataStr = trimmed.slice(6).trim();
            if (dataStr === '[DONE]') {
              return;
            }

            try {
              const parsed = JSON.parse(dataStr);
              const deltaContent = parsed.choices?.[0]?.delta?.content;
              if (deltaContent) {
                onChunk(deltaContent);
              }
            } catch (e) {
              console.warn('Erreur lors du parse JSON SSE chunk:', dataStr, e);
            }
          }
        }
      }

      // Process remaining buffer if any
      if (buffer.trim().startsWith('data: ')) {
        const dataStr = buffer.trim().slice(6).trim();
        if (dataStr !== '[DONE]') {
          try {
            const parsed = JSON.parse(dataStr);
            const deltaContent = parsed.choices?.[0]?.delta?.content;
            if (deltaContent) {
              onChunk(deltaContent);
            }
          } catch (e) {
            // ignore
          }
        }
      }
    } catch (err) {
      throw this.parseError(err);
    }
  }
}

export const apiClient = new ApiClient();
