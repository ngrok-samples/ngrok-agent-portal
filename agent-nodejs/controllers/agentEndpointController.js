const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const axios = require("axios");
const endpointManager = require("../endpointsmanager");
const logger = require("../utils/logger");

//to check agent server is on
exports.getAgentStatus = catchAsync(async (req, res, next) => {
  res.status(200).json({
    success: true,
    message: "Connected",
  });
});

//this will fetch all agent endpointsto maintain internal list
exports.fetchAgentConfig = async () => {
  try {
    logger.debug("fetching agent config from " + `${process.env.BACKEND_URL}/api/v1/endpoint/${process.env.AGENT_ID}`)
    const response = await axios({
      method: "Get",
      url: `${process.env.BACKEND_URL}/api/v1/endpoint/${process.env.AGENT_ID}`,
      headers: {
        token: process.env.AGENT_TOKEN,
      },
    });

    if (response.data.success) {
      logger.debug(JSON.stringify(response.data));
      return {
        success: true,
        data: response.data.data.doc.map((item) => {
          if (!item._id) return item;
          return {
            ...item,
            id: item._id,
          };
        }),
      };
    } else {
      logger.debug("Error in fetching agent config");
      logger.debug(JSON.stringify(response));
      return {
        success: false,
        message: "Something went wrong",
      };
    }
  } catch (err) {
    logger.debug("Error in fetching agent config");
    return {
      success: false,
      message: "Something went wrong",
    };
  }
};

//this will change agent endpoint status
exports.updateEndPointStatus = catchAsync(async (req, res, next) => {
  const id = req.params.endpointId;
  const agentToken = req.headers.token;
  if (agentToken !== process.env.AGENT_TOKEN) {
    return next(new AppError("Agent endpoint not found", 404));
  }

  let endpointResponse = await endpointManager.changeEndpointsStatus(id);

  if (!endpointResponse.success) {
    return next(new AppError("Agent endpoint not updated", 404));
  }

  const newEndPointDoc = endpointResponse.data.find((x) => x._id === id);
  res.status(200).json({
    success: true,
    data: {
      doc: newEndPointDoc,
    },
  });
});

//This will give status of endpoints
exports.getEndPointStatus = catchAsync(async (req, res, next) => {
  const agentId = req.params.agentId;
  const agentToken = req.headers.token;
  if (
    agentId !== process.env.AGENT_ID ||
    agentToken !== process.env.AGENT_TOKEN
  ) {
    return next(new AppError("Agent endpoint not found", 404));
  }

  res.status(200).json({
    success: true,
    data: {
      doc: endpointManager.getEndpoints(),
    },
  });
});

exports.addEndpoint = catchAsync(async (req, res, next) => {
  const agentToken = req.headers.token;
  if (agentToken !== process.env.AGENT_TOKEN) {
    return next(new AppError("Agent endpoint not found", 404));
  }

  let body = req.body;
  if (body._id) body.id = body._id;
  let endpointResponse = endpointManager.addEndpoint(body);
  res.status(200).json({
    success: true,
    data: {
      doc: endpointResponse,
    },
  });
});
exports.deleteEndpoint = catchAsync(async (req, res, next) => {
  const id = req.params.endpointId;
  const agentToken = req.headers.token;
  if (agentToken !== process.env.AGENT_TOKEN) {
    return next(new AppError("Agent endpoint not found", 404));
  }
  let endpointResponse = endpointManager.deleteEndpoint(id);

  res.status(200).json({
    success: true,
    data: {
      doc: endpointResponse,
    },
  });
});
