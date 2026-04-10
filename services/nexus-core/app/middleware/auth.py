from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse

from app.config.settings import settings

_EXEMPT = {"/health", "/metrics", "/docs", "/redoc", "/openapi.json", "/ws/dashboard"}


class AiosTokenMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        if request.url.path in _EXEMPT or request.url.path.startswith("/ws"):
            return await call_next(request)

        if not settings.aios_token:
            env = (settings.environment or "").lower()
            if env in ("production", "prod"):
                return JSONResponse(
                    {
                        "detail": "Server misconfigured — set aios_token for production (header x-aios-token)",
                    },
                    status_code=503,
                )
            # development / andere Umgebungen: ohne Token durchlassen
            return await call_next(request)

        token = request.headers.get("x-aios-token")
        if token != settings.aios_token:
            return JSONResponse({"detail": "Unauthorized — x-aios-token invalid"}, status_code=401)

        return await call_next(request)
