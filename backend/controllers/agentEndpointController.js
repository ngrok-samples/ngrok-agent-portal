const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const Agent = require("../models/agent");
const axios = require("axios");

//Get all agents endpoints
exports.getAgentEndpoints = catchAsync(async (req, res, next) => {
  const doc = await Agent.findById(req.params.agentId);
  if (!doc) {
    return next(new AppError("Agent not found", 404));
  }
  const agentToken = req.headers.token;
  if (agentToken !== doc.agentToken) {
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
      headers: {
        token: doc.agentToken,
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
      return next(new AppError("Agent endpoint not updated", 422));
    }
  } catch (err) {
    console.log(err);
    return next(new AppError("Agent endpoint not updated", 422));
  }
});

//to update endpoints of agent
exports.updateEndpoint = catchAsync(async (req, res, next) => {
  const {
    name,
    endpointYaml,
    //proto, endPointaddr, crt, key
  } = req.body;

  // if (proto === "tls") {
  //   if (crt === undefined || key === undefined) {
  //     return next(new AppError("crt or key cannot be empty for tls", 422));
  //   }
  // }
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

  res.status(200).json({
    success: true,
    data: {
      doc: newEndPointDoc,
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
          token: doc.agentToken,
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
        token: doc.agentToken,
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
