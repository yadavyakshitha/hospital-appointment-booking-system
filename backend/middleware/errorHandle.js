function errorHandler(err, req, res, next) {
    if (res.headersSent) {
        return next(err);
    }

    console.error("Request failed:", {
        method: req.method,
        path: req.path,
        message: err.message
    });

    res.status(err.status || 500).json({
        success: false,
        message:
            err.status && err.status < 500
                ? err.message
                : "An unexpected server error occurred."
    });
}

module.exports = errorHandler;