import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ApiClient } from '../apiClient';

describe('ApiClient', () => {
  let apiClient: ApiClient;

  beforeEach(() => {
    apiClient = new ApiClient();
    vi.restoreAllMocks();
  });

  describe('fetchModels', () => {
    it('returns fallback models when network fails', async () => {
      vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network error')));

      const models = await apiClient.fetchModels('https://api.tracemada.net/v1/chat/completions');
      expect(models).toHaveLength(3);
      expect(models[0].id).toBe('gemini/gemini-2.5-pro');
    });

    it('parses dynamic models when GET /v1/models succeeds', async () => {
      const mockResponse = {
        data: [
          { id: 'gemini/gemini-2.5-pro' },
          { id: 'oc/north-mini-code-free' },
          { id: 'auto/gpt-4o' }
        ]
      };

      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      }));

      const models = await apiClient.fetchModels('https://api.tracemada.net/v1/chat/completions');
      expect(models).toHaveLength(3);
      expect(models[2].id).toBe('auto/gpt-4o');
      expect(models[2].provider).toBe('auto');
    });
  });

  describe('streamChat', () => {
    it('parses SSE chunks correctly and calls onChunk', async () => {
      const chunks = [
        'data: {"choices":[{"delta":{"content":"Hello"}}]}\n\n',
        'data: {"choices":[{"delta":{"content":" World!"}}]}\n\n',
        'data: [DONE]\n\n'
      ];

      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        start(controller) {
          chunks.forEach(chunk => controller.enqueue(encoder.encode(chunk)));
          controller.close();
        }
      });

      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        ok: true,
        body: stream,
      }));

      let result = '';
      await apiClient.streamChat(
        'https://api.tracemada.net/v1/chat/completions',
        undefined,
        { model: 'gemini/gemini-2.5-pro', messages: [{ role: 'user', content: 'Hi' }] },
        (chunk) => {
          result += chunk;
        }
      );

      expect(result).toBe('Hello World!');
    });

    it('handles HTTP errors properly (e.g. 401)', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
      }));

      await expect(
        apiClient.streamChat(
          'https://api.tracemada.net/v1/chat/completions',
          undefined,
          { model: 'gemini/gemini-2.5-pro', messages: [{ role: 'user', content: 'Hi' }] },
          () => {}
        )
      ).rejects.toEqual({
        status: 401,
        message: 'Non autorisé (401). Clé API manquante ou invalide.'
      });
    });
  });
});
