import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "../../css/MovieAkinator.css";

const BACKEND_URL =
  process.env.REACT_APP_BACKEND_SERVER_URI || "http://localhost:8081";

const genreNames = {
  28: "action",
  12: "adventure",
  16: "animated",
  35: "comedy",
  80: "crime",
  18: "drama",
  10751: "family",
  14: "fantasy",
  27: "horror",
  9648: "mystery",
  10749: "romance",
  878: "sci-fi",
  53: "thriller",
  10752: "war",
  37: "western",
  36: "historical",
  10402: "music",
};

function getYear(movie) {
  return Number(movie.year) || 0;
}

function getMonth(movie) {
  return Number(movie.releaseDate?.slice(5, 7)) || 0;
}

function hasKeyword(movie, pattern) {
  return (movie.keywordNames || []).some((keyword) => pattern.test(keyword));
}

function hasText(movie, pattern) {
  return (
    pattern.test(movie.title || "") ||
    pattern.test(movie.overview || "") ||
    pattern.test(movie.tagline || "") ||
    hasKeyword(movie, pattern)
  );
}

function hasActor(movie, actorName) {
  return (movie.cast || []).some((actor) => (actor.name || actor) === actorName);
}

function buildQuestions(movies) {
  const questions = [];

  Object.entries(genreNames).forEach(([id, name]) => {
    questions.push({
      id: `genre-${id}`,
      text: `Is it a ${name} movie?`,
      weight: 10,
      test: (movie) => movie.genreIds?.includes(Number(id)),
    });
  });

  for (let decade = 1930; decade <= 2020; decade += 10) {
    questions.push({
      id: `decade-${decade}`,
      text: `Was it released in the ${decade}s?`,
      weight: 9,
      test: (movie) => getYear(movie) >= decade && getYear(movie) <= decade + 9,
    });
  }

  [
    ["jan", 1, "January"],
    ["feb", 2, "February"],
    ["mar", 3, "March"],
    ["apr", 4, "April"],
    ["may", 5, "May"],
    ["jun", 6, "June"],
    ["jul", 7, "July"],
    ["aug", 8, "August"],
    ["sep", 9, "September"],
    ["oct", 10, "October"],
    ["nov", 11, "November"],
    ["dec", 12, "December"],
  ].forEach(([id, month, label]) => {
    questions.push({
      id: `month-${id}`,
      text: `Was it released in ${label}?`,
      weight: 5,
      test: (movie) => getMonth(movie) === month,
    });
  });

  questions.push(
    {
      id: "franchise",
      text: "Is it part of a series, sequel, or franchise?",
      weight: 12,
      test: (movie) =>
        movie.belongsToCollection ||
        hasText(movie, /sequel|franchise|trilogy|saga|chapter|part|episode|cinematic universe/i) ||
        /(:|2|3|4|5|ii|iii|iv|v|returns|rises|rise|final|legacy|resurrection|revenge|awakens)/i.test(
          movie.title || ""
        ),
    },
    {
      id: "space",
      text: "Does it involve space, planets, galaxies, or spaceships?",
      weight: 12,
      test: (movie) =>
        movie.genreIds?.includes(878) &&
        hasText(movie, /space|spaceship|spacecraft|galaxy|planet|intergalactic|cosmic|black hole|alien|orbit|mission/i),
    },
    {
      id: "space-horror",
      text: "Is it horror set in space or on a spaceship?",
      weight: 16,
      test: (movie) =>
        movie.genreIds?.includes(27) &&
        hasText(movie, /space|spaceship|spacecraft|galaxy|planet|alien|cosmic|black hole|dimension|orbit|mission/i),
    },
    {
      id: "sci-fi-horror",
      text: "Is it both sci-fi and horror?",
      weight: 15,
      test: (movie) => movie.genreIds?.includes(878) && movie.genreIds?.includes(27),
    },
    {
      id: "psychological",
      text: "Is it psychological, disturbing, or mind-bending?",
      weight: 12,
      test: (movie) =>
        hasText(movie, /psychological|hallucination|madness|paranoia|nightmare|surreal|mind|trauma|disturbing|insanity/i),
    },
    {
      id: "school",
      text: "Does it take place in a school, college, or academic setting?",
      weight: 16,
      test: (movie) =>
        hasText(movie, /school|teacher|student|professor|college|academy|classroom|boarding school|education|prep school/i),
    },
    {
      id: "teacher-mentor",
      text: "Does it involve a teacher, mentor, coach, or authority figure?",
      weight: 13,
      test: (movie) =>
        hasText(movie, /teacher|mentor|professor|coach|leader|authority|education|inspire|lesson/i),
    },
    {
      id: "coming-of-age",
      text: "Is it a coming-of-age story?",
      weight: 12,
      test: (movie) =>
        hasText(movie, /coming of age|teenager|youth|adolescence|growing up|high school|student|young/i),
    },
    {
      id: "emotional-drama",
      text: "Is it emotional or inspirational?",
      weight: 11,
      test: (movie) =>
        movie.genreIds?.includes(18) &&
        hasText(movie, /inspirational|emotional|friendship|mentor|life lesson|dream|tragedy|hope|poetry|family/i),
    },
    {
      id: "realistic",
      text: "Does it feel realistic instead of fantasy or sci-fi?",
      weight: 10,
      test: (movie) =>
        movie.genreIds?.includes(18) &&
        !movie.genreIds?.includes(878) &&
        !movie.genreIds?.includes(14) &&
        !movie.genreIds?.includes(27),
    },
    {
      id: "superhero",
      text: "Does it involve superheroes or comic book characters?",
      weight: 14,
      test: (movie) =>
        hasText(movie, /superhero|super power|marvel|dc comics|comic book|masked vigilante|hero|villain/i),
    },
    {
      id: "monster",
      text: "Does it involve monsters, creatures, aliens, zombies, or demons?",
      weight: 13,
      test: (movie) =>
        hasText(movie, /monster|creature|alien|zombie|vampire|werewolf|ghost|demon|kaiju|virus|possession/i),
    },
    {
      id: "slasher",
      text: "Is it a slasher or killer movie?",
      weight: 12,
      test: (movie) =>
        hasText(movie, /slasher|serial killer|masked killer|killer|murder|stalker|psychopath/i),
    },
    {
      id: "true-story",
      text: "Is it based on real events, history, or a true story?",
      weight: 11,
      test: (movie) =>
        movie.genreIds?.includes(36) ||
        movie.genreIds?.includes(10752) ||
        hasText(movie, /based on true story|biography|historical|war|history|true crime|real life/i),
    },
    {
      id: "war-conflict",
      text: "Does it involve war, rebellion, or a large conflict?",
      weight: 10,
      test: (movie) =>
        movie.genreIds?.includes(10752) ||
        hasText(movie, /war|rebellion|resistance|empire|battle|army|soldier|conflict/i),
    },
    {
      id: "romantic",
      text: "Is romance a major part of it?",
      weight: 9,
      test: (movie) =>
        movie.genreIds?.includes(10749) || hasText(movie, /romance|love|relationship|marriage|couple/i),
    },
    {
      id: "funny",
      text: "Is it meant to be funny?",
      weight: 9,
      test: (movie) => movie.genreIds?.includes(35),
    },
    {
      id: "family-friendly",
      text: "Is it family-friendly?",
      weight: 8,
      test: (movie) =>
        movie.genreIds?.includes(10751) ||
        movie.genreIds?.includes(16) ||
        hasText(movie, /family|children|kids/i),
    },
    {
      id: "music",
      text: "Does music, performance, or art play a big role?",
      weight: 12,
      test: (movie) =>
        movie.genreIds?.includes(10402) ||
        hasText(movie, /music|musician|band|singer|dance|performance|artist|poetry|writer|theater|stage/i),
    },
    {
      id: "sports",
      text: "Is it about sports or competition?",
      weight: 11,
      test: (movie) =>
        hasText(movie, /sport|boxing|football|basketball|baseball|wrestling|competition|tournament|race|athlete|coach/i),
    },
    {
      id: "crime",
      text: "Does it involve crime, police, or investigation?",
      weight: 10,
      test: (movie) =>
        movie.genreIds?.includes(80) ||
        movie.genreIds?.includes(9648) ||
        hasText(movie, /crime|detective|police|murder|investigation|case|criminal|heist|robbery/i),
    },
    {
      id: "runtime-long",
      text: "Is it over 2 hours long?",
      weight: 7,
      test: (movie) => Number(movie.runtime) >= 120,
    },
    {
      id: "runtime-short",
      text: "Is it under 100 minutes?",
      weight: 7,
      test: (movie) => Number(movie.runtime) > 0 && Number(movie.runtime) < 100,
    },
    {
      id: "high-rated",
      text: "Is it highly rated?",
      weight: 6,
      test: (movie) => Number(movie.rating) >= 7.5,
    },
    {
      id: "very-popular",
      text: "Is it very popular or well-known?",
      weight: 6,
      test: (movie) => Number(movie.popularity) >= 80 || Number(movie.voteCount) >= 5000,
    }
  );

  const actorCounts = {};
  movies.forEach((movie) => {
    (movie.cast || []).slice(0, 6).forEach((actor) => {
      const name = actor.name || actor;
      if (!name) return;
      actorCounts[name] = (actorCounts[name] || 0) + 1;
    });
  });

  Object.entries(actorCounts)
    .filter(([, count]) => count >= 1)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 35)
    .forEach(([actorName]) => {
      questions.push({
        id: `actor-${actorName}`,
        text: `Does it star ${actorName}?`,
        weight: 18,
        test: (movie) => hasActor(movie, actorName),
      });
    });

  return questions;
}

