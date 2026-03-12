from fastapi import APIRouter, HTTPException

from app.services.mcp_registry import MCPRegistry

router = APIRouter(prefix="/mcp", tags=["mcp"])
registry = MCPRegistry()


@router.get("/servers")
async def list_servers():
    """Liste aller MCP-Server mit Health-Status und Tool-Count."""
    return await registry.health_check_all()


@router.get("/servers/{server_id}/health")
async def server_health(server_id: str):
    """Health-Check für einen einzelnen MCP-Server."""
    if not registry.get_server(server_id):
        raise HTTPException(status_code=404, detail="Server not found")
    is_healthy, latency_ms = await registry.check_health(server_id)
    return {"server_id": server_id, "is_healthy": is_healthy, "latency_ms": latency_ms}


@router.get("/servers/{server_id}/tools")
async def server_tools(server_id: str):
    """Liste aller Tools eines MCP-Servers."""
    if not registry.get_server(server_id):
        raise HTTPException(status_code=404, detail="Server not found")
    tools = await registry.list_tools(server_id)
    return {"server_id": server_id, "tools": tools}


@router.post("/servers/{server_id}/tools/{tool_name}/call")
async def call_tool(server_id: str, tool_name: str, body: dict):
    """Tool eines MCP-Servers aufrufen."""
    if not registry.get_server(server_id):
        raise HTTPException(status_code=404, detail="Server not found")
    arguments = body.get("arguments", body)
    try:
        result = await registry.call_tool(server_id, tool_name, arguments)
        return result
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except RuntimeError as e:
        raise HTTPException(status_code=502, detail=str(e))
