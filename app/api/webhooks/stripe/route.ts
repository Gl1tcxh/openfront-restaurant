import { NextRequest, NextResponse } from 'next/server';
import { keystoneContext } from '@/features/keystone/context';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const body = await request.json();
  const headers: Record<string, string> = {};
  request.headers.forEach((value, key) => {
    headers[key] = value;
  });

  try {
    const context = keystoneContext.sudo();
    
    // Call the generic handlePaymentProviderWebhook mutation
    // This allows the logic to be centralized and use the adapter system
    const result = await context.graphql.run({
      query: `
        mutation HandleWebhook($providerCode: String!, $event: JSON!, $headers: JSON!) {
          handlePaymentProviderWebhook(providerCode: $providerCode, event: $event, headers: $headers) {
            success
            error
          }
        }
      `,
      variables: {
        providerCode: 'pp_stripe',
        event: body,
        headers: headers
      }
    });

    if (result.handlePaymentProviderWebhook?.success) {
      return NextResponse.json({ received: true });
    } else {
      console.error('Webhook processing failed:', result.handlePaymentProviderWebhook?.error || result.errors);
      return NextResponse.json(
        { error: result.handlePaymentProviderWebhook?.error || 'Processing failed' },
        { status: 500 }
      );
    }
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    console.error(`Error processing Stripe webhook: ${errorMessage}`);
    return NextResponse.json(
      { error: `Webhook processing failed: ${errorMessage}` },
      { status: 500 }
    );
  }
}
