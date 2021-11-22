import { useState, useEffect } from "react";

export default function Countdown({ to, simple = false }) {
  const [values, setValues] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  function update() {
    let left = Math.max(0, to.getTime() - Date.now());

    const day = 1000 * 60 * 60 * 24;
    const hour = 1000 * 60 * 60;
    const minute = 1000 * 60;
    const second = 1000;

    const days = Math.floor(left / day);
    left -= days * day;
    const hours = Math.floor(left / hour);
    left -= hours * hour;
    const minutes = Math.floor(left / minute);
    left -= minutes * minute;
    const seconds = Math.floor(left / second);

    setValues({ days, hours, minutes, seconds });
  }

  useEffect(() => {
    update();
    const handle = setInterval(update, 1000);
    return () => clearInterval(handle);
  }, [to.getTime()]);

  return simple ? (
    <div className="countdown-string">
      {values.days}d : {values.hours}h : {values.minutes}m : {values.seconds}s
    </div>
  ) : (
    <div className="countdown">
      <div className="countdown-cell">
        <div className="countdown-cell-number">{values.days}</div>
        <div className="countdown-cell-label">days</div>
      </div>
      <div className="countdown-cell">
        <div className="countdown-cell-number">{values.hours}</div>
        <div className="countdown-cell-label">hours</div>
      </div>
      <div className="countdown-cell">
        <div className="countdown-cell-number">{values.minutes}</div>
        <div className="countdown-cell-label">minutes</div>
      </div>
      <div className="countdown-cell">
        <div className="countdown-cell-number">{values.seconds}</div>
        <div className="countdown-cell-label">seconds</div>
      </div>
    </div>
  );
}
