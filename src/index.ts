/**
 * Yuugen Project — Cloudflare Worker entry point.
 *
 * Static assets (the landing page in ./public) are served directly by the
 * Cloudflare asset server for maximum edge performance. This Worker only runs
 * for `/api/*` routes (see `run_worker_first` in wrangler.jsonc), keeping the
 * hot path for page loads as fast as possible.
 */

export interface Env {
  ASSETS: Fetcher;
  /** Optional: address that contact submissions are forwarded to. */
  CONTACT_INBOX?: string;
}

interface ContactPayload {
  name?: string;
  email?: string;
  service?: string;
  message?: string;
}

const JSON_HEADERS = {
  "content-type": "application/json; charset=utf-8",
  "cache-control": "no-store",
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: JSON_HEADERS });
}

async function handleContact(request: Request, env: Env): Promise<Response> {
  if (request.method !== "POST") {
    return json({ ok: false, error: "Method not allowed." }, 405);
  }

  let data: ContactPayload;
  try {
    data = (await request.json()) as ContactPayload;
  } catch {
    return json({ ok: false, error: "Invalid request body." }, 400);
  }

  const name = (data.name ?? "").trim();
  const email = (data.email ?? "").trim();
  const message = (data.message ?? "").trim();
  const service = (data.service ?? "").trim();

  const errors: Record<string, string> = {};
  if (name.length < 2) errors.name = "Please share your name.";
  if (!EMAIL_RE.test(email)) errors.email = "Please enter a valid email.";
  if (message.length < 10) errors.message = "Tell us a little more (10+ characters).";

  if (Object.keys(errors).length > 0) {
    return json({ ok: false, errors }, 422);
  }

  // The submission is validated at the edge. Wire up a real delivery mechanism
  // here (e.g. MailChannels, Resend, a queue, or a D1/KV binding). We log a
  // structured event so it's visible in Workers observability in the meantime.
  console.log(
    JSON.stringify({
      event: "contact_submission",
      name,
      email,
      service: service || "general",
      length: message.length,
      hasInbox: Boolean(env.CONTACT_INBOX),
    }),
  );

  return json({
    ok: true,
    message: "Thank you — we'll be in touch shortly.",
  });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/api/contact") {
      return handleContact(request, env);
    }

    if (url.pathname === "/api/health") {
      return json({ ok: true, service: "yuugen-project-web" });
    }

    if (url.pathname.startsWith("/api/")) {
      return json({ ok: false, error: "Not found." }, 404);
    }

    // Fallback: anything else is delegated to the static asset server. In
    // normal operation the asset server handles these before the Worker runs.
    return env.ASSETS.fetch(request);
  },
} satisfies ExportedHandler<Env>;
