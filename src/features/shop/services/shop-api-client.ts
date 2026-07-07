export type ApiEnvelope<T> = {
  success?: boolean;
  message?: string;
  data?: T;
};

export function unwrapData<T>(payload: unknown): T | null {
  if (!payload || typeof payload !== "object") return null;
  const record = payload as Record<string, unknown>;
  if ("data" in record && record.data != null) {
    return record.data as T;
  }
  return payload as T;
}

export function getApiErrorMessage(err: unknown, fallback: string): string {
  if (err && typeof err === "object") {
    const axiosErr = err as {
      response?: { data?: { message?: string } };
      message?: string;
    };
    return axiosErr.response?.data?.message ?? axiosErr.message ?? fallback;
  }
  if (err instanceof Error) return err.message;
  return fallback;
}

export function assertEnvelopeSuccess<T>(data: ApiEnvelope<T>, fallback: string): T {
  if (data.success === false) {
    throw new Error(data.message ?? fallback);
  }
  const payload = unwrapData<T>(data);
  if (payload == null) {
    throw new Error(fallback);
  }
  return payload;
}
