from fastapi import APIRouter, Request
from controllers.agentEndpointController import (
    getAgentStatus,
    updateEndPointStatus,
    getEndPointStatus,
    addEndpoint,
    updateEndpoint,
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
     request_body =await request.json()
     return await updateEndPointStatus(endpointId= endpointId,authToken=request_body.get("authToken"))


# Route to get all endpoints status 
@router.get("/getEndPointStatus/{agentId}")
async def getEndPointStatusRoute(request: Request, agentId: str):
     return await getEndPointStatus()

# Route to get add endpoint  
@router.post("/addEndpoint")
async def addEndpointRoute(request: Request): 
    # Extract all parameters from the request body
     request_body =await request.json()
     return await addEndpoint( endpoint=request_body)

# Route to get all endpoints status 
@router.patch("/updateEndpoint/{endpointId}")
async def updateEndpointRoute(request: Request, endpointId: str): 
     request_body = await request.json()
     endpoint = {
        "name": request_body.get("name"),
        "endpointYaml": request_body.get("endpointYaml"),
     }
     return await updateEndpoint(endpointId= endpointId,endpoint=endpoint)

# Route to get all endpoints status 
@router.delete("/deleteEndpoint/{endpointId}")
async def deleteEndpointRoute(request: Request, endpointId: str): 
     return await deleteEndpoint(endpointId= endpointId)

