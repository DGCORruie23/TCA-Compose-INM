import React, { useRef, useEffect } from "react";

const AutoResizeTextarea = ({ value, onChange, placeholder = "", className = "" }) => {
  const textAreaRef = useRef(null);

  useEffect(() => {
    if (textAreaRef.current) {
      textAreaRef.current.style.height = "auto"; // reset
      textAreaRef.current.style.height = textAreaRef.current.scrollHeight + "px";
    }
  }, [value]);

  return (
    <textarea
      ref={textAreaRef}
      rows={1}
      className={`w-full border p-2 rounded resize-none overflow-hidden leading-tight ${className}`}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
    />
  );
};

export default AutoResizeTextarea;
