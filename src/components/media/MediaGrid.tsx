import { forwardRef, useEffect, useRef, useState } from "react";

import { Icon, Icons } from "../Icon";

interface MediaGridProps {
  children?: React.ReactNode;
}

export const MediaGrid = forwardRef<HTMLDivElement, MediaGridProps>(
  (props, ref) => {
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const [isScrolledLeft, setIsScrolledLeft] = useState(true);
    const [isScrolledRight, setIsScrolledRight] = useState(false);

    useEffect(() => {
      const scrollContainer = scrollContainerRef.current;

      const handleScroll = () => {
        if (scrollContainer) {
          const { scrollLeft, scrollWidth, clientWidth } = scrollContainer;
          setIsScrolledLeft(scrollLeft === 0);
          setIsScrolledRight(scrollLeft + clientWidth === scrollWidth);
        }
      };

      if (scrollContainer && props.children) {
        scrollContainer.addEventListener("scroll", handleScroll);
        handleScroll(); // Initial check
      }

      return () => {
        if (scrollContainer) {
          scrollContainer.removeEventListener("scroll", handleScroll);
        }
      };
    }, [props.children]);

    const scrollLeft = () => {
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollBy({ left: -500, behavior: "smooth" });
      }
    };

    const scrollRight = () => {
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollBy({ left: 500, behavior: "smooth" });
      }
    };

    return (
      <div className="relative">
        {!isScrolledLeft && (
          <div className="arrow left-0" onClick={scrollLeft}>
            <Icon icon={Icons.ARROW_LEFT} />
          </div>
        )}
        <div className="horizontal-scroll-container" ref={scrollContainerRef}>
          {props.children}
        </div>
        {!isScrolledRight && (
          <div className="arrow right-0" onClick={scrollRight}>
            <Icon icon={Icons.ARROW_RIGHT} />
          </div>
        )}
      </div>
    );
  },
);
