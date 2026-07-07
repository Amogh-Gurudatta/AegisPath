import json
import asyncio
import httpx
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from app.schemas import (
    NetworkGraph,
    SimulationResponse,
    EnrichCveRequest,
    EnrichCveResponse,
)
from app.engine import compute_attack_path
from app.config import CORS_ORIGINS, GROQ_API_KEY

app = FastAPI(
    title="AegisPath Simulation API",
    description="API for simulating lateral movement and computing attack paths in a network threat topology.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.post("/api/simulate", response_model=SimulationResponse)
def simulate_topology(graph_data: NetworkGraph):
    """
    Accepts network graph data payload, populates the topology engine,
    and returns simulated lateral attack paths.
    """
    result = compute_attack_path(graph_data)
    return {
        "success": True,
        "attack_paths": result["paths"],
        "contributing_factors": result["contributing_factors"],
        "recommended_actions": result.get("recommended_actions", []),
        "risk_score": result["risk_score"],
        "attack_path_techniques": result.get("attack_path_techniques", []),
        "primary_hop_techniques": result.get("primary_hop_techniques", []),
        "message": f"Successfully simulated graph containing {len(graph_data.nodes)} nodes and {len(graph_data.edges)} edges.",
    }


_ENRICH_PROMPT = """\
You are a cybersecurity analyst. Given the CVE description below, infer the values of \
exactly three boolean flags. Reply with ONLY a valid JSON object — no markdown, no prose, \
no explanation — containing exactly these keys:
  "has_rce_vulnerability"  — true if exploitation can lead to remote code execution
  "has_weak_credentials"   — true if the vulnerability involves default/weak/hardcoded credentials or auth bypass
  "requires_network_access" — true if the vulnerability requires network-level access to exploit

CVE: {cve_id}
Description: {description}"""


async def _call_groq(cve_id: str, description: str, *, timeout: float = 12.0) -> dict:
    """
    Make one attempt to the Groq OpenAI-compatible endpoint.
    Returns the parsed JSON dict on success, raises on failure.
    """
    if not GROQ_API_KEY:
        raise ValueError("GROQ_API_KEY is not configured on the server.")

    prompt = _ENRICH_PROMPT.format(cve_id=cve_id, description=description)

    async with httpx.AsyncClient(timeout=timeout) as client:
        resp = await client.post(
            "https://api.groq.com/openai/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {GROQ_API_KEY}",
                "Content-Type": "application/json",
            },
            json={
                "model": "llama-3.3-70b-versatile",
                "messages": [{"role": "user", "content": prompt}],
                "temperature": 0,
                "max_tokens": 128,
            },
        )
        resp.raise_for_status()
        content = resp.json()["choices"][0]["message"]["content"].strip()
        return json.loads(content)


@app.post("/api/enrich-cve", response_model=EnrichCveResponse)
async def enrich_cve(req: EnrichCveRequest):
    """
    Calls the Groq LLM to infer vulnerability flags (has_rce_vulnerability,
    has_weak_credentials, requires_network_access) from the NVD description.
    On a 429 rate-limit response, retries once after a 2-second backoff.
    If the call fails for any reason the flags are omitted and enrichment_error
    is populated — callers must never fall back to fake/default values.
    """
    if not GROQ_API_KEY:
        raise HTTPException(
            status_code=503,
            detail="LLM enrichment is not available: GROQ_API_KEY is not set on the server.",
        )

    last_error: str = ""

    for attempt in range(2):  # attempt 0, then one retry on 429
        try:
            flags = await _call_groq(req.cve_id, req.description)

            # Validate and coerce — only accept explicit booleans, ignore unknowns
            def to_bool_or_none(val):
                if isinstance(val, bool):
                    return val
                if isinstance(val, str):
                    if val.lower() == "true":
                        return True
                    if val.lower() == "false":
                        return False
                return None

            return EnrichCveResponse(
                has_rce_vulnerability=to_bool_or_none(
                    flags.get("has_rce_vulnerability")
                ),
                has_weak_credentials=to_bool_or_none(flags.get("has_weak_credentials")),
                requires_network_access=to_bool_or_none(
                    flags.get("requires_network_access")
                ),
            )

        except httpx.HTTPStatusError as exc:
            if exc.response.status_code == 429 and attempt == 0:
                # Rate-limited — wait 2 s then retry once
                await asyncio.sleep(2)
                last_error = "rate limited (429)"
                continue
            last_error = f"Groq HTTP {exc.response.status_code}"
            break

        except (json.JSONDecodeError, KeyError):
            last_error = "LLM returned unparseable response"
            break

        except Exception as exc:
            last_error = str(exc)
            break

    return EnrichCveResponse(enrichment_error=last_error)


@app.get("/health")
def health_check():
    """
    Service health check endpoint.
    """
    return {"status": "healthy"}
