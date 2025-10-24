function getTokenFromRequest(req) {
  let token = req.get("token");
  if (!token) {
    const authHeader = req.get("authorization");
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1];
    }
  }
  if (!token && req.body && req.body.token) {
    token = req.body.token;
  }

  return token;
}

module.exports = getTokenFromRequest;
