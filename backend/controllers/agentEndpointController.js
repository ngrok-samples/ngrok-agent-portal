const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const Agent = require("../models/agent");
const axios = require("axios");

exports.getEndpointStatus = catchAsync(async (req, res, next) => {
  let doc = await Agent.findById(req.params.agentId);
  if (!doc) {
    return next(new AppError("Requested Agent not found", 404));
  }
  try {
    const response = await axios.get(
      `${doc?.agentAddress}/getEndPointStatus/${doc._id}`,
      {
        headers: {
          AGENT_ID: doc._id,
          AGENT_TOKEN: doc.agentToken,
        },
      }
    );

    if (response.data.success) {
      res.status(200).json(response.data);
    } else {
      return next(new AppError("Agent is offline", 404));
    }
  } catch (err) {
    console.log(err);
    return next(new AppError("Agent is offline", 404));
  }
});
//Get all agents endpoints
exports.getAgentEndpoints = catchAsync(async (req, res, next) => {
  const doc = await Agent.findById(req.params.agentId);
  if (!doc) {
    return next(new AppError("Agent not found", 404));
  }
  const agentToken = req.headers.agent_token;
  const agentId = req.headers.agent_id;

  if (agentToken !== doc.agentToken || agentId !== doc._id) {
    return next(new AppError("Agent not found", 404));
  }
  res.status(200).json({
    success: true,
    result: doc?.endpoints?.length || 0,
    data: { doc: doc?.endpoints || [] },
  });
});

//to update status of endpoint
exports.updateEndPointStatus = catchAsync(async (req, res, next) => {
  const doc = await Agent.findById(req.params.agentId).lean();
  if (!doc) {
    return next(new AppError("Agent not found", 404));
  }
  const endPointDoc = doc.endpoints.find(
    (x) => x._id === req.params.endpointId
  );
  if (!endPointDoc) {
    return next(new AppError("Endpoint not found", 404));
  }
  try {
    const response = await axios({
      method: "Patch",
      url: `${doc.agentAddress}/updateStatus/${req.params.endpointId}`,
      data: {
        authToken: doc.authToken,
      },
      headers: {
        AGENT_ID: doc._id,
        AGENT_TOKEN: doc.agentToken,
      },
    });
    if (response.data.success) {
      res.status(200).json({
        success: true,
        data: {
          doc: response.data.data.doc,
        },
      });
    } else {
      return next(
        new AppError(response.data.message || "Agent endpoint not updated", 422)
      );
    }
  } catch (err) {
    console.log("----------------", err.response?.data);
    return next(
      new AppError(
        err.response?.data?.message || "Agent endpoint not updated",
        422
      )
    );
  }
});

//to update endpoints of agent
exports.updateEndpoint = catchAsync(async (req, res, next) => {
  const {
    name,
    endpointYaml,
    //proto, endPointaddr, crt, key
  } = req.body;

  const doc = await Agent.findOneAndUpdate(
    { _id: req.params.agentId, "endpoints._id": req.params.endpointId },
    {
      $set: {
        "endpoints.$.name": name,
        "endpoints.$.endpointYaml": endpointYaml,
        // "endpoints.$.proto": proto,
        // "endpoints.$.endPointaddr": endPointaddr,
        // "endpoints.$.crt": crt,
        // "endpoints.$.key": key,
      },
    },
    {
      new: true,
      runValidators: true,
    }
  ).lean();

  if (!doc) {
    return next(new AppError("Agent endpoints not updated", 404));
  }

  const newEndPointDoc = doc.endpoints.find(
    (x) => x._id === req.params.endpointId
  );

  try {
    const response = await axios.patch(
      `${doc.agentAddress}/updateEndpoint/${req.params.endpointId}`,
      newEndPointDoc,
      {
        headers: {
          AGENT_ID: doc._id,
          AGENT_TOKEN: doc.agentToken,
        },
      }
    );

    if (response.data.success) {
    } else {
    }
  } catch (err) {}
  res.status(200).json({
    success: true,
    data: {
      doc: {
        ...newEndPointDoc,
        status: "offline",
      },
    },
  });
});

//to create new endpoint
exports.createEndpoint = catchAsync(async (req, res, next) => {
  const {
    id,
    name,
    endpointYaml,
    // proto, endPointaddr, crt, key
  } = req.body;

  // if (proto === "tls") {
  //   if (crt === undefined || key === undefined) {
  //     return next(new AppError("crt or key cannot be empty for tls", 422));
  //   }
  // }
  const newEndpoint = {
    _id: id,
    name,
    endpointYaml,
    // proto,
    // endPointaddr,
    // crt,
    // key,
  };
  const doc = await Agent.findByIdAndUpdate(
    req.params.agentId,
    {
      $push: {
        endpoints: newEndpoint,
      },
    },
    {
      new: true,
      runValidators: true,
    }
  ).lean();

  if (!doc) return next(new AppError("Something went wrong", 500));
  const newEndPointDoc = doc.endpoints.find((x) => x._id === id);

  try {
    const response = await axios.post(
      `${doc.agentAddress}/addEndpoint/`,
      newEndPointDoc,
      {
        headers: {
          AGENT_ID: doc._id,
          AGENT_TOKEN: doc.agentToken,
        },
      }
    );

    if (response.data.success) {
    } else {
    }
  } catch (err) {}

  res.status(201).json({
    success: true,
    data: {
      doc: newEndPointDoc,
    },
  });
});

//to delete endpoint
exports.deleteEndpoint = catchAsync(async (req, res, next) => {
  const doc = await Agent.findByIdAndUpdate(
    req.params.agentId,
    {
      $pull: {
        endpoints: { _id: req.params.endpointId },
      },
    },
    {
      new: true,
      runValidators: true,
    }
  );
  if (!doc) {
    return next(new AppError("Requested Endpoint not found", 404));
  }
  try {
    const response = await axios({
      method: "delete",
      url: `${doc.agentAddress}/deleteEndpoint/${req.params.endpointId}`,
      headers: {
        AGENT_ID: doc._id,
        AGENT_TOKEN: doc.agentToken,
      },
    });

    if (response.data.success) {
    } else {
    }
  } catch (err) {}
  res.status(200).json({
    success: true,
    message: "deleted Successfully",
  });
});
