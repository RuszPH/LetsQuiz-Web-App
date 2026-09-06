<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Mail\AccountCreated;
use App\Models\User;
use Illuminate\Auth\Events\Registered;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Validation\Rules;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class RegisteredUserController extends Controller
{
    /**
     * Display the registration view.
     */
    public function create(): Response
    {
        return Inertia::render('Registration');
    }

    /**
     * Handle an incoming registration request.
     *
     * @throws ValidationException
     */
    public function store(Request $request): RedirectResponse
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|lowercase|email|max:255|unique:'.User::class,
            'password' => ['required', 'confirmed', Rules\Password::defaults()],
        ]);

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
        ]);

        $brevoKey = config('services.brevo.api_key');
        if ($brevoKey) {
            $payload = [
                'email' => $user->email,
                'attributes' => [
                    'FIRSTNAME' => $user->name,
                ],
            ];

            $listId = config('services.brevo.list_id');
            if ($listId) {
                $payload['listIds'] = [(int) $listId];
            }

            $response = Http::withHeaders([
                'api-key' => $brevoKey,
                'accept' => 'application/json',
                'content-type' => 'application/json',
            ])->post('https://api.brevo.com/v3/contacts', $payload);

            if (!$response->successful() && $response->status() !== 409) {
                Log::warning('Brevo contact sync failed.', [
                    'status' => $response->status(),
                    'body' => $response->body(),
                    'user_id' => $user->id,
                ]);
            }
        }

        event(new Registered($user));

        try {
            Mail::to($user->email)->send(new AccountCreated($user));
        } catch (\Throwable $exception) {
            Log::warning('Account created email failed.', [
                'user_id' => $user->id,
                'error' => $exception->getMessage(),
            ]);
        }

        Auth::login($user);

        return redirect(route('dashboard', absolute: false));
    }
}
