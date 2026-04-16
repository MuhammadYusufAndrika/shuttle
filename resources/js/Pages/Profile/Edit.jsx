import AppLayout from '@/Layouts/AppLayout';
import { Head } from '@inertiajs/react';
import DeleteUserForm from './Partials/DeleteUserForm';
import UpdatePasswordForm from './Partials/UpdatePasswordForm';
import UpdateProfileInformationForm from './Partials/UpdateProfileInformationForm';

export default function Edit({ mustVerifyEmail, status }) {
    return (
        <AppLayout>
            <Head title="Profile" />

            <div className="profile-page">
                <div className="profile-hero">
                    <h1 className="profile-header-title">Profile Settings</h1>
                    <p className="profile-header-subtitle">Kelola informasi akun, kredensial, dan keamanan akses Anda.</p>
                </div>

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
        </AppLayout>
    );
}
