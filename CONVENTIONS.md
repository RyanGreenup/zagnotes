When writing code, you MUST follow these principles:
- Code should be easy to read and understand.
- Code must be performant, Use `<Show` to avoid DOM bloat and favour faster algorithms when possible
- The class attribute should be set to a static string or nothing, use `classlist` with a dictionary when passing variable classes.
- Keep the code as simple as possible. Avoid unnecessary complexity.
- Implement docstrings wherever possible
- Use meaningful names for variables, functions, etc. Names should reveal intent.
- Always type variables as much as possible. Try to avoid `any` unless it simplifies the code (e.g. recursive trees may be simpler with `any`, favour readable code when in doubt)
- Functions and components should be small, modular and do one thing well.
- If code needs to be commented, consider adapting the code to be self-explanatory, to render the comment not-necessary. Favour docstrings over comments. Finally, include comments to explain what's happening if not covered by these earlier points.
- When comments are used, they should add useful information that is not readily apparent from the code itself, otherwise omit the comments.
- Properly handle errors and exceptions to ensure the software's robustness.
- Keep code in small individual files
- Keep code in small modular jsx functions
- Keep the code loosely connected to enable quick refactoring
- Embrace Solid JS's reactivity model effectively. Use signals, stores, and computations to manage state.
- Utilize Tailwind CSS for styling, maximizing its utility-first CSS classes to keep styles declarative and componentized.
- Use DaisyUI for CSS design but favour Typescript and Solid JS for anything that would promote accessibility or performance
    - e.g. a Drawer might be fine in CSS, however, pagination will be clearer, simpler and faster in SolidJS



