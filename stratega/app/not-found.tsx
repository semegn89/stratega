import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function NotFound() {
  return (
    <div className="container mx-auto px-4 py-24 md:py-32 text-center">
      <h1 className="text-6xl md:text-7xl font-medium tracking-tight mb-6 text-foreground">404</h1>
      <h2 className="text-2xl md:text-3xl font-medium tracking-tight mb-4 text-foreground">Page Not Found</h2>
      <p className="text-lg text-muted-foreground mb-10 leading-relaxed max-w-md mx-auto">
        The requested page does not exist or has been moved.
      </p>
      <Button asChild size="lg">
        <Link href="/">Return to Home</Link>
      </Button>
    </div>
  )
}

