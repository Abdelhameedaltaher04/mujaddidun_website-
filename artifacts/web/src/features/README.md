# features/

Feature-based modules. Each feature is a self-contained folder:

```
features/
  <feature-name>/
    components/   # UI specific to this feature
    hooks/        # hooks specific to this feature
    services/     # data access specific to this feature
    types.ts      # feature-local types
    index.ts      # public API of the feature (only import from here)
```

Rules:

- Features may import from `@/components`, `@/hooks`, `@/lib`, `@/utils`, `@/types`.
- Features must NOT import from other features directly — promote shared code to `@/components` or `@/lib` instead.