function initializeMovies(movies) {
  return movies.map((movie) => ({
    ...movie,
    score: 0,
    possible: true,
  }));
}

function getQuestionScore(question, movies, askedIds) {
  if (askedIds.includes(question.id)) return -Infinity;

  const activeMovies = movies.filter((m) => m.possible);
  if (activeMovies.length <= 1) return -Infinity;

  const yesCount = activeMovies.filter(question.test).length;
  const noCount = activeMovies.length - yesCount;

  if (yesCount === 0 || noCount === 0) return -Infinity;

  const balance = Math.min(yesCount, noCount) / Math.max(yesCount, noCount);
  const usefulness = Math.min(yesCount, noCount);
  const weight = question.weight || 5;

  return balance * usefulness * weight;
}

function getBestQuestion(questions, movies, askedIds) {
  return [...questions]
    .map((q) => ({
      ...q,
      questionScore: getQuestionScore(q, movies, askedIds),
    }))
    .filter((q) => q.questionScore !== -Infinity)
    .sort((a, b) => b.questionScore - a.questionScore)[0];
}

function applyAnswer(movies, question, answer) {
  return movies.map((movie) => {
    const matches = question.test(movie);
    let scoreChange = 0;

    if (answer === "yes") {
      scoreChange = matches ? question.weight : -Math.round(question.weight * 0.6);
    }

    if (answer === "no") {
      scoreChange = matches ? -Math.round(question.weight * 0.8) : Math.round(question.weight * 0.4);
    }

    if (answer === "maybe") {
      scoreChange = matches ? Math.round(question.weight * 0.2) : 0;
    }

    const newScore = movie.score + scoreChange;

    return {
      ...movie,
      score: newScore,
      possible: newScore > -25,
    };
  });
}

