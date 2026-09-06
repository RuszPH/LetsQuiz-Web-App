import AppLayout from '@/Layouts/AppLayout';
import { PageProps } from '@/types';
import { Head, Link } from '@inertiajs/react';

type PublicDeck = {
    id: number;
    title: string;
    image_url: string | null;
    owner: {
        id: number;
        name: string;
    };
    has_attempted: boolean;
    latest_score: number | null;
    latest_passed: boolean | null;
    latest_correct_count: number | null;
    latest_total_questions: number | null;
    latest_taken_at: string | null;
};

type Props = PageProps<{
    publicDecks: PublicDeck[];
}>;

export default function Dashboard({ publicDecks }: Props) {
    return (
        <AppLayout>
            <Head title="Home" />

            <div className="space-y-6">
                <div className="space-y-1">
                    <h1 className="text-2xl font-semibold text-gray-900">
                        Home
                    </h1>
                    <p className="text-sm text-gray-500">
                        Welcome back. Jump into your latest quizzes.
                    </p>
                </div>
                <div className="rounded-xl border border-gray-200 bg-white p-6">
                    <p className="text-sm text-gray-600">
                        Browse public quizzes below or head to Quiz Decks to
                        create and publish your own.
                    </p>
                </div>

                <div className="space-y-3">
                    <h2 className="text-lg font-semibold text-gray-900">
                        Public quizzes
                    </h2>
                    {publicDecks.length === 0 ? (
                        <div className="rounded-xl border border-dashed border-gray-200 bg-white p-6 text-sm text-gray-500">
                            No public quizzes yet.
                        </div>
                    ) : (
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            {publicDecks.map((deck) => (
                                <Link
                                    key={deck.id}
                                    href={route('quiz-decks.play', {
                                        quizDeck: deck.id,
                                    })}
                                    className="group flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-4 transition hover:-translate-y-0.5 hover:border-gray-300 hover:shadow-md"
                                >
                                    {deck.image_url ? (
                                        <img
                                            src={deck.image_url}
                                            alt="Quiz"
                                            className="h-12 w-12 rounded-lg object-cover"
                                        />
                                    ) : (
                                        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gray-100 text-xs font-semibold text-gray-600">
                                            {deck.title.slice(0, 2).toUpperCase()}
                                        </div>
                                    )}
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate text-sm font-semibold text-gray-900">
                                            {deck.title}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            by {deck.owner.name}
                                        </p>
                                    </div>
                                    <div className="flex flex-col items-end gap-1 text-right">
                                        {deck.has_attempted ? (
                                            <span
                                                className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.2em] ${
                                                    deck.latest_passed
                                                        ? 'bg-emerald-100 text-emerald-700'
                                                        : 'bg-rose-100 text-rose-700'
                                                }`}
                                            >
                                                {deck.latest_passed
                                                    ? 'Passed'
                                                    : 'Failed'}
                                            </span>
                                        ) : (
                                            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-gray-500">
                                                Not taken
                                            </span>
                                        )}
                                        {deck.has_attempted &&
                                            deck.latest_score !== null && (
                                                <span className="text-xs text-gray-500">
                                                    {deck.latest_score}%
                                                    {deck.latest_correct_count !==
                                                        null &&
                                                        deck.latest_total_questions !==
                                                            null &&
                                                        ` (${deck.latest_correct_count}/${deck.latest_total_questions})`}
                                                </span>
                                            )}
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
