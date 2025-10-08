const apiFormatter = (req, res, next) => {
  const originalJson = res.json;
  res.json = function(data) {
    if (data && typeof data === 'object' && 'success' in data) {
      return originalJson.call(this, data);
    }

    const isError = data.error || res.statusCode >= 400;

    // Format standard response
    const formattedResponse = {
      author: 'kiznavierr',
      success: !isError,
      code: data.code || res.statusCode || (isError ? 500 : 200),
      data: isError ? null : (data.data || data),
      message: isError ? (data.message || data.error || 'Error') : undefined
    };

    return originalJson.call(this, formattedResponse);
  };

  next();
};

export default apiFormatter;