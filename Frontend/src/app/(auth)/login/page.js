import AuthLayout from '@/components/auth/AuthLayout';
import LoginForm from '@/components/auth/LoginForm';

export const metadata = {
  title: 'Sign In - ToolTrunk',
  description: 'Sign in to access shared tools and manage your neighbor reputation on ToolTrunk.',
};

export default function LoginPage() {
  return (
    <AuthLayout title="Welcome Back" subtitle="Sign in to your account">
      <LoginForm />
    </AuthLayout>
  );
}
