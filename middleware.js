export function middleware(request) {
  const url = new URL(request.url);
  
  // If you visit yoursite.com/?secret=dev, it lets you in and skips maintenance
  if (url.searchParams.get('secret') === 'dev') {
    return NextResponse.next();
  }

  // Otherwise, return the maintenance response...
}
