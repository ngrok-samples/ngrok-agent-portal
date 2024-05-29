from fastapi import APIRouter, Request
from controllers.agentEndpointController import (
    getAgentStatus,
    updateEndPointStatus,
    getEndPointStatus,
    addEndpoint,
    deleteEndpoint,
)

router = APIRouter()


# route to check status
@router.get("/")
def getAgentStatusRoute():
     return getAgentStatus()

# Route to update status of endpoint
@router.patch("/updateStatus/{endpointId}")
async def updateEndPointStatusRoute(request: Request, endpointId: str):
     return await updateEndPointStatus(endpointId= endpointId,token=  request.headers.get("token"))


# Route to get all endpoints status 
@router.get("/getEndPointStatus/{agentId}")
async def getEndPointStatusRoute(request: Request, agentId: str):
     return await getEndPointStatus(agentId= agentId, token= request.headers.get("token"))

# Route to get add endpoint  
@router.post("/addEndpoint")
async def addEndpointRoute(request: Request): 
    # Extract all parameters from the request body
     request_body =await request.json()
     return await addEndpoint( endpoint=request_body, token= request.headers.get("token"))

# Route to get all endpoints status 
@router.delete("/deleteEndpoint/{endpointId}")
async def deleteEndpointRoute(request: Request, endpointId: str): 
     return await deleteEndpoint(endpointId= endpointId, token= request.headers.get("token"))

