import Image from 'next/image';
import Link from 'next/link';

export default function SidebarItem({ href, icon, label, active = false }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-2 p-2 rounded hover:bg-[#f6fafd] transition"
      onClick={active}
    >
        <Image src={icon} alt={label} width={24} height={24} />
        <span>{label}</span>
    </Link>
  );
}