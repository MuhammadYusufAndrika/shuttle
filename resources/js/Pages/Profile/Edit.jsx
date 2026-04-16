import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import DeleteUserForm from './Partials/DeleteUserForm';
import UpdatePasswordForm from './Partials/UpdatePasswordForm';
import UpdateProfileInformationForm from './Partials/UpdateProfileInformationForm';

export default function Edit({ mustVerifyEmail, status }) {
    return (
        <AuthenticatedLayout
            header={
                <div className="profile-header-wrap">
                    <h2 className="profile-header-title">Profile Settings</h2>
                    <p className="profile-header-subtitle">Kelola informasi akun, kredensial, dan keamanan akses Anda.</p>
                </div>
            }
        >
            <Head title="Profile" />

            <div className="profile-page">
                <div className="profile-grid">
                    <div className="profile-panel">
                        <UpdateProfileInformationForm
                            mustVerifyEmail={mustVerifyEmail}
                            status={status}
                            className="profile-form"
                        />
                    </div>

                    <div className="profile-panel">
                        <UpdatePasswordForm className="profile-form" />
                    </div>

                    <div className="profile-panel danger">
                        <DeleteUserForm className="profile-form" />
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
