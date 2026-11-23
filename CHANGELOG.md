# Changelog

All notable changes to this project are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project
adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2026-10-11

### Added

- Tape writer and reader with SHA-256 hash chain and full-tape validation.
- Boundary interceptors for `fetch`, `Date`, `performance.now`, `Math.random`,
  `crypto.randomUUID` and `fs`.
- Virtual clock and seeded PRNG so runs are deterministic at record time.
- `record`, `replay`, `diff`, `verify`, `seal` commands.
- Hard-fail divergence with sequence and kind in the message.
- Three bundled tapes and a CI job that replays every one on push.
