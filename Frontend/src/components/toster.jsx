
import React, { useEffect, useState } from "react";
import "./toster.css";

const introductions = [
  "Hey, I'm Anish Tiwari.",
  "I'm a Full Stack MERN Developer.",
  "I build responsive web applications.",
  "I work with React, Node.js and MongoDB.",
  "I love turning ideas into reality.",
  "Welcome to my portfolio!"
];

export default function Toast() {
  const [text, setText] = useState("");
  const [line, setLine] = useState(0);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const currentText = introductions[line];
    let delay = deleting ? 35 : 65;

    if (!deleting && text === currentText) {
      delay = 1600;
    } else if (deleting && text === "") {
      delay = 400;
    }

    const timer = setTimeout(() => {
      if (!deleting && text === currentText) {
        setDeleting(true);
      } else if (deleting && text === "") {
        setDeleting(false);
        setLine((prev) => (prev + 1) % introductions.length);
      } else if (deleting) {
        setText(currentText.substring(0, text.length - 1));
      } else {
        setText(currentText.substring(0, text.length + 1));
      }
    }, delay);

    return () => clearTimeout(timer);
  }, [text, deleting, line]);

  return (
    <div className="intro-toast-text" aria-live="polite">
      <span>{text}</span>
      <span className="typing-cursor">|</span>
    </div>
  );
}
