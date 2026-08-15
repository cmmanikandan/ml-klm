import React from 'react';
import { Navigate } from 'react-router-dom';

export const AdminLoginPage: React.FC = () => {
  return <Navigate to="/login" replace />;
};
