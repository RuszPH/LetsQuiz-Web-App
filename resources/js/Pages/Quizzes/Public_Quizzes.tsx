import AppLayout from '@/Layouts/AppLayout';
import { PageProps } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { TouchEvent } from 'react';

type Deck = {
	id: number;
	title: string;
	image_url: string | null;
	passing_percentage: number;
	allow_multiple: boolean;
	allow_fill: boolean;
	allow_swipe: boolean;
	owner: {
		id: number;
		name: string;
	};
	attempt: {
		score: number;
		passed: boolean;
		correct_count: number;
		total_questions: number;
		taken_at: string | null;
	} | null;
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
	cards: FlashCard[];
}>;

type Mode = 'menu' | 'multiple' | 'fill' | 'swipe';

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

const shuffle = <T,>(items: T[]) => {
	const copy = [...items];
	for (let i = copy.length - 1; i > 0; i -= 1) {
		const j = Math.floor(Math.random() * (i + 1));
		[copy[i], copy[j]] = [copy[j], copy[i]];
	}
	return copy;
};

const normalize = (value: string) => value.trim().toLowerCase();

export default function PublicQuizzes({ deck, cards }: Props) {
	const [mode, setMode] = useState<Mode>('menu');
	const [queue, setQueue] = useState<FlashCard[]>([]);
	const [currentIndex, setCurrentIndex] = useState(0);
	const [completed, setCompleted] = useState(false);
	const [selectedChoice, setSelectedChoice] = useState<string | null>(null);
	const [choiceResult, setChoiceResult] = useState<
		'correct' | 'wrong' | null
	>(null);
	const [fillAnswer, setFillAnswer] = useState('');
	const [fillResult, setFillResult] = useState<'correct' | 'wrong' | null>(
		null,
	);
	const [showSwipeAnswer, setShowSwipeAnswer] = useState(false);
	const [swipeStats, setSwipeStats] = useState({ known: 0, unknown: 0 });
	const [correctCount, setCorrectCount] = useState(0);
	const [answeredCount, setAnsweredCount] = useState(0);
	const [attemptSaved, setAttemptSaved] = useState(false);
	const [attemptError, setAttemptError] = useState<string | null>(null);
	const [knownCards, setKnownCards] = useState<FlashCard[]>([]);
	const [unknownCards, setUnknownCards] = useState<FlashCard[]>([]);
	const [swipeLocked, setSwipeLocked] = useState(false);
	const [showSwipeCompletion, setShowSwipeCompletion] = useState(false);
	const [swipeDirection, setSwipeDirection] = useState<
		'left' | 'right' | null
	>(null);
	const [swipeAnimatingId, setSwipeAnimatingId] = useState<number | null>(
		null,
	);
	const swipeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const swipeAnimationTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
		null,
	);
	const swipeStartX = useRef<number | null>(null);
	const swipeCurrentX = useRef<number | null>(null);
	const swipeMouseDownRef = useRef(false);
	const swipeMouseStartX = useRef<number | null>(null);
	const swipeMouseCurrentX = useRef<number | null>(null);

	const card = queue[currentIndex];
	const allowedModes = useMemo(() => {
		const modes: Mode[] = [];
		if (deck.allow_multiple) {
			modes.push('multiple');
		}
		if (deck.allow_fill) {
			modes.push('fill');
		}
		if (deck.allow_swipe) {
			modes.push('swipe');
		}
		return modes;
	}, [deck.allow_multiple, deck.allow_fill, deck.allow_swipe]);

	const options = useMemo(() => {
		if (!card) {
			return [] as string[];
		}

		const answers = queue
			.map((item) => item.answer)
			.filter((answer) => answer !== card.answer);
		const unique = Array.from(new Set(answers));
		const picks = shuffle(unique).slice(0, 3);
		return shuffle([card.answer, ...picks]);
	}, [cards, card]);

	const resetRound = () => {
		setSelectedChoice(null);
		setChoiceResult(null);
		setFillAnswer('');
		setFillResult(null);
		setShowSwipeAnswer(false);
	};

	const nextCard = () => {
		resetRound();
		setCurrentIndex((prev) => {
			if (prev + 1 >= queue.length) {
				setCompleted(true);
				return prev;
			}

			return prev + 1;
		});
	};

	const startMode = (nextMode: Mode) => {
		if (!allowedModes.includes(nextMode)) {
			return;
		}

		setMode(nextMode);
		setQueue(shuffle(cards));
		setCurrentIndex(0);
		setCompleted(false);
		setSwipeStats({ known: 0, unknown: 0 });
		setKnownCards([]);
		setUnknownCards([]);
		setSwipeLocked(false);
		setShowSwipeCompletion(false);
		setCorrectCount(0);
		setAnsweredCount(0);
		setAttemptSaved(false);
		setAttemptError(null);
		resetRound();
	};

	const startSwipeUnknownOnly = () => {
		if (!deck.allow_swipe || unknownCards.length === 0) {
			return;
		}

		const nextQueue = shuffle(unknownCards);
		setMode('swipe');
		setQueue(nextQueue);
		setCurrentIndex(0);
		setCompleted(false);
		setSwipeStats({ known: 0, unknown: 0 });
		setKnownCards([]);
		setUnknownCards([]);
		setSwipeLocked(false);
		setShowSwipeCompletion(false);
		setCorrectCount(0);
		setAnsweredCount(0);
		setAttemptSaved(false);
		setAttemptError(null);
		resetRound();
	};

	const selectChoice = (value: string) => {
		if (choiceResult) {
			return;
		}

		setSelectedChoice(value);
		const isCorrect = value === card.answer;
		setChoiceResult(isCorrect ? 'correct' : 'wrong');
		setAnsweredCount((prev) => prev + 1);
		setCorrectCount((prev) => prev + (isCorrect ? 1 : 0));
	};

	const checkFill = () => {
		if (fillResult) {
			return;
		}

		const isCorrect =
			normalize(fillAnswer) === normalize(card.answer);
		setFillResult(isCorrect ? 'correct' : 'wrong');
		setAnsweredCount((prev) => prev + 1);
		setCorrectCount((prev) => prev + (isCorrect ? 1 : 0));
	};

	const advanceSwipe = (known: boolean) => {
		if (completed || (queue.length > 0 && answeredCount >= queue.length)) {
			return;
		}

		if (!card) {
			return;
		}

		setSwipeStats((prev) => ({
			known: prev.known + (known ? 1 : 0),
			unknown: prev.unknown + (known ? 0 : 1),
		}));
		setKnownCards((prev) => (known ? [...prev, card] : prev));
		setUnknownCards((prev) => (!known ? [...prev, card] : prev));
		setShowSwipeAnswer(false);
		setSwipeLocked(false);
		nextCard();
	};

	const handleSwipeKnown = () => {
		if (swipeLocked || swipeLimitReached) {
			return;
		}

		triggerSwipeAdvance('left', true);
	};

	const handleSwipeUnknown = () => {
		if (swipeLocked || swipeLimitReached) {
			return;
		}

		setSwipeLocked(true);
		setShowSwipeAnswer(true);

		if (swipeTimeoutRef.current) {
			clearTimeout(swipeTimeoutRef.current);
		}

		swipeTimeoutRef.current = setTimeout(() => {
			triggerSwipeAdvance('right', false);
		}, 3000);
	};

	const triggerSwipeAdvance = (direction: 'left' | 'right', known: boolean) => {
		if (swipeLimitReached) {
			return;
		}

		if (!card) {
			advanceSwipe(known);
			return;
		}

		setSwipeAnimatingId(card.id);
		setSwipeDirection(direction);

		if (swipeAnimationTimeoutRef.current) {
			clearTimeout(swipeAnimationTimeoutRef.current);
		}

		swipeAnimationTimeoutRef.current = setTimeout(() => {
			setSwipeAnimatingId(null);
			setSwipeDirection(null);
			advanceSwipe(known);
		}, 180);
	};

	const handleSwipeTouchStart = (event: TouchEvent<HTMLDivElement>) => {
		if (mode !== 'swipe' || swipeLocked || swipeLimitReached) {
			return;
		}

		swipeStartX.current = event.touches[0]?.clientX ?? null;
		swipeCurrentX.current = swipeStartX.current;
	};

	const handleSwipeMouseDown = (event: React.MouseEvent<HTMLDivElement>) => {
		if (mode !== 'swipe' || swipeLocked || swipeLimitReached) {
			return;
		}
		if (event.button !== 0) {
			return;
		}
		const target = event.target as HTMLElement | null;
		if (target?.closest('button')) {
			return;
		}

		swipeMouseDownRef.current = true;
		swipeMouseStartX.current = event.clientX;
		swipeMouseCurrentX.current = event.clientX;
	};

	const handleSwipeTouchMove = (event: TouchEvent<HTMLDivElement>) => {
		if (mode !== 'swipe' || swipeLocked || swipeLimitReached) {
			return;
		}
		const nextX = event.touches[0]?.clientX ?? null;
		if (nextX === null || swipeStartX.current === null) {
			return;
		}

		swipeCurrentX.current = nextX;
	};

	const handleSwipeMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
		if (
			mode !== 'swipe' ||
			swipeLocked ||
			swipeLimitReached ||
			!swipeMouseDownRef.current
		) {
			return;
		}
		const nextX = event.clientX;
		if (swipeMouseStartX.current === null) {
			return;
		}

		swipeMouseCurrentX.current = nextX;
	};

	const handleSwipeTouchEnd = () => {
		if (mode !== 'swipe' || swipeLocked || swipeLimitReached) {
			return;
		}

		if (swipeStartX.current === null || swipeCurrentX.current === null) {
			return;
		}
		const deltaX = swipeCurrentX.current - swipeStartX.current;
		const threshold = 60;

		if (deltaX <= -threshold) {
			handleSwipeKnown();
		} else if (deltaX >= threshold) {
			handleSwipeUnknown();
		}

		swipeStartX.current = null;
		swipeCurrentX.current = null;
	};

	const handleSwipeMouseEnd = () => {
		if (mode !== 'swipe' || swipeLocked || swipeLimitReached) {
			return;
		}

		swipeMouseDownRef.current = false;

		if (
			swipeMouseStartX.current === null ||
			swipeMouseCurrentX.current === null
		) {
			return;
		}
		const deltaX = swipeMouseCurrentX.current - swipeMouseStartX.current;
		const threshold = 60;

		if (deltaX <= -threshold) {
			handleSwipeKnown();
		} else if (deltaX >= threshold) {
			handleSwipeUnknown();
		}

		swipeMouseStartX.current = null;
		swipeMouseCurrentX.current = null;
	};

	const handleSwipeTouchCancel = () => {
		swipeStartX.current = null;
		swipeCurrentX.current = null;
	};

	useEffect(() => {
		return () => {
			if (swipeTimeoutRef.current) {
				clearTimeout(swipeTimeoutRef.current);
			}
			if (swipeAnimationTimeoutRef.current) {
				clearTimeout(swipeAnimationTimeoutRef.current);
			}
		};
	}, []);

	useEffect(() => {
		if (mode !== 'menu' && !allowedModes.includes(mode)) {
			setMode('menu');
		}
	}, [allowedModes, mode]);

	useEffect(() => {
		if (mode === 'swipe' && completed) {
			setShowSwipeCompletion(true);
			return;
		}

		setShowSwipeCompletion(false);
	}, [mode, completed]);

	const totalCount = queue.length;
	const scorePercent = totalCount
		? Math.round((correctCount / totalCount) * 100)
		: 0;
	const passingPercent = deck.passing_percentage ?? 70;
	const passed = scorePercent >= passingPercent;
	const swipeLimitReached = mode === 'swipe' && completed;
	const hasDisplayScore =
		((completed && totalCount > 0 && mode !== 'swipe') ||
			deck.attempt !== null);
	const displayScore =
		completed && mode !== 'swipe'
			? scorePercent
			: deck.attempt?.score ?? null;
	const displayPassed =
		completed && mode !== 'swipe'
			? passed
			: deck.attempt?.passed ?? null;
	const displayCorrect = completed && mode !== 'swipe'
		? correctCount
		: deck.attempt?.correct_count ?? null;
	const displayTotal = completed && mode !== 'swipe'
		? totalCount
		: deck.attempt?.total_questions ?? null;

	useEffect(() => {
		if (mode === 'swipe' || !completed || attemptSaved || totalCount === 0) {
			return;
		}

		window.axios
			.post(
				route('quiz-decks.attempts.store', {
					quizDeck: deck.id,
				}),
				{
					score: scorePercent,
					correct_count: correctCount,
					total_questions: totalCount,
				},
			)
			.then(() => {
				setAttemptSaved(true);
			})
			.catch(() => {
				setAttemptError('Unable to save score. Please try again.');
			});
	}, [
		mode,
		completed,
		attemptSaved,
		totalCount,
		correctCount,
		scorePercent,
		deck.id,
	]);

	return (
		<AppLayout>
			<Head title={`${deck.title} - Quiz`} />

			<div className="space-y-8">
				<div className="flex flex-col gap-4 rounded-2xl border border-gray-200 bg-white p-6 sm:flex-row sm:items-center sm:justify-between">
					<div className="flex items-center gap-4">
						{deck.image_url ? (
							<img
								src={deck.image_url}
								alt="Quiz"
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
							<p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-400">
								Quiz
							</p>
							<h1 className="text-2xl font-semibold text-gray-900">
								{deck.title}
							</h1>
							<p className="text-sm text-gray-500">
								by {deck.owner.name}
							</p>
						</div>
					</div>
					<div className="flex items-center gap-3">
						<div className="flex items-center gap-2">
							{hasDisplayScore ? (
								<>
									{displayCorrect !== null &&
										displayTotal !== null && (
											<span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700">
												{displayCorrect}/{displayTotal}
											</span>
										)}
									{displayScore !== null && (
										<span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700">
											{displayScore}%
										</span>
									)}
									{displayPassed !== null && (
										<span
											className={`rounded-full px-3 py-1 text-xs font-semibold ${
												displayPassed
													? 'bg-emerald-100 text-emerald-700'
													: 'bg-rose-100 text-rose-700'
											}`}
										>
											{displayPassed ? 'Passed' : 'Failed'}
										</span>
									)}
								</>
							) : (
								<span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-500">
									Not taken
								</span>
							)}
						</div>
						<Link
							href={route('home')}
							className="rounded-md border border-gray-200 px-3 py-2 text-sm font-medium text-gray-600 transition hover:border-gray-300 hover:text-gray-900"
						>
							Back to home
						</Link>
					</div>
				</div>

				{cards.length === 0 ? (
					<div className="rounded-2xl border border-dashed border-gray-200 bg-white p-8 text-sm text-gray-500">
						This quiz has no cards yet.
					</div>
				) : (
					<div className="rounded-2xl border border-gray-200 bg-white p-6">
						{mode === 'menu' ? (
							<div className="space-y-4">
								<h2 className="text-lg font-semibold text-gray-900">
									Choose your quiz mode
								</h2>
								<p className="text-sm text-gray-500">
									Pick how you want to study this deck today.
								</p>
								{allowedModes.length === 0 ? (
									<div className="rounded-xl border border-dashed border-gray-200 bg-white p-4 text-sm text-gray-500">
										No quiz modes are available for this deck.
									</div>
								) : (
									<div className="grid gap-4 md:grid-cols-3">
										{deck.allow_multiple && (
											<button
												type="button"
												onClick={() => startMode('multiple')}
											className="rounded-xl border border-gray-200 bg-white p-4 text-left transition hover:-translate-y-0.5 hover:border-gray-300 hover:shadow-md"
										>
											<p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-400">
												Multiple choice
											</p>
											<p className="mt-2 text-sm text-gray-600">
												Pick the right answer from four
												options.
											</p>
										</button>
										)}
										{deck.allow_fill && (
											<button
												type="button"
												onClick={() => startMode('fill')}
											className="rounded-xl border border-gray-200 bg-white p-4 text-left transition hover:-translate-y-0.5 hover:border-gray-300 hover:shadow-md"
										>
											<p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-400">
												Fill the blank
											</p>
											<p className="mt-2 text-sm text-gray-600">
												Type the answer from memory.
											</p>
										</button>
										)}
										{deck.allow_swipe && (
											<button
												type="button"
												onClick={() => startMode('swipe')}
											className="rounded-xl border border-gray-200 bg-white p-4 text-left transition hover:-translate-y-0.5 hover:border-gray-300 hover:shadow-md"
										>
											<p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-400">
												Swipe mode
											</p>
											<p className="mt-2 text-sm text-gray-600">
												Swipe left if you know it, right if
												you do not.
											</p>
										</button>
										)}
									</div>
								)}
							</div>
						) : (
							<div className="space-y-6">
								<div className="flex flex-wrap items-center justify-between gap-3">
									<div className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-400">
										{mode === 'multiple'
											? 'Multiple choice'
											: mode === 'fill'
											? 'Fill the blank'
											: 'Swipe mode'}
									</div>
									<div className="flex items-center gap-3 text-xs text-gray-500">
										<span>
											Card {currentIndex + 1} of
											{cards.length}
										</span>
									</div>
								</div>

								<div
									className={`relative rounded-2xl border border-gray-200 bg-gray-50 p-6 transition-transform transition-opacity duration-200 ease-out ${
										mode === 'swipe'
											? 'mx-auto w-full max-w-2xl min-h-[320px] sm:min-h-[360px] lg:min-h-[420px]'
											: ''
									} ${
										mode === 'swipe' &&
											swipeAnimatingId === card?.id &&
											swipeDirection === 'left'
											? '-translate-x-10 opacity-0'
											: ''
									} ${
										mode === 'swipe' &&
											swipeAnimatingId === card?.id &&
											swipeDirection === 'right'
											? 'translate-x-10 opacity-0'
											: ''
									}`}
									onTouchStart={
										mode === 'swipe' ? handleSwipeTouchStart : undefined
									}
									onTouchMove={
										mode === 'swipe' ? handleSwipeTouchMove : undefined
									}
									onTouchEnd={
										mode === 'swipe' ? handleSwipeTouchEnd : undefined
									}
											onTouchCancel={
												mode === 'swipe' ? handleSwipeTouchCancel : undefined
											}
											onMouseDown={
												mode === 'swipe' ? handleSwipeMouseDown : undefined
											}
											onMouseMove={
												mode === 'swipe' ? handleSwipeMouseMove : undefined
											}
											onMouseUp={
												mode === 'swipe' ? handleSwipeMouseEnd : undefined
											}
											onMouseLeave={
												mode === 'swipe' ? handleSwipeMouseEnd : undefined
											}
								>
									<p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-400">
										Question
									</p>
									{card ? (
										<p className="mt-3 text-lg font-semibold text-gray-900">
											{card.question}
										</p>
									) : (
										<p className="mt-3 text-lg font-semibold text-gray-900">
											No more cards.
										</p>
									)}
									{card?.image_url && (
										<div className="mt-4 flex items-center justify-center">
											<div className="flex h-48 w-full items-center justify-center overflow-hidden rounded-xl bg-white">
												<img
													src={card.image_url}
													alt="Quiz card"
													className="h-full w-full object-contain"
												/>
											</div>
										</div>
									)}
									{mode === 'swipe' && card && (
										<div className="mt-4 space-y-3">
											{showSwipeAnswer && (
												<div className="rounded-xl border border-gray-200 bg-white p-3 text-sm text-gray-600">
													{card.answer}
												</div>
											)}
											<div className="flex flex-wrap items-center gap-3">
												<button
													type="button"
													onClick={() =>
														setShowSwipeAnswer((prev) => !prev)
												}
												className="rounded-full border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 transition hover:border-gray-300 hover:text-gray-900"
											>
												{showSwipeAnswer
													? 'Hide answer'
													: 'Reveal answer'}
											</button>
													<span className="text-xs text-gray-500 sm:hidden">
														Swipe left = know, right = do not know
													</span>
											</div>
										</div>
									)}
									{mode === 'swipe' && card && (
										<>
											<button
												type="button"
												onClick={handleSwipeKnown}
												disabled={swipeLocked || swipeLimitReached}
												className="absolute left-4 top-1/2 hidden -translate-y-1/2 items-center gap-2 rounded-full bg-emerald-500 px-3 py-2 text-xs font-semibold text-white transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:bg-emerald-300 sm:flex"
											>
												<span className="text-base">&lt;</span>
												Know it
											</button>
											<button
												type="button"
												onClick={handleSwipeUnknown}
												disabled={swipeLocked || swipeLimitReached}
												className="absolute right-4 top-1/2 hidden -translate-y-1/2 items-center gap-2 rounded-full bg-rose-500 px-3 py-2 text-xs font-semibold text-white transition hover:bg-rose-600 disabled:cursor-not-allowed disabled:bg-rose-300 sm:flex"
											>
												Do not know
												<span className="text-base">&gt;</span>
											</button>
										</>
									)}
								</div>

								{mode === 'multiple' && card && (
									<div className="grid gap-3 sm:grid-cols-2">
										{options.map((option) => {
											const isSelected =
												selectedChoice === option;
											const isCorrect =
												option === card.answer;
											const stateClass = choiceResult
												? isCorrect
													? 'border-emerald-400 bg-emerald-50 text-emerald-700'
													: isSelected
													? 'border-rose-400 bg-rose-50 text-rose-600'
													: 'border-gray-200 bg-white text-gray-700'
												: 'border-gray-200 bg-white text-gray-700 hover:border-gray-300';

											return (
												<button
													key={option}
													type="button"
													onClick={() =>
														selectChoice(option)
													}
													className={`rounded-xl border p-3 text-left text-sm font-medium transition ${stateClass}`}
												>
													{option}
												</button>
											);
										})}
										{choiceResult && (
											<div className="sm:col-span-2 flex items-center justify-between">
												<p className="text-sm font-medium text-gray-600">
													{choiceResult === 'correct'
														? 'Correct!'
														: 'Not quite. The correct answer is shown.'}
												</p>
												<button
													type="button"
													onClick={nextCard}
													className="rounded-full border border-gray-200 px-4 py-1 text-sm font-medium text-gray-600 transition hover:border-gray-300 hover:text-gray-900"
												>
													{currentIndex + 1 >=
													queue.length
														? 'Finish'
														: 'Next card'}
												</button>
											</div>
										)}
									</div>
								)}

								{mode === 'fill' && card && (
									<div className="space-y-4">
										<div>
											<label
												htmlFor="fill-answer"
												className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-400"
											>
												Your answer
											</label>
											<input
												id="fill-answer"
												type="text"
												value={fillAnswer}
												onChange={(event) =>
													setFillAnswer(
														event.target.value,
													)
												}
												className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 focus:border-gray-300 focus:outline-none"
											/>
										</div>
										{fillResult && (
											<div className="rounded-xl border border-gray-200 bg-white p-3 text-sm text-gray-600">
												{fillResult === 'correct'
													? 'Correct!'
													: `Answer: ${card.answer}`}
											</div>
										)}
										<div className="flex items-center gap-3">
											<button
												type="button"
												onClick={checkFill}
												className="rounded-full border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 transition hover:border-gray-300 hover:text-gray-900"
											>
												Check answer
											</button>
											{fillResult && (
												<button
													type="button"
													onClick={nextCard}
													className="rounded-full bg-gray-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-gray-800"
												>
													{currentIndex + 1 >=
													queue.length
														? 'Finish'
														: 'Next card'}
												</button>
											)}
										</div>
									</div>
								)}

								{mode === 'swipe' && card && (
									<div className="mx-auto w-full max-w-2xl space-y-2">
										<div className="text-xs text-gray-500">
											Known: {swipeStats.known} | Unsure:{' '}
											{swipeStats.unknown}
										</div>
										{swipeLocked && (
											<p className="text-xs text-gray-400">
												Showing answer... moving to next
												card in 3 seconds.
											</p>
										)}
									</div>
								)}

								{completed && mode === 'swipe' && (
									<div
										className={`rounded-2xl border border-gray-200 bg-white p-6 text-sm text-gray-600 transition-all duration-300 ease-out ${
											showSwipeCompletion
												? 'translate-y-0 opacity-100'
												: 'translate-y-6 opacity-0'
										}`}
									>
										<p className="font-medium text-gray-900">
											You finished swipe mode. What next?
										</p>
										<div className="mt-4 rounded-xl border border-gray-200 bg-gray-50 p-4">
											<p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-400">
												Swipe summary
											</p>
											<div className="mt-2 flex flex-wrap gap-3">
												<div className="rounded-full bg-emerald-50 px-3 py-1 text-xs text-emerald-700">
													Known: {knownCards.length}
												</div>
												<div className="rounded-full bg-rose-50 px-3 py-1 text-xs text-rose-700">
													Unsure: {unknownCards.length}
												</div>
											</div>
											<p className="mt-2 text-xs text-gray-500">
												Swipe mode does not affect your score.
											</p>
										</div>
										<div className="mt-4 flex flex-wrap gap-3">
											<button
												type="button"
												onClick={() => startMode('swipe')}
												className="rounded-full bg-gray-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-gray-800"
											>
												Restart
											</button>
											<button
												type="button"
												onClick={startSwipeUnknownOnly}
												disabled={unknownCards.length === 0}
												className="rounded-full border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition hover:border-gray-300 hover:text-gray-900 disabled:cursor-not-allowed disabled:opacity-50"
											>
												I don't know only
											</button>
											<Link
												href={route('home')}
												className="rounded-full border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 transition hover:border-gray-300 hover:text-gray-900"
											>
												Back to home
											</Link>
										</div>
									</div>
								)}
								{completed && mode !== 'swipe' && (
									<div className="rounded-xl border border-dashed border-gray-200 bg-white p-6 text-sm text-gray-600">
										<p className="font-medium text-gray-900">
											You reached the end of the deck.
										</p>
										<p className="mt-1">
											Choose another mode or restart.
										</p>
										<div className="mt-4 rounded-xl border border-gray-200 bg-gray-50 p-4">
											<p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-400">
												Score
											</p>
											<div className="mt-2 flex flex-wrap items-center gap-3">
												<span className="text-lg font-semibold text-gray-900">
													{correctCount}/{totalCount}
												</span>
												<span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700">
													{scorePercent}%
												</span>
												<span
													className={`rounded-full px-3 py-1 text-xs font-semibold ${
														passed
															? 'bg-emerald-100 text-emerald-700'
															: 'bg-rose-100 text-rose-700'
													}`}
												>
													{passed
														? 'Passed'
														: 'Failed'}
												</span>
											</div>
											<p className="mt-2 text-xs text-gray-500">
												Passing score: {passingPercent}%
											</p>
											{attemptError && (
												<p className="mt-2 text-xs text-rose-600">
													{attemptError}
												</p>
											)}
										</div>
										<div className="mt-4 flex items-center gap-2">
											<button
												type="button"
												onClick={() => startMode(mode)}
												className="rounded-full bg-gray-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-gray-800"
											>
												Restart mode
											</button>
											<button
												type="button"
												onClick={() => startMode('menu')}
												className="rounded-full border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 transition hover:border-gray-300 hover:text-gray-900"
											>
												Back to modes
											</button>
										</div>
									</div>
								)}
							</div>
						)}
					</div>
				)}
			</div>
		</AppLayout>
	);
}
