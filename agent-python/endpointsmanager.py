import logging
import yaml
import ngrok

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

async def changeEndpointsStatus(id):
    global endpoints, listeners
    success = False
    endpoint = next((e for e in endpoints if e["id"] == id), None)
    if endpoint:
        if endpoint.get("status") == "offline":
            logger.debug(endpoint)
            try:
                endpointYaml = yaml.safe_load(endpoint.get("endpointYaml"))
                logger.debug(f"Starting endpoint {endpoint.get('name')} with options: {endpointYaml}")
                listener = await ngrok.forward(**{**{"authtoken_from_env": True}, **endpointYaml})
                logger.info(f"Ingress established for endpoint {endpoint.get('name')} at: {listener.url()}")
                listeners[id] = listener  # Store listener in the dictionary
                endpoint["listener_id"] = id
                endpoint["status"] = "online"
                success = True
            except Exception as e:
                logger.error(f"Listener setup error: {e}")
        else:
            logger.debug(f"Stopping endpoint {endpoint['name']}")
            try:
                await listeners[endpoint["listener_id"]].close()  # Close the listener
                del listeners[endpoint["listener_id"]]  # Remove listener from the dictionary
                logger.info(f"Ingress closed")
                endpoint["listener_id"] = None
                endpoint["status"] = "offline"
                success = True
            except Exception as e:
                logger.error(f"Listener close error: {e}")
    return {"success": success, "data": endpoints}

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

def deleteEndpoint(id):
    global endpoints, listeners
    endpoints = [e for e in endpoints if e["id"] != id]
    print(endpoints)
    if id in listeners:
        listeners[id].close()
        del listeners[id]
    return endpoints
