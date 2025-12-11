import { redirect } from 'next/navigation';

export default function HomePage() {
  // Redirect to a default tenant
  // In production, this could show a tenant selection page
  redirect('/acme');
}

