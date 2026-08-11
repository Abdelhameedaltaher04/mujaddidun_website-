---
name: Lenient list-filter validation
description: Admin list endpoints must tolerate mid-typing filter values from native date inputs
---

Rule: for admin list endpoints, treat malformed/partial `date_from`/`date_to` values (and inverted ranges) as "no filter" or "empty result" — never return 422.

**Why:** The admin UI's native date inputs fire requests on every change; partial years and out-of-order picks produced 422 console/network errors during Donations testing (Aug 2026). Strict `date_format` + `after_or_equal` rules failed UI verification twice.

**How to apply:** validate dates as loose strings in the FormRequest, and in the controller only apply the filter when the value round-trips `Y-m-d` exactly (see DonationController::parseDate). Enum filters may stay strict.
