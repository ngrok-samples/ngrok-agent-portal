import os
import logging
from utils.appError import AppError 
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.responses import RedirectResponse
from fastapi.staticfiles import StaticFiles
from fastapi import Request,Depends
from routes.agentEndpoints import router as agent_router
from utils.logger import logger  # Assuming you have a logger module
from fastapi.responses import JSONResponse
from middleware.validateAgent import verify_agent_token  # Assuming middleware is in utils.middleware


def load_config(app):
    env = os.getenv("ENV")

    # Set logger in app
    app.logger = logger

    # Basic logging setup
    logging.basicConfig(level=logging.INFO)

    # Trust Proxy
    app.add_middleware(TrustedHostMiddleware, allowed_hosts=["*"])

    # Enable CORS
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Static Files
    #app.mount("/public", StaticFiles(directory="public"), name="public")

    # Compression middleware is not needed in FastAPI

    # Method Override middleware is not needed in FastAPI

    # Cookie Parser middleware is not needed in FastAPI

    # Body Parser middleware is not needed in FastAPI

    # Xss-clean middleware (for XSS prevention) is not needed in FastAPI

    @app.exception_handler(AppError)
    async def unicorn_exception_handler(request: Request, exc: AppError):
            return JSONResponse(
                status_code=exc.status_code,
                content= {
                     "message": exc.message
                }
            )
    
    # test routes
    @app.get("/api/v1/test")
    def test_backend():
        return {"status": "Test Backend Success"}

    # Add agent routes
    app.include_router(agent_router, prefix="",dependencies=[Depends(verify_agent_token)])  # Adjust prefix as needed

    # Global error handler is not needed in FastAPI
    # Redirect to HTTPS if not in development environment
    @app.middleware("http")
    async def redirect_to_https(request: Request, call_next):
        if env != "development" and not request.url.scheme == "https":
            return RedirectResponse(url=request.url.replace(scheme="https"))
        return await call_next(request)

    # Catch-all route handler
    @app.exception_handler(404)
    async def not_found(request, exc):
        return {"detail": f"Requested URL {request.url.path} not found"}, 404

    # Error handler is not needed in FastAPI

