import os
from fastapi import FastAPI
from utils.config import load_config
from contextlib import asynccontextmanager
import endpointsmanager

# Ensure that ENV variable is set
assert os.getenv("ENV") in ["development", "production"], "You must set the ENV variable to development or production"



@asynccontextmanager
async def lifespan(app: FastAPI):
    await  endpointsmanager.initializeAgentConfig()
    yield 
# Create an instance of FastAPI
app = FastAPI(lifespan=lifespan)
#        title=settings.PROJECT_NAME, debug=settings.DEBUG, version=settings.VERSION

# Load express configurations
load_config(app)


# Export the app instance
__all__ = ['app']
