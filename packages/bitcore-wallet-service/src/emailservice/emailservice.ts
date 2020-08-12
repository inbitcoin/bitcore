#!/usr/bin/env node
import logger from '../lib/logger';
var config = require('../config');
const EmailService = require('../lib/emailservice');

logger.level = process.env.LOG_LEVEL || 'info';
const emailService = new EmailService();
emailService.start(config, err => {
  if (err) throw err;

  logger.info('Email service started');
});
