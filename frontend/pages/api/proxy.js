export default async function handler(req, res) {
    const targetUrl = 'http://127.0.0.1:5000/evaluate';
  
    // Only allow POST requests for proxy
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method Not Allowed' });
    }

    console.log(req.body);
  
    try {
      // Forward the incoming request to the target URL
      const response = await fetch(targetUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(req.body), // Forward the request body
      });
  
      // Check if the response is successful
      if (!response.ok) {
        return res.status(response.status).json(response.json());
      }
  
      // Get the response data from the target
      const data = await response.json();
  
      // Send the response data back to the client
      res.status(200).json(data);
    } catch (error) {
      res.status(500).json({ error: 'Error connecting to the target server' });
    }
  }
  