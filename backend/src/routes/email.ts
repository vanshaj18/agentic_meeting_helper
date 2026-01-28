/**
 * Email Routes
 * Handles email-related API endpoints
 */

import express from 'express';
import { sendMeetingRecap, MeetingEmailPayload } from '../services/emailService';
import { logger } from '../utils/logger';

const router = express.Router();

/**
 * Send meeting recap email
 * POST /email/meeting-recap
 * Body: MeetingEmailPayload
 */
router.post('/meeting-recap', async (req, res) => {
  logger.info('API: Send meeting recap email request', {
    to: req.body.to,
    meetingTitle: req.body.meetingTitle,
  });

  try {
    const payload: MeetingEmailPayload = req.body;

    // Validate required fields
    if (!payload.to || !payload.meetingTitle || !payload.summary) {
      return res.status(400).json({
        error: 'Missing required fields: to, meetingTitle, and summary are required',
      });
    }

    const result = await sendMeetingRecap(payload);

    if (!result.success) {
      logger.error('API: Failed to send meeting recap email', undefined, {
        to: payload.to,
        error: result.error,
      });
      return res.status(500).json({
        error: result.error || 'Failed to send email',
      });
    }

    logger.info('API: Meeting recap email sent successfully', {
      to: payload.to,
      meetingTitle: payload.meetingTitle,
    });

    res.json({ success: true, message: 'Email sent successfully' });
  } catch (error: any) {
    logger.error('API: Meeting recap email exception', error);
    res.status(500).json({
      error: error.message || 'Failed to send email',
    });
  }
});

export default router;
