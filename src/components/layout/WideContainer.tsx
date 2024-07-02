import { ReactNode } from "react";

interface WideContainerProps {
  classNames?: string;
  children?: ReactNode;
  ultraWide?: boolean;
}

export function WideContainer(props: WideContainerProps) {
  return (
    <div
      className={`mx-auto flex flex-col gap-4 max-w-full px-4 ${
        props.ultraWide ? "w-[1300px] sm:px-16" : "w-[900px] sm:px-8"
      } ${props.classNames || ""}`}
    >
      {props.children}
    </div>
  );
}
