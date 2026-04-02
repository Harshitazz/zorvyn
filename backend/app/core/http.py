from fastapi import Request
from fastapi.responses import JSONResponse
from starlette import status


def api_error(message: str, status_code: int, details: list | dict | None = None):
    return JSONResponse(
        status_code=status_code,
        content={"success": False, "message": message, "data": details},
    )


async def http_exception_handler(_request: Request, exc):
    return api_error(str(exc.detail), exc.status_code)


async def unhandled_exception_handler(_request: Request, _exc: Exception):
    return api_error("Internal server error", status.HTTP_500_INTERNAL_SERVER_ERROR)
