
import { useEffect } from 'react';
import { useAuth } from '../auth/useAuth';

const Logout = () => {
  const { signOut } = useAuth();

  useEffect(() => {
    signOut();
  }, [signOut]);

  return null; // This component doesn't render anything
};

export default Logout;
