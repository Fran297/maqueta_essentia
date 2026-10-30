export async function requestAI(payload) {
  let response;
  try {
    response = await fetch("/api/ai", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(55000),
    });
  } catch {
    throw new Error("No pudimos conectar con Nez. Revisá la conexión e intentá de nuevo.");
  }
  let data;
  try { data = await response.json(); } catch { data = {}; }
  if (!response.ok) throw new Error(data.error || "Nez no pudo responder ahora. Intentá de nuevo.");
  return data;
}
