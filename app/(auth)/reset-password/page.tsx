import { Suspense } from 'react';

import ResetPasswordForm from './ResetPasswordForm';
import { AuthShell } from '@/components/auth/AuthPanels';

const ResetPasswordPage = () => {
    return (
        <Suspense fallback={<AuthShell><p className="text-sm text-gray-400">Loading reset form...</p></AuthShell>}>
            <ResetPasswordForm />
        </Suspense>
    );
};

export default ResetPasswordPage;