function getTopMovies(movies) {
  return [...movies]
    .filter((movie) => movie.possible)
    .sort((a, b) => {
      const scoreA =
        Number(a.score || 0) +
        Number(a.rating || 0) * 2 +
        Math.log10(Number(a.voteCount || 1));

      const scoreB =
        Number(b.score || 0) +
        Number(b.rating || 0) * 2 +
        Math.log10(Number(b.voteCount || 1));

      return scoreB - scoreA;
    });
}

function shouldFinish(movies, askedCount, nextQuestion) {
  const top = getTopMovies(movies);
  const first = top[0];
  const second = top[1];

  if (!first) return true;
  if (!nextQuestion) return true;
  if (askedCount >= 40) return true;

  if (askedCount < 8) return false;

  if (!second && askedCount >= 8) return true;

  const lead = first.score - second.score;

  if (askedCount >= 12 && lead >= 22) return true;
  if (askedCount >= 18 && lead >= 14) return true;

  return false;
}

export default function MovieAkinatorPage() {
  const navigate = useNavigate();

  const [allMovies, setAllMovies] = useState([]);
  const [movies, setMovies] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [askedQuestionIds, setAskedQuestionIds] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [answerHistory, setAnswerHistory] = useState([]);
  const [finished, setFinished] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMoviePool = async () => {
      try {
        const res = await axios.get(`${BACKEND_URL}/akinator/pool`);

        const cleanedMovies = initializeMovies(
          (res.data || []).map((movie) => ({
            ...movie,
            genreIds: movie.genreIds || [],
            keywordNames: movie.keywordNames || [],
            cast: movie.cast || [],
            runtime: movie.runtime || 0,
            rating: movie.rating || 0,
            popularity: movie.popularity || 0,
            voteCount: movie.voteCount || 0,
            overview: movie.overview || "",
            tagline: movie.tagline || "",
          }))
        );

        const builtQuestions = buildQuestions(cleanedMovies);

        setAllMovies(cleanedMovies);
        setMovies(cleanedMovies);
        setQuestions(builtQuestions);
        setCurrentQuestion(getBestQuestion(builtQuestions, cleanedMovies, []));
      } catch (err) {
        console.error("Failed to load movie pool:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchMoviePool();
  }, []);

  const topResults = useMemo(() => {
    return getTopMovies(movies).slice(0, 6);
  }, [movies]);

  const activeCount = useMemo(() => {
    return movies.filter((movie) => movie.possible).length;
  }, [movies]);

  const confidence = useMemo(() => {
    const top = getTopMovies(movies);
    if (!top[0]) return 0;
    if (!top[1]) return 100;

    const gap = top[0].score - top[1].score;
    return Math.min(99, Math.max(10, Math.round(55 + gap * 2)));
  }, [movies]);

  const goToMoviePage = async (movie) => {
  try {
    let imdbId = movie.imdbID || movie.imdbId || movie.imdb_id;

    if (!imdbId && movie.tmdbID) {
      const tmdbRes = await axios.get(
        `https://api.themoviedb.org/3/movie/${movie.tmdbID}/external_ids`,
        {
          params: {
            api_key: process.env.REACT_APP_TMDB_API_KEY,
          },
        }
      );

      imdbId = tmdbRes.data?.imdb_id;
    }

    if (!imdbId) {
      console.error("No IMDB ID found for movie:", movie);
      alert("Movie page could not open because no IMDB ID was found.");
      return;
    }

    navigate(`/movies/${imdbId}`);
  } catch (err) {
    console.error("Failed to open movie page:", err);
    alert("Could not open this movie page.");
  }
};

  const handleAnswer = (answer) => {
    if (!currentQuestion) {
      setFinished(true);
      return;
    }

    const nextMovies = applyAnswer(movies, currentQuestion, answer);
    const nextAskedIds = [...askedQuestionIds, currentQuestion.id];

    const beforeCount = movies.filter((movie) => movie.possible).length;
    const afterCount = nextMovies.filter((movie) => movie.possible).length;

    setAnswerHistory((prev) => [
      ...prev,
      {
        question: currentQuestion.text,
        answer,
        beforeCount,
        afterCount,
      },
    ]);

    const nextQuestion = getBestQuestion(questions, nextMovies, nextAskedIds);

    setMovies(nextMovies);
    setAskedQuestionIds(nextAskedIds);

    if (shouldFinish(nextMovies, nextAskedIds.length, nextQuestion)) {
      setFinished(true);
      setCurrentQuestion(null);
    } else {
      setCurrentQuestion(nextQuestion);
    }
  };

  const resetGame = () => {
    const resetMovies = initializeMovies(allMovies);
    const resetQuestions = buildQuestions(resetMovies);

    setMovies(resetMovies);
    setQuestions(resetQuestions);
    setAskedQuestionIds([]);
    setAnswerHistory([]);
    setFinished(false);
    setCurrentQuestion(getBestQuestion(resetQuestions, resetMovies, []));
  };

  if (loading) {
    return (
      <div className="akinator-page">
        <p className="akinator-message">Loading movie game...</p>
      </div>
    );
  }

  return (
    <div className="akinator-page">
      <div className="akinator-card">
        <h1>Movie Akinator</h1>

        <p className="akinator-subtitle">
          Answer questions and VMDB will narrow movies like Akinator using
          weighted clues instead of deleting guesses too early.
        </p>

        {!finished && currentQuestion ? (
          <>
            <p className="akinator-progress">
              Question {askedQuestionIds.length + 1} • Possible movies:{" "}
              {activeCount}
            </p>

            <h2>{currentQuestion.text}</h2>

            <div className="akinator-buttons">
              <button onClick={() => handleAnswer("yes")}>Yes</button>
              <button onClick={() => handleAnswer("no")}>No</button>
              <button onClick={() => handleAnswer("maybe")}>Not Sure</button>
            </div>

            {topResults.length > 0 ? (
              <p className="akinator-count">
                Current best guess: {topResults[0].title}
              </p>
            ) : null}

            {answerHistory.length > 0 ? (
              <div className="akinator-history">
                <h4>Previous answers</h4>
                {answerHistory.slice(-5).map((item, index) => (
                  <p key={index}>
                    {item.answer.toUpperCase()} — {item.question}{" "}
                    <span>
                      ({item.beforeCount} → {item.afterCount})
                    </span>
                  </p>
                ))}
              </div>
            ) : null}
          </>
        ) : (
          <>
            <h2>I think it might be...</h2>
            <p className="akinator-count">Confidence: {confidence}%</p>

            <div className="akinator-results">
              {topResults.map((movie) => (
                <div
                  className="akinator-movie-card"
                  key={movie.imdbID || movie.tmdbID || movie.id}
                  onClick={() => goToMoviePage(movie)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") goToMoviePage(movie);
                  }}
                >
                  <img src={movie.poster} alt={movie.title} />

                  <div>
                    <h3>{movie.title}</h3>
                    <p>{movie.year}</p>
                    <p>Score: {movie.score}</p>
                    <p>Rating: {Number(movie.rating).toFixed(1)}</p>
                    {movie.runtime ? <p>{movie.runtime} min</p> : null}
                    {movie.cast?.length > 0 ? (
                      <p>
                        Cast:{" "}
                        {movie.cast
                          .slice(0, 2)
                          .map((a) => a.name || a)
                          .join(", ")}
                      </p>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>

            <button className="akinator-reset" onClick={resetGame}>
              Play Again
            </button>
          </>
        )}
      </div>
    </div>
  );
}