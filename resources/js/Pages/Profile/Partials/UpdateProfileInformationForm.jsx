import InputError from '@/Components/InputError';
import { Transition } from '@headlessui/react';
import { Link, useForm, usePage } from '@inertiajs/react';

export default function UpdateProfileInformation({
    mustVerifyEmail,
    status,
    className = '',
}) {
    const user = usePage().props.auth.user;

    const { data, setData, patch, errors, processing, recentlySuccessful } =
        useForm({
            name: user.name,
            email: user.email,
        });

    const submit = (e) => {
        e.preventDefault();

        patch(route('profile.update'));
    };

    return (
        <section className={className}>
            <header className="profile-section-head">
                <h2 className="profile-section-title">
                    Profile Information
                </h2>

                <p className="profile-section-copy">
                    Update your account's profile information and email address.
                </p>
            </header>

            <form onSubmit={submit} className="profile-stack">
                <div className="form-group">
                    <label htmlFor="name" className="form-label">Name</label>

                    <input
                        id="name"
                        className="form-control"
                        value={data.name}
                        onChange={(e) => setData('name', e.target.value)}
                        required
                        autoComplete="name"
                    />

                    <InputError className="form-error" message={errors.name} />
                </div>

                <div className="form-group">
                    <label htmlFor="email" className="form-label">Email</label>

                    <input
                        id="email"
                        type="email"
                        className="form-control"
                        value={data.email}
                        onChange={(e) => setData('email', e.target.value)}
                        required
                        autoComplete="username"
                    />

                    <InputError className="form-error" message={errors.email} />
                </div>

                {mustVerifyEmail && user.email_verified_at === null && (
                    <div className="profile-note">
                        <p>
                            Your email address is unverified.
                            <Link
                                href={route('verification.send')}
                                method="post"
                                as="button"
                                className="profile-link"
                            >
                                Click here to re-send the verification email.
                            </Link>
                        </p>

                        {status === 'verification-link-sent' && (
                            <div className="profile-alert success">
                                A new verification link has been sent to your
                                email address.
                            </div>
                        )}
                    </div>
                )}

                <div className="profile-actions">
                    <button type="submit" className="btn btn-primary" disabled={processing}>Save Changes</button>

                    <Transition
                        show={recentlySuccessful}
                        enter="transition ease-in-out"
                        enterFrom="opacity-0"
                        leave="transition ease-in-out"
                        leaveTo="opacity-0"
                    >
                        <p className="profile-saved">
                            Saved.
                        </p>
                    </Transition>
                </div>
            </form>
        </section>
    );
}
