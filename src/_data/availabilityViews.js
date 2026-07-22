const languages = require("./languages.json");

// The availability calendar ships in two builds from the same JSON:
//
//   clean   /es/availability/     only real bookings
//   padded  /es/a/availability/   real bookings plus the days flagged "fake"
//
// Splitting at build time (instead of toggling in the browser) keeps the
// "fake" flags out of the clean page's HTML entirely, so viewing source on
// either URL tells you nothing about the other.
const VARIANTS = [
  { key: "clean", segment: "", padded: false },
  { key: "padded", segment: "/a", padded: true }
];

module.exports = languages.list.flatMap((lang) =>
  VARIANTS.map((variant) => ({
    ...variant,
    lang,
    permalink: `${lang.prefix}${variant.segment}/availability/`
  }))
);
