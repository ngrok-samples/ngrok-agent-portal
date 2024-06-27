import logging
import yaml
import ngrok
import asyncio

from utils.appError import AppError
# Import logger from utils.logger module
from utils.logger import logger

# Import agentEndpointController from controllers.agentEndpointController module
#from controllers.agentEndpointController import fetchAgentConfig

# Initialize ngrok
#ngrok.set_auth_token(token=ngrok.get_auth_token())

endpoints = []
listeners = {}  # Dictionary to manage listeners

async def initializeAgentConfig():
    global endpoints
     # Lazy import fetchAgentConfig
    from controllers.agentEndpointController import fetchAgentConfig
    response = await fetchAgentConfig()
    if response.get("success")==True:
        endpoints = [{
            **x,
            "status": "offline",
            "listener_id": None  # Initialize with None
            #"listener": None
        } for x in response.get("data")]

async def changeEndpointsStatus(id,authToken):
    global endpoints, listeners
    success = False
    error = None
    endpoint = next((e for e in endpoints if e["id"] == id), None)
    if endpoint:
        if endpoint.get("status") == "offline":
            logger.debug(endpoint)
            try:
                endpointYaml = yaml.safe_load(endpoint.get("endpointYaml"))
                logger.debug(f"Starting endpoint {endpoint.get('name')} with options: {endpointYaml}")
                listener:ngrok.Listener = await ngrok.forward(authtoken=authToken, **endpointYaml)
                logger.info(f"Ingress established for endpoint {endpoint.get('name')} at: {listener.url()}")
                listeners[id] = listener  # Store listener in the dictionary
                endpoint["listener_id"] = id
                endpoint["status"] = "online"
                success = True
            except Exception as e:
                logger.error(f"Listener setup error: {e}")
                error= e.args[1]

        else:
            logger.debug(f"Stopping endpoint {endpoint['name']}")
            try:
                listeners[endpoint["listener_id"]].close()  # Close the listener
                del listeners[endpoint["listener_id"]]  # Remove listener from the dictionary
                #endpoint["listener"].close()
                logger.info(f"Ingress closed")
                endpoint["listener_id"] = None
                endpoint["status"] = "offline"
                success = True
            except Exception as e:
                logger.error(f"Listener close error: {e}")
                error= e.args[1]
    return {"success": success,"endpoints": endpoints,"error": error }

def getEndpoints():
    return endpoints

def addEndpoint(endpoint):
    global endpoints
    endpoints.append({
        **endpoint,
        "status": "offline",
         "listener_id": None
    })
    return endpoints

async def update(e,id,newEndpoint):
        global endpoints, listeners
        if e["id"] == id:
            if e["status"] == "online" and e["listener_id"] is not None:
                listeners[e["listener_id"]].close()  # Close the listener
                del listeners[e["listener_id"]]  # Remove listener from the dictionary
            return {**e, **newEndpoint, "status": "offline", "listener_id": None}
        return e

async def updateEndpoint(id,endpoint):
   global endpoints, listeners
   # Update endpoints list
   endpoints = await asyncio.gather(*[update(e,id,endpoint) for e in endpoints])
   return endpoints
   
def deleteEndpoint(id):
    global endpoints, listeners
    endpoints = [e for e in endpoints if e["id"] != id]
    print(endpoints)
    if id in listeners:
        listeners[id].close()
        del listeners[id]
    return endpoints
