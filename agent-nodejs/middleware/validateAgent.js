module.exports = async (req, res, next) => {
  const agentToken = req.header("AGENT_ID");
  const agentId = req.header("AGENT_TOKEN");
  if (!agentToken || !agentId) {
    console.warn("Access denied. No token provided");
    return res.status(401).json({ error: "Access denied. No token provided" });
  }

  if (
    process.env.AGENT_ID !== agentId ||
    process.env.AGENT_TOKEN !== agentToken
  ) {
    console.warn("Access denied. Token Mismatched");
    return res.status(401).json({ error: "Access denied. Token Mismatched" });
  }

  next();
};
