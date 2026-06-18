import universityLogo from '../public/ImamuLogo.png';
import projectLogo from '../public/ImamuTechVersLogo.png';

export function Logo({ variant = 'university', className = 'h-12' }: {
  variant?: 'university' | 'project';
  className?: string;
}) {
  const src = variant === 'project' ? projectLogo : universityLogo;
  const alt = variant === 'project' ? 'شعار TechVerse' : 'شعار جامعة الإمام';
  return <img src={src} alt={alt} className={className} />;
}

/**
 * Both logos side-by-side, always visible on all screen sizes.
 * variant="header" wraps each logo in a subtle box (for dark headers).
 * variant="bare"   shows the images with no wrapper (for footers / hero sections).
 */
export function LogoGroup({
  variant = 'header',
  uniSize = 'h-9',
  projSize = 'h-7',
}: {
  variant?: 'header' | 'bare';
  uniSize?: string;
  projSize?: string;
}) {
  const uniImg = <img src={universityLogo} alt="شعار جامعة الإمام" className={`${uniSize} w-auto`} />;
  const projImg = <img src={projectLogo} alt="شعار TechVerse" className={`${projSize} w-auto`} />;

  if (variant === 'bare') {
    return (
      <div className="flex items-center gap-2 shrink-0">
        {uniImg}
        {projImg}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 shrink-0">
      {uniImg}
      {projImg}
    </div>
  );
}
