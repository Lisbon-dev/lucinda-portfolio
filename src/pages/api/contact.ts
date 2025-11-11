/**
 * Contact Form API Endpoint
 * Serverless function for handling contact form submissions with Resend
 */
export const runtime = 'edge';
export const prerender = false;

import { Resend } from 'resend';
import { 
  validateContactForm, 
  createSafeContactFormData, 
  type ContactFormData 
} from '../../components/forms/FormValidation';

// Initialize Resend client
const resend = new Resend(import.meta.env.RESEND_API_KEY);

// Rate limiting configuration
const RATE_LIMIT_MAX_REQUESTS = 5;
const RATE_LIMIT_WINDOW = 60 * 60 * 1000; // 1 hour in milliseconds
const rateLimitMap = new Map<string, { count: number; windowStart: number }>();

interface APIResponse {
  success: boolean;
  message?: string;
  errors?: Record<string, string>;
}

/**
 * Handle POST requests to send contact form emails
 */
export async function POST({ request }: { request: Request }): Promise<Response> {
  try {
    // Get client IP for rate limiting
    const clientIP = getClientIP(request);
    
    // Check rate limit
    if (!checkRateLimit(clientIP)) {
      return createErrorResponse(
        { success: false, message: 'Too many requests. Please try again later.' },
        429
      );
    }

    // Parse and validate request
    const contentType = request.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      return createErrorResponse(
        { success: false, message: 'Invalid content type. Expected application/json.' },
        400
      );
    }

    let rawData: any;
    try {
      rawData = await request.json();
    } catch (error) {
      return createErrorResponse(
        { success: false, message: 'Invalid JSON payload.' },
        400
      );
    }

    // Create safe form data and validate
    const contactData = createSafeContactFormData(rawData);
    const validation = validateContactForm(contactData);

    if (!validation.isValid) {
      return createErrorResponse({
        success: false,
        message: 'Validation failed. Please check your inputs.',
        errors: validation.errors
      }, 400);
    }

    // Verify required environment variables
    if (!import.meta.env.RESEND_API_KEY) {
      console.error('RESEND_API_KEY environment variable is not set');
      return createErrorResponse(
        { success: false, message: 'Email service configuration error.' },
        500
      );
    }

    // Send email via Resend
    const emailResult = await sendContactEmail(contactData);

    if (emailResult.success) {
      // Increment rate limit counter
      incrementRateLimit(clientIP);
      
      return createSuccessResponse({
        success: true,
        message: 'Thank you for your message! I\'ll get back to you soon.'
      });
    } else {
      return createErrorResponse(
        { success: false, message: emailResult.error || 'Failed to send message.' },
        500
      );
    }

  } catch (error) {
    console.error('Contact form API error:', error);
    return createErrorResponse(
      { success: false, message: 'Internal server error. Please try again later.' },
      500
    );
  }
}

/**
 * Send contact email using Resend
 */
async function sendContactEmail(data: ContactFormData): Promise<{ success: boolean; error?: string }> {
  try {
    const emailHtml = generateEmailTemplate(data);
    const emailText = generatePlainTextEmail(data);

    const result = await resend.emails.send({
      from: import.meta.env.CONTACT_FROM_EMAIL || 'contact@lucindaburman.com',
      to: [import.meta.env.CONTACT_TO_EMAIL || 'lucinda.burman@yahoo.co.uk'],
      replyTo: data.email,
      subject: `Portfolio Contact: ${data.subject}`,
      html: emailHtml,
      text: emailText,
      // Optional: Add tags for tracking
      tags: [
        { name: 'category', value: 'contact-form' },
        { name: 'subject', value: data.subject.toLowerCase().replace(' ', '-') }
      ]
    });

    if (result.error) {
      console.error('Resend API error:', result.error);
      return { success: false, error: 'Email delivery failed' };
    }

    console.log('Contact email sent successfully:', result.data?.id);
    return { success: true };

  } catch (error) {
    console.error('Email sending error:', error);
    return { success: false, error: 'Email service error' };
  }
}

/**
 * Generate professional HTML email template
 */
