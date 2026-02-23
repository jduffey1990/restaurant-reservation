import React, { useState, useEffect } from "react";
import "./WakeUpScreen.css";

const TRIVIA = [
  { q: "Which country is credited with inventing the restaurant as we know it today?", a: "France", options: ["Italy", "France", "China", "England"] },
  { q: "What does 'al dente' mean in Italian cooking?", a: "To the tooth", options: ["Very soft", "To the tooth", "Well done", "With sauce"] },
  { q: "Which spice is more expensive by weight than gold?", a: "Saffron", options: ["Cardamom", "Vanilla", "Saffron", "Truffle"] },
  { q: "What is the most ordered food in the United States?", a: "Pizza", options: ["Burger", "Pizza", "Fried Chicken", "Tacos"] },
  { q: "Which chef has the most Michelin stars in the world?", a: "Joël Robuchon", options: ["Gordon Ramsay", "Joël Robuchon", "Ferran Adrià", "Thomas Keller"] },
  { q: "What does 'mise en place' mean?", a: "Everything in its place", options: ["Put it on", "Everything in its place", "Ready to cook", "Set the table"] },
  { q: "Approximately how many taste buds does the average human have?", a: "10,000", options: ["2,000", "5,000", "10,000", "25,000"] },
  { q: "What country consumes the most cheese per capita?", a: "Denmark", options: ["France", "Denmark", "Italy", "Greece"] },
  { q: "What is the most expensive pizza in the world made with?", a: "Gold flakes & lobster", options: ["Truffle & caviar", "Gold flakes & lobster", "Wagyu beef & saffron", "Foie gras & champagne"] },
  { q: "Which vitamin is produced when skin is exposed to sunlight?", a: "Vitamin D", options: ["Vitamin A", "Vitamin C", "Vitamin D", "Vitamin K"] },
  { q: "What does 'umami' translate to in Japanese?", a: "Pleasant savory taste", options: ["Fifth element", "Deep flavor", "Pleasant savory taste", "Rich aroma"] },
  { q: "How many gallons of water does it take to produce one pound of beef?", a: "1,800 gallons", options: ["200 gallons", "800 gallons", "1,800 gallons", "5,000 gallons"] },
  { q: "What is the oldest restaurant in the world, founded in 1153?", a: "Ma Yu Ching's Bucket Chicken", options: ["Sobrino de Botín", "Ma Yu Ching's Bucket Chicken", "St. Peter Stiftskulinarium", "Zum Franziskaner"] },
  { q: "Which country invented the croissant?", a: "Austria", options: ["France", "Austria", "Germany", "Switzerland"] },
  { q: "What does 'BYOB' stand for at restaurants?", a: "Bring Your Own Bottle", options: ["Buy Your Own Beer", "Bring Your Own Bottle", "Bistro Year-round Open Bar", "Bring Your Own Budget"] },
];

function shuffle(arr) {
  return [...arr].sort(() => Math.random() - 0.5);
}

export default function WakeUpScreen({ onReady }) {
  const [questions] = useState(() => shuffle(TRIVIA));
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState(null);
  const [score, setScore] = useState(0);
  const [answered, setAnswered] = useState(0);
  const [shuffledOptions, setShuffledOptions] = useState([]);
  const [isReady, setIsReady] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);
  const [dots, setDots] = useState(".");

  const q = questions[current % questions.length];

  useEffect(() => {
    setShuffledOptions(shuffle(q.options));
  }, [current, q.options]);

  // Animate the "waking up" dots
  useEffect(() => {
    const interval = setInterval(() => {
      setDots(d => d.length >= 3 ? "." : d + ".");
    }, 500);
    return () => clearInterval(interval);
  }, []);

  // When parent signals backend is ready
  useEffect(() => {
    if (isReady) {
      setTimeout(() => {
        setFadeOut(true);
        setTimeout(onReady, 600);
      }, 1200);
    }
  }, [isReady, onReady]);

  // Expose a way for parent to signal readiness
  useEffect(() => {
    window.__wakeUpReady = () => setIsReady(true);
    return () => delete window.__wakeUpReady;
  }, []);

  function handleAnswer(option) {
    if (selected) return;
    setSelected(option);
    const correct = option === q.a;
    if (correct) setScore(s => s + 1);
    setAnswered(a => a + 1);
    setTimeout(() => {
      setSelected(null);
      setCurrent(c => c + 1);
    }, 1400);
  }

  return (
    <div className={`wakeup-overlay${fadeOut ? " wakeup-fade-out" : ""}`}>
      <div className="wakeup-bg-pattern" />

      <div className="wakeup-container">
        <div className="wakeup-brand">
          <div className="wakeup-candle">🕯️</div>
          <h1 className="wakeup-title">Periodic Tables</h1>
          <p className="wakeup-subtitle">Fine Dining Reservation System</p>
        </div>

        <div className="wakeup-status">
          {isReady ? (
            <div className="wakeup-ready">
              <span className="wakeup-ready-icon">✓</span> Your table is ready!
            </div>
          ) : (
            <div className="wakeup-waking">
              <div className="wakeup-spinner" />
              <span>Warming up the kitchen{dots}</span>
            </div>
          )}
        </div>

        <div className="wakeup-card">
          <div className="wakeup-score-row">
            <span className="wakeup-label">WHILE YOU WAIT — FOOD & DRINK TRIVIA</span>
            <span className="wakeup-score">{score}/{answered} correct</span>
          </div>

          <p className="wakeup-question">{q.q}</p>

          <div className="wakeup-options">
            {shuffledOptions.map(option => {
              let cls = "wakeup-option";
              if (selected) {
                if (option === q.a) cls += " wakeup-correct";
                else if (option === selected) cls += " wakeup-wrong";
                else cls += " wakeup-dimmed";
              }
              return (
                <button
                  key={option}
                  className={cls}
                  onClick={() => handleAnswer(option)}
                  disabled={!!selected}
                >
                  {option}
                  {selected && option === q.a && <span className="wakeup-tick"> ✓</span>}
                  {selected && option === selected && option !== q.a && <span className="wakeup-cross"> ✗</span>}
                </button>
              );
            })}
          </div>

          {selected && (
            <p className={`wakeup-feedback ${selected === q.a ? "wakeup-feedback-correct" : "wakeup-feedback-wrong"}`}>
              {selected === q.a ? "Correct! Nice work. 🎉" : `Not quite — the answer is "${q.a}".`}
            </p>
          )}
        </div>

        <p className="wakeup-footer">
          Free tier server spins down after inactivity. Thanks for your patience!
        </p>
      </div>
    </div>
  );
}