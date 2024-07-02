import { useNavigate } from "react-router-dom";

import { Icon, Icons } from "@/components/Icon";

export function GoToLink(props: {
  children: React.ReactNode;
  href?: string;
  className?: string;
  onClick?: () => void;
}) {
  const navigate = useNavigate();

  const goTo = (href: string) => {
    if (href.startsWith("http")) window.open(href, "_blank");
    else navigate(href);
  };

  return (
    <a
      tabIndex={0}
      href={props.href}
      onClick={(evt) => {
        evt.preventDefault();
        if (props.href) goTo(props.href);
        else props.onClick?.();
      }}
      className={props.className}
    >
      {props.children}
    </a>
  );
}

export function LinksDropdown() {
  return (
    <div
      className="cursor-pointer tabbable rounded-full flex gap-2 text-white items-center py-2 px-3 bg-pill-background bg-opacity-50 hover:bg-pill-backgroundHover backdrop-blur-lg transition-[background,transform] duration-100 hover:scale-105"
      tabIndex={0}
    >
      a
    </div>
  );
}
