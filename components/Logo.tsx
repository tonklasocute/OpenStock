const Logo = ({
    size = 34,
    showWordmark = true,
    className = "",
}: {
    size?: number;
    showWordmark?: boolean;
    className?: string;
}) => {
    return (
        <span className={`inline-flex items-center gap-2 ${className}`}>
            <svg width={size} height={size} viewBox="0 0 34 34" aria-hidden="true">
                <circle cx="17" cy="17" r="17" fill="#f472b6" />
                <circle cx="12" cy="14" r="2" fill="#fff" />
                <circle cx="22" cy="14" r="2" fill="#fff" />
                <path
                    d="M11 21 Q17 26 23 21"
                    stroke="#fff"
                    strokeWidth="2.5"
                    fill="none"
                    strokeLinecap="round"
                />
            </svg>
            {showWordmark && (
                <span className="font-extrabold text-gray-100" style={{ fontSize: size * 0.56 }}>
                    tonklasocute
                </span>
            )}
        </span>
    );
};

export default Logo;
