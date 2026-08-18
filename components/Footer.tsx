import Link from "next/link";
import Logo from "@/components/Logo";

const Footer = () => {
    return (
        <footer className="bg-gray-900 text-white border-t border-gray-800">
            <div className="container mx-auto px-4 py-12">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Brand Section */}
                    <div className="col-span-1 md:col-span-2">
                        <Link href="/" className="flex items-center gap-2 mb-4">
                            <Logo />
                        </Link>
                        <p className="text-gray-400 mb-6 max-w-md">
                            tonklasocute is a free stock tracking app. Track real-time prices, set personalized alerts, and explore detailed company insights — no paywalls, no subscriptions.
                        </p>
                    </div>

                    {/* Resources */}
                    <div>
                        <h3 className="text-lg font-semibold mb-4">Resources</h3>
                        <ul className="space-y-2">
                            <li>
                                <Link href="/api-docs" className="text-gray-400 hover:text-white transition-colors duration-200 relative group">
                                    <span className="relative">
                                        API Documentation
                                        <span className="absolute left-0 bottom-0 w-0 h-0.5 bg-white transition-all duration-300 group-hover:w-full"></span>
                                    </span>
                                </Link>
                            </li>
                            <li>
                                <Link href="/help" className="text-gray-400 hover:text-white transition-colors duration-200 relative group">
                                    <span className="relative">
                                        Help Center
                                        <span className="absolute left-0 bottom-0 w-0 h-0.5 bg-white transition-all duration-300 group-hover:w-full"></span>
                                    </span>
                                </Link>
                            </li>
                            <li>
                                <Link href="/terms" className="text-gray-400 hover:text-white transition-colors duration-200 relative group">
                                    <span className="relative">
                                        Terms of Service
                                        <span className="absolute left-0 bottom-0 w-0 h-0.5 bg-white transition-all duration-300 group-hover:w-full"></span>
                                    </span>
                                </Link>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Divider */}
                <div className="border-t border-gray-800 mt-8 pt-8">
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
