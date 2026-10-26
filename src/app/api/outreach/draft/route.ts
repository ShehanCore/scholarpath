import Anthropic from "@anthropic-ai/sdk";
import { DRAFT_SCHEMA, DRAFT_SYSTEM, DRAFTS_PER_DAY, draftPrompt, parseDraft, parseDraftRequest } from "@/lib/ai-draft";
import { getScholarship } from "@/lib/db/queries";
import { serviceClient, serviceConfigured } from "@/lib/db/service-client";
import { todayIso } from "@/lib/status";
import { currentUser, serverClient } from "@/lib/supabase/server";

const MODEL = process.env.ANTHROPIC_MODEL ?? "claude-opus-5-5";

type Fail = "signin" | "unavailable" | "limit" | "invalid" | "failed";
const fail = (error: Fail, status: number) => Response.json({ error }, { status });

// "Draft with AI". Server only: the API key never reaches the browser. Signed-in users only, so drafts
// can be limited per person (20 a day, counted in ai_draft_usage).
export async function POST(request: Request) {
  if (!process.env.ANTHROPIC_API_KEY || !serviceConfigured) return fail("unavailable", 503);
  const user = await currentUser();
  if (!user) return fail("signin", 401);

  const req = parseDraftRequest(await request.json().catch(() => null));
  const scholarship = req && (await getScholarship(req.scholarshipId));
  if (!req || !scholarship) return fail("invalid", 400);

  const db = serviceClient();
  const day = todayIso();
  const { data: allowed, error } = await db.rpc("take_ai_draft", { p_user: user.id, p_day: day, p_limit: DRAFTS_PER_DAY });
  if (error) return fail("unavailable", 503);
  if (!allowed) return fail("limit", 429);

  const { data: profile } = await (await serverClient()).from("profiles").select("name").eq("id", user.id).maybeSingle();

  try {
    const client = new Anthropic({ timeout: 45_000, maxRetries: 1 });
    const response = await client.beta.messages.create({
      model: MODEL,
      max_tokens: 4000,
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      output_config: { effort: "low", format: { type: "json_schema", schema: DRAFT_SCHEMA } },
      system: DRAFT_SYSTEM,
      messages: [{ role: "user", content: draftPrompt(req, scholarship, profile?.name ?? "") }],
    });
    const raw = response.content.find((b) => b.type === "text");
    const draft = response.stop_reason === "refusal" || !raw || raw.type !== "text" ? null : parseDraft(raw.text);
    if (!draft) throw new Error(`Unusable draft (stop_reason ${response.stop_reason})`);
    return Response.json(draft);
  } catch (e) {
    // Outages and unusable answers don't use up the allowance; the page falls back to the template.
    await db.rpc("give_back_ai_draft", { p_user: user.id, p_day: day });
    if (e instanceof Anthropic.APIError) console.error("AI draft failed:", e.status, e.message);
    else console.error("AI draft failed:", e);
    return fail("failed", 502);
  }
}
