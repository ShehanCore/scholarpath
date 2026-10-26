import "server-only";

// Transactional email through Resend's HTTP API (no SDK). Needs RESEND_API_KEY and ALERTS_FROM_EMAIL
// (an address on a domain verified in Resend, e.g. "ScholarPath <alerts@scholarpath.lk>").
export const emailConfigured = Boolean(process.env.RESEND_API_KEY && process.env.ALERTS_FROM_EMAIL);

export async function sendEmail(msg: { to: string; subject: string; text: string; html: string; unsubscribeUrl: string }) {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: process.env.ALERTS_FROM_EMAIL,
      to: [msg.to],
      subject: msg.subject,
      text: msg.text,
      html: msg.html,
      headers: {
        // One-click unsubscribe (RFC 8058): mail apps POST to this URL.
        "List-Unsubscribe": `<${msg.unsubscribeUrl.replace("/alerts/unsubscribe", "/api/alerts/unsubscribe")}>`,
        "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
      },
    }),
  });
  if (!res.ok) throw new Error(`Email failed (${res.status}): ${(await res.text()).slice(0, 200)}`);
}
