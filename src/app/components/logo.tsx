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
