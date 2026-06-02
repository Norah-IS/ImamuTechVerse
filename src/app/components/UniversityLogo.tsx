interface UniversityLogoProps {
  size?: number;
  variant?: 'full' | 'icon';
  className?: string;
}

/**
 * Stylized Imamu TechVerse / IMSIU University Logo
 * Uses official Nibras brand colors: Dark Blue #1E2652 and Purple #5C2D91
 */
export function UniversityLogo({ size = 48, variant = 'icon', className = '' }: UniversityLogoProps) {
  if (variant === 'icon') {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
        aria-label="شعار جامعة الإمام محمد بن سعود الإسلامية"
      >
        {/* Outer shield/emblem shape */}
        <path
          d="M24 2L4 10v18c0 10.5 8.5 18.5 20 20 11.5-1.5 20-9.5 20-20V10L24 2z"
          fill="#1E2652"
        />
        {/* Inner shield highlight */}
        <path
          d="M24 6L8 13v15c0 8.5 7 15 16 16.5 9-1.5 16-8 16-16.5V13L24 6z"
          fill="#252d6b"
        />
        {/* Book spine (center line) */}
        <line x1="24" y1="16" x2="24" y2="36" stroke="#00ADEF" strokeWidth="1.5" strokeLinecap="round" />
        {/* Left book page */}
        <rect x="14" y="17" width="8.5" height="13" rx="1.5" fill="white" opacity="0.92" />
        {/* Right book page */}
        <rect x="25.5" y="17" width="8.5" height="13" rx="1.5" fill="white" opacity="0.92" />
        {/* Left page lines */}
        <line x1="16" y1="21" x2="21" y2="21" stroke="#8C61AF" strokeWidth="1" strokeLinecap="round" />
        <line x1="16" y1="24" x2="21" y2="24" stroke="#8C61AF" strokeWidth="1" strokeLinecap="round" />
        <line x1="16" y1="27" x2="21" y2="27" stroke="#8C61AF" strokeWidth="1" strokeLinecap="round" />
        {/* Right page lines */}
        <line x1="27" y1="21" x2="32" y2="21" stroke="#8C61AF" strokeWidth="1" strokeLinecap="round" />
        <line x1="27" y1="24" x2="32" y2="24" stroke="#8C61AF" strokeWidth="1" strokeLinecap="round" />
        <line x1="27" y1="27" x2="32" y2="27" stroke="#8C61AF" strokeWidth="1" strokeLinecap="round" />
        {/* Crown/arch on top of book */}
        <path
          d="M18 17 Q24 11 30 17"
          stroke="#5C2D91"
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
        />
        {/* Star/sparkle accent */}
        <circle cx="24" cy="12" r="2.5" fill="#5C2D91" />
        <circle cx="24" cy="12" r="1.2" fill="#00ADEF" />
        {/* Bottom decorative bar */}
        <rect x="16" y="36" width="16" height="2" rx="1" fill="#00ADEF" opacity="0.7" />
      </svg>
    );
  }

  // Full variant with text
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <UniversityLogo size={size} variant="icon" />
      <div className="flex flex-col leading-tight">
        <span
          style={{ color: '#1E2652', fontFamily: 'Tajawal, sans-serif' }}
          className="font-black text-base"
        >
          Imamu TechVerse
        </span>
        <span
          style={{ color: '#5C2D91', fontFamily: 'Tajawal, sans-serif' }}
          className="text-xs font-bold"
        >
          جامعة الإمام محمد بن سعود الإسلامية
        </span>
      </div>
    </div>
  );
}

/** White-on-dark variant for use on dark backgrounds */
export function UniversityLogoWhite({ size = 48, className = '' }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="شعار جامعة الإمام محمد بن سعود الإسلامية"
    >
      {/* Outer shield */}
      <path
        d="M24 2L4 10v18c0 10.5 8.5 18.5 20 20 11.5-1.5 20-9.5 20-20V10L24 2z"
        fill="white"
        opacity="0.15"
      />
      <path
        d="M24 6L8 13v15c0 8.5 7 15 16 16.5 9-1.5 16-8 16-16.5V13L24 6z"
        fill="white"
        opacity="0.1"
      />
      {/* Book spine */}
      <line x1="24" y1="16" x2="24" y2="36" stroke="#00ADEF" strokeWidth="1.5" strokeLinecap="round" />
      {/* Left book page */}
      <rect x="14" y="17" width="8.5" height="13" rx="1.5" fill="white" opacity="0.9" />
      {/* Right book page */}
      <rect x="25.5" y="17" width="8.5" height="13" rx="1.5" fill="white" opacity="0.9" />
      {/* Left page lines */}
      <line x1="16" y1="21" x2="21" y2="21" stroke="#8C61AF" strokeWidth="1" strokeLinecap="round" />
      <line x1="16" y1="24" x2="21" y2="24" stroke="#8C61AF" strokeWidth="1" strokeLinecap="round" />
      <line x1="16" y1="27" x2="21" y2="27" stroke="#8C61AF" strokeWidth="1" strokeLinecap="round" />
      {/* Right page lines */}
      <line x1="27" y1="21" x2="32" y2="21" stroke="#8C61AF" strokeWidth="1" strokeLinecap="round" />
      <line x1="27" y1="24" x2="32" y2="24" stroke="#8C61AF" strokeWidth="1" strokeLinecap="round" />
      <line x1="27" y1="27" x2="32" y2="27" stroke="#8C61AF" strokeWidth="1" strokeLinecap="round" />
      {/* Crown arch */}
      <path d="M18 17 Q24 11 30 17" stroke="#8C61AF" strokeWidth="2" fill="none" strokeLinecap="round" />
      {/* Star */}
      <circle cx="24" cy="12" r="2.5" fill="white" opacity="0.6" />
      <circle cx="24" cy="12" r="1.2" fill="#00ADEF" />
      {/* Bottom bar */}
      <rect x="16" y="36" width="16" height="2" rx="1" fill="#00ADEF" opacity="0.7" />
    </svg>
  );
}
