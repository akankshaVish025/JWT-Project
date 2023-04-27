const jwt = require("jsonwebtoken");
const config = process.env;

const verifyToken = async (req, res, next) => {
    try {
        const token = req.body.token || req.query.token || req.headers["x-access-token"];
        if (!token) {
            return res.status(403).json({ status: false, message: "Please provide token for authentication"});
        }
        const decode = jwt.verify(token, config.TOKEN_KEY);
        req.user = decode;
    } catch (err) {
        console.log(err);
        return res.status(401).send("Invalid token");
    }
    return next();
};

module.exports = { verifyToken };
// OR
// module.exports = verifyToken;