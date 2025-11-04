/**
 * Email sending utility for tournament invitations
 * Supports Resend, SendGrid, and console fallback for development
 */

interface InviteEmailData {
  to: string;
  display_name: string;
  tournament_title: string;
  tournament_location: string;
  tournament_date: string;
  invite_link: string;
  invited_by: string;
}

/**
 * Send invitation email using configured provider
 */
export async function sendInviteEmail(data: InviteEmailData): Promise<{ success: boolean; error?: string }> {
  const provider = process.env.EMAIL_PROVIDER || 'console';

  // Development fallback - log to console
  if (provider === 'console' || !process.env.EMAIL_API_KEY) {
    console.log('='.repeat(80));
    console.log('📧 INVITATION EMAIL (Development Mode)');
    console.log('='.repeat(80));
    console.log(`To: ${data.to}`);
    console.log(`Subject: You're invited to ${data.tournament_title}`);
    console.log(`\nHi ${data.display_name},\n`);
    console.log(`${data.invited_by} has invited you to participate in "${data.tournament_title}".`);
    console.log(`\nTournament Details:`);
    console.log(`- Location: ${data.tournament_location}`);
    console.log(`- Date: ${data.tournament_date}`);
    console.log(`\nAccept your invitation here:`);
    console.log(`${data.invite_link}`);
    console.log(`\nIf you already have an account, sign in and your invitation will be linked automatically.`);
    console.log('='.repeat(80));
    return { success: true };
  }

  try {
    if (provider === 'resend') {
      return await sendViaResend(data);
    } else if (provider === 'sendgrid') {
      return await sendViaSendGrid(data);
    } else {
      return { success: false, error: 'Unknown email provider' };
    }
  } catch (error: any) {
    console.error('Email sending error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Send via Resend API
 */
async function sendViaResend(data: InviteEmailData): Promise<{ success: boolean; error?: string }> {
  const apiKey = process.env.EMAIL_API_KEY;
  const from = process.env.EMAIL_FROM || 'PickleTourneys <no-reply@pickletourney.com>';

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      from,
      to: data.to,
      subject: `You're invited to ${data.tournament_title}`,
      html: getInviteEmailHTML(data),
    }),
  });

  const result = await response.json();

  if (!response.ok) {
    return { success: false, error: result.message || 'Failed to send email' };
  }

  return { success: true };
}

/**
 * Send via SendGrid API
 */
async function sendViaSendGrid(data: InviteEmailData): Promise<{ success: boolean; error?: string }> {
  const apiKey = process.env.EMAIL_API_KEY;
  const from = process.env.EMAIL_FROM || 'no-reply@pickletourney.com';

  const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      personalizations: [
        {
          to: [{ email: data.to }],
          subject: `You're invited to ${data.tournament_title}`,
        },
      ],
      from: { email: from },
      content: [
        {
          type: 'text/html',
          value: getInviteEmailHTML(data),
        },
      ],
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    return { success: false, error };
  }

  return { success: true };
}

/**
 * Generate HTML email template
 */
function getInviteEmailHTML(data: InviteEmailData): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0;">🏓 Pickle Tourney</h1>
  </div>
  
  <div style="background: white; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
    <h2 style="color: #1f2937; margin-top: 0;">You're Invited!</h2>
    
    <p>Hi <strong>${data.display_name}</strong>,</p>
    
    <p><strong>${data.invited_by}</strong> has invited you to participate in:</p>
    
    <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <h3 style="margin-top: 0; color: #0284c7;">${data.tournament_title}</h3>
      <p style="margin: 5px 0;"><strong>📍 Location:</strong> ${data.tournament_location}</p>
      <p style="margin: 5px 0;"><strong>📅 Date:</strong> ${data.tournament_date}</p>
    </div>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${data.invite_link}" 
         style="background: #0284c7; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold;">
        Accept Invitation
      </a>
    </div>
    
    <p style="color: #6b7280; font-size: 14px;">
      If you already have an account, simply sign in and your invitation will be linked automatically.
      If you're new, you'll be guided to create an account.
    </p>
    
    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
    
    <p style="color: #9ca3af; font-size: 12px; text-align: center;">
      This invitation expires in 72 hours. If you have any questions, contact the tournament organizer.
    </p>
  </div>
</body>
</html>
  `;
}

