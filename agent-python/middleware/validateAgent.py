import os
from fastapi import Request, HTTPException, Depends

async def verify_agent_token(request: Request):
    agent_token = request.headers.get("AGENT_TOKEN")
    agent_id = request.headers.get("AGENT_ID")
    if not agent_token or not agent_id:
        raise HTTPException(status_code=401, detail="Access denied. No token provided")

    if agent_id != os.getenv("AGENT_ID") or agent_token != os.getenv("AGENT_TOKEN"):
        raise HTTPException(status_code=401, detail="Access denied. Token Mismatched")

    # Middleware logic passed, continue to the route
    return True
