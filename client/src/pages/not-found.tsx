import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import { Link } from "wouter";

export default function NotFound() {
  const currentPath = typeof window !== 'undefined' ? window.location.pathname : '';
  const fullUrl = typeof window !== 'undefined' ? window.location.href : '';

  if (typeof window !== 'undefined') {
    console.error(`[Router] 404 Not Found: path="${currentPath}" fullUrl="${fullUrl}"`);
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gray-50" data-testid="page-not-found">
      <Card className="w-full max-w-md mx-4">
        <CardContent className="pt-6">
          <div className="flex mb-4 gap-2">
            <AlertCircle className="h-8 w-8 text-red-500" />
            <h1 className="text-2xl font-bold text-gray-900">404 Page Not Found</h1>
          </div>

          <p className="mt-4 text-sm text-gray-600">
            The page <code className="bg-gray-100 px-1 py-0.5 rounded text-xs">{currentPath}</code> could not be found.
          </p>

          <div className="mt-4 flex gap-2">
            <Link href="/" className="text-sm text-blue-600 hover:underline" data-testid="link-home">Go to Home</Link>
            <span className="text-gray-300">|</span>
            <Link href="/admin/deals" className="text-sm text-blue-600 hover:underline" data-testid="link-admin">Go to Admin</Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
