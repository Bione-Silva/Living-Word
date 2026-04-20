import { Navigate } from 'react-router-dom';

// Legacy /onboarding kept as redirect — flow now goes straight to /blog-onboarding
// after signup, eliminating the duplicated 6-step pastoral wizard.
export default function Onboarding() {
  return <Navigate to="/blog-onboarding" replace />;
}
