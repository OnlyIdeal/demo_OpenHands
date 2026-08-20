# MVP API

## Local startup

```powershell
cd apps/api
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
$env:DATABASE_URL="sqlite:///./platform.db"
$env:MOCK_LLM="1"
$env:AGENT_MODE="mock"
uvicorn app.main:app --reload --port 8000
```

OpenAPI is available at `http://localhost:8000/docs`. The default administrator
is `admin@example.com` / `admin123`. Production deployments must override
`ADMIN_EMAIL` and `ADMIN_PASSWORD`.

The container default is `sqlite:////data/platform.db`. Set
`AGENT_MODE=openhands` and `AGENT_ADAPTER_URL=http://agent-adapter:8010` to use
the adapter. When unavailable, `AGENT_FALLBACK_MOCK=1` keeps the MVP usable.

## Test

```powershell
cd apps/api
pytest -q
```

