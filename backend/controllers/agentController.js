const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const Agent = require("../models/agent");

exports.update = catchAsync(async (req, res, next) => {
  const { agentToken, authToken, apiKey, agentYaml, agentAddress } = req.body;

  const doc = await Agent.findByIdAndUpdate(
    req.params.id,
    { agentToken, authToken, apiKey, agentYaml, agentAddress },
    {
      new: true,
      runValidators: true,
    }
  );
  if (!doc) {
    return next(new AppError("Agent not updated", 404));
  }
  res.status(200).json({
    success: true,
    data: {
      doc,
    },
  });
});

exports.createOne = catchAsync(async (req, res, next) => {
  const { id, agentToken, authToken, apiKey, agentYaml, agentAddress } =
    req.body;

  const doc = await Agent.create({
    _id: id,
    agentToken,
    authToken,
    apiKey,
    agentYaml,
    agentAddress,
  });
  if (!doc) return next(new AppError("Something went wrong", 500));

  res.status(201).json({
    success: true,
    data: {
      doc,
    },
  });
});

exports.getOne = catchAsync(async (req, res, next) => {
  //Tour.find({_id:req.params.id})
  let doc = await Agent.findById(req.params.id);
  if (!doc) {
    return next(new AppError("Requested Agent not found", 404));
  }
  res.status(200).json({
    success: true,
    data: { doc },
  });
});
exports.getAll = catchAsync(async (req, res, next) => {
  // const doc = await Agent.find().sort({
  //   createdOn: "descending",
  // });

  const doc = await Agent.aggregate([
    { $sort: { createdOn: -1 } },
    {
      $set: {
        endpoints: {
          $sortArray: { input: "$endpoints", sortBy: { createdOn: -1 } },
        },
      },
    },
  ]);
  res.status(200).json({
    success: true,
    result: doc.length,
    data: { doc },
  });
});
exports.delete = catchAsync(async (req, res, next) => {
  const doc = await Agent.findByIdAndDelete(req.params.id);
  if (!doc) {
    return next(new AppError("Requested Agent not found", 404));
  }
  res.status(200).json({
    success: true,
    message: "deleted Successfully",
  });
});
