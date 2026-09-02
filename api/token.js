import { AccessToken } from 'livekit-server-sdk';

export default async function handler(req, res) {
  // CORS configuration
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { roomName, participantName } = req.body;
    
    if (!roomName || !participantName) {
      return res.status(400).json({ error: 'roomName and participantName are required' });
    }

    const LIVEKIT_API_KEY = process.env.VITE_LIVEKIT_API_KEY;
    const LIVEKIT_API_SECRET = process.env.VITE_LIVEKIT_API_SECRET;

    if (!LIVEKIT_API_KEY || !LIVEKIT_API_SECRET) {
      return res.status(500).json({ error: 'Server misconfigured. Missing LiveKit credentials.' });
    }

    const at = new AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET, {
      identity: participantName,
      ttl: '10m', // Token expires in 10 minutes
    });
    
    at.addGrant({ roomJoin: true, room: roomName, canPublish: true, canSubscribe: true, canPublishData: true });
    
    // await toJwt() since in newer SDK versions it can be a promise
    const token = await at.toJwt();
    res.json({ token });
  } catch (error) {
    console.error('Error generating token:', error);
    res.status(500).json({ error: 'Failed to generate token' });
  }
}
