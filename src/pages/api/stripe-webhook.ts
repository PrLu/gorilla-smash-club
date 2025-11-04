import { NextApiRequest, NextApiResponse } from 'next';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_stub', {
  apiVersion: '2023-10-16',
});

/**
 * Stripe Webhook Handler (Stub)
 * TODO: Implement full webhook handling for payment events
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const signature = req.headers['stripe-signature'];

  if (!signature) {
    return res.status(400).json({ error: 'No signature' });
  }

  try {
    // TODO: Verify webhook signature
    // const event = stripe.webhooks.constructEvent(
    //   req.body,
    //   signature,
    //   process.env.STRIPE_WEBHOOK_SECRET!
    // );

    // For now, parse the event manually (stub)
    const event = req.body as Stripe.Event;

    console.log('Webhook received:', event.type);

    // Handle different event types
    switch (event.type) {
      case 'payment_intent.succeeded':
        // TODO: Update payment status in database
        console.log('Payment succeeded:', event.data.object);
        break;
      case 'payment_intent.payment_failed':
        // TODO: Update payment status in database
        console.log('Payment failed:', event.data.object);
        break;
      default:
        console.log('Unhandled event type:', event.type);
    }

    return res.status(200).json({ received: true });
  } catch (error: any) {
    console.error('Webhook error:', error);
    return res.status(400).json({ error: error.message });
  }
}

// Disable body parser for raw body verification
export const config = {
  api: {
    bodyParser: false,
  },
};

