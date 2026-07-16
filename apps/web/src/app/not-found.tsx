import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-32 text-center">
      <h1 className="text-4xl font-bold">404</h1>
      <p className="text-muted-foreground">This resource does not exist on the protocol.</p>
      <Button asChild>
        <Link href="/">Back to tasks</Link>
      </Button>
    </div>
  );
}
