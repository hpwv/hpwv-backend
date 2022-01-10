const {logger} = require('../log/logger');

class ErrorHandler extends Error {
    constructor(statusCode, message) {
        super();
        this.statusCode = statusCode;
        this.message = message;
    }
}

const handleError = (err, res) => {
    logger.error(err);
    const {statusCode, message} = err;

    res.status(getStatusCode(err, statusCode)).json({
        status: "error",
        statusCode: getStatusCode(err, statusCode),
        message
    });
};

function getStatusCode(err, statusCode) {
    if (statusCode) return statusCode;
    return 500;
}

module.exports = {
    ErrorHandler,
    handleError
};
