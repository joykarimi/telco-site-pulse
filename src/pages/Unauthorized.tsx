
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const Unauthorized: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center">
      <h1 className="text-4xl font-bold">403 - Unauthorized</h1>
      <p className="mt-4 text-lg text-muted-foreground">You do not have permission to access this page.</p>
      <Button asChild className="mt-8">
        <Link to="/">Go to Dashboard</Link>
      </Button>
    </div>
  );
};

export default Unauthorized;
