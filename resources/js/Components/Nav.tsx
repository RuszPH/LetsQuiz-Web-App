import { Link, router, usePage } from '@inertiajs/react';
import { useState } from 'react';

export default function Nav() {
    const { csrf_token } = usePage().props as { csrf_token: string };
    const [isOpen, setIsOpen] = useState(false);

    return (
        <nav className="border-b border-gray-200 bg-white">
            <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
                <Link href="/" className="text-lg font-semibold text-gray-900">
                    LetsQuiz
                </Link>
                <div className="hidden items-center gap-4 text-sm text-gray-600 sm:flex">
                    <Link href="/home" className="hover:text-gray-900">
                        Home
                    </Link>
                    <Link href="/quiz-decks" className="hover:text-gray-900">
                        Quiz decks
                    </Link>
                    <button
                        type="button"
                        onClick={() =>
                            router.post(route('logout'), {
                                _token: csrf_token,
                            })
                        }
                        className="text-red-500 hover:text-gray-900"
                    >
                        Log out
                    </button>
                </div>
                <button
                    type="button"
                    onClick={() => setIsOpen((prev) => !prev)}
                    className="rounded-md border border-gray-200 p-2 text-gray-600 transition hover:text-gray-900 sm:hidden"
                    aria-label="Toggle navigation"
                    aria-expanded={isOpen}
                    aria-controls="mobile-nav"
                >
                    <svg
                        viewBox="0 0 24 24"
                        className="h-5 w-5"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                    >
                        <path d="M4 6h16" />
                        <path d="M4 12h16" />
                        <path d="M4 18h16" />
                    </svg>
                </button>
            </div>
            <div
                id="mobile-nav"
                className={`px-4 pb-4 ${
                    isOpen ? 'flex' : 'hidden'
                } flex-col gap-2 text-sm text-gray-600 sm:hidden`}
            >
                <Link href="/home" className="hover:text-gray-900">
                    Home
                </Link>
                <Link href="/quiz-decks" className="hover:text-gray-900">
                    Quiz decks
                </Link>
                <button
                    type="button"
                    onClick={() =>
                        router.post(route('logout'), {
                            _token: csrf_token,
                        })
                    }
                    className="text-left hover:text-gray-900"
                >
                    Log out
                </button>
            </div>
        </nav>
    );
}
