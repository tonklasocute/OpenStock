const Logo = ({
    size = 34,
    className = "",
}: {
    size?: number;
    className?: string;
}) => {
    return (
        <span
            className={`font-extrabold text-gray-100 tracking-tight ${className}`}
            style={{ fontSize: size * 0.56 }}
        >
            TONKLA
        </span>
    );
};

export default Logo;
