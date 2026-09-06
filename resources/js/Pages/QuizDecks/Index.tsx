import AppLayout from '@/Layouts/AppLayout';
import { PageProps } from '@/types';
import { Head, router, useForm } from '@inertiajs/react';
import { FormEvent, useEffect, useState } from 'react';

type Deck = {
    id: number;
    title: string;
    image_url: string | null;
    is_public: boolean;
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
    decks: Deck[];
}>;

const getInitials = (title: string) => {
    const parts = title.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) {
        return '?';
    }

    const first = parts[0]?.[0] ?? '';
    const last = parts.length > 1 ? parts[parts.length - 1]?.[0] ?? '' : '';

    return (first + last).toUpperCase();
};

const getAvatarStyle = (title: string) => {
    let hash = 0;
    for (let i = 0; i < title.length; i += 1) {
        hash = (hash * 31 + title.charCodeAt(i)) | 0;
    }

    const hue = Math.abs(hash) % 360;

    return {
        backgroundColor: `hsl(${hue} 70% 92%)`,
        color: `hsl(${hue} 35% 28%)`,
    } as const;
};

export default function Index({ decks }: Props) {
    const { data, setData, post, processing, errors, reset } = useForm<{
        title: string;
        image: File | null;
    }>({
        title: '',
        image: null,
    });

    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<Deck | null>(null);

    useEffect(() => {
        if (!data.image) {
            setPreviewUrl(null);
            return;
        }

        const objectUrl = URL.createObjectURL(data.image);
        setPreviewUrl(objectUrl);

        return () => URL.revokeObjectURL(objectUrl);
    }, [data.image]);


    const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        post(route('quiz-decks.store'), {
            forceFormData: true,
            onSuccess: () => {
                reset();
                setPreviewUrl(null);
            },
        });
    };

    const confirmDelete = () => {
        if (!deleteTarget) {
            return;
        }

        router.delete(
            route('quiz-decks.destroy', {
                quizDeck: deleteTarget.id,
            }),
            {
                onFinish: () => setDeleteTarget(null),
            },
        );
    };


    return (
        <AppLayout>
            <Head title="Quiz Decks" />

            <div className="space-y-8">
                <div className="space-y-2">
                    <h1 className="text-2xl font-semibold text-gray-900">
                        Quiz Decks
                    </h1>
                    <p className="text-sm text-gray-500">
                        Create and track your flashcard quiz decks.
                    </p>
                </div>

                <form
                    onSubmit={submit}
                    className="rounded-lg border border-gray-200 bg-white p-4"
                >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                        <div className="flex-1 space-y-3">
                            <label
                                htmlFor="title"
                                className="text-sm font-medium text-gray-700"
                            >
                                Deck title
                            </label>
                            <input
                                id="title"
                                type="text"
                                value={data.title}
                                onChange={(event) =>
                                    setData('title', event.target.value)
                                }
                                className="mt-2 w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
                                placeholder="Intro to Biology"
                            />
                            {errors.title && (
                                <p className="mt-1 text-sm text-red-600">
                                    {errors.title}
                                </p>
                            )}

                            <div>
                                <label
                                    htmlFor="image"
                                    className="text-sm font-medium text-gray-700"
                                >
                                    Quiz image (optional)
                                </label>
                                <input
                                    id="image"
                                    type="file"
                                    accept="image/*"
                                    onChange={(event) =>
                                        setData(
                                            'image',
                                            event.target.files?.[0] ?? null,
                                        )
                                    }
                                    className="mt-2 block w-full text-sm text-gray-700 file:mr-4 file:rounded-md file:border-0 file:bg-gray-100 file:px-3 file:py-2 file:text-sm file:font-medium file:text-gray-700 hover:file:bg-gray-200"
                                />
                                {errors.image && (
                                    <p className="mt-1 text-sm text-red-600">
                                        {errors.image}
                                    </p>
                                )}
                                {previewUrl && (
                                    <div className="mt-3">
                                        <img
                                            src={previewUrl}
                                            alt="Quiz preview"
                                            className="h-24 w-24 rounded-md object-cover"
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                        <button
                            type="submit"
                            disabled={processing || data.title.trim() === ''}
                            className="inline-flex items-center justify-center rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:bg-gray-300"
                        >
                            Create deck
                        </button>
                    </div>
                </form>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {decks.length === 0 ? (
                        <div className="rounded-lg border border-dashed border-gray-300 bg-white p-6 text-sm text-gray-500">
                            No quiz decks yet.
                        </div>
                    ) : (
                        decks.map((deck) => (
                            <div
                                key={deck.id}
                                role="button"
                                tabIndex={0}
                                onClick={() =>
                                    router.visit(
                                        route('quiz-decks.cards', {
                                            quizDeck: deck.id,
                                        }),
                                    )
                                }
                                onKeyDown={(event) => {
                                    if (
                                        event.key === 'Enter' ||
                                        event.key === ' '
                                    ) {
                                        event.preventDefault();
                                        router.visit(
                                            route(
                                                'quiz-decks.cards',
                                                {
                                                    quizDeck: deck.id,
                                                },
                                            ),
                                        );
                                    }
                                }}
                                className="group cursor-pointer rounded-lg border border-gray-200 bg-white p-4 transition hover:-translate-y-0.5 hover:border-gray-300 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-gray-900/20"
                            >
                                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                    <div className="flex items-start gap-4">
                                        {deck.image_url ? (
                                            <img
                                                src={deck.image_url}
                                                alt="Quiz image"
                                                className="h-14 w-14 rounded-md object-cover"
                                            />
                                        ) : (
                                            <div
                                                className="flex h-14 w-14 items-center justify-center rounded-md text-sm font-semibold"
                                                style={getAvatarStyle(deck.title)}
                                            >
                                                {getInitials(deck.title)}
                                            </div>
                                        )}
                                        <div>
                                            <h2 className="text-lg font-semibold text-gray-900">
                                                {deck.title}
                                            </h2>
                                            <p className="text-sm text-gray-500">
                                                Created by {deck.owner.name}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-start gap-2 sm:items-end">
                                        <span
                                            className={`rounded-full px-2 py-1 text-xs font-medium ${
                                                deck.is_public
                                                    ? 'bg-emerald-100 text-emerald-700'
                                                    : 'bg-gray-100 text-gray-600'
                                            }`}
                                        >
                                            {deck.is_public
                                                ? 'Public'
                                                : 'Private'}
                                        </span>
                                        {deck.has_attempted ? (
                                            <span
                                                className={`rounded-full px-2 py-1 text-xs font-medium ${
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
                                            <span className="rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600">
                                                Not taken
                                            </span>
                                        )}
                                        {deck.has_attempted &&
                                            deck.latest_score !== null && (
                                                <span className="text-xs text-gray-500">
                                                    Score: {deck.latest_score}%
                                                    {deck.latest_correct_count !==
                                                        null &&
                                                        deck.latest_total_questions !==
                                                            null &&
                                                        ` (${deck.latest_correct_count}/${deck.latest_total_questions})`}
                                                </span>
                                            )}
                                            <button
                                                type="button"
                                                onClick={(event) => {
                                                    event.stopPropagation();
                                                    setDeleteTarget(deck);
                                                }}
                                                onKeyDown={(event) => event.stopPropagation()}
                                                className="inline-flex items-center rounded-md border border-rose-200 px-2 py-1 text-xs font-medium text-rose-600 transition hover:border-rose-300 hover:text-rose-700"
                                            >
                                                Delete
                                            </button>
                                        <button
                                            type="button"
                                            onClick={(event) => {
                                                event.stopPropagation();
                                                router.patch(
                                                    route(
                                                        'quiz-decks.publish',
                                                        {
                                                            quizDeck: deck.id,
                                                        },
                                                    ),
                                                    {
                                                        is_public: !deck.is_public,
                                                    },
                                                );
                                            }}
                                            className="inline-flex items-center rounded-md border border-gray-200 px-2 py-1 text-xs font-medium text-gray-600 transition hover:border-gray-300 hover:text-gray-900 disabled:cursor-not-allowed disabled:bg-gray-100"
                                        >
                                            {deck.is_public
                                                ? 'Unpublish'
                                                : 'Publish'}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={(event) => {
                                                event.stopPropagation();
                                                router.visit(
                                                    route(
                                                        'quiz-decks.cards',
                                                        {
                                                            quizDeck: deck.id,
                                                        },
                                                    ),
                                                );
                                            }}
                                            className="inline-flex items-center rounded-md border border-gray-200 px-2 py-1 text-xs font-medium text-gray-600 transition hover:border-gray-300 hover:text-gray-900"
                                        >
                                            Edit quiz
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {deleteTarget && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
                        <h2 className="text-lg font-semibold text-gray-900">
                            Delete quiz deck?
                        </h2>
                        <p className="mt-2 text-sm text-gray-600">
                            This will delete "{deleteTarget.title}" and its cards.
                        </p>
                        <div className="mt-6 flex items-center justify-end gap-3">
                            <button
                                type="button"
                                onClick={() => setDeleteTarget(null)}
                                className="rounded-md border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 transition hover:border-gray-300 hover:text-gray-900"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={confirmDelete}
                                className="rounded-md bg-rose-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-rose-700"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AppLayout>
    );
}
