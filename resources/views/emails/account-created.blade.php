<!DOCTYPE html>
<html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>Welcome to LetsQuiz</title>
    </head>
    <body style="margin:0;padding:0;background-color:#f8f5ef;font-family:Arial, sans-serif;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8f5ef;padding:32px 16px;">
            <tr>
                <td align="center">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:540px;background-color:#ffffff;border-radius:16px;box-shadow:0 10px 30px rgba(15, 23, 42, 0.08);">
                        <tr>
                            <td style="padding:28px 28px 12px;">
                                <p style="margin:0;font-size:12px;letter-spacing:0.3em;text-transform:uppercase;color:#f97316;font-weight:600;">
                                    LetsQuiz
                                </p>
                                <h1 style="margin:16px 0 8px;font-size:24px;color:#0f172a;">
                                    Welcome, {{ $user->name }}!
                                </h1>
                                <p style="margin:0;color:#475569;font-size:14px;line-height:1.6;">
                                    Your LetsQuiz account is ready. Start creating decks, sharing quizzes,
                                    and tracking your progress.
                                </p>
                            </td>
                        </tr>
                        <tr>
                            <td style="padding:0 28px 24px;">
                                <div style="background:#f8fafc;border-radius:12px;padding:16px;color:#475569;font-size:13px;line-height:1.6;">
                                    If you did not create this account, you can ignore this email.
                                </div>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>
    </body>
</html>
