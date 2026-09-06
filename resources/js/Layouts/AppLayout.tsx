import Footer from '@/Components/Footer';
import Nav from '@/Components/Nav';
import { PropsWithChildren } from 'react';

export default function AppLayout({ children }: PropsWithChildren) {
    return (
        <div className="min-h-screen bg-gray-50 text-gray-900">
            <Nav />
            <main className="mx-auto w-full max-w-6xl px-4 py-8">
                {children}
            </main>
            <Footer />
        </div>
    );
}
