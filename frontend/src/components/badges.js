const badgeDefinitions = [
  // WATCHED
  {
    id: "movie_newbie",
    label: "🎬 Movie Newbie",
    desc: "Watch your first movie",
    goal: 1,
    progress: (stats) => stats.watched,
  },
  {
    id: "film_enthusiast",
    label: "🍿 Film Enthusiast",
    desc: "Watch 10 movies",
    goal: 10,
    progress: (stats) => stats.watched,
  },
  {
    id: "movie_marathoner",
    label: "🎞️ Movie Marathoner",
    desc: "Watch 50 movies",
    goal: 50,
    progress: (stats) => stats.watched,
  },

  // FAVORITES
  {
    id: "favorite_collector",
    label: "💖 Favorite Collector",
    desc: "Add 5 favorites",
    goal: 5,
    progress: (stats) => stats.favorites,
  },
  {
    id: "curator",
    label: "💗 Curator",
    desc: "Add 15 favorites",
    goal: 15,
    progress: (stats) => stats.favorites,
  },

  // REVIEWS
  {
    id: "first_reviewer",
    label: "✏️ First Reviewer",
    desc: "Write your first review",
    goal: 1,
    progress: (stats) => stats.totalReviews,
  },
  {
    id: "critic_in_training",
    label: "📝 Critic in Training",
    desc: "Write 5 reviews",
    goal: 5,
    progress: (stats) => stats.totalReviews,
  },

  // RATINGS
  {
    id: "rater",
    label: "⭐ Rater",
    desc: "Rate 5 movies",
    goal: 5,
    progress: (stats) => stats.rated,
  },
  {
    id: "rating_machine",
    label: "💫 Rating Machine",
    desc: "Rate 20 movies",
    goal: 20,
    progress: (stats) => stats.rated,
  },
];

export default badgeDefinitions;
