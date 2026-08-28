# sky-warp.github.io

https://sky-warp.github.io/

## Post translations

Russian articles remain in `_posts` and are the canonical entries used by the home page, pagination, search, archives, and feed. Every Russian post must declare its language and a stable pairing key:

```yaml
---
title: Unit-тесты. Тестирование в Unity
lang: ru-RU
translation_key: unity-unit-testing
---
```

Put an English version in `_translations`. The filename becomes its URL slug, while `translation_key` connects it to the Russian article:

```yaml
---
title: Unit Testing in Unity
date: 2026-08-27
lang: en
translation_key: unity-unit-testing
---

English Markdown content starts here.
```

This example would be saved as `_translations/unit-testing-in-unity.md` and published at `/posts/unit-testing-in-unity/`. Keep each `translation_key` unique per article and use exactly the same key for its translations. The home-page switch automatically uses the first 200 characters of the translation as its summary unless the translation defines a `description`.

Run `bash tools/test.sh` before publishing to build the site and check its generated HTML.
