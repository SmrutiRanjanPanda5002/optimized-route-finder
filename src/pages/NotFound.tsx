
import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <Layout>
      <div className="container mx-auto py-20 px-4 text-center">
        <div className="max-w-md mx-auto bg-white rounded-lg shadow-sm border p-8 animate-fade-in">
          <h1 className="text-6xl font-bold text-primary mb-6">404</h1>
          <p className="text-xl text-foreground mb-8">Page not found</p>
          <p className="text-muted-foreground mb-8">
            We couldn't find the page you're looking for. The URL may be misspelled or the page you're looking for is no longer available.
          </p>
          <Button asChild className="px-8">
            <a href="/">Return to Home</a>
          </Button>
        </div>
      </div>
    </Layout>
  );
};

export default NotFound;
