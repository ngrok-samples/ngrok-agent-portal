import logging
import requests
import os
from utils.appError import AppError

from fastapi import HTTPException
from utils.logger import logger
import endpointsmanager     

def getAgentStatus():
    response= {"success": True, "message": "Connected"}
    logger.debug(response)
    return response
async def fetchAgentConfig():
    #  not user:
    #     raise HTTPException(
    #         status_code=404,
    #         detail="The user with this email does not exist in the system.",
    #     )
    try:
        logger.debug(f"fetching agent config from {os.environ['BACKEND_URL']}/api/v1/endpoint/{os.environ['AGENT_ID']}")
        response =  requests.get(
            f"{os.environ['BACKEND_URL']}/api/v1/endpoint/{os.environ['AGENT_ID']}",
            headers={"AGENT_TOKEN": os.environ['AGENT_TOKEN'],"AGENT_ID":os.environ['AGENT_ID']}
        )
        response= response.json()
        if response.get("success")==True:
            data= response.get("data")
            logger.debug(data)
            return {
                "success": True,
                "data": [
                    {**item, "id": item["_id"]} if item.get("_id") else item 
                    for item in data.get("doc")
                ]
            }
        else:
            logger.debug("Error in fetching agent config")
            logger.debug(response)
            return {"success": False, "message": "Something went wrong"}
    except Exception as err:
        logger.debug("Error in fetching agent config",err)
        return {"success": False, "message": "Something went wrong"}

async def updateEndPointStatus(endpointId: str,authToken:str):
  
    endpoint_response = await endpointsmanager.changeEndpointsStatus(endpointId,authToken)
    logger.debug(endpoint_response)
    if not endpoint_response.get("success")==True:
        raise AppError(status_code=404,detail=endpoint_response.get("error") or "Agent endpoint not updated")

    new_end_point_doc = next((x for x in endpoint_response.get("endpoints") if x["_id"] == endpointId), None)
    return {"success": True, "data": {"doc": new_end_point_doc}}

async def getEndPointStatus():
    response= {"success": True, "data": {"doc": endpointsmanager.getEndpoints()}}
    logger.debug(response)
    return response

async def addEndpoint(endpoint: dict):
    if "_id" in endpoint:
        endpoint["id"] = endpoint["_id"]
    endpoint_response = endpointsmanager.addEndpoint(endpoint)
    response= {"success": True, "data": {"doc": endpoint_response}}
    logger.debug(response)
    return response


async def updateEndpoint(endpointId: str,endpoint: dict):
    endpoint_response = await endpointsmanager.updateEndpoint(endpointId, endpoint)
    if not endpoint_response:
        return {"success": False, "error": "Endpoint not found"}
    response= {"success": True, "data": {"doc": endpoint_response}}
    logger.debug(response)
    return response

async def deleteEndpoint(endpointId: str):
    endpoint_response = endpointsmanager.deleteEndpoint(endpointId)
    response= {"success": True, "data": {"doc": endpoint_response}}
    logger.debug(response)
    return response 