function generateEmailTemplate(data: ContactFormData): string {
  const subjectLabels: Record<string, string> = {
    general: 'General Inquiry',
    project: 'Project Collaboration',
    commission: 'Commission Request',
    press: 'Press & Media',
    other: 'Other'
  };

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>New Portfolio Contact</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
          background-color: #f9f9f9;
        }
        .email-container {
          background: white;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        }
        .email-header {
          background: #325c59;
          color: white;
          padding: 30px 30px 20px;
        }
        .email-header h1 {
          margin: 0 0 10px;
          font-size: 24px;
          font-weight: 400;
        }
        .email-header p {
          margin: 0;
          opacity: 0.9;
          font-size: 14px;
        }
        .email-body {
          padding: 30px;
        }
        .field {
          margin-bottom: 25px;
        }
        .field-label {
          font-weight: 600;
          color: #325c59;
          font-size: 14px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 8px;
        }
        .field-value {
          background: #f5f4f2;
          padding: 15px;
          border-radius: 4px;
          border-left: 4px solid #325c59;
        }
        .message-field .field-value {
          white-space: pre-line;
          line-height: 1.7;
        }
        .email-footer {
          background: #f8f8f8;
          padding: 20px 30px;
          border-top: 1px solid #eee;
          font-size: 12px;
          color: #666;
          text-align: center;
        }
        .timestamp {
          font-style: italic;
          color: #888;
        }
      </style>
    </head>
    <body>
      <div class="email-container">
        <header class="email-header">
          <h1>New Portfolio Contact</h1>
          <p>Message received via lucindaburman.com</p>
        </header>
        
        <main class="email-body">
          <div class="field">
            <div class="field-label">From</div>
            <div class="field-value">${data.name}</div>
          </div>
          
          <div class="field">
            <div class="field-label">Email</div>
            <div class="field-value">
              <a href="mailto:${data.email}" style="color: #325c59; text-decoration: none;">
                ${data.email}
              </a>
            </div>
          </div>
          
          <div class="field">
            <div class="field-label">Subject</div>
            <div class="field-value">${subjectLabels[data.subject] || data.subject}</div>
          </div>
          
          <div class="field message-field">
            <div class="field-label">Message</div>
            <div class="field-value">${data.message}</div>
          </div>
        </main>
        
        <footer class="email-footer">
          <p class="timestamp">
            Received on ${new Date().toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
              timeZoneName: 'short'
            })}
          </p>
          <p>This message was sent through the contact form at lucindaburman.com</p>
        </footer>
      </div>
    </body>
    </html>
  `;
}

/**
 * Generate plain text email
 */
function generatePlainTextEmail(data: ContactFormData): string {
  const subjectLabels: Record<string, string> = {
    general: 'General Inquiry',
    project: 'Project Collaboration',
    commission: 'Commission Request',
    press: 'Press & Media',
    other: 'Other'
  };

  const timestamp = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short'
  });

  return `
NEW PORTFOLIO CONTACT
====================

From: ${data.name}
Email: ${data.email}
Subject: ${subjectLabels[data.subject] || data.subject}

MESSAGE:
--------
${data.message}

---
Received on ${timestamp}
This message was sent through the contact form at lucindaburman.com
  `.trim();
}

/**
 * Get client IP address from request
 */
function getClientIP(request: Request): string {
  // Try various headers that might contain the real IP
  const headers = [
    'cf-connecting-ip', // Cloudflare
    'x-forwarded-for',  // Standard proxy header
    'x-real-ip',        // Nginx
    'x-client-ip',      // Apache
  ];

  for (const header of headers) {
    const ip = request.headers.get(header);
    if (ip) {
      // x-forwarded-for can contain multiple IPs, take the first one
      return ip.split(',')[0].trim();
    }
  }

  // Fallback to a generic identifier
  return 'unknown';
}

/**
 * Check if request is within rate limit
 */
function checkRateLimit(clientIP: string): boolean {
  const now = Date.now();
  const clientData = rateLimitMap.get(clientIP);

  if (!clientData) {
    return true; // First request from this IP
  }

  // Check if current window has expired
  if (now - clientData.windowStart > RATE_LIMIT_WINDOW) {
    // Reset the window
    rateLimitMap.delete(clientIP);
    return true;
  }

  // Check if within rate limit
  return clientData.count < RATE_LIMIT_MAX_REQUESTS;
}

/**
 * Increment rate limit counter
 */
function incrementRateLimit(clientIP: string): void {
  const now = Date.now();
  const clientData = rateLimitMap.get(clientIP);

  if (!clientData || now - clientData.windowStart > RATE_LIMIT_WINDOW) {
    // Start new window
    rateLimitMap.set(clientIP, { count: 1, windowStart: now });
  } else {
    // Increment existing window
    clientData.count++;
    rateLimitMap.set(clientIP, clientData);
  }
}

/**
 * Create successful JSON response
 */
function createSuccessResponse(data: APIResponse): Response {
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store, no-cache, must-revalidate',
    }
  });
}

/**
 * Create error JSON response
 */
function createErrorResponse(data: APIResponse, status: number): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store, no-cache, must-revalidate',
    }
  });
}

/**
 * Handle unsupported HTTP methods
 */
export async function GET(): Promise<Response> {
  return createErrorResponse(
    { success: false, message: 'Method not allowed. Use POST to submit contact form.' },
    405
  );
}

export async function PUT(): Promise<Response> {
  return createErrorResponse(
    { success: false, message: 'Method not allowed. Use POST to submit contact form.' },
    405
  );
}

export async function DELETE(): Promise<Response> {
  return createErrorResponse(
    { success: false, message: 'Method not allowed. Use POST to submit contact form.' },
    405
  );
}