const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const path = require('path');
const rateLimit = require('express-rate-limit');
const { healthRouter } = require('./routes/health');
const { authRouter } = require('./routes/auth');
const { uploadsRouter } = require('./routes/uploads');
const { dashboardRouter } = require('./routes/dashboard');
const { profitRouter } = require('./routes/profit');
const { errorHandler } = require('./middleware/errorHandler');
const { getUploadsDirectory } = require('./config/storage');

const app = express();
const clientOrigin = process.env.CLIENT_ORIGIN || 'http://localhost:5173';
const apiLimiter = rateLimit({
	windowMs: 60 * 1000,
	max: 120,
	standardHeaders: true,
	legacyHeaders: false,
});

app.use(helmet());
app.use(cors({ origin: clientOrigin, credentials: true }));
app.use(compression());
app.use(apiLimiter);
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.resolve(getUploadsDirectory())));

app.use('/api/health', healthRouter);
app.use('/api/auth', authRouter);
app.use('/api/uploads', uploadsRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/profit', profitRouter);

app.use(errorHandler);

module.exports = app;
