function ok(res, message, data = {}, statusCode = 200) {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
}

function fail(res, message, errors = [], statusCode = 400) {
  return res.status(statusCode).json({
    success: false,
    message,
    errors,
  });
}

module.exports = { ok, fail };
