import { NextResponse } from 'next/server';

export function middleware(request) {
  // Returns a 503 Service Unavailable status with a clean UI
  return new NextResponse(
    `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Site Under Maintenance</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #f9f9f9; color: #333; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
        .container { text-align: center; padding: 20px; background: white; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); max-width: 400px; }
        h1 { color: #000; font-size: 24px; margin-bottom: 10px; }
        p { color: #666; font-size: 16px; line-height: 1.5; }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>We’ll be right back!</h1>
        <p>The site is currently undergoing scheduled maintenance. We should be back online shortly. Thank you for your patience!</p>
      </div>
    </body>
    </html>
    `,
    {
      status: 503, // 503 tells search engines that this is temporary down time
      headers: {
        'content-type': 'text/html',
        'Retry-After': '3600', // Tells bots to try again in an hour
      },
    }
  );
}

// This ensures it applies to all pages on your site
export const config = {
  matcher: '/:path*',
};
