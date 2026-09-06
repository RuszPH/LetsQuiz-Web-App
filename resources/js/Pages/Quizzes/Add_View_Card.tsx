import AppLayout from '@/Layouts/AppLayout';
import { PageProps } from '@/types';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { FormEvent, useEffect, useState } from 'react';

type Deck = {
    id: number;
    title: string;
    image_url: string | null;
    is_public: boolean;
    passing_percentage: number;
    allow_multiple: boolean;
    allow_fill: boolean;
    allow_swipe: boolean;
};

type FlashCard = {
    id: number;
    title: string | null;
    question: string;
    answer: string;
    image_url: string | null;
};

type Props = PageProps<{
    deck: Deck;
    canEdit: boolean;
    cards: FlashCard[];
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

export default function AddViewCard({ deck, canEdit, cards }: Props) {
    const {
        data: settingsData,
        setData: setSettingsData,
        patch: patchSettings,
        processing: settingsProcessing,
        errors: settingsErrors,
    } = useForm<{
        passing_percentage: number;
        allow_multiple: boolean;
        allow_fill: boolean;
        allow_swipe: boolean;
    }>({
        passing_percentage: deck.passing_percentage ?? 70,
        allow_multiple: deck.allow_multiple ?? true,
        allow_fill: deck.allow_fill ?? true,
        allow_swipe: deck.allow_swipe ?? true,
    });
    const { data, setData, post, processing, errors, reset } = useForm<{
        title: string;
        question: string;
        answer: string;
        image: File | null;
    }>({
        title: '',
        question: '',
        answer: '',
        image: null,
    });

    const {
        data: editData,
        setData: setEditData,
        patch,
        processing: editProcessing,
        errors: editErrors,
        reset: resetEdit,
    } = useForm<{
        title: string;
        question: string;
        answer: string;
        image: File | null;
    }>({
        title: '',
        question: '',
        answer: '',
        image: null,
    });

    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [editPreviewUrl, setEditPreviewUrl] = useState<string | null>(null);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [flipped, setFlipped] = useState<Record<number, boolean>>({});
    const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);

    useEffect(() => {
        if (!data.image) {
            setPreviewUrl(null);
            return;
        }

        const objectUrl = URL.createObjectURL(data.image);
        setPreviewUrl(objectUrl);

        return () => URL.revokeObjectURL(objectUrl);
    }, [data.image]);

    useEffect(() => {
        if (!editData.image) {
            setEditPreviewUrl(null);
            return;
        }

        const objectUrl = URL.createObjectURL(editData.image);
        setEditPreviewUrl(objectUrl);

        return () => URL.revokeObjectURL(objectUrl);
    }, [editData.image]);

    const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        post(route('quiz-decks.cards.store', { quizDeck: deck.id }), {
            forceFormData: true,
            onSuccess: () => {
                reset();
                setPreviewUrl(null);
            },
        });
    };

    const startEdit = (card: FlashCard) => {
        setEditingId(card.id);
        setEditData('title', card.title ?? '');
        setEditData('question', card.question);
        setEditData('answer', card.answer);
        setEditData('image', null);
        setEditPreviewUrl(null);
    };

    const cancelEdit = () => {
        setEditingId(null);
        resetEdit();
        setEditPreviewUrl(null);
    };

    const submitEdit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (editingId === null) {
            return;
        }

        patch(
            route('quiz-decks.cards.update', {
                quizDeck: deck.id,
                flashCard: editingId,
            }),
            {
            forceFormData: true,
            onSuccess: () => {
                cancelEdit();
            },
            },
        );
    };

    const toggleFlip = (cardId: number) => {
        setFlipped((prev) => ({
            ...prev,
            [cardId]: !prev[cardId],
        }));
    };

    const deleteCard = (cardId: number) => {
        if (!window.confirm('Delete this flashcard?')) {
            return;
        }

        router.delete(
            route('quiz-decks.cards.destroy', {
                quizDeck: deck.id,
                flashCard: cardId,
            }),
        );
    };

    const openImagePreview = (url: string) => {
        setPreviewImageUrl(url);
    };

    const closeImagePreview = () => {
        setPreviewImageUrl(null);
    };

    return (
        <AppLayout>
            <Head title={`${deck.title} - Cards`} />

            <div className="space-y-8">
                <div className="flex flex-col gap-4 rounded-2xl border border-gray-200 bg-white p-4 md:p-6 md:flex-row md:items-center md:justify-between">
                    <div className="flex items-center gap-4">
                        {deck.image_url ? (
                            <img
                                src={deck.image_url}
                                alt="Quiz image"
                                className="h-16 w-16 rounded-2xl object-cover"
                            />
                        ) : (
                            <div
                                className="flex h-16 w-16 items-center justify-center rounded-2xl text-base font-semibold"
                                style={getAvatarStyle(deck.title)}
                            >
                                {getInitials(deck.title)}
                            </div>
                        )}
                        <div>
                            <div className="flex items-center gap-2">
                                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-400">
                                    Quiz
                                </p>
                                {deck.is_public && (
                                    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-emerald-700">
                                        Public
                                    </span>
                                )}
                            </div>
                            <h1 className="text-2xl font-semibold text-gray-900">
                                {deck.title}
                            </h1>
                            <p className="text-sm text-gray-500">
                                {cards.length} card{cards.length === 1 ? '' : 's'}
                            </p>
                        </div>
                    </div>
                    <div className="flex flex-col gap-3 md:flex-row md:items-center">
                        {canEdit && (
                            <div className="flex w-full flex-col gap-2 rounded-md border border-gray-200 px-3 py-2 md:w-auto md:flex-row md:items-center">
                                <label
                                    htmlFor="passing_percentage"
                                    className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gray-400 md:text-xs"
                                >
                                    Passing %
                                </label>
                                <input
                                    id="passing_percentage"
                                    type="number"
                                    min={0}
                                    max={100}
                                    value={settingsData.passing_percentage}
                                    onChange={(event) =>
                                        setSettingsData(
                                            'passing_percentage',
                                            Number(event.target.value),
                                        )
                                    }
                                    className="w-full rounded-md border border-gray-200 px-2 py-1 text-sm text-gray-700 focus:border-gray-400 focus:outline-none md:w-16"
                                />
                            </div>
                        )}
                        {canEdit && (
                            <div className="flex w-full flex-col gap-2 rounded-md border border-gray-200 px-3 py-2 md:w-auto">
                                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gray-400 md:text-xs">
                                    Quiz modes
                                </p>
                                <label className="flex items-center gap-2 text-xs text-gray-600">
                                    <input
                                        type="checkbox"
                                        checked={settingsData.allow_multiple}
                                        onChange={(event) =>
                                            setSettingsData(
                                                'allow_multiple',
                                                event.target.checked,
                                            )
                                        }
                                        className="h-3.5 w-3.5 rounded border-gray-300 text-gray-900"
                                    />
                                    Multiple choice
                                </label>
                                <label className="flex items-center gap-2 text-xs text-gray-600">
                                    <input
                                        type="checkbox"
                                        checked={settingsData.allow_fill}
                                        onChange={(event) =>
                                            setSettingsData(
                                                'allow_fill',
                                                event.target.checked,
                                            )
                                        }
                                        className="h-3.5 w-3.5 rounded border-gray-300 text-gray-900"
                                    />
                                    Fill in the blank
                                </label>
                                <label className="flex items-center gap-2 text-xs text-gray-600">
                                    <input
                                        type="checkbox"
                                        checked={settingsData.allow_swipe}
                                        onChange={(event) =>
                                            setSettingsData(
                                                'allow_swipe',
                                                event.target.checked,
                                            )
                                        }
                                        className="h-3.5 w-3.5 rounded border-gray-300 text-gray-900"
                                    />
                                    Swipe mode
                                </label>
                            </div>
                        )}
                        {canEdit && (
                            <button
                                type="button"
                                onClick={() =>
                                    patchSettings(
                                        route('quiz-decks.settings', {
                                            quizDeck: deck.id,
                                        }),
                                    )
                                }
                                disabled={settingsProcessing}
                                className="w-full rounded-md border border-gray-200 px-3 py-2 text-xs font-medium text-gray-600 transition hover:border-gray-300 hover:text-gray-900 disabled:cursor-not-allowed disabled:opacity-60 md:w-auto md:text-sm"
                            >
                                Save settings
                            </button>
                        )}
                        {canEdit && (
                            <button
                                type="button"
                                onClick={() =>
                                    router.patch(
                                        route('quiz-decks.publish', {
                                            quizDeck: deck.id,
                                        }),
                                        {
                                            is_public: !deck.is_public,
                                        },
                                    )
                                }
                                className="w-full rounded-md bg-gray-900 px-3 py-2 text-xs font-medium text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:bg-gray-300 md:w-auto md:text-sm"
                            >
                                {deck.is_public ? 'Unpublish quiz' : 'Publish quiz'}
                            </button>
                        )}
                        <Link
                            href={route('quiz-decks.index')}
                            className="w-full rounded-md border border-gray-200 px-3 py-2 text-center text-xs font-medium text-gray-600 transition hover:border-gray-300 hover:text-gray-900 md:w-auto md:text-sm"
                        >
                            Back to decks
                        </Link>
                    </div>
                    {settingsErrors.passing_percentage && (
                        <p className="text-xs text-red-600">
                            {settingsErrors.passing_percentage}
                        </p>
                    )}
                    {settingsErrors.quiz_modes && (
                        <p className="text-xs text-red-600">
                            {settingsErrors.quiz_modes}
                        </p>
                    )}
                </div>

                {canEdit ? (
                    <form
                        onSubmit={submit}
                        className="rounded-2xl border border-gray-200 bg-white p-6"
                    >
                        <div className="flex flex-col gap-6">
                            <div className="space-y-2">
                                <h2 className="text-lg font-semibold text-gray-900">
                                    Add new flashcard
                                </h2>
                                <p className="text-sm text-gray-500">
                                    Fill the front and back, then save to the quiz.
                                </p>
                            </div>

                            <div className="grid gap-4 sm:grid-cols-2">
                                <div>
                                    <label
                                        htmlFor="card-title"
                                        className="text-sm font-medium text-gray-700"
                                    >
                                        Card title (optional)
                                    </label>
                                    <input
                                        id="card-title"
                                        type="text"
                                        value={data.title}
                                        onChange={(event) =>
                                            setData('title', event.target.value)
                                        }
                                        className="mt-2 w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
                                        placeholder="Chapter 1"
                                    />
                                    {errors.title && (
                                        <p className="mt-1 text-sm text-red-600">
                                            {errors.title}
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <label
                                        htmlFor="card-image"
                                        className="text-sm font-medium text-gray-700"
                                    >
                                        Question image (optional)
                                    </label>
                                    <input
                                        id="card-image"
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
                                </div>
                            </div>

                            {previewUrl && (
                                <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                                    <img
                                        src={previewUrl}
                                        alt="Flashcard preview"
                                        className="h-28 w-28 rounded-lg object-cover"
                                    />
                                </div>
                            )}

                            <div className="grid gap-4 sm:grid-cols-2">
                                <div>
                                    <label
                                        htmlFor="card-question"
                                        className="text-sm font-medium text-gray-700"
                                    >
                                        Question (front)
                                    </label>
                                    <textarea
                                        id="card-question"
                                        value={data.question}
                                        onChange={(event) =>
                                            setData(
                                                'question',
                                                event.target.value,
                                            )
                                        }
                                        rows={4}
                                        className="mt-2 w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
                                        placeholder="What is the powerhouse of the cell?"
                                    />
                                    {errors.question && (
                                        <p className="mt-1 text-sm text-red-600">
                                            {errors.question}
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <label
                                        htmlFor="card-answer"
                                        className="text-sm font-medium text-gray-700"
                                    >
                                        Answer (back)
                                    </label>
                                    <textarea
                                        id="card-answer"
                                        value={data.answer}
                                        onChange={(event) =>
                                            setData('answer', event.target.value)
                                        }
                                        rows={4}
                                        className="mt-2 w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
                                        placeholder="Mitochondria."
                                    />
                                    {errors.answer && (
                                        <p className="mt-1 text-sm text-red-600">
                                            {errors.answer}
                                        </p>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-center justify-end">
                                <button
                                    type="submit"
                                    disabled={
                                        processing ||
                                        data.question.trim() === '' ||
                                        data.answer.trim() === ''
                                    }
                                    className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:bg-gray-300"
                                >
                                    Save flashcard
                                </button>
                            </div>
                        </div>
                    </form>
                ) : (
                    <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-6 text-sm text-gray-500">
                        This quiz is published. You can view the cards, but only
                        the owner can edit them.
                    </div>
                )}

                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {cards.length === 0 ? (
                        <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-8 text-sm text-gray-500">
                            No flashcards yet. Add your first one above.
                        </div>
                    ) : (
                        cards.map((card) => (
                            <div
                                key={card.id}
                                className="flex h-[360px] w-full flex-col overflow-hidden rounded-2xl border border-gray-200 bg-gradient-to-br from-white via-white to-gray-50 p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                            >
                                {editingId === card.id && canEdit ? (
                                    <form
                                        onSubmit={submitEdit}
                                        className="flex h-full flex-col gap-3"
                                    >
                                        <div>
                                            <label
                                                htmlFor={`edit-title-${card.id}`}
                                                className="text-xs font-semibold uppercase tracking-wide text-gray-500"
                                            >
                                                Edit title
                                            </label>
                                            <input
                                                id={`edit-title-${card.id}`}
                                                type="text"
                                                value={editData.title}
                                                onChange={(event) =>
                                                    setEditData(
                                                        'title',
                                                        event.target.value,
                                                    )
                                                }
                                                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
                                            />
                                            {editErrors.title && (
                                                <p className="mt-1 text-sm text-red-600">
                                                    {editErrors.title}
                                                </p>
                                            )}
                                        </div>

                                        <div>
                                            <label
                                                htmlFor={`edit-question-${card.id}`}
                                                className="text-xs font-semibold uppercase tracking-wide text-gray-500"
                                            >
                                                Question
                                            </label>
                                            <textarea
                                                id={`edit-question-${card.id}`}
                                                value={editData.question}
                                                onChange={(event) =>
                                                    setEditData(
                                                        'question',
                                                        event.target.value,
                                                    )
                                                }
                                                rows={3}
                                                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
                                            />
                                            {editErrors.question && (
                                                <p className="mt-1 text-sm text-red-600">
                                                    {editErrors.question}
                                                </p>
                                            )}
                                        </div>

                                        <div>
                                            <label
                                                htmlFor={`edit-answer-${card.id}`}
                                                className="text-xs font-semibold uppercase tracking-wide text-gray-500"
                                            >
                                                Answer
                                            </label>
                                            <textarea
                                                id={`edit-answer-${card.id}`}
                                                value={editData.answer}
                                                onChange={(event) =>
                                                    setEditData(
                                                        'answer',
                                                        event.target.value,
                                                    )
                                                }
                                                rows={3}
                                                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
                                            />
                                            {editErrors.answer && (
                                                <p className="mt-1 text-sm text-red-600">
                                                    {editErrors.answer}
                                                </p>
                                            )}
                                        </div>

                                        <div>
                                            <label
                                                htmlFor={`edit-image-${card.id}`}
                                                className="text-xs font-semibold uppercase tracking-wide text-gray-500"
                                            >
                                                Update image
                                            </label>
                                            <input
                                                id={`edit-image-${card.id}`}
                                                type="file"
                                                accept="image/*"
                                                onChange={(event) =>
                                                    setEditData(
                                                        'image',
                                                        event.target.files?.[0] ??
                                                            null,
                                                    )
                                                }
                                                className="mt-2 block w-full text-sm text-gray-700 file:mr-4 file:rounded-md file:border-0 file:bg-gray-100 file:px-3 file:py-2 file:text-sm file:font-medium file:text-gray-700 hover:file:bg-gray-200"
                                            />
                                            {editErrors.image && (
                                                <p className="mt-1 text-sm text-red-600">
                                                    {editErrors.image}
                                                </p>
                                            )}
                                            {editPreviewUrl && (
                                                <div className="mt-3">
                                                    <img
                                                        src={editPreviewUrl}
                                                        alt="Updated flashcard"
                                                        className="h-24 w-24 rounded-lg object-cover"
                                                    />
                                                </div>
                                            )}
                                        </div>

                                        <div className="mt-auto flex items-center gap-2">
                                            <button
                                                type="button"
                                                onClick={cancelEdit}
                                                className="rounded-md border border-gray-200 px-3 py-2 text-xs font-medium text-gray-600 transition hover:border-gray-300 hover:text-gray-900"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                type="submit"
                                                disabled={
                                                    editProcessing ||
                                                    editData.question.trim() ===
                                                        '' ||
                                                    editData.answer.trim() === ''
                                                }
                                                className="rounded-md bg-gray-900 px-3 py-2 text-xs font-medium text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:bg-gray-300"
                                            >
                                                Save
                                            </button>
                                        </div>
                                    </form>
                                ) : (
                                    <div className="flex h-full flex-col">
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="space-y-1">
                                                <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                                                    {flipped[card.id]
                                                        ? 'Answer'
                                                        : 'Question'}
                                                </p>
                                                {card.title && (
                                                    <p className="text-sm font-medium text-gray-600">
                                                        {card.title}
                                                    </p>
                                                )}
                                            </div>
                                            {canEdit && (
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => startEdit(card)}
                                                        className="text-xs font-medium text-gray-500 transition hover:text-gray-900"
                                                    >
                                                        Edit
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            deleteCard(card.id)
                                                        }
                                                        className="text-xs font-medium text-red-500 transition hover:text-red-600"
                                                    >
                                                        Delete
                                                    </button>
                                                </div>
                                            )}
                                        </div>

                                        <div className="mt-4 flex-1 overflow-y-auto text-sm text-gray-900">
                                            <p className="whitespace-pre-wrap leading-relaxed">
                                                {flipped[card.id]
                                                    ? card.answer
                                                    : card.question}
                                            </p>
                                        </div>

                                        {card.image_url && !flipped[card.id] && (
                                            <div className="mt-4 flex items-center justify-center">
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        openImagePreview(
                                                            card.image_url as string,
                                                        )
                                                    }
                                                    className="group flex h-40 w-full items-center justify-center overflow-hidden rounded-xl bg-gray-50 transition hover:bg-gray-100"
                                                >
                                                    <img
                                                        src={card.image_url}
                                                        alt="Flashcard illustration"
                                                        className="h-full w-full object-contain"
                                                    />
                                                </button>
                                            </div>
                                        )}

                                        <div className="mt-4 flex items-center justify-between">
                                            <button
                                                type="button"
                                                onClick={() => toggleFlip(card.id)}
                                                className="inline-flex items-center rounded-full border border-gray-200 px-3 py-1 text-xs font-medium text-gray-600 transition hover:border-gray-300 hover:text-gray-900"
                                            >
                                                Flip card
                                            </button>
                                            <span className="text-xs text-gray-400">
                                                Tap to reveal
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </div>

            {previewImageUrl && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6"
                    role="dialog"
                    aria-modal="true"
                >
                    <button
                        type="button"
                        onClick={closeImagePreview}
                        className="absolute inset-0 h-full w-full"
                        aria-label="Close image preview"
                    />
                    <div className="relative z-10 w-full max-w-4xl rounded-2xl bg-white p-4 shadow-xl">
                        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                            <h2 className="text-sm font-semibold text-gray-700">
                                Image preview
                            </h2>
                            <button
                                type="button"
                                onClick={closeImagePreview}
                                className="rounded-full border border-gray-200 px-3 py-1 text-xs font-medium text-gray-600 transition hover:border-gray-300 hover:text-gray-900"
                            >
                                Close
                            </button>
                        </div>
                        <div className="mt-4 flex items-center justify-center">
                            <img
                                src={previewImageUrl}
                                alt="Flashcard preview"
                                className="max-h-[70vh] w-full object-contain"
                            />
                        </div>
                    </div>
                </div>
            )}
        </AppLayout>
    );
}
