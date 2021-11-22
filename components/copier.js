import { useState } from "react";

export default function Copier({ children, copy = "", className }) {
  const [copied, setCopied] = useState(false);

  const onCopy = () => {
    if (typeof document !== "undefined") {
      setCopied(true);
      const field = document.createElement("input");
      field.type = "text";
      field.value = copy;
      document.body.appendChild(field);
      field.select();
      field.setSelectionRange(0, 99999);
      document.execCommand("copy");
      field.remove();
      setTimeout(() => setCopied(false), 500);
    }
  };
  return (
    <span onClick={onCopy} className={`copier${copied ? " is-copied" : ""}`}>
      <span>{children}</span>
      <IconCopy />
    </span>
  );
}

const IconCopy = () => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="#28DBD1"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M19.7071 3H9.70488C8.99201 3 8.41211 3.57691 8.41211 4.286V7.30433C8.68688 7.30433 14.0794 7.30433 14.2947 7.30433C15.6582 7.30433 16.7676 8.40786 16.7676 9.76429C16.7676 10.0182 16.7676 15.4575 16.7676 15.522H19.7071C20.42 15.522 20.9999 14.9451 20.9999 14.2359V4.286C20.9999 3.57691 20.42 3 19.7071 3Z" />
    <path d="M14.295 8.47852H4.29281C3.57998 8.47852 3 9.05542 3 9.76455V19.7145C3.00004 20.4236 3.57994 21.0005 4.29281 21.0005H14.2951C15.0079 21.0005 15.5879 20.4236 15.5879 19.7145V9.76455C15.5879 9.05542 15.0079 8.47852 14.295 8.47852Z" />
  </svg>
);
