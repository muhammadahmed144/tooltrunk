import AuthLayout from '@/components/auth/AuthLayout';
import RegisterForm from '@/components/auth/RegisterForm';

export const metadata = {
  title: 'Create Your Account - ToolTrunk',
  description: 'Join our community of tool sharers on ToolTrunk.',
};

export default function RegisterPage() {
  return (
    <AuthLayout title="Create Your Account" subtitle="Join our community of tool sharers">
      <RegisterForm />
    </AuthLayout>
  );
}
