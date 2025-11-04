import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_stub', {
  apiVersion: '2023-10-16',
});

/**
 * Stripe Webhook Handler (Stub)
 * Handles payment events from Stripe
 */
export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: 'No signature' }, { status: 400 });
  }

  try {
    // Verify webhook signature (in production)
    // const event = stripe.webhooks.constructEvent(
    //   body,
    //   signature,
    //   process.env.STRIPE_WEBHOOK_SECRET!
    // );

    // For stub, parse directly
    const event = JSON.parse(body) as Stripe.Event;

    // Use service role for database updates
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    switch (event.type) {
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;

        // Update payment record
        await supabase
          .from('payments')
          .update({
            status: 'succeeded',
            updated_at: new Date().toISOString(),
          })
          .eq('stripe_payment_intent_id', paymentIntent.id);

        // Update registration payment status
        const { data: payment } = await supabase
          .from('payments')
          .select('registration_id')
          .eq('stripe_payment_intent_id', paymentIntent.id)
          .single();

        if (payment) {
          await supabase
            .from('registrations')
            .update({
              payment_status: 'paid',
              status: 'confirmed',
              updated_at: new Date().toISOString(),
            })
            .eq('id', payment.registration_id);
        }

        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;

        await supabase
          .from('payments')
          .update({
            status: 'failed',
            updated_at: new Date().toISOString(),
          })
          .eq('stripe_payment_intent_id', paymentIntent.id);

        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

