require('dotenv').config({ path: require('path').resolve(__dirname, '.env') });
const express = require('express');
const cors = require('cors');
const Stripe = require('stripe');

const app = express();
app.use(cors());
app.use(express.json());

// Initialize Stripe with the Secret Key from the environment
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

app.post('/create-payment-intent', async (req, res) => {
  try {
    const { amount, currency = 'inr' } = req.body;

    // Amount must be an integer in the smallest currency unit (e.g., paise for INR, cents for USD)
    // If the client passes ₹100, the amount should be 10000
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // converting to smallest unit
      currency: currency,
      // In the latest version of the API, specifying the `automatic_payment_methods` parameter is optional because Stripe enables its functionality by default.
      automatic_payment_methods: {
        enabled: true,
      },
    });

    res.json({
      clientSecret: paymentIntent.client_secret,
    });
  } catch (error) {
    console.error('Error creating payment intent:', error);
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  if (!process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY === 'sk_test_YOUR_STRIPE_SECRET_KEY') {
    console.warn('\n⚠️ WARNING: You are missing a valid STRIPE_SECRET_KEY in your server/.env file.');
  }
});
