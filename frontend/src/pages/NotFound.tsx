import { Button } from "@/components/ui/button";
import { PageMeta } from '@/components/PageMeta';

export default function NotFoundPage() {
    return (
        <div className="flex items-center justify-center h-screen">
            <PageMeta title="Page Not Found" description="The page you are looking for does not exist on SalesDuo Early Reviews." />
            <div className="text-center">
                <h1 className="text-4xl font-bold">404 - Not Found</h1>
                <p className="text-lg text-muted-foreground mt-4">
                    The page you are looking for does not exist.
                </p>
                <Button
                    variant="outline"
                    className="mt-4"
                    onClick={() => window.history.back()}
                >
                    Go Back
                </Button>
            </div>
        </div>
    );
}