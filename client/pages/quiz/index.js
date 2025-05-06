// client/pages/[quiz]/index.js
import React, { useState } from "react";
import { Container, Row, Col } from "react-bootstrap";
import styles from "./quiz.module.css";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";

const QuizPage = () => {
  const { t } = useTranslation("common");
  const [category, setCategory] = useState("ALL");
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({}); // key: question_id, value: selected option
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  // FETCH QUIZ QUESTIONS
  const fetchQuiz = async () => {
    setError("");
    setResult(null);
    setAnswers({});
    setSubmitted(false);

    try {
      const res = await fetch(
        `${
          process.env.NEXT_PUBLIC_API_URL
        }/v1/quiz?category=${encodeURIComponent(category)}`,
      );

      const data = await res.json();
      console.log(data);

      // SHOW CORRECT ANSWERS for TESTING
      if (data.dataQuiz && data.dataQuiz.length > 0) {
        data.dataQuiz.forEach((q, index) => {
          console.log(`Q${index + 1} Correct Answer: ${q.correct_option}`);
        });
      }

      setQuestions(data.dataQuiz || []);
    } catch (err) {
      console.error(`Error fetching quiz:`, err);
      setError("Error loading quiz. Please try again.");
    }
  };

  const handleOptionChange = (question_id, selected) => {
    setAnswers((prev) => ({ ...prev, [question_id]: selected }));
  };

  // SUBMIT QUIZ locally for Results (not sending to backend)
  const submitQuiz = () => {
    setError("");
    let correctCount = 0;
    const wrongQuestions = [];

    // Check each question's answer
    questions.forEach((q) => {
      const selected = answers[q.question_id];
      if (!selected || selected !== q.correct_option) {
        wrongQuestions.push(q.question_id);
      } else {
        correctCount++;
      }
    });

    setResult({
      total: questions.length,
      correct: correctCount,
      wrong: wrongQuestions, // wrong is an array of wrong question IDs
    });
    setSubmitted(true);
  };

  // RENDER PAGE
  return (
    <Container className={styles.container}>
      <div className={styles.content}>
        <Row>
          <Col>
            <div className="container mt-5">
              <h2>Interactive Quiz</h2>
              <p>Test your knowledge about baby care 👇</p>

              {/* Select Category */}
              <div className="mb-3">
                <label htmlFor="categorySelect">Choose a Quiz Category:</label>
                <select
                  id="categorySelect"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="form-control"
                >
                  <option value="ALL">ALL</option>
                  <option value="SLEEP">SLEEP</option>
                  <option value="HYGIENE">HYGIENE</option>
                  <option value="PHYSICAL ACTIVITIES">
                    PHYSICAL ACTIVITIES
                  </option>
                  <option value="LANGUAGE DEVELOPMENT">
                    LANGUAGE DEVELOPMENT
                  </option>
                  <option value="EMOTIONAL DEVELOPMENT">
                    EMOTIONAL DEVELOPMENT
                  </option>
                </select>
              </div>

              {/* Change button text if quiz is loaded */}
              <button className="btn btn-primary mb-3" onClick={fetchQuiz}>
                {questions.length > 0 ? "Start Another Quiz" : "Start Quiz"}{" "}
              </button>
              <br />
              <br />
              <br />

              {/* Show error if any */}
              {error && <div className="alert alert-danger">{error}</div>}

              {/* Display quiz questions if loaded */}
              {questions.length > 0 && (
                <form>
                  {questions.map((q, index) => {
                    // Determine if no answer was provided for this question
                    const noAnswer = submitted && !answers[q.question_id];
                    return (
                      <div
                        key={q.question_id}
                        className="mb-4"
                        style={
                          noAnswer
                            ? { borderBottom: "2px solid red" } // highlight question in red if no answer was selected
                            : {}
                        }
                      >
                        {/* Display question text */}
                        <p>
                          <strong>
                            {index + 1}. {q.question_text}{" "}
                            {/* <span style={{ fontSize: "0.8em", color: "#6c757d" }}>
                              (Question {index + 1}){" "}
                            </span> */}
                          </strong>
                        </p>

                        {/* Display options A, B, C, D */}
                        {["A", "B", "C", "D"].map((opt) => {
                          let optionText = `${opt}. ${
                            q[`option_${opt.toLowerCase()}`]
                          }`;
                          // Determine styles based on submission and correctness
                          let optionStyle = {};
                          let extraText = "";
                          if (submitted) {
                            if (opt === q.correct_option) {
                              // Always highlight correct answer in green
                              optionStyle = { backgroundColor: "#d4edda" }; // green background
                              extraText = " CORRECT"; // extra text appended
                            }
                            if (
                              answers[q.question_id] &&
                              answers[q.question_id] === opt &&
                              answers[q.question_id] !== q.correct_option
                            ) {
                              // Highlight selected wrong answer in red
                              optionStyle = { backgroundColor: "#f8d7da" }; // red background
                              extraText = " WRONG ANSWER!"; // extra text appended
                            }
                          }
                          return (
                            <div
                              key={opt}
                              className="form-check"
                              style={optionStyle}
                            >
                              <input
                                className="form-check-input"
                                type="radio"
                                name={`question_${q.question_id}`}
                                id={`q${q.question_id}_${opt}`}
                                value={opt}
                                checked={answers[q.question_id] === opt}
                                onChange={() =>
                                  handleOptionChange(q.question_id, opt)
                                }
                                disabled={submitted} // disable options after submission
                              />
                              <label
                                className="form-check-label"
                                htmlFor={`q${q.question_id}_${opt}`}
                              >
                                {optionText}
                                {submitted && (
                                  <span
                                    style={{
                                      marginLeft: "10px",
                                      fontWeight: "bold",
                                      color:
                                        opt === q.correct_option
                                          ? "#155724"
                                          : "#721c24", // green for correct, red for wrong
                                    }}
                                  >
                                    {opt === q.correct_option ? " CORRECT" : ""}
                                    {answers[q.question_id] === opt &&
                                    answers[q.question_id] !== q.correct_option
                                      ? " WRONG ANSWER!"
                                      : ""}
                                  </span>
                                )}
                              </label>
                            </div>
                          );
                        })}

                        {/* IF NO ANSWER SELECTED */}
                        {noAnswer && (
                          <p
                            style={{
                              color: "red",
                              fontWeight: "bold",
                              marginTop: "0.5rem",
                            }}
                          >
                            No answer selected
                          </p>
                        )}
                      </div>
                    );
                  })}
                  <button
                    type="button"
                    className="btn btn-success"
                    onClick={submitQuiz}
                    disabled={submitted} // disable submit button after submission
                  >
                    Submit Quiz
                  </button>
                </form>
              )}

              {/* Show results */}
              {result && (
                <div className="mt-4">
                  <h4>Quiz Results</h4>
                  <p>
                    <strong>
                      You answered {result.correct} out of {result.total}{" "}
                      correctly.
                    </strong>
                  </p>
                  <p>
                    {/* SHOW THE WRONG QUESTION COUNT (NOT question ID) */}
                    Review the questions you missed:{" "}
                    {result.wrong.map((id, index) => {
                      // find index of wrong questions
                      const questionIndex = questions.findIndex(
                        (q) => q.question_id === id,
                      );

                      // if questionIndex is found, display it
                      return questionIndex !== -1 ? (
                        <span key={id}>
                          {questionIndex + 1}
                          {index < result.wrong.length - 1 ? ", " : ""}
                        </span>
                      ) : null;
                    })}
                  </p>
                </div>
              )}
            </div>
          </Col>
        </Row>
      </div>
    </Container>
  );
};

export default QuizPage;

export async function getStaticProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ["common"])),
    },
  };
}
