# Contributing to Sockudo

Thank you for your interest in contributing to Sockudo! We welcome contributions from the community to help make Sockudo better. Whether it's reporting a bug, proposing a new feature, improving documentation, or writing code, your help is appreciated.

## How to Contribute

There are many ways to contribute:

* **Reporting Bugs**: If you find a bug, please open an issue on our [GitHub repository](https://github.com/sockudo/sockudo/issues). Include as much detail as possible:
    * Sockudo version (or commit hash).
    * Your configuration (censor secrets).
    * Steps to reproduce the bug.
    * Expected behavior and actual behavior.
    * Relevant logs (especially with debug mode enabled).
* **Suggesting Enhancements**: If you have an idea for a new feature or an improvement to an existing one, open an issue to discuss it. Provide a clear description of the feature and why it would be beneficial.
* **Improving Documentation**: If you find parts of the documentation unclear, incomplete, or incorrect, please let us know by opening an issue or, even better, submitting a pull request with your improvements.
* **Writing Code**: If you'd like to contribute code:
    1.  Look for existing issues labeled `help wanted` or `good first issue`, or discuss your proposed changes in a new issue first, especially for larger contributions.
    2.  Fork the repository on GitHub.
    3.  Create a new branch for your feature or bug fix: `git checkout -b my-feature-branch`.
    4.  Make your changes. Follow the existing code style and conventions.
    5.  Write tests for your changes if applicable.
    6.  Ensure your code compiles and all tests pass: `cargo test`.
    7.  Format your code: `cargo fmt`.
    8.  Lint your code: `cargo clippy`.
    9.  Commit your changes with clear and descriptive commit messages.
    10. Push your branch to your fork: `git push origin my-feature-branch`.
    11. Open a pull request (PR) against the `main` (or `develop` if that's the active development branch) branch of the official Sockudo repository. Provide a clear description of your PR.

## Development Setup

1.  **Prerequisites**:
    * Rust (latest stable version recommended, check project's `rust-toolchain.toml` or `Cargo.toml` for specific version).
    * Git.
    * Any services Sockudo might depend on for certain features (e.g., Redis, NATS, MySQL for testing specific adapters or app managers).
2.  **Clone the repository**:
    ```bash
    git clone [https://github.com/sockudo/sockudo.git](https://github.com/sockudo/sockudo.git)
    cd sockudo
    ```
3.  **Build**:
    ```bash
    cargo build
    ```
4.  **Run tests**:
    ```bash
    cargo test
    ```
5.  **Run linters/formatters**:
    ```bash
    cargo fmt
    cargo clippy --all-targets --all-features -- -D warnings # Be strict
    ```

## Code Style and Conventions

* Follow the official [Rust API Guidelines](https://rust-lang.github.io/api-guidelines/) where applicable.
* Use `rustfmt` for code formatting (run `cargo fmt` before committing).
* Use `clippy` for linting (run `cargo clippy`). Address clippy warnings.
* Write clear, readable, and well-commented code, especially for public APIs and complex logic.
* Aim for idiomatic Rust.

## Testing

* Add unit tests for new functionality and bug fixes.
* If possible, add integration tests that cover interactions between different components.
* Ensure all existing tests pass before submitting a PR.

## Pull Request Process

1.  Ensure your PR addresses an existing issue or has been discussed.
2.  Provide a clear title and description for your PR, explaining the "what" and "why" of your changes. Link to any relevant issues.
3.  Keep PRs focused. If you have multiple unrelated changes, submit them as separate PRs.
4.  Be prepared to discuss your changes and make adjustments based on feedback from maintainers.
5.  Once your PR is approved and passes CI checks, a maintainer will merge it.

## Code of Conduct

While Sockudo may not have a formal Code of Conduct document linked yet, please adhere to general open-source community standards:
* Be respectful and considerate of others.
* Engage in constructive discussions.
* Harassment or offensive behavior will not be tolerated.
We aim to create a welcoming and inclusive environment for all contributors.

## Licensing

By contributing to Sockudo, you agree that your contributions will be licensed under the project's license (MIT, as per the `README.md`).

We look forward to your contributions!
