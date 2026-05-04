import "@/assets/css/suggestedContent.css";

export function PeriodSwitcher(props: {
  value: "day" | "week";
  change: (value: "day" | "week") => void;
}) {
  return (
    <div className="switch-container" data-left={props.value === "day"}>
      <div className="indicator" />
      <button id="day" onClick={() => props.change("day")} type="button">
        Today
      </button>
      <button id="week" onClick={() => props.change("week")} type="button">
        This Week
      </button>
    </div>
  );
}
