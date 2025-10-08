class APILogger {
  constructor() {
    this.colors = {
      GET: '\x1b[32m',
      POST: '\x1b[33m',
      PUT: '\x1b[34m',
      DELETE: '\x1b[31m',
      PATCH: '\x1b[35m',
      reset: '\x1b[0m'
    }

    this.statusColors = {
      success: '\x1b[32m',
      redirect: '\x1b[36m',
      clientError: '\x1b[33m',
      serverError: '\x1b[31m',
      reset: '\x1b[0m'
    }
  }

  getStatusColor(statusCode) {
    if (statusCode >= 200 && statusCode < 300) return this.statusColors.success
    if (statusCode >= 300 && statusCode < 400) return this.statusColors.redirect
    if (statusCode >= 400 && statusCode < 500) return this.statusColors.clientError
    if (statusCode >= 500) return this.statusColors.serverError
    return this.statusColors.reset
  }

  formatResponseTime(ms) {
    return ms < 1000 ? `${Math.round(ms)}ms` : `${(ms / 1000).toFixed(2)}s`
  }

  cleanUrl(url) {
    return url.split('?')[0]
  }

  formatJakartaTime() {
    return new Intl.DateTimeFormat('id-ID', {
      timeZone: 'Asia/Jakarta',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }).format(new Date())
  }

  log(method, url, statusCode, responseTime) {
    const methodColor = this.colors[method] || this.colors.reset
    const statusColor = this.getStatusColor(statusCode)
    const cleanUrl = this.cleanUrl(url)
    const jakartaTime = this.formatJakartaTime()
    
    const logMessage = `${methodColor}${method}${this.colors.reset} ${cleanUrl} ${statusColor}${statusCode}${this.colors.reset} ${this.formatResponseTime(responseTime)} - ${jakartaTime}`
    console.log(logMessage)
  }
}

const logger = new APILogger()

export function withLogging(handler) {
  return async (req, res) => {
    const startTime = Date.now()
    let statusCode = 200
    let hasEnded = false

    const originalStatus = res.status
    const originalJson = res.json
    const originalSend = res.send
    const originalEnd = res.end

    res.status = function(code) {
      statusCode = code
      return originalStatus.call(this, code)
    }

    const logResponse = () => {
      if (!hasEnded) {
        hasEnded = true
        logger.log(req.method, req.originalUrl, statusCode, Date.now() - startTime)
      }
    }

    res.json = function(data) {
      logResponse()
      return originalJson.call(this, data)
    }

    res.send = function(data) {
      logResponse()
      return originalSend.call(this, data)
    }

    res.end = function(data) {
      logResponse()
      return originalEnd.call(this, data)
    }

    try {
      await handler(req, res)
    } catch (error) {
      statusCode = 500
      logResponse()
      
      if (!res.headersSent) {
        res.status(500).json({ 
          error: 'Internal Server Error',
          message: error.message 
        })
      }
    }
  }
}

export function logRequest(req, statusCode, startTime) {
  logger.log(req.method, req.url, statusCode, Date.now() - startTime)
}

export default logger