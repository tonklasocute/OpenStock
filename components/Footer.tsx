import Link from "next/link";
import Logo from "@/components/Logo";

const Footer = () => {
    return (
        <footer className="bg-gray-900 text-gray-100 border-t border-gray-600">
            <div className="container mx-auto px-4 py-12">
                <div>
                    {/* Brand Section */}
                    <Link href="/" className="flex items-center gap-2 mb-4">
                        <Logo />
                    </Link>
                    <p className="text-gray-400 mb-6 max-w-md">
                        tonklasocute is a free stock tracking app. Track real-time prices, set personalized alerts, and explore detailed company insights — no paywalls, no subscriptions.
                    </p>
                </div>

                {/* Divider */}
                <div className="border-t border-gray-600 mt-8 pt-8">
                    <div className="flex flex-col md:flex-row justify-between items-center">
                        {/* Copyright + AGPL credit */}
                        <div className="text-gray-400 text-sm">
                            © {new Date().getFullYear()} tonklasocute · Built with{' '}
                            <Link
                                href="https://github.com/Open-Dev-Society/OpenStock"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="underline hover:text-gray-200"
                            >
                                OpenStock
                            </Link>
                            {' '}· Open Dev Society
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
