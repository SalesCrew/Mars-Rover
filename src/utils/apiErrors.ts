export interface ApiErrorDetails {
  code: string;
  message: string;
  status?: number;
  field?: string;
  cause?: unknown;
}

export class ApiError extends Error {
  readonly code: string;
  readonly status?: number;
  readonly field?: string;

  constructor(details: ApiErrorDetails) {
    super(details.message, details.cause === undefined ? undefined : { cause: details.cause });
    this.name = 'ApiError';
    this.code = details.code;
    this.status = details.status;
    this.field = details.field;
  }
}

interface ApiErrorResponse {
  error?: string;
  code?: string;
  field?: string;
}

interface RequestFallback {
  code: string;
  message: string;
}

const getStatusFallback = (status: number, fallback: RequestFallback): RequestFallback => {
  if (status === 401 || status === 403) {
    return {
      code: 'MR-AUTH-001',
      message: 'Deine Anmeldung ist abgelaufen. Bitte melde dich erneut an.'
    };
  }

  return fallback;
};

export const fetchJsonWithErrorCode = async <T>(
  input: RequestInfo | URL,
  init: RequestInit,
  fallback: RequestFallback
): Promise<T> => {
  let response: Response;

  try {
    response = await fetch(input, init);
  } catch (cause) {
    throw new ApiError({
      code: 'MR-NETWORK-001',
      message: 'Der Server ist gerade nicht erreichbar. Bitte prüfe deine Internetverbindung und versuche es erneut.',
      cause
    });
  }

  if (!response.ok) {
    const statusFallback = getStatusFallback(response.status, fallback);
    let body: ApiErrorResponse = {};

    try {
      body = await response.json() as ApiErrorResponse;
    } catch {
      // Some upstream failures return HTML or an empty response body.
    }

    throw new ApiError({
      code: body.code || statusFallback.code,
      message: body.error || statusFallback.message,
      status: response.status,
      field: body.field
    });
  }

  return response.json() as Promise<T>;
};

export const toApiError = (error: unknown, fallback: RequestFallback): ApiError => {
  if (error instanceof ApiError) return error;

  return new ApiError({
    code: fallback.code,
    message: fallback.message,
    cause: error
  });
};
