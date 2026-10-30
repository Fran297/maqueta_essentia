import { useCallback, useEffect, useState } from "react";

const TOKEN_KEY = "altiva_client_token";
async function request(path, token, body) {
  const response = await fetch(path, {
    method: body ? "POST" : "GET",
    headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(body ? { "Content-Type": "application/json" } : {}) },
    ...(body ? { body: JSON.stringify(body) } : {}),
    signal: AbortSignal.timeout(15000),
  });
  let data = {};
  try { data = await response.json(); } catch { /* respuesta inválida */ }
  if (!response.ok) throw Object.assign(new Error(data.error || "No se pudo actualizar el Pase Altiva."), { status: response.status });
  return data;
}

export function useAltivaPoints() {
  const [token, setToken] = useState(() => { try { return localStorage.getItem(TOKEN_KEY) || ""; } catch { return ""; } });
  const [balance, setBalance] = useState(0);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    setError("");
    try {
      let current = token;
      let data;
      if (current) {
        try { data = await request("/api/loyalty/session", current); }
        catch (e) {
          if (e.status !== 401) throw e;
          current = "";
        }
      }
      if (!current) {
        data = await request("/api/loyalty/session", "", {});
        current = data.token;
        try { localStorage.setItem(TOKEN_KEY, current); } catch { /* modo privado */ }
        setToken(current);
      }
      setBalance(Number(data.balance) || 0);
      setReady(true);
      return { token: current, balance: Number(data.balance) || 0 };
    } catch (e) {
      setError(e.message || "El Pase Altiva no está disponible.");
      throw e;
    }
  }, [token]);

  useEffect(() => { refresh().catch(() => setReady(true)); }, [refresh]);

  const authorized = useCallback(async (path, body) => {
    const session = token ? { token, balance } : await refresh();
    const data = await request(path, session.token, body);
    if (Number.isFinite(data.balance)) setBalance(data.balance);
    return data;
  }, [token, balance, refresh]);

  const award = useCallback(async (kind) => authorized("/api/loyalty/award", { kind }), [authorized]);
  const submitSurvey = useCallback(async (answers) => authorized("/api/loyalty/survey", answers), [authorized]);
  const requestRedeemOtp = useCallback(async (points, email) => authorized("/api/loyalty/redeem/request", { points, email }), [authorized]);
  const verifyRedeemOtp = useCallback(async (challengeId, code) => authorized("/api/loyalty/redeem/verify", { challengeId, code }), [authorized]);
  const cancelRedemption = useCallback(async (redemptionId) => authorized("/api/loyalty/redeem/cancel", { redemptionId }), [authorized]);
  const createIncident = useCallback(async (payload) => authorized("/api/support/incidents", payload), [authorized]);
  const submitReview = useCallback(async (ticketId, rating, reviewText) => authorized("/api/loyalty/reviews", { ticketId, rating, reviewText }), [authorized]);

  return { token, balance, ready, error, refresh, award, submitSurvey, requestRedeemOtp, verifyRedeemOtp, cancelRedemption, createIncident, submitReview };
}
