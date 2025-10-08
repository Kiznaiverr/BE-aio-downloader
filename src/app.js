import 'dotenv/config';
import express from 'express';
import securityMiddleware from './middleware/security.js';
import apiFormatter from './middleware/apiFormatter.js';
import { withLogging } from './middleware/logger.js';
import routes from './routes/index.js';

const app = express();
const PORT = process.env.PORT

app.use(securityMiddleware);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(apiFormatter);

Object.entries(routes).forEach(([path, router]) => {
  app.use(`/api/${path}`, router);
});

app.get('/', (req, res) => {
  res.json({
    message: 'hello from kiznavierr',
    description : 'sometimes even reality is a lie',
    version: '1.0.0'
  });
});

app.get('/health', withLogging((req, res) => {
  const uptime = process.uptime();
  const memoryUsage = process.memoryUsage();
  const version = process.version;
  const platform = process.platform;
  const arch = process.arch;

  res.json({
    status: 'OK',
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    uptime: `${Math.floor(uptime / 3600)}h ${Math.floor((uptime % 3600) / 60)}m ${Math.floor(uptime % 60)}s`,
    memory: {
      rss: `${(memoryUsage.rss / 1024 / 1024).toFixed(2)} MB`,
      heapTotal: `${(memoryUsage.heapTotal / 1024 / 1024).toFixed(2)} MB`,
      heapUsed: `${(memoryUsage.heapUsed / 1024 / 1024).toFixed(2)} MB`,
      external: `${(memoryUsage.external / 1024 / 1024).toFixed(2)} MB`
    },
    system: {
      platform,
      arch,
      nodeVersion: version
    }
  });
}));

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

app.use(withLogging((req, res) => {
  if (req.path.startsWith('/api/')) {
    res.status(405).json({ error: 'Method not allowed for this endpoint' });
  } else {
    res.status(404).json({ error: 'Endpoint not found' });
  }
}));

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);

});

export default app;
