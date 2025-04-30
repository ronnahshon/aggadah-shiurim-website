
import React, { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-parchment-light">
      <div className="text-center max-w-md px-4">
        <h1 className="text-6xl font-bold mb-4 text-biblical-burgundy">404</h1>
        <p className="text-2xl text-biblical-brown mb-6">Oops! Page not found</p>
        <p className="text-biblical-brown/70 mb-8">
          The page you are looking for might have been removed or is temporarily unavailable.
        </p>
        <Link 
          to="/" 
          className="px-6 py-3 bg-biblical-burgundy text-white rounded-md hover:bg-opacity-90 transition-colors"
        >
          Return to Home
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
