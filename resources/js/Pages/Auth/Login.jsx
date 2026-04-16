import Checkbox from '@/Components/Checkbox';
import InputError from '@/Components/InputError';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, Link, useForm } from '@inertiajs/react';

export default function Login({ status, canResetPassword }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        email: '',
        password: '',
        remember: false,
    });

    const submit = (e) => {
        e.preventDefault();

        post(route('login'), {
            onFinish: () => reset('password'),
        });
    };

    return (
        <GuestLayout>
            <Head title="Sign In" />

            {status && (
                <div className="login-alert success">
                    {status}
                </div>
            )}

            <form onSubmit={submit} className="login-form">
                <div className="form-group">
                    <label htmlFor="email" className="form-label">Email</label>

                    <input
                        id="email"
                        type="email"
                        name="email"
                        value={data.email}
                        className="form-control"
                        placeholder="nama@dahana.id"
                        autoComplete="username"
                        autoFocus
                        onChange={(e) => setData('email', e.target.value)}
                    />

                    <InputError message={errors.email} className="form-error" />
                </div>

                <div className="form-group">
                    <label htmlFor="password" className="form-label">Password</label>

                    <input
                        id="password"
                        type="password"
                        name="password"
                        value={data.password}
                        className="form-control"
                        placeholder="Masukkan password"
                        autoComplete="current-password"
                        onChange={(e) => setData('password', e.target.value)}
                    />

                    <InputError message={errors.password} className="form-error" />
                </div>

                <div className="login-row">
                    <label className="login-check">
                        <Checkbox
                            name="remember"
                            checked={data.remember}
                            onChange={(e) =>
                                setData('remember', e.target.checked)
                            }
                        />
                        <span>
                            Remember me
                        </span>
                    </label>

                    {canResetPassword && (
                        <Link href={route('password.request')} className="login-link">
                            Forgot password?
                        </Link>
                    )}
                </div>

                <button type="submit" className="btn btn-primary btn-lg btn-full" disabled={processing}>
                    {processing ? 'Signing In...' : 'Sign In to Dashboard'}
                </button>
            </form>
        </GuestLayout>
    );
}
