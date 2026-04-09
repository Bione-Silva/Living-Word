const Stripe = require('stripe');
const stripe = Stripe('sk_test_REMOVED_FOR_SECURITY');

async function main() {
  try {
    const webhookEndpoint = await stripe.webhookEndpoints.create({
      url: 'https://priumwdestycikzfcysg.supabase.co/functions/v1/stripe-webhook',
      enabled_events: [
        'invoice.paid',
        'customer.subscription.deleted',
      ],
    });
    console.log('WEBHOOK_SECRET=' + webhookEndpoint.secret);
  } catch (err) {
    console.error('Error:', err.message);
  }
}
main();
