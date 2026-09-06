import { Head, Link, useForm, usePage } from '@inertiajs/react';
import type { CSSProperties, FormEventHandler } from 'react';

const pageStyle: CSSProperties = {
    '--ink': '#0f172a',
    '--accent': '#f97316',
    '--mint': '#06b6d4',
    '--sand': '#f8f5ef',
} as CSSProperties;

export default function Registration() {
    const { csrf_token } = usePage().props as { csrf_token: string };
    const { data, setData, post, processing, errors, reset } = useForm({
        _token: csrf_token,
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
    });

    const submit: FormEventHandler = (event) => {
        event.preventDefault();
        post(route('register'), {
            onFinish: () => reset('password', 'password_confirmation'),
        });
    };

    return (
        <div
            className="relative min-h-screen overflow-hidden bg-[color:var(--sand)]"
            style={pageStyle}
        >
            <Head title="Create account" />

            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_#fff3e1,_transparent_55%)]" />
            <div className="absolute -right-16 top-10 h-56 w-56 rounded-full bg-[radial-gradient(circle,_#cffafe,_transparent_70%)] opacity-80" />
            <div className="absolute -left-10 bottom-10 h-72 w-72 rounded-full bg-[radial-gradient(circle,_#fde68a,_transparent_70%)] opacity-70" />

            <div className="relative z-10 mx-auto flex min-h-screen max-w-6xl flex-col items-stretch gap-10 px-6 py-16 lg:flex-row lg:items-center">
                <div className="flex-1 space-y-6 animate-fade-up">
                    <p className="text-xs font-semibold uppercase tracking-[0.4em] text-[color:var(--accent)]">
                        LetsQuiz
                    </p>
                    <h1 className="font-['Fraunces'] text-4xl font-semibold text-[color:var(--ink)] sm:text-5xl">
                        Build your first quiz deck in minutes.
                    </h1>
                    <p className="max-w-xl text-base text-slate-600">
                        Create an account to save progress, publish quizzes, and
                        keep your study goals on track.
                    </p>
                    <div className="flex flex-wrap gap-3">
                        <div className="rounded-full border border-white/60 bg-white/70 px-4 py-2 text-xs font-medium text-slate-600 shadow-sm">
                            Save attempts
                        </div>
                        <div className="rounded-full border border-white/60 bg-white/70 px-4 py-2 text-xs font-medium text-slate-600 shadow-sm">
                            Share decks
                        </div>
                        <div className="rounded-full border border-white/60 bg-white/70 px-4 py-2 text-xs font-medium text-slate-600 shadow-sm">
                            Track streaks
                        </div>
                    </div>
                </div>

                <div className="w-full max-w-md animate-fade-up-delay">
                    <div className="rounded-3xl border border-white/60 bg-white/90 p-8 shadow-xl backdrop-blur">
                        <div className="space-y-2">
                            <h2 className="text-2xl font-semibold text-[color:var(--ink)]">
                                Create your account
                            </h2>
                            <p className="text-sm text-slate-600">
                                Sign up with your email.
                            </p>
                        </div>
                        <form onSubmit={submit} className="space-y-4">
                            <div>
                                <label
                                    htmlFor="name"
                                    className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500"
                                >
                                    Create username
                                </label>
                                <input
                                    id="name"
                                    type="text"
                                    autoComplete="name"
                                    value={data.name}
                                    onChange={(event) =>
                                        setData('name', event.target.value)
                                    }
                                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400"
                                />
                                {errors.name && (
                                    <p className="mt-1 text-xs text-red-600">
                                        {errors.name}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label
                                    htmlFor="email"
                                    className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500"
                                >
                                    Email
                                </label>
                                <input
                                    id="email"
                                    type="email"
                                    autoComplete="username"
                                    value={data.email}
                                    onChange={(event) =>
                                        setData('email', event.target.value)
                                    }
                                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400"
                                />
                                {errors.email && (
                                    <p className="mt-1 text-xs text-red-600">
                                        {errors.email}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label
                                    htmlFor="password"
                                    className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500"
                                >
                                    Password
                                </label>
                                <input
                                    id="password"
                                    type="password"
                                    autoComplete="new-password"
                                    value={data.password}
                                    onChange={(event) =>
                                        setData('password', event.target.value)
                                    }
                                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400"
                                />
                                {errors.password && (
                                    <p className="mt-1 text-xs text-red-600">
                                        {errors.password}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label
                                    htmlFor="password_confirmation"
                                    className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500"
                                >
                                    Confirm password
                                </label>
                                <input
                                    id="password_confirmation"
                                    type="password"
                                    autoComplete="new-password"
                                    value={data.password_confirmation}
                                    onChange={(event) =>
                                        setData(
                                            'password_confirmation',
                                            event.target.value,
                                        )
                                    }
                                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400"
                                />
                                {errors.password_confirmation && (
                                    <p className="mt-1 text-xs text-red-600">
                                        {errors.password_confirmation}
                                    </p>
                                )}
                            </div>

                            <button
                                type="submit"
                                disabled={processing}
                                className="mt-2 w-full rounded-full bg-[color:var(--ink)] px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-900 disabled:cursor-not-allowed disabled:bg-slate-400"
                            >
                                Create account
                            </button>
                        </form>

                        <p className="mt-6 text-center text-xs text-slate-500">
                            Already have an account?{' '}
                            <Link
                                href="/"
                                className="font-semibold text-slate-700 hover:text-slate-900"
                            >
                                Sign in
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
