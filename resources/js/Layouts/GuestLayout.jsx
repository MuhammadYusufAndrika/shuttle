import ApplicationLogo from '@/Components/ApplicationLogo';
import { Link } from '@inertiajs/react';

export default function GuestLayout({ children }) {
    return (
        <div className="login-page">
            <div className="login-shell">
                <aside className="login-hero">
                    <Link href="/" className="login-brand" aria-label="Shuttle Dahana Home">
                        <div className="login-brand-logo">🚌</div>
                        <div>
                            <div className="login-brand-name">Shuttle Dahana</div>
                            <div className="login-brand-caption">Smart Internal Mobility</div>
                        </div>
                    </Link>

                    <h1 className="login-hero-title">Mobilitas internal yang cepat, aman, dan real-time.</h1>
                    <p className="login-hero-copy">
                        Akses dashboard sesuai role Anda untuk memantau, menerima, dan mengeksekusi permintaan shuttle tanpa delay.
                    </p>

                    <div className="login-hero-pills">
                        <span>Real-time dispatch</span>
                        <span>Role-based access</span>
                        <span>Live status updates</span>
                    </div>
                </aside>

                <section className="login-box">
                    <div className="login-box-header">
                        <Link href="/" className="login-logo-wrap" aria-label="Shuttle Dahana Home">
                            <ApplicationLogo className="h-14 w-14 fill-current text-white" />
                        </Link>
                        <div>
                            <p className="login-box-kicker">Welcome Back</p>
                            <h2 className="login-box-title">Sign In</h2>
                        </div>
                    </div>

                    <div className="login-card">{children}</div>
                </section>
            </div>
        </div>
    );
}
