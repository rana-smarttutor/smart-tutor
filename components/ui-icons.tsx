import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement> & {
  size?: number;
};

function BaseIcon({ size = 24, className, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      <path d="M4 5h16v14H4z" />
      <path d="M8 12h8" />
      <path d="M12 8v8" />
      <circle cx="12" cy="12" r="2" />
    </svg>
  );
}

export const Download = BaseIcon;
export const X = BaseIcon;
export const MessageCircle = BaseIcon;
export const Send = BaseIcon;
export const Trophy = BaseIcon;
export const Award = BaseIcon;
export const Star = BaseIcon;
export const Quote = BaseIcon;
export const BookOpen = BaseIcon;
export const School = BaseIcon;
export const FlaskConical = BaseIcon;
export const Layers = BaseIcon;
export const FileText = BaseIcon;
export const Brain = BaseIcon;
export const Sparkles = BaseIcon;
export const HelpingHand = BaseIcon;
export const MapPin = BaseIcon;
export const Phone = BaseIcon;
export const Mail = BaseIcon;
export const User = BaseIcon;
export const Calendar = BaseIcon;
export const Clock = BaseIcon;
export const CheckCircle = BaseIcon;
export const XCircle = BaseIcon;
export const Laptop = BaseIcon;
export const Users = BaseIcon;
export const ClipboardList = BaseIcon;
export const LineChart = BaseIcon;
export const FileCheck = BaseIcon;
export const Tv = BaseIcon;
export const RefreshCw = BaseIcon;
export const Briefcase = BaseIcon;
export const Code = BaseIcon;
export const Volume2 = BaseIcon;
export const Brush = BaseIcon;
export const MessageSquare = BaseIcon;
export const Calculator = BaseIcon;
export const Palette = BaseIcon;
export const Coins = BaseIcon;
export const History = BaseIcon;
export const Database = BaseIcon;
export const Cloud = BaseIcon;
export const BriefcaseBusiness = BaseIcon;
export const Building2 = BaseIcon;
export const GraduationCap = BaseIcon;
export const Handshake = BaseIcon;
export const Upload = BaseIcon;
export const ArrowRight = BaseIcon;
export const TrendingUp = BaseIcon;
export const BrainCircuit = BaseIcon;
export const ChevronLeft = BaseIcon;
export const ChevronRight = BaseIcon;
