from datetime import datetime

from app.models import User
from app.services.health import compute_adherence, gather_health_context


def generate_health_report_html(user: User, context: dict) -> str:
    vitals_rows = ""
    for v in context.get("vitals", [])[:20]:
        val = v["value"]
        if v.get("value_secondary"):
            val = f"{v['value']}/{v['value_secondary']}"
        vitals_rows += f"""
        <tr>
            <td>{v['type'].replace('_', ' ').title()}</td>
            <td>{val} {v['unit']}</td>
            <td>{v['recorded_at'][:10]}</td>
        </tr>"""

    symptoms_rows = ""
    for s in context.get("symptoms", [])[:15]:
        symptoms_rows += f"""
        <tr>
            <td>{s['name']}</td>
            <td>{s['severity']}/10</td>
            <td>{s['recorded_at'][:10]}</td>
        </tr>"""

    meds_list = ""
    for m in context.get("medicines", []):
        meds_list += f"<li><strong>{m['name']}</strong> — {m['dosage']}, {m['frequency']}</li>"

    adherence = context.get("adherence_pct", 100)

    return f"""<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  body {{ font-family: 'Segoe UI', sans-serif; color: #1e293b; margin: 40px; }}
  h1 {{ color: #0f766e; font-size: 24px; }}
  h2 {{ color: #115e59; font-size: 16px; margin-top: 24px; border-bottom: 2px solid #0d9488; padding-bottom: 4px; }}
  table {{ width: 100%; border-collapse: collapse; margin-top: 8px; }}
  th, td {{ border: 1px solid #e2e8f0; padding: 8px; text-align: left; font-size: 13px; }}
  th {{ background: #f0fdfa; color: #115e59; }}
  .meta {{ color: #64748b; font-size: 13px; }}
  .badge {{ display: inline-block; background: #ccfbf1; color: #0f766e; padding: 4px 12px; border-radius: 12px; font-size: 13px; }}
  ul {{ padding-left: 20px; }}
  .disclaimer {{ margin-top: 32px; font-size: 11px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 12px; }}
</style>
</head>
<body>
  <h1>MediTrack Health Report</h1>
  <p class="meta">Generated {datetime.utcnow().strftime('%B %d, %Y')} · Patient: {user.full_name}</p>

  <h2>Patient Profile</h2>
  <p>Age: {user.age or '—'} · Blood Group: {user.blood_group or '—'}</p>
  <p>Conditions: {user.conditions or 'None recorded'}</p>
  <p>Allergies: {user.allergies or 'None recorded'}</p>

  <h2>Medication Adherence</h2>
  <p><span class="badge">{adherence}% adherence (last 7 days)</span></p>

  <h2>Active Medications</h2>
  <ul>{meds_list or '<li>None recorded</li>'}</ul>

  <h2>Vitals (Last 7 Days)</h2>
  <table>
    <tr><th>Type</th><th>Value</th><th>Date</th></tr>
    {vitals_rows or '<tr><td colspan="3">No vitals logged</td></tr>'}
  </table>

  <h2>Symptoms (Last 7 Days)</h2>
  <table>
    <tr><th>Symptom</th><th>Severity</th><th>Date</th></tr>
    {symptoms_rows or '<tr><td colspan="3">No symptoms logged</td></tr>'}
  </table>

  <p class="disclaimer">
    MediTrack is not a medical device. This report is for informational purposes only.
    Always consult a qualified healthcare professional for medical advice.
  </p>
</body>
</html>"""


def generate_pdf_bytes(user: User, session) -> bytes:
    from weasyprint import HTML

    context = gather_health_context(session, user, days=7)
    html = generate_health_report_html(user, context)
    return HTML(string=html).write_pdf()
