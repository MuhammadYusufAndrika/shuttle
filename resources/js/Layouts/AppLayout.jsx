import { Link, usePage, router } from '@inertiajs/react';
import { useState, useEffect } from 'react';

export default function AppLayout({ children, title }) {
    const { auth, flash } = usePage().props;
    const user = auth?.user;
    const [showFlash, setShowFlash] = useState(false);

    useEffect(() => {
        if (flash?.success) {
            setShowFlash(true);
            const t = setTimeout(() => setShowFlash(false), 4000);
            return () => clearTimeout(t);
        }
    }, [flash]);

    const roleBadgeClass = user?.role === 'admin' ? 'admin' : user?.role === 'driver' ? 'driver' : 'employee';

    return (
        <div className="app-layout">
            {/* Top Navigation */}
            <nav className="topnav">
                <Link href={route('home')} className="topnav-brand">
                    <div className="topnav-logo">🚌</div>
                    <span className="topnav-title">Shuttle <span>PT</span></span>
                </Link>

                <div className="topnav-right">
                    {user && (
                        <>
                            <div className="nav-user" onClick={() => router.visit(route('profile.edit'))}>
                                <span className={`nav-role-badge ${roleBadgeClass}`}>{user.role}</span>
                                <span>{user.name.split(' ')[0]}</span>
                                <span style={{ opacity: 0.4 }}>›</span>
                            </div>

                            <Link
                                href={route('logout')}
                                method="post"
                                as="button"
                                className="topnav-logout"
                            >
                                Logout
                            </Link>
                        </>
                    )}
                </div>
            </nav>

            {/* Flash message */}
            {showFlash && flash?.success && (
                <div className="flash-message animate-fade-in">
                    <div className="flash-inner">
                        <span>✅</span>
                        <span>{flash.success.message || flash.success}</span>
                    </div>
                </div>
            )}

            {/* Main content */}
            <main className="page-content container">
                {children}
            </main>
        </div>
    );
}
