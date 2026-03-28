// api/subscribe.js
// Vercel serverless function — keeps Mailchimp API key server-side

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, name } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email required' });
  }

  const API_KEY  = process.env.MAILCHIMP_API_KEY;
  const LIST_ID  = '3b27231f67';
  const SERVER   = 'us7';

  const [firstName, ...rest] = (name || '').split(' ');
  const lastName = rest.join(' ');

  try {
    const response = await fetch(
      `https://${SERVER}.api.mailchimp.com/3.0/lists/${LIST_ID}/members`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${Buffer.from(`anystring:${API_KEY}`).toString('base64')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email_address: email,
          status: 'subscribed',
          merge_fields: {
            FNAME: firstName || '',
            LNAME: lastName  || '',
          },
          tags: ['lock-in-bjj', 'app-signup'],
        }),
      }
    );

    const data = await response.json();

    if (!response.ok && data.title !== 'Member Exists') {
      console.error('Mailchimp error:', data);
      return res.status(500).json({ error: 'Mailchimp error' });
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('Subscribe error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
}
