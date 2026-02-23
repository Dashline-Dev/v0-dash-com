import {
  MessageCircle,
  Calendar,
  Rocket,
  BookOpen,
  Code,
  Image,
  Gamepad2,
  MapPin,
  Timer,
  Lightbulb,
  Megaphone,
  Shield,
  Flower2,
  ArrowLeftRight,
  Music,
  Video,
  Palette,
  Wrench,
  Heart,
  Star,
  Hash,
  type LucideProps,
} from "lucide-react"

const ICON_MAP: Record<string, React.ComponentType<LucideProps>> = {
  MessageCircle,
  Calendar,
  Rocket,
  BookOpen,
  Code,
  Image,
  Gamepad2,
  MapPin,
  Timer,
  Lightbulb,
  Megaphone,
  Shield,
  Flower2,
  ArrowLeftRight,
  Music,
  Video,
  Palette,
  Wrench,
  Heart,
  Star,
}

export function SpaceIcon({
  name,
  className,
}: {
  name: string | null
  className?: string
}) {
  const IconComponent = name ? ICON_MAP[name] : null
  if (IconComponent) return <IconComponent className={className} />
  return <Hash className={className} />
}
