import { useState, useEffect } from "react";

export default function ProgressSlider({ startDate, endDate }) {
  const [percent, setPercent] = useState(0);
  function update() {
    const value =
      (new Date().getTime() - startDate.getTime()) /
      (endDate.getTime() - startDate.getTime());
    setPercent(value * 100);
  }

  useEffect(() => {
    update();
    const handle = setInterval(update, 1000);
    return () => clearInterval(handle);
  }, [endDate.getTime()]);

  return (
    <div className="progress-slider">
      <div
        className={`progress-slider__fill${percent <= 0 ? " is-stared" : ""}${
          percent > 95 ? " is-ended" : ""
        }`}
        style={{ width: `${percent}%` }}
      />
    </div>
  );
}
