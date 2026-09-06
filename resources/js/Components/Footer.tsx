export default function Footer() {
    return (
        <footer className="border-t border-gray-200 bg-gray-500">
            <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-6 text-sm text-gray-500">
                <span className="text-white">© {new Date().getFullYear()} LetsQuiz</span>
                <span className="text-white">All rights reserved.</span>
            </div>
        </footer>
    );
}
