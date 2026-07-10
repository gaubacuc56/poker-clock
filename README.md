## Branding config

Two files in `config/` control this deployment's branding on the projector screen:

- `config/winwise.json` — brand-specific config for this client. `logo` is a path to the club's logo image (e.g. `/my-logo.png`, placed under `public/`). Leave it `""` to show no logo at all — there is no default/placeholder logo.
- `config/base.json` — generic app config shared by any deployment, not specific to this client. `backgrounds` is the list of bundled background images the Setup wizard's "Projector background" picker offers (`{ id, label, path }`). These are fixed image files shipped with the app under `public/backgrounds/`, never user-uploaded; add a new option by dropping an image in that folder and adding an entry here.

A tournament's chosen background is stored as `projectorBackgroundId` (just the `id`, not the file) — swapping the image file behind an existing `id` in `base.json` updates every tournament using it, with no per-tournament migration needed.

---

# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the Oxlint configuration

If you are developing a production application, we recommend enabling type-aware lint rules by installing `oxlint-tsgolint` and editing `.oxlintrc.json`:

```json
{
  "$schema": "./node_modules/oxlint/configuration_schema.json",
  "plugins": ["react", "typescript", "oxc"],
  "options": {
    "typeAware": true
  },
  "rules": {
    "react/rules-of-hooks": "error",
    "react/only-export-components": ["warn", { "allowConstantExport": true }]
  }
}
```

See the [Oxlint rules documentation](https://oxc.rs/docs/guide/usage/linter/rules) for the full list of rules and categories.
